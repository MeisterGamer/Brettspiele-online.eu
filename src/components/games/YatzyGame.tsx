import React, { useState } from 'react';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { RefreshCw, Trophy, Play, CheckCircle2, Dices, Sparkles } from 'lucide-react';
import { TABLE_BACKGROUNDS } from '../../services/gameImages';

interface YatzyGameProps {
  onGameEnd?: (score: number) => void;
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

export const YatzyGame: React.FC<YatzyGameProps> = ({ onGameEnd }) => {
  const [dice, setDice] = useState<number[]>([1, 2, 3, 4, 5]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState<number>(3);
  const [scores, setScores] = useState<Partial<Record<CategoryKey, number>>>({});
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);

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

  // Helper score calculators
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

  const selectCategory = (cat: CategoryKey) => {
    if (scores[cat] !== undefined || rollsLeft === 3 || isRolling || gameOver) return;

    sound.playReward();
    const scoreVal = calculatePotentialScore(cat);
    const newScores = { ...scores, [cat]: scoreVal };
    setScores(newScores);

    // Reset turn
    setRollsLeft(3);
    setHeld([false, false, false, false, false]);

    // Check if game complete (13 categories)
    if (Object.keys(newScores).length === 13) {
      setGameOver(true);
      sound.playVictory();
      try {
        confetti({ particleCount: 100, spread: 80 });
      } catch (e) {}

      // Calculate final total
      const upperSum = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes']
        .map((k) => newScores[k as CategoryKey] || 0)
        .reduce((a, b) => a + b, 0);
      const bonus = upperSum >= 63 ? 35 : 0;
      const finalScore = Object.values(newScores).reduce((a, b) => a + b, 0) + bonus;

      if (onGameEnd) onGameEnd(finalScore);
    }
  };

  const resetGame = () => {
    sound.playClick();
    setDice([1, 2, 3, 4, 5]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setScores({});
    setGameOver(false);
  };

  // Totals
  const upperCategories: CategoryKey[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
  const upperSum = upperCategories.reduce((sum, k) => sum + (scores[k] || 0), 0);
  const upperBonus = upperSum >= 63 ? 35 : 0;
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) + upperBonus;

  // Render authentic 3D Ivory Dice Face with realistic recessed pips
  const render3DDiceFace = (val: number, isHeldState: boolean) => {
    const pipColor = val === 1 ? 'bg-rose-600' : 'bg-slate-900';

    return (
      <div className="relative w-full h-full p-2 flex flex-col justify-between">
        {val === 1 && (
          <div className="w-full h-full flex items-center justify-center">
            {/* Bold crimson center pip with depth shadow */}
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
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none text-slate-100">
      
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl mb-3 text-xs shadow-xl">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300">Total Score:</span>
          <span className="font-mono text-base font-black text-amber-400">{totalScore} Pts</span>
          {upperSum >= 63 && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
              +35 Upper Bonus!
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Rolls Left:</span>
          <div className="flex gap-1">
            {[1, 2, 3].map((r) => (
              <span
                key={r}
                className={`w-3.5 h-3.5 rounded-full shadow-sm transition-all ${
                  r <= rollsLeft ? 'bg-amber-400 scale-105 shadow-amber-400/50' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 5 REAL 3D IVORY CASINO DICE IN GREEN VELVET ROLLING TRAY */}
      <div className="relative w-full rounded-3xl p-6 mb-4 flex flex-col items-center overflow-hidden border-4 border-emerald-950 bg-slate-950 shadow-2xl">
        
        {/* Real Felt Texture Photo Background */}
        <img
          src={TABLE_BACKGROUNDS.feltGreen}
          alt="Green Felt Table"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.25] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 via-emerald-950/85 to-slate-950/95 pointer-events-none" />

        {/* Dice Tray Header */}
        <div className="relative z-10 w-full flex items-center justify-between mb-4 px-2 text-[11px] text-emerald-200/80 font-mono font-bold">
          <span className="flex items-center gap-1.5">
            <Dices className="w-4 h-4 text-amber-300" /> CASINO VELVET ROLLING TRAY
          </span>
          <span>{rollsLeft < 3 ? 'CLICK DICE TO HOLD' : 'PRESS ROLL TO START'}</span>
        </div>

        {/* 5 Ivory Dice */}
        <div className="relative z-10 flex justify-center gap-3 sm:gap-4 mb-6 flex-wrap">
          {dice.map((val, idx) => (
            <button
              key={idx}
              onClick={() => toggleHold(idx)}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl font-bold flex flex-col items-center justify-between p-1 transition-all relative ${
                held[idx]
                  ? 'bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 text-slate-950 ring-4 ring-amber-300 -translate-y-2 shadow-2xl shadow-amber-500/50'
                  : 'bg-gradient-to-b from-white via-slate-100 to-slate-200 text-slate-900 border-2 border-white/80 shadow-2xl hover:-translate-y-1'
              } ${isRolling ? 'rotate-12 animate-spin' : ''}`}
              style={{
                boxShadow: held[idx]
                  ? '0 12px 18px -2px rgba(245, 158, 11, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.8)'
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.7), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(0, 0, 0, 0.2)'
              }}
            >
              {render3DDiceFace(val, held[idx])}

              <span className={`text-[8px] font-sans uppercase font-black tracking-tight px-1 rounded-sm ${
                held[idx] ? 'bg-amber-600 text-white' : 'text-slate-600'
              }`}>
                {held[idx] ? '★ HELD' : 'TAP TO HOLD'}
              </span>
            </button>
          ))}
        </div>

        {/* Roll Button */}
        <button
          onClick={rollDice}
          disabled={rollsLeft === 0 || isRolling || gameOver}
          className={`relative z-10 px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-2xl transition-all ${
            rollsLeft > 0 && !gameOver
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 text-slate-950 shadow-amber-500/30 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{rollsLeft === 3 ? 'Roll All 5 Dice' : `Roll Dice (${rollsLeft} Left)`}</span>
        </button>
      </div>

      {/* VINTAGE PARCHMENT SCORECARD */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-amber-400">
            <CheckCircle2 className="w-4 h-4" /> Official International Yatzy Scorecard
          </span>
          <span className="text-slate-400 text-[11px]">
            Upper: {upperSum}/63 pts ({upperBonus > 0 ? '+35 Awarded' : `${Math.max(0, 63 - upperSum)} needed`})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          
          {/* Upper Section */}
          <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
              Upper Section (Sum target: 63)
            </div>
            {[
              { key: 'ones', label: 'Ones (Einser)' },
              { key: 'twos', label: 'Twos (Zweier)' },
              { key: 'threes', label: 'Threes (Dreier)' },
              { key: 'fours', label: 'Fours (Vierer)' },
              { key: 'fives', label: 'Fives (Fünfer)' },
              { key: 'sixes', label: 'Sixes (Sechser)' },
            ].map(({ key, label }) => {
              const k = key as CategoryKey;
              const isFilled = scores[k] !== undefined;
              const potential = calculatePotentialScore(k);

              return (
                <button
                  key={k}
                  onClick={() => selectCategory(k)}
                  disabled={isFilled || rollsLeft === 3 || gameOver}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition ${
                    isFilled
                      ? 'bg-slate-900/90 text-slate-300 cursor-default'
                      : rollsLeft < 3
                      ? 'hover:bg-amber-500/20 text-slate-200 border border-dashed border-amber-500/40'
                      : 'text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span className="font-medium text-[11px]">{label}</span>
                  <span className="font-mono font-bold">
                    {isFilled ? (
                      <span className="text-amber-400">{scores[k]}</span>
                    ) : rollsLeft < 3 ? (
                      <span className="text-amber-300/70 font-semibold">+{potential}</span>
                    ) : (
                      '—'
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Lower Section */}
          <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
              Lower Section (Combinations)
            </div>
            {[
              { key: 'threeOfKind', label: '3 of a Kind (Dreierpasch)' },
              { key: 'fourOfKind', label: '4 of a Kind (Viererpasch)' },
              { key: 'fullHouse', label: 'Full House (25 pts)' },
              { key: 'smallStraight', label: 'Small Straight (30 pts)' },
              { key: 'largeStraight', label: 'Large Straight (40 pts)' },
              { key: 'yatzy', label: 'YATZY ★ 5 of a Kind (50 pts)' },
              { key: 'chance', label: 'Chance (Sum of all dice)' },
            ].map(({ key, label }) => {
              const k = key as CategoryKey;
              const isFilled = scores[k] !== undefined;
              const potential = calculatePotentialScore(k);

              return (
                <button
                  key={k}
                  onClick={() => selectCategory(k)}
                  disabled={isFilled || rollsLeft === 3 || gameOver}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition ${
                    isFilled
                      ? 'bg-slate-900/90 text-slate-300 cursor-default'
                      : rollsLeft < 3
                      ? 'hover:bg-amber-500/20 text-slate-200 border border-dashed border-amber-500/40'
                      : 'text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span className={`font-medium text-[11px] ${k === 'yatzy' ? 'text-amber-300 font-bold' : ''}`}>
                    {label}
                  </span>
                  <span className="font-mono font-bold">
                    {isFilled ? (
                      <span className="text-amber-400">{scores[k]}</span>
                    ) : rollsLeft < 3 ? (
                      <span className="text-amber-300/70 font-semibold">+{potential}</span>
                    ) : (
                      '—'
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={resetGame}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Start New Scorecard
        </button>
      </div>
    </div>
  );
};
