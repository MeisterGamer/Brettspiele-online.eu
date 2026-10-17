import React from 'react';
import { SkipBoCard, getSkipBoCardColor } from './skipboData';

interface SkipBoCardRendererProps {
  card?: SkipBoCard | null;
  isFaceDown?: boolean;
  isSelected?: boolean;
  isPlayable?: boolean;
  stackCount?: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export const SkipBoCardRenderer: React.FC<SkipBoCardRendererProps> = ({
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
  // Sizing definitions
  const dimensions = {
    sm: 'w-11 h-16 sm:w-13 sm:h-19 text-xs',
    md: 'w-14 h-20 sm:w-18 sm:h-26 text-sm',
    lg: 'w-18 h-26 sm:w-22 sm:h-32 text-base',
  }[size];

  // If face-down card (e.g. Draw Pile or Stockpile bottom stack)
  if (isFaceDown || !card) {
    return (
      <div
        onClick={!disabled && onClick ? onClick : undefined}
        className={`relative ${dimensions} rounded-xl sm:rounded-2xl transition-all duration-200 select-none overflow-hidden ${
          disabled ? 'cursor-default' : onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
        } ${isSelected ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.6)]' : ''} ${className}`}
        style={{
          background: 'linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #9a3412 100%)',
          boxShadow: '0 6px 14px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
          border: '2px solid #7c2d12',
        }}
      >
        {/* Visual stack depth underneath */}
        {stackCount > 1 && (
          <div 
            className="absolute -bottom-1 -right-1 w-full h-full rounded-xl sm:rounded-2xl bg-amber-950/60 -z-10 border border-amber-900" 
          />
        )}
        {stackCount > 5 && (
          <div 
            className="absolute -bottom-2 -right-2 w-full h-full rounded-xl sm:rounded-2xl bg-amber-950/40 -z-20 border border-amber-900" 
          />
        )}

        {/* Card Back Skip-Bo Emblem */}
        <div className="w-full h-full p-1 sm:p-1.5 flex items-center justify-center">
          <div className="w-full h-full rounded-lg sm:rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-700 via-orange-800 to-amber-950 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            {/* Geometric diagonal diamond rays */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:8px_8px]" />
            <div className="transform -rotate-45 text-center">
              <div className="font-display font-black text-[9px] sm:text-xs text-white tracking-widest drop-shadow">
                SKIP
              </div>
              <div className="font-display font-black text-[11px] sm:text-sm text-amber-300 tracking-widest drop-shadow -mt-1">
                BO
              </div>
            </div>
          </div>
        </div>

        {/* Stack counter badge */}
        {stackCount > 0 && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-slate-950/80 text-[9px] font-mono font-black text-amber-400 border border-amber-500/40 shadow">
            {stackCount}
          </div>
        )}
      </div>
    );
  }

  // Face-up Card:
  const isWild = card.value === 'SKIP-BO';
  const colors = getSkipBoCardColor(card.value);
  const displayVal = card.assignedValue ? `${card.assignedValue}` : `${card.value}`;

  return (
    <div
      onClick={!disabled && onClick ? onClick : undefined}
      className={`relative ${dimensions} rounded-xl sm:rounded-2xl transition-all duration-200 select-none overflow-hidden ${
        disabled 
          ? 'opacity-60 cursor-default' 
          : onClick 
            ? 'cursor-pointer hover:scale-105 active:scale-95' 
            : ''
      } ${
        isSelected 
          ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 -translate-y-2 z-20 shadow-[0_12px_24px_rgba(245,158,11,0.6)]' 
          : isPlayable 
            ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]' 
            : 'shadow-[0_4px_12px_rgba(0,0,0,0.35)]'
      } ${className}`}
      style={{
        background: isWild ? colors.bg : '#ffffff',
        border: `2px solid ${colors.border}`,
      }}
    >
      {/* 3D stacked cards underneath if stackCount > 1 */}
      {stackCount > 1 && (
        <div 
          className="absolute -bottom-1 -right-1 w-full h-full rounded-xl sm:rounded-2xl bg-slate-800 -z-10 border border-slate-700 shadow-sm" 
        />
      )}
      {stackCount > 4 && (
        <div 
          className="absolute -bottom-2 -right-2 w-full h-full rounded-xl sm:rounded-2xl bg-slate-900 -z-20 border border-slate-800 shadow-sm" 
        />
      )}

      {/* Wild Card / SKIP-BO Special Visual */}
      {isWild ? (
        <div className="w-full h-full p-1 sm:p-1.5 flex flex-col justify-between items-center text-center relative overflow-hidden">
          {/* Top Left Corner */}
          <div className="w-full flex justify-between items-start leading-none px-0.5">
            <span className="font-display font-black text-[9px] sm:text-xs text-white drop-shadow-sm">★</span>
            <span className="font-sans font-black text-[8px] sm:text-[10px] text-amber-950 uppercase tracking-tighter">WILD</span>
          </div>

          {/* Center Skip-Bo Emblem */}
          <div className="w-full my-auto flex flex-col items-center justify-center">
            <div className="w-9 h-7 sm:w-13 sm:h-11 rounded-lg sm:rounded-xl bg-orange-600 border border-yellow-200 shadow-md flex flex-col items-center justify-center leading-none transform -rotate-3">
              <span className="font-display font-black text-[9px] sm:text-xs text-white tracking-wider">SKIP</span>
              <span className="font-display font-black text-[11px] sm:text-sm text-yellow-300 tracking-wider -mt-0.5">BO</span>
            </div>
            {card.assignedValue && (
              <span className="mt-1 px-1.5 py-0.2 rounded bg-amber-950/80 text-[8px] sm:text-[10px] font-mono font-black text-yellow-300">
                Als {card.assignedValue}
              </span>
            )}
          </div>

          {/* Bottom Right Corner */}
          <div className="w-full flex justify-between items-end leading-none px-0.5">
            <span className="font-sans font-black text-[8px] sm:text-[10px] text-amber-950 uppercase tracking-tighter">JOKER</span>
            <span className="font-display font-black text-[9px] sm:text-xs text-white drop-shadow-sm">★</span>
          </div>
        </div>
      ) : (
        /* Standard Number Card 1 to 12 */
        <div className="w-full h-full p-1 sm:p-1.5 flex flex-col justify-between items-center relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100">
          {/* Top Left Number Corner */}
          <div className="w-full flex justify-between items-start leading-none">
            <span 
              className="font-display font-black text-[10px] sm:text-xs tracking-tight"
              style={{ color: colors.badge }}
            >
              {displayVal}
            </span>
          </div>

          {/* Center Number Oval Badge */}
          <div 
            className="w-8 h-10 sm:w-11 sm:h-14 rounded-full flex items-center justify-center shadow-inner my-auto"
            style={{ backgroundColor: colors.badge }}
          >
            <span className="font-display font-black text-sm sm:text-2xl text-white tracking-tight drop-shadow">
              {displayVal}
            </span>
          </div>

          {/* Bottom Right Number Corner (Rotated 180) */}
          <div className="w-full flex justify-end items-end leading-none">
            <span 
              className="font-display font-black text-[10px] sm:text-xs tracking-tight transform rotate-180"
              style={{ color: colors.badge }}
            >
              {displayVal}
            </span>
          </div>
        </div>
      )}

      {/* Stack counter tag if stockpile or discard stack */}
      {stackCount > 1 && (
        <div className="absolute top-1 right-1 px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded-full bg-slate-950/80 text-[8px] sm:text-[10px] font-mono font-black text-white border border-slate-700 shadow z-10">
          {stackCount}
        </div>
      )}
    </div>
  );
};
