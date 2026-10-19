import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { RefreshCw, Trophy, Brain, Sparkles, Users, Bot, Star, Clock, Flame, Palette, Layers, Award } from 'lucide-react';
import { RoomParticipant } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { svgToDataUri } from '../../services/gameImages';

interface MemoryCard {
  id: number;
  itemKey: string;
  name: string;
  photoUrl: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const makeSvgCard = (emoji: string, bg: string, label: string) =>
  svgToDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="100%" height="100%" rx="32" fill="${bg}"/>
    <circle cx="100" cy="85" r="55" fill="#ffffff" opacity="0.2"/>
    <text x="100" y="108" font-size="64" text-anchor="middle">${emoji}</text>
    <text x="100" y="165" font-family="sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">${label}</text>
  </svg>
`);

// 18 distinct items per theme (enables up to 36-card boards)
const THEMES: Record<string, { name: string; icon: string; items: { id: string; name: string; emoji: string; bg: string }[] }> = {
  animals: {
    name: 'Tiere',
    icon: '🐾',
    items: [
      { id: 'dog', name: 'Welpe', emoji: '🐶', bg: '#f59e0b' },
      { id: 'cat', name: 'Kätzchen', emoji: '🐱', bg: '#fb923c' },
      { id: 'panda', name: 'Panda', emoji: '🐼', bg: '#334155' },
      { id: 'lion', name: 'Löwe', emoji: '🦁', bg: '#eab308' },
      { id: 'fox', name: 'Fuchs', emoji: '🦊', bg: '#ea580c' },
      { id: 'penguin', name: 'Pinguin', emoji: '🐧', bg: '#0284c7' },
      { id: 'rabbit', name: 'Häschen', emoji: '🐰', bg: '#ec4899' },
      { id: 'koala', name: 'Koala', emoji: '🐨', bg: '#64748b' },
      { id: 'owl', name: 'Eule', emoji: '🦉', bg: '#78350f' },
      { id: 'wolf', name: 'Wolf', emoji: '🐺', bg: '#475569' },
      { id: 'frog', name: 'Frosch', emoji: '🐸', bg: '#16a34a' },
      { id: 'tiger', name: 'Tiger', emoji: '🐯', bg: '#d97706' },
      { id: 'bear', name: 'Bär', emoji: '🐻', bg: '#92400e' },
      { id: 'dolphin', name: 'Delfin', emoji: '🐬', bg: '#06b6d4' },
      { id: 'unicorn', name: 'Einhorn', emoji: '🦄', bg: '#a855f7' },
      { id: 'elephant', name: 'Elefant', emoji: '🐘', bg: '#64748b' },
      { id: 'monkey', name: 'Affe', emoji: '🐵', bg: '#b45309' },
      { id: 'giraffe', name: 'Giraffe', emoji: '🦒', bg: '#ca8a04' },
    ],
  },
  sweets: {
    name: 'Früchte & Sweets',
    icon: '🍓',
    items: [
      { id: 'strawberry', name: 'Erdbeere', emoji: '🍓', bg: '#e11d48' },
      { id: 'banana', name: 'Banane', emoji: '🍌', bg: '#eab308' },
      { id: 'cherry', name: 'Kirschen', emoji: '🍒', bg: '#be123c' },
      { id: 'apple', name: 'Apfel', emoji: '🍎', bg: '#dc2626' },
      { id: 'grape', name: 'Traube', emoji: '🍇', bg: '#7e22ce' },
      { id: 'watermelon', name: 'Melone', emoji: '🍉', bg: '#15803d' },
      { id: 'donut', name: 'Donut', emoji: '🍩', bg: '#d97706' },
      { id: 'icecream', name: 'Eiscreme', emoji: '🍦', bg: '#ec4899' },
      { id: 'cake', name: 'Torte', emoji: '🎂', bg: '#f43f5e' },
      { id: 'candy', name: 'Bonbon', emoji: '🍬', bg: '#8b5cf6' },
      { id: 'chocolate', name: 'Schoko', emoji: '🍫', bg: '#78350f' },
      { id: 'cookie', name: 'Keks', emoji: '🍪', bg: '#b45309' },
      { id: 'pizza', name: 'Pizza', emoji: '🍕', bg: '#ea580c' },
      { id: 'burger', name: 'Burger', emoji: '🍔', bg: '#ca8a04' },
      { id: 'popcorn', name: 'Popcorn', emoji: '🍿', bg: '#eab308' },
      { id: 'lollipop', name: 'Lutscher', emoji: '🍭', bg: '#06b6d4' },
      { id: 'croissant', name: 'Croissant', emoji: '🥐', bg: '#d97706' },
      { id: 'pretzel', name: 'Brezel', emoji: '🥨', bg: '#92400e' },
    ],
  },
  space: {
    name: 'Weltall',
    icon: '🚀',
    items: [
      { id: 'rocket', name: 'Rakete', emoji: '🚀', bg: '#dc2626' },
      { id: 'earth', name: 'Erde', emoji: '🌍', bg: '#2563eb' },
      { id: 'saturn', name: 'Saturn', emoji: '🪐', bg: '#d97706' },
      { id: 'moon', name: 'Mond', emoji: '🌙', bg: '#eab308' },
      { id: 'sun', name: 'Sonne', emoji: '☀️', bg: '#f59e0b' },
      { id: 'star', name: 'Stern', emoji: '⭐', bg: '#fbbf24' },
      { id: 'astronaut', name: 'Astronaut', emoji: '👨‍🚀', bg: '#475569' },
      { id: 'satellite', name: 'Satellit', emoji: '🛰️', bg: '#64748b' },
      { id: 'meteor', name: 'Meteorit', emoji: '☄️', bg: '#ea580c' },
      { id: 'ufo', name: 'UFO', emoji: '🛸', bg: '#10b981' },
      { id: 'telescope', name: 'Teleskop', emoji: '🔭', bg: '#6366f1' },
      { id: 'galaxy', name: 'Galaxie', emoji: '🌌', bg: '#8b5cf6' },
      { id: 'crystal', name: 'Kristall', emoji: '💎', bg: '#06b6d4' },
      { id: 'alien', name: 'Alien', emoji: '👽', bg: '#22c55e' },
      { id: 'robot', name: 'Roboter', emoji: '🤖', bg: '#3b82f6' },
      { id: 'radar', name: 'Radar', emoji: '📡', bg: '#64748b' },
      { id: 'fire', name: 'Schweif', emoji: '🔥', bg: '#f97316' },
      { id: 'laser', name: 'Laser', emoji: '⚡', bg: '#eab308' },
    ],
  },
  gaming: {
    name: 'Gaming & Fantasy',
    icon: '🎮',
    items: [
      { id: 'controller', name: 'Gamepad', emoji: '🎮', bg: '#6366f1' },
      { id: 'diamond', name: 'Diamant', emoji: '💎', bg: '#06b6d4' },
      { id: 'sword', name: 'Schwert', emoji: '⚔️', bg: '#dc2626' },
      { id: 'shield', name: 'Schild', emoji: '🛡️', bg: '#3b82f6' },
      { id: 'potion', name: 'Heiltrank', emoji: '🧪', bg: '#10b981' },
      { id: 'coin', name: 'Goldmünze', emoji: '🪙', bg: '#eab308' },
      { id: 'heart', name: 'Leben', emoji: '❤️', bg: '#ef4444' },
      { id: 'trophy', name: 'Pokal', emoji: '🏆', bg: '#f59e0b' },
      { id: 'crown', name: 'Krone', emoji: '👑', bg: '#eab308' },
      { id: 'key', name: 'Schlüssel', emoji: '🔑', bg: '#f97316' },
      { id: 'chest', name: 'Truhe', emoji: '📦', bg: '#854d0e' },
      { id: 'magic', name: 'Zauberstab', emoji: '🪄', bg: '#8b5cf6' },
      { id: 'gem', name: 'Rubin', emoji: '🔮', bg: '#a855f7' },
      { id: 'dice', name: 'Glückswürfel', emoji: '🎲', bg: '#ec4899' },
      { id: 'skull', name: 'Boss', emoji: '💀', bg: '#334155' },
      { id: 'bomb', name: 'Bombe', emoji: '💣', bg: '#1e293b' },
      { id: 'scroll', name: 'Schriftrolle', emoji: '📜', bg: '#b45309' },
      { id: 'ring', name: 'Ring der Macht', emoji: '💍', bg: '#0284c7' },
    ],
  },
};

interface MemoryMatchGameProps {
  onGameEnd?: (movesOrWinner: any) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ 
  onGameEnd,
  tableParticipants,
  currentUserId,
  onActiveTurnChange,
}) => {
  const p1 = tableParticipants?.[0];
  const p2 = tableParticipants?.[1];
  const p1Name = p1?.name || 'Spieler 1';
  const p2Name = p2?.name || (p2?.isBot ? 'Gedächtnis-KI' : 'Spieler 2');
  const isP2Bot = p2 ? !!p2.isBot : true;

  // Settings
  const [themeKey, setThemeKey] = useState<string>('animals');
  const [totalCardsCount, setTotalCardsCount] = useState<number>(16); // 12, 16, 24, 36
  const [mode, setMode] = useState<'solo' | 'duel'>('solo');

  // Game state
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });

  // Combo & Timer
  const [combo, setCombo] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(true);
  const [earnedStars, setEarnedStars] = useState<number>(3);

  const totalPairs = totalCardsCount / 2;

  // Deck generator
  const createDeck = (theme: string, count: number) => {
    const themeDef = THEMES[theme] || THEMES.animals;
    const requiredPairs = count / 2;
    const chosenItems = themeDef.items.slice(0, requiredPairs);

    const paired = [...chosenItems, ...chosenItems].map((item, idx) => ({
      id: idx,
      itemKey: item.id,
      name: item.name,
      photoUrl: makeSvgCard(item.emoji, item.bg, item.name),
      isFlipped: false,
      isMatched: false,
    }));

    // Fisher-Yates shuffle
    for (let i = paired.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [paired[i], paired[j]] = [paired[j], paired[i]];
    }

    return paired;
  };

  // Initialize or reset game
  const initGame = (t = themeKey, cnt = totalCardsCount) => {
    sound.playCardDeal();
    setCards(createDeck(t, cnt));
    setFlippedIndices([]);
    setMoves(0);
    setMatchedPairs(0);
    setIsLocked(false);
    setGameOver(false);
    setCurrentTurn(1);
    setScores({ p1: 0, p2: 0 });
    setCombo(0);
    setElapsedSeconds(0);
    setIsTimerActive(true);
    setEarnedStars(3);
  };

  useEffect(() => {
    initGame(themeKey, totalCardsCount);
  }, [themeKey, totalCardsCount]);

  // Timer interval
  useEffect(() => {
    if (!isTimerActive || gameOver) return;
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerActive, gameOver]);

  // Sync turn in duel
  useEffect(() => {
    if (onActiveTurnChange && mode === 'duel') {
      const activeId = currentTurn === 1 ? (p1?.id || 'p1') : (p2?.id || 'p2');
      onActiveTurnChange(activeId);
    }
  }, [currentTurn, p1?.id, p2?.id, mode, onActiveTurnChange]);

  // Handle card click
  const handleCardClick = (idx: number) => {
    if (isLocked || cards[idx].isFlipped || cards[idx].isMatched || gameOver) return;
    if (mode === 'duel' && currentTurn === 2 && isP2Bot) return; // AI is playing

    flipCard(idx);
  };

  const flipCard = (idx: number) => {
    sound.playClick();
    const newCards = [...cards];
    newCards[idx].isFlipped = true;
    setCards(newCards);

    const nextFlipped = [...flippedIndices, idx];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setIsLocked(true);
      setMoves((m) => m + 1);

      const [firstIdx, secondIdx] = nextFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.itemKey === secondCard.itemKey) {
        // MATCH!
        setTimeout(() => {
          sound.playPieceDrop();
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c
            )
          );
          setFlippedIndices([]);
          setIsLocked(false);
          const newMatched = matchedPairs + 1;
          setMatchedPairs(newMatched);

          const newCombo = combo + 1;
          setCombo(newCombo);
          if (newCombo >= 2) {
            sound.playReward();
          }

          if (mode === 'duel') {
            setScores((s) => ({
              ...s,
              [currentTurn === 1 ? 'p1' : 'p2']: s[currentTurn === 1 ? 'p1' : 'p2'] + 1,
            }));
            // Same player gets another turn upon matching in duel!
          }

          if (newMatched === totalPairs) {
            handleVictory();
          }
        }, 500);
      } else {
        // MISMATCH
        setCombo(0);
        setTimeout(() => {
          sound.playCardDeal();
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
          setIsLocked(false);

          if (mode === 'duel') {
            setCurrentTurn((t) => (t === 1 ? 2 : 1));
          }
        }, 1100);
      }
    }
  };

  // AI turn logic
  useEffect(() => {
    if (mode !== 'duel' || currentTurn !== 2 || !isP2Bot || gameOver || isLocked) return;

    const availableIndices = cards
      .map((c, i) => (!c.isFlipped && !c.isMatched ? i : -1))
      .filter((i) => i !== -1);

    if (availableIndices.length === 0) return;

    const timeout = setTimeout(() => {
      // Pick first card
      const first = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      flipCard(first);

      // Pick second card
      setTimeout(() => {
        const remaining = cards
          .map((c, i) => (i !== first && !c.isFlipped && !c.isMatched ? i : -1))
          .filter((i) => i !== -1);
        if (remaining.length > 0) {
          const second = remaining[Math.floor(Math.random() * remaining.length)];
          flipCard(second);
        }
      }, 700);
    }, 900);

    return () => clearTimeout(timeout);
  }, [currentTurn, mode, isP2Bot, isLocked, gameOver]);

  // Victory
  const handleVictory = () => {
    setGameOver(true);
    setIsTimerActive(false);
    sound.playVictory();
    try {
      confetti({ particleCount: 160, spread: 80 });
    } catch (e) {}

    // Calculate stars
    const perfectMoves = totalPairs;
    const movesTaken = moves + 1;
    let stars = 1;
    if (movesTaken <= Math.round(perfectMoves * 1.4)) stars = 3;
    else if (movesTaken <= Math.round(perfectMoves * 1.9)) stars = 2;
    setEarnedStars(stars);

    if (onGameEnd) {
      if (mode === 'duel') {
        const winner = scores.p1 >= scores.p2 ? p1Name : p2Name;
        onGameEnd(winner);
      } else {
        onGameEnd(movesTaken);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Grid columns class based on count
  const gridClass =
    totalCardsCount === 12
      ? 'grid-cols-4 max-w-lg'
      : totalCardsCount === 16
      ? 'grid-cols-4 max-w-xl'
      : totalCardsCount === 24
      ? 'grid-cols-6 max-w-3xl'
      : 'grid-cols-6 max-w-4xl';

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto w-full select-none text-slate-100">
      {/* Header Bar: Themes, Card Count Selector, Mode */}
      <div className="w-full bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl mb-3 shadow-xl backdrop-blur-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
          {/* Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl shadow">
              🧠
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                <span>Tier- & Bild-Memory</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono border border-purple-500/30">
                  {totalCardsCount} Karten ({totalPairs} Paare)
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Merke dir die Positionen und decke identische Paare auf</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode(mode === 'solo' ? 'duel' : 'solo')}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition"
            >
              {mode === 'duel' ? <Users className="w-3.5 h-3.5 text-amber-400" /> : <Brain className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{mode === 'duel' ? 'Tisch-Duell' : 'Solo-Training'}</span>
            </button>
            <button
              onClick={() => initGame()}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Neu mischen & starten"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Sub-bar: Theme Selector & Board Size Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Themes */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 flex items-center gap-1">
              <Palette className="w-3 h-3 text-amber-400" />
              Motiv:
            </span>
            {Object.entries(THEMES).map(([k, t]) => (
              <button
                key={k}
                onClick={() => setThemeKey(k)}
                className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition ${
                  themeKey === k ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.icon} {t.name}
              </button>
            ))}
          </div>

          {/* Board Size (12, 16, 24, 36) */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              Größe:
            </span>
            {[
              { cnt: 12, label: '12 (Leicht)' },
              { cnt: 16, label: '16 (Klassik)' },
              { cnt: 24, label: '24 (Meister)' },
              { cnt: 36, label: '36 (Profi)' },
            ].map(({ cnt, label }) => (
              <button
                key={cnt}
                onClick={() => setTotalCardsCount(cnt)}
                className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition ${
                  totalCardsCount === cnt ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Live HUD: Moves, Pairs Found, Time, Combo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
          <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Züge</span>
            <span className="font-mono text-base font-black text-white">{moves}</span>
          </div>

          <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Paare gefunden</span>
            <span className="font-mono text-base font-black text-amber-400">
              {matchedPairs} / {totalPairs}
            </span>
          </div>

          <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Zeit
            </span>
            <span className="font-mono text-base font-black text-sky-400">{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {mode === 'duel' ? 'Punkte-Duell' : 'Combo'}
            </span>
            {mode === 'duel' ? (
              <span className="font-mono text-xs font-black text-emerald-400">
                {p1Name.split(' ')[0]}: {scores.p1} | {p2Name.split(' ')[0]}: {scores.p2}
              </span>
            ) : (
              <span className={`font-mono text-base font-black flex items-center justify-center gap-1 ${combo > 1 ? 'text-orange-400 animate-pulse' : 'text-slate-500'}`}>
                {combo > 1 && <Flame className="w-3.5 h-3.5 fill-current" />}
                x{Math.max(1, combo)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Duel Player Turn Notification */}
      {mode === 'duel' && (
        <div className="w-full bg-slate-900/60 border border-slate-800 p-2 rounded-xl mb-3 flex items-center justify-between text-xs px-4">
          <span className="text-slate-400">Aktiver Zug:</span>
          <div className="flex items-center gap-2 font-bold">
            <span className={currentTurn === 1 ? 'text-amber-400 font-extrabold' : 'text-slate-500'}>
              {p1Name} ({scores.p1} Paare)
            </span>
            <span className="text-slate-600">vs</span>
            <span className={currentTurn === 2 ? 'text-indigo-400 font-extrabold flex items-center gap-1' : 'text-slate-500 flex items-center gap-1'}>
              {isP2Bot && <Bot className="w-3 h-3" />}
              {p2Name} ({scores.p2} Paare)
            </span>
          </div>
        </div>
      )}

      {/* 3D Interactive Card Grid */}
      <div className="w-full rounded-3xl bg-slate-950/80 border border-slate-800 p-4 sm:p-6 shadow-2xl flex items-center justify-center min-h-[420px]">
        <div className={`grid ${gridClass} gap-3 sm:gap-4 w-full mx-auto`}>
          {cards.map((card, idx) => {
            const isFlipped = card.isFlipped || card.isMatched;

            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(idx)}
                className={`aspect-square rounded-2xl cursor-pointer transition-all duration-300 transform perspective-1000 ${
                  card.isMatched
                    ? 'opacity-80 scale-95 shadow-none'
                    : 'hover:scale-[1.03] active:scale-95 shadow-lg hover:shadow-purple-500/20'
                }`}
              >
                <div
                  className={`relative w-full h-full rounded-2xl border-2 transition-transform duration-300 flex items-center justify-center ${
                    isFlipped
                      ? 'border-purple-400/80 bg-slate-900'
                      : 'border-slate-700 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 hover:border-purple-500'
                  }`}
                >
                  {isFlipped ? (
                    <img
                      src={card.photoUrl}
                      alt={card.name}
                      className="w-full h-full object-cover rounded-2xl select-none"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 group-hover:text-purple-300 transition-colors">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center font-black text-base text-purple-400">
                        ?
                      </div>
                    </div>
                  )}

                  {card.isMatched && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-black shadow border border-white">
                      ✓
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Victory Celebration Modal */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-purple-400 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-4xl mb-3 shadow-inner">
              🏆
            </div>

            <h2 className="text-2xl font-black text-purple-300 mb-1">
              {mode === 'duel'
                ? scores.p1 > scores.p2
                  ? `${p1Name} gewinnt!`
                  : scores.p2 > scores.p1
                  ? `${p2Name} gewinnt!`
                  : 'Unentschieden!'
                : 'Fantastisch gelöst!'}
            </h2>

            {mode === 'solo' && (
              <div className="flex justify-center gap-1 my-3">
                {[1, 2, 3].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`w-7 h-7 ${
                      starIdx <= earnedStars
                        ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-slate-300 mb-5">
              {mode === 'duel'
                ? `Endstand: ${p1Name} ${scores.p1} : ${scores.p2} ${p2Name}`
                : `Du hast alle ${totalPairs} Paare in ${moves} Zügen und ${formatTime(elapsedSeconds)} aufgedeckt!`}
            </p>

            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 mb-6 text-xs grid grid-cols-2 gap-3 text-left">
              <div>
                <span className="text-slate-400">Benötigte Züge:</span>{' '}
                <span className="font-bold text-amber-300 font-mono text-sm">{moves}</span>
              </div>
              <div>
                <span className="text-slate-400">Benötigte Zeit:</span>{' '}
                <span className="font-bold text-white font-mono text-sm">{formatTime(elapsedSeconds)}</span>
              </div>
              <div>
                <span className="text-slate-400">Gewähltes Motiv:</span>{' '}
                <span className="font-bold text-white capitalize">{THEMES[themeKey].name}</span>
              </div>
              <div>
                <span className="text-slate-400">Kartengröße:</span>{' '}
                <span className="font-bold text-white">{totalCardsCount} Karten</span>
              </div>
            </div>

            <button
              onClick={() => initGame()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-sm shadow-xl transition active:scale-95"
            >
              Neue Runde spielen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
