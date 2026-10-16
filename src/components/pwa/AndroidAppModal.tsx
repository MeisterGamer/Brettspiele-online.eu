import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  Zap, 
  Wifi, 
  Vibrate, 
  Layers, 
  ExternalLink, 
  X, 
  Share2, 
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import { sound } from '../../services/sound';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isStandalone, isAndroid, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'install' | 'guide' | 'apk'>('install');
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    sound.playClick();
    const result = await install();
    if (result === 'accepted') {
      sound.playVictory();
      setInstallSuccess(true);
    } else if (result === 'manual') {
      setActiveTab('guide');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Android Robot Style Gradient */}
        <div className="relative p-6 bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-900 text-white overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/30 border border-emerald-300/40 p-2.5 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <Smartphone className="w-10 h-10 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black tracking-wide">FamPlay Android App</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400/25 border border-emerald-300/40 text-emerald-100">
                    PWA & WebAPK
                  </span>
                </div>
                <p className="text-emerald-100/90 text-sm mt-0.5">
                  Spiele alle 100+ Familien-Brett- und Kartenspiele direkt nativ auf deinem Smartphone & Tablet
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
              aria-label="Schließen"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-2 border-t border-white/15">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('install');
              }}
              className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
                activeTab === 'install'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <Download className="w-4 h-4" />
              Installation & Vorteile
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('guide');
              }}
              className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
                activeTab === 'guide'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <Layers className="w-4 h-4" />
              Schritt-für-Schritt Anleitung
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('apk');
              }}
              className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
                activeTab === 'apk'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              APK / Play Store Info
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {activeTab === 'install' && (
            <div className="space-y-6">
              {/* Primary Action Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-400">
                      {isStandalone ? 'Bereits als App installiert' : isInstallable ? 'Direkt installation bereit' : 'WebAPK / PWA kompatibel'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {isStandalone ? 'FamPlay läuft im nativen Vollbildmodus' : '1-Klick Android App Installation'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Kein schwerer Download aus Stores nötig. Sofort einsatzbereit mit eigenem App-Symbol auf deinem Startbildschirm.
                  </p>
                </div>

                {isStandalone ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    App ist installiert!
                  </div>
                ) : (
                  <button
                    onClick={handleInstallClick}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    {isInstallable ? 'Jetzt als Android App installieren' : 'Installations-Hilfe öffnen'}
                  </button>
                )}
              </div>

              {installSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-3 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Fantastisch! FamPlay wird jetzt auf deinem Startbildschirm eingerichtet. Du findest es in deinem Android App Drawer.
                  </span>
                </div>
              )}

              {/* Native Android Features Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Exklusive Vorteile auf Android
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-sm">Vollbild ohne Browserleiste</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Startet wie eine native App ohne störende URL-Zeile für maximalen Platz auf Spielbrettern.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                      <Vibrate className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-sm">Haptisches Feedback</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Dein Smartphone vibriert subtil bei Spielzügen, Würfelwürfen und Siegesfanfaren.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                      <Wifi className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-sm">Offline Spiele-Modus</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Automatische Vorab-Speicherung: Funktioniert im Flugzeug, Zug oder bei schlechtem Empfang.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-sm">Optimiert für Touch & Tablets</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Große Berührungszonen für Kinder und Großeltern, optimiert für Hoch- und Querformat.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-xs sm:text-sm text-slate-300 flex items-start gap-3">
                <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  Auf Android unterstützt jeder moderne Browser die direkte Installation von FamPlay. Wähle unten deinen Browser für die passende Schritt-für-Schritt Anleitung:
                </span>
              </div>

              {/* Step by step for Google Chrome */}
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    Google Chrome (Empfohlen auf Android)
                  </h4>
                  <span className="text-xs text-slate-400 font-semibold">10 Sekunden</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-300 pl-1">
                  <li>Öffne FamPlay in Google Chrome auf deinem Smartphone.</li>
                  <li>Tippe oben rechts auf die <strong className="text-white">drei Punkte (⋮)</strong>.</li>
                  <li>Wähle <strong className="text-emerald-400">„App installieren“</strong> oder <strong className="text-emerald-400">„Zum Startbildschirm hinzufügen“</strong>.</li>
                  <li>Bestätige mit <strong className="text-white">„Installieren“</strong>. Fertig!</li>
                </ol>
              </div>

              {/* Step by step for Samsung Internet */}
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    Samsung Internet Browser
                  </h4>
                  <span className="text-xs text-slate-400 font-semibold">Galaxy Geräte</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-300 pl-1">
                  <li>Tippe unten rechts auf das <strong className="text-white">Menü-Symbol (≡)</strong> oder das Download-Icon in der URL-Leiste.</li>
                  <li>Wähle <strong className="text-emerald-400">„Seite hinzufügen zu“</strong>.</li>
                  <li>Tippe auf <strong className="text-emerald-400">„Startbildschirm“</strong>.</li>
                </ol>
              </div>

              {/* Step by step for Firefox Mobile */}
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    Mozilla Firefox & Microsoft Edge auf Android
                  </h4>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-300 pl-1">
                  <li>Tippe auf das Menü <strong className="text-white">(⋮ oder ...)</strong>.</li>
                  <li>Wähle <strong className="text-emerald-400">„Installieren“</strong> oder <strong className="text-emerald-400">„Zum Telefon hinzufügen“</strong>.</li>
                </ol>
              </div>

              {/* iOS Note */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40 space-y-1 text-xs text-slate-400">
                <p className="font-bold text-slate-300">Für Apple iOS (iPhone & iPad):</p>
                <p>Tippe in Safari auf das Teilen-Symbol (<Share2 className="w-3.5 h-3.5 inline mx-0.5" />) und wähle „Zum Home-Bildschirm“.</p>
              </div>
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Google Play Store & Standalone APK Packaging
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  FamPlay erfüllt mit Manifest v3, 192px/512px Maskable Icons und vollem Service-Worker-Caching 100% aller Richtlinien für <strong>Google WebAPK</strong> und <strong>Trusted Web Activities (TWA)</strong>.
                </p>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 space-y-2">
                  <p className="text-slate-400 font-sans font-bold text-xs uppercase tracking-wider">
                    APK mit Google Bubblewrap oder PWABuilder erstellen:
                  </p>
                  <p className="text-slate-200"># 1. Installiere den offiziellen Google TWA CLI-Baukasten:</p>
                  <p className="text-amber-300">npm install -g @bubblewrap/cli</p>
                  <p className="text-slate-200"># 2. Generiere das native Android Studio Projekt direkt aus deiner Live-Domain:</p>
                  <p className="text-emerald-400">bubblewrap init --manifest https://brettspiele-online.eu/manifest.webmanifest</p>
                  <p className="text-slate-200"># 3. Baue die signierte APK / AAB für den Google Play Store:</p>
                  <p className="text-emerald-400">bubblewrap build</p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800">
                  <span>1-Klick Online APK/AAB Baukasten:</span>
                  <a
                    href="https://www.pwabuilder.com/reportcard?site=https://brettspiele-online.eu/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition"
                  >
                    <span>PWABuilder für brettspiele-online.eu öffnen</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Kompatibel mit Android 7.0 bis Android 15+</span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
