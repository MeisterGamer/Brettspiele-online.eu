import React, { useState } from 'react';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { RefreshCw, Trophy, Bot, Users, Sparkles } from 'lucide-react';
import { TABLE_BACKGROUNDS } from '../../services/gameImages';

interface TicTacToeProps {
  onGameEnd?: (winner: string) => void;
}

export const TicTacToeGame: React.FC<TicTacToeProps> = ({ onGameEnd }) => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [mode, setMode] = useState<'bot' | 'local2p'>('bot');
  const [theme, setTheme] = useState<'pebbles' | 'wood'>('pebbles');
  const [scores, setScores] = useState({ x: 0, o: 0, draw: 0 });

  const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const checkWin = (grid: (string | null)[]) => {
    for (const [a, b, c] of winningCombos) {
      if (grid[a] && grid[a] === grid[b] && grid[a] === grid[c]) {
        return grid[a];
      }
    }
    if (grid.every((c) => c !== null)) return 'draw';
    return null;
  };

  const handleCellClick = (idx: number) => {
    if (board[idx] || winner) return;

    sound.playPieceDrop();
    const newBoard = [...board];
    newBoard[idx] = turn;
    setBoard(newBoard);

    const result = checkWin(newBoard);
    if (result) {
      setWinner(result);
      if (result === 'draw') {
        sound.playReward();
        setScores((s) => ({ ...s, draw: s.draw + 1 }));
      } else {
        sound.playVictory();
        try {
          confetti({ particleCount: 70, spread: 60 });
        } catch (e) {}
        setScores((s) => ({
          ...s,
          [result === 'X' ? 'x' : 'o']: s[result === 'X' ? 'x' : 'o'] + 1,
        }));
      }
      if (onGameEnd) onGameEnd(result);
      return;
    }

    const nextTurn = turn === 'X' ? 'O' : 'X';
    setTurn(nextTurn);

    // AI Move
    if (mode === 'bot' && nextTurn === 'O') {
      setTimeout(() => {
        executeBotMove(newBoard);
      }, 500);
    }
  };

  const executeBotMove = (currentBoard: (string | null)[]) => {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((v): v is number => v !== null);

    if (emptyIndices.length === 0) return;

    let chosen = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

    // Check if bot can win
    for (const idx of emptyIndices) {
      const test = [...currentBoard];
      test[idx] = 'O';
      if (checkWin(test) === 'O') {
        chosen = idx;
        break;
      }
    }

    // Block X
    for (const idx of emptyIndices) {
      const test = [...currentBoard];
      test[idx] = 'X';
      if (checkWin(test) === 'X') {
        chosen = idx;
        break;
      }
    }

    sound.playPieceDrop();
    const newBoard = [...currentBoard];
    newBoard[chosen] = 'O';
    setBoard(newBoard);

    const result = checkWin(newBoard);
    if (result) {
      setWinner(result);
      if (result === 'draw') {
        sound.playReward();
        setScores((s) => ({ ...s, draw: s.draw + 1 }));
      } else {
        sound.playError();
        setScores((s) => ({ ...s, o: s.o + 1 }));
      }
      if (onGameEnd) onGameEnd(result);
      return;
    }

    setTurn('X');
  };

  const resetGame = () => {
    sound.playClick();
    setBoard(Array(9).fill(null));
    setTurn('X');
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto w-full select-none text-slate-100">
      
      {/* Score Header */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl mb-4 text-xs font-semibold shadow-xl">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border border-sky-300 shadow"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #7dd3fc, #0284c7 70%, #0369a1)',
            }}
          />
          <span className="text-slate-200">X (You): <strong className="font-mono text-sky-400 text-sm">{scores.x}</strong></span>
        </div>

        {/* Mode & Theme Toggles */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setMode('bot'); resetGame(); }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                mode === 'bot' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              AI
            </button>
            <button
              onClick={() => { setMode('local2p'); resetGame(); }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                mode === 'local2p' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              2P
            </button>
          </div>

          <button
            onClick={() => setTheme((t) => (t === 'pebbles' ? 'wood' : 'pebbles'))}
            className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700"
          >
            {theme === 'pebbles' ? '🪨 River Stones' : '🪵 Wood Pegs'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-200">O ({mode === 'bot' ? 'Bot' : 'P2'}): <strong className="font-mono text-amber-400 text-sm">{scores.o}</strong></span>
          <div
            className="w-4 h-4 rounded-full border border-amber-300 shadow"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #fde68a, #d97706 70%, #92400e)',
            }}
          />
        </div>
      </div>

      {winner && (
        <div className="mb-3 text-sm font-bold text-amber-300 flex items-center gap-2 animate-bounce bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-400/40">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{winner === 'draw' ? 'Draw Game!' : `${winner} Wins Round!`}</span>
        </div>
      )}

      {/* 3x3 TACTILE BOARD WITH REALISTIC STONE / WOOD TEXTURE */}
      <div className="relative rounded-3xl p-5 sm:p-6 border-4 border-slate-800 w-full max-w-xs shadow-2xl overflow-hidden bg-slate-950">
        
        {/* Real Tabletop Photography Background */}
        <img
          src={theme === 'pebbles' ? TABLE_BACKGROUNDS.slateZen : TABLE_BACKGROUNDS.mahogany}
          alt="Board Texture"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.25] contrast-125"
        />
        <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-3 gap-3">
          {board.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              disabled={!!cell || !!winner}
              className={`aspect-square rounded-2xl font-display flex items-center justify-center transition-all relative overflow-hidden group shadow-lg ${
                cell
                  ? ''
                  : 'bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 hover:scale-102'
              }`}
            >
              {cell === 'X' ? (
                /* Polished Crystalline Cyan River Stone / Carved Oak X */
                <div
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center font-black text-3xl sm:text-4xl shadow-2xl transition-transform"
                  style={{
                    background:
                      theme === 'pebbles'
                        ? 'radial-gradient(circle at 30% 30%, #e0f2fe, #38bdf8 40%, #0369a1 80%, #082f49 100%)'
                        : 'radial-gradient(circle at 30% 30%, #fef3c7, #d97706 60%, #78350f 100%)',
                    boxShadow: '0 8px 14px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -3px 6px rgba(0,0,0,0.5)',
                    color: theme === 'pebbles' ? '#082f49' : '#451a03',
                  }}
                >
                  <span className="drop-shadow-sm font-mono font-black">✕</span>
                </div>
              ) : cell === 'O' ? (
                /* Polished Obsidian Black Marble / Walnut O Ring */
                <div
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center font-black text-3xl sm:text-4xl shadow-2xl transition-transform"
                  style={{
                    background:
                      theme === 'pebbles'
                        ? 'radial-gradient(circle at 30% 30%, #fef08a, #f59e0b 45%, #b45309 80%, #451a03 100%)'
                        : 'radial-gradient(circle at 30% 30%, #94a3b8, #334155 60%, #0f172a 100%)',
                    boxShadow: '0 8px 14px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -3px 6px rgba(0,0,0,0.5)',
                    color: theme === 'pebbles' ? '#451a03' : '#f8fafc',
                  }}
                >
                  <span className="drop-shadow-sm font-mono font-black">◯</span>
                </div>
              ) : (
                <span className="opacity-0 group-hover:opacity-40 text-slate-400 text-lg font-mono">
                  +
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={resetGame}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Next Round
        </button>
      </div>
    </div>
  );
};
