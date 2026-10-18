import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { GameEngineType, GameRoom } from '../../types';
import type { Difficulty } from '../../services/gameAI';
import { multiplayerService } from '../../services/multiplayerService';

const DifficultyContext = createContext<Difficulty>('normal');
const RoundContext = createContext(0);
export const useGameRound = () => useContext(RoundContext);
export const useAIDifficulty = () => useContext(DifficultyContext);

const tips: Partial<Record<GameEngineType, string>> = {
  'ludo': 'Bringe mehrere Figuren ins Spiel. Prüfe vor jedem Zug Schlagmöglichkeiten und sichere Zielfelder.',
  'chess': 'Entwickle Springer und Läufer, kontrolliere das Zentrum und prüfe vor jedem Zug, ob eine Figur ungedeckt bleibt.',
  'connect-four': 'Besetze das Zentrum. Zwei gleichzeitige Gewinnmöglichkeiten sind stärker als eine einzelne Dreierreihe.',
  'fam-cards': 'Behalte Farbwechsel für schwierige Situationen. Spiele möglichst die Farbe, von der du viele Karten hältst.',
  'checkers': 'Achte auf Schlagfolgen und schütze deine letzte Reihe. Eine sichere Umwandlung zur Dame ist oft mehr wert als ein einzelner Stein.',
  'battleship': 'Suche zunächst im Schachbrettmuster. Prüfe nach einem Treffer benachbarte Felder und folge der erkannten Richtung.',
  'yatzy': 'Plane den Bonus: 63 Punkte im oberen Block geben 35 Zusatzpunkte. Halte passende Würfel und vergleiche die offenen Kategorien.',
  'memory-match': 'Merke dir auch die Karten des Gegners. Bekannte Paare zuerst aufdecken; Paare bringen im Duell einen weiteren Zug.',
  'dots-boxes': 'Schließe vollständige Kästchen. Vermeide früh die dritte Seite eines Kästchens und beobachte entstehende Ketten.',
  'tictactoe': 'Nimm das Zentrum, blockiere unmittelbare Gewinne und suche nach Gabeln mit zwei gleichzeitigen Gewinnlinien.',
  'diamond-blast': 'Priorisiere das Levelziel. Kombiniere Spezialsteine und suche Züge, die mehrere Reihen gleichzeitig verändern.',
  'monopoly': 'Halte Geld für Mieten zurück. Vollständige Farbgruppen und gezielte Bebauung sind wichtiger als möglichst viele Einzelgrundstücke.',
  'skip-bo': 'Spiele vorrangig den Vorratsstapel frei. Ordne die Ablagestapel so, dass du ihre obersten Karten bald wieder einsetzen kannst.',
  'romme': 'Plane die 40 Punkte für die Erstauslage. Sammle zusammenhängende Folgen und behalte den Ablagestapel im Blick.',
  'catan': 'Siedle an häufig gewürfelten Zahlen und an verschiedenen Rohstoffen. Plane Straßen zu freien Siedlungsplätzen und nutze den Handel.',
  'mahjong': 'Entferne Paare, die hohe Schichten und lange Reihen öffnen. Zwei freie gleiche Steine sofort zu nehmen ist nicht immer optimal.',
};
const adjustable = new Set<GameEngineType>(['tictactoe','connect-four','battleship','dots-boxes','memory-match','chess','checkers','mahjong']);

export function GameArena({ engine, title, room, userId, children }: {
  engine: GameEngineType; title: string; room: GameRoom | null; userId: string; children: ReactNode;
}) {
  const container = useRef<HTMLElement>(null);
  const [help, setHelp] = useState(false);
  const [round, setRound] = useState(0);
  const [message, setMessage] = useState('');
  const [full, setFull] = useState(false);
  const [connection, setConnection] = useState(multiplayerService.getConnectionStatus());
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    try { const value = localStorage.getItem('famplay_ai_difficulty'); return value === 'easy' || value === 'hard' ? value : 'normal'; }
    catch { return 'normal'; }
  });
  useEffect(() => multiplayerService.subscribe(event => {
    if (event.type === 'ROOM_ERROR') setMessage(event.error);
    if (event.type === 'CONNECTION_STATUS') setConnection(event.status);
  }), []);
  const selected = room?.aiDifficulty || difficulty;
  const host = !room || room.participants.some(p => p.id === userId && p.isHost);
  const activeRound = `${engine}:${room?.code || 'local'}:${room?.roundNumber || 0}:${round}`;
  useEffect(() => {
    const update = () => setFull(document.fullscreenElement === container.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  const changeDifficulty = (value: Difficulty) => {
    setDifficulty(value);
    try { localStorage.setItem('famplay_ai_difficulty', value); } catch {}
    if (room) multiplayerService.setDifficulty(room.code, value);
  };
  return (
    <section ref={container} aria-label={title} className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-2 sm:p-6 shadow-2xl min-w-0 overflow-auto [&:fullscreen]:bg-slate-950 [&:fullscreen]:rounded-none">
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
        <button type="button" className="px-3 py-2 rounded-xl bg-slate-800" aria-expanded={help} onClick={() => setHelp(!help)}>Spieltipps</button>
        {adjustable.has(engine) && (
          <label className="flex items-center gap-2">KI-Stärke
            <select aria-label="KI-Schwierigkeit" value={selected} disabled={!host} onChange={e => changeDifficulty(e.target.value as Difficulty)} className="bg-slate-800 rounded-xl px-2 py-2 disabled:opacity-50">
              <option value="easy">Leicht</option><option value="normal">Normal</option><option value="hard">Schwer</option>
            </select>
          </label>
        )}
        <button type="button" disabled={!host} className="px-3 py-2 rounded-xl bg-slate-800 disabled:opacity-50" onClick={() => {
          if (room) multiplayerService.startRound(room.code);
          else setRound(n => n + 1);
        }}>Neue Partie</button>
        {typeof document !== 'undefined' && document.fullscreenEnabled && (
          <button type="button" className="px-3 py-2 rounded-xl bg-slate-800" onClick={async () => {
            try { if (full) await document.exitFullscreen(); else await container.current?.requestFullscreen(); }
            catch { setMessage('Vollbild ist in diesem Browser nicht verfügbar.'); }
          }}>{full ? 'Vollbild beenden' : 'Vollbild'}</button>
        )}
        <span className="text-slate-400 ml-auto">Partie {(room?.roundNumber || 0) + round + 1}</span>
      </div>
      {help && <p className="mb-4 rounded-xl border border-sky-800 bg-sky-950/40 p-3 text-sm text-sky-100">{tips[engine] || 'Beachte die Spielanleitung und die möglichen Züge.'}</p>}
      {message && <p role="status" className="text-amber-300 text-sm mb-3">{message}</p>}
      {room && connection === 'offline' && <p role="status" className="text-amber-300 text-sm mb-3">Offline – bitte warte auf die Verbindung, bevor du weiterspielst.</p>}
      <DifficultyContext.Provider value={selected}>
        <RoundContext.Provider value={room?.roundNumber || 0}>
        <div key={activeRound} inert={Boolean(room && connection === 'offline')} className="min-h-[420px] sm:min-h-[500px] flex items-center justify-center min-w-0">{children}</div>
        </RoundContext.Provider>
      </DifficultyContext.Provider>
    </section>
  );
}
