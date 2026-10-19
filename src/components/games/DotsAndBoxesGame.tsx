import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { RefreshCw, Trophy, Shield, Crown, Wifi, Undo2, Bot, Users, Layers } from 'lucide-react';
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

interface LineMoveRecord {
  lineType: 'H' | 'V';
  r: number;
  c: number;
  player: 'p1' | 'p2';
  completedBoxes: [number, number][];
}

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
  const p2Name = p2?.name || (p2?.isBot ? 'KI-Taktiker' : 'Gelb (Spieler 2)');
  const isP2Bot = p2 ? !!p2.isBot : true;

  const isOnlineMultiplayer = Boolean(roomCode && p1 && p2 && !p2.isBot);
  const myPlayer: 'p1' | 'p2' | null = isOnlineMultiplayer
    ? currentUserId === p1?.id
      ? 'p1'
      : currentUserId === p2?.id
      ? 'p2'
      : null
    : null;

  // Grid size: 3 (2x2 boxes), 4 (3x3 boxes), 5 (4x4 boxes), 6 (5x5 boxes)
  const [gridSize, setGridSize] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<'easy' | 'hard'>('hard');

  // Horizontal lines: gridSize rows of (gridSize - 1)
  const [hLines, setHLines] = useState<boolean[][]>(() =>
    Array(4).fill(null).map(() => Array(3).fill(false))
  );

  // Vertical lines: (gridSize - 1) rows of gridSize
  const [vLines, setVLines] = useState<boolean[][]>(() =>
    Array(3).fill(null).map(() => Array(4).fill(false))
  );

  // Boxes: (gridSize - 1) x (gridSize - 1)
  const [boxes, setBoxes] = useState<('p1' | 'p2' | null)[][]>(() =>
    Array(3).fill(null).map(() => Array(3).fill(null))
  );

  const [turn, setTurn] = useState<'p1' | 'p2'>('p1');
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [winner, setWinner] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<LineMoveRecord[]>([]);

  const totalBoxes = (gridSize - 1) * (gridSize - 1);

  // Re-initialize board when gridSize changes
  const initBoard = (size: number) => {
    setGridSize(size);
    setHLines(Array(size).fill(null).map(() => Array(size - 1).fill(false)));
    setVLines(Array(size - 1).fill(null).map(() => Array(size).fill(false)));
    setBoxes(Array(size - 1).fill(null).map(() => Array(size - 1).fill(null)));
    setScores({ p1: 0, p2: 0 });
    setTurn('p1');
    setWinner(null);
    setMoveHistory([]);
  };

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
        initBoard(gridSize);
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentUserId, onGameEnd, gridSize]);

  const applyRemoteLine = (lineType: 'H' | 'V', r: number, c: number) => {
    sound.playPieceDrop();
    if (lineType === 'H') {
      const newH = hLines.map((row) => [...row]);
      newH[r][c] = true;
      setHLines(newH);
      processTurnAfterLine(newH, vLines, 'H', r, c);
    } else {
      const newV = vLines.map((row) => [...row]);
      newV[r][c] = true;
      setVLines(newV);
      processTurnAfterLine(hLines, newV, 'V', r, c);
    }
  };

  // Check which boxes get completed
  const checkCompletedBoxes = (
    currentHLines: boolean[][],
    currentVLines: boolean[][],
    currentBoxes: ('p1' | 'p2' | null)[][],
    currentTurn: 'p1' | 'p2'
  ) => {
    const updatedBoxes = currentBoxes.map((row) => [...row]);
    const newlyClaimed: [number, number][] = [];
    let countP1 = 0;
    let countP2 = 0;

    for (let r = 0; r < gridSize - 1; r++) {
      for (let c = 0; c < gridSize - 1; c++) {
        if (!updatedBoxes[r][c]) {
          const top = currentHLines[r][c];
          const bottom = currentHLines[r + 1][c];
          const left = currentVLines[r][c];
          const right = currentVLines[r][c + 1];

          if (top && bottom && left && right) {
            updatedBoxes[r][c] = currentTurn;
            newlyClaimed.push([r, c]);
            if (currentTurn === 'p1') countP1++;
            else countP2++;
          }
        }
      }
    }

    return { newBoxes: updatedBoxes, newlyClaimed, countP1, countP2 };
  };

  const processTurnAfterLine = (
    newH: boolean[][],
    newV: boolean[][],
    lineType: 'H' | 'V',
    r: number,
    c: number
  ) => {
    const result = checkCompletedBoxes(newH, newV, boxes, turn);
    const boxesClaimed = result.newlyClaimed.length;

    setBoxes(result.newBoxes);

    setMoveHistory((prev) => [
      ...prev,
      {
        lineType,
        r,
        c,
        player: turn,
        completedBoxes: result.newlyClaimed,
      },
    ]);

    if (boxesClaimed > 0) {
      sound.playReward();
      setScores((prev) => ({
        p1: prev.p1 + result.countP1,
        p2: prev.p2 + result.countP2,
      }));
      // Player retains turn when completing a box!
    } else {
      setTurn((t) => (t === 'p1' ? 'p2' : 'p1'));
    }

    // Check if board complete
    let totalClaimed = 0;
    result.newBoxes.forEach((row) =>
      row.forEach((cell) => {
        if (cell) totalClaimed++;
      })
    );

    if (totalClaimed === totalBoxes) {
      const finalP1 = scores.p1 + result.countP1;
      const finalP2 = scores.p2 + result.countP2;
      const finalWinner =
        finalP1 > finalP2 ? p1Name : finalP2 > finalP1 ? p2Name : 'Unentschieden';
      setWinner(finalWinner);
      sound.playVictory();
      try {
        confetti({ particleCount: 90, spread: 70 });
      } catch (e) {}
      if (onGameEnd) onGameEnd(finalWinner);
    }
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

    processTurnAfterLine(newH, vLines, 'H', r, c);
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

    processTurnAfterLine(hLines, newV, 'V', r, c);
  };

  // Smart AI Turn Logic
  useEffect(() => {
    if (isOnlineMultiplayer || !isP2Bot || turn !== 'p2' || winner) return;

    const botTimer = setTimeout(() => {
      // Helper to count sides of box [r, c]
      const countBoxSides = (br: number, bc: number, curH = hLines, curV = vLines) => {
        let count = 0;
        if (curH[br][bc]) count++;
        if (curH[br + 1][bc]) count++;
        if (curV[br][bc]) count++;
        if (curV[br][bc + 1]) count++;
        return count;
      };

      // 1. Check for immediate box completion (3 sides already drawn)
      for (let br = 0; br < gridSize - 1; br++) {
        for (let bc = 0; bc < gridSize - 1; bc++) {
          if (!boxes[br][bc] && countBoxSides(br, bc) === 3) {
            // Find which line is missing
            if (!hLines[br][bc]) { handleHLineClick(br, bc); return; }
            if (!hLines[br + 1][bc]) { handleHLineClick(br + 1, bc); return; }
            if (!vLines[br][bc]) { handleVLineClick(br, bc); return; }
            if (!vLines[br][bc + 1]) { handleVLineClick(br, bc + 1); return; }
          }
        }
      }

      // Gather available lines
      const availableHLines: [number, number][] = [];
      const availableVLines: [number, number][] = [];

      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize - 1; c++) {
          if (!hLines[r][c]) availableHLines.push([r, c]);
        }
      }
      for (let r = 0; r < gridSize - 1; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (!vLines[r][c]) availableVLines.push([r, c]);
        }
      }

      if (availableHLines.length === 0 && availableVLines.length === 0) return;

      // 2. In Hard Mode: avoid drawing a line that makes any box have 3 sides (giving opponent a free box)
      if (difficulty === 'hard') {
        const safeH = availableHLines.filter(([r, c]) => {
          // Check box above
          if (r > 0 && countBoxSides(r - 1, c) === 2) return false;
          // Check box below
          if (r < gridSize - 1 && countBoxSides(r, c) === 2) return false;
          return true;
        });

        const safeV = availableVLines.filter(([r, c]) => {
          // Check box left
          if (c > 0 && countBoxSides(r, c - 1) === 2) return false;
          // Check box right
          if (c < gridSize - 1 && countBoxSides(r, c) === 2) return false;
          return true;
        });

        if (safeH.length > 0 || safeV.length > 0) {
          const pickH = safeH.length > 0 && (safeV.length === 0 || Math.random() < 0.5);
          if (pickH) {
            const [r, c] = safeH[Math.floor(Math.random() * safeH.length)];
            handleHLineClick(r, c);
          } else {
            const [r, c] = safeV[Math.floor(Math.random() * safeV.length)];
            handleVLineClick(r, c);
          }
          return;
        }
      }

      // 3. Fallback: pick any available line
      const totalAvailable = availableHLines.length + availableVLines.length;
      const pickH = Math.random() < availableHLines.length / totalAvailable;

      if (pickH && availableHLines.length > 0) {
        const [r, c] = availableHLines[Math.floor(Math.random() * availableHLines.length)];
        handleHLineClick(r, c);
      } else if (availableVLines.length > 0) {
        const [r, c] = availableVLines[Math.floor(Math.random() * availableVLines.length)];
        handleVLineClick(r, c);
      }
    }, 500);

    return () => clearTimeout(botTimer);
  }, [turn, isOnlineMultiplayer, isP2Bot, winner, hLines, vLines, boxes, gridSize, difficulty]);

  // Undo Move
  const handleUndo = () => {
    if (moveHistory.length === 0 || winner) return;

    sound.playClick();
    const historyCopy = [...moveHistory];
    const last = historyCopy.pop();
    if (!last) return;

    if (last.lineType === 'H') {
      hLines[last.r][last.c] = false;
      setHLines([...hLines.map((row) => [...row])]);
    } else {
      vLines[last.r][last.c] = false;
      setVLines([...vLines.map((row) => [...row])]);
    }

    // Revert claimed boxes
    last.completedBoxes.forEach(([br, bc]) => {
      boxes[br][bc] = null;
    });
    setBoxes([...boxes.map((row) => [...row])]);

    // Revert scores
    const claimedCount = last.completedBoxes.length;
    if (claimedCount > 0) {
      setScores((s) => ({
        ...s,
        [last.player]: s[last.player] - claimedCount,
      }));
    }

    setMoveHistory(historyCopy);
    setTurn(last.player);
  };

  const resetGame = () => {
    sound.playClick();
    initBoard(gridSize);
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full select-none text-slate-100">
      
      {/* Top Banner: Score, Mode, Grid Sizes */}
      <div className="w-full bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl mb-3 shadow-xl space-y-3">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-lg shadow">
              📦
            </div>
            <div>
              <h3 className="font-black text-sm text-white">Käsekästchen (Dots & Boxes)</h3>
              <p className="text-[10px] text-slate-400">Schließe 4 Wände, um das Kästchen zu erobern</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndo}
              disabled={moveHistory.length === 0 || !!winner}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 transition"
              title="Zug zurücknehmen"
            >
              <Undo2 className="w-4 h-4 text-sky-400" />
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

        {/* Players Turn & Scores */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-2 rounded-xl border transition ${turn === 'p1' && !winner ? 'bg-sky-500/15 border-sky-400 ring-2 ring-sky-400/30' : 'bg-slate-950/40 border-slate-800'}`}>
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-white truncate">{p1Name}</span>
              {turn === 'p1' && !winner && (
                <span className="text-[9px] bg-sky-400 text-slate-950 px-1 rounded font-black animate-pulse">AM ZUG</span>
              )}
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400">Erobert:</span>
              <span className="font-mono text-base font-black text-sky-400">{scores.p1} / {totalBoxes}</span>
            </div>
          </div>

          <div className={`p-2 rounded-xl border transition ${turn === 'p2' && !winner ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/30' : 'bg-slate-950/40 border-slate-800'}`}>
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-white truncate flex items-center gap-1">
                {isP2Bot && <Bot className="w-3 h-3 text-amber-400" />}
                <span>{p2Name}</span>
              </span>
              {turn === 'p2' && !winner && (
                <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-black animate-pulse">AM ZUG</span>
              )}
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400">Erobert:</span>
              <span className="font-mono text-base font-black text-amber-400">{scores.p2} / {totalBoxes}</span>
            </div>
          </div>
        </div>

        {/* Sub-bar: Grid Size & AI Difficulty */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
          {/* Grid Size selector */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-1">Feld:</span>
            {[
              { s: 3, label: '3x3 (4)' },
              { s: 4, label: '4x4 (9)' },
              { s: 5, label: '5x5 (16)' },
              { s: 6, label: '6x6 (25)' },
            ].map(({ s, label }) => (
              <button
                key={s}
                onClick={() => initBoard(s)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                  gridSize === s ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* AI Difficulty */}
          {isP2Bot && !isOnlineMultiplayer && (
            <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-1">KI:</span>
              <button
                onClick={() => setDifficulty('easy')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                  difficulty === 'easy' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Leicht
              </button>
              <button
                onClick={() => setDifficulty('hard')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                  difficulty === 'hard' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Taktiker
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Tactical Grid Container */}
      <div className="relative w-full rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-center">
        {/* Board Coordinate Grid */}
        <div className="relative flex flex-col items-center select-none">
          {Array(gridSize)
            .fill(null)
            .map((_, r) => (
              <React.Fragment key={`row-${r}`}>
                {/* Horizontal row of dots & H-lines */}
                <div className="flex items-center">
                  {Array(gridSize)
                    .fill(null)
                    .map((__, c) => (
                      <React.Fragment key={`dot-${r}-${c}`}>
                        {/* Dot */}
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-200 border-2 border-slate-400 shadow-md z-20 shrink-0" />

                        {/* Horizontal Line between dots */}
                        {c < gridSize - 1 && (
                          <div
                            onClick={() => handleHLineClick(r, c)}
                            className={`h-2 sm:h-2.5 w-12 sm:w-16 rounded-full cursor-pointer transition-all ${
                              hLines[r]?.[c]
                                ? 'bg-gradient-to-r from-sky-400 via-sky-300 to-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] z-10'
                                : 'bg-slate-800/80 hover:bg-slate-700/80'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    ))}
                </div>

                {/* Vertical row of V-lines & Boxes */}
                {r < gridSize - 1 && (
                  <div className="flex items-center">
                    {Array(gridSize)
                      .fill(null)
                      .map((__, c) => (
                        <React.Fragment key={`vert-box-${r}-${c}`}>
                          {/* Vertical Line */}
                          <div
                            onClick={() => handleVLineClick(r, c)}
                            className={`w-2 sm:w-2.5 h-12 sm:h-16 rounded-full cursor-pointer transition-all ${
                              vLines[r]?.[c]
                                ? 'bg-gradient-to-b from-sky-400 via-sky-300 to-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] z-10'
                                : 'bg-slate-800/80 hover:bg-slate-700/80'
                            }`}
                          />

                          {/* Box Territory Area */}
                          {c < gridSize - 1 && (
                            <div
                              className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center transition-all duration-300 rounded-xl m-0.5 ${
                                boxes[r]?.[c] === 'p1'
                                  ? 'bg-sky-500/25 border border-sky-400/50 shadow-inner'
                                  : boxes[r]?.[c] === 'p2'
                                  ? 'bg-amber-500/25 border border-amber-400/50 shadow-inner'
                                  : 'bg-transparent'
                              }`}
                            >
                              {boxes[r]?.[c] && (
                                <span
                                  className={`font-black text-sm sm:text-base font-display animate-scale-in ${
                                    boxes[r]?.[c] === 'p1' ? 'text-sky-300' : 'text-amber-300'
                                  }`}
                                >
                                  {boxes[r]?.[c] === 'p1' ? 'A' : 'B'}
                                </span>
                              )}
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

      {/* Victory Celebration Modal */}
      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-sky-400 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-4xl mb-3 shadow-inner">
              👑
            </div>

            <h2 className="text-2xl font-black text-sky-300 mb-1">Partie beendet!</h2>

            <p className="text-xs text-slate-300 mb-4">
              {scores.p1 > scores.p2
                ? `${p1Name} erobert die Mehrheit mit ${scores.p1} zu ${scores.p2} Kästchen!`
                : scores.p2 > scores.p1
                ? `${p2Name} erobert die Mehrheit mit ${scores.p2} zu ${scores.p1} Kästchen!`
                : `Spannendes Unentschieden! Beide haben ${scores.p1} Kästchen!`}
            </p>

            <button
              onClick={resetGame}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-sm shadow-xl transition active:scale-95"
            >
              Neue Runde starten
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
