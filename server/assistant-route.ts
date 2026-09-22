import {createHash} from 'node:crypto';
import type {Express} from 'express';
import {assistantInputSchema,type AssistantInput,type AssistantOutput} from '../src/assistantContext';
import {providerError} from './providers';
import {Store} from './store';

export interface AssistantProvider {reply(input:AssistantInput,signal:AbortSignal):Promise<AssistantOutput>}
export function assistantRoute(app:Express,store:Store,provider?:AssistantProvider,model?:string){
 let active=0;
 for(const r of store.all('assistant-request'))if(r.status==='pending')store.put('assistant-request',{...r,status:'interrupted'});
 app.post('/api/assistant/replies',async(req,res)=>{
  const input=assistantInputSchema.parse(req.body);
  if(Buffer.byteLength(JSON.stringify(input))>120000)return res.status(413).json({error:'Слишком большой контекст. Сократите вопрос или период.'});
  if(!provider)return res.status(503).json({code:'not_configured',error:'OpenAI ещё не подключён на сервере. Проверьте локальный .env и перезапустите сервер.'});
  const key=req.header('Idempotency-Key');
  if(!key||!/^[-\w]{1,100}$/.test(key))return res.status(400).json({error:'Требуется ключ запроса'});
  const hash=createHash('sha256').update(JSON.stringify(input)).digest('hex'),prior=store.get('assistant-request',key);
  if(prior){
   if(prior.hash!==hash)return res.status(409).json({error:'Ключ уже использован с другим вопросом'});
   if(prior.result)return res.json(prior.result);
   return res.status(409).json({error:'Этот запрос уже отправлен. Автоматического платного повтора не будет.'});
  }
  const recent=store.all('assistant-request').filter(r=>Date.now()-r.at<60000).length;
  if(active>=2||recent>=12)return res.status(429).json({error:'Дождитесь ответа и попробуйте немного позже.'});
  const record={id:key,brandId:'system',hash,status:'pending',at:Date.now()};
  store.put('assistant-request',record);active++;
  const controller=new AbortController(),abort=()=>{if(!res.writableEnded)controller.abort();};
  res.on('close',abort);
  const timeout=setTimeout(()=>controller.abort(),90000);
  try{
   const reply=await provider.reply(input,controller.signal);
   if(controller.signal.aborted)throw Object.assign(new Error('cancelled'),{name:'AbortError'});
   const s=input.snapshot;
   const query=new URLSearchParams({from:s.period.from,to:s.period.to,stores:s.stores.map(r=>r.id).join(',')});
   const result={question:input.question,answer:reply.answer.slice(0,8000),link:reply.section==='sales'?'/sales?'+query:'/assistant',context:`${s.source} · ${s.period.from} — ${s.period.to} · ${s.network} · OpenAI ${model||''}`,provider:'openai',model};
   store.put('assistant-request',{...record,status:'ready',result});res.json(result);
  }catch(e){const error=providerError(e);store.put('assistant-request',{...record,status:'failed',error});if(!res.destroyed)res.status(502).json({error:error.message,code:error.code});}
  finally{active--;clearTimeout(timeout);res.off('close',abort);}
 });
}
