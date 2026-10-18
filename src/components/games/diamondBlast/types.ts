export type GemColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export type GemSpecial = 
  | 'none'       // Regular diamond
  | 'line-h'     // Horizontal laser blast
  | 'line-v'     // Vertical laser blast
  | 'bomb'       // 3x3 Dynamite explosive
  | 'rainbow';   // Prismatic hypercube clears all of a color

export type ObstacleType = 
  | 'none'
  | 'ice'        // Thawed by matching on or adjacent to it
  | 'rock'       // Cracked and destroyed by nearby matches or explosions (needs 2 hits)
  | 'chain';     // Trapped gem, can't be moved until unlocked by matching

export interface Gem {
  id: string;
  color: GemColor;
  special: GemSpecial;
  obstacle: ObstacleType;
  obstacleHealth: number; // For rocks (max 2, hits reduce by 1)
  isMatched?: boolean;
  isNew?: boolean;
  animOffset?: { x: number; y: number }; // Visual drop or swap offset
}

export type BoardGrid = (Gem | null)[][];

export type GameMode = 'classic' | 'time' | 'levels';

export interface LevelGoal {
  type: 'score' | 'clear-ice' | 'destroy-rocks' | 'unlock-chains' | 'collect-color';
  target: number;
  current: number;
  color?: GemColor;
  label: string;
}

export interface LevelConfig {
  levelNumber: number;
  title: string;
  maxMoves: number;
  targetScore: number;
  starScores: [number, number, number];
  obstacles: { r: number; c: number; type: ObstacleType; health?: number }[];
  goals: LevelGoal[];
  seed?: number;
  colors?: GemColor[];
  chapter?: string;
  briefing?: string;
  difficulty?: number;
}

export interface GameStats {
  score: number;
  movesLeft: number;
  timeLeft: number; // for time mode (seconds)
  comboCount: number;
  maxCombo: number;
  matchesCount: number;
  specialGemsCreated: number;
  bombsDetonated: number;
  level: number;
}

export interface MatchGroup {
  gems: { r: number; c: number }[];
  color: GemColor;
  createsSpecial?: {
    r: number;
    c: number;
    special: GemSpecial;
    color: GemColor;
  };
}

export interface Settings {
  soundVolume: number;   // 0 - 100
  musicVolume: number;   // 0 - 100
  screenShake: boolean;
  particleDensity: 'low' | 'medium' | 'high';
}

export interface UserProgress {
  unlockedLevel: number;
  levelStars: Record<number, number>; // levelNumber -> 1, 2, or 3
  levelScores: Record<number, number>; // levelNumber -> high score
  classicHighScore: number;
  timeHighScore: number;
}
