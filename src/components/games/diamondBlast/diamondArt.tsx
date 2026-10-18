import React from 'react';
export const DIAMOND_ART={gems:'/assets/diamond-blast/gems.png',objects:'/assets/diamond-blast/objects.png',vault:'/assets/diamond-blast/vault.png'};
export function DiamondSprite({sheet,index,className='',label}:{sheet:'gems'|'objects';index:number;className?:string;label?:string}) {
  const columns=sheet==='gems'?3:4;
  return <span role={label?'img':undefined} aria-label={label} aria-hidden={label?undefined:true} className={`inline-block shrink-0 pointer-events-none ${className}`} style={{backgroundImage:`url(${DIAMOND_ART[sheet]})`,backgroundSize:`${columns*100}% 200%`,backgroundPosition:`${index%columns/(columns-1)*100}% ${Math.floor(index/columns)*100}%`,backgroundRepeat:'no-repeat'}}/>;
}
