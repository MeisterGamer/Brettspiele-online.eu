import React from 'react';
import type { SkipBoCard } from './skipboData';
import { AtelierCard } from '../AtelierCard';
import { sequenceCardAsset,cardBack } from '../../../services/gameAssets';
interface Props {card?:SkipBoCard|null;isFaceDown?:boolean;isSelected?:boolean;isPlayable?:boolean;stackCount?:number;onClick?:()=>void;size?:'sm'|'md'|'lg';className?:string;disabled?:boolean;}
export const SkipBoCardRenderer:React.FC<Props>=({card,isFaceDown=false,...props})=>{
  const hidden=isFaceDown||!card;
  return <AtelierCard {...props} src={hidden?cardBack('sequence'):sequenceCardAsset(card.value)} label={hidden?'Skip-Bo · Verdeckter Kartenstapel':card.value==='SKIP-BO'?'Skip-Bo Joker · Freie Zahl 1 bis 12':`Skip-Bo Zahl ${card.value}`} annotation={!hidden?card.assignedValue?`Als ${card.assignedValue}`:undefined:undefined}/>;
};
