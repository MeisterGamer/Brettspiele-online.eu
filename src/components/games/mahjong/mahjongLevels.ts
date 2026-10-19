// 25 Distinct Handcrafted Levels for Mahjong (Mojang) Classic 2026
// Each level features a unique 3D layout formation, tile count, target time, and theme.

import { MahjongTileDefinition, PlacedMahjongTile, createOfficial144Tiles, generateTurtleSlots, generateFortressSlots } from './mahjongData';

export interface MahjongLevelConfig {
  levelNumber: number;
  name: string;
  subtitle: string;
  description: string;
  tileCount: number;
  targetTime: number; // in seconds for 3-star time goal
  targetScore: number;
  difficulty: 'Leicht' | 'Mittel' | 'Schwer' | 'Experte';
  theme: 'ivory' | 'emerald' | 'wood';
  slotsGenerator: () => { x: number; y: number; layer: number }[];
}

// -------------------------------------------------------------
// 25 GEOMETRIC LAYOUT GENERATORS (Always produces even count)
// -------------------------------------------------------------

// Helper to ensure even count
const ensureEvenCount = (slots: { x: number; y: number; layer: number }[], target: number) => {
  let res = slots;
  if (res.length > target) {
    res = res.slice(0, target);
  }
  if (res.length % 2 !== 0) {
    res = res.slice(0, res.length - 1);
  }
  return res;
};

// Level 1: Der Torbogen (The Archway) - 36 tiles (18 pairs)
const genLevel1 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Two pillars (left col 6, right col 18)
  for (let y = 4; y <= 14; y += 2) {
    s.push({ x: 6, y, layer: 0 });
    s.push({ x: 8, y, layer: 0 });
    s.push({ x: 16, y, layer: 0 });
    s.push({ x: 18, y, layer: 0 });
  }
  // Arch top
  for (let x = 8; x <= 16; x += 2) {
    s.push({ x, y: 2, layer: 0 });
    s.push({ x, y: 4, layer: 1 });
  }
  s.push({ x: 12, y: 2, layer: 1 });
  s.push({ x: 12, y: 4, layer: 2 });
  return ensureEvenCount(s, 36);
};

// Level 2: Der kleine Turm (The Little Tower) - 44 tiles
const genLevel2 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Base 6x4 = 24
  for (let y = 6; y <= 12; y += 2) {
    for (let x = 8; x <= 18; x += 2) {
      s.push({ x, y, layer: 0 });
    }
  }
  // Layer 1 (4x3 = 12)
  for (let y = 8; y <= 12; y += 2) {
    for (let x = 10; x <= 16; x += 2) {
      s.push({ x, y, layer: 1 });
    }
  }
  // Layer 2 (2x3 = 6)
  for (let y = 8; y <= 12; y += 2) {
    s.push({ x: 12, y, layer: 2 });
    s.push({ x: 14, y, layer: 2 });
  }
  // Peak (2)
  s.push({ x: 13, y: 10, layer: 3 });
  s.push({ x: 13, y: 8, layer: 3 });
  return ensureEvenCount(s, 44);
};

// Level 3: Das Zwillings-Tor (Twin Gates) - 52 tiles
const genLevel3 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Left Gate (24)
  for (let y = 4; y <= 14; y += 2) {
    s.push({ x: 4, y, layer: 0 });
    s.push({ x: 6, y, layer: 0 });
    s.push({ x: 5, y, layer: 1 });
  }
  // Right Gate (24)
  for (let y = 4; y <= 14; y += 2) {
    s.push({ x: 18, y, layer: 0 });
    s.push({ x: 20, y, layer: 0 });
    s.push({ x: 19, y, layer: 1 });
  }
  // Bridge connecting them (16)
  for (let x = 8; x <= 16; x += 2) {
    s.push({ x, y: 8, layer: 0 });
    s.push({ x, y: 10, layer: 0 });
  }
  return ensureEvenCount(s, 52);
};

// Level 4: Die Vier Säulen (Four Pillars) - 60 tiles
const genLevel4 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  const corners = [
    [4, 4],
    [18, 4],
    [4, 12],
    [18, 12],
  ];
  corners.forEach(([cx, cy]) => {
    // 2x2 base + 1 layer 1
    s.push({ x: cx, y: cy, layer: 0 });
    s.push({ x: cx + 2, y: cy, layer: 0 });
    s.push({ x: cx, y: cy + 2, layer: 0 });
    s.push({ x: cx + 2, y: cy + 2, layer: 0 });
    s.push({ x: cx + 1, y: cy + 1, layer: 1 });
  });
  // Center cross courtyard (40)
  for (let y = 6; y <= 12; y += 2) {
    for (let x = 8; x <= 14; x += 2) {
      s.push({ x, y, layer: 0 });
    }
  }
  for (let x = 10; x <= 12; x += 2) {
    s.push({ x, y: 8, layer: 1 });
    s.push({ x, y: 10, layer: 1 });
    s.push({ x, y: 8, layer: 2 });
    s.push({ x, y: 10, layer: 2 });
  }
  return ensureEvenCount(s, 60);
};

// Level 5: Der Schrein (The Shrine) - 68 tiles
const genLevel5 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Torii Base
  for (let y = 6; y <= 16; y += 2) {
    s.push({ x: 6, y, layer: 0 });
    s.push({ x: 8, y, layer: 0 });
    s.push({ x: 18, y, layer: 0 });
    s.push({ x: 20, y, layer: 0 });
  }
  // Torii Top crossbeams
  for (let x = 2; x <= 24; x += 2) {
    s.push({ x, y: 2, layer: 0 });
    s.push({ x, y: 4, layer: 0 });
  }
  // Altar in center
  for (let y = 10; y <= 14; y += 2) {
    for (let x = 11; x <= 15; x += 2) {
      s.push({ x, y, layer: 0 });
      s.push({ x, y, layer: 1 });
    }
  }
  s.push({ x: 13, y: 12, layer: 2 });
  s.push({ x: 13, y: 10, layer: 2 });
  return ensureEvenCount(s, 68);
};

// Level 6: Der Schmetterling (The Butterfly) - 76 tiles
const genLevel6 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Body (vertical line)
  for (let y = 4; y <= 14; y += 2) {
    s.push({ x: 12, y, layer: 0 });
    s.push({ x: 12, y, layer: 1 });
  }
  // Left wings
  for (let y = 2; y <= 16; y += 2) {
    const span = y <= 8 ? y / 2 + 1 : (18 - y) / 2 + 1;
    for (let i = 0; i < span; i++) {
      s.push({ x: 10 - i * 2, y, layer: 0 });
      if (i > 0) s.push({ x: 10 - i * 2, y, layer: 1 });
    }
  }
  // Right wings
  for (let y = 2; y <= 16; y += 2) {
    const span = y <= 8 ? y / 2 + 1 : (18 - y) / 2 + 1;
    for (let i = 0; i < span; i++) {
      s.push({ x: 14 + i * 2, y, layer: 0 });
      if (i > 0) s.push({ x: 14 + i * 2, y, layer: 1 });
    }
  }
  return ensureEvenCount(s, 76);
};

// Level 7: Die Himmels-Treppe (Stairway to Heaven) - 84 tiles
const genLevel7 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Cascading steps from left to right with ascending layers
  for (let step = 0; step < 7; step++) {
    const colX = 4 + step * 2;
    const maxLayer = Math.min(3, Math.floor(step / 2));
    for (let y = 4; y <= 14; y += 2) {
      s.push({ x: colX, y, layer: 0 });
      if (maxLayer >= 1) s.push({ x: colX, y, layer: 1 });
      if (maxLayer >= 2 && y >= 6 && y <= 12) s.push({ x: colX, y, layer: 2 });
    }
  }
  return ensureEvenCount(s, 84);
};

// Level 8: Der Diamant (The Diamond) - 92 tiles
const genLevel8 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Concentric diamond rings
  for (let r = 0; r <= 6; r++) {
    const count = r <= 3 ? (r + 1) * 2 : (7 - r) * 2;
    const y = 3 + r * 2;
    const startX = 13 - count;
    for (let c = 0; c < count; c++) {
      s.push({ x: startX + c * 2, y, layer: 0 });
      if (r >= 2 && r <= 4 && c >= 1 && c < count - 1) {
        s.push({ x: startX + c * 2, y, layer: 1 });
      }
    }
  }
  // Center gem top
  s.push({ x: 13, y: 9, layer: 2 });
  s.push({ x: 13, y: 7, layer: 2 });
  return ensureEvenCount(s, 92);
};

// Level 9: Das Yin & Yang (Yin and Yang) - 100 tiles
const genLevel9 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Circular disk with dual curving tiers
  for (let y = 2; y <= 16; y += 2) {
    for (let x = 4; x <= 22; x += 2) {
      const dx = (x - 13) / 1.1;
      const dy = y - 9;
      if (dx * dx + dy * dy <= 45) {
        s.push({ x, y, layer: 0 });
        // Yin swirl
        if (dx < 0 && dy <= 0) s.push({ x, y, layer: 1 });
        // Yang swirl
        if (dx > 0 && dy >= 0) s.push({ x, y, layer: 1 });
      }
    }
  }
  s.push({ x: 9, y: 6, layer: 2 });
  s.push({ x: 17, y: 12, layer: 2 });
  return ensureEvenCount(s, 100);
};

// Level 10: Die Lotus-Blüte (Lotus Blossom) - 108 tiles
const genLevel10 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // 8 Petals radiating from center
  for (let r = 0; r < 8; r++) {
    const angle = (r * Math.PI) / 4;
    for (let d = 1; d <= 4; d++) {
      const px = Math.round(13 + Math.cos(angle) * d * 2.2);
      const py = Math.round(9 + Math.sin(angle) * d * 1.8);
      s.push({ x: px, y: py, layer: 0 });
      if (d <= 2) s.push({ x: px, y: py, layer: 1 });
    }
  }
  // Core flower center (3x3)
  for (let y = 7; y <= 11; y += 2) {
    for (let x = 11; x <= 15; x += 2) {
      s.push({ x, y, layer: 0 });
      s.push({ x, y, layer: 1 });
      s.push({ x, y, layer: 2 });
    }
  }
  s.push({ x: 13, y: 9, layer: 3 });
  return ensureEvenCount(s, 108);
};

// Level 11: Die Windmühle (The Windmill) - 112 tiles
const genLevel11 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // 4 Pinwheel blades
  // North blade
  for (let y = 1; y <= 7; y += 2) {
    for (let x = 13; x <= 17; x += 2) s.push({ x, y, layer: 0 });
  }
  // South blade
  for (let y = 11; y <= 17; y += 2) {
    for (let x = 9; x <= 13; x += 2) s.push({ x, y, layer: 0 });
  }
  // East blade
  for (let x = 15; x <= 23; x += 2) {
    for (let y = 9; y <= 13; y += 2) s.push({ x, y, layer: 0 });
  }
  // West blade
  for (let x = 3; x <= 11; x += 2) {
    for (let y = 5; y <= 9; y += 2) s.push({ x, y, layer: 0 });
  }
  // Rotor center hub
  for (let y = 7; y <= 11; y += 2) {
    for (let x = 11; x <= 15; x += 2) {
      s.push({ x, y, layer: 1 });
      s.push({ x, y, layer: 2 });
    }
  }
  return ensureEvenCount(s, 112);
};

// Level 12: Die Sanduhr (The Hourglass) - 116 tiles
const genLevel12 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  for (let y = 2; y <= 16; y += 2) {
    const distFromCenter = Math.abs(y - 9);
    const span = Math.max(2, Math.round(distFromCenter * 1.3));
    for (let i = -span; i <= span; i++) {
      s.push({ x: 13 + i * 2, y, layer: 0 });
      if (Math.abs(i) <= Math.max(1, span - 1)) {
        s.push({ x: 13 + i * 2, y, layer: 1 });
      }
    }
  }
  s.push({ x: 13, y: 9, layer: 2 });
  s.push({ x: 13, y: 7, layer: 2 });
  s.push({ x: 13, y: 11, layer: 2 });
  return ensureEvenCount(s, 116);
};

// Level 13: Die Pagode (The Pagoda) - 120 tiles
const genLevel13 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Tier 1 (Wide base)
  for (let x = 4; x <= 22; x += 2) {
    s.push({ x, y: 15, layer: 0 });
    s.push({ x, y: 13, layer: 0 });
  }
  // Tier 2
  for (let x = 6; x <= 20; x += 2) {
    s.push({ x, y: 11, layer: 0 });
    s.push({ x, y: 9, layer: 0 });
    s.push({ x, y: 11, layer: 1 });
  }
  // Tier 3
  for (let x = 8; x <= 18; x += 2) {
    s.push({ x, y: 7, layer: 0 });
    s.push({ x, y: 5, layer: 0 });
    s.push({ x, y: 7, layer: 1 });
    s.push({ x, y: 7, layer: 2 });
  }
  // Spire top
  for (let x = 11; x <= 15; x += 2) {
    s.push({ x, y: 3, layer: 0 });
    s.push({ x, y: 3, layer: 1 });
    s.push({ x, y: 3, layer: 2 });
    s.push({ x, y: 3, layer: 3 });
  }
  return ensureEvenCount(s, 120);
};

// Level 14: Die Bergkette (Mountain Range) - 124 tiles
const genLevel14 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // 3 Mountain Peaks: Left (x=7), Center (x=13), Right (x=19)
  for (let y = 4; y <= 16; y += 2) {
    for (let x = 3; x <= 23; x += 2) {
      s.push({ x, y, layer: 0 });
      // Left peak
      if (Math.abs(x - 7) <= 2 && y <= 8) s.push({ x, y, layer: 1 });
      // Center highest peak
      if (Math.abs(x - 13) <= 2 && y <= 6) {
        s.push({ x, y, layer: 1 });
        s.push({ x, y, layer: 2 });
      }
      // Right peak
      if (Math.abs(x - 19) <= 2 && y <= 8) s.push({ x, y, layer: 1 });
    }
  }
  s.push({ x: 13, y: 4, layer: 3 });
  return ensureEvenCount(s, 124);
};

// Level 15: Das Kaiser-Kreuz (Imperial Cross) - 128 tiles
const genLevel15 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Horizontal bar
  for (let x = 2; x <= 24; x += 2) {
    for (let y = 7; y <= 11; y += 2) {
      s.push({ x, y, layer: 0 });
      if (x >= 8 && x <= 18) s.push({ x, y, layer: 1 });
    }
  }
  // Vertical bar
  for (let y = 1; y <= 17; y += 2) {
    for (let x = 11; x <= 15; x += 2) {
      s.push({ x, y, layer: 0 });
      if (y >= 5 && y <= 13) s.push({ x, y, layer: 1 });
    }
  }
  // Central altar
  for (let y = 7; y <= 11; y += 2) {
    for (let x = 11; x <= 15; x += 2) {
      s.push({ x, y, layer: 2 });
    }
  }
  s.push({ x: 13, y: 9, layer: 3 });
  return ensureEvenCount(s, 128);
};

// Level 16: Die Hängebrücke (Suspension Bridge) - 132 tiles
const genLevel16 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Left high tower (x=6)
  for (let y = 2; y <= 16; y += 2) {
    s.push({ x: 6, y, layer: 0 });
    s.push({ x: 8, y, layer: 0 });
    s.push({ x: 7, y, layer: 1 });
    s.push({ x: 7, y, layer: 2 });
  }
  // Right high tower (x=18)
  for (let y = 2; y <= 16; y += 2) {
    s.push({ x: 18, y, layer: 0 });
    s.push({ x: 20, y, layer: 0 });
    s.push({ x: 19, y, layer: 1 });
    s.push({ x: 19, y, layer: 2 });
  }
  // Suspended bridge deck between them
  for (let x = 2; x <= 24; x += 2) {
    s.push({ x, y: 10, layer: 0 });
    s.push({ x, y: 12, layer: 0 });
    if (x >= 8 && x <= 18) s.push({ x, y: 10, layer: 1 });
  }
  return ensureEvenCount(s, 132);
};

// Level 17: Der Skorpion (The Scorpion) - 136 tiles
const genLevel17 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Pincers (Left and Right)
  for (let y = 2; y <= 6; y += 2) {
    s.push({ x: 4, y, layer: 0 });
    s.push({ x: 6, y, layer: 0 });
    s.push({ x: 20, y, layer: 0 });
    s.push({ x: 22, y, layer: 0 });
  }
  // Carapace body
  for (let y = 6; y <= 12; y += 2) {
    for (let x = 8; x <= 18; x += 2) {
      s.push({ x, y, layer: 0 });
      if (x >= 10 && x <= 16) s.push({ x, y, layer: 1 });
    }
  }
  // Tail curved back
  for (let y = 14; y <= 18; y += 2) {
    s.push({ x: 13, y, layer: 0 });
    s.push({ x: 13, y, layer: 1 });
  }
  s.push({ x: 15, y: 16, layer: 2 });
  s.push({ x: 15, y: 14, layer: 3 });
  return ensureEvenCount(s, 136);
};

// Level 18: Die Galeere (Imperial Junk Ship) - 140 tiles
const genLevel18 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Ship hull
  for (let x = 2; x <= 24; x += 2) {
    s.push({ x, y: 14, layer: 0 });
    s.push({ x, y: 16, layer: 0 });
  }
  // Stern and bow lifts
  for (let y = 8; y <= 12; y += 2) {
    s.push({ x: 2, y, layer: 0 });
    s.push({ x: 4, y, layer: 0 });
    s.push({ x: 22, y, layer: 0 });
    s.push({ x: 24, y, layer: 0 });
  }
  // Main Masts (3 masts)
  [8, 13, 18].forEach((mx) => {
    for (let y = 4; y <= 12; y += 2) {
      s.push({ x: mx, y, layer: 0 });
      s.push({ x: mx, y, layer: 1 });
      if (y <= 8) s.push({ x: mx, y, layer: 2 });
    }
  });
  return ensureEvenCount(s, 140);
};

// Level 19: Die Pyramide von Gizeh (Stepped Pyramid) - 144 tiles
const genLevel19 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Layer 0: 10x8 = 80
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 10; c++) s.push({ x: 4 + c * 2, y: 2 + r * 2, layer: 0 });
  }
  // Layer 1: 8x6 = 48
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) s.push({ x: 6 + c * 2, y: 4 + r * 2, layer: 1 });
  }
  // Layer 2: 4x3 = 12
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) s.push({ x: 10 + c * 2, y: 7 + r * 2, layer: 2 });
  }
  // Layer 3: 2x2 = 4
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) s.push({ x: 12 + c * 2, y: 8 + r * 2, layer: 3 });
  }
  return ensureEvenCount(s, 144);
};

// Level 20: Die Festung (The Fortress) - 144 tiles
const genLevel20 = () => generateFortressSlots();

// Level 21: Der Tempel des Drachen (Dragon Temple) - 144 tiles
const genLevel21 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Wide imperial base
  for (let y = 4; y <= 16; y += 2) {
    for (let x = 2; x <= 24; x += 2) {
      if ((x >= 6 && x <= 20) || y === 4 || y === 16) {
        s.push({ x, y, layer: 0 });
      }
    }
  }
  // Dragon coils
  for (let y = 6; y <= 14; y += 2) {
    for (let x = 8; x <= 18; x += 2) {
      s.push({ x, y, layer: 1 });
      if (x >= 10 && x <= 16 && y >= 8 && y <= 12) {
        s.push({ x, y, layer: 2 });
      }
    }
  }
  s.push({ x: 13, y: 10, layer: 3 });
  s.push({ x: 13, y: 8, layer: 3 });
  s.push({ x: 13, y: 9, layer: 4 });
  return ensureEvenCount(s, 144);
};

// Level 22: Der Phönix (The Phoenix) - 144 tiles
const genLevel22 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Spreading wings left and right + tail feathers
  for (let y = 2; y <= 16; y += 2) {
    for (let x = 2; x <= 24; x += 2) {
      const inWing = Math.abs(x - 13) >= 3;
      const inBody = Math.abs(x - 13) <= 2;
      if (inWing || inBody) {
        s.push({ x, y, layer: 0 });
        if (inBody) s.push({ x, y, layer: 1 });
      }
    }
  }
  // Crown crest
  s.push({ x: 13, y: 4, layer: 2 });
  s.push({ x: 13, y: 6, layer: 2 });
  s.push({ x: 13, y: 5, layer: 3 });
  return ensureEvenCount(s, 144);
};

// Level 23: Das Labyrinth (The Labyrinth) - 144 tiles
const genLevel23 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // Concentric spiral corridors
  for (let ring = 0; ring < 4; ring++) {
    const left = 2 + ring * 3;
    const right = 24 - ring * 3;
    const top = 2 + ring * 2;
    const bottom = 16 - ring * 2;
    for (let x = left; x <= right; x += 2) {
      s.push({ x, y: top, layer: ring });
      s.push({ x, y: bottom, layer: ring });
    }
    for (let y = top + 2; y < bottom; y += 2) {
      s.push({ x: left, y, layer: ring });
      s.push({ x: right, y, layer: ring });
    }
  }
  return ensureEvenCount(s, 144);
};

// Level 24: Die Große Schildkröte (The Grand Turtle) - 144 tiles
const genLevel24 = () => generateTurtleSlots();

// Level 25: Der Meister-Palast (Grand Imperial Palace) - 144 tiles
const genLevel25 = () => {
  const s: { x: number; y: number; layer: number }[] = [];
  // 5 Majestic Stacking Tiers with 8 Corner Spires
  for (let y = 2; y <= 16; y += 2) {
    for (let x = 2; x <= 24; x += 2) {
      s.push({ x, y, layer: 0 });
      if (x >= 6 && x <= 20 && y >= 4 && y <= 14) s.push({ x, y, layer: 1 });
      if (x >= 8 && x <= 18 && y >= 6 && y <= 12) s.push({ x, y, layer: 2 });
      if (x >= 10 && x <= 16 && y >= 8 && y <= 10) s.push({ x, y, layer: 3 });
    }
  }
  s.push({ x: 13, y: 9, layer: 4 });
  return ensureEvenCount(s, 144);
};

// -------------------------------------------------------------
// ALL 25 LEVEL CONFIGURATIONS
// -------------------------------------------------------------

export const MAHJONG_LEVELS: MahjongLevelConfig[] = [
  {
    levelNumber: 1,
    name: 'Der Torbogen',
    subtitle: 'Einstieg in das Reich von Mahjong',
    description: '36 Spielsteine. Lerne das Finden freier Paare mit den offenen Säulen.',
    tileCount: 36,
    targetTime: 120,
    targetScore: 1800,
    difficulty: 'Leicht',
    theme: 'ivory',
    slotsGenerator: genLevel1,
  },
  {
    levelNumber: 2,
    name: 'Der kleine Turm',
    subtitle: 'Erste Höhenstufen erklimmen',
    description: '44 Spielsteine auf 3 Ebenen. Räume die oberen Stufen vorsichtig ab.',
    tileCount: 44,
    targetTime: 150,
    targetScore: 2400,
    difficulty: 'Leicht',
    theme: 'ivory',
    slotsGenerator: genLevel2,
  },
  {
    levelNumber: 3,
    name: 'Das Zwillings-Tor',
    subtitle: 'Symmetrische Harmonie',
    description: '52 Spielsteine. Zwei balancierte Tore mit einer verbindenden Brücke.',
    tileCount: 52,
    targetTime: 180,
    targetScore: 3000,
    difficulty: 'Leicht',
    theme: 'emerald',
    slotsGenerator: genLevel3,
  },
  {
    levelNumber: 4,
    name: 'Die Vier Säulen',
    subtitle: 'Wächter des Tempels',
    description: '60 Spielsteine. Befreie die Ecksäulen, um den Innenhof freizulegen.',
    tileCount: 60,
    targetTime: 200,
    targetScore: 3600,
    difficulty: 'Leicht',
    theme: 'wood',
    slotsGenerator: genLevel4,
  },
  {
    levelNumber: 5,
    name: 'Der Schrein',
    subtitle: 'Das Torii des Frühlings',
    description: '68 Spielsteine. Entdecke die besonderen Blumen- und Jahreszeiten-Paare.',
    tileCount: 68,
    targetTime: 220,
    targetScore: 4200,
    difficulty: 'Leicht',
    theme: 'ivory',
    slotsGenerator: genLevel5,
  },
  {
    levelNumber: 6,
    name: 'Der Schmetterling',
    subtitle: 'Flügel aus Elfenbein',
    description: '76 Spielsteine. Breite Schwingen erfordern vorausschauende Randzüge.',
    tileCount: 76,
    targetTime: 240,
    targetScore: 4800,
    difficulty: 'Mittel',
    theme: 'emerald',
    slotsGenerator: genLevel6,
  },
  {
    levelNumber: 7,
    name: 'Die Himmels-Treppe',
    subtitle: 'Stufe für Stufe empor',
    description: '84 Spielsteine. Kaskadenförmig ansteigende Stufen von West nach Ost.',
    tileCount: 84,
    targetTime: 260,
    targetScore: 5400,
    difficulty: 'Mittel',
    theme: 'ivory',
    slotsGenerator: genLevel7,
  },
  {
    levelNumber: 8,
    name: 'Der Diamant',
    subtitle: 'Kristalline Präzision',
    description: '92 Spielsteine. Rautenformation mit geschichteter Edelstein-Spitze.',
    tileCount: 92,
    targetTime: 280,
    targetScore: 6000,
    difficulty: 'Mittel',
    theme: 'wood',
    slotsGenerator: genLevel8,
  },
  {
    levelNumber: 9,
    name: 'Das Yin & Yang',
    subtitle: 'Licht und Schatten im Einklang',
    description: '100 Spielsteine. Entwirre die geschwungenen Spiralen des Kosmos.',
    tileCount: 100,
    targetTime: 300,
    targetScore: 6800,
    difficulty: 'Mittel',
    theme: 'ivory',
    slotsGenerator: genLevel9,
  },
  {
    levelNumber: 10,
    name: 'Die Lotus-Blüte',
    subtitle: 'Blütenblätter der Weisheit',
    description: '108 Spielsteine. 8 strahlenförmige Blütenkelche schützen den Kern.',
    tileCount: 108,
    targetTime: 320,
    targetScore: 7500,
    difficulty: 'Mittel',
    theme: 'emerald',
    slotsGenerator: genLevel10,
  },
  {
    levelNumber: 11,
    name: 'Die Windmühle',
    subtitle: 'Der Atem der vier Winde',
    description: '112 Spielsteine. 4 rotierende Flügel verlangen ausgewogenes Abräumen.',
    tileCount: 112,
    targetTime: 340,
    targetScore: 8000,
    difficulty: 'Mittel',
    theme: 'wood',
    slotsGenerator: genLevel11,
  },
  {
    levelNumber: 12,
    name: 'Die Sanduhr',
    subtitle: 'Der Fluss der Zeit',
    description: '116 Spielsteine. Schlanke Taille verbindet zwei gewaltige Kammern.',
    tileCount: 116,
    targetTime: 360,
    targetScore: 8500,
    difficulty: 'Mittel',
    theme: 'ivory',
    slotsGenerator: genLevel12,
  },
  {
    levelNumber: 13,
    name: 'Die Pagode',
    subtitle: 'Vier Dächer zum Himmel',
    description: '120 Spielsteine. Schicht um Schicht der orientalischen Architektur abtragen.',
    tileCount: 120,
    targetTime: 380,
    targetScore: 9000,
    difficulty: 'Schwer',
    theme: 'emerald',
    slotsGenerator: genLevel13,
  },
  {
    levelNumber: 14,
    name: 'Die Bergkette',
    subtitle: 'Drei majestätische Gipfel',
    description: '124 Spielsteine. Drei Bergspitzen versperren den Blick auf das Tal.',
    tileCount: 124,
    targetTime: 400,
    targetScore: 9600,
    difficulty: 'Schwer',
    theme: 'wood',
    slotsGenerator: genLevel14,
  },
  {
    levelNumber: 15,
    name: 'Das Kaiser-Kreuz',
    subtitle: 'Symbol imperialer Macht',
    description: '128 Spielsteine. Vier gewaltige Arme kreuzen sich am goldenen Altar.',
    tileCount: 128,
    targetTime: 420,
    targetScore: 10200,
    difficulty: 'Schwer',
    theme: 'ivory',
    slotsGenerator: genLevel15,
  },
  {
    levelNumber: 16,
    name: 'Die Hängebrücke',
    subtitle: 'Über den tiefen Abgrund',
    description: '132 Spielsteine. Hohe Pylone und lange Verbindungsstränge.',
    tileCount: 132,
    targetTime: 440,
    targetScore: 10800,
    difficulty: 'Schwer',
    theme: 'emerald',
    slotsGenerator: genLevel16,
  },
  {
    levelNumber: 17,
    name: 'Der Skorpion',
    subtitle: 'Stachel der Herausforderung',
    description: '136 Spielsteine. Greifzangen und aufgerichteter Stachel fordern höchste Konzentration.',
    tileCount: 136,
    targetTime: 460,
    targetScore: 11400,
    difficulty: 'Schwer',
    theme: 'wood',
    slotsGenerator: genLevel17,
  },
  {
    levelNumber: 18,
    name: 'Die Galeere',
    subtitle: 'Auf hoher See',
    description: '140 Spielsteine. Kaiserliches Holzschiff mit 3 gestaffelten Masten.',
    tileCount: 140,
    targetTime: 480,
    targetScore: 12000,
    difficulty: 'Schwer',
    theme: 'ivory',
    slotsGenerator: genLevel18,
  },
  {
    levelNumber: 19,
    name: 'Die Pyramide von Gizeh',
    subtitle: 'Das Weltwunder',
    description: '144 Spielsteine. Massiver 4-stufiger Pyramidenaufbau.',
    tileCount: 144,
    targetTime: 500,
    targetScore: 12800,
    difficulty: 'Experte',
    theme: 'wood',
    slotsGenerator: genLevel19,
  },
  {
    levelNumber: 20,
    name: 'Die Festung',
    subtitle: 'Unbezwingbare Mauern',
    description: '144 Spielsteine. 4 wehrhafte Ecktürme schützen den zentralen Burgfried.',
    tileCount: 144,
    targetTime: 520,
    targetScore: 13400,
    difficulty: 'Experte',
    theme: 'emerald',
    slotsGenerator: genLevel20,
  },
  {
    levelNumber: 21,
    name: 'Der Tempel des Drachen',
    subtitle: 'Heiligtum der uralten Meister',
    description: '144 Spielsteine. Gewundene Drachenleiber auf fünf kunstvollen Terrassen.',
    tileCount: 144,
    targetTime: 540,
    targetScore: 14000,
    difficulty: 'Experte',
    theme: 'ivory',
    slotsGenerator: genLevel21,
  },
  {
    levelNumber: 22,
    name: 'Der Phönix',
    subtitle: 'Wiedergeboren aus der Asche',
    description: '144 Spielsteine. Prachtvolle Flügelschwünge erfordern perfekte Zugreihenfolge.',
    tileCount: 144,
    targetTime: 560,
    targetScore: 14600,
    difficulty: 'Experte',
    theme: 'wood',
    slotsGenerator: genLevel22,
  },
  {
    levelNumber: 23,
    name: 'Das Labyrinth',
    subtitle: 'Vier verschlungene Ringe',
    description: '144 Spielsteine. Enge konzentrische Korridore ohne Fehlzug verlangen.',
    tileCount: 144,
    targetTime: 580,
    targetScore: 15200,
    difficulty: 'Experte',
    theme: 'emerald',
    slotsGenerator: genLevel23,
  },
  {
    levelNumber: 24,
    name: 'Die Große Schildkröte',
    subtitle: 'Das ewige klassische Mahjong',
    description: '144 Spielsteine. Der weltberühmte 5-Ebenen-Aufbau mit Schild und Flossen.',
    tileCount: 144,
    targetTime: 600,
    targetScore: 16000,
    difficulty: 'Experte',
    theme: 'ivory',
    slotsGenerator: genLevel24,
  },
  {
    levelNumber: 25,
    name: 'Der Meister-Palast',
    subtitle: 'Die Krönung von Mahjong 2026',
    description: '144 Spielsteine auf 5 extrem dichten Ebenen. Das ultimative Meisterwerk!',
    tileCount: 144,
    targetTime: 620,
    targetScore: 18000,
    difficulty: 'Experte',
    theme: 'emerald',
    slotsGenerator: genLevel25,
  },
];

// 72 official matching pairs according to authentic Mahjong rules
export const get72OfficialPairs = (): [MahjongTileDefinition, MahjongTileDefinition][] => {
  const deck = createOfficial144Tiles();
  const pairs: [MahjongTileDefinition, MahjongTileDefinition][] = [];

  const standardGroups: Record<string, MahjongTileDefinition[]> = {};
  const flowerGroup: MahjongTileDefinition[] = [];
  const seasonGroup: MahjongTileDefinition[] = [];

  for (const tile of deck) {
    if (tile.category === 'flower') {
      flowerGroup.push(tile);
    } else if (tile.category === 'season') {
      seasonGroup.push(tile);
    } else {
      const key = `${tile.category}-${tile.value}`;
      if (!standardGroups[key]) standardGroups[key] = [];
      standardGroups[key].push(tile);
    }
  }

  // Each standard group has 4 identical tiles -> exactly 2 matching pairs
  for (const key of Object.keys(standardGroups)) {
    const list = standardGroups[key];
    if (list.length >= 2) pairs.push([list[0], list[1]]);
    if (list.length >= 4) pairs.push([list[2], list[3]]);
  }

  // Flowers: 4 tiles -> 2 matching pairs (any flower matches any flower)
  if (flowerGroup.length >= 4) {
    pairs.push([flowerGroup[0], flowerGroup[1]]);
    pairs.push([flowerGroup[2], flowerGroup[3]]);
  }

  // Seasons: 4 tiles -> 2 matching pairs (any season matches any season)
  if (seasonGroup.length >= 4) {
    pairs.push([seasonGroup[0], seasonGroup[1]]);
    pairs.push([seasonGroup[2], seasonGroup[3]]);
  }

  return pairs; // Exactly 72 pairs (144 tiles)
};

// Helper to generate a level board with guaranteed matching pairs
export const generateLevelBoard = (levelNumber: number): { tiles: PlacedMahjongTile[]; config: MahjongLevelConfig } => {
  const config = MAHJONG_LEVELS.find((l) => l.levelNumber === levelNumber) || MAHJONG_LEVELS[0];
  const rawSlots = config.slotsGenerator();
  const evenCount = rawSlots.length % 2 === 0 ? rawSlots.length : rawSlots.length - 1;
  const slots = rawSlots.slice(0, evenCount);
  const pairCount = Math.floor(slots.length / 2);

  // Take sufficient matching pairs from the 72 official pairs
  const allPairs = get72OfficialPairs();
  // Shuffle all pairs
  for (let i = allPairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPairs[i], allPairs[j]] = [allPairs[j], allPairs[i]];
  }

  // Pick pairCount pairs
  const tilePool: MahjongTileDefinition[] = [];
  for (let p = 0; p < pairCount; p++) {
    const pair = allPairs[p % allPairs.length];
    tilePool.push(pair[0], pair[1]);
  }

  // Shuffle the selected pool
  for (let i = tilePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tilePool[i], tilePool[j]] = [tilePool[j], tilePool[i]];
  }

  const placedTiles: PlacedMahjongTile[] = slots.map((slot, idx) => ({
    id: `tile-lvl${config.levelNumber}-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    definition: tilePool[idx],
    layer: slot.layer,
    x: slot.x,
    y: slot.y,
    matched: false,
  }));

  return {
    tiles: placedTiles,
    config: {
      ...config,
      tileCount: slots.length,
    },
  };
};
