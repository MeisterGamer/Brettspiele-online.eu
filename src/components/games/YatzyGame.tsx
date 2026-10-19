import { initialYatzy, reduceYatzy, yatzyScore, yatzyTotal, chooseYatzyCategory, chooseYatzyHolds, type YatzyCategory, type YatzyAction } from '../../services/yatzyEngine';
import { multiplayerService } from '../../services/multiplayerService';
import { useGameTimers } from './useGameTimers';
import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { RefreshCw, Trophy, Play, CheckCircle2, Dices, Sparkles, Bot, Users } from 'lucide-react';
import { TABLE_BACKGROUNDS } from '../../services/gameImages';
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

type CategoryKey = YatzyCategory;

export const YatzyGame: React.FC<YatzyGameProps> = ({ 
  onGameEnd,
  tableParticipants,
  currentUserId,
  onActiveTurnChange,
  roomCode,
  isHost,
}) => {
  const { schedule, repeat, cancelAll } = useGameTimers();
  const p1 = tableParticipants?.[0];
  const p2 = tableParticipants?.[1];
  const p1Name = p1?.name || 'Spieler 1';
  const p2Name = p2?.name || (p2?.isBot ? 'Kniffel-KI' : 'Spieler 2');

  const [state, setState] = useState(() => initialYatzy(tableParticipants?.length || 1));
  const activePlayerIndex = state.active;
  const { dice, held, rollsLeft } = state;
  const scores = state.cards[activePlayerIndex] || {};
  const [isRolling, setIsRolling] = useState(false);
  const gameOver = state.finished;
  const online = Boolean(roomCode);
  const activeParticipant = tableParticipants?.[activePlayerIndex];
  const activeBot = Boolean(activeParticipant?.isBot);
  const canAct = !gameOver && (online ? activeParticipant?.id === currentUserId || (activeBot && isHost) : true);
  const finishedReported = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const update = (action: YatzyAction) => {
    if (!canAct) return;
    if (online) multiplayerService.sendGameAction(roomCode!, 'yatzy', 'YATZY_COMMAND', action, currentUserId!);
    else setState(prev => reduceYatzy(prev, action));
  };
  useEffect(() => {
    onActiveTurnChange?.(activeParticipant?.id || 'p1');
  }, [activePlayerIndex, activeParticipant?.id, onActiveTurnChange]);
  useEffect(() => {
    if (!roomCode) return;
    const unsubscribe = multiplayerService.subscribeToGameActions(event => {
      if (event.roomCode !== roomCode || event.gameType !== 'yatzy' || event.action !== 'YATZY_STATE') return;
      const next = event.payload?.state;
      if (next && next.revision >= stateRef.current.revision) { setState(next); setIsRolling(false); }
    });
    multiplayerService.sendGameAction(roomCode, 'yatzy', 'YATZY_GET_STATE', {}, currentUserId || 'p1');
    return unsubscribe;
  }, [roomCode, currentUserId]);
  useEffect(() => {
    if (!gameOver || finishedReported.current) return;
    finishedReported.current = true;
    sound.playVictory();
    onGameEnd?.(yatzyTotal(state.cards[tableParticipants?.findIndex(p=>p.id===currentUserId) ?? 0] || state.cards[0]));
  }, [gameOver]);
  const rollDice = () => {
    if (!canAct || !rollsLeft || isRolling) return;
    sound.playDiceRoll();
    setIsRolling(true);
    schedule(() => {
      update({ type:'ROLL', dice:Array.from({length:5},()=>Math.floor(Math.random()*6)+1) });
      if (!online) setIsRolling(false);
    }, 350);
  };
  const toggleHold = (index: number) => {
    if (isRolling) return;
    update({type:'HOLD',index});
  };
  const calculatePotentialScore = (category: CategoryKey) => yatzyScore(dice,category);
  const selectCategory = (category: CategoryKey) => {
    if (isRolling) return;
    sound.playReward();
    update({type:'SCORE',category});
  };
  useEffect(() => {
    if (!activeBot || !canAct || isRolling || gameOver) return;
    const timer = schedule(() => {
      if (rollsLeft === 3) { rollDice(); return; }
      if (rollsLeft === 0 || yatzyScore(dice,'yatzy') === 50 || yatzyScore(dice,'largeStraight') === 40) {
        selectCategory(chooseYatzyCategory(state)); return;
      }
      const desired = chooseYatzyHolds(state);
      const mismatch = desired.findIndex((value,i)=>value!==held[i]);
      if (mismatch >= 0) toggleHold(mismatch);
      else rollDice();
    }, 500);
    return () => clearTimeout(timer);
  }, [state, canAct, isRolling, activeBot]);
  const resetGame = () => {
    cancelAll();
    if (roomCode) { multiplayerService.startRound(roomCode); return; }
    setState(initialYatzy(tableParticipants?.length || 1));
    setIsRolling(false);
    finishedReported.current = false;
  };
  const upperCategories: CategoryKey[] = ['ones','twos','threes','fours','fives','sixes'];
  const upperSum = upperCategories.reduce((sum,k)=>sum+(scores[k]||0),0);
  const upperBonus = upperSum >= 63 ? 35 : 0;
  const totalScore = yatzyTotal(scores);

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
    <div className="flex flex-col items-center max-w-6xl mx-auto w-full select-none text-slate-100">
      
      <div className="w-full mb-3 rounded-xl bg-slate-800 p-3 text-sm space-y-1" aria-live="polite">
        <p className="font-bold">{gameOver ? 'Partie beendet' : `${activeParticipant?.name || p1Name} ist am Zug`}</p>
        {state.cards.map((card,index)=><p key={index} className={index===activePlayerIndex ? 'text-amber-300' : 'text-slate-400'}>{tableParticipants?.[index]?.name || `Spieler ${index+1}`}: {yatzyTotal(card)} Punkte · {Object.keys(card).length}/13 Kategorien</p>)}
      </div>
      {/* Top Banner with Player Avatars and Score */}
      <div className="w-full bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl mb-3 text-xs shadow-xl space-y-2.5">
        {/* Players Turn Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            {p1?.avatar ? (
              <div className="p-0.5 rounded-xl ring-2 ring-amber-400 shadow">
                <AvatarDisplay avatar={p1.avatar} size="sm" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-xs font-bold text-amber-300">
                #1
              </div>
            )}
            <div>
              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                <span>{p1Name}</span>
                {activePlayerIndex === 0 && (
                  <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full font-black animate-pulse">
                    AM WÜRFELN
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">Kniffel-Würfelbecher</div>
            </div>
          </div>

          {p2 && (
            <div className="flex items-center gap-2 text-right">
              <div>
                <div className="font-bold text-white text-xs flex items-center gap-1.5 justify-end">
                  {activePlayerIndex === 1 && (
                    <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full font-black animate-pulse">
                      AM WÜRFELN
                    </span>
                  )}
                  <span>{p2Name}</span>
                </div>
                <div className="text-[10px] text-slate-400">{p2.isBot ? 'KI-Herausforderer' : 'Mitspieler'}</div>
              </div>
              {p2.avatar ? (
                <div className="p-0.5 rounded-xl ring-2 ring-indigo-400 shadow">
                  <AvatarDisplay avatar={p2.avatar} size="sm" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-xs font-bold text-indigo-300">
                  #2
                </div>
              )}
            </div>
          )}
        </div>

        {/* Score & Rolls Counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Gesamtpunkte:</span>
            <span className="font-mono text-base font-black text-amber-400">{totalScore} Pkt</span>
            {upperSum >= 63 && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                +35 Bonus!
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
              aria-label={`Würfel ${idx + 1}: ${val}`}
              aria-pressed={held[idx]}
              disabled={!canAct || activeBot || isRolling || rollsLeft === 3}
              onClick={() => { if (!activeBot) toggleHold(idx); }}
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
          disabled={!canAct || activeBot || rollsLeft === 0 || isRolling || gameOver}
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
                  disabled={!canAct || activeBot || isFilled || rollsLeft === 3 || gameOver}
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
                  disabled={!canAct || activeBot || isFilled || rollsLeft === 3 || gameOver}
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
