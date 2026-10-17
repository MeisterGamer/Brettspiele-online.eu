import React from 'react';
import { RommeCard, SUIT_SYMBOLS, SUIT_COLORS } from './rommeData';

interface RommeCardRendererProps {
  card?: RommeCard | null;
  isFaceDown?: boolean;
  isSelected?: boolean;
  isPlayable?: boolean;
  stackCount?: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export const RommeCardRenderer: React.FC<RommeCardRendererProps> = ({
  card,
  isFaceDown = false,
  isSelected = false,
  isPlayable = false,
  stackCount = 0,
  onClick,
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const dimensions = {
    sm: 'w-10 h-15 sm:w-12 sm:h-18 text-xs',
    md: 'w-14 h-21 sm:w-16 sm:h-24 text-sm',
    lg: 'w-16 h-24 sm:w-20 sm:h-30 text-base',
  }[size];

  // Face-down card (Draw Pile / Talon)
  if (isFaceDown || !card) {
    return (
      <div
        onClick={!disabled && onClick ? onClick : undefined}
        className={`relative ${dimensions} rounded-xl sm:rounded-2xl transition-all duration-200 select-none overflow-hidden ${
          disabled ? 'cursor-default' : onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
        } ${isSelected ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 shadow-xl' : ''} ${className}`}
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0f172a 100%)',
          boxShadow: '0 6px 14px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
          border: '2px solid #3b82f6',
        }}
      >
        {stackCount > 1 && (
          <div className="absolute -bottom-1 -right-1 w-full h-full rounded-xl sm:rounded-2xl bg-slate-950/60 -z-10 border border-blue-950" />
        )}
        {stackCount > 5 && (
          <div className="absolute -bottom-2 -right-2 w-full h-full rounded-xl sm:rounded-2xl bg-slate-950/40 -z-20 border border-blue-950" />
        )}

        {/* Card Back Ornamental Diamond Guilloche Pattern */}
        <div className="w-full h-full p-1 sm:p-1.5 flex items-center justify-center">
          <div className="w-full h-full rounded-lg sm:rounded-xl border border-sky-400/40 bg-gradient-to-br from-blue-900 to-indigo-950 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:6px_6px]" />
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-amber-400/60 flex items-center justify-center text-amber-300 text-xs sm:text-sm font-black shadow-md">
              🂠
            </div>
          </div>
        </div>

        {stackCount > 0 && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-slate-950/80 text-[9px] font-mono font-black text-sky-300 border border-sky-500/40 shadow">
            {stackCount}
          </div>
        )}
      </div>
    );
  }

  // Face-up Card:
  const isJoker = card.rank === 'JOKER';
  const suitColor = SUIT_COLORS[card.suit];
  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const rankStr = `${card.rank}`;

  return (
    <div
      onClick={!disabled && onClick ? onClick : undefined}
      className={`relative ${dimensions} rounded-xl sm:rounded-2xl transition-all duration-150 select-none overflow-hidden ${
        disabled 
          ? 'opacity-60 cursor-default' 
          : onClick 
            ? 'cursor-pointer hover:scale-105 active:scale-95' 
            : ''
      } ${
        isSelected 
          ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 -translate-y-2 z-20 shadow-[0_12px_24px_rgba(245,158,11,0.6)]' 
          : isPlayable 
            ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900 shadow-[0_0_15px_rgba(52,211,153,0.5)]' 
            : 'shadow-[0_4px_10px_rgba(0,0,0,0.35)]'
      } ${className}`}
      style={{
        background: isJoker ? 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)' : '#ffffff',
        border: isJoker ? '2px solid #f59e0b' : '2px solid #e2e8f0',
      }}
    >
      {/* Stack counter underneath if discard pile */}
      {stackCount > 1 && (
        <div className="absolute -bottom-1 -right-1 w-full h-full rounded-xl sm:rounded-2xl bg-slate-800 -z-10 border border-slate-700 shadow-sm" />
      )}

      {/* JOKER SPECIAL CARD */}
      {isJoker ? (
        <div className="w-full h-full p-1 sm:p-1.5 flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className="w-full flex justify-between items-start leading-none px-0.5">
            <span className="font-display font-black text-[9px] sm:text-xs text-amber-500">★</span>
            <span className="font-sans font-black text-[8px] sm:text-[9px] text-amber-700 uppercase">JOKER</span>
          </div>

          {/* Jester Graphic */}
          <div className="w-full my-auto flex flex-col items-center justify-center">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 border border-amber-500 flex items-center justify-center text-base sm:text-xl shadow">
              🃏
            </div>
            {card.representedRank && (
              <span className="mt-0.5 px-1 rounded bg-amber-950/80 text-[8px] sm:text-[9px] font-mono font-black text-amber-300">
                Als {card.representedRank}
              </span>
            )}
          </div>

          <div className="w-full flex justify-between items-end leading-none px-0.5">
            <span className="font-sans font-black text-[8px] sm:text-[9px] text-amber-700 uppercase">20 Pkt</span>
            <span className="font-display font-black text-[9px] sm:text-xs text-amber-500">★</span>
          </div>
        </div>
      ) : (
        /* STANDARD FRENCH SUITED CARD (Hearts, Diamonds, Clubs, Spades) */
        <div className="w-full h-full p-1 sm:p-1.5 flex flex-col justify-between items-center relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100">
          {/* Top Left Corner */}
          <div className="w-full flex justify-between items-start leading-none">
            <div className="flex flex-col items-center leading-none" style={{ color: suitColor }}>
              <span className="font-display font-black text-[11px] sm:text-sm tracking-tighter">
                {rankStr}
              </span>
              <span className="text-[9px] sm:text-xs leading-none">
                {suitSymbol}
              </span>
            </div>
            {/* Tiny point value */}
            <span className="text-[7px] sm:text-[8px] font-mono text-slate-400 font-bold">
              {card.points}P
            </span>
          </div>

          {/* Center Card Symbol / Court Emblem */}
          <div className="my-auto flex items-center justify-center">
            {['J', 'Q', 'K'].includes(rankStr) ? (
              <div 
                className="w-7 h-9 sm:w-10 sm:h-13 rounded-lg border flex flex-col items-center justify-center shadow-inner"
                style={{ borderColor: `${suitColor}40`, backgroundColor: `${suitColor}10` }}
              >
                <span className="text-base sm:text-2xl" style={{ color: suitColor }}>
                  {rankStr === 'K' ? '👑' : rankStr === 'Q' ? '👸' : '🛡️'}
                </span>
                <span className="text-[9px] font-black" style={{ color: suitColor }}>
                  {rankStr}
                </span>
              </div>
            ) : rankStr === 'A' ? (
              <div className="text-2xl sm:text-4xl" style={{ color: suitColor }}>
                {suitSymbol}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <span className="text-xl sm:text-3xl leading-none" style={{ color: suitColor }}>
                  {suitSymbol}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Right Corner (Inverted 180) */}
          <div className="w-full flex justify-end items-end leading-none">
            <div className="flex flex-col items-center leading-none transform rotate-180" style={{ color: suitColor }}>
              <span className="font-display font-black text-[11px] sm:text-sm tracking-tighter">
                {rankStr}
              </span>
              <span className="text-[9px] sm:text-xs leading-none">
                {suitSymbol}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
