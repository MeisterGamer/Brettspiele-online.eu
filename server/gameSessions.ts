import { initialChess, reduceChess, chooseChessMove, type ChessState } from '../src/services/chessEngine';
import { initialDraughts, reduceDraughts, chooseDraughtsMove, type DraughtsState } from '../src/services/draughtsEngine';
import { initialMahjong, reduceMahjong, chooseMahjongMove, type MahjongState } from '../src/services/mahjongEngine';
import { initialCatan, reduceCatan, chooseCatanMove, catanView, type CatanState } from '../src/services/catanEngine';
import { gamesCatalog } from '../src/data/gamesCatalog';
import type { GameRoom, RoomParticipant } from '../src/types';
import { randomInt } from 'node:crypto';

export const authoritativeEngines=new Set(['chess','checkers','mahjong','catan']);
type State=ChessState|DraughtsState|MahjongState|CatanState;
interface Session {engine:string;round:number;roster:string;participants:RoomParticipant[];state:State;commands:Map<string,number>;timer?:ReturnType<typeof setTimeout>}
const random=()=>randomInt(0,0x100000000)/0x100000000;
export class GameSessions {
  private sessions=new Map<string,Session>();
  constructor(private changed:(room:GameRoom)=>void,private getRoom:(code:string)=>GameRoom|undefined){}
  private initial(engine:string,participants:RoomParticipant[]):State {
    if(engine==='chess')return initialChess();
    if(engine==='checkers')return initialDraughts();
    if(engine==='mahjong')return initialMahjong(participants);
    return initialCatan(participants,random);
  }
  private get(room:GameRoom):Session {
    const engine=gamesCatalog.find(g=>g.id===room.gameId)?.engine;
    if(!engine||!authoritativeEngines.has(engine))throw new Error('Dieses Spiel hat keine passende Spielsitzung.');
    let session=this.sessions.get(room.code);
    const round=room.roundNumber||0;
    const roster=room.participants.map(p=>p.id).join('|');
    if(!session||session.round!==round||session.engine!==engine||(session.state.revision===0&&session.roster!==roster)){
      this.reset(room.code);
      const participants=structuredClone(room.participants);
      if(['chess','checkers'].includes(engine)&&participants.length===1)participants.push({...participants[0],id:`${room.code}-bot`,name:'KI-Gegner',isBot:true,isHost:false,seatIndex:1});
      session={engine,round,roster,participants,state:this.initial(engine,participants),commands:new Map()};
      this.sessions.set(room.code,session);
    }
    this.schedule(room,session);
    return session;
  }
  read(room:GameRoom,userId:string) {
    const session=this.get(room);
    const state=session.engine==='catan'?catanView(session.state as CatanState,userId):structuredClone(session.state);
    return {state:{...state,participants:structuredClone(session.participants)},round:session.round};
  }
  dispatch(room:GameRoom,userId:string,payload:any) {
    const session=this.get(room),command=payload?.command;
    if(!payload||typeof payload.commandId!=='string'||payload.commandId.length>100||!command||typeof command!=='object'||Array.isArray(command))throw new Error('Ungültiger Spielbefehl.');
    if(session.commands.has(payload.commandId))return this.read(room,userId);
    if(payload.round!==session.round||payload.baseRevision!==session.state.revision)throw new Error('Der Spielstand wurde aktualisiert. Bitte führe den Zug erneut aus.');
    if((command.type==='RESET_LAYOUT'||command.type==='START_LEVEL')&&session.engine==='mahjong') {
      if(!room.participants.some(p=>p.id===userId&&p.isHost))throw new Error('Nur der Host darf den Aufbau ändern.');
      if(command.type==='START_LEVEL'?(!Number.isInteger(command.level)||command.level<1||command.level>50):!['turtle','pyramid','fortress'].includes(command.layout))throw new Error('Ungültiger Aufbau oder Level.');
      session.state={...initialMahjong(session.participants,command.layout,Date.now(),command.type==='START_LEVEL'?command.level:undefined),revision:session.state.revision+1};
    }else{
      const next=this.reduce(session,userId,command);
      if(next===session.state)throw new Error('Dieser Zug ist nicht erlaubt oder du bist nicht am Zug.');
      session.state=next;
    }
    session.commands.set(payload.commandId,session.state.revision);
    if(session.commands.size>1000)session.commands.delete(session.commands.keys().next().value!);
    room.status='in-game';
    this.changed(room);this.schedule(room,session);
    return this.read(room,userId);
  }
  private reduce(session:Session,actor:string,command:any):State {
    if(session.engine==='catan')return reduceCatan(session.state as CatanState,command,actor,random);
    if(session.engine==='mahjong'){
      const state=session.state as MahjongState;
      return state.players[state.activePlayerIndex]?.id===actor?reduceMahjong(state,command,Date.now(),random):state;
    }
    const seat=session.participants.findIndex(p=>p.id===actor);
    if(seat<0||seat>1)return session.state;
    if(session.engine==='chess'){
      const state=session.state as ChessState,color=seat===0?'w':'b';
      if(command.type==='MOVE'&&state.turn!==color)return state;
      return reduceChess(state,{...command,color});
    }
    const state=session.state as DraughtsState,color=seat===0?'red':'black';
    if(command.type==='MOVE'&&state.turn!==color)return state;
    return reduceDraughts(state,{...command,color});
  }
  private bot(session:Session):{actor:string;command:any}|null {
    if(session.engine==='catan')return chooseCatanMove(session.state as CatanState);
    const state=session.state as any;
    if(state.result||state.finished)return null;
    if(session.engine==='mahjong'){
      const player=state.players[state.activePlayerIndex];
      return player?.isAi?{actor:player.id,command:chooseMahjongMove(state,this.getRoomForSession(session)?.aiDifficulty||'normal')}:null;
    }
    const seat=state.turn==='w'||state.turn==='red'?0:1,player=session.participants[seat];
    if(!player?.isBot)return null;
    const difficulty=this.getRoomForSession(session)?.aiDifficulty||'normal';
    return {actor:player.id,command:session.engine==='chess'?chooseChessMove(state,difficulty):chooseDraughtsMove(state,difficulty)};
  }
  private getRoomForSession(session:Session) {for(const [code,s]of this.sessions)if(s===session)return this.getRoom(code);}
  private schedule(room:GameRoom,session:Session){
    if(session.timer)return;
    session.timer=setTimeout(()=>{
      session.timer=undefined;
      if(this.sessions.get(room.code)!==session||!this.getRoom(room.code))return;
      const action=this.bot(session);
      if(!action?.command)return;
      const next=this.reduce(session,action.actor,action.command);
      if(next===session.state)return;
      session.state=next;room.status='in-game';this.changed(room);this.schedule(room,session);
    },650);
    session.timer.unref();
  }
  reset(code:string){const session=this.sessions.get(code);if(session?.timer)clearTimeout(session.timer);this.sessions.delete(code);}
  hasPlayer(code:string,id:string){const s=this.sessions.get(code);return Boolean(s?.participants.some(p=>p.id===id)||(s?.state as any)?.players?.some((p:any)=>p.id===id&&!p.isAi));}
  stop(){for(const s of this.sessions.values())if(s.timer)clearTimeout(s.timer);}
  export(){return [...this.sessions].map(([code,s])=>({code,engine:s.engine,round:s.round,roster:s.roster,participants:s.participants,state:s.state,commandIds:[...s.commands]}));}
  restore(records:any[]){for(const record of records)if(record&&authoritativeEngines.has(record.engine)&&Number.isSafeInteger(record.state?.revision)&&Array.isArray(record.participants))this.sessions.set(record.code,{...record,commands:new Map(record.commandIds||[])});}
}
