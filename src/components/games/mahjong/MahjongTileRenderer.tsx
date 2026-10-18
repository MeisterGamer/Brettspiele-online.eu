import React from 'react';
import { PlacedMahjongTile } from './mahjongData';

interface MahjongTileRendererProps {
  tile: PlacedMahjongTile;
  isFree: boolean;
  isSelected: boolean;
  isHinted: boolean;
  onClick?: () => void;
  tileTheme?: 'ivory' | 'wood' | 'emerald';
  dimBlocked?: boolean;
}

export const MahjongTileRenderer: React.FC<MahjongTileRendererProps> = ({
  tile,
  isFree,
  isSelected,
  isHinted,
  onClick,
  tileTheme = 'ivory',
  dimBlocked = true,
}) => {
  const { category, value, symbol, chineseName, color, germanName } = tile.definition;

  // Base tile themes
  const themeStyles = {
    ivory: {
      face: 'bg-gradient-to-b from-[#fffbeb] via-[#fef3c7] to-[#fde68a] text-slate-900 border-[#d97706]/40',
      back: '#15803d', // Jade green backing
      backBevel: '#14532d',
      shadow: 'shadow-[2px_4px_8px_rgba(0,0,0,0.6)]',
    },
    emerald: {
      face: 'bg-gradient-to-b from-[#ecfdf5] via-[#d1fae5] to-[#a7f3d0] text-emerald-950 border-[#059669]/40',
      back: '#064e3b',
      backBevel: '#022c22',
      shadow: 'shadow-[2px_4px_8px_rgba(0,0,0,0.7)]',
    },
    wood: {
      face: 'bg-gradient-to-b from-[#fef08a] via-[#fde047] to-[#eab308] text-amber-950 border-[#854d0e]/50',
      back: '#78350f',
      backBevel: '#451a03',
      shadow: 'shadow-[2px_4px_8px_rgba(0,0,0,0.8)]',
    },
  }[tileTheme];

  // Elevation based on layer (0 to 4)
  const layerOffsetPx = tile.layer * 4;
  const layerZIndex = tile.layer * 20 + Math.floor(tile.y);

  // Status classes
  const isClickable = isFree && !tile.matched;
  const isDimmed = !isFree && dimBlocked;

  return (
    <div
      role="button"
      tabIndex={isClickable?0:-1}
      aria-label={`${germanName} – ${tile.id}`}
      aria-disabled={!isClickable}
      onKeyDown={event=>{if(isClickable&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onClick?.();}}}
      onClick={isClickable ? onClick : undefined}
      style={{
        zIndex: isSelected ? 999 : layerZIndex,
        transform: `translate3d(0, -${layerOffsetPx}px, 0)${isSelected ? ' scale(1.08)' : ''}`,
      }}
      className={`relative select-none transition-all duration-150 ${
        isClickable ? 'cursor-pointer hover:-translate-y-1 hover:brightness-105 active:scale-95' : 'cursor-not-allowed'
      } ${isDimmed ? 'opacity-65 filter contrast-90 brightness-90' : 'opacity-100'}`}
      title={`${germanName} (${chineseName}) - ${isFree ? 'Frei spielbar' : 'Blockiert (verdeckt oder eingeklemmt)'}`}
    >
      {/* 3D Depth Layer: Jade/Wood backing shadow extrusion */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          transform: 'translate(3px, 4px)',
          backgroundColor: themeStyles.backBevel,
          boxShadow: `0 ${3 + tile.layer * 2}px ${6 + tile.layer * 3}px rgba(0,0,0,0.65)`,
        }}
      />
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          transform: 'translate(1.5px, 2px)',
          backgroundColor: themeStyles.back,
        }}
      />

      {/* Front Face Porcelain/Ivory Tile */}
      <div
        className={`relative w-10 sm:w-12 h-14 sm:h-16 rounded-lg border flex flex-col items-center justify-between p-1 shadow-inner overflow-hidden ${
          themeStyles.face
        } ${isSelected ? 'ring-2 sm:ring-4 ring-amber-400 border-amber-300 shadow-amber-400/50' : ''} ${
          isHinted ? 'ring-2 ring-emerald-400 animate-pulse border-emerald-300' : ''
        }`}
      >
        {/* Subtle ivory luster overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-black/5 pointer-events-none rounded-lg" />

        {/* Top Header: Tile Value / Category badge */}
        <div className="w-full flex items-center justify-between text-[9px] sm:text-[10px] font-bold px-0.5 leading-none opacity-85">
          <span style={{ color }}>{value}</span>
          <span className="text-[8px] sm:text-[9px] opacity-60">
            {category === 'bamboo' && '🎋'}
            {category === 'dot' && '⭕'}
            {category === 'character' && '萬'}
            {category === 'wind' && '💨'}
            {category === 'dragon' && '🐉'}
            {category === 'flower' && '🌸'}
            {category === 'season' && '🍁'}
          </span>
        </div>

        {/* Center: Authentic Chinese Tile Character / Art */}
        <div className="flex-1 flex items-center justify-center my-auto">
          {category === 'character' ? (
            <div className="flex flex-col items-center justify-center leading-none">
              <span className="text-base sm:text-lg font-black" style={{ color }}>
                {['一', '二', '三', '四', '五', '六', '七', '八', '九'][(value as number) - 1] || value}
              </span>
              <span className="text-xs sm:text-sm font-bold text-red-600">萬</span>
            </div>
          ) : category === 'bamboo' ? (
            <span className="text-2xl sm:text-3xl leading-none select-none" style={{ color }}>
              {symbol}
            </span>
          ) : category === 'dot' ? (
            <span className="text-2xl sm:text-3xl leading-none select-none" style={{ color }}>
              {symbol}
            </span>
          ) : category === 'wind' ? (
            <div className="flex flex-col items-center justify-center">
              <span className="text-xl sm:text-2xl font-black" style={{ color }}>
                {value === 'east' ? '東' : value === 'south' ? '南' : value === 'west' ? '西' : '北'}
              </span>
            </div>
          ) : category === 'dragon' ? (
            <div className="flex flex-col items-center justify-center">
              <span className="text-xl sm:text-2xl font-black" style={{ color }}>
                {value === 'red' ? '中' : value === 'green' ? '發' : '白'}
              </span>
            </div>
          ) : (
            /* Flower / Season */
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-2xl sm:text-3xl leading-none">{symbol}</span>
            </div>
          )}
        </div>

        {/* Bottom indicator: Chinese name watermark */}
        <div className="w-full text-center text-[7px] sm:text-[8px] font-semibold text-slate-600 truncate leading-tight">
          {category === 'flower' || category === 'season' ? (
            <span className="text-amber-700 font-bold">{germanName.split(' ')[0]}</span>
          ) : (
            chineseName.split(' ')[0]
          )}
        </div>

        {/* Hint Glow Banner */}
        {isHinted && (
          <div className="absolute inset-0 bg-emerald-400/20 border-2 border-emerald-400 rounded-lg pointer-events-none animate-ping" />
        )}
      </div>
    </div>
  );
};
