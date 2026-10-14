export type GameCategory = 
  | 'all'
  | 'cards'
  | 'board'
  | 'dice'
  | 'party'
  | 'strategy'
  | 'kids';

export type GameEngineType = 
  | 'ludo' // Mensch ärgere Dich nicht with authentic 3D wooden Halma cones
  | 'chess' // Classic Chess with authentic Staunton wooden figures
  | 'connect-four'
  | 'fam-cards' // Uno-style
  | 'checkers'
  | 'battleship'
  | 'yatzy'
  | 'memory-match'
  | 'dots-boxes'
  | 'tictactoe'
  | 'catalog-simulation';

export interface GameInfo {
  id: string;
  title: string;
  category: GameCategory;
  categories?: GameCategory[];
  players: string; // "2-4 Players"
  duration: string; // "10-15 Min"
  minAge: number; // 3, 6, 8, 10
  description: string;
  rulesSummary: string;
  tags: string[];
  engine: GameEngineType;
  featured?: boolean;
  icon: string;
  imageUrl?: string;
  difficulty: 'Easy' | 'Medium' | 'Challenging';
  rating: number; // e.g. 4.9
  playsCount: number;
  disabled?: boolean;
  maintenance?: boolean;
}

export type AvatarFlair = 'none' | 'wood' | 'gold-vip' | 'neon' | 'diamond' | 'rainbow';

export interface AvatarConfig {
  skinTone: string; // hex
  hairStyle: 'curly' | 'spiky' | 'straight' | 'bun' | 'cap' | 'ponytail' | 'grandpa' | 'afro';
  hairColor: string; // hex
  eyes: 'happy' | 'sparkle' | 'cool' | 'glasses' | 'wink';
  mouth: 'smile' | 'grin' | 'laugh' | 'neutral';
  outfit: 'hoodie' | 'tshirt' | 'jersey' | 'royal' | 'dino' | 'wizard';
  outfitColor: string; // hex
  accessory: 'none' | 'headphones' | 'crown' | 'party-hat' | 'mustache' | 'star';
  flair: AvatarFlair;
}

export type UserRole = 'admin' | 'moderator' | 'user';

export interface MatchHistoryItem {
  id: string;
  gameId: string;
  gameTitle: string;
  result: 'won' | 'lost' | 'draw';
  score: number;
  opponentName: string;
  date: string;
  xpEarned: number;
  coinsEarned: number;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  role?: UserRole;
  familyRole: 'Child' | 'Teen' | 'Parent' | 'Grandparent' | 'Family Champion';
  clanName: string;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  isVip: boolean;
  isBanned?: boolean;
  banReason?: string;
  joinedDate?: string;
  avatar: AvatarConfig;
  streakDays: number;
  lastDailyClaim: string; // YYYY-MM-DD
  matchHistory?: MatchHistoryItem[];
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    tournamentsWon: number;
    favoriteGame: string;
  };
}

export interface ParentalControls {
  enabled: boolean;
  pin: string;
  dailyScreenLimitMinutes: number; // e.g. 60
  screenTimeUsedMinutes: number;
  bedtimeStart: string; // "20:30"
  bedtimeEnd: string; // "07:00"
  maxAgeRating: number; // e.g. 7 or 12 or 99
  chatSafety: 'strict' | 'family-filtered' | 'open';
  voiceChatAllowed: boolean;
  requireApprovalForTournaments: boolean;
  sessionLog: {
    id: string;
    gameTitle: string;
    startedAt: string;
    durationMinutes: number;
  }[];
}

export interface VoiceParticipant {
  id: string;
  name: string;
  avatar: AvatarConfig;
  isSpeaking: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  audioFilter: 'clean' | 'walkie-talkie' | 'chipmunk' | 'robot';
  volume: number;
}

export interface RoomParticipant {
  id: string;
  name: string;
  avatar: AvatarConfig;
  isHost: boolean;
  isReady: boolean;
  score: number;
  ping: number;
  isBot?: boolean;
  seatIndex?: number;
}

export interface GameRoom {
  id: string;
  code: string;
  name: string;
  gameId: string;
  gameTitle: string;
  isPrivate: boolean;
  hostName: string;
  maxPlayers: number;
  currentPlayers: number;
  participants: RoomParticipant[];
  status: 'lobby' | 'in-game' | 'finished';
  voiceChatActive: boolean;
  createdAt: string;
}

export interface Tournament {
  id: string;
  title: string;
  gameTitle: string;
  gameId: string;
  season: string;
  bannerColor: string;
  startsInHours: number;
  endsInDays: number;
  prizePool: string;
  participantsCount: number;
  registered: boolean;
  stages: 'Registration' | 'Qualifiers' | 'Quarter Finals' | 'Grand Finale';
  leaderboard: {
    rank: number;
    familyClan: string;
    points: number;
    wins: number;
  }[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'family' | 'board' | 'cards' | 'tournament' | 'social';
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  xpReward: number;
  coinReward: number;
}

export interface ModerationReport {
  id: string;
  reportedUser: string;
  reportedBy: string;
  reason: 'inappropriate_name' | 'chat_profanity' | 'griefing_afk' | 'suspicious_behavior';
  timestamp: string;
  status: 'pending' | 'resolved' | 'dismissed';
  roomCode: string;
  chatSnippet?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'tournament' | 'reward' | 'parental' | 'invite' | 'system';
  timestamp: string;
  read: boolean;
}

export type SupportedLanguage = 'en' | 'de' | 'es' | 'fr' | 'it' | 'ja';
