import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Enlarge only the board; game controls and the current match stay mounted. */
export function BoardSurface({name,children,minBoardWidth=0,maxWidth=960}:{name:string;children:ReactNode;minBoardWidth?:number;maxWidth?:number}) {
  const [zoom,setZoom]=useState(1);
  const [fit,setFit]=useState(false);
  const pan=useRef<HTMLDivElement>(null);
  const [viewportWidth,setViewportWidth]=useState(0);
  useEffect(()=>{
    const element=pan.current;if(!element)return;
    const observer=new ResizeObserver(()=>setViewportWidth(element.clientWidth));
    observer.observe(element);setViewportWidth(element.clientWidth);
    return ()=>observer.disconnect();
  },[]);
  const needsPan=zoom>1 || (!fit&&viewportWidth>0&&minBoardWidth>viewportWidth);
  return <div className="board-surface" style={{maxWidth}}>
    <div className="board-size-controls" role="group" aria-label={`${name}: Brettgröße`}>
      <span>Brettgröße</span>
      <button type="button" aria-label={`${name}: Brett verkleinern`} disabled={zoom<=1} onClick={()=>setZoom(value=>Math.max(1,value-.25))}>−</button>
      <output aria-label={`${name}: Vergrößerung`}>{Math.round(zoom*100)} %</output>
      <button type="button" aria-label={`${name}: Brett vergrößern`} disabled={zoom>=2} onClick={()=>setZoom(value=>Math.min(2,value+.25))}>+</button>
      <button type="button" onClick={()=>{setFit(true);setZoom(1);}}>Einpassen</button>
      {minBoardWidth>0 && fit && <button type="button" onClick={()=>{setFit(false);setZoom(1);}}>Große Felder</button>}
    </div>
    <div ref={pan} className="board-pan-area" tabIndex={0} role="region" aria-label={`${name}: verschiebbares Spielbrett`} onKeyDown={event=>{
      if(event.target!==event.currentTarget)return;
      if((event.key==='ArrowLeft'||event.key==='ArrowRight')&&event.currentTarget.scrollWidth>event.currentTarget.clientWidth){
        event.preventDefault();event.currentTarget.scrollBy({left:event.key==='ArrowRight'?88:-88,behavior:'instant'});
      }
    }}>
      <div className="board-surface-content" style={{width:`${zoom*100}%`,minWidth:fit?0:minBoardWidth}}>{children}</div>
    </div>
    {needsPan && <p className="board-pan-hint">Zum Verschieben über freie Brettflächen wischen. „Einpassen“ zeigt das gesamte Brett.</p>}
  </div>;
}
