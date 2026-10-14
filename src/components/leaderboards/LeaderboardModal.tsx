import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { sound } from '../../services/sound';
import { authService } from '../../services/authService';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { Trophy, Medal, Crown, Flame, Users, X, Sparkles, Gamepad2 } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'players' | 'clans'>('players');

  if (!isOpen) return null;

  // Real users from database/authService sorted by score/XP
  const allUsers = authService.getUsers();
  const sortedPlayers = [...allUsers].sort((a, b) => (b.xp || 0) - (a.xp || 0));

  // Extract clans from real users with clanName
  const clanMap = new Map<string, { name: string; points: number; wins: number; members: number }>();
  allUsers.forEach((u) => {
    const clan = u.clanName?.trim();
    if (clan) {
      const existing = clanMap.get(clan) || { name: clan, points: 0, wins: 0, members: 0 };
      existing.points += u.xp || 0;
      existing.wins += u.stats?.gamesWon || 0;
      existing.members += 1;
      clanMap.set(clan, existing);
    }
  });

  const sortedClans = Array.from(clanMap.values()).sort((a, b) => b.points - a.points);

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
              <h2 className="text-xl font-bold font-display text-white">Rangliste & Bestenliste</h2>
              <p className="text-xs text-slate-400">Echte Spielstände und Platzierungen am Familientisch</p>
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
            onClick={() => { sound.playClick(); setActiveTab('players'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'players'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-4 h-4" /> Spieler ({sortedPlayers.length})
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('clans'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'clans'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Familien-Clans ({sortedClans.length})
          </button>
        </div>

        {/* Body list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2.5">
          {activeTab === 'players' ? (
            sortedPlayers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="font-semibold text-sm">Noch keine Spieler registriert.</p>
                <p className="text-xs text-slate-500 mt-1">Spiele eine Runde, um die Rangliste anzuführen!</p>
              </div>
            ) : (
              sortedPlayers.map((player, index) => {
                const isMe = player.id === currentUser.id;
                const rank = index + 1;

                return (
                  <div
                    key={player.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                      isMe
                        ? 'bg-amber-500/15 border-amber-500/40 font-bold shadow-lg ring-1 ring-amber-400/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-xl font-mono font-bold flex items-center justify-center text-xs ${
                          rank === 1
                            ? 'bg-amber-400 text-slate-950 shadow-md'
                            : rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        #{rank}
                      </span>
                      <AvatarDisplay avatar={player.avatar} size="sm" />
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                          <span>{player.name}</span>
                          {isMe && (
                            <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black">
                              DU
                            </span>
                          )}
                          {player.isVip && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold border border-amber-500/30">
                              VIP
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {player.stats?.gamesWon || 0} Siege · {player.stats?.gamesPlayed || 0} Spiele
                          {player.clanName && ` · Clan: ${player.clanName}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-base font-black text-amber-400">
                        {(player.xp || 0).toLocaleString()} XP
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Stufe {player.level || 1}</span>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            sortedClans.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="font-semibold text-sm">Noch keine Familien-Clans erstellt.</p>
                <p className="text-xs text-slate-500 mt-1">Trage im Benutzerprofil deinen Clan-Namen ein, um hier zu erscheinen!</p>
              </div>
            ) : (
              sortedClans.map((clan, index) => {
                const isUserClan = currentUser.clanName === clan.name;
                const rank = index + 1;

                return (
                  <div
                    key={clan.name}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                      isUserClan
                        ? 'bg-indigo-500/15 border-indigo-500/40 font-bold shadow-lg ring-1 ring-indigo-400/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl font-mono font-bold flex items-center justify-center text-xs bg-slate-800 text-slate-300">
                        #{rank}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                          <span>{clan.name}</span>
                          {isUserClan && (
                            <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-black">
                              DEIN CLAN
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {clan.members} Mitglieder · {clan.wins} Gesamtsiege
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-base font-black text-indigo-400">
                        {clan.points.toLocaleString()} XP
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Clan-Punkte</span>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
};
