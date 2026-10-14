import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { apiAuth } from '../../services/apiAuth';
import { sound } from '../../services/sound';
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
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  onUserChanged: (newUser: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [emailOrName, setEmailOrName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Registration state
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<string>('Familien-Champion');
  const [regClan, setRegClan] = useState<string>('Familie');

  // Status & Feedback
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!emailOrName.trim() || !password) {
      setErrorMsg('Bitte Benutzername/E-Mail und Passwort eingeben.');
      sound.playError();
      return;
    }

    setLoading(true);
    const res = await apiAuth.login(emailOrName.trim(), password);
    setLoading(false);

    if (res.success && res.user) {
      sound.playReward();
      setSuccessMsg(`Willkommen zurück, ${res.user.name}!`);
      setTimeout(() => {
        onUserChanged(res.user!);
        onClose();
      }, 500);
    } else {
      sound.playError();
      setErrorMsg(res.error || 'Ungültige Anmeldedaten.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Bitte fülle alle erforderlichen Felder aus.');
      sound.playError();
      return;
    }

    setLoading(true);
    const res = await apiAuth.register({
      username: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      familyRole: regRole,
      clanName: regClan.trim(),
    });
    setLoading(false);

    if (res.success && res.user) {
      sound.playReward();
      setSuccessMsg(`Konto erfolgreich in MariaDB erstellt! Willkommen bei FamPlay, ${res.user.name}!`);
      setTimeout(() => {
        onUserChanged(res.user!);
        onClose();
      }, 700);
    } else {
      sound.playError();
      setErrorMsg(res.error || 'Fehler beim Erstellen des Kontos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-indigo-600/20 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-white">FamPlay Benutzerkonto</h2>
              <p className="text-xs text-slate-400">MariaDB-gestützte Benutzerverwaltung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/60 border-b border-slate-800">
          <button
            onClick={() => { sound.playClick(); setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2.5 text-xs font-bold transition flex items-center justify-center gap-2 ${
              mode === 'login'
                ? 'bg-amber-400 text-slate-950 rounded-xl font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" /> Anmelden
          </button>
          <button
            onClick={() => { sound.playClick(); setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2.5 text-xs font-bold transition flex items-center justify-center gap-2 ${
              mode === 'register'
                ? 'bg-amber-400 text-slate-950 rounded-xl font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Registrieren
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Benutzername oder E-Mail
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={emailOrName}
                    onChange={(e) => setEmailOrName(e.target.value)}
                    placeholder="Benutzername oder E-Mail"
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Passwort
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4 fill-current" />
                <span>{loading ? 'Prüfe Zugangsdaten...' : 'Anmelden'}</span>
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Benutzername
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="z.B. SpielerMax"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  E-Mail-Adresse
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="max@beispiel.de"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Passwort (min. 6 Zeichen)
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Familienrolle
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Familien-Champion">🏆 Champion</option>
                    <option value="Eltern">👨‍👩‍👧 Eltern</option>
                    <option value="Teenager">🎮 Teenager</option>
                    <option value="Kind (Junior)">🧒 Kind (Junior)</option>
                    <option value="Großeltern">👵 Großeltern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Clan-Name
                  </label>
                  <input
                    type="text"
                    value={regClan}
                    onChange={(e) => setRegClan(e.target.value)}
                    placeholder="Familie"
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Speichere in MariaDB...' : 'Konto anlegen'}</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
