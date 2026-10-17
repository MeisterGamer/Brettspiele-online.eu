import React from 'react';
import { 
  BoardSpace, 
  BOARD_SPACES, 
  PROPERTY_GROUP_COLORS 
} from './monopolyData';
import { MonopolyPlayerState } from './MonopolyTradeModal';
import { MonopolyFigureRenderer } from './MonopolyFigureRenderer';
import { MonopolyFigureId } from './monopolyData';
import { sound } from '../../../services/sound';

interface MonopolyBoardRendererProps {
  players: MonopolyPlayerState[];
  currentTurnPlayerId: string;
  dice: [number, number];
  isRolling: boolean;
  freeParkingPot: number;
  onSelectSpace: (space: BoardSpace) => void;
  onRollDice: () => void;
  canRoll: boolean;
  isMyTurn: boolean;
}

// Maps board index 0..39 to 11x11 CSS grid [row, col] (1-indexed)
const SPACE_GRID_POSITIONS: Record<number, { row: number; col: number; orientation: 'bottom' | 'left' | 'top' | 'right' | 'corner' }> = {
  // Bottom Row
  0: { row: 11, col: 11, orientation: 'corner' },
  1: { row: 11, col: 10, orientation: 'bottom' },
  2: { row: 11, col: 9, orientation: 'bottom' },
  3: { row: 11, col: 8, orientation: 'bottom' },
  4: { row: 11, col: 7, orientation: 'bottom' },
  5: { row: 11, col: 6, orientation: 'bottom' },
  6: { row: 11, col: 5, orientation: 'bottom' },
  7: { row: 11, col: 4, orientation: 'bottom' },
  8: { row: 11, col: 3, orientation: 'bottom' },
  9: { row: 11, col: 2, orientation: 'bottom' },
  10: { row: 11, col: 1, orientation: 'corner' },

  // Left Column
  11: { row: 10, col: 1, orientation: 'left' },
  12: { row: 9, col: 1, orientation: 'left' },
  13: { row: 8, col: 1, orientation: 'left' },
  14: { row: 7, col: 1, orientation: 'left' },
  15: { row: 6, col: 1, orientation: 'left' },
  16: { row: 5, col: 1, orientation: 'left' },
  17: { row: 4, col: 1, orientation: 'left' },
  18: { row: 3, col: 1, orientation: 'left' },
  19: { row: 2, col: 1, orientation: 'left' },
  20: { row: 1, col: 1, orientation: 'corner' },

  // Top Row
  21: { row: 1, col: 2, orientation: 'top' },
  22: { row: 1, col: 3, orientation: 'top' },
  23: { row: 1, col: 4, orientation: 'top' },
  24: { row: 1, col: 5, orientation: 'top' },
  25: { row: 1, col: 6, orientation: 'top' },
  26: { row: 1, col: 7, orientation: 'top' },
  27: { row: 1, col: 8, orientation: 'top' },
  28: { row: 1, col: 9, orientation: 'top' },
  29: { row: 1, col: 10, orientation: 'top' },
  30: { row: 1, col: 11, orientation: 'corner' },

  // Right Column
  31: { row: 2, col: 11, orientation: 'right' },
  32: { row: 3, col: 11, orientation: 'right' },
  33: { row: 4, col: 11, orientation: 'right' },
  34: { row: 5, col: 11, orientation: 'right' },
  35: { row: 6, col: 11, orientation: 'right' },
  36: { row: 7, col: 11, orientation: 'right' },
  37: { row: 8, col: 11, orientation: 'right' },
  38: { row: 9, col: 11, orientation: 'right' },
  39: { row: 10, col: 11, orientation: 'right' },
};

export const MonopolyBoardRenderer: React.FC<MonopolyBoardRendererProps> = ({
  players,
  currentTurnPlayerId,
  dice,
  isRolling,
  freeParkingPot,
  onSelectSpace,
  onRollDice,
  canRoll,
  isMyTurn,
}) => {
  // Find which player owns which space
  const getSpaceOwner = (spaceIndex: number) => {
    return players.find(p => p.properties.includes(spaceIndex));
  };

  // Find total houses on a space
  const getSpaceHouses = (spaceIndex: number) => {
    for (const p of players) {
      if (p.houses[spaceIndex] !== undefined) {
        return p.houses[spaceIndex];
      }
    }
    return 0;
  };

  // Find players on this space
  const getPlayersOnSpace = (spaceIndex: number) => {
    return players.filter(p => !p.isBankrupt && p.position === spaceIndex);
  };

  return (
    <div className="relative w-full max-w-[min(96vw,720px)] aspect-square bg-[#063323] p-1.5 sm:p-3 rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] border-4 sm:border-8 border-[#1f2937] select-none touch-manipulation overflow-hidden">
      {/* 11x11 Grid Board */}
      <div 
        className="w-full h-full grid grid-cols-11 grid-rows-11 gap-[1px] sm:gap-[2px] bg-[#031d14] rounded-xl sm:rounded-2xl p-[1px] sm:p-[2px] border border-amber-500/30"
      >
        {/* Render 40 Perimeter Spaces */}
        {BOARD_SPACES.map((space) => {
          const pos = SPACE_GRID_POSITIONS[space.index];
          if (!pos) return null;

          const owner = getSpaceOwner(space.index);
          const houses = getSpaceHouses(space.index);
          const playersHere = getPlayersOnSpace(space.index);
          const isCorner = pos.orientation === 'corner';
          const groupColor = space.group ? PROPERTY_GROUP_COLORS[space.group] : null;

          return (
            <div
              key={space.index}
              onClick={() => {
                sound.playClick();
                onSelectSpace(space);
              }}
              style={{
                gridRow: pos.row,
                gridColumn: pos.col,
              }}
              className={`relative cursor-pointer transition-all duration-150 flex flex-col justify-between overflow-hidden ${
                isCorner 
                  ? 'bg-amber-50 hover:bg-amber-100 text-slate-900 rounded-sm sm:rounded' 
                  : 'bg-emerald-50 hover:bg-white text-slate-900'
              }`}
            >
              {/* Property Top Color Banner (for properties) */}
              {groupColor && pos.orientation === 'top' && (
                <div 
                  className="w-full h-2.5 sm:h-4.5 border-b border-slate-900 shrink-0" 
                  style={{ backgroundColor: groupColor.bg }} 
                />
              )}
              {groupColor && pos.orientation === 'bottom' && (
                <div 
                  className="w-full h-2.5 sm:h-4.5 border-b border-slate-900 shrink-0" 
                  style={{ backgroundColor: groupColor.bg }} 
                />
              )}
              {groupColor && pos.orientation === 'left' && (
                <div 
                  className="absolute top-0 bottom-0 right-0 w-2.5 sm:w-4 border-l border-slate-900" 
                  style={{ backgroundColor: groupColor.bg }} 
                />
              )}
              {groupColor && pos.orientation === 'right' && (
                <div 
                  className="absolute top-0 bottom-0 left-0 w-2.5 sm:w-4 border-r border-slate-900" 
                  style={{ backgroundColor: groupColor.bg }} 
                />
              )}

              {/* Houses / Hotels Indicator on tile */}
              {houses > 0 && (
                <div className="absolute top-0.5 right-0.5 z-10 flex gap-0.5">
                  {houses === 5 ? (
                    // Red Hotel
                    <span 
                      title="Hotel" 
                      className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-rose-600 rounded-xs border border-rose-900 shadow-sm flex items-center justify-center text-[7px] text-white font-black"
                    >
                      H
                    </span>
                  ) : (
                    // Green Houses
                    Array.from({ length: houses }).map((_, i) => (
                      <span 
                        key={i} 
                        className="w-1.5 h-2 sm:w-2 sm:h-2.5 bg-emerald-600 rounded-xs border border-emerald-900 shadow-xs" 
                      />
                    ))
                  )}
                </div>
              )}

              {/* Owner Colored Badge Ribbon */}
              {owner && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 z-10"
                  style={{ backgroundColor: owner.color }}
                  title={`Besitzer: ${owner.name}`}
                />
              )}

              {/* Space Content */}
              <div className="p-0.5 sm:p-1 flex flex-col items-center justify-center flex-1 text-center leading-none">
                {space.icon && (
                  <span className="text-[10px] sm:text-base leading-none mb-0.5">
                    {space.icon}
                  </span>
                )}
                
                <span className="text-[7px] sm:text-[9px] font-black tracking-tighter line-clamp-2 text-slate-800">
                  {space.name}
                </span>

                {space.price && (
                  <span className="text-[6px] sm:text-[8px] font-bold text-slate-600 mt-auto font-mono">
                    {space.price} €
                  </span>
                )}
              </div>

              {/* Real Figures Present on this Tile */}
              {playersHere.length > 0 && (
                <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center gap-0.5 p-0.5 flex-wrap">
                  {playersHere.map((p) => (
                    <div 
                      key={p.id}
                      className="relative transform transition-transform duration-300 scale-90 sm:scale-100"
                      title={`${p.name} (${p.figure})`}
                    >
                      <MonopolyFigureRenderer 
                        figureId={p.figure as MonopolyFigureId} 
                        size={18} 
                        isAnimated={p.id === currentTurnPlayerId}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Center Board Luxury Area (Rows 2-10, Cols 2-10) */}
        <div 
          style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}
          className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#0c3f2d] via-[#082b1e] to-[#041710] p-2 sm:p-6 flex flex-col justify-between items-center text-white border-2 border-amber-500/20 shadow-inner"
        >
          {/* Subtle Felt Texture & Gold Trim */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Top Center: Free Parking Pot */}
          <div className="relative z-10 flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-slate-950/70 border border-amber-500/40 shadow-lg text-amber-300">
            <span className="text-xs sm:text-sm">🚗</span>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              Frei Parken Jackpot: <span className="font-mono text-emerald-400 font-black">{freeParkingPot} €</span>
            </div>
          </div>

          {/* Middle: Monopoly 2026 Core Emblem */}
          <div className="relative z-10 text-center my-auto">
            <div className="inline-block px-4 py-1 sm:px-8 sm:py-2 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 border-2 border-white/60 shadow-[0_10px_30px_rgba(220,38,38,0.5)] transform -rotate-2 mb-2">
              <h1 className="text-xl sm:text-4xl font-display font-black tracking-wider text-white drop-shadow-md">
                MONOPOLY
              </h1>
            </div>
            <div className="text-[9px] sm:text-xs font-black tracking-[0.25em] text-amber-400 uppercase drop-shadow">
              2026 NEXT-GEN MULTIPLAYER
            </div>

            {/* 3D Dice Display in Center */}
            <div className="flex items-center justify-center gap-3 sm:gap-5 mt-3 sm:mt-4">
              {/* Die 1 */}
              <div 
                className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white text-slate-900 border-2 border-slate-300 shadow-2xl flex items-center justify-center text-xl sm:text-3xl font-black font-mono transition-transform duration-200 ${
                  isRolling ? 'animate-spin scale-110' : 'transform -rotate-6'
                }`}
              >
                {dice[0]}
              </div>

              {/* Die 2 */}
              <div 
                className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-amber-300 text-slate-900 border-2 border-amber-400 shadow-2xl flex items-center justify-center text-xl sm:text-3xl font-black font-mono transition-transform duration-200 ${
                  isRolling ? 'animate-spin scale-110' : 'transform rotate-6'
                }`}
              >
                {dice[1]}
              </div>
            </div>

            {/* Roll Dice Button in Center */}
            {canRoll && isMyTurn && (
              <button
                onClick={() => {
                  sound.playDiceRoll();
                  onRollDice();
                }}
                disabled={isRolling}
                className="mt-3 sm:mt-5 px-5 py-2 sm:px-8 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-[0_8px_25px_rgba(245,158,11,0.5)] transition transform hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
              >
                <span>🎲 Würfeln ({dice[0] + dice[1]})</span>
              </button>
            )}
          </div>

          {/* Bottom Card Decks in Center Board */}
          <div className="relative z-10 w-full flex justify-between items-center px-2 sm:px-6">
            {/* Chance Card Deck */}
            <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-orange-600/90 text-white border-2 border-orange-400/60 shadow-lg text-center transform -rotate-3 cursor-pointer hover:scale-105 transition">
              <div className="text-[10px] sm:text-xs font-black uppercase">❓ Ereignis</div>
            </div>

            {/* Community Card Deck */}
            <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-blue-600/90 text-white border-2 border-blue-400/60 shadow-lg text-center transform rotate-3 cursor-pointer hover:scale-105 transition">
              <div className="text-[10px] sm:text-xs font-black uppercase">📦 Gemeinschaft</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
