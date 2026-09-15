import {useEffect,useId,useMemo,useRef,useState,type PointerEvent} from 'react';
import {AnimatePresence,motion,useInView} from 'motion/react';
import {ArrowDownRight,ArrowUpRight,ChevronDown} from 'lucide-react';
import {type report,num,compact,dateRu,localDay} from './domain';
import {Count,Tabs} from './ui';
import {chartPoints,chartScale,monotonePath,nearestChartIndex} from './chartGeometry';
import {easeOut,useMinimalMotion} from './Motion';
import {useStore} from './store';
import {bucketDaily,type Granularity} from './chartPeriods';
import {ChartPeriodControls} from './ChartPeriodControls';

type Metric='revenue'|'profit'|'count';
export function SalesChart({r,onSelect}:{r:ReturnType<typeof report>;onSelect?:(from:string,to:string)=>void}){
 const [metric,setMetric]=useState<Metric>('revenue'),[hover,setHover]=useState<number|null>(null),[table,setTable]=useState(false),[granularity,setGranularity]=useState<Granularity>('day');
 const minimal=useMinimalMotion(),id=useId().replace(/:/g,''),ref=useRef<SVGSVGElement>(null),inView=useInView(ref,{once:true,amount:.2});
 const [start,setStart]=useState<number|null>(null),[tooltipVisible,setTooltipVisible]=useState(false),[calendarOpen,setCalendarOpen]=useState(false),[ready,setReady]=useState(minimal);
 const drag=useRef<{index:number;x:number}|null>(null),hoverTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const hideTooltip=()=>{if(hoverTimer.current)clearTimeout(hoverTimer.current);hoverTimer.current=undefined;setTooltipVisible(false);};
 const clearHover=()=>{setHover(null);hideTooltip();};
 const data=useStore(s=>s.data);
 const days=useMemo(()=>bucketDaily(r.daily,granularity),[r,granularity]);
 const bounds=useMemo(()=>({from:data?.start||days[0]?.date||'2026-05-17',to:data?.receipts.length?data.receipts.reduce((last,receipt)=>{const day=localDay(receipt.at);return day>last?day:last;},data.start):days.at(-1)?.date||'2026-09-13'}),[data]);
 const periodLabel=(from:string,to:string)=>from===to?dateRu(from,true):`${dateRu(from,true)} — ${dateRu(to,true)}`;
 const value=(n:number)=>metric==='count'?num(n):compact(n);
 const axisValue=(n:number)=>metric==='count'?num(n):Math.abs(n)>=100000000?`${num(n/100000000,1)} млн`:Math.abs(n)>=100000?`${num(n/100000,0)} тыс.`:num(n/100);
 const {scale,points,previous,line,oldLine,area}=useMemo(()=>{
  const scale=chartScale(days.flatMap(d=>[d[metric],d.previous[metric]]));
  const points=chartPoints(days.map(d=>d[metric]),scale.y),previous=chartPoints(days.map(d=>d.previous[metric]),scale.y);
  const line=monotonePath(points),oldLine=monotonePath(previous);
  const area=points.length>1?`${line} L${points.at(-1)!.x},${scale.y(0)} L${points[0].x},${scale.y(0)} Z`:'';
  return {scale,points,previous,line,oldLine,area};
 },[days,metric]);
 useEffect(()=>{clearHover();setStart(null);drag.current=null;return()=>{if(hoverTimer.current)clearTimeout(hoverTimer.current);};},[r,metric,granularity]);
 useEffect(()=>{if(calendarOpen)clearHover();},[calendarOpen]);
 const active=hover!==null&&days[hover]?hover:null,datum=active===null?null:days[active];
 const delta=datum&&datum.previous[metric]!==0?(datum[metric]-datum.previous[metric])/Math.abs(datum.previous[metric])*100:null;
 const periodKey=granularity+'-'+days[0]?.date+'-'+days.at(-1)?.endDate;
 useEffect(()=>{setReady(minimal);},[periodKey,minimal]);
 const indexAt=(event:PointerEvent<SVGRectElement>)=>{
  const svg=ref.current;if(!svg)return 0;
  const rect=svg.getBoundingClientRect();
  return nearestChartIndex((event.clientX-rect.left)/rect.width*800,days.length);
 };
 const duration=minimal?0:.55;
 return <section className="sales-chart" aria-labelledby={id+'-title'}>
  <div className="split"><h2 id={id+'-title'}>Динамика продаж</h2><Tabs value={metric} onChange={v=>setMetric(v as Metric)} options={[{value:'revenue',label:'Выручка'},{value:'profit',label:'Прибыль'},{value:'count',label:'Чеки'}]}/></div>
  {onSelect&&days.length>0&&<ChartPeriodControls range={{from:days[0].date,to:days.at(-1)!.endDate}} bounds={bounds} granularity={granularity} onGranularity={setGranularity} onOpenChange={setCalendarOpen} onChange={range=>onSelect(range.from,range.to)}/>}
  <div className="chart-heading"><div><strong><Count value={r[metric]} format={value}/></strong><span className="chart-unit">{metric==='count'?'Чеки продаж':metric==='profit'?'Валовая прибыль, ₽':'Выручка после скидок и возвратов, ₽'}</span></div><div className="chart-legend"><span><i/>Текущий период</span><span><i className="previous-swatch"/>Предыдущий период</span></div></div>
  <div className="chart-plot">
   <svg ref={ref} viewBox="0 0 800 296" role="group" aria-label={`График ${granularity==='day'?'по дням':granularity==='week'?'по неделям':'по месяцам'}. ${value(r[metric])}`}>
    <desc>Точки соответствуют суммам чеков за выбранную группировку. Для выбора точки используйте стрелки. Все значения доступны в таблице ниже.</desc>
    <defs>
     <linearGradient id={id+'-ribbon'} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#FFD3A5"/><stop offset=".45" stopColor="#FF996A"/><stop offset="1" stopColor="#E36C42"/></linearGradient>
     <radialGradient id={id+'-bead'} cx="32%" cy="25%"><stop stopColor="#FFF1CE"/><stop offset=".5" stopColor="#FFBE87"/><stop offset="1" stopColor="#E8784B"/></radialGradient>
     <linearGradient id={id+'-fill'} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#FCA26E" stopOpacity=".19"/><stop offset="1" stopColor="#F25835" stopOpacity=".015"/></linearGradient>
     <clipPath id={id+'-reveal'}><motion.rect key={periodKey} x="0" y="0" height="296" initial={minimal?false:{width:0}} animate={{width:inView||minimal?800:0}} transition={{duration:minimal?0:1.15,ease:easeOut,delay:minimal?0:.18}} onAnimationComplete={()=>{if(inView||minimal)setReady(true);}}/></clipPath>
    </defs>
    {scale.ticks.map(t=><g key={t}><line x1="72" x2="760" y1={scale.y(t)} y2={scale.y(t)} stroke={t===0?'#53575A':'#3B3F42'} strokeDasharray={t===0?undefined:'2 6'}/><text className="chart-y-label" x="56" y={scale.y(t)+4} textAnchor="end">{axisValue(t)}</text></g>)}
    <g clipPath={`url(#${id}-reveal)`} key={periodKey}>
     <motion.path initial={false} animate={{d:area}} fill={`url(#${id}-fill)`} transition={{duration,ease:easeOut}}/>
     <motion.path initial={false} animate={{d:oldLine}} fill="none" stroke="#93999D" strokeWidth="1.6" strokeDasharray="4 6" strokeLinecap="round" transition={{duration,ease:easeOut}}/>
     <motion.path initial={false} animate={{d:line}} fill="none" stroke="#F59A72" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transition={{duration,ease:easeOut}}/>
     {points.length===1&&<><circle cx={points[0].x} cy={previous[0].y} r="3" fill="#93999D"/><circle cx={points[0].x} cy={points[0].y} r="4" fill="#FF8055"/></>}
     {points.length>1&&<motion.circle initial={false} animate={{cx:points.at(-1)!.x,cy:points.at(-1)!.y}} r="4" fill={`url(#${id}-bead)`} stroke="#3D2D25" strokeWidth="1.7" transition={{duration,ease:easeOut}}/>}
    </g>
    {days.map((d,i)=>(i===0||i===days.length-1||i%Math.max(1,Math.ceil((days.length-1)/4))===0&&i<days.length-3)&&<text key={d.date} x={points[i].x} y="280" textAnchor={i===0?'start':i===days.length-1?'end':'middle'}>{dateRu(d.date,true)}</text>)}
    {start!==null&&active!==null&&points[start]&&<g pointerEvents="none"><rect x={Math.min(points[start].x,points[active].x)} y="42" width={Math.max(2,Math.abs(points[start].x-points[active].x))} height="208" fill="#FF8055" fillOpacity=".13"/><line x1={points[start].x} x2={points[start].x} y1="42" y2="250" stroke="#FFAD8E" strokeWidth="1"/><line x1={points[active].x} x2={points[active].x} y1="42" y2="250" stroke="#FFAD8E" strokeWidth="1"/></g>}
    {active!==null&&start===null&&ready&&!calendarOpen&&<g className="chart-cursor" pointerEvents="none"><line x1={points[active].x} x2={points[active].x} y1="42" y2="250" stroke="#858B90" strokeDasharray="2 5"/><circle cx={points[active].x} cy={previous[active].y} r="3" fill="#969CA0" stroke="#25282A" strokeWidth="2"/><circle cx={points[active].x} cy={points[active].y} r="11" fill="#FF8055" fillOpacity=".13"/><circle cx={points[active].x} cy={points[active].y} r="4.5" fill="#FF8055" stroke="#FFF0E9" strokeWidth="2"/></g>}
    {days.length>0&&<rect className="chart-interaction" x="60" y="36" width="712" height="220" fill="transparent" tabIndex={0} role="slider" aria-label="Период на графике" aria-valuemin={1} aria-valuemax={days.length} aria-valuenow={(active??days.length-1)+1} aria-valuetext={periodLabel(days[active??days.length-1].date,days[active??days.length-1].endDate)+': '+value(days[active??days.length-1][metric])}
     onFocus={()=>{if(!drag.current){setHover(days.length-1);setTooltipVisible(true);}}} onBlur={clearHover}
     onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End','Escape'].includes(e.key)){e.preventDefault();if(e.key==='Escape'){clearHover();setStart(null);drag.current=null;return;}setTooltipVisible(true);setHover(i=>e.key==='Home'?0:e.key==='End'?days.length-1:Math.max(0,Math.min(days.length-1,(i??days.length-1)+(e.key==='ArrowLeft'?-1:1))));}}}
     onPointerMove={e=>{const index=indexAt(e);setHover(index);if(drag.current||!ready||calendarOpen)return;if(!tooltipVisible&&!hoverTimer.current)hoverTimer.current=setTimeout(()=>{hoverTimer.current=undefined;setTooltipVisible(true);},180);}}
     onPointerLeave={()=>{if(!drag.current)clearHover();}}
     onPointerDown={e=>{if(e.button!==0)return;hideTooltip();const index=indexAt(e);setHover(index);if(onSelect){drag.current={index,x:e.clientX};setStart(index);e.currentTarget.setPointerCapture(e.pointerId);}}}
     onPointerUp={e=>{const selected=drag.current,end=indexAt(e);drag.current=null;setStart(null);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(selected&&selected.index!==end&&Math.abs(e.clientX-selected.x)>5){clearHover();onSelect?.(days[Math.min(selected.index,end)].date,days[Math.max(selected.index,end)].endDate);}else if(ready){setHover(end);setTooltipVisible(true);}}}
     onLostPointerCapture={()=>{drag.current=null;setStart(null);}}
     onPointerCancel={()=>{drag.current=null;setStart(null);clearHover();}}/>}
   </svg>
   <AnimatePresence>{datum&&active!==null&&tooltipVisible&&ready&&!calendarOpen&&start===null&&<motion.div className="chart-tooltip" key="tooltip" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:3}} transition={{duration:minimal?0:.15}} style={{left:`clamp(112px, ${points[active].x/8}%, calc(100% - 112px))`}}><div className="split"><b>{periodLabel(datum.date,datum.endDate)}</b><span>{delta===null?'—':`${delta>=0?'+':''}${num(delta,1)}%`}</span></div><strong>{value(datum[metric])}</strong><small>{periodLabel(datum.previousDate,datum.previousEndDate)} · {value(datum.previous[metric])}</small>{delta!==null&&<span className={'chart-change '+(delta>=0?'up':'down')}>{delta>=0?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>}К предыдущему периоду</span>}</motion.div>}</AnimatePresence>
  </div>
  <div className="chart-footer"><span>{start!==null&&active!==null?`Выбрано: ${periodLabel(days[Math.min(start,active)].date,days[Math.max(start,active)].endDate)}`:granularity==='day'?(onSelect?'Потяните крестиком для выбора периода':'Каждая точка — один день'):granularity==='week'?'Суммы по неделям · включая неполные':'Суммы по месяцам · включая неполные'}</span><button className="chart-table-button" aria-expanded={table} aria-controls={id+'-table'} onClick={()=>setTable(!table)}>Таблица значений<ChevronDown size={13} style={{transform:table?'rotate(180deg)':undefined}}/></button></div>
  <AnimatePresence initial={false}>{table&&<motion.div id={id+'-table'} initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:minimal?0:.28,ease:easeOut}} style={{overflow:'hidden'}}><div className="chart-table"><table><caption className="sr-only">Значения графика за выбранные интервалы</caption><thead><tr><th scope="col">Дата</th><th scope="col">Текущий период</th><th scope="col">Предыдущий период</th></tr></thead><tbody>{days.map(d=><tr key={d.date}><td>{periodLabel(d.date,d.endDate)}</td><td>{value(d[metric])}</td><td>{value(d.previous[metric])}</td></tr>)}</tbody></table></div></motion.div>}</AnimatePresence>
 </section>;
}
