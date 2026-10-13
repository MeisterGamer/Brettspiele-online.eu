import { GameInfo, GameCategory } from '../types';

// High-resolution real photography assets
export const HERO_BANNER_IMAGE = 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=85';
export const HERO_BANNER_FALLBACK = 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=1600&q=85';

// Real Table Ambiance Backgrounds for game arenas
export const TABLE_BACKGROUNDS = {
  mahogany: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=1400&q=85', // Polished dark wood table
  feltGreen: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1400&q=85', // Casino green felt
  hearthCozy: 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=1400&q=85', // Cozy warm living room
  terraceGarden: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1400&q=85', // Bright family table
  oceanRadar: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1400&q=85', // Deep blue ocean waters
  slateZen: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1400&q=85', // Slate stone texture
};

// Real Naval Fleet Warship Photography for Battleship
export const NAVAL_FLEET_PHOTOS = {
  carrier: {
    name: 'Aircraft Carrier (Flugzeugträger)',
    size: 4,
    photo: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
    type: 'Supercarrier',
  },
  battleship: {
    name: 'Battleship (Schlachtschiff)',
    size: 3,
    photo: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80',
    type: 'Heavy Armor Dreadnought',
  },
  cruiser: {
    name: 'Guided Missile Cruiser (Kreuzer)',
    size: 3,
    photo: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=600&q=80',
    type: 'Aegis Radar Cruiser',
  },
  submarine: {
    name: 'Nuclear Submarine (U-Boot)',
    size: 2,
    photo: 'https://images.unsplash.com/photo-1516981879613-9f5da904015f?auto=format&fit=crop&w=600&q=80',
    type: 'Stealth Hunter-Killer',
  },
  destroyer: {
    name: 'Patrol Destroyer (Zerstörer)',
    size: 2,
    photo: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=600&q=80',
    type: 'Fast Response Vessel',
  },
};

// Curated authentic real photography for every game in the catalog
export const SPECIFIC_GAME_IMAGES: Record<string, string> = {
  // --- CORE PLAYABLE HIGHLIGHTS ---
  'connect-four': 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=700&q=85',
  'fam-cards': 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=700&q=85',
  'checkers': 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=700&q=85',
  'battleship': 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=700&q=85',
  'yatzy': 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=700&q=85',
  'memory-match': 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=700&q=85',
  'dots-boxes': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=700&q=85',
  'tictactoe-gomoku': 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=700&q=85',

  // --- CARD GAMES ---
  'hearts': 'https://images.unsplash.com/photo-1516981879613-9f5da904015f?auto=format&fit=crop&w=700&q=85',
  'spades': 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=700&q=85',
  'rummy': 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=700&q=85',
  'go-fish': 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&w=700&q=85',
  'solitaire-klondike': 'https://images.unsplash.com/photo-1516981879613-9f5da904015f?auto=format&fit=crop&w=700&q=85',
  'war-card-game': 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=700&q=85',
  'blackjack-family': 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=700&q=85',
  'canasta': 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=700&q=85',
  'cribbage': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=85',
  'mau-mau': 'https://images.unsplash.com/photo-1516981879613-9f5da904015f?auto=format&fit=crop&w=700&q=85',
  'old-maid': 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=700&q=85',
  'snap': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=700&q=85',
  'speed-cards': 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=700&q=85',
  'tarneeb': 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=700&q=85',
  'scopa': 'https://images.unsplash.com/photo-1516981879613-9f5da904015f?auto=format&fit=crop&w=700&q=85',
  'belote': 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=700&q=85',
  'skat': 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=700&q=85',
  'doppelkopf': 'https://images.unsplash.com/photo-1516981879613-9f5da904015f?auto=format&fit=crop&w=700&q=85',
  'schnapsen': 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=700&q=85',
  'whist': 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=700&q=85',

  // --- BOARD GAMES ---
  'chess': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=700&q=85',
  'ludo': 'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=700&q=85',
  'reversi': 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=700&q=85',
  'backgammon': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=85',
  'mancala': 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=700&q=85',
  'chinese-checkers': 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=700&q=85',
  'go-board-game': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=700&q=85',
  'nine-mens-morris': 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=700&q=85',
  'halma': 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=700&q=85',
  'snakes-ladders': 'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=700&q=85',
  'goose-game': 'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=700&q=85',
  'peg-solitaire': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=85',
  'dominoes-draw': 'https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&w=700&q=85',
  'mexican-train': 'https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&w=700&q=85',
  'shogi': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=700&q=85',
  'xiangqi': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=700&q=85',
  'senet': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=85',
  'royal-game-ur': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=85',

  // --- DICE GAMES ---
  'farkle': 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=700&q=85',
  'liars-dice': 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=700&q=85',
  'shut-the-box': 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=700&q=85',
  'bunco': 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=700&q=85',
  'pig-dice': 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=700&q=85',
  'beetle-game': 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=700&q=85',
  'cee-lo': 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=700&q=85',

  // --- PARTY & BRAIN GAMES ---
  'word-scramble': 'https://images.unsplash.com/photo-1591635566278-10dca0ca76ee?auto=format&fit=crop&w=700&q=85',
  'hangman-family': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=700&q=85',
  'trivia-quest': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=85',
  'simon-memory': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=700&q=85',
  'sliding-puzzle': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=85',
  'sudoku-family': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=700&q=85',
  'charades-timer': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=85',
  'pictionary-sketch': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=700&q=85',
  'reaction-tap': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=700&q=85',
  'tower-balance': 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=700&q=85',
};

// Rich curated photos for classic expanded heritage catalog
export const HERITAGE_CLASSIC_PHOTOS: string[] = [
  'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=700&q=85', // Rummy 500
  'https://images.unsplash.com/photo-1516981879613-9f5da904015f?auto=format&fit=crop&w=700&q=85', // Indian Rummy
  'https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&w=700&q=85', // Okey Tiles
  'https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&w=700&q=85', // Mahjong Traditional
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=85', // Mahjong Solitaire
  'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=700&q=85', // Pachisi
  'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=700&q=85', // Chaupar
  'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=700&q=85', // Yut Nori
  'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=700&q=85', // Surakarta
  'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=700&q=85', // Fanorona
  'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=700&q=85', // Alquerque
  'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=700&q=85', // Bagh-Chal
  'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=700&q=85', // Fox & Geese
  'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=700&q=85', // Tablut Hnefatafl
  'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=700&q=85', // Brandub
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=85', // Daldos
  'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=700&q=85', // Puluc
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=85', // Patolli
  'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=700&q=85', // Achi
  'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=700&q=85', // Shisima
  'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=700&q=85', // Mu Torere
  'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=700&q=85', // Picaria
  'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=700&q=85', // Petteia
  'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=700&q=85', // Ludus Latrunculorum
  'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=700&q=85', // Rithmomachia
  'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=700&q=85', // Barricade
  'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=700&q=85', // Coppit
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=700&q=85', // Dudo
  'https://images.unsplash.com/photo-1516981879613-9f5da904015f?auto=format&fit=crop&w=700&q=85', // Karnoffel
  'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=700&q=85', // Tarot
  'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=700&q=85', // Jass
  'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=700&q=85', // Klaverjas
  'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=700&q=85', // Truco
  'https://images.unsplash.com/photo-1516981879613-9f5da904015f?auto=format&fit=crop&w=700&q=85', // Sueca
  'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=700&q=85', // Mus
  'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=700&q=85', // Ronda
  'https://images.unsplash.com/photo-1516981879613-9f5da904015f?auto=format&fit=crop&w=700&q=85', // Tressette
  'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=700&q=85', // Biskoz
];

export const CATEGORY_FALLBACK_IMAGES: Record<GameCategory, string> = {
  all: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=700&q=85',
  cards: 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=700&q=85',
  board: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=700&q=85',
  dice: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=700&q=85',
  strategy: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=700&q=85',
  party: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=85',
  kids: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=700&q=85',
};

export const getGameImage = (game: GameInfo): string => {
  if (game.imageUrl) return game.imageUrl;
  if (SPECIFIC_GAME_IMAGES[game.id]) return SPECIFIC_GAME_IMAGES[game.id];

  // Classic dynamic list IDs (classic-1, classic-2, ...)
  if (game.id.startsWith('classic-')) {
    const num = parseInt(game.id.replace('classic-', ''), 10) - 1;
    if (num >= 0 && num < HERITAGE_CLASSIC_PHOTOS.length) {
      return HERITAGE_CLASSIC_PHOTOS[num];
    }
  }

  return CATEGORY_FALLBACK_IMAGES[game.category] || CATEGORY_FALLBACK_IMAGES.all;
};
