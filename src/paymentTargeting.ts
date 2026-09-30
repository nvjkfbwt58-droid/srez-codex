import {addDays,localDay,type Customer,type Receipt} from './domain';

export type PaymentMethod='cash'|'card'|'sbp'|'mixed'|'unknown';
export type PreferredPayment='cash'|'card'|'sbp';
export const paymentLabels:Record<PaymentMethod,string>={cash:'Наличные',card:'Карта',sbp:'СБП',mixed:'Смешанная оплата',unknown:'Не указано'};
export interface PaymentPolicy {enabled:boolean;window:number;minKnown:number;minShare:number}
export type PaymentNeeds=Partial<Record<string,PreferredPayment>>;
export const defaultPaymentPolicy:PaymentPolicy={enabled:false,window:90,minKnown:5,minShare:60};
export function paymentProfile(receipts:Receipt[],asOf:string,window=90){
  const from=addDays(asOf,-window),counts={cash:0,card:0,sbp:0};let total=0;
  for(const r of receipts){if(r.type!=='sale'||localDay(r.at)<from||localDay(r.at)>=asOf)continue;total++;if(r.paymentMethod&&r.paymentMethod in counts)counts[r.paymentMethod as PreferredPayment]++;}
  const known=counts.cash+counts.card+counts.sbp;
  const sorted=(Object.entries(counts) as [PreferredPayment,number][]).sort((a,b)=>b[1]-a[1]);
  const preferred=known&&sorted[0][1]>sorted[1][1]?sorted[0][0]:null;
  return {counts,total,known,coverage:total?known/total:0,preferred,share:preferred?counts[preferred]/known:0};
}
const profiles=new WeakMap<Customer,Map<string,ReturnType<typeof paymentProfile>>>();
export function customerPayment(c:Customer,asOf:string,window:number){let cache=profiles.get(c);if(!cache){cache=new Map();profiles.set(c,cache);}const key=asOf+':'+window;if(!cache.has(key)){if(cache.size>4)cache.clear();cache.set(key,paymentProfile(c.receipts,asOf,window));}return cache.get(key)!;}
export function paymentAudience(customers:Customer[],needs:PaymentNeeds,policy:PaymentPolicy|undefined,asOf:string){
  const excluded={unknown:0,other:0,noNeed:0};
  if(!policy?.enabled)return {eligible:customers,excluded};
  const eligible=customers.filter(c=>{
    const method=needs[c.storeId];if(!method){excluded.noNeed++;return false;}
    const p=customerPayment(c,asOf,policy.window);
    if(p.known<policy.minKnown||p.coverage<.6){excluded.unknown++;return false;}
    if(p.preferred!==method||p.share*100<policy.minShare){excluded.other++;return false;}return true;
  });return {eligible,excluded};
}
export function validatePaymentPolicy(policy:PaymentPolicy|undefined){
  if(!policy?.enabled)return [];
  return Number.isInteger(policy.window)&&policy.window>=7&&policy.window<=120&&Number.isInteger(policy.minKnown)&&policy.minKnown>=3&&policy.minKnown<=50&&Number.isFinite(policy.minShare)&&policy.minShare>=51&&policy.minShare<=100?[]:['Проверьте условия подбора по оплате: 7–120 дней, минимум 3–50 чеков, доля 51–100%.'];
}
