import { mahjongLevelConfig, mahjongLevelBoard } from './mahjongCampaign';
import { generateMahjongBoard, dealMahjongPairs, findAvailablePairs, isTileFree, canTilesMatch, type MahjongLayoutType, type PlacedMahjongTile } from '../components/games/mahjong/mahjongData';
import { shuffle, type Difficulty } from './gameAI';
import type { RoomParticipant } from '../types';
export interface MahjongState {
  campaignLevel?:number;hintsUsed?:number;shufflesUsed?:number;
  layout:MahjongLayoutType;tiles:PlacedMahjongTile[];
  players:{id:string;name:string;color:string;isAi:boolean;score:number;matchedPairsCount:number}[];
  activePlayerIndex:number;score:number;combo:number;lastMatchAt:number;lastActor:string;
  startedAt:number;finishedAt:number|null;finished:boolean;revision:number;
  history:{tile1Id:string;tile2Id:string;playerId:string;points:number}[];
}
export type MahjongCommand={type:'MATCH';first:string;second:string}|{type:'SHUFFLE'|'HINT'|'UNDO'};
export function initialMahjong(participants:RoomParticipant[],layout:MahjongLayoutType='turtle',now=Date.now(),level?:number):MahjongState {
  const config=level?mahjongLevelConfig(level):null;
  return {...(config?{campaignLevel:config.id}:{}),hintsUsed:0,shufflesUsed:0,layout:config?.layout||layout,tiles:config?mahjongLevelBoard(config.id):generateMahjongBoard(layout),players:participants.slice(0,4).map((p,i)=>({id:p.id,name:p.name,color:['#f97316','#3b82f6','#eab308','#10b981'][i],isAi:Boolean(p.isBot),score:0,matchedPairsCount:0})),activePlayerIndex:0,score:0,combo:0,lastMatchAt:0,lastActor:'',startedAt:now,finishedAt:null,finished:false,history:[],revision:0};
}
export function reduceMahjong(state:MahjongState,command:MahjongCommand,now=Date.now(),random=Math.random):MahjongState {
  if(state.finished)return state;
  const active=state.players[state.activePlayerIndex];if(!active)return state;
  if(command.type==='MATCH'){
    const first=state.tiles.find(t=>t.id===command.first),second=state.tiles.find(t=>t.id===command.second);
    if(!first||!second||first.id===second.id||first.matched||second.matched||!isTileFree(first,state.tiles)||!isTileFree(second,state.tiles)||!canTilesMatch(first.definition,second.definition))return state;
    const combo=state.lastActor===active.id&&now-state.lastMatchAt<5000?state.combo+1:1;
    const points=100+(combo-1)*35;
    const tiles=state.tiles.map(t=>t.id===first.id||t.id===second.id?{...t,matched:true}:t);
    const finished=tiles.every(t=>t.matched);
    return {...state,tiles,combo,lastMatchAt:now,lastActor:active.id,score:state.score+points,history:[{tile1Id:first.id,tile2Id:second.id,playerId:active.id,points},...state.history],players:state.players.map(p=>p.id===active.id?{...p,score:p.score+points,matchedPairsCount:p.matchedPairsCount+1}:p),activePlayerIndex:(state.activePlayerIndex+1)%state.players.length,finished,finishedAt:finished?now:null,revision:state.revision+1};
  }
  if(command.type==='HINT') {
    if(state.campaignLevel&&(state.hintsUsed||0)>=mahjongLevelConfig(state.campaignLevel).hints)return state;
    if(!findAvailablePairs(state.tiles).length)return state;
    return {...state,hintsUsed:(state.hintsUsed||0)+1,score:Math.max(0,state.score-25),players:state.players.map(p=>p.id===active.id?{...p,score:Math.max(0,p.score-25)}:p),revision:state.revision+1};
  }
  if(command.type==='SHUFFLE') {
    if(state.campaignLevel&&(state.shufflesUsed||0)>=mahjongLevelConfig(state.campaignLevel).shuffles)return state;
    // During a duel, reshuffling a playable board would change everyone else's choices.
    if(state.players.length>1&&findAvailablePairs(state.tiles).length)return state;
    const tiles=dealMahjongPairs(state.tiles,random);
    return {...state,shufflesUsed:(state.shufflesUsed||0)+1,tiles,history:[],combo:0,revision:state.revision+1};
  }
  if(command.type==='UNDO'&&!state.campaignLevel&&state.players.length===1&&state.history.length){
    const [last,...history]=state.history;
    return {...state,tiles:state.tiles.map(t=>t.id===last.tile1Id||t.id===last.tile2Id?{...t,matched:false}:t),history,score:Math.max(0,state.score-last.points),combo:0,players:state.players.map(p=>({...p,score:Math.max(0,p.score-last.points),matchedPairsCount:p.matchedPairsCount-1})),revision:state.revision+1};
  }
  return state;
}
export function chooseMahjongMove(state:MahjongState,difficulty:Difficulty):MahjongCommand|null {
  if(state.finished)return null;
  const pairs=findAvailablePairs(state.tiles);
  if(!pairs.length)return {type:'SHUFFLE'};
  const value=(pair:PlacedMahjongTile[])=>{
    const next=state.tiles.map(t=>pair.some(p=>p.id===t.id)?{...t,matched:true}:t);
    return next.filter(t=>!t.matched&&isTileFree(t,next)).length*5+pair.reduce((s,t)=>s+t.layer,0)*3+(difficulty==='hard'?findAvailablePairs(next).length*4:0);
  };
  const pair=difficulty==='easy'?pairs[Math.floor(Math.random()*pairs.length)]:[...pairs].sort((a,b)=>value(b)-value(a))[0];
  return {type:'MATCH',first:pair[0].id,second:pair[1].id};
}
