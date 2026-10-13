import React from 'react';
import { Achievement } from '../../types';
import { sound } from '../../services/sound';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, Coins, Sparkles, X } from 'lucide-react';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
  onClaimReward: (achId: string) => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  achievements,
  onClaimReward,
}) => {
  if (!isOpen) return null;

  const handleClaim = (id: string) => {
    sound.playReward();
    try {
      confetti({ particleCount: 75, spread: 60 });
    } catch (e) {}
    onClaimReward(id);
  };

  const completedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-indigo-600/20 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Shared Family Achievements</h2>
              <p className="text-xs text-slate-400">Complete challenges together to unlock coins, XP & flairs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress summary banner */}
        <div className="bg-slate-950/60 p-4 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="text-xs text-slate-300">
            Household Progress: <strong className="text-emerald-400">{completedCount} of {achievements.length}</strong> Completed
          </div>
          <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
              style={{ width: `${(completedCount / achievements.length) * 100}%` }}
            />
          </div>
        </div>

        {/* List of achievements */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {achievements.map((ach) => {
            const isCompleted = ach.progress >= ach.maxProgress;
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  ach.unlocked
                    ? 'bg-slate-950/40 border-slate-800 opacity-90'
                    : isCompleted
                    ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md ring-1 ring-emerald-400/40'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-2xl shadow-inner shrink-0">
                    {ach.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{ach.title}</span>
                      {ach.unlocked && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{ach.description}</p>
                    
                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{
                            width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {ach.progress}/{ach.maxProgress}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs text-amber-400 font-bold flex items-center justify-end gap-1 mb-1.5">
                    <Coins className="w-3.5 h-3.5" /> +{ach.coinReward}
                  </div>

                  {ach.unlocked ? (
                    <span className="text-[11px] bg-slate-800 text-slate-400 px-3 py-1 rounded-xl font-semibold">
                      Claimed
                    </span>
                  ) : isCompleted ? (
                    <button
                      onClick={() => handleClaim(ach.id)}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition animate-pulse"
                    >
                      Claim!
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-medium">In Progress</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
