import React from 'react';
import { UserProfile } from '../../types';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { Crown, Sparkles, Check, Zap, Shield, Flame, X, Star } from 'lucide-react';

interface VipModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpgradeVip: () => void;
}

export const VipModal: React.FC<VipModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpgradeVip,
}) => {
  if (!isOpen) return null;

  const handleSubscribe = () => {
    sound.playReward();
    onUpgradeVip();
    try {
      confetti({ particleCount: 100, spread: 80 });
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-slate-100 relative overflow-hidden">
        
        {/* Golden background light flare */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30">
            <Crown className="w-8 h-8 fill-current" />
          </div>
          <h2 className="text-2xl font-bold font-display text-white">VIP Family Gold Pass</h2>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            Supercharge your household game nights with double rewards, exclusive royal flairs, and priority tournament seating.
          </p>
        </div>

        {/* Benefits list */}
        <div className="space-y-3 mb-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          {[
            { title: '2x XP & Coin Multiplier', desc: 'Double match victory rewards for every member of your clan', icon: Zap },
            { title: 'Exclusive Avatar Flairs & Royal Crown', desc: 'Unlock Gold Crown, Neon Cyber, Diamond Halo & Rainbow frames', icon: Sparkles },
            { title: 'Ad-Free Pure Family Fun', desc: 'Uninterrupted classic board game sessions forever', icon: Shield },
            { title: 'Priority Tournament Brackets', desc: 'Guaranteed seeds in monthly family championship cups', icon: Flame },
            { title: 'Custom Table Themes & Cardbacks', desc: 'Mahogany wood tables and golden foil card backs', icon: Star },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">{item.title}</h4>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action / Status */}
        {currentUser.isVip ? (
          <div className="text-center py-2 space-y-1">
            <div className="text-sm font-bold text-amber-400 flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" /> Active VIP Household Membership
            </div>
            <p className="text-xs text-slate-400">All VIP perks and flairs are active across your family profiles.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleSubscribe}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/25 transition flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 fill-current" /> Activate VIP Family Pass (Instant)
            </button>
            <p className="text-center text-[10px] text-slate-400">
              Simulated interactive membership for testing all premium features.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
