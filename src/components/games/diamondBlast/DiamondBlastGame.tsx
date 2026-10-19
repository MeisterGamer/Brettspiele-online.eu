import {seededRandom} from '../../../services/campaign';
import {DIAMOND_CHAPTERS} from './levelGenerator';
import {DIAMOND_SAVE_KEY,normalizeDiamondProgress,diamondLevelUnlocked,recordDiamondWin} from './progress';
import {resolveDiamondMove,advanceDiamondGoals} from './diamondEngine';
import {DIAMOND_ART,DiamondSprite} from './diamondArt';
import { useGameTimers } from '../useGameTimers';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {BoardGrid,GameMode,LevelConfig,GameStats,Settings,UserProgress} from './types';
import {BOARD_SIZE,GEM_COLORS,createInitialBoard,findHintMove,isAdjacent} from './matchEngine';
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

const STORAGE_KEY = DIAMOND_SAVE_KEY;

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
      const saved=localStorage.getItem(STORAGE_KEY)||localStorage.getItem('diamond_blast_campaign_50_v1')||localStorage.getItem('diamond_blast_save_v2');
      if(saved)return normalizeDiamondProgress(JSON.parse(saved));
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
  const moveBusy=useRef(false),runVersion=useRef(0),runRandom=useRef<()=>number>(Math.random);
  useEffect(()=>()=>{runVersion.current++;},[]);

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
        return { ...prev, timeLeft: Math.max(0,prev.timeLeft - 1) };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, gameMode]);

  // --- Start Game / Level ---
  const startLevel = (lvlNum: number, mode: GameMode = 'levels') => {
    if(mode==='levels'&&!diamondLevelUnlocked(lvlNum,progress))return;
    runVersion.current++;moveBusy.current=false;
    const config = getLevelConfig(lvlNum);
    runRandom.current=mode==='levels'?seededRandom(config.seed!):Math.random;
    setLevelConfig(config);
    setCurrentLevelNum(config.levelNumber);
    setGameMode(mode);
    setActiveGoals(config.goals.map((g) => ({ ...g, current: 0 })));

    const newBoard = createInitialBoard(mode==='levels'?config:undefined,runRandom.current);
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

  // The same pure resolver handles normal matches, special combos, obstacles and all goals.
  const handleSwapGems=async(r1:number,c1:number,r2:number,c2:number)=>{
    if(moveBusy.current||isAnimating||screen!=='playing'||gameMode==='levels'&&stats.movesLeft<=0)return;
    const result=resolveDiamondMove(board,[r1,c1],[r2,c2],runRandom.current,gameMode==='levels'?levelConfig.colors:GEM_COLORS);
    lastInteractionTime.current=Date.now();setHintPos(null);
    if(!result.valid){diamondAudio.playInvalid();setSelectedPos(null);return;}
    moveBusy.current=true;setIsAnimating(true);const version=runVersion.current;
    setStats(prev=>({...prev,score:prev.score+result.score,movesLeft:Math.max(0,prev.movesLeft-1),comboCount:result.combo,maxCombo:Math.max(prev.maxCombo,result.combo),matchesCount:prev.matchesCount+result.matches,specialGemsCreated:prev.specialGemsCreated+result.created,bombsDetonated:prev.bombsDetonated+result.detonations,timeLeft:gameMode==='time'?Math.min(180,prev.timeLeft+Math.min(8,result.combo*2)):prev.timeLeft}));
    setActiveGoals(goals=>advanceDiamondGoals(goals,result));
    diamondAudio.playMatch(Math.max(1,result.combo));
    if(result.detonations){diamondAudio.playExplosion();triggerScreenShake();}
    if(result.cleared.rock||result.cleared.ice||result.cleared.chain)diamondAudio.playCrack();
    const point=getCellPixelCoords(r2,c2);
    particleEngineRef.current?.addFloatingText(point.x,point.y,`+${result.score}`,'#facc15');
    particleEngineRef.current?.emitGemsBurst(point.x,point.y,'#38bdf8',16);
    // Bound animation duration even for an unusually long cascade.
    const frames=result.frames.length>12?[...result.frames.slice(0,11),result.board]:result.frames;
    for(const frame of frames){
      if(version!==runVersion.current)return;
      setBoard(frame);await new Promise(resolve=>schedule(resolve,110));
    }
    if(version!==runVersion.current)return;
    if(result.shuffled){setShuffleNotice(true);diamondAudio.playShuffle();await new Promise(resolve=>schedule(resolve,450));}
    if(version!==runVersion.current)return;
    setShuffleNotice(false);setBoard(result.board);setIsAnimating(false);moveBusy.current=false;
  };

  // --- Check Win / Game Over State ---
  const checkLevelState = () => {
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
    } else if(gameMode==='time'&&stats.timeLeft<=0){handleGameOver();
    } else if (gameMode === 'classic') {
      // Classic Mode: Level Up every 5,000 points
      const nextLevelThreshold = stats.level * 5000;
      if (stats.level<50&&stats.score >= nextLevelThreshold) {
        setStats((prev) => ({ ...prev, level: Math.min(50,prev.level + 1) }));
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

    setProgress(prev=>recordDiamondWin(prev,currentLevelNum,stars,stats.score));

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
  useEffect(()=>{if(screen==='playing'&&!isAnimating)checkLevelState();},[screen,isAnimating,stats,activeGoals]);

  // --- User Click / Tap Cell Handler ---
  const handleCellClick = (r: number, c: number) => {
    if (isAnimating || screen !== 'playing') return;
    lastInteractionTime.current = Date.now();

    const clickedGem = board[r][c];
    if (!clickedGem||clickedGem.obstacle!=='none') return;

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
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{backgroundImage:`url(${DIAMOND_ART.vault})`,backgroundSize:'cover',backgroundPosition:'center'}}/>
      <div className="absolute inset-0 bg-slate-950/60 pointer-events-none"/>
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
            Levelauswahl (1–50)
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
        <div className={`relative flex-1 flex flex-col items-center justify-between p-1 sm:p-3 transition-transform duration-75 ${screenShakeActive ? 'translate-x-1.5 -translate-y-1' : ''}`}>
          
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

          {gameMode==='levels'&&<section aria-label="Levelbeschreibung" className="w-full max-w-lg rounded-xl border border-violet-500/30 bg-slate-950/90 p-3 text-xs"><div className="flex items-center justify-between gap-2"><strong>{levelConfig.chapter}</strong><span>Level {currentLevelNum}/50</span></div><p className="text-slate-300 my-2">{levelConfig.briefing}</p><div role="progressbar" aria-label="Schwierigkeit" aria-valuemin={1} aria-valuemax={50} aria-valuenow={currentLevelNum} className="h-1.5 bg-slate-700 rounded-full"><div className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-full" style={{width:`${currentLevelNum*2}%`}}/></div></section>}
          {/* 8x8 MATCH-3 BOARD & CANVAS CONTAINER */}
          <div style={{backgroundImage:`url(${DIAMOND_ART.vault})`,backgroundSize:'100% 100%'}} className="relative flex items-center justify-center w-full max-w-[900px] aspect-square p-1 sm:p-3 bg-slate-900/90 rounded-2xl sm:rounded-3xl border-2 border-indigo-700/50 shadow-[0_0_40px_rgba(30,27,75,0.7)] backdrop-blur touch-none select-none">
            
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
              className="grid grid-cols-8 grid-rows-8 w-full h-full gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-slate-950/55 rounded-xl sm:rounded-2xl border border-indigo-950/80 touch-none select-none"
            >
              {board.map((row, r) =>
                row.map((gem, c) => {
                  const isSelected = selectedPos?.[0] === r && selectedPos?.[1] === c;
                  const isHinted = (hintPos?.from[0] === r && hintPos?.from[1] === c) || (hintPos?.to[0] === r && hintPos?.to[1] === c);

                  return (
                    <div
                      key={gem ? gem.id : `empty-${r}-${c}`}
                      role="button" tabIndex={isAnimating?-1:0} aria-disabled={isAnimating||!gem}
                      aria-label={`Feld ${r+1},${c+1}: ${gem?({red:'Rubin',blue:'Saphir',green:'Smaragd',yellow:'Topas',purple:'Amethyst',orange:'Bernstein'}[gem.color]):'leer'}${gem?.special&&gem.special!=='none'?` · ${{'line-h':'Zeilenlaser','line-v':'Spaltenlaser',bomb:'Bombe',rainbow:'Regenbogen'}[gem.special]}`:''}${gem?.obstacle&&gem.obstacle!=='none'?` · ${{ice:'Eis',rock:`Fels, ${gem.obstacleHealth} Treffer`,chain:'Kette'}[gem.obstacle]}`:''}`}
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
          <div aria-hidden="true" className="flex gap-1">{['red','blue','green','yellow','purple','orange'].map((color,i)=><DiamondSprite key={color} sheet="gems" index={i} className="w-10 h-10 sm:w-14 sm:h-14"/>)}</div>
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
                  50 unterschiedliche Levels: zunehmend höhere Ziele, mehr Hindernisse und weniger Züge.
                </p>
              </div>
              <div className="pt-3 text-[11px] text-cyan-400 font-semibold flex items-center justify-between">
                <span>Freigeschaltet: {Array.from({length:50},(_,i)=>i+1).filter(id=>diamondLevelUnlocked(id,progress)).length}/50</span>
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
              <span>{progress.levelStars[50]?'Finale erneut spielen':`Level ${progress.unlockedLevel} fortsetzen`}</span>
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
            <h2 className="text-xl sm:text-2xl font-black text-white">Levelauswahl (1–50)</h2>
            <div className="text-xs text-amber-400 font-bold flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" />
              <span>{Object.values(progress.levelStars).reduce((a, b) => a + b, 0)} / 150</span>
            </div>
          </div>

          {/* Difficulty tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-indigo-900/40">
            {DIAMOND_CHAPTERS.map((label, idx) => (
              <button
                key={idx}
                onClick={() => setLevelTab(idx)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  levelTab === idx
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}<span className="block text-[10px] opacity-70 mt-1">{idx*10+1}–{idx*10+10}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400">Eine Kampagne von Level 1 bis 50. Gewinne ein Level, um das nächste freizuschalten. Kapitelwechsel setzen die Schwierigkeit nicht zurück.</p>
          {/* Ten levels per difficulty */}
          <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-5 gap-3 flex-1 overflow-y-auto max-h-[460px] p-2">
            {Array.from({ length: 10 }, (_, i) => {
              const lvlNum = levelTab * 10 + i + 1;
              const isUnlocked = diamondLevelUnlocked(lvlNum, progress);
              const stars = progress.levelStars[lvlNum] || 0;
              const highScore = progress.levelScores[lvlNum] || 0;

              return (
                <button
                  key={lvlNum}
                  aria-label={`Level ${lvlNum}: ${getLevelConfig(lvlNum).title.split('. ')[1]}`} title={getLevelConfig(lvlNum).briefing}
                  disabled={!isUnlocked}
                  onClick={() => startLevel(lvlNum, 'levels')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-between transition relative ${
                    isUnlocked
                      ? 'bg-slate-900/90 border-indigo-700/60 hover:border-amber-400 hover:scale-105 cursor-pointer shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="text-xs uppercase font-bold text-slate-400">Level</span>
                  <span className="text-xl font-black text-white">{lvlNum}</span><span className="hidden sm:block text-[9px] leading-tight text-slate-400 text-center">{getLevelConfig(lvlNum).title.split('. ')[1]}</span>

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
              <h3 className="text-2xl font-black text-white">{currentLevelNum===50?'Kampagne abgeschlossen!':'Level bestanden!'}</h3>
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
              {currentLevelNum < 50 && (
                <button
                  onClick={() => startLevel(currentLevelNum + 1, 'levels')}
                  className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-400/20 transition cursor-pointer"
                >
                  Nächstes Level ({currentLevelNum + 1}/50)
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
                      <DiamondSprite sheet="objects" index={0} className="w-7 h-7"/> 4er-Reihe: Laserblitz
                    </span>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Zerstört eine vollständige Zeile oder Spalte mit einem Energiestrahl.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-indigo-900/50 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <DiamondSprite sheet="objects" index={2} className="w-7 h-7"/> T/L-Form: Dynamitbombe
                    </span>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Räumt ein 3×3-Feld ab und beschädigt Hindernisse. Eine Bombe mit einem Laser kombiniert trifft drei Reihen und drei Spalten.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-indigo-900/50 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <DiamondSprite sheet="objects" index={3} className="w-7 h-7"/> 5er-Reihe: Regenbogen
                    </span>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Entfernt alle Diamanten einer ausgewählten Farbe vom Brett!
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-indigo-900/50 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <DiamondSprite sheet="objects" index={7} className="w-7 h-7"/> Mega-Kombos
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
                  <li><strong className="text-cyan-300">Eisblöcke:</strong> Gefrorene Steine bleiben fest. Eine Kombination auf dem Feld, direkt daneben oder ein Spezialtreffer schmilzt das Eis.</li>
                  <li><strong className="text-slate-300">Felsen (Granit):</strong> Benötigen einen oder zwei Treffer; Punkte am Felsen zeigen die Reststärke. Benachbarte Kombinationen und Spezialeffekte beschädigen sie.</li>
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
