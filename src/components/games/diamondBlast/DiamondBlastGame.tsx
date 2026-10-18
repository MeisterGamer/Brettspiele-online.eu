import { CAMPAIGN_TIERS, levelUnlocked } from '../../../services/campaign';
import { useGameTimers } from '../useGameTimers';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  BoardGrid, 
  Gem, 
  GemColor, 
  GemSpecial, 
  GameMode, 
  LevelConfig, 
  GameStats, 
  Settings, 
  UserProgress, 
  ObstacleType 
} from './types';
import { 
  BOARD_SIZE, 
  GEM_COLORS, 
  createInitialBoard, 
  isValidSwap, 
  findMatches, 
  shuffleBoard, 
  hasValidMoves, 
  findHintMove, 
  cloneBoard, 
  createGem,
  isAdjacent 
} from './matchEngine';
import { getLevelConfig } from './levelGenerator';
import { GemRenderer } from './gemRenderer';
import { ParticleSystem } from './particleSystem';
import { diamondAudio } from './diamondAudio';
import { 
  Play, 
  RotateCcw, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings as SettingsIcon, 
  HelpCircle, 
  Trophy, 
  Sparkles, 
  Flame, 
  Star, 
  ChevronRight, 
  ArrowLeft, 
  Lightbulb,
  Award,
  Zap,
  Clock,
  Shield,
  Layers
} from 'lucide-react';
import confetti from '../../../services/confetti';

interface DiamondBlastGameProps {
  onGameEnd?: (score: number, starsEarned: number) => void;
  tableParticipants?: { id: string; name: string }[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

const STORAGE_KEY = 'diamond_blast_campaign_50_v1';

const DEFAULT_SETTINGS: Settings = {
  soundVolume: 75,
  musicVolume: 40,
  screenShake: true,
  particleDensity: 'medium'
};

const DEFAULT_PROGRESS: UserProgress = {
  unlockedLevel: 1,
  levelStars: {},
  levelScores: {},
  classicHighScore: 0,
  timeHighScore: 0
};

export const DiamondBlastGame: React.FC<DiamondBlastGameProps> = ({ onGameEnd }) => {
  const { schedule, repeat, cancelAll } = useGameTimers();
  // --- Persistent Storage State ---
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_PROGRESS, ...JSON.parse(saved) };
      // Keep existing endless-mode records; the redesigned campaign starts separately.
      const legacy=JSON.parse(localStorage.getItem('diamond_blast_save_v2')||'null');
      if(legacy)return {...DEFAULT_PROGRESS,classicHighScore:Number(legacy.classicHighScore)||0,timeHighScore:Number(legacy.timeHighScore)||0};
    } catch {
      // fallback
    }
    return DEFAULT_PROGRESS;
  });

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Save progress changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore
    }
  }, [progress]);

  // Apply audio volumes
  useEffect(() => {
    diamondAudio.setVolumes(settings.soundVolume, settings.musicVolume);
  }, [settings.soundVolume, settings.musicVolume]);

  // --- Game Flow State ---
  const [gameMode, setGameMode] = useState<GameMode>('levels');
  const [currentLevelNum, setCurrentLevelNum] = useState<number>(1);
  const [levelConfig, setLevelConfig] = useState<LevelConfig>(() => getLevelConfig(1));

  // Screens: 'menu' | 'levels' | 'playing' | 'paused' | 'level-won' | 'game-over' | 'settings' | 'how-to-play'
  const [screen, setScreen] = useState<'menu' | 'levels' | 'playing' | 'paused' | 'level-won' | 'game-over' | 'settings' | 'how-to-play'>('menu');

  // Board & Gameplay State
  const [board, setBoard] = useState<BoardGrid>(() => createInitialBoard(levelConfig));
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [hintPos, setHintPos] = useState<{ from: [number, number]; to: [number, number] } | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [shuffleNotice, setShuffleNotice] = useState<boolean>(false);
  const [screenShakeActive, setScreenShakeActive] = useState<boolean>(false);

  // Stats
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    movesLeft: 30,
    timeLeft: 120,
    comboCount: 0,
    maxCombo: 0,
    matchesCount: 0,
    specialGemsCreated: 0,
    bombsDetonated: 0,
    level: 1
  });

  // Level Level Goals progress
  const [activeGoals, setActiveGoals] = useState(levelConfig.goals);

  // Canvas Particle System
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleEngineRef = useRef<ParticleSystem | null>(null);
  const boardContainerRef = useRef<HTMLDivElement | null>(null);

  // Drag / Swipe handling
  const touchStartPos = useRef<{ r: number; c: number; x: number; y: number } | null>(null);

  // Idle timer for automatic hints
  const lastInteractionTime = useRef<number>(Date.now());

  // Initialize Particle Engine
  useEffect(() => {
    if (canvasRef.current) {
      const pe = new ParticleSystem();
      pe.init(canvasRef.current);
      pe.setDensity(settings.particleDensity);
      particleEngineRef.current = pe;
    }
    return () => {
      particleEngineRef.current?.destroy();
      particleEngineRef.current = null;
    };
  }, [settings.particleDensity]);

  // Adjust canvas size to match board
  const updateCanvasSize = useCallback(() => {
    if (boardContainerRef.current && canvasRef.current) {
      const rect = boardContainerRef.current.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize, screen]);

  // Background Music loop controller
  useEffect(() => {
    if (screen === 'playing') {
      diamondAudio.startBackgroundMusic();
    } else {
      diamondAudio.stopBackgroundMusic();
    }
    return () => diamondAudio.stopBackgroundMusic();
  }, [screen]);

  // --- Screen Shake trigger ---
  const triggerScreenShake = useCallback(() => {
    if (!settings.screenShake) return;
    setScreenShakeActive(true);
    schedule(() => setScreenShakeActive(false), 380);
  }, [settings.screenShake]);

  // --- Helper: Get cell pixel position on board ---
  const getCellPixelCoords = (r: number, c: number): { x: number; y: number } => {
    if (!boardContainerRef.current) return { x: 0, y: 0 };
    const cellSize = boardContainerRef.current.clientWidth / BOARD_SIZE;
    return {
      x: c * cellSize + cellSize / 2,
      y: r * cellSize + cellSize / 2
    };
  };

  // --- Hint Timer Check ---
  useEffect(() => {
    if (screen !== 'playing' || isAnimating) return;

    const interval = repeat(() => {
      if (Date.now() - lastInteractionTime.current > 7000 && !hintPos) {
        const hint = findHintMove(board);
        if (hint) {
          setHintPos(hint);
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [screen, isAnimating, board, hintPos]);

  // --- Time Mode Countdown Timer ---
  useEffect(() => {
    if (screen !== 'playing' || gameMode !== 'time') return;

    const timer = repeat(() => {
      setStats((prev) => {
        if (prev.timeLeft <= 1) {
          clearInterval(timer);
          handleGameOver();
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, gameMode]);

  // --- Start Game / Level ---
  const startLevel = (lvlNum: number, mode: GameMode = 'levels') => {
    const config = getLevelConfig(lvlNum);
    setLevelConfig(config);
    setCurrentLevelNum(lvlNum);
    setGameMode(mode);
    setActiveGoals(config.goals.map((g) => ({ ...g, current: 0 })));

    const newBoard = createInitialBoard(config);
    setBoard(newBoard);
    setSelectedPos(null);
    setHintPos(null);
    setIsAnimating(false);
    lastInteractionTime.current = Date.now();

    setStats({
      score: 0,
      movesLeft: mode === 'classic' ? 999 : config.maxMoves,
      timeLeft: 120,
      comboCount: 0,
      maxCombo: 0,
      matchesCount: 0,
      specialGemsCreated: 0,
      bombsDetonated: 0,
      level: lvlNum
    });

    setScreen('playing');
    schedule(updateCanvasSize, 100);
  };

  // --- Trigger Hint manually ---
  const handleRequestHint = () => {
    if (isAnimating || screen !== 'playing') return;
    const hint = findHintMove(board);
    if (hint) {
      setHintPos(hint);
      diamondAudio.playSwap();
    }
  };

  // --- Process Cascades, Gravity & Chain Reactions ---
  const processBoardCascades = async (currentBoard: BoardGrid, currentCombo: number = 1): Promise<void> => {
    setIsAnimating(true);
    let workingBoard = cloneBoard(currentBoard);

    // 1. Detect matches on the current board
    const { matches, matchedIndices } = findMatches(workingBoard);

    if (matches.length === 0) {
      // Board has settled!
      // Check if board has valid moves left
      if (!hasValidMoves(workingBoard)) {
        setShuffleNotice(true);
        diamondAudio.playShuffle();
        await new Promise((r) => schedule(r, 800));
        workingBoard = shuffleBoard(workingBoard);
        setBoard(workingBoard);
        setShuffleNotice(false);
      }

      setBoard(workingBoard);
      setIsAnimating(false);

      // Check win or loss conditions for level mode
      // Victory is checked by an effect after score and goals have committed.
      return;
    }

    // Play chime sound matching combo
    diamondAudio.playMatch(currentCombo);

    // Track score & goals
    let pointsEarned = 0;
    const gemsDestroyedByColor: Record<GemColor, number> = {
      red: 0,
      blue: 0,
      green: 0,
      yellow: 0,
      purple: 0,
      orange: 0
    };

    // Obstacles to damage/clear
    const damagedIce: [number, number][] = [];
    const damagedRocks: [number, number][] = [];
    const damagedChains: [number, number][] = [];

    // Special items created
    const createdSpecials: { r: number; c: number; gem: Gem }[] = [];

    matches.forEach((group) => {
      // Base points: 100 per gem * combo multiplier
      const groupScore = group.gems.length * 100 * Math.max(1, currentCombo);
      pointsEarned += groupScore;

      // Color tally
      group.gems.forEach((pt) => {
        gemsDestroyedByColor[group.color]++;
        const cell = workingBoard[pt.r][pt.c];
        if (cell?.obstacle === 'chain') {
          damagedChains.push([pt.r, pt.c]);
        }
      });

      // Special creations
      if (group.createsSpecial) {
        const { r, c, special, color } = group.createsSpecial;
        const newSpecialGem = createGem(color, special);
        createdSpecials.push({ r, c, gem: newSpecialGem });
        if (special === 'bomb') diamondAudio.playSwap();
      }

      // Check for adjacent Ice & Rocks
      group.gems.forEach(({ r, c }) => {
        const neighbors = [
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1]
        ];
        neighbors.forEach(([nr, nc]) => {
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            const neighborGem = workingBoard[nr][nc];
            if (neighborGem?.obstacle === 'ice') damagedIce.push([nr, nc]);
            if (neighborGem?.obstacle === 'rock') damagedRocks.push([nr, nc]);
          }
        });
      });

      // Floating text score over group center
      if (group.gems.length > 0) {
        const midGem = group.gems[Math.floor(group.gems.length / 2)];
        const coords = getCellPixelCoords(midGem.r, midGem.c);
        const text = currentCombo > 1 ? `+${groupScore} (x${currentCombo})` : `+${groupScore}`;
        particleEngineRef.current?.addFloatingText(coords.x, coords.y, text, '#facc15');
      }
    });

    // Particle Bursts for matched gems
    matchedIndices.forEach((coordStr) => {
      const [r, c] = coordStr.split(',').map(Number);
      const coords = getCellPixelCoords(r, c);
      const gem = workingBoard[r][c];
      if (gem) {
        const colorHexMap: Record<GemColor, string> = {
          red: '#e11d48',
          blue: '#0284c7',
          green: '#16a34a',
          yellow: '#eab308',
          purple: '#9333ea',
          orange: '#ea580c'
        };
        particleEngineRef.current?.emitGemsBurst(coords.x, coords.y, colorHexMap[gem.color] || '#38bdf8', 12);
      }
    });

    // Time bonus in Time Mode
    if (gameMode === 'time') {
      const bonusSeconds = matches.length * 2 + (currentCombo > 1 ? 2 : 0);
      setStats((prev) => ({ ...prev, timeLeft: Math.min(180, prev.timeLeft + bonusSeconds) }));
    }

    // Update active goals with destroyed items
    setActiveGoals((prevGoals) =>
      prevGoals.map((g) => {
        if (g.type === 'score') {
          return { ...g, current: g.current + pointsEarned };
        }
        if (g.type === 'collect-color' && g.color) {
          return { ...g, current: Math.min(g.target, g.current + (gemsDestroyedByColor[g.color] || 0)) };
        }
        if (g.type === 'clear-ice') {
          return { ...g, current: Math.min(g.target, g.current + damagedIce.length) };
        }
        if (g.type === 'destroy-rocks') {
          const broken = damagedRocks.filter(([rr, cc]) => (workingBoard[rr][cc]?.obstacleHealth || 0) <= 1).length;
          return { ...g, current: Math.min(g.target, g.current + broken) };
        }
        if (g.type === 'unlock-chains') {
          return { ...g, current: Math.min(g.target, g.current + damagedChains.length) };
        }
        return g;
      })
    );

    // Apply obstacle damage
    damagedIce.forEach(([ir, ic]) => {
      if (workingBoard[ir][ic]) workingBoard[ir][ic]!.obstacle = 'none';
      diamondAudio.playCrack();
    });
    damagedChains.forEach(([cr, cc]) => {
      if (workingBoard[cr][cc]) workingBoard[cr][cc]!.obstacle = 'none';
      diamondAudio.playCrack();
    });
    damagedRocks.forEach(([rr, rc]) => {
      if (workingBoard[rr][rc]) {
        workingBoard[rr][rc]!.obstacleHealth -= 1;
        if (workingBoard[rr][rc]!.obstacleHealth <= 0) {
          workingBoard[rr][rc]!.obstacle = 'none';
          const coords = getCellPixelCoords(rr, rc);
          particleEngineRef.current?.emitBombExplosion(coords.x, coords.y);
          diamondAudio.playCrack();
        }
      }
    });

    // Remove matched gems (set to null)
    matchedIndices.forEach((coordStr) => {
      const [r, c] = coordStr.split(',').map(Number);
      workingBoard[r][c] = null;
    });

    // Place newly generated special gems into their spots
    createdSpecials.forEach(({ r, c, gem }) => {
      workingBoard[r][c] = gem;
    });

    setStats((prev) => ({
      ...prev,
      score: prev.score + pointsEarned,
      comboCount: currentCombo,
      maxCombo: Math.max(prev.maxCombo, currentCombo),
      matchesCount: prev.matchesCount + matches.length,
      specialGemsCreated: prev.specialGemsCreated + createdSpecials.length
    }));

    setBoard(workingBoard);

    // Wait for pop animation
    await new Promise((resolve) => schedule(resolve, 220));

    // 2. Gravity Drop: Gems fall down in columns
    for (let c = 0; c < BOARD_SIZE; c++) {
      let writeRow = BOARD_SIZE - 1;
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        if (workingBoard[r][c] !== null) {
          if (writeRow !== r) {
            workingBoard[writeRow][c] = workingBoard[r][c];
            workingBoard[r][c] = null;
          }
          writeRow--;
        }
      }
      // Fill empty spaces from top with new random gems
      for (let r = writeRow; r >= 0; r--) {
        workingBoard[r][c] = createGem();
      }
    }

    setBoard(workingBoard);

    // Wait for fall animation
    await new Promise((resolve) => schedule(resolve, 200));

    // 3. Recursive cascade step
    await processBoardCascades(workingBoard, currentCombo + 1);
  };

  // --- Special Swaps Execution (Rainbows, Bombs, Laser Lines) ---
  const executeSpecialSwap = async (
    r1: number,
    c1: number,
    r2: number,
    c2: number,
    gem1: Gem,
    gem2: Gem
  ) => {
    setIsAnimating(true);
    const workingBoard = cloneBoard(board);
    workingBoard[r1][c1] = null;
    workingBoard[r2][c2] = null;

    // COMBO 1: RAINBOW + RAINBOW -> Wipe out entire board!
    if (gem1.special === 'rainbow' && gem2.special === 'rainbow') {
      diamondAudio.playRainbow();
      triggerScreenShake();
      confetti();

      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const coords = getCellPixelCoords(r, c);
          particleEngineRef.current?.emitRainbowBurst(coords.x, coords.y);
          workingBoard[r][c] = null;
        }
      }

      const totalBonus = 8000;
      particleEngineRef.current?.addFloatingText(180, 180, 'MEGA WIPEOUT! +8000', '#f43f5e');
      setStats((prev) => ({ ...prev, score: prev.score + totalBonus }));
      setBoard(workingBoard);
      await new Promise((r) => schedule(r, 600));

      // Refill all columns
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          workingBoard[r][c] = createGem();
        }
      }
      setBoard(workingBoard);
      await new Promise((r) => schedule(r, 300));
      await processBoardCascades(workingBoard, 1);
      return;
    }

    // COMBO 2: RAINBOW + COLOR -> Wipe out all diamonds of that color
    if (gem1.special === 'rainbow' || gem2.special === 'rainbow') {
      const targetColor = gem1.special === 'rainbow' ? gem2.color : gem1.color;
      diamondAudio.playRainbow();

      const clearedCoords: [number, number][] = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (workingBoard[r][c]?.color === targetColor) {
            clearedCoords.push([r, c]);
            workingBoard[r][c] = null;
            const coords = getCellPixelCoords(r, c);
            particleEngineRef.current?.emitRainbowBurst(coords.x, coords.y);
          }
        }
      }

      const scoreGain = clearedCoords.length * 200;
      setStats((prev) => ({ ...prev, score: prev.score + scoreGain }));
      setBoard(workingBoard);
      await new Promise((r) => schedule(r, 350));

      // Gravity fall
      for (let c = 0; c < BOARD_SIZE; c++) {
        let writeRow = BOARD_SIZE - 1;
        for (let r = BOARD_SIZE - 1; r >= 0; r--) {
          if (workingBoard[r][c] !== null) {
            if (writeRow !== r) {
              workingBoard[writeRow][c] = workingBoard[r][c];
              workingBoard[r][c] = null;
            }
            writeRow--;
          }
        }
        for (let r = writeRow; r >= 0; r--) {
          workingBoard[r][c] = createGem();
        }
      }
      setBoard(workingBoard);
      await new Promise((r) => schedule(r, 220));
      await processBoardCascades(workingBoard, 1);
      return;
    }

    // COMBO 3: BOMB + BOMB -> 5x5 Mega-Explosion!
    if (gem1.special === 'bomb' && gem2.special === 'bomb') {
      diamondAudio.playExplosion();
      triggerScreenShake();
      const midR = Math.round((r1 + r2) / 2);
      const midC = Math.round((c1 + c2) / 2);
      const centerCoords = getCellPixelCoords(midR, midC);
      particleEngineRef.current?.emitBombExplosion(centerCoords.x, centerCoords.y);

      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = midR + dr;
          const nc = midC + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            workingBoard[nr][nc] = null;
          }
        }
      }

      setStats((prev) => ({ ...prev, score: prev.score + 3500 }));
      setBoard(workingBoard);
      await new Promise((r) => schedule(r, 350));

      // Gravity fall
      for (let c = 0; c < BOARD_SIZE; c++) {
        let writeRow = BOARD_SIZE - 1;
        for (let r = BOARD_SIZE - 1; r >= 0; r--) {
          if (workingBoard[r][c] !== null) {
            if (writeRow !== r) {
              workingBoard[writeRow][c] = workingBoard[r][c];
              workingBoard[r][c] = null;
            }
            writeRow--;
          }
        }
        for (let r = writeRow; r >= 0; r--) {
          workingBoard[r][c] = createGem();
        }
      }
      setBoard(workingBoard);
      await new Promise((r) => schedule(r, 220));
      await processBoardCascades(workingBoard, 1);
      return;
    }

    // COMBO 4: LINE + LINE -> Cross Laser (Clears full row AND full column)
    if (
      (gem1.special === 'line-h' || gem1.special === 'line-v') &&
      (gem2.special === 'line-h' || gem2.special === 'line-v')
    ) {
      diamondAudio.playLaser();
      triggerScreenShake();
      const crossR = r2;
      const crossC = c2;

      // Clear Row
      for (let c = 0; c < BOARD_SIZE; c++) workingBoard[crossR][c] = null;
      // Clear Col
      for (let r = 0; r < BOARD_SIZE; r++) workingBoard[r][crossC] = null;

      const pCenter = getCellPixelCoords(crossR, crossC);
      particleEngineRef.current?.emitLaserLine(0, pCenter.y, 400, pCenter.y, true);
      particleEngineRef.current?.emitLaserLine(pCenter.x, 0, pCenter.x, 400, false);

      setStats((prev) => ({ ...prev, score: prev.score + 2200 }));
      setBoard(workingBoard);
      await new Promise((r) => schedule(r, 300));

      // Gravity fall
      for (let c = 0; c < BOARD_SIZE; c++) {
        let writeRow = BOARD_SIZE - 1;
        for (let r = BOARD_SIZE - 1; r >= 0; r--) {
          if (workingBoard[r][c] !== null) {
            if (writeRow !== r) {
              workingBoard[writeRow][c] = workingBoard[r][c];
              workingBoard[r][c] = null;
            }
            writeRow--;
          }
        }
        for (let r = writeRow; r >= 0; r--) {
          workingBoard[r][c] = createGem();
        }
      }
      setBoard(workingBoard);
      await new Promise((r) => schedule(r, 220));
      await processBoardCascades(workingBoard, 1);
      return;
    }

    // Single Bomb match
    if (gem1.special === 'bomb' || gem2.special === 'bomb') {
      diamondAudio.playExplosion();
      triggerScreenShake();
      const br = gem1.special === 'bomb' ? r1 : r2;
      const bc = gem1.special === 'bomb' ? c1 : c2;
      const bCoords = getCellPixelCoords(br, bc);
      particleEngineRef.current?.emitBombExplosion(bCoords.x, bCoords.y);

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = br + dr;
          const nc = bc + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            workingBoard[nr][nc] = null;
          }
        }
      }

      setStats((prev) => ({ ...prev, score: prev.score + 1000 }));
      setBoard(workingBoard);
      await new Promise((r) => schedule(r, 300));

      // Gravity fall
      for (let c = 0; c < BOARD_SIZE; c++) {
        let writeRow = BOARD_SIZE - 1;
        for (let r = BOARD_SIZE - 1; r >= 0; r--) {
          if (workingBoard[r][c] !== null) {
            if (writeRow !== r) {
              workingBoard[writeRow][c] = workingBoard[r][c];
              workingBoard[r][c] = null;
            }
            writeRow--;
          }
        }
        for (let r = writeRow; r >= 0; r--) {
          workingBoard[r][c] = createGem();
        }
      }
      setBoard(workingBoard);
      await new Promise((r) => schedule(r, 220));
      await processBoardCascades(workingBoard, 1);
      return;
    }

    // Single Line Laser match
    if (
      gem1.special === 'line-h' ||
      gem1.special === 'line-v' ||
      gem2.special === 'line-h' ||
      gem2.special === 'line-v'
    ) {
      diamondAudio.playLaser();
      const specialGem = gem1.special !== 'none' ? gem1 : gem2;
      const sr = gem1.special !== 'none' ? r1 : r2;
      const sc = gem1.special !== 'none' ? c1 : c2;
      const pCenter = getCellPixelCoords(sr, sc);

      if (specialGem.special === 'line-h') {
        for (let c = 0; c < BOARD_SIZE; c++) workingBoard[sr][c] = null;
        particleEngineRef.current?.emitLaserLine(0, pCenter.y, 400, pCenter.y, true);
      } else {
        for (let r = 0; r < BOARD_SIZE; r++) workingBoard[r][sc] = null;
        particleEngineRef.current?.emitLaserLine(pCenter.x, 0, pCenter.x, 400, false);
      }

      setStats((prev) => ({ ...prev, score: prev.score + 800 }));
      setBoard(workingBoard);
      await new Promise((r) => schedule(r, 300));

      // Gravity fall
      for (let c = 0; c < BOARD_SIZE; c++) {
        let writeRow = BOARD_SIZE - 1;
        for (let r = BOARD_SIZE - 1; r >= 0; r--) {
          if (workingBoard[r][c] !== null) {
            if (writeRow !== r) {
              workingBoard[writeRow][c] = workingBoard[r][c];
              workingBoard[r][c] = null;
            }
            writeRow--;
          }
        }
        for (let r = writeRow; r >= 0; r--) {
          workingBoard[r][c] = createGem();
        }
      }
      setBoard(workingBoard);
      await new Promise((r) => schedule(r, 220));
      await processBoardCascades(workingBoard, 1);
    }
  };

  // --- Handle Swapping Two Gems ---
  const handleSwapGems = async (r1: number, c1: number, r2: number, c2: number) => {
    if (isAnimating) return;
    lastInteractionTime.current = Date.now();
    setHintPos(null);

    const gem1 = board[r1][c1];
    const gem2 = board[r2][c2];
    if (!gem1 || !gem2) return;

    // Check if swap is special (Bomb, Rainbow, Line combinations)
    const isSpecialSwap = 
      gem1.special === 'rainbow' || 
      gem2.special === 'rainbow' ||
      (gem1.special !== 'none' && gem2.special !== 'none');

    if (isSpecialSwap) {
      // Deduct move
      setStats((prev) => ({
        ...prev,
        movesLeft: Math.max(0, prev.movesLeft - 1)
      }));
      await executeSpecialSwap(r1, c1, r2, c2, gem1, gem2);
      return;
    }

    // Standard swap check
    const valid = isValidSwap(r1, c1, r2, c2, board);

    if (!valid) {
      // Invalid swap: animate swap and swap back
      diamondAudio.playInvalid();
      setIsAnimating(true);

      const swappedBoard = cloneBoard(board);
      swappedBoard[r1][c1] = gem2;
      swappedBoard[r2][c2] = gem1;
      setBoard(swappedBoard);

      await new Promise((r) => schedule(r, 180));
      setBoard(board);
      setIsAnimating(false);
      return;
    }

    // Valid swap: execute move
    diamondAudio.playSwap();
    setIsAnimating(true);

    const workingBoard = cloneBoard(board);
    workingBoard[r1][c1] = gem2;
    workingBoard[r2][c2] = gem1;
    setBoard(workingBoard);

    // Deduct move
    setStats((prev) => ({
      ...prev,
      movesLeft: Math.max(0, prev.movesLeft - 1)
    }));

    await new Promise((r) => schedule(r, 180));
    await processBoardCascades(workingBoard, 1);
  };

  // --- Check Win / Game Over State ---
  const checkLevelState = (currentBoard: BoardGrid) => {
    if (gameMode === 'levels') {
      // Check if all goals are completed
      const allCompleted = activeGoals.every((g) => {
        if (g.type === 'score') return stats.score >= g.target;
        return g.current >= g.target;
      });

      if (allCompleted) {
        handleLevelVictory();
        return;
      }

      // Check if out of moves
      if (stats.movesLeft <= 0) {
        handleGameOver();
      }
    } else if (gameMode === 'classic') {
      // Classic Mode: Level Up every 5,000 points
      const nextLevelThreshold = stats.level * 5000;
      if (stats.score >= nextLevelThreshold) {
        setStats((prev) => ({ ...prev, level: prev.level + 1 }));
        diamondAudio.playVictory();
        confetti();
        particleEngineRef.current?.addFloatingText(180, 180, `LEVEL ${stats.level + 1}!`, '#facc15');
      }
    }
  };

  // --- Level Victory Celebration ---
  const handleLevelVictory = () => {
    diamondAudio.playVictory();
    confetti();

    // Calculate stars: 1, 2, or 3
    let stars = 1;
    if (stats.score >= levelConfig.starScores[2]) stars = 3;
    else if (stats.score >= levelConfig.starScores[1]) stars = 2;

    // Update Progress
    setProgress((prev) => {
      const nextUnlocked = Math.max(prev.unlockedLevel, Math.min(50, currentLevelNum + 1));
      const oldStars = prev.levelStars[currentLevelNum] || 0;
      const oldScore = prev.levelScores[currentLevelNum] || 0;

      return {
        ...prev,
        unlockedLevel: nextUnlocked,
        levelStars: {
          ...prev.levelStars,
          [currentLevelNum]: Math.max(oldStars, stars)
        },
        levelScores: {
          ...prev.levelScores,
          [currentLevelNum]: Math.max(oldScore, stats.score)
        }
      };
    });

    onGameEnd?.(stats.score, stars);
    setScreen('level-won');
  };

  // --- Game Over Screen ---
  const handleGameOver = () => {
    diamondAudio.playInvalid();

    // Update Highscores
    setProgress((prev) => {
      let classicHigh = prev.classicHighScore;
      let timeHigh = prev.timeHighScore;

      if (gameMode === 'classic' && stats.score > classicHigh) classicHigh = stats.score;
      if (gameMode === 'time' && stats.score > timeHigh) timeHigh = stats.score;

      return {
        ...prev,
        classicHighScore: classicHigh,
        timeHighScore: timeHigh
      };
    });

    setScreen('game-over');
  };

  // Read the final cascade result, including points from the very last move.
  useEffect(()=>{if(screen==='playing'&&!isAnimating)checkLevelState(board);},[screen,isAnimating,stats,activeGoals]);

  // --- User Click / Tap Cell Handler ---
  const handleCellClick = (r: number, c: number) => {
    if (isAnimating || screen !== 'playing') return;
    lastInteractionTime.current = Date.now();

    const clickedGem = board[r][c];
    if (!clickedGem) return;

    if (!selectedPos) {
      setSelectedPos([r, c]);
      diamondAudio.playSwap();
      return;
    }

    const [sr, sc] = selectedPos;
    if (sr === r && sc === c) {
      // Deselect
      setSelectedPos(null);
      return;
    }

    if (isAdjacent(sr, sc, r, c)) {
      setSelectedPos(null);
      handleSwapGems(sr, sc, r, c);
    } else {
      // Change selection
      setSelectedPos([r, c]);
      diamondAudio.playSwap();
    }
  };

  // --- Touch / Mouse Drag Swiping ---
  const handleTouchStart = (r: number, c: number, clientX: number, clientY: number) => {
    if (isAnimating || screen !== 'playing') return;
    touchStartPos.current = { r, c, x: clientX, y: clientY };
  };

  const handleTouchEnd = (clientX: number, clientY: number) => {
    if (!touchStartPos.current || isAnimating) return;
    const { r, c, x, y } = touchStartPos.current;
    touchStartPos.current = null;

    const dx = clientX - x;
    const dy = clientY - y;
    const minSwipeDistance = 24;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > minSwipeDistance && c + 1 < BOARD_SIZE) {
        handleSwapGems(r, c, r, c + 1);
      } else if (dx < -minSwipeDistance && c - 1 >= 0) {
        handleSwapGems(r, c, r, c - 1);
      }
    } else {
      // Vertical swipe
      if (dy > minSwipeDistance && r + 1 < BOARD_SIZE) {
        handleSwapGems(r, c, r + 1, c);
      } else if (dy < -minSwipeDistance && r - 1 >= 0) {
        handleSwapGems(r, c, r - 1, c);
      }
    }
  };

  // --- Five difficulty stages of ten levels ---
  const [levelTab, setLevelTab] = useState<number>(0); // 0 through 4

  // Calculate Star rating progress
  const targetStarScore = levelConfig.starScores[0];
  const star2Score = levelConfig.starScores[1];
  const star3Score = levelConfig.starScores[2];
  const starProgressPercent = Math.min(100, Math.round((stats.score / star3Score) * 100));

  return (
    <div className="relative w-full min-h-[640px] max-w-5xl mx-auto rounded-3xl bg-slate-950 text-slate-100 border border-indigo-900/40 shadow-2xl overflow-hidden flex flex-col font-sans select-none">
      
      {/* Deep Blue Fantasy Cosmic Gemstone Background */}
      <div className="absolute inset-0 bg-radial from-indigo-950/80 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* --- TOP BAR / HEADER CONTRACT --- */}
      <header className="relative z-10 flex items-center justify-between gap-8 px-6 py-4 border-b border-indigo-900/40 bg-slate-950/80 backdrop-blur">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-cyan-300 to-indigo-300 whitespace-nowrap shrink-0">
            Diamond Blast
          </span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            · Match-3
          </span>
        </div>

        {/* Zone 2: Navigation / Quick Modes */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button 
            onClick={() => setScreen('menu')} 
            className={`hover:text-amber-400 transition whitespace-nowrap shrink-0 ${screen === 'menu' ? 'text-amber-400' : ''}`}
          >
            Hauptmenü
          </button>
          <button 
            onClick={() => { setLevelTab(Math.floor((progress.unlockedLevel - 1) / 10)); setScreen('levels'); }}
            className={`hover:text-amber-400 transition whitespace-nowrap shrink-0 ${screen === 'levels' ? 'text-amber-400' : ''}`}
          >
            Levelauswahl (5 × 10)
          </button>
          <button 
            onClick={() => setScreen('how-to-play')} 
            className={`hover:text-amber-400 transition whitespace-nowrap shrink-0 ${screen === 'how-to-play' ? 'text-amber-400' : ''}`}
          >
            Spielanleitung
          </button>
        </nav>

        {/* Zone 3: Primary Action / Quick Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSettings((s) => ({ ...s, soundVolume: s.soundVolume > 0 ? 0 : 75 }))}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-indigo-900/50 transition"
            title="Ton An/Aus"
          >
            {settings.soundVolume > 0 ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
          <button
            onClick={() => setScreen('settings')}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-indigo-900/50 transition"
            title="Einstellungen"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
          {screen === 'playing' ? (
            <button
              onClick={() => setScreen('paused')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={() => startLevel(progress.unlockedLevel, 'levels')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Spielen</span>
            </button>
          )}
        </div>
      </header>

      {/* --- MAIN GAMEPLAY VIEW --- */}
      {screen === 'playing' && (
        <div className={`relative flex-1 flex flex-col items-center justify-between p-4 sm:p-6 transition-transform duration-75 ${screenShakeActive ? 'translate-x-1.5 -translate-y-1' : ''}`}>
          
          {/* Top HUD Card: Score, Moves/Timer, Star Bar */}
          <div className="w-full max-w-xl bg-slate-900/80 backdrop-blur border border-indigo-800/40 rounded-2xl p-4 shadow-xl mb-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              {/* Score Display */}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Punkte</span>
                <span className="text-2xl sm:text-3xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                  {stats.score.toLocaleString()}
                </span>
              </div>

              {/* Combo Multiplier indicator */}
              {stats.comboCount > 1 && (
                <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full animate-bounce">
                  <Flame className="w-4 h-4 text-amber-400 fill-current" />
                  <span className="text-xs font-black">COMBO x{stats.comboCount}</span>
                </div>
              )}

              {/* Moves / Timer */}
              <div className="text-right">
                {gameMode === 'time' ? (
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" /> Zeit
                    </span>
                    <span className={`text-2xl font-black tabular-nums ${stats.timeLeft <= 15 ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>
                      {stats.timeLeft}s
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Züge</span>
                    <span className={`text-2xl font-black tabular-nums ${stats.movesLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>
                      {stats.movesLeft}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Level Star Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>{levelConfig.title}</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-0.5 text-amber-400">
                    <Star className={`w-3.5 h-3.5 ${stats.score >= targetStarScore ? 'fill-current' : 'opacity-40'}`} />
                    <Star className={`w-3.5 h-3.5 ${stats.score >= star2Score ? 'fill-current' : 'opacity-40'}`} />
                    <Star className={`w-3.5 h-3.5 ${stats.score >= star3Score ? 'fill-current' : 'opacity-40'}`} />
                  </span>
                  <span className="tabular-nums font-semibold">{stats.score} / {star3Score}</span>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-amber-300 transition-all duration-300 rounded-full"
                  style={{ width: `${starProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Active Level Goals Strip */}
            {gameMode === 'levels' && activeGoals.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60 text-xs">
                <span className="text-slate-400 font-semibold text-[11px]">Ziele:</span>
                {activeGoals.map((g, idx) => {
                  const isDone = g.type === 'score' ? stats.score >= g.target : g.current >= g.target;
                  return (
                    <span 
                      key={idx}
                      className={`px-2.5 py-0.5 rounded-lg border flex items-center gap-1.5 ${
                        isDone 
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300' 
                          : 'bg-slate-800/70 border-slate-700/60 text-slate-300'
                      }`}
                    >
                      <span>{g.label}</span>
                      <span className="tabular-nums font-bold">({g.type === 'score' ? stats.score : g.current}/{g.target})</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* 8x8 MATCH-3 BOARD & CANVAS CONTAINER */}
          <div className="relative flex items-center justify-center w-full max-w-[min(94vw,440px)] aspect-square p-1.5 sm:p-2 bg-slate-900/90 rounded-2xl sm:rounded-3xl border-2 border-indigo-700/50 shadow-[0_0_40px_rgba(30,27,75,0.7)] backdrop-blur touch-none select-none">
            
            {/* HTML5 Particle FX Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-30"
            />

            {/* Auto Shuffle Notice Overlay */}
            {shuffleNotice && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-40 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center gap-2 animate-fade-in">
                <RotateCcw className="w-10 h-10 text-amber-400 animate-spin" />
                <span className="text-base sm:text-lg font-black text-white">Keine Züge mehr!</span>
                <span className="text-xs text-slate-400">Spielfeld wird neu gemischt...</span>
              </div>
            )}

            {/* 8x8 Gem Matrix */}
            <div 
              ref={boardContainerRef}
              className="grid grid-cols-8 grid-rows-8 w-full h-full gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-slate-950/80 rounded-xl sm:rounded-2xl border border-indigo-950/80 touch-none select-none"
            >
              {board.map((row, r) =>
                row.map((gem, c) => {
                  const isSelected = selectedPos?.[0] === r && selectedPos?.[1] === c;
                  const isHinted = (hintPos?.from[0] === r && hintPos?.from[1] === c) || (hintPos?.to[0] === r && hintPos?.to[1] === c);

                  return (
                    <div
                      key={gem ? gem.id : `empty-${r}-${c}`}
                      role="button" tabIndex={isAnimating?-1:0} aria-disabled={isAnimating||!gem}
                      aria-label={`Feld ${r+1},${c+1}: ${gem?({red:'Rubin',blue:'Saphir',green:'Smaragd',yellow:'Topas',purple:'Amethyst',orange:'Bernstein'}[gem.color]):'leer'}${gem?.obstacle&&gem.obstacle!=='none'?` (${gem.obstacle})`:''}`}
                      data-gem-cell={`${r},${c}`} data-color={gem?.color}
                      onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();handleCellClick(r,c);}}}
                      onClick={() => handleCellClick(r, c)}
                      onTouchStart={(e) => {
                        const touch = e.touches[0];
                        handleTouchStart(r, c, touch.clientX, touch.clientY);
                      }}
                      onTouchEnd={(e) => {
                        const touch = e.changedTouches[0];
                        handleTouchEnd(touch.clientX, touch.clientY);
                      }}
                      onMouseDown={(e) => handleTouchStart(r, c, e.clientX, e.clientY)}
                      onMouseUp={(e) => handleTouchEnd(e.clientX, e.clientY)}
                      className={`relative flex items-center justify-center rounded-lg sm:rounded-xl cursor-pointer transition-all touch-none select-none p-0.5 ${
                        (r + c) % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/20'
                      } hover:bg-indigo-900/20`}
                    >
                      {gem && (
                        <GemRenderer 
                          gem={gem} 
                          isSelected={isSelected} 
                          isHinted={isHinted} 
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom In-Game Action Bar */}
          <div className="w-full max-w-xl flex items-center justify-between gap-4 mt-3 pt-2">
            <button
              onClick={() => setScreen('levels')}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-indigo-900/50 flex items-center gap-1.5 transition"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Levels</span>
            </button>

            <button
              onClick={handleRequestHint}
              disabled={isAnimating}
              className="px-4 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/80 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold flex items-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Tipp anzeigen</span>
            </button>

            <button
              onClick={() => startLevel(currentLevelNum, gameMode)}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-indigo-900/50 flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Neustart</span>
            </button>
          </div>
        </div>
      )}

      {/* --- MAIN TITLE MENU SCREEN --- */}
      {screen === 'menu' && (
        <div className="relative flex-1 flex flex-col items-center justify-center p-6 text-center z-10 space-y-8 my-auto">
          {/* Logo & Headline */}
          <div className="space-y-3 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/40 text-amber-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>50 Levels · Match-3 Arcade</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black font-display tracking-tight text-white leading-tight">
              Diamond Blast
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tausche funkelnde Kristalle, entfessle gewaltige Dynamit-Explosionen, Laserblitz-Reihen und Regenbogen-Wipeouts!
            </p>
          </div>

          {/* Mode Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            {/* Level Mode (5 × 10) */}
            <button
              onClick={() => {
                setLevelTab(Math.floor((progress.unlockedLevel - 1) / 10));
                setScreen('levels');
              }}
              className="p-5 rounded-2xl bg-gradient-to-b from-indigo-900/40 to-slate-900/80 border border-indigo-700/50 hover:border-amber-400/80 hover:scale-[1.02] transition text-left flex flex-col justify-between group cursor-pointer shadow-lg"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-slate-950 transition">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">Levelmodus</h3>
                <p className="text-[11px] text-slate-400 leading-snug">
                  50 Levels in fünf Schwierigkeitsstufen mit Eisblöcken, Felsen und Ketten.
                </p>
              </div>
              <div className="pt-3 text-[11px] text-cyan-400 font-semibold flex items-center justify-between">
                <span>Freigeschaltet: {Array.from({length:50},(_,i)=>i+1).filter(id=>levelUnlocked(id,progress.levelStars)).length}/50</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {/* Time Mode (120s) */}
            <button
              onClick={() => startLevel(1, 'time')}
              className="p-5 rounded-2xl bg-gradient-to-b from-indigo-900/40 to-slate-900/80 border border-indigo-700/50 hover:border-cyan-400/80 hover:scale-[1.02] transition text-left flex flex-col justify-between group cursor-pointer shadow-lg"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 text-cyan-400 flex items-center justify-center group-hover:bg-cyan-400 group-hover:text-slate-950 transition">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition">Zeitmodus</h3>
                <p className="text-[11px] text-slate-400 leading-snug">
                  120 Sekunden Highscore-Jagd! Spezialkombos schenken Extrazeit.
                </p>
              </div>
              <div className="pt-3 text-[11px] text-cyan-400 font-semibold flex items-center justify-between">
                <span>Highscore: {progress.timeHighScore.toLocaleString()}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {/* Classic Mode */}
            <button
              onClick={() => startLevel(1, 'classic')}
              className="p-5 rounded-2xl bg-gradient-to-b from-indigo-900/40 to-slate-900/80 border border-indigo-700/50 hover:border-fuchsia-400/80 hover:scale-[1.02] transition text-left flex flex-col justify-between group cursor-pointer shadow-lg"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-400/10 text-fuchsia-400 flex items-center justify-center group-hover:bg-fuchsia-400 group-hover:text-slate-950 transition">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-fuchsia-400 transition">Klassisch</h3>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Unbegrenzte Zeit. Sammle Punkte und meistere höhere Levelstufen.
                </p>
              </div>
              <div className="pt-3 text-[11px] text-fuchsia-400 font-semibold flex items-center justify-between">
                <span>Highscore: {progress.classicHighScore.toLocaleString()}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Quick Menu Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => startLevel(progress.unlockedLevel, 'levels')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-400/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Level {progress.unlockedLevel} fortsetzen</span>
            </button>
            <button
              onClick={() => setScreen('how-to-play')}
              className="px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-sm font-semibold border border-indigo-900/60 transition flex items-center gap-2 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Anleitung</span>
            </button>
          </div>
        </div>
      )}

      {/* --- LEVEL SELECTION SCREEN (50 LEVELS) --- */}
      {screen === 'levels' && (
        <div className="relative flex-1 flex flex-col p-6 z-10 max-w-4xl mx-auto w-full space-y-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setScreen('menu')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-indigo-900/50 flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Zurück</span>
            </button>
            <h2 className="text-xl sm:text-2xl font-black text-white">Levelauswahl (5 × 10)</h2>
            <div className="text-xs text-amber-400 font-bold flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" />
              <span>{Object.values(progress.levelStars).reduce((a, b) => a + b, 0)} / 150</span>
            </div>
          </div>

          {/* Difficulty tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-indigo-900/40">
            {CAMPAIGN_TIERS.map((label, idx) => (
              <button
                key={idx}
                onClick={() => setLevelTab(idx)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  levelTab === idx
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400">Jede Schwierigkeit startet mit Level 1. Gewinne ein Level, um das nächste freizuschalten. Sterne und Bestwerte bleiben auf diesem Gerät gespeichert.</p>
          {/* Ten levels per difficulty */}
          <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-5 gap-3 flex-1 overflow-y-auto max-h-[460px] p-2">
            {Array.from({ length: 10 }, (_, i) => {
              const lvlNum = levelTab * 10 + i + 1;
              const isUnlocked = levelUnlocked(lvlNum, progress.levelStars);
              const stars = progress.levelStars[lvlNum] || 0;
              const highScore = progress.levelScores[lvlNum] || 0;

              return (
                <button
                  key={lvlNum}
                  aria-label={`${CAMPAIGN_TIERS[levelTab]} Level ${i+1}`}
                  disabled={!isUnlocked}
                  onClick={() => startLevel(lvlNum, 'levels')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-between transition relative ${
                    isUnlocked
                      ? 'bg-slate-900/90 border-indigo-700/60 hover:border-amber-400 hover:scale-105 cursor-pointer shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="text-xs uppercase font-bold text-slate-400">Level</span>
                  <span className="text-xl font-black text-white">{i+1}</span>

                  {/* Stars 0-3 */}
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          stars >= s ? 'text-amber-400 fill-current' : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  {highScore > 0 && (
                    <span className="text-[10px] text-cyan-400 font-mono mt-1 tabular-nums">
                      {highScore.toLocaleString()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* --- LEVEL WON VICTORY MODAL --- */}
      {screen === 'level-won' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-indigo-700/60 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
            <div className="inline-flex p-3 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/40">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">Level Bestanden!</h3>
              <p className="text-xs text-slate-400">{levelConfig.title} erfolgreich gemeistert</p>
            </div>

            {/* Stars Fanfare */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3].map((s) => {
                const earned = (progress.levelStars[currentLevelNum] || 1) >= s;
                return (
                  <Star
                    key={s}
                    className={`w-8 h-8 transition-transform duration-300 ${
                      earned ? 'text-amber-400 fill-current scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]' : 'text-slate-700'
                    }`}
                  />
                );
              })}
            </div>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Erreichte Punktzahl</span>
              <div className="text-2xl font-black text-amber-300 tabular-nums">
                {stats.score.toLocaleString()}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {currentLevelNum % 10 !== 0 && (
                <button
                  onClick={() => startLevel(currentLevelNum + 1, 'levels')}
                  className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-400/20 transition cursor-pointer"
                >
                  Nächstes Level ({currentLevelNum % 10 + 1}/10)
                </button>
              )}
              <button
                onClick={() => startLevel(currentLevelNum, 'levels')}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Nochmal spielen
              </button>
              <button
                onClick={() => setScreen('levels')}
                className="w-full py-2 text-xs text-slate-400 hover:text-white font-semibold transition"
              >
                Zur Levelauswahl
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- GAME OVER MODAL --- */}
      {screen === 'game-over' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-red-900/60 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
            <div className="inline-flex p-3 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
              <RotateCcw className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">Keine Züge mehr!</h3>
              <p className="text-xs text-slate-400">
                {gameMode === 'time' ? 'Die Zeit ist abgelaufen.' : 'Die Levelziele wurden nicht erreicht.'}
              </p>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Endpunktzahl</span>
              <div className="text-2xl font-black text-slate-100 tabular-nums">
                {stats.score.toLocaleString()}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => startLevel(currentLevelNum, gameMode)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-lg transition cursor-pointer"
              >
                Nochmal versuchen
              </button>
              <button
                onClick={() => setScreen('menu')}
                className="w-full py-2 text-xs text-slate-400 hover:text-white font-semibold transition"
              >
                Zum Hauptmenü
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PAUSE MODAL --- */}
      {screen === 'paused' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-indigo-700/60 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
            <div className="inline-flex p-3 rounded-full bg-cyan-400/20 text-cyan-400 border border-cyan-400/40">
              <Pause className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">Spiel Pausiert</h3>
              <p className="text-xs text-slate-400">{levelConfig.title}</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => setScreen('playing')}
                className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-lg transition cursor-pointer"
              >
                Weiterspielen
              </button>
              <button
                onClick={() => startLevel(currentLevelNum, gameMode)}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Level neu starten
              </button>
              <button
                onClick={() => setScreen('how-to-play')}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Spielanleitung
              </button>
              <button
                onClick={() => setScreen('menu')}
                className="w-full py-2 text-xs text-slate-400 hover:text-white font-semibold transition"
              >
                Zum Hauptmenü
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SETTINGS MODAL --- */}
      {screen === 'settings' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-indigo-700/60 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-amber-400" />
                <span>Einstellungen</span>
              </h3>
              <button
                onClick={() => setScreen('menu')}
                className="text-xs text-slate-400 hover:text-white font-bold"
              >
                Schließen
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Sound FX Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Soundeffekte</span>
                  <span className="tabular-nums">{settings.soundVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.soundVolume}
                  onChange={(e) => setSettings((s) => ({ ...s, soundVolume: Number(e.target.value) }))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Music Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Hintergrundmusik</span>
                  <span className="tabular-nums">{settings.musicVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.musicVolume}
                  onChange={(e) => setSettings((s) => ({ ...s, musicVolume: Number(e.target.value) }))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Screen Shake */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="font-bold text-slate-300">Bildschirmerschütterung (Shake)</span>
                <button
                  onClick={() => setSettings((s) => ({ ...s, screenShake: !s.screenShake }))}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    settings.screenShake ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.screenShake ? 'AN' : 'AUS'}
                </button>
              </div>

              {/* Particle Density */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="font-bold text-slate-300 block">Partikeleffekte</span>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((density) => (
                    <button
                      key={density}
                      onClick={() => setSettings((s) => ({ ...s, particleDensity: density }))}
                      className={`flex-1 py-1.5 rounded-lg font-bold uppercase text-[10px] transition ${
                        settings.particleDensity === density
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setScreen('menu')}
              className="w-full py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              Fertig
            </button>
          </div>
        </div>
      )}

      {/* --- HOW TO PLAY MODAL --- */}
      {screen === 'how-to-play' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-700/60 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <span>Spielanleitung: Diamond Blast</span>
              </h3>
              <button
                onClick={() => setScreen('menu')}
                className="text-xs text-slate-400 hover:text-white font-bold"
              >
                Schließen
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 max-h-[460px] overflow-y-auto pr-2">
              {/* Basics */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-amber-300 text-sm">Grundregeln</h4>
                <p className="leading-relaxed">
                  Tausche zwei benachbarte Diamanten horizontal oder vertikal. Entstehen dabei 3 oder mehr gleiche Diamanten in einer Reihe, lösen sie sich auf und schenken Punkte! Darüberliegende Steine fallen nach.
                </p>
              </div>

              {/* Special Gems */}
              <div className="space-y-2">
                <h4 className="font-bold text-amber-300 text-sm">Spezialdiamanten & Dynamit</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-indigo-900/50 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" /> 4er-Reihe: Laserblitz
                    </span>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Zerstört eine vollständige Zeile oder Spalte mit einem Energiestrahl.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-indigo-900/50 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" /> T/L-Form: Dynamitbombe
                    </span>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Explodiert im 3×3-Radius mit Funkenregen und Erschütterung.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-indigo-900/50 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" /> 5er-Reihe: Regenbogen
                    </span>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Entfernt alle Diamanten einer ausgewählten Farbe vom Brett!
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-indigo-900/50 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-300" /> Mega-Kombos
                    </span>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Zwei Bomben = 5×5 Mega-Blast! Zwei Regenbögen räumen das ganze Brett ab!
                    </p>
                  </div>
                </div>
              </div>

              {/* Obstacles */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-amber-300 text-sm">Hindernisse</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400 leading-relaxed">
                  <li><strong className="text-cyan-300">Eisblöcke:</strong> Matche Diamanten daneben oder darauf, um das Eis aufzutauen.</li>
                  <li><strong className="text-slate-300">Felsen (Granit):</strong> Brauchen 2 Treffer daneben oder eine Dynamit-Explosion zum Zerstören.</li>
                  <li><strong className="text-amber-400">Ketten:</strong> Gefangene Diamanten können nicht getauscht werden, bis sie in eine Farbkombination eingebunden werden.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setScreen('menu')}
              className="w-full py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
