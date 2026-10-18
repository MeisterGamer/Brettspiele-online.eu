import React from 'react';
import type { RommeCard } from './rommeData';
import { AtelierCard } from '../AtelierCard';
import { playingCardAsset,cardBack } from '../../../services/gameAssets';
interface Props {card?:RommeCard|null;isFaceDown?:boolean;isSelected?:boolean;isPlayable?:boolean;stackCount?:number;onClick?:()=>void;size?:'sm'|'md'|'lg';className?:string;disabled?:boolean;}
export const RommeCardRenderer:React.FC<Props>=({card,isFaceDown=false,...props})=>{
  const hidden=isFaceDown||!card;
  return <AtelierCard {...props} src={hidden?cardBack('classic'):playingCardAsset(card.suit,card.rank)} label={hidden?'Verdeckter Kartenstapel':card.rank==='JOKER'?'Joker':`${card.rank} ${card.suit}`} annotation={!hidden?card.representedRank?`Als ${card.representedRank}`:undefined:undefined}/>;
};
