import {writeFile,mkdir} from 'node:fs/promises';
import {seedData,DEFAULT_FILTERS,campaignsSeed} from '../src/domain';
import {assistantContext} from '../src/assistantContext';
if(!process.argv.includes('--live'))throw new Error('Платная проверка запускается только с --live; заранее согласуйте бюджет.');
const base='http://127.0.0.1:4178/api';
async function call(path:string,body?:unknown){const r=await fetch(base+path,body?{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify(body)}:{});const value=await r.json() as any;if(!r.ok)throw new Error(`${r.status}: ${value.error}`);return value;}
async function job(id:string){for(let i=0;i<110;i++){const r=await call('/jobs/'+id);if(['ready','failed','cancelled','interrupted'].includes(r.status)){if(r.status!=='ready')throw new Error(r.error?.message||r.status);return r;}await new Promise(r=>setTimeout(r,2000));}throw new Error('Неизвестный результат; запрос не повторялся.');}
const initial=await call('/status');if(initial.budget?.remainingUSD<1.05)throw new Error('Для полной пробы нужен резерв $1.05.');
const snapshot=assistantContext(seedData(),DEFAULT_FILTERS,'Квартал 12',campaignsSeed());
const answer=await call('/assistant/replies',{question:'Как изменились продажи? Назови выручку в рублях, сравнение с предыдущим периодом и один следующий шаг. Не путай демонстрационные данные с рабочими.',history:[],snapshot});
console.log(JSON.stringify({step:'assistant',answer:answer.answer}));
const couponId='AI-CHECK-'+Date.now();
const input={brandId:'kvartal',prompt:'Премиальная рекламная предметная фотография снеков. Оранжевый фирменный фон Квартал 12, внизу справа компактный оранжевый пакет без надписей и тёмная керамическая чаша с рифлёными чипсами. Физически правдоподобные материалы, мягкий направленный свет, много чистого места слева для текста. Сохрани палитру и настроение референса.',referenceAssetIds:['example-kvartal-0'],brandVersion:1,draftRevision:0,count:1,quality:'high',format:'full',strictness:'strict'};
const generation=await call(`/coupons/${couponId}/generations`,input);console.log(JSON.stringify({step:'generation-started',jobId:generation.jobId,couponId}));
const original=await job(generation.jobId);console.log(JSON.stringify({step:'generation-completed',variant:original.results[0]}));
const edit=await call(`/coupons/${couponId}/variants/${original.results[0].id}/edits`,{...input,referenceAssetIds:[],prompt:'Измени только цвет керамической чаши с чипсами на светлый матовый кремовый. Сохрани пакет, чипсы, фон, свет, расположение и все остальные детали без изменений.'});
console.log(JSON.stringify({step:'edit-started',jobId:edit.jobId}));
const edited=await job(edit.jobId);const final=await call('/status');
const report={checkedAt:new Date().toISOString(),models:initial.models,couponId,assistant:answer,original:original.results[0],edited:edited.results[0],budget:final.budget};
await mkdir('storage/ai-check',{recursive:true});await writeFile('storage/ai-check/result.json',JSON.stringify(report,null,2));console.log(JSON.stringify({step:'complete',...report}));
