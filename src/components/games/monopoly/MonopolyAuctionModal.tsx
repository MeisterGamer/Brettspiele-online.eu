import React, { useState, useEffect } from 'react';
import { BoardSpace, PROPERTY_GROUP_COLORS } from './monopolyData';
import { MonopolyPlayerState } from './MonopolyTradeModal';
import { Gavel, DollarSign, CheckCircle2, UserCheck } from 'lucide-react';
import { sound } from '../../../services/sound';

interface MonopolyAuctionModalProps {
  space: BoardSpace;
  players: MonopolyPlayerState[];
  currentUserId: string;
  isHost: boolean;
  onBid: (bidderId: string, amount: number) => void;
  onPass: (bidderId: string) => void;
  onAuctionEnd: (winnerId: string, finalAmount: number) => void;
}

export const MonopolyAuctionModal: React.FC<MonopolyAuctionModalProps> = ({
  space,
  players,
  currentUserId,
  isHost,
  onBid,
  onPass,
  onAuctionEnd,
}) => {
  const [currentBid, setCurrentBid] = useState<number>(10);
  const [highestBidderId, setHighestBidderId] = useState<string | null>(null);
  const [passedPlayerIds, setPassedPlayerIds] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(15);

  const activeBidders = players.filter(p => !p.isBankrupt && !passedPlayerIds.includes(p.id));
  const highestBidder = players.find(p => p.id === highestBidderId);
  const myPlayer = players.find(p => p.id === currentUserId);
  const hasPassed = passedPlayerIds.includes(currentUserId);
  const groupInfo = space.group ? PROPERTY_GROUP_COLORS[space.group] : null;

  // Countdown timer for tension
  useEffect(() => {
    if (activeBidders.length <= 1 && highestBidderId) {
      // Auction won!
      onAuctionEnd(highestBidderId, currentBid);
      return;
    }

    if (activeBidders.length === 0) {
      // Nobody bid
      onAuctionEnd('', 0);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto end
          if (highestBidderId) {
            onAuctionEnd(highestBidderId, currentBid);
          } else {
            onAuctionEnd('', 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, activeBidders.length, highestBidderId, currentBid, onAuctionEnd]);

  // Host simulates AI bot bids with smart probability
  useEffect(() => {
    if (!isHost) return;

    const aiBidders = activeBidders.filter(p => p.isAi);
    if (aiBidders.length === 0) return;

    const timeout = setTimeout(() => {
      const randomAi = aiBidders[Math.floor(Math.random() * aiBidders.length)];
      if (!randomAi) return;

      const maxAiWillPay = Math.min(randomAi.money, (space.price || 100) * 0.95);
      if (currentBid + 20 <= maxAiWillPay && Math.random() > 0.4) {
        // AI raises bid
        const newBid = currentBid + 10;
        sound.playChip();
        setCurrentBid(newBid);
        setHighestBidderId(randomAi.id);
        setTimeLeft(12);
        onBid(randomAi.id, newBid);
      } else {
        // AI passes
        setPassedPlayerIds(prev => [...prev, randomAi.id]);
        onPass(randomAi.id);
      }
    }, 2200);

    return () => clearTimeout(timeout);
  }, [isHost, activeBidders, currentBid, space.price, highestBidderId, onBid, onPass]);

  const handleUserBid = (increment: number) => {
    if (!myPlayer || hasPassed) return;
    const newBid = currentBid + increment;
    if (newBid > myPlayer.money) {
      sound.playError();
      return;
    }
    sound.playChip();
    setCurrentBid(newBid);
    setHighestBidderId(myPlayer.id);
    setTimeLeft(14);
    onBid(myPlayer.id, newBid);
  };

  const handleUserPass = () => {
    sound.playClick();
    setPassedPlayerIds(prev => [...prev, currentUserId]);
    onPass(currentUserId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl text-white text-center">
        {/* Top Auction Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs uppercase tracking-widest mb-3">
          <Gavel className="w-3.5 h-3.5" />
          <span>Öffentliche Bank-Auktion</span>
        </div>

        {/* Property Card Header */}
        <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 shadow-lg mb-4">
          {groupInfo ? (
            <div 
              className="py-2.5 px-4 font-black text-sm uppercase tracking-wider drop-shadow-sm"
              style={{ backgroundColor: groupInfo.bg, color: groupInfo.text }}
            >
              {space.name}
            </div>
          ) : (
            <div className="py-2.5 px-4 font-black text-sm bg-slate-700 text-white">
              {space.icon} {space.name}
            </div>
          )}
          <div className="p-3 text-xs text-slate-300 flex justify-between items-center bg-slate-850">
            <span>Regulärer Bankpreis:</span>
            <span className="font-bold text-amber-400 font-mono">{space.price} €</span>
          </div>
        </div>

        {/* Current Bid Display */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-amber-500/30 mb-4">
          <div className="text-xs text-slate-400 font-semibold mb-1">Höchstgebot aktuell:</div>
          <div className="text-3xl font-black font-display text-amber-300 drop-shadow flex items-center justify-center gap-1">
            <span>{currentBid} €</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-center gap-1.5 text-slate-300">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Höchstbietender:</span>
            <span className="font-bold text-white">
              {highestBidder ? highestBidder.name : 'Noch kein Gebot'}
            </span>
          </div>
          {/* Timer progress bar */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-mono text-amber-400">
            <span>Zuschlag in: {timeLeft}s</span>
          </div>
        </div>

        {/* User Bidding Actions */}
        {!hasPassed && myPlayer ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleUserBid(10)}
                disabled={currentBid + 10 > myPlayer.money}
                className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-black text-xs transition shadow"
              >
                +10 €
              </button>
              <button
                onClick={() => handleUserBid(25)}
                disabled={currentBid + 25 > myPlayer.money}
                className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-black text-xs transition shadow"
              >
                +25 €
              </button>
              <button
                onClick={() => handleUserBid(50)}
                disabled={currentBid + 50 > myPlayer.money}
                className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-black text-xs transition shadow"
              >
                +50 €
              </button>
            </div>

            <button
              onClick={handleUserPass}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs transition border border-slate-700"
            >
              Aussteigen / Passen
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-800/60 text-slate-400 text-xs italic">
            Du bist aus dieser Versteigerung ausgestiegen.
          </div>
        )}
      </div>
    </div>
  );
};
