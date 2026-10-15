import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { RefreshCw, Trophy, Bot, Users, Sparkles, Shield } from 'lucide-react';
import { TABLE_BACKGROUNDS } from '../../services/gameImages';

type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
type PieceColor = 'w' | 'b';

interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

import { RoomParticipant } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';

import { multiplayerService } from '../../services/multiplayerService';
import { Wifi } from 'lucide-react';

interface ChessGameProps {
  onGameEnd?: (winner: string) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

type BoardState = (ChessPiece | null)[][];

const INITIAL_BOARD: BoardState = [
  [
    { type: 'r', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'q', color: 'b' },
    { type: 'k', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'r', color: 'b' },
  ],
  Array(8).fill(null).map(() => ({ type: 'p', color: 'b' })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null).map(() => ({ type: 'p', color: 'w' })),
  [
    { type: 'r', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'q', color: 'w' },
    { type: 'k', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'r', color: 'w' },
  ],
];

export const ChessGame: React.FC<ChessGameProps> = ({ 
  onGameEnd,
  tableParticipants,
  currentUserId,
  onActiveTurnChange,
  roomCode,
}) => {
  const p1 = tableParticipants?.[0];
  const p2 = tableParticipants?.[1];
  const p1Name = p1?.name || 'Weiß (Du)';
  const p2Name = p2?.name || (p2?.isBot ? 'Schach-KI' : 'Schwarz (Spieler 2)');
  const isP2Bot = p2 ? !!p2.isBot : true;

  const isOnlineMultiplayer = Boolean(roomCode && p1 && p2 && !p2.isBot);
  const myColor: PieceColor | null = isOnlineMultiplayer
    ? currentUserId === p1?.id
      ? 'w'
      : currentUserId === p2?.id
      ? 'b'
      : null
    : null;

  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [mode, setMode] = useState<'bot' | 'local2p' | 'online'>(() => 
    isOnlineMultiplayer ? 'online' : (isP2Bot ? 'bot' : 'local2p')
  );
  const [winner, setWinner] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  useEffect(() => {
    if (isOnlineMultiplayer) {
      setMode('online');
    } else {
      setMode(isP2Bot ? 'bot' : 'local2p');
    }
  }, [isOnlineMultiplayer, isP2Bot]);

  useEffect(() => {
    if (onActiveTurnChange) {
      const activeId = turn === 'w' ? (p1?.id || 'p1') : (p2?.id || 'p2');
      onActiveTurnChange(activeId);
    }
  }, [turn, p1?.id, p2?.id, onActiveTurnChange]);

  // WebSocket Multiplayer synchronization
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = multiplayerService.subscribeToGameActions((event) => {
      if (event.gameType !== 'chess' || event.roomCode !== roomCode) return;
      if (event.senderId === currentUserId) return;

      if (event.action === 'MOVE') {
        const { from, to } = event.payload;
        applyRemoteMove(from[0], from[1], to[0], to[1]);
      } else if (event.action === 'RESET') {
        sound.playClick();
        setBoard(INITIAL_BOARD);
        setTurn('w');
        setSelectedPos(null);
        setValidMoves([]);
        setWinner(null);
        setMoveHistory([]);
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentUserId, onGameEnd]);

  const applyRemoteMove = (fromR: number, fromC: number, toR: number, toC: number) => {
    setBoard((prev) => {
      const movingPiece = prev[fromR][fromC];
      if (!movingPiece) return prev;
      const captured = prev[toR][toC];

      const newBoard = prev.map((row) => [...row]);
      newBoard[toR][toC] = movingPiece;
      newBoard[fromR][fromC] = null;

      if (movingPiece.type === 'p' && (toR === 0 || toR === 7)) {
        newBoard[toR][toC] = { type: 'q', color: movingPiece.color };
      }

      if (captured) {
        sound.playSuccess();
        if (captured.type === 'k') {
          const winTitle = movingPiece.color === 'w' ? (p1Name) : (p2Name);
          setWinner(winTitle);
          sound.playVictory();
          try { confetti({ particleCount: 100, spread: 70 }); } catch (e) {}
          if (onGameEnd) onGameEnd(winTitle);
        }
      } else {
        sound.playChip();
      }

      setTurn(movingPiece.color === 'w' ? 'b' : 'w');
      return newBoard;
    });
  };

  // Calculate standard moves
  const getMoves = (r: number, c: number, currentBoard: BoardState): [number, number][] => {
    const piece = currentBoard[r][c];
    if (!piece) return [];
    const moves: [number, number][] = [];
    const color = piece.color;
    const opponent = color === 'w' ? 'b' : 'w';

    const addMove = (tr: number, tc: number): boolean => {
      if (tr < 0 || tr >= 8 || tc < 0 || tc >= 8) return false;
      const target = currentBoard[tr][tc];
      if (!target) {
        moves.push([tr, tc]);
        return true;
      } else if (target.color === opponent) {
        moves.push([tr, tc]);
        return false;
      }
      return false;
    };

    if (piece.type === 'p') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      // Single push
      if (r + dir >= 0 && r + dir < 8 && !currentBoard[r + dir][c]) {
        moves.push([r + dir, c]);
        // Double push from starting rank
        if (r === startRow && !currentBoard[r + 2 * dir][c]) {
          moves.push([r + 2 * dir, c]);
        }
      }
      // Diagonal captures
      [-1, 1].forEach((dc) => {
        const tr = r + dir;
        const tc = c + dc;
        if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
          if (currentBoard[tr][tc]?.color === opponent) {
            moves.push([tr, tc]);
          }
        }
      });
    } else if (piece.type === 'n') {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      knightOffsets.forEach(([dr, dc]) => addMove(r + dr, c + dc));
    } else if (piece.type === 'b') {
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      dirs.forEach(([dr, dc]) => {
        let step = 1;
        while (addMove(r + dr * step, c + dc * step)) {
          step++;
        }
      });
    } else if (piece.type === 'r') {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      dirs.forEach(([dr, dc]) => {
        let step = 1;
        while (addMove(r + dr * step, c + dc * step)) {
          step++;
        }
      });
    } else if (piece.type === 'q') {
      const dirs = [
        [-1, -1], [-1, 1], [1, -1], [1, 1],
        [-1, 0], [1, 0], [0, -1], [0, 1],
      ];
      dirs.forEach(([dr, dc]) => {
        let step = 1;
        while (addMove(r + dr * step, c + dc * step)) {
          step++;
        }
      });
    } else if (piece.type === 'k') {
      const dirs = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1],
      ];
      dirs.forEach(([dr, dc]) => addMove(r + dr, c + dc));
    }

    return moves;
  };

  const handleSquareClick = (r: number, c: number) => {
    if (winner) return;

    if (isOnlineMultiplayer && myColor && turn !== myColor) {
      sound.playError();
      return;
    }

    if (selectedPos) {
      const [sr, sc] = selectedPos;
      // If clicking same piece, deselect
      if (sr === r && sc === c) {
        setSelectedPos(null);
        setValidMoves([]);
        return;
      }

      // Check if clicked square is a valid move
      const isMove = validMoves.some(([mr, mc]) => mr === r && mc === c);
      if (isMove) {
        executeMove(sr, sc, r, c);
        return;
      }
    }

    // Select new piece of current player
    const piece = board[r][c];
    if (piece && piece.color === turn) {
      if (isOnlineMultiplayer && myColor && piece.color !== myColor) {
        sound.playError();
        return;
      }
      sound.playClick();
      setSelectedPos([r, c]);
      setValidMoves(getMoves(r, c, board));
    } else {
      setSelectedPos(null);
      setValidMoves([]);
    }
  };

  const executeMove = (fromR: number, fromC: number, toR: number, toC: number) => {
    const movingPiece = board[fromR][fromC]!;
    const captured = board[toR][toC];

    const newBoard = board.map((row) => [...row]);
    newBoard[toR][toC] = movingPiece;
    newBoard[fromR][fromC] = null;

    // Pawn promotion to Queen
    if (movingPiece.type === 'p' && (toR === 0 || toR === 7)) {
      newBoard[toR][toC] = { type: 'q', color: movingPiece.color };
    }

    if (captured) {
      sound.playSuccess();
      if (captured.type === 'k') {
        // King captured
        const winTitle = turn === 'w' ? (p1Name) : (p2Name);
        setWinner(winTitle);
        sound.playVictory();
        confetti({ particleCount: 100, spread: 70 });
        if (onGameEnd) onGameEnd(winTitle);
      }
    } else {
      sound.playChip();
    }

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'chess', 'MOVE', {
        from: [fromR, fromC],
        to: [toR, toC],
      }, currentUserId || 'p1');
    }

    setBoard(newBoard);
    setSelectedPos(null);
    setValidMoves([]);

    const nextTurn = turn === 'w' ? 'b' : 'w';
    setTurn(nextTurn);

    // AI Move
    if (mode === 'bot' && nextTurn === 'b' && !winner) {
      setTimeout(() => {
        executeAiMove(newBoard);
      }, 700);
    }
  };

  const executeAiMove = (currentBoard: BoardState) => {
    const blackPieces: { r: number; c: number; moves: [number, number][] }[] = [];

    currentBoard.forEach((row, r) => {
      row.forEach((piece, c) => {
        if (piece && piece.color === 'b') {
          const moves = getMoves(r, c, currentBoard);
          if (moves.length > 0) {
            blackPieces.push({ r, c, moves });
          }
        }
      });
    });

    if (blackPieces.length === 0) {
      setWinner('Weiß (Du)');
      sound.playVictory();
      if (onGameEnd) onGameEnd('Weiß (Du)');
      return;
    }

    // Prioritize captures
    let chosenFrom = blackPieces[0];
    let chosenTarget = blackPieces[0].moves[0];
    let foundCapture = false;

    for (const p of blackPieces) {
      for (const m of p.moves) {
        const dest = currentBoard[m[0]][m[1]];
        if (dest && dest.color === 'w') {
          chosenFrom = p;
          chosenTarget = m;
          foundCapture = true;
          break;
        }
      }
      if (foundCapture) break;
    }

    if (!foundCapture) {
      const randP = blackPieces[Math.floor(Math.random() * blackPieces.length)];
      chosenFrom = randP;
      chosenTarget = randP.moves[Math.floor(Math.random() * randP.moves.length)];
    }

    executeMove(chosenFrom.r, chosenFrom.c, chosenTarget[0], chosenTarget[1]);
  };

  const resetGame = () => {
    sound.playClick();
    setBoard(INITIAL_BOARD);
    setTurn('w');
    setSelectedPos(null);
    setValidMoves([]);
    setWinner(null);
    setMoveHistory([]);

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'chess', 'RESET', {}, currentUserId || 'p1');
    }
  };

  // Render Staunton piece with wooden textures
  const renderStauntonPiece = (piece: ChessPiece) => {
    const isWhite = piece.color === 'w';

    const symbols: Record<PieceType, string> = {
      k: '♚',
      q: '♛',
      r: '♜',
      b: '♝',
      n: '♞',
      p: '♟',
    };

    return (
      <div
        className="w-full h-full flex items-center justify-center relative select-none transform transition-transform"
        style={{
          filter: isWhite
            ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))'
            : 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))',
        }}
      >
        <span
          className={`text-2xl sm:text-4xl font-serif font-black ${
            isWhite
              ? 'text-amber-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]'
              : 'text-amber-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.2)]'
          }`}
          style={{
            textShadow: isWhite
              ? '0 1px 2px #000, 0 0 1px #fff'
              : '0 1px 1px rgba(255,255,255,0.3)',
          }}
        >
          {symbols[piece.type]}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none text-slate-100">
      
      {/* Header bar with player avatars and turn indicators */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl mb-3 text-xs shadow-xl">
        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${turn === 'w' && !winner ? 'bg-amber-950/40 ring-1 ring-amber-400/60' : ''}`}>
          {p1?.avatar ? (
            <AvatarDisplay avatar={p1.avatar} size="sm" />
          ) : (
            <span className="w-4 h-4 rounded-full bg-amber-100 border border-amber-300 shadow" />
          )}
          <div>
            <div className="font-bold text-slate-200 flex items-center gap-1">
              <span>{p1Name}</span>
              <span className="w-2 h-2 rounded-full bg-amber-100 inline-block" />
            </div>
            <div className="text-[11px] text-amber-300">{turn === 'w' ? '● Am Zug' : 'Wartet'}</div>
          </div>
        </div>

        {isOnlineMultiplayer ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-black">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>LIVE-SCHACH ({myColor ? `Du bist ${myColor === 'w' ? 'Weiß' : 'Schwarz'}` : 'Zuschauer'})</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setMode('bot'); resetGame(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                mode === 'bot' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> vs. Schach-KI
            </button>
            <button
              onClick={() => { setMode('local2p'); resetGame(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                mode === 'local2p' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> 2P Duell
            </button>
          </div>
        )}

        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${turn === 'b' && !winner ? 'bg-slate-800/80 ring-1 ring-slate-400/60' : ''}`}>
          <div className="text-right">
            <div className="font-bold text-slate-200 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-slate-800 inline-block border border-slate-600" />
              <span>{p2Name}</span>
            </div>
            <div className="text-[11px] text-slate-400">{turn === 'b' ? '● Am Zug' : 'Wartet'}</div>
          </div>
          {p2?.avatar ? (
            <AvatarDisplay avatar={p2.avatar} size="sm" />
          ) : (
            <span className="w-4 h-4 rounded-full bg-slate-900 border border-slate-600 shadow" />
          )}
        </div>

        <button
          onClick={resetGame}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Brett zurücksetzen"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 8x8 REAL INLAID WOODEN CHESSBOARD */}
      <div className="relative rounded-3xl p-3 sm:p-5 border-4 border-amber-950 shadow-2xl max-w-md w-full overflow-hidden bg-amber-950">
        
        {/* Real Wood Grain Background Photo Inlay */}
        <img
          src={TABLE_BACKGROUNDS.mahogany}
          alt="Wood Texture"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.35] contrast-125"
        />

        <div className="relative z-10 grid grid-cols-8 rounded-2xl overflow-hidden border-2 border-amber-900/90 shadow-2xl bg-amber-950">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = selectedPos?.[0] === r && selectedPos?.[1] === c;
              const isValid = validMoves.some(([mr, mc]) => mr === r && mc === c);

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  className={`aspect-square flex items-center justify-center relative cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-amber-900/90 hover:brightness-110'
                      : 'bg-amber-200/90 hover:brightness-105'
                  } ${isSelected ? 'ring-2 ring-amber-400 z-10' : ''}`}
                >
                  {/* Destination hint indicator */}
                  {isValid && (
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-400/90 animate-ping z-20 shadow-md ring-2 ring-white" />
                  )}

                  {/* Staunton Chess Figure */}
                  {cell && renderStauntonPiece(cell)}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Winner Banner */}
      {winner && (
        <div className="mt-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-4 py-2 rounded-2xl font-bold flex items-center gap-2 animate-bounce">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Schachmatt! {winner} gewinnt das Spiel!</span>
        </div>
      )}
    </div>
  );
};
