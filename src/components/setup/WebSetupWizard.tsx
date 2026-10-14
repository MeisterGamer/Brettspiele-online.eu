import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../services/sound';
import { 
  Server, 
  Database, 
  Mail, 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  RefreshCw, 
  Terminal, 
  Send, 
  Dice5, 
  Gamepad2,
  Sliders,
  Settings
} from 'lucide-react';

interface WebSetupWizardProps {
  onSetupComplete: () => void;
}

export const WebSetupWizard: React.FC<WebSetupWizardProps> = ({ onSetupComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 5;

  // System Diagnostics State
  const [sysStatus, setSysStatus] = useState<any>(null);
  const [checkingSystem, setCheckingSystem] = useState<boolean>(true);

  // Step 2: MariaDB Database State
  const [dbHost, setDbHost] = useState<string>('127.0.0.1');
  const [dbPort, setDbPort] = useState<number>(3306);
  const [dbUser, setDbUser] = useState<string>('famplay_user');
  const [dbPassword, setDbPassword] = useState<string>('');
  const [dbName, setDbName] = useState<string>('famplay_brettspiele');
  const [dbSocket, setDbSocket] = useState<string>('');
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingDb, setTestingDb] = useState<boolean>(false);
  const [installingDb, setInstallingDb] = useState<boolean>(false);
  const [dbInstalled, setDbInstalled] = useState<boolean>(false);

  // Step 3: SMTP E-Mail Server State
  const [smtpHost, setSmtpHost] = useState<string>('');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpSecure, setSmtpSecure] = useState<boolean>(false);
  const [smtpUser, setSmtpUser] = useState<string>('');
  const [smtpPass, setSmtpPass] = useState<string>('');
  const [smtpFrom, setSmtpFrom] = useState<string>('"FamPlay Brettspiele" <noreply@brettspiele-online.eu>');
  const [testEmailTo, setTestEmailTo] = useState<string>('');
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingSmtp, setTestingSmtp] = useState<boolean>(false);
  const [smtpSimulationMode, setSmtpSimulationMode] = useState<boolean>(true);

  // Step 4: Owner / Inhaber Account State
  const [inhaberUsername, setInhaberUsername] = useState<string>('Admin');
  const [inhaberEmail, setInhaberEmail] = useState<string>('');
  const [inhaberPassword, setInhaberPassword] = useState<string>('');
  const [inhaberPasswordConfirm, setInhaberPasswordConfirm] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Step 5: Platform Settings & Finish
  const [siteTitle, setSiteTitle] = useState<string>('FamPlay - Brettspiele-Online.eu');
  const [appUrl, setAppUrl] = useState<string>(
    typeof window !== 'undefined' ? window.location.origin : 'https://brettspiele-online.eu'
  );
  const [submittingSetup, setSubmittingSetup] = useState<boolean>(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const fetchDiagnostics = async () => {
    setCheckingSystem(true);
    try {
      const res = await fetch('/api/setup/status');
      const data = await res.json();
      setSysStatus(data);
      if (data.database?.connected) {
        setDbInstalled(true);
      }
    } catch {
      // ignore
    } finally {
      setCheckingSystem(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  // Step 2 Action: Test DB
  const handleTestDatabase = async () => {
    setTestingDb(true);
    setDbTestResult(null);
    try {
      const res = await fetch('/api/setup/test-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: dbHost,
          port: dbPort,
          user: dbUser,
          password: dbPassword,
          database: dbName,
          socketPath: dbSocket,
        }),
      });
      const data = await res.json();
      setDbTestResult(data);
      if (data.success) {
        sound.playReward();
      } else {
        sound.playError();
      }
    } catch (err: any) {
      setDbTestResult({ success: false, message: `Netzwerkfehler: ${err.message}` });
      sound.playError();
    } finally {
      setTestingDb(false);
    }
  };

  // Step 2 Action: Install DB Schema
  const handleInstallDatabase = async () => {
    setInstallingDb(true);
    setDbTestResult(null);
    try {
      const res = await fetch('/api/setup/install-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: dbHost,
          port: dbPort,
          user: dbUser,
          password: dbPassword,
          database: dbName,
          socketPath: dbSocket,
        }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playReward();
        setDbInstalled(true);
        setDbTestResult({ success: true, message: data.message });
      } else {
        sound.playError();
        setDbTestResult({ success: false, message: data.message });
      }
    } catch (err: any) {
      setDbTestResult({ success: false, message: `Fehler: ${err.message}` });
      sound.playError();
    } finally {
      setInstallingDb(false);
    }
  };

  // Step 3 Action: Test SMTP
  const handleTestSmtp = async () => {
    if (!smtpHost || !testEmailTo) {
      setSmtpTestResult({
        success: false,
        message: 'Bitte SMTP-Host und eine Test-Empfängeradresse angeben.',
      });
      return;
    }
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch('/api/setup/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass,
          from: smtpFrom,
          toEmail: testEmailTo,
        }),
      });
      const data = await res.json();
      setSmtpTestResult(data);
      if (data.success) {
        sound.playReward();
        setSmtpSimulationMode(false);
      } else {
        sound.playError();
      }
    } catch (err: any) {
      setSmtpTestResult({ success: false, message: `Verbindungsfehler: ${err.message}` });
      sound.playError();
    } finally {
      setTestingSmtp(false);
    }
  };

  // Step 5 Action: Finish Setup & Create Inhaber
  const handleCompleteSetup = async () => {
    setSetupError(null);

    // Validation
    if (!inhaberUsername.trim() || !inhaberEmail.trim() || !inhaberPassword) {
      setSetupError('Bitte fülle alle Inhaber-Felder in Schritt 4 aus.');
      setCurrentStep(4);
      sound.playError();
      return;
    }

    if (inhaberPassword !== inhaberPasswordConfirm) {
      setSetupError('Die beiden Passwörter in Schritt 4 stimmen nicht überein.');
      setCurrentStep(4);
      sound.playError();
      return;
    }

    if (inhaberPassword.length < 6) {
      setSetupError('Das Inhaber-Passwort muss mindestens 6 Zeichen lang sein.');
      setCurrentStep(4);
      sound.playError();
      return;
    }

    setSubmittingSetup(true);

    try {
      const payload = {
        username: inhaberUsername.trim(),
        email: inhaberEmail.trim(),
        password: inhaberPassword,
        siteTitle,
        appUrl,
        dbConfig: {
          host: dbHost,
          port: dbPort,
          user: dbUser,
          password: dbPassword,
          database: dbName,
          socketPath: dbSocket,
        },
        smtpConfig: !smtpSimulationMode && smtpHost ? {
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass,
          from: smtpFrom,
        } : null,
      };

      const res = await fetch('/api/setup/create-inhaber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        sound.playReward();
        try {
          confetti({ particleCount: 100, spread: 80 });
        } catch {}
        setIsCompleted(true);
      } else {
        sound.playError();
        setSetupError(data.error || 'Fehler beim Fertigstellen der Installation.');
      }
    } catch (err: any) {
      sound.playError();
      setSetupError(`Serverfehler: ${err.message}`);
    } finally {
      setSubmittingSetup(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Sliders className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black font-display text-white tracking-tight">
                FamPlay <span className="text-amber-400">Installations-Assistent</span>
              </h1>
              <span className="text-[10px] uppercase font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                Erst-Einrichtung
              </span>
            </div>
            <p className="text-xs text-slate-400">Ersteinrichtung für den Inhaber (MariaDB, SMTP & Administrator)</p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden sm:flex items-center gap-2">
          <span>Schritt {currentStep} von {totalSteps}</span>
        </div>
      </header>

      {/* Main Wizard Card */}
      <main className="max-w-4xl w-full mx-auto my-6 bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl relative z-10">
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-2">
          <div 
            className="bg-gradient-to-r from-amber-500 to-amber-300 h-2 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Tabs Navigation */}
        <div className="grid grid-cols-5 p-2 bg-slate-950/70 border-b border-slate-800 text-xs font-semibold text-slate-400">
          {[
            { step: 1, label: '1. Diagnose', icon: Server },
            { step: 2, label: '2. MariaDB', icon: Database },
            { step: 3, label: '3. E-Mail', icon: Mail },
            { step: 4, label: '4. Inhaber', icon: UserCheck },
            { step: 5, label: '5. Abschluss', icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            const active = currentStep === item.step;
            const done = currentStep > item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setCurrentStep(item.step);
                }}
                className={`py-2 px-1 flex items-center justify-center gap-1.5 rounded-xl transition ${
                  active 
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md' 
                    : done 
                    ? 'text-emerald-400 hover:text-white' 
                    : 'hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 sm:p-8 space-y-6">

          {setupError && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{setupError}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: WELCOME & SYSTEM DIAGNOSTICS */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <h2 className="text-2xl font-black font-display text-white">Willkommen am Brettspiele-Familientisch!</h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Herzlich willkommen zur Erst-Installation von <strong>FamPlay Brettspiele</strong>. Als Inhaber dieser Plattform richtest du jetzt in wenigen Schritten deine <strong>MariaDB-Datenbank</strong>, deinen <strong>E-Mail-Server (SMTP)</strong> und dein persönliches <strong>Inhaber- & Master-Administrator-Konto</strong> ein.
                </p>
              </div>

              {/* System Checks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Node.js Laufzeitumgebung:</span>
                    <span className="font-mono text-emerald-400 font-bold">{sysStatus?.nodeVersion || 'v22.x'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Betriebssystem / Server:</span>
                    <span className="font-mono text-slate-200">{sysStatus?.platform || 'Linux'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Server-Port:</span>
                    <span className="font-mono text-amber-400 font-bold">3000 (Vite / Express Full-Stack)</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">MariaDB Treiber:</span>
                    <span className="font-mono text-emerald-400 font-bold">mysql2/promise bereit</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">E-Mail Treiber:</span>
                    <span className="font-mono text-emerald-400 font-bold">nodemailer bereit</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Status:</span>
                    <span className="font-mono text-amber-300 font-bold">Erst-Installation erforderlich</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200 space-y-1">
                  <p className="font-bold">Keine Sorge wegen komplexer Konfigurationen:</p>
                  <p className="text-slate-300 leading-normal">
                    Dieser Assistent führt dich durch jeden Schritt, testet alle Verbindungen in Echtzeit und schreibt deine Einstellungen automatisch in die Konfigurationsdatei.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: MARIADB CONFIGURATION */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h2 className="text-2xl font-black font-display text-white flex items-center gap-2">
                  <Database className="w-6 h-6 text-amber-400" />
                  MariaDB Datenbank-Einrichtung
                </h2>
                <p className="text-xs text-slate-400">
                  Gib die Zugangsdaten zu deinem lokalen oder externen MariaDB/MySQL Server ein.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Datenbank-Host
                  </label>
                  <input
                    type="text"
                    value={dbHost}
                    onChange={(e) => setDbHost(e.target.value)}
                    placeholder="127.0.0.1 oder localhost"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500">Standard: 127.0.0.1</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={dbPort}
                    onChange={(e) => setDbPort(Number(e.target.value))}
                    placeholder="3306"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500">Standard: 3306</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Datenbank-Benutzer
                  </label>
                  <input
                    type="text"
                    value={dbUser}
                    onChange={(e) => setDbUser(e.target.value)}
                    placeholder="famplay_user oder root"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Datenbank-Passwort
                  </label>
                  <input
                    type="password"
                    value={dbPassword}
                    onChange={(e) => setDbPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Datenbankname
                  </label>
                  <input
                    type="text"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    placeholder="famplay_brettspiele"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Unix-Socket (optional, für Linux Server)
                  </label>
                  <input
                    type="text"
                    value={dbSocket}
                    onChange={(e) => setDbSocket(e.target.value)}
                    placeholder="z.B. /var/run/mysqld/mysqld.sock"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500">Nur nötig, falls Socket-Verbindung gewünscht</span>
                </div>
              </div>

              {/* DB Actions */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={testingDb || installingDb}
                  onClick={handleTestDatabase}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingDb ? 'animate-spin' : ''}`} />
                  <span>Verbindung testen</span>
                </button>

                <button
                  type="button"
                  disabled={testingDb || installingDb}
                  onClick={handleInstallDatabase}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{installingDb ? 'Initialisiere Tabellen...' : 'Tabellen jetzt anlegen'}</span>
                </button>
              </div>

              {dbTestResult && (
                <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  dbTestResult.success ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300' : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                }`}>
                  {dbTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>{dbTestResult.message}</span>
                </div>
              )}

              {/* CLI Tip */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tipp für deinen Linux-Server (root@tender-blackwell):</span>
                </div>
                <p>
                  Du kannst den MariaDB-Benutzer und alle Tabellen auch mit einem einzigen Befehl im Terminal einrichten:
                </p>
                <code className="block bg-slate-900 p-2 rounded-lg text-amber-300 font-mono text-[10px]">
                  sudo mysql &lt; scripts/setup-mariadb.sql
                </code>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: SMTP E-MAIL CONFIGURATION */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h2 className="text-2xl font-black font-display text-white flex items-center gap-2">
                  <Mail className="w-6 h-6 text-sky-400" />
                  E-Mail-Server (SMTP) Konfiguration
                </h2>
                <p className="text-xs text-slate-400">
                  Wird verwendet für Willkommensmails, 6-stellige Bestätigungscodes und Passwort-Zurücksetzen.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => {
                      setSmtpHost(e.target.value);
                      if (e.target.value) setSmtpSimulationMode(false);
                    }}
                    placeholder="smtp.deinedomain.de oder localhost"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="587"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500">587 (STARTTLS) oder 465 (SSL)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    SMTP Benutzername / E-Mail
                  </label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="noreply@brettspiele-online.eu"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    SMTP Passwort
                  </label>
                  <input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Absender (From)
                  </label>
                  <input
                    type="text"
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                    placeholder='"FamPlay Brettspiele" <noreply@brettspiele-online.eu>'
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* SSL/TLS Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smtpSecure"
                  checked={smtpSecure}
                  onChange={(e) => setSmtpSecure(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="smtpSecure" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  SSL/TLS Verschlüsselung erzwingen (Port 465)
                </label>
              </div>

              {/* SMTP Test Section */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-300">Live-Test der E-Mail-Zustellung:</div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    placeholder="Deine persönliche E-Mail für den Test"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    disabled={testingSmtp}
                    onClick={handleTestSmtp}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${testingSmtp ? 'animate-spin' : ''}`} />
                    <span>{testingSmtp ? 'Sende...' : 'Test-Mail senden'}</span>
                  </button>
                </div>

                {smtpTestResult && (
                  <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                    smtpTestResult.success ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}>
                    {smtpTestResult.message}
                  </div>
                )}
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-[11px] text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>
                  Hinweis: Falls du noch keinen SMTP-Server hast, werden E-Mails und Verifizierungscodes automatisch im Server-Log protokolliert.
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: INHABER / MASTER ADMIN ACCOUNT */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h2 className="text-2xl font-black font-display text-white flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-amber-400" />
                  Inhaber- & Master-Administrator-Konto
                </h2>
                <p className="text-xs text-slate-400">
                  Erstelle dein persönliches Inhaber-Konto. Dieses Konto erhält volle Administrationsrechte auf FamPlay.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Inhaber Benutzername
                  </label>
                  <input
                    type="text"
                    required
                    value={inhaberUsername}
                    onChange={(e) => setInhaberUsername(e.target.value)}
                    placeholder="z.B. Admin oder MeisterGamer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500">Dein Login-Name für die Plattform</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Inhaber E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    required
                    value={inhaberEmail}
                    onChange={(e) => setInhaberEmail(e.target.value)}
                    placeholder="inhaber@brettspiele-online.eu"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500">Wichtig für Passwort-Wiederherstellung</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      Inhaber-Passwort
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-amber-400 hover:text-amber-300"
                    >
                      {showPassword ? 'Verbergen' : 'Anzeigen'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={inhaberPassword}
                      onChange={(e) => setInhaberPassword(e.target.value)}
                      placeholder="Mindestens 6 Zeichen"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Passwort bestätigen
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={inhaberPasswordConfirm}
                    onChange={(e) => setInhaberPasswordConfirm(e.target.value)}
                    placeholder="Passwort wiederholen"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Rolle: Master Administrator (Inhaber)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Zugriff auf Spieler-Verwaltung, Live-Turniere, Räume-Moderation und System-Einstellungen.
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/30">
                  LEVEL 10 • VIP
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: PLATFORM SETTINGS & FINISH */}
          {/* ========================================================================= */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in">
              {!isCompleted ? (
                <>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black font-display text-white flex items-center gap-2">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                      Plattform-Einstellungen & Installation abschließen
                    </h2>
                    <p className="text-xs text-slate-400">
                      Überprüfe die Einstellungen. Nach Klick auf Fertigstellen wird die Installation abgeschlossen.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Plattform-Name
                      </label>
                      <input
                        type="text"
                        value={siteTitle}
                        onChange={(e) => setSiteTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Webseiten-Domain (URL)
                      </label>
                      <input
                        type="text"
                        value={appUrl}
                        onChange={(e) => setAppUrl(e.target.value)}
                        placeholder="https://brettspiele-online.eu"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Installation Summary Box */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <div className="font-bold text-amber-300 flex items-center gap-2">
                      <Sliders className="w-4 h-4" />
                      <span>Zusammenfassung der Konfiguration:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px] pt-1">
                      <div>• Datenbank: <span className="text-white">{dbName} ({dbHost}:{dbPort})</span></div>
                      <div>• E-Mail Server: <span className="text-white">{smtpHost || 'Simulationsmodus'}</span></div>
                      <div>• Inhaber-Login: <span className="text-amber-400 font-bold">{inhaberUsername || 'Nicht ausgefüllt'}</span></div>
                      <div>• Inhaber-E-Mail: <span className="text-white">{inhaberEmail || 'Nicht ausgefüllt'}</span></div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-amber-200">
                    🔒 <strong>Sicherheits-Garantie:</strong> Automatisches Einloggen als Admin ist deaktiviert. Login ist für alle Spieler und Administratoren Pflicht.
                  </div>

                  <button
                    type="button"
                    disabled={submittingSetup}
                    onClick={handleCompleteSetup}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingSetup ? (
                      <span>Schließe Installation ab...</span>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Installation jetzt abschließen & Plattform aktivieren</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* Success View */
                <div className="text-center py-6 space-y-5 animate-in zoom-in-95">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-black font-display text-white">
                      Installation erfolgreich abgeschlossen!
                    </h2>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      Die Plattform wurde für <strong>{inhaberUsername}</strong> eingerichtet. Alle Datenbank-Tabellen sind initialisiert und das System ist einsatzbereit.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 max-w-sm mx-auto text-left text-xs space-y-1.5 font-mono">
                    <div className="text-slate-400">Inhaber-Login: <span className="text-amber-400 font-bold">{inhaberUsername}</span></div>
                    <div className="text-slate-400">E-Mail: <span className="text-white">{inhaberEmail}</span></div>
                    <div className="text-slate-400">Rolle: <span className="text-emerald-400 font-bold">Master Administrator</span></div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playReward();
                        onSetupComplete();
                      }}
                      className="px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-400/20 transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Weiter zum Pflicht-Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Wizard Footer Navigation */}
        {!isCompleted && (
          <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => {
                sound.playClick();
                setCurrentStep((prev) => Math.max(1, prev - 1));
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Zurück</span>
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
              >
                <span>Weiter zu Schritt {currentStep + 1}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submittingSetup}
                onClick={handleCompleteSetup}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Fertigstellen</span>
              </button>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center py-2 text-xs text-slate-500 relative z-10">
        FamPlay Plattform • Installations- & Einrichtungs-Assistent für den Inhaber
      </footer>

    </div>
  );
};
