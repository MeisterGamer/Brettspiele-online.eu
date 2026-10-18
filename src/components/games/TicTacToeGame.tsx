import { useAIDifficulty } from './GameArena';
import { chooseTicMove } from '../../services/gameAI';
import { useGameTimers } from './useGameTimers';
import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { RefreshCw, Trophy, Bot, Users, Sparkles, Wifi } from 'lucide-react';
import { TABLE_BACKGROUNDS } from '../../services/gameImages';
import { multiplayerService } from '../../services/multiplayerService';
import { RoomParticipant } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';

interface TicTacToeProps {
  onGameEnd?: (winner: string) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

export const TicTacToeGame: React.FC<TicTacToeProps> = ({ 
  onGameEnd,
  tableParticipants,
  currentUserId,
  onActiveTurnChange,
  roomCode,
}) => {
  const { schedule, cancelAll } = useGameTimers();
  const difficulty = useAIDifficulty();
  const p1 = tableParticipants?.[0];
  const p2 = tableParticipants?.[1];
  const p1Name = p1?.name || 'X (Du)';
  const p2Name = p2?.name || (p2?.isBot ? 'KI-Gegner' : 'O (Spieler 2)');
  const isP2Bot = p2 ? !!p2.isBot : true;

  // Real online multiplayer mode detection
  const isOnlineMultiplayer = Boolean(roomCode && p1 && p2 && !p2.isBot);

  // My symbol: Host / P1 is X, P2 is O. In local mode, user controls both or X vs Bot
  const mySymbol: 'X' | 'O' | null = isOnlineMultiplayer
    ? currentUserId === p1?.id
      ? 'X'
      : currentUserId === p2?.id
      ? 'O'
      : null // spectator
    : null;

  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [mode, setMode] = useState<'bot' | 'local2p' | 'online'>(() => 
    isOnlineMultiplayer ? 'online' : (isP2Bot ? 'bot' : 'local2p')
  );
  const [theme, setTheme] = useState<'pebbles' | 'wood'>('pebbles');
  const [scores, setScores] = useState({ x: 0, o: 0, draw: 0 });

  useEffect(() => {
    if (isOnlineMultiplayer) {
      setMode('online');
    } else {
      setMode(isP2Bot ? 'bot' : 'local2p');
    }
  }, [isOnlineMultiplayer, isP2Bot]);

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

  // Real-time WebSocket game actions listener
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = multiplayerService.subscribeToGameActions((event) => {
      if (event.gameType !== 'tictactoe' || event.roomCode !== roomCode) return;
      if (event.senderId === currentUserId) return; // ignore our own action

      if (event.action === 'MOVE') {
        const { idx, turnPlayer } = event.payload;
        setBoard((prev) => {
          if (!Number.isInteger(idx) || idx < 0 || idx > 8 || prev[idx] || checkWin(prev)) return prev;
          const expected = prev.filter(v => v === 'X').length === prev.filter(v => v === 'O').length ? 'X' : 'O';
          if (turnPlayer !== expected || event.senderId !== (expected === 'X' ? p1?.id : p2?.id)) return prev;
          const next = [...prev];
          next[idx] = turnPlayer;

          const res = checkWin(next);
          sound.playPieceDrop();

          if (res) {
            setWinner(res);
            if (res === 'draw') {
              sound.playReward();
              setScores((s) => ({ ...s, draw: s.draw + 1 }));
            } else {
              sound.playVictory();
              try { confetti({ particleCount: 70, spread: 60 }); } catch (e) {}
              setScores((s) => ({
                ...s,
                [res === 'X' ? 'x' : 'o']: s[res === 'X' ? 'x' : 'o'] + 1,
              }));
            }
            if (onGameEnd) onGameEnd(res);
          } else {
            setTurn(turnPlayer === 'X' ? 'O' : 'X');
          }
          return next;
        });
      } else if (event.action === 'RESET') {
        cancelAll();
        sound.playClick();
        setBoard(Array(9).fill(null));
        setTurn('X');
        setWinner(null);
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentUserId, onGameEnd]);

  const handleCellClick = (idx: number) => {
    if (board[idx] || winner || (mode === 'bot' && turn === 'O')) return;
    if (isOnlineMultiplayer && !mySymbol) return;

    // In online mode, verify it's our turn
    if (isOnlineMultiplayer && mySymbol && turn !== mySymbol) {
      sound.playError();
      return;
    }

    sound.playPieceDrop();
    const newBoard = [...board];
    const currentSymbol = isOnlineMultiplayer && mySymbol ? mySymbol : turn;
    newBoard[idx] = currentSymbol;
    setBoard(newBoard);

    // Broadcast move to remote players
    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'tictactoe', 'MOVE', {
        idx,
        turnPlayer: currentSymbol,
      }, currentUserId || 'p1');
    }

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

    const nextTurn = currentSymbol === 'X' ? 'O' : 'X';
    setTurn(nextTurn);

    // AI Move in Bot Mode
    if (mode === 'bot' && nextTurn === 'O') {
      schedule(() => {
        executeBotMove(newBoard);
      }, 500);
    }
  };

  const executeBotMove = (currentBoard: (string | null)[]) => {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((v): v is number => v !== null);

    if (emptyIndices.length === 0) return;

    const chosen = chooseTicMove(currentBoard, difficulty);
    if (chosen === null) return;

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
    cancelAll();
    sound.playClick();
    setBoard(Array(9).fill(null));
    setTurn('X');
    setWinner(null);

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'tictactoe', 'RESET', {}, currentUserId || 'p1');
    }
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

        {/* Mode Indicator */}
        <div className="flex items-center gap-1.5">
          {isOnlineMultiplayer ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-black text-emerald-300">
              <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>LIVE-DUELLE ({mySymbol ? `Du bist ${mySymbol}` : 'Zuschauer'})</span>
            </div>
          ) : (
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
          )}

          <button
            onClick={() => setTheme(theme === 'pebbles' ? 'wood' : 'pebbles')}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] border border-slate-700 transition cursor-pointer"
          >
            {theme === 'pebbles' ? 'Kiesel' : 'Holz'}
          </button>
        </div>

        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${turn === 'O' && !winner ? 'bg-amber-950/40 ring-1 ring-amber-500/50' : ''}`}>
          <div className="text-right">
            <div className="font-bold text-slate-200 flex items-center justify-end gap-1">
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
                background: 'radial-gradient(circle at 35% 35%, #fde047, #d97706 70%, #92400e)',
              }}
            />
          )}
        </div>
      </div>

      {/* Game Turn Status */}
      <div className="mb-3 text-xs font-semibold flex items-center gap-2 text-slate-300">
        {winner ? (
          <span className="text-amber-400 font-bold flex items-center gap-1 text-sm animate-bounce">
            <Trophy className="w-4 h-4 text-amber-300" />
            {winner === 'draw' ? 'Unentschieden! Guter Kampf!' : `${winner === 'X' ? p1Name : p2Name} gewinnt! 🎉`}
          </span>
        ) : isOnlineMultiplayer ? (
          <span>
            {turn === mySymbol ? (
              <span className="text-emerald-400 font-bold">🟢 Du bist am Zug ({mySymbol})!</span>
            ) : (
              <span className="text-slate-400">⏳ Gegner überlegt seinen Zug...</span>
            )}
          </span>
        ) : (
          <span>Am Zug: <strong className={turn === 'X' ? 'text-sky-400' : 'text-amber-400'}>{turn === 'X' ? p1Name : p2Name} ({turn})</strong></span>
        )}
      </div>

      {/* Board */}
      <div 
        className="relative p-4 rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden"
        style={{
          backgroundImage: `url(${TABLE_BACKGROUNDS.slateZen})`,
          backgroundSize: 'cover',
        }}
      >
        <div className="grid grid-cols-3 gap-3 w-64 h-64 sm:w-72 sm:h-72">
          {board.map((cell, idx) => {
            const isClickable = !cell && !winner && (mode !== 'bot' || turn === 'X') && (!isOnlineMultiplayer || turn === mySymbol);

            return (
              <button
                key={idx}
                aria-label={`Feld ${idx + 1}: ${cell || "leer"}`}
                onClick={() => handleCellClick(idx)}
                disabled={!isClickable}
                className={`relative rounded-2xl flex items-center justify-center transition-all duration-200 shadow-inner ${
                  cell
                    ? 'bg-slate-900/80 shadow-md'
                    : isClickable
                    ? 'bg-slate-800/40 hover:bg-slate-700/50 hover:scale-105 active:scale-95 cursor-pointer border border-dashed border-slate-600/40'
                    : 'bg-slate-900/30 cursor-not-allowed opacity-80'
                }`}
              >
                {cell === 'X' && (
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-2xl shadow-lg border border-sky-300 animate-in zoom-in-50 duration-200"
                    style={{
                      background: theme === 'pebbles'
                        ? 'radial-gradient(circle at 35% 35%, #7dd3fc, #0284c7 70%, #0369a1)'
                        : 'linear-gradient(135deg, #38bdf8, #0369a1)',
                      color: '#ffffff',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    X
                  </div>
                )}
                {cell === 'O' && (
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-2xl shadow-lg border border-amber-300 animate-in zoom-in-50 duration-200"
                    style={{
                      background: theme === 'pebbles'
                        ? 'radial-gradient(circle at 35% 35%, #fde047, #d97706 70%, #92400e)'
                        : 'linear-gradient(135deg, #fbbf24, #b45309)',
                      color: '#ffffff',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    O
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Restart Button */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-200 border border-slate-700 shadow transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Neu starten</span>
        </button>
      </div>
    </div>
  );
};
