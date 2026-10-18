import React, { useState, useEffect, useRef } from 'react';
import {
  PlacedMahjongTile,
  MahjongLayoutType,
  generateMahjongBoard,
  isTileFree,
  findAvailablePairs,
  canTilesMatch,
} from './mahjong/mahjongData';
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

  // Game Mode: 'solo' or 'duel'
  const [gameMode, setGameMode] = useState<'solo' | 'duel'>('solo');
  const [layout, setLayout] = useState<MahjongLayoutType>('turtle');
  const [tileTheme, setTileTheme] = useState<'ivory' | 'emerald' | 'wood'>('ivory');
  const [dimBlocked, setDimBlocked] = useState<boolean>(true);

  // Board Tiles State (144 tiles)
  const [tiles, setTiles] = useState<PlacedMahjongTile[]>(() => generateMahjongBoard('turtle'));

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
  const [noMovesAlert, setNoMovesAlert] = useState<boolean>(false);

  const activePlayer = players[activePlayerIndex];
  const isHumanTurn = gameMode === 'solo' || (activePlayer && !activePlayer.isAi);

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
  const matchedPairsCount = Math.floor((144 - remainingCount) / 2);

  // Available free pairs count
  const availablePairs = findAvailablePairs(tiles);

  // Check victory or deadlock
  useEffect(() => {
    if (remainingCount === 0 && !isVictoryOpen) {
      setIsVictoryOpen(true);
      sound.playVictory();
      confetti({ particleCount: 180, spread: 90 });
      if (onGameEnd) {
        const victorName =
          gameMode === 'duel'
            ? [...players].sort((a, b) => b.score - a.score)[0]?.name || 'Gewinner'
            : 'Solo-Meister';
        onGameEnd(victorName);
      }
    } else if (remainingCount > 0 && availablePairs.length === 0) {
      setNoMovesAlert(true);
    } else {
      setNoMovesAlert(false);
    }
  }, [remainingCount, availablePairs.length]);

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

    const matches = canTilesMatch(firstTile.definition, clickedTile.definition);

    if (matches) {
      // MATCH SUCCESSFUL!
      sound.playReward();

      // Combo management
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => {
        setCombo(0);
      }, 5000);

      // Points calculation
      const basePoints = 100;
      const comboBonus = (nextCombo - 1) * 35;
      const earned = basePoints + comboBonus;

      // Update tiles
      setTiles((prev) =>
        prev.map((t) => (t.id === firstTile.id || t.id === clickedTile.id ? { ...t, matched: true } : t))
      );

      // Record in history
      setHistory((prev) => [
        {
          tile1Id: firstTile.id,
          tile2Id: clickedTile.id,
          playerId: activePlayer.id,
          points: earned,
        },
        ...prev,
      ]);

      // Update score
      setScore((prev) => prev + earned);

      // If duel mode, update player stats and pass turn if turn-based
      if (gameMode === 'duel') {
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === activePlayerIndex
              ? { ...p, score: p.score + earned, matchedPairsCount: p.matchedPairsCount + 1 }
              : p
          )
        );
        // Switch turn to next player in duel
        setActivePlayerIndex((prev) => (prev + 1) % players.length);
      }

      setSelectedTileId(null);
    } else {
      // Match Failed: Switch selection to the newly clicked valid tile
      sound.playError();
      setSelectedTileId(clickedTile.id);
    }
  };

  // AI Turn in Duel Mode
  useEffect(() => {
    if (gameMode !== 'duel' || !activePlayer || !activePlayer.isAi || isVictoryOpen) return;

    const timer = setTimeout(() => {
      const pairs = findAvailablePairs(tiles);
      if (pairs.length > 0) {
        // Pick a pair (slightly randomized)
        const chosen = pairs[Math.floor(Math.random() * Math.min(3, pairs.length))];
        const [t1, t2] = chosen;

        // Visual selection step 1
        setSelectedTileId(t1.id);
        sound.playClick();

        setTimeout(() => {
          // Visual match step 2
          handleTileClick(t2);
        }, 600);
      } else if (remainingCount > 0) {
        // AI shuffles if stuck
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

    // Deduct small penalty from score
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

    // Shuffle definitions
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

  // Restart / New Game
  const handleNewGame = (newLayout?: MahjongLayoutType) => {
    sound.playClick();
    const activeL = newLayout || layout;
    setLayout(activeL);
    setTiles(generateMahjongBoard(activeL));
    setSelectedTileId(null);
    setHintedTileIds([]);
    setHistory([]);
    setScore(0);
    setCombo(0);
    setElapsedSeconds(0);
    setIsVictoryOpen(false);
    setNoMovesAlert(false);
    setActivePlayerIndex(0);
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0, matchedPairsCount: 0 })));
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
        {/* Title & Mode */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center font-black text-2xl shadow-lg border border-amber-300/40">
            🀄
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Mahjong</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
                  144 Steine
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                  Mojang Edition
                </span>
              </h2>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Layout: {layout === 'turtle' ? 'Schildkröte' : layout === 'pyramid' ? 'Pyramide' : 'Festung'}</span>
              <span>•</span>
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
            <span className="text-sm sm:text-base font-black text-sky-400 font-mono">{remainingCount}</span>
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
            onClick={() => handleNewGame()}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all"
            title="Neues Spiel starten"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* 2. SUB-BAR: Layout Selection, Theme Selector, Blocked Dimming Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        {/* Layout Pills */}
        <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Aufbau:</span>
          <button
            onClick={() => handleNewGame('turtle')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              layout === 'turtle' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            🐢 Schildkröte
          </button>
          <button
            onClick={() => handleNewGame('pyramid')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              layout === 'pyramid' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            🔺 Pyramide
          </button>
          <button
            onClick={() => handleNewGame('fortress')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              layout === 'fortress' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            🏰 Festung
          </button>
        </div>

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

      {/* 5. VICTORY CELEBRATION MODAL */}
      {isVictoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-4xl mb-4 shadow-inner animate-bounce">
              🀄
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-300 mb-2">
              Mahjong-Meister!
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              Du hast alle <strong className="text-white">144 Spielsteine</strong> erfolgreich vom Brett abgeräumt!
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
              <div>
                <span className="text-slate-400">Gespielter Aufbau:</span>{' '}
                <span className="font-bold text-white capitalize">{layout}</span>
              </div>
              <div>
                <span className="text-slate-400">Rückgängig-Züge:</span>{' '}
                <span className="font-bold text-white">{history.length}</span>
              </div>
            </div>

            <button
              onClick={() => handleNewGame()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-all"
            >
              Neues Spiel starten
            </button>
          </div>
        </div>
      )}

      {/* 6. OFFICIAL RULES MODAL */}
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
                  Ziel des klassischen Mahjong-Solitaire ist es, alle <strong>144 Spielsteine</strong> paarweise vom Spielfeld abzuräumen.
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
                <h4 className="font-bold text-amber-300 text-sm mb-1">3. Die 144 Spielsteine</h4>
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
