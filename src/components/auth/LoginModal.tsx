import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { authService, INITIAL_DEMO_USERS } from '../../services/authService';
import { sound } from '../../services/sound';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { 
  LogIn, 
  UserPlus, 
  KeyRound, 
  Mail, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  Crown, 
  Sparkles,
  ArrowRight,
  Users
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserChanged: (newUser: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'switch'>('switch');
  const [emailOrName, setEmailOrName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Registration state
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<'Child' | 'Teen' | 'Parent' | 'Grandparent' | 'Family Champion'>('Family Champion');
  const [regClan, setRegClan] = useState<string>('Familie');

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!emailOrName.trim()) {
      setErrorMsg('Bitte gib eine E-Mail-Adresse oder einen Benutzernamen ein.');
      sound.playError();
      return;
    }

    const res = authService.login(emailOrName, password);
    if (res.success && res.user) {
      sound.playReward();
      setSuccessMsg(`Willkommen zurück, ${res.user.name}!`);
      setTimeout(() => {
        onUserChanged(res.user!);
        onClose();
      }, 700);
    } else {
      sound.playError();
      setErrorMsg(res.error || 'Ungültige Anmeldedaten.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regEmail.trim()) {
      setErrorMsg('Bitte fülle alle erforderlichen Felder aus.');
      sound.playError();
      return;
    }

    const res = authService.register({
      name: regName,
      email: regEmail,
      familyRole: regRole,
      clanName: regClan,
    });

    if (res.success && res.user) {
      sound.playReward();
      setSuccessMsg(`Konto erfolgreich erstellt! Willkommen bei FamPlay, ${res.user.name}!`);
      setTimeout(() => {
        onUserChanged(res.user!);
        onClose();
      }, 800);
    } else {
      sound.playError();
      setErrorMsg(res.error || 'Fehler beim Erstellen des Kontos.');
    }
  };

  const handleSelectDemoAccount = (u: UserProfile) => {
    sound.playReward();
    authService.setCurrentUser(u);
    setSuccessMsg(`Eingeloggt als ${u.name}!`);
    setTimeout(() => {
      onUserChanged(u);
      onClose();
    }, 400);
  };

  const demoAccounts = authService.getUsers();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-indigo-600/20 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">FamPlay Benutzerkonto</h2>
              <p className="text-xs text-slate-400">Anmelden, Registrieren oder Schnell-Login für die Familie</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2">
          <button
            onClick={() => { sound.playClick(); setMode('switch'); setErrorMsg(null); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              mode === 'switch'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Profile & Schnell-Login
          </button>
          <button
            onClick={() => { sound.playClick(); setMode('login'); setErrorMsg(null); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              mode === 'login'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" /> Anmelden
          </button>
          <button
            onClick={() => { sound.playClick(); setMode('register'); setErrorMsg(null); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              mode === 'register'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Registrieren
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-center gap-3 text-rose-300 text-xs font-semibold animate-in shake">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: SCHNELL-LOGIN / DEMO PROFILE */}
          {mode === 'switch' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 border border-slate-700/60 p-3.5 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block mb-0.5">Schneller 1-Klick Profilwechsel</span>
                  Wähle ein Familienkonto oder das Administrator-Konto aus, um sofort die entsprechenden Berechtigungen zu testen.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {demoAccounts.map((account) => {
                  const isCurrent = account.id === currentUser.id;
                  const isAdmin = account.role === 'admin';
                  const isMod = account.role === 'moderator';

                  return (
                    <button
                      key={account.id}
                      onClick={() => handleSelectDemoAccount(account)}
                      className={`text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 relative overflow-hidden group ${
                        isCurrent
                          ? 'bg-amber-500/15 border-amber-400/80 ring-2 ring-amber-400/30'
                          : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      <AvatarDisplay avatar={account.avatar} size="md" showBadge={account.familyRole.slice(0, 1)} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white truncate block">
                            {account.name}
                          </span>
                          {isAdmin && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Admin
                            </span>
                          )}
                          {isMod && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Mod
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="text-amber-400 font-semibold">{account.familyRole}</span>
                          <span>•</span>
                          <span>Lv. {account.level}</span>
                        </div>

                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {account.email}
                        </div>
                      </div>

                      {isCurrent ? (
                        <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                          ✓
                        </div>
                      ) : (
                        <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ANMELDEN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  E-Mail-Adresse oder Benutzername
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={emailOrName}
                    onChange={(e) => setEmailOrName(e.target.value)}
                    placeholder="z.B. admin@famplay.com oder Alex Gamer"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Passwort
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Angemeldet bleiben</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setEmailOrName('admin@famplay.com');
                    setPassword('admin123');
                  }}
                  className="text-amber-400 hover:underline"
                >
                  Admin-Konto ausfüllen
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Anmelden
              </button>
            </form>
          )}

          {/* TAB 3: REGISTRIEREN */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Spielername / Vorname
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="z.B. Lukas Gamer"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="lukas@familie.de"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Familienrolle
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as any)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition"
                  >
                    <option value="Family Champion">🏆 Familien-Champion</option>
                    <option value="Parent">👨‍👩‍👧 Eltern</option>
                    <option value="Teen">🎮 Teenager</option>
                    <option value="Child">🧒 Kind (Junior)</option>
                    <option value="Grandparent">👵 Großeltern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Familien-Clan Name
                  </label>
                  <input
                    type="text"
                    value={regClan}
                    onChange={(e) => setRegClan(e.target.value)}
                    placeholder="Die Schumachers"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Passwort wählen
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mindestens 6 Zeichen"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-200/90 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Neues Konto erhält automatisch 500 Willkommens-Münzen & 20 Edelsteine!</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Kostenlos Registrieren
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Angemeldet als: <strong className="text-white">{currentUser.name}</strong></span>
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
