import {test} from 'node:test';
import assert from 'node:assert/strict';
import {storeAverageCheck,storeAverageValues} from '../src/storeAverageCheck';
import type {Dataset,Receipt} from '../src/domain';
const receipt=(id:string,day:string,amount:number,extra:Partial<Receipt>={}):Receipt=>({id,storeId:'S1',customerId:null,at:day+'T12:00:00+03:00',type:'sale',lines:[{id,productId:'P1',quantity:1,price:amount+100,discount:100,cost:null}],...extra});
const dataset=(receipts:Receipt[]):Dataset=>({schemaVersion:1,receipts,products:[],customers:[],start:'2026-09-01',label:'Test'});
test('average check uses full discounted sale receipts, weighted across days, and equal previous period',()=>{
 const data=dataset([receipt('a','2026-09-01',10000),receipt('b','2026-09-02',30000),receipt('c','2026-09-03',30000),receipt('d','2026-09-03',50000),receipt('e','2026-09-04',10000),receipt('return','2026-09-03',10000,{type:'return'}),receipt('other','2026-09-03',90000,{storeId:'S2'})]);
 const r=storeAverageCheck(data,{from:'2026-09-03',to:'2026-09-04',stores:[],category:99},'S1');
 assert.equal(r.before,20000);assert.equal(r.now,30000);assert.equal(r.change,50);assert.equal(r.count,3);assert.deepEqual(r.daily.map(d=>d.value),[40000,10000]);assert.equal(r.previousFrom,'2026-09-01');assert.equal(r.previousTo,'2026-09-02');
});
test('missing days and missing comparison remain unknown; valid zero is preserved',()=>{
 const r=storeAverageCheck(dataset([receipt('free','2026-09-03',0)]),{from:'2026-09-03',to:'2026-09-04',stores:[]},'S1');
 assert.equal(r.now,0);assert.equal(r.before,null);assert.equal(r.change,null);assert.deepEqual(r.daily.map(d=>d.value),[0,null]);
});

test('map marker average matches the focused store chart',()=>{
 const data=dataset([receipt('a','2026-09-03',10000),receipt('b','2026-09-03',30000),receipt('c','2026-09-03',70000,{storeId:'S2'}),receipt('r','2026-09-03',90000,{type:'return'})]);
 const filters={from:'2026-09-03',to:'2026-09-04',stores:['S2']};
 const values=storeAverageValues(data,filters);
 assert.equal(values.S1,storeAverageCheck(data,filters,'S1').now);assert.equal(values.S2,70000);assert.equal(values.S3,undefined);
});
