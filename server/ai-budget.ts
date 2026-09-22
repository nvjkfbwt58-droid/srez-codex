import {randomUUID} from 'node:crypto';
import {Store} from './store';

// USD micro-units, persisted before dispatch. Failed/aborted calls keep their
// reservation: a lost HTTP response does not prove that OpenAI did not bill it.
export class AIBudget {
 constructor(private store:Store, public limitUSD=5) {
  if(!Number.isFinite(limitUSD)||limitUSD<0)throw new Error('AI_BUDGET_USD должен быть неотрицательным числом');
 }
 snapshot(){
  const entries=this.store.all('ai-spend');
  const spent=entries.reduce((n,e)=>n+e.charged,0);
  return {limitUSD:this.limitUSD,accountedUSD:spent/1e6,remainingUSD:Math.max(0,this.limitUSD-spent/1e6),
   measuredUSD:entries.filter(e=>e.status==='measured').reduce((n,e)=>n+e.charged,0)/1e6,
   uncertainRequests:entries.filter(e=>e.status!=='measured').length};
 }
 reserve(kind:string,model:string,usd:number){
  return this.store.transaction(()=>{
   const amount=Math.ceil(usd*1e6);
   if(amount>Math.floor(this.snapshot().remainingUSD*1e6))throw Object.assign(new Error('Локальный бюджет OpenAI исчерпан. Проверьте расходы перед увеличением лимита.'),{code:'ai_budget',status:429});
   const id=randomUUID();
   this.store.put('ai-spend',{id,brandId:'system',kind,model,reserved:amount,charged:amount,status:'reserved',at:new Date().toISOString()});
   return id;
  });
 }
 settle(id:string,usd:number|null){
  if(usd===null||!Number.isFinite(usd)||usd<0)return;
  this.store.transaction(()=>{const entry=this.store.get('ai-spend',id);if(entry?.status==='reserved')this.store.put('ai-spend',{...entry,charged:Math.ceil(usd*1e6),status:'measured'});});
 }
}

// Standard prices verified against OpenAI documentation on 2026-09-15.
// Unknown models/usage retain the conservative reservation; never assume $0.
export function usageUSD(model:string,usage:any):number|null {
 if(!usage||!Number.isFinite(usage.input_tokens)||!Number.isFinite(usage.output_tokens))return null;
 if(model.startsWith('gpt-image-2.5-')){
  const d=usage.input_tokens_details;
  if(!d||!Number.isFinite(d.image_tokens)||!Number.isFinite(d.text_tokens))return null;
  return (d.image_tokens*8+d.text_tokens*5+usage.output_tokens*30)/1e6;
 }
 const rates:Record<string,[number,number]>={'gpt-5.6-luna':[.2,1.2],'gpt-4.1':[2,8]};
 const rate=rates[model];
 return rate?(usage.input_tokens*rate[0]+usage.output_tokens*rate[1])/1e6:null;
}
