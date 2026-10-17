import React from 'react';
import { MonopolyFigureId } from './monopolyData';

interface MonopolyFigureProps {
  figureId: MonopolyFigureId;
  size?: number; // width & height in px
  className?: string;
  isAnimated?: boolean;
}

export const MonopolyFigureRenderer: React.FC<MonopolyFigureProps> = ({
  figureId,
  size = 36,
  className = '',
  isAnimated = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className} ${
        isAnimated ? 'animate-bounce' : ''
      }`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
      >
        <defs>
          {/* Metallic Chrome & Silver Gradient */}
          <linearGradient id="figSilver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#e2e8f0" />
            <stop offset="70%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Luxury 24K Gold Gradient */}
          <linearGradient id="figGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#facc15" />
            <stop offset="75%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>

          {/* Antique Bronze Gradient */}
          <linearGradient id="figBronze" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="35%" stopColor="#f97316" />
            <stop offset="75%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>

          {/* High-Tech Titanium / Cyber Cyan Gradient */}
          <linearGradient id="figTitanium" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="40%" stopColor="#38bdf8" />
            <stop offset="80%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* Cast Drop Shadow */}
          <filter id="pawnShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="5" stdDeviation="3" floodColor="#000000" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Realistic Ground Pedestal Ellipse Shadow */}
        <ellipse cx="50" cy="88" rx="34" ry="9" fill="#000000" opacity="0.45" />

        {/* 1. TOP HAT (Der klassische Zylinder) */}
        {figureId === 'hat' && (
          <g filter="url(#pawnShadow)">
            {/* Brim Rim Base */}
            <ellipse cx="50" cy="74" rx="38" ry="12" fill="url(#figSilver)" stroke="#334155" strokeWidth="2" />
            <ellipse cx="50" cy="72" rx="32" ry="9" fill="#f8fafc" opacity="0.4" />
            
            {/* Hat Crown */}
            <path
              d="M 28 72 L 31 28 Q 50 25 69 28 L 72 72 Z"
              fill="url(#figSilver)"
              stroke="#1e293b"
              strokeWidth="2"
            />
            {/* Gloss highlight on crown */}
            <path d="M 36 32 L 34 68 L 42 68 L 44 32 Z" fill="#ffffff" opacity="0.55" />
            
            {/* Top Flat Oval */}
            <ellipse cx="50" cy="28" rx="19.5" ry="6.5" fill="#f1f5f9" stroke="#334155" strokeWidth="1.8" />
            
            {/* Silk Red Ribbon Band */}
            <path d="M 28.5 63 Q 50 67 71.5 63 L 72 72 Q 50 76 28 72 Z" fill="#dc2626" />
            <path d="M 28.5 63 Q 50 67 71.5 63" stroke="#991b1b" strokeWidth="1.2" fill="none" />
          </g>
        )}

        {/* 2. VINTAGE RACE CAR (Oldtimer-Rennwagen) */}
        {figureId === 'car' && (
          <g filter="url(#pawnShadow)">
            {/* Big Spoked Spoke Wheels */}
            <circle cx="26" cy="70" r="13" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2.5" />
            <circle cx="26" cy="70" r="6" fill="url(#figSilver)" />
            <circle cx="74" cy="70" r="13" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2.5" />
            <circle cx="74" cy="70" r="6" fill="url(#figSilver)" />

            {/* Aerodynamic Chassis */}
            <path
              d="M 12 66 C 12 50 24 50 36 50 L 46 36 L 68 36 L 78 52 C 88 52 92 60 92 66 Z"
              fill="url(#figSilver)"
              stroke="#334155"
              strokeWidth="2"
            />
            {/* Chrome Front Radiator Grill */}
            <rect x="12" y="52" width="6" height="14" rx="2" fill="url(#figGold)" stroke="#854d0e" strokeWidth="1" />
            {/* Cockpit & Steering Wheel */}
            <ellipse cx="54" cy="42" rx="9" ry="5" fill="#020617" />
            <circle cx="56" cy="38" r="4" fill="url(#figSilver)" />
            {/* Exhaust Pipe with Glow */}
            <rect x="24" y="60" width="46" height="4" rx="2" fill="#475569" />
          </g>
        )}

        {/* 3. SCOTTIE DOG (Terrier-Hund) */}
        {figureId === 'dog' && (
          <g filter="url(#pawnShadow)">
            {/* 4 Paws on Ground */}
            <rect x="25" y="70" width="8" height="14" rx="4" fill="url(#figBronze)" />
            <rect x="36" y="72" width="8" height="12" rx="4" fill="#7c2d12" />
            <rect x="58" y="70" width="8" height="14" rx="4" fill="url(#figBronze)" />
            <rect x="68" y="72" width="8" height="12" rx="4" fill="#7c2d12" />

            {/* Dog Body */}
            <ellipse cx="48" cy="62" rx="24" ry="14" fill="url(#figBronze)" stroke="#7c2d12" strokeWidth="1.5" />
            
            {/* Tail Up */}
            <path d="M 68 56 Q 80 44 82 32" stroke="url(#figBronze)" strokeWidth="6" strokeLinecap="round" fill="none" />
            
            {/* Dog Head with Scottie Beard */}
            <path
              d="M 32 54 L 28 34 L 16 38 L 12 52 L 24 58 Z"
              fill="url(#figBronze)"
              stroke="#7c2d12"
              strokeWidth="1.5"
            />
            {/* Pointy Scottie Ears */}
            <polygon points="26,35 22,20 32,28" fill="url(#figBronze)" stroke="#7c2d12" strokeWidth="1" />
            <polygon points="34,35 38,22 42,32" fill="url(#figBronze)" stroke="#7c2d12" strokeWidth="1" />
            
            {/* Nose & Shiny Eye */}
            <circle cx="13" cy="46" r="3" fill="#0f172a" />
            <circle cx="22" cy="40" r="2.5" fill="#0f172a" />
            <circle cx="23" cy="39" r="0.8" fill="#ffffff" />
            
            {/* Golden Collar with Bell */}
            <path d="M 26 50 L 36 54" stroke="#eab308" strokeWidth="4" strokeLinecap="round" />
            <circle cx="31" cy="56" r="3.5" fill="#facc15" stroke="#a16207" strokeWidth="1" />
          </g>
        )}

        {/* 4. BATTLESHIP (Das Schlachtschiff) */}
        {figureId === 'ship' && (
          <g filter="url(#pawnShadow)">
            {/* Armor Hull */}
            <path
              d="M 10 70 L 22 52 L 78 52 L 92 70 Z"
              fill="url(#figSilver)"
              stroke="#1e293b"
              strokeWidth="2"
            />
            <line x1="14" y1="62" x2="88" y2="62" stroke="#64748b" strokeWidth="1.5" />

            {/* Superstructure / Command Bridge */}
            <rect x="42" y="36" width="22" height="16" fill="url(#figSilver)" stroke="#1e293b" strokeWidth="1.5" />
            <rect x="48" y="26" width="10" height="10" fill="#475569" stroke="#1e293b" strokeWidth="1" />
            <line x1="53" y1="26" x2="53" y2="18" stroke="#38bdf8" strokeWidth="2" />

            {/* Front & Rear Heavy Gun Turrets */}
            <circle cx="30" cy="50" r="6" fill="#334155" stroke="#0f172a" strokeWidth="1" />
            <line x1="30" y1="50" x2="16" y2="44" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
            
            <circle cx="72" cy="50" r="6" fill="#334155" stroke="#0f172a" strokeWidth="1" />
            <line x1="72" y1="50" x2="86" y2="44" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* 5. CLASSIC BOOT (Der Arbeiter-Stiefel) */}
        {figureId === 'boot' && (
          <g filter="url(#pawnShadow)">
            {/* Chunky Tread Sole */}
            <path
              d="M 18 78 L 84 78 C 88 78 90 74 88 70 L 80 66 L 56 66 L 56 70 L 26 70 L 22 74 Z"
              fill="#0f172a"
              stroke="#475569"
              strokeWidth="1.5"
            />
            {/* Boot Body */}
            <path
              d="M 24 70 L 24 30 L 48 30 L 48 52 C 54 54 64 56 76 60 C 82 62 84 66 80 68 L 24 70 Z"
              fill="url(#figBronze)"
              stroke="#7c2d12"
              strokeWidth="2"
            />
            {/* Laces & Eyelets */}
            <line x1="42" y1="36" x2="48" y2="38" stroke="#fef08a" strokeWidth="2" />
            <line x1="40" y1="42" x2="48" y2="44" stroke="#fef08a" strokeWidth="2" />
            <line x1="38" y1="48" x2="50" y2="50" stroke="#fef08a" strokeWidth="2" />
            {/* Boot Pull Loop */}
            <path d="M 24 30 Q 18 24 24 20" stroke="#7c2d12" strokeWidth="2.5" fill="none" />
          </g>
        )}

        {/* 6. LUCKY CAT (Die 24K Gold Katze) */}
        {figureId === 'cat' && (
          <g filter="url(#pawnShadow)">
            {/* Sitting Body */}
            <path
              d="M 32 76 C 30 52 38 46 50 46 C 62 46 70 52 68 76 Z"
              fill="url(#figGold)"
              stroke="#854d0e"
              strokeWidth="2"
            />
            {/* Arched Tail */}
            <path d="M 66 70 Q 82 66 80 44" stroke="url(#figGold)" strokeWidth="6" strokeLinecap="round" fill="none" />

            {/* Cat Head */}
            <circle cx="50" cy="38" r="16" fill="url(#figGold)" stroke="#854d0e" strokeWidth="2" />
            {/* Pointed Ears */}
            <polygon points="38,30 32,16 44,24" fill="url(#figGold)" stroke="#854d0e" strokeWidth="1.5" />
            <polygon points="56,24 68,16 62,30" fill="url(#figGold)" stroke="#854d0e" strokeWidth="1.5" />
            
            {/* Face details */}
            <ellipse cx="44" cy="36" rx="2.5" ry="3.5" fill="#0f172a" />
            <ellipse cx="56" cy="36" rx="2.5" ry="3.5" fill="#0f172a" />
            <circle cx="45" cy="35" r="1" fill="#ffffff" />
            <circle cx="57" cy="35" r="1" fill="#ffffff" />
            <polygon points="50,41 48,43 52,43" fill="#dc2626" />
            
            {/* Lucky Waving Paw */}
            <ellipse cx="34" cy="48" rx="6" ry="8" fill="url(#figGold)" stroke="#854d0e" strokeWidth="1.5" />
          </g>
        )}

        {/* 7. T-REX (Der prähistorische Bronze-Dino) */}
        {figureId === 'dino' && (
          <g filter="url(#pawnShadow)">
            {/* Massive Leg & Claws */}
            <path d="M 46 58 Q 54 64 50 78 L 40 78" stroke="url(#figBronze)" strokeWidth="8" strokeLinecap="round" fill="none" />
            {/* Tail */}
            <path d="M 64 56 Q 84 58 92 48" stroke="url(#figBronze)" strokeWidth="9" strokeLinecap="round" fill="none" />
            
            {/* Muscular Torso */}
            <ellipse cx="52" cy="52" rx="18" ry="14" fill="url(#figBronze)" stroke="#7c2d12" strokeWidth="2" />
            
            {/* Tiny Front Arm */}
            <path d="M 38 52 L 32 56" stroke="url(#figBronze)" strokeWidth="4" strokeLinecap="round" />

            {/* Fierce T-Rex Head with Jaws */}
            <path
              d="M 44 42 L 38 28 L 20 28 L 18 36 L 28 40 L 18 44 L 32 46 Z"
              fill="url(#figBronze)"
              stroke="#7c2d12"
              strokeWidth="2"
            />
            {/* Teeth */}
            <polygon points="22,36 24,39 26,36" fill="#ffffff" />
            <polygon points="27,36 29,39 31,36" fill="#ffffff" />
            {/* Glowing Eye */}
            <circle cx="32" cy="32" r="2.5" fill="#ef4444" />
          </g>
        )}

        {/* 8. SUPERSONIC JET 2026 (Privatjet 2026) */}
        {figureId === 'jet' && (
          <g filter="url(#pawnShadow)">
            {/* Sleek Fuselage */}
            <path
              d="M 50 14 C 44 26 42 60 42 74 L 58 74 C 58 60 56 26 50 14 Z"
              fill="url(#figTitanium)"
              stroke="#0369a1"
              strokeWidth="1.8"
            />
            {/* Cockpit Visor */}
            <ellipse cx="50" cy="26" rx="4" ry="7" fill="#0284c7" stroke="#ffffff" strokeWidth="0.8" />
            
            {/* Swept Delta Wings */}
            <polygon points="50,42 12,68 38,68" fill="url(#figTitanium)" stroke="#0369a1" strokeWidth="1.5" />
            <polygon points="50,42 88,68 62,68" fill="url(#figTitanium)" stroke="#0369a1" strokeWidth="1.5" />
            
            {/* Twin Jet Engines */}
            <rect x="36" y="64" width="6" height="12" rx="2" fill="#0f172a" />
            <circle cx="39" cy="76" r="3" fill="#f97316" />
            <rect x="58" y="64" width="6" height="12" rx="2" fill="#0f172a" />
            <circle cx="61" cy="76" r="3" fill="#f97316" />

            {/* Vertical Stabilizer Tail */}
            <polygon points="50,56 46,76 54,76" fill="url(#figSilver)" stroke="#0369a1" strokeWidth="1" />
          </g>
        )}
      </svg>
    </div>
  );
};
