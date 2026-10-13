import React, { useState } from 'react';
import { Tournament, UserProfile } from '../../types';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  X, 
  ShieldCheck,
  Medal,
  ChevronRight
} from 'lucide-react';

interface TournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournaments: Tournament[];
  currentUser: UserProfile;
  onRegister: (tournamentId: string) => void;
}

export const TournamentModal: React.FC<TournamentModalProps> = ({
  isOpen,
  onClose,
  tournaments,
  currentUser,
  onRegister,
}) => {
  const [selectedTourneyId, setSelectedTourneyId] = useState<string>(tournaments[0]?.id || '');

  if (!isOpen) return null;

  const activeTourney = tournaments.find((t) => t.id === selectedTourneyId) || tournaments[0];

  const handleRegister = (id: string) => {
    sound.playReward();
    onRegister(id);
    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-red-600/20 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Monthly Family Tournaments</h2>
              <p className="text-xs text-slate-400">Compete together as a household squad for exclusive cups and prizes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
          
          {/* Left Column: Tournament List */}
          <div className="p-4 border-r border-slate-800/80 overflow-y-auto space-y-2.5 bg-slate-950/40">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Active & Upcoming Cups
            </span>
            {tournaments.map((t) => {
              const isSelected = t.id === selectedTourneyId;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedTourneyId(t.id);
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-md ring-1 ring-amber-400/30'
                      : 'bg-slate-900 border-slate-800/80 hover:bg-slate-850 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-0.5">
                    {t.season}
                  </div>
                  <h4 className="font-bold text-xs text-white leading-snug">{t.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span className="text-slate-300">{t.gameTitle}</span>
                    <span className="font-mono text-emerald-400 font-semibold">{t.stages}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Selected Tournament Details & Leaderboard */}
          {activeTourney && (
            <div className="md:col-span-2 p-6 overflow-y-auto space-y-5">
              
              {/* Banner Card with Real Photography */}
              <div
                className={`rounded-3xl p-5 bg-gradient-to-r ${activeTourney.bannerColor} text-white shadow-xl relative overflow-hidden min-h-[160px] flex flex-col justify-end`}
              >
                <img
                  src={
                    activeTourney.id === 'tourney-oct-grandmaster'
                      ? 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=800&q=80'
                      : activeTourney.id === 'tourney-spooky-kniffel'
                      ? 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80'
                      : 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={activeTourney.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover filter brightness-[0.35] contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full w-fit mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {activeTourney.stages} Phase
                  </div>
                  <h3 className="text-xl font-bold font-display drop-shadow-md">{activeTourney.title}</h3>
                  <p className="text-xs text-white/90 mt-1 drop-shadow">Official Game: {activeTourney.gameTitle}</p>

                  <div className="flex items-center gap-4 mt-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-white/10">
                      <Trophy className="w-4 h-4 text-amber-300" />
                      <span>{activeTourney.prizePool}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-white/10">
                      <Clock className="w-4 h-4 text-white" />
                      <span>Ends in {activeTourney.endsInDays} Days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clan Squad Registration Status */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Your Household Squad: <span className="text-amber-400">{currentUser.clanName}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeTourney.registered
                      ? 'Squad is registered! Play qualifying matches to advance.'
                      : 'Register your family clan to start earning cup points.'}
                  </p>
                </div>

                {activeTourney.registered ? (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Registered
                  </span>
                ) : (
                  <button
                    onClick={() => handleRegister(activeTourney.id)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    <Trophy className="w-4 h-4" /> Register Squad
                  </button>
                )}
              </div>

              {/* Tournament Standings */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Current Cup Standings</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {activeTourney.participantsCount} Families Competing
                  </span>
                </h4>

                <div className="space-y-2">
                  {activeTourney.leaderboard.map((item) => (
                    <div
                      key={item.rank}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition ${
                        item.familyClan.includes('You')
                          ? 'bg-amber-500/15 border-amber-500/40 font-bold text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-lg font-bold font-mono flex items-center justify-center text-xs ${
                            item.rank === 1
                              ? 'bg-amber-400 text-slate-950'
                              : item.rank === 2
                              ? 'bg-slate-300 text-slate-950'
                              : item.rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.rank}
                        </span>
                        <span>{item.familyClan}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-slate-400">{item.wins} Wins</span>
                        <span className="font-mono font-bold text-amber-400">{item.points} Pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
