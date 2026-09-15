import {useEffect,useLayoutEffect,useId,useRef,useState,lazy,Suspense,type ReactNode,type ButtonHTMLAttributes} from 'react';
import {animate,motion,useInView} from 'motion/react';
import type {ColumnDef} from '@tanstack/react-table';
import {X,Search,ChevronLeft,ChevronRight,Download,Columns3,ArrowUpDown} from 'lucide-react';
import {useStore} from './store';
import {num} from './domain';
import {easeOut,settle,useMinimalMotion} from './Motion';
export const motionTokens={fast:.14,base:.22,expressive:.36,ease:[.22,1,.36,1] as const};
export function Button({children,primary=false,className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{primary?:boolean}){return <button {...props} className={`button ${primary?'primary':''} ${className}`}>{children}</button>}
export function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}){return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>}
export function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){
 const ref=useRef<HTMLDialogElement>(null),closing=useRef(false),minimal=useMinimalMotion(),id=useId();
 useLayoutEffect(()=>{
  const previous=document.activeElement as HTMLElement,d=ref.current!;
  d.showModal();
  const animation=!minimal&&typeof d.animate==='function'?d.animate([{opacity:0,transform:'translateY(14px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:340,easing:'cubic-bezier(.22,1,.36,1)'}):null;
  return()=>{animation?.cancel();d.close();previous?.focus();};
 },[]);
 const close=()=>{
  if(closing.current)return;
  const d=ref.current;
  if(minimal||!d||typeof d.animate!=='function'){onClose();return;}
  closing.current=true;d.classList.add('closing');
  const animation=d.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(8px) scale(.985)'}],{duration:150,easing:'ease-in',fill:'forwards'});
  animation.finished.then(onClose).catch(()=>{});
 };
 return <dialog ref={ref} aria-labelledby={id} className={wide?'wide':''} onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}><header><h2 id={id}>{title}</h2><Button aria-label="Закрыть" onClick={close}><X size={18}/></Button></header>{children}</dialog>;
}
export function Tabs({value,options,onChange}:{value:string;options:{value:string;label:string}[];onChange:(s:string)=>void}){
 const id=useId(),minimal=useMinimalMotion();
 return <div className="tabs" role="tablist">{options.map(x=><button key={x.value} role="tab" aria-selected={value===x.value} className={value===x.value?'active':''} onClick={()=>onChange(x.value)}>{value===x.value&&<motion.span layoutId={'tabs-'+id} className="tab-bg" transition={minimal?{duration:0}:settle}/>}<span>{x.label}</span></button>)}</div>;
}
export function Count({value,format=(n:number)=>num(Math.round(n))}:{value:number;format?:(n:number)=>string}){
 const ref=useRef<HTMLSpanElement>(null),current=useRef<number|undefined>(undefined),formatter=useRef(format);
 const minimal=useMinimalMotion(),visible=useInView(ref,{once:true,amount:.2});
 formatter.current=format;
 useLayoutEffect(()=>{
  const el=ref.current;if(!el)return;
  if(minimal){el.textContent=formatter.current(value);current.current=value;return;}
  if(!visible){if(current.current===undefined)el.textContent=formatter.current(0);return;}
  const first=current.current===undefined;
  const control=animate(current.current??0,value,{duration:first?1.05:.55,delay:first ? .12 : 0,ease:easeOut,onUpdate:n=>{current.current=n;el.textContent=formatter.current(n);},onComplete:()=>{current.current=value;el.textContent=formatter.current(value);}});
  return()=>control.stop();
 },[value,minimal,visible]);
 return <span className="count"><span className="count-measure" aria-hidden="true">{format(value)}</span><span className="count-value" aria-hidden="true" ref={ref}>{format(value)}</span><span className="sr-only">{format(value)}</span></span>;
}
export function GrowBar({value,vertical=false,color,delay=0}:{value:number;vertical?:boolean;color?:string;delay?:number}){
 const minimal=useMinimalMotion();
 return <motion.i initial={minimal?false:{[vertical?'scaleY':'scaleX']:0}} whileInView={{scaleX:1,scaleY:1}} viewport={{once:true,amount:.1}} animate={vertical?{height:value+'px'}:{width:value+'%'}} transition={{duration:minimal?0:.8,ease:easeOut,delay:minimal?0:delay}} style={{transformOrigin:vertical?'50% 100%':'0 50%',background:color}}/>;
}
export function download(name:string,contents:Blob|string,type='text/plain'){const url=URL.createObjectURL(contents instanceof Blob?contents:new Blob([contents],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
export function csv(rows:Record<string,unknown>[],name='srez-export.csv'){if(!rows.length)return;const keys=Object.keys(rows[0]);const escape=(v:unknown)=>{let s=String(v??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};download(name,'\uFEFF'+[keys,...rows.map(r=>keys.map(k=>r[k]))].map(r=>r.map(escape).join(',')).join('\r\n'),'text/csv;charset=utf-8');}

const LazyDataTable=lazy(()=>import('./DataTable').then(m=>({default:m.DataTable})));
export function DataTable<T extends object>(props:{data:T[];columns:ColumnDef<T,any>[];onRow?:(row:T)=>void;selected?:(row:T)=>boolean;searchPlaceholder?:string;pageSize?:number;exportName?:string}){const Table=LazyDataTable as React.ComponentType<typeof props>;return <Suspense fallback={<div className="route-loading" role="status">Готовим таблицу…</div>}><Table {...props}/></Suspense>;}
