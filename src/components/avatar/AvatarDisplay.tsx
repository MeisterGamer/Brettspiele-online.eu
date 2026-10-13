import React from 'react';
import { AvatarConfig } from '../../types';

interface AvatarDisplayProps {
  avatar: AvatarConfig;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isSpeaking?: boolean;
  className?: string;
  showBadge?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatar,
  size = 'md',
  isSpeaking = false,
  className = '',
  showBadge,
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
    '2xl': 'w-36 h-36',
  };

  const flairBorderMap: Record<string, string> = {
    none: 'border-2 border-slate-700/60',
    wood: 'border-4 border-amber-700 ring-2 ring-amber-900 shadow-md',
    'gold-vip': 'border-4 border-amber-400 ring-4 ring-amber-300/40 shadow-lg shadow-amber-500/30 animate-pulse',
    neon: 'border-4 border-cyan-400 ring-4 ring-cyan-500/40 shadow-lg shadow-cyan-500/40',
    diamond: 'border-4 border-sky-300 ring-4 ring-indigo-400/50 shadow-lg shadow-sky-400/50',
    rainbow: 'border-4 border-pink-500 ring-4 ring-purple-500/50 shadow-lg shadow-pink-500/40',
  };

  return (
    <div className={`relative inline-block select-none ${className}`}>
      {/* Speaking Soundwave Ring Indicator */}
      {isSpeaking && (
        <span className="absolute -inset-2 rounded-full border-2 border-emerald-400 animate-ping opacity-75 pointer-events-none" />
      )}

      {/* Main Avatar Container */}
      <div
        className={`relative overflow-hidden rounded-full bg-gradient-to-b from-slate-700 to-slate-800 flex items-center justify-center transition-transform hover:scale-105 ${
          sizeMap[size]
        } ${flairBorderMap[avatar.flair] || flairBorderMap.none}`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background tint */}
          <circle cx="50" cy="50" r="48" fill="#1E293B" />

          {/* Body / Shoulders / Outfit */}
          <path
            d="M20 98 C20 72 80 72 80 98 Z"
            fill={avatar.outfitColor || '#3B82F6'}
          />

          {/* Outfit specifics */}
          {avatar.outfit === 'jersey' && (
            <path d="M42 75 L50 88 L58 75 Z" fill="#F8FAFC" />
          )}
          {avatar.outfit === 'hoodie' && (
            <path d="M35 74 C42 84 58 84 65 74" stroke="#0F172A" strokeWidth="3" fill="none" />
          )}
          {avatar.outfit === 'royal' && (
            <path d="M48 72 L50 82 L52 72 Z" fill="#F59E0B" />
          )}
          {avatar.outfit === 'dino' && (
            <circle cx="50" cy="85" r="5" fill="#34D399" />
          )}

          {/* Neck */}
          <rect x="44" y="58" width="12" height="15" fill={avatar.skinTone} rx="4" />

          {/* Head */}
          <circle cx="50" cy="46" r="24" fill={avatar.skinTone} />

          {/* Hair Styles */}
          {avatar.hairStyle === 'curly' && (
            <g fill={avatar.hairColor}>
              <circle cx="34" cy="30" r="9" />
              <circle cx="50" cy="24" r="10" />
              <circle cx="66" cy="30" r="9" />
              <circle cx="28" cy="40" r="8" />
              <circle cx="72" cy="40" r="8" />
            </g>
          )}

          {avatar.hairStyle === 'spiky' && (
            <polygon
              points="28,34 35,16 43,30 50,14 57,30 65,16 72,34 50,22"
              fill={avatar.hairColor}
            />
          )}

          {avatar.hairStyle === 'straight' && (
            <path
              d="M26 44 C26 22 74 22 74 44 C74 54 70 58 70 58 C68 34 32 34 30 58 Z"
              fill={avatar.hairColor}
            />
          )}

          {avatar.hairStyle === 'bun' && (
            <g fill={avatar.hairColor}>
              <circle cx="50" cy="18" r="11" />
              <path d="M28 42 C28 26 72 26 72 42 Z" />
            </g>
          )}

          {avatar.hairStyle === 'cap' && (
            <g>
              <path d="M26 36 C26 22 74 22 74 36 Z" fill="#EF4444" />
              <rect x="20" y="34" width="60" height="6" rx="3" fill="#DC2626" />
            </g>
          )}

          {avatar.hairStyle === 'ponytail' && (
            <g fill={avatar.hairColor}>
              <path d="M28 40 C28 26 72 26 72 40 Z" />
              <path d="M68 36 C80 34 85 48 82 56 C78 54 74 46 68 42" />
            </g>
          )}

          {avatar.hairStyle === 'afro' && (
            <circle cx="50" cy="40" r="28" fill={avatar.hairColor} />
          )}

          {avatar.hairStyle === 'grandpa' && (
            <g fill={avatar.hairColor}>
              <path d="M26 42 C26 36 28 32 32 32" stroke={avatar.hairColor} strokeWidth="6" strokeLinecap="round" />
              <path d="M74 42 C74 36 72 32 68 32" stroke={avatar.hairColor} strokeWidth="6" strokeLinecap="round" />
            </g>
          )}

          {/* Eyes & Expressions */}
          {avatar.eyes === 'happy' && (
            <g fill="#1E293B">
              <circle cx="41" cy="46" r="3.2" />
              <circle cx="59" cy="46" r="3.2" />
              {/* Highlight */}
              <circle cx="42" cy="45" r="1.2" fill="#FFFFFF" />
              <circle cx="60" cy="45" r="1.2" fill="#FFFFFF" />
            </g>
          )}

          {avatar.eyes === 'sparkle' && (
            <g fill="#1E293B">
              <circle cx="41" cy="46" r="4" fill="#0284C7" />
              <circle cx="59" cy="46" r="4" fill="#0284C7" />
              <circle cx="40" cy="45" r="1.8" fill="#FFFFFF" />
              <circle cx="58" cy="45" r="1.8" fill="#FFFFFF" />
              <circle cx="42.5" cy="47.5" r="0.9" fill="#FFFFFF" />
              <circle cx="60.5" cy="47.5" r="0.9" fill="#FFFFFF" />
            </g>
          )}

          {avatar.eyes === 'cool' && (
            /* Sunglasses */
            <g fill="#0F172A">
              <rect x="33" y="42" width="15" height="10" rx="3" />
              <rect x="52" y="42" width="15" height="10" rx="3" />
              <rect x="47" y="44" width="6" height="3" />
              {/* Reflection */}
              <line x1="36" y1="44" x2="40" y2="50" stroke="#38BDF8" strokeWidth="1.5" />
              <line x1="55" y1="44" x2="59" y2="50" stroke="#38BDF8" strokeWidth="1.5" />
            </g>
          )}

          {avatar.eyes === 'glasses' && (
            <g stroke="#475569" strokeWidth="2" fill="none">
              <circle cx="41" cy="46" r="6" />
              <circle cx="59" cy="46" r="6" />
              <line x1="47" y1="46" x2="53" y2="46" />
              <circle cx="41" cy="46" r="2.5" fill="#1E293B" stroke="none" />
              <circle cx="59" cy="46" r="2.5" fill="#1E293B" stroke="none" />
            </g>
          )}

          {avatar.eyes === 'wink' && (
            <g>
              <path d="M37 46 Q41 42 45 46" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <circle cx="59" cy="46" r="3.2" fill="#1E293B" />
              <circle cx="60" cy="45" r="1.2" fill="#FFFFFF" />
            </g>
          )}

          {/* Mouth */}
          {avatar.mouth === 'smile' && (
            <path
              d="M44 56 Q50 63 56 56"
              stroke="#1E293B"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          )}
          {avatar.mouth === 'grin' && (
            <path
              d="M42 55 Q50 66 58 55 Z"
              fill="#FFFFFF"
              stroke="#1E293B"
              strokeWidth="2"
            />
          )}
          {avatar.mouth === 'laugh' && (
            <path
              d="M42 55 Q50 68 58 55 Z"
              fill="#E11D48"
              stroke="#1E293B"
              strokeWidth="2"
            />
          )}
          {avatar.mouth === 'neutral' && (
            <line x1="44" y1="58" x2="56" y2="58" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
          )}

          {/* Rosy Cheeks */}
          <circle cx="34" cy="52" r="3" fill="#FDA4AF" opacity="0.6" />
          <circle cx="66" cy="52" r="3" fill="#FDA4AF" opacity="0.6" />

          {/* Accessories */}
          {avatar.accessory === 'crown' && (
            <g fill="#F59E0B" stroke="#B45309" strokeWidth="1">
              <polygon points="34,26 40,14 50,22 60,14 66,26 34,26" />
              <circle cx="40" cy="14" r="1.8" fill="#EF4444" />
              <circle cx="50" cy="22" r="1.8" fill="#3B82F6" />
              <circle cx="60" cy="14" r="1.8" fill="#10B981" />
            </g>
          )}

          {avatar.accessory === 'headphones' && (
            <g stroke="#0284C7" strokeWidth="3" fill="none">
              <path d="M22 46 C22 24 78 24 78 46" />
              <rect x="20" y="42" width="6" height="12" rx="3" fill="#38BDF8" stroke="none" />
              <rect x="74" y="42" width="6" height="12" rx="3" fill="#38BDF8" stroke="none" />
            </g>
          )}

          {avatar.accessory === 'party-hat' && (
            <polygon
              points="40,24 50,4 60,24"
              fill="#EC4899"
              stroke="#BE185D"
              strokeWidth="1.5"
            />
          )}

          {avatar.accessory === 'mustache' && (
            <path
              d="M40 55 Q46 52 50 56 Q54 52 60 55 Q56 59 50 58 Q44 59 40 55 Z"
              fill="#451A03"
            />
          )}

          {avatar.accessory === 'star' && (
            <polygon
              points="50,6 52,12 58,12 53,16 55,22 50,18 45,22 47,16 42,12 48,12"
              fill="#FBBF24"
            />
          )}
        </svg>

        {/* VIP Crown Flair Floating Badge */}
        {avatar.flair === 'gold-vip' && (
          <span className="absolute -top-1 -right-1 text-xs bg-amber-400 text-amber-950 font-bold px-1 rounded-full shadow-sm">
            ★ VIP
          </span>
        )}
      </div>

      {/* Role / Custom Badge */}
      {showBadge && (
        <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full border border-slate-900 shadow">
          {showBadge}
        </span>
      )}
    </div>
  );
};
