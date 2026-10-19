import React, { useState, useEffect, useRef } from 'react';
import {
  PlacedMahjongTile,
  MahjongLayoutType,
  generateMahjongBoard,
  isTileFree,
  findAvailablePairs,
  canTilesMatch,
} from './mahjong/mahjongData';
import {
  MAHJONG_LEVELS,
  MahjongLevelConfig,
  generateLevelBoard,
} from './mahjong/mahjongLevels';
import { MahjongTileRenderer } from './mahjong/MahjongTileRenderer';
import { RoomParticipant } from '../../types';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import {
  Sparkles,
  RotateCcw,
  Undo2,
  Lightbulb,
  Shuffle,
  HelpCircle,
  Trophy,
  Flame,
  Clock,
  Eye,
  EyeOff,
  Palette,
  X,
  Users,
  Bot,
  Crown,
  Play,
  Pause,
  Award,
  Star,
  Lock,
  CheckCircle2,
  ChevronRight,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface MahjongGameProps {
  onGameEnd?: (winner: string) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

interface MatchHistoryEntry {
  tile1Id: string;
  tile2Id: string;
  playerId: string;
  points: number;
}

interface MahjongPlayer {
  id: string;
  name: string;
  color: string;
  isAi: boolean;
  score: number;
  matchedPairsCount: number;
}

interface MahjongUserProgress {
  unlockedLevel: number;
  levelStars: Record<number, number>;
  levelScores: Record<number, number>;
  levelTimes: Record<number, number>;
}

const STORAGE_KEY = 'mahjong_campaign_save_v2';
const DEFAULT_PROGRESS: MahjongUserProgress = {
  unlockedLevel: 1,
  levelStars: {},
  levelScores: {},
  levelTimes: {},
};

export const MahjongGame: React.FC<MahjongGameProps> = ({
  onGameEnd,
  tableParticipants,
  currentUserId = 'user-1',
  onActiveTurnChange,
  roomCode,
  isHost = true,
}) => {
  // Preset Bot configurations for Table Duel
  const BOT_PRESETS = [
    { name: 'Oma Grete (KI)', color: '#3b82f6' },
    { name: 'Papa Thomas (KI)', color: '#ef4444' },
    { name: 'Junior Leo (KI)', color: '#eab308' },
    { name: 'Tante Lisa (KI)', color: '#10b981' },
  ];

  // Campaign Progress
  const [progress, setProgress] = useState<MahjongUserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_PROGRESS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_PROGRESS;
  });

  const saveProgress = (newProg: MahjongUserProgress) => {
    setProgress(newProg);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProg));
    } catch {
      // ignore
    }
  };

  // Game Mode: 'levels' (25 handcrafted levels), 'solo' (classic free play 144), 'duel' (table multiplayer/bots)
  const [gameMode, setGameMode] = useState<'levels' | 'solo' | 'duel'>('levels');
  const [currentLevelNum, setCurrentLevelNum] = useState<number>(1);
  const [currentLevelConfig, setCurrentLevelConfig] = useState<MahjongLevelConfig>(() => MAHJONG_LEVELS[0]);
  const [isLevelSelectorOpen, setIsLevelSelectorOpen] = useState<boolean>(false);

  // Layout for free play
  const [layout, setLayout] = useState<MahjongLayoutType>('turtle');
  const [tileTheme, setTileTheme] = useState<'ivory' | 'emerald' | 'wood'>('ivory');
  const [dimBlocked, setDimBlocked] = useState<boolean>(true);

  // Board Tiles State
  const [tiles, setTiles] = useState<PlacedMahjongTile[]>(() => {
    const { tiles: lvlTiles } = generateLevelBoard(1);
    return lvlTiles;
  });

  // Total tile count in current setup
  const totalTileCount = tiles.length;

  // Selection & Hint
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [hintedTileIds, setHintedTileIds] = useState<string[]>([]);

  // History for Undo
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);

  // Score & Combo
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Players for Table Duel
  const [players, setPlayers] = useState<MahjongPlayer[]>(() => {
    const list: MahjongPlayer[] = [];
    if (tableParticipants && tableParticipants.length > 0) {
      tableParticipants.slice(0, 4).forEach((part, idx) => {
        list.push({
          id: part.id,
          name: part.name,
          color: ['#f97316', '#3b82f6', '#eab308', '#10b981'][idx],
          isAi: part.isBot || false,
          score: 0,
          matchedPairsCount: 0,
        });
      });
    } else {
      list.push({
        id: currentUserId,
        name: 'Ich (Spieler 1)',
        color: '#f97316',
        isAi: false,
        score: 0,
        matchedPairsCount: 0,
      });
      list.push({
        id: 'bot-1',
        name: BOT_PRESETS[0].name,
        color: BOT_PRESETS[0].color,
        isAi: true,
        score: 0,
        matchedPairsCount: 0,
      });
    }
    return list;
  });

  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);

  // Modals & Banners
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);
  const [earnedStars, setEarnedStars] = useState<number>(0);
  const [noMovesAlert, setNoMovesAlert] = useState<boolean>(false);

  const activePlayer = players[activePlayerIndex];
  const isHumanTurn = gameMode !== 'duel' || (activePlayer && !activePlayer.isAi);

  // Sync turn
  useEffect(() => {
    if (gameMode === 'duel' && activePlayer && onActiveTurnChange) {
      onActiveTurnChange(activePlayer.id);
    }
  }, [activePlayerIndex, gameMode, activePlayer?.id]);

  // Timer tick
  useEffect(() => {
    if (!isTimerRunning || isVictoryOpen) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isVictoryOpen]);

  // Remaining and Matched tiles count
  const remainingTiles = tiles.filter((t) => !t.matched);
  const remainingCount = remainingTiles.length;
  const matchedPairsCount = Math.floor((totalTileCount - remainingCount) / 2);

  // Available free pairs count
  const availablePairs = findAvailablePairs(tiles);

  // Check victory or deadlock
  useEffect(() => {
    if (tiles.length > 0 && remainingCount === 0 && !isVictoryOpen) {
      setIsVictoryOpen(true);
      sound.playVictory();
      confetti({ particleCount: 180, spread: 90 });

      if (gameMode === 'levels') {
        // Calculate Stars
        let stars = 1;
        if (elapsedSeconds <= currentLevelConfig.targetTime && score >= currentLevelConfig.targetScore) {
          stars = 3;
        } else if (elapsedSeconds <= Math.round(currentLevelConfig.targetTime * 1.5) || score >= Math.round(currentLevelConfig.targetScore * 0.8)) {
          stars = 2;
        }
        setEarnedStars(stars);

        // Update User Progress
        const nextUnlocked = Math.max(progress.unlockedLevel, Math.min(25, currentLevelNum + 1));
        const oldStars = progress.levelStars[currentLevelNum] || 0;
        const oldScore = progress.levelScores[currentLevelNum] || 0;
        const oldTime = progress.levelTimes[currentLevelNum] || 999999;

        saveProgress({
          unlockedLevel: nextUnlocked,
          levelStars: {
            ...progress.levelStars,
            [currentLevelNum]: Math.max(oldStars, stars),
          },
          levelScores: {
            ...progress.levelScores,
            [currentLevelNum]: Math.max(oldScore, score),
          },
          levelTimes: {
            ...progress.levelTimes,
            [currentLevelNum]: Math.min(oldTime, elapsedSeconds),
          },
        });
      }

      if (onGameEnd) {
        const victorName =
          gameMode === 'duel'
            ? [...players].sort((a, b) => b.score - a.score)[0]?.name || 'Gewinner'
            : `Level ${currentLevelNum} Meister`;
        onGameEnd(victorName);
      }
    } else if (remainingCount > 0 && availablePairs.length === 0) {
      setNoMovesAlert(true);
    } else {
      setNoMovesAlert(false);
    }
  }, [remainingCount, availablePairs.length, tiles.length]);

  // Start a specific level
  const startLevel = (lvlNum: number) => {
    sound.playCardDeal();
    const { tiles: lvlTiles, config } = generateLevelBoard(lvlNum);
    setCurrentLevelNum(lvlNum);
    setCurrentLevelConfig(config);
    setTiles(lvlTiles);
    setTileTheme(config.theme);
    setSelectedTileId(null);
    setHintedTileIds([]);
    setHistory([]);
    setScore(0);
    setCombo(0);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setIsVictoryOpen(false);
    setEarnedStars(0);
    setNoMovesAlert(false);
    setIsLevelSelectorOpen(false);
    setGameMode('levels');
  };

  // Switch to Free Play (Solo 144)
  const startFreePlay = (freeLayout: MahjongLayoutType = 'turtle') => {
    sound.playCardDeal();
    setLayout(freeLayout);
    setTiles(generateMahjongBoard(freeLayout));
    setSelectedTileId(null);
    setHintedTileIds([]);
    setHistory([]);
    setScore(0);
    setCombo(0);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setIsVictoryOpen(false);
    setEarnedStars(0);
    setNoMovesAlert(false);
    setGameMode('solo');
  };

  // Switch to Table Duel
  const startDuelMode = () => {
    sound.playCardDeal();
    setTiles(generateMahjongBoard(layout));
    setSelectedTileId(null);
    setHintedTileIds([]);
    setHistory([]);
    setScore(0);
    setCombo(0);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setIsVictoryOpen(false);
    setEarnedStars(0);
    setNoMovesAlert(false);
    setActivePlayerIndex(0);
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0, matchedPairsCount: 0 })));
    setGameMode('duel');
  };

  // Handle Tile Click
  const handleTileClick = (clickedTile: PlacedMahjongTile) => {
    if (!isTileFree(clickedTile, tiles) || clickedTile.matched) {
      sound.playError();
      return;
    }

    // Clear hints
    if (hintedTileIds.length > 0) setHintedTileIds([]);

    // 1. If no tile currently selected -> select this tile
    if (!selectedTileId) {
      setSelectedTileId(clickedTile.id);
      sound.playClick();
      return;
    }

    // 2. If clicking same tile -> deselect
    if (selectedTileId === clickedTile.id) {
      setSelectedTileId(null);
      sound.playClick();
      return;
    }

    // 3. Second tile clicked -> attempt match
    const firstTile = tiles.find((t) => t.id === selectedTileId);
    if (!firstTile) {
      setSelectedTileId(clickedTile.id);
      return;
    }

    if (canTilesMatch(firstTile.definition, clickedTile.definition)) {
      // Valid Match!
      sound.playPieceDrop();

      // Combo logic: match within 4 seconds extends combo
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => {
        setCombo(0);
      }, 4500);

      // Score calculation:
      let basePoints = 100;
      if (firstTile.definition.category === 'dragon' || firstTile.definition.category === 'wind') {
        basePoints = 150;
      } else if (firstTile.definition.category === 'flower' || firstTile.definition.category === 'season') {
        basePoints = 200;
      }
      const pairPoints = basePoints * newCombo;

      // Update Tiles (mark matched)
      setTiles((prev) =>
        prev.map((t) => (t.id === firstTile.id || t.id === clickedTile.id ? { ...t, matched: true } : t))
      );

      // Update History
      setHistory((prev) => [
        {
          tile1Id: firstTile.id,
          tile2Id: clickedTile.id,
          playerId: activePlayer ? activePlayer.id : currentUserId,
          points: pairPoints,
        },
        ...prev,
      ]);

      // Update Score
      setScore((prev) => prev + pairPoints);

      // Update Player in Duel Mode
      if (gameMode === 'duel' && activePlayer) {
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === activePlayerIndex
              ? {
                  ...p,
                  score: p.score + pairPoints,
                  matchedPairsCount: p.matchedPairsCount + 1,
                }
              : p
          )
        );
        // Switch turn to next player in duel
        setActivePlayerIndex((prev) => (prev + 1) % players.length);
      }

      setSelectedTileId(null);
    } else {
      // Mismatch
      sound.playError();
      setSelectedTileId(clickedTile.id); // switch selection to the newly clicked tile
    }
  };

  // AI Turn in Duel Mode
  useEffect(() => {
    if (gameMode !== 'duel' || !activePlayer || !activePlayer.isAi || isVictoryOpen) return;

    const timer = setTimeout(() => {
      const pairs = findAvailablePairs(tiles);
      if (pairs.length > 0) {
        const chosen = pairs[Math.floor(Math.random() * Math.min(3, pairs.length))];
        const [t1, t2] = chosen;

        setSelectedTileId(t1.id);
        sound.playClick();

        setTimeout(() => {
          handleTileClick(t2);
        }, 600);
      } else if (remainingCount > 0) {
        handleShuffle();
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [activePlayerIndex, gameMode, isVictoryOpen, tiles]);

  // Hint Button: Highlight an available pair
  const handleHint = () => {
    if (availablePairs.length === 0) {
      sound.playError();
      return;
    }
    sound.playReward();
    const [t1, t2] = availablePairs[0];
    setHintedTileIds([t1.id, t2.id]);
    setScore((prev) => Math.max(0, prev - 25));

    setTimeout(() => {
      setHintedTileIds([]);
    }, 3500);
  };

  // Undo Button: Restore last matched pair
  const handleUndo = () => {
    if (history.length === 0) {
      sound.playError();
      return;
    }
    sound.playCardDeal();
    const [last, ...restHistory] = history;

    setTiles((prev) =>
      prev.map((t) => (t.id === last.tile1Id || t.id === last.tile2Id ? { ...t, matched: false } : t))
    );

    setScore((prev) => Math.max(0, prev - last.points));
    setHistory(restHistory);
    setSelectedTileId(null);
    setHintedTileIds([]);
  };

  // Shuffle Remaining Tiles (preserving 3D positions and layers)
  const handleShuffle = () => {
    sound.playCardDeal();
    setSelectedTileId(null);
    setHintedTileIds([]);

    const unmatched = tiles.filter((t) => !t.matched);
    const definitions = unmatched.map((t) => t.definition);

    for (let i = definitions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [definitions[i], definitions[j]] = [definitions[j], definitions[i]];
    }

    let defIdx = 0;
    setTiles((prev) =>
      prev.map((t) => {
        if (t.matched) return t;
        const newDef = definitions[defIdx++];
        return { ...t, definition: newDef };
      })
    );
  };

  // Format Time
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  // Board coordinate bounding box calculations for SVG / responsive placement
  const minX = -2;
  const maxX = 30;
  const minY = 0;
  const maxY = 18;

  const boardWidth = maxX - minX;
  const boardHeight = maxY - minY;

  return (
    <div className="relative w-full max-w-7xl mx-auto flex flex-col gap-4 text-white">
      {/* 1. TOP HEADER & CONTROLS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md">
        {/* Title, Mode & Level Name */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center font-black text-2xl shadow-lg border border-amber-300/40 shrink-0">
            🀄
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Mahjong (Mojang)</span>
                {gameMode === 'levels' ? (
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                    Level {currentLevelNum}: {currentLevelConfig.name}
                  </span>
                ) : (
                  <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono">
                    {gameMode === 'solo' ? 'Freies Solitär (144)' : 'Tisch-Duell'}
                  </span>
                )}
              </h2>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
              {gameMode === 'levels' && (
                <>
                  <span className="text-slate-300">{currentLevelConfig.subtitle}</span>
                  <span>•</span>
                  <span className="text-amber-400/90 font-medium">Ziel: &lt;{formatTime(currentLevelConfig.targetTime)}</span>
                  <span>•</span>
                </>
              )}
              <span className={availablePairs.length > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {availablePairs.length} freie Paare
              </span>
            </div>
          </div>
        </div>

        {/* Stats: Score, Remaining, Timer */}
        <div className="flex items-center gap-2 sm:gap-4 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl">
          {/* Score */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Punkte</span>
            <span className="text-sm sm:text-base font-black text-amber-300 font-mono">{score}</span>
          </div>

          <div className="w-px h-6 bg-slate-800" />

          {/* Remaining */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Übrig</span>
            <span className="text-sm sm:text-base font-black text-sky-400 font-mono">{remainingCount} / {totalTileCount}</span>
          </div>

          <div className="w-px h-6 bg-slate-800" />

          {/* Time */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Zeit
            </span>
            <span className="text-sm sm:text-base font-black text-white font-mono">{formatTime(elapsedSeconds)}</span>
          </div>

          {combo > 1 && (
            <>
              <div className="w-px h-6 bg-slate-800" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-orange-400 flex items-center gap-0.5 animate-pulse">
                  <Flame className="w-3 h-3 fill-current" />
                  Combo
                </span>
                <span className="text-sm sm:text-base font-black text-orange-400 font-mono">x{combo}</span>
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Level Selector Button */}
          <button
            onClick={() => setIsLevelSelectorOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Alle 25 Level ansehen & wählen"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-bold">25 Levels</span>
          </button>

          {/* Hint */}
          <button
            onClick={handleHint}
            disabled={availablePairs.length === 0}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-amber-300 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Freies Paar anzeigen (-25 Punkte)"
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Tipp</span>
          </button>

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Letzten Zug rückgängig machen"
          >
            <Undo2 className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Zurück</span>
          </button>

          {/* Shuffle */}
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Übrige Spielsteine neu mischen"
          >
            <Shuffle className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Mischen</span>
          </button>

          {/* Rules */}
          <button
            onClick={() => setIsRulesOpen(true)}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all"
            title="Mahjong-Regeln ansehen"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>

          {/* Restart */}
          <button
            onClick={() => {
              if (gameMode === 'levels') startLevel(currentLevelNum);
              else startFreePlay(layout);
            }}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all"
            title="Aktuelles Spiel neu starten"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* 2. SUB-BAR: Modes, Layouts, Theme Selector, Blocked Dimming Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        {/* Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setIsLevelSelectorOpen(true)}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              gameMode === 'levels' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>25 Level-Kampagne</span>
          </button>
          <button
            onClick={() => startFreePlay('turtle')}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              gameMode === 'solo' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>🧘 Freies Spiel (144)</span>
          </button>
          <button
            onClick={() => startDuelMode()}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              gameMode === 'duel' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tisch-Duell</span>
          </button>
        </div>

        {/* Free play layouts when in solo mode */}
        {gameMode === 'solo' && (
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Aufbau:</span>
            <button
              onClick={() => startFreePlay('turtle')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                layout === 'turtle' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              🐢 Schildkröte
            </button>
            <button
              onClick={() => startFreePlay('pyramid')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                layout === 'pyramid' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              🔺 Pyramide
            </button>
            <button
              onClick={() => startFreePlay('fortress')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                layout === 'fortress' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              🏰 Festung
            </button>
          </div>
        )}

        {/* View & Theme Options */}
        <div className="flex items-center gap-2">
          {/* Dim Blocked Toggle */}
          <button
            onClick={() => setDimBlocked(!dimBlocked)}
            className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-xl transition-all"
            title="Blockierte Steine abdunkeln"
          >
            {dimBlocked ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
            <span className="text-[11px] font-semibold hidden sm:inline">Blockierte abdunkeln</span>
          </button>

          {/* Theme Selector */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
            <Palette className="w-3.5 h-3.5 text-amber-400 ml-1.5 mr-0.5" />
            <button
              onClick={() => setTileTheme('ivory')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                tileTheme === 'ivory' ? 'bg-slate-700 text-amber-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Elfenbein
            </button>
            <button
              onClick={() => setTileTheme('emerald')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                tileTheme === 'emerald' ? 'bg-emerald-800 text-emerald-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Smaragd
            </button>
            <button
              onClick={() => setTileTheme('wood')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                tileTheme === 'wood' ? 'bg-amber-800 text-amber-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Holz
            </button>
          </div>
        </div>
      </div>

      {/* Duel players turn bar */}
      {gameMode === 'duel' && (
        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 px-2">Spieler am Tisch:</span>
          {players.map((p, idx) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                idx === activePlayerIndex
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span>{p.name}</span>
              <span className="font-mono text-white font-extrabold">{p.score} Pkt</span>
              {idx === activePlayerIndex && (
                <span className="text-[10px] bg-amber-400 text-slate-950 px-1 rounded font-black">AM ZUG</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3. NO MOVES DEADLOCK ALERT BANNER */}
      {noMovesAlert && (
        <div className="bg-rose-950/80 border border-rose-500/60 rounded-2xl p-3 flex items-center justify-between gap-3 text-rose-200 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="text-xs font-bold">
              Keine freien Paare mehr auf dem Spielfeld möglich!
            </span>
          </div>
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Jetzt mischen</span>
          </button>
        </div>
      )}

      {/* 4. MAIN 3D MAHJONG TABLE CANVAS */}
      <div className="relative w-full rounded-3xl bg-radial from-slate-900 via-slate-950 to-black border border-slate-800/80 p-2 sm:p-6 shadow-2xl overflow-x-auto min-h-[500px] flex items-center justify-center">
        {/* Felt Table Pattern Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none rounded-3xl" />

        {/* 3D Stacked Tiles Container */}
        <div
          className="relative select-none my-6 mx-auto"
          style={{
            width: `${boardWidth * 26 + 120}px`,
            height: `${boardHeight * 30 + 120}px`,
          }}
        >
          {tiles.map((tile) => {
            if (tile.matched) return null;
            const isFree = isTileFree(tile, tiles);
            const isSelected = selectedTileId === tile.id;
            const isHinted = hintedTileIds.includes(tile.id);

            // Calculate pixel position from grid units
            const posX = (tile.x - minX) * 26 + 40;
            const posY = (tile.y - minY) * 30 + 30;

            return (
              <div
                key={tile.id}
                style={{
                  position: 'absolute',
                  left: `${posX}px`,
                  top: `${posY}px`,
                }}
              >
                <MahjongTileRenderer
                  tile={tile}
                  isFree={isFree}
                  isSelected={isSelected}
                  isHinted={isHinted}
                  onClick={() => handleTileClick(tile)}
                  tileTheme={tileTheme}
                  dimBlocked={dimBlocked}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. 25-LEVEL SELECTION MODAL */}
      {isLevelSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl text-amber-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Mahjong 2026: 25 Handgefertigte Level</h3>
                  <p className="text-xs text-slate-400">
                    Freigeschaltet: {Math.min(25, progress.unlockedLevel)} / 25 Level · Meistere jede Formation für 3 Sterne!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLevelSelectorOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of 25 Levels */}
            <div className="flex-1 overflow-y-auto py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pr-1">
              {MAHJONG_LEVELS.map((lvl) => {
                const isUnlocked = lvl.levelNumber <= progress.unlockedLevel;
                const isCurrent = gameMode === 'levels' && lvl.levelNumber === currentLevelNum;
                const stars = progress.levelStars[lvl.levelNumber] || 0;
                const bestScore = progress.levelScores[lvl.levelNumber];
                const bestTime = progress.levelTimes[lvl.levelNumber];

                const diffColor =
                  lvl.difficulty === 'Leicht'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : lvl.difficulty === 'Mittel'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : lvl.difficulty === 'Schwer'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30';

                return (
                  <div
                    key={lvl.levelNumber}
                    onClick={() => {
                      if (isUnlocked) startLevel(lvl.levelNumber);
                    }}
                    className={`relative rounded-2xl p-4 border transition-all text-left flex flex-col justify-between ${
                      isUnlocked
                        ? 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700/80 cursor-pointer shadow-md hover:border-amber-400/50 hover:scale-[1.01]'
                        : 'bg-slate-950/40 border-slate-900 opacity-60 cursor-not-allowed'
                    } ${isCurrent ? 'ring-2 ring-amber-400 bg-amber-500/10' : ''}`}
                  >
                    <div>
                      {/* Top Row: Level Num, Difficulty, Stars */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-black text-xs font-mono text-white">
                            {lvl.levelNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffColor}`}>
                            {lvl.difficulty}
                          </span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((starIdx) => (
                            <Star
                              key={starIdx}
                              className={`w-3.5 h-3.5 ${
                                starIdx <= stars
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Name & Subtitle */}
                      <h4 className="font-bold text-sm text-white mb-0.5 flex items-center gap-1.5">
                        <span>{lvl.name}</span>
                        {!isUnlocked && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">{lvl.subtitle}</p>
                    </div>

                    {/* Bottom Info Bar */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{lvl.tileCount} Steine</span>
                      {isUnlocked ? (
                        bestScore ? (
                          <span className="text-amber-300 font-mono font-bold">
                            Rekord: {bestScore} Pkt
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                            <Play className="w-3 h-3 fill-current" />
                            Spielen
                          </span>
                        )
                      ) : (
                        <span className="text-slate-600">Gesperrt</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Quick Action */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Tipp: Erreiche die Zielzeit für 3 goldene Sterne!
              </span>
              <button
                onClick={() => startLevel(Math.min(25, progress.unlockedLevel))}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <span>Weiterspielen (Level {Math.min(25, progress.unlockedLevel)})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. VICTORY CELEBRATION MODAL */}
      {isVictoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-4xl mb-3 shadow-inner animate-bounce">
              🀄
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-amber-300 mb-1">
              {gameMode === 'levels' ? `Level ${currentLevelNum} gemeistert!` : 'Mahjong-Meister!'}
            </h2>

            {gameMode === 'levels' && (
              <div className="flex items-center justify-center gap-2 my-3">
                {[1, 2, 3].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`w-7 h-7 transition-all ${
                      starIdx <= earnedStars
                        ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-slate-300 mb-5">
              Du hast alle <strong className="text-white">{totalTileCount} Spielsteine</strong> erfolgreich vom Brett abgeräumt!
            </p>

            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 mb-6 text-xs grid grid-cols-2 gap-3 text-left">
              <div>
                <span className="text-slate-400">Gesamtpunkte:</span>{' '}
                <span className="font-bold text-amber-300 font-mono text-sm">{score}</span>
              </div>
              <div>
                <span className="text-slate-400">Benötigte Zeit:</span>{' '}
                <span className="font-bold text-white font-mono text-sm">{formatTime(elapsedSeconds)}</span>
              </div>
              {gameMode === 'levels' ? (
                <>
                  <div>
                    <span className="text-slate-400">Zielzeit (3★):</span>{' '}
                    <span className="font-bold text-slate-200">{formatTime(currentLevelConfig.targetTime)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Formation:</span>{' '}
                    <span className="font-bold text-amber-300">{currentLevelConfig.name}</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-slate-400">Aufbau:</span>{' '}
                    <span className="font-bold text-white capitalize">{layout}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Rückgängig:</span>{' '}
                    <span className="font-bold text-white">{history.length}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {gameMode === 'levels' && currentLevelNum < 25 && (
                <button
                  onClick={() => startLevel(currentLevelNum + 1)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Nächstes Level (Level {currentLevelNum + 1})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => {
                  if (gameMode === 'levels') startLevel(currentLevelNum);
                  else startFreePlay(layout);
                }}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs active:scale-95 transition-all"
              >
                Nochmal spielen
              </button>

              {gameMode === 'levels' && (
                <button
                  onClick={() => {
                    setIsVictoryOpen(false);
                    setIsLevelSelectorOpen(true);
                  }}
                  className="w-full py-2 rounded-2xl bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-white font-semibold text-xs transition-all"
                >
                  Zur Levelauswahl (1-25)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. OFFICIAL RULES MODAL */}
      {isRulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xl w-full shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Offizielle Mahjong (Mojang) Regeln</h3>
              </div>
              <button
                onClick={() => setIsRulesOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-slate-300 pr-1 leading-relaxed">
              <div>
                <h4 className="font-bold text-amber-300 text-sm mb-1">1. Das Spielziel</h4>
                <p>
                  Ziel des klassischen Mahjong-Solitaire ist es, alle Spielsteine der gewählten 3D-Formation paarweise vom Spielfeld abzuräumen.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 text-sm mb-1">2. Wann ist ein Stein „frei“?</h4>
                <p>Ein Stein darf nur ausgewählt und gepaart werden, wenn folgende zwei Bedingungen erfüllt sind:</p>
                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-400">
                  <li><strong>Kein aufliegender Stein:</strong> Es darf kein Stein ganz oder teilweise auf ihm liegen (auf einer höheren Ebene).</li>
                  <li><strong>Mindestens eine Seite frei:</strong> Seine linke <em>oder</em> seine rechte Seite darf nicht durch einen benachbarten Stein blockiert sein.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 text-sm mb-1">3. Die 144 Spielsteine & Kategorien</h4>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="font-bold text-white block">🎋 Bambus (1–9):</span>
                    <span className="text-slate-400">Je 4 Steine (36 Steine gesamt). Die 1 ist der traditionelle Spatz.</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="font-bold text-white block">⭕ Kreise (1–9):</span>
                    <span className="text-slate-400">Je 4 Steine (36 Steine gesamt) mit konzentrischen Kreisen.</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="font-bold text-white block">萬 Schriftzeichen (1–9):</span>
                    <span className="text-slate-400">Je 4 Steine (36 Steine gesamt) mit chinesischen Zahlen 1 bis 9.</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="font-bold text-white block">💨 Winde & 🐉 Drachen:</span>
                    <span className="text-slate-400">Ost, Süd, West, Nord (16) + Roter, Grüner & Weißer Drache (12).</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 text-sm mb-1">4. Die Sonderpaare: Blumen & Jahreszeiten</h4>
                <p>
                  <strong>🌸 Blumen</strong> (Pflaume, Orchidee, Chrysantheme, Bambus) und <strong>🍁 Jahreszeiten</strong> (Frühling, Sommer, Herbst, Winter) sind Unikate. Jede Blume kann mit <em>jeder</em> anderen Blume kombiniert werden, und jede Jahreszeit mit <em>jeder</em> anderen Jahreszeit!
                </p>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 text-sm mb-1">5. Hilfen: Tipp, Rückgängig & Mischen</h4>
                <p>
                  Solltest du einmal nicht weiterkommen, nutze die <strong>Tipp-Taste</strong>, um ein freies Paar leuchtend hervorzuheben, mache Züge mit <strong>Zurück</strong> ungeschehen oder ordne die Steine mit <strong>Mischen</strong> neu an.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsRulesOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-white transition-all mt-2"
            >
              Alles verstanden
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
