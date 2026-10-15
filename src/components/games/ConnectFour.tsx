import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { RefreshCw, Trophy, Users, Bot, ArrowDown, Sparkles } from 'lucide-react';
import { TABLE_BACKGROUNDS } from '../../services/gameImages';

import { RoomParticipant } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';

import { multiplayerService } from '../../services/multiplayerService';
import { Wifi } from 'lucide-react';

interface ConnectFourProps {
  onGameEnd?: (winner: 'player' | 'opponent' | 'draw') => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

const ROWS = 6;
const COLS = 7;

type CellValue = 1 | 2 | null; // 1 = Red, 2 = Yellow

export const ConnectFour: React.FC<ConnectFourProps> = ({ 
  onGameEnd, 
  tableParticipants, 
  currentUserId,
  onActiveTurnChange,
  roomCode,
}) => {
  const p1 = tableParticipants?.[0];
  const p2 = tableParticipants?.[1];

  const p1Name = p1?.name || 'Spieler 1 (Rot)';
  const p2Name = p2?.name || (p2?.isBot ? 'KI-Gegner' : 'Spieler 2 (Gelb)');
  const isP2Bot = p2 ? !!p2.isBot : true;

  const isOnlineMultiplayer = Boolean(roomCode && p1 && p2 && !p2.isBot);
  const myPlayer: 1 | 2 | null = isOnlineMultiplayer
    ? currentUserId === p1?.id
      ? 1
      : currentUserId === p2?.id
      ? 2
      : null
    : null;

  const [board, setBoard] = useState<CellValue[][]>(() =>
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<1 | 2 | 'draw' | null>(null);
  const [winningCells, setWinningCells] = useState<[number, number][]>([]);
  const [playMode, setPlayMode] = useState<'bot' | 'local2p' | 'online'>(() => 
    isOnlineMultiplayer ? 'online' : (isP2Bot ? 'bot' : 'local2p')
  );
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);

  useEffect(() => {
    if (isOnlineMultiplayer) {
      setPlayMode('online');
    } else if (p2) {
      setPlayMode(p2.isBot ? 'bot' : 'local2p');
    }
  }, [isOnlineMultiplayer, p2?.id, p2?.isBot]);

  useEffect(() => {
    if (onActiveTurnChange) {
      const activeId = currentPlayer === 1 ? (p1?.id || 'p1') : (p2?.id || 'p2');
      onActiveTurnChange(activeId);
    }
  }, [currentPlayer, p1?.id, p2?.id, onActiveTurnChange]);

  // Check victory condition
  const checkWin = (grid: CellValue[][]): { winner: 1 | 2 | null; cells: [number, number][] } => {
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const val = grid[r][c];
        if (val && val === grid[r][c+1] && val === grid[r][c+2] && val === grid[r][c+3]) {
          return { winner: val, cells: [[r, c], [r, c+1], [r, c+2], [r, c+3]] };
        }
      }
    }
    // Vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        const val = grid[r][c];
        if (val && val === grid[r+1][c] && val === grid[r+2][c] && val === grid[r+3][c]) {
          return { winner: val, cells: [[r, c], [r+1, c], [r+2, c], [r+3, c]] };
        }
      }
    }
    // Diagonal down-right
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const val = grid[r][c];
        if (val && val === grid[r+1][c+1] && val === grid[r+2][c+2] && val === grid[r+3][c+3]) {
          return { winner: val, cells: [[r, c], [r+1, c+1], [r+2, c+2], [r+3, c+3]] };
        }
      }
    }
    // Diagonal down-left
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 3; c < COLS; c++) {
        const val = grid[r][c];
        if (val && val === grid[r+1][c-1] && val === grid[r+2][c-2] && val === grid[r+3][c-3]) {
          return { winner: val, cells: [[r, c], [r+1, c-1], [r+2, c-2], [r+3, c-3]] };
        }
      }
    }
    return { winner: null, cells: [] };
  };

  const isBoardFull = (grid: CellValue[][]) => {
    return grid[0].every((cell) => cell !== null);
  };

  // WebSocket Multiplayer synchronization
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = multiplayerService.subscribeToGameActions((event) => {
      if (event.gameType !== 'connectfour' || event.roomCode !== roomCode) return;
      if (event.senderId === currentUserId) return;

      if (event.action === 'DROP_DISC') {
        const { col, player } = event.payload;
        applyDropToBoard(col, player);
      } else if (event.action === 'RESET') {
        sound.playClick();
        setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
        setCurrentPlayer(1);
        setWinner(null);
        setWinningCells([]);
        setHoverCol(null);
        setIsBotThinking(false);
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentUserId, onGameEnd]);

  const applyDropToBoard = (col: number, playerNum: 1 | 2) => {
    setBoard((prev) => {
      let targetRow = -1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (!prev[r][col]) {
          targetRow = r;
          break;
        }
      }
      if (targetRow === -1) return prev;

      sound.playPieceDrop();
      const newBoard = prev.map((row) => [...row]);
      newBoard[targetRow][col] = playerNum;

      const winResult = checkWin(newBoard);
      if (winResult.winner) {
        setWinner(winResult.winner);
        setWinningCells(winResult.cells);
        if (winResult.winner === myPlayer) {
          sound.playVictory();
          try { confetti({ particleCount: 90, spread: 70 }); } catch (e) {}
        } else {
          sound.playError();
        }
        setScores((s) => ({
          ...s,
          [winResult.winner === 1 ? 'p1' : 'p2']: s[winResult.winner === 1 ? 'p1' : 'p2'] + 1,
        }));
        if (onGameEnd) onGameEnd(winResult.winner === 1 ? 'player' : 'opponent');
      } else if (isBoardFull(newBoard)) {
        setWinner('draw');
        sound.playReward();
        if (onGameEnd) onGameEnd('draw');
      } else {
        setCurrentPlayer(playerNum === 1 ? 2 : 1);
      }

      return newBoard;
    });
  };

  const handleDropDisc = (col: number) => {
    if (winner || isBotThinking) return;

    if (isOnlineMultiplayer && myPlayer && currentPlayer !== myPlayer) {
      sound.playError();
      return;
    }

    // Find lowest empty row in selected column
    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!board[r][col]) {
        targetRow = r;
        break;
      }
    }
    if (targetRow === -1) {
      sound.playError();
      return;
    }

    sound.playPieceDrop();

    const newBoard = board.map((row) => [...row]);
    newBoard[targetRow][col] = currentPlayer;
    setBoard(newBoard);

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'connectfour', 'DROP_DISC', {
        col,
        player: currentPlayer,
      }, currentUserId || 'p1');
    }

    const winResult = checkWin(newBoard);
    if (winResult.winner) {
      setWinner(winResult.winner);
      setWinningCells(winResult.cells);
      sound.playVictory();
      try {
        confetti({ particleCount: 90, spread: 70 });
      } catch (e) {}

      setScores((prev) => ({
        ...prev,
        [winResult.winner === 1 ? 'p1' : 'p2']: prev[winResult.winner === 1 ? 'p1' : 'p2'] + 1,
      }));

      if (onGameEnd) {
        onGameEnd(winResult.winner === 1 ? 'player' : 'opponent');
      }
      return;
    }

    if (isBoardFull(newBoard)) {
      setWinner('draw');
      sound.playReward();
      if (onGameEnd) onGameEnd('draw');
      return;
    }

    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    setCurrentPlayer(nextPlayer);

    // AI bot turn
    if (playMode === 'bot' && nextPlayer === 2) {
      setIsBotThinking(true);
      setTimeout(() => {
        executeBotMove(newBoard);
      }, 600);
    }
  };

  const executeBotMove = (currentBoard: CellValue[][]) => {
    const validCols: number[] = [];
    for (let c = 0; c < COLS; c++) {
      if (!currentBoard[0][c]) validCols.push(c);
    }

    if (validCols.length === 0) {
      setIsBotThinking(false);
      return;
    }

    // 1. Check if bot can win immediately
    for (const c of validCols) {
      let r = -1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (!currentBoard[row][c]) { r = row; break; }
      }
      const test = currentBoard.map((row) => [...row]);
      test[r][c] = 2;
      if (checkWin(test).winner === 2) {
        finishBotDrop(c, currentBoard, r);
        return;
      }
    }

    // 2. Check if player can win next turn and block them
    for (const c of validCols) {
      let r = -1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (!currentBoard[row][c]) { r = row; break; }
      }
      const test = currentBoard.map((row) => [...row]);
      test[r][c] = 1;
      if (checkWin(test).winner === 1) {
        finishBotDrop(c, currentBoard, r);
        return;
      }
    }

    // 3. Prefer center column if available
    let chosenCol = validCols[Math.floor(Math.random() * validCols.length)];
    if (validCols.includes(3) && Math.random() < 0.6) {
      chosenCol = 3;
    }

    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!currentBoard[r][chosenCol]) { targetRow = r; break; }
    }
    finishBotDrop(chosenCol, currentBoard, targetRow);
  };

  const finishBotDrop = (col: number, currentBoard: CellValue[][], row: number) => {
    sound.playPieceDrop();
    const newBoard = currentBoard.map((r) => [...r]);
    newBoard[row][col] = 2;
    setBoard(newBoard);
    setIsBotThinking(false);

    const winResult = checkWin(newBoard);
    if (winResult.winner) {
      setWinner(winResult.winner);
      setWinningCells(winResult.cells);
      sound.playError();
      setScores((prev) => ({ ...prev, p2: prev.p2 + 1 }));
      if (onGameEnd) onGameEnd('opponent');
      return;
    }

    if (isBoardFull(newBoard)) {
      setWinner('draw');
      sound.playReward();
      if (onGameEnd) onGameEnd('draw');
      return;
    }

    setCurrentPlayer(1);
  };

  const resetBoard = () => {
    sound.playClick();
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setCurrentPlayer(1);
    setWinner(null);
    setWinningCells([]);
    setHoverCol(null);
    setIsBotThinking(false);

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'connectfour', 'RESET', {}, currentUserId || 'p1');
    }
  };

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none text-slate-100">
      
      {/* Header bar with realistic player badges, avatars and scores */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl mb-4 text-xs font-semibold shadow-xl">
        <div className={`flex items-center gap-2.5 p-1.5 rounded-xl transition ${currentPlayer === 1 && !winner ? 'bg-rose-950/40 border border-rose-500/40 ring-1 ring-rose-500/50' : ''}`}>
          {p1?.avatar ? (
            <AvatarDisplay avatar={p1.avatar} size="sm" />
          ) : (
            <div
              className="w-6 h-6 rounded-full border border-red-300 shadow-md"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #ff4b72, #e11d48 70%, #9f1239)',
                boxShadow: '0 2px 5px rgba(225, 29, 72, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.6)'
              }}
            />
          )}
          <div>
            <div className="text-slate-200 font-bold flex items-center gap-1">
              <span>{p1Name}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            </div>
            <div className="text-[11px] text-rose-400 font-mono">Punkte: {scores.p1}</div>
          </div>
        </div>

        {/* Mode Toggle */}
        {isOnlineMultiplayer ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-black">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>LIVE-TISCH ({myPlayer ? `Du bist ${myPlayer === 1 ? 'Rot' : 'Gelb'}` : 'Zuschauer'})</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                sound.playClick();
                setPlayMode('bot');
                resetBoard();
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                playMode === 'bot' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> KI-Duell
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setPlayMode('local2p');
                resetBoard();
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                playMode === 'local2p' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> 2P Familientisch
            </button>
          </div>
        )}

        <div className={`flex items-center gap-2.5 p-1.5 rounded-xl transition ${currentPlayer === 2 && !winner ? 'bg-amber-950/40 border border-amber-500/40 ring-1 ring-amber-500/50' : ''}`}>
          <div className="text-right">
            <div className="text-slate-200 font-bold flex items-center gap-1 justify-end">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span>{p2Name}</span>
            </div>
            <div className="text-[11px] text-amber-400 font-mono">Punkte: {scores.p2}</div>
          </div>
          {p2?.avatar ? (
            <AvatarDisplay avatar={p2.avatar} size="sm" />
          ) : (
            <div
              className="w-6 h-6 rounded-full border border-amber-200 shadow-md"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #fef08a, #f59e0b 70%, #b45309)',
                boxShadow: '0 2px 5px rgba(245, 158, 11, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.8)'
              }}
            />
          )}
        </div>
      </div>

      {/* Turn indicator & Winner Announcement */}
      <div className="mb-3 text-center">
        {winner ? (
          <div className="flex items-center gap-2 text-base font-bold animate-bounce text-amber-300 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-400/40">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>
              {winner === 'draw'
                ? 'Unentschieden! Tolle Partie!'
                : winner === 1
                ? `🏆 ${p1Name} (Rot) hat gewonnen!`
                : `🏆 ${p2Name} (Gelb) hat gewonnen!`}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span
              className={`w-3 h-3 rounded-full animate-pulse shadow ${
                currentPlayer === 1 ? 'bg-rose-500' : 'bg-amber-400'
              }`}
            />
            <span>
              {isBotThinking
                ? `${p2Name} überlegt den nächsten Zug...`
                : currentPlayer === 1
                ? `${p1Name} ist am Zug (Klicke auf Spalte für roten Chip)`
                : playMode === 'bot'
                ? `${p2Name} ist am Zug`
                : `${p2Name} ist am Zug (Klicke auf Spalte für gelben Chip)`}
            </span>
          </div>
        )}
      </div>

      {/* Column hover drop indicators */}
      <div className="grid grid-cols-7 gap-2.5 w-full max-w-md mb-1.5 px-4">
        {Array.from({ length: COLS }).map((_, colIdx) => (
          <div
            key={colIdx}
            className="flex justify-center cursor-pointer h-6 items-center"
            onClick={() => handleDropDisc(colIdx)}
            onMouseEnter={() => setHoverCol(colIdx)}
            onMouseLeave={() => setHoverCol(null)}
          >
            {hoverCol === colIdx && !winner && !isBotThinking && (
              <div className="flex flex-col items-center animate-bounce">
                <ArrowDown
                  className={`w-4 h-4 ${
                    currentPlayer === 1 ? 'text-rose-400' : 'text-amber-400'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 7x6 REAL VERTICAL GAME RACK WITH REAL TABLETOP PHOTO MAT */}
      <div className="relative rounded-3xl p-4 sm:p-6 shadow-2xl border-4 border-blue-950 max-w-md w-full overflow-hidden bg-slate-950">
        
        {/* Real Tabletop Game Atmosphere Photo Texture */}
        <img
          src={TABLE_BACKGROUNDS.hearthCozy}
          alt="Tabletop Background"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.22] contrast-125"
        />
        <div className="absolute inset-0 bg-blue-950/30 backdrop-blur-xs pointer-events-none" />

        {/* 3D Vertical Game Rack Frame */}
        <div className="relative z-10 bg-gradient-to-b from-blue-600 via-blue-700 to-blue-900 p-3 sm:p-4 rounded-2xl shadow-2xl border-2 border-blue-400/60">
          
          {/* Metallic Top Bolts and Branding Badge */}
          <div className="flex justify-between items-center mb-2.5 px-2">
            <div className="w-3 h-3 rounded-full bg-slate-200 border border-slate-500 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-0.5 bg-slate-600" />
            </div>
            <div className="text-[11px] font-black uppercase tracking-widest text-blue-100 font-display flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> FAMPLAY 4-IN-A-ROW
            </div>
            <div className="w-3 h-3 rounded-full bg-slate-200 border border-slate-500 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-0.5 bg-slate-600" />
            </div>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isWinningCell = winningCells.some(([wr, wc]) => wr === r && wc === c);

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleDropDisc(c)}
                    className="aspect-square rounded-full flex items-center justify-center cursor-pointer relative bg-blue-950/90 shadow-inner overflow-hidden border border-blue-900"
                    style={{
                      boxShadow: 'inset 0 4px 6px -1px rgba(0, 0, 0, 0.9), inset 0 2px 4px -1px rgba(0, 0, 0, 0.6)'
                    }}
                  >
                    {/* 3D Tactile Acrylic Disc Piece */}
                    {cell ? (
                      <div
                        className={`w-full h-full rounded-full transition-transform flex items-center justify-center relative ${
                          isWinningCell ? 'animate-bounce ring-4 ring-white z-20' : ''
                        }`}
                        style={{
                          background:
                            cell === 1
                              ? 'radial-gradient(circle at 35% 30%, #ff4b72, #e11d48 65%, #881337 100%)'
                              : 'radial-gradient(circle at 35% 30%, #fef08a, #f59e0b 65%, #92400e 100%)',
                          boxShadow:
                            cell === 1
                              ? '0 6px 10px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255, 255, 255, 0.7), inset 0 -3px 6px rgba(0, 0, 0, 0.4)'
                              : '0 6px 10px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -3px 6px rgba(0, 0, 0, 0.4)',
                        }}
                      >
                        {/* Molded Concentric Inner Ring */}
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center ${
                            cell === 1 ? 'border-red-300/50' : 'border-amber-200/50'
                          }`}
                        >
                          {/* Inner Medallion Star */}
                          <span className={`text-[10px] font-black ${cell === 1 ? 'text-red-200/70' : 'text-amber-100/70'}`}>
                            ★
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Empty Hole Inset */
                      <div className="w-full h-full rounded-full bg-slate-950/70 shadow-inner" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Stand Feet */}
          <div className="mt-3 pt-2 border-t border-blue-600/50 flex justify-between items-center px-4 text-[10px] text-blue-200 font-mono">
            <span>STABLE BASE</span>
            <div className="h-2 w-20 bg-blue-950 rounded-full border border-blue-500/40" />
            <span>QUICK-SLIDE RESET</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={resetBoard}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" /> New Round
        </button>
      </div>
    </div>
  );
};
