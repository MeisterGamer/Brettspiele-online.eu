import React, { useState } from 'react';
import { UserProfile, MatchHistoryItem } from '../../types';
import { sound } from '../../services/sound';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
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
  Award
} from 'lucide-react';

interface UserPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onOpenAvatarStudio: () => void;
  onOpenLoginSwitcher: () => void;
  onLogout: () => void;
}

export const UserPanelModal: React.FC<UserPanelModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onOpenAvatarStudio,
  onOpenLoginSwitcher,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'history' | 'settings'>('overview');
  
  // Settings edit state
  const [nameInput, setNameInput] = useState<string>(user.name);
  const [clanInput, setClanInput] = useState<string>(user.clanName);
  const [roleInput, setRoleInput] = useState<any>(user.familyRole);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const winRate = user.stats.gamesPlayed > 0 
    ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100) 
    : 0;

  const xpForNextLevel = user.level * 500;
  const currentLevelProgress = Math.min(100, Math.round(((user.xp % 500) / 500) * 100));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playReward();
    onUpdateUser({
      ...user,
      name: nameInput.trim() || user.name,
      clanName: clanInput.trim() || user.clanName,
      familyRole: roleInput,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenLoginSwitcher();
                }}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs transition flex items-center gap-1.5"
                title="Profil wechseln"
              >
                <Users className="w-3.5 h-3.5" /> Profil wechseln
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
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2">
          <button
            onClick={() => { sound.playClick(); setActiveTab('overview'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> Übersicht & Level
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('stats'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Statistiken & Siege
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('history'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" /> Match-Historie
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('settings'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" /> Einstellungen & Sicherheit
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
                <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-amber-400 mb-2">
                    <span className="text-xs font-bold text-slate-400">Münzen</span>
                    <Coins className="w-5 h-5 fill-current" />
                  </div>
                  <div className="text-xl font-black font-mono text-white">
                    {user.coins.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-sky-400 mb-2">
                    <span className="text-xs font-bold text-slate-400">Edelsteine</span>
                    <Gem className="w-5 h-5 fill-current" />
                  </div>
                  <div className="text-xl font-black font-mono text-white">
                    {user.gems.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-orange-400 mb-2">
                    <span className="text-xs font-bold text-slate-400">Tages-Streak</span>
                    <Flame className="w-5 h-5 fill-current" />
                  </div>
                  <div className="text-xl font-black text-white">
                    {user.streakDays} Tage
                  </div>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-amber-300 mb-2">
                    <span className="text-xs font-bold text-slate-400">VIP Status</span>
                    <Crown className="w-5 h-5 fill-current" />
                  </div>
                  <div className="text-sm font-black text-white">
                    {user.isVip ? 'Aktiv (2x XP)' : 'Standard'}
                  </div>
                </div>
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

            </div>
          )}

          {/* TAB 2: STATISTIKEN */}
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
                    <span>Brettspiele (Ludo, Schach, Dame, Mühle)</span>
                    <strong className="text-emerald-400">68% Winrate</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                    <span>Kartenspiele (FamCards Uno, Skat, Doppelkopf)</span>
                    <strong className="text-amber-400">54% Winrate</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                    <span>Würfel- & Gesellschaftsspiele (Yatzy, Schiffe)</span>
                    <strong className="text-sky-400">72% Winrate</strong>
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

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onLogout();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" /> Konto abmelden
                </button>

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
    </div>
  );
};
