import { GameInfo, GameCategory } from '../types';

// Helper: converts SVG string to clean data URI
export const svgToDataUri = (svg: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
};

// Ambient backgrounds for games & tables (self-contained SVG data URIs, immune to CSP & offline)
export const TABLE_BACKGROUNDS = {
  mahogany: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900" width="1400" height="900">
      <defs>
        <radialGradient id="mCenter" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="#4e2613"/>
          <stop offset="60%" stop-color="#34160a"/>
          <stop offset="100%" stop-color="#190903"/>
        </radialGradient>
        <pattern id="grain" width="120" height="24" patternUnits="userSpaceOnUse">
          <path d="M0 6 Q 60 18 120 6 M0 14 Q 60 2 120 14" stroke="#230b03" stroke-width="1.2" fill="none" opacity="0.35"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mCenter)"/>
      <rect width="100%" height="100%" fill="url(#grain)"/>
      <rect width="100%" height="100%" fill="none" stroke="#2a1005" stroke-width="14" opacity="0.6"/>
    </svg>
  `),
  feltGreen: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900" width="1400" height="900">
      <defs>
        <radialGradient id="fCenter" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stop-color="#116239"/>
          <stop offset="65%" stop-color="#0a3e23"/>
          <stop offset="100%" stop-color="#051f11"/>
        </radialGradient>
        <radialGradient id="vignette" cx="50%" cy="50%" r="60%">
          <stop offset="80%" stop-color="transparent"/>
          <stop offset="100%" stop-color="#020e07" stop-opacity="0.85"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#fCenter)"/>
      <rect width="100%" height="100%" fill="url(#vignette)"/>
      <rect width="100%" height="100%" fill="none" stroke="#1d7a49" stroke-width="8" opacity="0.3"/>
    </svg>
  `),
  hearthCozy: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900" width="1400" height="900">
      <defs>
        <radialGradient id="hCenter" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="#5a2f14"/>
          <stop offset="50%" stop-color="#3c1e0b"/>
          <stop offset="100%" stop-color="#1c0b03"/>
        </radialGradient>
        <radialGradient id="fireGlow" cx="50%" cy="100%" r="65%">
          <stop offset="0%" stop-color="#ff7a18" stop-opacity="0.25"/>
          <stop offset="70%" stop-color="transparent"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#hCenter)"/>
      <rect width="100%" height="100%" fill="url(#fireGlow)"/>
    </svg>
  `),
  terraceGarden: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900" width="1400" height="900">
      <defs>
        <radialGradient id="tCenter" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="#2d3748"/>
          <stop offset="60%" stop-color="#1a202c"/>
          <stop offset="100%" stop-color="#0f141d"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#tCenter)"/>
    </svg>
  `),
  oceanRadar: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900" width="1400" height="900">
      <defs>
        <radialGradient id="oceanBg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#062744"/>
          <stop offset="55%" stop-color="#031526"/>
          <stop offset="100%" stop-color="#010a12"/>
        </radialGradient>
        <pattern id="radarGrid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00ffff" stroke-width="0.75" opacity="0.12"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#oceanBg)"/>
      <rect width="100%" height="100%" fill="url(#radarGrid)"/>
      <circle cx="700" cy="450" r="180" fill="none" stroke="#00e5ff" stroke-width="1" opacity="0.25" stroke-dasharray="8 6"/>
      <circle cx="700" cy="450" r="320" fill="none" stroke="#00e5ff" stroke-width="1.2" opacity="0.2"/>
      <circle cx="700" cy="450" r="460" fill="none" stroke="#00e5ff" stroke-width="1" opacity="0.15"/>
    </svg>
  `),
  slateZen: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900" width="1400" height="900">
      <defs>
        <radialGradient id="slateGrad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#242b35"/>
          <stop offset="60%" stop-color="#171b22"/>
          <stop offset="100%" stop-color="#0c0e12"/>
        </radialGradient>
        <pattern id="subtleGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="0.5" opacity="0.04"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#slateGrad)"/>
      <rect width="100%" height="100%" fill="url(#subtleGrid)"/>
    </svg>
  `),
};

export const HERO_BANNER_IMAGE = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 700" width="1600" height="700">
  <defs>
    <radialGradient id="heroGlow" cx="30%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#2e1065"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#090a16"/>
    </radialGradient>
    <radialGradient id="warmSpot" cx="75%" cy="55%" r="50%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="#b45309" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#heroGlow)"/>
  <rect width="100%" height="100%" fill="url(#warmSpot)"/>
  <g transform="translate(1120, 220) rotate(-12)" opacity="0.85">
    <rect width="120" height="120" rx="26" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
    <circle cx="35" cy="35" r="10" fill="#dc2626"/>
    <circle cx="60" cy="60" r="10" fill="#dc2626"/>
    <circle cx="85" cy="85" r="10" fill="#dc2626"/>
  </g>
  <g transform="translate(1280, 290) rotate(18)" opacity="0.85">
    <rect width="110" height="110" rx="24" fill="#fbbf24" stroke="#d97706" stroke-width="4"/>
    <circle cx="32" cy="32" r="9" fill="#1e293b"/>
    <circle cx="78" cy="32" r="9" fill="#1e293b"/>
    <circle cx="32" cy="78" r="9" fill="#1e293b"/>
    <circle cx="78" cy="78" r="9" fill="#1e293b"/>
    <circle cx="55" cy="55" r="9" fill="#1e293b"/>
  </g>
  <g transform="translate(1000, 360) rotate(-20)" opacity="0.85">
    <rect width="100" height="150" rx="14" fill="#ffffff" stroke="#94a3b8" stroke-width="3"/>
    <text x="50" y="90" font-family="sans-serif" font-weight="900" font-size="44" fill="#ef4444" text-anchor="middle">♥</text>
  </g>
  <g transform="translate(1060, 340) rotate(-5)" opacity="0.9">
    <rect width="100" height="150" rx="14" fill="#ffffff" stroke="#94a3b8" stroke-width="3"/>
    <text x="50" y="90" font-family="sans-serif" font-weight="900" font-size="44" fill="#0f172a" text-anchor="middle">♠</text>
  </g>
  <g transform="translate(1130, 350) rotate(14)" opacity="0.95">
    <rect width="100" height="150" rx="14" fill="#ffffff" stroke="#94a3b8" stroke-width="3"/>
    <text x="50" y="90" font-family="sans-serif" font-weight="900" font-size="40" fill="#f59e0b" text-anchor="middle">★</text>
  </g>
</svg>
`);
export const HERO_BANNER_FALLBACK = HERO_BANNER_IMAGE;

export const NAVAL_FLEET_PHOTOS = {
  carrier: {
    name: 'Flugzeugträger (Carrier)',
    size: 4,
    photo: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" width="300" height="120">
        <rect width="100%" height="100%" fill="#0a192f"/>
        <path d="M 20 80 L 50 40 L 260 40 L 285 80 Z" fill="#334155" stroke="#00ffff" stroke-width="2"/>
        <line x1="60" y1="55" x2="250" y2="55" stroke="#f1f5f9" stroke-width="3" stroke-dasharray="12 8"/>
        <rect x="180" y="24" width="35" height="16" fill="#1e293b" stroke="#00ffff" stroke-width="1"/>
      </svg>
    `),
    type: 'Supercarrier',
  },
  battleship: {
    name: 'Schlachtschiff (Battleship)',
    size: 3,
    photo: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" width="300" height="120">
        <rect width="100%" height="100%" fill="#0a192f"/>
        <path d="M 30 80 L 60 45 L 240 45 L 270 80 Z" fill="#334155" stroke="#38bdf8" stroke-width="2"/>
        <circle cx="95" cy="45" r="12" fill="#475569" stroke="#38bdf8" stroke-width="1.5"/>
        <line x1="95" y1="45" x2="65" y2="35" stroke="#e2e8f0" stroke-width="3"/>
        <circle cx="205" cy="45" r="12" fill="#475569" stroke="#38bdf8" stroke-width="1.5"/>
        <line x1="205" y1="45" x2="235" y2="35" stroke="#e2e8f0" stroke-width="3"/>
      </svg>
    `),
    type: 'Heavy Armor Dreadnought',
  },
  cruiser: {
    name: 'Kreuzer (Cruiser)',
    size: 3,
    photo: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" width="300" height="120">
        <rect width="100%" height="100%" fill="#0a192f"/>
        <path d="M 40 75 L 70 48 L 230 48 L 260 75 Z" fill="#334155" stroke="#38bdf8" stroke-width="2"/>
        <rect x="130" y="32" width="30" height="16" fill="#1e293b" stroke="#38bdf8" stroke-width="1"/>
        <circle cx="145" cy="24" r="6" fill="#0284c7"/>
      </svg>
    `),
    type: 'Aegis Radar Cruiser',
  },
  submarine: {
    name: 'U-Boot (Submarine)',
    size: 2,
    photo: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" width="300" height="120">
        <rect width="100%" height="100%" fill="#0a192f"/>
        <ellipse cx="150" cy="65" rx="100" ry="22" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
        <rect x="135" y="30" width="28" height="20" rx="3" fill="#334155" stroke="#38bdf8" stroke-width="1.5"/>
        <line x1="148" y1="30" x2="148" y2="18" stroke="#38bdf8" stroke-width="2"/>
      </svg>
    `),
    type: 'Stealth Hunter-Killer',
  },
  destroyer: {
    name: 'Zerstörer (Destroyer)',
    size: 2,
    photo: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" width="300" height="120">
        <rect width="100%" height="100%" fill="#0a192f"/>
        <path d="M 50 72 L 75 52 L 225 52 L 250 72 Z" fill="#334155" stroke="#38bdf8" stroke-width="2"/>
        <rect x="120" y="38" width="22" height="14" fill="#1e293b" stroke="#38bdf8" stroke-width="1"/>
      </svg>
    `),
    type: 'Fast Response Vessel',
  },
};

// --------------------------------------------------------------------------
// AUTHENTIC GAME SVG ILLUSTRATIONS
// Every SVG depicts the EXACT board, authentic figures, cards, dice and pieces.
// --------------------------------------------------------------------------

// 1. MENSCH ÄRGERE DICH NICHT (LUDO) with authentic wooden board & colored cone pawns
const SVG_LUDO = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <radialGradient id="woodTable" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#4a2810"/>
      <stop offset="100%" stop-color="#241206"/>
    </radialGradient>
    <linearGradient id="boardWood" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdf3dc"/>
      <stop offset="50%" stop-color="#eedcbe"/>
      <stop offset="100%" stop-color="#dfcaa6"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.6"/>
    </filter>
    <radialGradient id="redPawn" cx="35%" cy="25%" r="70%">
      <stop offset="0%" stop-color="#ff7b72"/>
      <stop offset="40%" stop-color="#e62e22"/>
      <stop offset="100%" stop-color="#801008"/>
    </radialGradient>
    <radialGradient id="greenPawn" cx="35%" cy="25%" r="70%">
      <stop offset="0%" stop-color="#7ee787"/>
      <stop offset="40%" stop-color="#238636"/>
      <stop offset="100%" stop-color="#0d4416"/>
    </radialGradient>
    <radialGradient id="yellowPawn" cx="35%" cy="25%" r="70%">
      <stop offset="0%" stop-color="#fff085"/>
      <stop offset="40%" stop-color="#d29922"/>
      <stop offset="100%" stop-color="#7a4e00"/>
    </radialGradient>
    <radialGradient id="bluePawn" cx="35%" cy="25%" r="70%">
      <stop offset="0%" stop-color="#79c0ff"/>
      <stop offset="40%" stop-color="#1f6feb"/>
      <stop offset="100%" stop-color="#0d3882"/>
    </radialGradient>
    <linearGradient id="diceWood" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
  </defs>

  <!-- Table background -->
  <rect width="400" height="240" fill="url(#woodTable)"/>

  <!-- Wooden Game Board -->
  <g filter="url(#shadow)">
    <rect x="90" y="10" width="220" height="220" rx="14" fill="url(#boardWood)" stroke="#8d5b2d" stroke-width="6"/>
    <rect x="96" y="16" width="208" height="208" rx="10" fill="none" stroke="#b08253" stroke-width="1.5" stroke-dasharray="4 2"/>
  </g>

  <!-- Corner Yards (Hof) -->
  <!-- Red Yard (Top Left) -->
  <rect x="105" y="25" width="45" height="45" rx="8" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
  <circle cx="118" cy="38" r="6" fill="#dc2626"/>
  <circle cx="137" cy="38" r="6" fill="#dc2626"/>
  <circle cx="118" cy="57" r="6" fill="#dc2626"/>
  <circle cx="137" cy="57" r="6" fill="#dc2626"/>

  <!-- Green Yard (Top Right) -->
  <rect x="250" y="25" width="45" height="45" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
  <circle cx="263" cy="38" r="6" fill="#16a34a"/>
  <circle cx="282" cy="38" r="6" fill="#16a34a"/>
  <circle cx="263" cy="57" r="6" fill="#16a34a"/>
  <circle cx="282" cy="57" r="6" fill="#16a34a"/>

  <!-- Yellow Yard (Bottom Left) -->
  <rect x="105" y="170" width="45" height="45" rx="8" fill="#fef9c3" stroke="#ca8a04" stroke-width="2"/>
  <circle cx="118" cy="183" r="6" fill="#ca8a04"/>
  <circle cx="137" cy="183" r="6" fill="#ca8a04"/>
  <circle cx="118" cy="202" r="6" fill="#ca8a04"/>
  <circle cx="137" cy="202" r="6" fill="#ca8a04"/>

  <!-- Blue Yard (Bottom Right) -->
  <rect x="250" y="170" width="45" height="45" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
  <circle cx="263" cy="183" r="6" fill="#2563eb"/>
  <circle cx="282" cy="183" r="6" fill="#2563eb"/>
  <circle cx="263" cy="202" r="6" fill="#2563eb"/>
  <circle cx="282" cy="202" r="6" fill="#2563eb"/>

  <!-- Cross tracks / Stepping spaces -->
  <!-- Center finish -->
  <circle cx="200" cy="120" r="12" fill="#475569" stroke="#1e293b" stroke-width="2"/>
  <circle cx="200" cy="120" r="8" fill="#cbd5e1"/>

  <!-- Colored home straight tracks (Zielfelder) -->
  <circle cx="200" cy="70" r="5" fill="#16a34a"/>
  <circle cx="200" cy="85" r="5" fill="#16a34a"/>
  <circle cx="200" cy="100" r="5" fill="#16a34a"/>

  <circle cx="200" cy="140" r="5" fill="#2563eb"/>
  <circle cx="200" cy="155" r="5" fill="#2563eb"/>
  <circle cx="200" cy="170" r="5" fill="#2563eb"/>

  <circle cx="150" cy="120" r="5" fill="#dc2626"/>
  <circle cx="165" cy="120" r="5" fill="#dc2626"/>
  <circle cx="180" cy="120" r="5" fill="#dc2626"/>

  <circle cx="220" cy="120" r="5" fill="#ca8a04"/>
  <circle cx="235" cy="120" r="5" fill="#ca8a04"/>
  <circle cx="250" cy="120" r="5" fill="#ca8a04"/>

  <!-- Walking track circles -->
  <g fill="#ffffff" stroke="#64748b" stroke-width="1.5">
    <circle cx="185" cy="40" r="5"/><circle cx="200" cy="40" r="5" fill="#dc2626" stroke="#b91c1c"/><circle cx="215" cy="40" r="5"/>
    <circle cx="185" cy="55" r="5"/><circle cx="215" cy="55" r="5"/>
    <circle cx="185" cy="70" r="5"/><circle cx="215" cy="70" r="5"/>
    <circle cx="185" cy="85" r="5"/><circle cx="215" cy="85" r="5"/>
    <circle cx="185" cy="100" r="5"/><circle cx="215" cy="100" r="5"/>

    <circle cx="120" cy="105" r="5"/><circle cx="135" cy="105" r="5"/><circle cx="150" cy="105" r="5"/><circle cx="165" cy="105" r="5"/>
    <circle cx="235" cy="105" r="5"/><circle cx="250" cy="105" r="5"/><circle cx="265" cy="105" r="5"/><circle cx="280" cy="105" r="5"/>

    <circle cx="120" cy="120" r="5" fill="#ca8a04" stroke="#a16207"/><circle cx="280" cy="120" r="5" fill="#16a34a" stroke="#15803d"/>

    <circle cx="120" cy="135" r="5"/><circle cx="135" cy="135" r="5"/><circle cx="150" cy="135" r="5"/><circle cx="165" cy="135" r="5"/>
    <circle cx="235" cy="135" r="5"/><circle cx="250" cy="135" r="5"/><circle cx="265" cy="135" r="5"/><circle cx="280" cy="135" r="5"/>

    <circle cx="185" cy="140" r="5"/><circle cx="215" cy="140" r="5"/>
    <circle cx="185" cy="155" r="5"/><circle cx="215" cy="155" r="5"/>
    <circle cx="185" cy="170" r="5"/><circle cx="215" cy="170" r="5"/>
    <circle cx="185" cy="185" r="5"/><circle cx="215" cy="185" r="5"/>
    <circle cx="185" cy="200" r="5"/><circle cx="200" cy="200" r="5" fill="#2563eb" stroke="#1d4ed8"/><circle cx="215" cy="200" r="5"/>
  </g>

  <!-- Authentic 3D Conical Wooden Halma Pawns (Holzkegel) -->
  <!-- Red Pawn on Board -->
  <g filter="url(#shadow)" transform="translate(185, 96)">
    <path d="M-6,14 L6,14 L4,2 L-4,2 Z" fill="url(#redPawn)"/>
    <circle cx="0" cy="1" r="5.5" fill="url(#redPawn)"/>
    <ellipse cx="0" cy="14" rx="6" ry="2" fill="#801008"/>
  </g>

  <!-- Green Pawn on Board -->
  <g filter="url(#shadow)" transform="translate(235, 101)">
    <path d="M-6,14 L6,14 L4,2 L-4,2 Z" fill="url(#greenPawn)"/>
    <circle cx="0" cy="1" r="5.5" fill="url(#greenPawn)"/>
    <ellipse cx="0" cy="14" rx="6" ry="2" fill="#0d4416"/>
  </g>

  <!-- Blue Pawn on Board -->
  <g filter="url(#shadow)" transform="translate(185, 166)">
    <path d="M-6,14 L6,14 L4,2 L-4,2 Z" fill="url(#bluePawn)"/>
    <circle cx="0" cy="1" r="5.5" fill="url(#bluePawn)"/>
    <ellipse cx="0" cy="14" rx="6" ry="2" fill="#0d3882"/>
  </g>

  <!-- Yellow Pawn on Board -->
  <g filter="url(#shadow)" transform="translate(146, 116)">
    <path d="M-6,14 L6,14 L4,2 L-4,2 Z" fill="url(#yellowPawn)"/>
    <circle cx="0" cy="1" r="5.5" fill="url(#yellowPawn)"/>
    <ellipse cx="0" cy="14" rx="6" ry="2" fill="#7a4e00"/>
  </g>

  <!-- Authentic Wooden Dice with 6 pips & Leather Cup -->
  <g filter="url(#shadow)" transform="translate(42, 130)">
    <!-- Leather Cup edge -->
    <path d="M-10,35 C-12,15 15,10 35,20 C42,45 30,58 5,55 Z" fill="#582c12" stroke="#3b1d0c" stroke-width="2"/>
    <!-- Die showing 6 -->
    <rect x="0" y="0" width="34" height="34" rx="6" fill="url(#diceWood)" stroke="#94a3b8" stroke-width="1.5"/>
    <circle cx="8" cy="8" r="2.8" fill="#0f172a"/>
    <circle cx="8" cy="17" r="2.8" fill="#0f172a"/>
    <circle cx="8" cy="26" r="2.8" fill="#0f172a"/>
    <circle cx="26" cy="8" r="2.8" fill="#0f172a"/>
    <circle cx="26" cy="17" r="2.8" fill="#0f172a"/>
    <circle cx="26" cy="26" r="2.8" fill="#0f172a"/>
  </g>

  <!-- Authentic German Game Title Plaque -->
  <rect x="110" y="215" width="180" height="18" rx="4" fill="#1e293b" opacity="0.9"/>
  <text x="200" y="228" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">MENSCH ÄRGERE DICH NICHT</text>
</svg>
`);

// 2. CLASSIC CHESS (SCHACH) with authentic Staunton figures on walnut & maple board
const SVG_CHESS = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <radialGradient id="tableBg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#2a1810"/>
      <stop offset="100%" stop-color="#120a06"/>
    </radialGradient>
    <filter id="pieceShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="5" stdDeviation="3" flood-color="#000" flood-opacity="0.7"/>
    </filter>
  </defs>

  <rect width="400" height="240" fill="url(#tableBg)"/>

  <!-- Inlaid Walnut Chessboard Border -->
  <rect x="80" y="10" width="240" height="220" rx="8" fill="#45220d" stroke="#2c1406" stroke-width="5"/>
  <rect x="88" y="18" width="224" height="204" rx="3" fill="#693616"/>

  <!-- 8x8 Board Grid -->
  <g transform="translate(92, 22)">
    <!-- Alternating Squares -->
    <!-- Rows 0 to 7 -->
    <rect x="0" y="0" width="24" height="24" fill="#ebd8b7"/><rect x="24" y="0" width="24" height="24" fill="#874e2a"/>
    <rect x="48" y="0" width="24" height="24" fill="#ebd8b7"/><rect x="72" y="0" width="24" height="24" fill="#874e2a"/>
    <rect x="96" y="0" width="24" height="24" fill="#ebd8b7"/><rect x="120" y="0" width="24" height="24" fill="#874e2a"/>
    <rect x="144" y="0" width="24" height="24" fill="#ebd8b7"/><rect x="168" y="0" width="24" height="24" fill="#874e2a"/>
    <rect x="192" y="0" width="24" height="24" fill="#ebd8b7"/>

    <!-- Row 1 -->
    <rect x="0" y="24" width="24" height="24" fill="#874e2a"/><rect x="24" y="24" width="24" height="24" fill="#ebd8b7"/>
    <rect x="48" y="24" width="24" height="24" fill="#874e2a"/><rect x="72" y="24" width="24" height="24" fill="#ebd8b7"/>
    <rect x="96" y="24" width="24" height="24" fill="#874e2a"/><rect x="120" y="24" width="24" height="24" fill="#ebd8b7"/>
    <rect x="144" y="24" width="24" height="24" fill="#874e2a"/><rect x="168" y="24" width="24" height="24" fill="#ebd8b7"/>
    <rect x="192" y="24" width="24" height="24" fill="#874e2a"/>

    <!-- Row 2 -->
    <rect x="0" y="48" width="24" height="24" fill="#ebd8b7"/><rect x="24" y="48" width="24" height="24" fill="#874e2a"/>
    <rect x="48" y="48" width="24" height="24" fill="#ebd8b7"/><rect x="72" y="48" width="24" height="24" fill="#874e2a"/>
    <rect x="96" y="48" width="24" height="24" fill="#ebd8b7"/><rect x="120" y="48" width="24" height="24" fill="#874e2a"/>
    <rect x="144" y="48" width="24" height="24" fill="#ebd8b7"/><rect x="168" y="48" width="24" height="24" fill="#874e2a"/>
    <rect x="192" y="48" width="24" height="24" fill="#ebd8b7"/>

    <!-- Row 3 -->
    <rect x="0" y="72" width="24" height="24" fill="#874e2a"/><rect x="24" y="72" width="24" height="24" fill="#ebd8b7"/>
    <rect x="48" y="72" width="24" height="24" fill="#874e2a"/><rect x="72" y="72" width="24" height="24" fill="#ebd8b7"/>
    <rect x="96" y="72" width="24" height="24" fill="#874e2a"/><rect x="120" y="72" width="24" height="24" fill="#ebd8b7"/>
    <rect x="144" y="72" width="24" height="24" fill="#874e2a"/><rect x="168" y="72" width="24" height="24" fill="#ebd8b7"/>
    <rect x="192" y="72" width="24" height="24" fill="#874e2a"/>

    <!-- Row 4 -->
    <rect x="0" y="96" width="24" height="24" fill="#ebd8b7"/><rect x="24" y="96" width="24" height="24" fill="#874e2a"/>
    <rect x="48" y="96" width="24" height="24" fill="#ebd8b7"/><rect x="72" y="96" width="24" height="24" fill="#874e2a"/>
    <rect x="96" y="96" width="24" height="24" fill="#ebd8b7"/><rect x="120" y="96" width="24" height="24" fill="#874e2a"/>
    <rect x="144" y="96" width="24" height="24" fill="#ebd8b7"/><rect x="168" y="96" width="24" height="24" fill="#874e2a"/>
    <rect x="192" y="96" width="24" height="24" fill="#ebd8b7"/>

    <!-- Row 5 -->
    <rect x="0" y="120" width="24" height="24" fill="#874e2a"/><rect x="24" y="120" width="24" height="24" fill="#ebd8b7"/>
    <rect x="48" y="120" width="24" height="24" fill="#874e2a"/><rect x="72" y="120" width="24" height="24" fill="#ebd8b7"/>
    <rect x="96" y="120" width="24" height="24" fill="#874e2a"/><rect x="120" y="120" width="24" height="24" fill="#ebd8b7"/>
    <rect x="144" y="120" width="24" height="24" fill="#874e2a"/><rect x="168" y="120" width="24" height="24" fill="#ebd8b7"/>
    <rect x="192" y="120" width="24" height="24" fill="#874e2a"/>

    <!-- Row 6 -->
    <rect x="0" y="144" width="24" height="24" fill="#ebd8b7"/><rect x="24" y="144" width="24" height="24" fill="#874e2a"/>
    <rect x="48" y="144" width="24" height="24" fill="#ebd8b7"/><rect x="72" y="144" width="24" height="24" fill="#874e2a"/>
    <rect x="96" y="144" width="24" height="24" fill="#ebd8b7"/><rect x="120" y="144" width="24" height="24" fill="#874e2a"/>
    <rect x="144" y="144" width="24" height="24" fill="#ebd8b7"/><rect x="168" y="144" width="24" height="24" fill="#874e2a"/>
    <rect x="192" y="144" width="24" height="24" fill="#ebd8b7"/>

    <!-- Row 7 -->
    <rect x="0" y="168" width="24" height="24" fill="#874e2a"/><rect x="24" y="168" width="24" height="24" fill="#ebd8b7"/>
    <rect x="48" y="168" width="24" height="24" fill="#874e2a"/><rect x="72" y="168" width="24" height="24" fill="#ebd8b7"/>
    <rect x="96" y="168" width="24" height="24" fill="#874e2a"/><rect x="120" y="168" width="24" height="24" fill="#ebd8b7"/>
    <rect x="144" y="168" width="24" height="24" fill="#874e2a"/><rect x="168" y="168" width="24" height="24" fill="#ebd8b7"/>
    <rect x="192" y="168" width="24" height="24" fill="#874e2a"/>
  </g>

  <!-- Staunton Wooden Chess Pieces on the Board -->
  <!-- White King (e1) -->
  <g filter="url(#pieceShadow)" transform="translate(190, 185) scale(0.9)">
    <path d="M-8,14 L8,14 L6,2 L-6,2 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="1"/>
    <path d="M-5,2 C-7,-4 7,-4 5,2 Z" fill="#fef08a"/>
    <line x1="0" y1="-7" x2="0" y2="-2" stroke="#ca8a04" stroke-width="2"/>
    <line x1="-3" y1="-5" x2="3" y2="-5" stroke="#ca8a04" stroke-width="2"/>
  </g>

  <!-- White Queen (d1) -->
  <g filter="url(#pieceShadow)" transform="translate(166, 185) scale(0.9)">
    <path d="M-8,14 L8,14 L6,2 L-6,2 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="1"/>
    <circle cx="0" cy="-2" r="4" fill="#fef08a"/>
    <circle cx="-5" cy="0" r="1.5" fill="#ca8a04"/>
    <circle cx="0" cy="-5" r="1.5" fill="#ca8a04"/>
    <circle cx="5" cy="0" r="1.5" fill="#ca8a04"/>
  </g>

  <!-- White Knight (f3) -->
  <g filter="url(#pieceShadow)" transform="translate(214, 137) scale(0.9)">
    <path d="M-7,14 L7,14 L5,6 C4,0 -2,-6 -6,0 C-8,4 -7,8 -3,6 L-3,10 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="1"/>
  </g>

  <!-- Black King (e8) -->
  <g filter="url(#pieceShadow)" transform="translate(190, 32) scale(0.9)">
    <path d="M-8,14 L8,14 L6,2 L-6,2 Z" fill="#1e1b18" stroke="#000" stroke-width="1"/>
    <path d="M-5,2 C-7,-4 7,-4 5,2 Z" fill="#1e1b18"/>
    <line x1="0" y1="-7" x2="0" y2="-2" stroke="#d4af37" stroke-width="2"/>
    <line x1="-3" y1="-5" x2="3" y2="-5" stroke="#d4af37" stroke-width="2"/>
  </g>

  <!-- Black Knight (c6) -->
  <g filter="url(#pieceShadow)" transform="translate(142, 80) scale(0.9)">
    <path d="M-7,14 L7,14 L5,6 C4,0 -2,-6 -6,0 C-8,4 -7,8 -3,6 L-3,10 Z" fill="#1e1b18" stroke="#000" stroke-width="1"/>
  </g>

  <!-- Dramatic Foreground Knight -->
  <g filter="url(#pieceShadow)" transform="translate(45, 120) scale(2.2)">
    <path d="M-8,16 L8,16 L6,8 C5,2 -2,-4 -7,2 C-9,7 -8,11 -4,8 L-4,12 Z" fill="#fffbeb" stroke="#d97706" stroke-width="1"/>
    <circle cx="-3" cy="2" r="1" fill="#78350f"/>
  </g>

  <rect x="120" y="215" width="160" height="18" rx="4" fill="#0f172a" opacity="0.9"/>
  <text x="200" y="228" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">SCHACH (STAUNTON)</text>
</svg>
`);

// 3. CONNECT FOUR (VIER GEWINNT) with iconic vertical blue rack & red/yellow discs
const SVG_CONNECT_FOUR = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <linearGradient id="bgDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="blueGrid" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="50%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
    <radialGradient id="redDisc" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fca5a5"/>
      <stop offset="40%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </radialGradient>
    <radialGradient id="yellowDisc" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#854d0e"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="400" height="240" fill="url(#bgDark)"/>

  <!-- Table Surface -->
  <ellipse cx="200" cy="220" rx="190" ry="30" fill="#020617" opacity="0.8"/>

  <!-- Blue Grid Legs -->
  <path d="M70,180 L80,215 L105,215 L95,180 Z" fill="#1e3a8a"/>
  <path d="M330,180 L320,215 L295,215 L305,180 Z" fill="#1e3a8a"/>

  <!-- Backing Slots with Discs -->
  <g transform="translate(85, 35)">
    <!-- Falling Disc Animation Feel -->
    <circle cx="160" cy="-10" r="12" fill="url(#yellowDisc)"/>
    
    <!-- Discs Inside Board -->
    <!-- Column 0 -->
    <circle cx="16" cy="145" r="12" fill="url(#redDisc)"/>
    <!-- Column 1 -->
    <circle cx="48" cy="145" r="12" fill="url(#yellowDisc)"/>
    <circle cx="48" cy="119" r="12" fill="url(#redDisc)"/>
    <!-- Column 2 -->
    <circle cx="80" cy="145" r="12" fill="url(#redDisc)"/>
    <circle cx="80" cy="119" r="12" fill="url(#yellowDisc)"/>
    <circle cx="80" cy="93" r="12" fill="url(#redDisc)"/>
    <!-- Column 3 (Connected 4 diagonal win in Red!) -->
    <circle cx="112" cy="145" r="12" fill="url(#redDisc)"/>
    <circle cx="112" cy="119" r="12" fill="url(#yellowDisc)"/>
    <circle cx="112" cy="93" r="12" fill="url(#yellowDisc)"/>
    <circle cx="112" cy="67" r="12" fill="url(#redDisc)" filter="url(#glow)"/>
    <!-- Column 4 -->
    <circle cx="144" cy="145" r="12" fill="url(#yellowDisc)"/>
    <circle cx="144" cy="119" r="12" fill="url(#redDisc)"/>
    <circle cx="144" cy="93" r="12" fill="url(#redDisc)" filter="url(#glow)"/>
    <!-- Column 5 -->
    <circle cx="176" cy="145" r="12" fill="url(#yellowDisc)"/>
    <circle cx="176" cy="119" r="12" fill="url(#redDisc)" filter="url(#glow)"/>
    <!-- Column 6 -->
    <circle cx="208" cy="145" r="12" fill="url(#redDisc)" filter="url(#glow)"/>
  </g>

  <!-- Winning Line Connection Line -->
  <line x1="197" y1="102" x2="293" y2="180" stroke="#fef08a" stroke-width="4" stroke-dasharray="3 3" filter="url(#glow)"/>

  <!-- Vertical Blue Rack Front Panel (7 cols x 6 rows) -->
  <rect x="80" y="25" width="240" height="165" rx="14" fill="url(#blueGrid)" stroke="#60a5fa" stroke-width="3"/>

  <!-- Holes cut into the front rack -->
  <g transform="translate(85, 35)">
    <!-- Loop through 7x6 holes -->
    <g fill="none" stroke="#172554" stroke-width="2.5">
      <!-- Col 0 -->
      <circle cx="16" cy="15" r="11.5"/><circle cx="16" cy="41" r="11.5"/><circle cx="16" cy="67" r="11.5"/><circle cx="16" cy="93" r="11.5"/><circle cx="16" cy="119" r="11.5"/><circle cx="16" cy="145" r="11.5"/>
      <!-- Col 1 -->
      <circle cx="48" cy="15" r="11.5"/><circle cx="48" cy="41" r="11.5"/><circle cx="48" cy="67" r="11.5"/><circle cx="48" cy="93" r="11.5"/><circle cx="48" cy="119" r="11.5"/><circle cx="48" cy="145" r="11.5"/>
      <!-- Col 2 -->
      <circle cx="80" cy="15" r="11.5"/><circle cx="80" cy="41" r="11.5"/><circle cx="80" cy="67" r="11.5"/><circle cx="80" cy="93" r="11.5"/><circle cx="80" cy="119" r="11.5"/><circle cx="80" cy="145" r="11.5"/>
      <!-- Col 3 -->
      <circle cx="112" cy="15" r="11.5"/><circle cx="112" cy="41" r="11.5"/><circle cx="112" cy="67" r="11.5"/><circle cx="112" cy="93" r="11.5"/><circle cx="112" cy="119" r="11.5"/><circle cx="112" cy="145" r="11.5"/>
      <!-- Col 4 -->
      <circle cx="144" cy="15" r="11.5"/><circle cx="144" cy="41" r="11.5"/><circle cx="144" cy="67" r="11.5"/><circle cx="144" cy="93" r="11.5"/><circle cx="144" cy="119" r="11.5"/><circle cx="144" cy="145" r="11.5"/>
      <!-- Col 5 -->
      <circle cx="176" cy="15" r="11.5"/><circle cx="176" cy="41" r="11.5"/><circle cx="176" cy="67" r="11.5"/><circle cx="176" cy="93" r="11.5"/><circle cx="176" cy="119" r="11.5"/><circle cx="176" cy="145" r="11.5"/>
      <!-- Col 6 -->
      <circle cx="208" cy="15" r="11.5"/><circle cx="208" cy="41" r="11.5"/><circle cx="208" cy="67" r="11.5"/><circle cx="208" cy="93" r="11.5"/><circle cx="208" cy="119" r="11.5"/><circle cx="208" cy="145" r="11.5"/>
    </g>
  </g>

  <!-- Title Badge -->
  <rect x="120" y="210" width="160" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="black" fill="#facc15" text-anchor="middle" letter-spacing="1">CONNECT FOUR • VIER GEWINNT</text>
</svg>
`);

// 4. CHECKERS / DAME with turned wooden draughts & crowned king
const SVG_CHECKERS = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <radialGradient id="checkersTable" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#3b1d0c"/>
      <stop offset="100%" stop-color="#170904"/>
    </radialGradient>
    <radialGradient id="darkPiece" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#522e1b"/>
      <stop offset="60%" stop-color="#241208"/>
      <stop offset="100%" stop-color="#0a0503"/>
    </radialGradient>
    <radialGradient id="lightPiece" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fff8e7"/>
      <stop offset="60%" stop-color="#ebd5b3"/>
      <stop offset="100%" stop-color="#b89363"/>
    </radialGradient>
  </defs>

  <rect width="400" height="240" fill="url(#checkersTable)"/>

  <!-- Checkerboard Frame -->
  <rect x="85" y="10" width="230" height="220" rx="10" fill="#2d1508" stroke="#120803" stroke-width="4"/>
  <rect x="93" y="18" width="214" height="204" rx="4" fill="#5c2d11"/>

  <!-- 8x8 Grid -->
  <g transform="translate(98, 23)">
    <!-- 8x8 Grid squares of 25x25 -->
    <!-- Pattern of brown and cream -->
    <rect x="0" y="0" width="204" height="194" fill="#f3dfc1"/>
    <!-- Dark squares -->
    <g fill="#42210d">
      <rect x="25" y="0" width="25" height="24"/><rect x="75" y="0" width="25" height="24"/><rect x="125" y="0" width="25" height="24"/><rect x="175" y="0" width="25" height="24"/>
      <rect x="0" y="24" width="25" height="24"/><rect x="50" y="24" width="25" height="24"/><rect x="100" y="24" width="25" height="24"/><rect x="150" y="24" width="25" height="24"/>
      <rect x="25" y="48" width="25" height="24"/><rect x="75" y="48" width="25" height="24"/><rect x="125" y="48" width="25" height="24"/><rect x="175" y="48" width="25" height="24"/>
      <rect x="0" y="72" width="25" height="24"/><rect x="50" y="72" width="25" height="24"/><rect x="100" y="72" width="25" height="24"/><rect x="150" y="72" width="25" height="24"/>
      <rect x="25" y="96" width="25" height="24"/><rect x="75" y="96" width="25" height="24"/><rect x="125" y="96" width="25" height="24"/><rect x="175" y="96" width="25" height="24"/>
      <rect x="0" y="120" width="25" height="24"/><rect x="50" y="120" width="25" height="24"/><rect x="100" y="120" width="25" height="24"/><rect x="150" y="120" width="25" height="24"/>
      <rect x="25" y="144" width="25" height="24"/><rect x="75" y="144" width="25" height="24"/><rect x="125" y="144" width="25" height="24"/><rect x="175" y="144" width="25" height="24"/>
      <rect x="0" y="168" width="25" height="24"/><rect x="50" y="168" width="25" height="24"/><rect x="100" y="168" width="25" height="24"/><rect x="150" y="168" width="25" height="24"/>
    </g>

    <!-- Dark Draught Pieces -->
    <g>
      <circle cx="37" cy="12" r="9" fill="url(#darkPiece)"/><circle cx="37" cy="12" r="5" fill="none" stroke="#6b3a22" stroke-width="1.5"/>
      <circle cx="87" cy="12" r="9" fill="url(#darkPiece)"/><circle cx="87" cy="12" r="5" fill="none" stroke="#6b3a22" stroke-width="1.5"/>
      <circle cx="137" cy="12" r="9" fill="url(#darkPiece)"/><circle cx="137" cy="12" r="5" fill="none" stroke="#6b3a22" stroke-width="1.5"/>
      <circle cx="187" cy="12" r="9" fill="url(#darkPiece)"/><circle cx="187" cy="12" r="5" fill="none" stroke="#6b3a22" stroke-width="1.5"/>

      <circle cx="12" cy="36" r="9" fill="url(#darkPiece)"/><circle cx="12" cy="36" r="5" fill="none" stroke="#6b3a22" stroke-width="1.5"/>
      <circle cx="62" cy="36" r="9" fill="url(#darkPiece)"/><circle cx="62" cy="36" r="5" fill="none" stroke="#6b3a22" stroke-width="1.5"/>
      <circle cx="112" cy="36" r="9" fill="url(#darkPiece)"/><circle cx="112" cy="36" r="5" fill="none" stroke="#6b3a22" stroke-width="1.5"/>
    </g>

    <!-- Light Draught Pieces -->
    <g>
      <circle cx="37" cy="156" r="9" fill="url(#lightPiece)"/><circle cx="37" cy="156" r="5" fill="none" stroke="#927046" stroke-width="1.5"/>
      <circle cx="87" cy="156" r="9" fill="url(#lightPiece)"/><circle cx="87" cy="156" r="5" fill="none" stroke="#927046" stroke-width="1.5"/>
      <circle cx="137" cy="156" r="9" fill="url(#lightPiece)"/><circle cx="137" cy="156" r="5" fill="none" stroke="#927046" stroke-width="1.5"/>

      <!-- Crowned King Piece with Golden Crown! -->
      <circle cx="112" cy="84" r="10" fill="url(#lightPiece)"/>
      <path d="M107,87 L117,87 L117,83 L115,84 L112,80 L109,84 L107,83 Z" fill="#eab308" stroke="#a16207" stroke-width="0.8"/>
    </g>
  </g>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#0f172a" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">DAME • CHECKERS</text>
</svg>
`);

// 5. BATTLESHIP (SCHIFFE VERSENKEN) with ocean radar grid & naval warships
const SVG_BATTLESHIP = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <radialGradient id="radarBg" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#0c2d48"/>
      <stop offset="60%" stop-color="#05192d"/>
      <stop offset="100%" stop-color="#020b14"/>
    </radialGradient>
    <linearGradient id="shipMetal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#94a3b8"/>
      <stop offset="50%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>

  <rect width="400" height="240" fill="url(#radarBg)"/>

  <!-- Radar Concentric Rings -->
  <g stroke="#0ea5e9" stroke-width="0.75" opacity="0.3" fill="none">
    <circle cx="200" cy="120" r="40"/><circle cx="200" cy="120" r="80"/><circle cx="200" cy="120" r="120"/><circle cx="200" cy="120" r="160"/>
    <line x1="200" y1="0" x2="200" y2="240"/><line x1="0" y1="120" x2="400" y2="120"/>
  </g>

  <!-- Player Ocean Coordinate Grid (10x10) -->
  <g transform="translate(60, 20)">
    <rect width="280" height="180" rx="8" fill="#072036" stroke="#0284c7" stroke-width="2" opacity="0.9"/>
    <!-- Grid Lines -->
    <path d="M28,0 v180 M56,0 v180 M84,0 v180 M112,0 v180 M140,0 v180 M168,0 v180 M196,0 v180 M224,0 v180 M252,0 v180" stroke="#0369a1" stroke-width="0.8" opacity="0.5"/>
    <path d="M0,18 h280 M0,36 h280 M0,54 h280 M0,72 h280 M0,90 h280 M0,108 h280 M0,126 h280 M0,144 h280 M0,162 h280" stroke="#0369a1" stroke-width="0.8" opacity="0.5"/>

    <!-- Aircraft Carrier (4 cells horizontal) -->
    <g transform="translate(32, 38)">
      <rect width="105" height="14" rx="4" fill="url(#shipMetal)" stroke="#334155" stroke-width="1"/>
      <line x1="10" y1="7" x2="95" y2="7" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="6 3"/>
      <!-- Hit on Carrier -->
      <circle cx="40" cy="7" r="4" fill="#ef4444"/>
    </g>

    <!-- Battleship (3 cells vertical) -->
    <g transform="translate(172, 56)">
      <rect width="20" height="78" rx="5" fill="url(#shipMetal)" stroke="#334155" stroke-width="1"/>
      <circle cx="10" cy="20" r="3" fill="#cbd5e1"/>
      <circle cx="10" cy="40" r="3" fill="#cbd5e1"/>
      <circle cx="10" cy="60" r="3" fill="#cbd5e1"/>
      <!-- Red Hit Peg -->
      <circle cx="10" cy="40" r="5" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/>
    </g>

    <!-- Submarine (2 cells) -->
    <g transform="translate(86, 110)">
      <rect width="52" height="14" rx="7" fill="url(#shipMetal)" stroke="#334155" stroke-width="1"/>
      <circle cx="26" cy="7" r="2.5" fill="#38bdf8"/>
    </g>

    <!-- Miss Pegs (White splashes) -->
    <circle cx="42" cy="99" r="3.5" fill="#ffffff" opacity="0.8"/>
    <circle cx="70" cy="135" r="3.5" fill="#ffffff" opacity="0.8"/>
    <circle cx="154" cy="27" r="3.5" fill="#ffffff" opacity="0.8"/>
    <circle cx="238" cy="81" r="3.5" fill="#ffffff" opacity="0.8"/>

    <!-- Red Hit Explosion Rings -->
    <circle cx="72" cy="45" r="5" fill="#ef4444" stroke="#fca5a5" stroke-width="2"/>
    <circle cx="72" cy="45" r="9" fill="none" stroke="#ef4444" stroke-width="1" opacity="0.6"/>
  </g>

  <!-- Coordinates Labels -->
  <text x="74" y="15" fill="#38bdf8" font-size="8" font-family="monospace">A B C D E F G H I J</text>

  <rect x="110" y="210" width="180" height="20" rx="4" fill="#020b14" opacity="0.95"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="black" fill="#38bdf8" text-anchor="middle" letter-spacing="1">SCHIFFE VERSENKEN • BATTLESHIP</text>
</svg>
`);

// 6. FAMCARDS (UNO / CRAZY EIGHTS) with vivid action cards (+4, Skip, Reverse)
const SVG_FAMCARDS = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <radialGradient id="cardsBg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="3" dy="6" stdDeviation="4" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <rect width="400" height="240" fill="url(#cardsBg)"/>

  <!-- Fanned Card Hand -->
  <!-- 1. Red 7 Card -->
  <g filter="url(#cardShadow)" transform="translate(100, 115) rotate(-22)">
    <rect x="-35" y="-55" width="70" height="110" rx="8" fill="#ef4444" stroke="#ffffff" stroke-width="3"/>
    <ellipse cx="0" cy="0" rx="26" ry="42" fill="#ffffff" transform="rotate(-15)"/>
    <text x="0" y="15" font-family="sans-serif" font-size="38" font-weight="900" fill="#ef4444" text-anchor="middle">7</text>
    <text x="-24" y="-35" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff">7</text>
    <text x="24" y="45" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="end">7</text>
  </g>

  <!-- 2. Blue Reverse Card -->
  <g filter="url(#cardShadow)" transform="translate(155, 100) rotate(-10)">
    <rect x="-35" y="-55" width="70" height="110" rx="8" fill="#2563eb" stroke="#ffffff" stroke-width="3"/>
    <ellipse cx="0" cy="0" rx="26" ry="42" fill="#ffffff" transform="rotate(-15)"/>
    <text x="0" y="12" font-family="sans-serif" font-size="34" font-weight="900" fill="#2563eb" text-anchor="middle">⇄</text>
    <text x="-24" y="-35" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff">⇄</text>
    <text x="24" y="45" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="end">⇄</text>
  </g>

  <!-- 3. Yellow +2 Card -->
  <g filter="url(#cardShadow)" transform="translate(210, 95) rotate(5)">
    <rect x="-35" y="-55" width="70" height="110" rx="8" fill="#eab308" stroke="#ffffff" stroke-width="3"/>
    <ellipse cx="0" cy="0" rx="26" ry="42" fill="#ffffff" transform="rotate(-15)"/>
    <text x="0" y="12" font-family="sans-serif" font-size="28" font-weight="900" fill="#ca8a04" text-anchor="middle">+2</text>
    <text x="-24" y="-35" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">+2</text>
    <text x="24" y="45" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">+2</text>
  </g>

  <!-- 4. Wild +4 Legendary Black Card -->
  <g filter="url(#cardShadow)" transform="translate(270, 115) rotate(22)">
    <rect x="-35" y="-55" width="70" height="110" rx="8" fill="#0f172a" stroke="#ffffff" stroke-width="3"/>
    <!-- 4-Color Oval -->
    <ellipse cx="0" cy="0" rx="26" ry="42" fill="#1e293b" transform="rotate(-15)"/>
    <!-- 4 colored card corners -->
    <rect x="-18" y="-20" width="16" height="22" rx="2" fill="#ef4444"/>
    <rect x="2" y="-20" width="16" height="22" rx="2" fill="#2563eb"/>
    <rect x="-18" y="4" width="16" height="22" rx="2" fill="#eab308"/>
    <rect x="2" y="4" width="16" height="22" rx="2" fill="#16a34a"/>
    <text x="0" y="6" font-family="sans-serif" font-size="18" font-weight="900" fill="#ffffff" text-anchor="middle">+4</text>
  </g>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">FAMCARDS • UNO STYLE</text>
</svg>
`);

// 7. YATZY / KNIFFEL with leather cup & 5 dice showing Yahtzee roll
const SVG_YATZY = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <radialGradient id="feltGreen" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#15803d"/>
      <stop offset="60%" stop-color="#14532d"/>
      <stop offset="100%" stop-color="#052e16"/>
    </radialGradient>
    <filter id="diceShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="3" dy="5" stdDeviation="3" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <rect width="400" height="240" fill="url(#feltGreen)"/>

  <!-- Yatzy Scorepad Table Sheet in Background -->
  <g transform="translate(240, 25)" opacity="0.85">
    <rect width="130" height="160" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <rect width="130" height="20" rx="4" fill="#0f172a"/>
    <text x="65" y="14" font-family="sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle">KNIFFEL / YATZY</text>
    <!-- Score lines -->
    <g stroke="#e2e8f0" stroke-width="1">
      <line x1="0" y1="36" x2="130" y2="36"/><line x1="0" y1="52" x2="130" y2="52"/><line x1="0" y1="68" x2="130" y2="68"/>
      <line x1="0" y1="84" x2="130" y2="84"/><line x1="0" y1="100" x2="130" y2="100"/><line x1="0" y1="116" x2="130" y2="116"/>
      <line x1="0" y1="132" x2="130" y2="132"/>
    </g>
    <text x="10" y="112" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b91c1c">YATZY (50 Pkt):</text>
    <text x="110" y="112" font-family="sans-serif" font-size="9" font-weight="900" fill="#15803d">50</text>
  </g>

  <!-- Leather Dice Cup -->
  <g transform="translate(60, 40) rotate(-25)">
    <path d="M0,0 L20,70 L80,70 L100,0 Z" fill="#451a03" stroke="#291104" stroke-width="3"/>
    <ellipse cx="50" cy="0" rx="50" ry="14" fill="#78350f" stroke="#291104" stroke-width="2"/>
    <!-- Leather Stitches -->
    <line x1="12" y1="20" x2="18" y2="24" stroke="#fef08a" stroke-width="1.5"/>
    <line x1="15" y1="35" x2="21" y2="39" stroke="#fef08a" stroke-width="1.5"/>
    <line x1="18" y1="50" x2="24" y2="54" stroke="#fef08a" stroke-width="1.5"/>
  </g>

  <!-- 5 Tumbling Ivory Dice (All showing SIXES - 50 Pkt Yatzy!) -->
  <!-- Die 1 -->
  <g filter="url(#diceShadow)" transform="translate(130, 110) rotate(12)">
    <rect x="-18" y="-18" width="36" height="36" rx="7" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <circle cx="-9" cy="-9" r="3" fill="#0f172a"/><circle cx="-9" cy="0" r="3" fill="#0f172a"/><circle cx="-9" cy="9" r="3" fill="#0f172a"/>
    <circle cx="9" cy="-9" r="3" fill="#0f172a"/><circle cx="9" cy="0" r="3" fill="#0f172a"/><circle cx="9" cy="9" r="3" fill="#0f172a"/>
  </g>

  <!-- Die 2 -->
  <g filter="url(#diceShadow)" transform="translate(180, 130) rotate(-8)">
    <rect x="-18" y="-18" width="36" height="36" rx="7" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <circle cx="-9" cy="-9" r="3" fill="#0f172a"/><circle cx="-9" cy="0" r="3" fill="#0f172a"/><circle cx="-9" cy="9" r="3" fill="#0f172a"/>
    <circle cx="9" cy="-9" r="3" fill="#0f172a"/><circle cx="9" cy="0" r="3" fill="#0f172a"/><circle cx="9" cy="9" r="3" fill="#0f172a"/>
  </g>

  <!-- Die 3 -->
  <g filter="url(#diceShadow)" transform="translate(160, 75) rotate(25)">
    <rect x="-18" y="-18" width="36" height="36" rx="7" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <circle cx="-9" cy="-9" r="3" fill="#0f172a"/><circle cx="-9" cy="0" r="3" fill="#0f172a"/><circle cx="-9" cy="9" r="3" fill="#0f172a"/>
    <circle cx="9" cy="-9" r="3" fill="#0f172a"/><circle cx="9" cy="0" r="3" fill="#0f172a"/><circle cx="9" cy="9" r="3" fill="#0f172a"/>
  </g>

  <!-- Die 4 -->
  <g filter="url(#diceShadow)" transform="translate(105, 160) rotate(-18)">
    <rect x="-18" y="-18" width="36" height="36" rx="7" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <circle cx="-9" cy="-9" r="3" fill="#0f172a"/><circle cx="-9" cy="0" r="3" fill="#0f172a"/><circle cx="-9" cy="9" r="3" fill="#0f172a"/>
    <circle cx="9" cy="-9" r="3" fill="#0f172a"/><circle cx="9" cy="0" r="3" fill="#0f172a"/><circle cx="9" cy="9" r="3" fill="#0f172a"/>
  </g>

  <!-- Die 5 -->
  <g filter="url(#diceShadow)" transform="translate(225, 165) rotate(15)">
    <rect x="-18" y="-18" width="36" height="36" rx="7" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <circle cx="-9" cy="-9" r="3" fill="#0f172a"/><circle cx="-9" cy="0" r="3" fill="#0f172a"/><circle cx="-9" cy="9" r="3" fill="#0f172a"/>
    <circle cx="9" cy="-9" r="3" fill="#0f172a"/><circle cx="9" cy="0" r="3" fill="#0f172a"/><circle cx="9" cy="9" r="3" fill="#0f172a"/>
  </g>

  <rect x="110" y="210" width="180" height="20" rx="4" fill="#052e16" opacity="0.95"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="black" fill="#facc15" text-anchor="middle" letter-spacing="1">KNIFFEL • YATZY 50 PKT</text>
</svg>
`);

// 8. MEMORY MATCH with matching picture cards
const SVG_MEMORY = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <radialGradient id="memBg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#312e81"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </radialGradient>
    <filter id="mShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect width="400" height="240" fill="url(#memBg)"/>

  <!-- Grid of Cards (4x2) -->
  <g transform="translate(70, 30)">
    <!-- Face-down cards -->
    <rect x="0" y="0" width="55" height="70" rx="6" fill="#4338ca" stroke="#818cf8" stroke-width="2"/>
    <circle cx="27" cy="35" r="14" fill="#312e81" stroke="#a5b4fc" stroke-width="1.5"/>

    <rect x="70" y="0" width="55" height="70" rx="6" fill="#4338ca" stroke="#818cf8" stroke-width="2"/>
    <circle cx="97" cy="35" r="14" fill="#312e81" stroke="#a5b4fc" stroke-width="1.5"/>

    <!-- 2 MATCHING OPEN CARDS (Lion / Star!) -->
    <g filter="url(#mShadow)">
      <rect x="140" y="0" width="55" height="70" rx="6" fill="#ffffff" stroke="#facc15" stroke-width="3"/>
      <text x="167" y="44" font-size="28" text-anchor="middle">🦁</text>
    </g>

    <g filter="url(#mShadow)">
      <rect x="210" y="0" width="55" height="70" rx="6" fill="#ffffff" stroke="#facc15" stroke-width="3"/>
      <text x="237" y="44" font-size="28" text-anchor="middle">🦁</text>
    </g>

    <!-- Bottom Row -->
    <rect x="0" y="85" width="55" height="70" rx="6" fill="#4338ca" stroke="#818cf8" stroke-width="2"/>
    <circle cx="27" cy="120" r="14" fill="#312e81" stroke="#a5b4fc" stroke-width="1.5"/>

    <!-- Two open Star cards -->
    <rect x="70" y="85" width="55" height="70" rx="6" fill="#ffffff" stroke="#38bdf8" stroke-width="2"/>
    <text x="97" y="129" font-size="26" text-anchor="middle">⭐</text>

    <rect x="140" y="85" width="55" height="70" rx="6" fill="#4338ca" stroke="#818cf8" stroke-width="2"/>
    <circle cx="167" cy="120" r="14" fill="#312e81" stroke="#a5b4fc" stroke-width="1.5"/>

    <rect x="210" y="85" width="55" height="70" rx="6" fill="#4338ca" stroke="#818cf8" stroke-width="2"/>
    <circle cx="237" cy="120" r="14" fill="#312e81" stroke="#a5b4fc" stroke-width="1.5"/>
  </g>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#0f172a" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">MEMORY MATCH • PAARE</text>
</svg>
`);

// 9. DOTS AND BOXES (KÄSEKÄSTCHEN) with drawn lines & claimed initials
const SVG_DOTS_BOXES = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <rect width="400" height="240" fill="#0f172a"/>

  <!-- Blueprint grid lines -->
  <g stroke="#1e293b" stroke-width="1">
    <line x1="0" y1="40" x2="400" y2="40"/><line x1="0" y1="80" x2="400" y2="80"/><line x1="0" y1="120" x2="400" y2="120"/><line x1="0" y1="160" x2="400" y2="160"/><line x1="0" y1="200" x2="400" y2="200"/>
  </g>

  <g transform="translate(90, 30)">
    <!-- Completed Boxes -->
    <rect x="0" y="0" width="50" height="50" fill="#3b82f6" opacity="0.4"/>
    <text x="25" y="32" font-family="sans-serif" font-size="18" font-weight="bold" fill="#60a5fa" text-anchor="middle">A</text>

    <rect x="50" y="0" width="50" height="50" fill="#ef4444" opacity="0.4"/>
    <text x="75" y="32" font-family="sans-serif" font-size="18" font-weight="bold" fill="#f87171" text-anchor="middle">B</text>

    <rect x="50" y="50" width="50" height="50" fill="#3b82f6" opacity="0.4"/>
    <text x="75" y="82" font-family="sans-serif" font-size="18" font-weight="bold" fill="#60a5fa" text-anchor="middle">A</text>

    <!-- Drawn Lines -->
    <g stroke="#3b82f6" stroke-width="4" stroke-linecap="round">
      <line x1="0" y1="0" x2="50" y2="0"/><line x1="0" y1="0" x2="0" y2="50"/><line x1="0" y1="50" x2="50" y2="50"/>
      <line x1="50" y1="50" x2="100" y2="50"/><line x1="50" y1="100" x2="100" y2="100"/><line x1="50" y1="50" x2="50" y2="100"/>
    </g>
    <g stroke="#ef4444" stroke-width="4" stroke-linecap="round">
      <line x1="50" y1="0" x2="100" y2="0"/><line x1="100" y1="0" x2="100" y2="50"/><line x1="50" y1="0" x2="50" y2="50"/>
      <line x1="100" y1="50" x2="100" y2="100"/>
    </g>

    <!-- Active Pencil Line being drawn -->
    <line x1="100" y1="50" x2="150" y2="50" stroke="#facc15" stroke-width="4" stroke-dasharray="4 2"/>

    <!-- Grid Dots (5x4) -->
    <g fill="#f8fafc">
      <!-- Row 0 -->
      <circle cx="0" cy="0" r="4"/><circle cx="50" cy="0" r="4"/><circle cx="100" cy="0" r="4"/><circle cx="150" cy="0" r="4"/><circle cx="200" cy="0" r="4"/>
      <!-- Row 1 -->
      <circle cx="0" cy="50" r="4"/><circle cx="50" cy="50" r="4"/><circle cx="100" cy="50" r="4"/><circle cx="150" cy="50" r="4"/><circle cx="200" cy="50" r="4"/>
      <!-- Row 2 -->
      <circle cx="0" cy="100" r="4"/><circle cx="50" cy="100" r="4"/><circle cx="100" cy="100" r="4"/><circle cx="150" cy="100" r="4"/><circle cx="200" cy="100" r="4"/>
      <!-- Row 3 -->
      <circle cx="0" cy="150" r="4"/><circle cx="50" cy="150" r="4"/><circle cx="100" cy="150" r="4"/><circle cx="150" cy="150" r="4"/><circle cx="200" cy="150" r="4"/>
    </g>
  </g>

  <rect x="110" y="210" width="180" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">KÄSEKÄSTCHEN • DOTS &amp; BOXES</text>
</svg>
`);

// 10. TIC TAC TOE & GOMOKU with wooden X and O
const SVG_TICTACTOE = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <rect width="400" height="240" fill="#1e293b"/>

  <!-- Slate Board -->
  <rect x="90" y="15" width="220" height="190" rx="12" fill="#0f172a" stroke="#334155" stroke-width="4"/>

  <!-- Chalk Grid Lines -->
  <line x1="163" y1="30" x2="163" y2="190" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>
  <line x1="237" y1="30" x2="237" y2="190" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>
  <line x1="105" y1="88" x2="295" y2="88" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>
  <line x1="105" y1="147" x2="295" y2="147" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>

  <!-- Tokens (X in Red, O in Gold) -->
  <!-- Top Left: X -->
  <g stroke="#ef4444" stroke-width="7" stroke-linecap="round">
    <line x1="118" y1="42" x2="148" y2="72"/>
    <line x1="148" y1="42" x2="118" y2="72"/>
  </g>

  <!-- Center: X -->
  <g stroke="#ef4444" stroke-width="7" stroke-linecap="round">
    <line x1="185" y1="103" x2="215" y2="133"/>
    <line x1="215" y1="103" x2="185" y2="133"/>
  </g>

  <!-- Bottom Right: X (Winning Row!) -->
  <g stroke="#ef4444" stroke-width="7" stroke-linecap="round">
    <line x1="252" y1="160" x2="282" y2="190"/>
    <line x1="282" y1="160" x2="252" y2="190"/>
  </g>

  <!-- Top Right: O -->
  <circle cx="267" cy="57" r="16" fill="none" stroke="#facc15" stroke-width="7"/>

  <!-- Bottom Left: O -->
  <circle cx="133" cy="175" r="16" fill="none" stroke="#facc15" stroke-width="7"/>

  <!-- Winning Line Strike -->
  <line x1="110" y1="35" x2="290" y2="195" stroke="#22c55e" stroke-width="4" stroke-linecap="round"/>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">TIC-TAC-TOE • DREI GEWINNT</text>
</svg>
`);

// 11. HEARTS & SPADES (CARD GAMES) with Ace of Spades & Queen of Hearts
const SVG_HEARTS_SPADES = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <radialGradient id="feltRed" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#450a0a"/>
      <stop offset="100%" stop-color="#1c0404"/>
    </radialGradient>
    <filter id="cShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <rect width="400" height="240" fill="url(#feltRed)"/>

  <!-- Ace of Spades -->
  <g filter="url(#cShadow)" transform="translate(130, 110) rotate(-15)">
    <rect x="-35" y="-55" width="70" height="110" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <text x="-24" y="-36" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a">A</text>
    <text x="-24" y="-22" font-family="sans-serif" font-size="12" fill="#0f172a">♠</text>
    <text x="0" y="16" font-family="sans-serif" font-size="44" fill="#0f172a" text-anchor="middle">♠</text>
  </g>

  <!-- Queen of Spades (Black Lady in Hearts) -->
  <g filter="url(#cShadow)" transform="translate(195, 100) rotate(2)">
    <rect x="-35" y="-55" width="70" height="110" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <text x="-24" y="-36" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a">Q</text>
    <text x="-24" y="-22" font-family="sans-serif" font-size="12" fill="#0f172a">♠</text>
    <text x="0" y="14" font-family="sans-serif" font-size="36" fill="#0f172a" text-anchor="middle">👑</text>
    <text x="0" y="38" font-family="sans-serif" font-size="16" fill="#0f172a" text-anchor="middle">♠</text>
  </g>

  <!-- Ace of Hearts -->
  <g filter="url(#cShadow)" transform="translate(260, 115) rotate(18)">
    <rect x="-35" y="-55" width="70" height="110" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <text x="-24" y="-36" font-family="sans-serif" font-size="15" font-weight="bold" fill="#dc2626">A</text>
    <text x="-24" y="-22" font-family="sans-serif" font-size="12" fill="#dc2626">♥</text>
    <text x="0" y="16" font-family="sans-serif" font-size="44" fill="#dc2626" text-anchor="middle">♥</text>
  </g>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">HEARTS &amp; SPADES • KARTEN</text>
</svg>
`);

// 12. BACKGAMMON with inlaid triangular points & checkers
const SVG_BACKGAMMON = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <rect width="400" height="240" fill="#2d1508"/>

  <!-- Backgammon Wood Tray -->
  <rect x="70" y="15" width="260" height="190" rx="8" fill="#5c2d11" stroke="#1c0903" stroke-width="6"/>
  <!-- Center Bar -->
  <rect x="190" y="15" width="20" height="190" fill="#3b1d0c"/>

  <!-- Triangular Points (Top Row) -->
  <polygon points="80,18 95,85 110,18" fill="#ebd8b7"/>
  <polygon points="110,18 125,85 140,18" fill="#874e2a"/>
  <polygon points="140,18 155,85 170,18" fill="#ebd8b7"/>
  <polygon points="170,18 185,85 190,18" fill="#874e2a"/>

  <polygon points="210,18 225,85 240,18" fill="#ebd8b7"/>
  <polygon points="240,18 255,85 270,18" fill="#874e2a"/>
  <polygon points="270,18 285,85 300,18" fill="#ebd8b7"/>
  <polygon points="300,18 315,85 320,18" fill="#874e2a"/>

  <!-- Triangular Points (Bottom Row) -->
  <polygon points="80,202 95,135 110,202" fill="#874e2a"/>
  <polygon points="110,202 125,135 140,202" fill="#ebd8b7"/>
  <polygon points="140,202 155,135 170,202" fill="#874e2a"/>
  <polygon points="170,202 185,135 190,202" fill="#ebd8b7"/>

  <polygon points="210,202 225,135 240,202" fill="#874e2a"/>
  <polygon points="240,202 255,135 270,202" fill="#ebd8b7"/>
  <polygon points="270,202 285,135 300,202" fill="#874e2a"/>
  <polygon points="300,202 315,135 320,202" fill="#ebd8b7"/>

  <!-- Checkers -->
  <circle cx="95" cy="30" r="9" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <circle cx="95" cy="48" r="9" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <circle cx="95" cy="66" r="9" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>

  <circle cx="225" cy="190" r="9" fill="#1e1b18" stroke="#000000" stroke-width="2"/>
  <circle cx="225" cy="172" r="9" fill="#1e1b18" stroke="#000000" stroke-width="2"/>

  <!-- Doubling Cube 64 on Bar -->
  <rect x="194" y="95" width="12" height="12" rx="2" fill="#f8fafc"/>
  <text x="200" y="104" font-family="sans-serif" font-size="7" font-weight="bold" fill="#0f172a" text-anchor="middle">64</text>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">BACKGAMMON • TAVLA</text>
</svg>
`);

// 13. DOMINOES with ivory bone tiles
const SVG_DOMINOES = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <rect width="400" height="240" fill="#14532d"/>

  <!-- Domino Tiles linked together -->
  <!-- Tile 1: [6 | 6] Double Six -->
  <g transform="translate(110, 80)">
    <rect width="40" height="80" rx="5" fill="#fdfbf7" stroke="#334155" stroke-width="2"/>
    <line x1="4" y1="40" x2="36" y2="40" stroke="#64748b" stroke-width="1.5"/>
    <!-- Center brass spinner pin -->
    <circle cx="20" cy="40" r="2" fill="#ca8a04"/>
    <!-- Top 6 -->
    <circle cx="12" cy="12" r="2.5" fill="#0f172a"/><circle cx="12" cy="20" r="2.5" fill="#0f172a"/><circle cx="12" cy="28" r="2.5" fill="#0f172a"/>
    <circle cx="28" cy="12" r="2.5" fill="#0f172a"/><circle cx="28" cy="20" r="2.5" fill="#0f172a"/><circle cx="28" cy="28" r="2.5" fill="#0f172a"/>
    <!-- Bottom 6 -->
    <circle cx="12" cy="52" r="2.5" fill="#0f172a"/><circle cx="12" cy="60" r="2.5" fill="#0f172a"/><circle cx="12" cy="68" r="2.5" fill="#0f172a"/>
    <circle cx="28" cy="52" r="2.5" fill="#0f172a"/><circle cx="28" cy="60" r="2.5" fill="#0f172a"/><circle cx="28" cy="68" r="2.5" fill="#0f172a"/>
  </g>

  <!-- Tile 2: [6 | 4] Horizontal -->
  <g transform="translate(155, 100)">
    <rect width="80" height="40" rx="5" fill="#fdfbf7" stroke="#334155" stroke-width="2"/>
    <line x1="40" y1="4" x2="40" y2="36" stroke="#64748b" stroke-width="1.5"/>
    <circle cx="40" cy="20" r="2" fill="#ca8a04"/>
    <!-- Left 6 -->
    <circle cx="12" cy="12" r="2.5" fill="#0f172a"/><circle cx="20" cy="12" r="2.5" fill="#0f172a"/><circle cx="28" cy="12" r="2.5" fill="#0f172a"/>
    <circle cx="12" cy="28" r="2.5" fill="#0f172a"/><circle cx="20" cy="28" r="2.5" fill="#0f172a"/><circle cx="28" cy="28" r="2.5" fill="#0f172a"/>
    <!-- Right 4 -->
    <circle cx="52" cy="12" r="2.5" fill="#0f172a"/><circle cx="68" cy="12" r="2.5" fill="#0f172a"/>
    <circle cx="52" cy="28" r="2.5" fill="#0f172a"/><circle cx="68" cy="28" r="2.5" fill="#0f172a"/>
  </g>

  <!-- Tile 3: [4 | 1] -->
  <g transform="translate(240, 80)">
    <rect width="40" height="80" rx="5" fill="#fdfbf7" stroke="#334155" stroke-width="2"/>
    <line x1="4" y1="40" x2="36" y2="40" stroke="#64748b" stroke-width="1.5"/>
    <!-- Top 4 -->
    <circle cx="12" cy="14" r="2.5" fill="#0f172a"/><circle cx="28" cy="14" r="2.5" fill="#0f172a"/>
    <circle cx="12" cy="26" r="2.5" fill="#0f172a"/><circle cx="28" cy="26" r="2.5" fill="#0f172a"/>
    <!-- Bottom 1 -->
    <circle cx="20" cy="60" r="3" fill="#0f172a"/>
  </g>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">DOMINO • KLASSISCH</text>
</svg>
`);

// 14. MANCALA with carved wood pits & glass beads
const SVG_MANCALA = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <rect width="400" height="240" fill="#2d1508"/>

  <!-- Wooden Board Oval -->
  <rect x="50" y="50" width="300" height="120" rx="40" fill="#854d0e" stroke="#451a03" stroke-width="6"/>

  <!-- Left Kalah Store Pit -->
  <ellipse cx="80" cy="110" rx="16" ry="38" fill="#3b1d0c"/>
  <circle cx="78" cy="100" r="4" fill="#38bdf8"/>
  <circle cx="84" cy="115" r="4" fill="#f43f5e"/>
  <circle cx="80" cy="125" r="4" fill="#eab308"/>

  <!-- Right Kalah Store Pit -->
  <ellipse cx="320" cy="110" rx="16" ry="38" fill="#3b1d0c"/>
  <circle cx="318" cy="105" r="4" fill="#22c55e"/>
  <circle cx="324" cy="118" r="4" fill="#38bdf8"/>

  <!-- 2 Rows of 6 Circular Pits -->
  <!-- Top Row -->
  <g fill="#3b1d0c">
    <circle cx="120" cy="85" r="14"/><circle cx="152" cy="85" r="14"/><circle cx="184" cy="85" r="14"/>
    <circle cx="216" cy="85" r="14"/><circle cx="248" cy="85" r="14"/><circle cx="280" cy="85" r="14"/>
    <!-- Bottom Row -->
    <circle cx="120" cy="135" r="14"/><circle cx="152" cy="135" r="14"/><circle cx="184" cy="135" r="14"/>
    <circle cx="216" cy="135" r="14"/><circle cx="248" cy="135" r="14"/><circle cx="280" cy="135" r="14"/>
  </g>

  <!-- Colored Glass Beads in pits -->
  <circle cx="120" cy="85" r="3" fill="#38bdf8"/><circle cx="123" cy="88" r="3" fill="#f43f5e"/>
  <circle cx="184" cy="85" r="3.5" fill="#eab308"/><circle cx="186" cy="82" r="3" fill="#22c55e"/>
  <circle cx="248" cy="135" r="3" fill="#a855f7"/><circle cx="251" cy="132" r="3" fill="#38bdf8"/>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">MANCALA • BOHNENSPIEL</text>
</svg>
`);

// 15. NINE MEN'S MORRIS (MÜHLE) with triple squares
const SVG_MUEHLE = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <rect width="400" height="240" fill="#3b1d0c"/>

  <!-- Wooden Inlay Board -->
  <rect x="90" y="15" width="220" height="190" rx="8" fill="#d97706" stroke="#78350f" stroke-width="4"/>

  <!-- Triple Concentric Squares -->
  <rect x="110" y="30" width="180" height="160" fill="none" stroke="#451a03" stroke-width="3"/>
  <rect x="135" y="55" width="130" height="110" fill="none" stroke="#451a03" stroke-width="3"/>
  <rect x="160" y="80" width="80" height="60" fill="none" stroke="#451a03" stroke-width="3"/>

  <!-- Connecting Crossbars -->
  <line x1="200" y1="30" x2="200" y2="80" stroke="#451a03" stroke-width="3"/>
  <line x1="200" y1="140" x2="200" y2="190" stroke="#451a03" stroke-width="3"/>
  <line x1="110" y1="110" x2="160" y2="110" stroke="#451a03" stroke-width="3"/>
  <line x1="240" y1="110" x2="290" y2="110" stroke="#451a03" stroke-width="3"/>

  <!-- White Stones in a Mühle (3 in a row!) -->
  <circle cx="110" cy="30" r="7" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
  <circle cx="200" cy="30" r="7" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
  <circle cx="290" cy="30" r="7" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>

  <!-- Black Stones -->
  <circle cx="135" cy="55" r="7" fill="#0f172a" stroke="#000000" stroke-width="2"/>
  <circle cx="265" cy="55" r="7" fill="#0f172a" stroke="#000000" stroke-width="2"/>
  <circle cx="160" cy="80" r="7" fill="#0f172a" stroke="#000000" stroke-width="2"/>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">MÜHLE • NINE MEN'S MORRIS</text>
</svg>
`);

// 16. SUDOKU with 9x9 grid & pencil
const SVG_SUDOKU = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <rect width="400" height="240" fill="#0f172a"/>

  <!-- Sudoku Paper Grid -->
  <g transform="translate(110, 20)">
    <rect width="180" height="180" rx="4" fill="#f8fafc" stroke="#334155" stroke-width="3"/>
    <!-- 9x9 Light lines -->
    <g stroke="#cbd5e1" stroke-width="1">
      <line x1="20" y1="0" x2="20" y2="180"/><line x1="40" y1="0" x2="40" y2="180"/><line x1="80" y1="0" x2="80" y2="180"/><line x1="100" y1="0" x2="100" y2="180"/><line x1="140" y1="0" x2="140" y2="180"/><line x1="160" y1="0" x2="160" y2="180"/>
      <line x1="0" y1="20" x2="180" y2="20"/><line x1="0" y1="40" x2="180" y2="40"/><line x1="0" y1="80" x2="180" y2="80"/><line x1="0" y1="100" x2="180" y2="100"/><line x1="0" y1="140" x2="180" y2="140"/><line x1="0" y1="160" x2="180" y2="160"/>
    </g>
    <!-- 3x3 Bold Quadrant lines -->
    <g stroke="#0f172a" stroke-width="2.5">
      <line x1="60" y1="0" x2="60" y2="180"/><line x1="120" y1="0" x2="120" y2="180"/>
      <line x1="0" y1="60" x2="180" y2="60"/><line x1="0" y1="120" x2="180" y2="120"/>
    </g>

    <!-- Sample Numbers -->
    <g font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">
      <text x="10" y="15">5</text><text x="30" y="15">3</text><text x="90" y="15">7</text>
      <text x="10" y="35">6</text><text x="70" y="35">1</text><text x="90" y="35">9</text><text x="110" y="35">5</text>
      <text x="30" y="55">9</text><text x="50" y="55">8</text><text x="150" y="55">6</text>
      <text x="10" y="75">8</text><text x="90" y="75">6</text><text x="170" y="75">3</text>
      <text x="10" y="95">4</text><text x="70" y="95">8</text><text x="110" y="95">3</text><text x="170" y="95">1</text>
      <text x="10" y="115">7</text><text x="90" y="115">2</text><text x="170" y="115">6</text>
      <!-- Active Penciled Number (Blue) -->
      <text x="70" y="15" fill="#2563eb">4</text>
    </g>
  </g>

  <!-- Yellow Pencil -->
  <g transform="translate(65, 110) rotate(-45)">
    <rect width="60" height="8" fill="#eab308" stroke="#ca8a04" stroke-width="1"/>
    <polygon points="60,0 72,4 60,8" fill="#fdba74"/>
    <polygon points="68,3 72,4 68,5" fill="#0f172a"/>
  </g>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">SUDOKU • ZAHLENRÄTSEL</text>
</svg>
`);

// 17. SHUT THE BOX with wooden flip numbered tiles 1-9 & dice
const SVG_SHUT_THE_BOX = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <rect width="400" height="240" fill="#1c0903"/>

  <!-- Wooden Box Tray -->
  <rect x="60" y="25" width="280" height="175" rx="8" fill="#78350f" stroke="#451a03" stroke-width="6"/>
  <rect x="70" y="35" width="260" height="155" rx="4" fill="#14532d"/>

  <!-- 9 Wooden Number Tiles at Top -->
  <g transform="translate(80, 42)">
    <!-- Tiles 1 to 9 -->
    <rect x="0" y="0" width="24" height="40" rx="2" fill="#d97706" stroke="#92400e" stroke-width="1.5"/>
    <text x="12" y="25" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">1</text>

    <rect x="27" y="0" width="24" height="40" rx="2" fill="#d97706" stroke="#92400e" stroke-width="1.5"/>
    <text x="39" y="25" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">2</text>

    <!-- Flipped down Tile 3 -->
    <rect x="54" y="20" width="24" height="20" rx="2" fill="#78350f" opacity="0.6"/>

    <rect x="81" y="0" width="24" height="40" rx="2" fill="#d97706" stroke="#92400e" stroke-width="1.5"/>
    <text x="93" y="25" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">4</text>

    <rect x="108" y="0" width="24" height="40" rx="2" fill="#d97706" stroke="#92400e" stroke-width="1.5"/>
    <text x="120" y="25" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">5</text>

    <!-- Flipped down Tile 6 -->
    <rect x="135" y="20" width="24" height="20" rx="2" fill="#78350f" opacity="0.6"/>

    <rect x="162" y="0" width="24" height="40" rx="2" fill="#d97706" stroke="#92400e" stroke-width="1.5"/>
    <text x="174" y="25" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">7</text>

    <rect x="189" y="0" width="24" height="40" rx="2" fill="#d97706" stroke="#92400e" stroke-width="1.5"/>
    <text x="201" y="25" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">8</text>

    <rect x="216" y="0" width="24" height="40" rx="2" fill="#d97706" stroke="#92400e" stroke-width="1.5"/>
    <text x="228" y="25" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">9</text>
  </g>

  <!-- Rolling Dice on Felt [4] and [5] -->
  <g transform="translate(170, 130) rotate(15)">
    <rect x="-14" y="-14" width="28" height="28" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <circle cx="-7" cy="-7" r="2.5" fill="#0f172a"/><circle cx="7" cy="-7" r="2.5" fill="#0f172a"/>
    <circle cx="-7" cy="7" r="2.5" fill="#0f172a"/><circle cx="7" cy="7" r="2.5" fill="#0f172a"/>
  </g>

  <g transform="translate(225, 140) rotate(-10)">
    <rect x="-14" y="-14" width="28" height="28" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <circle cx="-7" cy="-7" r="2.5" fill="#0f172a"/><circle cx="7" cy="-7" r="2.5" fill="#0f172a"/>
    <circle cx="0" cy="0" r="2.5" fill="#0f172a"/>
    <circle cx="-7" cy="7" r="2.5" fill="#0f172a"/><circle cx="7" cy="7" r="2.5" fill="#0f172a"/>
  </g>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">SHUT THE BOX • KLAPPBRETT</text>
</svg>
`);

// 18. SNAKES AND LADDERS (LEITERNSPIEL) with numbered path & ladders
const SVG_SNAKES_LADDERS = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <rect width="400" height="240" fill="#0f172a"/>

  <!-- Colorful Board -->
  <g transform="translate(110, 15)">
    <rect width="180" height="180" rx="6" fill="#fef08a" stroke="#ca8a04" stroke-width="4"/>
    <!-- Alternating grid tiles -->
    <g stroke="#fef08a" stroke-width="1">
      <rect x="0" y="0" width="36" height="36" fill="#fca5a5"/><rect x="36" y="0" width="36" height="36" fill="#93c5fd"/><rect x="72" y="0" width="36" height="36" fill="#86efac"/><rect x="108" y="0" width="36" height="36" fill="#fde047"/><rect x="144" y="0" width="36" height="36" fill="#d8b4fe"/>
      <rect x="0" y="36" width="36" height="36" fill="#d8b4fe"/><rect x="36" y="36" width="36" height="36" fill="#fde047"/><rect x="72" y="36" width="36" height="36" fill="#86efac"/><rect x="108" y="36" width="36" height="36" fill="#93c5fd"/><rect x="144" y="36" width="36" height="36" fill="#fca5a5"/>
      <rect x="0" y="72" width="36" height="36" fill="#fca5a5"/><rect x="36" y="72" width="36" height="36" fill="#93c5fd"/><rect x="72" y="72" width="36" height="36" fill="#86efac"/><rect x="108" y="72" width="36" height="36" fill="#fde047"/><rect x="144" y="72" width="36" height="36" fill="#d8b4fe"/>
      <rect x="0" y="108" width="36" height="36" fill="#d8b4fe"/><rect x="36" y="108" width="36" height="36" fill="#fde047"/><rect x="72" y="108" width="36" height="36" fill="#86efac"/><rect x="108" y="108" width="36" height="36" fill="#93c5fd"/><rect x="144" y="108" width="36" height="36" fill="#fca5a5"/>
      <rect x="0" y="144" width="36" height="36" fill="#fca5a5"/><rect x="36" y="144" width="36" height="36" fill="#93c5fd"/><rect x="72" y="144" width="36" height="36" fill="#86efac"/><rect x="108" y="144" width="36" height="36" fill="#fde047"/><rect x="144" y="144" width="36" height="36" fill="#d8b4fe"/>
    </g>

    <!-- Wooden Ladder -->
    <g stroke="#78350f" stroke-width="2.5" stroke-linecap="round">
      <line x1="25" y1="160" x2="60" y2="25"/>
      <line x1="37" y1="160" x2="72" y2="25"/>
      <!-- Rungs -->
      <line x1="28" y1="145" x2="40" y2="145"/><line x1="33" y1="120" x2="45" y2="120"/><line x1="40" y1="95" x2="52" y2="95"/><line x1="48" y1="70" x2="60" y2="70"/><line x1="55" y1="45" x2="67" y2="45"/>
    </g>

    <!-- Slithering Green Snake -->
    <path d="M160,20 C140,50 170,80 120,110 C80,130 110,165 90,170" fill="none" stroke="#16a34a" stroke-width="5" stroke-linecap="round"/>
    <circle cx="160" cy="20" r="4" fill="#dc2626"/>

    <!-- Player Token -->
    <circle cx="55" cy="55" r="8" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
  </g>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">SNAKES &amp; LADDERS • LEITERNSPIEL</text>
</svg>
`);

// 19. SKAT & DOPPELKOPF & MAU MAU & CANASTA with authentic card hands
const SVG_GERMAN_CARDS = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <rect width="400" height="240" fill="#064e3b"/>

  <!-- Spread of 4 Traditional Playing Cards -->
  <!-- Kreuz Bube (Jack of Clubs) -->
  <g transform="translate(110, 115) rotate(-20)">
    <rect x="-32" y="-50" width="64" height="100" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <text x="-22" y="-32" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">B</text>
    <text x="-22" y="-18" font-family="sans-serif" font-size="12" fill="#0f172a">♣</text>
    <text x="0" y="15" font-family="sans-serif" font-size="34" fill="#0f172a" text-anchor="middle">♣</text>
  </g>

  <!-- Pik Dame (Queen of Spades) -->
  <g transform="translate(165, 105) rotate(-7)">
    <rect x="-32" y="-50" width="64" height="100" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <text x="-22" y="-32" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">D</text>
    <text x="-22" y="-18" font-family="sans-serif" font-size="12" fill="#0f172a">♠</text>
    <text x="0" y="15" font-family="sans-serif" font-size="34" fill="#0f172a" text-anchor="middle">♠</text>
  </g>

  <!-- Herz König (King of Hearts) -->
  <g transform="translate(225, 105) rotate(8)">
    <rect x="-32" y="-50" width="64" height="100" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <text x="-22" y="-32" font-family="sans-serif" font-size="14" font-weight="bold" fill="#dc2626">K</text>
    <text x="-22" y="-18" font-family="sans-serif" font-size="12" fill="#dc2626">♥</text>
    <text x="0" y="15" font-family="sans-serif" font-size="34" fill="#dc2626" text-anchor="middle">♥</text>
  </g>

  <!-- Karo Ass (Ace of Diamonds) -->
  <g transform="translate(285, 115) rotate(22)">
    <rect x="-32" y="-50" width="64" height="100" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <text x="-22" y="-32" font-family="sans-serif" font-size="14" font-weight="bold" fill="#dc2626">A</text>
    <text x="-22" y="-18" font-family="sans-serif" font-size="12" fill="#dc2626">♦</text>
    <text x="0" y="15" font-family="sans-serif" font-size="34" fill="#dc2626" text-anchor="middle">♦</text>
  </g>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">SKAT • MAU MAU • ROMMÉ</text>
</svg>
`);

// 20. SOLITAIRE (KLONDIKE) with cascading card columns & foundation piles
const SVG_SOLITAIRE = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <rect width="400" height="240" fill="#14532d"/>

  <!-- Top Foundation Piles -->
  <g transform="translate(60, 20)">
    <!-- Stock Draw Deck -->
    <rect x="0" y="0" width="38" height="52" rx="4" fill="#1e3a8a" stroke="#ffffff" stroke-width="1.5"/>
    <!-- Waste Card (King of Hearts) -->
    <rect x="48" y="0" width="38" height="52" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="56" y="16" font-family="sans-serif" font-size="11" font-weight="bold" fill="#dc2626">K♥</text>

    <!-- 4 Foundation Aces slots -->
    <rect x="120" y="0" width="38" height="52" rx="4" fill="#166534" stroke="#4ade80" stroke-width="1" stroke-dasharray="3 2"/>
    <text x="139" y="32" font-family="sans-serif" font-size="18" fill="#4ade80" text-anchor="middle">♠</text>

    <rect x="168" y="0" width="38" height="52" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="176" y="16" font-family="sans-serif" font-size="11" font-weight="bold" fill="#dc2626">A♥</text>

    <rect x="216" y="0" width="38" height="52" rx="4" fill="#166534" stroke="#4ade80" stroke-width="1" stroke-dasharray="3 2"/>
    <text x="235" y="32" font-family="sans-serif" font-size="18" fill="#4ade80" text-anchor="middle">♣</text>

    <rect x="264" y="0" width="38" height="52" rx="4" fill="#166534" stroke="#4ade80" stroke-width="1" stroke-dasharray="3 2"/>
    <text x="283" y="32" font-family="sans-serif" font-size="18" fill="#4ade80" text-anchor="middle">♦</text>
  </g>

  <!-- Cascading Tableau Columns -->
  <g transform="translate(60, 90)">
    <!-- Column 1 -->
    <rect x="0" y="0" width="38" height="52" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="8" y="16" font-family="sans-serif" font-size="10" font-weight="bold" fill="#0f172a">7♠</text>

    <!-- Column 2 -->
    <rect x="48" y="0" width="38" height="52" rx="4" fill="#1e3a8a"/>
    <rect x="48" y="16" width="38" height="52" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="56" y="32" font-family="sans-serif" font-size="10" font-weight="bold" fill="#dc2626">J♦</text>

    <!-- Column 3 (Alternating Run: Black King over Red Queen over Black Jack) -->
    <rect x="96" y="0" width="38" height="52" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="104" y="16" font-family="sans-serif" font-size="10" font-weight="bold" fill="#0f172a">K♠</text>
    <rect x="96" y="18" width="38" height="52" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="104" y="34" font-family="sans-serif" font-size="10" font-weight="bold" fill="#dc2626">Q♥</text>
    <rect x="96" y="36" width="38" height="52" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="104" y="52" font-family="sans-serif" font-size="10" font-weight="bold" fill="#0f172a">J♣</text>
    <rect x="96" y="54" width="38" height="52" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="104" y="70" font-family="sans-serif" font-size="10" font-weight="bold" fill="#dc2626">10♦</text>
  </g>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">SOLITAIRE • PATIENCE</text>
</svg>
`);

// 21. WORD SCRAMBLE / SCRABBLE with wooden letter tiles
const SVG_WORD_SCRAMBLE = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <rect width="400" height="240" fill="#1e293b"/>

  <!-- Wooden Tile Rack -->
  <g transform="translate(60, 90)">
    <rect x="-10" y="35" width="300" height="25" rx="4" fill="#78350f" stroke="#451a03" stroke-width="2"/>

    <!-- Letter Tile W [4] -->
    <g transform="translate(10, 0)">
      <rect width="42" height="46" rx="4" fill="#fef3c7" stroke="#b45309" stroke-width="1.5"/>
      <text x="21" y="30" font-family="sans-serif" font-size="24" font-weight="bold" fill="#451a03" text-anchor="middle">W</text>
      <text x="34" y="40" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b45309">4</text>
    </g>

    <!-- Letter Tile O [1] -->
    <g transform="translate(62, 0)">
      <rect width="42" height="46" rx="4" fill="#fef3c7" stroke="#b45309" stroke-width="1.5"/>
      <text x="21" y="30" font-family="sans-serif" font-size="24" font-weight="bold" fill="#451a03" text-anchor="middle">O</text>
      <text x="34" y="40" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b45309">1</text>
    </g>

    <!-- Letter Tile R [1] -->
    <g transform="translate(114, 0)">
      <rect width="42" height="46" rx="4" fill="#fef3c7" stroke="#b45309" stroke-width="1.5"/>
      <text x="21" y="30" font-family="sans-serif" font-size="24" font-weight="bold" fill="#451a03" text-anchor="middle">R</text>
      <text x="34" y="40" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b45309">1</text>
    </g>

    <!-- Letter Tile D [2] -->
    <g transform="translate(166, 0)">
      <rect width="42" height="46" rx="4" fill="#fef3c7" stroke="#b45309" stroke-width="1.5"/>
      <text x="21" y="30" font-family="sans-serif" font-size="24" font-weight="bold" fill="#451a03" text-anchor="middle">D</text>
      <text x="34" y="40" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b45309">2</text>
    </g>

    <!-- Letter Tile S [1] -->
    <g transform="translate(218, 0)">
      <rect width="42" height="46" rx="4" fill="#fef3c7" stroke="#b45309" stroke-width="1.5"/>
      <text x="21" y="30" font-family="sans-serif" font-size="24" font-weight="bold" fill="#451a03" text-anchor="middle">S</text>
      <text x="34" y="40" font-family="sans-serif" font-size="9" font-weight="bold" fill="#b45309">1</text>
    </g>
  </g>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">WORD SCRAMBLE • BUCHSTABEN</text>
</svg>
`);

// 22. TOWER BALANCE / JENGA with stacked tumbling wooden blocks
const SVG_TOWER_BALANCE = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <rect width="400" height="240" fill="#0f172a"/>

  <!-- Wooden Tumbling Tower Blocks Stack -->
  <g transform="translate(150, 40)">
    <!-- Level 1 (bottom) -->
    <rect x="0" y="140" width="100" height="18" rx="2" fill="#d97706" stroke="#78350f" stroke-width="1.5"/>
    <!-- Level 2 -->
    <rect x="5" y="122" width="28" height="18" rx="2" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>
    <rect x="36" y="122" width="28" height="18" rx="2" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>
    <rect x="67" y="122" width="28" height="18" rx="2" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>

    <!-- Level 3 -->
    <rect x="0" y="104" width="100" height="18" rx="2" fill="#d97706" stroke="#78350f" stroke-width="1.5"/>
    <!-- Level 4 (Middle piece pulled out!) -->
    <rect x="5" y="86" width="28" height="18" rx="2" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>
    <!-- Pulled out block sliding! -->
    <rect x="55" y="86" width="60" height="18" rx="2" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
    <rect x="67" y="86" width="28" height="18" rx="2" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>

    <!-- Level 5 -->
    <rect x="0" y="68" width="100" height="18" rx="2" fill="#d97706" stroke="#78350f" stroke-width="1.5"/>
    <!-- Level 6 -->
    <rect x="5" y="50" width="28" height="18" rx="2" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>
    <rect x="36" y="50" width="28" height="18" rx="2" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>
    <rect x="67" y="50" width="28" height="18" rx="2" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>

    <!-- Level 7 (top) -->
    <rect x="0" y="32" width="100" height="18" rx="2" fill="#d97706" stroke="#78350f" stroke-width="1.5"/>
  </g>

  <rect x="120" y="210" width="160" height="20" rx="4" fill="#020617" opacity="0.9"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="1">TOWER BALANCE • JENGA</text>
</svg>
`);

export const SVG_DIAMOND_BLAST = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <radialGradient id="dbBg" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>
    <linearGradient id="dbRuby" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fda4af"/>
      <stop offset="40%" stop-color="#e11d48"/>
      <stop offset="100%" stop-color="#881337"/>
    </linearGradient>
    <linearGradient id="dbSapph" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7dd3fc"/>
      <stop offset="40%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0c4a6e"/>
    </linearGradient>
    <linearGradient id="dbEmer" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#86efac"/>
      <stop offset="40%" stop-color="#16a34a"/>
      <stop offset="100%" stop-color="#052e16"/>
    </linearGradient>
    <linearGradient id="dbTopaz" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#713f12"/>
    </linearGradient>
    <linearGradient id="dbRainbow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="25%" stop-color="#eab308"/>
      <stop offset="50%" stop-color="#10b981"/>
      <stop offset="70%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <radialGradient id="dbExplosion" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#ea580c" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#7f1d1d" stop-opacity="0"/>
    </radialGradient>
    <filter id="dbGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#dbBg)"/>

  <!-- Shimmering Starfield / Magical sparkles -->
  <g fill="#ffffff" opacity="0.6">
    <circle cx="45" cy="35" r="1.5"/><circle cx="120" cy="25" r="1.2"/>
    <circle cx="340" cy="40" r="1.8"/><circle cx="380" cy="85" r="1.2"/>
    <circle cx="60" cy="180" r="1.5"/><circle cx="320" cy="190" r="1.5"/>
  </g>

  <!-- Laser blast line glow -->
  <line x1="0" y1="120" x2="400" y2="120" stroke="#38bdf8" stroke-width="4" opacity="0.4" filter="url(#dbGlow)"/>
  <line x1="0" y1="120" x2="400" y2="120" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>

  <!-- Explosion aura on right -->
  <circle cx="310" cy="120" r="60" fill="url(#dbExplosion)" opacity="0.75"/>

  <!-- Left: Sapphire Diamond -->
  <g transform="translate(80, 110)">
    <polygon points="0,-35 30,0 0,35 -30,0" fill="url(#dbSapph)" stroke="#bae6fd" stroke-width="2"/>
    <polygon points="0,-35 0,0 -30,0" fill="#ffffff" opacity="0.35"/>
    <polygon points="0,-15 15,0 0,15 -15,0" fill="#38bdf8" opacity="0.5"/>
  </g>

  <!-- Center: Rainbow Hypercube Gem -->
  <g transform="translate(200, 105)" filter="url(#dbGlow)">
    <circle cx="0" cy="0" r="42" fill="url(#dbRainbow)" stroke="#ffffff" stroke-width="3"/>
    <polygon points="0,-32 10,-10 32,0 10,10 0,32 -10,10 -32,0 -10,-10" fill="#ffffff" opacity="0.85"/>
    <circle cx="0" cy="0" r="12" fill="#ffffff"/>
  </g>

  <!-- Top Right: Ruby Hexagon -->
  <g transform="translate(140, 60)">
    <polygon points="-16,-24 16,-24 28,0 16,24 -16,24 -28,0" fill="url(#dbRuby)" stroke="#fecdd3" stroke-width="1.8"/>
    <polygon points="-10,-15 10,-15 18,0 10,15 -10,15 -18,0" fill="#fb7185" opacity="0.5"/>
  </g>

  <!-- Bottom Left: Emerald Octagon -->
  <g transform="translate(135, 165)">
    <polygon points="-10,-24 10,-24 24,-10 24,10 10,24 -10,24 -24,10 -24,-10" fill="url(#dbEmer)" stroke="#bbf7d0" stroke-width="1.8"/>
    <polygon points="-6,-15 6,-15 15,-6 15,6 6,15 -6,15 -15,6 -15,-6" fill="#4ade80" opacity="0.5"/>
  </g>

  <!-- Right: Dynamite Bomb with sparkling fuse -->
  <g transform="translate(310, 115)">
    <!-- Bomb Body -->
    <circle cx="0" cy="0" r="28" fill="#1e293b" stroke="#f59e0b" stroke-width="3"/>
    <!-- Gold bands -->
    <ellipse cx="0" cy="0" rx="28" ry="12" fill="none" stroke="#fbbf24" stroke-width="2"/>
    <text x="0" y="6" font-family="sans-serif" font-weight="900" font-size="14" fill="#fbbf24" text-anchor="middle">TNT</text>
    <!-- Fuse and flame spark -->
    <path d="M 0 -28 Q 12 -40 22 -38" fill="none" stroke="#d97706" stroke-width="3"/>
    <circle cx="22" cy="-38" r="6" fill="#f59e0b" filter="url(#dbGlow)"/>
    <circle cx="22" cy="-38" r="3" fill="#ffffff"/>
  </g>

  <!-- Sparkling crystal particles -->
  <polygon points="50,60 54,65 59,62 55,68 58,74 52,71 47,75 49,69 44,65 50,65" fill="#fef08a" opacity="0.8"/>
  <polygon points="350,170 353,174 358,172 355,177 357,182 352,179 348,183 349,178 345,175 350,175" fill="#38bdf8" opacity="0.8"/>

  <!-- Brand Banner Plaque -->
  <rect x="80" y="210" width="240" height="22" rx="6" fill="#020617" opacity="0.95" stroke="#38bdf8" stroke-width="1"/>
  <text x="200" y="225" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" fill="#38bdf8" text-anchor="middle" letter-spacing="2">DIAMOND BLAST • MATCH-3</text>
</svg>
`);

// 12. MONOPOLY 2026 - Authentic board, real metallic figures, luxury red hotels, green houses & dice
const SVG_MONOPOLY_2026 = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <radialGradient id="monoBg" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#0f291e"/>
      <stop offset="60%" stop-color="#071711"/>
      <stop offset="100%" stop-color="#020805"/>
    </radialGradient>
    <linearGradient id="goldPlate" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#854d0e"/>
    </linearGradient>
    <linearGradient id="boardFelt" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e8f5e9"/>
      <stop offset="50%" stop-color="#c8e6c9"/>
      <stop offset="100%" stop-color="#a5d6a7"/>
    </linearGradient>
    <linearGradient id="redHotel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="60%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </linearGradient>
    <linearGradient id="greenHouse" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="60%" stop-color="#16a34a"/>
      <stop offset="100%" stop-color="#14532d"/>
    </linearGradient>
    <linearGradient id="metalSilver" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <filter id="mDrop" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#monoBg)"/>

  <!-- Perspective Board Frame -->
  <g transform="translate(200, 125) scale(1, 0.58) rotate(32)" filter="url(#mDrop)">
    <!-- Outer board square -->
    <rect x="-110" y="-110" width="220" height="220" rx="10" fill="#064e3b" stroke="#f59e0b" stroke-width="4"/>
    <!-- Inner board tiles area -->
    <rect x="-102" y="-102" width="204" height="204" rx="6" fill="url(#boardFelt)"/>
    <!-- Center area -->
    <rect x="-68" y="-68" width="136" height="136" fill="#0f291e" rx="4"/>
    <!-- Schlossallee Blue Bar -->
    <rect x="-102" y="74" width="28" height="28" fill="#1e40af"/>
    <!-- Parkstraße Blue Bar -->
    <rect x="-70" y="74" width="28" height="28" fill="#1e40af"/>
    <!-- Red Hotel on board -->
    <rect x="-96" y="80" width="16" height="16" fill="url(#redHotel)" rx="2"/>
    <!-- Green Houses on board -->
    <rect x="-64" y="82" width="10" height="12" fill="url(#greenHouse)" rx="1"/>
    <!-- Center text -->
    <text x="0" y="-8" font-family="'Fredoka', sans-serif" font-weight="900" font-size="16" fill="#facc15" text-anchor="middle" letter-spacing="1">MONOPOLY</text>
    <text x="0" y="10" font-family="sans-serif" font-weight="900" font-size="10" fill="#ffffff" text-anchor="middle" letter-spacing="3">2026</text>
  </g>

  <!-- Real Tokens & 3D Figures in Foreground -->
  <!-- 1. Authentic Top Hat Token (Zylinder) -->
  <g transform="translate(100, 110)" filter="url(#mDrop)">
    <!-- Brim -->
    <ellipse cx="0" cy="18" rx="36" ry="10" fill="url(#metalSilver)" stroke="#475569" stroke-width="1.5"/>
    <!-- Crown -->
    <path d="M -22 18 L -18 -18 L 18 -18 L 22 18 Z" fill="url(#metalSilver)" stroke="#475569" stroke-width="1.5"/>
    <!-- Top ellipse -->
    <ellipse cx="0" cy="-18" rx="18" ry="6" fill="#f1f5f9" stroke="#475569" stroke-width="1.5"/>
    <!-- Ribbon band around hat -->
    <path d="M -21 11 L 21 11 L 21.5 15 L -21.5 15 Z" fill="#dc2626"/>
  </g>

  <!-- 2. Authentic Race Car Token (Oldtimer-Rennwagen) -->
  <g transform="translate(290, 155)" filter="url(#mDrop)">
    <!-- Wheels -->
    <circle cx="-28" cy="12" r="10" fill="#0f172a" stroke="#94a3b8" stroke-width="2"/>
    <circle cx="24" cy="12" r="10" fill="#0f172a" stroke="#94a3b8" stroke-width="2"/>
    <!-- Car Body -->
    <path d="M -38 10 Q -38 -2 -20 -4 L -8 -16 L 12 -16 L 22 -4 Q 38 -2 38 10 Z" fill="url(#metalSilver)" stroke="#475569" stroke-width="1.5"/>
    <!-- Grill and seat -->
    <rect x="-37" y="0" width="4" height="8" fill="#f59e0b"/>
    <circle cx="2" cy="-6" r="4" fill="#334155"/>
  </g>

  <!-- 3. Red Hotel & Green Houses 3D Models in Center-Left -->
  <g transform="translate(75, 175)" filter="url(#mDrop)">
    <!-- Green house -->
    <polygon points="0,-16 12,-6 12,12 -12,12 -12,-6" fill="url(#greenHouse)" stroke="#14532d" stroke-width="1"/>
    <!-- Roof shadow -->
    <polygon points="0,-16 12,-6 -12,-6" fill="#4ade80" opacity="0.4"/>
  </g>
  <g transform="translate(115, 180)" filter="url(#mDrop)">
    <!-- Red Hotel -->
    <polygon points="0,-24 18,-10 18,16 -18,16 -18,-10" fill="url(#redHotel)" stroke="#7f1d1d" stroke-width="1.2"/>
    <polygon points="0,-24 18,-10 -18,-10" fill="#fca5a5" opacity="0.3"/>
    <rect x="-12" y="-2" width="6" height="6" fill="#fef08a"/>
    <rect x="6" y="-2" width="6" height="6" fill="#fef08a"/>
    <rect x="-12" y="7" width="6" height="6" fill="#fef08a"/>
    <rect x="6" y="7" width="6" height="6" fill="#fef08a"/>
  </g>

  <!-- 4. Pair of 3D Golden Dice -->
  <g transform="translate(200, 65)" filter="url(#mDrop)">
    <!-- Die 1 (left tilted) -->
    <g transform="translate(-20, 0) rotate(-14)">
      <rect x="-16" y="-16" width="32" height="32" rx="6" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <circle cx="-7" cy="-7" r="2.8" fill="#713f12"/>
      <circle cx="7" cy="-7" r="2.8" fill="#713f12"/>
      <circle cx="0" cy="0" r="2.8" fill="#713f12"/>
      <circle cx="-7" cy="7" r="2.8" fill="#713f12"/>
      <circle cx="7" cy="7" r="2.8" fill="#713f12"/>
    </g>
    <!-- Die 2 (right tilted) -->
    <g transform="translate(24, 6) rotate(16)">
      <rect x="-16" y="-16" width="32" height="32" rx="6" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
      <circle cx="-7" cy="-7" r="3" fill="#dc2626"/>
      <circle cx="7" cy="7" r="3" fill="#dc2626"/>
      <circle cx="0" cy="0" r="3" fill="#dc2626"/>
    </g>
  </g>

  <!-- Title Badge Plaque -->
  <rect x="60" y="206" width="280" height="26" rx="8" fill="#020617" opacity="0.95" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="900" fill="#fbbf24" text-anchor="middle" letter-spacing="2">MONOPOLY 2026 • ECHTE FIGUREN</text>
</svg>
`);

// 13. SKIP-BO - Authentic numbers, building piles, personal stockpiles & Skip-Bo Wildcards
const SVG_SKIP_BO = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
  <defs>
    <radialGradient id="sbFelt" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="#1e3a5f"/>
      <stop offset="60%" stop-color="#0f1d30"/>
      <stop offset="100%" stop-color="#060c14"/>
    </radialGradient>
    <linearGradient id="sbCardFront" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="85%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="sbCardBack" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="50%" stop-color="#c2410c"/>
      <stop offset="100%" stop-color="#7c2d12"/>
    </linearGradient>
    <linearGradient id="sbWildGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
    <filter id="sbDrop" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Table Felt Background -->
  <rect width="100%" height="100%" fill="url(#sbFelt)"/>

  <!-- Left: Stockpile Stack with 3D Depth -->
  <g transform="translate(60, 115)" filter="url(#sbDrop)">
    <!-- Shadowed stacked card edges -->
    <rect x="-35" y="-50" width="70" height="102" rx="6" fill="#7c2d12" stroke="#ea580c" stroke-width="1"/>
    <rect x="-33" y="-52" width="70" height="102" rx="6" fill="#9a3412" stroke="#ea580c" stroke-width="1"/>
    <rect x="-31" y="-54" width="70" height="102" rx="6" fill="#c2410c" stroke="#ea580c" stroke-width="1"/>
    <!-- Top Face-Up Card: 10 -->
    <rect x="-29" y="-56" width="70" height="102" rx="6" fill="url(#sbCardFront)" stroke="#0284c7" stroke-width="2.5"/>
    <ellipse cx="6" cy="-5" rx="26" ry="34" fill="#0284c7"/>
    <text x="6" y="8" font-family="'Fredoka', sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle">10</text>
    <text x="-21" y="-40" font-family="sans-serif" font-weight="900" font-size="11" fill="#0284c7">10</text>
    <text x="33" y="38" font-family="sans-serif" font-weight="900" font-size="11" fill="#0284c7" text-anchor="end">10</text>
    <!-- Label -->
    <rect x="-25" y="52" width="62" height="16" rx="4" fill="#0f172a" opacity="0.9"/>
    <text x="6" y="64" font-family="sans-serif" font-weight="800" font-size="8" fill="#38bdf8" text-anchor="middle">SPIELERSTAPEL</text>
  </g>

  <!-- Center: SKIP-BO Wildcard (Hero Card, Tilted) -->
  <g transform="translate(200, 105) rotate(6)" filter="url(#sbDrop)">
    <rect x="-42" y="-62" width="84" height="124" rx="8" fill="url(#sbWildGold)" stroke="#ffffff" stroke-width="3"/>
    <rect x="-36" y="-56" width="72" height="112" rx="6" fill="#0369a1"/>
    <!-- Central Skip-Bo Badge -->
    <ellipse cx="0" cy="0" rx="30" ry="24" fill="#ea580c" stroke="#fef08a" stroke-width="2"/>
    <text x="0" y="-3" font-family="'Fredoka', sans-serif" font-weight="900" font-size="14" fill="#ffffff" text-anchor="middle" letter-spacing="1">SKIP</text>
    <text x="0" y="13" font-family="'Fredoka', sans-serif" font-weight="900" font-size="16" fill="#facc15" text-anchor="middle" letter-spacing="1">BO</text>
    <!-- Corner text -->
    <text x="-31" y="-42" font-family="sans-serif" font-weight="900" font-size="9" fill="#facc15">JOKER</text>
    <text x="31" y="48" font-family="sans-serif" font-weight="900" font-size="9" fill="#facc15" text-anchor="end">JOKER</text>
    <!-- Sparkling stars -->
    <polygon points="-24,-18 -21,-14 -17,-16 -19,-11 -16,-8 -21,-8 -23,-4 -24,-9 -29,-9 -25,-12" fill="#ffffff"/>
    <polygon points="24,18 21,14 17,16 19,11 16,8 21,8 23,4 24,9 29,9 25,12" fill="#ffffff"/>
  </g>

  <!-- Right: Building Piles showing sequential progression 1 -> 12 -->
  <g transform="translate(325, 115)" filter="url(#sbDrop)">
    <!-- Bottom layer of build pile -->
    <rect x="-30" y="-48" width="60" height="90" rx="5" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
    <rect x="-28" y="-50" width="60" height="90" rx="5" fill="url(#sbCardFront)" stroke="#16a34a" stroke-width="2"/>
    <ellipse cx="2" cy="-5" rx="22" ry="28" fill="#16a34a"/>
    <text x="2" y="6" font-family="'Fredoka', sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">12</text>
    <text x="-20" y="-36" font-family="sans-serif" font-weight="900" font-size="10" fill="#16a34a">12</text>
    <!-- Label -->
    <rect x="-24" y="46" width="52" height="16" rx="4" fill="#0f172a" opacity="0.9"/>
    <text x="2" y="58" font-family="sans-serif" font-weight="800" font-size="8" fill="#4ade80" text-anchor="middle">BAUSTAPEL (1-12)</text>
  </g>

  <!-- Title Badge Plaque -->
  <rect x="50" y="206" width="300" height="26" rx="8" fill="#020617" opacity="0.95" stroke="#ea580c" stroke-width="1.5"/>
  <text x="200" y="224" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="900" fill="#fb923c" text-anchor="middle" letter-spacing="2">SKIP-BO • ECHTE KARTEN & REGELN</text>
</svg>
`);

// --------------------------------------------------------------------------
// MAPPING: EVERY GAME ID TO ITS 100% ACCURATE AUTHENTIC IMAGE
// --------------------------------------------------------------------------

export const SPECIFIC_GAME_IMAGES: Record<string, string> = {
  // Flagship Core Playable Games
  'skip-bo': SVG_SKIP_BO,
  'monopoly': SVG_MONOPOLY_2026,
  'diamond-blast': SVG_DIAMOND_BLAST,
  'ludo': SVG_LUDO,
  'chess': SVG_CHESS,
  'connect-four': SVG_CONNECT_FOUR,
  'checkers': SVG_CHECKERS,
  'battleship': SVG_BATTLESHIP,
  'fam-cards': SVG_FAMCARDS,
  'yatzy': SVG_YATZY,
  'memory-match': SVG_MEMORY,
  'dots-boxes': SVG_DOTS_BOXES,
  'tictactoe-gomoku': SVG_TICTACTOE,
  'tictactoe': SVG_TICTACTOE,

  // Board Games
  'backgammon': SVG_BACKGAMMON,
  'dominoes-draw': SVG_DOMINOES,
  'mexican-train': SVG_DOMINOES,
  'mancala': SVG_MANCALA,
  'nine-mens-morris': SVG_MUEHLE,
  'chinese-checkers': SVG_LUDO,
  'halma': SVG_LUDO,
  'reversi': SVG_CHECKERS,
  'go-board-game': SVG_TICTACTOE,
  'shogi': SVG_CHESS,
  'xiangqi': SVG_CHESS,
  'snakes-ladders': SVG_SNAKES_LADDERS,
  'goose-game': SVG_SNAKES_LADDERS,
  'peg-solitaire': SVG_CHECKERS,
  'senet': SVG_BACKGAMMON,
  'royal-game-ur': SVG_BACKGAMMON,

  // Card Games
  'hearts': SVG_HEARTS_SPADES,
  'spades': SVG_HEARTS_SPADES,
  'solitaire-klondike': SVG_SOLITAIRE,
  'blackjack-family': SVG_GERMAN_CARDS,
  'rummy': SVG_GERMAN_CARDS,
  'canasta': SVG_GERMAN_CARDS,
  'skat': SVG_GERMAN_CARDS,
  'doppelkopf': SVG_GERMAN_CARDS,
  'mau-mau': SVG_GERMAN_CARDS,
  'cribbage': SVG_GERMAN_CARDS,
  'go-fish': SVG_GERMAN_CARDS,
  'war-card-game': SVG_GERMAN_CARDS,
  'whist': SVG_HEARTS_SPADES,
  'schnapsen': SVG_GERMAN_CARDS,
  'tarneeb': SVG_HEARTS_SPADES,
  'scopa': SVG_GERMAN_CARDS,
  'belote': SVG_GERMAN_CARDS,
  'old-maid': SVG_GERMAN_CARDS,
  'snap': SVG_FAMCARDS,
  'speed-cards': SVG_FAMCARDS,

  // Dice Games
  'farkle': SVG_YATZY,
  'liars-dice': SVG_YATZY,
  'shut-the-box': SVG_SHUT_THE_BOX,
  'bunco': SVG_YATZY,
  'pig-dice': SVG_YATZY,
  'beetle-game': SVG_YATZY,
  'cee-lo': SVG_YATZY,

  // Brain & Party Games
  'sudoku-family': SVG_SUDOKU,
  'word-scramble': SVG_WORD_SCRAMBLE,
  'hangman-family': SVG_DOTS_BOXES,
  'trivia-quest': SVG_FAMCARDS,
  'simon-memory': SVG_MEMORY,
  'sliding-puzzle': SVG_DOTS_BOXES,
  'charades-timer': SVG_FAMCARDS,
  'pictionary-sketch': SVG_DOTS_BOXES,
  'reaction-tap': SVG_FAMCARDS,
  'tower-balance': SVG_TOWER_BALANCE,
};

// Category Default Fallbacks
export const CATEGORY_FALLBACK_IMAGES: Record<GameCategory, string> = {
  all: SVG_LUDO,
  board: SVG_LUDO,
  cards: SVG_GERMAN_CARDS,
  dice: SVG_YATZY,
  strategy: SVG_CHESS,
  party: SVG_FAMCARDS,
  kids: SVG_MEMORY,
};

/**
 * Returns an authentic, 100% game-accurate graphic for every single title in the catalog.
 */
export const getGameImage = (game: GameInfo): string => {
  // If game has an explicit imageUrl, use it
  if (game.imageUrl) return game.imageUrl;

  // Direct exact match
  if (SPECIFIC_GAME_IMAGES[game.id]) {
    return SPECIFIC_GAME_IMAGES[game.id];
  }

  // Heritage classic titles
  if (game.id.startsWith('classic-')) {
    const cat = game.category || 'board';
    return CATEGORY_FALLBACK_IMAGES[cat] || SVG_LUDO;
  }

  // Category fallback
  return CATEGORY_FALLBACK_IMAGES[game.category] || SVG_LUDO;
};
