import {createContext,useContext,useLayoutEffect,useRef,useState,type ReactNode,type RefObject} from 'react';

export const easeOut=[.22,1,.36,1] as const;
export const settle={type:'spring',stiffness:420,damping:38,mass:.9} as const;
export const MotionPreference=createContext(false);
export const useMinimalMotion=()=>useContext(MotionPreference);

// Rearm only after a full exit, so tiny movements at the viewport edge do not restart motion.
export function useReplayInView(ref:RefObject<Element|null>,stableParent=false){
 const [visible,setVisible]=useState(false);
 useLayoutEffect(()=>{
  const el=stableParent?ref.current?.parentElement:ref.current;if(!el)return;
  if(typeof IntersectionObserver==='undefined'){setVisible(true);return;}
  const observer=new IntersectionObserver(([entry])=>{
   if(!entry.isIntersecting)setVisible(false);
   else if(entry.intersectionRatio>=.12)setVisible(true);
  },{threshold:[0,.12]});
  observer.observe(el);return()=>observer.disconnect();
 },[ref,stableParent]);
 return visible;
}

// Animate only independent surfaces. Nested controls and coupon artwork keep their geometry.
const surfaces=[
 '.kpi','.sales-chart','.opportunity','.overview-bottom > .panel','.page-toolbar',
 '.campaign-card','.table-container','.segment-panel','.editor-form','.editor-preview',
 '.studio-heading','.studio-toolbar','.coupon-canvas','.variant-strip','.ai-panel',
 '.brand-board > .panel','.brand-preview','.data-grid > .panel','.experiment-grid > .panel',
 '.assistant-welcome','.assistant-compose','.assistant-exchange',
 '.network-map-teaser','.map-summary','.ask-bar','.footnote','.route-content > .panel',
].join(',');

export function PageEntrance({children}:{children:ReactNode}){
 const ref=useRef<HTMLDivElement>(null),minimal=useMinimalMotion();
 useLayoutEffect(()=>{
  const root=ref.current;
  if(!root||minimal||typeof Element.prototype.animate!=='function')return;
  const elements=new Set<HTMLElement>(),entered=new Set<Element>();
  const animations=new Map<HTMLElement,Animation>();
  const reveal=(el:HTMLElement,delay=0)=>{
   animations.get(el)?.cancel();
   const animation=el.animate([
    {opacity:0,transform:'translate3d(0,18px,0)'},
    {opacity:1,transform:'translate3d(0,0,0)'},
   ],{duration:720,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
   animations.set(el,animation);
   animation.onfinish=()=>animations.delete(el);
  };
  const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting){
     entered.delete(entry.target);
     animations.get(entry.target as HTMLElement)?.cancel();
     animations.delete(entry.target as HTMLElement);
    }else if(entry.intersectionRatio>=.08&&!entered.has(entry.target)){
     entered.add(entry.target);reveal(entry.target as HTMLElement);
    }
   }
  },{threshold:[0,.08]});
  const discover=()=>{
   for(const el of elements)if(!root.contains(el)){
    observer?.unobserve(el);animations.get(el)?.cancel();animations.delete(el);entered.delete(el);elements.delete(el);
   }
   const candidates=[...root.querySelectorAll<HTMLElement>(surfaces)];
   const fresh=candidates.filter(el=>!elements.has(el)&&!candidates.some(parent=>parent!==el&&parent.contains(el)));
   // Read positions together; only transforms and opacity change during the reveal.
   const positions=fresh.map(el=>({el,rect:el.getBoundingClientRect()}));
   let visible=0;
   for(const {el,rect} of positions){
    elements.add(el);observer?.observe(el);
    if(rect.width&&rect.height&&rect.top<window.innerHeight&&rect.bottom>0){
     entered.add(el);reveal(el,70+Math.min(visible++,6)*55);
    }
   }
  };
  discover();
  // Lazy routes and newly added cards can arrive after PageEntrance mounts.
  let frame=0;
  const mutations=new MutationObserver(records=>{
   if(frame||!records.some(record=>[...record.addedNodes,...record.removedNodes].some(node=>node instanceof Element)))return;
   frame=requestAnimationFrame(()=>{frame=0;discover();});
  });
  mutations.observe(root,{childList:true,subtree:true});
  return()=>{mutations.disconnect();cancelAnimationFrame(frame);observer?.disconnect();for(const animation of animations.values())animation.cancel();};
 },[minimal]);
 return <div ref={ref} className="route-content">{children}</div>;
}

export function DashboardSkeleton({progress,error}:{progress:number;error:string}){
 return <div className="dashboard-loading" aria-busy={!error}>
  <div className="loading-caption" role="status"><span className="loading-brand" aria-hidden="true"><i/><i/><i/></span><div><strong>{error||'Собираем картину вашей сети'}</strong><p>{error?'Обновите страницу, чтобы повторить загрузку.':`Магазины, продажи и покупатели · ${progress}%`}</p></div></div>
  {!error&&<div className="skeleton-dashboard" aria-hidden="true"><div className="skeleton-kpis">{[0,1,2,3].map(i=><div key={i}><i/><b/><i/></div>)}</div><div className="skeleton-panels"><div className="skeleton-chart"><i/><div className="skeleton-grid"/></div><div className="skeleton-card"><i/><b/><i/><i/></div></div></div>}
 </div>;
}
