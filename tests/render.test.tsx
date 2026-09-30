import React from 'react';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderToString} from 'react-dom/server';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
import {seedData,DEFAULT_FILTERS,defaultOffer,defaultDesign,audience,assign,money,num} from '../src/domain';
import {useStore} from '../src/store';
import {NetworkHome} from '../src/NetworkHome';
import {Partners} from '../src/Partners';
import {CouponResults} from '../src/CouponResults';
import {Assistant} from '../src/NetworkAssistant';
import {Customers} from '../src/Customers';
import {Campaigns,CampaignEditor} from '../src/Campaigns';
import {Studio} from '../src/Studio';
import {DataPage,SettingsPage} from '../src/WorkspacePages';
import {CouponRenderer} from '../src/Coupon';
const memory=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>memory.get(k)||null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)},configurable:true});
Object.defineProperty(globalThis,'location',{value:{search:'',pathname:'/overview'},configurable:true});
const data=seedData();useStore.setState({data});useStore.getInitialState().data=data;
test('all page components render real content without JSX/runtime errors (server smoke, not browser QA)',()=>{const cases:[string,React.ReactNode,string][]=[['/home',<NetworkHome filters={DEFAULT_FILTERS}/>,'Знать привычки.'],['/customers',<Customers/>,'Условия сегмента'],['/campaigns',<Campaigns/>,'Вернуть в будни'],['/campaigns/CP-104',<CampaignEditor/>,'Покупатели по условиям'],['/coupons/CP-104/design',<Studio/>,'Студия купонов'],['/partners',<Partners/>,'Партнёры'],['/assistant',<Assistant filters={DEFAULT_FILTERS}/>,'Знает вашу сеть.'],['/results',<CouponResults/>,'Меняется ли поведение'],['/data',<DataPage/>,'Импорт чеков'],['/settings',<SettingsPage/>,'OpenAI']];for(const [path,node,text] of cases){const html=renderToString(<MemoryRouter initialEntries={[path]}><Routes><Route path={path.includes('/design')?'/coupons/:id/design':path.startsWith('/campaigns/')?'/campaigns/:id':path.startsWith('/experiments/')?'/experiments/:id':path} element={node}/></Routes></MemoryRouter>);assert.ok(html.length>1000,path);assert.ok(html.includes(text)||path==='/overview',path);assert.ok(!html.includes('NaN'),path);}});
test('all coupon formats bind the same offer and do not disclose assignment tokens',()=>{for(const format of ['full','list','banner'] as const){const html=renderToString(<CouponRenderer design={defaultDesign} offer={defaultOffer} format={format}/>);assert.match(html,/16–17 сентября и 23–24 сентября/);assert.match(html,/10/);assert.ok(!html.includes('DEMO-CP-'));}});

test('campaign card reserve agrees with actual assignments for an odd eligible audience',()=>{
 const campaign=useStore.getInitialState().campaigns.find(c=>c.id==='CP-104')!;
 const candidates=audience(data,campaign.rules,campaign.offer.stores).eligible;
 const fixture=candidates.length%2?data:{...data,customers:data.customers.filter(c=>c.id!==candidates[0].id)};
 const eligible=audience(fixture,campaign.rules,campaign.offer.stores).eligible;
 assert.equal(eligible.length%2,1);
 useStore.getInitialState().data=fixture;
 try {
 const offered=assign(eligible.map(c=>c.id),campaign.id,campaign.offer.control).filter(a=>a.group==='offer').length;
 const html=renderToString(<MemoryRouter><Campaigns/></MemoryRouter>).replaceAll('&#x27;',"'");
 assert.ok(!html.includes('Максимум скидок'));assert.ok(!html.includes('Маржа'));
 assert.ok(html.includes('<strong>'+num(offered)+'</strong>'));
 } finally {useStore.getInitialState().data=data;}
});

test('coupon text styling survives schema validation and is applied to every export format',async()=>{
 const {designSchema}=await import('../src/designSchema');
 const styled={...defaultDesign,fontSize:36,align:'right' as const,textStyle:{titleColor:'#123456',descriptionColor:'#654321',benefitColor:'#abcdef',fontFamily:'Georgia' as const,titleWeight:500 as const,titleItalic:true,lineHeight:1.3,letterSpacing:1.2,descriptionSize:18}};
 assert.deepEqual(designSchema.parse(styled),styled);
 for(const format of ['full','list','banner'] as const){const html=renderToString(<CouponRenderer design={styled} offer={defaultOffer} format={format}/>);assert.ok(html.includes('#123456'));assert.ok(html.includes('#abcdef'));assert.ok(html.includes('font-family:Georgia'));assert.ok(html.includes('font-style:italic'));assert.ok(html.includes('text-align:right'));}
 assert.equal(designSchema.safeParse({...styled,textStyle:{titleColor:'url(evil)'}}).success,false);
});

test('coupon workflow exposes five steps, a saved-design continuation and clear launch controls',async()=>{
 const {CampaignSteps}=await import('../src/CampaignSteps');
 const {CampaignLaunch}=await import('../src/CampaignLaunch');
 const steps=renderToString(<CampaignSteps step={2} onStep={()=>{}}/>);
 assert.equal((steps.match(/<button/g)||[]).length,5);assert.ok(steps.includes('aria-current="step"'));
 const studio=renderToString(<MemoryRouter initialEntries={['/coupons/CP-104/design']}><Routes><Route path="/coupons/:id/design" element={<Studio/>}/></Routes></MemoryRouter>);
 assert.ok(studio.includes('Дизайн готов · продолжить'));assert.ok(studio.includes('Когда и где'));assert.ok(studio.includes('Проверка'));
 const original=useStore.getInitialState().campaigns;
 try{
  for(const [step,label] of [[3,'К проверке'],[4,'Создать назначения']] as const){
   useStore.getInitialState().campaigns=original.map(c=>c.id==='CP-104'?{...c,step}:c);
   const html=renderToString(<MemoryRouter initialEntries={['/campaigns/CP-104']}><Routes><Route path="/campaigns/:id" element={<CampaignEditor/>}/></Routes></MemoryRouter>);
   assert.ok(html.includes(label));
  }
  const scheduled={...original[0],status:'scheduled' as const,assignments:assign(['00001','00002'],'CP-104',50)};
  const launch=renderToString(<CampaignLaunch campaign={scheduled} onCash={()=>{}}/>);
  assert.ok(launch.includes('Запустить демо'));assert.ok(launch.includes('первая разрешённая дата'));
 }finally{useStore.getInitialState().campaigns=original;}
});

test('expanded chart provides a visible return action',async()=>{
 const {SalesChart}=await import('../src/SalesChart');
 const {report}=await import('../src/domain');
 const html=renderToString(<SalesChart r={report(data,DEFAULT_FILTERS)} expanded onExit={()=>{}}/>);
 assert.ok(html.includes('Вернуться к панели'));assert.ok(!html.includes('Открыть график на весь экран'));
});
