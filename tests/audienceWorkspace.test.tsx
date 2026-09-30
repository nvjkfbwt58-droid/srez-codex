import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderToString} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {matches,validateGroup,audience,offerErrors,redeem,defaultOffer,defaultDesign,DEFAULT_FILTERS,seedData,type Group,type Customer,type Receipt,type Campaign} from '../src/domain';
import {assistantContext} from '../src/assistantContext';
import {couponEngagement} from '../src/couponEngagement';
import {parseProfiles} from '../src/ProfileImport';
import {parseImport,importColumns} from '../src/importer';
import {RuleEditor} from '../src/AudienceRuleEditor';
import {createPagesStore,initialPagesData} from '../src/pagesStore';
const purchase=(id:string,day:string,lines=['P003','P004']):Receipt=>({id,at:day+'T12:00:00+03:00',storeId:'S1',customerId:'00001',type:'sale',paymentMethod:'cash',lines:lines.map((productId,i)=>({id:id+'-'+i,productId,category:i+2,groupId:i?'drinks':'snacks',quantity:1,price:20000,discount:0,cost:null}))});
const customer:Customer={id:'00001',birthDate:'1990-10-20',consent:true,channel:true,contacts:0,storeId:'S1',loyalty:{gender:'female',level:'silver'},receipts:[purchase('r1','2026-09-10'),purchase('r2','2026-09-11')]};
const group=(children:Group['children'],logic:Group['logic']='AND'):Group=>({id:'root',logic,children});
test('age range and gender match only explicitly known profile facts; NOT does not include unknown',()=>{
 const rules=group([{id:'g',field:'gender',op:'eq',value:'female',window:90},{id:'age',field:'age',op:'between',value:30,upper:40,window:90}]);
 assert.equal(matches(customer,rules),true);assert.equal(matches({...customer,loyalty:undefined},rules),false);
 assert.equal(matches({...customer,birthDate:null},group([rules],'NOT')),false);
 assert.equal(matches(customer,group([{id:'age',field:'age',op:'eq',value:35,window:90}])),true);
 assert.ok(validateGroup(group([{id:'x',field:'age',op:'between',value:40,upper:20,window:90}])).length);
});
test('multiple product groups support any/all/exclusion, visit counts and history windows',()=>{
 const condition={id:'c',field:'category' as const,op:'yes',value:2,values:['snacks','drinks'],match:'all' as const,window:30};
 assert.equal(matches(customer,group([condition])),true);
 assert.equal(matches(customer,group([{...condition,values:['snacks','missing']}])) ,false);
 assert.equal(matches(customer,group([{...condition,values:['snacks','missing'],match:'any'}])),true);
 assert.equal(matches(customer,group([{...condition,values:['missing'],op:'not'}])),true);
 assert.equal(matches(customer,group([{id:'c',field:'categoryCount',target:'2',op:'eq',value:2,window:30}])),true);
 assert.equal(matches(customer,group([condition]),'2026-09-01'),false);
});
test('people are not filtered by store; unavailable channel still blocks delivery',()=>{
 const data={schemaVersion:5,start:'2026-05-17',label:'Test',products:[],customers:[customer,{...customer,id:'00002',storeId:'S12',channel:false}],receipts:customer.receipts};
 const rules=group([{id:'c',field:'count',op:'gte',value:1,window:90}]);
 assert.equal(audience(data,rules,['S9']).behavior.length,2);assert.deepEqual(audience(data,rules,['S9']).eligible.map(c=>c.id),['00001']);
});
test('missing costs and previous financial settings do not prevent a valid coupon',()=>{
 const offer={...defaultOffer,minMargin:99,budget:0,stores:['S1']},product={id:'P003',name:'Test',category:2,price:20000,cost:null,unit:'шт.'};
 assert.deepEqual(offerErrors(offer,product,1),[]);
 const c:Campaign={id:'test',name:'Test',status:'active',step:4,rules:group([]),offer,design:defaultDesign,assignments:[],created:'2026-09-14'};
 const a={id:'a',customerId:'00001',group:'offer' as const,token:'test',used:false};
 const result=redeem(c,a,purchase('r','2026-09-16',['P003']).lines,'S1','2026-09-16T12:00:00+03:00','test','operation',[]);
 assert.ok(result.event);assert.equal(result.event.receipt.couponId,'test');assert.equal(result.event.receipt.assignmentId,'a');
});
test('coupon behavior uses real assignments, with a mature repeat window and whole basket',()=>{
 const coupon={...purchase('coupon','2026-09-16'),couponId:'c',assignmentId:'a'};
 const data={schemaVersion:5,label:'Test',start:'2026-05-17',customers:[customer],products:[{id:'P003',name:'Snack',category:2,price:20000,cost:null,unit:'шт.'},{id:'P004',name:'Drink',category:3,price:20000,cost:null,unit:'шт.'}],receipts:[...customer.receipts,coupon,purchase('repeat','2026-09-20'),{...purchase('other','2026-09-24'),customerId:null}]};
 const c:Campaign={id:'c',name:'Test',status:'active',step:4,rules:group([]),offer:defaultOffer,design:defaultDesign,created:'2026-09-14',assignments:[{id:'a',customerId:'00001',group:'offer',token:'t',used:true}]};
 const result=couponEngagement(c,data,[],[],14);assert.equal(result.redeemers,1);assert.equal(result.additional,1);assert.equal(result.repeatEligible,1);assert.equal(result.repeatRate,1);
 const empty=couponEngagement({...c,assignments:[]},data,[],[],14);assert.equal(empty.redeemers,0);assert.equal(empty.unlinked,1);
});
test('profile imports keep missing values unknown and validate dates and consent',()=>{
 const result=parseProfiles('customer_id,gender,birth_date,consent,channel\n00001,female,1990-10-20,true,true',[customer]);assert.equal(result.errors.length,0);assert.equal(result.rows[0].loyalty?.gender,'female');
 const empty=parseProfiles('customer_id\n00001',[customer]);assert.equal(empty.rows[0].birthDate,null);assert.equal(empty.rows[0].loyalty?.gender,undefined);assert.equal(empty.rows[0].consent,false);
 assert.ok(parseProfiles('customer_id,birth_date\n00001,2026-02-31',[customer]).errors.length);
});
test('assistant never receives financial aggregates or demographic records',()=>{
 const data=seedData(),snapshot=assistantContext(data,DEFAULT_FILTERS,'Test',[]),text=JSON.stringify(snapshot);
 for(const field of ['revenue','profit','cost','moneyUnit','birthDate','gender','customerId'])assert.ok(!text.includes('"'+field+'"'));
 assert.ok(snapshot.current.count>0);
});
test('new partner can be created, used in a design, removed and restored in browser storage',async()=>{
 let saved=initialPagesData();const store=createPagesStore({read:async()=>saved,mutate:async fn=>fn(saved)});
 const created=await store.request('/brands',{name:'Partner',primary:'#123456'},'POST');
 const b=(await store.request('/brands')).find((b:any)=>b.id===created.id);assert.equal(b.name,'Partner');
 const savedDesign=await store.request('/coupons/custom/design',{design:{...defaultDesign,brandId:b.id,asset:b.asset,brandTokens:{name:b.name,primary:b.primary,ink:b.ink,paper:b.paper,font:b.font,pattern:''}},expectedRevision:0});assert.equal(savedDesign.design.brandId,b.id);
 await store.request('/brands/'+b.id,{},'DELETE');assert.ok(!(await store.request('/brands')).some((x:any)=>x.id===b.id));assert.equal((await store.request('/coupons/custom')).design.brandId,b.id);
 await store.request('/brands/'+b.id+'/restore',{});assert.ok((await store.request('/brands')).some((x:any)=>x.id===b.id));
});
test('rule editor exposes demographic and product groups but no finance or store filters',()=>{
 const html=renderToString(<MemoryRouter><RuleEditor value={group([{id:'a',field:'age',op:'between',value:18,upper:35,window:90}])} onChange={()=>{}}/></MemoryRouter>);
 for(const label of ['Пол','Возраст','Группа товаров','Уровень карты','Дней в программе'])assert.ok(html.includes(label));
 for(const label of ['Средний чек','Сумма покупок','Основной магазин','Маржа'])assert.ok(!html.includes(label));
});
