import React from 'react';
import {CAMPAIGN_TIERS,levelUnlocked} from '../../services/campaign';
export function CampaignSelector({tier,setTier,stars,onSelect,disabled=false,current}:{tier:number;setTier:(tier:number)=>void;stars:Record<number,number>;onSelect:(id:number)=>void;disabled?:boolean;current?:number}) {
  return <section aria-label="Levelauswahl" className="bg-slate-900 border border-slate-700 p-3 rounded-2xl space-y-3">
    <h3 className="font-bold">50 Levels · 5 Schwierigkeitsstufen</h3>
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">{CAMPAIGN_TIERS.map((label,i)=><button key={label} aria-pressed={tier===i} onClick={()=>setTier(i)} className={`p-3 rounded-xl ${tier===i?'bg-amber-500 text-slate-950':'bg-slate-800'}`}>{label}</button>)}</div>
    <div className="grid grid-cols-5 gap-2">{Array.from({length:10},(_,i)=>{const id=tier*10+i+1;return <button key={id} disabled={disabled||!levelUnlocked(id,stars)} aria-current={id===current?'step':undefined} aria-label={`${CAMPAIGN_TIERS[tier]} Level ${i+1}`} onClick={()=>onSelect(id)} className="p-3 bg-slate-800 border border-slate-600 rounded-xl disabled:opacity-40"><span className="block font-bold">{i+1}</span><span className="text-xs text-amber-300">{stars[id]?'★'.repeat(stars[id]):levelUnlocked(id,stars)?'Start':'🔒'}</span></button>;})}</div>
    <p className="text-xs text-slate-400">Jede Stufe beginnt mit Level 1. Ein Sieg schaltet das nächste Level dieser Stufe frei. Sterne werden auf diesem Gerät gespeichert.</p>
  </section>;
}
