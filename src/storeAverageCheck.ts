import {addDays,DAY,dayStart,localDay,receiptNet,selectReceipts,type Dataset,type Filters,type Receipt} from './domain';

/** Full paid sale baskets, after discounts; returns are not purchase receipts. Amounts in kopecks. */
export function storeAverageCheck(data:Dataset,filters:Filters,storeId:string){
 const length=Math.max(1,Math.round((dayStart(filters.to)-dayStart(filters.from))/DAY)+1);
 const previousFrom=addDays(filters.from,-length),previousTo=addDays(filters.from,-1);
 const select=(from:string,to:string)=>selectReceipts(data,{from,to,stores:[storeId],returns:'no'});
 const current=select(filters.from,filters.to),previous=select(previousFrom,previousTo);
 const average=(rs:Receipt[])=>rs.length?rs.reduce((sum,r)=>sum+receiptNet(r),0)/rs.length:null;
 const groups=new Map<string,Receipt[]>();
 for(const receipt of current){const day=localDay(receipt.at),group=groups.get(day)||[];group.push(receipt);groups.set(day,group);}
 const before=average(previous),now=average(current);
 return {before,now,previousFrom,previousTo,change:before!==null&&before>0&&now!==null?(now/before-1)*100:null,count:current.length,
  daily:Array.from({length},(_,i)=>{const date=addDays(filters.from,i);return {date,value:average(groups.get(date)||[])};})};
}
