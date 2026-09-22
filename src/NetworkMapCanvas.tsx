import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import type {Map as LibreMap,Marker} from 'maplibre-gl';
import {MapSchematic} from './MapSchematic';
import {mapStores,schematicPoint} from './networkMapData';
import {useMinimalMotion} from './Motion';

export interface MapHandle {zoom:(direction:number)=>void;fit:(ids?:string[])=>void;tilt:()=>void;}
interface Props {selected:string[];focused:string|null;labels:Record<string,string>;onPick:(id:string)=>void;onStatus:(state:string)=>void;schematic:boolean;}
export const NetworkMapCanvas=forwardRef<MapHandle,Props>(function NetworkMapCanvas({selected,focused,labels,onPick,onStatus,schematic},ref){
 const container=useRef<HTMLDivElement>(null),map=useRef<LibreMap|null>(null),markers=useRef<Map<string,{marker:Marker;button:HTMLButtonElement}>>(new Map());
 const latest=useRef({selected,focused,labels,onPick,onStatus});latest.current={selected,focused,labels,onPick,onStatus};
 const [live,setLive]=useState(false),[scale,setScale]=useState(1),[offset,setOffset]=useState({x:0,y:0});
 const drag=useRef<{id:number;x:number;y:number;ox:number;oy:number}|null>(null),minimal=useMinimalMotion();
 const fit=(ids?:string[])=>{const points=mapStores.filter(s=>!ids?.length||ids.includes(s.id));if(!points.length)return;
  if(map.current&&live){map.current.fitBounds([[Math.min(...points.map(s=>s.lng)),Math.min(...points.map(s=>s.lat))],[Math.max(...points.map(s=>s.lng)),Math.max(...points.map(s=>s.lat))]],{padding:65,maxZoom:13,duration:minimal?0:800});}
  else {setScale(1);setOffset({x:0,y:0});}
 };
 useImperativeHandle(ref,()=>({zoom:direction=>{if(map.current&&live)map.current.zoomTo(map.current.getZoom()+direction,{duration:minimal?0:300});else setScale(s=>Math.min(3,Math.max(1,s+direction*.3)));},fit,tilt:()=>{if(map.current&&live)map.current.easeTo({pitch:map.current.getPitch()>10?0:45,bearing:0,duration:minimal?0:700});}}));
 useEffect(()=>{
  let closed=false;setLive(false);latest.current.onStatus(schematic?'schematic':'loading');
  if(schematic)return;
  let timeout:ReturnType<typeof setTimeout>|undefined,resize:ResizeObserver|undefined;
  const fallback=()=>{if(closed)return;clearTimeout(timeout);resize?.disconnect();setLive(false);latest.current.onStatus('fallback');map.current?.remove();map.current=null;markers.current.clear();};
  void Promise.all([import('maplibre-gl'),import('maplibre-gl/dist/maplibre-gl.css')]).then(([lib])=>{
   if(closed||!container.current)return;
   try{
    const m=new lib.Map({container:container.current,style:'https://tiles.openfreemap.org/styles/positron',center:[37.60,55.73],zoom:10,pitch:0,attributionControl:false,maxZoom:17,minZoom:8,renderWorldCopies:false,pixelRatio:Math.min(window.devicePixelRatio||1,1.5),maxBounds:[[36.9,55.3],[38.3,56.05]]});
    map.current=m;m.addControl(new lib.AttributionControl({compact:true}),'bottom-right');
    m.scrollZoom.disable();m.dragRotate.disable();m.touchZoomRotate.disableRotation();
    m.fitBounds([[37.35,55.53],[37.81,55.86]],{padding:65,duration:0});
    m.once('load',()=>{
     if(closed)return;clearTimeout(timeout);
     const style=m.getStyle();
     for(const layer of style.layers){const id=layer.id.toLowerCase();
      if(layer.type==='background')m.setPaintProperty(layer.id,'background-color','#eeeee8');
      if(layer.type==='fill'&&id.includes('water'))m.setPaintProperty(layer.id,'fill-color','#b7cdd0');
      else if(layer.type==='fill'&&/park|wood|grass/.test(id))m.setPaintProperty(layer.id,'fill-color','#d5dfcd');
      else if(layer.type==='fill'&&id.includes('building'))m.setPaintProperty(layer.id,'fill-color','#dddcd3');
      if(layer.type==='symbol'&&/poi|housenumber|aerodrome/.test(id))m.setLayoutProperty(layer.id,'visibility','none');
     }
     for(const store of mapStores){
      const host=document.createElement('div');host.className='map-marker-host';
      const button=document.createElement('button');button.type='button';button.className='store-pin';
      const dot=document.createElement('span');dot.className='store-pin-dot';dot.textContent=store.id.slice(1).padStart(2,'0');
      const label=document.createElement('span');label.className='store-pin-label';label.textContent=store.name;
      button.append(dot,label);host.append(button);button.addEventListener('click',()=>latest.current.onPick(store.id));
      const marker=new lib.Marker({element:host,anchor:'bottom'}).setLngLat([store.lng,store.lat]).addTo(m);markers.current.set(store.id,{marker,button});
     }
     updateMarkers();setLive(true);latest.current.onStatus('live');
    });
    m.on('error',()=>{if(!m.isStyleLoaded())fallback();});
    m.on('webglcontextlost',fallback);
    timeout=setTimeout(fallback,9000);
    resize=new ResizeObserver(()=>m.resize());resize.observe(container.current);
   }catch{fallback();}
  }).catch(fallback);
  function updateMarkers(){for(const store of mapStores){const entry=markers.current.get(store.id);if(!entry)continue;const current=latest.current;entry.button.classList.toggle('selected',current.selected.includes(store.id));entry.button.classList.toggle('focused',current.focused===store.id);entry.button.setAttribute('aria-pressed',String(current.selected.includes(store.id)));entry.button.setAttribute('aria-label',`${store.name}: ${current.labels[store.id]}. Выбрать магазин`);entry.button.querySelector('.store-pin-label')!.textContent=store.name+' · '+current.labels[store.id];}}
  return()=>{closed=true;clearTimeout(timeout);resize?.disconnect();map.current?.remove();map.current=null;markers.current.clear();};
 },[schematic]);
 useEffect(()=>{for(const store of mapStores){const entry=markers.current.get(store.id);if(!entry)continue;entry.button.classList.toggle('selected',selected.includes(store.id));entry.button.classList.toggle('focused',focused===store.id);entry.button.setAttribute('aria-pressed',String(selected.includes(store.id)));entry.button.setAttribute('aria-label',`${store.name}: ${labels[store.id]}. Выбрать магазин`);entry.button.querySelector('.store-pin-label')!.textContent=store.name+' · '+labels[store.id];}},[selected,focused,labels,live]);
 useEffect(()=>{if(!focused||!map.current||!live)return;const store=mapStores.find(s=>s.id===focused)!;map.current.easeTo({center:[store.lng,store.lat],zoom:Math.max(map.current.getZoom(),12),duration:minimal?0:750});},[focused,live,minimal]);
 return <div className="network-map-canvas">
  {!live&&<div className="schematic-viewport" aria-label="Демонстрационная схема магазинов" onPointerDown={e=>{if((e.target as Element).closest('button'))return;drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,ox:offset.x,oy:offset.y};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{const d=drag.current;if(d?.id===e.pointerId)setOffset({x:Math.min(240,Math.max(-240,d.ox+e.clientX-d.x)),y:Math.min(200,Math.max(-200,d.oy+e.clientY-d.y))});}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
   <div className="schematic-world" style={{transform:`translate(${offset.x}px,${offset.y}px) scale(${scale})`}}><MapSchematic/>{mapStores.map(store=>{const point=schematicPoint(store.lng,store.lat);return <div key={store.id} className="schematic-marker" style={{left:point.x+'%',top:point.y+'%'}}><button type="button" className={'store-pin '+(selected.includes(store.id)?'selected ':'')+(focused===store.id?'focused':'')} aria-label={`${store.name}: ${labels[store.id]}. Выбрать магазин`} aria-pressed={selected.includes(store.id)} onClick={()=>onPick(store.id)}><span className="store-pin-dot">{store.id.slice(1).padStart(2,'0')}</span><span className="store-pin-label">{store.name} · {labels[store.id]}</span></button></div>;})}</div>
  </div>}
  <div ref={container} className={'maplibre-surface '+(live?'ready':'')} aria-label="Карта магазинов Москвы"/>
 </div>;
});
