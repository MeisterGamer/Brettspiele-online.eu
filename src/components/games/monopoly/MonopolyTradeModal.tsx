import React, { useState } from 'react';
import { BoardSpace, BOARD_SPACES, PROPERTY_GROUP_COLORS } from './monopolyData';
import { X, ArrowRightLeft, Check, Ban, DollarSign } from 'lucide-react';
import { sound } from '../../../services/sound';

export interface MonopolyPlayerState {
  id: string;
  name: string;
  color: string;
  figure: string;
  money: number;
  position: number;
  properties: number[];
  houses: Record<number, number>;
  mortgaged: number[];
  inJail: boolean;
  jailTurns: number;
  jailFreeCards: number;
  isBankrupt: boolean;
  isAi: boolean;
}

export interface TradeOffer {
  fromPlayerId: string;
  toPlayerId: string;
  offerProperties: number[];
  offerMoney: number;
  requestProperties: number[];
  requestMoney: number;
}

interface MonopolyTradeModalProps {
  currentUser: MonopolyPlayerState;
  players: MonopolyPlayerState[];
  incomingOffer: TradeOffer | null;
  onSendOffer: (offer: TradeOffer) => void;
  onAcceptOffer: () => void;
  onRejectOffer: () => void;
  onClose: () => void;
}

export const MonopolyTradeModal: React.FC<MonopolyTradeModalProps> = ({
  currentUser,
  players,
  incomingOffer,
  onSendOffer,
  onAcceptOffer,
  onRejectOffer,
  onClose,
}) => {
  // Potential trade partners
  const tradePartners = players.filter(p => p.id !== currentUser.id && !p.isBankrupt);

  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(
    tradePartners[0]?.id || ''
  );
  const [offerProps, setOfferProps] = useState<number[]>([]);
  const [offerCash, setOfferCash] = useState<number>(0);
  const [requestProps, setRequestProps] = useState<number[]>([]);
  const [requestCash, setRequestCash] = useState<number>(0);

  const selectedPartner = players.find(p => p.id === selectedPartnerId);

  // If there is an active incoming trade offer for the current user
  if (incomingOffer && incomingOffer.toPlayerId === currentUser.id) {
    const sender = players.find(p => p.id === incomingOffer.fromPlayerId);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl text-white">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-white">Handelsangebot erhalten!</h3>
                <p className="text-xs text-slate-400">
                  <span className="text-amber-400 font-bold">{sender?.name || 'Ein Mitspieler'}</span> bietet dir einen Handel an
                </p>
              </div>
            </div>
            <button onClick={onRejectOffer} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4">
            {/* What you receive */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-emerald-500/30">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Du erhältst:</div>
              {incomingOffer.offerMoney > 0 && (
                <div className="text-sm font-black text-amber-300 mb-2 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>+{incomingOffer.offerMoney} €</span>
                </div>
              )}
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {incomingOffer.offerProperties.length === 0 && incomingOffer.offerMoney === 0 && (
                  <span className="text-xs text-slate-500">Nichts</span>
                )}
                {incomingOffer.offerProperties.map(idx => {
                  const sp = BOARD_SPACES[idx];
                  const col = sp.group ? PROPERTY_GROUP_COLORS[sp.group] : null;
                  return (
                    <div key={idx} className="text-xs px-2 py-1 rounded bg-slate-900 flex items-center gap-1.5 border border-slate-700">
                      {col && <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: col.bg }} />}
                      <span className="font-semibold truncate">{sp.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* What you give */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-rose-500/30">
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Du gibst ab:</div>
              {incomingOffer.requestMoney > 0 && (
                <div className="text-sm font-black text-amber-300 mb-2 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>-{incomingOffer.requestMoney} €</span>
                </div>
              )}
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {incomingOffer.requestProperties.length === 0 && incomingOffer.requestMoney === 0 && (
                  <span className="text-xs text-slate-500">Nichts</span>
                )}
                {incomingOffer.requestProperties.map(idx => {
                  const sp = BOARD_SPACES[idx];
                  const col = sp.group ? PROPERTY_GROUP_COLORS[sp.group] : null;
                  return (
                    <div key={idx} className="text-xs px-2 py-1 rounded bg-slate-900 flex items-center gap-1.5 border border-slate-700">
                      {col && <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: col.bg }} />}
                      <span className="font-semibold truncate">{sp.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                sound.playError();
                onRejectOffer();
              }}
              className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition flex items-center justify-center gap-2 border border-slate-700"
            >
              <Ban className="w-4 h-4 text-rose-400" />
              <span>Ablehnen</span>
            </button>
            <button
              onClick={() => {
                sound.playCashRegister();
                onAcceptOffer();
              }}
              className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
            >
              <Check className="w-4 h-4" />
              <span>Handel annehmen!</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Create new trade dialog
  const toggleOfferProp = (idx: number) => {
    setOfferProps(prev => 
      prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]
    );
  };

  const toggleRequestProp = (idx: number) => {
    setRequestProps(prev => 
      prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]
    );
  };

  const handleSend = () => {
    if (!selectedPartnerId) return;
    sound.playClick();
    onSendOffer({
      fromPlayerId: currentUser.id,
      toPlayerId: selectedPartnerId,
      offerProperties: offerProps,
      offerMoney: offerCash,
      requestProperties: requestProps,
      requestMoney: requestCash,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl text-white flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white">Handelszentrum Monopoly 2026</h3>
              <p className="text-xs text-slate-400">Tausche Straßen, Bahnhöfe & Bargeld mit Mitspielern</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Partner Selector */}
        <div className="py-3 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Verhandlungspartner:</span>
          <div className="flex flex-wrap gap-1.5">
            {tradePartners.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedPartnerId(p.id);
                  setRequestProps([]);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  selectedPartnerId === p.id
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span>{p.name} ({p.money} €)</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2-Columns Trade Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto py-2">
          {/* Left Column: Dein Angebot */}
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/80 flex flex-col">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Dein Angebot</span>
              <span className="text-slate-400 text-[11px]">Dein Guthaben: {currentUser.money} €</span>
            </div>

            {/* Cash Input */}
            <div className="mb-2.5 flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-700">
              <span className="text-xs font-bold text-slate-400">Bargeld:</span>
              <input
                type="number"
                min="0"
                max={currentUser.money}
                step="10"
                value={offerCash}
                onChange={(e) => setOfferCash(Math.max(0, Math.min(currentUser.money, parseInt(e.target.value) || 0)))}
                className="w-full bg-transparent text-right font-black text-amber-300 text-sm focus:outline-none"
              />
              <span className="text-xs font-bold text-amber-400">€</span>
            </div>

            {/* Properties List */}
            <div className="text-[11px] font-semibold text-slate-400 mb-1">Deine Grundstücke ({currentUser.properties.length}):</div>
            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {currentUser.properties.length === 0 && (
                <div className="text-xs text-slate-500 italic py-4 text-center">Du besitzt keine Grundstücke</div>
              )}
              {currentUser.properties.map(idx => {
                const sp = BOARD_SPACES[idx];
                const col = sp.group ? PROPERTY_GROUP_COLORS[sp.group] : null;
                const isSelected = offerProps.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleOfferProp(idx)}
                    className={`w-full p-2 rounded-xl text-left text-xs font-bold transition flex items-center justify-between border ${
                      isSelected 
                        ? 'bg-amber-500/20 text-amber-200 border-amber-500/60'
                        : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {col && <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: col.bg }} />}
                      <span className="truncate">{sp.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{sp.price} €</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Deine Forderung */}
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/80 flex flex-col">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Deine Forderung</span>
              <span className="text-slate-400 text-[11px]">
                {selectedPartner?.name}: {selectedPartner?.money || 0} €
              </span>
            </div>

            {/* Cash Request */}
            <div className="mb-2.5 flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-700">
              <span className="text-xs font-bold text-slate-400">Bargeld:</span>
              <input
                type="number"
                min="0"
                max={selectedPartner?.money || 0}
                step="10"
                value={requestCash}
                onChange={(e) => setRequestCash(Math.max(0, Math.min(selectedPartner?.money || 0, parseInt(e.target.value) || 0)))}
                className="w-full bg-transparent text-right font-black text-emerald-300 text-sm focus:outline-none"
              />
              <span className="text-xs font-bold text-emerald-400">€</span>
            </div>

            {/* Properties List */}
            <div className="text-[11px] font-semibold text-slate-400 mb-1">
              Besitz von {selectedPartner?.name} ({selectedPartner?.properties.length || 0}):
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {(!selectedPartner?.properties || selectedPartner.properties.length === 0) && (
                <div className="text-xs text-slate-500 italic py-4 text-center">Dieser Spieler hat keine Grundstücke</div>
              )}
              {selectedPartner?.properties.map(idx => {
                const sp = BOARD_SPACES[idx];
                const col = sp.group ? PROPERTY_GROUP_COLORS[sp.group] : null;
                const isSelected = requestProps.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleRequestProp(idx)}
                    className={`w-full p-2 rounded-xl text-left text-xs font-bold transition flex items-center justify-between border ${
                      isSelected 
                        ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/60'
                        : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {col && <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: col.bg }} />}
                      <span className="truncate">{sp.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{sp.price} €</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSend}
            disabled={offerProps.length === 0 && offerCash === 0 && requestProps.length === 0 && requestCash === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Handelsangebot absenden</span>
          </button>
        </div>
      </div>
    </div>
  );
};
