import React, { useState } from 'react';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { RefreshCw, Trophy, Square, Shield, Crown } from 'lucide-react';
import { TABLE_BACKGROUNDS } from '../../services/gameImages';

interface DotsAndBoxesProps {
  onGameEnd?: (winner: string) => void;
}

const GRID_SIZE = 4; // 4x4 dots = 3x3 boxes (9 total territory boxes)

export const DotsAndBoxesGame: React.FC<DotsAndBoxesProps> = ({ onGameEnd }) => {
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

  // Check if box (r, c) is completed
  const checkCompletedBoxes = (
    currentHLines: boolean[][],
    currentVLines: boolean[][],
    currentBoxes: ('p1' | 'p2' | null)[][]
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
            updatedBoxes[r][c] = turn;
            if (turn === 'p1') countP1++;
            else countP2++;
          }
        }
      }
    }

    return { newBoxes: updatedBoxes, countP1, countP2 };
  };

  const handleHLineClick = (r: number, c: number) => {
    if (hLines[r][c] || winner) return;

    sound.playPieceDrop();
    const newH = hLines.map((row) => [...row]);
    newH[r][c] = true;
    setHLines(newH);

    processMove(newH, vLines);
  };

  const handleVLineClick = (r: number, c: number) => {
    if (vLines[r][c] || winner) return;

    sound.playPieceDrop();
    const newV = vLines.map((row) => [...row]);
    newV[r][c] = true;
    setVLines(newV);

    processMove(hLines, newV);
  };

  const processMove = (newH: boolean[][], newV: boolean[][]) => {
    const result = checkCompletedBoxes(newH, newV, boxes);
    const boxesClaimed = result.countP1 + result.countP2;

    if (boxesClaimed > 0) {
      sound.playReward();
      setBoxes(result.newBoxes);
      setScores((prev) => ({
        p1: prev.p1 + result.countP1,
        p2: prev.p2 + result.countP2,
      }));
      // Retain turn when box is claimed!
    } else {
      setTurn((t) => (t === 'p1' ? 'p2' : 'p1'));
    }

    // Check game finish (all 9 boxes claimed)
    let totalClaimed = 0;
    result.newBoxes.forEach((row) => row.forEach((cell) => { if (cell) totalClaimed++; }));

    if (totalClaimed === (GRID_SIZE - 1) * (GRID_SIZE - 1)) {
      const finalP1 = scores.p1 + result.countP1;
      const finalP2 = scores.p2 + result.countP2;
      const finalWinner = finalP1 > finalP2 ? 'Blue Sovereign' : finalP2 > finalP1 ? 'Amber Legion' : 'Tie Duel';
      setWinner(finalWinner);
      sound.playVictory();
      try {
        confetti({ particleCount: 80, spread: 70 });
      } catch (e) {}
      if (onGameEnd) onGameEnd(finalWinner);
    }
  };

  const resetGame = () => {
    sound.playClick();
    setHLines(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE - 1).fill(false)));
    setVLines(Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE).fill(false)));
    setBoxes(Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE - 1).fill(null)));
    setScores({ p1: 0, p2: 0 });
    setTurn('p1');
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto w-full select-none text-slate-100">
      
      {/* Score Header */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl mb-4 text-xs font-semibold shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-sky-500 shadow-md ring-1 ring-sky-300" />
          <span>Player 1 (Blue): <strong className="text-sky-400 font-mono text-sm">{scores.p1}</strong></span>
        </div>

        <div className="text-[11px] text-slate-300 font-bold uppercase tracking-wider bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
          {winner ? 'Territory Settled' : turn === 'p1' ? '⚡ Blue Turn' : '⚡ Amber Turn'}
        </div>

        <div className="flex items-center gap-2">
          <span>Player 2 (Amber): <strong className="text-amber-500 font-mono text-sm">{scores.p2}</strong></span>
          <div className="w-4 h-4 rounded-md bg-amber-500 shadow-md ring-1 ring-amber-300" />
        </div>
      </div>

      {winner && (
        <div className="mb-3 text-sm font-bold text-amber-300 flex items-center gap-2 animate-bounce bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-400/30">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{winner} Claims Highest Territory!</span>
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
                        disabled={hLines[r][c] || !!winner}
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
                        disabled={vLines[r][c] || !!winner}
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
                              <span className="text-[10px] font-mono mt-0.5 font-bold">BLUE</span>
                            </div>
                          ) : boxes[r][c] === 'p2' ? (
                            <div className="flex flex-col items-center">
                              <Crown className="w-5 h-5 text-amber-300 fill-amber-400/40" />
                              <span className="text-[10px] font-mono mt-0.5 font-bold">AMBER</span>
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
          <RefreshCw className="w-3.5 h-3.5" /> Restart Territory Duel
        </button>
      </div>
    </div>
  );
};
