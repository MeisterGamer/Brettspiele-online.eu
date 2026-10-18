import React from 'react';
import type { RommeCard } from './rommeData';
import { AtelierCard } from '../AtelierCard';
import { playingCardAsset,cardBack,rommePortrait } from '../../../services/gameAssets';
interface Props {card?:RommeCard|null;isFaceDown?:boolean;isSelected?:boolean;isPlayable?:boolean;stackCount?:number;onClick?:()=>void;size?:'sm'|'md'|'lg';className?:string;disabled?:boolean;}
export const RommeCardRenderer:React.FC<Props>=({card,isFaceDown=false,...props})=>{
  const hidden=isFaceDown||!card;
  const suitName=card?{hearts:'Herz',diamonds:'Karo',clubs:'Kreuz',spades:'Pik',joker:'Joker'}[card.suit]:'';
  const rankName=card?(typeof card.rank==='number'?String(card.rank):{J:'Bube',Q:'Dame',K:'König',A:'Ass',JOKER:'Joker'}[card.rank]):'';
  return <AtelierCard {...props} src={hidden?cardBack('classic'):playingCardAsset(card.suit,card.rank)} portrait={hidden?undefined:rommePortrait(card.suit,card.rank)} label={hidden?'Rommé · Verdeckter Kartenstapel':card.rank==='JOKER'?'Joker':`${suitName} ${rankName}`} annotation={!hidden?card.representedRank?`Als ${card.representedRank}`:undefined:undefined}/>;
};
