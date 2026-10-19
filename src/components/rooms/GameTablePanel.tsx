import { RoomLobby } from './RoomLobby';
import React, { useState, useEffect } from 'react';
import { GameRoom, RoomParticipant, UserProfile } from '../../types';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { sound } from '../../services/sound';
import { multiplayerService, MultiplayerEvent } from '../../services/multiplayerService';
import { 
  Users, 
  Crown, 
  Bot, 
  Plus, 
  Copy, 
  Check, 
  Share2, 
  Radio, 
  Sparkles, 
  LogOut, 
  UserCheck, 
  Wifi, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Volume2,
  BookOpen
} from 'lucide-react';
import { HowToPlayModal } from './HowToPlayModal';
import { GameEngineType } from '../../types';

interface GameTablePanelProps {
  room: GameRoom;
  currentUser: UserProfile;
  activeTurnPlayerId?: string | null;
  onUpdateRoom: (updatedRoom: GameRoom) => void;
  onLeaveTable?: () => void;
  onInviteFriend?: () => void;
  activeGameEngine?: GameEngineType;
}

export const GameTablePanel: React.FC<GameTablePanelProps> = ({
  room,
  currentUser,
  activeTurnPlayerId,
  onUpdateRoom,
  onLeaveTable,
  onInviteFriend,
  activeGameEngine,
}) => {
  const mayManage = room.participants.some(p => p.id === currentUser.id && p.isHost);
  const [actionError,setActionError] = useState('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeEmote, setActiveEmote] = useState<{ emoji: string; senderName: string } | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);

  // Listen for multiplayer emotes
  useEffect(() => {
    const unsubscribe = multiplayerService.subscribe((event: MultiplayerEvent) => {
      if (event.type === 'TABLE_EMOTE' && event.roomCode === room.code) {
        sound.playReward();
        setActiveEmote({ emoji: event.emoji, senderName: event.senderName });
        setTimeout(() => setActiveEmote(null), 2500);
      }
    });
    return () => unsubscribe();
  }, [room.code]);

  const handleCopyCode = () => {
    sound.playClick();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(room.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleAddBot = () => {
    if (!mayManage) return;
    sound.playReward();
    void multiplayerService.addBotToRoom(room.code).then(onUpdateRoom).catch(error=>setActionError(error.message));
  };

  const handleRemoveSeat = (participantId: string) => {
    if (!mayManage) return;
    sound.playClick();
    void multiplayerService.removeParticipant(room.code,participantId).then(onUpdateRoom).catch(error=>setActionError(error.message));
  };

  const handleSitDown = () => {
    sound.playReward();
    void multiplayerService.joinRoom(room.code,currentUser).then(onUpdateRoom).catch(error=>setActionError(error.message));
  };

  const handleSendEmote = (emoji: string) => {
    sound.playClick();
    multiplayerService.sendTableEmote(room.code, emoji, currentUser.name, currentUser.id);
    setActiveEmote({ emoji, senderName: currentUser.name });
    setTimeout(() => setActiveEmote(null), 2500);
  };

  const handleAddFamilyPlayer = () => {
    sound.playReward();
    void multiplayerService.addHumanSimPlayerToRoom(room.code).then(onUpdateRoom).catch(error=>setActionError(error.message));
  };

  const isUserSeated = room.participants.some((p) => p.id === currentUser.id);
  const openSeatsCount = Math.max(0, room.maxPlayers - room.participants.length);

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-600/40 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden transition-all">
      {/* Decorative Felt Mat texture & subtle background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-slate-950/40 to-slate-950 pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {actionError && <p role="alert" className="text-rose-300 relative z-10">{actionError}</p>}
      {/* Floating Emote Notification */}
      {activeEmote && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border-2 border-amber-400 text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="text-2xl">{activeEmote.emoji}</span>
          <span className="text-xs font-bold text-amber-300">{activeEmote.senderName} reagiert!</span>
        </div>
      )}

      <div className="relative z-10 mb-4"><RoomLobby room={room} user={currentUser} /></div>

      {/* Top Header of the Spieltisch */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black font-display text-white tracking-wide">
                {room.name}
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <Wifi className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                {{ websocket: 'WebSocket Live', http: 'HTTP verbunden', connecting: 'Verbinde …', offline: 'Offline' }[multiplayerService.getConnectionStatus()]}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="text-amber-400 font-semibold">{room.gameTitle}</span>
              <span>•</span>
              <span>Host: <strong className="text-slate-200">{room.hostName}</strong></span>
              <span>•</span>
              <span className="font-mono text-emerald-400">{room.participants.length}/{room.maxPlayers} Spieler platziert</span>
            </div>
          </div>
        </div>

        {/* Room Code with 1-Click Copy & Quick Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Room Code Badge */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700/90 border border-amber-500/50 px-3 py-1.5 rounded-2xl transition shadow group"
            title="Tisch-Code kopieren"
          >
            <span className="text-[11px] font-mono font-black text-amber-400 tracking-wider">
              {room.code}
            </span>
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            )}
          </button>

          {/* Quick Add Player to Table */}
          {openSeatsCount > 0 && (
            <button
              disabled={!mayManage}
              onClick={handleAddFamilyPlayer}
              className="px-2.5 py-1.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
              title="Familienmitglied direkt an den Tisch setzen"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">+ Mitspieler setzen</span>
            </button>
          )}

          {/* How to Play Guide Button */}
          <button
            onClick={() => {
              sound.playClick();
              setIsHowToPlayOpen(true);
            }}
            className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/50 text-amber-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm group"
            title="Spielanleitung & interaktiven Board-Guide öffnen"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Spielanleitung</span>
          </button>

          {/* Invite friend button */}
          {onInviteFriend && (
            <button
              onClick={onInviteFriend}
              className="px-3 py-1.5 rounded-2xl bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Einladen</span>
            </button>
          )}

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title={isExpanded ? 'Tisch einklappen' : 'Tisch ausklappen'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* SEATS GRID: Shows EVERY seated user and empty chairs */}
      {isExpanded && (
        <div className="relative z-10 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Render all currently seated participants */}
            {room.participants.map((participant, index) => {
              const isTurn = activeTurnPlayerId === participant.id;
              const isMe = participant.id === currentUser.id;
              const isHost = participant.isHost;

              return (
                <div
                  key={participant.id}
                  className={`p-3 rounded-2xl border transition relative flex flex-col items-center text-center ${
                    isTurn
                      ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 scale-[1.02]'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  {/* Seat Number Tag */}
                  <div className="absolute top-2 left-2.5 text-[10px] font-mono text-slate-500 font-bold">
                    #{index + 1}
                  </div>

                  {/* Turn indicator badge */}
                  {isTurn && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse shadow">
                      <Sparkles className="w-2.5 h-2.5" /> AM ZUG
                    </div>
                  )}

                  {/* Ping & Host badge */}
                  {!isTurn && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono text-slate-400">
                      <Wifi className="w-3 h-3 text-emerald-400" />
                      <span>{participant.ping}ms</span>
                    </div>
                  )}

                  {/* Avatar with Turn Glow */}
                  <div className={`mt-2 mb-2 p-1 rounded-2xl transition-all ${isTurn ? 'ring-4 ring-amber-400/80 shadow-lg' : ''}`}>
                    <AvatarDisplay avatar={participant.avatar} size="md" />
                  </div>

                  {/* Player Name */}
                  <div className="font-bold text-xs text-white truncate max-w-[120px] flex items-center justify-center gap-1">
                    <span>{participant.name}</span>
                    {isHost && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                    {participant.isBot && <Bot className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                  </div>

                  {/* Role / Tag */}
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {isMe ? (
                      <span className="text-emerald-400 font-bold">● Du (Ich)</span>
                    ) : participant.isBot ? (
                      <span className="text-sky-300 font-semibold">KI-Mitspieler</span>
                    ) : isHost ? (
                      <span className="text-amber-300 font-semibold">Tisch-Leiter</span>
                    ) : (
                      <span>Familienmitglied</span>
                    )}
                  </div>

                  {/* Actions for this seat */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 w-full flex items-center justify-center gap-1.5">
                    {participant.isBot && mayManage && (
                      <button
                        onClick={() => handleRemoveSeat(participant.id)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-lg hover:bg-rose-500/10 transition"
                      >
                        Bot entfernen
                      </button>
                    )}
                    {!participant.isBot && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> {participant.isReady ? "Bereit" : "Noch nicht bereit"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 2. Render EMPTY chairs up to maxPlayers */}
            {Array.from({ length: openSeatsCount }).map((_, idx) => {
              const seatNum = room.participants.length + idx + 1;
              return (
                <div
                  key={`empty_${idx}`}
                  className="p-3 rounded-2xl border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 flex flex-col items-center justify-center text-center transition group min-h-[160px]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 group-hover:text-slate-400 mb-2 transition">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-400">
                    Stuhl #{seatNum} Frei
                  </div>
                  <div className="text-[10px] text-slate-500 mb-2">Offener Platz</div>

                  {/* Buttons to fill this empty seat */}
                  <div className="flex flex-col gap-1 w-full px-1">
                    {!isUserSeated && (
                      <button
                        onClick={handleSitDown}
                        className="w-full py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition shadow"
                      >
                        Platz nehmen
                      </button>
                    )}
                    <button
                      disabled={!mayManage}
                      onClick={handleAddFamilyPlayer}
                      className="w-full py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] border border-amber-500/40 transition flex items-center justify-center gap-1"
                    >
                      <Users className="w-3 h-3" /> + Mitspieler
                    </button>
                    <button
                      disabled={!mayManage}
                      onClick={handleAddBot}
                      className="w-full py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-[10px] border border-slate-700 transition flex items-center justify-center gap-1"
                    >
                      <Bot className="w-3 h-3" /> + KI-Spieler
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Emote Reactions & Mode Info */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">
                Tisch-Reaktionen:
              </span>
              {['🎲', '🎉', '👏', '😱', '🔥', '👑', '❤️', '😂'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendEmote(emoji)}
                  className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-slate-700 hover:scale-125 transition-transform flex items-center justify-center text-sm shadow-sm"
                  title={`Reaktion senden: ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-semibold">
                Multiplayer: {room.participants.length} Spieler am Tisch
              </span>
              {onLeaveTable && (
                <button
                  onClick={onLeaveTable}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold ml-1 transition"
                >
                  <LogOut className="w-3.5 h-3.5" /> Tisch verlassen
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HOW TO PLAY & BOARD INTERACTION OVERLAY MODAL */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
        engine={activeGameEngine || (room.gameId as GameEngineType)}
        gameTitle={room.gameTitle}
      />
    </div>
  );
};
