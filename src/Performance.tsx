import {useEffect,useState} from 'react';

// Keep animation on modest hardware while reducing the cost of glass compositing.
export function useEffectQuality(motion:string){
 const [quality,setQuality]=useState<'full'|'balanced'>('full');
 useEffect(()=>{
  if(motion==='full'){setQuality('full');return;}
  const device=navigator as Navigator&{deviceMemory?:number;connection?:{saveData?:boolean}};
  setQuality((device.hardwareConcurrency&&device.hardwareConcurrency<=4)||(device.deviceMemory&&device.deviceMemory<=4)||device.connection?.saveData?'balanced':'full');
 },[motion]);
 useEffect(()=>{document.documentElement.dataset.effects=quality;return()=>{delete document.documentElement.dataset.effects;};},[quality]);
 return quality;
}
