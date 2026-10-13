import React, { useState, useEffect } from 'react';
import { 
  GameInfo, 
  GameCategory, 
  UserProfile, 
  ParentalControls, 
  GameRoom, 
  Tournament, 
  Achievement, 
  ModerationReport, 
  SystemNotification, 
  SupportedLanguage,
  VoiceParticipant
} from './types';
import { gamesCatalog } from './data/gamesCatalog';
import { 
  initialUserProfile, 
  initialParentalControls, 
  initialTournaments, 
  initialAchievements, 
  initialPublicRooms, 
  initialModerationReports, 
  initialNotifications 
} from './data/mockData';
import { sound } from './services/sound';
import { getTranslation } from './services/i18n';
import { HERO_BANNER_IMAGE, HERO_BANNER_FALLBACK, getGameImage } from './services/gameImages';

// Components
import { AvatarDisplay } from './components/avatar/AvatarDisplay';
import { AvatarStudioModal } from './components/avatar/AvatarStudioModal';
import { VoiceChatPanel } from './components/voice/VoiceChatPanel';
import { RoomManagerModal } from './components/rooms/RoomManagerModal';
import { ShareModal } from './components/rooms/ShareModal';
import { ParentalControlsModal } from './components/parental/ParentalControlsModal';
import { TournamentModal } from './components/tournaments/TournamentModal';
import { LeaderboardModal } from './components/leaderboards/LeaderboardModal';
import { AchievementsModal } from './components/achievements/AchievementsModal';
import { VipModal } from './components/vip/VipModal';
import { DailyRewardModal } from './components/rewards/DailyRewardModal';
import { AdminDashboardModal } from './components/admin/AdminDashboardModal';
import { NotificationCenter } from './components/notifications/NotificationCenter';

// Playable Game Engines
import { ConnectFour } from './components/games/ConnectFour';
import { FamCardsUno } from './components/games/FamCardsUno';
import { CheckersGame } from './components/games/CheckersGame';
import { BattleshipGame } from './components/games/BattleshipGame';
import { YatzyGame } from './components/games/YatzyGame';
import { MemoryMatchGame } from './components/games/MemoryMatchGame';
import { DotsAndBoxesGame } from './components/games/DotsAndBoxesGame';
import { TicTacToeGame } from './components/games/TicTacToeGame';
import { CatalogQuickPlay } from './components/games/CatalogQuickPlay';

// Icons
import { 
  Gamepad2, 
  Trophy, 
  Award, 
  ShieldCheck, 
  Crown, 
  Gift, 
  Users, 
  Search, 
  Volume2, 
  VolumeX, 
  Globe, 
  Flame, 
  Coins, 
  Sparkles, 
  ArrowLeft, 
  Share2, 
  Sliders, 
  Baby, 
  Star, 
  Check, 
  Clock, 
  Play,
  Settings,
  HelpCircle
} from 'lucide-react';

export default function App() {
  // App state
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile>(initialUserProfile);
  const [parental, setParental] = useState<ParentalControls>(initialParentalControls);
  const [publicRooms, setPublicRooms] = useState<GameRoom[]>(initialPublicRooms);
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments);
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements);
  const [reports, setReports] = useState<ModerationReport[]>(initialModerationReports);
  const [notifications, setNotifications] = useState<SystemNotification[]>(initialNotifications);
  
  // Navigation & UI mode
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [kidsMode, setKidsMode] = useState<boolean>(false);
  const [activeGame, setActiveGame] = useState<GameInfo | null>(null);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>({
    id: 'room_live',
    code: 'FAM-777',
    name: "Alex's Family Table",
    gameId: 'connect-four',
    gameTitle: 'Connect Four (Vier Gewinnt)',
    isPrivate: false,
    hostName: 'Alex Gamer',
    maxPlayers: 4,
    currentPlayers: 1,
    status: 'in-game',
    voiceChatActive: true,
    createdAt: 'Just now',
    participants: [
      {
        id: 'usr_me',
        name: 'Alex Gamer',
        avatar: initialUserProfile.avatar,
        isHost: true,
        isReady: true,
        score: 0,
        ping: 18,
      }
    ],
  });
  const [globalAnnouncement, setGlobalAnnouncement] = useState<string | null>(
    '🏆 October Family Grandmaster Cup is LIVE! Play FamCards to earn clan points!'
  );

  // Modals
  const [isAvatarOpen, setIsAvatarOpen] = useState<boolean>(false);
  const [isRoomManagerOpen, setIsRoomManagerOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isParentalOpen, setIsParentalOpen] = useState<boolean>(false);
  const [isTourneyOpen, setIsTourneyOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState<boolean>(false);
  const [isVipOpen, setIsVipOpen] = useState<boolean>(false);
  const [isDailyOpen, setIsDailyOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Voice Chat participants in current table (starts empty, real family joins dynamically)
  const [voiceParticipants, setVoiceParticipants] = useState<VoiceParticipant[]>([]);

  const t = (key: string) => getTranslation(language, key);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
    if (next) sound.playClick();
  };

  const handleLaunchGame = (game: GameInfo) => {
    // Check parental controls age rating
    if (parental.enabled && game.minAge > parental.maxAgeRating) {
      sound.playError();
      setIsParentalOpen(true);
      return;
    }
    sound.playReward();
    setActiveGame(game);
  };

  const handleGameCompletion = (result: any) => {
    // Add XP & Coins with VIP bonus multiplier
    const multiplier = user.isVip ? 2 : 1;
    const earnedCoins = 100 * multiplier;
    const earnedXp = 150 * multiplier;

    setUser((prev) => ({
      ...prev,
      coins: prev.coins + earnedCoins,
      xp: prev.xp + earnedXp,
      stats: {
        ...prev.stats,
        gamesPlayed: prev.stats.gamesPlayed + 1,
        gamesWon: prev.stats.gamesWon + 1,
      },
    }));

    // Update screen time session
    setParental((prev) => ({
      ...prev,
      screenTimeUsedMinutes: prev.screenTimeUsedMinutes + 10,
    }));
  };

  // Filter games based on search, category, kids mode, and parental rating
  const filteredGames = gamesCatalog.filter((game) => {
    if (kidsMode && game.minAge > 5) return false;
    if (parental.enabled && game.minAge > parental.maxAgeRating) return false;
    if (selectedCategory !== 'all' && game.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = game.title.toLowerCase().includes(q);
      const matchDesc = game.description.toLowerCase().includes(q);
      const matchTag = game.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* 1. TOP GLOBAL LIVE ANNOUNCEMENT BANNER */}
      {globalAnnouncement && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-4 py-2 text-xs font-bold text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 mx-auto">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>{globalAnnouncement}</span>
          </div>
          <button
            onClick={() => setGlobalAnnouncement(null)}
            className="text-white/80 hover:text-white text-xs font-semibold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. PRIMARY NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Logo & Platform Name */}
          <div
            onClick={() => {
              sound.playClick();
              setActiveGame(null);
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white leading-none">
                  Fam<span className="text-amber-400">Play</span>
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full">
                  Arcade
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                100+ Classic Card & Board Games
              </p>
            </div>
          </div>

          {/* User Currency & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Coins & Streak */}
            <button
              onClick={() => {
                sound.playReward();
                setIsDailyOpen(true);
              }}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 px-3 py-1.5 rounded-2xl transition shadow-sm"
              title="Daily Bonus Calendar"
            >
              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                <Coins className="w-4 h-4 fill-current" />
                <span className="font-mono">{user.coins.toLocaleString()}</span>
              </div>
              <div className="h-3 w-px bg-slate-700 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-1 text-orange-400 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{user.streakDays}d Streak</span>
              </div>
            </button>

            {/* VIP Pass Button */}
            <button
              onClick={() => {
                sound.playClick();
                setIsVipOpen(true);
              }}
              className={`px-3 py-1.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition shadow-md ${
                user.isVip
                  ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300/60'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40'
              }`}
            >
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">VIP Pass</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition border border-slate-700/60"
              title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => {
                  sound.playClick();
                  setLanguage(e.target.value as SupportedLanguage);
                }}
                className="bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200 font-bold rounded-2xl px-2.5 py-2 cursor-pointer focus:outline-none focus:border-amber-400"
              >
                <option value="en">🇬🇧 EN</option>
                <option value="de">🇩🇪 DE</option>
                <option value="es">🇪🇸 ES</option>
                <option value="fr">🇫🇷 FR</option>
                <option value="it">🇮🇹 IT</option>
                <option value="ja">🇯🇵 JA</option>
              </select>
            </div>

            {/* Notifications Dropdown */}
            <NotificationCenter
              notifications={notifications}
              onMarkAllRead={() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
              }}
              onClear={() => setNotifications([])}
            />

            {/* Profile & Avatar studio launcher */}
            <button
              onClick={() => {
                sound.playClick();
                setIsAvatarOpen(true);
              }}
              className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-2xl transition"
            >
              <AvatarDisplay avatar={user.avatar} size="sm" showBadge={user.familyRole.slice(0, 1)} />
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-white leading-tight">{user.name}</div>
                <div className="text-[10px] text-amber-400 font-semibold">{user.familyRole}</div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* 3. SUB-NAV / QUICK ACTION TOOLBAR */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Quick Hub Launchers */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => { sound.playClick(); setIsRoomManagerOpen(true); }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
            >
              <Users className="w-3.5 h-3.5" /> {t('rooms_title')}
            </button>

            <button
              onClick={() => { sound.playClick(); setIsTourneyOpen(true); }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs transition flex items-center gap-1.5 shrink-0 border border-slate-700"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> {t('tournaments')}
            </button>

            <button
              onClick={() => { sound.playClick(); setIsLeaderboardOpen(true); }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center gap-1.5 shrink-0 border border-slate-700"
            >
              <Award className="w-3.5 h-3.5 text-indigo-400" /> {t('leaderboards')}
            </button>

            <button
              onClick={() => { sound.playClick(); setIsAchievementsOpen(true); }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center gap-1.5 shrink-0 border border-slate-700"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> {t('achievements')}
            </button>

            <button
              onClick={() => { sound.playClick(); setIsParentalOpen(true); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shrink-0 border ${
                parental.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {t('parental_controls')}
            </button>

            <button
              onClick={() => { sound.playClick(); setIsAdminOpen(true); }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold text-xs transition flex items-center gap-1.5 shrink-0 border border-slate-700"
            >
              <Sliders className="w-3.5 h-3.5 text-rose-400" /> {t('admin_panel')}
            </button>
          </div>

          {/* Kids Mode Switch & Share */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.playReward();
                setKidsMode((k) => !k);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                kidsMode
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Baby className="w-3.5 h-3.5" />
              <span>{t('kids_mode')}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setIsShareOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Invite</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. ACTIVE GAME ARENA OR BROWSE CATALOG */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        {activeGame ? (
          /* ACTIVE GAME VIEW */
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Arena Top Bar with Real Game Photo */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveGame(null);
                  }}
                  className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-2 border border-slate-700 shadow"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('back_to_lobby')}
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-lg relative shrink-0">
                    <img
                      src={getGameImage(activeGame)}
                      alt={activeGame.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/20" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold font-display text-white flex items-center gap-2">
                      <span>{activeGame.title}</span>
                      <span className="text-base">{activeGame.icon}</span>
                    </h2>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="text-amber-400 font-semibold">{activeGame.players}</span>
                      <span>•</span>
                      <span>Age {activeGame.minAge}+</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">{t('one_hundred_playable')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 relative z-10">
                <button
                  onClick={() => setIsShareOpen(true)}
                  className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center gap-1.5 border border-slate-700"
                >
                  <Share2 className="w-3.5 h-3.5 text-sky-400" /> Share Table
                </button>
              </div>
            </div>

            {/* INTEGRATED VOICE CHAT BAR (Connected to table) */}
            <VoiceChatPanel
              currentUser={user}
              participants={voiceParticipants}
              voiceAllowedByParent={!parental.enabled || parental.voiceChatAllowed}
              roomCode={currentRoom?.code || 'FAM-101'}
              onInvite={() => setIsShareOpen(true)}
            />

            {/* GAME ENGINE CONTAINER */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl min-h-[500px] flex items-center justify-center">
              {activeGame.engine === 'connect-four' && (
                <ConnectFour onGameEnd={handleGameCompletion} />
              )}
              {activeGame.engine === 'fam-cards' && (
                <FamCardsUno onGameEnd={handleGameCompletion} />
              )}
              {activeGame.engine === 'checkers' && (
                <CheckersGame onGameEnd={handleGameCompletion} />
              )}
              {activeGame.engine === 'battleship' && (
                <BattleshipGame onGameEnd={handleGameCompletion} />
              )}
              {activeGame.engine === 'yatzy' && (
                <YatzyGame onGameEnd={handleGameCompletion} />
              )}
              {activeGame.engine === 'memory-match' && (
                <MemoryMatchGame onGameEnd={handleGameCompletion} />
              )}
              {activeGame.engine === 'dots-boxes' && (
                <DotsAndBoxesGame onGameEnd={handleGameCompletion} />
              )}
              {activeGame.engine === 'tictactoe' && (
                <TicTacToeGame onGameEnd={handleGameCompletion} />
              )}
              {activeGame.engine === 'catalog-simulation' && (
                <CatalogQuickPlay game={activeGame} onGameEnd={handleGameCompletion} />
              )}
            </div>
          </div>
        ) : (
          /* ARCADE LIBRARY CATALOG VIEW */
          <div className="space-y-6">
            
            {/* Hero Banner with Real Photography */}
            <div className="relative rounded-3xl overflow-hidden border border-indigo-700/50 shadow-2xl min-h-[300px] flex items-center bg-slate-900">
              {/* Real Photography Background */}
              <img
                src={HERO_BANNER_IMAGE}
                alt="Family Game Night"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.4] contrast-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-transparent" />
              <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl p-6 sm:p-8 space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full shadow">
                  100% Spielbar • Global Multiplayer
                </span>
                <h2 className="text-2xl sm:text-4xl font-black font-display text-white leading-tight">
                  {t('tagline')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Join public rooms, private family tables with instant room codes, talk in crystal-clear voice chat with fun audio filters, and climb monthly family tournament leaderboards!
                </p>

                {/* Instant Play Highlights with Real Badges */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleLaunchGame(gamesCatalog[0])} // Connect Four
                    className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Connect Four
                  </button>
                  <button
                    onClick={() => handleLaunchGame(gamesCatalog[1])} // Uno
                    className="px-3.5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/20 transition flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> FamCards (Uno)
                  </button>
                  <button
                    onClick={() => handleLaunchGame(gamesCatalog[3])} // Battleship
                    className="px-3.5 py-2 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-lg shadow-sky-600/20 transition flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Battleship (Radar)
                  </button>
                  <button
                    onClick={() => handleLaunchGame(gamesCatalog[2])} // Checkers
                    className="px-3.5 py-2 rounded-2xl bg-amber-700 hover:bg-amber-600 text-white font-black text-xs shadow-lg shadow-amber-700/20 transition flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Checkers (Dame)
                  </button>
                  <button
                    onClick={() => handleLaunchGame(gamesCatalog[4])} // Yatzy
                    className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Yatzy (Kniffel)
                  </button>
                  <button
                    onClick={() => handleLaunchGame(gamesCatalog[5])} // Memory Match
                    className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Memory Animals
                  </button>
                </div>
              </div>
            </div>

            {/* Search & Category Filter Navigation */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                
                {/* Search 100+ Games Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={t('search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="bg-slate-900 border border-slate-800 px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-300">
                    Showing <strong className="text-amber-400 font-mono">{filteredGames.length}</strong> of 100+ Games
                  </div>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: t('all_games'), icon: Gamepad2 },
                  { id: 'cards', label: t('cards'), icon: Award },
                  { id: 'board', label: t('board'), icon: Trophy },
                  { id: 'dice', label: t('dice'), icon: Sparkles },
                  { id: 'strategy', label: t('strategy'), icon: ShieldCheck },
                  { id: 'party', label: t('party'), icon: Users },
                  { id: 'kids', label: t('kids'), icon: Baby },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedCategory(cat.id as any);
                      }}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 100+ Games Catalog Grid with Real Pictures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-3.5 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-xl group overflow-hidden"
                >
                  <div>
                    {/* Real Game Photograph Header */}
                    <div className="h-40 w-full rounded-2xl overflow-hidden relative mb-3 bg-slate-800 border border-slate-800">
                      <img
                        src={getGameImage(game)}
                        alt={game.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = HERO_BANNER_FALLBACK;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent pointer-events-none" />

                      {/* Top Overlay Badge Pills */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                        <span className="text-xl p-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md shadow-md border border-slate-700/60 leading-none">
                          {game.icon}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900/85 backdrop-blur-md text-slate-200 px-2 py-0.5 rounded-full border border-slate-700 shadow">
                            {game.category}
                          </span>
                          {game.featured && (
                            <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow font-black">
                              <Star className="w-2.5 h-2.5 fill-current" /> TOP
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Overlay Info */}
                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-slate-200 font-semibold drop-shadow pointer-events-none">
                        <span className="bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-amber-300 font-bold">
                          ★ {game.rating.toFixed(1)}
                        </span>
                        <span className="bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-slate-300 font-mono text-[10px]">
                          {game.playsCount.toLocaleString()} Plays
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-bold font-display text-base text-white group-hover:text-amber-400 transition-colors line-clamp-1 px-1">
                      {game.title}
                    </h3>

                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed px-1">
                      {game.description}
                    </p>

                    {/* Metadata Specs */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span className="text-slate-300 font-semibold">{game.players}</span>
                      <span className="font-mono">{game.duration}</span>
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold">
                        Age {game.minAge}+
                      </span>
                    </div>
                  </div>

                  {/* Play Action Button */}
                  <div className="mt-4 pt-1">
                    <button
                      onClick={() => handleLaunchGame(game)}
                      className={`w-full py-2.5 rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 ${
                        game.featured
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> {t('play_now')}
                    </button>
                  </div>
                </div>
              ))}

              {filteredGames.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-400 space-y-2">
                  <Gamepad2 className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold">No games found matching your search filter.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setKidsMode(false);
                    }}
                    className="text-xs text-amber-400 font-bold underline"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 5. FOOTER */}
      <footer className="mt-auto bg-slate-900 border-t border-slate-800 px-6 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold font-display text-white">FamPlay Arcade</span>
            <span>•</span>
            <span>100% Spielbar Cross-Platform Engine</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Safe & Verified for All Ages</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => { sound.playClick(); setIsParentalOpen(true); }}
              className="hover:text-white transition"
            >
              Parental Controls & PIN
            </button>
            <button
              onClick={() => { sound.playClick(); setIsAdminOpen(true); }}
              className="hover:text-white transition"
            >
              Admin Moderation
            </button>
            <button
              onClick={() => { sound.playClick(); setIsShareOpen(true); }}
              className="hover:text-white transition"
            >
              Invite Family
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AvatarStudioModal
        isOpen={isAvatarOpen}
        onClose={() => setIsAvatarOpen(false)}
        currentUser={user}
        onSave={(newAvatar, newRole) => {
          setUser((u) => ({
            ...u,
            avatar: newAvatar,
            familyRole: newRole,
          }));
        }}
      />

      <RoomManagerModal
        isOpen={isRoomManagerOpen}
        onClose={() => setIsRoomManagerOpen(false)}
        currentUser={user}
        publicRooms={publicRooms}
        availableGames={gamesCatalog}
        onJoinRoom={(room) => {
          setCurrentRoom(room);
          const matched = gamesCatalog.find((g) => g.id === room.gameId);
          if (matched) setActiveGame(matched);
        }}
        onCreateRoom={(newRoom) => {
          setPublicRooms((prev) => [newRoom, ...prev]);
          setCurrentRoom(newRoom);
          const matched = gamesCatalog.find((g) => g.id === newRoom.gameId);
          if (matched) setActiveGame(matched);
        }}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        roomCode={currentRoom?.code || 'FAM-101'}
        roomName={currentRoom?.name || 'FamCards Family Table'}
      />

      <ParentalControlsModal
        isOpen={isParentalOpen}
        onClose={() => setIsParentalOpen(false)}
        controls={parental}
        onSave={(newControls) => setParental(newControls)}
      />

      <TournamentModal
        isOpen={isTourneyOpen}
        onClose={() => setIsTourneyOpen(false)}
        tournaments={tournaments}
        currentUser={user}
        onRegister={(tourneyId) => {
          setTournaments((prev) =>
            prev.map((t) => (t.id === tourneyId ? { ...t, registered: true } : t))
          );
        }}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUser={user}
      />

      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        achievements={achievements}
        onClaimReward={(achId) => {
          setAchievements((prev) =>
            prev.map((a) => (a.id === achId ? { ...a, unlocked: true } : a))
          );
          const found = achievements.find((a) => a.id === achId);
          if (found) {
            setUser((u) => ({
              ...u,
              coins: u.coins + found.coinReward,
              xp: u.xp + found.xpReward,
            }));
          }
        }}
      />

      <VipModal
        isOpen={isVipOpen}
        onClose={() => setIsVipOpen(false)}
        currentUser={user}
        onUpgradeVip={() => {
          setUser((u) => ({
            ...u,
            isVip: true,
            coins: u.coins + 2500,
            avatar: { ...u.avatar, flair: 'gold-vip' },
          }));
        }}
      />

      <DailyRewardModal
        isOpen={isDailyOpen}
        onClose={() => setIsDailyOpen(false)}
        currentUser={user}
        onClaimDaily={(day, coins, gems) => {
          setUser((u) => ({
            ...u,
            coins: u.coins + coins,
            gems: u.gems + gems,
            streakDays: day,
          }));
        }}
      />

      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        reports={reports}
        rooms={publicRooms}
        onResolveReport={(repId, action) => {
          setReports((prev) =>
            prev.map((r) =>
              r.id === repId
                ? { ...r, status: action === 'dismiss' ? 'dismissed' : 'resolved' }
                : r
            )
          );
        }}
        onBroadcastAnnouncement={(msg) => {
          setGlobalAnnouncement(`📢 System Broadcast: ${msg}`);
        }}
      />
    </div>
  );
}
