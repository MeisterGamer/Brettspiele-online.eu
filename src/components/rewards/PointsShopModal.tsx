import React, { useState } from 'react';
import { UserProfile, ShopItem, PlayerQuest } from '../../types';
import { sound } from '../../services/sound';
import confetti from '../../services/confetti';
import { 
  SHOP_ITEMS, 
  INITIAL_PLAYER_QUESTS, 
  getPlayerRankTitle, 
  getXpForNextLevel 
} from '../../services/vipPointsService';
import { 
  Coins, 
  Sparkles, 
  Check, 
  X, 
  Trophy, 
  ShoppingBag, 
  Flame, 
  Award, 
  Layers, 
  Clock, 
  Gift, 
  Lock,
  ArrowRight,
  Shield,
  HelpCircle
} from 'lucide-react';

interface PointsShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onOpenVipModal?: () => void;
}

export const PointsShopModal: React.FC<PointsShopModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onOpenVipModal,
}) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'quests' | 'levels' | 'history'>('shop');
  const [shopCategory, setShopCategory] = useState<'all' | 'table' | 'cards' | 'avatar' | 'booster'>('all');
  const [purchasedSuccess, setPurchasedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const quests: PlayerQuest[] = currentUser.quests && currentUser.quests.length > 0
    ? currentUser.quests
    : INITIAL_PLAYER_QUESTS;

  const unlockedItems = currentUser.unlockedItems || [];
  const rank = getPlayerRankTitle(currentUser.level);
  const nextLevelXp = getXpForNextLevel(currentUser.level);
  const xpProgress = Math.min(100, Math.round((currentUser.xp / nextLevelXp) * 100));

  // Handle purchasing shop item
  const handlePurchase = (item: ShopItem) => {
    if (unlockedItems.includes(item.id)) return;

    const canAffordCoins = currentUser.coins >= item.costCoins;
    const canAffordGems = currentUser.gems >= item.costGems;

    if (!canAffordCoins && !canAffordGems) {
      sound.playClick();
      return;
    }

    sound.playReward();
    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch (e) {}

    const newCoins = Math.max(0, currentUser.coins - item.costCoins);
    const newGems = Math.max(0, currentUser.gems - item.costGems);

    const updated: UserProfile = {
      ...currentUser,
      coins: newCoins,
      gems: newGems,
      unlockedItems: [...unlockedItems, item.id],
      transactions: [
        {
          id: `tx_${Date.now()}`,
          type: 'spend',
          amount: item.costCoins || item.costGems,
          currency: item.costCoins > 0 ? 'coins' : 'gems',
          title: `Gekauft: ${item.name}`,
          category: 'shop',
          timestamp: 'Gerade eben'
        },
        ...(currentUser.transactions || [])
      ]
    };

    onUpdateUser(updated);
    setPurchasedSuccess(item.name);
    setTimeout(() => setPurchasedSuccess(null), 3000);
  };

  // Handle claiming quest reward
  const handleClaimQuest = (questId: string) => {
    const q = quests.find((quest) => quest.id === questId);
    if (!q || q.isClaimed || q.progress < q.target) return;

    sound.playReward();
    try {
      confetti({ particleCount: 80, spread: 60 });
    } catch (e) {}

    const addedCoins = q.rewardCoins;
    const addedXp = q.rewardXp;
    const addedGems = q.rewardGems || 0;

    const updatedQuests = quests.map((quest) =>
      quest.id === questId ? { ...quest, isClaimed: true } : quest
    );

    // Check level up
    let newLevel = currentUser.level;
    let newXp = currentUser.xp + addedXp;
    while (newXp >= getXpForNextLevel(newLevel)) {
      newXp -= getXpForNextLevel(newLevel);
      newLevel += 1;
    }

    const updated: UserProfile = {
      ...currentUser,
      coins: currentUser.coins + addedCoins,
      gems: currentUser.gems + addedGems,
      xp: newXp,
      level: newLevel,
      quests: updatedQuests,
      transactions: [
        {
          id: `tx_${Date.now()}`,
          type: 'earn',
          amount: addedCoins,
          currency: 'coins',
          title: `Quest abgeschlossen: ${q.title}`,
          category: 'quest',
          timestamp: 'Gerade eben'
        },
        ...(currentUser.transactions || [])
      ]
    };

    onUpdateUser(updated);
  };

  // Filtered Shop Items
  const filteredShopItems = SHOP_ITEMS.filter((item) => {
    if (shopCategory === 'all') return true;
    return item.category === shopCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 relative overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header & User Wallet Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black font-display text-white">Punkte- & Belohnungs-Center</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {rank.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Verdiene Münzen durch Siege & Quests – schalte exklusive Tische, Karten und Booster frei
              </p>
            </div>
          </div>

          {/* User Currency Badges & Close Button */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Coins */}
            <div className="bg-slate-950/80 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold text-amber-300 font-mono shadow-sm">
              <Coins className="w-4 h-4 fill-current text-amber-400" />
              <span>{currentUser.coins.toLocaleString()}</span>
            </div>

            {/* Gems */}
            <div className="bg-slate-950/80 border border-sky-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold text-sky-300 font-mono shadow-sm">
              <span className="text-sm">💎</span>
              <span>{currentUser.gems.toLocaleString()}</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Level XP Progress strip */}
        <div className="bg-slate-950/50 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-bold text-white">{rank.title}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">Level {currentUser.level}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-slate-400 font-mono text-[11px]">
              {currentUser.xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP ({xpProgress}%)
            </span>
            <div className="w-28 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-4 sm:px-6 bg-slate-950/40 shrink-0 overflow-x-auto scrollbar-none">
          {[
            { id: 'shop', label: 'Belohnungs-Shop', icon: ShoppingBag },
            { id: 'quests', label: 'Tägliche & Wöchentliche Quests', icon: Trophy },
            { id: 'levels', label: 'Level-Aufstiege & Ränge', icon: Award },
            { id: 'history', label: 'Kontoauszug & Verlauf', icon: Clock },
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

        {/* Feedback alert */}
        {purchasedSuccess && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs py-2 px-6 flex items-center gap-2 shrink-0 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Erfolgreich freigeschaltet: <strong>{purchasedSuccess}</strong>! Steht jetzt an deinen Tischen bereit.</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: BELOHNUNGS-SHOP */}
          {activeTab === 'shop' && (
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'Alle Artikel' },
                  { id: 'table', label: 'Tisch-Themen' },
                  { id: 'cards', label: 'Karten & Steine' },
                  { id: 'avatar', label: 'Avatar & Flairs' },
                  { id: 'booster', label: 'Power-Ups & Booster' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      sound.playClick();
                      setShopCategory(cat.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      shopCategory === cat.id
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredShopItems.map((item) => {
                  const isOwned = unlockedItems.includes(item.id);
                  const canAffordCoins = currentUser.coins >= item.costCoins;
                  const isVipLocked = item.vipRequiredTier && (!currentUser.vipTier || currentUser.vipTier < item.vipRequiredTier);

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl p-4 border flex flex-col justify-between transition-all ${
                        isOwned
                          ? 'bg-slate-800/40 border-slate-700/60 opacity-90'
                          : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40 hover:shadow-lg'
                      }`}
                    >
                      <div>
                        {/* Header icon & badge */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-3xl p-2 rounded-xl bg-slate-950 border border-slate-800 inline-block shadow">
                            {item.icon}
                          </span>

                          <div className="text-right">
                            {item.rarity === 'legendary' && (
                              <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                                Legendär
                              </span>
                            )}
                            {item.rarity === 'epic' && (
                              <span className="text-[10px] uppercase font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/40">
                                Episch
                              </span>
                            )}
                            {item.rarity === 'rare' && (
                              <span className="text-[10px] uppercase font-bold text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded border border-sky-500/40">
                                Selten
                              </span>
                            )}
                            {item.rarity === 'common' && (
                              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                Klassik
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Desc */}
                        <h4 className="font-bold text-sm text-white mb-1">{item.name}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                          {item.description}
                        </p>
                      </div>

                      {/* Footer Buy action */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                          {item.costCoins > 0 && (
                            <span className="text-amber-400 flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 fill-current" />
                              {item.costCoins.toLocaleString()}
                            </span>
                          )}
                          {item.costGems > 0 && (
                            <span className="text-sky-400 flex items-center gap-0.5">
                              💎 {item.costGems}
                            </span>
                          )}
                        </div>

                        {isOwned ? (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Gekauft
                          </span>
                        ) : isVipLocked ? (
                          <button
                            onClick={() => {
                              onClose();
                              if (onOpenVipModal) onOpenVipModal();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Lock className="w-3 h-3" /> VIP {item.vipRequiredTier} nötig
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePurchase(item)}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow transition active:scale-95 cursor-pointer"
                          >
                            Freischalten
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: QUESTS & HERAUSFORDERUNGEN */}
          {activeTab === 'quests' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {quests.map((q) => {
                  const isReady = q.progress >= q.target;
                  const progressPct = Math.min(100, Math.round((q.progress / q.target) * 100));

                  return (
                    <div
                      key={q.id}
                      className={`rounded-2xl p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                        q.isClaimed
                          ? 'bg-slate-900/40 border-slate-800 opacity-70'
                          : isReady
                          ? 'bg-slate-800/80 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                          {q.icon}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-white">{q.title}</span>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              q.category === 'daily' ? 'bg-amber-500/20 text-amber-300' : 'bg-purple-500/20 text-purple-300'
                            }`}>
                              {q.category === 'daily' ? 'Täglich' : 'Wöchentlich'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{q.description}</p>

                          {/* Quest Progress bar */}
                          <div className="flex items-center gap-2.5 mt-2">
                            <div className="w-32 sm:w-44 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${isReady ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono text-slate-400">
                              {q.progress} / {q.target}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quest Rewards & Claim */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right text-xs">
                          <div className="text-amber-400 font-bold font-mono">+{q.rewardCoins} 🪙</div>
                          <div className="text-slate-400 font-mono text-[10px]">+{q.rewardXp} XP</div>
                        </div>

                        {q.isClaimed ? (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 px-3 py-1.5">
                            <Check className="w-4 h-4" /> Abgeholt
                          </span>
                        ) : isReady ? (
                          <button
                            onClick={() => handleClaimQuest(q.id)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                          >
                            Belohnung holen
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 px-3 py-1.5 border border-slate-800 rounded-xl">
                            In Arbeit
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: LEVEL-AUFSTIEGE & RÄNGE */}
          {activeTab === 'levels' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
                <h3 className="font-bold text-base text-white mb-1">Ränge & Belohnungen (Stufen 1–50)</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Mit jedem erreichten Level erhältst du automatisch <strong>+500 Münzen</strong> und <strong>+10 Edelsteine</strong>, sowie neue prestigeträchtige Spielertitel für deinen Avatar!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    { lvl: 1, title: 'Neu am Tisch (Lehrling)', reward: '500 Münzen Willkommensbonus' },
                    { lvl: 5, title: 'Spiele-Geselle', reward: '+1.000 Bonusmünzen & Bronze-Wappen' },
                    { lvl: 10, title: 'Erfahrener Spieler', reward: '+2.000 Münzen & 20 Edelsteine' },
                    { lvl: 20, title: 'Turnier-Veteran', reward: '+5.000 Münzen & Silberner Stern' },
                    { lvl: 30, title: 'Meister-Stratege', reward: '+10.000 Münzen & Goldene Krone' },
                    { lvl: 40, title: 'Großmeister der Spiele', reward: '+20.000 Münzen & Platin-Halo' },
                    { lvl: 50, title: 'Unsterbliche Legende', reward: '+50.000 Münzen & Royal Diamant Status' },
                  ].map((tier, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        currentUser.level >= tier.lvl 
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' 
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-white block">Stufe {tier.lvl}: {tier.title}</span>
                        <span className="text-[11px] text-slate-400">{tier.reward}</span>
                      </div>
                      {currentUser.level >= tier.lvl && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KONTOAUSZUG & VERLAUF */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Vergangene Münz-Transaktionen</h4>
              {currentUser.transactions && currentUser.transactions.length > 0 ? (
                <div className="space-y-2">
                  {currentUser.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white block">{tx.title}</span>
                        <span className="text-[10px] text-slate-500">{tx.timestamp} · {tx.category}</span>
                      </div>

                      <div className={`font-mono font-bold ${tx.type === 'earn' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'earn' ? '+' : '-'}{tx.amount.toLocaleString()} {tx.currency === 'coins' ? '🪙' : '💎'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Noch keine Transaktionen verzeichnet. Spiele eine Runde oder schließe Quests ab!
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
