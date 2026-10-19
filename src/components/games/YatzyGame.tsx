import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { RefreshCw, Trophy, Play, CheckCircle2, Dices, Sparkles, Bot, Users, Award, Crown } from 'lucide-react';
import { RoomParticipant } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';

interface YatzyGameProps {
  onGameEnd?: (score: number) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

type CategoryKey =
  | 'ones'
  | 'twos'
  | 'threes'
  | 'fours'
  | 'fives'
  | 'sixes'
  | 'threeOfKind'
  | 'fourOfKind'
  | 'fullHouse'
  | 'smallStraight'
  | 'largeStraight'
  | 'yatzy'
  | 'chance';

interface CategoryDef {
  key: CategoryKey;
  label: string;
  desc: string;
  section: 'upper' | 'lower';
}

const CATEGORIES: CategoryDef[] = [
  { key: 'ones', label: 'Einer', desc: 'Nur 1er zählen', section: 'upper' },
  { key: 'twos', label: 'Zweier', desc: 'Nur 2er zählen', section: 'upper' },
  { key: 'threes', label: 'Dreier', desc: 'Nur 3er zählen', section: 'upper' },
  { key: 'fours', label: 'Vierer', desc: 'Nur 4er zählen', section: 'upper' },
  { key: 'fives', label: 'Fünfer', desc: 'Nur 5er zählen', section: 'upper' },
  { key: 'sixes', label: 'Sechser', desc: 'Nur 6er zählen', section: 'upper' },
  { key: 'threeOfKind', label: 'Dreierpasch', desc: 'Mind. 3 gleiche (Summe aller Würfel)', section: 'lower' },
  { key: 'fourOfKind', label: 'Viererpasch', desc: 'Mind. 4 gleiche (Summe aller Würfel)', section: 'lower' },
  { key: 'fullHouse', label: 'Full House', desc: '3 gleiche + 2 gleiche (25 Pkt)', section: 'lower' },
  { key: 'smallStraight', label: 'Kleine Straße', desc: '4er-Folge (30 Pkt)', section: 'lower' },
  { key: 'largeStraight', label: 'Große Straße', desc: '5er-Folge (40 Pkt)', section: 'lower' },
  { key: 'yatzy', label: 'Kniffel (5er)', desc: '5 gleiche Würfel (50 Pkt)', section: 'lower' },
  { key: 'chance', label: 'Chance', desc: 'Beliebige Würfel (Summe aller Würfel)', section: 'lower' },
];

export const YatzyGame: React.FC<YatzyGameProps> = ({ 
  onGameEnd,
  tableParticipants,
  currentUserId,
  onActiveTurnChange,
}) => {
  const p1 = tableParticipants?.[0];
  const p2 = tableParticipants?.[1];
  const p1Name = p1?.name || 'Ich (Spieler 1)';
  const p2Name = p2?.name || (p2?.isBot ? 'Oma Grete (KI)' : 'Spieler 2');
  const isP2Bot = p2 ? !!p2.isBot : true;

  // Game Mode: 'solo' or 'duel'
  const [mode, setMode] = useState<'solo' | 'duel'>(() => (tableParticipants && tableParticipants.length > 1 ? 'duel' : 'duel'));
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0); // 0 = P1, 1 = P2

  const [dice, setDice] = useState<number[]>([1, 2, 3, 4, 5]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState<number>(3);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Scorecards for P1 and P2
  const [scoresP1, setScoresP1] = useState<Partial<Record<CategoryKey, number>>>({});
  const [scoresP2, setScoresP2] = useState<Partial<Record<CategoryKey, number>>>({});

  const isCurrentHuman = mode === 'solo' || activePlayerIndex === 0 || (!isP2Bot && activePlayerIndex === 1);

  // Active scorecard
  const currentScores = activePlayerIndex === 0 ? scoresP1 : scoresP2;

  useEffect(() => {
    if (onActiveTurnChange) {
      const activeP = activePlayerIndex === 0 ? p1 : p2;
      onActiveTurnChange(activeP?.id || (activePlayerIndex === 0 ? 'p1' : 'p2'));
    }
  }, [activePlayerIndex, p1?.id, p2?.id, onActiveTurnChange]);

  // Roll dice
  const rollDice = () => {
    if (rollsLeft === 0 || isRolling || gameOver) return;

    sound.playDiceRoll();
    setIsRolling(true);

    let count = 0;
    const interval = setInterval(() => {
      setDice((prev) =>
        prev.map((val, idx) => (held[idx] ? val : Math.floor(Math.random() * 6) + 1))
      );
      count++;
      if (count > 6) {
        clearInterval(interval);
        setIsRolling(false);
        setRollsLeft((r) => r - 1);
      }
    }, 60);
  };

  const toggleHold = (index: number) => {
    if (rollsLeft === 3 || isRolling || gameOver) return;
    sound.playClick();
    setHeld((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  };

  // Score calculators
  const getSumOf = (val: number) => dice.filter((d) => d === val).reduce((a, b) => a + b, 0);
  const getTotalSum = () => dice.reduce((a, b) => a + b, 0);

  const getCountMap = () => {
    const map: Record<number, number> = {};
    dice.forEach((d) => (map[d] = (map[d] || 0) + 1));
    return map;
  };

  const calculatePotentialScore = (cat: CategoryKey): number => {
    const counts = getCountMap();
    const countValues = Object.values(counts);

    switch (cat) {
      case 'ones': return getSumOf(1);
      case 'twos': return getSumOf(2);
      case 'threes': return getSumOf(3);
      case 'fours': return getSumOf(4);
      case 'fives': return getSumOf(5);
      case 'sixes': return getSumOf(6);
      case 'threeOfKind': return countValues.some((c) => c >= 3) ? getTotalSum() : 0;
      case 'fourOfKind': return countValues.some((c) => c >= 4) ? getTotalSum() : 0;
      case 'fullHouse': return (countValues.includes(3) && countValues.includes(2)) || countValues.includes(5) ? 25 : 0;
      case 'smallStraight': {
        const unique = Array.from(new Set(dice)).sort();
        const str = unique.join('');
        return str.includes('1234') || str.includes('2345') || str.includes('3456') ? 30 : 0;
      }
      case 'largeStraight': {
        const sorted = [...dice].sort().join('');
        return sorted === '12345' || sorted === '23456' ? 40 : 0;
      }
      case 'yatzy': return countValues.some((c) => c === 5) ? 50 : 0;
      case 'chance': return getTotalSum();
      default: return 0;
    }
  };

  // Compute Total, Upper, Bonus for any scorecard
  const getScorecardStats = (card: Partial<Record<CategoryKey, number>>) => {
    const upperKeys: CategoryKey[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
    const lowerKeys: CategoryKey[] = ['threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yatzy', 'chance'];

    const upperSum = upperKeys.reduce((sum, k) => sum + (card[k] || 0), 0);
    const upperBonus = upperSum >= 63 ? 35 : 0;
    const lowerSum = lowerKeys.reduce((sum, k) => sum + (card[k] || 0), 0);
    const total = upperSum + upperBonus + lowerSum;
    const filledCount = Object.keys(card).length;

    return { upperSum, upperBonus, lowerSum, total, filledCount };
  };

  const p1Stats = getScorecardStats(scoresP1);
  const p2Stats = getScorecardStats(scoresP2);

  // Handle category selection
  const selectCategory = (cat: CategoryKey) => {
    if (currentScores[cat] !== undefined || rollsLeft === 3 || isRolling || gameOver) return;

    sound.playReward();
    const scoreVal = calculatePotentialScore(cat);

    if (activePlayerIndex === 0) {
      const nextScores = { ...scoresP1, [cat]: scoreVal };
      setScoresP1(nextScores);

      // Check if finished
      if (mode === 'solo' && Object.keys(nextScores).length === 13) {
        finishGame(nextScores, scoresP2);
        return;
      }

      // If duel, switch to P2
      if (mode === 'duel') {
        if (Object.keys(nextScores).length === 13 && Object.keys(scoresP2).length === 13) {
          finishGame(nextScores, scoresP2);
          return;
        }
        switchToPlayer(1);
      }
    } else {
      const nextScores = { ...scoresP2, [cat]: scoreVal };
      setScoresP2(nextScores);

      if (Object.keys(scoresP1).length === 13 && Object.keys(nextScores).length === 13) {
        finishGame(scoresP1, nextScores);
        return;
      }
      switchToPlayer(0);
    }
  };

  const switchToPlayer = (nextIndex: number) => {
    setActivePlayerIndex(nextIndex);
    setRollsLeft(3);
    setHeld([false, false, false, false, false]);
    setDice([1, 2, 3, 4, 5]);
  };

  const finishGame = (p1Card: Partial<Record<CategoryKey, number>>, p2Card: Partial<Record<CategoryKey, number>>) => {
    setGameOver(true);
    sound.playVictory();
    try {
      confetti({ particleCount: 120, spread: 80 });
    } catch (e) {}

    const s1 = getScorecardStats(p1Card).total;
    const s2 = getScorecardStats(p2Card).total;
    if (onGameEnd) {
      onGameEnd(s1 >= s2 ? s1 : s2);
    }
  };

  // AI Turn Logic for Bot
  useEffect(() => {
    if (mode !== 'duel' || activePlayerIndex !== 1 || !isP2Bot || gameOver) return;

    let isSubscribed = true;

    const runAiTurn = async () => {
      // Step 1: AI Rolls first time if rollsLeft === 3
      if (rollsLeft === 3 && !isRolling) {
        await new Promise((r) => setTimeout(r, 800));
        if (!isSubscribed) return;
        rollDice();
      } else if (rollsLeft > 0 && !isRolling) {
        // AI decides whether to hold and roll again
        await new Promise((r) => setTimeout(r, 1000));
        if (!isSubscribed) return;

        // Check for Yatzy or large straight
        const counts = getCountMap();
        const maxFreq = Math.max(...Object.values(counts));

        if (maxFreq >= 4 || calculatePotentialScore('largeStraight') === 40) {
          // Excellent result! Pick category immediately
          pickBestCategoryForAi();
        } else {
          // Hold the most frequent dice
          let targetVal = 1;
          for (let v = 6; v >= 1; v--) {
            if (counts[v] === maxFreq) {
              targetVal = v;
              break;
            }
          }
          setHeld(dice.map((d) => d === targetVal));
          await new Promise((r) => setTimeout(r, 500));
          if (!isSubscribed) return;
          rollDice();
        }
      } else if (rollsLeft === 0 && !isRolling) {
        // Final roll -> Pick optimal category
        await new Promise((r) => setTimeout(r, 900));
        if (!isSubscribed) return;
        pickBestCategoryForAi();
      }
    };

    const pickBestCategoryForAi = () => {
      // Find open categories
      const available = CATEGORIES.filter((c) => scoresP2[c.key] === undefined);
      if (available.length === 0) return;

      // Score each
      let bestCat = available[0].key;
      let highestScore = -1;

      for (const cat of available) {
        const potential = calculatePotentialScore(cat.key);
        // Prioritize Yatzy
        if (cat.key === 'yatzy' && potential === 50) {
          bestCat = 'yatzy';
          break;
        }
        if (potential > highestScore) {
          highestScore = potential;
          bestCat = cat.key;
        }
      }

      // If highest score is 0, sacrifice ones or twos or chance
      if (highestScore === 0) {
        const sacrifices: CategoryKey[] = ['ones', 'twos', 'threes', 'fourOfKind', 'yatzy'];
        for (const sac of sacrifices) {
          if (scoresP2[sac] === undefined) {
            bestCat = sac;
            break;
          }
        }
      }

      selectCategory(bestCat);
    };

    runAiTurn();

    return () => {
      isSubscribed = false;
    };
  }, [activePlayerIndex, rollsLeft, isRolling, mode, isP2Bot, gameOver, dice]);

  const resetGame = () => {
    sound.playClick();
    setDice([1, 2, 3, 4, 5]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setScoresP1({});
    setScoresP2({});
    setActivePlayerIndex(0);
    setGameOver(false);
  };

  // Render 3D Dice Face
  const render3DDiceFace = (val: number) => {
    const pipColor = val === 1 ? 'bg-rose-600' : 'bg-slate-900';

    return (
      <div className="relative w-full h-full p-2 flex flex-col justify-between">
        {val === 1 && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-rose-600 shadow-inner ring-1 ring-rose-400" />
          </div>
        )}
        {val === 2 && (
          <div className="w-full h-full flex justify-between">
            <div className={`w-3.5 h-3.5 rounded-full ${pipColor} shadow-inner self-start`} />
            <div className={`w-3.5 h-3.5 rounded-full ${pipColor} shadow-inner self-end`} />
          </div>
        )}
        {val === 3 && (
          <div className="w-full h-full flex justify-between">
            <div className={`w-3.5 h-3.5 rounded-full ${pipColor} shadow-inner self-start`} />
            <div className={`w-3.5 h-3.5 rounded-full ${pipColor} shadow-inner self-center`} />
            <div className={`w-3.5 h-3.5 rounded-full ${pipColor} shadow-inner self-end`} />
          </div>
        )}
        {val === 4 && (
          <div className="w-full h-full flex flex-col justify-between">
            <div className="flex justify-between">
              <div className={`w-3.5 h-3.5 rounded-full ${pipColor} shadow-inner`} />
              <div className={`w-3.5 h-3.5 rounded-full ${pipColor} shadow-inner`} />
            </div>
            <div className="flex justify-between">
              <div className={`w-3.5 h-3.5 rounded-full ${pipColor} shadow-inner`} />
              <div className={`w-3.5 h-3.5 rounded-full ${pipColor} shadow-inner`} />
            </div>
          </div>
        )}
        {val === 5 && (
          <div className="w-full h-full flex flex-col justify-between">
            <div className="flex justify-between">
              <div className={`w-3.5 h-3.5 rounded-full ${pipColor} shadow-inner`} />
              <div className={`w-3.5 h-3.5 rounded-full ${pipColor} shadow-inner`} />
            </div>
            <div className="flex justify-center">
              <div className={`w-3.5 h-3.5 rounded-full ${pipColor} shadow-inner`} />
            </div>
            <div className="flex justify-between">
              <div className={`w-3.5 h-3.5 rounded-full ${pipColor} shadow-inner`} />
              <div className={`w-3.5 h-3.5 rounded-full ${pipColor} shadow-inner`} />
            </div>
          </div>
        )}
        {val === 6 && (
          <div className="w-full h-full flex flex-col justify-between">
            <div className="flex justify-between">
              <div className={`w-3 h-3 rounded-full ${pipColor} shadow-inner`} />
              <div className={`w-3 h-3 rounded-full ${pipColor} shadow-inner`} />
            </div>
            <div className="flex justify-between">
              <div className={`w-3 h-3 rounded-full ${pipColor} shadow-inner`} />
              <div className={`w-3 h-3 rounded-full ${pipColor} shadow-inner`} />
            </div>
            <div className="flex justify-between">
              <div className={`w-3 h-3 rounded-full ${pipColor} shadow-inner`} />
              <div className={`w-3 h-3 rounded-full ${pipColor} shadow-inner`} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto w-full select-none text-slate-100">
      {/* Top Banner: Mode switcher, Player Cards, Upper Bonus Progress */}
      <div className="w-full bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl mb-3 text-xs shadow-xl space-y-3 backdrop-blur-md">
        {/* Header Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg shadow">
              🎲
            </div>
            <div>
              <h3 className="font-black text-sm text-white">Kniffel (Yatzy) 2026</h3>
              <p className="text-[10px] text-slate-400">Offizieller 13-Felder Gewinnblock mit 35-Punkte-Bonus</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setMode(mode === 'duel' ? 'solo' : 'duel');
                resetGame();
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 flex items-center gap-1 transition"
            >
              {mode === 'duel' ? <Users className="w-3.5 h-3.5 text-amber-400" /> : <Trophy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{mode === 'duel' ? 'Tisch-Duell' : 'Solo-Highscore'}</span>
            </button>
            <button
              onClick={resetGame}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Neu starten"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Players Turn Bar */}
        <div className="grid grid-cols-2 gap-3">
          {/* P1 Card */}
          <div
            className={`p-2.5 rounded-xl border transition-all ${
              activePlayerIndex === 0 && !gameOver
                ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/30'
                : 'bg-slate-950/40 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-white truncate">{p1Name}</span>
              {activePlayerIndex === 0 && !gameOver && (
                <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-black animate-pulse">AM WÜRFELN</span>
              )}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-slate-400">{p1Stats.filledCount}/13 Felder</span>
              <span className="font-mono text-base font-black text-amber-400">{p1Stats.total} Pkt</span>
            </div>
            {/* Upper bonus tracker */}
            <div className="mt-1.5">
              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                <span>Oberer Bonus ({p1Stats.upperSum}/63):</span>
                <span className={p1Stats.upperBonus > 0 ? 'text-emerald-400 font-bold' : ''}>
                  {p1Stats.upperBonus > 0 ? '+35 Pkt erobert!' : `${Math.max(0, 63 - p1Stats.upperSum)} fehlen`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((p1Stats.upperSum / 63) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* P2 Card / Duel */}
          {mode === 'duel' ? (
            <div
              className={`p-2.5 rounded-xl border transition-all ${
                activePlayerIndex === 1 && !gameOver
                  ? 'bg-indigo-500/15 border-indigo-400 ring-2 ring-indigo-400/30'
                  : 'bg-slate-950/40 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-white truncate flex items-center gap-1">
                  {isP2Bot && <Bot className="w-3 h-3 text-indigo-400" />}
                  <span>{p2Name}</span>
                </span>
                {activePlayerIndex === 1 && !gameOver && (
                  <span className="text-[9px] bg-indigo-400 text-slate-950 px-1 rounded font-black animate-pulse">AM WÜRFELN</span>
                )}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-slate-400">{p2Stats.filledCount}/13 Felder</span>
                <span className="font-mono text-base font-black text-indigo-300">{p2Stats.total} Pkt</span>
              </div>
              {/* Upper bonus tracker */}
              <div className="mt-1.5">
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Oberer Bonus ({p2Stats.upperSum}/63):</span>
                  <span className={p2Stats.upperBonus > 0 ? 'text-emerald-400 font-bold' : ''}>
                    {p2Stats.upperBonus > 0 ? '+35 Pkt erobert!' : `${Math.max(0, 63 - p2Stats.upperSum)} fehlen`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((p2Stats.upperSum / 63) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 flex flex-col justify-center text-center">
              <span className="text-[11px] text-slate-400">Solo Rekordjagd</span>
              <span className="text-xs font-bold text-amber-300 mt-1">Erreiche über 300 Punkte!</span>
            </div>
          )}
        </div>
      </div>

      {/* Dice Arena & Roll Button */}
      <div className="w-full bg-slate-900 border border-slate-800 p-4 rounded-3xl mb-3 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-slate-800/40 via-transparent to-transparent pointer-events-none" />

        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-slate-400">
            {rollsLeft === 3 ? 'Klicke auf Würfeln zum Starten' : 'Klicke auf Würfel, um sie zu behalten (Hold):'}
          </span>
          <span className="text-xs font-mono font-bold bg-slate-800 px-2.5 py-1 rounded-full text-amber-300 border border-slate-700">
            {rollsLeft} {rollsLeft === 1 ? 'Wurf übrig' : 'Würfe übrig'}
          </span>
        </div>

        {/* 5 Dice Display */}
        <div className="flex justify-center gap-3 sm:gap-4 my-2">
          {dice.map((val, idx) => {
            const isHeld = held[idx];
            return (
              <button
                key={idx}
                onClick={() => toggleHold(idx)}
                disabled={rollsLeft === 3 || isRolling || !isCurrentHuman}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl transition-all transform duration-150 relative ${
                  isRolling && !isHeld ? 'animate-bounce' : ''
                } ${
                  isHeld
                    ? 'ring-4 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] -translate-y-2'
                    : 'hover:-translate-y-1'
                } bg-gradient-to-br from-amber-50 to-slate-200 border-2 border-slate-300 shadow-xl`}
              >
                {render3DDiceFace(val)}
                {isHeld && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center border border-white">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Roll Action Button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={rollDice}
            disabled={rollsLeft === 0 || isRolling || !isCurrentHuman}
            className={`px-8 py-3 rounded-2xl font-black text-sm tracking-wide shadow-xl flex items-center gap-2 transition-all active:scale-95 ${
              rollsLeft === 0 || isRolling || !isCurrentHuman
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 cursor-pointer border border-amber-300'
            }`}
          >
            <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
            <span>
              {isRolling
                ? 'Würfelt...'
                : !isCurrentHuman
                ? `${p2Name} überlegt...`
                : rollsLeft === 3
                ? '1. Wurf starten'
                : rollsLeft === 0
                ? 'Trage das Ergebnis unten ein'
                : `${4 - rollsLeft}. Wurf ausführen`}
            </span>
          </button>
        </div>
      </div>

      {/* Official 13-Categories Scorecard Block */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
          <span>Kategorie</span>
          <div className="flex items-center gap-6">
            <span className={activePlayerIndex === 0 ? 'text-amber-400 font-extrabold' : ''}>{p1Name.split(' ')[0]}</span>
            {mode === 'duel' && (
              <span className={activePlayerIndex === 1 ? 'text-indigo-400 font-extrabold' : ''}>{p2Name.split(' ')[0]}</span>
            )}
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-1.5 text-xs">
          {CATEGORIES.map((cat, idx) => {
            const p1Val = scoresP1[cat.key];
            const p2Val = scoresP2[cat.key];
            const isP1Filled = p1Val !== undefined;
            const isP2Filled = p2Val !== undefined;

            const isCurrentFilled = currentScores[cat.key] !== undefined;
            const potential = calculatePotentialScore(cat.key);
            const canSelect = !isCurrentFilled && rollsLeft < 3 && !isRolling && isCurrentHuman;

            return (
              <div
                key={cat.key}
                onClick={() => {
                  if (canSelect) selectCategory(cat.key);
                }}
                className={`flex items-center justify-between p-2 rounded-xl transition-all border ${
                  canSelect
                    ? 'hover:bg-amber-500/10 hover:border-amber-500/40 cursor-pointer border-slate-800/80 bg-slate-950/30'
                    : isCurrentFilled
                    ? 'border-slate-800/40 bg-slate-950/20 opacity-80'
                    : 'border-slate-800/40 bg-slate-950/10 opacity-50'
                }`}
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{cat.label}</span>
                    {canSelect && (
                      <span className="text-[10px] text-amber-400 font-mono font-bold">
                        (+{potential} Pkt)
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">{cat.desc}</div>
                </div>

                <div className="flex items-center gap-6 font-mono font-bold text-sm">
                  {/* P1 Score */}
                  <div className="w-10 text-right">
                    {isP1Filled ? (
                      <span className="text-amber-300 font-black">{p1Val}</span>
                    ) : activePlayerIndex === 0 && canSelect ? (
                      <span className="text-amber-400/80 font-semibold">{potential}</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </div>

                  {/* P2 Score */}
                  {mode === 'duel' && (
                    <div className="w-10 text-right">
                      {isP2Filled ? (
                        <span className="text-indigo-300 font-black">{p2Val}</span>
                      ) : activePlayerIndex === 1 && canSelect ? (
                        <span className="text-indigo-400/80 font-semibold">{potential}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scorecard Totals Summary */}
        <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-bold">{p1Name.split(' ')[0]} Gesamt:</div>
            <div className="text-lg font-black text-amber-300 font-mono">{p1Stats.total} Pkt</div>
          </div>
          {mode === 'duel' && (
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 font-bold">{p2Name.split(' ')[0]} Gesamt:</div>
              <div className="text-lg font-black text-indigo-300 font-mono">{p2Stats.total} Pkt</div>
            </div>
          )}
        </div>
      </div>

      {/* Game Over Victory Modal */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-4xl mb-3 shadow-inner">
              👑
            </div>

            <h2 className="text-2xl font-black text-amber-300 mb-1">Kniffel-Runde beendet!</h2>

            <p className="text-xs text-slate-300 mb-4">
              {mode === 'duel'
                ? p1Stats.total > p2Stats.total
                  ? `Herzlichen Glückwunsch! ${p1Name} gewinnt mit ${p1Stats.total} zu ${p2Stats.total} Punkten!`
                  : p2Stats.total > p1Stats.total
                  ? `${p2Name} gewinnt mit ${p2Stats.total} zu ${p1Stats.total} Punkten!`
                  : `Unentschieden! Beide Spieler erreichen ${p1Stats.total} Punkte!`
                : `Du hast ${p1Stats.total} Punkte erreicht!`}
            </p>

            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 mb-6 text-xs grid grid-cols-2 gap-3 text-left">
              <div>
                <span className="text-slate-400">{p1Name}:</span>{' '}
                <span className="font-bold text-amber-300 font-mono text-sm">{p1Stats.total} Pkt</span>
              </div>
              {mode === 'duel' && (
                <div>
                  <span className="text-slate-400">{p2Name}:</span>{' '}
                  <span className="font-bold text-indigo-300 font-mono text-sm">{p2Stats.total} Pkt</span>
                </div>
              )}
            </div>

            <button
              onClick={resetGame}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl transition active:scale-95"
            >
              Neue Runde starten
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
