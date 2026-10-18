import {seededRandom} from '../../../services/campaign';
import { BoardGrid, Gem, GemColor, GemSpecial, MatchGroup, ObstacleType, LevelConfig } from './types';

export const BOARD_SIZE = 8;
export const GEM_COLORS: GemColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

let gemIdCounter = 1;
export const generateGemId = () => `gem-${gemIdCounter++}-${Date.now()}`;

export const createGem = (
  color?: GemColor,
  special: GemSpecial = 'none',
  obstacle: ObstacleType = 'none',
  health: number = 0
): Gem => {
  const chosenColor = color || GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)];
  return {
    id: generateGemId(),
    color: chosenColor,
    special,
    obstacle,
    obstacleHealth: obstacle === 'rock' ? (health || 2) : 0,
    isMatched: false,
    isNew: false
  };
};

/**
 * Checks if two positions are orthogonal neighbors
 */
export const isAdjacent = (r1: number, c1: number, r2: number, c2: number): boolean => {
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
};

/**
 * Deep clones the board grid
 */
export const cloneBoard = (board: BoardGrid): BoardGrid => {
  return board.map((row) =>
    row.map((gem) => (gem ? { ...gem } : null))
  );
};

/**
 * Detects all horizontal and vertical matches of >= 3 gems.
 * Groups matches and identifies special creations (4-Line, 5-Rainbow, T/L-Bomb).
 */
export const findMatches = (board: BoardGrid): { matches: MatchGroup[]; matchedIndices: Set<string> } => {
  const matchedIndices = new Set<string>();
  const hRuns: { r: number; cStart: number; cEnd: number; color: GemColor; count: number }[] = [];
  const vRuns: { cStart: number; rStart: number; rEnd: number; color: GemColor; count: number }[] = [];

  // 1. Horizontal scans
  for (let r = 0; r < BOARD_SIZE; r++) {
    let matchLen = 1;
    for (let c = 0; c < BOARD_SIZE; c++) {
      const current = board[r][c];
      const next = c + 1 < BOARD_SIZE ? board[r][c + 1] : null;

      if (current && next && current.color === next.color && current.obstacle !== 'rock' && next.obstacle !== 'rock') {
        matchLen++;
      } else {
        if (matchLen >= 3 && current && current.obstacle !== 'rock') {
          hRuns.push({
            r,
            cStart: c - matchLen + 1,
            cEnd: c,
            color: current.color,
            count: matchLen
          });
          for (let k = c - matchLen + 1; k <= c; k++) {
            matchedIndices.add(`${r},${k}`);
          }
        }
        matchLen = 1;
      }
    }
  }

  // 2. Vertical scans
  for (let c = 0; c < BOARD_SIZE; c++) {
    let matchLen = 1;
    for (let r = 0; r < BOARD_SIZE; r++) {
      const current = board[r][c];
      const next = r + 1 < BOARD_SIZE ? board[r + 1][c] : null;

      if (current && next && current.color === next.color && current.obstacle !== 'rock' && next.obstacle !== 'rock') {
        matchLen++;
      } else {
        if (matchLen >= 3 && current && current.obstacle !== 'rock') {
          vRuns.push({
            cStart: c,
            rStart: r - matchLen + 1,
            rEnd: r,
            color: current.color,
            count: matchLen
          });
          for (let k = r - matchLen + 1; k <= r; k++) {
            matchedIndices.add(`${k},${c}`);
          }
        }
        matchLen = 1;
      }
    }
  }

  // 3. Combine matches and determine Special Gem Creations
  const groups: MatchGroup[] = [];
  const processedPositions = new Set<string>();

  // Check for T / L shape intersections (creating Bombs)
  for (const h of hRuns) {
    for (const v of vRuns) {
      if (h.color === v.color && v.cStart >= h.cStart && v.cStart <= h.cEnd && h.r >= v.rStart && h.r <= v.rEnd) {
        // Intersection point: (h.r, v.cStart)
        const intersectionR = h.r;
        const intersectionC = v.cStart;

        const gemCoords: { r: number; c: number }[] = [];
        for (let col = h.cStart; col <= h.cEnd; col++) {
          gemCoords.push({ r: h.r, c: col });
          processedPositions.add(`${h.r},${col}`);
        }
        for (let row = v.rStart; row <= v.rEnd; row++) {
          if (row !== intersectionR) {
            gemCoords.push({ r: row, c: v.cStart });
            processedPositions.add(`${row},${v.cStart}`);
          }
        }

        groups.push({
          gems: gemCoords,
          color: h.color,
          createsSpecial: {
            r: intersectionR,
            c: intersectionC,
            special: 'bomb',
            color: h.color
          }
        });
      }
    }
  }

  // Horizontal runs not swallowed by intersections
  for (const h of hRuns) {
    const isAlreadyIntersected = groups.some((g) =>
      g.gems.some((pt) => pt.r === h.r && pt.c >= h.cStart && pt.c <= h.cEnd && g.createsSpecial?.special === 'bomb')
    );
    if (!isAlreadyIntersected) {
      const gemCoords: { r: number; c: number }[] = [];
      for (let col = h.cStart; col <= h.cEnd; col++) {
        gemCoords.push({ r: h.r, c: col });
      }

      let special: GemSpecial = 'none';
      if (h.count >= 5) {
        special = 'rainbow';
      } else if (h.count === 4) {
        special = 'line-h';
      }

      const midCol = Math.floor((h.cStart + h.cEnd) / 2);
      groups.push({
        gems: gemCoords,
        color: h.color,
        createsSpecial: special !== 'none' ? {
          r: h.r,
          c: midCol,
          special,
          color: h.color
        } : undefined
      });
    }
  }

  // Vertical runs not swallowed by intersections
  for (const v of vRuns) {
    const isAlreadyIntersected = groups.some((g) =>
      g.gems.some((pt) => pt.c === v.cStart && pt.r >= v.rStart && pt.r <= v.rEnd && g.createsSpecial?.special === 'bomb')
    );
    if (!isAlreadyIntersected) {
      const gemCoords: { r: number; c: number }[] = [];
      for (let row = v.rStart; row <= v.rEnd; row++) {
        gemCoords.push({ r: row, c: v.cStart });
      }

      let special: GemSpecial = 'none';
      if (v.count >= 5) {
        special = 'rainbow';
      } else if (v.count === 4) {
        special = 'line-v';
      }

      const midRow = Math.floor((v.rStart + v.rEnd) / 2);
      groups.push({
        gems: gemCoords,
        color: v.color,
        createsSpecial: special !== 'none' ? {
          r: midRow,
          c: v.cStart,
          special,
          color: v.color
        } : undefined
      });
    }
  }

  return { matches: groups, matchedIndices };
};

/**
 * Checks if swapping posA and posB is a legal move
 */
export const isValidSwap = (
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  board: BoardGrid
): boolean => {
  if (![r1,c1,r2,c2].every(v=>Number.isInteger(v)&&v>=0&&v<8)||!isAdjacent(r1, c1, r2, c2)) return false;

  const gem1 = board[r1][c1];
  const gem2 = board[r2][c2];
  if (!gem1 || !gem2) return false;

  // Rocks cannot be swapped
  if (gem1.obstacle === 'rock' || gem2.obstacle === 'rock') return false;

  // Chained gems cannot be swapped
  if (gem1.obstacle === 'chain' || gem2.obstacle === 'chain'||gem1.obstacle==='ice'||gem2.obstacle==='ice') return false;

  // Swapping with Rainbow is always valid!
  if (gem1.special === 'rainbow' || gem2.special === 'rainbow') return true;

  // Swapping two special gems together is always valid!
  if (gem1.special !== 'none' && gem2.special !== 'none') return true;

  // Simulate swap
  const testBoard = cloneBoard(board);
  testBoard[r1][c1] = gem2;
  testBoard[r2][c2] = gem1;

  const { matches } = findMatches(testBoard);
  return matches.some(group=>group.gems.some(p=>p.r===r1&&p.c===c1||p.r===r2&&p.c===c2));
};

/**
 * Tests if the board currently contains at least one valid move
 */
export const hasValidMoves = (board: BoardGrid): boolean => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      // Right neighbor
      if (c + 1 < BOARD_SIZE && isValidSwap(r, c, r, c + 1, board)) {
        return true;
      }
      // Down neighbor
      if (r + 1 < BOARD_SIZE && isValidSwap(r, c, r + 1, c, board)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Finds a valid move to suggest as a hint
 */
export const findHintMove = (board: BoardGrid): { from: [number, number]; to: [number, number] } | null => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (c + 1 < BOARD_SIZE && isValidSwap(r, c, r, c + 1, board)) {
        return { from: [r, c], to: [r, c + 1] };
      }
      if (r + 1 < BOARD_SIZE && isValidSwap(r, c, r + 1, c, board)) {
        return { from: [r, c], to: [r + 1, c] };
      }
    }
  }
  return null;
};

/**
 * Creates an initial playable 8x8 board:
 * 1. Has NO matches at start.
 * 2. Has at least 1 valid move.
 * 3. Incorporates level obstacles if provided.
 */
export const createInitialBoard = (levelConfig?: Pick<LevelConfig,'obstacles'|'seed'|'colors'>, random=levelConfig?.seed?seededRandom(levelConfig.seed):Math.random): BoardGrid => {
  const colors=levelConfig?.colors?.length?levelConfig.colors:GEM_COLORS;
  let attempts = 0;
  while (attempts < 200) {
    attempts++;
    const board: BoardGrid = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null));

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        // Pick a color that doesn't form an immediate match of 3
        const forbidden: GemColor[] = [];
        if (c >= 2 && board[r][c - 1]?.color === board[r][c - 2]?.color && board[r][c - 1]?.color) {
          forbidden.push(board[r][c - 1]!.color);
        }
        if (r >= 2 && board[r - 1][c]?.color === board[r - 2][c]?.color && board[r - 1][c]?.color) {
          forbidden.push(board[r - 1][c]!.color);
        }

        const allowedColors = colors.filter((color) => !forbidden.includes(color));
        const chosenColor = allowedColors[Math.floor(random() * allowedColors.length)];
        board[r][c] = createGem(chosenColor);
      }
    }

    // Apply level obstacles if provided
    if (levelConfig && levelConfig.obstacles) {
      for (const obs of levelConfig.obstacles) {
        if (obs.r < BOARD_SIZE && obs.c < BOARD_SIZE && board[obs.r][obs.c]) {
          board[obs.r][obs.c]!.obstacle = obs.type;
          board[obs.r][obs.c]!.obstacleHealth = obs.health || (obs.type === 'rock' ? 2 : 0);
        }
      }
    }

    // Verify it has at least one valid move
    if (hasValidMoves(board)) {
      return board;
    }
  }

  throw new Error('Für diesen Aufbau konnte kein spielbares Feld erstellt werden.');
};

/**
 * Shuffles current board gems when no moves are left, ensuring no initial matches
 * and at least 1 valid move exists.
 */
export const shuffleBoard = (board:BoardGrid,random=Math.random,colors=GEM_COLORS):BoardGrid=>{
  const movable=board.flat().filter((g):g is Gem=>Boolean(g&&g.obstacle!=='rock'));
  for(let attempt=0;attempt<200;attempt++){
    const shuffled=[...movable];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
    let index=0;
    const next=board.map(row=>row.map(g=>g?.obstacle==='rock'?{...g}:g?{...shuffled[index++],obstacle:g.obstacle,obstacleHealth:g.obstacleHealth}:createGem(colors[Math.floor(random()*colors.length)])));
    if(!findMatches(next).matches.length&&hasValidMoves(next))return next;
  }
  const obstacles:LevelConfig['obstacles']=[];
  board.forEach((row,r)=>row.forEach((g,c)=>{if(g&&g.obstacle!=='none')obstacles.push({r,c,type:g.obstacle,health:g.obstacleHealth});}));
  const next=createInitialBoard({obstacles,colors},random);
  const specials=movable.filter(g=>g.special!=='none');
  let index=0;for(const row of next)for(const g of row)if(g&&g.obstacle==='none'&&index<specials.length)g.special=specials[index++].special;
  return next;
};
