import { mahjongLevelConfig, mahjongLevelBoard } from './mahjongCampaign';
import { 
  type PlacedMahjongTile, 
  type MahjongTileDefinition, 
  type MahjongLayoutType,
  generateMahjongBoard, 
  isTileFree, 
  canTilesMatch, 
  findAvailablePairs, 
  getFreeTiles,
  dealMahjongPairs
} from '../components/games/mahjong/mahjongData';

export interface MahjongEngineState {
  tiles: PlacedMahjongTile[];
  selectedTileId: string | null;
  score: number;
  combo: number;
  movesCount: number;
  history: { id1: string; id2: string; time: number }[];
  isVictory: boolean;
  isStuck: boolean;
  levelNumber?: number;
  layoutType?: MahjongLayoutType;
}

export class MahjongEngine {
  private state: MahjongEngineState;

  constructor(levelOrLayout: number | MahjongLayoutType = 1) {
    this.state = this.initBoard(levelOrLayout);
  }

  public initBoard(levelOrLayout: number | MahjongLayoutType = 1): MahjongEngineState {
    let tiles: PlacedMahjongTile[];
    let levelNumber: number | undefined;
    let layoutType: MahjongLayoutType | undefined;

    if (typeof levelOrLayout === 'number') {
      const generated = mahjongLevelBoard(levelOrLayout);
      tiles = generated.tiles;
      levelNumber = levelOrLayout;
    } else {
      tiles = generateMahjongBoard(levelOrLayout);
      layoutType = levelOrLayout;
    }

    this.state = {
      tiles,
      selectedTileId: null,
      score: 0,
      combo: 0,
      movesCount: 0,
      history: [],
      isVictory: false,
      isStuck: false,
      levelNumber,
      layoutType,
    };

    return this.getState();
  }

  public getState(): MahjongEngineState {
    return {
      ...this.state,
      tiles: [...this.state.tiles],
      history: [...this.state.history],
    };
  }

  public getAvailablePairs(): [PlacedMahjongTile, PlacedMahjongTile][] {
    return findAvailablePairs(this.state.tiles);
  }

  public getHint(): [PlacedMahjongTile, PlacedMahjongTile] | null {
    const pairs = this.getAvailablePairs();
    if (pairs.length === 0) return null;
    return pairs[Math.floor(Math.random() * pairs.length)];
  }

  public selectTile(tileId: string): {
    matched: boolean;
    tilePair?: [string, string];
    pointsEarned?: number;
    isVictory?: boolean;
    isStuck?: boolean;
  } {
    const tile = this.state.tiles.find((t) => t.id === tileId);
    if (!tile || tile.matched) return { matched: false };

    // Verify tile is legally free
    if (!isTileFree(tile, this.state.tiles)) {
      return { matched: false };
    }

    // If nothing currently selected, select this tile
    if (!this.state.selectedTileId) {
      this.state.selectedTileId = tileId;
      return { matched: false };
    }

    // If clicked on same tile, deselect
    if (this.state.selectedTileId === tileId) {
      this.state.selectedTileId = null;
      return { matched: false };
    }

    // Compare with currently selected tile
    const prevTile = this.state.tiles.find((t) => t.id === this.state.selectedTileId);
    if (!prevTile) {
      this.state.selectedTileId = tileId;
      return { matched: false };
    }

    if (canTilesMatch(prevTile.definition, tile.definition)) {
      // Matching pair found!
      prevTile.matched = true;
      tile.matched = true;

      const firstId = prevTile.id;
      const secondId = tile.id;
      this.state.selectedTileId = null;
      this.state.combo += 1;
      this.state.movesCount += 1;

      const basePoints = 100;
      const comboBonus = (this.state.combo - 1) * 20;
      const points = basePoints + comboBonus;
      this.state.score += points;

      this.state.history.push({
        id1: firstId,
        id2: secondId,
        time: Date.now(),
      });

      // Check remaining tiles
      const remaining = this.state.tiles.filter((t) => !t.matched);
      const isVictory = remaining.length === 0;
      this.state.isVictory = isVictory;

      const pairs = isVictory ? [] : findAvailablePairs(this.state.tiles);
      const isStuck = !isVictory && pairs.length === 0;
      this.state.isStuck = isStuck;

      return {
        matched: true,
        tilePair: [firstId, secondId],
        pointsEarned: points,
        isVictory,
        isStuck,
      };
    } else {
      // Not matching, update selection to the newly clicked tile
      this.state.selectedTileId = tileId;
      this.state.combo = 0;
      return { matched: false };
    }
  }

  public undo(): boolean {
    if (this.state.history.length === 0) return false;
    const lastMove = this.state.history.pop()!;
    const t1 = this.state.tiles.find((t) => t.id === lastMove.id1);
    const t2 = this.state.tiles.find((t) => t.id === lastMove.id2);
    if (t1) t1.matched = false;
    if (t2) t2.matched = false;

    this.state.selectedTileId = null;
    this.state.score = Math.max(0, this.state.score - 50);
    this.state.combo = 0;
    this.state.isVictory = false;
    this.state.isStuck = false;

    return true;
  }

  public shuffleRemaining(): boolean {
    const unmatched = this.state.tiles.filter((t) => !t.matched);
    if (unmatched.length <= 1) return false;

    const definitions = unmatched.map((t) => t.definition);
    // Fisher-Yates shuffle
    for (let i = definitions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [definitions[i], definitions[j]] = [definitions[j], definitions[i]];
    }

    unmatched.forEach((tile, index) => {
      tile.definition = definitions[index];
    });

    this.state.selectedTileId = null;
    this.state.combo = 0;
    this.state.isStuck = findAvailablePairs(this.state.tiles).length === 0;

    return true;
  }
}

// Singleton helper / factory
export const createMahjongEngine = (levelOrLayout: number | MahjongLayoutType = 1) => {
  return new MahjongEngine(levelOrLayout);
};

export default MahjongEngine;
