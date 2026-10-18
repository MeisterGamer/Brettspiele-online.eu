/** Original project artwork; all files are same-origin and included in the PWA cache. */
const root='/assets/atelier';
export const tableArtwork=`${root}/images/game-table.png`;
export const boardAsset=(name:string)=>['mahogany','feltGreen','hearthCozy','terraceGarden'].includes(name)?tableArtwork:`${root}/boards/${name}.svg`;
export const pieceAsset=(name:string)=>`${root}/pieces/${name}.svg`;
export const cardBack=(_kind:'classic'|'family'|'sequence'='classic')=>`${root}/images/card-back.png`;
export const courtArtwork=`${root}/images/card-characters.png`;
export function pieceSprite(kind:string) {
  if(kind.startsWith('chess-')){
    const [,side,piece]=kind.split('-');
    return {src:`${root}/images/chess-pieces.png`,columns:6,column:['k','q','r','b','n','p'].indexOf(piece),row:side==='w'?0:1};
  }
  const [,color,king]=kind.split('-');
  return {src:`${root}/images/game-tokens.png`,columns:4,column:kind.startsWith('pawn-')?['red','blue','green','yellow'].indexOf(color):(color==='red'?0:1)+(king?2:0),row:kind.startsWith('pawn-')?0:1};
}
export const playingCardAsset=(suit:string,rank:string|number)=>`${root}/cards/${suit==='joker'||rank==='JOKER'?'joker':`${suit}-${rank}`}.svg`;
export const familyCardAsset=(color:string,value:string)=>`${root}/family/${color}-${value.replace('+','plus')}.svg`;
export const sequenceCardAsset=(value:number|'SKIP-BO')=>`${root}/sequence/${value==='SKIP-BO'?'wild':value}.svg`;
