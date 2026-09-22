import {Check} from 'lucide-react';
export const campaignSteps=['Кому','Предложение','Дизайн','Когда и где','Проверка'];
export function CampaignSteps({step,onStep,disabled=false}:{step:number;onStep:(step:number)=>void;disabled?:boolean}){
 return <nav className="stepper campaign-stepper" aria-label="Этапы создания купона">{campaignSteps.map((label,i)=><button key={label} disabled={disabled} className={step===i?'active':i<step?'done':''} aria-current={step===i?'step':undefined} onClick={()=>onStep(i)}><span>{i<step?<Check size={14}/>:i+1}</span>{label}</button>)}</nav>;
}
