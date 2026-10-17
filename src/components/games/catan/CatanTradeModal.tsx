import React, { useState } from 'react';
import { ResourceType, ResourceCount, CatanPlayerState, RESOURCE_COLORS } from './catanData';
import { X, ArrowRightLeft, Ship, Users, Check, AlertCircle } from 'lucide-react';
import { sound } from '../../../services/sound';

interface CatanTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: CatanPlayerState;
  otherPlayers: CatanPlayerState[];
  playerHarborTypes: ('generic' | ResourceType)[];
  onExecuteBankTrade: (giveRes: ResourceType, giveAmount: number, getRes: ResourceType) => void;
  onProposeDomesticTrade: (
    targetPlayerId: string,
    offer: Partial<ResourceCount>,
    request: Partial<ResourceCount>
  ) => { accepted: boolean; message: string };
}

export const CatanTradeModal: React.FC<CatanTradeModalProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  otherPlayers,
  playerHarborTypes,
  onExecuteBankTrade,
  onProposeDomesticTrade,
}) => {
  const [tradeMode, setTradeMode] = useState<'domestic' | 'maritime'>('maritime');

  // Maritime Trade State
  const [giveResource, setGiveResource] = useState<ResourceType>('wood');
  const [getResource, setGetResource] = useState<ResourceType>('brick');

  // Calculate required give ratio for selected giveResource
  const hasSpecificHarbor = playerHarborTypes.includes(giveResource);
  const hasGenericHarbor = playerHarborTypes.includes('generic');
  const maritimeRatio = hasSpecificHarbor ? 2 : hasGenericHarbor ? 3 : 4;

  const canAffordMaritime = currentPlayer.resources[giveResource] >= maritimeRatio;

  // Domestic Trade State
  const [targetPlayerId, setTargetPlayerId] = useState<string>(otherPlayers[0]?.id || '');
  const [offer, setOffer] = useState<ResourceCount>({ wood: 0, brick: 0, wool: 0, wheat: 0, ore: 0 });
  const [request, setRequest] = useState<ResourceCount>({ wood: 0, brick: 0, wool: 0, wheat: 0, ore: 0 });
  const [tradeFeedback, setTradeFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const resourcesList: ResourceType[] = ['wood', 'brick', 'wool', 'wheat', 'ore'];

  const handleBankTrade = () => {
    if (!canAffordMaritime || giveResource === getResource) {
      sound.playError();
      return;
    }
    sound.playReward();
    onExecuteBankTrade(giveResource, maritimeRatio, getResource);
    onClose();
  };

  const handleProposeTrade = () => {
    const totalOffered = Object.values(offer).reduce((a, b) => a + b, 0);
    const totalRequested = Object.values(request).reduce((a, b) => a + b, 0);

    if (totalOffered === 0 || totalRequested === 0) {
      sound.playError();
      setTradeFeedback({ success: false, message: 'Wähle mindestens 1 Karte zum Angebot und 1 zur Forderung.' });
      return;
    }

    const res = onProposeDomesticTrade(targetPlayerId, offer, request);
    if (res.accepted) {
      sound.playReward();
      setTradeFeedback({ success: true, message: res.message });
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      sound.playError();
      setTradeFeedback({ success: false, message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-display">Handelszentrum Catan</h3>
              <p className="text-xs text-slate-400">Seehandel mit Häfen oder Binnenhandel mit Spielern</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              setTradeMode('maritime');
              setTradeFeedback(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              tradeMode === 'maritime'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ship className="w-4 h-4" />
            <span>Seehandel (Bank & Häfen)</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setTradeMode('domestic');
              setTradeFeedback(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              tradeMode === 'domestic'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Spieler-Handel</span>
          </button>
        </div>

        {/* Feedback message */}
        {tradeFeedback && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              tradeFeedback.success
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
            }`}
          >
            {tradeFeedback.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{tradeFeedback.message}</span>
          </div>
        )}

        {/* 1. MARITIME TRADE (Seehandel) */}
        {tradeMode === 'maritime' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-400">Aktueller Tauschkurs:</span>
              <span className="font-mono font-black text-amber-400">
                {maritimeRatio}:1 {hasSpecificHarbor ? `(2:1 ${giveResource.toUpperCase()}-Spezialhafen)` : hasGenericHarbor ? '(3:1 Universalhafen)' : '(4:1 Standard-Bankkurs)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Give Section */}
              <div className="space-y-2 p-3 bg-slate-950/40 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300 block">Du gibst ({maritimeRatio}x):</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {resourcesList.map((res) => {
                    const count = currentPlayer.resources[res];
                    const isSelected = giveResource === res;
                    const meta = RESOURCE_COLORS[res];
                    return (
                      <button
                        key={`give-${res}`}
                        onClick={() => {
                          sound.playClick();
                          setGiveResource(res);
                        }}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center transition ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400 text-white'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-sm">{meta.icon}</span>
                        <span className="text-[10px] font-bold mt-0.5">{meta.labelDe}</span>
                        <span className="text-[10px] font-mono opacity-80">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Receive Section */}
              <div className="space-y-2 p-3 bg-slate-950/40 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300 block">Du erhältst (1x):</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {resourcesList.map((res) => {
                    const isSelected = getResource === res;
                    const isSame = giveResource === res;
                    const meta = RESOURCE_COLORS[res];
                    return (
                      <button
                        key={`get-${res}`}
                        disabled={isSame}
                        onClick={() => {
                          sound.playClick();
                          setGetResource(res);
                        }}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center transition ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400 text-white'
                            : isSame
                            ? 'opacity-30 bg-slate-900 border-slate-800 cursor-not-allowed'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-sm">{meta.icon}</span>
                        <span className="text-[10px] font-bold mt-0.5">{meta.labelDe}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={handleBankTrade}
              disabled={!canAffordMaritime || giveResource === getResource}
              className={`w-full py-3 rounded-2xl font-black text-xs transition shadow-lg flex items-center justify-center gap-2 ${
                canAffordMaritime && giveResource !== getResource
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-95 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>{maritimeRatio}x {giveResource.toUpperCase()} gegen 1x {getResource.toUpperCase()} tauschen</span>
            </button>
          </div>
        )}

        {/* 2. DOMESTIC TRADE (Spieler-Handel) */}
        {tradeMode === 'domestic' && (
          <div className="space-y-4">
            {/* Target Player Select */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300">Mitspieler wählen:</span>
              <div className="grid grid-cols-3 gap-2">
                {otherPlayers.map((p) => {
                  const isSelected = targetPlayerId === p.id;
                  const totalCards = Object.values(p.resources).reduce((a, b) => a + b, 0);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        sound.playClick();
                        setTargetPlayerId(p.id);
                      }}
                      className={`p-2 rounded-2xl border text-left transition flex items-center gap-2 ${
                        isSelected
                          ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{totalCards} Handkarten</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Offer and Request Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dein Angebot */}
              <div className="space-y-2 p-3 bg-slate-950/40 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-emerald-400">Dein Angebot:</span>
                <div className="space-y-1.5">
                  {resourcesList.map((res) => {
                    const have = currentPlayer.resources[res];
                    const count = offer[res];
                    const meta = RESOURCE_COLORS[res];
                    return (
                      <div key={`offer-${res}`} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span>{meta.icon}</span>
                          <span className="text-slate-300 font-medium">{meta.labelDe} (max {have})</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setOffer((prev) => ({ ...prev, [res]: Math.max(0, prev[res] - 1) }))}
                            className="w-6 h-6 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-white">{count}</span>
                          <button
                            type="button"
                            disabled={count >= have}
                            onClick={() => setOffer((prev) => ({ ...prev, [res]: Math.min(have, prev[res] + 1) }))}
                            className="w-6 h-6 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deine Forderung */}
              <div className="space-y-2 p-3 bg-slate-950/40 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-amber-400">Deine Forderung:</span>
                <div className="space-y-1.5">
                  {resourcesList.map((res) => {
                    const count = request[res];
                    const meta = RESOURCE_COLORS[res];
                    return (
                      <div key={`req-${res}`} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span>{meta.icon}</span>
                          <span className="text-slate-300 font-medium">{meta.labelDe}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setRequest((prev) => ({ ...prev, [res]: Math.max(0, prev[res] - 1) }))}
                            className="w-6 h-6 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-white">{count}</span>
                          <button
                            type="button"
                            onClick={() => setRequest((prev) => ({ ...prev, [res]: prev[res] + 1 }))}
                            className="w-6 h-6 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={handleProposeTrade}
              className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-lg active:scale-95 cursor-pointer"
            >
              Handel vorschlagen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
