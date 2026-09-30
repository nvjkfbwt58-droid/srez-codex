import {useState} from 'react';
import {dateRu,money,num} from './domain';
import type {storeAverageCheck} from './storeAverageCheck';

export function MapAverageCheck({report}:{report:ReturnType<typeof storeAverageCheck>}){
 const [hover,setHover]=useState<number|null>(null),{daily,now,before,change}=report;
 const points=daily.flatMap((p,i)=>p.value===null?[]:[{...p,value:p.value,i}]);
 const min=Math.min(...points.map(p=>p.value)),max=Math.max(...points.map(p=>p.value)),span=max-min||Math.max(max*.1,100);
 const x=(i:number)=>8+i/Math.max(1,daily.length-1)*264,y=(v:number)=>70-(v-min)/span*52;
 let connected=false;const path=daily.map((p,i)=>{if(p.value===null){connected=false;return '';}const command=connected?'L':'M';connected=true;return `${command}${x(i)},${y(p.value)}`;}).join(' ');
 const active=hover===null?null:daily[hover];
 return <section className="map-average-check" aria-label="Средний чек магазина">
  <div className="map-average-title"><b>Средний чек</b><span className={change!==null&&change<0?'falling':''}>{change===null?'Нет сравнения':`${change>=0?'+':''}${num(change,1)}%`}</span></div>
  <div className="map-average-values"><div><small>Был · прошлый период</small><strong>{before===null?'—':money(before)}</strong></div><span aria-hidden="true">→</span><div><small>Стал · выбранный период</small><strong>{now===null?'—':money(now)}</strong></div></div>
  <p className="map-average-period">{dateRu(report.previousFrom)} — {dateRu(report.previousTo)} → {dateRu(daily[0].date)} — {dateRu(daily.at(-1)!.date)}</p>
  {points.length?<><div className="map-average-chart" onPointerMove={e=>{const box=e.currentTarget.getBoundingClientRect();setHover(Math.max(0,Math.min(daily.length-1,Math.round((e.clientX-box.left)/box.width*(daily.length-1)))));}}><div className="map-average-axis"><span>{money(min)}</span><span>{money(max)}</span></div><svg viewBox="0 0 280 88" role="img" aria-label="Средний чек по дням, в рублях"><path d="M8 76H272" stroke="currentColor" opacity=".14"/><path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{points.map(p=><circle key={p.date} cx={x(p.i)} cy={y(p.value)} r={hover===p.i?4:points.length===1?4:2} fill="currentColor"><title>{dateRu(p.date)}: {money(p.value)}</title></circle>)}</svg><div className="map-average-axis"><span>{dateRu(daily[0].date)}</span><span>{dateRu(daily.at(-1)!.date)}</span></div></div>
  <div className="map-average-readout" aria-live="polite">{active?`${dateRu(active.date)} · ${active.value===null?'Нет чеков':money(active.value)}`:`По дням · ${num(report.count)} чеков`}</div>
  {daily.length>1&&<input className="map-average-slider" type="range" min="0" max={daily.length-1} value={hover??daily.length-1} aria-label="День на графике среднего чека" aria-valuetext={`${dateRu(daily[hover??daily.length-1].date)}: ${daily[hover??daily.length-1].value===null?'Нет чеков':money(daily[hover??daily.length-1].value!)}`} onChange={e=>setHover(Number(e.target.value))}/>}</>:<p className="map-average-readout">За выбранный период нет чеков</p>}
  <small className="map-average-note">После скидок, без возвратов. Сравнение с предыдущим периодом той же длины.</small>
 </section>;
}
