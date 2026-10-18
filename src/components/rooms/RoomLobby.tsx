import { useEffect, useRef, useState } from 'react';
import type { GameRoom, UserProfile } from '../../types';
import { multiplayerService, type ConnectionStatus } from '../../services/multiplayerService';

export function RoomLobby({ room, user }: { room: GameRoom; user: UserProfile }) {
  const [status, setStatus] = useState<ConnectionStatus>(multiplayerService.getConnectionStatus());
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<{ text: string; name: string; timestamp: number }[]>([]);
  const log = useRef<HTMLDivElement>(null);
  const me = room.participants.find(p => p.id === user.id);
  const allReady = room.participants.every(p => p.isBot || p.isReady);
  useEffect(() => {
    setMessages([]);
    setError('');
    return multiplayerService.subscribe(event => {
      if (event.type === 'CONNECTION_STATUS') setStatus(event.status);
      if (event.type === 'ROOM_ERROR') setError(event.error);
      if (event.type === 'ROOM_CHAT' && event.roomCode === room.code) {
        setMessages(items => [...items, { text: event.text, name: event.senderName, timestamp: event.timestamp }].slice(-50));
      }
    });
  }, [room.code]);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [messages.length]);
  return <div className="border border-slate-700 rounded-2xl p-3 bg-slate-950/60 space-y-3 text-sm">
    <div className="flex flex-wrap items-center gap-2">
      <span role="status" className={status === 'websocket' || status === 'http' ? 'text-emerald-300' : 'text-amber-300'}>
        {({ websocket: 'Live verbunden', http: 'Verbunden über HTTP', connecting: 'Verbindung wird hergestellt …', offline: 'Offline – Züge werden nicht übertragen' })[status]}
      </span>
      {me && <button type="button" aria-pressed={me.isReady} className="ml-auto px-3 py-2 bg-slate-800 rounded-xl" onClick={() => { setError(''); multiplayerService.setReady(room.code, !me.isReady); }}>{me.isReady ? 'Bereit ✓' : 'Ich bin bereit'}</button>}
      {me?.isHost && <button type="button" disabled={!allReady} className="px-3 py-2 bg-indigo-600 rounded-xl disabled:opacity-40" onClick={() => { setError(''); multiplayerService.startRound(room.code); }}>Gemeinsam neu starten</button>}
    </div>
    <p className="text-xs text-slate-400">{room.participants.filter(p => p.isReady || p.isBot).length}/{room.participants.length} bereit · {room.status === 'in-game' ? 'Partie läuft' : 'Lobby'}</p>
    {error && <p role="alert" className="text-amber-300">{error}</p>}
    <details>
      <summary className="cursor-pointer py-2">Tischchat ({messages.length})</summary>
      <div ref={log} role="log" aria-label="Nachrichten am Tisch" aria-live="polite" className="max-h-44 overflow-y-auto space-y-2 py-2">
        {messages.length === 0 && <p className="text-slate-500">Noch keine Nachrichten.</p>}
        {messages.map((message, i) => <p key={`${message.timestamp}:${i}`} className="break-words"><strong className="text-sky-300">{message.name}: </strong>{message.text}</p>)}
      </div>
      <form className="flex gap-2" onSubmit={event => {
        event.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || !me || status === 'offline') return;
        multiplayerService.sendChatMessage(room.code, trimmed, user.name, user.id);
        setText('');
      }}>
        <input aria-label="Nachricht am Tisch" maxLength={500} value={text} onChange={e => setText(e.target.value)} placeholder="Nachricht …" className="min-w-0 flex-1 rounded-xl bg-slate-800 px-3 py-2" />
        <button type="submit" disabled={!me || !text.trim() || status === 'offline'} className="px-3 py-2 rounded-xl bg-indigo-600 disabled:opacity-40">Senden</button>
      </form>
    </details>
  </div>;
}
