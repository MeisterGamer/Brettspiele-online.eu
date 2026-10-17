import { ThemeId } from '../types';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  nameEn: string;
  tagline: string;
  primaryColor: string; // Hex for buttons / active state
  primaryHover: string;
  accentText: string;
  glowColor: string;
  badgeBg: string;
  badgeBorder: string;
  gradient: string; // Tailwind gradient classes
  ringColor: string;
  swatchGradient: string; // CSS linear-gradient for preview swatches
  textColor: string;
  btnClasses: string;
  badgeClasses: string;
}

export const APP_THEMES: Record<ThemeId, ThemeConfig> = {
  amber: {
    id: 'amber',
    name: 'Klassisches Gold (Bernstein)',
    nameEn: 'Classic Amber',
    tagline: 'Warmer Bernstein, Honiggold & Sonnenstrahlen',
    primaryColor: '#f59e0b',
    primaryHover: '#d97706',
    accentText: '#fbbf24',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: 'rgba(245, 158, 11, 0.4)',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    ringColor: '#f59e0b',
    swatchGradient: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #e11d48 100%)',
    textColor: 'text-amber-400',
    btnClasses: 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20',
    badgeClasses: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  purple: {
    id: 'purple',
    name: 'Königliches Violett (Royal Purple)',
    nameEn: 'Royal Purple',
    tagline: 'Majestätischer Amethyst, Purpur & Mystik',
    primaryColor: '#a855f7',
    primaryHover: '#9333ea',
    accentText: '#c084fc',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    badgeBg: 'rgba(168, 85, 247, 0.18)',
    badgeBorder: 'rgba(168, 85, 247, 0.4)',
    gradient: 'from-purple-500 via-fuchsia-500 to-indigo-600',
    ringColor: '#a855f7',
    swatchGradient: 'linear-gradient(135deg, #a855f7 0%, #d946ef 50%, #4f46e5 100%)',
    textColor: 'text-purple-400',
    btnClasses: 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/30',
    badgeClasses: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  emerald: {
    id: 'emerald',
    name: 'Smaragdwald (Emerald Forest)',
    nameEn: 'Emerald Forest',
    tagline: 'Frischer Smaragd, Jadegrün & Waldminze',
    primaryColor: '#10b981',
    primaryHover: '#059669',
    accentText: '#34d399',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    badgeBg: 'rgba(16, 185, 129, 0.18)',
    badgeBorder: 'rgba(16, 185, 129, 0.4)',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    ringColor: '#10b981',
    swatchGradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
    textColor: 'text-emerald-400',
    btnClasses: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25',
    badgeClasses: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  sky: {
    id: 'sky',
    name: 'Himmelsblau (Sky Blue)',
    nameEn: 'Sky Blue',
    tagline: 'Azurblau, Ozeanbrise & Saphirwellen',
    primaryColor: '#0ea5e9',
    primaryHover: '#0284c7',
    accentText: '#38bdf8',
    glowColor: 'rgba(14, 165, 233, 0.5)',
    badgeBg: 'rgba(14, 165, 233, 0.18)',
    badgeBorder: 'rgba(14, 165, 233, 0.4)',
    gradient: 'from-sky-400 via-cyan-500 to-blue-600',
    ringColor: '#0ea5e9',
    swatchGradient: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 50%, #2563eb 100%)',
    textColor: 'text-sky-400',
    btnClasses: 'bg-sky-400 hover:bg-sky-300 text-slate-950 shadow-sky-500/25',
    badgeClasses: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  ruby: {
    id: 'ruby',
    name: 'Rubinrot (Ruby Crimson)',
    nameEn: 'Ruby Crimson',
    tagline: 'Edles Rubinrot, samtige Kirsche & Glut',
    primaryColor: '#f43f5e',
    primaryHover: '#e11d48',
    accentText: '#fb7185',
    glowColor: 'rgba(244, 63, 94, 0.5)',
    badgeBg: 'rgba(244, 63, 94, 0.18)',
    badgeBorder: 'rgba(244, 63, 94, 0.4)',
    gradient: 'from-rose-500 via-red-500 to-amber-500',
    ringColor: '#f43f5e',
    swatchGradient: 'linear-gradient(135deg, #f43f5e 0%, #ef4444 50%, #f59e0b 100%)',
    textColor: 'text-rose-400',
    btnClasses: 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25',
    badgeClasses: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  orange: {
    id: 'orange',
    name: 'Sonnenflamme (Sunset Flame)',
    nameEn: 'Sunset Flame',
    tagline: 'Leuchtendes Sonnenuntergangs-Orange & Vulkan',
    primaryColor: '#f97316',
    primaryHover: '#ea580c',
    accentText: '#fb923c',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    badgeBg: 'rgba(249, 115, 22, 0.18)',
    badgeBorder: 'rgba(249, 115, 22, 0.4)',
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    ringColor: '#f97316',
    swatchGradient: 'linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #eab308 100%)',
    textColor: 'text-orange-400',
    btnClasses: 'bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-orange-500/25',
    badgeClasses: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
};

export const THEME_LIST: ThemeConfig[] = Object.values(APP_THEMES);

const THEME_STORAGE_KEY = 'famplay_accent_theme_id';

export const themeService = {
  getStoredTheme(): ThemeId {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId;
      if (saved && APP_THEMES[saved]) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'amber';
  },

  getTheme(id?: ThemeId): ThemeConfig {
    if (id && APP_THEMES[id]) {
      return APP_THEMES[id];
    }
    return APP_THEMES.amber;
  },

  applyTheme(id: ThemeId): ThemeConfig {
    const config = this.getTheme(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // ignore
    }

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-theme', id);
      root.style.setProperty('--theme-primary', config.primaryColor);
      root.style.setProperty('--theme-primary-hover', config.primaryHover);
      root.style.setProperty('--theme-accent-text', config.accentText);
      root.style.setProperty('--theme-glow', config.glowColor);
      root.style.setProperty('--theme-badge-bg', config.badgeBg);
      root.style.setProperty('--theme-badge-border', config.badgeBorder);
    }

    return config;
  },
};
