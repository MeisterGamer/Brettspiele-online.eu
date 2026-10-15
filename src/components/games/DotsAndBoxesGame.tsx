import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { RefreshCw, Trophy, Shield, Crown, Wifi } from 'lucide-react';
import { TABLE_BACKGROUNDS } from '../../services/gameImages';

import { RoomParticipant } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { multiplayerService } from '../../services/multiplayerService';

interface DotsAndBoxesProps {
  onGameEnd?: (winner: string) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

const GRID_SIZE = 4; // 4x4 dots = 3x3 boxes (9 total territory boxes)

export const DotsAndBoxesGame: React.FC<DotsAndBoxesProps> = ({ 
  onGameEnd,
  tableParticipants,
  currentUserId,
  onActiveTurnChange,
  roomCode,
}) => {
  const p1 = tableParticipants?.[0];
  const p2 = tableParticipants?.[1];
  const p1Name = p1?.name || 'Blau (Spieler 1)';
  const p2Name = p2?.name || (p2?.isBot ? 'KI-Gegner' : 'Gelb (Spieler 2)');
  const isP2Bot = p2 ? !!p2.isBot : true;

  const isOnlineMultiplayer = Boolean(roomCode && p1 && p2 && !p2.isBot);
  const myPlayer: 'p1' | 'p2' | null = isOnlineMultiplayer
    ? currentUserId === p1?.id
      ? 'p1'
      : currentUserId === p2?.id
      ? 'p2'
      : null
    : null;

  // Horizontal lines: GRID_SIZE rows of (GRID_SIZE - 1)
  const [hLines, setHLines] = useState<boolean[][]>(() =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE - 1).fill(false))
  );

  // Vertical lines: (GRID_SIZE - 1) rows of GRID_SIZE
  const [vLines, setVLines] = useState<boolean[][]>(() =>
    Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE).fill(false))
  );

  // Boxes: (GRID_SIZE - 1) x (GRID_SIZE - 1)
  const [boxes, setBoxes] = useState<('p1' | 'p2' | null)[][]>(() =>
    Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE - 1).fill(null))
  );

  const [turn, setTurn] = useState<'p1' | 'p2'>('p1');
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (onActiveTurnChange) {
      const activeId = turn === 'p1' ? (p1?.id || 'p1') : (p2?.id || 'p2');
      onActiveTurnChange(activeId);
    }
  }, [turn, p1?.id, p2?.id, onActiveTurnChange]);

  // WebSocket Multiplayer Synchronization
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = multiplayerService.subscribeToGameActions((event) => {
      if (event.gameType !== 'dotsandboxes' || event.roomCode !== roomCode) return;
      if (event.senderId === currentUserId) return;

      if (event.action === 'DRAW_LINE') {
        const { lineType, r, c } = event.payload;
        applyRemoteLine(lineType, r, c);
      } else if (event.action === 'RESET') {
        sound.playClick();
        setHLines(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE - 1).fill(false)));
        setVLines(Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE).fill(false)));
        setBoxes(Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE - 1).fill(null)));
        setScores({ p1: 0, p2: 0 });
        setTurn('p1');
        setWinner(null);
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentUserId, onGameEnd]);

  // Apply remote line
  const applyRemoteLine = (lineType: 'H' | 'V', r: number, c: number) => {
    sound.playPieceDrop();
    if (lineType === 'H') {
      setHLines((prevH) => {
        const newH = prevH.map((row) => [...row]);
        newH[r][c] = true;
        setVLines((prevV) => {
          processTurnAfterLine(newH, prevV);
          return prevV;
        });
        return newH;
      });
    } else {
      setVLines((prevV) => {
        const newV = prevV.map((row) => [...row]);
        newV[r][c] = true;
        setHLines((prevH) => {
          processTurnAfterLine(prevH, newV);
          return prevH;
        });
        return newV;
      });
    }
  };

  // Check if box (r, c) is completed
  const checkCompletedBoxes = (
    currentHLines: boolean[][],
    currentVLines: boolean[][],
    currentBoxes: ('p1' | 'p2' | null)[][],
    currentTurn: 'p1' | 'p2'
  ): { newBoxes: ('p1' | 'p2' | null)[][]; countP1: number; countP2: number } => {
    const updatedBoxes = currentBoxes.map((row) => [...row]);
    let countP1 = 0;
    let countP2 = 0;

    for (let r = 0; r < GRID_SIZE - 1; r++) {
      for (let c = 0; c < GRID_SIZE - 1; c++) {
        if (!updatedBoxes[r][c]) {
          const top = currentHLines[r][c];
          const bottom = currentHLines[r + 1][c];
          const left = currentVLines[r][c];
          const right = currentVLines[r][c + 1];

          if (top && bottom && left && right) {
            updatedBoxes[r][c] = currentTurn;
            if (currentTurn === 'p1') countP1++;
            else countP2++;
          }
        }
      }
    }

    return { newBoxes: updatedBoxes, countP1, countP2 };
  };

  const processTurnAfterLine = (newH: boolean[][], newV: boolean[][]) => {
    setBoxes((prevBoxes) => {
      const result = checkCompletedBoxes(newH, newV, prevBoxes, turn);
      const boxesClaimed = result.countP1 + result.countP2;

      if (boxesClaimed > 0) {
        sound.playReward();
        setScores((prev) => ({
          p1: prev.p1 + result.countP1,
          p2: prev.p2 + result.countP2,
        }));
        // Turn is retained!
      } else {
        setTurn((t) => (t === 'p1' ? 'p2' : 'p1'));
      }

      // Check game finish (all 9 boxes claimed)
      let totalClaimed = 0;
      result.newBoxes.forEach((row) => row.forEach((cell) => { if (cell) totalClaimed++; }));

      if (totalClaimed === (GRID_SIZE - 1) * (GRID_SIZE - 1)) {
        setScores((curScores) => {
          const finalP1 = curScores.p1 + result.countP1;
          const finalP2 = curScores.p2 + result.countP2;
          const finalWinner = finalP1 > finalP2 ? p1Name : finalP2 > finalP1 ? p2Name : 'Unentschieden';
          setWinner(finalWinner);
          sound.playVictory();
          try {
            confetti({ particleCount: 80, spread: 70 });
          } catch (e) {}
          if (onGameEnd) onGameEnd(finalWinner);
          return curScores;
        });
      }

      return result.newBoxes;
    });
  };

  const handleHLineClick = (r: number, c: number) => {
    if (hLines[r][c] || winner) return;

    if (isOnlineMultiplayer && myPlayer && turn !== myPlayer) {
      sound.playError();
      return;
    }

    sound.playPieceDrop();
    const newH = hLines.map((row) => [...row]);
    newH[r][c] = true;
    setHLines(newH);

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'dotsandboxes', 'DRAW_LINE', {
        lineType: 'H',
        r,
        c,
      }, currentUserId || 'p1');
    }

    processTurnAfterLine(newH, vLines);
  };

  const handleVLineClick = (r: number, c: number) => {
    if (vLines[r][c] || winner) return;

    if (isOnlineMultiplayer && myPlayer && turn !== myPlayer) {
      sound.playError();
      return;
    }

    sound.playPieceDrop();
    const newV = vLines.map((row) => [...row]);
    newV[r][c] = true;
    setVLines(newV);

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'dotsandboxes', 'DRAW_LINE', {
        lineType: 'V',
        r,
        c,
      }, currentUserId || 'p1');
    }

    processTurnAfterLine(hLines, newV);
  };

  // Bot Turn in Local Bot Mode
  useEffect(() => {
    if (isOnlineMultiplayer || !isP2Bot || turn !== 'p2' || winner) return;

    const botTimer = setTimeout(() => {
      // Find all unplaced lines
      const availableHLines: [number, number][] = [];
      const availableVLines: [number, number][] = [];

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE - 1; c++) {
          if (!hLines[r][c]) availableHLines.push([r, c]);
        }
      }
      for (let r = 0; r < GRID_SIZE - 1; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (!vLines[r][c]) availableVLines.push([r, c]);
        }
      }

      const totalAvailable = availableHLines.length + availableVLines.length;
      if (totalAvailable === 0) return;

      const pickH = Math.random() < (availableHLines.length / totalAvailable);
      if (pickH && availableHLines.length > 0) {
        const [r, c] = availableHLines[Math.floor(Math.random() * availableHLines.length)];
        handleHLineClick(r, c);
      } else if (availableVLines.length > 0) {
        const [r, c] = availableVLines[Math.floor(Math.random() * availableVLines.length)];
        handleVLineClick(r, c);
      }
    }, 600);

    return () => clearTimeout(botTimer);
  }, [turn, isOnlineMultiplayer, isP2Bot, winner, hLines, vLines]);

  const resetGame = () => {
    sound.playClick();
    setHLines(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE - 1).fill(false)));
    setVLines(Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE).fill(false)));
    setBoxes(Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE - 1).fill(null)));
    setScores({ p1: 0, p2: 0 });
    setTurn('p1');
    setWinner(null);

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'dotsandboxes', 'RESET', {}, currentUserId || 'p1');
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto w-full select-none text-slate-100">
      
      {/* Score Header with Avatars */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl mb-4 text-xs font-semibold shadow-xl">
        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${turn === 'p1' && !winner ? 'bg-sky-950/40 ring-1 ring-sky-500/50' : ''}`}>
          {p1?.avatar ? (
            <AvatarDisplay avatar={p1.avatar} size="sm" />
          ) : (
            <div className="w-4 h-4 rounded-md bg-sky-500 shadow-md ring-1 ring-sky-300" />
          )}
          <div>
            <div className="font-bold text-slate-200 flex items-center gap-1">
              <span>{p1Name}</span>
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
            </div>
            <div className="text-[11px] text-sky-400 font-mono">Kästchen: {scores.p1}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-[11px] text-slate-300 font-bold uppercase tracking-wider bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
            {winner ? 'Spiel beendet' : turn === 'p1' ? '⚡ Blau am Zug' : '⚡ Gelb am Zug'}
          </div>
          {isOnlineMultiplayer && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-black">
              <Wifi className="w-2.5 h-2.5 animate-pulse" />
              <span>ONLINE</span>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${turn === 'p2' && !winner ? 'bg-amber-950/40 ring-1 ring-amber-500/50' : ''}`}>
          <div className="text-right">
            <div className="font-bold text-slate-200 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>{p2Name}</span>
            </div>
            <div className="text-[11px] text-amber-400 font-mono">Kästchen: {scores.p2}</div>
          </div>
          {p2?.avatar ? (
            <AvatarDisplay avatar={p2.avatar} size="sm" />
          ) : (
            <div className="w-4 h-4 rounded-md bg-amber-500 shadow-md ring-1 ring-amber-300" />
          )}
        </div>
      </div>

      {winner && (
        <div className="mb-3 text-sm font-bold text-amber-300 flex items-center gap-2 animate-bounce bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-400/30">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{winner} gewinnt das Spiel!</span>
        </div>
      )}

      {/* VINTAGE ARCHITECTURAL DRAFTING BLUEPRINT WITH 3D BRASS PINS */}
      <div className="relative rounded-3xl p-6 sm:p-7 border-4 border-slate-800 shadow-2xl flex flex-col items-center overflow-hidden bg-slate-950">
        
        {/* Real Drafting Blueprint / Leather Desk Background Photo */}
        <img
          src={TABLE_BACKGROUNDS.slateZen}
          alt="Vintage Desk Surface"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.2] contrast-125"
        />
        <div className="absolute inset-0 bg-blue-950/20 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {Array.from({ length: GRID_SIZE }).map((_, r) => (
            <React.Fragment key={r}>
              {/* Horizontal Line Row */}
              <div className="flex items-center">
                {Array.from({ length: GRID_SIZE }).map((_, c) => (
                  <React.Fragment key={c}>
                    {/* 3D Solid Brass Pin Dot with Reflection */}
                    <div
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-lg relative flex items-center justify-center shrink-0 z-20"
                      style={{
                        background: 'radial-gradient(circle at 35% 35%, #fef08a, #ca8a04 60%, #713f12 100%)',
                        boxShadow: '0 3px 6px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.8)'
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-100/70" />
                    </div>

                    {/* Horizontal Line Segment */}
                    {c < GRID_SIZE - 1 && (
                      <button
                        onClick={() => handleHLineClick(r, c)}
                        disabled={Boolean(hLines[r][c] || winner || (isOnlineMultiplayer && myPlayer && turn !== myPlayer))}
                        className={`h-2.5 w-16 sm:w-20 rounded-full transition-all cursor-pointer ${
                          hLines[r][c]
                            ? 'bg-gradient-to-r from-amber-300 via-white to-amber-300 shadow-md ring-1 ring-amber-400'
                            : 'bg-slate-800 hover:bg-slate-600'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Vertical Line & Box Row */}
              {r < GRID_SIZE - 1 && (
                <div className="flex items-center">
                  {Array.from({ length: GRID_SIZE }).map((_, c) => (
                    <React.Fragment key={c}>
                      {/* Vertical Line Segment */}
                      <button
                        onClick={() => handleVLineClick(r, c)}
                        disabled={Boolean(vLines[r][c] || winner || (isOnlineMultiplayer && myPlayer && turn !== myPlayer))}
                        className={`w-2.5 h-16 sm:h-20 rounded-full transition-all cursor-pointer ${
                          vLines[r][c]
                            ? 'bg-gradient-to-b from-amber-300 via-white to-amber-300 shadow-md ring-1 ring-amber-400'
                            : 'bg-slate-800 hover:bg-slate-600'
                        }`}
                      />

                      {/* Box Interior with Stamped Wax Seals */}
                      {c < GRID_SIZE - 1 && (
                        <div
                          className={`w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center font-display text-sm font-black transition-all rounded-xl ${
                            boxes[r][c] === 'p1'
                              ? 'bg-gradient-to-br from-sky-500/40 to-blue-700/50 text-sky-200 border-2 border-sky-400/60 shadow-inner'
                              : boxes[r][c] === 'p2'
                              ? 'bg-gradient-to-br from-amber-500/40 to-orange-700/50 text-amber-200 border-2 border-amber-400/60 shadow-inner'
                              : 'bg-slate-900/40'
                          }`}
                        >
                          {boxes[r][c] === 'p1' ? (
                            <div className="flex flex-col items-center">
                              <Shield className="w-5 h-5 text-sky-300 fill-sky-400/40" />
                              <span className="text-[10px] font-mono mt-0.5 font-bold">BLAU</span>
                            </div>
                          ) : boxes[r][c] === 'p2' ? (
                            <div className="flex flex-col items-center">
                              <Crown className="w-5 h-5 text-amber-300 fill-amber-400/40" />
                              <span className="text-[10px] font-mono mt-0.5 font-bold">GELB</span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={resetGame}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Neu starten
        </button>
      </div>
    </div>
  );
};
