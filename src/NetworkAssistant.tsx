import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {AnimatePresence,motion} from 'motion/react';
import {ArrowUp,ArrowUpRight,Copy,RefreshCw,Plus,Ellipsis} from 'lucide-react';
import {useStore} from './store';
import {useShallow} from 'zustand/react/shallow';
import {answerQuestion} from './assistant';
import type {Filters} from './domain';
import {easeOut,useMinimalMotion} from './Motion';
import {GlassAtmosphere} from './GlassAtmosphere';

function AnswerText({text,animate}:{text:string;animate:boolean}){
 const minimal=useMinimalMotion();
 if(minimal||!animate)return <p className="assistant-answer-copy">{text}</p>;
 const words=text.split(/(\s+)/);let index=0;const total=words.filter(word=>word.trim()).length;
 return <p className="assistant-answer-copy"><span className="sr-only">{text}</span><span aria-hidden="true">{words.map((word,i)=>word.trim()?<span key={i} className="answer-word" style={{'--word-delay':`${.16+(index++/Math.max(total,1))*.8}s`} as CSSProperties}>{word}</span>:word)}</span></p>;
}

export function Assistant({filters}:{filters:Filters}){
 const state=useStore(useShallow(s=>({chat:s.chat,settings:s.settings,notify:s.notify}))),location=useLocation(),navigate=useNavigate(),minimal=useMinimalMotion();
 const [question,setQuestion]=useState(''),[visibleCount,setVisibleCount]=useState(12);
 const lastIncoming=useRef(''),composeRef=useRef<HTMLFormElement>(null),inputRef=useRef<HTMLTextAreaElement>(null),oldLength=useRef(state.chat.length);
 const existingCount=useRef(state.chat.length);
 const hasConversation=state.chat.length>0;
 const send=(text:string)=>{
  const value=text.trim();if(!value)return;
  const answer=answerQuestion(value,useStore.getState().data!,filters);
  useStore.setState(s=>({chat:[...s.chat,answer]}));setQuestion('');
 };
 useEffect(()=>{
  const incoming=location.state?.question;
  if(incoming&&lastIncoming.current!==location.key){lastIncoming.current=location.key;send(incoming);navigate(location.pathname+location.search,{replace:true,state:{}});}
 },[location.key]);
 useEffect(()=>{
  if(oldLength.current>0&&state.chat.length>oldLength.current)composeRef.current?.scrollIntoView({behavior:minimal?'auto':'smooth',block:'nearest'});
  oldLength.current=state.chat.length;
 },[state.chat.length,minimal]);
 useLayoutEffect(()=>{
  const input=inputRef.current;if(!input)return;
  const resize=()=>{input.style.height='24px';input.style.height=Math.min(120,input.scrollHeight)+'px';input.style.overflowY=input.scrollHeight>120?'auto':'hidden';};
  resize();const observer=new ResizeObserver(resize);observer.observe(input);
  return()=>observer.disconnect();
 },[question]);
 const newConversation=()=>{existingCount.current=0;setVisibleCount(12);useStore.setState({chat:[]});setQuestion('');inputRef.current?.focus({preventScroll:true});};
 return <div className={'assistant-page assistant-v3 '+(hasConversation?'has-conversation':'is-welcome')}>
  <GlassAtmosphere/>
  <header className="assistant-header">
   <h1>Помощник</h1>
   <button className="assistant-new assistant-glass" onClick={newConversation}><Plus size={16}/><span>Новый разговор</span></button>
  </header>
  <div className="assistant-stage">
   <AnimatePresence initial={false}>{!hasConversation&&<motion.div key="welcome" className="assistant-welcome-wrap" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={minimal?{duration:0}:{height:{duration:.62,ease:easeOut},opacity:{duration:.22}}}><section className="assistant-welcome">
    <h2>Знает вашу сеть.<br/><span>Объясняет главное.</span></h2>
    <p>Продажи, покупатели и кампании «{state.settings.name}» уже в контексте. Задайте вопрос — Срез сопоставит данные и покажет, что стоит за цифрами.</p>
   </section></motion.div>}</AnimatePresence>
   <form ref={composeRef} className="assistant-compose assistant-glass" onSubmit={e=>{e.preventDefault();send(question);}}>
    <label className="sr-only" htmlFor="network-question">Вопрос помощнику</label>
    <textarea ref={inputRef} id="network-question" placeholder="Что хотите узнать о вашей сети?" value={question} rows={1} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send(question);}}}/>
    <button className="assistant-send" type="submit" aria-label="Отправить вопрос" disabled={!question.trim()}><ArrowUp size={20} strokeWidth={2}/></button>
   </form>
   <div className="assistant-conversation" aria-live="polite" aria-relevant="additions">
    {state.chat.map((message,i)=>({message,i})).slice(-visibleCount).reverse().map(({message,i})=><motion.section key={i} className="assistant-exchange" initial={minimal||i<existingCount.current?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:minimal?0:.45,delay:minimal?0:state.chat.length===1?.24:0,ease:easeOut}}>
     <div className="assistant-answer">
      <AnswerText text={message.answer} animate={i>=existingCount.current}/>
      <details className="assistant-answer-details" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))e.currentTarget.open=false;}} onKeyDown={e=>{if(e.key==='Escape'){e.currentTarget.open=false;e.currentTarget.querySelector('summary')?.focus();}}}>
       <summary aria-label="Источник и действия с ответом" title="Источник и действия с ответом"><Ellipsis size={19}/></summary>
       <div className="assistant-answer-menu assistant-glass">
        <p>{message.context}</p>
        {message.link!=='/assistant'&&<button onClick={()=>navigate(message.link)}><ArrowUpRight size={16}/>Открыть данные</button>}
        <button onClick={()=>{navigator.clipboard.writeText(message.answer).then(()=>state.notify('Ответ скопирован')).catch(()=>state.notify('Не удалось скопировать ответ'));}}><Copy size={15}/>Копировать ответ</button>
        <button onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');send(message.question);}}><RefreshCw size={15}/>Повторить вопрос</button>
       </div>
      </details>
     </div>
     <div className="assistant-question"><p>{message.question}</p></div>
    </motion.section>)}
   </div>
   {state.chat.length>visibleCount&&<button className="assistant-history-more" onClick={()=>setVisibleCount(n=>n+12)}>Показать предыдущие сообщения</button>}
  </div>
 </div>;
}
