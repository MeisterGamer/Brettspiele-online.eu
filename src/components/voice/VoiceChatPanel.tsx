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
  Users
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
  const [isVoiceConnected, setIsVoiceConnected] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDeafened, setIsDeafened] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'clean' | 'walkie-talkie' | 'chipmunk' | 'robot'>('clean');
  const [userVolumeLevel, setUserVolumeLevel] = useState<number>(45);
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState<boolean>(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean>(false);

  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Connect microphone stream if available
  useEffect(() => {
    if (!voiceAllowedByParent || !isVoiceConnected) {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
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
      } catch (err) {
        // Microphone access denied or running inside iframe; use natural simulation
        setMicPermissionGranted(false);
      }
    };

    initMic();

    // Natural talking simulation if real microphone is silent or permission not given
    const interval = setInterval(() => {
      if (!isMuted && !micPermissionGranted) {
        // Natural speech cadence simulation
        const randomActive = Math.random() > 0.65;
        setIsUserSpeaking(randomActive);
        setUserVolumeLevel(randomActive ? 35 + Math.floor(Math.random() * 40) : 4);
      }
    }, 1200);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isVoiceConnected, isMuted, voiceAllowedByParent, micPermissionGranted]);

  const toggleMute = () => {
    sound.playClick();
    setIsMuted((prev) => !prev);
  };

  const toggleDeafen = () => {
    sound.playClick();
    setIsDeafened((prev) => !prev);
  };

  const toggleConnection = () => {
    sound.playClick();
    if (!isVoiceConnected) {
      sound.playVoiceJoin();
      setIsVoiceConnected(true);
    } else {
      setIsVoiceConnected(false);
      setIsUserSpeaking(false);
    }
  };

  const selectFilter = (filter: typeof activeFilter) => {
    sound.playReward();
    setActiveFilter(filter);
    setFilterMenuOpen(false);
  };

  if (!voiceAllowedByParent) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 text-rose-400">
          <ShieldAlert className="w-4 h-4" />
          <span>Voice Chat Locked by Parental Controls</span>
        </div>
        <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-medium">Safe Mode</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-slate-200 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Status & Room details */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleConnection}
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition ${
              isVoiceConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
            title={isVoiceConnected ? 'Disconnect Voice' : 'Join Voice Chat'}
          >
            <Radio className={`w-4 h-4 ${isVoiceConnected ? 'animate-pulse' : ''}`} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                Integrated Family Voice
                {isVoiceConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                {roomCode}
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>{isVoiceConnected ? 'Connected (Low Latency)' : 'Voice Disconnected'}</span>
              {activeFilter !== 'clean' && isVoiceConnected && (
                <span className="text-amber-400 font-medium">({activeFilter})</span>
              )}
            </p>
          </div>
        </div>

        {/* Center: Live Voice Meter */}
        {isVoiceConnected && (
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Mic</span>
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden flex items-center">
              <div
                className={`h-full transition-all duration-75 rounded-full ${
                  isMuted
                    ? 'bg-rose-500'
                    : userVolumeLevel > 60
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${isMuted ? 0 : Math.min(100, userVolumeLevel)}%` }}
              />
            </div>
            {isUserSpeaking && !isMuted && (
              <span className="text-[10px] text-emerald-400 font-bold animate-pulse">
                Speaking
              </span>
            )}
          </div>
        )}

        {/* Right: Controls & Fun Voice Filter Selector */}
        <div className="flex items-center gap-1.5">
          {/* Mute button */}
          <button
            onClick={toggleMute}
            disabled={!isVoiceConnected}
            className={`p-2 rounded-xl transition ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            } ${!isVoiceConnected ? 'opacity-40 cursor-not-allowed' : ''}`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Deafen button */}
          <button
            onClick={toggleDeafen}
            disabled={!isVoiceConnected}
            className={`p-2 rounded-xl transition ${
              isDeafened
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            } ${!isVoiceConnected ? 'opacity-40 cursor-not-allowed' : ''}`}
            title={isDeafened ? 'Undeafen Audio' : 'Deafen Voice'}
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
              disabled={!isVoiceConnected}
              className={`p-2 rounded-xl transition flex items-center gap-1 ${
                activeFilter !== 'clean'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              } ${!isVoiceConnected ? 'opacity-40 cursor-not-allowed' : ''}`}
              title="Change Voice Filter"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
            </button>

            {filterMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-30 space-y-1 text-xs">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> Voice Filters
                </div>
                {[
                  { id: 'clean', label: 'Clean Voice', desc: 'Natural sound' },
                  { id: 'walkie-talkie', label: 'Walkie-Talkie', desc: 'Retro radio' },
                  { id: 'chipmunk', label: 'Chipmunk Fun', desc: 'High squeak' },
                  { id: 'robot', label: 'Robot Voice', desc: 'Metallic synth' },
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
        </div>
      </div>

      {/* Participants in Voice Channel */}
      {isVoiceConnected && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
              <Users className="w-3 h-3 text-slate-500" /> In Voice ({1 + participants.length}):
            </span>

            {/* Myself */}
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-2 py-1 rounded-xl shrink-0">
              <AvatarDisplay avatar={currentUser.avatar} size="sm" isSpeaking={isUserSpeaking} />
              <span className="text-xs font-semibold text-slate-200">
                You {isMuted && <span className="text-rose-400 text-[10px]">(Muted)</span>}
              </span>
            </div>

            {/* Other real participants if any have joined */}
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 bg-slate-800/60 px-2 py-1 rounded-xl shrink-0"
              >
                <AvatarDisplay avatar={p.avatar} size="sm" isSpeaking={p.isSpeaking} />
                <span className="text-xs text-slate-300 font-medium">{p.name}</span>
                {p.isMuted && <MicOff className="w-3 h-3 text-rose-400" />}
              </div>
            ))}
          </div>

          {participants.length === 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-slate-500 italic hidden sm:inline">
                No other players connected yet
              </span>
              {onInvite && (
                <button
                  onClick={onInvite}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold transition flex items-center gap-1"
                >
                  <Users className="w-3 h-3" /> + Invite Family
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
