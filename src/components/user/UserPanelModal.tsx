import React, { useState, useEffect } from 'react';
import { UserProfile, MatchHistoryItem, FamilyFriend, ThemeId, SupportedLanguage } from '../../types';
import { sound } from '../../services/sound';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { friendsService, STARTER_FAMILY_MEMBERS } from '../../services/friendsService';
import { FriendsListModal } from '../friends/FriendsListModal';
import { themeService, THEME_LIST, APP_THEMES } from '../../services/themeService';
import { getStoredLanguage, setStoredLanguage } from '../../services/i18n';
import { 
  User, 
  Crown, 
  Coins, 
  Gem, 
  Flame, 
  Trophy, 
  ShieldCheck, 
  Clock, 
  Gamepad2, 
  Settings, 
  LogOut, 
  Edit3, 
  Sparkles, 
  X, 
  CheckCircle2, 
  ChevronRight, 
  Lock, 
  Mail, 
  Users, 
  ArrowRight,
  TrendingUp,
  Award,
  Smartphone,
  Download,
  Trash2,
  UserPlus,
  Copy,
  Check,
  Star,
  Share2,
  Palette,
  Globe
} from 'lucide-react';

interface UserPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onOpenAvatarStudio: () => void;
  onOpenLoginSwitcher: () => void;
  onLogout: () => void;
  onOpenAndroidModal?: () => void;
  onOpenFriendsList?: () => void;
  onInviteFriendToGame?: (friend: FamilyFriend) => void;
  onOpenPointsShop?: () => void;
  onOpenVipModal?: () => void;
  onOpenDailyModal?: () => void;
}

export const UserPanelModal: React.FC<UserPanelModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onOpenAvatarStudio,
  onOpenLoginSwitcher,
  onLogout,
  onOpenAndroidModal,
  onOpenFriendsList,
  onInviteFriendToGame,
  onOpenPointsShop,
  onOpenVipModal,
  onOpenDailyModal,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'friends' | 'stats' | 'history' | 'settings'>('overview');
  
  // Friends list state
  const [friends, setFriends] = useState<FamilyFriend[]>([]);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState<boolean>(false);
  const [quickAddId, setQuickAddId] = useState<string>('');
  const [quickAddSuccess, setQuickAddSuccess] = useState<string | null>(null);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [isAddingFriend, setIsAddingFriend] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Settings edit state
  const [nameInput, setNameInput] = useState<string>(user.name);
  const [clanInput, setClanInput] = useState<string>(user.clanName);
  const [roleInput, setRoleInput] = useState<any>(user.familyRole);
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>(() => user.themeId || themeService.getStoredTheme());
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(() => getStoredLanguage());
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && user) {
      setFriends(friendsService.getFriends(user.id));
      setSelectedThemeId(user.themeId || themeService.getStoredTheme());
      setSelectedLang(getStoredLanguage());
      setNameInput(user.name);
      setClanInput(user.clanName);
      setRoleInput(user.familyRole);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const winRate = user.stats.gamesPlayed > 0 
    ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100) 
    : 0;

  const xpForNextLevel = user.level * 500;
  const currentLevelProgress = Math.min(100, Math.round(((user.xp % 500) / 500) * 100));

  const handleSelectTheme = (themeId: ThemeId) => {
    sound.playReward();
    setSelectedThemeId(themeId);
    themeService.applyTheme(themeId);
    onUpdateUser({
      ...user,
      themeId,
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playReward();
    themeService.applyTheme(selectedThemeId);
    setStoredLanguage(selectedLang);
    onUpdateUser({
      ...user,
      name: nameInput.trim() || user.name,
      clanName: clanInput.trim() || user.clanName,
      familyRole: roleInput,
      themeId: selectedThemeId,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const onlineFriendsCount = friends.filter((f) => f.status === 'online' || f.status === 'in-game').length;

  const handleCopyOwnId = async () => {
    sound.playChip();
    try {
      await navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddId.trim()) return;
    setIsAddingFriend(true);
    setQuickAddError(null);
    setQuickAddSuccess(null);

    const res = await friendsService.addFriend(user.id, quickAddId.trim());
    setIsAddingFriend(false);
    if (res.success && res.friend) {
      setFriends(friendsService.getFriends(user.id));
      setQuickAddSuccess(`✓ "${res.friend.name}" hinzugefügt!`);
      setQuickAddId('');
      setTimeout(() => setQuickAddSuccess(null), 3000);
    } else {
      sound.playError();
      setQuickAddError(res.error || 'Fehler beim Hinzufügen.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Banner & User Header */}
        <div className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-700 px-6 pt-6 pb-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar with click to customize */}
            <div 
              onClick={() => {
                sound.playClick();
                onOpenAvatarStudio();
              }}
              className="relative cursor-pointer group shrink-0"
              title="Klicke hier, um deinen Avatar anzupassen"
            >
              <div className="p-1 bg-white/20 backdrop-blur-md rounded-3xl group-hover:scale-105 transition-transform">
                <AvatarDisplay avatar={user.avatar} size="lg" showBadge={user.familyRole.slice(0, 1)} />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-slate-900 text-amber-400 p-1.5 rounded-xl border border-slate-700 shadow-md group-hover:bg-amber-400 group-hover:text-slate-950 transition">
                <Edit3 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* User Meta Information */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-2xl font-black font-display tracking-tight text-white truncate">
                  {user.name}
                </h2>
                
                {user.role === 'admin' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/80 text-white border border-rose-300 shadow-sm flex items-center gap-1">
                    👑 Administrator
                  </span>
                )}
                {user.role === 'moderator' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500/80 text-white border border-indigo-300 shadow-sm flex items-center gap-1">
                    🛡️ Moderator
                  </span>
                )}
                {user.isVip && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 fill-current" /> VIP Pass
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-white/90">
                <span className="font-semibold">{user.familyRole}</span>
                <span>•</span>
                <span className="text-amber-200 font-medium">Clan: {user.clanName}</span>
                <span>•</span>
                <span className="text-white/70">Mitglied seit: {user.joinedDate || '2025'}</span>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setIsFriendsModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 border border-amber-300/40 backdrop-blur-md text-amber-200 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                title="Freundesliste & Online-Status öffnen"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Freunde ({onlineFriendsCount})</span>
                {onlineFriendsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                )}
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenLoginSwitcher();
                }}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs transition flex items-center gap-1.5"
                title="Profil wechseln"
              >
                <User className="w-3.5 h-3.5" /> Wechseln
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  onLogout();
                }}
                className="p-2 rounded-xl bg-rose-500/30 hover:bg-rose-500/50 backdrop-blur-md text-white font-bold text-xs transition"
                title="Abmelden"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => { sound.playClick(); setActiveTab('overview'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> Übersicht
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('friends'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'friends'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Familie & Freunde ({friends.length})
            {onlineFriendsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/40 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {onlineFriendsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('stats'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'stats'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Statistiken & Siege
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('history'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'history'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" /> Match-Historie
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('settings'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'settings'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" /> Einstellungen
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* TAB 1: ÜBERSICHT & PROGRESSION */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Level & XP Progress Card */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm border border-amber-500/30">
                      {user.level}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Spieler-Stufe {user.level}</h3>
                      <p className="text-xs text-slate-400">
                        {user.xp.toLocaleString()} XP Gesamt-Erfahrung
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-400">
                      {currentLevelProgress}% zum nächsten Level
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${currentLevelProgress}%` }}
                  />
                </div>
              </div>

              {/* Currency & Streak Wallets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    sound.playClick();
                    onClose();
                    if (onOpenPointsShop) onOpenPointsShop();
                  }}
                  className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-amber-500/50 p-4 rounded-2xl flex flex-col justify-between text-left transition group cursor-pointer"
                  title="Punkte- & Belohnungs-Shop öffnen"
                >
                  <div className="flex items-center justify-between text-amber-400 mb-2 w-full">
                    <span className="text-xs font-bold text-slate-400 group-hover:text-amber-300">Münzen</span>
                    <Coins className="w-5 h-5 fill-current" />
                  </div>
                  <div className="text-xl font-black font-mono text-white group-hover:text-amber-300">
                    {user.coins.toLocaleString()}
                  </div>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onClose();
                    if (onOpenPointsShop) onOpenPointsShop();
                  }}
                  className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-sky-500/50 p-4 rounded-2xl flex flex-col justify-between text-left transition group cursor-pointer"
                  title="Punkte- & Belohnungs-Shop öffnen"
                >
                  <div className="flex items-center justify-between text-sky-400 mb-2 w-full">
                    <span className="text-xs font-bold text-slate-400 group-hover:text-sky-300">Edelsteine</span>
                    <Gem className="w-5 h-5 fill-current" />
                  </div>
                  <div className="text-xl font-black font-mono text-white group-hover:text-sky-300">
                    {user.gems.toLocaleString()}
                  </div>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onClose();
                    if (onOpenDailyModal) onOpenDailyModal();
                  }}
                  className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-orange-500/50 p-4 rounded-2xl flex flex-col justify-between text-left transition group cursor-pointer"
                  title="Tages-Bonus Kalender öffnen"
                >
                  <div className="flex items-center justify-between text-orange-400 mb-2 w-full">
                    <span className="text-xs font-bold text-slate-400 group-hover:text-orange-300">Tages-Streak</span>
                    <Flame className="w-5 h-5 fill-current" />
                  </div>
                  <div className="text-xl font-black text-white group-hover:text-orange-300">
                    {user.streakDays} Tage
                  </div>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onClose();
                    if (onOpenVipModal) onOpenVipModal();
                  }}
                  className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-amber-400/50 p-4 rounded-2xl flex flex-col justify-between text-left transition group cursor-pointer"
                  title="VIP Club & Pässe öffnen"
                >
                  <div className="flex items-center justify-between text-amber-300 mb-2 w-full">
                    <span className="text-xs font-bold text-slate-400 group-hover:text-amber-200">VIP Status</span>
                    <Crown className="w-5 h-5 fill-current" />
                  </div>
                  <div className="text-sm font-black text-white group-hover:text-amber-200">
                    {user.isVip ? `Aktiv (${user.vipTier ? `Stufe ${user.vipTier}` : 'Pass'})` : 'Kostenlos (Upgrade)'}
                  </div>
                </button>
              </div>

              {/* Favorite & Quick Launch */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Lieblingsspiel der Familie</div>
                    <div className="font-bold text-sm text-white">{user.stats.favoriteGame}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenAvatarStudio();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" /> Avatar anpassen
                </button>
              </div>

              {/* Family & Friends Network Card */}
              <div className="bg-gradient-to-r from-slate-800/80 via-slate-800/50 to-indigo-950/30 border border-slate-700/70 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <span>Familien-Netzwerk</span>
                        {onlineFriendsCount > 0 && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.2 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {onlineFriendsCount} online
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400">Deine Mitspieler und Familienkontakte am Spieletisch</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setActiveTab('friends');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>Verwalten ({friends.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setIsFriendsModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Freundesliste</span>
                    </button>
                  </div>
                </div>

                {/* Quick Friends Avatars row */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {friends.slice(0, 5).map((f) => {
                    const badge = friendsService.getStatusBadge(f.status);
                    return (
                      <div
                        key={f.id}
                        onClick={() => {
                          sound.playClick();
                          setActiveTab('friends');
                        }}
                        className="flex items-center gap-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 p-1.5 pr-3 rounded-2xl cursor-pointer transition"
                        title={`${f.name} - ${badge.label}${f.currentGame ? `: ${f.currentGame}` : ''}`}
                      >
                        <div className="relative">
                          <AvatarDisplay avatar={f.avatar} size="sm" showBadge={f.familyRole.slice(0, 1)} />
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${badge.dotBg}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate max-w-[100px]">{f.name}</div>
                          <div className="text-[10px] text-slate-400 leading-none">{badge.label}</div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {friends.length > 5 && (
                    <button
                      onClick={() => setActiveTab('friends')}
                      className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center hover:bg-slate-700 transition"
                    >
                      +{friends.length - 5}
                    </button>
                  )}
                </div>

                {/* Own Player ID bar */}
                <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Deine Spieler-ID: <strong className="text-amber-300 font-mono">{user.id}</strong>
                  </span>
                  <button
                    onClick={handleCopyOwnId}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'Kopiert!' : 'Kopieren'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: FAMILIE & FREUNDE */}
          {activeTab === 'friends' && (
            <div className="space-y-5">
              
              {/* Personal ID share header */}
              <div className="bg-gradient-to-r from-amber-950/40 via-slate-800 to-indigo-950/40 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold border border-amber-400/30">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      Deine Spieler-ID (Mit Familie teilen)
                    </div>
                    <div className="text-sm font-mono font-black text-white">{user.id}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyOwnId}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      copiedId
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow'
                    }`}
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'ID kopiert! ✓' : 'ID kopieren'}</span>
                  </button>

                  <button
                    onClick={() => setIsFriendsModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Vollbild-Center</span>
                  </button>
                </div>
              </div>

              {/* Quick Add Friend form */}
              <div className="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>Familienmitglied per ID hinzufügen</span>
                </h4>

                {quickAddError && (
                  <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs font-bold text-rose-300 flex items-center gap-2">
                    <span>⚠ {quickAddError}</span>
                  </div>
                )}
                {quickAddSuccess && (
                  <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{quickAddSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <input
                    type="text"
                    required
                    value={quickAddId}
                    onChange={(e) => setQuickAddId(e.target.value)}
                    placeholder="Spieler-ID eingeben (z.B. fam_papa_01 oder Mama)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isAddingFriend || !quickAddId.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shrink-0 shadow"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isAddingFriend ? 'Prüfe...' : 'Hinzufügen'}</span>
                  </button>
                </form>
              </div>

              {/* Friends list inside panel */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Familienmitglieder ({friends.length})</span>
                  <span className="text-emerald-400 font-semibold">{onlineFriendsCount} gerade online</span>
                </div>

                {friends.length === 0 ? (
                  <div className="p-6 text-center bg-slate-800/30 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
                    <Users className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="font-semibold text-xs">Noch keine Familienmitglieder hinzugefügt.</p>
                    <button
                      onClick={() => {
                        sound.playReward();
                        friendsService.saveFriends(user.id, STARTER_FAMILY_MEMBERS);
                        setFriends(STARTER_FAMILY_MEMBERS);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3" /> Muster-Familie laden
                    </button>
                  </div>
                ) : (
                  friends.map((friend) => {
                    const badge = friendsService.getStatusBadge(friend.status);
                    return (
                      <div
                        key={friend.id}
                        className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-2xl flex items-center justify-between gap-3 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <AvatarDisplay avatar={friend.avatar} size="sm" showBadge={friend.familyRole.slice(0, 1)} />
                            <span 
                              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${badge.dotBg}`}
                              title={badge.label}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white truncate">{friend.name}</span>
                              <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                Lvl {friend.level}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] mt-0.5">
                              <span className={`font-semibold flex items-center gap-1 ${badge.textClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.colorClass}`} />
                                <span>{badge.label}</span>
                              </span>
                              {friend.currentGame && (
                                <span className="text-amber-200/90 font-medium flex items-center gap-1">
                                  <span>•</span>
                                  <Gamepad2 className="w-3 h-3 text-amber-400" />
                                  <span className="truncate max-w-[150px]">{friend.currentGame}</span>
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {friend.id}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {(friend.status === 'online' || friend.status === 'in-game') && onInviteFriendToGame && (
                            <button
                              onClick={() => {
                                sound.playReward();
                                onInviteFriendToGame(friend);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1"
                              title="Zum Tisch einladen"
                            >
                              <Gamepad2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Einladen</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const updated = friendsService.toggleFavorite(user.id, friend.id);
                              setFriends(updated);
                            }}
                            className={`p-1.5 rounded-xl border transition ${
                              friend.isFavorite
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-amber-400'
                            }`}
                            title="Favorit"
                          >
                            <Star className={`w-3.5 h-3.5 ${friend.isFavorite ? 'fill-current' : ''}`} />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`"${friend.name}" aus Freundesliste entfernen?`)) {
                                const updated = friendsService.removeFriend(user.id, friend.id);
                                setFriends(updated);
                              }
                            }}
                            className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition"
                            title="Entfernen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* TAB 3: STATISTIKEN */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/50 border border-slate-700/70 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-black text-white">{user.stats.gamesPlayed}</div>
                  <div className="text-xs text-slate-400 mt-1">Gespielte Partien</div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/70 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-black text-emerald-400">{user.stats.gamesWon}</div>
                  <div className="text-xs text-slate-400 mt-1">Siege errungen</div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/70 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-black text-amber-400">{winRate}%</div>
                  <div className="text-xs text-slate-400 mt-1">Gewinnquote</div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/70 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-black text-indigo-400">{user.stats.tournamentsWon}</div>
                  <div className="text-xs text-slate-400 mt-1">Turnierpokale</div>
                </div>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/60 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Kategorie-Leistungen
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                    <span>Klassische Brettspiele (Mensch ärgere Dich nicht, Schach, Dame, 4 Gewinnt)</span>
                    <strong className="text-emerald-400">{user.stats.gamesPlayed > 0 ? `${winRate}% Quote` : 'Aktiv'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                    <span>Kartenspiele (Uno)</span>
                    <strong className="text-amber-400">{user.stats.gamesPlayed > 0 ? `${user.stats.gamesWon} Siege` : 'Bereit'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                    <span>Würfel- & Taktikspiele (Kniffel, Schiffe Versenken, Käsekästchen, Memo, Tic-Tac-Toe)</span>
                    <strong className="text-sky-400">100% Spielbar</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MATCH-HISTORIE */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {(!user.matchHistory || user.matchHistory.length === 0) ? (
                <div className="p-8 text-center text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                  <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="font-semibold text-sm">Noch keine Spiele in der Match-Historie verzeichnet.</p>
                  <p className="text-xs text-slate-500 mt-1">Starte ein Spiel am Familientisch, um deine Siege hier festzuhalten!</p>
                </div>
              ) : (
                user.matchHistory.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 bg-slate-800/50 border border-slate-700/70 rounded-2xl flex items-center justify-between gap-3 hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                        m.result === 'won'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {m.result === 'won' ? 'SIEG' : '2. PL'}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{m.gameTitle}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>vs. {m.opponentName}</span>
                          <span>•</span>
                          <span>{m.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div className="hidden sm:block">
                        <div className="text-xs font-mono font-bold text-amber-400">+{m.coinsEarned} Münzen</div>
                        <div className="text-[10px] text-slate-400">+{m.xpEarned} XP</div>
                      </div>
                      <div className="text-sm font-black font-mono text-white">
                        {m.score} Pkt.
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: EINSTELLUNGEN & SICHERHEIT */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {savedSuccess && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Deine Profiländerungen wurden erfolgreich gespeichert!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Spielername / Anzeigename
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Familien-Clan
                  </label>
                  <input
                    type="text"
                    value={clanInput}
                    onChange={(e) => setClanInput(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Familienrolle
                </label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Family Champion">🏆 Familien-Champion</option>
                  <option value="Parent">👨‍👩‍👧 Eltern</option>
                  <option value="Teen">🎮 Teenager</option>
                  <option value="Child">🧒 Kind (Junior)</option>
                  <option value="Grandparent">👵 Großeltern</option>
                </select>
              </div>

              {/* USER-FACING THEME & ACCENT COLOR SELECTOR */}
              <div className="p-4 bg-slate-800/50 border border-slate-700/80 rounded-2xl space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>App-Farbdesign & Akzentfarben</span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-semibold">
                          Theme
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Wähle deine bevorzugte Akzentfarbe für die gesamte Plattform
                      </p>
                    </div>
                  </div>

                  {/* Active theme badge preview */}
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${APP_THEMES[selectedThemeId]?.badgeClasses || ''}`}>
                    <span 
                      className="w-2.5 h-2.5 rounded-full shadow"
                      style={{ background: APP_THEMES[selectedThemeId]?.swatchGradient }}
                    />
                    <span>{APP_THEMES[selectedThemeId]?.nameEn || 'Classic Amber'}</span>
                  </div>
                </div>

                {/* 6 Theme Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {THEME_LIST.map((theme) => {
                    const isSelected = selectedThemeId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleSelectTheme(theme.id)}
                        className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800/90 ring-2 shadow-lg scale-[1.02]'
                            : 'bg-slate-900/80 border-slate-700/60 hover:border-slate-500 hover:bg-slate-800/60'
                        }`}
                        style={{
                          boxShadow: isSelected ? `0 0 16px ${theme.glowColor}` : undefined,
                          borderColor: isSelected ? theme.primaryColor : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          {/* Swatch sphere / badge */}
                          <div
                            className="w-7 h-7 rounded-xl shadow-md border border-white/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                            style={{ background: theme.swatchGradient }}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                          </div>

                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'text-slate-400'
                          }`}>
                            {theme.nameEn}
                          </span>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-white leading-tight">
                            {theme.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            {theme.tagline}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* USER-FACING LANGUAGE SELECTOR */}
              <div className="p-4 bg-slate-800/50 border border-slate-700/80 rounded-2xl space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Sprachauswahl (Language)</span>
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-semibold uppercase">
                        {selectedLang}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Wähle deine bevorzugte Sprache für FamPlay (Deutsch, English, Español, Français, Italiano, 日本語)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'de', flag: '🇩🇪', label: 'Deutsch' },
                    { id: 'en', flag: '🇬🇧', label: 'English' },
                    { id: 'es', flag: '🇪🇸', label: 'Español' },
                    { id: 'fr', flag: '🇫🇷', label: 'Français' },
                    { id: 'it', flag: '🇮🇹', label: 'Italiano' },
                    { id: 'ja', flag: '🇯🇵', label: '日本語' },
                  ].map((l) => {
                    const isSelected = selectedLang === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setSelectedLang(l.id as any);
                          setStoredLanguage(l.id as any);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <span className="text-base">{l.flag}</span>
                        <span>{l.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-amber-300" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  Konto-Sicherheit & Anmeldedaten
                </div>
                <div className="text-xs text-slate-400">
                  Verknüpfte E-Mail: <strong className="text-slate-200">{user.email || 'Nicht verknüpft'}</strong>
                </div>
                <div className="text-xs text-slate-400">
                  Berechtigungs-Rolle: <strong className="text-amber-400 uppercase">{user.role || 'Spieler'}</strong>
                </div>
              </div>

              {/* Android App & WebAPK Launcher Card */}
              {onOpenAndroidModal && (
                <div className="p-4 bg-gradient-to-r from-emerald-950/60 to-slate-800 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>FamPlay für Android</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">App</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Als Vollbild-App auf dem Smartphone oder Tablet installieren
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onOpenAndroidModal();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    App-Hub
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onLogout();
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" /> Abmelden
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playReward();
                      onUpdateUser({
                        ...user,
                        xp: 0,
                        level: 1,
                        streakDays: 0,
                        stats: {
                          gamesPlayed: 0,
                          gamesWon: 0,
                          tournamentsWon: 0,
                          favoriteGame: 'Mensch ärgere Dich nicht',
                        },
                        matchHistory: [],
                      });
                      setSavedSuccess(true);
                      setTimeout(() => setSavedSuccess(false), 2500);
                    }}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
                    title="Alle eigenen Statistiken und die Match-Historie zurücksetzen"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Spieldaten leeren</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-md"
                >
                  Änderungen speichern
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>FamPlay Benutzer-Zentrale v2.4</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
          >
            Schließen
          </button>
        </div>

      </div>

      {/* Embedded Fullscreen Friends List Center */}
      <FriendsListModal
        isOpen={isFriendsModalOpen}
        onClose={() => {
          setIsFriendsModalOpen(false);
          setFriends(friendsService.getFriends(user.id));
        }}
        currentUser={user}
        onInviteToGame={(friend) => {
          setIsFriendsModalOpen(false);
          if (onInviteFriendToGame) {
            onInviteFriendToGame(friend);
          }
        }}
      />
    </div>
  );
};

