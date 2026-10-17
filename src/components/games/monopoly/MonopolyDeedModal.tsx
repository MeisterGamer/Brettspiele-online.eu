import React from 'react';
import { BoardSpace, PROPERTY_GROUP_COLORS } from './monopolyData';
import { X, Home, Building2, ShieldCheck, DollarSign } from 'lucide-react';
import { sound } from '../../../services/sound';

interface MonopolyDeedModalProps {
  space: BoardSpace | null;
  onClose: () => void;
  ownerName?: string;
  ownerColor?: string;
  housesCount?: number;
  isMortgaged?: boolean;
  canBuild?: boolean;
  canSellHouse?: boolean;
  canMortgage?: boolean;
  canUnmortgage?: boolean;
  onBuildHouse?: () => void;
  onSellHouse?: () => void;
  onToggleMortgage?: () => void;
}

export const MonopolyDeedModal: React.FC<MonopolyDeedModalProps> = ({
  space,
  onClose,
  ownerName,
  ownerColor,
  housesCount = 0,
  isMortgaged = false,
  canBuild = false,
  canSellHouse = false,
  canMortgage = false,
  canUnmortgage = false,
  onBuildHouse,
  onSellHouse,
  onToggleMortgage,
}) => {
  if (!space) return null;

  const groupInfo = space.group ? PROPERTY_GROUP_COLORS[space.group] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-sm bg-amber-50 rounded-2xl shadow-2xl overflow-hidden border-4 border-slate-900 text-slate-900 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-800 flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Deed Header Banner */}
        {groupInfo ? (
          <div 
            className="p-4 text-center border-b-2 border-slate-900/30 shadow-inner"
            style={{ backgroundColor: groupInfo.bg, color: groupInfo.text }}
          >
            <div className="text-[11px] uppercase tracking-widest font-black opacity-90">
              Besitzrechtkarte 2026
            </div>
            <div className="text-xl font-black font-display tracking-tight drop-shadow-sm mt-0.5">
              {space.name}
            </div>
          </div>
        ) : (
          <div className="p-4 text-center bg-slate-800 text-white border-b-2 border-slate-900">
            <div className="text-2xl mb-1">{space.icon}</div>
            <div className="text-xl font-black font-display">{space.name}</div>
          </div>
        )}

        {/* Deed Body Rents Table */}
        <div className="p-4 space-y-3 text-xs">
          {/* Ownership Status Ribbon */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-200/70 border border-slate-300">
            <span className="font-semibold text-slate-700">Eigentümer:</span>
            {ownerName ? (
              <span className="font-black px-2 py-0.5 rounded-lg text-white text-[11px]" style={{ backgroundColor: ownerColor || '#1e293b' }}>
                {ownerName}
              </span>
            ) : (
              <span className="font-bold text-slate-500 italic">Frei zur Bank (Kaufbar)</span>
            )}
          </div>

          {isMortgaged && (
            <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 font-black text-center uppercase tracking-wider text-[11px]">
              ⚠️ Belastet mit Hypothek (Keine Miete)
            </div>
          )}

          {/* Standard Street Deed Details */}
          {space.type === 'property' && space.houseRents && (
            <div className="space-y-1.5 border-y border-slate-300/80 py-2.5">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Miete (Grundstück allein):</span>
                <span>{space.baseRent} €</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Miete bei kompletter Farbgruppe:</span>
                <span className="font-bold text-slate-800">{(space.baseRent || 0) * 2} €</span>
              </div>
              
              <div className="pt-1.5 space-y-1 border-t border-slate-200">
                <div className="flex justify-between text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-600 rounded-sm inline-block" />
                    Mit 1 Haus:
                  </span>
                  <span className="font-bold">{space.houseRents[0]} €</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-600 rounded-sm inline-block" />
                    Mit 2 Häusern:
                  </span>
                  <span className="font-bold">{space.houseRents[1]} €</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-600 rounded-sm inline-block" />
                    Mit 3 Häusern:
                  </span>
                  <span className="font-bold">{space.houseRents[2]} €</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-600 rounded-sm inline-block" />
                    Mit 4 Häusern:
                  </span>
                  <span className="font-bold">{space.houseRents[3]} €</span>
                </div>
                <div className="flex justify-between font-black text-rose-700 bg-rose-50 p-1 rounded-lg">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-rose-600 rounded-sm inline-block" />
                    Mit 1 HOTEL:
                  </span>
                  <span>{space.houseRents[4]} €</span>
                </div>
              </div>
            </div>
          )}

          {/* Railway Station Details */}
          {space.type === 'station' && (
            <div className="space-y-1.5 border-y border-slate-300 py-2.5 text-slate-700">
              <div className="flex justify-between"><span>1 Bahnhof im Besitz:</span><span className="font-bold">25 €</span></div>
              <div className="flex justify-between"><span>2 Bahnhöfe im Besitz:</span><span className="font-bold">50 €</span></div>
              <div className="flex justify-between"><span>3 Bahnhöfe im Besitz:</span><span className="font-bold">100 €</span></div>
              <div className="flex justify-between font-bold text-slate-900"><span>Alle 4 Bahnhöfe:</span><span>200 €</span></div>
            </div>
          )}

          {/* Utility Works Details */}
          {space.type === 'utility' && (
            <div className="space-y-1.5 border-y border-slate-300 py-2.5 text-slate-700">
              <div className="text-[11px] leading-relaxed">
                Besitzt ein Spieler ein Werk, ist die Miete das <span className="font-bold text-slate-900">4-fache</span> der gewürfelten Augenzahl.
              </div>
              <div className="text-[11px] leading-relaxed">
                Besitzt der Spieler beide Werke (Strom + Wasser), ist die Miete das <span className="font-bold text-slate-900">10-fache</span> der Augenzahl!
              </div>
            </div>
          )}

          {/* Cost & Mortgage Footnote */}
          <div className="space-y-1 text-[11px] text-slate-600 pt-1">
            {space.price && (
              <div className="flex justify-between">
                <span>Kaufpreis der Bank:</span>
                <span className="font-bold text-slate-800">{space.price} €</span>
              </div>
            )}
            {space.houseCost && (
              <div className="flex justify-between">
                <span>Kosten pro Haus / Hotel:</span>
                <span className="font-bold text-slate-800">{space.houseCost} €</span>
              </div>
            )}
            {space.mortgageValue && (
              <div className="flex justify-between">
                <span>Hypothekenwert:</span>
                <span className="font-bold text-amber-800">{space.mortgageValue} €</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls if Owned by Current Player */}
        {(canBuild || canSellHouse || canMortgage || canUnmortgage) && (
          <div className="p-3 bg-slate-100 border-t border-slate-300 space-y-2">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center">
              Aktionen für Eigentümer
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {canBuild && onBuildHouse && (
                <button
                  onClick={() => {
                    sound.playBuildHouse();
                    onBuildHouse();
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>+ Haus ({space.houseCost} €)</span>
                </button>
              )}

              {canSellHouse && onSellHouse && (
                <button
                  onClick={() => {
                    sound.playCashRegister();
                    onSellHouse();
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Haus verk. (+{(space.houseCost || 100) / 2} €)</span>
                </button>
              )}

              {canMortgage && onToggleMortgage && (
                <button
                  onClick={() => {
                    sound.playCashRegister();
                    onToggleMortgage();
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Hypothek (+{space.mortgageValue} €)</span>
                </button>
              )}

              {canUnmortgage && onToggleMortgage && (
                <button
                  onClick={() => {
                    sound.playCashRegister();
                    onToggleMortgage();
                  }}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Tilgen (-{Math.round((space.mortgageValue || 50) * 1.1)} €)</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
