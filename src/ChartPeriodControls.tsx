import {useEffect,useState} from 'react';
import {CalendarDays,ChevronLeft,ChevronRight,RotateCcw} from 'lucide-react';
import {Button,Modal} from './ui';
import {addDays,dateRu} from './domain';
import {periodLength,rangeEndingAt,shiftPeriod,type DateRange,type Granularity} from './chartPeriods';

const presets=[7,14,28,90];
const nextMonth=(month:string,n:number)=>{const d=new Date(month+'-01T12:00Z');d.setUTCMonth(d.getUTCMonth()+n);return d.toISOString().slice(0,7);};
export function ChartPeriodControls({range,bounds,granularity,onGranularity,onChange,onOpenChange}:{range:DateRange;bounds:DateRange;granularity:Granularity;onGranularity:(v:Granularity)=>void;onChange:(range:DateRange)=>void;onOpenChange?:(open:boolean)=>void}){
 const [open,setOpen]=useState(false),length=periodLength(range);
 useEffect(()=>{onOpenChange?.(open);},[open,onOpenChange]);
 return <>
  <div className="chart-period-controls">
   <div className="chart-period-main"><div className="chart-period-stepper"><button aria-label="Предыдущий период" disabled={range.from<=bounds.from} onClick={()=>onChange(shiftPeriod(range,-1,bounds))}><ChevronLeft size={15}/></button><button className="chart-period-trigger" onClick={()=>setOpen(true)} aria-haspopup="dialog"><CalendarDays size={14}/><span>{dateRu(range.from,true)} — {dateRu(range.to,true)}</span></button><button aria-label="Следующий период" disabled={range.to>=bounds.to} onClick={()=>onChange(shiftPeriod(range,1,bounds))}><ChevronRight size={15}/></button></div>
    <label className="chart-granularity">По<select aria-label="Группировка графика" value={granularity} onChange={e=>onGranularity(e.target.value as Granularity)}><option value="day">дням</option><option value="week">неделям</option><option value="month">месяцам</option></select></label>
   </div>
   <div className="chart-period-shortcuts"><div className="chart-presets" role="group" aria-label="Длина периода">{presets.map(n=><button key={n} className={length===n?'selected':''} aria-pressed={length===n} onClick={()=>onChange(rangeEndingAt(range.to,n,bounds))}>{n} дней</button>)}<button className={!presets.includes(length)?'selected':''} onClick={()=>setOpen(true)}>Свой период</button></div><button className="chart-latest" onClick={()=>onChange(rangeEndingAt(bounds.to,28,bounds))} title={'Последние 28 дней по '+dateRu(bounds.to)}><RotateCcw size={12}/>К последним данным</button></div>
  </div>
  {open&&<CalendarRange range={range} bounds={bounds} onClose={()=>setOpen(false)} onApply={value=>{onChange(value);setOpen(false);}}/>}
 </>;
}

function CalendarRange({range,bounds,onClose,onApply}:{range:DateRange;bounds:DateRange;onClose:()=>void;onApply:(value:DateRange)=>void}){
 const [draft,setDraft]=useState(range),[month,setMonth]=useState(range.from.slice(0,7)),[choosingEnd,setChoosingEnd]=useState(false),[days,setDays]=useState(String(periodLength(range)));
 const changeDraft=(next:DateRange)=>{setDraft(next);const length=periodLength(next);if(Number.isFinite(length)&&length>0)setDays(String(length));};
 const valid=/^\d{4}-\d{2}-\d{2}$/.test(draft.from)&&/^\d{4}-\d{2}-\d{2}$/.test(draft.to)&&draft.from<=draft.to&&draft.from>=bounds.from&&draft.to<=bounds.to;
 const choose=(date:string)=>{if(!choosingEnd){setDraft({from:date,to:date});setDays('1');setChoosingEnd(true);}else{const sorted=[draft.from,date].sort(),next={from:sorted[0],to:sorted[1]};setDraft(next);setDays(String(periodLength(next)));setChoosingEnd(false);}};
 const chooseLength=(n:number)=>{const next=rangeEndingAt(draft.to||bounds.to,n,bounds);setDraft(next);setDays(String(periodLength(next)));setMonth(next.from.slice(0,7));setChoosingEnd(false);};
 return <Modal title="Период графика" wide onClose={onClose}>
  <p className="calendar-instruction">{choosingEnd?'Теперь выберите последний день периода.':'Выберите начало и конец на календаре или введите даты.'}</p>
  <div className="calendar-fields"><label className="field"><span>Начало периода</span><input type="date" value={draft.from} min={bounds.from} max={bounds.to} onChange={e=>{changeDraft({...draft,from:e.target.value});if(e.target.value)setMonth(e.target.value.slice(0,7));setChoosingEnd(false);}}/></label><label className="field"><span>Конец периода</span><input type="date" value={draft.to} min={draft.from||bounds.from} max={bounds.to} onChange={e=>{changeDraft({...draft,to:e.target.value});setChoosingEnd(false);}}/></label><label className="field"><span>Количество дней</span><div className="calendar-length"><input type="number" min="1" max={periodLength(bounds)} value={days} onChange={e=>setDays(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&Number.isFinite(Number(days))&&Number(days)>0)chooseLength(Number(days));}}/><Button disabled={!Number.isFinite(Number(days))||Number(days)<1} onClick={()=>chooseLength(Number(days))}>Задать</Button></div></label></div>
  <div className="calendar-month-nav"><Button aria-label="Предыдущий месяц" disabled={month<=bounds.from.slice(0,7)} onClick={()=>setMonth(nextMonth(month,-1))}><ChevronLeft size={16}/></Button><span>{choosingEnd?'Выберите конец':'Начало → конец'}</span><Button aria-label="Следующий месяц" disabled={month>=bounds.to.slice(0,7)} onClick={()=>setMonth(nextMonth(month,1))}><ChevronRight size={16}/></Button></div>
  <div className="calendar-months">{[month,nextMonth(month,1)].map((m,index)=>{
   const first=m+'-01',offset=(new Date(first+'T12:00Z').getUTCDay()+6)%7;
   return <section className={'calendar-month month-'+index} key={m}><h3>{new Date(first+'T12:00Z').toLocaleDateString('ru-RU',{month:'long',year:'numeric',timeZone:'UTC'})}</h3><div className="calendar-days">{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(day=><span className="calendar-weekday" key={day}>{day}</span>)}{Array.from({length:42},(_,i)=>{
    const date=addDays(first,i-offset),outside=date.slice(0,7)!==m,disabled=outside||date<bounds.from||date>bounds.to,endpoint=date===draft.from||date===draft.to,inside=date>draft.from&&date<draft.to;
    return <button key={date} type="button" disabled={disabled} className={[outside?'outside':'',endpoint?'endpoint':'',inside?'inside':'',date===bounds.to?'latest-day':''].join(' ')} aria-label={dateRu(date)+' '+date.slice(0,4)} aria-pressed={!outside&&(endpoint||inside)} onClick={()=>choose(date)}>{Number(date.slice(8))}</button>;
   })}</div></section>;
  })}</div>
  <div className="calendar-bottom"><div className="calendar-presets">{presets.map(n=><Button key={n} onClick={()=>chooseLength(n)}>{n} дней</Button>)}</div><small>Последние данные: {dateRu(bounds.to)} {bounds.to.slice(0,4)}</small></div>
  <div className="calendar-confirm"><div>{valid?<><b>{dateRu(draft.from,true)} — {dateRu(draft.to,true)}</b><small>{periodLength(draft)} дней · сравнение с предыдущим периодом той же длины</small></>:<small className="negative">Выберите корректные даты внутри доступной истории.</small>}</div><Button primary disabled={!valid} onClick={()=>onApply(draft)}>Применить период</Button></div>
 </Modal>;
}
