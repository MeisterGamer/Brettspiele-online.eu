import { 
  UserProfile, 
  VipTierInfo, 
  VipPassMilestone, 
  ShopItem, 
  PlayerQuest, 
  PointTransaction 
} from '../types';

export const VIP_TIERS: VipTierInfo[] = [
  {
    tier: 1,
    name: 'Bronze VIP Pass',
    badge: '🥉 Bronze',
    multiplier: 1.5,
    dailyBonusCoins: 500,
    dailyBonusGems: 2,
    perks: [
      '1.5x Münzen & XP in allen Spielen',
      '500 tägliche Bonus-Münzen',
      'Exklusives Bronze-Wappen für dein Profil',
      'Kostenloser Zugang zu Familien-Turnieren'
    ],
    costCoins: 2500,
    costGems: 20,
    color: '#cd7f32',
  },
  {
    tier: 2,
    name: 'Silber VIP Pass',
    badge: '🥈 Silber',
    multiplier: 2.0,
    dailyBonusCoins: 1200,
    dailyBonusGems: 5,
    perks: [
      '2.0x Münzen & XP in allen Spielen',
      '1.200 tägliche Bonus-Münzen & 5 Edelsteine',
      'Silberner Stern-Avatar-Flair',
      'Tisch-Thema: Antikes Mahagoni-Holz inklusive',
      'Prioritäts-Warteschlange für Spieltische'
    ],
    costCoins: 6000,
    costGems: 50,
    color: '#94a3b8',
  },
  {
    tier: 3,
    name: 'Gold VIP Pass (Empfohlen)',
    badge: '👑 Gold Master',
    multiplier: 2.5,
    dailyBonusCoins: 2500,
    dailyBonusGems: 12,
    perks: [
      '2.5x Münzen & XP in allen Spielen',
      '2.500 tägliche Bonus-Münzen & 12 Edelsteine',
      'Goldene Königskrone als Avatar-Flair',
      'Exklusiver Gold-Drachen Kartenrücken',
      'Tisch-Thema: Royal Green Felt (Turnier-Filz)',
      'Sofortiger Zugriff auf den VIP-Saisonpass'
    ],
    costCoins: 12500,
    costGems: 100,
    color: '#f59e0b',
  },
  {
    tier: 4,
    name: 'Platin VIP Pass',
    badge: '💎 Platin Meister',
    multiplier: 3.0,
    dailyBonusCoins: 5000,
    dailyBonusGems: 25,
    perks: [
      '3.0x Münzen & XP in allen Spielen',
      '5.000 tägliche Bonus-Münzen & 25 Edelsteine',
      'Platin-Heiligenschein & Neon-Cyber Avatar-Aura',
      'Echte Elfenbein-Gravur-Steine für Mahjong Classic',
      'Alle Tisch-Themen dauerhaft freigeschaltet',
      'Unbegrenzte Mahjong-Tipps & Rückgängig-Joker'
    ],
    costCoins: 25000,
    costGems: 200,
    color: '#38bdf8',
  },
  {
    tier: 5,
    name: 'Royal Diamant VIP Pass',
    badge: '✨ Royal Diamant',
    multiplier: 4.0,
    dailyBonusCoins: 10000,
    dailyBonusGems: 50,
    perks: [
      '4.0x Münzen & XP (Maximal-Multiplikator)',
      '10.000 tägliche Bonus-Münzen & 50 Edelsteine',
      'Königliche Diamant-Aura & individuelles Clan-Banner',
      'Zugriff auf alle Premium-Inhalte & zukünftige Spiele',
      'Kostenlose Teilnahme an allen Meisterschafts-Cups',
      'Persönlicher Ehrenplatz in der Ruhmeshalle'
    ],
    costCoins: 50000,
    costGems: 400,
    color: '#ec4899',
  },
];

export const VIP_SEASON_MILESTONES: VipPassMilestone[] = [
  {
    level: 1,
    requiredXp: 200,
    freeReward: { type: 'coins', amount: 300, label: '300 Münzen', icon: '🪙' },
    vipReward: { type: 'gems', amount: 15, label: '15 Edelsteine', icon: '💎' }
  },
  {
    level: 2,
    requiredXp: 500,
    freeReward: { type: 'booster', amount: 2, label: '2x Mahjong-Tipp', icon: '💡', itemId: 'mahjong-hint-pack' },
    vipReward: { type: 'coins', amount: 1200, label: '1.200 Münzen', icon: '🪙' }
  },
  {
    level: 3,
    requiredXp: 900,
    freeReward: { type: 'coins', amount: 600, label: '600 Münzen', icon: '🪙' },
    vipReward: { type: 'item', amount: 1, label: 'Kartenrücken: Royal Blue', icon: '🃏', itemId: 'cardback-royal-blue' }
  },
  {
    level: 4,
    requiredXp: 1400,
    freeReward: { type: 'gems', amount: 5, label: '5 Edelsteine', icon: '💎' },
    vipReward: { type: 'coins', amount: 2000, label: '2.000 Münzen', icon: '🪙' }
  },
  {
    level: 5,
    requiredXp: 2000,
    freeReward: { type: 'item', amount: 1, label: 'Avatar-Titel: Taktiker', icon: '🎖️' },
    vipReward: { type: 'item', amount: 1, label: 'Tisch: Imperial Mahagoni', icon: '🪵', itemId: 'table-mahogany' }
  },
  {
    level: 6,
    requiredXp: 2800,
    freeReward: { type: 'coins', amount: 1000, label: '1.000 Münzen', icon: '🪙' },
    vipReward: { type: 'gems', amount: 30, label: '30 Edelsteine', icon: '💎' }
  },
  {
    level: 7,
    requiredXp: 3800,
    freeReward: { type: 'booster', amount: 3, label: '3x Extrazüge Diamond Blast', icon: '⚡', itemId: 'db-moves-pack' },
    vipReward: { type: 'coins', amount: 3500, label: '3.500 Münzen', icon: '🪙' }
  },
  {
    level: 8,
    requiredXp: 5000,
    freeReward: { type: 'coins', amount: 1500, label: '1.500 Münzen', icon: '🪙' },
    vipReward: { type: 'item', amount: 1, label: 'Avatar-Flair: Goldkrone', icon: '👑', itemId: 'flair-gold-crown' }
  },
  {
    level: 9,
    requiredXp: 6500,
    freeReward: { type: 'gems', amount: 10, label: '10 Edelsteine', icon: '💎' },
    vipReward: { type: 'coins', amount: 5000, label: '5.000 Münzen', icon: '🪙' }
  },
  {
    level: 10,
    requiredXp: 8500,
    freeReward: { type: 'item', amount: 1, label: 'Tisch: Mitternachts-Schiefer', icon: '🌌', itemId: 'table-slate' },
    vipReward: { type: 'item', amount: 1, label: 'Spezial-Mahjong-Set: Drachen-Elfenbein', icon: '🀄', itemId: 'mahjong-dragon-tiles' }
  },
  {
    level: 11,
    requiredXp: 11000,
    freeReward: { type: 'coins', amount: 2000, label: '2.000 Münzen', icon: '🪙' },
    vipReward: { type: 'gems', amount: 50, label: '50 Edelsteine', icon: '💎' }
  },
  {
    level: 12,
    requiredXp: 14000,
    freeReward: { type: 'item', amount: 1, label: 'Kartenrücken: Retro Vintage', icon: '🂠', itemId: 'cardback-vintage' },
    vipReward: { type: 'coins', amount: 8000, label: '8.000 Münzen', icon: '🪙' }
  },
  {
    level: 13,
    requiredXp: 18000,
    freeReward: { type: 'gems', amount: 20, label: '20 Edelsteine', icon: '💎' },
    vipReward: { type: 'item', amount: 1, label: 'Tisch: Sternenhimmel Galaxie', icon: '✨', itemId: 'table-galaxy' }
  },
  {
    level: 14,
    requiredXp: 23000,
    freeReward: { type: 'coins', amount: 3500, label: '3.500 Münzen', icon: '🪙' },
    vipReward: { type: 'gems', amount: 75, label: '75 Edelsteine', icon: '💎' }
  },
  {
    level: 15,
    requiredXp: 30000,
    freeReward: { type: 'item', amount: 1, label: 'Ruhmeshallen-Titel: Großmeister', icon: '🏆' },
    vipReward: { type: 'item', amount: 1, label: 'Royal Diamant Halo (Legende)', icon: '💎', itemId: 'flair-diamond-halo' }
  }
];

export const SHOP_ITEMS: ShopItem[] = [
  // Tisch-Motive (Table Themes)
  {
    id: 'table-felt-green',
    name: 'Klassischer Spieltisch (Grüner Filz)',
    category: 'table',
    description: 'Traditioneller Casino- und Meisterschaftsfilz mit weicher Textur und gedämpftem Würfelklang.',
    costCoins: 800,
    costGems: 0,
    icon: '🟩',
    rarity: 'common'
  },
  {
    id: 'table-mahogany',
    name: 'Antikes Mahagoni-Holz',
    category: 'table',
    description: 'Edles poliertes Kirsch- und Mahagoniholz mit dezenter Maserung für gemütliche Spieleabende.',
    costCoins: 2200,
    costGems: 15,
    icon: '🪵',
    rarity: 'rare'
  },
  {
    id: 'table-slate',
    name: 'Mitternachts-Schiefer (Zen Slate)',
    category: 'table',
    description: 'Moderner dunkler Schiefer mit feinen Linien, optimal für konzentriertes taktisches Spiel.',
    costCoins: 3500,
    costGems: 25,
    icon: '⬛',
    rarity: 'rare'
  },
  {
    id: 'table-fireplace',
    name: 'Kaminzimmer & Warmes Holz',
    category: 'table',
    description: 'Wohliges Ambiente mit warmem Kaminfeuerschein und rustikaler Eichenoptik.',
    costCoins: 4800,
    costGems: 35,
    icon: '🔥',
    rarity: 'epic'
  },
  {
    id: 'table-galaxy',
    name: 'Sternenhimmel Galaxie',
    category: 'table',
    description: 'Faszinierender Weltraum-Look mit leuchtenden Nebeln und funkelnden Sternbildern.',
    costCoins: 8500,
    costGems: 60,
    icon: '✨',
    rarity: 'legendary',
    vipRequiredTier: 2
  },

  // Kartenrücken & Motive (Cards & Tiles)
  {
    id: 'cardback-vintage',
    name: 'Klassik Nostalgie 1920',
    category: 'cards',
    description: 'Filigran gravierte Ornamente im Stil historischer europäischer Spielkarten.',
    costCoins: 1200,
    costGems: 10,
    icon: '🂠',
    rarity: 'common'
  },
  {
    id: 'cardback-royal-blue',
    name: 'Königliches Saphirblau',
    category: 'cards',
    description: 'Tiefblaues Kartenblatt mit goldgeprägten königlichen Kronen.',
    costCoins: 2800,
    costGems: 20,
    icon: '🔷',
    rarity: 'rare'
  },
  {
    id: 'cardback-dragon-gold',
    name: 'Goldener Kaiserdrache',
    category: 'cards',
    description: 'Chinesischer Meisterdrache in glänzender Goldfolien-Prägung.',
    costCoins: 5500,
    costGems: 40,
    icon: '🐉',
    rarity: 'epic',
    vipRequiredTier: 2
  },
  {
    id: 'mahjong-dragon-tiles',
    name: 'Drachen-Elfenbein Mahjong Steine',
    category: 'cards',
    description: 'Hochwertig gravierte Elfenbein-Steine mit handkolorierten Jade- und Zinnober-Details.',
    costCoins: 7500,
    costGems: 50,
    icon: '🀄',
    rarity: 'legendary',
    vipRequiredTier: 3
  },

  // Avatar-Kosmetik & Flairs
  {
    id: 'flair-laurel',
    name: 'Meister-Lorbeerkranz',
    category: 'avatar',
    description: 'Goldener Siegerkranz für deinen Profil-Avatar.',
    costCoins: 1500,
    costGems: 10,
    icon: '🌿',
    rarity: 'common'
  },
  {
    id: 'flair-gold-crown',
    name: 'Königliche Goldkrone',
    category: 'avatar',
    description: 'Leuchtende Krone mit funkelnden Rubinen.',
    costCoins: 4000,
    costGems: 30,
    icon: '👑',
    rarity: 'epic',
    vipRequiredTier: 1
  },
  {
    id: 'flair-cyber-visor',
    name: 'Cyber-Neon Visier',
    category: 'avatar',
    description: 'Futuristisches holografisches Leuchtvisier mit Cyberpunk-Effekt.',
    costCoins: 6000,
    costGems: 45,
    icon: '🕶️',
    rarity: 'epic'
  },
  {
    id: 'flair-diamond-halo',
    name: 'Royal Diamant Halo',
    category: 'avatar',
    description: 'Majestätischer funkelnder Diamant-Ring über dem Kopf.',
    costCoins: 12000,
    costGems: 90,
    icon: '💎',
    rarity: 'legendary',
    vipRequiredTier: 3
  },

  // Booster & Powerups
  {
    id: 'mahjong-hint-pack',
    name: '5x Mahjong Freie-Paare Tipp-Paket',
    category: 'booster',
    description: 'Hebt sofort ein beliebiges abräumbares Paar hervor, ohne Punktabzug.',
    costCoins: 500,
    costGems: 0,
    icon: '💡',
    rarity: 'common'
  },
  {
    id: 'mahjong-undo-pack',
    name: '5x Mahjong Rückgängig-Joker',
    category: 'booster',
    description: 'Mache fehlerhafte Züge risikofrei rückgängig und erhalte deine Punkte zurück.',
    costCoins: 400,
    costGems: 0,
    icon: '↩️',
    rarity: 'common'
  },
  {
    id: 'db-moves-pack',
    name: 'Diamond Blast +5 Extrazüge Paket',
    category: 'booster',
    description: 'Rette knappe Runden in Diamond Blast mit 5 zusätzlichen Zügen.',
    costCoins: 750,
    costGems: 5,
    icon: '⚡',
    rarity: 'rare'
  },
  {
    id: 'xp-multiplier-booster',
    name: '2x Doppel-XP Trank (2 Stunden)',
    category: 'booster',
    description: 'Verdoppelt 2 Stunden lang alle verdienten Erfahrungspunkte in allen Spielen.',
    costCoins: 1200,
    costGems: 10,
    icon: '🧪',
    rarity: 'rare'
  }
];

export const INITIAL_PLAYER_QUESTS: PlayerQuest[] = [
  {
    id: 'quest_mahjong_1',
    title: 'Meister der Ziegel',
    description: 'Spiele 1 Partie Mahjong (Mojang) Classic in beliebigem Level',
    progress: 0,
    target: 1,
    rewardCoins: 350,
    rewardXp: 80,
    rewardGems: 2,
    category: 'daily',
    isCompleted: false,
    isClaimed: false,
    icon: '🀄'
  },
  {
    id: 'quest_diamond_1',
    title: 'Edelstein-Kettenreaktion',
    description: 'Schließe 1 Level in Diamond Blast mit mindestens 2 Sternen ab',
    progress: 0,
    target: 1,
    rewardCoins: 400,
    rewardXp: 100,
    rewardGems: 3,
    category: 'daily',
    isCompleted: false,
    isClaimed: false,
    icon: '💎'
  },
  {
    id: 'quest_table_duel',
    title: 'Familientisch-Duell',
    description: 'Spiele eine Runde Vier Gewinnt, Schach oder Ludo gegen Mitspieler oder Bot',
    progress: 0,
    target: 1,
    rewardCoins: 300,
    rewardXp: 75,
    category: 'daily',
    isCompleted: false,
    isClaimed: false,
    icon: '🎲'
  },
  {
    id: 'quest_weekly_champion',
    title: 'Wöchentlicher Spiele-Marathon',
    description: 'Absolviere 5 beliebige Spielrunden in dieser Woche',
    progress: 1,
    target: 5,
    rewardCoins: 1800,
    rewardXp: 350,
    rewardGems: 25,
    category: 'weekly',
    isCompleted: false,
    isClaimed: false,
    icon: '🏆'
  },
  {
    id: 'quest_weekly_mahjong',
    title: 'Mahjong-Reise 2026',
    description: 'Räume insgesamt mindestens 100 Mahjong-Steinpaare ab',
    progress: 18,
    target: 100,
    rewardCoins: 2500,
    rewardXp: 500,
    rewardGems: 35,
    category: 'weekly',
    isCompleted: false,
    isClaimed: false,
    icon: '⛩️'
  }
];

export const getPlayerRankTitle = (level: number): { title: string; badge: string; color: string } => {
  if (level >= 50) return { title: 'Unsterbliche Legende', badge: '👑 Stufe 50', color: 'text-fuchsia-400' };
  if (level >= 40) return { title: 'Großmeister der Spiele', badge: '🏆 Stufe 40', color: 'text-amber-300' };
  if (level >= 30) return { title: 'Meister-Stratege', badge: '💎 Stufe 30', color: 'text-cyan-400' };
  if (level >= 20) return { title: 'Turnier-Veteran', badge: '⚔️ Stufe 20', color: 'text-emerald-400' };
  if (level >= 10) return { title: 'Erfahrener Spieler', badge: '🥈 Stufe 10', color: 'text-sky-300' };
  if (level >= 5)  return { title: 'Spiele-Geselle', badge: '🥉 Stufe 5', color: 'text-orange-300' };
  return { title: 'Neu am Tisch (Lehrling)', badge: '🌱 Stufe 1', color: 'text-slate-300' };
};

export const getXpForNextLevel = (level: number): number => {
  return Math.round(500 * Math.pow(1.22, Math.max(0, level - 1)));
};
