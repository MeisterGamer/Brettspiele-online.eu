import React, { useState } from 'react';
import { UserProfile, VipTierInfo } from '../../types';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { 
  VIP_TIERS, 
  VIP_SEASON_MILESTONES 
} from '../../services/vipPointsService';
import { 
  Crown, 
  Sparkles, 
  Check, 
  Zap, 
  Shield, 
  Flame, 
  X, 
  Star, 
  Gift, 
  ChevronRight, 
  Coins, 
  Lock, 
  Award, 
  Layers,
  ArrowRight,
  Clock
} from 'lucide-react';

interface VipModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser?: (updated: UserProfile) => void;
  onUpgradeVip?: () => void;
  onOpenShop?: () => void;
}

export const VipModal: React.FC<VipModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onUpgradeVip,
  onOpenShop,
}) => {
  const [activeTab, setActiveTab] = useState<'tiers' | 'pass' | 'daily' | 'perks'>('tiers');
  const [chestOpened, setChestOpened] = useState<boolean>(false);
  const [chestReward, setChestReward] = useState<{ coins: number; gems: number } | null>(null);

  if (!isOpen) return null;

  const currentTierLevel = currentUser.vipTier ?? (currentUser.isVip ? 3 : 0);
  const currentTierInfo = VIP_TIERS.find((t) => t.tier === currentTierLevel) || null;
  const currentSeasonXp = currentUser.vipSeasonXp ?? currentUser.xp;
  const claimedMilestones = currentUser.claimedSeasonRewards ?? [];

  // Check if daily VIP chest can be claimed today
  const todayStr = new Date().toISOString().split('T')[0];
  const canClaimDailyChest = currentTierLevel > 0 && currentUser.lastVipDailyClaim !== todayStr;

  // Handle tier upgrade
  const handleUpgradeTier = (tier: VipTierInfo) => {
    // If user has enough coins or gems, or free upgrade
    const canAffordCoins = currentUser.coins >= tier.costCoins;
    const canAffordGems = currentUser.gems >= tier.costGems;

    if (tier.tier <= currentTierLevel) {
      // Already at or above this tier
      return;
    }

    // Deduct coins if affordable, otherwise activate test / instant upgrade
    const deductCoins = canAffordCoins ? tier.costCoins : 0;
    const newCoins = Math.max(0, currentUser.coins - deductCoins + tier.dailyBonusCoins);
    const newGems = currentUser.gems + tier.dailyBonusGems;

    sound.playReward();
    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}

    const updatedUser: UserProfile = {
      ...currentUser,
      isVip: true,
      vipTier: tier.tier,
      coins: newCoins,
      gems: newGems,
      avatar: {
        ...currentUser.avatar,
        flair: tier.tier >= 4 ? 'diamond' : tier.tier >= 3 ? 'gold-vip' : 'neon'
      },
      unlockedItems: [
        ...(currentUser.unlockedItems || []),
        tier.tier >= 2 ? 'table-mahogany' : '',
        tier.tier >= 3 ? 'cardback-dragon-gold' : '',
        tier.tier >= 4 ? 'mahjong-dragon-tiles' : ''
      ].filter(Boolean) as string[],
      transactions: [
        {
          id: `tx_${Date.now()}`,
          type: 'spend',
          amount: deductCoins,
          currency: 'coins',
          title: `Upgrade zu ${tier.name}`,
          category: 'vip',
          timestamp: 'Gerade eben'
        },
        ...(currentUser.transactions || [])
      ]
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    } else if (onUpgradeVip) {
      onUpgradeVip();
    }
  };

  // Claim VIP Daily Chest
  const handleClaimVipChest = () => {
    if (!canClaimDailyChest || !currentTierInfo) return;

    sound.playReward();
    try {
      confetti({ particleCount: 100, spread: 70 });
    } catch (e) {}

    const coinsWon = currentTierInfo.dailyBonusCoins;
    const gemsWon = currentTierInfo.dailyBonusGems;

    setChestReward({ coins: coinsWon, gems: gemsWon });
    setChestOpened(true);

    const updatedUser: UserProfile = {
      ...currentUser,
      coins: currentUser.coins + coinsWon,
      gems: currentUser.gems + gemsWon,
      lastVipDailyClaim: todayStr,
      transactions: [
        {
          id: `tx_${Date.now()}`,
          type: 'earn',
          amount: coinsWon,
          currency: 'coins',
          title: `VIP-Tagestruhe (${currentTierInfo.badge})`,
          category: 'vip',
          timestamp: 'Gerade eben'
        },
        ...(currentUser.transactions || [])
      ]
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
  };

  // Claim Season Pass milestone
  const handleClaimMilestone = (milestone: number, isVipReward: boolean) => {
    const ms = VIP_SEASON_MILESTONES.find((m) => m.level === milestone);
    if (!ms) return;
    if (claimedMilestones.includes(milestone)) return;
    if (currentSeasonXp < ms.requiredXp) return;

    sound.playReward();
    try {
      confetti({ particleCount: 80, spread: 60 });
    } catch (e) {}

    const reward = isVipReward && currentTierLevel > 0 ? ms.vipReward : ms.freeReward;
    let addedCoins = 0;
    let addedGems = 0;
    const newItems = [...(currentUser.unlockedItems || [])];

    if (reward.type === 'coins') addedCoins = reward.amount;
    if (reward.type === 'gems') addedGems = reward.amount;
    if (reward.itemId && !newItems.includes(reward.itemId)) {
      newItems.push(reward.itemId);
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      coins: currentUser.coins + addedCoins,
      gems: currentUser.gems + addedGems,
      unlockedItems: newItems,
      claimedSeasonRewards: [...claimedMilestones, milestone],
      transactions: [
        {
          id: `tx_${Date.now()}`,
          type: 'earn',
          amount: addedCoins || addedGems,
          currency: addedCoins ? 'coins' : 'gems',
          title: `Saisonpass Stufe ${milestone}: ${reward.label}`,
          category: 'vip',
          timestamp: 'Gerade eben'
        },
        ...(currentUser.transactions || [])
      ]
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 relative overflow-hidden">
        
        {/* Golden ambient lighting */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
              <Crown className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black font-display text-white">VIP Club & Saisonpass</h2>
                {currentTierInfo ? (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {currentTierInfo.badge}
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    Kostenlos
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multiplikatoren, exklusive Spieltische, Kartenrücken und tägliche Bonustruhen
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-4 sm:px-6 bg-slate-950/40 shrink-0 overflow-x-auto scrollbar-none">
          {[
            { id: 'tiers', label: 'VIP-Stufen & Pässe', icon: Crown },
            { id: 'pass', label: 'Saisonpass (Stufen 1–15)', icon: Award },
            { id: 'daily', label: 'Tägliche VIP-Truhe', icon: Gift },
            { id: 'perks', label: 'Aktive Vorteile', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`py-3 px-3 sm:px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: VIP TIERS & PASSES */}
          {activeTab === 'tiers' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {VIP_TIERS.map((tier) => {
                  const isCurrent = currentTierLevel === tier.tier;
                  const isHigher = tier.tier > currentTierLevel;
                  const isUnlocked = currentTierLevel >= tier.tier;

                  return (
                    <div
                      key={tier.tier}
                      className={`relative rounded-2xl p-4 sm:p-5 flex flex-col justify-between border transition-all ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500/70 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                          : isUnlocked
                          ? 'bg-slate-800/40 border-slate-700/60'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        {/* Tier Title & Multiplier */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span 
                              className="text-[11px] font-bold px-2 py-0.5 rounded-md inline-block uppercase tracking-wider mb-1"
                              style={{ backgroundColor: `${tier.color}25`, color: tier.color }}
                            >
                              {tier.badge}
                            </span>
                            <h3 className="text-base font-bold text-white">{tier.name}</h3>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-black text-amber-300 font-mono">
                              {tier.multiplier}x
                            </span>
                            <div className="text-[10px] text-slate-400">Münzen & XP</div>
                          </div>
                        </div>

                        {/* Perks */}
                        <ul className="space-y-1.5 my-3 text-xs text-slate-300">
                          {tier.perks.map((p, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Upgrade Action */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                        <div className="text-xs">
                          <span className="text-slate-400">Täglich: </span>
                          <strong className="text-amber-400 font-mono">+{tier.dailyBonusCoins.toLocaleString()}</strong>
                          <span className="text-slate-400"> Münzen</span>
                        </div>

                        {isCurrent ? (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-4 h-4" /> Dein aktiver Pass
                          </span>
                        ) : isUnlocked ? (
                          <span className="text-xs text-slate-400 font-medium">Bereits erreicht</span>
                        ) : (
                          <button
                            onClick={() => handleUpgradeTier(tier)}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Crown className="w-3.5 h-3.5 fill-current" />
                            <span>Upgrade ({tier.costCoins.toLocaleString()} 🪙)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: VIP SAISONPASS & MILESTONES */}
          {activeTab === 'pass' && (
            <div className="space-y-4">
              {/* Season Pass Header Banner */}
              <div className="bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Saison 1: Aufstieg der Meister (2026)</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Sammle XP durch Partien & schalte Belohnungen frei</h3>
                  <p className="text-xs text-slate-300">
                    Aktuelle Saison-XP: <strong className="text-amber-400 font-mono">{currentSeasonXp.toLocaleString()} XP</strong>
                  </p>
                </div>

                <div className="text-center sm:text-right shrink-0">
                  <span className="text-xs text-slate-400 block mb-1">Pass-Status</span>
                  {currentTierLevel > 0 ? (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black inline-flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 fill-current" /> VIP-Spur Aktiv
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveTab('tiers')}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow transition cursor-pointer"
                    >
                      VIP Pass freischalten
                    </button>
                  )}
                </div>
              </div>

              {/* Milestones Track List */}
              <div className="space-y-3">
                {VIP_SEASON_MILESTONES.map((ms) => {
                  const isReached = currentSeasonXp >= ms.requiredXp;
                  const isClaimed = claimedMilestones.includes(ms.level);
                  const progressPct = Math.min(100, Math.round((currentSeasonXp / ms.requiredXp) * 100));

                  return (
                    <div
                      key={ms.level}
                      className={`rounded-2xl p-3 sm:p-4 border transition-all ${
                        isClaimed
                          ? 'bg-slate-900/40 border-slate-800 opacity-80'
                          : isReached
                          ? 'bg-slate-800/80 border-amber-500/60 shadow-md ring-1 ring-amber-500/20'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {/* Level Indicator */}
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                            isReached 
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-mono shadow' 
                              : 'bg-slate-800 text-slate-400 border-slate-700 font-mono'
                          }`}>
                            {ms.level}
                          </div>

                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>Stufe {ms.level}</span>
                              <span className="text-slate-400 font-mono text-[11px] font-normal">
                                ({ms.requiredXp.toLocaleString()} XP)
                              </span>
                            </div>

                            {/* Progress bar to milestone */}
                            {!isReached && (
                              <div className="w-32 sm:w-44 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5 border border-slate-700">
                                <div 
                                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Free & VIP Rewards Display */}
                        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          {/* Free Reward */}
                          <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs flex items-center gap-2">
                            <span className="text-base">{ms.freeReward.icon}</span>
                            <div>
                              <span className="text-[10px] text-slate-400 block leading-tight">Kostenlos</span>
                              <span className="font-semibold text-slate-200">{ms.freeReward.label}</span>
                            </div>
                          </div>

                          {/* VIP Reward */}
                          <div className={`rounded-xl px-2.5 py-1.5 text-xs flex items-center gap-2 border ${
                            currentTierLevel > 0 
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' 
                              : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                          }`}>
                            <span className="text-base">{ms.vipReward.icon}</span>
                            <div>
                              <span className="text-[10px] text-amber-400 font-bold block leading-tight flex items-center gap-1">
                                <Crown className="w-2.5 h-2.5 fill-current" /> VIP Exklusiv
                              </span>
                              <span className="font-bold text-white">{ms.vipReward.label}</span>
                            </div>
                          </div>

                          {/* Claim Action */}
                          <div>
                            {isClaimed ? (
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 px-3 py-1.5">
                                <Check className="w-4 h-4" /> Eingelöst
                              </span>
                            ) : isReached ? (
                              <button
                                onClick={() => handleClaimMilestone(ms.level, currentTierLevel > 0)}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                              >
                                Abholen
                              </button>
                            ) : (
                              <div className="text-slate-500 flex items-center gap-1 text-xs px-2 py-1">
                                <Lock className="w-3.5 h-3.5" /> Gesperrt
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: DAILY VIP CHEST */}
          {activeTab === 'daily' && (
            <div className="space-y-6 text-center max-w-md mx-auto py-4">
              <div className="space-y-2">
                <h3 className="text-xl font-black font-display text-white">Tägliche VIP-Schatztruhe</h3>
                <p className="text-xs text-slate-300">
                  Jeden Tag schüttet der VIP-Club königliche Münzen und seltene Edelsteine an aktive Mitglieder aus!
                </p>
              </div>

              {/* Big Animated Chest Box */}
              <div className="relative py-6">
                <div className="w-36 h-36 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-6xl shadow-2xl shadow-amber-500/30 mx-auto border-4 border-amber-300 animate-bounce duration-1000">
                  {chestOpened ? '🎉' : '🎁'}
                </div>

                {chestReward && (
                  <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/50 rounded-2xl text-center space-y-1 animate-in zoom-in duration-300">
                    <div className="text-xs font-bold text-amber-300">Belohnung erhalten!</div>
                    <div className="text-lg font-black text-white flex items-center justify-center gap-4">
                      <span className="flex items-center gap-1 text-amber-400 font-mono">
                        <Coins className="w-5 h-5 fill-current" /> +{chestReward.coins.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-sky-400 font-mono">
                        💎 +{chestReward.gems}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status and Claim button */}
              {currentTierLevel === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <p className="text-xs text-slate-400">
                    Du benötigst einen aktiven VIP-Pass (Bronze, Silber, Gold, Platin oder Diamant), um die tägliche VIP-Truhe zu plündern.
                  </p>
                  <button
                    onClick={() => setActiveTab('tiers')}
                    className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    VIP Pass aktivieren
                  </button>
                </div>
              ) : canClaimDailyChest ? (
                <button
                  onClick={handleClaimVipChest}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Gift className="w-5 h-5 fill-current" /> Tägliche VIP-Truhe öffnen
                </button>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-1 text-center">
                  <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" /> Heute bereits abgeholt
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Komm morgen wieder für die nächste Belohnung!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACTIVE PERKS & COSMETICS */}
          {activeTab === 'perks' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[11px] text-slate-400 block">Dein Multiplikator</span>
                  <span className="text-2xl font-black font-mono text-amber-300">
                    {currentTierInfo?.multiplier ?? 1.0}x
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Auf alle Spielsiege & Quests</span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[11px] text-slate-400 block">Täglicher Bonus</span>
                  <span className="text-2xl font-black font-mono text-sky-300">
                    +{currentTierInfo?.dailyBonusCoins.toLocaleString() ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Münzen pro Tag</span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[11px] text-slate-400 block">VIP-Rang</span>
                  <span className="text-base font-bold text-white block mt-1">
                    {currentTierInfo?.name ?? 'Standard Spieler'}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Familien-Arcade</span>
                </div>
              </div>

              {/* Unlocked Cosmetics quick launch */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">Freigeschaltete VIP-Kosmetika</h4>
                    <p className="text-xs text-slate-400">Verwalte deine Tisch-Designs, Kartenrücken und Flairs</p>
                  </div>

                  {onOpenShop && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenShop();
                      }}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Zum Belohnungs-Shop</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center space-y-1">
                    <span className="text-2xl">🪵</span>
                    <span className="text-xs font-bold text-white block">Mahagoni Tisch</span>
                    <span className="text-[10px] text-emerald-400">Aktiviert</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center space-y-1">
                    <span className="text-2xl">👑</span>
                    <span className="text-xs font-bold text-white block">Gold-Krone Flair</span>
                    <span className="text-[10px] text-emerald-400">Aktiviert</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center space-y-1">
                    <span className="text-2xl">🐉</span>
                    <span className="text-xs font-bold text-white block">Gold-Drachen Karten</span>
                    <span className="text-[10px] text-slate-400">Verfügbar</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center space-y-1">
                    <span className="text-2xl">🀄</span>
                    <span className="text-xs font-bold text-white block">Elfenbein Mahjong</span>
                    <span className="text-[10px] text-slate-400">Verfügbar</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
