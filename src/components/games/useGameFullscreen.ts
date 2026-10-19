import { useEffect, useRef, useState, type RefObject } from 'react';

type FullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => void | Promise<void> };
type FullscreenDocument = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void | Promise<void> };

/** Keep the same game mounted in native fullscreen and in the mobile CSS fallback. */
export function useGameFullscreen(container: RefObject<HTMLElement | null>) {
  const [full, setFull] = useState(false);
  const active = useRef(false);
  const native = useRef(false);
  const doc = document as FullscreenDocument;
  const ownsNative = () => (doc.fullscreenElement || doc.webkitFullscreenElement) === container.current;
  const exitNative = () => {
    if (!ownsNative()) return;
    try {
      const result = doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen?.();
      void Promise.resolve(result).catch(() => {});
    } catch {}
  };
  const close = () => {
    active.current = false;
    setFull(false);
    exitNative();
  };
  const open = () => {
    const element = container.current as FullscreenElement | null;
    if (!element) return;
    active.current = true;
    setFull(true);
    // iPhone browsers and embedded browsers still get the full viewport when
    // their native fullscreen API is absent, blocked, or rejects this request.
    try {
      const result = element.requestFullscreen ? element.requestFullscreen({navigationUI:'hide'}) : element.webkitRequestFullscreen?.();
      void Promise.resolve(result).then(() => { if (!active.current) exitNative(); }).catch(() => {});
    } catch {}
  };
  useEffect(() => {
    const update = () => {
      if (ownsNative()) {native.current = true;setFull(true);}
      else if (native.current) {native.current = false;active.current = false;setFull(false);}
    };
    const escape = (event: KeyboardEvent) => {
      if (!active.current) return;
      if (event.key === 'Escape') {event.preventDefault();close();return;}
      if (event.key !== 'Tab') return;
      const element=container.current;
      if(!element)return;
      const controls=[...element.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')]
        .filter(control=>control.getClientRects().length && !control.closest('[inert]'));
      const first=controls[0],last=controls.at(-1),focus=document.activeElement;
      if(!first || !last)return;
      if(event.shiftKey && (focus===first || focus===element || !element.contains(focus))) {event.preventDefault();last.focus();}
      else if(!event.shiftKey && (focus===last || !element.contains(focus))) {event.preventDefault();first.focus();}
    };
    document.addEventListener('fullscreenchange',update);
    document.addEventListener('webkitfullscreenchange',update);
    document.addEventListener('keydown',escape);
    return () => {
      active.current = false;
      exitNative();
      document.removeEventListener('fullscreenchange',update);
      document.removeEventListener('webkitfullscreenchange',update);
      document.removeEventListener('keydown',escape);
    };
  },[]);
  useEffect(() => {
    if (!full) return;
    const body=document.body,html=document.documentElement;
    const previous={overflow:body.style.overflow,position:body.style.position,top:body.style.top,width:body.style.width,htmlOverflow:html.style.overflow};
    const x=window.scrollX,y=window.scrollY,focus=document.activeElement as HTMLElement | null;
    body.style.overflow='hidden';body.style.position='fixed';body.style.top=`-${y}px`;body.style.width='100%';html.style.overflow='hidden';
    container.current?.focus({preventScroll:true});
    return () => {
      Object.assign(body.style,{overflow:previous.overflow,position:previous.position,top:previous.top,width:previous.width});
      html.style.overflow=previous.htmlOverflow;
      window.scrollTo({left:x,top:y,behavior:'instant'});
      if(focus?.isConnected)focus.focus({preventScroll:true});
    };
  },[full]);
  return { full, toggle: () => {if (active.current) close(); else open();} };
}
