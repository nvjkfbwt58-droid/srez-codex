import {createContext,useContext,useLayoutEffect,useRef,type ReactNode} from 'react';

export const easeOut=[.22,1,.36,1] as const;
export const settle={type:'spring',stiffness:420,damping:38,mass:.9} as const;
export const MotionPreference=createContext(false);
export const useMinimalMotion=()=>useContext(MotionPreference);

// Animate only independent surfaces. Nested controls and coupon artwork keep their geometry.
const surfaces=[
 '.kpi','.sales-chart','.opportunity','.overview-bottom > .panel','.page-toolbar',
 '.campaign-card','.table-container','.segment-panel','.editor-form','.editor-preview',
 '.studio-heading','.studio-toolbar','.coupon-canvas','.variant-strip','.ai-panel',
 '.brand-board > .panel','.brand-preview','.data-grid > .panel','.experiment-grid > .panel',
 '.assistant-intro','.ask-bar','.footnote','.route-content > .panel',
].join(',');

export function PageEntrance({children}:{children:ReactNode}){
 const ref=useRef<HTMLDivElement>(null),minimal=useMinimalMotion();
 useLayoutEffect(()=>{
  const root=ref.current;
  if(!root||minimal||typeof Element.prototype.animate!=='function')return;
  const candidates=[...root.querySelectorAll<HTMLElement>(surfaces)];
  const elements=candidates.filter(el=>!candidates.some(parent=>parent!==el&&parent.contains(el)));
  const animations=new Set<Animation>();
  const reveal=(el:HTMLElement,delay=0)=>{
   const animation=el.animate([
    {opacity:0,transform:'translate3d(0,18px,0)'},
    {opacity:1,transform:'translate3d(0,0,0)'},
   ],{duration:720,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
   animations.add(animation);
   animation.onfinish=()=>animations.delete(animation);
  };
  const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting){reveal(entry.target as HTMLElement);observer?.unobserve(entry.target);}
  },{threshold:.08});
  // Read all positions before starting animations to avoid repeated layout calculations.
  const positions=elements.map(el=>({el,rect:el.getBoundingClientRect()}));
  let visible=0;
  for(const {el,rect} of positions){
   if(!rect.width||!rect.height)continue;
   if(rect.top<window.innerHeight&&rect.bottom>0)reveal(el,70+Math.min(visible++,6)*55);
   else observer?.observe(el);
  }
  return()=>{observer?.disconnect();for(const animation of animations)animation.cancel();};
 },[minimal]);
 return <div ref={ref} className="route-content">{children}</div>;
}

export function DashboardSkeleton({progress,error}:{progress:number;error:string}){
 return <div className="dashboard-loading" aria-busy={!error}>
  <div className="loading-caption" role="status"><span className="loading-brand" aria-hidden="true"><i/><i/><i/></span><div><strong>{error||'Собираем картину вашей сети'}</strong><p>{error?'Обновите страницу, чтобы повторить загрузку.':`Магазины, продажи и покупатели · ${progress}%`}</p></div></div>
  {!error&&<div className="skeleton-dashboard" aria-hidden="true"><div className="skeleton-kpis">{[0,1,2,3].map(i=><div key={i}><i/><b/><i/></div>)}</div><div className="skeleton-panels"><div className="skeleton-chart"><i/><div className="skeleton-grid"/></div><div className="skeleton-card"><i/><b/><i/><i/></div></div></div>}
 </div>;
}
