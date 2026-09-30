import {useState} from 'react';
import {dateRu,money,num} from './domain';
import type {storeAverageCheck} from './storeAverageCheck';

export function MapAverageCheck({report,mode,onModeChange:setMode}:{report:ReturnType<typeof storeAverageCheck>;mode:'visits'|'average';onModeChange:(mode:'visits'|'average')=>void}){
 const [hover,setHover]=useState<number|null>(null);
 const isAverage=mode==='average',format=(value:number)=>isAverage?money(value):num(value);
 const daily=report.daily.map(day=>({...day,value:isAverage?day.value:day.count}));
 const now=isAverage?report.now:report.count,before=isAverage?report.before:report.previousCount;
 const change=before!==null&&before>0&&now!==null?(now/before-1)*100:null;
 const points=daily.flatMap((p,i)=>p.value===null?[]:[{...p,value:p.value,i}]);
 const min=Math.min(...points.map(p=>p.value)),max=Math.max(...points.map(p=>p.value)),span=max-min||Math.max(max*.1,100);
 const x=(i:number)=>8+i/Math.max(1,daily.length-1)*264,y=(v:number)=>70-(v-min)/span*52;
 let connected=false;const path=daily.map((p,i)=>{if(p.value===null){connected=false;return '';}const command=connected?'L':'M';connected=true;return `${command}${x(i)},${y(p.value)}`;}).join(' ');
 const active=hover===null?null:daily[hover];
 return <section className="map-average-check" aria-label="Показатель магазина">
  <div className="map-point-metric-toggle" role="group" aria-label="Показатель графика">{([['visits','Визиты'],['average','Средний чек']] as const).map(([value,label])=><button key={value} aria-pressed={mode===value} onClick={()=>{setMode(value);setHover(null);}}>{label}</button>)}</div>
  <div className="map-average-title"><b>{isAverage?'Средний чек':'Визиты'}</b><span className={change!==null&&change<0?'falling':''}>{change===null?'Нет сравнения':`${change>=0?'+':''}${num(change,1)}%`}</span></div>
  <div className="map-average-values"><div><small>Прошлый период</small><strong>{before===null?'—':format(before)}</strong></div><span aria-hidden="true">→</span><div><small>Выбранный период</small><strong>{now===null?'—':format(now)}</strong></div></div>
  <p className="map-average-period">{dateRu(report.previousFrom)} — {dateRu(report.previousTo)} → {dateRu(daily[0].date)} — {dateRu(daily.at(-1)!.date)}</p>
  {points.length?<><div className="map-average-chart" onPointerMove={e=>{const box=e.currentTarget.getBoundingClientRect();setHover(Math.max(0,Math.min(daily.length-1,Math.round((e.clientX-box.left)/box.width*(daily.length-1)))));}}><div className="map-average-axis"><span>{format(min)}</span><span>{format(max)}</span></div><svg viewBox="0 0 280 88" role="img" aria-label={isAverage?'Средний чек по дням, в рублях':'Визиты по дням'}><path d="M8 76H272" stroke="currentColor" opacity=".14"/><path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{points.map(p=><circle key={p.date} cx={x(p.i)} cy={y(p.value)} r={hover===p.i?4:points.length===1?4:2} fill="currentColor" tabIndex={0} onFocus={()=>setHover(p.i)} onPointerDown={()=>setHover(p.i)}><title>{dateRu(p.date)}: {format(p.value)}</title></circle>)}</svg><div className="map-average-axis"><span>{dateRu(daily[0].date)}</span><span>{dateRu(daily.at(-1)!.date)}</span></div></div>
  <div className="map-average-readout" aria-live="polite">{active?`${dateRu(active.date)} · ${active.value===null?'Нет чеков':format(active.value)}`:`По дням · ${num(report.count)} чеков`}</div>
  </>:<p className="map-average-readout">За выбранный период нет чеков</p>}
  <small className="map-average-note">{isAverage?'После скидок, без возвратов.':'Один чек продажи — один визит.'} Сравнение с предыдущим периодом той же длины.</small>
 </section>;
}
