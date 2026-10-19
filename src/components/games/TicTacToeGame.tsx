import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { RefreshCw, Trophy, Bot, Users, Sparkles, Wifi, Undo2, Palette, Grid } from 'lucide-react';
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
  const p1 = tableParticipants?.[0];
  const p2 = tableParticipants?.[1];
  const p1Name = p1?.name || 'Spieler 1 (X)';
  const p2Name = p2?.name || (p2?.isBot ? 'KI-Meister' : 'Spieler 2 (O)');
  const isP2Bot = p2 ? !!p2.isBot : true;

  const isOnlineMultiplayer = Boolean(roomCode && p1 && p2 && !p2.isBot);
  const mySymbol: 'X' | 'O' | null = isOnlineMultiplayer
    ? currentUserId === p1?.id
      ? 'X'
      : currentUserId === p2?.id
      ? 'O'
      : null
    : null;

  // Board Size: 3 (3x3 standard, 3 in a row) or 5 (5x5, 4 in a row to win)
  const [boardSize, setBoardSize] = useState<3 | 5>(3);
  const [board, setBoard] = useState<(string | null)[]>(() => Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [mode, setMode] = useState<'bot' | 'local2p' | 'online'>(() => 
    isOnlineMultiplayer ? 'online' : (isP2Bot ? 'bot' : 'local2p')
  );
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'master'>('medium');
  const [theme, setTheme] = useState<'classic' | 'gems' | 'pebbles'>('classic');
  const [scores, setScores] = useState({ x: 0, o: 0, draw: 0 });
  const [moveHistory, setMoveHistory] = useState<number[]>([]);

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

  // Win combinations for 3x3 (3 in a row)
  const WINNING_COMBOS_3X3 = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  // Win combinations for 5x5 (4 in a row)
  const generate5x5Combos = () => {
    const combos: number[][] = [];
    const N = 5;
    const K = 4; // 4 in a row

    // Horizontal
    for (let r = 0; r < N; r++) {
      for (let c = 0; c <= N - K; c++) {
        combos.push([r * N + c, r * N + c + 1, r * N + c + 2, r * N + c + 3]);
      }
    }
    // Vertical
    for (let c = 0; c < N; c++) {
      for (let r = 0; r <= N - K; r++) {
        combos.push([r * N + c, (r + 1) * N + c, (r + 2) * N + c, (r + 3) * N + c]);
      }
    }
    // Diagonal Down-Right
    for (let r = 0; r <= N - K; r++) {
      for (let c = 0; c <= N - K; c++) {
        combos.push([r * N + c, (r + 1) * N + c + 1, (r + 2) * N + c + 2, (r + 3) * N + c + 3]);
      }
    }
    // Diagonal Down-Left
    for (let r = 0; r <= N - K; r++) {
      for (let c = K - 1; c < N; c++) {
        combos.push([r * N + c, (r + 1) * N + c - 1, (r + 2) * N + c - 2, (r + 3) * N + c - 3]);
      }
    }
    return combos;
  };

  const currentCombos = boardSize === 3 ? WINNING_COMBOS_3X3 : generate5x5Combos();

  const checkWin = (grid: (string | null)[]) => {
    for (const combo of currentCombos) {
      const first = grid[combo[0]];
      if (first && combo.every((idx) => grid[idx] === first)) {
        return { winner: first, line: combo };
      }
    }
    if (grid.every((c) => c !== null)) return { winner: 'draw', line: [] };
    return null;
  };

  // WebSocket Multiplayer listener
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = multiplayerService.subscribeToGameActions((event) => {
      if (event.gameType !== 'tictactoe' || event.roomCode !== roomCode) return;
      if (event.senderId === currentUserId) return;

      if (event.action === 'MOVE') {
        const { idx, turnPlayer } = event.payload;
        setBoard((prev) => {
          if (prev[idx]) return prev;
          const next = [...prev];
          next[idx] = turnPlayer;

          setMoveHistory((h) => [...h, idx]);

          const res = checkWin(next);
          sound.playPieceDrop();

          if (res) {
            setWinner(res.winner);
            setWinningLine(res.line);
            if (res.winner === 'draw') {
              sound.playReward();
              setScores((s) => ({ ...s, draw: s.draw + 1 }));
            } else {
              sound.playVictory();
              try { confetti({ particleCount: 70, spread: 60 }); } catch (e) {}
              setScores((s) => ({
                ...s,
                [res.winner === 'X' ? 'x' : 'o']: s[res.winner === 'X' ? 'x' : 'o'] + 1,
              }));
            }
            if (onGameEnd) onGameEnd(res.winner);
          } else {
            setTurn(turnPlayer === 'X' ? 'O' : 'X');
          }
          return next;
        });
      } else if (event.action === 'RESET') {
        sound.playClick();
        resetBoardState(boardSize);
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentUserId, onGameEnd, boardSize]);

  const handleCellClick = (idx: number) => {
    if (board[idx] || winner) return;

    if (isOnlineMultiplayer && mySymbol && turn !== mySymbol) {
      sound.playError();
      return;
    }

    sound.playPieceDrop();
    const newBoard = [...board];
    const currentSymbol = isOnlineMultiplayer && mySymbol ? mySymbol : turn;
    newBoard[idx] = currentSymbol;
    setBoard(newBoard);
    setMoveHistory((h) => [...h, idx]);

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'tictactoe', 'MOVE', {
        idx,
        turnPlayer: currentSymbol,
      }, currentUserId || 'p1');
    }

    const result = checkWin(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === 'draw') {
        sound.playReward();
        setScores((s) => ({ ...s, draw: s.draw + 1 }));
      } else {
        sound.playVictory();
        try { confetti({ particleCount: 90, spread: 70 }); } catch (e) {}
        setScores((s) => ({
          ...s,
          [result.winner === 'X' ? 'x' : 'o']: s[result.winner === 'X' ? 'x' : 'o'] + 1,
        }));
      }
      if (onGameEnd) onGameEnd(result.winner);
      return;
    }

    const nextTurn = currentSymbol === 'X' ? 'O' : 'X';
    setTurn(nextTurn);

    // AI Move in Bot Mode
    if (mode === 'bot' && nextTurn === 'O') {
      setTimeout(() => {
        executeBotMove(newBoard);
      }, 450);
    }
  };

  const executeBotMove = (currentBoard: (string | null)[]) => {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((v): v is number => v !== null);

    if (emptyIndices.length === 0) return;

    let chosen = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

    // Easy mode: occasional random mistake
    if (difficulty === 'easy' && Math.random() < 0.45) {
      // Pick random
    } else {
      // 1. Check if bot can win now
      for (const idx of emptyIndices) {
        const test = [...currentBoard];
        test[idx] = 'O';
        if (checkWin(test)?.winner === 'O') {
          chosen = idx;
          applyBotChoice(chosen, currentBoard);
          return;
        }
      }

      // 2. Block X from winning
      for (const idx of emptyIndices) {
        const test = [...currentBoard];
        test[idx] = 'X';
        if (checkWin(test)?.winner === 'X') {
          chosen = idx;
          applyBotChoice(chosen, currentBoard);
          return;
        }
      }

      // 3. Center square priority
      const centerIdx = boardSize === 3 ? 4 : 12;
      if (emptyIndices.includes(centerIdx)) {
        chosen = centerIdx;
      }
    }

    applyBotChoice(chosen, currentBoard);
  };

  const applyBotChoice = (chosen: number, currentBoard: (string | null)[]) => {
    sound.playPieceDrop();
    const newBoard = [...currentBoard];
    newBoard[chosen] = 'O';
    setBoard(newBoard);
    setMoveHistory((h) => [...h, chosen]);

    const result = checkWin(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === 'draw') {
        sound.playReward();
        setScores((s) => ({ ...s, draw: s.draw + 1 }));
      } else {
        sound.playError();
        setScores((s) => ({ ...s, o: s.o + 1 }));
      }
      if (onGameEnd) onGameEnd(result.winner);
      return;
    }

    setTurn('X');
  };

  // Undo move
  const handleUndo = () => {
    if (moveHistory.length === 0 || winner) return;

    sound.playClick();
    const historyCopy = [...moveHistory];
    const steps = mode === 'bot' && historyCopy.length >= 2 ? 2 : 1;

    for (let i = 0; i < steps; i++) {
      const idx = historyCopy.pop();
      if (idx !== undefined) {
        board[idx] = null;
      }
    }

    setBoard([...board]);
    setMoveHistory(historyCopy);
    setWinner(null);
    setWinningLine([]);
    setTurn(mode === 'bot' ? 'X' : historyCopy.length % 2 === 0 ? 'X' : 'O');
  };

  const resetBoardState = (size: 3 | 5) => {
    setBoardSize(size);
    setBoard(Array(size * size).fill(null));
    setTurn('X');
    setWinner(null);
    setWinningLine([]);
    setMoveHistory([]);
  };

  const resetGame = () => {
    sound.playClick();
    resetBoardState(boardSize);
    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'tictactoe', 'RESET', {}, currentUserId || 'p1');
    }
  };

  // Render Symbols based on theme
  const renderSymbol = (val: string | null) => {
    if (!val) return null;

    if (theme === 'gems') {
      return (
        <span className="text-3xl sm:text-4xl animate-scale-in drop-shadow-md">
          {val === 'X' ? '💎' : '🔮'}
        </span>
      );
    }

    if (theme === 'pebbles') {
      return (
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 shadow-lg flex items-center justify-center font-black text-xs text-white ${
            val === 'X'
              ? 'bg-gradient-to-br from-rose-500 to-red-700 border-red-300'
              : 'bg-gradient-to-br from-amber-400 to-yellow-600 border-amber-200'
          }`}
        >
          {val}
        </div>
      );
    }

    // Classic Neon
    return (
      <span
        className={`font-black font-display text-4xl sm:text-5xl animate-scale-in ${
          val === 'X'
            ? 'text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]'
            : 'text-fuchsia-400 drop-shadow-[0_0_12px_rgba(232,121,249,0.8)]'
        }`}
      >
        {val}
      </span>
    );
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto w-full select-none text-slate-100">
      
      {/* Top Banner: Scores, Mode, Grid Size & Theme */}
      <div className="w-full bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl mb-3 shadow-xl space-y-3">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-lg shadow">
              ❌
            </div>
            <div>
              <h3 className="font-black text-sm text-white">Tic-Tac-Toe & Gomoku</h3>
              <p className="text-[10px] text-slate-400">
                {boardSize === 3 ? '3 in einer Reihe gewinnt' : '4 in einer Reihe auf 5x5 gewinnt'}
              </p>
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
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className={`p-2 rounded-xl border transition ${turn === 'X' && !winner ? 'bg-cyan-500/15 border-cyan-400 ring-2 ring-cyan-400/30' : 'bg-slate-950/40 border-slate-800'}`}>
            <span className="text-[10px] text-slate-400 font-bold block truncate">{p1Name.split(' ')[0]} (X)</span>
            <span className="font-mono text-base font-black text-cyan-400">{scores.x}</span>
          </div>

          <div className="p-2 rounded-xl border border-slate-800 bg-slate-950/40">
            <span className="text-[10px] text-slate-400 font-bold block">Remis</span>
            <span className="font-mono text-base font-black text-slate-300">{scores.draw}</span>
          </div>

          <div className={`p-2 rounded-xl border transition ${turn === 'O' && !winner ? 'bg-fuchsia-500/15 border-fuchsia-400 ring-2 ring-fuchsia-400/30' : 'bg-slate-950/40 border-slate-800'}`}>
            <span className="text-[10px] text-slate-400 font-bold block truncate">{p2Name.split(' ')[0]} (O)</span>
            <span className="font-mono text-base font-black text-fuchsia-400">{scores.o}</span>
          </div>
        </div>

        {/* Sub-bar: 3x3 vs 5x5, AI Difficulty & Theme */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
          {/* Board Size */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => resetBoardState(3)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                boardSize === 3 ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              3x3 Klassik
            </button>
            <button
              onClick={() => resetBoardState(5)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                boardSize === 5 ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              5x5 Gomoku
            </button>
          </div>

          {/* AI Difficulty if bot */}
          {mode === 'bot' && !isOnlineMultiplayer && (
            <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-1">KI:</span>
              {(['easy', 'medium', 'master'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize transition ${
                    difficulty === lvl ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl === 'easy' ? 'Leicht' : lvl === 'medium' ? 'Mittel' : 'Meister'}
                </button>
              ))}
            </div>
          )}

          {/* Themes */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <Palette className="w-3.5 h-3.5 text-amber-400 ml-1" />
            <button
              onClick={() => setTheme('classic')}
              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition ${
                theme === 'classic' ? 'bg-slate-700 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Neon
            </button>
            <button
              onClick={() => setTheme('gems')}
              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition ${
                theme === 'gems' ? 'bg-slate-700 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Juwelen
            </button>
            <button
              onClick={() => setTheme('pebbles')}
              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition ${
                theme === 'pebbles' ? 'bg-slate-700 text-rose-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pöppel
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Board */}
      <div className="relative w-full rounded-3xl bg-slate-950 border border-slate-800 p-4 sm:p-6 shadow-2xl flex items-center justify-center">
        <div
          className={`grid gap-2.5 sm:gap-3.5 w-full mx-auto ${
            boardSize === 3 ? 'grid-cols-3 max-w-[320px]' : 'grid-cols-5 max-w-[380px]'
          }`}
        >
          {board.map((cell, idx) => {
            const isWinning = winningLine.includes(idx);

            return (
              <div
                key={idx}
                onClick={() => handleCellClick(idx)}
                className={`aspect-square rounded-2xl border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                  cell
                    ? isWinning
                      ? 'bg-amber-500/20 border-amber-400 ring-4 ring-amber-400/40 scale-105 z-10'
                      : 'bg-slate-900 border-slate-700 shadow-inner'
                    : 'bg-slate-900/60 border-slate-800 hover:border-cyan-400/60 hover:bg-slate-800/80 active:scale-95'
                }`}
              >
                {renderSymbol(cell)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Winner Modal */}
      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-400 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-4xl mb-3 shadow-inner">
              👑
            </div>

            <h2 className="text-2xl font-black text-cyan-300 mb-1">
              {winner === 'draw'
                ? 'Unentschieden!'
                : winner === 'X'
                ? `${p1Name} gewinnt!`
                : `${p2Name} gewinnt!`}
            </h2>

            <p className="text-xs text-slate-300 mb-4">
              {winner === 'draw'
                ? 'Kein Spieler konnte die Reihe vollenden!'
                : `Glückwunsch zur siegreichen ${boardSize === 3 ? '3er-Reihe' : '4er-Reihe'}!`}
            </p>

            <button
              onClick={resetGame}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-xl transition active:scale-95"
            >
              Neue Runde spielen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
