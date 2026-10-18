import React from 'react';
import {courtArtwork} from '../../services/gameAssets';
interface Props {
  src:string;label:string;onClick?:()=>void;disabled?:boolean;isSelected?:boolean;isPlayable?:boolean;
  size?:'sm'|'md'|'lg';className?:string;stackCount?:number;annotation?:string;
}
export function AtelierCard({src,label,onClick,disabled=false,isSelected=false,isPlayable=false,size='md',className='',stackCount=0,annotation}:Props) {
  const dimensions={sm:'w-11 h-16 sm:w-12 sm:h-18',md:'w-14 h-21 sm:w-16 sm:h-24',lg:'w-16 h-24 sm:w-20 sm:h-30'}[size];
  const rank=src.match(/-(K|Q|J)\.svg$/)?.[1];
  const portrait=src.endsWith('/joker.svg')?3:rank?{K:0,Q:1,J:2}[rank]:undefined;
  return <div role={onClick?'button':'img'} aria-label={label} aria-disabled={onClick?disabled:undefined} tabIndex={onClick&&!disabled?0:undefined}
    onClick={!disabled?onClick:undefined} onKeyDown={event=>{if(onClick&&!disabled&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onClick();}}}
    className={`relative shrink-0 rounded-lg transition-transform select-none ${dimensions} ${onClick&&!disabled?'cursor-pointer hover:-translate-y-1 active:scale-95':''} ${disabled?'opacity-60':''} ${isSelected?'ring-4 ring-amber-400 -translate-y-2 z-20':isPlayable?'ring-2 ring-emerald-400':''} ${className}`}
    style={{boxShadow:stackCount>1?'3px 3px 0 #d3c5a9,6px 6px 0 #27384b,0 8px 16px #0006':'0 4px 10px #0005'}}>
    <img src={src} alt="" draggable={false} className="w-full h-full rounded-lg pointer-events-none"/>
    {portrait!==undefined&&<span aria-hidden="true" className="absolute left-[12%] top-[22%] w-[76%] aspect-square pointer-events-none" style={{backgroundImage:`url(${courtArtwork})`,backgroundSize:'200% 200%',backgroundPosition:`${portrait%2*100}% ${Math.floor(portrait/2)*100}%`}}/>}
    {stackCount>0&&<span className="absolute -top-1 -right-1 px-1.5 rounded-full bg-slate-950 text-amber-200 border border-amber-400 text-[10px] font-bold">{stackCount}</span>}
    {annotation&&<span className="absolute bottom-1 inset-x-1 text-center bg-slate-950 text-white rounded text-[10px] font-bold">{annotation}</span>}
  </div>;
}
