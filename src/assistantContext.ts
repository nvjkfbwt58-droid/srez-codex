import {reportAfterExpenses,type ExpensePlan} from './expenses';
import {z} from 'zod/v3';
import {report,productReport,stores,categories,addDays,dayStart,DAY,type Dataset,type Filters,type Campaign} from './domain';

const metric=z.object({revenue:z.number().finite(),profit:z.number().finite(),count:z.number().int().nonnegative(),customers:z.number().int().nonnegative(),average:z.number().finite(),coverage:z.number().min(0).max(1)}).strict();
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const assistantInputSchema=z.object({
 question:z.string().trim().min(1).max(4000),
 history:z.array(z.object({question:z.string().max(4000),answer:z.string().max(8000)}).strict()).max(6),
 snapshot:z.object({
  network:z.string().max(100),source:z.string().max(200),currency:z.literal('RUB'),moneyUnit:z.literal('kopecks'),
  period:z.object({from:date,to:date,previousFrom:date,previousTo:date,availableFrom:date,availableTo:date}),
  filters:z.object({stores:z.array(z.string().max(100)).max(100),category:z.string().max(100).nullable(),product:z.string().max(200).nullable(),other:z.string().max(400)}),
  operatingExpenses:z.object({complete:z.boolean(),amount:z.number().finite(),netProfit:z.number().finite().nullable(),note:z.string().max(300)}).optional(),
  current:metric,previous:metric,
  daily:z.array(metric.extend({date})).max(366),
  stores:z.array(metric.extend({id:z.string().max(100),name:z.string().max(100),previous:metric})).max(100),
  categories:z.array(metric.extend({name:z.string().max(100)})).max(100),
  products:z.array(metric.extend({name:z.string().max(200),price:z.number().finite(),cost:z.number().finite().nullable()})).max(100),
  campaigns:z.array(z.object({name:z.string().max(200),status:z.string().max(50),from:date,to:date,discount:z.string().max(50),assigned:z.number().int(),redeemed:z.number().int()})).max(20),
  limitations:z.array(z.string().max(300)).max(12)
 }).strict()
}).strict();
export type AssistantInput=z.infer<typeof assistantInputSchema>;
export const assistantOutputSchema=z.object({answer:z.string(),section:z.enum(['sales','customers','campaigns','assistant'])}).strict();
export type AssistantOutput=z.infer<typeof assistantOutputSchema>;

function metrics(r:ReturnType<typeof report>['previous']){
 return {revenue:r.revenue,profit:r.profit,count:r.count,customers:r.customers,average:r.average,coverage:r.coverage};
}
export function assistantContext(data:Dataset,filters:Filters,network:string,campaigns:Campaign[],expenses:ExpensePlan[]=[]){
 const length=Math.round((dayStart(filters.to)-dayStart(filters.from))/DAY)+1;
 if(length<1||length>366)throw new Error('Для помощника выберите период от 1 до 366 дней.');
 const r=report(data,filters),costs=reportAfterExpenses(r,filters,expenses);
 let availableFrom='',availableTo='';for(const receipt of data.receipts){const d=receipt.at.slice(0,10);if(!availableFrom||d<availableFrom)availableFrom=d;if(d>availableTo)availableTo=d;}
 return {
  network:network.slice(0,100),source:data.label.slice(0,200),currency:'RUB' as const,moneyUnit:'kopecks' as const,
  period:{from:filters.from,to:filters.to,previousFrom:addDays(filters.from,-length),previousTo:addDays(filters.from,-1),availableFrom:availableFrom||data.start,availableTo:availableTo||data.start},
  filters:{stores:stores.filter(s=>!filters.stores.length||filters.stores.includes(s.id)).map(s=>s.name),category:filters.category===undefined?null:categories[filters.category],product:data.products.find(p=>p.id===filters.product)?.name||null,other:JSON.stringify({discount:filters.discount,known:filters.known,min:filters.min,returns:filters.returns})},
  operatingExpenses:{complete:costs.ready,amount:costs.current.total,netProfit:costs.ready?costs.net.profit:null,note:'profit в основных метриках — валовая прибыль. netProfit вычитает внесённые расходы магазинов. Если расходы или себестоимость неполные, netProfit отсутствует.'},
  current:metrics(r),previous:metrics(r.previous),daily:r.daily.map(d=>({date:d.date,...metrics(d)})),
  stores:r.stores.filter(s=>!filters.stores.length||filters.stores.includes(s.id)).map(s=>({id:s.id,name:s.name,...metrics(s),previous:metrics(s.previous)})),
  categories:r.categories.map(c=>({name:c.name,...metrics(c)})),
  products:productReport(data,r.receipts,filters).sort((a,b)=>b.revenue-a.revenue).slice(0,100).map(p=>({name:p.name,price:p.price,cost:p.cost,...metrics(p)})),
  campaigns:campaigns.slice(0,20).map(c=>({name:c.name,status:c.status,from:c.offer.from,to:c.offer.to,discount:`${c.offer.value}${c.offer.kind==='percent'?'%':' ₽'}`,assigned:c.assignments.filter(a=>a.group==='offer').length,redeemed:c.assignments.filter(a=>a.used).length})),
  limitations:['Переданы до 100 товаров с наибольшей выручкой и до 20 кампаний; это не полный каталог.','Это снимок данных из текущего браузера, а не прямое подключение к Битриксу.','Денежные значения переданы в копейках; прибыль рассчитана только по строкам с известной себестоимостью.','Кампании и назначения — локальные сценарии, не подтверждённые внешней кассой.','Чеки и персональные данные покупателей не переданы. Причинность и эффект кампаний из этих агрегатов не доказаны.']
 };
}
