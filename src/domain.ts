import {demoCategories,demoProducts} from './demoCatalog';
import {customerPayment} from './paymentTargeting';
import type {PaymentPolicy,PaymentNeeds,PaymentMethod} from './paymentTargeting';
export const DEMO_NOW='2026-09-14T10:00:00+03:00';
export const SEED_VERSION=6;
export const DAY=86400000;
export const categories=demoCategories;
export const storeNames=['Арбат','Сокол','Таганская','Хамовники','Бауманская','Марьино','Измайлово','Митино','Перово','Тверская','Строгино','Бутово'];
export const stores=storeNames.map((name,i)=>({id:`S${i+1}`,name}));
export interface Product {id:string;name:string;category:number;groupId?:string;groupName?:string;price:number;cost:number|null;unit:string}
export interface Line {category?:number;groupId?:string;id:string;productId:string;quantity:number;price:number;discount:number;cost:number|null;originalLineId?:string}
export interface Receipt {id:string;storeId:string;customerId:string|null;at:string;type:'sale'|'return';paymentMethod?:PaymentMethod;couponId?:string;assignmentId?:string;couponDiscount?:number;originalId?:string;lines:Line[]}
export interface Customer {loyalty?:{type?:string;gender?:string;level?:string;joinedOn?:string;pointsToNext?:number;coins?:number;redeemedCoins?:boolean;referred?:boolean;referrals?:number;played?:boolean;survey?:boolean};id:string;birthDate:string|null;consent:boolean;channel:boolean;contacts:number;storeId:string;receipts:Receipt[]}
export interface Dataset {schemaVersion:number;customers:Customer[];products:Product[];receipts:Receipt[];start:string;label:string}
export interface Filters {from:string;to:string;stores:string[];category?:number;product?:string;discount?:string;known?:string;min?:number;returns?:string}
export const DEFAULT_FILTERS:Filters={from:'2026-08-17',to:'2026-09-13',stores:[]};
export const localDay=(at:string)=>at.endsWith('+03:00')?at.slice(0,10):new Date(Date.parse(at)+10800000).toISOString().slice(0,10);
export const dayStart=(s:string)=>Date.parse(s+'T00:00:00+03:00');
export const addDays=(s:string,n:number)=>new Date(Date.parse(s+'T12:00:00Z')+n*DAY).toISOString().slice(0,10);
const dateFormats=[false,true].map(short=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:short?'short':'long',timeZone:'Europe/Moscow'}));
const numberFormats=new Map<string,Intl.NumberFormat>();
function numberFormat(digits:number,fixed=false){const key=digits+':'+fixed;let format=numberFormats.get(key);if(!format){format=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:digits,...(fixed?{minimumFractionDigits:digits}:{})});numberFormats.set(key,format);}return format;}
export const dateRu=(s:string,short=false)=>dateFormats[Number(short)].format(new Date(s.includes('T')?s:s+'T12:00:00+03:00'));
export const money=(v:number,digits=0)=>numberFormat(digits,true).format(v/100)+' ₽';
export const num=(v:number,digits=0)=>numberFormat(digits).format(v);
export const compact=(v:number)=>Math.abs(v)>=100000000?num(v/100000000,2)+' млн ₽':money(v);
export const lineNet=(l:Line)=>l.price*l.quantity-l.discount;
export const receiptNet=(r:Receipt)=>r.lines.reduce((a,l)=>a+lineNet(l),0)*(r.type==='return'?-1:1);
export function rng(seed:number){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function demandCalendar(){
 const random=rng(28062026);let demand=0,event=0,basket=0,weekStrength=.1;
 return Array.from({length:120},(_,d)=>{
  const date=addDays('2026-05-17',d),weekday=new Date(date+'T12:00Z').getUTCDay(),monthDay=Number(date.slice(8));
  if(weekday===1)weekStrength=.04+random()*.16;
  demand=demand*.68+(random()-.5)*.28;
  event=event*.73+(random()<.09?(random()-.4)*.42:0);
  basket=basket*.55+(random()-.5)*.2;
  const payCycle=.065*(Math.exp(-(((monthDay-6)/2.2)**2))+Math.exp(-(((monthDay-21)/2.6)**2)));
  const weekend=weekday===5?weekStrength:weekday===6?weekStrength*.65:weekday===1?-.055:0;
  const traffic=Math.exp(demand+event+weekend+payCycle+(random()-.5)*.12);
  return {count:Math.round((460+d*.3)*traffic),basket,discount:Math.max(.05,.12-basket*.3+event*.15)};
 });
}
function shoppingHour(random:()=>number,weekend:boolean){
 const weights=weekend?[.035,.045,.07,.09,.10,.09,.10,.11,.12,.11,.08,.035,.015]:[.02,.03,.05,.06,.045,.055,.08,.14,.18,.15,.105,.06,.025];
 let pick=random()*weights.reduce((s,w)=>s+w,0);
 for(let i=0;i<weights.length;i++){pick-=weights[i];if(pick<=0)return 10+i;}
 return 22;
}
export function seedData(progress?:(n:number)=>void):Dataset {
 const random=rng(1042026);const integer=(a:number,b:number)=>a+Math.floor(random()*(b-a+1));
 const calendar=demandCalendar();
 const products=demoProducts();
 // Fictional small-store mix: different catchment sizes, not measured network data.
 const storeMix=[13,11,9,12,10,8,9,7,8,14,10,9].flatMap((weight,i)=>Array(weight).fill(`S${i+1}`));
 const customers:Customer[]=Array.from({length:16000},(_,i)=>({id:`${String(i+1).padStart(5,'0')}`,birthDate:i%11===0?null:`${1970+i%37}-${String(i%12+1).padStart(2,'0')}-15`,consent:i%8!==0,channel:i%13!==0,contacts:i%9===0?3:0,storeId:storeMix[i%storeMix.length],receipts:[],loyalty:{type:i%4===0?'new':'regular',gender:i%5===0?'unknown':i%2?'female':'male',level:['base','silver','gold'][i%3],joinedOn:addDays('2026-05-17',-(i%365)),pointsToNext:(i%20)*25,coins:(i%17)*10,redeemedCoins:i%4===0,referred:i%5===0,referrals:i%7===0?2:0,played:i%6===0,survey:i%8===0}}));
 const receipts:Receipt[]=[];let id=0;
 for(let d=0;d<120;d++){
  const day=addDays('2026-05-17',d);const week=new Date(day+'T12:00:00Z').getUTCDay();const market=calendar[d];
  const count=market.count;
  for(let j=0;j<count;j++){
   const anonymous=random()<.2;const cohort=(week===5||week===6)&&random()<.75;const ci=cohort?integer(0,3839):integer(3840,15999);const c=customers[ci];const category=ci<3840?[0,1,3][integer(0,2)]:integer(0,3);
   const lines:Line[]=Array.from({length:integer(1,3)+(random()<Math.max(0,market.basket)?1:0)},(_,k)=>{const cat=k===0?category:(ci<3840?[0,1,3][integer(0,2)]:integer(0,3));const p=products[integer(0,products.length/4-1)*4+cat];const quantity=random()<.28+market.basket?2:1;return{id:`L${id}-${k}`,productId:p.id,category:p.category,groupId:p.groupId,quantity,price:p.price,discount:random()<market.discount?Math.round(p.price*quantity*.05):0,cost:p.cost===null?null:p.cost*quantity};});
   const r:Receipt={id:`R${++id}`,storeId:random()<.77?c.storeId:`S${integer(1,12)}`,customerId:anonymous?null:c.id,at:`${day}T${String(shoppingHour(random,week===5||week===6)).padStart(2,'0')}:${String(integer(0,59)).padStart(2,'0')}:00+03:00`,type:'sale',paymentMethod:(id%10<8?(['cash','card','sbp'] as const)[ci%3]:(['cash','card','sbp'] as const)[id%3]),lines};
   receipts.push(r);if(!anonymous)c.receipts.push(r);
   if(random()<.008){const ret:Receipt={...r,id:`RT${id}`,type:'return',originalId:r.id,lines:[{...lines[0],id:`RL${id}`,originalLineId:lines[0].id}]};receipts.push(ret);if(!anonymous)c.receipts.push(ret);}
  }if(d%12===0)progress?.(Math.round(d/120*100));
 }return{schemaVersion:SEED_VERSION,customers,products,receipts,start:'2026-05-17',label:'Демонстрационный набор'};
}
// Datasets are immutable snapshots; weak ownership releases indexes on replacement.
const datasetIndexes=new WeakMap<Dataset,{times:Float64Array;products:Map<string,Product>}>();
function indexDataset(data:Dataset){let index=datasetIndexes.get(data);if(!index){index={times:Float64Array.from(data.receipts,r=>Date.parse(r.at)),products:new Map(data.products.map(p=>[p.id,p]))};datasetIndexes.set(data,index);}return index;}
export function selectReceipts(data:Dataset,f:Filters){
 const from=dayStart(f.from),to=dayStart(addDays(f.to,1)),index=indexDataset(data),selected:Receipt[]=[];
 const storeIds=new Set(f.stores),filterLines=f.category!==undefined||!!f.product;
 for(let i=0;i<data.receipts.length;i++){
  const r=data.receipts[i],t=index.times[i];
  if(t<from||t>=to||storeIds.size&&!storeIds.has(r.storeId)||f.known&&f.known!=='all'&&(f.known==='yes')!==!!r.customerId||f.returns&&f.returns!=='all'&&(f.returns==='yes')!==(r.type==='return')||f.min&&Math.abs(receiptNet(r))<f.min||f.discount&&f.discount!=='all'&&(f.discount==='yes')!==r.lines.some(l=>l.discount>0))continue;
  if(!filterLines){if(r.lines.length)selected.push(r);continue;}
  const lines=r.lines.filter(l=>(f.category===undefined||index.products.get(l.productId)?.category===f.category)&&(!f.product||l.productId===f.product));
  if(lines.length)selected.push(lines.length===r.lines.length?r:{...r,lines});
 }
 return selected;
}
export function aggregate(receipts:Receipt[]){let revenue=0,cost=0,knownRevenue=0,lines=0,knownLines=0;const sales=new Set<string>(),people=new Set<string>();for(const r of receipts){const sign=r.type==='return'?-1:1;if(r.type==='sale'){sales.add(r.id);if(r.customerId)people.add(r.customerId);}for(const l of r.lines){const net=lineNet(l)*sign;revenue+=net;lines++;if(l.cost!==null){cost+=l.cost*sign;knownRevenue+=net;knownLines++;}}}return{revenue,cost,profit:knownRevenue-cost,count:sales.size,customers:people.size,average:sales.size?Math.round(revenue/sales.size):0,coverage:lines?knownLines/lines:0,margin:knownRevenue?(knownRevenue-cost)/knownRevenue:null};}
function computeReport(data:Dataset,f:Filters){const current=selectReceipts(data,f),length=Math.round((dayStart(f.to)-dayStart(f.from))/DAY)+1,previousFilters={...f,from:addDays(f.from,-length),to:addDays(f.from,-1)},previous=selectReceipts(data,previousFilters);const group=(rs:Receipt[],key:(r:Receipt)=>string)=>{const out=new Map<string,Receipt[]>();for(const r of rs){const k=key(r);if(!out.has(k))out.set(k,[]);out.get(k)!.push(r);}return out;};const days=group(current,r=>localDay(r.at)),prevDays=group(previous,r=>localDay(r.at)),byStore=group(current,r=>r.storeId),oldStore=group(previous,r=>r.storeId),byCategory=new Map<number,Receipt[]>(),productIndex=indexDataset(data).products;
 for(const receipt of current){const lines=new Map<number,Line[]>();for(const line of receipt.lines){const category=productIndex.get(line.productId)?.category;if(category===undefined)continue;if(!lines.has(category))lines.set(category,[]);lines.get(category)!.push(line);}for(const [category,items] of lines){if(!byCategory.has(category))byCategory.set(category,[]);byCategory.get(category)!.push({...receipt,lines:items});}}
 return{...aggregate(current),previous:aggregate(previous),receipts:current,daily:Array.from({length},(_,i)=>({date:addDays(f.from,i),...aggregate(days.get(addDays(f.from,i))||[]),previous:aggregate(prevDays.get(addDays(previousFilters.from,i))||[])})),stores:stores.map(s=>({...s,...aggregate(byStore.get(s.id)||[]),previous:aggregate(oldStore.get(s.id)||[])})),categories:categories.map((name,i)=>({name,id:i,...aggregate(byCategory.get(i)||[])}))};
}
const reportCache=new WeakMap<Dataset,Map<string,ReturnType<typeof computeReport>>>();
export function report(data:Dataset,f:Filters){
 const key=JSON.stringify([f.from,f.to,[...f.stores].sort(),f.category??null,f.product||'',f.discount||'all',f.known||'all',f.min||0,f.returns||'all']);
 let cache=reportCache.get(data);if(!cache){cache=new Map();reportCache.set(data,cache);}
 const cached=cache.get(key);if(cached){cache.delete(key);cache.set(key,cached);return cached;}
 const result=computeReport(data,f);cache.set(key,result);if(cache.size>4)cache.delete(cache.keys().next().value!);return result;
}
export function productReport(data:Dataset,receipts:Receipt[],f:Filters){
 const grouped=new Map<string,Receipt[]>();
 for(const receipt of receipts){const lines=new Map<string,Line[]>();for(const line of receipt.lines){if(!lines.has(line.productId))lines.set(line.productId,[]);lines.get(line.productId)!.push(line);}for(const [id,items] of lines){if(!grouped.has(id))grouped.set(id,[]);grouped.get(id)!.push({...receipt,lines:items});}}
 return data.products.filter(p=>(f.category===undefined||p.category===f.category)&&(!f.product||p.id===f.product)).map(p=>({...p,...aggregate(grouped.get(p.id)||[]),stock:stores.filter(s=>s.id!=='S12').length*17}));
}
export type Field='count'|'spend'|'days'|'average'|'last'|'category'|'weekday'|'store'|'consent'|'channel'|'contacts'|'age'|'product'|'categoryCount'|'categoryShare'|'favorite'|'first'|'payment'|'type'|'gender'|'level'|'tenure'|'points'|'coins'|'redeemedCoins'|'referred'|'referrals'|'played'|'survey'|'dayOfWeek'|'timeOfDay';
export interface Rule {id:string;field:Field;op:string;value:string|number;window:number;target?:string;values?:string[];match?:'any'|'all';upper?:number}
export interface Group {id:string;logic:'AND'|'OR'|'NOT';children:(Rule|Group)[]}
export const isGroup=(r:Rule|Group):r is Group=>'children'in r;
export const baseSegment:Group={id:'root',logic:'AND',children:[{id:'r1',field:'count',op:'gte',value:4,window:90},{id:'r2',field:'weekday',op:'gte',value:60,window:90},{id:'r3',field:'last',op:'lte',value:28,window:120},{id:'r4',field:'category',op:'not',value:2,window:60}]};
const numeric=['gte','lte','eq'],yesNo=['yes','not'];
export const fields:Record<Field,{label:string;ops:string[];group?:string}>={
 count:{label:'Число покупок',ops:numeric,group:'Покупки'},last:{label:'Дней с покупки',ops:numeric,group:'Покупки'},days:{label:'Дни с покупками',ops:numeric,group:'Покупки'},first:{label:'Дней с первой покупки',ops:numeric,group:'Покупки'},weekday:{label:'Покупки в пт/сб, %',ops:numeric,group:'Покупки'},dayOfWeek:{label:'Приходил в день недели',ops:yesNo,group:'Покупки'},timeOfDay:{label:'Приходил в это время суток',ops:yesNo,group:'Покупки'},payment:{label:'Привычный способ оплаты',ops:['eq'],group:'Покупки'},redeemedCoins:{label:'Списывал монеты',ops:yesNo,group:'Покупки'},
 product:{label:'Товар',ops:yesNo,group:'Товары'},category:{label:'Группа товаров',ops:yesNo,group:'Товары'},favorite:{label:'Любимая категория',ops:['eq'],group:'Товары'},categoryCount:{label:'Покупок в категории',ops:numeric,group:'Товары'},categoryShare:{label:'Доля покупок категории, %',ops:numeric,group:'Товары'},
 type:{label:'Тип покупателя',ops:['eq'],group:'Покупатель'},gender:{label:'Пол',ops:['eq'],group:'Покупатель'},age:{label:'Возраст',ops:['between',...numeric],group:'Покупатель'},level:{label:'Уровень карты',ops:['eq'],group:'Покупатель'},tenure:{label:'Дней в программе',ops:numeric,group:'Покупатель'},points:{label:'До следующего уровня, баллов',ops:numeric,group:'Покупатель'},coins:{label:'Монет на счёте',ops:numeric,group:'Покупатель'},referred:{label:'Пришёл по приглашению',ops:yesNo,group:'Покупатель'},referrals:{label:'Приглашал друзей',ops:numeric,group:'Покупатель'},played:{label:'Играл в игровой автомат',ops:yesNo,group:'Покупатель'},survey:{label:'Проходил опрос',ops:yesNo,group:'Покупатель'},
 consent:{label:'Согласие на предложения',ops:yesNo,group:'Контакты'},channel:{label:'Доступен канал',ops:yesNo,group:'Контакты'},contacts:{label:'Получено предложений за 30 дней',ops:numeric,group:'Контакты'},
 spend:{label:'Устаревшее финансовое условие',ops:[]},average:{label:'Устаревшее финансовое условие',ops:[]},store:{label:'Отбор по магазину отключён',ops:[]}
};
export const ops:Record<string,string>={gte:'не меньше',lte:'не больше',eq:'равно',between:'от — до',yes:'покупал / да',not:'не покупал / нет'};
const statsCache=new WeakMap<Customer,Map<number,any>>();
export function customerStats(c:Customer,window=90):ReturnType<typeof computeCustomerStats>{let cache=statsCache.get(c);if(!cache){cache=new Map();statsCache.set(c,cache);}if(cache.has(window))return cache.get(window);const result=computeCustomerStats(c,window);cache.set(window,result);return result;}
function computeCustomerStats(c:Customer,window=90){
 const end=dayStart('2026-09-14'),start=end-window*DAY;
 const sale=c.receipts.filter(r=>r.type==='sale'&&Date.parse(r.at)>=start&&Date.parse(r.at)<end);
 const all=c.receipts.filter(r=>r.type==='sale'&&Date.parse(r.at)<end);
 const dates=all.map(r=>dayStart(localDay(r.at))),last=dates.length?Math.max(...dates):null,first=dates.length?Math.min(...dates):null;
 const cats=[0,0,0,0],weekdays=[0,0,0,0,0,0,0],hours=[0,0,0],products=new Set<string>(),groups=new Set<string>();
 for(const r of sale){weekdays[new Date(localDay(r.at)+'T12:00Z').getUTCDay()]++;const hour=new Date(Date.parse(r.at)+10800000).getUTCHours();hours[hour<12?0:hour<18?1:2]++;const seen=new Set<number>();for(const l of r.lines){products.add(l.productId);const cat=l.category??(Number(l.productId.slice(1))-1)%4;groups.add('category:'+cat);if(l.groupId)groups.add(l.groupId);seen.add(cat);}for(const cat of seen)if(cats[cat]!==undefined)cats[cat]++;}
 return {count:sale.length,days:new Set(sale.map(r=>localDay(r.at))).size,last:last===null?null:Math.round((end-last)/DAY),first:first===null?null:Math.round((end-first)/DAY),lastDate:last===null?null:new Date(last+3*3600000).toISOString().slice(0,10),cats,weekdays,hours,products,groups,favorite:sale.length?cats.indexOf(Math.max(...cats)):-1,weekend:sale.length?(weekdays[5]+weekdays[6])/sale.length*100:null};
}
export function validateGroup(g:Group,depth=0):string[]{
 const errors:string[]=[];if(depth>2)errors.push('Поддерживается три уровня групп');if(!g.children.length)errors.push('Добавьте хотя бы одно условие');
 for(const r of g.children){if(isGroup(r)){errors.push(...validateGroup(r,depth+1));continue;}
  if(!fields[r.field]?.ops.includes(r.op)){errors.push('Удалите или замените устаревшее условие');continue;}
  const choice=['category','favorite','product','payment','type','gender','level','dayOfWeek','timeOfDay','consent','channel','redeemedCoins','referred','played','survey'].includes(r.field);
  if(!Number.isInteger(r.window)||r.window<1||r.window>120||!choice&&(!Number.isFinite(Number(r.value))||Number(r.value)<0))errors.push('Проверьте значение и окно 1–120 дней');
  if(['category','favorite'].includes(r.field)&&!r.values?.length&&![0,1,2,3].includes(Number(r.value)))errors.push('Выберите группу товаров');
  if(['categoryCount','categoryShare'].includes(r.field)&&!['0','1','2','3'].includes(r.target||''))errors.push('Выберите категорию для условия');
  if(['weekday','categoryShare'].includes(r.field)&&Number(r.value)>100)errors.push('Доля должна быть от 0 до 100%');
  if(r.op==='between'&&(!Number.isFinite(r.upper)||r.upper!<Number(r.value)||r.upper!>120))errors.push('Укажите корректный возраст от и до');
  if(r.field==='age'&&Number(r.value)>120)errors.push('Возраст должен быть от 0 до 120 лет');
  if(r.field==='product'&&!(r.values?.length?r.values.every(v=>/^P[0-9]{3}$/.test(v)):/^P[0-9]{3}$/.test(String(r.value))))errors.push('Выберите товар из каталога');
 }
 return [...new Set(errors)];
}
export function matches(c:Customer,g:Group,dataStart='2026-05-17'):boolean{return validateGroup(g).length?false:matchesValid(c,g,dataStart);}
function matchesValid(c:Customer,g:Group,dataStart:string):boolean {
 function test(n:Rule|Group):boolean|null{
  if(isGroup(n)){const results=n.children.map(test);if(n.logic==='OR')return results.includes(true)?true:results.includes(null)?null:false;if(n.logic==='NOT'){return results.includes(null)?null:!results.every(Boolean);}return results.includes(false)?false:results.includes(null)?null:true;}
  const history=['count','days','last','first','weekday','dayOfWeek','timeOfDay','category','favorite','categoryCount','categoryShare','product','payment'].includes(n.field);
  if(history&&dayStart('2026-09-14')-dayStart(dataStart)<n.window*DAY)return null;
  const s=customerStats(c,n.window),l=c.loyalty;let v:number|string|boolean|null|undefined=null;
  switch(n.field){case'count':v=s.count;break;case'days':v=s.days;break;case'last':v=s.last;break;case'first':v=s.first;break;case'weekday':v=s.weekend;break;case'category':v=n.values?.length?(n.match==='all'?n.values.every(x=>s.groups.has(x)):n.values.some(x=>s.groups.has(x))):s.cats[Number(n.value)]>0;break;case'favorite':v=s.favorite<0?null:s.favorite;break;case'categoryCount':v=s.cats[Number(n.target)];break;case'categoryShare':v=s.count?s.cats[Number(n.target)]/s.count*100:null;break;case'product':v=n.values?.length?(n.match==='all'?n.values.every(x=>s.products.has(x)):n.values.some(x=>s.products.has(x))):s.products.has(String(n.value));break;case'dayOfWeek':v=s.weekdays[Number(n.value)]>0;break;case'timeOfDay':v=s.hours[Number(n.value)]>0;break;
   case'payment':{const p=customerPayment(c,'2026-09-14',n.window);v=p.known>=3&&p.coverage>=.6&&p.share>=.6?p.preferred:null;break;}
   case'consent':v=c.consent;break;case'channel':v=c.channel;break;case'contacts':v=c.contacts;break;case'age':v=c.birthDate?2026-Number(c.birthDate.slice(0,4))-(c.birthDate.slice(5)>'09-14'?1:0):null;break;
   case'type':v=l?.type;break;case'gender':v=l?.gender==='unknown'?null:l?.gender;break;case'level':v=l?.level;break;case'tenure':v=l?.joinedOn?Math.floor((dayStart('2026-09-14')-dayStart(l.joinedOn))/DAY):null;break;case'points':v=l?.pointsToNext;break;case'coins':v=l?.coins;break;case'redeemedCoins':v=l?.redeemedCoins;break;case'referred':v=l?.referred;break;case'referrals':v=l?.referrals;break;case'played':v=l?.played;break;case'survey':v=l?.survey;break;
  }
  if(v===null||v===undefined)return null;if(n.op==='between')return Number(v)>=Number(n.value)&&Number(v)<=n.upper!;if(n.op==='yes')return !!v;if(n.op==='not')return !v;if(n.op==='eq')return String(v)===String(n.value);return n.op==='gte'?Number(v)>=Number(n.value):Number(v)<=Number(n.value);
 }return test(g)===true;
}
function computeAudience(data:Dataset,g:Group,storeIds:string[],noChannel:boolean){const valid=!validateGroup(g).length;const behavior=valid?data.customers.filter(c=>matchesValid(c,g,data.start)):[];const channel=behavior.filter(c=>c.consent&&c.channel&&!noChannel);const frequency=channel.filter(c=>c.contacts<3);const stock=frequency;return{behavior,eligible:stock,excluded:[{reason:'Нет канала или согласия',count:behavior.length-channel.length},{reason:'Лимит контактов: 3 за 30 дней',count:channel.length-frequency.length},{reason:'Дополнительные ограничения',count:0}]};}
const audienceCache=new WeakMap<Dataset,Map<string,ReturnType<typeof computeAudience>>>();
export function audience(data:Dataset,g:Group,storeIds:string[]=[],noChannel=false){
 const key=JSON.stringify([g,[...storeIds].sort(),noChannel]);let cache=audienceCache.get(data);if(!cache){cache=new Map();audienceCache.set(data,cache);}
 const cached=cache.get(key);if(cached)return cached;const result=computeAudience(data,g,storeIds,noChannel);cache.set(key,result);if(cache.size>4)cache.delete(cache.keys().next().value!);return result;
}
export interface Offer {productId:string;category:number|null;kind:'percent'|'fixed';value:number;cap:number;minBasket:number;minMargin:number;once:boolean;stackable:boolean;stores:string[];from:string;to:string;weekdays:number[];hourFrom:number;hourTo:number;control:number;budget:number;channelCost:number}
export const defaultOffer:Offer={productId:'P003',category:null,kind:'percent',value:10,cap:5000,minBasket:0,minMargin:25,once:true,stackable:false,stores:stores.map(s=>s.id).filter(id=>id!=='S12'),from:'2026-09-16',to:'2026-09-24',weekdays:[3,4],hourFrom:10,hourTo:22,control:50,budget:25000000,channelCost:0};
export const economy=(p:Product,o:Offer)=>{const discount=Math.min(o.cap,o.kind==='percent'?Math.round(p.price*o.value/100):o.value*100,p.price);const price=p.price-discount;const profit=p.cost===null?null:price-p.cost;return{discount,price,profit,margin:profit===null||!price?null:profit/price*100};};
export function offerErrors(o:Offer,p:Product|undefined,n:number,_products?:Product[]){
 const errors:string[]=[];
 if(![o.value,o.cap,o.minBasket,o.hourFrom,o.hourTo,o.control,n].every(Number.isFinite))errors.push('Заполните числовые условия предложения');
 if(!p)errors.push('Товар не найден');if(n<=0)errors.push('Нет доступных получателей');
 if(!o.stores.length)errors.push('Выберите магазин');
 if(!o.from||!o.to||o.from>o.to||!Number.isFinite(dayStart(o.from))||!Number.isFinite(dayStart(o.to)))errors.push('Проверьте даты начала и окончания');
 if(dayStart(o.to)-dayStart(o.from)>=90*DAY)errors.push('Срок кампании ограничен 90 днями');
 if(!o.weekdays.length||o.hourFrom>=o.hourTo||o.hourFrom<0||o.hourTo>24)errors.push('Проверьте дни и часы действия');
 if(o.value<=0||o.kind==='percent'&&o.value>100||o.cap<=0||o.minBasket<0)errors.push('Скидка, лимит и сумма корзины некорректны');
 if(o.control<=0||o.control>=100)errors.push('Контрольная группа должна быть от 1 до 99%');return errors;
}
export function offerDates(o:Offer){if(!o.from||!o.to||!Number.isFinite(dayStart(o.from))||!Number.isFinite(dayStart(o.to))||o.from>o.to||!o.weekdays.length)return 'Укажите даты действия';const dates:string[]=[];for(let d=o.from;d<=o.to&&d<=addDays(o.from,89);d=addDays(d,1)){if(o.weekdays.includes(new Date(d+'T12:00:00Z').getUTCDay()))dates.push(d);if(dates.length>90)break;}const groups:string[][]=[];for(const d of dates){const last=groups.at(-1);if(last&&addDays(last.at(-1)!,1)===d)last.push(d);else groups.push([d]);}return groups.map(g=>g.length>1?`${g[0].slice(0,7)===g.at(-1)!.slice(0,7)?Number(g[0].slice(8)):dateRu(g[0])}–${dateRu(g.at(-1)!)}`:dateRu(g[0])).join(' и ');}
export interface Design {schemaVersion:1;brandId:string;brandVersion:number;templateId:string;asset:string;title:string;description:string;fontSize:number;align:'left'|'center'|'right';textStyle?:{titleColor?:string;descriptionColor?:string;benefitColor?:string;fontFamily?:'brand'|'Inter'|'Georgia'|'Arial';titleWeight?:400|500|700;titleItalic?:boolean;lineHeight?:number;letterSpacing?:number;descriptionSize?:number};crop:{x:number;y:number;scale:number};showDescription:boolean;reverse:boolean;revision:number;variantId?:string;logo?:string;brandTokens?:{name?:string;primary:string;ink:string;paper:string;font:string;pattern:string;fontUrl?:string}}
export const defaultDesign:Design={schemaVersion:1,brandId:'kvartal',brandVersion:1,templateId:'right',asset:'/assets/kvartal-right.png',title:'на любимые\nпокупки',description:'Больше вкусных\nмоментов рядом',fontSize:28,align:'left',crop:{x:50,y:50,scale:1},showDescription:true,reverse:false,revision:1};
export const themes=[{id:'kvartal',name:'Квартал 12',primary:'#F25835',ink:'#191B1D',paper:'#F6F0E8',font:'Inter',asset:'/assets/kvartal-right.png'},{id:'flanders',name:'Фландерс',primary:'#E9B949',ink:'#F4EEE2',paper:'#121110',font:'Prata',asset:'/assets/flanders.png'},{id:'copper',name:'Медный двор',primary:'#173D32',ink:'#F3E4BA',paper:'#F5F0E3',font:'Georgia',asset:'/assets/copper.png'},{id:'lemon',name:'Лимон & соль',primary:'#F2DB38',ink:'#191B1D',paper:'#FFFCDF',font:'Inter',asset:'/assets/lemon.png'}];
export interface Assignment {id:string;customerId:string;group:'offer'|'control';token:string;used:boolean}
export interface Campaign {stockBatchId?:string;example?:boolean;paymentPolicy?:PaymentPolicy;paymentNeedsSnapshot?:PaymentNeeds;startedAt?:string;id:string;name:string;status:'draft'|'scheduled'|'active'|'paused'|'completed'|'archived';step:number;rules:Group;offer:Offer;design:Design;assignments:Assignment[];personalId?:string;snapshot?:{offer:Offer;design:Design;rules:Group};created:string}
export const statusLabels={draft:'Черновик',scheduled:'Запланирована',active:'Активна в демо',paused:'Пауза',completed:'Завершена',archived:'Архив'};
export function campaignsSeed():Campaign[]{return[{id:'CP-104',example:true,name:'Вернуть в будни',status:'draft',step:0,rules:structuredClone(baseSegment),offer:{...defaultOffer},design:{...defaultDesign},assignments:[],created:DEMO_NOW},{id:'CP-105',example:true,name:'Вернуться за любимым',status:'draft',step:1,rules:{id:'root',logic:'AND',children:[{id:'r1',field:'last',op:'gte',value:21,window:90}]},offer:{...defaultOffer,kind:'fixed',value:50,minBasket:50000,productId:'P004'},design:{...defaultDesign,asset:'/assets/kvartal-air.png',title:'на новые\nвпечатления'},assignments:[],created:DEMO_NOW},{id:'CP-097',example:true,name:'Попробовать новое',status:'completed',step:4,rules:structuredClone(baseSegment),offer:{...defaultOffer,from:'2026-08-17',to:'2026-09-13',weekdays:[0,1,2,3,4,5,6]},design:{...defaultDesign,asset:'/assets/kvartal-scene.png',title:'откройте\nновый вкус'},assignments:[],created:DEMO_NOW}];}
export function assign(ids:string[],campaignId:string,control:number){const random=rng([...campaignId].reduce((s,c)=>s+c.charCodeAt(0),104));const shuffled=[...ids].sort();for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}const n=Math.round(shuffled.length*control/100);return shuffled.map((customerId,i):Assignment=>({id:`${campaignId}-${customerId}`,customerId,group:i<n?'control':'offer',token:`DEMO-${campaignId}-${customerId}-${Math.floor(random()*1e9).toString(36)}`,used:false}));}
export interface Redemption {operationId:string;assignmentId:string;campaignId:string;receipt:Receipt;discount:number;returnedLines:string[]}
export function allocateDiscount(lines:Line[],amount:number){const total=lines.reduce((s,l)=>s+lineNet(l),0);let left=amount;return lines.map((l,i)=>{const d=i===lines.length-1?left:Math.floor(amount*lineNet(l)/total);left-=d;return{...l,discount:l.discount+d};});}
export function redeem(c:Campaign,a:Assignment|undefined,cart:Line[],storeId:string,at:string,token:string,operationId:string,events:Redemption[]){const existing=events.find(e=>e.operationId===operationId);if(existing)return{event:existing};const o=c.snapshot?.offer||c.offer;if(c.status!=='active')return{error:'Кампания не активна в демо'};if(!a||a.group!=='offer'||a.token!==token)return{error:'Купон не назначен этому покупателю'};if(o.once&&(a.used||events.some(e=>e.assignmentId===a.id)))return{error:'Купон уже использован'};const d=localDay(at),time=new Date(Date.parse(at)+3*3600000);if(d<o.from||d>o.to||!o.weekdays.includes(time.getUTCDay())||time.getUTCHours()<o.hourFrom||time.getUTCHours()>=o.hourTo)return{error:'Купон не действует в выбранные дату и время'};if(!o.stores.includes(storeId))return{error:'Магазин не участвует в акции'};if(cart.some(l=>l.quantity<=0||!Number.isInteger(l.quantity)))return{error:'Количество должно быть целым и положительным'};if(!o.stackable&&cart.some(l=>l.discount>0))return{error:'Купон не совместим с другой скидкой'};const total=cart.reduce((s,l)=>s+lineNet(l),0);if(total<o.minBasket)return{error:`Минимальная корзина ${money(o.minBasket)}`};const selected=cart.filter(l=>o.category!==null?(Number(l.productId.slice(1))-1)%4===o.category:l.productId===o.productId);if(!selected.length)return{error:'В корзине нет подходящего товара'};const base=selected.reduce((s,l)=>s+lineNet(l),0),discount=Math.min(base,o.cap,o.kind==='percent'?Math.round(base*o.value/100):Math.round(o.value*100));const discounted=allocateDiscount(selected,discount);const all=cart.map(l=>discounted.find(x=>x.id===l.id)||l);return{event:{operationId,assignmentId:a.id,campaignId:c.id,receipt:{id:`SIM-${operationId}`,storeId,customerId:a.customerId,at,type:'sale' as const,couponId:c.id,assignmentId:a.id,couponDiscount:discount,lines:all},discount,returnedLines:[]}};}
export function returnReceipt(event:Redemption,lineIds:string[]):Receipt{const lines=event.receipt.lines.filter(l=>lineIds.includes(l.id)&&!event.returnedLines.includes(l.id)).map(l=>({...l,id:'RETURN-'+l.id,originalLineId:l.id}));if(!lines.length)throw new Error('Эти строки уже возвращены');return{...event.receipt,id:'RETURN-'+event.operationId+'-'+event.returnedLines.length,type:'return',originalId:event.receipt.id,lines};}
