import { useEffect, useRef, useState } from 'react';
import { multiplayerService } from '../../services/multiplayerService';
import { useGameRound } from './GameArena';

/** Offline and online share reducers. Online clients send commands and receive snapshots. */
export function useAuthoritativeGame<S extends {revision:number},C>(options:{
  roomCode?:string;userId?:string;engine:string;initial:()=>S;reduce:(state:S,command:C)=>S;
}) {
  const round=useGameRound();
  const [state,setState]=useState(options.initial);
  const [ready,setReady]=useState(!options.roomCode);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState('');
  const stateRef=useRef(state),settings=useRef(options),waiting=useRef(false);
  stateRef.current=state;settings.current=options;
  useEffect(()=>{
    if(!options.roomCode)return;
    let mounted=true;
    let refreshTimer:ReturnType<typeof setTimeout>|undefined;
    const request=()=>{
      if(refreshTimer)clearTimeout(refreshTimer);
      refreshTimer=setTimeout(()=>{refreshTimer=undefined;multiplayerService.sendGameAction(options.roomCode!,options.engine,'GET_STATE',{},options.userId!);},50);
    };
    const unsubscribe=multiplayerService.subscribeToGameActions(event=>{
      if(event.roomCode!==options.roomCode||event.gameType!==options.engine)return;
      if(event.action==='STATE_CHANGED'){request();return;}
      if(event.action!=='STATE'||event.senderId!=='server'||event.payload?.round!==round)return;
      const next=event.payload.state;
      if(next&&Number.isSafeInteger(next.revision)&&next.revision>=stateRef.current.revision&&mounted){
        stateRef.current=next;setState(next);setReady(true);waiting.current=false;setPending(false);
      }
    });
    const connection=multiplayerService.subscribe(event=>{
      if(event.type==='CONNECTION_STATUS'&&(event.status==='websocket'||event.status==='http'))request();
      if(event.type==='ROOM_ERROR'){setError(event.error);waiting.current=false;setPending(false);}
    });
    request();
    const timer=setInterval(()=>{if(!document.hidden&&navigator.onLine)request();},5000);
    return ()=>{mounted=false;unsubscribe();connection();clearInterval(timer);if(refreshTimer)clearTimeout(refreshTimer);};
  },[options.roomCode,options.engine,options.userId,round]);
  const send=(command:C)=>{
    setError('');
    if(!settings.current.roomCode){
      const next=settings.current.reduce(stateRef.current,command);
      if(next===stateRef.current)setError('Dieser Zug ist nach den Spielregeln nicht möglich.');
      stateRef.current=next;setState(next);return;
    }
    if(!ready||waiting.current)return;
    waiting.current=true;setPending(true);
    multiplayerService.sendGameAction(settings.current.roomCode,settings.current.engine,'COMMAND',{
      command,baseRevision:stateRef.current.revision,round,commandId:crypto.randomUUID(),
    },settings.current.userId!);
  };
  const resetLocal=()=>{const next=settings.current.initial();stateRef.current=next;setState(next);setError('');};
  return {state,send,ready,pending,error,resetLocal};
}
