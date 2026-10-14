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
import { authService } from './services/authService';

// Components
import { AvatarDisplay } from './components/avatar/AvatarDisplay';
import { AvatarStudioModal } from './components/avatar/AvatarStudioModal';
import { VoiceChatPanel } from './components/voice/VoiceChatPanel';
import { RoomManagerModal } from './components/rooms/RoomManagerModal';
import { ShareModal } from './components/rooms/ShareModal';
import { GameTablePanel } from './components/rooms/GameTablePanel';
import { multiplayerService, MultiplayerEvent } from './services/multiplayerService';
import { ParentalControlsModal } from './components/parental/ParentalControlsModal';
import { TournamentModal } from './components/tournaments/TournamentModal';
import { LeaderboardModal } from './components/leaderboards/LeaderboardModal';
import { AchievementsModal } from './components/achievements/AchievementsModal';
import { VipModal } from './components/vip/VipModal';
import { DailyRewardModal } from './components/rewards/DailyRewardModal';
import { AdminSystemModal } from './components/admin/AdminSystemModal';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { LoginModal } from './components/auth/LoginModal';
import { UserPanelModal } from './components/user/UserPanelModal';
import { AndroidAppModal } from './components/pwa/AndroidAppModal';
import { PWAInstallButton } from './components/pwa/PWAInstallButton';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

// Playable Game Engines
import { ConnectFour } from './components/games/ConnectFour';
import { FamCardsUno } from './components/games/FamCardsUno';
import { CheckersGame } from './components/games/CheckersGame';
import { BattleshipGame } from './components/games/BattleshipGame';
import { YatzyGame } from './components/games/YatzyGame';
import { MemoryMatchGame } from './components/games/MemoryMatchGame';
import { DotsAndBoxesGame } from './components/games/DotsAndBoxesGame';
import { TicTacToeGame } from './components/games/TicTacToeGame';
import { LudoGame } from './components/games/LudoGame';
import { ChessGame } from './components/games/ChessGame';

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
  HelpCircle,
  LogIn,
  ShieldAlert,
  User
} from 'lucide-react';

export default function App() {
  // App state
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile>(() => authService.getCurrentUser());
  const [allGames, setAllGames] = useState<GameInfo[]>(gamesCatalog);
  const [parental, setParental] = useState<ParentalControls>(initialParentalControls);
  const [publicRooms, setPublicRooms] = useState<GameRoom[]>(() => multiplayerService.getRooms());
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments);
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements);
  const [reports, setReports] = useState<ModerationReport[]>(initialModerationReports);
  const [notifications, setNotifications] = useState<SystemNotification[]>(initialNotifications);
  
  // Navigation & UI mode
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [kidsMode, setKidsMode] = useState<boolean>(false);
  const [activeGame, setActiveGame] = useState<GameInfo | null>(null);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);

  // Cross-tab multiplayer synchronization
  useEffect(() => {
    const unsubscribe = multiplayerService.subscribe((event: MultiplayerEvent) => {
      if (event.type === 'ROOMS_UPDATED') {
        setPublicRooms(event.rooms);
      }
      if (event.type === 'ROOM_STATE_SYNC') {
        setPublicRooms(multiplayerService.getRooms());
        if (currentRoom && (currentRoom.id === event.room.id || currentRoom.code === event.room.code)) {
          setCurrentRoom(event.room);
        }
      }
    });
    return () => unsubscribe();
  }, [currentRoom?.id, currentRoom?.code]);

  // URL query parameter ?room=CODE auto-join
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('room');
      if (code) {
        const found = multiplayerService.getRoomByCode(code);
        if (found) {
          const joined = multiplayerService.joinRoom(found.code, user) || found;
          setCurrentRoom(joined);
          const matchedGame = gamesCatalog.find((g) => g.id === joined.gameId);
          if (matchedGame) setActiveGame(matchedGame);
        }
      }
    }
  }, []);

  const [globalAnnouncement, setGlobalAnnouncement] = useState<string | null>(
    '🎲 Willkommen am virtuellen FamPlay-Spieltisch · Wähle dein Lieblingsspiel oder lade deine Familie per Tisch-Code ein!'
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
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState<boolean>(false);
  const [isAndroidAppModalOpen, setIsAndroidAppModalOpen] = useState<boolean>(false);

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

    // Ensure current table matches active game and seats user
    setCurrentRoom((prev) => {
      const maxSlots = ['chess', 'connect-four', 'checkers', 'tictactoe', 'dots-boxes'].includes(game.engine) ? 2 : 4;
      if (prev && prev.gameId === game.id) {
        return prev;
      }
      const newRoom = multiplayerService.createRoom(user, {
        name: `${user.name}’s Familientisch`,
        gameId: game.id,
        gameTitle: game.title,
        maxPlayers: maxSlots,
        isPrivate: false,
        voiceChatActive: false,
      });
      return newRoom;
    });
  };

  const handleGameCompletion = (result: any) => {
    // Add XP & Coins with VIP bonus multiplier
    const multiplier = user.isVip ? 2 : 1;
    const earnedCoins = 100 * multiplier;
    const earnedXp = 150 * multiplier;

    const newMatch = {
      id: `m_${Date.now()}`,
      gameId: activeGame?.id || 'game',
      gameTitle: activeGame?.title || 'Spielpartie',
      result: (result?.winner === 'player' || result?.winner === 'draw' || result?.score > 100 ? 'won' : 'lost') as 'won' | 'lost',
      score: result?.score || 350,
      opponentName: 'Familientisch / Bot',
      date: 'Gerade eben',
      xpEarned: earnedXp,
      coinsEarned: earnedCoins,
    };

    setUser((prev) => {
      const updated: UserProfile = {
        ...prev,
        coins: prev.coins + earnedCoins,
        xp: prev.xp + earnedXp,
        stats: {
          ...prev.stats,
          gamesPlayed: prev.stats.gamesPlayed + 1,
          gamesWon: prev.stats.gamesWon + (newMatch.result === 'won' ? 1 : 0),
        },
        matchHistory: [newMatch, ...(prev.matchHistory || [])],
      };
      authService.setCurrentUser(updated);
      return updated;
    });

    // Update screen time session
    setParental((prev) => ({
      ...prev,
      screenTimeUsedMinutes: prev.screenTimeUsedMinutes + 10,
    }));
  };

  // Filter games based on search, category, kids mode, and parental rating
  const filteredGames = allGames.filter((game) => {
    if (game.disabled) return false;
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

            {/* User Profile / Account Center launcher */}
            <button
              onClick={() => {
                sound.playClick();
                setIsUserPanelOpen(true);
              }}
              className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-2xl transition group"
              title="Mein Benutzerkonto & Profil öffnen"
            >
              <AvatarDisplay avatar={user.avatar} size="sm" showBadge={user.familyRole.slice(0, 1)} />
              <div className="text-left hidden md:block">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="text-xs font-bold text-white group-hover:text-amber-400 transition">{user.name}</span>
                  {user.role === 'admin' && (
                    <span className="text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1 rounded">
                      Admin
                    </span>
                  )}
                  {user.role === 'moderator' && (
                    <span className="text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1 rounded">
                      Mod
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-amber-400 font-semibold">{user.familyRole}</div>
              </div>
            </button>

            {/* Android App & PWA Install launcher */}
            <PWAInstallButton onOpenModal={() => setIsAndroidAppModalOpen(true)} />

            {/* Login / Switch Account Button */}
            <button
              onClick={() => {
                sound.playClick();
                setIsLoginOpen(true);
              }}
              className="p-2 sm:px-3 sm:py-1.5 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Anmelden oder Benutzer wechseln"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Anmelden</span>
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border ${
                user.role === 'admin'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-600/30 ring-1 ring-rose-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-slate-700'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span>Adminsystem</span>
              {user.role === 'admin' && (
                <span className="text-[9px] bg-black/40 px-1 rounded uppercase tracking-wider">Root</span>
              )}
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

            {/* VIRTUAL GAMING TABLE WITH SEATED PLAYERS & OPEN CHAIRS */}
            {currentRoom && (
              <GameTablePanel
                room={currentRoom}
                currentUser={user}
                activeTurnPlayerId={currentTurnPlayerId}
                onUpdateRoom={(updated) => {
                  setCurrentRoom(updated);
                  multiplayerService.updateRoomState(updated);
                  setPublicRooms(multiplayerService.getRooms());
                }}
                onInviteFriend={() => setIsShareOpen(true)}
                onLeaveTable={() => {
                  sound.playClick();
                  setActiveGame(null);
                }}
              />
            )}

            {/* GAME ENGINE CONTAINER */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl min-h-[500px] flex items-center justify-center">
              {activeGame.engine === 'ludo' && (
                <LudoGame 
                  onGameEnd={handleGameCompletion} 
                  tableParticipants={currentRoom?.participants}
                  currentUserId={user.id}
                  onActiveTurnChange={setCurrentTurnPlayerId}
                />
              )}
              {activeGame.engine === 'chess' && (
                <ChessGame 
                  onGameEnd={handleGameCompletion} 
                  tableParticipants={currentRoom?.participants}
                  currentUserId={user.id}
                  onActiveTurnChange={setCurrentTurnPlayerId}
                />
              )}
              {activeGame.engine === 'connect-four' && (
                <ConnectFour 
                  onGameEnd={handleGameCompletion} 
                  tableParticipants={currentRoom?.participants}
                  currentUserId={user.id}
                  onActiveTurnChange={setCurrentTurnPlayerId}
                />
              )}
              {activeGame.engine === 'fam-cards' && (
                <FamCardsUno 
                  onGameEnd={handleGameCompletion} 
                  tableParticipants={currentRoom?.participants}
                  currentUserId={user.id}
                  onActiveTurnChange={setCurrentTurnPlayerId}
                />
              )}
              {activeGame.engine === 'checkers' && (
                <CheckersGame 
                  onGameEnd={handleGameCompletion} 
                  tableParticipants={currentRoom?.participants}
                  currentUserId={user.id}
                  onActiveTurnChange={setCurrentTurnPlayerId}
                />
              )}
              {activeGame.engine === 'battleship' && (
                <BattleshipGame 
                  onGameEnd={handleGameCompletion} 
                  tableParticipants={currentRoom?.participants}
                  currentUserId={user.id}
                  onActiveTurnChange={setCurrentTurnPlayerId}
                />
              )}
              {activeGame.engine === 'yatzy' && (
                <YatzyGame 
                  onGameEnd={handleGameCompletion} 
                  tableParticipants={currentRoom?.participants}
                  currentUserId={user.id}
                  onActiveTurnChange={setCurrentTurnPlayerId}
                />
              )}
              {activeGame.engine === 'memory-match' && (
                <MemoryMatchGame 
                  onGameEnd={handleGameCompletion} 
                  tableParticipants={currentRoom?.participants}
                  currentUserId={user.id}
                  onActiveTurnChange={setCurrentTurnPlayerId}
                />
              )}
              {activeGame.engine === 'dots-boxes' && (
                <DotsAndBoxesGame 
                  onGameEnd={handleGameCompletion} 
                  tableParticipants={currentRoom?.participants}
                  currentUserId={user.id}
                  onActiveTurnChange={setCurrentTurnPlayerId}
                />
              )}
              {activeGame.engine === 'tictactoe' && (
                <TicTacToeGame 
                  onGameEnd={handleGameCompletion} 
                  tableParticipants={currentRoom?.participants}
                  currentUserId={user.id}
                  onActiveTurnChange={setCurrentTurnPlayerId}
                />
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
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  Klassische Gesellschaftsspiele am virtuellen Familientisch: Spiele mit echten handgefertigten Spielfiguren, würfle live im 3D-Lederbecher und lade Familie per Raum-Code ein!
                </p>

                {/* Instant Play Highlights with Real Badges */}
                <div className="pt-2 flex flex-wrap gap-2">
                  {/* Mensch ärgere Dich nicht */}
                  <button
                    onClick={() => {
                      const g = gamesCatalog.find((x) => x.id === 'ludo') || gamesCatalog[0];
                      handleLaunchGame(g);
                    }}
                    className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Mensch ärgere Dich nicht
                  </button>

                  {/* Schach mit Staunton-Figuren */}
                  <button
                    onClick={() => {
                      const g = gamesCatalog.find((x) => x.id === 'chess') || gamesCatalog[1];
                      handleLaunchGame(g);
                    }}
                    className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-white text-slate-950 font-black text-xs shadow-lg shadow-white/10 transition flex items-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Schach (Staunton)
                  </button>

                  {/* Vier Gewinnt */}
                  <button
                    onClick={() => {
                      const g = gamesCatalog.find((x) => x.id === 'connect-four') || gamesCatalog[0];
                      handleLaunchGame(g);
                    }}
                    className="px-3.5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/20 transition flex items-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Vier Gewinnt
                  </button>

                  {/* Dame */}
                  <button
                    onClick={() => {
                      const g = gamesCatalog.find((x) => x.id === 'checkers') || gamesCatalog[2];
                      handleLaunchGame(g);
                    }}
                    className="px-3.5 py-2 rounded-2xl bg-amber-800 hover:bg-amber-700 text-white font-black text-xs shadow-lg shadow-amber-800/20 transition flex items-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Dame (Holzsteine)
                  </button>

                  {/* Schiffe Versenken */}
                  <button
                    onClick={() => {
                      const g = gamesCatalog.find((x) => x.id === 'battleship') || gamesCatalog[3];
                      handleLaunchGame(g);
                    }}
                    className="px-3.5 py-2 rounded-2xl bg-sky-700 hover:bg-sky-600 text-white font-black text-xs shadow-lg shadow-sky-700/20 transition flex items-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Schiffe Versenken
                  </button>

                  {/* FamCards Uno */}
                  <button
                    onClick={() => {
                      const g = gamesCatalog.find((x) => x.id === 'fam-cards') || gamesCatalog[1];
                      handleLaunchGame(g);
                    }}
                    className="px-3.5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/20 transition flex items-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> FamCards (Uno)
                  </button>

                  {/* Kniffel / Yatzy */}
                  <button
                    onClick={() => {
                      const g = gamesCatalog.find((x) => x.id === 'yatzy') || gamesCatalog[4];
                      handleLaunchGame(g);
                    }}
                    className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Kniffel / Yatzy
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
                    placeholder="Spiel suchen... z.B. Mensch ärgere Dich nicht, Schach, Dame, Uno, Kniffel"
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
                    <strong className="text-amber-400 font-mono">{filteredGames.length}</strong> Spiele verfügbar
                  </div>
                </div>
              </div>

              {/* Category Segmented Control */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'Alle Spiele', icon: Gamepad2 },
                  { id: 'board', label: 'Klassische Brettspiele', icon: Trophy },
                  { id: 'cards', label: 'Kartenspiele', icon: Award },
                  { id: 'dice', label: 'Würfelspiele', icon: Sparkles },
                  { id: 'strategy', label: 'Strategie & Taktik', icon: ShieldCheck },
                  { id: 'party', label: 'Partyspiele', icon: Users },
                  { id: 'kids', label: 'Familie & Kinder', icon: Baby },
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
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 100+ Games Catalog Grid with Real Pictures & Clean Editorial Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-3.5 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-2xl group overflow-hidden"
                >
                  <div>
                    {/* Real Game Photograph Header */}
                    <div className="h-44 w-full rounded-2xl overflow-hidden relative mb-3 bg-slate-950 border border-slate-800">
                      <img
                        src={getGameImage(game)}
                        alt={game.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = HERO_BANNER_FALLBACK;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent pointer-events-none" />

                      {/* Top Overlay Indicator */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                        <span className="text-lg p-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md shadow-md border border-slate-700/60 leading-none">
                          {game.icon}
                        </span>
                        {game.featured && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded shadow flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" /> HIGHLIGHT
                          </span>
                        )}
                      </div>

                      {/* Bottom Overlay Title Bar */}
                      <div className="absolute bottom-2 left-2.5 right-2.5 pointer-events-none">
                        <span className="text-[11px] text-amber-300/90 font-medium tracking-wide">
                          ★ {game.rating.toFixed(1)} · {game.playsCount > 0 ? `${game.playsCount.toLocaleString()} Runden` : 'Offener Spieltisch'}
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

                    {/* Metadata Specs as Clean Typographic Line (Zero-Pill Discipline) */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400 px-1 font-medium">
                      <span className="text-slate-300">{game.players}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span>{game.duration}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-amber-400/90">Ab {game.minAge} Jahren</span>
                    </div>
                  </div>

                  {/* Play Action Button */}
                  <div className="mt-4 pt-1">
                    <button
                      onClick={() => handleLaunchGame(game)}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs shadow transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 group-hover:bg-amber-500 group-hover:text-slate-950"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Am Spieltisch starten</span>
                    </button>
                  </div>
                </div>
              ))}

              {filteredGames.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-400 space-y-2">
                  <Gamepad2 className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold">Keine Spiele gefunden, die deiner Suche entsprechen.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setKidsMode(false);
                    }}
                    className="text-xs text-amber-400 font-bold underline"
                  >
                    Filter zurücksetzen
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
          setUser((u) => {
            const updated = {
              ...u,
              avatar: newAvatar,
              familyRole: newRole,
            };
            authService.setCurrentUser(updated);
            return updated;
          });
          setCurrentRoom((prev) => {
            if (!prev) return null;
            const updatedParticipants = prev.participants.map((p) =>
              p.id === user.id ? { ...p, avatar: newAvatar } : p
            );
            const updatedRoom = { ...prev, participants: updatedParticipants };
            multiplayerService.updateRoomState(updatedRoom);
            return updatedRoom;
          });
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

      {/* Admin System Modal */}
      <AdminSystemModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        currentUser={user}
        allGames={allGames}
        rooms={publicRooms}
        reports={reports}
        onUpdateGameCatalog={(updatedGames) => {
          setAllGames(updatedGames);
        }}
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
          setGlobalAnnouncement(msg);
        }}
        onTerminateRoom={(roomId) => {
          setPublicRooms((prev) => prev.filter((r) => r.id !== roomId));
          if (currentRoom?.id === roomId) {
            setCurrentRoom(null);
          }
        }}
        onUserRoleChange={(userId, newRole) => {
          if (user.id === userId) {
            setUser((prev) => ({ ...prev, role: newRole }));
          }
        }}
        onRefreshUsers={() => {
          const fresh = authService.getCurrentUser();
          if (fresh.id === user.id) {
            setUser(fresh);
          }
        }}
      />

      {/* Login & Register Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        currentUser={user}
        onUserChanged={(newUser) => {
          setUser(newUser);
          if (currentRoom) {
            setCurrentRoom((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                hostName: newUser.name,
                participants: prev.participants.map((p, idx) =>
                  idx === 0 ? { ...p, id: newUser.id, name: newUser.name, avatar: newUser.avatar } : p
                ),
              };
            });
          }
        }}
      />

      {/* User Account & Profile Center */}
      <UserPanelModal
        isOpen={isUserPanelOpen}
        onClose={() => setIsUserPanelOpen(false)}
        user={user}
        onUpdateUser={(updatedUser) => {
          setUser(updatedUser);
          authService.setCurrentUser(updatedUser);
        }}
        onOpenAvatarStudio={() => {
          setIsUserPanelOpen(false);
          setIsAvatarOpen(true);
        }}
        onOpenLoginSwitcher={() => {
          setIsUserPanelOpen(false);
          setIsLoginOpen(true);
        }}
        onLogout={() => {
          const guest = authService.logout();
          setUser(guest);
          setIsUserPanelOpen(false);
        }}
        onOpenAndroidModal={() => {
          setIsUserPanelOpen(false);
          setIsAndroidAppModalOpen(true);
        }}
      />

      {/* Android App & PWA Hub Modal */}
      <AndroidAppModal
        isOpen={isAndroidAppModalOpen}
        onClose={() => setIsAndroidAppModalOpen(false)}
      />

      {/* Offline connectivity status banner */}
      <OfflineIndicator />
    </div>
  );
}
