import React, { useState } from 'react';
import { GameRoom, UserProfile, GameInfo } from '../../types';
import { sound } from '../../services/sound';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { multiplayerService } from '../../services/multiplayerService';
import { 
  Users, 
  Plus, 
  Lock, 
  Globe, 
  Mic, 
  Search, 
  X, 
  Play, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Bot
} from 'lucide-react';

interface RoomManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  publicRooms: GameRoom[];
  availableGames: GameInfo[];
  onJoinRoom: (room: GameRoom) => void;
  onCreateRoom: (newRoom: GameRoom) => void;
}

export const RoomManagerModal: React.FC<RoomManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  publicRooms,
  availableGames,
  onJoinRoom,
  onCreateRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'code'>('browse');
  const [roomFilter, setRoomFilter] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [joinCodeError, setJoinCodeError] = useState<string>('');

  // Create Room Form State
  const [roomName, setRoomName] = useState<string>(`${currentUser.name}’s Game Night`);
  const [selectedGameId, setSelectedGameId] = useState<string>('fam-cards');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [enableVoice, setEnableVoice] = useState<boolean>(true);
  const [maxPlayers, setMaxPlayers] = useState<number>(4);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playReward();
    const game = availableGames.find((g) => g.id === selectedGameId) || availableGames[0];

    const newRoom = multiplayerService.createRoom(currentUser, {
      name: roomName,
      gameId: game.id,
      gameTitle: game.title,
      maxPlayers,
      isPrivate,
      voiceChatActive: enableVoice,
    });

    onCreateRoom(newRoom);
    onClose();
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = inputCode.trim().toUpperCase();
    const found = publicRooms.find((r) => r.code === formatted || r.code.replace('-', '') === formatted);
    if (found) {
      sound.playReward();
      const updated = multiplayerService.joinRoom(found.code, currentUser) || found;
      onJoinRoom(updated);
      onClose();
    } else {
      sound.playError();
      setJoinCodeError(`Tisch mit Code "${formatted}" nicht gefunden. Versuche FAM-101 oder FAM-777.`);
    }
  };

  const filteredRooms = publicRooms.filter((r) =>
    r.name.toLowerCase().includes(roomFilter.toLowerCase()) ||
    r.gameTitle.toLowerCase().includes(roomFilter.toLowerCase()) ||
    r.code.toLowerCase().includes(roomFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Family Game Rooms & Lobbies</h2>
              <p className="text-xs text-slate-400">Join friends, open public rooms, or host private tables</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2">
          <button
            onClick={() => { sound.playClick(); setActiveTab('browse'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'browse'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" /> Browse Public Rooms ({publicRooms.length})
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('create'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'create'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" /> Host New Room
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('code'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'code'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" /> Enter Room Code
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: Browse Public Rooms */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter rooms by name, game or code..."
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2.5">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{room.name}</span>
                        <span className="text-[11px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">
                          {room.code}
                        </span>
                        {room.voiceChatActive && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                            <Mic className="w-3 h-3" /> Voice
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="text-amber-400 font-medium">{room.gameTitle}</span>
                        <span>•</span>
                        <span>Host: {room.hostName}</span>
                        <span>•</span>
                        <span>{room.createdAt}</span>
                      </div>

                      {/* Participant avatars preview */}
                      <div className="flex items-center gap-1.5 mt-2">
                        {room.participants.map((p) => (
                          <AvatarDisplay key={p.id} avatar={p.avatar} size="sm" />
                        ))}
                        <span className="text-[11px] text-slate-400 ml-1 font-mono">
                          {room.currentPlayers}/{room.maxPlayers} Seated
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {room.participants.length < room.maxPlayers && (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            const updated = multiplayerService.addBotToRoom(room.id);
                            if (updated) {
                              onJoinRoom(updated);
                            }
                          }}
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold text-xs border border-slate-700 transition flex items-center gap-1"
                          title="Fügt dem Tisch einen KI-Mitspieler hinzu"
                        >
                          <Bot className="w-3.5 h-3.5" /> + Bot
                        </button>
                      )}
                      <button
                        onClick={() => {
                          sound.playReward();
                          const updated = multiplayerService.joinRoom(room.code, currentUser) || room;
                          onJoinRoom(updated);
                          onClose();
                        }}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Platz nehmen
                      </button>
                    </div>
                  </div>
                ))}

                {filteredRooms.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Aktuell keine offenen Tische vorhanden. Klicke oben auf „Neuen Tisch eröffnen“, um als Erster einen Familientisch zu starten!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Host New Room */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Room Title
                </label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Select Game Title
                </label>
                <select
                  value={selectedGameId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedGameId(newId);
                    const sel = availableGames.find((g) => g.id === newId);
                    if (sel && ['chess', 'connect-four', 'checkers', 'battleship', 'dots-boxes', 'tictactoe'].includes(sel.engine)) {
                      setMaxPlayers(2);
                    } else {
                      setMaxPlayers(4);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                >
                  {availableGames.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} • {g.players}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Player Limit
                  </label>
                  {(() => {
                    const sel = availableGames.find((g) => g.id === selectedGameId);
                    const isTwoPlayer = sel && ['chess', 'connect-four', 'checkers', 'battleship', 'dots-boxes', 'tictactoe'].includes(sel.engine);
                    if (isTwoPlayer) {
                      return (
                        <select
                          value={2}
                          disabled
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                        >
                          <option value={2}>2 Spieler (Duell)</option>
                        </select>
                      );
                    }
                    return (
                      <select
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                      >
                        <option value={2}>2 Spieler (Duell)</option>
                        <option value={4}>4 Spieler (Familientisch)</option>
                      </select>
                    );
                  })()}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Access Privacy
                  </label>
                  <select
                    value={isPrivate ? 'private' : 'public'}
                    onChange={(e) => setIsPrivate(e.target.value === 'private')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="public">Public (Visible in Lobbies)</option>
                    <option value="private">Private (Invite Code Only)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Enable Integrated Voice Chat</div>
                    <div className="text-[11px] text-slate-400">Allows players at this table to talk with voice filters</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableVoice}
                  onChange={(e) => setEnableVoice(e.target.checked)}
                  className="w-5 h-5 rounded text-indigo-600 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create & Launch Table
              </button>
            </form>
          )}

          {/* TAB 3: Enter Room Code */}
          {activeTab === 'code' && (
            <div className="max-w-md mx-auto text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mx-auto">
                <Lock className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Join with 6-Character Code</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter the private code shared by your family member (e.g. FAM-101, FAM-202):
                </p>
              </div>

              <form onSubmit={handleJoinByCode} className="space-y-3">
                <input
                  type="text"
                  placeholder="FAM-101"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value);
                    setJoinCodeError('');
                  }}
                  className="w-full text-center text-xl font-mono uppercase tracking-widest py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />

                {joinCodeError && (
                  <p className="text-xs text-rose-400">{joinCodeError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-4 h-4" /> Join Private Room
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
