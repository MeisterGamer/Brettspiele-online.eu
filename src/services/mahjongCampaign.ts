import { 
  generateMahjongBoard, 
  dealMahjongPairs, 
  getFreeTiles, 
  type MahjongLayoutType, 
  type PlacedMahjongTile,
  type MahjongTileDefinition,
  canTilesMatch,
  findAvailablePairs
} from '../components/games/mahjong/mahjongData';
import { 
  MAHJONG_LEVELS, 
  type MahjongLevelConfig, 
  generateLevelBoard 
} from '../components/games/mahjong/mahjongLevels';

export interface MahjongLevelResult {
  levelNumber: number;
  completed: boolean;
  score: number;
  stars: number; // 0-3
  timeSpentSeconds: number;
  matchedPairs: number;
  totalPairs: number;
  unlockedAt?: string;
  bestTimeSeconds?: number;
  highScore: number;
}

export interface MahjongCampaignState {
  currentLevel: number;
  maxUnlockedLevel: number;
  totalStars: number;
  totalScore: number;
  levelResults: Record<number, MahjongLevelResult>;
  lastPlayedAt?: string;
}

const STORAGE_KEY = 'mahjong_campaign_save_v2';

export const INITIAL_CAMPAIGN_STATE: MahjongCampaignState = {
  currentLevel: 1,
  maxUnlockedLevel: 1,
  totalStars: 0,
  totalScore: 0,
  levelResults: {
    1: {
      levelNumber: 1,
      completed: false,
      score: 0,
      stars: 0,
      timeSpentSeconds: 0,
      matchedPairs: 0,
      totalPairs: 18,
      highScore: 0,
    }
  }
};

/**
 * Loads the campaign progress from localStorage with safe fallback.
 */
export function loadCampaignProgress(): MahjongCampaignState {
  if (typeof window === 'undefined') {
    return INITIAL_CAMPAIGN_STATE;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_CAMPAIGN_STATE;
    const parsed = JSON.parse(raw) as MahjongCampaignState;
    if (parsed && typeof parsed.currentLevel === 'number') {
      return {
        ...INITIAL_CAMPAIGN_STATE,
        ...parsed,
        levelResults: parsed.levelResults || {}
      };
    }
  } catch (e) {
    console.error('Failed to parse Mahjong campaign progress:', e);
  }
  return INITIAL_CAMPAIGN_STATE;
}

/**
 * Saves the campaign progress to localStorage.
 */
export function saveCampaignProgress(state: MahjongCampaignState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save Mahjong campaign progress:', e);
  }
}

/**
 * Returns configuration for a specific level (1-25).
 */
export function getCampaignLevel(levelNumber: number): MahjongLevelConfig {
  const level = MAHJONG_LEVELS.find((l) => l.levelNumber === levelNumber);
  return level || MAHJONG_LEVELS[0];
}

/**
 * Returns all 25 campaign levels.
 */
export function getAllCampaignLevels(): MahjongLevelConfig[] {
  return MAHJONG_LEVELS;
}

/**
 * Calculates 1, 2, or 3 stars based on completion time and performance.
 */
export function calculateLevelStars(
  levelNumber: number,
  timeSeconds: number,
  isVictory: boolean
): number {
  if (!isVictory) return 0;
  const config = getCampaignLevel(levelNumber);
  
  // 3 Stars: Completed within target time
  if (timeSeconds <= config.targetTime) {
    return 3;
  }
  // 2 Stars: Completed within 1.5x target time
  if (timeSeconds <= config.targetTime * 1.5) {
    return 2;
  }
  // 1 Star: Completed
  return 1;
}

/**
 * Calculates final score for level completion.
 */
export function calculateLevelScore(
  levelNumber: number,
  timeSeconds: number,
  hintsUsed: number,
  undosUsed: number
): number {
  const config = getCampaignLevel(levelNumber);
  const baseScore = config.targetScore || 1000;
  const timeBonus = Math.max(0, (config.targetTime - timeSeconds) * 10);
  const penalty = (hintsUsed * 50) + (undosUsed * 25);
  return Math.max(100, Math.round(baseScore + timeBonus - penalty));
}

/**
 * Record a level completion and unlock next level.
 */
export function completeCampaignLevel(
  currentState: MahjongCampaignState,
  levelNumber: number,
  timeSeconds: number,
  hintsUsed: number = 0,
  undosUsed: number = 0
): { updatedState: MahjongCampaignState; starsEarned: number; scoreEarned: number } {
  const starsEarned = calculateLevelStars(levelNumber, timeSeconds, true);
  const scoreEarned = calculateLevelScore(levelNumber, timeSeconds, hintsUsed, undosUsed);

  const prevResult = currentState.levelResults[levelNumber];
  const newBestTime = prevResult?.bestTimeSeconds
    ? Math.min(prevResult.bestTimeSeconds, timeSeconds)
    : timeSeconds;
  const newHighScore = prevResult ? Math.max(prevResult.highScore, scoreEarned) : scoreEarned;
  const newStars = prevResult ? Math.max(prevResult.stars, starsEarned) : starsEarned;

  const nextLevel = Math.min(25, Math.max(currentState.maxUnlockedLevel, levelNumber + 1));

  const updatedResults = {
    ...currentState.levelResults,
    [levelNumber]: {
      levelNumber,
      completed: true,
      score: scoreEarned,
      stars: newStars,
      timeSpentSeconds: timeSeconds,
      matchedPairs: Math.floor(getCampaignLevel(levelNumber).tileCount / 2),
      totalPairs: Math.floor(getCampaignLevel(levelNumber).tileCount / 2),
      bestTimeSeconds: newBestTime,
      highScore: newHighScore,
    }
  };

  // Recalculate total stars and score
  let totalStars = 0;
  let totalScore = 0;
  Object.values(updatedResults).forEach((res) => {
    totalStars += res.stars || 0;
    totalScore += res.highScore || 0;
  });

  const updatedState: MahjongCampaignState = {
    ...currentState,
    currentLevel: Math.min(25, levelNumber + 1),
    maxUnlockedLevel: nextLevel,
    totalStars,
    totalScore,
    levelResults: updatedResults,
    lastPlayedAt: new Date().toISOString(),
  };

  saveCampaignProgress(updatedState);
  return { updatedState, starsEarned, scoreEarned };
}

/**
 * Generates a board for a campaign level, ensuring paired tiles and solvability hints.
 */
export function createCampaignBoard(levelNumber: number): {
  tiles: PlacedMahjongTile[];
  config: MahjongLevelConfig;
  initialAvailablePairs: number;
} {
  const board = generateLevelBoard(levelNumber);
  const freeTiles = getFreeTiles(board.tiles);
  const availablePairs = findAvailablePairs(board.tiles);

  return {
    tiles: board.tiles,
    config: board.config,
    initialAvailablePairs: availablePairs.length
  };
}

// Aliases and re-exports for mahjongEngine compatibility
export const mahjongLevelBoard = generateLevelBoard;
export const mahjongLevelConfig = getCampaignLevel;
export type { MahjongLevelConfig };
export { MAHJONG_LEVELS, generateLevelBoard };

// Re-export core functions and types for direct usage
export {
  generateMahjongBoard,
  dealMahjongPairs,
  getFreeTiles,
  canTilesMatch,
  findAvailablePairs,
  type MahjongLayoutType,
  type PlacedMahjongTile,
  type MahjongTileDefinition
};

export default {
  mahjongLevelBoard,
  mahjongLevelConfig,
  generateLevelBoard,
  getCampaignLevel,
  getAllCampaignLevels,
  MAHJONG_LEVELS,
  generateMahjongBoard,
  dealMahjongPairs,
  getFreeTiles,
  canTilesMatch,
  findAvailablePairs,
  loadCampaignProgress,
  saveCampaignProgress,
  calculateLevelStars,
  calculateLevelScore,
  completeCampaignLevel,
  createCampaignBoard
};
