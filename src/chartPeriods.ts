import {addDays,dayStart,DAY,type report} from './domain';
export type DateRange={from:string;to:string};
export type Granularity='day'|'week'|'month';
export const periodLength=(range:DateRange)=>Math.round((dayStart(range.to)-dayStart(range.from))/DAY)+1;
export function rangeEndingAt(to:string,length:number,bounds:DateRange):DateRange{
 const end=to<bounds.from?bounds.from:to>bounds.to?bounds.to:to;
 const safeLength=Number.isFinite(length)?Math.min(periodLength(bounds),Math.max(1,Math.floor(length))):1;
 return {from:[bounds.from,addDays(end,1-safeLength)].sort().at(-1)!,to:end};
}
export function shiftPeriod(range:DateRange,direction:-1|1,bounds:DateRange):DateRange{
 const length=periodLength(range),to=addDays(range.to,direction*length);
 // Keep the window's length at the beginning/end of available history.
 const end=[bounds.to,[addDays(bounds.from,length-1),to].sort().at(-1)!].sort()[0];
 return rangeEndingAt(end,length,bounds);
}
export function bucketDaily(daily:ReturnType<typeof report>['daily'],granularity:Granularity){
 type Bucket={date:string;endDate:string;previousDate:string;previousEndDate:string;revenue:number;profit:number;count:number;previous:{revenue:number;profit:number;count:number}};
 const groups=new Map<string,Bucket>();
 for(const d of daily){
  const key=granularity==='day'?d.date:granularity==='month'?d.date.slice(0,7):addDays(d.date,-((new Date(d.date+'T12:00Z').getUTCDay()+6)%7));
  let b=groups.get(key);
  if(!b){b={date:d.date,endDate:d.date,previousDate:addDays(d.date,-daily.length),previousEndDate:addDays(d.date,-daily.length),revenue:0,profit:0,count:0,previous:{revenue:0,profit:0,count:0}};groups.set(key,b);}
  b.endDate=d.date;b.previousEndDate=addDays(d.date,-daily.length);
  for(const metric of ['revenue','profit','count'] as const){b[metric]+=d[metric];b.previous[metric]+=d.previous[metric];}
 }
 return [...groups.values()];
}
