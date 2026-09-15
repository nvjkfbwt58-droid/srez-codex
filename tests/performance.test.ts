import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seedData,report,selectReceipts,productReport,aggregate,DEFAULT_FILTERS,localDay,type Dataset} from '../src/domain';
import {selectiveStorage} from '../src/persistence';
const data=seedData();
test('indexed reports preserve signed money, receipt identity and all filters',()=>{
 for(const f of [DEFAULT_FILTERS,{...DEFAULT_FILTERS,stores:['S1','S7'],category:2,discount:'yes'},{...DEFAULT_FILTERS,product:'P003',known:'no',returns:'yes'},{...DEFAULT_FILTERS,min:80000,category:3}]){
  const r=report(data,f),selected=selectReceipts(data,f);
  assert.deepEqual(aggregate(selected),Object.fromEntries(Object.keys(aggregate([])).map(k=>[k,r[k as keyof typeof r]])));
  assert.equal(r.categories.reduce((n,c)=>n+c.revenue,0),r.revenue);
  const products=productReport(data,r.receipts,f);
  assert.equal(products.reduce((n,p)=>n+p.revenue,0),r.revenue);
  for(const p of products.filter(p=>p.count)){
   const expected=aggregate(selected.map(r=>({...r,lines:r.lines.filter(l=>l.productId===p.id)})).filter(r=>r.lines.length));
   assert.equal(p.count,expected.count);assert.equal(p.profit,expected.profit);
  }
 }
});
test('report caches respect every filter and release ownership with a dataset replacement',()=>{
 const first=report(data,DEFAULT_FILTERS);assert.equal(report(data,{...DEFAULT_FILTERS}),first);
 assert.notEqual(report(data,{...DEFAULT_FILTERS,known:'yes'}),first);
 const replacement:Dataset={...data,receipts:[]};assert.equal(report(replacement,DEFAULT_FILTERS).revenue,0);
 assert.equal(localDay('2026-09-13T22:30:00Z'),'2026-09-14');assert.equal(localDay('2026-09-14T01:30:00+03:00'),'2026-09-14');
});
test('UI-only state changes skip storage writes; actual history and settings persist synchronously',()=>{
 const values=new Map<string,string>();let writes=0;
 Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>values.get(k)||null,setItem:(k:string,v:string)=>{writes++;values.set(k,v);},removeItem:(k:string)=>values.delete(k)},configurable:true});
 const storage=selectiveStorage<{chat:string[];settings:{name:string}}>(),state={chat:[],settings:{name:'Срез'}};
 storage.setItem('test',{state,version:1});storage.setItem('test',{state:{...state},version:1});assert.equal(writes,1);
 storage.setItem('test',{state:{...state,chat:['Вопрос']},version:1});assert.equal(writes,2);assert.match(values.get('test')!,/Вопрос/);
 storage.removeItem('test');assert.equal(storage.getItem('test'),null);
});
