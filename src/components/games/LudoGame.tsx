import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { 
  RefreshCw, 
  Trophy, 
  Bot, 
  Users, 
  Dices, 
  Sparkles, 
  Volume2, 
  ShieldAlert,
  Flame,
  Award
} from 'lucide-react';
import { TABLE_BACKGROUNDS } from '../../services/gameImages';
import { RoomParticipant } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { multiplayerService } from '../../services/multiplayerService';
import { Wifi } from 'lucide-react';

type PlayerColor = 'red' | 'blue' | 'green' | 'yellow';

interface Piece {
  id: number;
  color: PlayerColor;
  // position: -1 is yard/base, 0..39 track on board, 100..103 home columns
  position: number;
}

interface LudoGameProps {
  onGameEnd?: (winner: string) => void;
  tableParticipants?: RoomParticipant[];
  currentUserId?: string;
  onActiveTurnChange?: (turnPlayerId: string) => void;
  roomCode?: string;
  isHost?: boolean;
}

// 40 spaces track coordinates mapped onto an 11x11 grid (traditional German Mensch-ärgere-dich-nicht layout)
// Grid is 0..10 rows, 0..10 cols
const TRACK_COORDS: [number, number][] = [
  // 0 is Red Start
  [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [3, 4], [2, 4], [1, 4], [0, 4], [0, 5],
  // 10 is Blue Start
  [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10], [5, 10],
  // 20 is Green Start
  [6, 10], [6, 9], [6, 8], [6, 7], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [10, 5],
  // 30 is Yellow Start
  [10, 4], [9, 4], [8, 4], [7, 4], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], [5, 0],
];

// Color start positions on the track
const COLOR_START_INDEX: Record<PlayerColor, number> = {
  red: 0,
  blue: 10,
  green: 20,
  yellow: 30,
};

// Home columns (4 spaces each) in 11x11 grid
const HOME_COORDS: Record<PlayerColor, [number, number][]> = {
  red: [[5, 1], [5, 2], [5, 3], [5, 4]],
  blue: [[1, 5], [2, 5], [3, 5], [4, 5]],
  green: [[5, 9], [5, 8], [5, 7], [5, 6]],
  yellow: [[9, 5], [8, 5], [7, 5], [6, 5]],
};

// Yard / Base coordinates for 4 pieces of each color
const YARD_COORDS: Record<PlayerColor, [number, number][]> = {
  red: [[0, 0], [0, 1], [1, 0], [1, 1]],
  blue: [[0, 9], [0, 10], [1, 9], [1, 10]],
  green: [[9, 9], [9, 10], [10, 9], [10, 10]],
  yellow: [[9, 0], [9, 1], [10, 0], [10, 1]],
};

const COLOR_NAMES: Record<PlayerColor, string> = {
  red: 'Rot (Du)',
  blue: 'Blau (KI)',
  green: 'Grün (KI)',
  yellow: 'Gelb (KI)',
};

const COLOR_THEMES: Record<PlayerColor, {
  primary: string;
  gradient: string;
  shadow: string;
  accent: string;
  border: string;
}> = {
  red: {
    primary: '#ef4444',
    gradient: 'linear-gradient(135deg, #f87171 0%, #dc2626 50%, #991b1b 100%)',
    shadow: 'rgba(220, 38, 38, 0.6)',
    accent: '#fee2e2',
    border: '#b91c1c',
  },
  blue: {
    primary: '#3b82f6',
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 50%, #1e40af 100%)',
    shadow: 'rgba(37, 99, 235, 0.6)',
    accent: '#dbeafe',
    border: '#1d4ed8',
  },
  green: {
    primary: '#10b981',
    gradient: 'linear-gradient(135deg, #34d399 0%, #059669 50%, #065f46 100%)',
    shadow: 'rgba(5, 150, 105, 0.6)',
    accent: '#d1fae5',
    border: '#047857',
  },
  yellow: {
    primary: '#f59e0b',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #92400e 100%)',
    shadow: 'rgba(217, 119, 6, 0.6)',
    accent: '#fef3c7',
    border: '#b45309',
  },
};

export const LudoGame: React.FC<LudoGameProps> = ({ 
  onGameEnd,
  tableParticipants,
  currentUserId,
  onActiveTurnChange,
  roomCode,
  isHost
}) => {
  const colorMap: Record<PlayerColor, RoomParticipant | undefined> = {
    red: tableParticipants?.[0],
    blue: tableParticipants?.[1],
    green: tableParticipants?.[2],
    yellow: tableParticipants?.[3],
  };

  const isOnlineMultiplayer = Boolean(roomCode && tableParticipants && tableParticipants.length >= 2);
  const myColor: PlayerColor | null = isOnlineMultiplayer
    ? ((['red', 'blue', 'green', 'yellow'] as PlayerColor[]).find((c) => colorMap[c]?.id === currentUserId) || null)
    : null;

  const getPlayerLabel = (color: PlayerColor) => {
    const p = colorMap[color];
    const colorLabel = color === 'red' ? 'Rot' : color === 'blue' ? 'Blau' : color === 'green' ? 'Grün' : 'Gelb';
    if (p) {
      return `${p.name} (${colorLabel})`;
    }
    return COLOR_NAMES[color];
  };

  const isColorAi = (color: PlayerColor): boolean => {
    const p = colorMap[color];
    if (p) return !!p.isBot;
    if (gameMode === 'pass') return false;
    return color !== 'red';
  };

  const [players, setPlayers] = useState<PlayerColor[]>(['red', 'blue', 'green', 'yellow']);
  const [activeTurn, setActiveTurn] = useState<PlayerColor>('red');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<'ai' | 'pass'>('pass');
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [lastActionLog, setLastActionLog] = useState<string>(() => 
    `Willkommen am Familientisch! ${getPlayerLabel('red')} beginnt. Bitte würfeln.`
  );

  const isMyTurn = !isOnlineMultiplayer || !myColor || activeTurn === myColor;

  useEffect(() => {
    if (onActiveTurnChange) {
      const p = colorMap[activeTurn];
      onActiveTurnChange(p?.id || activeTurn);
    }
  }, [activeTurn, onActiveTurnChange, tableParticipants]);
  
  // 4 pieces per player
  const [pieces, setPieces] = useState<Piece[]>([
    { id: 1, color: 'red', position: -1 },
    { id: 2, color: 'red', position: -1 },
    { id: 3, color: 'red', position: -1 },
    { id: 4, color: 'red', position: -1 },

    { id: 5, color: 'blue', position: -1 },
    { id: 6, color: 'blue', position: -1 },
    { id: 7, color: 'blue', position: -1 },
    { id: 8, color: 'blue', position: -1 },

    { id: 9, color: 'green', position: -1 },
    { id: 10, color: 'green', position: -1 },
    { id: 11, color: 'green', position: -1 },
    { id: 12, color: 'green', position: -1 },

    { id: 13, color: 'yellow', position: -1 },
    { id: 14, color: 'yellow', position: -1 },
    { id: 15, color: 'yellow', position: -1 },
    { id: 16, color: 'yellow', position: -1 },
  ]);

  const [movablePieces, setMovablePieces] = useState<number[]>([]);

  // WebSocket Multiplayer synchronization
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = multiplayerService.subscribeToGameActions((evt) => {
      if (evt.roomCode !== roomCode || evt.gameType !== 'ludo') return;
      if (evt.senderId === currentUserId) return;

      if (evt.action === 'ROLL_DICE') {
        const { color, roll } = evt.payload;
        sound.playDiceRoll();
        setDiceValue(roll);
        setIsRolling(false);
        sound.playChip();
        evaluateMoves(color, roll);
      } else if (evt.action === 'MOVE_PIECE') {
        const { pieceId, roll } = evt.payload;
        applyMovePiece(pieceId, roll);
      } else if (evt.action === 'RESET') {
        resetGameInternal();
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentUserId, pieces, activeTurn, movablePieces, diceValue]);

  // Roll the dice
  const handleRollDice = () => {
    if (isRolling || winner || movablePieces.length > 0) return;
    if (isOnlineMultiplayer && !isMyTurn) {
      sound.playError();
      return;
    }
    setIsRolling(true);
    sound.playDiceRoll();

    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls >= 8) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalVal);
        setIsRolling(false);
        sound.playChip();
        evaluateMoves(activeTurn, finalVal);

        if (roomCode) {
          multiplayerService.sendGameAction(
            roomCode,
            'ludo',
            'ROLL_DICE',
            { color: activeTurn, roll: finalVal },
            currentUserId || 'p1'
          );
        }
      }
    }, 60);
  };

  // Evaluate which pieces the active player can move
  const evaluateMoves = (color: PlayerColor, roll: number) => {
    const playerPieces = pieces.filter((p) => p.color === color);
    const validPieceIds: number[] = [];

    playerPieces.forEach((p) => {
      if (p.position === -1) {
        // Needs a 6 to enter start space
        if (roll === 6) {
          const startTrack = COLOR_START_INDEX[color];
          // Can't move if own piece already on start space
          const occupiedBySelf = pieces.some((other) => other.color === color && other.position === startTrack);
          if (!occupiedBySelf) {
            validPieceIds.push(p.id);
          }
        }
      } else if (p.position >= 0 && p.position < 40) {
        // Track movement
        // Calculate relative steps walked
        const startIndex = COLOR_START_INDEX[color];
        const stepsWalked = (p.position - startIndex + 40) % 40;
        const newStepsWalked = stepsWalked + roll;

        if (newStepsWalked < 40) {
          // Regular track movement
          const targetTrack = (p.position + roll) % 40;
          const occupiedBySelf = pieces.some((other) => other.color === color && other.position === targetTrack);
          if (!occupiedBySelf) {
            validPieceIds.push(p.id);
          }
        } else if (newStepsWalked <= 43) {
          // Reaches home column (100..103)
          const targetHome = 100 + (newStepsWalked - 40);
          const occupiedBySelf = pieces.some((other) => other.color === color && other.position === targetHome);
          if (!occupiedBySelf) {
            validPieceIds.push(p.id);
          }
        }
      } else if (p.position >= 100 && p.position <= 103) {
        // Moving within home column
        const targetHome = p.position + roll;
        if (targetHome <= 103) {
          const occupiedBySelf = pieces.some((other) => other.color === color && other.position === targetHome);
          if (!occupiedBySelf) {
            validPieceIds.push(p.id);
          }
        }
      }
    });

    if (validPieceIds.length === 0) {
      setLastActionLog(`${getPlayerLabel(color)} hat eine ${roll} gewürfelt, kann aber keine Figur ziehen.`);
      // Next turn
      setTimeout(() => {
        passTurn(color, roll === 6);
      }, 1000);
    } else {
      setMovablePieces(validPieceIds);
      setLastActionLog(`${getPlayerLabel(color)} hat eine ${roll} gewürfelt! Wähle eine Figur zum Ziehen.`);

      // If active player is AI, make move automatically after a short delay
      if (isColorAi(color)) {
        setTimeout(() => {
          // Pick best move: prioritize capturing opponents, then getting out with a 6, then furthest
          const chosenPieceId = pickBestAiPiece(validPieceIds, color, roll);
          handleMovePiece(chosenPieceId, roll);
        }, 900);
      }
    }
  };

  // Smart AI piece selection
  const pickBestAiPiece = (validIds: number[], color: PlayerColor, roll: number): number => {
    // 1. Check if any move captures an opponent
    for (const id of validIds) {
      const piece = pieces.find((p) => p.id === id)!;
      if (piece.position >= 0 && piece.position < 40) {
        const targetTrack = (piece.position + roll) % 40;
        const opponent = pieces.find((p) => p.color !== color && p.position === targetTrack);
        if (opponent) return id;
      }
    }
    // 2. If rolled 6, prioritize bringing piece out of yard
    if (roll === 6) {
      const yardPiece = validIds.find((id) => pieces.find((p) => p.id === id)?.position === -1);
      if (yardPiece) return yardPiece;
    }
    // 3. Otherwise pick furthest piece
    return validIds[0];
  };

  // Apply the move to pieces and game state
  const applyMovePiece = (pieceId: number, roll: number) => {
    sound.playChip();
    const movingPiece = pieces.find((p) => p.id === pieceId);
    if (!movingPiece) return;
    let targetPos = movingPiece.position;
    let captureOccurred = false;
    let capturedName = '';

    if (movingPiece.position === -1) {
      targetPos = COLOR_START_INDEX[movingPiece.color];
    } else if (movingPiece.position >= 0 && movingPiece.position < 40) {
      const startIndex = COLOR_START_INDEX[movingPiece.color];
      const stepsWalked = (movingPiece.position - startIndex + 40) % 40;
      const newStepsWalked = stepsWalked + roll;

      if (newStepsWalked < 40) {
        targetPos = (movingPiece.position + roll) % 40;
      } else {
        targetPos = 100 + (newStepsWalked - 40);
      }
    } else if (movingPiece.position >= 100 && movingPiece.position <= 103) {
      targetPos = movingPiece.position + roll;
    }

    // Update piece position and check for captures on track
    setPieces((prev) =>
      prev.map((p) => {
        if (p.id === pieceId) {
          return { ...p, position: targetPos };
        }
        // Capture opponent on track space (0..39)
        if (targetPos >= 0 && targetPos < 40 && p.position === targetPos && p.color !== movingPiece.color) {
          captureOccurred = true;
          capturedName = COLOR_NAMES[p.color];
          return { ...p, position: -1 }; // Send back to yard
        }
        return p;
      })
    );

    setMovablePieces([]);
    setDiceValue(null);

    if (captureOccurred) {
      sound.playSuccess();
      setLastActionLog(`💥 Mensch ärgere Dich nicht! ${COLOR_NAMES[movingPiece.color]} hat ${capturedName} geschlagen und zurück in den Hof geschickt!`);
    } else {
      setLastActionLog(`${COLOR_NAMES[movingPiece.color]} rückt vor auf Feld ${targetPos >= 100 ? `Ziel ${targetPos - 99}` : targetPos + 1}.`);
    }

    // Check Win Condition (all 4 pieces in home 100..103)
    setTimeout(() => {
      checkWinCondition(movingPiece.color, roll === 6);
    }, 400);
  };

  // Move the selected piece
  const handleMovePiece = (pieceId: number, rollOverride?: number) => {
    if (!movablePieces.includes(pieceId)) return;
    const roll = rollOverride ?? diceValue;
    if (!roll) return;

    if (isOnlineMultiplayer && myColor && activeTurn !== myColor) {
      sound.playError();
      return;
    }

    applyMovePiece(pieceId, roll);

    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'ludo', 'MOVE_PIECE', { pieceId, roll }, currentUserId || 'p1');
    }
  };

  const checkWinCondition = (color: PlayerColor, rolledSix: boolean) => {
    // Current positions after move
    const playerPieces = pieces.filter((p) => p.color === color);
    const homeCount = playerPieces.filter((p) => p.position >= 100).length;

    if (homeCount === 4) {
      setWinner(color);
      sound.playVictory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      if (onGameEnd) onGameEnd(getPlayerLabel(color));
      setLastActionLog(`🏆 SIEG! ${getPlayerLabel(color)} hat alle 4 Spielfiguren ins Ziel gebracht!`);
    } else {
      passTurn(color, rolledSix);
    }
  };

  const passTurn = (currentColor: PlayerColor, rolledSix: boolean) => {
    if (rolledSix) {
      setLastActionLog(`${getPlayerLabel(currentColor)} hat eine 6 gewürfelt und darf noch einmal!`);
      if (isColorAi(currentColor)) {
        setTimeout(handleRollDice, 800);
      }
      return;
    }

    const currentIndex = players.indexOf(currentColor);
    const nextColor = players[(currentIndex + 1) % players.length];
    setActiveTurn(nextColor);
    setMovablePieces([]);
    setDiceValue(null);
    setLastActionLog(`${getPlayerLabel(nextColor)} ist am Zug. Bitte würfeln.`);

    if (isColorAi(nextColor)) {
      setTimeout(handleRollDice, 1000);
    }
  };

  const resetGameInternal = () => {
    setPieces([
      { id: 1, color: 'red', position: -1 },
      { id: 2, color: 'red', position: -1 },
      { id: 3, color: 'red', position: -1 },
      { id: 4, color: 'red', position: -1 },
      { id: 5, color: 'blue', position: -1 },
      { id: 6, color: 'blue', position: -1 },
      { id: 7, color: 'blue', position: -1 },
      { id: 8, color: 'blue', position: -1 },
      { id: 9, color: 'green', position: -1 },
      { id: 10, color: 'green', position: -1 },
      { id: 11, color: 'green', position: -1 },
      { id: 12, color: 'green', position: -1 },
      { id: 13, color: 'yellow', position: -1 },
      { id: 14, color: 'yellow', position: -1 },
      { id: 15, color: 'yellow', position: -1 },
      { id: 16, color: 'yellow', position: -1 },
    ]);
    setActiveTurn('red');
    setDiceValue(null);
    setIsRolling(false);
    setMovablePieces([]);
    setWinner(null);
    setLastActionLog('Neues Spiel gestartet. Rot beginnt. Bitte würfeln.');
  };

  const resetGame = () => {
    sound.playClick();
    resetGameInternal();
    if (roomCode) {
      multiplayerService.sendGameAction(roomCode, 'ludo', 'RESET', {}, currentUserId || 'p1');
    }
  };

  // Render a 3D Realistic Halma Cone Figure (Holzkegel mit Kugelspitze)
  const renderWoodenConeFigure = (piece: Piece, isMovable: boolean) => {
    const theme = COLOR_THEMES[piece.color];

    return (
      <div
        onClick={() => isMovable && handleMovePiece(piece.id)}
        className={`relative flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-300 z-20 ${
          isMovable ? 'animate-bounce scale-125 hover:brightness-125' : ''
        }`}
        style={{ width: '28px', height: '36px' }}
        title={`${COLOR_NAMES[piece.color]} Figur #${piece.id}`}
      >
        {/* Glow Ring if Movable */}
        {isMovable && (
          <div className="absolute inset-0 -m-1 rounded-full border-2 border-amber-300 animate-ping opacity-75" />
        )}

        {/* 1. Spherical Turned-Wood Head */}
        <div
          className="w-4 h-4 rounded-full relative z-10 shadow-md"
          style={{
            background: theme.gradient,
            boxShadow: `0 2px 4px rgba(0,0,0,0.5), inset 1px 1px 2px rgba(255,255,255,0.7), inset -1px -1px 2px rgba(0,0,0,0.4)`,
          }}
        >
          {/* Specular highlight */}
          <div className="absolute top-0.5 left-1 w-1.5 h-1.5 bg-white/70 rounded-full blur-[0.3px]" />
        </div>

        {/* 2. Turned Neck Ring */}
        <div
          className="w-2.5 h-1 -my-0.5 relative z-10 rounded-sm"
          style={{
            background: theme.border,
            boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.5)',
          }}
        />

        {/* 3. Conical Skirt Body (Halma Cone) */}
        <div
          className="w-5 h-4.5 rounded-b-xl relative z-0 shadow-lg"
          style={{
            background: theme.gradient,
            clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
            boxShadow: `0 3px 6px rgba(0,0,0,0.6), inset 1px 1px 3px rgba(255,255,255,0.5)`,
          }}
        >
          {/* Subtle wooden lathe groove */}
          <div className="absolute top-1 inset-x-0 h-0.5 bg-black/20" />
        </div>

        {/* 4. Weighted Base Ring & Drop Shadow on Board */}
        <div
          className="w-6 h-2 -mt-1 rounded-full filter blur-[0.8px]"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, transparent 80%)',
          }}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto select-none text-slate-100 font-sans">
      
      {/* Top Controls & Status Bar */}
      <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-3 sm:p-4 mb-4 shadow-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Player Badge with Avatar */}
        <div className="flex items-center gap-3">
          {colorMap[activeTurn]?.avatar ? (
            <div className="p-1 rounded-2xl ring-2 ring-amber-400/80 shadow-lg">
              <AvatarDisplay avatar={colorMap[activeTurn]!.avatar} size="md" />
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md"
              style={{
                background: COLOR_THEMES[activeTurn].gradient,
                boxShadow: `0 4px 12px ${COLOR_THEMES[activeTurn].shadow}`,
              }}
            >
              <Award className="w-5 h-5 text-white drop-shadow" />
            </div>
          )}
          <div>
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <span>Am Zug:</span>
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ background: COLOR_THEMES[activeTurn].primary }}
              />
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{getPlayerLabel(activeTurn)}</span>
              {activeTurn === 'red' && <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Dein Zug</span>}
              {isColorAi(activeTurn) && <span className="text-[10px] text-sky-400 font-semibold bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">KI</span>}
            </div>
          </div>
        </div>

        {/* Middle: Game Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setGameMode('ai');
              resetGame();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              gameMode === 'ai' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> 1P vs. Familien-KI
          </button>
          <button
            onClick={() => {
              setGameMode('pass');
              resetGame();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              gameMode === 'pass' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> 4P Familientisch
          </button>
        </div>

        {/* Right: Reset Button */}
        <button
          onClick={resetGame}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          title="Spiel zurücksetzen"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Board & Action Area */}
      <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-6">
        
        {/* THE REAL CLASSIC WOODEN GAME BOARD (11x11 Grid) */}
        <div className="relative p-4 sm:p-6 rounded-3xl border-4 border-amber-950 shadow-2xl overflow-hidden bg-amber-950 max-w-[520px] w-full">
          
          {/* Authentic Polished Walnut Tabletop Inlay */}
          <img
            src={TABLE_BACKGROUNDS.mahogany}
            alt="Wooden Board Texture"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.45] contrast-125"
          />

          {/* Golden Lacquered Border Groove */}
          <div className="relative z-10 border-2 border-amber-600/40 rounded-2xl p-2 sm:p-3 bg-amber-900/40 backdrop-blur-[1px] shadow-inner">
            
            <div className="grid grid-cols-11 gap-1 sm:gap-1.5 aspect-square w-full">
              {Array.from({ length: 11 }).map((_, r) =>
                Array.from({ length: 11 }).map((_, c) => {
                  // Determine space type
                  // 1. Is Track Space?
                  const trackIndex = TRACK_COORDS.findIndex(([tr, tc]) => tr === r && tc === c);
                  
                  // 2. Is Yard / Base Space?
                  let yardColor: PlayerColor | null = null;
                  let yardPieceIndex = -1;
                  for (const col of ['red', 'blue', 'green', 'yellow'] as PlayerColor[]) {
                    const matchIdx = YARD_COORDS[col].findIndex(([yr, yc]) => yr === r && yc === c);
                    if (matchIdx !== -1) {
                      yardColor = col;
                      yardPieceIndex = matchIdx;
                      break;
                    }
                  }

                  // 3. Is Home Target Space?
                  let homeColor: PlayerColor | null = null;
                  let homeIndex = -1;
                  for (const col of ['red', 'blue', 'green', 'yellow'] as PlayerColor[]) {
                    const matchIdx = HOME_COORDS[col].findIndex(([hr, hc]) => hr === r && hc === c);
                    if (matchIdx !== -1) {
                      homeColor = col;
                      homeIndex = matchIdx;
                      break;
                    }
                  }

                  const isTrack = trackIndex !== -1;
                  const isYard = yardColor !== null;
                  const isHome = homeColor !== null;

                  // Find which piece (if any) sits here
                  let pieceHere: Piece | undefined;
                  if (isTrack) {
                    pieceHere = pieces.find((p) => p.position === trackIndex);
                  } else if (isYard && yardColor) {
                    // Pieces of this color with position -1
                    const yardPiecesOfColor = pieces.filter((p) => p.color === yardColor && p.position === -1);
                    pieceHere = yardPiecesOfColor[yardPieceIndex];
                  } else if (isHome && homeColor) {
                    const targetPos = 100 + homeIndex;
                    pieceHere = pieces.find((p) => p.color === homeColor && p.position === targetPos);
                  }

                  const isMovable = pieceHere ? movablePieces.includes(pieceHere.id) : false;

                  // If empty background space (not part of cross or yards)
                  if (!isTrack && !isYard && !isHome) {
                    return <div key={`${r}-${c}`} className="aspect-square" />;
                  }

                  // Determine color styling for the sunken wooden hole / field
                  let fieldBg = 'bg-amber-100/90 shadow-inner border border-amber-950/40';
                  let startMarker = false;

                  if (isTrack) {
                    if (trackIndex === 0) { fieldBg = 'bg-rose-500 shadow-lg border-2 border-rose-300'; startMarker = true; }
                    else if (trackIndex === 10) { fieldBg = 'bg-blue-500 shadow-lg border-2 border-blue-300'; startMarker = true; }
                    else if (trackIndex === 20) { fieldBg = 'bg-emerald-500 shadow-lg border-2 border-emerald-300'; startMarker = true; }
                    else if (trackIndex === 30) { fieldBg = 'bg-amber-400 shadow-lg border-2 border-amber-200'; startMarker = true; }
                    else { fieldBg = 'bg-amber-200/90 border border-amber-800 shadow-inner'; }
                  } else if (isYard && yardColor) {
                    const t = COLOR_THEMES[yardColor];
                    fieldBg = `border-2 border-amber-400/30`;
                  } else if (isHome && homeColor) {
                    if (homeColor === 'red') fieldBg = 'bg-rose-600/80 border border-rose-300 shadow-inner';
                    else if (homeColor === 'blue') fieldBg = 'bg-blue-600/80 border border-blue-300 shadow-inner';
                    else if (homeColor === 'green') fieldBg = 'bg-emerald-600/80 border border-emerald-300 shadow-inner';
                    else if (homeColor === 'yellow') fieldBg = 'bg-amber-500/80 border border-amber-200 shadow-inner';
                  }

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`aspect-square rounded-full flex items-center justify-center relative transition-all ${
                        isYard ? 'bg-amber-950/60 p-0.5' : ''
                      }`}
                    >
                      {/* Sunken Hole Effect */}
                      <div
                        className={`w-full h-full rounded-full flex items-center justify-center relative ${fieldBg}`}
                        style={{
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)',
                        }}
                      >
                        {/* Start Marker Star */}
                        {startMarker && !pieceHere && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}

                        {/* Home Label A, B, C, D */}
                        {isHome && !pieceHere && (
                          <span className="text-[9px] font-black text-white/90">
                            {['A', 'B', 'C', 'D'][homeIndex]}
                          </span>
                        )}

                        {/* RENDER THE 3D WOODEN CONE FIGURE IF PRESENT */}
                        {pieceHere && renderWoodenConeFigure(pieceHere, isMovable)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* SIDE PANEL: 3D DICE SHAKER & ACTION LOG */}
        <div className="w-full lg:w-72 flex flex-col items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl">
          
          <div className="w-full text-center">
            <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1.5 mb-1">
              <Dices className="w-4 h-4 text-amber-400" />
              <span>Würfelbecher</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isOnlineMultiplayer
                ? (isMyTurn ? 'Du bist am Zug! Klicke zum Würfeln.' : `Warte auf ${getPlayerLabel(activeTurn)}...`)
                : (activeTurn === 'red' || gameMode === 'pass'
                  ? 'Klicke zum Würfeln (Bei 6 darfst du raus und nochmal!)'
                  : 'KI würfelt automatisch...')}
            </p>
          </div>

          {/* 3D Rolling Dice & Leather Cup Station */}
          <div
            onClick={() => (!isOnlineMultiplayer ? (activeTurn === 'red' || gameMode === 'pass') : isMyTurn) && handleRollDice()}
            className={`w-36 h-36 rounded-2xl flex flex-col items-center justify-center relative cursor-pointer transition-all duration-300 ${
              isRolling ? 'scale-105 rotate-6' : 'hover:scale-105'
            } ${
              movablePieces.length > 0 ? 'opacity-80 cursor-default' : ''
            }`}
            style={{
              background: 'radial-gradient(circle at 40% 30%, #334155, #0f172a)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.2)',
              border: '2px solid rgba(148, 163, 184, 0.2)',
            }}
          >
            {diceValue !== null ? (
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 text-slate-950 flex items-center justify-center font-black text-4xl shadow-2xl border-2 border-amber-200 transform transition-transform ${
                  isRolling ? 'rotate-45 scale-90' : 'scale-100'
                }`}
                style={{
                  boxShadow: '0 10px 20px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(0,0,0,0.2)',
                }}
              >
                {/* Authentic Pips for 1-6 */}
                <div className="w-full h-full p-2.5 grid grid-cols-3 grid-rows-3 gap-1 items-center justify-items-center">
                  {diceValue === 1 && (
                    <div className="col-start-2 row-start-2 w-3.5 h-3.5 rounded-full bg-rose-600 shadow-inner" />
                  )}
                  {diceValue === 2 && (
                    <>
                      <div className="col-start-1 row-start-1 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner" />
                      <div className="col-start-3 row-start-3 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner" />
                    </>
                  )}
                  {diceValue === 3 && (
                    <>
                      <div className="col-start-1 row-start-1 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner" />
                      <div className="col-start-2 row-start-2 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner" />
                      <div className="col-start-3 row-start-3 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner" />
                    </>
                  )}
                  {diceValue === 4 && (
                    <>
                      <div className="col-start-1 row-start-1 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner" />
                      <div className="col-start-3 row-start-1 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner" />
                      <div className="col-start-1 row-start-3 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner" />
                      <div className="col-start-3 row-start-3 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner" />
                    </>
                  )}
                  {diceValue === 5 && (
                    <>
                      <div className="col-start-1 row-start-1 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner" />
                      <div className="col-start-3 row-start-1 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner" />
                      <div className="col-start-2 row-start-2 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner" />
                      <div className="col-start-1 row-start-3 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner" />
                      <div className="col-start-3 row-start-3 w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner" />
                    </>
                  )}
                  {diceValue === 6 && (
                    <>
                      <div className="col-start-1 row-start-1 w-2.5 h-2.5 rounded-full bg-rose-600 shadow-inner" />
                      <div className="col-start-3 row-start-1 w-2.5 h-2.5 rounded-full bg-rose-600 shadow-inner" />
                      <div className="col-start-1 row-start-2 w-2.5 h-2.5 rounded-full bg-rose-600 shadow-inner" />
                      <div className="col-start-3 row-start-2 w-2.5 h-2.5 rounded-full bg-rose-600 shadow-inner" />
                      <div className="col-start-1 row-start-3 w-2.5 h-2.5 rounded-full bg-rose-600 shadow-inner" />
                      <div className="col-start-3 row-start-3 w-2.5 h-2.5 rounded-full bg-rose-600 shadow-inner" />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Dices className="w-10 h-10 text-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-300">Würfelbecher schütteln</span>
              </div>
            )}
          </div>

          {/* Roll Button */}
          <button
            onClick={() => (activeTurn === 'red' || gameMode === 'pass') && handleRollDice()}
            disabled={isRolling || movablePieces.length > 0 || (gameMode === 'ai' && activeTurn !== 'red')}
            className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 ${
              isRolling || movablePieces.length > 0 || (gameMode === 'ai' && activeTurn !== 'red')
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40 active:scale-95'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>{isRolling ? 'Würfelt...' : 'Jetzt Würfeln'}</span>
          </button>

          {/* Action Log Box */}
          <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
              Spieltisch-Protokoll:
            </div>
            <p className="font-medium leading-relaxed text-amber-200/90">
              {lastActionLog}
            </p>
          </div>

          {/* Winner Banner */}
          {winner && (
            <div className="w-full bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3 text-center animate-bounce">
              <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-1" />
              <div className="text-sm font-bold text-emerald-300">
                {COLOR_NAMES[winner]} hat gewonnen!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
