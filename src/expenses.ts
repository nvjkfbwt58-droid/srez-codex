import {z} from 'zod';
import {addDays,dayStart,DAY,stores,type Filters,type report} from './domain';
export const expensePlanSchema=z.object({storeId:z.enum(stores.map(s=>s.id) as [string,...string[]]),fromMonth:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),items:z.array(z.object({id:z.string().min(1).max(100),name:z.string().trim().min(1).max(80),amount:z.number().int().min(0).max(100_000_000_000)})).max(40)});
export type ExpensePlan=z.infer<typeof expensePlanSchema>;
export function dailyExpense(plans:ExpensePlan[],storeId:string,date:string):number|null{
 const month=date.slice(0,7),plan=plans.filter(p=>p.storeId===storeId&&p.fromMonth<=month).sort((a,b)=>b.fromMonth.localeCompare(a.fromMonth))[0];
 if(!plan)return null;
 const [year,m]=month.split('-').map(Number),days=new Date(Date.UTC(year,m,0)).getUTCDate(),day=Number(date.slice(8));
 // Spread the remaining kopecks deterministically; every date range reconciles exactly.
 return plan.items.reduce((sum,item)=>sum+Math.floor(item.amount/days)+(day<=item.amount%days?1:0),0);
}
export function expenseReport(plans:ExpensePlan[],f:Pick<Filters,'from'|'to'|'stores'>){
 const selected=f.stores.length?stores.filter(s=>f.stores.includes(s.id)):stores;
 const length=Math.round((dayStart(f.to)-dayStart(f.from))/DAY)+1;
 let missingDays=0;
 const daily=Array.from({length:Math.max(0,Math.min(3660,length))},(_,i)=>{
  const date=addDays(f.from,i),byStore=selected.map(s=>{const amount=dailyExpense(plans,s.id,date);if(amount===null)missingDays++;return{storeId:s.id,amount};});
  return{date,amount:byStore.reduce((sum,s)=>sum+(s.amount??0),0),byStore};
 });
 return{daily,total:daily.reduce((sum,d)=>sum+d.amount,0),complete:length>0&&daily.length===length&&missingDays===0,missingDays,stores:selected.map(s=>({...s,amount:daily.reduce((sum,d)=>sum+(d.byStore.find(x=>x.storeId===s.id)?.amount??0),0),complete:daily.every(d=>d.byStore.find(x=>x.storeId===s.id)?.amount!==null)}))};
}
export function hasTransactionFilters(f:Filters){return f.category!==undefined||!!f.product||!!f.min||[f.discount,f.known,f.returns].some(v=>v&&v!=='all');}
export function reportAfterExpenses(r:ReturnType<typeof report>,f:Filters,plans:ExpensePlan[]){
 const current=expenseReport(plans,f),length=r.daily.length,previous=expenseReport(plans,{...f,from:addDays(f.from,-length),to:addDays(f.from,-1)});
 const comparable=previous.complete&&r.previous.coverage===1;
 const ready=current.complete&&r.coverage===1&&!hasTransactionFilters(f);
 const net={...r,profit:r.profit-current.total,previous:{...r.previous,profit:comparable?r.previous.profit-previous.total:0},
  daily:r.daily.map((d,i)=>({...d,profit:d.profit-(current.daily[i]?.amount??0),previous:{...d.previous,profit:comparable?d.previous.profit-(previous.daily[i]?.amount??0):0}})),
  stores:r.stores.map(s=>({...s,profit:s.profit-(current.stores.find(e=>e.id===s.id)?.amount??0),previous:{...s.previous,profit:comparable?s.previous.profit-(previous.stores.find(e=>e.id===s.id)?.amount??0):0}}))};
 return{current,previous,ready,comparable,net};
}
