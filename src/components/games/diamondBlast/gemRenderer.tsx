import React from 'react';
import { Gem, GemColor, GemSpecial, ObstacleType } from './types';

interface GemRendererProps {
  gem: Gem;
  isSelected?: boolean;
  isHinted?: boolean;
  size?: number; // size in px, defaults to 54
}

// Color palettes with highlights and shadows for SVG rendering
const GEM_PALETTES: Record<GemColor, { main: string; light: string; dark: string; border: string; glow: string }> = {
  red: {
    main: '#e11d48',
    light: '#fda4af',
    dark: '#881337',
    border: '#f43f5e',
    glow: 'rgba(225, 29, 72, 0.6)'
  },
  blue: {
    main: '#0284c7',
    light: '#7dd3fc',
    dark: '#0c4a6e',
    border: '#38bdf8',
    glow: 'rgba(2, 132, 199, 0.6)'
  },
  green: {
    main: '#16a34a',
    light: '#86efac',
    dark: '#052e16',
    border: '#4ade80',
    glow: 'rgba(22, 163, 74, 0.6)'
  },
  yellow: {
    main: '#eab308',
    light: '#fef08a',
    dark: '#713f12',
    border: '#facc15',
    glow: 'rgba(234, 179, 8, 0.6)'
  },
  purple: {
    main: '#9333ea',
    light: '#d8b4fe',
    dark: '#4c1d95',
    border: '#c084fc',
    glow: 'rgba(147, 51, 234, 0.6)'
  },
  orange: {
    main: '#ea580c',
    light: '#fed7aa',
    dark: '#7c2d12',
    border: '#fb923c',
    glow: 'rgba(234, 88, 12, 0.6)'
  }
};

export const GemRenderer: React.FC<GemRendererProps> = ({
  gem,
  isSelected = false,
  isHinted = false,
  size = 54
}) => {
  const palette = GEM_PALETTES[gem.color] || GEM_PALETTES.blue;
  const isSpecial = gem.special !== 'none';

  return (
    <div
      className={`relative flex items-center justify-center select-none transition-transform duration-150 ${
        isSelected ? 'scale-110 z-20' : isHinted ? 'scale-105 z-10 animate-pulse' : 'hover:scale-105'
      }`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {/* Outer Selection / Hint Halo */}
      {isSelected && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none ring-4 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-pulse"
        />
      )}

      {isHinted && !isSelected && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
        />
      )}

      {/* Primary Diamond SVG Asset */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] overflow-visible"
      >
        <defs>
          {/* Specular gradient for the gem body */}
          <radialGradient id={`rad-${gem.id}-${gem.color}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor={palette.light} />
            <stop offset="45%" stopColor={palette.main} />
            <stop offset="100%" stopColor={palette.dark} />
          </radialGradient>

          {/* Rainbow Spectral Gradient */}
          <linearGradient id={`rainbow-${gem.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="20%" stopColor="#f59e0b" />
            <stop offset="40%" stopColor="#10b981" />
            <stop offset="60%" stopColor="#06b6d4" />
            <stop offset="80%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>

          {/* Glow filter */}
          <filter id={`glow-${gem.id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- SHAPE RENDERING ACCORDING TO COLOR & TYPE --- */}

        {/* 1. Rainbow Hypercube Gem */}
        {gem.special === 'rainbow' ? (
          <g filter={`url(#glow-${gem.id})`}>
            {/* Outer prismatic halo */}
            <circle cx="50" cy="50" r="42" fill="url(#rainbow-${gem.id})" opacity="0.4" className="animate-spin" style={{ transformOrigin: '50% 50%', animationDuration: '8s' }} />
            {/* Multi-facet diamond star */}
            <polygon points="50,10 62,35 88,38 68,56 74,82 50,68 26,82 32,56 12,38 38,35" fill={`url(#rainbow-${gem.id})`} stroke="#ffffff" strokeWidth="2.5" />
            <polygon points="50,22 58,40 76,42 62,54 66,72 50,62 34,72 38,54 24,42 42,40" fill="#ffffff" opacity="0.4" />
            <circle cx="50" cy="50" r="10" fill="#ffffff" />
            {/* Sparkle glint */}
            <circle cx="42" cy="38" r="3" fill="#ffffff" />
          </g>
        ) : gem.special === 'bomb' ? (
          /* 2. Dynamite Bomb Special */
          <g>
            {/* Bomb shadow */}
            <ellipse cx="50" cy="85" rx="30" ry="8" fill="#000000" opacity="0.5" />
            {/* Bomb core */}
            <circle cx="50" cy="54" r="32" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />
            {/* Inner fiery gradient ring */}
            <circle cx="50" cy="54" r="26" fill={`url(#rad-${gem.id}-${gem.color})`} opacity="0.85" />
            {/* Golden cross bands */}
            <ellipse cx="50" cy="54" rx="26" ry="10" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
            <line x1="50" y1="28" x2="50" y2="80" stroke="#fbbf24" strokeWidth="2.5" />
            {/* Dynamite TNT Text */}
            <text x="50" y="59" fontFamily="sans-serif" fontSize="13" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="1">
              TNT
            </text>
            {/* Burning Fuse */}
            <path d="M 50 22 Q 62 10 70 12" fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
            {/* Flame spark */}
            <circle cx="70" cy="12" r="6" fill="#f59e0b" className="animate-ping" style={{ transformOrigin: '70px 12px' }} />
            <circle cx="70" cy="12" r="3.5" fill="#ffffff" />
          </g>
        ) : (
          /* Standard and Line Diamonds: Distinct Geometric Silhouettes */
          <g>
            {/* RED = Ruby Hexagon */}
            {gem.color === 'red' && (
              <g>
                <polygon
                  points="25,14 75,14 92,50 75,86 25,86 8,50"
                  fill={`url(#rad-${gem.id}-${gem.color})`}
                  stroke={palette.border}
                  strokeWidth="2.5"
                />
                {/* Facet lines */}
                <polygon points="35,28 65,28 76,50 65,72 35,72 24,50" fill="#ffffff" opacity="0.25" />
                <line x1="25" y1="14" x2="35" y2="28" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
                <line x1="75" y1="14" x2="65" y2="28" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
                <line x1="92" y1="50" x2="76" y2="50" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
                <line x1="8" y1="50" x2="24" y2="50" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
                <polygon points="35,28 65,28 50,50" fill="#ffffff" opacity="0.4" />
              </g>
            )}

            {/* BLUE = Sapphire Rhombus */}
            {gem.color === 'blue' && (
              <g>
                <polygon
                  points="50,8 90,50 50,92 10,50"
                  fill={`url(#rad-${gem.id}-${gem.color})`}
                  stroke={palette.border}
                  strokeWidth="2.5"
                />
                {/* Facets */}
                <polygon points="50,22 74,50 50,78 26,50" fill="#ffffff" opacity="0.3" />
                <polygon points="50,8 50,50 10,50" fill="#ffffff" opacity="0.4" />
                <line x1="50" y1="8" x2="50" y2="92" stroke="#ffffff" strokeWidth="1.5" opacity="0.5" />
                <line x1="10" y1="50" x2="90" y2="50" stroke="#ffffff" strokeWidth="1.5" opacity="0.5" />
              </g>
            )}

            {/* GREEN = Emerald Octagon */}
            {gem.color === 'green' && (
              <g>
                <polygon
                  points="32,12 68,12 88,32 88,68 68,88 32,88 12,68 12,32"
                  fill={`url(#rad-${gem.id}-${gem.color})`}
                  stroke={palette.border}
                  strokeWidth="2.5"
                />
                {/* Step facets */}
                <polygon points="38,24 62,24 76,38 76,62 62,76 38,76 24,62 24,38" fill="#ffffff" opacity="0.25" />
                <polygon points="42,32 58,32 68,42 68,58 58,68 42,68 32,58 32,42" fill="#ffffff" opacity="0.35" />
                <line x1="32" y1="12" x2="38" y2="24" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
                <line x1="68" y1="12" x2="62" y2="24" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
              </g>
            )}

            {/* YELLOW = Topaz Triangle */}
            {gem.color === 'yellow' && (
              <g>
                <polygon
                  points="50,12 90,84 10,84"
                  fill={`url(#rad-${gem.id}-${gem.color})`}
                  stroke={palette.border}
                  strokeWidth="2.5"
                />
                {/* Triangular brilliant facets */}
                <polygon points="50,34 76,76 24,76" fill="#ffffff" opacity="0.3" />
                <polygon points="50,12 50,76 24,76" fill="#ffffff" opacity="0.4" />
                <line x1="50" y1="12" x2="50" y2="76" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
              </g>
            )}

            {/* PURPLE = Amethyst Teardrop/Heart Oval */}
            {gem.color === 'purple' && (
              <g>
                <path
                  d="M 50,10 C 72,10 88,28 88,54 C 88,78 70,90 50,90 C 30,90 12,78 12,54 C 12,28 28,10 50,10 Z"
                  fill={`url(#rad-${gem.id}-${gem.color})`}
                  stroke={palette.border}
                  strokeWidth="2.5"
                />
                {/* Facets */}
                <ellipse cx="50" cy="50" rx="22" ry="26" fill="#ffffff" opacity="0.28" />
                <ellipse cx="44" cy="38" rx="8" ry="12" fill="#ffffff" opacity="0.45" />
              </g>
            )}

            {/* ORANGE = Amber Pentagon */}
            {gem.color === 'orange' && (
              <g>
                <polygon
                  points="50,10 88,38 74,86 26,86 12,38"
                  fill={`url(#rad-${gem.id}-${gem.color})`}
                  stroke={palette.border}
                  strokeWidth="2.5"
                />
                {/* Pentagon facets */}
                <polygon points="50,26 76,46 66,74 34,74 24,46" fill="#ffffff" opacity="0.3" />
                <line x1="50" y1="10" x2="50" y2="50" stroke="#ffffff" strokeWidth="1.5" opacity="0.5" />
                <polygon points="50,10 50,50 24,46" fill="#ffffff" opacity="0.4" />
              </g>
            )}

            {/* Specular Glint Highlight on every crystal */}
            <ellipse cx="36" cy="32" rx="6" ry="3" fill="#ffffff" opacity="0.8" transform="rotate(-30 36 32)" />

            {/* SPECIAL LINE BLAST LASER OVERLAYS */}
            {gem.special === 'line-h' && (
              <g filter={`url(#glow-${gem.id})`}>
                {/* Horizontal laser beam icon */}
                <rect x="6" y="44" width="88" height="12" rx="6" fill="#ffffff" stroke="#facc15" strokeWidth="2" opacity="0.95" />
                <polygon points="12,50 24,42 24,58" fill="#f59e0b" />
                <polygon points="88,50 76,42 76,58" fill="#f59e0b" />
                <line x1="16" y1="50" x2="84" y2="50" stroke="#0284c7" strokeWidth="3" />
              </g>
            )}

            {gem.special === 'line-v' && (
              <g filter={`url(#glow-${gem.id})`}>
                {/* Vertical laser beam icon */}
                <rect x="44" y="6" width="12" height="88" rx="6" fill="#ffffff" stroke="#facc15" strokeWidth="2" opacity="0.95" />
                <polygon points="50,12 42,24 58,24" fill="#f59e0b" />
                <polygon points="50,88 42,76 58,76" fill="#f59e0b" />
                <line x1="50" y1="16" x2="50" y2="84" stroke="#0284c7" strokeWidth="3" />
              </g>
            )}
          </g>
        )}

        {/* --- OBSTACLES OVERLAY --- */}

        {/* 1. Ice Block: Glacial shard overlay */}
        {gem.obstacle === 'ice' && (
          <g>
            <rect x="4" y="4" width="92" height="92" rx="14" fill="#bae6fd" opacity="0.55" stroke="#e0f2fe" strokeWidth="3" />
            <path d="M 12 18 L 38 42 L 28 65 L 55 58 L 78 86" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
            <path d="M 68 14 L 54 38 L 84 52" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
            <text x="50" y="88" fontSize="10" fontWeight="bold" fill="#0369a1" textAnchor="middle">ICE</text>
          </g>
        )}

        {/* 2. Rock / Granite Boulder: Solid stone that cracks */}
        {gem.obstacle === 'rock' && (
          <g>
            {/* Rock boulder */}
            <polygon
              points="14,24 42,8 78,16 92,54 74,88 32,92 8,62"
              fill={gem.obstacleHealth > 1 ? '#475569' : '#64748b'}
              stroke="#334155"
              strokeWidth="3.5"
            />
            <polygon points="26,32 50,18 70,26 80,50 66,74 36,78 20,54" fill="#94a3b8" opacity="0.3" />
            {/* Fracture cracks */}
            <path d="M 22 28 L 48 52 L 40 76" fill="none" stroke="#0f172a" strokeWidth="2.5" />
            {gem.obstacleHealth === 1 && (
              <path d="M 72 24 L 48 52 L 74 72" fill="none" stroke="#ef4444" strokeWidth="2.5" />
            )}
            <text x="50" y="58" fontSize="16" fontWeight="900" fill="#f8fafc" textAnchor="middle" opacity="0.9">
              {gem.obstacleHealth > 1 ? '🪨 2' : '💥 1'}
            </text>
          </g>
        )}

        {/* 3. Chain: Golden Padlock & Chains */}
        {gem.obstacle === 'chain' && (
          <g>
            {/* Diagonal chain links */}
            <line x1="8" y1="8" x2="92" y2="92" stroke="#f59e0b" strokeWidth="6" strokeDasharray="8 6" opacity="0.9" />
            <line x1="92" y1="8" x2="8" y2="92" stroke="#f59e0b" strokeWidth="6" strokeDasharray="8 6" opacity="0.9" />
            {/* Center Padlock */}
            <rect x="36" y="44" width="28" height="24" rx="4" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
            <path d="M 42 44 V 34 C 42 28 58 28 58 34 V 44" fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="54" r="3" fill="#78350f" />
          </g>
        )}
      </svg>
    </div>
  );
};
