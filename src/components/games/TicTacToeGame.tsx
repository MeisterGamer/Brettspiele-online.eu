import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { RefreshCw, Trophy, Bot, Users, Sparkles } from 'lucide-react';
import { TABLE_BACKGROUNDS } from '../../services/gameImages';

import { RoomParticipant } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';

interface TicTacToeProps {
  onGameEnd?: (winner: string) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
}

export const TicTacToeGame: React.FC<TicTacToeProps> = ({ 
  onGameEnd,
  tableParticipants,
  currentUserId,
  onActiveTurnChange
}) => {
  const p1 = tableParticipants?.[0];
  const p2 = tableParticipants?.[1];
  const p1Name = p1?.name || 'X (Du)';
  const p2Name = p2?.name || (p2?.isBot ? 'KI-Gegner' : 'O (Spieler 2)');
  const isP2Bot = p2 ? !!p2.isBot : true;

  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [mode, setMode] = useState<'bot' | 'local2p'>(() => isP2Bot ? 'bot' : 'local2p');
  const [theme, setTheme] = useState<'pebbles' | 'wood'>('pebbles');
  const [scores, setScores] = useState({ x: 0, o: 0, draw: 0 });

  useEffect(() => {
    if (onActiveTurnChange) {
      const activeId = turn === 'X' ? (p1?.id || 'p1') : (p2?.id || 'p2');
      onActiveTurnChange(activeId);
    }
  }, [turn, p1?.id, p2?.id, onActiveTurnChange]);

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
      
      {/* Score Header with Avatars */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl mb-4 text-xs font-semibold shadow-xl">
        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${turn === 'X' && !winner ? 'bg-sky-950/40 ring-1 ring-sky-500/50' : ''}`}>
          {p1?.avatar ? (
            <AvatarDisplay avatar={p1.avatar} size="sm" />
          ) : (
            <div
              className="w-5 h-5 rounded-full border border-sky-300 shadow"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #7dd3fc, #0284c7 70%, #0369a1)',
              }}
            />
          )}
          <div>
            <div className="font-bold text-slate-200 flex items-center gap-1">
              <span>{p1Name}</span>
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
            </div>
            <div className="text-[11px] text-sky-400 font-mono">Siege: {scores.x}</div>
          </div>
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
              KI
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
            {theme === 'pebbles' ? '🪨 Steine' : '🪵 Holz'}
          </button>
        </div>

        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${turn === 'O' && !winner ? 'bg-amber-950/40 ring-1 ring-amber-500/50' : ''}`}>
          <div className="text-right">
            <div className="font-bold text-slate-200 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>{p2Name}</span>
            </div>
            <div className="text-[11px] text-amber-400 font-mono">Siege: {scores.o}</div>
          </div>
          {p2?.avatar ? (
            <AvatarDisplay avatar={p2.avatar} size="sm" />
          ) : (
            <div
              className="w-5 h-5 rounded-full border border-amber-300 shadow"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #fef08a, #f59e0b 70%, #b45309)',
              }}
            />
          )}
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
