import { LevelConfig, LevelGoal, ObstacleType, GemColor } from './types';
import { GEM_COLORS } from './matchEngine';

/**
 * Returns configuration for any of the 100 Levels in Diamond Blast.
 * Deterministic generation ensures smooth difficulty scaling.
 */
export const getLevelConfig = (levelNumber: number): LevelConfig => {
  const lvl = Math.max(1, Math.min(100, levelNumber));

  // Determine Level Tier
  let tierName = 'Kristall-Höhle';
  if (lvl > 75) tierName = 'Obsidian-Vulkan';
  else if (lvl > 50) tierName = 'Mystisches Gewölbe';
  else if (lvl > 25) tierName = 'Granit-Mine';
  else if (lvl > 10) tierName = 'Eis-Grotte';

  // Moves calculation: starts at 28-30 moves, decreases down to 18-22 on high levels
  const maxMoves = Math.max(18, Math.round(30 - (lvl * 0.11)));

  // Target Score: scales gracefully with level
  const baseScore = 1500;
  const targetScore = Math.round(baseScore + lvl * 420 + Math.pow(lvl, 1.4) * 50);

  // Star rating thresholds: 1 star = 100% target, 2 stars = 140%, 3 stars = 190%
  const starScores: [number, number, number] = [
    targetScore,
    Math.round(targetScore * 1.4),
    Math.round(targetScore * 1.9)
  ];

  // Obstacle Generation
  const obstacles: { r: number; c: number; type: ObstacleType; health?: number }[] = [];
  const goals: LevelGoal[] = [];

  // Goal 1: Score Target is always present
  goals.push({
    type: 'score',
    target: targetScore,
    current: 0,
    label: `Erreiche ${targetScore.toLocaleString()} Punkte`
  });

  // Level specific mechanics & obstacle layouts
  if (lvl >= 11 && lvl <= 25) {
    // Glacial Caves: Ice blocks
    const iceCount = Math.min(16, 4 + Math.floor((lvl - 10) * 0.8));
    // Symmetric ice positions
    const iceCoords: [number, number][] = [
      [2, 2], [2, 5], [5, 2], [5, 5],
      [1, 1], [1, 6], [6, 1], [6, 6],
      [3, 3], [3, 4], [4, 3], [4, 4],
      [2, 3], [2, 4], [5, 3], [5, 4]
    ];

    for (let i = 0; i < iceCount; i++) {
      const [r, c] = iceCoords[i % iceCoords.length];
      obstacles.push({ r, c, type: 'ice' });
    }

    goals.push({
      type: 'clear-ice',
      target: iceCount,
      current: 0,
      label: `Schmelze ${iceCount} Eisblöcke`
    });
  } else if (lvl >= 26 && lvl <= 50) {
    // Granite Quarry: Rock boulders
    const rockCount = Math.min(10, 3 + Math.floor((lvl - 25) * 0.3));
    const rockCoords: [number, number][] = [
      [3, 3], [3, 4], [4, 3], [4, 4],
      [1, 3], [1, 4], [6, 3], [6, 4],
      [3, 1], [4, 1], [3, 6], [4, 6]
    ];

    for (let i = 0; i < rockCount; i++) {
      const [r, c] = rockCoords[i % rockCoords.length];
      obstacles.push({ r, c, type: 'rock', health: 2 });
    }

    goals.push({
      type: 'destroy-rocks',
      target: rockCount,
      current: 0,
      label: `Zerstöre ${rockCount} Felsen`
    });
  } else if (lvl >= 51 && lvl <= 75) {
    // Mystic Vault: Chains + Ice
    const chainCount = Math.min(8, 2 + Math.floor((lvl - 50) * 0.25));
    const chainCoords: [number, number][] = [
      [2, 2], [2, 5], [5, 2], [5, 5],
      [3, 2], [3, 5], [4, 2], [4, 5]
    ];
    for (let i = 0; i < chainCount; i++) {
      const [r, c] = chainCoords[i % chainCoords.length];
      obstacles.push({ r, c, type: 'chain' });
    }

    const iceCount = Math.min(10, 4 + Math.floor((lvl - 50) * 0.25));
    const iceCoords: [number, number][] = [
      [0, 3], [0, 4], [7, 3], [7, 4],
      [3, 0], [4, 0], [3, 7], [4, 7],
      [1, 1], [6, 6]
    ];
    for (let i = 0; i < iceCount; i++) {
      const [r, c] = iceCoords[i % iceCoords.length];
      obstacles.push({ r, c, type: 'ice' });
    }

    goals.push({
      type: 'unlock-chains',
      target: chainCount,
      current: 0,
      label: `Befreie ${chainCount} Ketten`
    });
    goals.push({
      type: 'clear-ice',
      target: iceCount,
      current: 0,
      label: `Schmelze ${iceCount} Eisblöcke`
    });
  } else if (lvl >= 76) {
    // Obsidian Volcano: Rocks + Ice + Color Collection
    const rockCount = Math.min(8, 4 + Math.floor((lvl - 75) * 0.16));
    const rockCoords: [number, number][] = [
      [2, 3], [2, 4], [5, 3], [5, 4],
      [3, 2], [4, 2], [3, 5], [4, 5]
    ];
    for (let i = 0; i < rockCount; i++) {
      const [r, c] = rockCoords[i % rockCoords.length];
      obstacles.push({ r, c, type: 'rock', health: 2 });
    }

    const targetColor: GemColor = GEM_COLORS[lvl % GEM_COLORS.length];
    const colorNames: Record<GemColor, string> = {
      red: 'Rubine',
      blue: 'Saphire',
      green: 'Smaragde',
      yellow: 'Topas-Steine',
      purple: 'Amethyste',
      orange: 'Bernsteine'
    };
    const collectAmount = 25 + Math.floor((lvl - 75) * 0.5);

    goals.push({
      type: 'collect-color',
      target: collectAmount,
      current: 0,
      color: targetColor,
      label: `Sammle ${collectAmount} ${colorNames[targetColor]}`
    });
    goals.push({
      type: 'destroy-rocks',
      target: rockCount,
      current: 0,
      label: `Spreng ${rockCount} Felsen`
    });
  } else {
    // Level 1-10: Color Collection tutorial
    if (lvl >= 5) {
      const targetColor: GemColor = GEM_COLORS[(lvl - 5) % GEM_COLORS.length];
      const colorNames: Record<GemColor, string> = {
        red: 'Rubine',
        blue: 'Saphire',
        green: 'Smaragde',
        yellow: 'Topasse',
        purple: 'Amethyste',
        orange: 'Bernsteine'
      };
      const collectAmount = 15 + lvl * 2;
      goals.push({
        type: 'collect-color',
        target: collectAmount,
        current: 0,
        color: targetColor,
        label: `Sammle ${collectAmount} ${colorNames[targetColor]}`
      });
    }
  }

  return {
    levelNumber: lvl,
    title: `${tierName} · Level ${lvl}`,
    maxMoves,
    targetScore,
    starScores,
    obstacles,
    goals
  };
};
