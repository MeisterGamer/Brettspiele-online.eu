import React from 'react';
import { ResourceType, DevCardType } from './catanData';

// 3D Wooden Settlement (Siedlung - 1 Victory Point)
export const WoodenSettlement: React.FC<{ color: string; size?: number; className?: string }> = ({
  color,
  size = 28,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`drop-shadow-md transition-transform hover:scale-110 ${className}`}
    >
      <defs>
        <linearGradient id={`settleGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
        </linearGradient>
        <filter id="woodShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* House Body & Roof */}
      <g filter="url(#woodShadow)">
        {/* Gable Roof */}
        <polygon points="16,3 29,14 3,14" fill={`url(#settleGrad-${color})`} stroke="#1e293b" strokeWidth="1.2" />
        {/* House Walls */}
        <rect x="5" y="13" width="22" height="15" fill={`url(#settleGrad-${color})`} stroke="#1e293b" strokeWidth="1.2" rx="1" />
        {/* Chimney / Gable detail */}
        <rect x="8" y="5" width="3" height="5" fill="#334155" />
        {/* Door and window in wood carving */}
        <rect x="13" y="19" width="6" height="9" fill="#0f172a" rx="1" />
        <rect x="8" y="16" width="4" height="4" fill="#f8fafc" opacity="0.6" rx="0.5" />
        <rect x="20" y="16" width="4" height="4" fill="#f8fafc" opacity="0.6" rx="0.5" />
      </g>
    </svg>
  );
};

// 3D Wooden City (Stadt - 2 Victory Points)
export const WoodenCity: React.FC<{ color: string; size?: number; className?: string }> = ({
  color,
  size = 36,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className={`drop-shadow-lg transition-transform hover:scale-110 ${className}`}
    >
      <defs>
        <linearGradient id={`cityGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <g>
        {/* Tower (Left / Back) */}
        <polygon points="9,2 17,9 1,9" fill={`url(#cityGrad-${color})`} stroke="#0f172a" strokeWidth="1.2" />
        <rect x="3" y="9" width="12" height="23" fill={`url(#cityGrad-${color})`} stroke="#0f172a" strokeWidth="1.2" rx="1" />
        {/* Tower Crenellations */}
        <rect x="5" y="12" width="3" height="6" fill="#0f172a" rx="0.5" />
        <rect x="10" y="12" width="3" height="6" fill="#0f172a" rx="0.5" />

        {/* Cathedral Nave (Right) */}
        <polygon points="26,10 35,17 17,17" fill={`url(#cityGrad-${color})`} stroke="#0f172a" strokeWidth="1.2" />
        <rect x="15" y="16" width="19" height="16" fill={`url(#cityGrad-${color})`} stroke="#0f172a" strokeWidth="1.2" rx="1" />
        {/* Arched Great Door */}
        <path d="M 22 32 A 4 4 0 0 1 30 32 Z" fill="#0f172a" />
        <rect x="23" y="22" width="5" height="5" fill="#f8fafc" opacity="0.6" rx="0.5" />
      </g>
    </svg>
  );
};

// 3D Wooden Road (Straße)
export const WoodenRoad: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}> = ({ x1, y1, x2, y2, color }) => {
  return (
    <g className="cursor-default pointer-events-none">
      {/* Road drop shadow */}
      <line
        x1={x1}
        y1={y1 + 2}
        x2={x2}
        y2={y2 + 2}
        stroke="#000000"
        strokeWidth="7"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Wooden Road Plank Outline */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#0f172a"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      {/* Inner Color Fill */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Wood Highlights */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </g>
  );
};

// 3D Wooden Robber Pawn (Der Räuber)
export const WoodenRobber: React.FC<{ size?: number; className?: string }> = ({ size = 38, className = '' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" className={`drop-shadow-2xl ${className}`}>
      <defs>
        <radialGradient id="robberGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="60%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
      </defs>

      <g filter="drop-shadow(0 4px 6px rgba(0,0,0,0.7))">
        {/* Base disc */}
        <ellipse cx="18" cy="30" rx="12" ry="4" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
        {/* Pawn Torso */}
        <path
          d="M 12 30 Q 15 22 14 16 Q 18 17 22 16 Q 21 22 24 30 Z"
          fill="url(#robberGrad)"
          stroke="#0f172a"
          strokeWidth="1.2"
        />
        {/* Collar collar ring */}
        <ellipse cx="18" cy="15" rx="7" ry="2.5" fill="#334155" stroke="#0f172a" strokeWidth="1" />
        {/* Head Sphere */}
        <circle cx="18" cy="9" r="6" fill="url(#robberGrad)" stroke="#0f172a" strokeWidth="1.2" />
        {/* Hood / Hat point */}
        <path d="M 14 7 L 18 1 L 22 7 Z" fill="#0f172a" />
        {/* Red glowing eye slits */}
        <circle cx="16" cy="9" r="0.8" fill="#ef4444" />
        <circle cx="20" cy="9" r="0.8" fill="#ef4444" />
      </g>
    </svg>
  );
};

// High-detail Resource Card Visual
export const ResourceCardBadge: React.FC<{
  type: ResourceType;
  count: number;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
}> = ({ type, count, size = 'md', onClick, selectable = false, selected = false }) => {
  const meta = {
    wood: { name: 'Holz', icon: '🌲', color: 'from-emerald-700 to-green-900', border: 'border-emerald-500/50', text: 'text-emerald-100' },
    brick: { name: 'Lehm', icon: '🧱', color: 'from-amber-700 to-red-900', border: 'border-red-500/50', text: 'text-red-100' },
    wool: { name: 'Wolle', icon: '🐑', color: 'from-lime-600 to-emerald-800', border: 'border-lime-400/50', text: 'text-lime-100' },
    wheat: { name: 'Getreide', icon: '🌾', color: 'from-amber-500 to-yellow-800', border: 'border-yellow-400/50', text: 'text-yellow-100' },
    ore: { name: 'Erz', icon: '⛰️', color: 'from-slate-600 to-slate-900', border: 'border-slate-400/50', text: 'text-slate-100' },
  }[type];

  return (
    <button
      type="button"
      disabled={!selectable && !onClick}
      onClick={onClick}
      className={`relative rounded-xl border bg-gradient-to-b ${meta.color} ${meta.border} shadow-md flex flex-col items-center justify-between transition-all select-none ${
        size === 'sm' ? 'w-12 h-16 p-1' : size === 'lg' ? 'w-20 h-28 p-2' : 'w-14 h-20 p-1.5'
      } ${selectable ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'} ${
        selected ? 'ring-2 ring-amber-300 scale-105 shadow-amber-400/30' : ''
      }`}
    >
      <span className="text-xs">{meta.icon}</span>
      <span className={`font-black tracking-tight leading-none ${size === 'lg' ? 'text-xs' : 'text-[10px]'} ${meta.text}`}>
        {meta.name}
      </span>
      <span className="bg-black/60 rounded-full px-1.5 py-0.5 text-[11px] font-mono font-bold text-white leading-none border border-white/20">
        {count}
      </span>
    </button>
  );
};
