import { generateCatanBoard, BUILDING_COSTS, INITIAL_DEV_CARDS_DECK, type CatanPlayerState, type CatanGamePhase, type ResourceCount, type ResourceType, type DevCardType } from '../components/games/catan/catanData';
import type { RoomParticipant } from '../types';
import { shuffle } from './gameAI';
export const resources:ResourceType[]=['wood','brick','wool','wheat','ore'];
const empty=():ResourceCount=>({wood:0,brick:0,wool:0,wheat:0,ore:0});
const devEmpty=()=>({knight:0,victoryPoint:0,roadBuilding:0,yearOfPlenty:0,monopoly:0});
export interface CatanState {
  board:ReturnType<typeof generateCatanBoard>;players:CatanPlayerState[];activePlayerIndex:number;gamePhase:CatanGamePhase;
  setupSubStep:'settlement'|'road';lastPlacedVertexId:number|null;robberHexId:number;dice:[number,number];lastDiceSum:number|null;
  lastRollProducingHexIds:number[];devCardDeck:DevCardType[];bank:ResourceCount;pendingDiscards:Record<string,number>;
  robberVictims:string[];robberReturnPhase:'ROLL'|'MAIN_ACTION';pendingTrade:null|{from:string;target:string;offer:ResourceCount;request:ResourceCount};
  bought:Record<string,ReturnType<typeof devEmpty>>;playedDev:boolean;pendingDev:'yearOfPlenty'|'monopoly'|null;freeRoads:number;
  winner:string|null;revision:number;log:string[];
}
export type CatanCommand=
  |{type:'SETTLEMENT'|'CITY';vertex:number}|{type:'ROAD';edge:string}|{type:'ROLL'|'END'|'BUY_DEV'}
  |{type:'ROBBER';hex:number}|{type:'STEAL';victim:string}|{type:'DISCARD';cards:Partial<ResourceCount>}
  |{type:'BANK';give:ResourceType;get:ResourceType}|{type:'TRADE';target:string;offer:Partial<ResourceCount>;request:Partial<ResourceCount>}
  |{type:'REPLY_TRADE';accept:boolean}|{type:'PLAY_DEV';card:DevCardType}|{type:'PLENTY';choices:ResourceType[]}|{type:'MONOPOLY';resource:ResourceType};
export const totalResources=(cards:Partial<ResourceCount>)=>resources.reduce((s,r)=>s+(cards[r]||0),0);
export function initialCatan(participants:RoomParticipant[],random=Math.random):CatanState {
  const list:{id:string;name:string;isAi:boolean;avatar:any}[]=participants.slice(0,4).map(p=>({id:p.id,name:p.name,isAi:Boolean(p.isBot),avatar:p.avatar}));
  while(list.length<3){const n=list.length;list.push({id:`catan-bot-${n}`,name:`Siedler-KI ${n+1}`,isAi:true,avatar:null});}
  const board=generateCatanBoard();
  return {board,players:list.map((p,i)=>({...p,color:['#f97316','#3b82f6','#eab308','#10b981'][i],badgeColor:['bg-orange-500','bg-blue-500','bg-yellow-500','bg-emerald-500'][i],resources:empty(),settlements:[],cities:[],roads:[],devCards:devEmpty(),playedKnights:0,hasLongestRoad:false,hasLargestArmy:false,victoryPoints:0})),activePlayerIndex:0,gamePhase:'SETUP_1',setupSubStep:'settlement',lastPlacedVertexId:null,robberHexId:board.desertHexId,dice:[1,1],lastDiceSum:null,lastRollProducingHexIds:[],devCardDeck:shuffle(INITIAL_DEV_CARDS_DECK,random),bank:{wood:19,brick:19,wool:19,wheat:19,ore:19},pendingDiscards:{},robberVictims:[],robberReturnPhase:'MAIN_ACTION',pendingTrade:null,bought:{},playedDev:false,pendingDev:null,freeRoads:0,winner:null,revision:0,log:['Startaufstellung: Siedlung und angrenzende Straße platzieren.']};
}
export function buildingOwner(state:CatanState,vertex:number) {return state.players.find(p=>p.settlements.includes(vertex)||p.cities.includes(vertex));}
export function catanHarbors(state:CatanState,player:CatanPlayerState) {return [...new Set([...player.settlements,...player.cities].flatMap(id=>{const harbor=state.board.vertices.find(v=>v.id===id)?.harbor;return harbor?[harbor.type]:[];}))];}
export function canCatanSettle(state:CatanState,vertex:number,player=state.players[state.activePlayerIndex],setup=false):boolean {
  const v=state.board.vertices.find(v=>v.id===vertex);
  return Boolean(v&&!buildingOwner(state,vertex)&&!v.neighborVertexIds.some(id=>buildingOwner(state,id))&&player.settlements.length<5&&(setup||v.adjacentEdgeIds.some(id=>player.roads.includes(id))));
}
export function canCatanRoad(state:CatanState,edgeId:string,player=state.players[state.activePlayerIndex],setup=false):boolean {
  const edge=state.board.edges.find(e=>e.id===edgeId);
  if(!edge||state.players.some(p=>p.roads.includes(edgeId))||player.roads.length>=15)return false;
  if(setup)return edge.v1===state.lastPlacedVertexId||edge.v2===state.lastPlacedVertexId;
  return [edge.v1,edge.v2].some(id=>{
    const owner=buildingOwner(state,id);
    if(owner)return owner.id===player.id;
    return state.board.vertices.find(v=>v.id===id)!.adjacentEdgeIds.some(e=>player.roads.includes(e));
  });
}
export function catanLongestRoad(state:CatanState,player:CatanPlayerState):number {
  const edges=state.board.edges.filter(e=>player.roads.includes(e.id));
  const walk=(vertex:number,used:Set<string>):number=>{
    const owner=buildingOwner(state,vertex);if(used.size&&owner&&owner.id!==player.id)return 0;
    let best=0;
    for(const e of edges)if(!used.has(e.id)&&(e.v1===vertex||e.v2===vertex))best=Math.max(best,1+walk(e.v1===vertex?e.v2:e.v1,new Set([...used,e.id])));
    return best;
  };
  return Math.max(0,...[...new Set(edges.flatMap(e=>[e.v1,e.v2]))].map(v=>walk(v,new Set())));
}
function updateAwards(state:CatanState) {
  const assign=(field:'hasLongestRoad'|'hasLargestArmy',scores:number[],minimum:number)=>{
    const maximum=Math.max(...scores),current=state.players.findIndex(p=>p[field]);
    const tied=scores.map((s,i)=>s===maximum?i:-1).filter(i=>i>=0);
    const holder=maximum<minimum?-1:tied.includes(current)?current:tied.length===1?tied[0]:-1;
    state.players.forEach((p,i)=>p[field]=i===holder);
  };
  assign('hasLongestRoad',state.players.map(p=>catanLongestRoad(state,p)),5);
  assign('hasLargestArmy',state.players.map(p=>p.playedKnights),3);
  state.players.forEach(p=>p.victoryPoints=p.settlements.length+p.cities.length*2+p.devCards.victoryPoint+(p.hasLongestRoad?2:0)+(p.hasLargestArmy?2:0));
  const active=state.players[state.activePlayerIndex];
  if(active.victoryPoints>=10&&!state.gamePhase.startsWith('SETUP')){state.winner=active.id;state.gamePhase='GAME_OVER';}
}
export function catanAffordable(player:CatanPlayerState,kind:keyof typeof BUILDING_COSTS) {return resources.every(r=>player.resources[r]>=(BUILDING_COSTS[kind][r]||0));}
function pay(state:CatanState,player:CatanPlayerState,kind:keyof typeof BUILDING_COSTS){for(const r of resources){const n=BUILDING_COSTS[kind][r]||0;player.resources[r]-=n;state.bank[r]+=n;}}
function validCards(cards:unknown):cards is Partial<ResourceCount> {
  return Boolean(cards&&typeof cards==='object'&&!Array.isArray(cards)&&Object.entries(cards).every(([r,n])=>resources.includes(r as ResourceType)&&Number.isSafeInteger(n)&&n>=0&&n<=95));
}
function normalized(cards:Partial<ResourceCount>):ResourceCount {return {...empty(),...cards};}
export function reduceCatan(previous:CatanState,command:CatanCommand,actor:string,random=Math.random):CatanState {
  if(previous.winner||!command||typeof command!=='object')return previous;
  const state:CatanState=structuredClone(previous),player=state.players[state.activePlayerIndex];
  const who=state.players.find(p=>p.id===actor);if(!who)return previous;
  const active=player.id===actor;
  if(!active&&command.type!=='DISCARD'&&command.type!=='REPLY_TRADE')return previous;
  const main=state.gamePhase==='MAIN_ACTION',setup=state.gamePhase==='SETUP_1'||state.gamePhase==='SETUP_2';
  if(state.pendingDev&&!['PLENTY','MONOPOLY'].includes(command.type))return previous;
  if(state.robberVictims.length&&command.type!=='STEAL')return previous;
  switch(command.type){
    case 'SETTLEMENT':{
      if(!(setup&&state.setupSubStep==='settlement')&&!main)return previous;
      if(!canCatanSettle(state,command.vertex,player,setup)||(!setup&&!catanAffordable(player,'settlement')))return previous;
      if(!setup)pay(state,player,'settlement');
      player.settlements.push(command.vertex);state.lastPlacedVertexId=command.vertex;
      if(setup){
        state.setupSubStep='road';
        if(state.gamePhase==='SETUP_2')for(const h of state.board.hexes.filter(h=>h.vertexIds.includes(command.vertex)&&h.resource))if(state.bank[h.resource!]>0){player.resources[h.resource!]++;state.bank[h.resource!]--;}
      }
      break;
    }
    case 'CITY':{
      if(!main||player.cities.length>=4||!player.settlements.includes(command.vertex)||!catanAffordable(player,'city'))return previous;
      pay(state,player,'city');player.settlements=player.settlements.filter(v=>v!==command.vertex);player.cities.push(command.vertex);break;
    }
    case 'ROAD':{
      if(!(setup&&state.setupSubStep==='road')&&!main)return previous;
      if(!canCatanRoad(state,command.edge,player,setup)||(!setup&&!state.freeRoads&&!catanAffordable(player,'road')))return previous;
      if(!setup){if(state.freeRoads)state.freeRoads--;else pay(state,player,'road');}
      player.roads.push(command.edge);
      if(setup){
        state.setupSubStep='settlement';state.lastPlacedVertexId=null;
        if(state.gamePhase==='SETUP_1'){
          if(state.activePlayerIndex===state.players.length-1)state.gamePhase='SETUP_2';else state.activePlayerIndex++;
        }else if(state.activePlayerIndex===0)state.gamePhase='ROLL';else state.activePlayerIndex--;
      }
      break;
    }
    case 'ROLL':{
      if(state.gamePhase!=='ROLL')return previous;
      state.dice=[Math.floor(random()*6)+1,Math.floor(random()*6)+1];const sum=state.dice[0]+state.dice[1];state.lastDiceSum=sum;
      state.log.unshift(`${player.name} würfelt ${sum}.`);state.lastRollProducingHexIds=[];
      if(sum===7){
        state.pendingDiscards={};for(const p of state.players)if(totalResources(p.resources)>7)state.pendingDiscards[p.id]=Math.floor(totalResources(p.resources)/2);
        state.gamePhase=Object.keys(state.pendingDiscards).length?'ROBBER_DISCARD':'ROBBER_MOVE';state.robberReturnPhase='MAIN_ACTION';
      }else{
        const gains=state.players.map(()=>empty());
        for(const h of state.board.hexes)if(h.number===sum&&h.id!==state.robberHexId&&h.resource){
          state.lastRollProducingHexIds.push(h.id);
          state.players.forEach((p,i)=>gains[i][h.resource!]+=h.vertexIds.reduce((n,v)=>n+(p.settlements.includes(v)?1:0)+(p.cities.includes(v)?2:0),0));
        }
        for(const r of resources){const demand=gains.reduce((n,g)=>n+g[r],0);if(demand<=state.bank[r]){state.bank[r]-=demand;state.players.forEach((p,i)=>p.resources[r]+=gains[i][r]);}}
        state.gamePhase='MAIN_ACTION';
      }
      break;
    }
    case 'DISCARD':{
      const amount=state.pendingDiscards[actor];
      if(state.gamePhase!=='ROBBER_DISCARD'||!amount||!validCards(command.cards)||totalResources(command.cards)!==amount||resources.some(r=>(command.cards[r]||0)>who.resources[r]))return previous;
      for(const r of resources){const n=command.cards[r]||0;who.resources[r]-=n;state.bank[r]+=n;}
      delete state.pendingDiscards[actor];if(!Object.keys(state.pendingDiscards).length)state.gamePhase='ROBBER_MOVE';break;
    }
    case 'ROBBER':{
      const hex=state.board.hexes.find(h=>h.id===command.hex);
      if(state.gamePhase!=='ROBBER_MOVE'||!hex||hex.id===state.robberHexId)return previous;
      state.robberHexId=hex.id;
      state.robberVictims=state.players.filter(p=>p.id!==actor&&totalResources(p.resources)>0&&hex.vertexIds.some(v=>p.settlements.includes(v)||p.cities.includes(v))).map(p=>p.id);
      if(!state.robberVictims.length)state.gamePhase=state.robberReturnPhase;break;
    }
    case 'STEAL':{
      if(!state.robberVictims.includes(command.victim))return previous;
      const victim=state.players.find(p=>p.id===command.victim)!;
      const hand=resources.flatMap(r=>Array(victim.resources[r]).fill(r) as ResourceType[]);
      const resource=hand[Math.floor(random()*hand.length)];if(resource){victim.resources[resource]--;player.resources[resource]++;}
      state.robberVictims=[];state.gamePhase=state.robberReturnPhase;break;
    }
    case 'BANK':{
      if(!main||!resources.includes(command.give)||!resources.includes(command.get)||command.give===command.get)return previous;
      const harbors=catanHarbors(state,player),ratio=harbors.includes(command.give)?2:harbors.includes('generic')?3:4;
      if(player.resources[command.give]<ratio||state.bank[command.get]<1)return previous;
      player.resources[command.give]-=ratio;state.bank[command.give]+=ratio;player.resources[command.get]++;state.bank[command.get]--;break;
    }
    case 'TRADE':{
      const target=state.players.find(p=>p.id===command.target);
      if(!main||!target||target.id===actor||!validCards(command.offer)||!validCards(command.request)||!totalResources(command.offer)||!totalResources(command.request)||resources.some(r=>(command.offer[r]||0)>player.resources[r]||(command.request[r]||0)>target.resources[r]||((command.offer[r]||0)>0&&(command.request[r]||0)>0)))return previous;
      state.pendingTrade={from:actor,target:target.id,offer:normalized(command.offer),request:normalized(command.request)};break;
    }
    case 'REPLY_TRADE':{
      const trade=state.pendingTrade;if(!main||!trade||trade.target!==actor)return previous;
      if(command.accept){
        const from=state.players.find(p=>p.id===trade.from)!;
        if(resources.some(r=>from.resources[r]<trade.offer[r]||who.resources[r]<trade.request[r]))return previous;
        for(const r of resources){from.resources[r]+=trade.request[r]-trade.offer[r];who.resources[r]+=trade.offer[r]-trade.request[r];}
      }
      state.pendingTrade=null;break;
    }
    case 'BUY_DEV':{
      if(!main||!state.devCardDeck.length||!catanAffordable(player,'devCard'))return previous;
      pay(state,player,'devCard');const card=state.devCardDeck.pop()!;player.devCards[card]++;(state.bought[actor] ||= devEmpty())[card]++;break;
    }
    case 'PLAY_DEV':{
      if(!(main||state.gamePhase==='ROLL')||state.playedDev||command.card==='victoryPoint'||!Object.hasOwn(player.devCards,command.card)||player.devCards[command.card]-(state.bought[actor]?.[command.card]||0)<1)return previous;
      if(command.card==='roadBuilding'&&(player.roads.length>=15||!state.board.edges.some(e=>canCatanRoad(state,e.id,player))))return previous;
      if(command.card==='yearOfPlenty'&&totalResources(state.bank)===0)return previous;
      player.devCards[command.card]--;state.playedDev=true;
      if(command.card==='knight'){player.playedKnights++;state.robberReturnPhase=state.gamePhase as 'ROLL'|'MAIN_ACTION';state.gamePhase='ROBBER_MOVE';}
      else if(command.card==='roadBuilding'){state.freeRoads=Math.min(2,15-player.roads.length);}
      else state.pendingDev=command.card;
      break;
    }
    case 'PLENTY':{
      if(state.pendingDev!=='yearOfPlenty'||!Array.isArray(command.choices)||command.choices.length!==Math.min(2,totalResources(state.bank))||!command.choices.every(r=>resources.includes(r)))return previous;
      for(const r of resources)if(command.choices.filter(c=>c===r).length>state.bank[r])return previous;
      for(const r of command.choices){state.bank[r]--;player.resources[r]++;}state.pendingDev=null;break;
    }
    case 'MONOPOLY':{
      if(state.pendingDev!=='monopoly'||!resources.includes(command.resource))return previous;
      for(const p of state.players)if(p.id!==actor){player.resources[command.resource]+=p.resources[command.resource];p.resources[command.resource]=0;}state.pendingDev=null;break;
    }
    case 'END':{
      if(!main)return previous;
      if(state.freeRoads&&state.board.edges.some(e=>canCatanRoad(state,e.id,player)))return previous;
      state.activePlayerIndex=(state.activePlayerIndex+1)%state.players.length;state.bought[state.players[state.activePlayerIndex].id]=devEmpty();state.playedDev=false;state.freeRoads=0;state.pendingTrade=null;state.gamePhase='ROLL';state.lastRollProducingHexIds=[];break;
    }
    default:return previous;
  }
  updateAwards(state);state.revision=previous.revision+1;
  if(state.log.length>40)state.log.length=40;
  return state;
}
export function chooseCatanMove(state:CatanState):{actor:string;command:CatanCommand}|null {
  if(state.winner)return null;
  const p=state.players[state.activePlayerIndex],id=p.id;
  const discarded=state.players.find(p=>p.isAi&&state.pendingDiscards[p.id]);
  if(discarded){const cards=empty(),held={...discarded.resources};for(let n=0;n<state.pendingDiscards[discarded.id];n++){const r=[...resources].sort((a,b)=>held[b]-held[a])[0];cards[r]++;held[r]--;}return {actor:discarded.id,command:{type:'DISCARD',cards}};}
  const trade=state.pendingTrade,target=state.players.find(p=>p.id===trade?.target);
  if(trade&&target?.isAi)return {actor:target.id,command:{type:'REPLY_TRADE',accept:totalResources(trade.offer)>=totalResources(trade.request)}};
  if(!p.isAi)return null;
  if(state.robberVictims.length)return {actor:id,command:{type:'STEAL',victim:state.robberVictims[0]}};
  if(state.pendingDev==='yearOfPlenty'){
    const bank={...state.bank},choices:ResourceType[]=[];
    for(let i=0;i<2;i++){const r=[...resources].filter(r=>bank[r]>0).sort((a,b)=>p.resources[a]-p.resources[b])[0];if(r){choices.push(r);bank[r]--;}}
    return {actor:id,command:{type:'PLENTY',choices}};
  }
  if(state.pendingDev==='monopoly')return {actor:id,command:{type:'MONOPOLY',resource:[...resources].sort((a,b)=>state.players.reduce((n,q)=>n+(q.id!==id?q.resources[b]-q.resources[a]:0),0))[0]}};
  if(state.gamePhase==='ROBBER_MOVE'){
    const hexes=state.board.hexes.filter(h=>h.id!==state.robberHexId);
    const value=(h:typeof hexes[number])=>h.pips*state.players.reduce((n,q)=>n+(q.id===id?-2:1)*h.vertexIds.filter(v=>q.settlements.includes(v)||q.cities.includes(v)).length,0);
    return {actor:id,command:{type:'ROBBER',hex:hexes.sort((a,b)=>value(b)-value(a))[0].id}};
  }
  const setup=state.gamePhase==='SETUP_1'||state.gamePhase==='SETUP_2';
  if(setup&&state.setupSubStep==='settlement'||state.gamePhase==='MAIN_ACTION'&&catanAffordable(p,'settlement')){
    const vertices=state.board.vertices.filter(v=>canCatanSettle(state,v.id,p,setup));
    const value=(v:typeof vertices[number])=>v.adjacentHexIds.reduce((sum,h)=>sum+state.board.hexes.find(hex=>hex.id===h)!.pips,0);
    if(vertices.length)return {actor:id,command:{type:'SETTLEMENT',vertex:vertices.sort((a,b)=>value(b)-value(a))[0].id}};
  }
  if(state.gamePhase==='ROLL')return {actor:id,command:{type:'ROLL'}};
  if(state.gamePhase==='MAIN_ACTION'&&catanAffordable(p,'city')&&p.cities.length<4&&p.settlements.length)return {actor:id,command:{type:'CITY',vertex:p.settlements[0]}};
  if(setup&&state.setupSubStep==='road'||state.gamePhase==='MAIN_ACTION'&&(state.freeRoads||catanAffordable(p,'road'))){
    const roads=state.board.edges.filter(e=>canCatanRoad(state,e.id,p,setup));
    if(roads.length)return {actor:id,command:{type:'ROAD',edge:roads[0].id}};
  }
  if(state.gamePhase==='MAIN_ACTION'){
    for(const card of ['knight','roadBuilding','yearOfPlenty','monopoly'] as const)if(!state.playedDev&&p.devCards[card]-(state.bought[id]?.[card]||0)>0)return {actor:id,command:{type:'PLAY_DEV',card}};
    if(catanAffordable(p,'devCard')&&state.devCardDeck.length)return {actor:id,command:{type:'BUY_DEV'}};
    const harbors=catanHarbors(state,p);
    for(const give of resources){const ratio=harbors.includes(give)?2:harbors.includes('generic')?3:4;const get=[...resources].filter(r=>r!==give&&state.bank[r]>0).sort((a,b)=>p.resources[a]-p.resources[b])[0];if(get&&p.resources[give]>=ratio&&p.resources[give]>p.resources[get]+ratio)return {actor:id,command:{type:'BANK',give,get}};}
    return {actor:id,command:{type:'END'}};
  }
  return null;
}
/** Private hands and development-card order are never sent to an opponent. */
export function catanView(state:CatanState,userId:string):CatanState {
  const view=structuredClone(state);view.devCardDeck=[];(view as any).devCardCount=state.devCardDeck.length;view.bought=state.bought[userId]?{[userId]:state.bought[userId]}:{};
  for(const p of view.players)if(p.id!==userId){(p as any).resourceTotal=totalResources(p.resources);p.resources=empty();if(!state.winner){p.victoryPoints-=p.devCards.victoryPoint;p.devCards=devEmpty();}}
  return view;
}
