import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { Gift, Flame, Coins, Sparkles, Check, X, Gem, Award } from 'lucide-react';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onClaimDaily: (day: number, coins: number, gems: number) => void;
}

const DAYS_CALENDAR = [
  { day: 1, coins: 100, gems: 0, icon: '🪙', label: '100 Coins' },
  { day: 2, coins: 150, gems: 0, icon: '🪙', label: '150 Coins' },
  { day: 3, coins: 200, gems: 5, icon: '💎', label: '200 Coins + 5 Gems' },
  { day: 4, coins: 250, gems: 0, icon: '🪙', label: '250 Coins' },
  { day: 5, coins: 350, gems: 10, icon: '💎', label: '350 Coins + 10 Gems' },
  { day: 6, coins: 500, gems: 15, icon: '🎁', label: '500 Coins + 15 Gems' },
  { day: 7, coins: 1000, gems: 30, icon: '👑', label: '1000 Coins + Mystery Box' },
];

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onClaimDaily,
}) => {
  const [claimedToday, setClaimedToday] = useState<boolean>(false);
  const currentDay = currentUser.streakDays || 5;

  if (!isOpen) return null;

  const handleClaim = () => {
    const reward = DAYS_CALENDAR.find((d) => d.day === currentDay) || DAYS_CALENDAR[0];
    sound.playReward();
    try {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}
    setClaimedToday(true);
    onClaimDaily(currentDay, reward.coins, reward.gems);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold font-display text-white">Daily Family Login Bonus</h3>
              <span className="text-xs font-bold text-orange-400 bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" /> {currentDay} Day Streak
              </span>
            </div>
            <p className="text-xs text-slate-400">Log in every day with your family to claim escalating rewards!</p>
          </div>
        </div>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-5">
          {DAYS_CALENDAR.map((item) => {
            const isPassed = item.day < currentDay;
            const isToday = item.day === currentDay;
            const isFuture = item.day > currentDay;

            return (
              <div
                key={item.day}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-between min-h-[105px] ${
                  isToday
                    ? 'bg-amber-500/20 border-amber-500 shadow-lg ring-2 ring-amber-400/50 scale-105'
                    : isPassed
                    ? 'bg-slate-950/50 border-slate-800 opacity-70'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-400">
                  <span>Day {item.day}</span>
                  {isPassed && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  {isToday && <span className="text-amber-400 font-black">TODAY</span>}
                </div>

                <div className="text-2xl my-1">{item.icon}</div>

                <div className="text-[11px] font-bold text-white leading-tight">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Claim Button */}
        {claimedToday ? (
          <div className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-center text-xs flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Day {currentDay} Reward Claimed! Come back tomorrow for Day {currentDay + 1}!
          </div>
        ) : (
          <button
            onClick={handleClaim}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-current" /> Claim Day {currentDay} Reward
          </button>
        )}
      </div>
    </div>
  );
};
