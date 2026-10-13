import React, { useState, useEffect } from 'react';
import { GameInfo } from '../../types';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { 
  Dices, 
  Layers, 
  Timer, 
  Trophy, 
  BookOpen, 
  Users, 
  Plus, 
  Minus, 
  Clock, 
  Sparkles,
  Coins,
  Compass,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { getGameImage, TABLE_BACKGROUNDS } from '../../services/gameImages';

interface CatalogQuickPlayProps {
  game: GameInfo;
  onGameEnd?: (score: number) => void;
}

export const CatalogQuickPlay: React.FC<CatalogQuickPlayProps> = ({ game, onGameEnd }) => {
  // Table Ambiance Switcher
  const [tableTheme, setTableTheme] = useState<'mahogany' | 'feltGreen' | 'hearthCozy' | 'terraceGarden'>('mahogany');

  // Multi-player scoreboard (customizable without dummy sample names)
  const [players, setPlayers] = useState([
    { name: 'You (Player 1)', score: 0, color: 'text-rose-400' },
    { name: 'Player 2', score: 0, color: 'text-amber-400' },
  ]);
  const [activeTurnIdx, setActiveTurnIdx] = useState<number>(0);

  const addPlayer = () => {
    if (players.length >= 6) return;
    sound.playClick();
    const colors = ['text-sky-400', 'text-emerald-400', 'text-purple-400', 'text-cyan-400'];
    const newIdx = players.length + 1;
    setPlayers((prev) => [
      ...prev,
      { name: `Player ${newIdx}`, score: 0, color: colors[(newIdx - 3) % colors.length] }
    ]);
  };

  const removePlayer = () => {
    if (players.length <= 2) return;
    sound.playClick();
    setPlayers((prev) => prev.slice(0, prev.length - 1));
  };

  // Interactive 3D Dice Cup
  const [diceCount, setDiceCount] = useState<number>(2);
  const [rolledDice, setRolledDice] = useState<number[]>([4, 6]);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // Card Drawer
  const [drawnCards, setDrawnCards] = useState<{ value: string; suit: string; color: string }[]>([
    { value: 'A', suit: '♠', color: 'text-slate-900' },
    { value: 'K', suit: '♥', color: 'text-rose-600' },
    { value: 'Q', suit: '♦', color: 'text-rose-600' },
  ]);

  // Coin Flipper
  const [coinResult, setCoinResult] = useState<'Heads' | 'Tails' | null>(null);
  const [isFlippingCoin, setIsFlippingCoin] = useState<boolean>(false);

  // Hourglass Sand Timer
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Game Piece Tokens
  const [selectedToken, setSelectedToken] = useState<string>('meeple');

  // Timer interval
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            sound.playReward();
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const handleRollDice = () => {
    if (isRolling) return;
    sound.playDiceRoll();
    setIsRolling(true);

    let count = 0;
    const interval = setInterval(() => {
      setRolledDice(Array.from({ length: diceCount }).map(() => Math.floor(Math.random() * 6) + 1));
      count++;
      if (count > 6) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 60);
  };

  const handleDrawCard = () => {
    sound.playCardDeal();
    const suits = [
      { s: '♠', color: 'text-slate-900' },
      { s: '♥', color: 'text-rose-600' },
      { s: '♦', color: 'text-rose-600' },
      { s: '♣', color: 'text-slate-900' },
    ];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    const chosenSuit = suits[Math.floor(Math.random() * suits.length)];
    const chosenVal = values[Math.floor(Math.random() * values.length)];

    setDrawnCards((prev) => [
      { value: chosenVal, suit: chosenSuit.s, color: chosenSuit.color },
      ...prev.slice(0, 4),
    ]);
  };

  const handleFlipCoin = () => {
    if (isFlippingCoin) return;
    sound.playReward();
    setIsFlippingCoin(true);

    setTimeout(() => {
      setCoinResult(Math.random() > 0.5 ? 'Heads' : 'Tails');
      setIsFlippingCoin(false);
    }, 500);
  };

  const adjustScore = (pIdx: number, delta: number) => {
    sound.playClick();
    setPlayers((prev) => {
      const copy = [...prev];
      copy[pIdx].score = Math.max(0, copy[pIdx].score + delta);
      return copy;
    });
  };

  const nextTurn = () => {
    sound.playClick();
    setActiveTurnIdx((prev) => (prev + 1) % players.length);
    setTimerSeconds(60);
  };

  const claimMatchWin = (pIdx: number) => {
    sound.playVictory();
    try {
      confetti({ particleCount: 100, spread: 80 });
    } catch (e) {}
    if (onGameEnd) onGameEnd(players[pIdx].score);
  };

  const diceSum = rolledDice.reduce((a, b) => a + b, 0);

  // Render 3D Dice Face
  const renderDicePips = (val: number) => {
    const pipColor = val === 1 ? 'bg-rose-600' : 'bg-slate-900';

    if (val === 1) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-rose-600 shadow-inner" />
        </div>
      );
    }
    if (val === 2) {
      return (
        <div className="w-full h-full p-1.5 flex justify-between">
          <div className={`w-3 h-3 rounded-full ${pipColor}`} />
          <div className={`w-3 h-3 rounded-full ${pipColor} self-end`} />
        </div>
      );
    }
    if (val === 3) {
      return (
        <div className="w-full h-full p-1.5 flex justify-between">
          <div className={`w-3 h-3 rounded-full ${pipColor}`} />
          <div className={`w-3 h-3 rounded-full ${pipColor} self-center`} />
          <div className={`w-3 h-3 rounded-full ${pipColor} self-end`} />
        </div>
      );
    }
    if (val === 4) {
      return (
        <div className="w-full h-full p-1.5 flex flex-col justify-between">
          <div className="flex justify-between">
            <div className={`w-3 h-3 rounded-full ${pipColor}`} />
            <div className={`w-3 h-3 rounded-full ${pipColor}`} />
          </div>
          <div className="flex justify-between">
            <div className={`w-3 h-3 rounded-full ${pipColor}`} />
            <div className={`w-3 h-3 rounded-full ${pipColor}`} />
          </div>
        </div>
      );
    }
    if (val === 5) {
      return (
        <div className="w-full h-full p-1.5 flex flex-col justify-between">
          <div className="flex justify-between">
            <div className={`w-3 h-3 rounded-full ${pipColor}`} />
            <div className={`w-3 h-3 rounded-full ${pipColor}`} />
          </div>
          <div className="flex justify-center">
            <div className={`w-3 h-3 rounded-full ${pipColor}`} />
          </div>
          <div className="flex justify-between">
            <div className={`w-3 h-3 rounded-full ${pipColor}`} />
            <div className={`w-3 h-3 rounded-full ${pipColor}`} />
          </div>
        </div>
      );
    }
    return (
      <div className="w-full h-full p-1.5 flex flex-col justify-between">
        <div className="flex justify-between">
          <div className={`w-2.5 h-2.5 rounded-full ${pipColor}`} />
          <div className={`w-2.5 h-2.5 rounded-full ${pipColor}`} />
        </div>
        <div className="flex justify-between">
          <div className={`w-2.5 h-2.5 rounded-full ${pipColor}`} />
          <div className={`w-2.5 h-2.5 rounded-full ${pipColor}`} />
        </div>
        <div className="flex justify-between">
          <div className={`w-2.5 h-2.5 rounded-full ${pipColor}`} />
          <div className={`w-2.5 h-2.5 rounded-full ${pipColor}`} />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto w-full select-none text-slate-100 space-y-4">
      
      {/* 1. HERO SHOWCASE WITH REAL GAME PHOTOGRAPHY */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-950">
          <img
            src={getGameImage(game)}
            alt={game.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter brightness-[0.85] contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

          {/* Badges on top of hero photo */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <span className="text-2xl p-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow">
              {game.icon}
            </span>
            <span className="text-xs font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-3 py-1 rounded-full shadow">
              100% Spielbar • Official Rules
            </span>
          </div>

          {/* Title & Metadata over hero photo */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white drop-shadow-md">
                {game.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-200 mt-1 font-semibold drop-shadow">
                <span className="text-amber-400">{game.players}</span>
                <span>•</span>
                <span>{game.duration}</span>
                <span>•</span>
                <span>Age {game.minAge}+</span>
                <span>•</span>
                <span className="capitalize">{game.difficulty} Difficulty</span>
              </div>
            </div>

            {/* Table Ambiance Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/60 shadow">
              <span className="text-[10px] text-slate-300 font-bold px-1.5 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-amber-400" /> Table Atmosphere:
              </span>
              {[
                { id: 'mahogany', label: '🪵 Wood' },
                { id: 'feltGreen', label: '🎲 Velvet' },
                { id: 'hearthCozy', label: '🛋️ Cozy' },
                { id: 'terraceGarden', label: '🌿 Family' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    sound.playClick();
                    setTableTheme(theme.id as any);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    tableTheme === theme.id
                      ? 'bg-amber-400 text-slate-950 shadow font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. OFFICIAL INTERNATIONAL RULES & INSTRUCTIONS */}
      <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-xs shadow-xl">
        <div className="flex items-center gap-2 font-bold text-amber-400 uppercase tracking-wider text-[11px] mb-1.5">
          <BookOpen className="w-4 h-4 text-amber-400" /> Official International Rules & Strategy Guide
        </div>
        <p className="text-slate-200 leading-relaxed mb-2 font-medium">{game.rulesSummary}</p>
        <p className="text-slate-400 italic text-[11px]">{game.description}</p>
      </div>

      {/* 3. VIRTUAL FAMILY GAME TABLE (Component Stations) */}
      <div className="relative rounded-3xl p-5 sm:p-6 border-4 border-slate-900 shadow-2xl w-full overflow-hidden bg-slate-950">
        
        {/* Real Table Atmosphere Photograph Backdrop */}
        <img
          src={TABLE_BACKGROUNDS[tableTheme]}
          alt="Table Atmosphere"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.22] contrast-125"
        />
        <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* A. 3D IVORY DICE CUP STATION */}
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                <Dices className="w-4 h-4 text-amber-400" /> 3D Ivory Dice Cup
              </span>
              <div className="flex items-center gap-1 text-[11px] bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">Dice:</span>
                {[1, 2, 3, 5].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => { sound.playClick(); setDiceCount(cnt); }}
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      diceCount === cnt ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Dice Display */}
            <div className="flex items-center justify-center gap-3 my-3 min-h-[64px]">
              {rolledDice.slice(0, diceCount).map((val, idx) => (
                <div
                  key={idx}
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-b from-white via-slate-100 to-slate-200 text-slate-900 shadow-xl border-2 border-white flex flex-col items-center justify-center transition-all ${
                    isRolling ? 'rotate-12 animate-spin' : ''
                  }`}
                  style={{
                    boxShadow: '0 8px 14px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(0,0,0,0.2)'
                  }}
                >
                  {renderDicePips(val)}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-300 font-mono">
                Sum: <strong className="text-amber-400 font-bold">{diceSum}</strong>
              </span>
              <button
                onClick={handleRollDice}
                disabled={isRolling}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition active:scale-95"
              >
                Roll {diceCount} Dice
              </button>
            </div>
          </div>

          {/* B. 52-CARD CLASSIC DECK DRAWER */}
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-rose-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-rose-400" /> 52-Card Classic Playing Deck
              </span>
              <button
                onClick={handleDrawCard}
                className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition active:scale-95"
              >
                Draw Card
              </button>
            </div>

            {/* Fanned Drawn Cards */}
            <div className="flex items-center justify-center gap-2 my-2 min-h-[70px]">
              {drawnCards.map((card, idx) => (
                <div
                  key={idx}
                  className="w-14 h-20 rounded-xl bg-white border border-slate-300 shadow-xl flex flex-col justify-between p-1.5 transform transition-transform hover:-translate-y-1"
                  style={{
                    boxShadow: '0 6px 12px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.8)'
                  }}
                >
                  <div className={`text-[11px] font-black leading-none ${card.color}`}>
                    {card.value}
                  </div>
                  <div className={`text-xl font-black text-center ${card.color}`}>
                    {card.suit}
                  </div>
                  <div className={`text-[11px] font-black self-end leading-none ${card.color}`}>
                    {card.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-slate-400 text-center">
              Click Draw to deal authentic card suits for Rummy, Hearts, Poker & Blackjack!
            </div>
          </div>

          {/* C. 3D BRASS COIN FLIPPER */}
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full border-2 border-yellow-200 shadow-xl flex items-center justify-center font-black text-xs transition-transform ${
                  isFlippingCoin ? 'animate-spin' : ''
                }`}
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #fef08a, #eab308 60%, #854d0e 100%)',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.8)',
                  color: '#451a03'
                }}
              >
                {coinResult ? coinResult[0] : '🪙'}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Brass Decision Coin</h4>
                <p className="text-[11px] text-amber-400 font-bold">
                  {coinResult ? `Outcome: ${coinResult}!` : 'Flip to determine first move'}
                </p>
              </div>
            </div>

            <button
              onClick={handleFlipCoin}
              disabled={isFlippingCoin}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition"
            >
              Flip Coin
            </button>
          </div>

          {/* D. GLASS HOURGLASS SAND TIMER */}
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/70 border border-indigo-500/50 flex items-center justify-center text-indigo-300">
                <Timer className={`w-5 h-5 ${isTimerRunning ? 'animate-pulse text-amber-400' : ''}`} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Hourglass Sand Timer</h4>
                <div className="text-sm font-mono font-black text-amber-400">
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsTimerRunning((r) => !r)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                  isTimerRunning ? 'bg-amber-500 text-slate-950' : 'bg-indigo-600 text-white'
                }`}
              >
                {isTimerRunning ? 'Pause' : 'Start Timer'}
              </button>
              <button
                onClick={() => { sound.playClick(); setTimerSeconds(60); setIsTimerRunning(false); }}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                title="Reset 60s"
              >
                ↺
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MATCH SCOREBOARD & TURN MANAGER */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-400" /> Match Scoreboard & Turn Manager
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={addPlayer}
                disabled={players.length >= 6}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] border border-slate-700 flex items-center gap-1 transition"
                title="Add Family Player"
              >
                <Plus className="w-3 h-3 text-emerald-400" /> Player
              </button>
              {players.length > 2 && (
                <button
                  onClick={removePlayer}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-[11px] border border-slate-700 flex items-center gap-1 transition"
                  title="Remove Player"
                >
                  <Minus className="w-3 h-3 text-rose-400" />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={nextTurn}
            className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1 shadow"
          >
            Next Turn ➔
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {players.map((p, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border transition-all ${
                activeTurnIdx === idx
                  ? 'bg-indigo-950/70 border-indigo-400 ring-2 ring-indigo-500/40'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`font-bold text-xs truncate ${p.color}`}>{p.name}</span>
                {activeTurnIdx === idx && (
                  <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-black">
                    TURN
                  </span>
                )}
              </div>

              <div className="text-xl font-mono font-black text-white mb-2">
                {p.score} <span className="text-xs text-slate-400 font-sans font-normal">pts</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <div className="flex gap-1">
                  <button
                    onClick={() => adjustScore(idx, -1)}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => adjustScore(idx, 1)}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => claimMatchWin(idx)}
                  className="p-1 rounded-lg hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition"
                  title="Crown Winner"
                >
                  <Trophy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
