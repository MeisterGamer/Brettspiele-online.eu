import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { sound } from '../../services/sound';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { Trophy, Medal, Crown, Flame, Users, X, Sparkles } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

const GLOBAL_CLANS = [
  { rank: 1, name: 'The Miller Squad', points: 14820, wins: 142, streak: 12, flag: '🇺🇸', isUser: true },
  { rank: 2, name: 'Familie Schmidt', points: 14210, wins: 138, streak: 9, flag: '🇩🇪' },
  { rank: 3, name: 'Los García Hermanos', points: 13950, wins: 131, streak: 8, flag: '🇪🇸' },
  { rank: 4, name: 'Rossi Gaming House', points: 12840, wins: 119, streak: 6, flag: '🇮🇹' },
  { rank: 5, name: 'Tanaka Family Arcade', points: 12100, wins: 114, streak: 7, flag: '🇯🇵' },
  { rank: 6, name: 'Dubois Champions', points: 11650, wins: 108, streak: 5, flag: '🇫🇷' },
  { rank: 7, name: 'Baker Board Clan', points: 10920, wins: 99, streak: 4, flag: '🇬🇧' },
];

const INDIVIDUAL_PLAYERS = [
  { rank: 1, name: 'Champion Elena', score: 3840, role: 'Grandparent', game: 'FamCards (Uno)', isVip: true },
  { rank: 2, name: 'Alex Gamer (You)', score: 3450, role: 'Family Champion', game: 'Connect Four', isVip: true, isUser: true },
  { rank: 3, name: 'Sophie', score: 3210, role: 'Teen', game: 'Checkers', isVip: true },
  { rank: 4, name: 'Uncle Dan', score: 2980, role: 'Parent', game: 'Yatzy', isVip: false },
  { rank: 5, name: 'Leo', score: 2750, role: 'Child', game: 'Memory Match', isVip: false },
  { rank: 6, name: 'Marcus', score: 2540, role: 'Parent', game: 'Battleship', isVip: false },
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'clans' | 'players'>('clans');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-orange-500/20 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Arcade Hall of Fame & Rankings</h2>
              <p className="text-xs text-slate-400">Global family clans and household rankings</p>
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
            onClick={() => { sound.playClick(); setActiveTab('clans'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'clans'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Family Clans (Global)
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('players'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'players'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-4 h-4" /> Top Individual Players
          </button>
        </div>

        {/* Body list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2.5">
          {activeTab === 'clans' ? (
            GLOBAL_CLANS.map((clan) => (
              <div
                key={clan.rank}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                  clan.isUser
                    ? 'bg-amber-500/15 border-amber-500/40 font-bold shadow-lg ring-1 ring-amber-400/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl font-mono font-bold flex items-center justify-center text-xs ${
                      clan.rank === 1
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : clan.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : clan.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {clan.rank}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                      <span>{clan.flag}</span>
                      <span>{clan.name}</span>
                      {clan.isUser && (
                        <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{clan.wins} Wins</span>
                      <span>•</span>
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <Flame className="w-3 h-3 text-orange-400" /> {clan.streak} Win Streak
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-base font-black text-amber-400">
                    {clan.points.toLocaleString()} pts
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Clan XP</span>
                </div>
              </div>
            ))
          ) : (
            INDIVIDUAL_PLAYERS.map((p) => (
              <div
                key={p.rank}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                  p.isUser
                    ? 'bg-indigo-500/15 border-indigo-500/40 font-bold shadow-lg ring-1 ring-indigo-400/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl font-mono font-bold flex items-center justify-center text-xs bg-slate-800 text-slate-300">
                    #{p.rank}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                      <span>{p.name}</span>
                      {p.isVip && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1 rounded font-bold">
                          VIP
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Role: <strong className="text-slate-300">{p.role}</strong> • Fav: {p.game}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-base font-black text-indigo-400">
                    {p.score.toLocaleString()} XP
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Gamer Rating</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
