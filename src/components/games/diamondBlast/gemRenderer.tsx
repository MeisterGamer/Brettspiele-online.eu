import React from 'react';
import type {Gem} from './types';
import {DiamondSprite} from './diamondArt';
import {GEM_COLORS} from './matchEngine';
interface Props {gem:Gem;isSelected?:boolean;isHinted?:boolean;size?:number}
const colorHex={red:'#fa435a',blue:'#39aaff',green:'#25df83',yellow:'#ffe05a',purple:'#cb83ff',orange:'#ff964d'};
export const GemRenderer:React.FC<Props>=({gem,isSelected=false,isHinted=false,size=54})=>{
  const specialIndex={none:undefined,'line-h':0,'line-v':1,bomb:2,rainbow:3}[gem.special];
  return <div className={`relative w-full h-full aspect-square pointer-events-none ${isSelected?'ring-2 ring-amber-300 rounded-lg scale-105 z-20':isHinted?'ring-2 ring-cyan-300 rounded-lg animate-pulse':''}`} style={{maxWidth:size,maxHeight:size}}>
    {gem.obstacle==='rock'?<><DiamondSprite sheet="objects" index={5} className="absolute inset-0 w-full h-full"/><span className="absolute inset-x-0 bottom-0 text-center text-[9px] font-black text-white drop-shadow">{'•'.repeat(Math.max(1,gem.obstacleHealth))}</span></>:<>
      <DiamondSprite sheet="gems" index={GEM_COLORS.indexOf(gem.color)} className="absolute inset-0 w-full h-full"/>
      {specialIndex!==undefined&&<><DiamondSprite sheet="objects" index={specialIndex} className={gem.special==='rainbow'?'absolute inset-0 w-full h-full':'absolute inset-[12%] w-[76%] h-[76%]'}/><span className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white" style={{backgroundColor:colorHex[gem.color]}}/></>}
      {gem.obstacle==='ice'&&<DiamondSprite sheet="objects" index={4} className="absolute inset-0 w-full h-full"/>}
      {gem.obstacle==='chain'&&<DiamondSprite sheet="objects" index={6} className="absolute inset-0 w-full h-full"/>}
    </>}
  </div>;
};
