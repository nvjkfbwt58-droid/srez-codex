import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {Store} from '../server/store';
import {AIBudget,usageUSD} from '../server/ai-budget';
import {createApp} from '../server/app';
import {assistantContext,assistantInputSchema} from '../src/assistantContext';
import {seedData,DEFAULT_FILTERS,report,campaignsSeed} from '../src/domain';
import {OpenAIProviders} from '../server/providers';

const data=seedData();
const payload=()=>({question:'Что происходит с продажами?',history:[] as {question:string;answer:string}[],snapshot:assistantContext(data,DEFAULT_FILTERS,'Квартал 12',campaignsSeed())});
async function harness(assistant?:any){
 const store=new Store(await mkdtemp(join(tmpdir(),'srez-ai-test-'))),app=createApp({store,assistant,models:{image:'test',analysis:'test',assistant:'test'}});
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
 const url=`http://127.0.0.1:${(server.address() as any).port}/api/assistant/replies`;
 return {store,url,post:async(body=payload(),key='request-one')=>{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(body)});return{status:r.status,body:await r.json() as any};},close:async()=>{await new Promise<void>(r=>server.close(()=>r()));store.close();}};
}
test('assistant context uses filtered aggregates in kopecks, never raw customers or receipts',()=>{
 const f={...DEFAULT_FILTERS,stores:['S1'],category:2},s=assistantContext(data,f,'Test',[]);
 assert.equal(s.current.revenue,report(data,f).revenue);assert.equal(s.stores.length,1);assert.equal(s.filters.category,'Снеки');
 const json=JSON.stringify(s);for(const field of ['birthDate','customerId','receipts','consent'])assert.ok(!json.includes('"'+field+'"'));
 assert.ok(json.length<120000);assert.equal(s.moneyUnit,'kopecks');assert.equal(s.period.previousTo,'2026-08-16');
 assert.ok(assistantInputSchema.safeParse({...payload(),snapshot:s}).success);
 assert.equal(assistantInputSchema.safeParse({...payload(),snapshot:{...s,customers:data.customers.slice(0,1)}}).success,false);
});
test('assistant is explicit when provider is not configured',async()=>{const h=await harness();try{assert.equal((await h.post()).status,503);assert.equal(h.store.all('assistant-request').length,0);}finally{await h.close();}});
test('assistant forwards history, deduplicates retries and validates before billing',async()=>{
 let calls=0;const h=await harness({reply:async(input:any)=>{calls++;assert.equal(input.history[0].question,'Первый вопрос');return{answer:'Ответ по данным',section:'sales'};}});
 try{const p={...payload(),history:[{question:'Первый вопрос',answer:'Первый ответ'}]};const a=await h.post(p),b=await h.post(p);assert.equal(a.status,200);assert.deepEqual(a.body,b.body);assert.equal(calls,1);assert.equal(a.body.provider,'openai');assert.match(a.body.context,/Демонстрационный набор/);assert.match(a.body.link,/from=2026-08-17/);assert.equal((await h.post({...p,question:'Изменённый вопрос'})).status,409);assert.equal((await h.post({...p,question:'x'.repeat(4001)},'bad')).status,400);assert.equal(calls,1);}finally{await h.close();}
});
test('provider errors do not leak credentials and do not silently fall back',async()=>{
 let calls=0;const h=await harness({reply:async()=>{calls++;throw Object.assign(new Error('secret-do-not-expose'),{status:401});}});
 try{const a=await h.post();assert.equal(a.status,502);assert.equal(a.body.code,'auth');assert.ok(!JSON.stringify(a).includes('secret-do-not-expose'));assert.equal((await h.post()).status,409);assert.equal(calls,1);}finally{await h.close();}
});
test('browser disconnect aborts assistant generation and cannot persist a late answer',async()=>{
 let start:()=>void=()=>{},finish:()=>void=()=>{};const started=new Promise<void>(r=>start=r),ended=new Promise<void>(r=>finish=r);
 const h=await harness({reply:async(_input:any,signal:AbortSignal)=>{start();await new Promise<void>(r=>signal.addEventListener('abort',()=>r(),{once:true}));finish();return{answer:'Late',section:'assistant'};}});
 try{const c=new AbortController();const response=fetch(h.url,{method:'POST',signal:c.signal,headers:{'Content-Type':'application/json','Idempotency-Key':'cancel-one'},body:JSON.stringify(payload())}).catch(()=>{});await started;c.abort();await ended;await response;await new Promise(r=>setTimeout(r,10));assert.equal(h.store.get('assistant-request','cancel-one').status,'failed');assert.equal(h.store.get('assistant-request','cancel-one').result,undefined);}finally{await h.close();}
});
test('budget survives restart, keeps uncertain calls and stops concurrent overspend',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'srez-budget-'));let store=new Store(dir);const budget=new AIBudget(store,5);
 const first=budget.reserve('image','model',2);budget.reserve('image','model',2);assert.throws(()=>budget.reserve('image','model',2),/бюджет/);
 budget.settle(first,.3);assert.equal(budget.snapshot().accountedUSD,2.3);store.close();store=new Store(dir);
 const restarted=new AIBudget(store,5);assert.equal(restarted.snapshot().uncertainRequests,1);assert.equal(restarted.snapshot().measuredUSD,.3);store.close();
});
test('usage accounting does not assume unknown models or missing usage are free',()=>{
 assert.equal(usageUSD('gpt-5.6-luna',{input_tokens:1000,output_tokens:1000}),.0014);
 assert.equal(usageUSD('gpt-image-2.5-sunburst',{input_tokens:1100,output_tokens:1000,input_tokens_details:{image_tokens:1000,text_tokens:100}}),.0385);
 assert.equal(usageUSD('unknown',{input_tokens:1,output_tokens:1}),null);assert.equal(usageUSD('gpt-image-2.5-sunburst',{}),null);
});
test('actual SDK calls bound output, disable storage/retries and select image format',async()=>{
 const p=new OpenAIProviders('test-only-not-a-secret','gpt-image-2.5-sunburst','gpt-4.1');const inputs:any[]=[];
 (p.client.responses as any).parse=async(body:any)=>{inputs.push(body);return{output_parsed:{answer:'Ответ',section:'assistant'}};};
 await p.reply(payload(),new AbortController().signal);assert.equal(inputs[0].model,'gpt-5.6-luna');assert.equal(inputs[0].store,false);assert.equal(inputs[0].max_output_tokens,2200);
 (p.client.images as any).generate=async(body:any)=>{inputs.push(body);return{data:[{b64_json:'eA=='}]};};
 await p.generate('landscape',[],'high',new AbortController().signal,'banner');assert.equal(inputs[1].size,'1536x1024');assert.equal(inputs[1].n,1);
 await p.generate('square',[],'high',new AbortController().signal,'list');assert.equal(inputs[2].size,'1024x1024');
 const before=inputs.length,c=new AbortController();c.abort();await assert.rejects(()=>p.reply(payload(),c.signal));assert.equal(inputs.length,before);
});

import {studioTextEdit} from '../src/studioTextEdits';
test('native copy edits preserve artwork and all offer conditions',()=>{
 assert.deepEqual(studioTextEdit('Замени заголовок на «Хрустящий вечер»'),{title:'Хрустящий вечер'});
 assert.deepEqual(studioTextEdit('Описание: К любимому фильму'),{description:'К любимому фильму',showDescription:true});
 assert.deepEqual(studioTextEdit('Убери описание'),{showDescription:false});
 assert.equal(studioTextEdit('Сделай фон темнее'),null);assert.equal(studioTextEdit('Сделай скидку 99%'),null);
 assert.throws(()=>studioTextEdit('Заголовок: '+'а'.repeat(141)),/140/);
});

test('cancelled image waiting still collects usage and releases only the unused reserve',async()=>{
 const store=new Store(await mkdtemp(join(tmpdir(),'srez-cancel-budget-'))),budget=new AIBudget(store,5);
 const p=new OpenAIProviders('test-only-not-a-secret','gpt-image-2.5-sunburst','gpt-4.1','gpt-5.6-luna',budget);
 let release:(v:any)=>void=()=>{},begin:()=>void=()=>{};const started=new Promise<void>(r=>begin=r);let upstream:AbortSignal|undefined;
 (p.client.images as any).generate=async(_body:any,options:any)=>{upstream=options.signal;begin();return new Promise(r=>release=r);};
 const user=new AbortController(),response=p.generate('test',[],'high',user.signal);await started;
 assert.equal(budget.snapshot().accountedUSD,.5);user.abort();assert.equal(upstream?.aborted,false);
 release({data:[{b64_json:'eA=='}],usage:{input_tokens:100,output_tokens:1000,input_tokens_details:{text_tokens:100,image_tokens:0}}});
 await response;assert.equal(budget.snapshot().uncertainRequests,0);assert.equal(budget.snapshot().accountedUSD,.0305);store.close();
});
