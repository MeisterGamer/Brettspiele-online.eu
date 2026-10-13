import React, { useState, useEffect, useRef } from 'react';
import { VoiceParticipant, UserProfile } from '../../types';
import { sound } from '../../services/sound';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Radio, 
  Sparkles, 
  ShieldAlert, 
  Sliders,
  Users,
  PhoneOff,
  Share2,
  Copy,
  Check
} from 'lucide-react';

interface VoiceChatPanelProps {
  currentUser: UserProfile;
  participants: VoiceParticipant[];
  voiceAllowedByParent: boolean;
  roomCode: string;
  onInvite?: () => void;
}

export const VoiceChatPanel: React.FC<VoiceChatPanelProps> = ({
  currentUser,
  participants,
  voiceAllowedByParent,
  roomCode,
  onInvite,
}) => {
  // STRICTLY OPTIONAL: Voice starts DISCONNECTED by default (no auto-join)
  const [isVoiceConnected, setIsVoiceConnected] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDeafened, setIsDeafened] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'clean' | 'walkie-talkie' | 'chipmunk' | 'robot'>('clean');
  const [userVolumeLevel, setUserVolumeLevel] = useState<number>(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState<boolean>(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean>(false);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);

  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Connect microphone stream ONLY when user explicitly clicks "Beitreten"
  useEffect(() => {
    if (!voiceAllowedByParent || !isVoiceConnected) {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      setIsUserSpeaking(false);
      setUserVolumeLevel(0);
      return;
    }

    let isMounted = true;
    const initMic = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!isMounted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          audioStreamRef.current = stream;
          setMicPermissionGranted(true);

          // Web Audio Analyser for real-time speech meter
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const checkAudio = () => {
              if (!isMounted) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const average = sum / bufferLength;
              const level = Math.min(100, Math.round((average / 128) * 100));
              setUserVolumeLevel(level);
              setIsUserSpeaking(level > 18 && !isMuted);
              animFrameRef.current = requestAnimationFrame(checkAudio);
            };
            checkAudio();
          }
        }
      } catch {
        setMicPermissionGranted(false);
      }
    };

    initMic();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isVoiceConnected, isMuted, voiceAllowedByParent]);

  const toggleMute = () => {
    sound.playClick();
    setIsMuted((prev) => !prev);
  };

  const toggleDeafen = () => {
    sound.playClick();
    setIsDeafened((prev) => !prev);
  };

  const handleJoinVoice = () => {
    sound.playVoiceJoin();
    setIsVoiceConnected(true);
  };

  const handleLeaveVoice = () => {
    sound.playClick();
    setIsVoiceConnected(false);
    setIsUserSpeaking(false);
    setUserVolumeLevel(0);
  };

  const selectFilter = (filter: typeof activeFilter) => {
    sound.playReward();
    setActiveFilter(filter);
    setFilterMenuOpen(false);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    sound.playReward();
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (!voiceAllowedByParent) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 text-rose-400">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Sprachkanal ist durch Kindersicherung deaktiviert</span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Kindersicherung aktiv</span>
      </div>
    );
  }

  // STATE A: DISCONNECTED (Voice chat is optional)
  if (!isVoiceConnected) {
    return (
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl px-4 py-3 text-slate-300 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-400 shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">
                  Familien-Sprachkanal
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  (Optional)
                </span>
                <span className="text-[11px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Tisch: {roomCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Mikrofon ist aus. Du kannst optional beitreten, um live am Tisch zu sprechen.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyRoomCode}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
              title="Raum-Code für Familie kopieren"
            >
              {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{codeCopied ? 'Kopiert!' : `Code: ${roomCode}`}</span>
            </button>

            <button
              onClick={handleJoinVoice}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 text-xs font-bold transition flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Sprachkanal beitreten</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STATE B: CONNECTED
  return (
    <div className="bg-slate-900/95 border border-emerald-500/30 rounded-2xl p-3 text-slate-200 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />
      
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Status & Room details */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                Sprachkanal aktiv
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                {roomCode}
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>Verbunden (Geringe Latenz)</span>
              {activeFilter !== 'clean' && (
                <span className="text-amber-400 font-medium">· Filter: {activeFilter}</span>
              )}
            </p>
          </div>
        </div>

        {/* Center: Live Voice Meter */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Mikro</span>
          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden flex items-center">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                isMuted
                  ? 'bg-rose-500'
                  : userVolumeLevel > 60
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${isMuted ? 0 : Math.min(100, Math.max(10, userVolumeLevel))}%` }}
            />
          </div>
          {isUserSpeaking && !isMuted ? (
            <span className="text-[10px] text-emerald-400 font-bold animate-pulse">
              Spricht
            </span>
          ) : (
            <span className="text-[10px] text-slate-500 font-medium">
              Bereit
            </span>
          )}
        </div>

        {/* Right: Controls & Voice Filter Selector */}
        <div className="flex items-center gap-1.5">
          {/* Mute button */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-xl transition ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title={isMuted ? 'Mikrofon einschalten' : 'Stummschalten'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Deafen button */}
          <button
            onClick={toggleDeafen}
            className={`p-2 rounded-xl transition ${
              isDeafened
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title={isDeafened ? 'Audio einschalten' : 'Stumm schalten'}
          >
            {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Fun Voice Filters Menu */}
          <div className="relative">
            <button
              onClick={() => {
                sound.playClick();
                setFilterMenuOpen((prev) => !prev);
              }}
              className={`p-2 rounded-xl transition flex items-center gap-1 ${
                activeFilter !== 'clean'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Stimmeffekte wählen"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
            </button>

            {filterMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-30 space-y-1 text-xs">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> Stimmeffekte
                </div>
                {[
                  { id: 'clean', label: 'Natürlich', desc: 'Kristallklarer Sound' },
                  { id: 'walkie-talkie', label: 'Walkie-Talkie', desc: 'Funkgerät-Effekt' },
                  { id: 'chipmunk', label: 'Eichhörnchen', desc: 'Hohe Spaßstimme' },
                  { id: 'robot', label: 'Roboter', desc: 'Synthesizer-Klang' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => selectFilter(f.id as any)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl transition flex flex-col ${
                      activeFilter === f.id
                        ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="text-[10px] text-slate-400">{f.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Leave Voice Button */}
          <button
            onClick={handleLeaveVoice}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 text-xs font-semibold transition flex items-center gap-1"
            title="Sprachkanal verlassen"
          >
            <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Verlassen</span>
          </button>
        </div>
      </div>

      {/* Participants Bar - Clean & Authentic (NO fake/mock dummy accounts) */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3 overflow-x-auto text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
            <Users className="w-3 h-3 text-slate-500" /> Im Sprachkanal ({1 + participants.length}):
          </span>

          {/* Myself */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-xl shrink-0">
            <AvatarDisplay avatar={currentUser.avatar} size="sm" isSpeaking={isUserSpeaking} />
            <span className="text-xs font-semibold text-slate-100">
              {currentUser.name} (Du) {isMuted && <span className="text-rose-400 text-[10px]">· Stumm</span>}
            </span>
          </div>

          {/* Other real participants if any have joined */}
          {participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-xl shrink-0"
            >
              <AvatarDisplay avatar={p.avatar} size="sm" isSpeaking={p.isSpeaking} />
              <span className="text-xs text-slate-300 font-medium">{p.name}</span>
              {p.isMuted && <MicOff className="w-3 h-3 text-rose-400" />}
            </div>
          ))}
        </div>

        {participants.length === 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-400 hidden md:inline">
              Teile den Code mit deiner Familie:
            </span>
            <button
              onClick={copyRoomCode}
              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition flex items-center gap-1"
            >
              {codeCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{codeCopied ? 'Kopiert' : `Code: ${roomCode}`}</span>
            </button>
            {onInvite && (
              <button
                onClick={onInvite}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold transition flex items-center gap-1"
              >
                <Share2 className="w-3 h-3 text-sky-400" />
                <span>Einladen</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
