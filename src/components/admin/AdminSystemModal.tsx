import React, { useState } from 'react';
import { UserProfile, GameRoom, ModerationReport, GameInfo, AdminAuditLog } from '../../types';
import { authService } from '../../services/authService';
import { sound } from '../../services/sound';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { 
  ShieldAlert, 
  Users, 
  Gamepad2, 
  AlertTriangle, 
  Megaphone, 
  Activity, 
  KeyRound, 
  Trash2, 
  CheckCircle2, 
  X, 
  Lock, 
  Unlock, 
  Search, 
  Coins, 
  Crown, 
  VolumeX, 
  Radio, 
  Server, 
  Eye, 
  History,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Ban
} from 'lucide-react';

interface AdminSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allGames: GameInfo[];
  rooms: GameRoom[];
  reports: ModerationReport[];
  onUpdateGameCatalog: (updatedGames: GameInfo[]) => void;
  onResolveReport: (reportId: string, action: 'dismiss' | 'mute' | 'warn' | 'ban') => void;
  onBroadcastAnnouncement: (message: string) => void;
  onTerminateRoom: (roomId: string) => void;
  onUserRoleChange: (userId: string, newRole: 'admin' | 'moderator' | 'user') => void;
  onRefreshUsers: () => void;
}

export const AdminSystemModal: React.FC<AdminSystemModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allGames,
  rooms,
  reports,
  onUpdateGameCatalog,
  onResolveReport,
  onBroadcastAnnouncement,
  onTerminateRoom,
  onUserRoleChange,
  onRefreshUsers,
}) => {
  // Authentication gate state
  const isDirectAdmin = currentUser.role === 'admin';
  const [isUnlocked, setIsUnlocked] = useState<boolean>(isDirectAdmin);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'games' | 'reports' | 'rooms' | 'broadcast' | 'logs'>('overview');

  // Broadcast state
  const [broadcastText, setBroadcastText] = useState<string>('');
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);

  // Users management state
  const [usersList, setUsersList] = useState<UserProfile[]>(authService.getUsers());
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(authService.getAuditLogs());

  // Game catalog management search
  const [gameSearch, setGameSearch] = useState<string>('');
  const [gameCategoryFilter, setGameCategoryFilter] = useState<string>('all');

  // Feedback notifications
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleUnlockWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '7777' || pinInput === 'admin123' || pinInput.toLowerCase() === 'admin') {
      sound.playReward();
      setIsUnlocked(true);
      setPinError(null);
      authService.addAuditLog('ADMIN_LOGIN_PIN', currentUser.name, 'Admin-Konsole mit Master-PIN autorisiert.');
      setAuditLogs(authService.getAuditLogs());
    } else {
      sound.playError();
      setPinError('Ungültiger Administrator-PIN. (Tipp: 7777 oder admin123)');
    }
  };

  // Broadcast
  const handleSendBroadcast = (msg: string) => {
    if (!msg.trim()) return;
    sound.playReward();
    onBroadcastAnnouncement(msg.trim());
    authService.addAuditLog('BROADCAST_SENT', 'Globaler Ticker', `Nachricht: "${msg.trim()}"`);
    setAuditLogs(authService.getAuditLogs());
    setBroadcastFeedback('Globale Ankündigung erfolgreich an alle aktiven Spieler gesendet!');
    setTimeout(() => setBroadcastFeedback(null), 3500);
    setBroadcastText('');
  };

  // Users management actions
  const handleToggleBan = (u: UserProfile) => {
    sound.playClick();
    const updated = usersList.map((usr) => {
      if (usr.id === u.id) {
        const nextBanned = !usr.isBanned;
        return {
          ...usr,
          isBanned: nextBanned,
          banReason: nextBanned ? 'Verstoß gegen Community-Richtlinien' : undefined,
        };
      }
      return usr;
    });
    setUsersList(updated);
    authService.saveUsers(updated);
    authService.addAuditLog(
      u.isBanned ? 'USER_UNBANNED' : 'USER_BANNED',
      u.name,
      u.isBanned ? 'Spieler-Sperre aufgehoben' : 'Spieler dauerhaft gesperrt'
    );
    setAuditLogs(authService.getAuditLogs());
    showNotice(u.isBanned ? `${u.name} wurde entsperrt.` : `${u.name} wurde gesperrt.`);
    onRefreshUsers();
  };

  const handleRoleChange = (userId: string, newRole: 'admin' | 'moderator' | 'user') => {
    sound.playReward();
    const updated = usersList.map((usr) => {
      if (usr.id === userId) {
        return { ...usr, role: newRole };
      }
      return usr;
    });
    setUsersList(updated);
    authService.saveUsers(updated);
    const targetUser = usersList.find((usr) => usr.id === userId);
    authService.addAuditLog('ROLE_CHANGED', targetUser?.name || userId, `Rolle geändert zu: ${newRole.toUpperCase()}`);
    setAuditLogs(authService.getAuditLogs());
    showNotice(`Rolle geändert zu ${newRole.toUpperCase()}.`);
    onUserRoleChange(userId, newRole);
    onRefreshUsers();
  };

  const handleGrantCoins = (userId: string, amount: number) => {
    sound.playReward();
    const updated = usersList.map((usr) => {
      if (usr.id === userId) {
        return { ...usr, coins: usr.coins + amount };
      }
      return usr;
    });
    setUsersList(updated);
    authService.saveUsers(updated);
    const target = usersList.find((u) => u.id === userId);
    authService.addAuditLog('GRANT_COINS', target?.name || userId, `+${amount} Münzen gutgeschrieben.`);
    setAuditLogs(authService.getAuditLogs());
    showNotice(`+${amount} Münzen an ${target?.name} gutgeschrieben!`);
    onRefreshUsers();
  };

  const handleToggleVip = (userId: string) => {
    sound.playReward();
    const updated = usersList.map((usr) => {
      if (usr.id === userId) {
        return { ...usr, isVip: !usr.isVip };
      }
      return usr;
    });
    setUsersList(updated);
    authService.saveUsers(updated);
    const target = usersList.find((u) => u.id === userId);
    authService.addAuditLog('TOGGLE_VIP', target?.name || userId, `VIP-Status umgeschaltet.`);
    setAuditLogs(authService.getAuditLogs());
    showNotice(`VIP-Status für ${target?.name} aktualisiert.`);
    onRefreshUsers();
  };

  // Game catalog toggles
  const handleToggleGameMaintenance = (gameId: string) => {
    sound.playClick();
    const updated = allGames.map((g) => {
      if (g.id === gameId) {
        return { ...g, maintenance: !g.maintenance };
      }
      return g;
    });
    onUpdateGameCatalog(updated);
    const game = allGames.find((g) => g.id === gameId);
    authService.addAuditLog('GAME_STATUS', game?.title || gameId, 'Wartungsmodus umgeschaltet.');
    setAuditLogs(authService.getAuditLogs());
    showNotice(`Wartungsstatus für ${game?.title} geändert.`);
  };

  const handleToggleGameFeatured = (gameId: string) => {
    sound.playReward();
    const updated = allGames.map((g) => {
      if (g.id === gameId) {
        return { ...g, featured: !g.featured };
      }
      return g;
    });
    onUpdateGameCatalog(updated);
    const game = allGames.find((g) => g.id === gameId);
    authService.addAuditLog('GAME_FEATURED', game?.title || gameId, 'Featured-Status geändert.');
    setAuditLogs(authService.getAuditLogs());
    showNotice(`Empfehlungs-Status für ${game?.title} geändert.`);
  };

  // Filtered lists
  const filteredUsers = usersList.filter((u) => {
    if (userRoleFilter === 'admin' && u.role !== 'admin') return false;
    if (userRoleFilter === 'moderator' && u.role !== 'moderator') return false;
    if (userRoleFilter === 'user' && u.role !== 'user') return false;
    if (userRoleFilter === 'banned' && !u.isBanned) return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.clanName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredGames = allGames.filter((g) => {
    if (gameCategoryFilter !== 'all' && g.category !== gameCategoryFilter) return false;
    if (gameSearch.trim()) {
      const q = gameSearch.toLowerCase();
      return g.title.toLowerCase().includes(q) || g.tags.some((t) => t.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-700 via-red-600 to-amber-600 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-black/20 border border-white/20 flex items-center justify-center text-white shadow-inner">
              <ShieldAlert className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display tracking-tight text-white">
                  FamPlay Administrator Command Center
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/30 border border-white/20 px-2 py-0.5 rounded-full">
                  Root Admin
                </span>
              </div>
              <p className="text-xs text-white/80">
                Plattform-Verwaltung, Benutzerkonten, Spielekatalog & Live-Überwachung
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN SECURITY GATE IF NOT UNLOCKED */}
        {!isUnlocked ? (
          <div className="p-8 max-w-md mx-auto text-center space-y-6 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Administrator-Zugang gesperrt</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Der Zugriff auf das zentrale Adminsystem erfordert Administrator-Rechte oder den Master-Sicherheits-PIN.
              </p>
            </div>

            {pinError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-xs text-rose-300 font-semibold">
                {pinError}
              </div>
            )}

            <form onSubmit={handleUnlockWithPin} className="space-y-3">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Master-PIN eingeben (Tipp: 7777)"
                className="w-full text-center bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 tracking-widest font-mono font-bold"
                autoFocus
              />
              
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-xs transition shadow-lg flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" /> Admin-System freischalten
              </button>
            </form>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playReward();
                  setPinInput('7777');
                }}
                className="text-xs text-amber-400 hover:underline"
              >
                1-Klick Master-PIN einfügen (7777)
              </button>
            </div>
          </div>
        ) : (
          /* UNLOCKED FULL ADMIN PANEL */
          <>
            {/* Top Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 sm:px-6 gap-1 overflow-x-auto scrollbar-none">
              <button
                onClick={() => { sound.playClick(); setActiveTab('overview'); }}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'overview'
                    ? 'border-rose-400 text-rose-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-4 h-4" /> Dashboard & Metriken
              </button>

              <button
                onClick={() => { sound.playClick(); setActiveTab('users'); }}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'users'
                    ? 'border-rose-400 text-rose-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" /> Benutzer ({usersList.length})
              </button>

              <button
                onClick={() => { sound.playClick(); setActiveTab('games'); }}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'games'
                    ? 'border-rose-400 text-rose-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Gamepad2 className="w-4 h-4" /> Spiele-Katalog ({allGames.length})
              </button>

              <button
                onClick={() => { sound.playClick(); setActiveTab('reports'); }}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'reports'
                    ? 'border-rose-400 text-rose-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4" /> Meldungen ({reports.filter((r) => r.status === 'pending').length})
              </button>

              <button
                onClick={() => { sound.playClick(); setActiveTab('rooms'); }}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'rooms'
                    ? 'border-rose-400 text-rose-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-4 h-4" /> Live-Tische ({rooms.length})
              </button>

              <button
                onClick={() => { sound.playClick(); setActiveTab('broadcast'); }}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'broadcast'
                    ? 'border-rose-400 text-rose-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Megaphone className="w-4 h-4" /> Ankündigungen
              </button>

              <button
                onClick={() => { sound.playClick(); setActiveTab('logs'); }}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'logs'
                    ? 'border-rose-400 text-rose-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-4 h-4" /> Audit-Log
              </button>
            </div>

            {/* Notification alert toast */}
            {actionNotice && (
              <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-6 py-2.5 text-xs text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{actionNotice}</span>
              </div>
            )}

            {/* TAB CONTENT */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* TAB 1: OVERVIEW & SYSTEM METRICS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  
                  {/* Status Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-transparent border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <div className="font-bold text-sm text-white">Alle Spiel-Server operational</div>
                        <div className="text-xs text-slate-400">Node Cluster · Frankfurt am Main (eu-west3) · Latenz 14ms</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                      Uptime 99.98%
                    </span>
                  </div>

                  {/* High level metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-2xl">
                      <div className="text-xs text-slate-400 font-bold mb-1">Spieler Online</div>
                      <div className="text-2xl font-black font-mono text-emerald-400">1,482</div>
                      <div className="text-[10px] text-slate-500 mt-1">Gleichzeitige Verbindungen</div>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-2xl">
                      <div className="text-xs text-slate-400 font-bold mb-1">Aktive Tische</div>
                      <div className="text-2xl font-black font-mono text-indigo-400">{rooms.length * 142 + 28}</div>
                      <div className="text-[10px] text-slate-500 mt-1">Inklusive privater Räume</div>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-2xl">
                      <div className="text-xs text-slate-400 font-bold mb-1">Registrierte Konten</div>
                      <div className="text-2xl font-black font-mono text-amber-400">{usersList.length * 1240 + 890}</div>
                      <div className="text-[10px] text-slate-500 mt-1">Davon {usersList.filter((u) => u.isVip).length} VIP Pässe</div>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-2xl">
                      <div className="text-xs text-slate-400 font-bold mb-1">Offene Meldungen</div>
                      <div className="text-2xl font-black font-mono text-rose-400">
                        {reports.filter((r) => r.status === 'pending').length}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Dringender Prüfbedarf</div>
                    </div>
                  </div>

                  {/* Quick System Tools */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl">
                      <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <Radio className="w-4 h-4 text-emerald-400" /> WebRTC Voice Cluster
                      </h4>
                      <p className="text-xs text-slate-400 mb-3">
                        Auslastung: 24% · Optionaler Voice-Chat läuft stabil ohne Packet-Loss.
                      </p>
                      <button
                        onClick={() => { sound.playReward(); showNotice('Voice-Cluster Cache geleert.'); }}
                        className="text-xs font-bold text-slate-200 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-xl transition w-full"
                      >
                        Cache synchronisieren
                      </button>
                    </div>

                    <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl">
                      <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-amber-400" /> Schneller Notfall-Alert
                      </h4>
                      <p className="text-xs text-slate-400 mb-3">
                        Sofortigen Wartungshinweis an alle Bildschirme senden.
                      </p>
                      <button
                        onClick={() => handleSendBroadcast('⚠️ Wartungs-Check in 10 Minuten · Spielstände werden gesichert.')}
                        className="text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1.5 rounded-xl transition w-full"
                      >
                        Wartungs-Banner senden
                      </button>
                    </div>

                    <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl">
                      <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <Coins className="w-4 h-4 text-yellow-400" /> Community-Währung
                      </h4>
                      <p className="text-xs text-slate-400 mb-3">
                        Wochenend-Bonus aktivieren (+100% Münzen für alle Partien).
                      </p>
                      <button
                        onClick={() => {
                          sound.playReward();
                          handleSendBroadcast('🎉 Wochenend-Event aktiv: Doppelte Münzen und XP an allen Tischen!');
                        }}
                        className="text-xs font-bold text-yellow-300 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 px-3 py-1.5 rounded-xl transition w-full"
                      >
                        Doppel-XP Event starten
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: USER MANAGEMENT */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  
                  {/* Filters & Search */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Benutzer, E-Mail oder Clan suchen..."
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-xs text-slate-200 font-bold rounded-2xl px-3 py-2 focus:outline-none focus:border-rose-400 cursor-pointer"
                      >
                        <option value="all">Alle Rollen</option>
                        <option value="admin">Nur Admins</option>
                        <option value="moderator">Nur Moderatoren</option>
                        <option value="user">Nur Spieler</option>
                        <option value="banned">Nur Gesperrte</option>
                      </select>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/80 border-b border-slate-700 text-slate-400 uppercase font-semibold">
                          <tr>
                            <th className="py-3 px-4">Benutzer</th>
                            <th className="py-3 px-3">E-Mail & Clan</th>
                            <th className="py-3 px-3">Rolle</th>
                            <th className="py-3 px-3">Level / Münzen</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-4 text-right">Aktionen</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                          {filteredUsers.map((u) => {
                            const isCurrent = u.id === currentUser.id;

                            return (
                              <tr key={u.id} className="hover:bg-slate-800/50 transition">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <AvatarDisplay avatar={u.avatar} size="sm" showBadge={u.familyRole.slice(0, 1)} />
                                    <div>
                                      <div className="font-bold text-white flex items-center gap-1.5">
                                        {u.name}
                                        {isCurrent && (
                                          <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1 rounded">Du</span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400">{u.familyRole}</div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-3">
                                  <div className="text-slate-300 font-mono text-[11px]">{u.email || '-'}</div>
                                  <div className="text-slate-500 text-[10px]">{u.clanName}</div>
                                </td>

                                <td className="py-3 px-3">
                                  <select
                                    value={u.role || 'user'}
                                    onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                                    className="bg-slate-900 border border-slate-700 text-[11px] rounded-xl px-2 py-1 text-slate-200 font-bold focus:outline-none focus:border-rose-400 cursor-pointer"
                                  >
                                    <option value="admin">👑 Admin</option>
                                    <option value="moderator">🛡️ Moderator</option>
                                    <option value="user">🎮 Spieler</option>
                                  </select>
                                </td>

                                <td className="py-3 px-3">
                                  <div className="font-bold text-white">Lv. {u.level}</div>
                                  <div className="text-amber-400 font-mono text-[11px] flex items-center gap-1">
                                    <Coins className="w-3 h-3 fill-current" /> {u.coins.toLocaleString()}
                                  </div>
                                </td>

                                <td className="py-3 px-3">
                                  {u.isBanned ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                      Gesperrt
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                      Aktiv
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleGrantCoins(u.id, 500)}
                                      className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition text-[10px] font-bold"
                                      title="+500 Münzen schenken"
                                    >
                                      +500 🪙
                                    </button>

                                    <button
                                      onClick={() => handleToggleVip(u.id)}
                                      className={`p-1.5 rounded-lg border transition ${
                                        u.isVip
                                          ? 'bg-amber-400 text-slate-950 font-bold'
                                          : 'bg-slate-700 text-slate-300 border-slate-600'
                                      }`}
                                      title={u.isVip ? 'VIP entziehen' : 'VIP schenken'}
                                    >
                                      <Crown className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handleToggleBan(u)}
                                      className={`p-1.5 rounded-lg border transition text-[10px] font-bold ${
                                        u.isBanned
                                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                                          : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                                      }`}
                                      title={u.isBanned ? 'Konto entsperren' : 'Konto sperren'}
                                    >
                                      {u.isBanned ? 'Entsperren' : 'Bannen'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: GAME CATALOG MANAGER */}
              {activeTab === 'games' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={gameSearch}
                        onChange={(e) => setGameSearch(e.target.value)}
                        placeholder="Spieltitel suchen..."
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={gameCategoryFilter}
                        onChange={(e) => setGameCategoryFilter(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-xs text-slate-200 font-bold rounded-2xl px-3 py-2 focus:outline-none focus:border-rose-400 cursor-pointer"
                      >
                        <option value="all">Alle Kategorien</option>
                        <option value="board">Brettspiele</option>
                        <option value="cards">Kartenspiele</option>
                        <option value="dice">Würfelspiele</option>
                        <option value="party">Gesellschaftsspiele</option>
                        <option value="strategy">Strategie</option>
                        <option value="kids">Kinder</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredGames.slice(0, 30).map((g) => (
                      <div
                        key={g.id}
                        className="p-3.5 bg-slate-800/50 border border-slate-700/70 rounded-2xl flex items-center justify-between gap-3 hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                            {g.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-white truncate flex items-center gap-2">
                              {g.title}
                              {g.featured && (
                                <span className="text-[9px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded">
                                  Top
                                </span>
                              )}
                              {g.maintenance && (
                                <span className="text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded">
                                  Wartung
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="capitalize">{g.category}</span>
                              <span>•</span>
                              <span>{g.players}</span>
                              <span>•</span>
                              <span>Ab {g.minAge} J.</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggleGameFeatured(g.id)}
                            className={`p-2 rounded-xl border text-xs font-bold transition ${
                              g.featured
                                ? 'bg-amber-400 text-slate-950 border-amber-300'
                                : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                            }`}
                            title={g.featured ? 'Aus Empfehlungen entfernen' : 'Als Empfehlung markieren'}
                          >
                            ★
                          </button>

                          <button
                            onClick={() => handleToggleGameMaintenance(g.id)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                              g.maintenance
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                          >
                            {g.maintenance ? 'Im Bau' : 'Aktiv'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredGames.length > 30 && (
                    <div className="text-center text-xs text-slate-500 py-2">
                      Zeige die ersten 30 von {filteredGames.length} Spielen. Nutze die Suche für spezifische Titel.
                    </div>
                  )}

                </div>
              )}

              {/* TAB 4: MODERATION REPORTS */}
              {activeTab === 'reports' && (
                <div className="space-y-4">
                  {reports.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                      <p className="font-semibold text-sm">Keine offenen Meldungen vorhanden.</p>
                      <p className="text-xs text-slate-500 mt-1">Die Spielumgebung ist aktuell friedlich und sicher.</p>
                    </div>
                  ) : (
                    reports.map((r) => (
                      <div
                        key={r.id}
                        className={`p-4 rounded-2xl border transition ${
                          r.status === 'pending'
                            ? 'bg-rose-500/10 border-rose-500/30'
                            : 'bg-slate-800/30 border-slate-700/50 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                            <span className="font-bold text-sm text-white">
                              Gemeldet: <strong className="text-rose-300">{r.reportedUser}</strong>
                            </span>
                            <span className="text-xs text-slate-400">durch {r.reportedBy}</span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {r.timestamp} · Raum: {r.roomCode}
                          </div>
                        </div>

                        <div className="text-xs text-slate-300 mb-2">
                          <strong>Grund:</strong> {r.reason}
                        </div>

                        {r.chatSnippet && (
                          <div className="p-2.5 bg-black/40 border border-slate-800 rounded-xl font-mono text-xs text-rose-200/90 mb-3">
                            "{r.chatSnippet}"
                          </div>
                        )}

                        {r.status === 'pending' && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => {
                                sound.playClick();
                                onResolveReport(r.id, 'warn');
                                showNotice(`Verwarnung an ${r.reportedUser} ausgesprochen.`);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition"
                            >
                              Verwarnen
                            </button>
                            <button
                              onClick={() => {
                                sound.playClick();
                                onResolveReport(r.id, 'mute');
                                showNotice(`${r.reportedUser} wurde für 24h stummgeschaltet.`);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition"
                            >
                              24h Stummschalten
                            </button>
                            <button
                              onClick={() => {
                                sound.playClick();
                                onResolveReport(r.id, 'dismiss');
                                showNotice(`Meldung als gegenstandslos verworfen.`);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition ml-auto"
                            >
                              Verwerfen
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: ACTIVE TABLES / ROOMS */}
              {activeTab === 'rooms' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className="p-4 bg-slate-800/50 border border-slate-700/70 rounded-2xl space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-sm text-white">{room.name}</div>
                            <div className="text-xs text-slate-400">Spiel: {room.gameTitle}</div>
                          </div>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {room.code}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 flex items-center justify-between">
                          <span>Host: <strong>{room.hostName}</strong></span>
                          <span>{room.currentPlayers} / {room.maxPlayers} Spieler</span>
                          <span>Voice: {room.voiceChatActive ? 'Aktiv' : 'Aus'}</span>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <button
                            onClick={() => {
                              sound.playClick();
                              onBroadcastAnnouncement(`📢 Admin-Mitteilung an Tisch ${room.code}: Bitte achtet auf ein faires Miteinander!`);
                              showNotice(`Nachricht an Tisch ${room.code} gesendet.`);
                            }}
                            className="text-xs text-amber-400 hover:underline font-semibold"
                          >
                            Hinweis senden
                          </button>
                          <button
                            onClick={() => {
                              sound.playError();
                              onTerminateRoom(room.id);
                              showNotice(`Tisch ${room.name} (${room.code}) wurde beendet.`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Tisch schließen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: GLOBAL BROADCASTS */}
              {activeTab === 'broadcast' && (
                <div className="space-y-6">
                  
                  {broadcastFeedback && (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{broadcastFeedback}</span>
                    </div>
                  )}

                  <div className="bg-slate-800/40 border border-slate-700/70 rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-amber-400" />
                      Globale Live-Durchsage ausstrahlen
                    </h3>
                    <p className="text-xs text-slate-400">
                      Diese Nachricht erscheint als auffälliges Live-Banner über allen aktiven Spielen und am Hauptbildschirm.
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={broadcastText}
                        onChange={(e) => setBroadcastText(e.target.value)}
                        placeholder="z.B. Wartungsarbeiten in 15 Min · Neues Turnier gestartet..."
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
                      />
                      <button
                        onClick={() => handleSendBroadcast(broadcastText)}
                        disabled={!broadcastText.trim()}
                        className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-md shrink-0"
                      >
                        Ausstrahlen
                      </button>
                    </div>

                    <div className="pt-2">
                      <div className="text-xs font-bold text-slate-300 mb-2">Schnell-Vorlagen:</div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setBroadcastText('🎲 Willkommen am virtuellen FamPlay-Spieltisch · Viel Spaß bei den Klassikern!')}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700"
                        >
                          Willkommens-Gruß
                        </button>
                        <button
                          onClick={() => setBroadcastText('🏆 Das Wochenend-Turnier in "Mensch ärgere Dich nicht" hat begonnen!')}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700"
                        >
                          Turnier-Start
                        </button>
                        <button
                          onClick={() => setBroadcastText('⚡ Server-Wartung in 10 Minuten · Spielstände werden automatisch gesichert.')}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700"
                        >
                          Wartungshinweis
                        </button>
                        <button
                          onClick={() => setBroadcastText('🪙 Doppelter Münzen-Bonus für alle Familien-Partien bis Mitternacht!')}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700"
                        >
                          Bonus-Event
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 7: AUDIT LOGS */}
              {activeTab === 'logs' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-400">Aufzeichnung aller Administrator-Aktionen</span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setAuditLogs([]);
                        authService.saveUsers(usersList);
                        showNotice('Audit-Log geleert.');
                      }}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Log leeren
                    </button>
                  </div>

                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">{log.action}</span>
                          <span className="text-white font-semibold">Ziel: {log.target}</span>
                        </div>
                        <div className="text-slate-400 mt-0.5">{log.details}</div>
                      </div>
                      <div className="text-slate-500 font-mono text-[10px] shrink-0 text-right">
                        <div>{log.timestamp}</div>
                        <div>von {log.adminName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Eingeloggt als Administrator: <strong className="text-white">{currentUser.name}</strong></span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
              >
                Schließen
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
