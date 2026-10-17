// Catan 2026 - Board Geometry, Hexes, Vertices, Edges, Harbors and Rules Data

export type ResourceType = 'wood' | 'brick' | 'wool' | 'wheat' | 'ore';

export type TerrainType = 'forest' | 'hills' | 'pasture' | 'field' | 'mountains' | 'desert';

export interface ResourceCount {
  wood: number;
  brick: number;
  wool: number;
  wheat: number;
  ore: number;
}

export type DevCardType = 'knight' | 'victoryPoint' | 'roadBuilding' | 'yearOfPlenty' | 'monopoly';

export interface DevCardsCount {
  knight: number;
  victoryPoint: number;
  roadBuilding: number;
  yearOfPlenty: number;
  monopoly: number;
}

export interface CatanHex {
  id: number;
  terrain: TerrainType;
  resource: ResourceType | null;
  number: number; // 2..12 (0 for desert)
  pips: number; // probability dots: 6 and 8 have 5 pips
  x: number; // center in SVG coordinates
  y: number;
  row: number;
  col: number;
  vertexIds: number[]; // 6 vertex indices clockwise (top, top-right, bottom-right, bottom, bottom-left, top-left)
  edgeIds: string[]; // 6 edge ids
}

export interface CatanVertex {
  id: number;
  x: number;
  y: number;
  adjacentHexIds: number[];
  neighborVertexIds: number[];
  adjacentEdgeIds: string[];
  harbor?: {
    type: 'generic' | ResourceType;
    ratio: 2 | 3;
  };
}

export interface CatanEdge {
  id: string; // "v1-v2" sorted
  v1: number;
  v2: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  adjacentHexIds: number[];
}

export interface HarborDefinition {
  id: number;
  type: 'generic' | ResourceType;
  ratio: 2 | 3;
  vertexIds: [number, number];
  name: string;
}

export const RESOURCE_COLORS: Record<ResourceType, { bg: string; text: string; border: string; labelDe: string; labelEn: string; icon: string }> = {
  wood: { bg: '#15803d', text: '#dcfce7', border: '#22c55e', labelDe: 'Holz', labelEn: 'Lumber', icon: '🌲' },
  brick: { bg: '#b91c1c', text: '#fee2e2', border: '#ef4444', labelDe: 'Lehm', labelEn: 'Brick', icon: '🧱' },
  wool: { bg: '#84cc16', text: '#f7fee7', border: '#a3e635', labelDe: 'Wolle', labelEn: 'Wool', icon: '🐑' },
  wheat: { bg: '#eab308', text: '#fefce8', border: '#facc15', labelDe: 'Getreide', labelEn: 'Grain', icon: '🌾' },
  ore: { bg: '#64748b', text: '#f8fafc', border: '#94a3b8', labelDe: 'Erz', labelEn: 'Ore', icon: '⛰️' },
};

export const TERRAIN_DATA: Record<TerrainType, { nameDe: string; nameEn: string; resource: ResourceType | null; color: string; stroke: string }> = {
  forest: { nameDe: 'Wald', nameEn: 'Forest', resource: 'wood', color: '#14532d', stroke: '#16a34a' },
  hills: { nameDe: 'Hügelland', nameEn: 'Hills', resource: 'brick', color: '#7f1d1d', stroke: '#dc2626' },
  pasture: { nameDe: 'Weideland', nameEn: 'Pasture', resource: 'wool', color: '#365314', stroke: '#65a30d' },
  field: { nameDe: 'Ackerland', nameEn: 'Fields', resource: 'wheat', color: '#713f12', stroke: '#ca8a04' },
  mountains: { nameDe: 'Gebirge', nameEn: 'Mountains', resource: 'ore', color: '#334155', stroke: '#64748b' },
  desert: { nameDe: 'Wüste', nameEn: 'Desert', resource: null, color: '#78350f', stroke: '#d97706' },
};

export const BUILDING_COSTS: Record<'road' | 'settlement' | 'city' | 'devCard', Partial<ResourceCount>> = {
  road: { wood: 1, brick: 1 },
  settlement: { wood: 1, brick: 1, wool: 1, wheat: 1 },
  city: { wheat: 2, ore: 3 },
  devCard: { wool: 1, wheat: 1, ore: 1 },
};

export const PIPS_MAP: Record<number, number> = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 0,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};

// Generate standard 19-hex Catan board layout with precise geometry
// Standard layout row lengths: 3, 4, 5, 4, 3
export function generateCatanBoard(): {
  hexes: CatanHex[];
  vertices: CatanVertex[];
  edges: CatanEdge[];
  desertHexId: number;
} {
  const HEX_RADIUS = 54; // radius from center to vertex
  const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS; // ~93.53
  const VERTICAL_SPACING = 1.5 * HEX_RADIUS; // 81

  const BOARD_CENTER_X = 360;
  const BOARD_CENTER_Y = 320;

  // 19 standard terrain distribution: 4 forest, 4 pasture, 4 field, 3 hills, 3 mountains, 1 desert
  const standardTerrains: TerrainType[] = [
    'mountains', 'pasture', 'forest',
    'field', 'hills', 'pasture', 'hills',
    'field', 'forest', 'desert', 'forest', 'mountains',
    'forest', 'mountains', 'field', 'pasture',
    'hills', 'field', 'pasture'
  ];

  // Standard official beginner number tokens (classic clockwise spiral)
  const standardNumbers = [
    10, 2, 9,
    12, 6, 4, 10,
    9, 11, 0, 3, 8,
    8, 3, 4, 5,
    5, 6, 11
  ];

  const rowLengths = [3, 4, 5, 4, 3];
  const rowOffsets = [-2, -1, 0, 1, 2];

  const hexes: CatanHex[] = [];
  const vertexCoordMap = new Map<string, { id: number; x: number; y: number; adjHexes: number[] }>();
  let nextVertexId = 0;

  // Edge helper
  const edgeMap = new Map<string, { from: number; to: number; adjHexes: number[] }>();

  let hexIndex = 0;

  for (let r = 0; r < rowLengths.length; r++) {
    const count = rowLengths[r];
    const rowOffset = rowOffsets[r];
    const yCenter = BOARD_CENTER_Y + rowOffset * VERTICAL_SPACING;
    const startX = BOARD_CENTER_X - ((count - 1) * HEX_WIDTH) / 2;

    for (let c = 0; c < count; c++) {
      const xCenter = startX + c * HEX_WIDTH;
      const terrain = standardTerrains[hexIndex];
      const number = standardNumbers[hexIndex];
      const resource = TERRAIN_DATA[terrain].resource;
      const pips = PIPS_MAP[number] || 0;

      // Calculate 6 vertices around hex center
      // Pointy topped hex vertices at angles: 30, 90, 150, 210, 270, 330 deg (or flat-topped 0, 60...)
      // Standard Catan uses flat-topped / pointy-topped orientation. With pointy-topped:
      // Angles: 30, 90, 150, 210, 270, 330 deg
      const hexVertexIds: number[] = [];
      const hexEdgeIds: string[] = [];

      for (let i = 0; i < 6; i++) {
        const angleDeg = 30 + i * 60;
        const angleRad = (Math.PI / 180) * angleDeg;
        const vx = Math.round(xCenter + HEX_RADIUS * Math.cos(angleRad));
        const vy = Math.round(yCenter + HEX_RADIUS * Math.sin(angleRad));

        // Coordinate key with 2px rounding to seamlessly merge adjacent hex vertices
        const key = `${Math.round(vx / 2) * 2}_${Math.round(vy / 2) * 2}`;
        let vData = vertexCoordMap.get(key);

        if (!vData) {
          vData = { id: nextVertexId++, x: vx, y: vy, adjHexes: [hexIndex] };
          vertexCoordMap.set(key, vData);
        } else {
          if (!vData.adjHexes.includes(hexIndex)) {
            vData.adjHexes.push(hexIndex);
          }
        }
        hexVertexIds.push(vData.id);
      }

      // Add 6 edges connecting adjacent vertices
      for (let i = 0; i < 6; i++) {
        const vA = hexVertexIds[i];
        const vB = hexVertexIds[(i + 1) % 6];
        const minV = Math.min(vA, vB);
        const maxV = Math.max(vA, vB);
        const edgeKey = `${minV}-${maxV}`;

        let eData = edgeMap.get(edgeKey);
        if (!eData) {
          eData = { from: minV, to: maxV, adjHexes: [hexIndex] };
          edgeMap.set(edgeKey, eData);
        } else {
          if (!eData.adjHexes.includes(hexIndex)) {
            eData.adjHexes.push(hexIndex);
          }
        }
        hexEdgeIds.push(edgeKey);
      }

      hexes.push({
        id: hexIndex,
        terrain,
        resource,
        number,
        pips,
        x: Math.round(xCenter),
        y: Math.round(yCenter),
        row: r,
        col: c,
        vertexIds: hexVertexIds,
        edgeIds: hexEdgeIds,
      });

      hexIndex++;
    }
  }

  // Construct vertex list
  const vertices: CatanVertex[] = Array.from(vertexCoordMap.values())
    .sort((a, b) => a.id - b.id)
    .map((v) => ({
      id: v.id,
      x: v.x,
      y: v.y,
      adjacentHexIds: v.adjHexes,
      neighborVertexIds: [],
      adjacentEdgeIds: [],
    }));

  // Construct edges list and link neighbor vertices
  const edges: CatanEdge[] = [];
  edgeMap.forEach((eData, key) => {
    const v1Obj = vertices.find((v) => v.id === eData.from);
    const v2Obj = vertices.find((v) => v.id === eData.to);
    if (!v1Obj || !v2Obj) return;

    v1Obj.neighborVertexIds.push(eData.to);
    v2Obj.neighborVertexIds.push(eData.from);
    v1Obj.adjacentEdgeIds.push(key);
    v2Obj.adjacentEdgeIds.push(key);

    edges.push({
      id: key,
      v1: eData.from,
      v2: eData.to,
      x1: v1Obj.x,
      y1: v1Obj.y,
      x2: v2Obj.x,
      y2: v2Obj.y,
      adjacentHexIds: eData.adjHexes,
    });
  });

  // Coastal Harbors assignment (9 authentic harbors along coastal vertices)
  // Coastal vertices have < 3 adjacent hexes
  const coastalVertices = vertices.filter((v) => v.adjacentHexIds.length < 3);

  // Define 9 harbors by pairing close coastal vertices that share a coastal edge
  const harborTypes: { type: 'generic' | ResourceType; ratio: 2 | 3 }[] = [
    { type: 'generic', ratio: 3 },
    { type: 'wood', ratio: 2 },
    { type: 'brick', ratio: 2 },
    { type: 'generic', ratio: 3 },
    { type: 'wool', ratio: 2 },
    { type: 'wheat', ratio: 2 },
    { type: 'generic', ratio: 3 },
    { type: 'ore', ratio: 2 },
    { type: 'generic', ratio: 3 },
  ];

  // Distribute harbors evenly on outer border
  edges
    .filter((e) => e.adjacentHexIds.length === 1)
    .filter((_, idx) => idx % 3 === 0)
    .slice(0, 9)
    .forEach((harborEdge, idx) => {
      const hType = harborTypes[idx % harborTypes.length];
      const vA = vertices.find((v) => v.id === harborEdge.v1);
      const vB = vertices.find((v) => v.id === harborEdge.v2);
      if (vA) vA.harbor = hType;
      if (vB) vB.harbor = hType;
    });

  const desertHex = hexes.find((h) => h.terrain === 'desert');
  const desertHexId = desertHex ? desertHex.id : 9;

  return { hexes, vertices, edges, desertHexId };
}

export interface CatanPlayerState {
  id: string;
  name: string;
  color: string;
  badgeColor: string;
  avatar: any;
  isAi: boolean;
  resources: ResourceCount;
  settlements: number[]; // vertex IDs
  cities: number[]; // vertex IDs
  roads: string[]; // edge IDs
  devCards: DevCardsCount;
  playedKnights: number;
  hasLongestRoad: boolean;
  hasLargestArmy: boolean;
  victoryPoints: number;
}

export type CatanGamePhase =
  | 'SETUP_1' // Round 1 placement (Settlement + Road)
  | 'SETUP_2' // Round 2 placement in reverse order (Settlement + Road + starting resources)
  | 'ROLL' // Active player must roll
  | 'ROBBER_DISCARD' // If 7 rolled, players with > 7 cards must discard
  | 'ROBBER_MOVE' // Place robber on new hex & steal card
  | 'MAIN_ACTION' // Build, Trade, Play Dev Card, End Turn
  | 'GAME_OVER';

export interface CatanActionLogItem {
  id: string;
  text: string;
  time: string;
  color?: string;
  icon?: string;
}

export const INITIAL_DEV_CARDS_DECK: DevCardType[] = [
  'knight', 'knight', 'knight', 'knight', 'knight', 'knight', 'knight', 'knight', 'knight', 'knight', 'knight', 'knight', 'knight', 'knight',
  'victoryPoint', 'victoryPoint', 'victoryPoint', 'victoryPoint', 'victoryPoint',
  'roadBuilding', 'roadBuilding',
  'yearOfPlenty', 'yearOfPlenty',
  'monopoly', 'monopoly'
];
