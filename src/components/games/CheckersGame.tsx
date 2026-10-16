import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { RefreshCw, Trophy, Bot, Users, Crown, Sparkles } from 'lucide-react';
import { TABLE_BACKGROUNDS } from '../../services/gameImages';

type PlayerColor = 'red' | 'black';

type PieceType = {
  player: PlayerColor;
  isKing: boolean;
};

type BoardState = (PieceType | null)[][];

import { RoomParticipant } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';

import { multiplayerService } from '../../services/multiplayerService';
import { Wifi } from 'lucide-react';

interface CheckersGameProps {
  onGameEnd?: (winner: string) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

export const CheckersGame: React.FC<CheckersGameProps> = ({ 
  onGameEnd,
  tableParticipants,
  currentUserId,
  onActiveTurnChange,
  roomCode,
}) => {
  const p1 = tableParticipants?.[0];
  const p2 = tableParticipants?.[1];
  const p1Name = p1?.name || 'Rot (Du)';
  const p2Name = p2?.name || (p2?.isBot ? 'KI-Bot' : 'Schwarz (Spieler 2)');
  const isP2Bot = p2 ? !!p2.isBot : true;

  const isOnlineMultiplayer = Boolean(roomCode && p1 && p2 && !p2.isBot);
  const myPlayer: 'red' | 'black' | null = isOnlineMultiplayer
    ? currentUserId === p1?.id
      ? 'red'
      : currentUserId === p2?.id
      ? 'black'
      : null
    : null;

  // Initialize standard 8x8 checkers board
  const initBoard = (): BoardState => {
    const b: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));
    // Black pieces at top (rows 0, 1, 2) on dark squares
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          b[r][c] = { player: 'black', isKing: false };
        }
      }
    }
    // Red pieces at bottom (rows 5, 6, 7) on dark squares
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          b[r][c] = { player: 'red', isKing: false };
        }
      }
    }
    return b;
  };

  const [board, setBoard] = useState<BoardState>(initBoard);
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [turn, setTurn] = useState<'red' | 'black'>('red');
  const [winner, setWinner] = useState<string | null>(null);
  const [mode, setMode] = useState<'bot' | 'local2p' | 'online'>(() => 
    isOnlineMultiplayer ? 'online' : (isP2Bot ? 'bot' : 'local2p')
  );

  useEffect(() => {
    if (isOnlineMultiplayer) {
      setMode('online');
    } else {
      setMode(isP2Bot ? 'bot' : 'local2p');
    }
  }, [isOnlineMultiplayer, isP2Bot]);

  useEffect(() => {
    if (onActiveTurnChange) {
      const activeId = turn === 'red' ? (p1?.id || 'p1') : (p2?.id || 'p2');
      onActiveTurnChange(activeId);
    }
  }, [turn, p1?.id, p2?.id, onActiveTurnChange]);

  // WebSocket Multiplayer synchronization
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = multiplayerService.subscribeToGameActions((event) => {
      if (event.gameType !== 'checkers' || event.roomCode !== roomCode) return;
      if (event.senderId === currentUserId) return;

      if (event.action === 'MOVE') {
        const { from, to } = event.payload;
        applyRemoteCheckersMove(from[0], from[1], to[0], to[1]);
      } else if (event.action === 'RESET') {
        sound.playClick();
        setBoard(initBoard());
        setTurn('red');
        setSelectedPos(null);
        setValidMoves([]);
        setWinner(null);
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentUserId, onGameEnd]);

  const applyRemoteCheckersMove = (fromR: number, fromC: number, toR: number, toC: number) => {
    setBoard((prev) => {
      const movingPiece = prev[fromR][fromC];
      if (!movingPiece) return prev;

      sound.playPieceDrop();
      const newBoard = prev.map((row) => [...row]);
      const pieceCopy = { ...movingPiece };

      newBoard[fromR][fromC] = null;

      if (Math.abs(toR - fromR) === 2) {
        sound.playReward();
        const capturedR = (fromR + toR) / 2;
        const capturedC = (fromC + toC) / 2;
        newBoard[capturedR][capturedC] = null;
      }

      if (pieceCopy.player === 'red' && toR === 0) {
        pieceCopy.isKing = true;
      } else if (pieceCopy.player === 'black' && toR === 7) {
        pieceCopy.isKing = true;
      }

      newBoard[toR][toC] = pieceCopy;

      let redCount = 0;
      let blackCount = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (newBoard[r][c]?.player === 'red') redCount++;
          if (newBoard[r][c]?.player === 'black') blackCount++;
        }
      }

      if (redCount === 0 || blackCount === 0) {
        const winPlayer = redCount > 0 ? p1Name : p2Name;
        setWinner(winPlayer);
        sound.playVictory();
        try { confetti({ particleCount: 80, spread: 70 }); } catch (e) {}
        if (onGameEnd) onGameEnd(winPlayer);
      } else {
        setTurn(pieceCopy.player === 'red' ? 'black' : 'red');
      }

      return newBoard;
    });
  };

  const getMovesForPiece = (r: number, c: number, currentBoard: BoardState): [number, number][] => {
    const piece = currentBoard[r][c];
    if (!piece) return [];

    const moves: [number, number][] = [];
    const directions: [number, number][] = [];

    if (piece.isKing) {
      directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    } else if (piece.player === 'red') {
      directions.push([-1, -1], [-1, 1]); // Red moves up
    } else {
      directions.push([1, -1], [1, 1]); // Black moves down
    }

    // Regular moves & jump moves
    for (const [dr, dc] of directions) {
      const nextR = r + dr;
      const nextC = c + dc;

      if (nextR >= 0 && nextR < 8 && nextC >= 0 && nextC < 8) {
        if (!currentBoard[nextR][nextC]) {
          moves.push([nextR, nextC]);
        } else if (currentBoard[nextR][nextC]?.player !== piece.player) {
          // Check jump over opponent
          const jumpR = nextR + dr;
          const jumpC = nextC + dc;
          if (jumpR >= 0 && jumpR < 8 && jumpC >= 0 && jumpC < 8 && !currentBoard[jumpR][jumpC]) {
            moves.push([jumpR, jumpC]);
          }
        }
      }
    }

    return moves;
  };

  const executeBotMove = (currentBoard: BoardState) => {
    const allMoves: { from: [number, number]; to: [number, number]; isJump: boolean }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (currentBoard[r][c]?.player === 'black') {
          const moves = getMovesForPiece(r, c, currentBoard);
          for (const [toR, toC] of moves) {
            allMoves.push({
              from: [r, c],
              to: [toR, toC],
              isJump: Math.abs(toR - r) === 2,
            });
          }
        }
      }
    }

    if (allMoves.length === 0) {
      setWinner(p1Name);
      sound.playVictory();
      if (onGameEnd) onGameEnd(p1Name);
      return;
    }

    const jumpMoves = allMoves.filter((m) => m.isJump);
    const chosen = jumpMoves.length > 0
      ? jumpMoves[Math.floor(Math.random() * jumpMoves.length)]
      : allMoves[Math.floor(Math.random() * allMoves.length)];

    executeMove(chosen.from[0], chosen.from[1], chosen.to[0], chosen.to[1], currentBoard, 'black');
  };

  const handleCellClick = (r: number, c: number) => {
    if (winner) return;

    if (isOnlineMultiplayer && myPlayer && turn !== myPlayer) {
      sound.playError();
      return;
    }

    const piece = board[r][c];

    // Select piece
    if (piece && piece.player === turn) {
      if (isOnlineMultiplayer && myPlayer && piece.player !== myPlayer) {
        sound.playError();
        return;
      }
      sound.playClick();
      setSelectedPos([r, c]);
      const moves = getMovesForPiece(r, c, board);
      setValidMoves(moves);
      return;
    }

    // Execute move
    if (selectedPos && validMoves.some(([mr, mc]) => mr === r && mc === c)) {
      executeMove(selectedPos[0], selectedPos[1], r, c, board, turn);
    }
  };

  const executeMove = (
    fromR: number, 
    fromC: number, 
    toR: number, 
    toC: number, 
    sourceBoard?: BoardState, 
    actingPlayer?: PlayerColor
  ) => {
    sound.playPieceDrop();
    const currentBoard = sourceBoard || board;
    const currentTurn = actingPlayer || turn;
    const newBoard = currentBoard.map((row) => [...row]);
    const sourcePiece = newBoard[fromR][fromC];
    if (!sourcePiece) return;
    const movingPiece = { ...sourcePiece };

    newBoard[fromR][fromC] = null;

    // Check if it's a jump capture
    if (Math.abs(toR - fromR) === 2) {
      sound.playReward();
      const capturedR = (fromR + toR) / 2;
      const capturedC = (fromC + toC) / 2;
      newBoard[capturedR][capturedC] = null;
    }

    // Crown King if reaching end of board
    if (movingPiece.player === 'red' && toR === 0) {
      movingPiece.isKing = true;
      sound.playVictory();
    } else if (movingPiece.player === 'black' && toR === 7) {
      movingPiece.isKing = true;
    }

    newBoard[toR][toC] = movingPiece;

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'checkers', 'MOVE', {
        from: [fromR, fromC],
        to: [toR, toC],
      }, currentUserId || 'p1');
    }

    setBoard(newBoard);
    setSelectedPos(null);
    setValidMoves([]);

    // Count remaining pieces
    let redCount = 0;
    let blackCount = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (newBoard[r][c]?.player === 'red') redCount++;
        if (newBoard[r][c]?.player === 'black') blackCount++;
      }
    }

    if (redCount === 0 || blackCount === 0) {
      const winPlayer = redCount > 0 ? p1Name : p2Name;
      setWinner(winPlayer);
      sound.playVictory();
      try {
        confetti({ particleCount: 80, spread: 70 });
      } catch (e) {}
      if (onGameEnd) onGameEnd(winPlayer);
      return;
    }

    const nextTurn: PlayerColor = currentTurn === 'red' ? 'black' : 'red';
    setTurn(nextTurn);

    // AI move only triggered when human finishes move and it is bot's turn
    if (mode === 'bot' && nextTurn === 'black') {
      setTimeout(() => {
        executeBotMove(newBoard);
      }, 600);
    }
  };
  const resetGame = () => {
    sound.playClick();
    setBoard(initBoard());
    setSelectedPos(null);
    setValidMoves([]);
    setTurn('red');
    setWinner(null);

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'checkers', 'RESET', {}, currentUserId || 'p1');
    }
  };

  // Piece counts
  let redPieces = 0;
  let blackPieces = 0;
  board.forEach((r) => r.forEach((p) => {
    if (p?.player === 'red') redPieces++;
    if (p?.player === 'black') blackPieces++;
  }));

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full select-none text-slate-100">
      
      {/* Header bar with realistic player badges, avatars and piece count */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-2xl mb-3 text-xs shadow-xl">
        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${turn === 'red' && !winner ? 'bg-rose-950/40 ring-1 ring-rose-500/50' : ''}`}>
          {p1?.avatar ? (
            <AvatarDisplay avatar={p1.avatar} size="sm" />
          ) : (
            <div
              className="w-5 h-5 rounded-full border border-red-300 shadow"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #ff4b72, #b91c1c)',
              }}
            />
          )}
          <div>
            <div className="font-bold text-slate-200 flex items-center gap-1">
              <span>{p1Name}</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            </div>
            <div className="text-[11px] text-rose-400 font-mono">Steine: {redPieces}</div>
          </div>
        </div>

        {isOnlineMultiplayer ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-black">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>LIVE-DAME ({myPlayer ? `Du bist ${myPlayer === 'red' ? 'Rot' : 'Schwarz'}` : 'Zuschauer'})</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setMode('bot');
                resetGame();
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                mode === 'bot' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> KI
            </button>
            <button
              onClick={() => {
                setMode('local2p');
                resetGame();
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                mode === 'local2p' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> 2P Duell
            </button>
          </div>
        )}

        <div className={`flex items-center gap-2 p-1 rounded-xl transition ${turn === 'black' && !winner ? 'bg-slate-800/80 ring-1 ring-slate-400/50' : ''}`}>
          <div className="text-right">
            <div className="font-bold text-slate-200 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              <span>{p2Name}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">Steine: {blackPieces}</div>
          </div>
          {p2?.avatar ? (
            <AvatarDisplay avatar={p2.avatar} size="sm" />
          ) : (
            <div
              className="w-5 h-5 rounded-full border border-slate-500 shadow"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #475569, #0f172a)',
              }}
            />
          )}
        </div>
      </div>

      {/* Turn indicator */}
      <div className="mb-2 text-center text-xs font-semibold">
        {winner ? (
          <div className="text-amber-300 font-bold flex items-center gap-2 animate-bounce bg-amber-500/10 px-4 py-1 rounded-full border border-amber-400/30">
            <Trophy className="w-4 h-4 text-amber-400" /> {winner === 'Red' ? p1Name : p2Name} gewinnt die Partie! 🏆
          </div>
        ) : (
          <span className="text-slate-300">
            Am Zug: <strong className={turn === 'red' ? 'text-rose-400' : 'text-slate-200'}>{turn === 'red' ? `${p1Name} (Rot)` : `${p2Name} (Schwarz)`}</strong>
          </span>
        )}
      </div>

      {/* 8x8 REALISTIC WOODEN CHECKERBOARD WITH INLAID MAHOGANY & MAPLE */}
      <div className="relative rounded-3xl p-3 sm:p-5 border-4 border-amber-950 shadow-2xl max-w-sm sm:max-w-md w-full overflow-hidden bg-amber-950">
        
        {/* Real Wood Grain Background Photo Inlay */}
        <img
          src={TABLE_BACKGROUNDS.mahogany}
          alt="Wood Texture"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.25] contrast-125"
        />

        <div className="relative z-10 grid grid-cols-8 gap-0.5 rounded-2xl overflow-hidden border-2 border-amber-900/90 shadow-2xl bg-amber-950">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = selectedPos?.[0] === r && selectedPos?.[1] === c;
              const isValid = validMoves.some(([mr, mc]) => mr === r && mc === c);

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`aspect-square flex items-center justify-center relative cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950 hover:brightness-110'
                      : 'bg-gradient-to-br from-amber-200 via-amber-100 to-amber-200'
                  } ${isSelected ? 'ring-2 ring-amber-400 z-10' : ''}`}
                >
                  {/* Destination hint indicator */}
                  {isValid && (
                    <div className="w-4 h-4 rounded-full bg-emerald-400/90 animate-ping z-20 shadow-md ring-2 ring-white" />
                  )}

                  {/* 3D Realistic Turned-Wood Draughts Piece */}
                  {cell && (
                    <div
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xl transition-transform ${
                        isSelected ? 'scale-110 -translate-y-1' : ''
                      }`}
                      style={{
                        background:
                          cell.player === 'red'
                            ? 'radial-gradient(circle at 35% 30%, #ff4b72, #dc2626 65%, #7f1d1d 100%)'
                            : 'radial-gradient(circle at 35% 30%, #64748b, #1e293b 65%, #020617 100%)',
                        boxShadow:
                          cell.player === 'red'
                            ? '0 6px 10px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255, 255, 255, 0.7), inset 0 -2px 4px rgba(0, 0, 0, 0.5)'
                            : '0 6px 10px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255, 255, 255, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.8)',
                      }}
                    >
                      {/* Concentric turned wood ridge */}
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center ${
                          cell.player === 'red' ? 'border-red-300/40' : 'border-slate-500/40'
                        }`}
                      >
                        {cell.isKing ? (
                          <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300 drop-shadow animate-pulse" />
                        ) : (
                          <div
                            className={`w-2 h-2 rounded-full ${
                              cell.player === 'red' ? 'bg-red-300/60' : 'bg-slate-400/60'
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={resetGame}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Restart Match
        </button>
      </div>
    </div>
  );
};
