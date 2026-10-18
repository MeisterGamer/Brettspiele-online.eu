import { campaignLevel, seededRandom } from './campaign';
import { generateMahjongBoard, dealMahjongPairs, getFreeTiles, type MahjongLayoutType } from '../components/games/mahjong/mahjongData';
export function mahjongLevelConfig(id:number) {
  const level=campaignLevel(id);
  const layout:MahjongLayoutType[]=['pyramid','turtle','fortress'];
  return {...level,layout:layout[(level.stage-1+level.tier)%3],tileCount:level.tier===4?144:48+level.tier*24+(level.stage-1)*2,hints:[8,6,4,2,0][level.tier],shuffles:[4,3,2,1,0][level.tier],parSeconds:Math.round((level.tier===4?144:48+level.tier*24+(level.stage-1)*2)*(5-level.tier*.6))};
}
export function mahjongLevelBoard(id:number) {
  const config=mahjongLevelConfig(id),random=seededRandom(config.id*7919);
  let tiles=generateMahjongBoard(config.layout,random).map((t,i)=>({...t,id:`level-${config.id}-tile-${i}`}));
  for(let count=144;count>config.tileCount;count-=2){
    const free=getFreeTiles(tiles).sort((a,b)=>b.layer-a.layer||a.x-b.x||a.y-b.y);
    tiles=tiles.filter(t=>t.id!==free[0].id&&t.id!==free[1].id);
  }
  if(config.tier===0)tiles=tiles.map((t,i)=>({...t,x:2+(i%12)*2,y:2+Math.floor(i/12)*2,layer:0}));
  return dealMahjongPairs(tiles,random);
}
