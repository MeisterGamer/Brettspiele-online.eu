import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { apiAuth } from '../../services/apiAuth';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
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
  ShieldCheck, 
  Sparkles, 
  Server, 
  Database,
  Send,
  Dice5,
  HelpCircle,
  X,
  Terminal,
  RefreshCw
} from 'lucide-react';

interface AuthGateProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register' | 'verify' | 'forgot'>('login');
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Register State
  const [regUsername, setRegUsername] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [regRole, setRegRole] = useState<string>('Familien-Champion');
  const [regClan, setRegClan] = useState<string>('Familie');

  // Verify State
  const [verifyCode, setVerifyCode] = useState<string>('');

  // Forgot / Reset Password State
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [resetTokenInput, setResetTokenInput] = useState<string>('');
  const [newResetPassword, setNewResetPassword] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devCodeNotice, setDevCodeNotice] = useState<string | null>(null);
  const [showServerModal, setShowServerModal] = useState<boolean>(false);
  const [testEmailAddress, setTestEmailAddress] = useState<string>('');
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);

  // Server & DB Status
  const [systemStatus, setSystemStatus] = useState<{
    database?: { connected: boolean; type: string; database: string; host: string; port: number; socket?: string };
    email?: { configured: boolean; host: string; port: number; sender: string };
  } | null>(null);

  const fetchStatus = () => {
    fetch('/api/auth/status')
      .then((res) => res.json())
      .then((data) => setSystemStatus(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchStatus();

    // Check URL parameters for email verification or password reset tokens
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const verifyToken = params.get('verifyToken');
      const resetToken = params.get('resetToken');
      if (verifyToken) {
        setTab('verify');
        setVerifyCode(verifyToken);
      } else if (resetToken) {
        setTab('forgot');
        setResetTokenInput(resetToken);
      }
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMsg('Bitte Benutzername/E-Mail und Passwort eingeben.');
      sound.playError();
      return;
    }

    setLoading(true);
    const res = await apiAuth.login(loginIdentifier, loginPassword);
    setLoading(false);

    if (res.success && res.user) {
      sound.playReward();
      setSuccessMsg(res.message || `Willkommen zurück, ${res.user.name}!`);
      try {
        confetti({ particleCount: 50, spread: 50 });
      } catch (e) {}
      setTimeout(() => {
        onLoginSuccess(res.user!);
      }, 500);
    } else {
      sound.playError();
      setErrorMsg(res.error || 'Ungültige Anmeldedaten. Bitte prüfe deine Eingaben.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setDevCodeNotice(null);

    if (regUsername.trim().length < 3) {
      setErrorMsg('Benutzername muss mindestens 3 Zeichen lang sein.');
      sound.playError();
      return;
    }
    if (!regEmail.includes('@')) {
      setErrorMsg('Bitte eine gültige E-Mail-Adresse angeben.');
      sound.playError();
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Passwort muss mindestens 6 Zeichen lang sein.');
      sound.playError();
      return;
    }

    setLoading(true);
    const res = await apiAuth.register({
      username: regUsername.trim(),
      email: regEmail.trim(),
      password: regPassword,
      familyRole: regRole,
      clanName: regClan.trim() || 'Familie',
    });
    setLoading(false);

    if (res.success && res.user) {
      sound.playReward();
      setSuccessMsg(res.message || 'Registrierung erfolgreich in MariaDB gespeichert!');
      if (res.verificationCode) {
        setDevCodeNotice(`Bestätigungscode für Entwicklung: ${res.verificationCode}`);
      }
      setTimeout(() => {
        onLoginSuccess(res.user!);
      }, 1000);
    } else {
      sound.playError();
      setErrorMsg(res.error || 'Fehler bei der Registrierung.');
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!verifyCode.trim()) {
      setErrorMsg('Bitte den 6-stelligen Code eingeben.');
      return;
    }

    setLoading(true);
    const res = await apiAuth.verifyEmail(verifyCode.trim());
    setLoading(false);

    if (res.success) {
      sound.playReward();
      setSuccessMsg('E-Mail erfolgreich verifiziert! Du wirst weitergeleitet...');
      const url = new URL(window.location.href); url.searchParams.delete('verifyToken'); window.history.replaceState({},'',url);
      setTimeout(() => setTab('login'), 1200);
    } else {
      sound.playError();
      setErrorMsg(res.error || 'Ungültiger Bestätigungscode.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!forgotEmail.includes('@')) {
      setErrorMsg('Bitte eine gültige E-Mail-Adresse eingeben.');
      return;
    }

    setLoading(true);
    const res = await apiAuth.forgotPassword(forgotEmail.trim());
    setLoading(false);

    if (res.success) {
      sound.playClick();
      setSuccessMsg(res.message || 'Anweisungen zum Zurücksetzen wurden gesendet.');
    } else {
      setErrorMsg(res.error || 'Fehler beim Senden der Anfrage.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!resetTokenInput.trim() || newResetPassword.length < 6) {
      setErrorMsg('Bitte gültiges Token und neues Passwort (min. 6 Zeichen) eingeben.');
      return;
    }

    setLoading(true);
    const res = await apiAuth.resetPassword(resetTokenInput.trim(), newResetPassword);
    setLoading(false);

    if (res.success) {
      sound.playReward();
      const url = new URL(window.location.href); url.searchParams.delete('resetToken'); window.history.replaceState({},'',url);
      setSuccessMsg(res.message || 'Passwort erfolgreich geändert! Bitte anmelden.');
      setTimeout(() => setTab('login'), 1200);
    } else {
      sound.playError();
      setErrorMsg(res.error || 'Fehler beim Ändern des Passworts.');
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress.includes('@')) {
      setTestEmailResult('❌ Bitte gültige E-Mail-Adresse eingeben.');
      return;
    }
    setTestEmailResult('Sende Test-E-Mail über SMTP...');
    try {
      const res = await fetch('/api/system/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: testEmailAddress }),
      });
      const data = await res.json();
      setTestEmailResult(data.success ? `✅ ${data.message}` : `❌ ${data.message}`);
    } catch (e: any) {
      setTestEmailResult(`❌ Netzwerkfehler: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 p-4 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Dice5 className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-black font-display tracking-tight text-white flex items-center gap-2">
              FamPlay <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">Brettspiele-Online.eu</span>
            </h1>
            <p className="text-[11px] text-slate-400">Authentische Gesellschaftsspiele am virtuellen Familientisch</p>
          </div>
        </div>

        {/* Mandatory Authentication Badge */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-300 font-semibold shadow">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Login Pflicht</span>
          </div>

          <button
            type="button"
            onClick={() => setShowServerModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold border border-slate-700 transition cursor-pointer"
            title="MariaDB & Server Status Details"
          >
            <Server className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Server-Setup</span>
          </button>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md mx-auto my-auto relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          
          {/* Card Header & Tab Switcher */}
          <div className="p-6 pb-4 bg-gradient-to-b from-slate-850 to-slate-900 border-b border-slate-800/80">
            <div className="text-center space-y-1 mb-5">
              <h2 className="text-2xl font-black font-display text-white tracking-tight">
                {tab === 'login' && 'Spieler-Anmeldung'}
                {tab === 'register' && 'Neues Spielerkonto anlegen'}
                {tab === 'verify' && 'E-Mail Bestätigung'}
                {tab === 'forgot' && 'Passwort zurücksetzen'}
              </h2>
              <p className="text-xs text-slate-400">
                {tab === 'login' && 'Melde dich an, um am Spieltisch Platz zu nehmen.'}
                {tab === 'register' && 'Registrierung in MariaDB mit E-Mail-Server Bestätigung.'}
                {tab === 'verify' && 'Gib den 6-stelligen Bestätigungscode aus deiner E-Mail ein.'}
                {tab === 'forgot' && 'Erhalte einen Link zum Zurücksetzen deines Passworts.'}
              </p>
            </div>

            {/* Segmented control */}
            <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setTab('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                  tab === 'login'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Anmelden</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setTab('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                  tab === 'register'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Registrieren</span>
              </button>
            </div>
          </div>

          {/* Form Area */}
          <div className="p-6 space-y-4">
            
            {/* Alerts */}
            {errorMsg && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {devCodeNotice && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] font-mono">
                {devCodeNotice}
              </div>
            )}

            {/* TAB 1: LOGIN */}
            {tab === 'login' && (
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
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="z.B. SpielerMax oder max@beispiel.de"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Passwort
                    </label>
                    <button
                      type="button"
                      onClick={() => setTab('forgot')}
                      className="text-[11px] text-amber-400 hover:underline"
                    >
                      Passwort vergessen?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-400/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Prüfe MariaDB-Anmeldung...</span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 fill-current" />
                      <span>Jetzt einloggen & spielen</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <button
                    type="button"
                    onClick={() => setTab('verify')}
                    className="hover:text-amber-300 transition underline"
                  >
                    E-Mail Bestätigungscode eingeben
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('register')}
                    className="hover:text-amber-300 transition underline"
                  >
                    Noch kein Konto? Registrieren
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: REGISTER */}
            {tab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Gewünschter Benutzername
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="z.B. BrettspielMeister"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    E-Mail-Adresse (für E-Mail-Server Bestätigung)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@domain.de"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Passwort (min. 6 Zeichen, wird verschlüsselt gehasht)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Sicheres Passwort"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-10 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Familienrolle
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
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
                      Familien-Clan
                    </label>
                    <input
                      type="text"
                      value={regClan}
                      onChange={(e) => setRegClan(e.target.value)}
                      placeholder="z.B. Familie Schmidt"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-400/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <span>Registriere in MariaDB & sende E-Mail...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Konto in MariaDB anlegen</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: VERIFY EMAIL */}
            {tab === 'verify' && (
              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/30 flex items-center justify-center mx-auto mb-2">
                    <Send className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-300">
                    Gib den 6-stelligen Bestätigungscode aus der E-Mail ein:
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full bg-slate-950 border-2 border-amber-400/60 rounded-2xl py-3 text-center text-2xl font-mono font-bold tracking-widest text-amber-300 focus:outline-none focus:border-amber-400 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Code verifizieren</span>
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    Zurück zur Anmeldung
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: FORGOT / RESET PASSWORD */}
            {tab === 'forgot' && (
              <div className="space-y-4">
                {!resetTokenInput ? (
                  <form onSubmit={handleForgotSubmit} className="space-y-3.5">
                    <p className="text-xs text-slate-300">
                      Gib deine registrierte E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen deines Passworts:
                    </p>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="deine-email@domain.de"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow"
                    >
                      {loading ? 'Sende E-Mail...' : 'Link anfordern'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                    <p className="text-xs text-slate-300">
                      Neues Passwort für dein Spielerkonto festlegen:
                    </p>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Neues Passwort</label>
                      <input
                        type="password"
                        required
                        value={newResetPassword}
                        onChange={(e) => setNewResetPassword(e.target.value)}
                        placeholder="Mindestens 6 Zeichen"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow"
                    >
                      {loading ? 'Speichere Passwort...' : 'Neues Passwort aktivieren'}
                    </button>
                  </form>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setTab('login');
                      setResetTokenInput('');
                    }}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    Zurück zur Anmeldung
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Infrastructure Health Status Footer */}
          <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowServerModal(true)}
              className="flex items-center gap-2 hover:text-amber-300 transition text-left cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>MariaDB:</span>
              <span className={`font-mono font-bold ${systemStatus?.database?.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                {systemStatus?.database?.connected ? 'Online (Aktiv)' : 'Bereit für .env'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowServerModal(true)}
              className="flex items-center gap-2 hover:text-sky-300 transition text-left cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>E-Mail Server:</span>
              <span className="font-mono text-slate-300">
                {systemStatus?.email?.configured ? 'SMTP Aktiv' : 'Nicht eingerichtet'}
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* Footer copyright */}
      <div className="w-full max-w-5xl mx-auto text-center py-2 text-xs text-slate-500 relative z-10">
        FamPlay Plattform • MariaDB & SMTP Authentifizierung • Login ist Pflicht
      </div>

      {/* Server & MariaDB Setup Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white">MariaDB & E-Mail Server Konfiguration</h3>
              </div>
              <button
                onClick={() => setShowServerModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Status Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Database className="w-4 h-4" />
                  <span>MariaDB Datenbank</span>
                </div>
                <div className="text-slate-300 font-mono text-[11px]">
                  Status: {systemStatus?.database?.connected ? '✅ Verbunden' : '⚠️ Bereit für .env'}
                </div>
                <div className="text-slate-400 font-mono text-[10px]">
                  Ziel: {systemStatus?.database?.socket || `${systemStatus?.database?.host}:${systemStatus?.database?.port}`}
                </div>
                <div className="text-slate-400 font-mono text-[10px]">
                  Datenbank: {systemStatus?.database?.database}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-sky-400 font-bold">
                  <Mail className="w-4 h-4" />
                  <span>SMTP E-Mail Server</span>
                </div>
                <div className="text-slate-300 font-mono text-[11px]">
                  Status: {systemStatus?.email?.configured ? '✅ SMTP Aktiv' : 'ℹ️ Simulationsmodus'}
                </div>
                <div className="text-slate-400 font-mono text-[10px]">
                  Host: {systemStatus?.email?.host}
                </div>
                <div className="text-slate-400 font-mono text-[10px]">
                  Absender: {systemStatus?.email?.sender}
                </div>
              </div>
            </div>

            {/* Terminal Instructions */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Terminal className="w-4 h-4" />
                <span>Befehle für deinen Linux-Server (root@tender-blackwell)</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <p className="text-[11px] text-slate-400">1. MariaDB Datenbank & Tabellen mit 1 Befehl einrichten:</p>
                <pre className="p-2 bg-slate-900 rounded-xl text-amber-300 font-mono text-[11px] overflow-x-auto select-all">
                  sudo mysql &lt; scripts/setup-mariadb.sql
                </pre>
                <p className="text-[11px] text-slate-400">2. Administrator-Konto sicher über CLI anlegen:</p>
                <pre className="p-2 bg-slate-900 rounded-xl text-emerald-300 font-mono text-[11px] overflow-x-auto select-all">
                  npx tsx scripts/create-admin.ts Admin admin@brettspiele-online.eu MeinPasswort123
                </pre>
                <p className="text-[11px] text-slate-400">3. MariaDB Verbindung testen:</p>
                <pre className="p-2 bg-slate-900 rounded-xl text-sky-300 font-mono text-[11px] overflow-x-auto select-all">
                  npm run setup:mariadb
                </pre>
              </div>
            </div>

            {/* Test Email Section */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300">SMTP Serververbindung testen</div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Empfänger für Test-E-Mail eingeben"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
                >
                  Test senden
                </button>
              </div>
              {testEmailResult && (
                <div className="text-[11px] font-mono p-2 bg-slate-900 rounded-lg text-slate-300">
                  {testEmailResult}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={fetchStatus}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Status aktualisieren
              </button>
              <button
                type="button"
                onClick={() => setShowServerModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
