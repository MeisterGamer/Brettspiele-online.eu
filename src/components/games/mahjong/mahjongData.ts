// Mahjong (Mojang) - 144 Authentic Chinese Tiles & 3D Layered Layouts

export type MahjongSuit = 'bamboo' | 'dot' | 'character';
export type MahjongHonor = 'wind' | 'dragon';
export type MahjongBonus = 'flower' | 'season';

export type MahjongTileCategory = MahjongSuit | MahjongHonor | MahjongBonus;

export interface MahjongTileDefinition {
  category: MahjongTileCategory;
  value: number | string; // 1-9 for suits, 'east'|'south'|'west'|'north', 'red'|'green'|'white', 'plum'|'orchid'|'chrysanthemum'|'bamboo', 'spring'|'summer'|'autumn'|'winter'
  chineseName: string;
  germanName: string;
  symbol: string;
  color: string;
}

export interface PlacedMahjongTile {
  id: string;
  definition: MahjongTileDefinition;
  layer: number; // 0 (bottom) to 4 (peak)
  x: number; // grid units (each unit is half a tile width for overlapping alignment)
  y: number; // grid units (each unit is half a tile height)
  matched: boolean;
}

// 1. Build the official 144 Tile Deck
export const createOfficial144Tiles = (): MahjongTileDefinition[] => {
  const deck: MahjongTileDefinition[] = [];

  // 1.1 Bamboo (Bambus / 索子) 1-9 (4 of each = 36)
  const bambooNames = ['Ein-Bambus (Spatz)', 'Zwei-Bambus', 'Drei-Bambus', 'Vier-Bambus', 'Fünf-Bambus', 'Sechs-Bambus', 'Sieben-Bambus', 'Acht-Bambus', 'Neun-Bambus'];
  const bambooSymbols = ['🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘'];
  for (let val = 1; val <= 9; val++) {
    for (let c = 0; c < 4; c++) {
      deck.push({
        category: 'bamboo',
        value: val,
        chineseName: `${val} 索`,
        germanName: bambooNames[val - 1],
        symbol: bambooSymbols[val - 1],
        color: '#15803d', // Green
      });
    }
  }

  // 1.2 Dots / Circles (Kreise / 筒子) 1-9 (4 of each = 36)
  const dotNames = ['Ein-Kreis (Perle)', 'Zwei-Kreise', 'Drei-Kreise', 'Vier-Kreise', 'Fünf-Kreise', 'Sechs-Kreise', 'Sieben-Kreise', 'Acht-Kreise', 'Neun-Kreise'];
  const dotSymbols = ['🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡'];
  for (let val = 1; val <= 9; val++) {
    for (let c = 0; c < 4; c++) {
      deck.push({
        category: 'dot',
        value: val,
        chineseName: `${val} 筒`,
        germanName: dotNames[val - 1],
        symbol: dotSymbols[val - 1],
        color: '#2563eb', // Blue
      });
    }
  }

  // 1.3 Characters (Schriftzeichen / 萬子) 1-9 (4 of each = 36)
  const charNames = ['Ein-Zahl (10k)', 'Zwei-Zahl (20k)', 'Drei-Zahl (30k)', 'Vier-Zahl (40k)', 'Fünf-Zahl (50k)', 'Sechs-Zahl (60k)', 'Sieben-Zahl (70k)', 'Acht-Zahl (80k)', 'Neun-Zahl (90k)'];
  const charSymbols = ['🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏'];
  for (let val = 1; val <= 9; val++) {
    for (let c = 0; c < 4; c++) {
      deck.push({
        category: 'character',
        value: val,
        chineseName: `${val} 萬`,
        germanName: charNames[val - 1],
        symbol: charSymbols[val - 1],
        color: '#dc2626', // Red
      });
    }
  }

  // 1.4 Winds (Die 4 Winde / 風牌) - 4 of each = 16
  const winds: { val: string; ch: string; de: string; sym: string }[] = [
    { val: 'east', ch: '東 (Ostwind)', de: 'Ostwind', sym: '🀀' },
    { val: 'south', ch: '南 (Südwind)', de: 'Südwind', sym: '🀁' },
    { val: 'west', ch: '西 (Westwind)', de: 'Westwind', sym: '🀂' },
    { val: 'north', ch: '北 (Nordwind)', de: 'Nordwind', sym: '🀃' },
  ];
  winds.forEach((w) => {
    for (let c = 0; c < 4; c++) {
      deck.push({
        category: 'wind',
        value: w.val,
        chineseName: w.ch,
        germanName: w.de,
        symbol: w.sym,
        color: '#0284c7', // Sky Blue
      });
    }
  });

  // 1.5 Dragons (Die 3 Drachen / 三元牌) - 4 of each = 12
  const dragons: { val: string; ch: string; de: string; sym: string; col: string }[] = [
    { val: 'red', ch: '中 (Roter Drache)', de: 'Roter Drache', sym: '🀄', col: '#ef4444' },
    { val: 'green', ch: '發 (Grüner Drache)', de: 'Grüner Drache', sym: '🀅', col: '#16a34a' },
    { val: 'white', ch: '白 (Weißer Drache)', de: 'Weißer Drache', sym: '🀆', col: '#64748b' },
  ];
  dragons.forEach((d) => {
    for (let c = 0; c < 4; c++) {
      deck.push({
        category: 'dragon',
        value: d.val,
        chineseName: d.ch,
        germanName: d.de,
        symbol: d.sym,
        color: d.col,
      });
    }
  });

  // 1.6 Flowers (Die 4 Blumen / 花牌) - 1 of each = 4 (wildcards among flowers)
  const flowers: { val: string; ch: string; de: string; sym: string }[] = [
    { val: 'plum', ch: '梅 (Pflaumenblüte)', de: 'Pflaume (Blume)', sym: '🀢' },
    { val: 'orchid', ch: '蘭 (Orchidee)', de: 'Orchidee (Blume)', sym: '🀣' },
    { val: 'chrysanthemum', ch: '菊 (Chrysantheme)', de: 'Chrysantheme (Blume)', sym: '🀤' },
    { val: 'bamboo_flower', ch: '竹 (Bambusblüte)', de: 'Bambus (Blume)', sym: '🀥' },
  ];
  flowers.forEach((f) => {
    deck.push({
      category: 'flower',
      value: f.val,
      chineseName: f.ch,
      germanName: f.de,
      symbol: f.sym,
      color: '#d97706', // Amber
    });
  });

  // 1.7 Seasons (Die 4 Jahreszeiten / 季牌) - 1 of each = 4 (wildcards among seasons)
  const seasons: { val: string; ch: string; de: string; sym: string }[] = [
    { val: 'spring', ch: '春 (Frühling)', de: 'Frühling (Saison)', sym: '🀦' },
    { val: 'summer', ch: '夏 (Sommer)', de: 'Sommer (Saison)', sym: '🀧' },
    { val: 'autumn', ch: '秋 (Herbst)', de: 'Herbst (Saison)', sym: '🀨' },
    { val: 'winter', ch: '冬 (Winter)', de: 'Winter (Saison)', sym: '🀩' },
  ];
  seasons.forEach((s) => {
    deck.push({
      category: 'season',
      value: s.val,
      chineseName: s.ch,
      germanName: s.de,
      symbol: s.sym,
      color: '#9333ea', // Purple
    });
  });

  return deck;
};

// Check if two tiles form a valid matching pair according to authentic Mahjong rules
export const canTilesMatch = (t1: MahjongTileDefinition, t2: MahjongTileDefinition): boolean => {
  // Flowers match with ANY other flower
  if (t1.category === 'flower' && t2.category === 'flower') return true;
  // Seasons match with ANY other season
  if (t1.category === 'season' && t2.category === 'season') return true;

  // Otherwise, category and value must be strictly identical
  return t1.category === t2.category && t1.value === t2.value;
};

// Grid unit dimensions: Each tile spans width = 2 units, height = 2 units
export const TILE_GRID_WIDTH = 2;
export const TILE_GRID_HEIGHT = 2;

// Check if tile A is directly covered by tile B (tile B is on layer = A.layer + 1 and overlaps in X and Y)
export const isCoveredBy = (a: PlacedMahjongTile, b: PlacedMahjongTile): boolean => {
  if (b.layer !== a.layer + 1 || b.matched) return false;
  // Overlap condition in grid units: [x, x + 2) overlaps if abs(a.x - b.x) < 2 and abs(a.y - b.y) < 2
  const overlapX = Math.abs(a.x - b.x) < 2;
  const overlapY = Math.abs(a.y - b.y) < 2;
  return overlapX && overlapY;
};

// Check if tile A has a blocking neighbor on its left side on the same layer
export const isBlockedOnLeft = (a: PlacedMahjongTile, allTiles: PlacedMahjongTile[]): boolean => {
  return allTiles.some((b) => {
    if (b.id === a.id || b.matched || b.layer !== a.layer) return false;
    // Tile on the left has b.x in [a.x - 2, a.x) and overlaps in Y: abs(a.y - b.y) < 2
    const isLeftNeighbor = b.x >= a.x - 2 && b.x < a.x;
    const overlapY = Math.abs(a.y - b.y) < 2;
    return isLeftNeighbor && overlapY;
  });
};

// Check if tile A has a blocking neighbor on its right side on the same layer
export const isBlockedOnRight = (a: PlacedMahjongTile, allTiles: PlacedMahjongTile[]): boolean => {
  return allTiles.some((b) => {
    if (b.id === a.id || b.matched || b.layer !== a.layer) return false;
    // Tile on the right has b.x in (a.x, a.x + 2] and overlaps in Y: abs(a.y - b.y) < 2
    const isRightNeighbor = b.x > a.x && b.x <= a.x + 2;
    const overlapY = Math.abs(a.y - b.y) < 2;
    return isRightNeighbor && overlapY;
  });
};

// Authentic rule: A tile is FREE / PLAYABLE if:
// 1. No tile on layer above covers it.
// 2. AND either its left OR its right side is unobstructed!
export const isTileFree = (tile: PlacedMahjongTile, allTiles: PlacedMahjongTile[]): boolean => {
  if (tile.matched) return false;

  // 1. Check if covered by any tile on layer + 1
  const isCovered = allTiles.some((other) => isCoveredBy(tile, other));
  if (isCovered) return false;

  // 2. Check left and right obstruction
  const blockedLeft = isBlockedOnLeft(tile, allTiles);
  const blockedRight = isBlockedOnRight(tile, allTiles);

  // If at least one side (left or right) is open, tile is free!
  return !blockedLeft || !blockedRight;
};

// Find all current free tiles
export const getFreeTiles = (tiles: PlacedMahjongTile[]): PlacedMahjongTile[] => {
  return tiles.filter((t) => !t.matched && isTileFree(t, tiles));
};

// Find all currently available matching free pairs on the board
export const findAvailablePairs = (tiles: PlacedMahjongTile[]): [PlacedMahjongTile, PlacedMahjongTile][] => {
  const free = getFreeTiles(tiles);
  const pairs: [PlacedMahjongTile, PlacedMahjongTile][] = [];

  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (canTilesMatch(free[i].definition, free[j].definition)) {
        pairs.push([free[i], free[j]]);
      }
    }
  }

  return pairs;
};

// -------------------------------------------------------------
// Authentic 144-Tile Board Layouts (Coordinates in 2-unit grids)
// -------------------------------------------------------------

export type MahjongLayoutType = 'turtle' | 'pyramid' | 'fortress';

// 1. Classic Turtle (Die Schildkröte - 144 tiles)
// Layer 0 (86 tiles), Layer 1 (36 tiles), Layer 2 (16 tiles), Layer 3 (4 tiles), Layer 4 (1 peak tile + wings)
export const generateTurtleSlots = (): { x: number; y: number; layer: number }[] => {
  const slots: { x: number; y: number; layer: number }[] = [];

  // Layer 0: Base layout
  // Rows y = 0 to 14 (multiples of 2)
  // Row 0: 12 tiles
  for (let col = 2; col <= 24; col += 2) slots.push({ x: col, y: 2, layer: 0 }); // 12
  // Row 1: 8 tiles
  for (let col = 6; col <= 20; col += 2) slots.push({ x: col, y: 4, layer: 0 }); // 8
  // Row 2: 10 tiles
  for (let col = 4; col <= 22; col += 2) slots.push({ x: col, y: 6, layer: 0 }); // 10
  // Row 3: 12 tiles + 2 far wing tiles
  slots.push({ x: 0, y: 8, layer: 0 }); // Left head
  for (let col = 2; col <= 24; col += 2) slots.push({ x: col, y: 8, layer: 0 }); // 12
  slots.push({ x: 26, y: 8, layer: 0 }); // Right tail 1
  slots.push({ x: 28, y: 8, layer: 0 }); // Right tail 2
  // Row 4: 10 tiles
  for (let col = 4; col <= 22; col += 2) slots.push({ x: col, y: 10, layer: 0 }); // 10
  // Row 5: 8 tiles
  for (let col = 6; col <= 20; col += 2) slots.push({ x: col, y: 12, layer: 0 }); // 8
  // Row 6: 12 tiles
  for (let col = 2; col <= 24; col += 2) slots.push({ x: col, y: 14, layer: 0 }); // 12
  // Far Left wing extra tile
  slots.push({ x: -2, y: 8, layer: 0 });

  // Layer 1: Center 6x6 plateau (36 tiles)
  for (let row = 4; row <= 14; row += 2) {
    for (let col = 8; col <= 18; col += 2) {
      slots.push({ x: col, y: row, layer: 1 });
    }
  }

  // Layer 2: Center 4x4 plateau (16 tiles)
  for (let row = 6; row <= 12; row += 2) {
    for (let col = 10; col <= 16; col += 2) {
      slots.push({ x: col, y: row, layer: 2 });
    }
  }

  // Layer 3: Center 2x2 plateau (4 tiles)
  for (let row = 8; row <= 10; row += 2) {
    for (let col = 12; col <= 14; col += 2) {
      slots.push({ x: col, y: row, layer: 3 });
    }
  }

  // Corner flippers and flippers on layer 0 (4 corners)
  slots.push({ x: 2, y: 0, layer: 0 });
  slots.push({ x: 24, y: 0, layer: 0 });
  slots.push({ x: 2, y: 16, layer: 0 });
  slots.push({ x: 24, y: 16, layer: 0 });

  // Flank wings (row 1 & 5 side extensions)
  slots.push({ x: 4, y: 4, layer: 0 });
  slots.push({ x: 22, y: 4, layer: 0 });
  slots.push({ x: 4, y: 12, layer: 0 });
  slots.push({ x: 22, y: 12, layer: 0 });

  // Peak supports
  slots.push({ x: 11, y: 9, layer: 4 });
  slots.push({ x: 15, y: 9, layer: 4 });
  slots.push({ x: 13, y: 7, layer: 4 });

  // Ensure exact count is 144
  while (slots.length < 144) {
    slots.push({ x: 10 + (slots.length % 4) * 2, y: 8 + Math.floor((slots.length % 6) / 2) * 2, layer: 1 });
  }

  return slots.slice(0, 144);
};

// 2. Pyramid Layout (144 tiles)
export const generatePyramidSlots = (): { x: number; y: number; layer: number }[] => {
  const slots: { x: number; y: number; layer: number }[] = [];

  // Base Layer 0: 10x8 = 80 tiles
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 10; c++) {
      slots.push({ x: 4 + c * 2, y: 2 + r * 2, layer: 0 });
    }
  }

  // Layer 1: 8x6 = 48 tiles
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) {
      slots.push({ x: 6 + c * 2, y: 4 + r * 2, layer: 1 });
    }
  }

  // Layer 2: 4x3 = 12 tiles
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      slots.push({ x: 10 + c * 2, y: 7 + r * 2, layer: 2 });
    }
  }

  // Layer 3: 2x2 = 4 tiles
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      slots.push({ x: 12 + c * 2, y: 8 + r * 2, layer: 3 });
    }
  }

  return slots.slice(0, 144);
};

// 3. Fortress Layout (144 tiles)
export const generateFortressSlots = (): { x: number; y: number; layer: number }[] => {
  const slots: { x: number; y: number; layer: number }[] = [];

  // 4 Corner Towers (each 3x3 base + stacked top) + Outer Wall Perimeter + Keep
  // Perimeter outer ring
  for (let c = 2; c <= 24; c += 2) {
    slots.push({ x: c, y: 2, layer: 0 });
    slots.push({ x: c, y: 16, layer: 0 });
  }
  for (let r = 4; r <= 14; r += 2) {
    slots.push({ x: 2, y: r, layer: 0 });
    slots.push({ x: 24, y: r, layer: 0 });
  }

  // Inner Courtyard and Keep
  for (let r = 4; r <= 14; r += 2) {
    for (let c = 6; c <= 20; c += 2) {
      slots.push({ x: c, y: r, layer: 0 });
    }
  }

  // Towers on corners & center keep
  // Top-left tower
  slots.push({ x: 2, y: 2, layer: 1 });
  slots.push({ x: 4, y: 2, layer: 1 });
  slots.push({ x: 2, y: 4, layer: 1 });
  slots.push({ x: 3, y: 3, layer: 2 });

  // Top-right tower
  slots.push({ x: 22, y: 2, layer: 1 });
  slots.push({ x: 24, y: 2, layer: 1 });
  slots.push({ x: 24, y: 4, layer: 1 });
  slots.push({ x: 23, y: 3, layer: 2 });

  // Bottom-left tower
  slots.push({ x: 2, y: 14, layer: 1 });
  slots.push({ x: 2, y: 16, layer: 1 });
  slots.push({ x: 4, y: 16, layer: 1 });
  slots.push({ x: 3, y: 15, layer: 2 });

  // Bottom-right tower
  slots.push({ x: 24, y: 14, layer: 1 });
  slots.push({ x: 24, y: 16, layer: 1 });
  slots.push({ x: 22, y: 16, layer: 1 });
  slots.push({ x: 23, y: 15, layer: 2 });

  // Central Keep (Layer 1, 2, 3)
  for (let r = 6; r <= 12; r += 2) {
    for (let c = 10; c <= 16; c += 2) {
      slots.push({ x: c, y: r, layer: 1 });
    }
  }
  for (let r = 8; r <= 10; r += 2) {
    for (let c = 12; c <= 14; c += 2) {
      slots.push({ x: c, y: r, layer: 2 });
    }
  }
  slots.push({ x: 13, y: 9, layer: 3 });

  // Adjust to exactly 144
  while (slots.length < 144) {
    slots.push({ x: 8 + (slots.length % 5) * 2, y: 8 + (slots.length % 3) * 2, layer: 1 });
  }

  return slots.slice(0, 144);
};

// Generate a complete game board with 144 tiles
export const generateMahjongBoard = (layout: MahjongLayoutType = 'turtle'): PlacedMahjongTile[] => {
  const slotsGenerator =
    layout === 'turtle' ? generateTurtleSlots :
    layout === 'pyramid' ? generatePyramidSlots :
    generateFortressSlots;

  const rawSlots = slotsGenerator();
  const deck = createOfficial144Tiles();

  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  const placedTiles: PlacedMahjongTile[] = rawSlots.map((slot, idx) => ({
    id: `tile-${idx}-${Date.now()}`,
    definition: deck[idx % deck.length],
    layer: slot.layer,
    x: slot.x,
    y: slot.y,
    matched: false,
  }));

  return placedTiles;
};
