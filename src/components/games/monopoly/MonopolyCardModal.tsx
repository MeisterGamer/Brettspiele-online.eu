import React from 'react';
import { CardAction } from './monopolyData';
import { Sparkles, HelpCircle, Gift, AlertTriangle, ArrowRight } from 'lucide-react';
import { sound } from '../../../services/sound';

interface MonopolyCardModalProps {
  card: CardAction | null;
  onConfirm: () => void;
}

export const MonopolyCardModal: React.FC<MonopolyCardModalProps> = ({ card, onConfirm }) => {
  if (!card) return null;

  const isChance = card.deck === 'chance';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center text-slate-900 border-4 overflow-hidden animate-scaleUp"
        style={{
          backgroundColor: isChance ? '#fff7ed' : '#eff6ff',
          borderColor: isChance ? '#ea580c' : '#2563eb'
        }}
      >
        {/* Top Decorative Card Tag */}
        <div 
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest text-white shadow-sm mb-4"
          style={{ backgroundColor: isChance ? '#ea580c' : '#2563eb' }}
        >
          {isChance ? <HelpCircle className="w-3.5 h-3.5" /> : <Gift className="w-3.5 h-3.5" />}
          <span>{isChance ? 'Ereigniskarte 2026' : 'Gemeinschaftskarte'}</span>
        </div>

        {/* Center Illustration Icon */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-white/70 border border-slate-200">
          {card.type === 'money' && (card.amount || 0) > 0 ? '💰' : 
           card.type === 'money' ? '💸' :
           card.type === 'jail' ? '👮' :
           card.type === 'jail-free' ? '🗝️' :
           card.type === 'move' ? '🚀' : '🏛️'}
        </div>

        {/* Card Title */}
        <h3 className="font-display font-black text-lg text-slate-900 mb-2">
          {card.title}
        </h3>

        {/* Card Text */}
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium mb-6 px-2">
          {card.text}
        </p>

        {/* Amount Badge if applicable */}
        {card.amount && (
          <div className="mb-4">
            <span 
              className={`inline-block px-3 py-1 rounded-xl text-base font-black font-mono ${
                card.amount > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {card.amount > 0 ? `+${card.amount} €` : `${card.amount} €`}
            </span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => {
            sound.playClick();
            onConfirm();
          }}
          className="w-full py-3 rounded-2xl font-black text-sm text-white shadow-lg transition flex items-center justify-center gap-2"
          style={{ backgroundColor: isChance ? '#c2410c' : '#1d4ed8' }}
        >
          <span>Weiter</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
