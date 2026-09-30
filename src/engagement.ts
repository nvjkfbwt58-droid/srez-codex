import {addDays,DAY,dayStart,localDay,selectReceipts,stores,type Dataset,type Filters,type Receipt} from './domain';

// Visit metrics deliberately do not read prices or product costs.
export function visits(receipts:Receipt[]){
 const sales=receipts.filter(r=>r.type==='sale'),customers=new Set(sales.flatMap(r=>r.customerId?[r.customerId]:[]));
 return {count:new Set(sales.map(r=>r.id)).size,customers:customers.size,customerIds:[...customers],items:sales.reduce((n,r)=>n+r.lines.reduce((s,l)=>s+l.quantity,0),0)};
}
export function engagementReport(data:Dataset,filters:Filters){
 const length=Math.max(1,Math.min(366,Math.round((dayStart(filters.to)-dayStart(filters.from))/DAY)+1));
 const receipts=selectReceipts(data,filters),previous=selectReceipts(data,{...filters,from:addDays(filters.from,-length),to:addDays(filters.from,-1)});
 const currentStores=new Map<string,Receipt[]>(),previousStores=new Map<string,Receipt[]>(),days=new Map<string,Receipt[]>();
 for(const r of receipts){const list=currentStores.get(r.storeId)||[];list.push(r);currentStores.set(r.storeId,list);const day=localDay(r.at),daily=days.get(day)||[];daily.push(r);days.set(day,daily);}
 for(const r of previous){const list=previousStores.get(r.storeId)||[];list.push(r);previousStores.set(r.storeId,list);}
 return {...visits(receipts),receipts,previous:visits(previous),stores:stores.map(s=>({...s,...visits(currentStores.get(s.id)||[]),previous:visits(previousStores.get(s.id)||[])})),daily:Array.from({length},(_,i)=>{const date=addDays(filters.from,i);return {date,...visits(days.get(date)||[])};})};
}
