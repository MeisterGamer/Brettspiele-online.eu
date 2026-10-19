import React from 'react';
import type {CardPortrait} from '../../services/gameAssets';
interface Props {
  src:string;label:string;onClick?:()=>void;disabled?:boolean;isSelected?:boolean;isPlayable?:boolean;
  size?:'sm'|'md'|'lg';className?:string;stackCount?:number;annotation?:string;
  portrait?:CardPortrait;
}
export function AtelierCard({src,label,onClick,disabled=false,isSelected=false,isPlayable=false,size='md',className='',stackCount=0,annotation,portrait}:Props) {
  const dimensions={sm:'w-12 h-18 sm:w-14 sm:h-21',md:'w-18 h-27 sm:w-20 sm:h-30',lg:'w-20 h-30 sm:w-24 sm:h-36'}[size];
  return <div role={onClick?'button':'img'} aria-label={label} aria-disabled={onClick?disabled:undefined} tabIndex={onClick&&!disabled?0:undefined}
    onClick={!disabled?onClick:undefined} onKeyDown={event=>{if(onClick&&!disabled&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onClick();}}}
    className={`relative shrink-0 rounded-lg transition-transform select-none ${dimensions} ${onClick&&!disabled?'cursor-pointer hover:-translate-y-1 active:scale-95':''} ${disabled?'opacity-60':''} ${isSelected?'ring-4 ring-amber-400 -translate-y-2 z-20':isPlayable?'ring-2 ring-emerald-400':''} ${className}`}
    style={{boxShadow:stackCount>1?'3px 3px 0 #d3c5a9,6px 6px 0 #27384b,0 8px 16px #0006':'0 4px 10px #0005'}}>
    <img src={src} alt="" draggable={false} className="w-full h-full rounded-lg pointer-events-none"/>
    {portrait&&<span aria-hidden="true" className="absolute left-[23%] top-[26%] w-[54%] h-[48%] pointer-events-none" style={{backgroundImage:`url(${portrait.src})`,backgroundSize:`${portrait.columns*100}% ${portrait.rows*100}%`,backgroundPosition:`${portrait.column/(portrait.columns-1)*100}% ${portrait.row/(portrait.rows-1)*100}%`}}/>}
    {stackCount>0&&<span className="absolute -top-1 -right-1 px-1.5 rounded-full bg-slate-950 text-amber-200 border border-amber-400 text-[10px] font-bold">{stackCount}</span>}
    {annotation&&<span className="absolute bottom-1 inset-x-1 text-center bg-slate-950 text-white rounded text-[10px] font-bold">{annotation}</span>}
  </div>;
}
