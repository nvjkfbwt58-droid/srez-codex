import {useEffect,useRef} from 'react';
import {useInView} from 'motion/react';
import {useMinimalMotion} from './Motion';

export function GlassAtmosphere(){
 const ref=useRef<HTMLDivElement>(null),minimal=useMinimalMotion(),visible=useInView(ref,{amount:.01});
 useEffect(()=>{
  const root=ref.current;if(!root||minimal||!visible||typeof Element.prototype.animate!=='function')return;
  let stopped=false;const active=new Set<Animation>();
  const elements=[...root.querySelectorAll<HTMLElement>('i')];
  const visibility=()=>{for(const animation of active)document.hidden?animation.pause():animation.play();};
  document.addEventListener('visibilitychange',visibility);
  const drift=async(element:HTMLElement,index:number)=>{
   let previous={transform:'translate3d(0,0,0) rotate(0deg) scale(1,1)',opacity:1};
   element.style.willChange='transform, opacity';
   while(!stopped){
    // Visual randomness only: independent, bounded destinations avoid a visible loop.
    const x=(Math.random()-.5)*70,y=(Math.random()-.5)*48,rotation=(Math.random()-.5)*14;
    const scaleX=.94+Math.random()*.18,scaleY=.92+Math.random()*.17;
    const next={transform:`translate3d(${x}px,${y}px,0) rotate(${rotation}deg) scale(${scaleX},${scaleY})`,opacity:.82+Math.random()*.18};
    const animation=element.animate([previous,next],{duration:12000+Math.random()*8000+index*1100,easing:'cubic-bezier(.45,0,.55,1)',fill:'forwards'});
    active.add(animation);if(document.hidden)animation.pause();
    try{await animation.finished;}catch{return;}
    if(stopped)return;
    element.style.transform=next.transform;element.style.opacity=String(next.opacity);
    active.delete(animation);animation.cancel();previous=next;
   }
  };
  elements.forEach((element,index)=>{if(element.offsetWidth)void drift(element,index);});
  return()=>{stopped=true;document.removeEventListener('visibilitychange',visibility);for(const animation of active)animation.cancel();for(const element of elements){element.style.willChange='';element.style.transform='';element.style.opacity='';}};
 },[minimal,visible]);
 return <div ref={ref} className="assistant-atmosphere" aria-hidden="true"><i/><i/><i/></div>;
}
