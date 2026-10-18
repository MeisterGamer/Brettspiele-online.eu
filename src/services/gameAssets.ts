/** Original project artwork; all files are same-origin and included in the PWA cache. */
const root='/assets/atelier';
export const tableArtwork=`${root}/images/game-table.png`;
export const boardAsset=(name:string)=>['mahogany','feltGreen','hearthCozy','terraceGarden'].includes(name)?tableArtwork:`${root}/boards/${name}.svg`;
export const pieceAsset=(name:string)=>`${root}/pieces/${name}.svg`;
export type CardDeck='classic'|'family'|'sequence';
export const cardBack=(kind:CardDeck='classic')=>`${root}/images/${{classic:'romme',family:'family',sequence:'sequence'}[kind]}-back-v2.png`;
export const courtArtwork=`${root}/images/card-characters.png`;
export function pieceSprite(kind:string) {
  if(kind.startsWith('chess-')){
    const [,side,piece]=kind.split('-');
    return {src:`${root}/images/chess-pieces.png`,columns:6,column:['k','q','r','b','n','p'].indexOf(piece),row:side==='w'?0:1};
  }
  const [,color,king]=kind.split('-');
  return {src:`${root}/images/game-tokens.png`,columns:4,column:kind.startsWith('pawn-')?['red','blue','green','yellow'].indexOf(color):(color==='red'?0:1)+(king?2:0),row:kind.startsWith('pawn-')?0:1};
}
export interface CardPortrait {src:string;columns:number;rows:number;column:number;row:number}
export function rommePortrait(suit:string,rank:string|number):CardPortrait|undefined {
  if(rank==='JOKER'||suit==='joker')return {src:courtArtwork,columns:2,rows:2,column:1,row:1};
  const row=['K','Q','J'].indexOf(String(rank)),column=['hearts','diamonds','clubs','spades'].indexOf(suit);
  if(row<0||column<0)return;
  return {src:`${root}/images/romme-courts-v2.png`,columns:4,rows:3,column,row};
}
export const playingCardAsset=(suit:string,rank:string|number)=>`${root}/romme-v2/${suit==='joker'||rank==='JOKER'?'joker':`${suit}-${rank}`}.svg`;
export const familyCardAsset=(color:string,value:string)=>`${root}/family-v2/${color}-${value.replace('+','plus')}.svg`;
export const sequenceCardAsset=(value:number|'SKIP-BO')=>`${root}/sequence-v2/${value==='SKIP-BO'?'wild':value}.svg`;
export const cardColorName=(color:string)=>({red:'Rot',blue:'Blau',green:'Grün',yellow:'Gelb',wild:'Farbwahl'}[color]||color);
export const familyCardLabel=(color:string,value:string)=>`${cardColorName(color)} · ${{skip:'Aussetzen',reverse:'Richtungswechsel','+2':'Zwei Karten ziehen',wild:'Farbe wählen','+4':'Vier Karten ziehen und Farbe wählen'}[value]||value}`;
