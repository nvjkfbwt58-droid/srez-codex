import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dailyExpense,expenseReport,reportAfterExpenses,expensePlanSchema,type ExpensePlan} from '../src/expenses';
import {report,seedData,DEFAULT_FILTERS,stores,defaultOffer,campaignsSeed} from '../src/domain';
import {firstOfferTime} from '../src/campaignFlow';
import {assistantContext} from '../src/assistantContext';
const plan=(storeId='S1',fromMonth='2026-01',amount=100001):ExpensePlan=>({storeId,fromMonth,items:[{id:'rent',name:'Аренда',amount}]});
test('monthly costs allocate exact kopecks across partial ranges and leap days',()=>{
 for(const [from,to] of [['2024-02-01','2024-02-29'],['2026-02-01','2026-02-28'],['2026-01-01','2026-01-31']]){
  const plans=[plan('S1',from.slice(0,7))],f={from,to,stores:['S1']};
  assert.equal(expenseReport(plans,f).total,100001);
  assert.equal(expenseReport(plans,{...f,to:from.slice(0,8)+'13'}).total+expenseReport(plans,{...f,from:from.slice(0,8)+'14'}).total,100001);
 }
 assert.equal(dailyExpense([], 'S1','2026-09-01'),null);
 assert.equal(expenseReport([plan()],{from:'2026-08-01',to:'2026-08-31',stores:['S2']}).complete,false);
});
test('expense changes take effect from their month and zero is a confirmed value',()=>{
 const plans=[plan('S1','2026-01',3100),plan('S1','2026-09',6000)];
 assert.equal(expenseReport(plans,{from:'2026-08-01',to:'2026-09-30',stores:['S1']}).total,9100);
 assert.equal(expenseReport([plan('S1','2026-09',0)],{from:'2026-09-01',to:'2026-09-30',stores:['S1']}).complete,true);
 assert.equal(expenseReport(plans,{from:'2025-12-01',to:'2026-01-01',stores:['S1']}).complete,false);
 assert.equal(expensePlanSchema.safeParse(plan('S1','2026-13')).success,false);
 assert.equal(expensePlanSchema.safeParse(plan('S1','2026-09',-1)).success,false);
});
const data=seedData(),gross=report(data,DEFAULT_FILTERS);
test('net profit reconciles stores, days, comparison and assistant; incomplete inputs stay unavailable',()=>{
 const plans=stores.map(s=>plan(s.id,'2026-01',34000000));
 const result=reportAfterExpenses(gross,DEFAULT_FILTERS,plans);
 assert.equal(result.ready,true);assert.equal(result.comparable,true);
 assert.equal(result.net.profit,gross.profit-result.current.total);
 assert.equal(result.net.daily.reduce((s,d)=>s+d.profit,0),result.net.profit);
 assert.equal(result.net.stores.reduce((s,d)=>s+d.profit,0),result.net.profit);
 assert.equal(result.net.previous.profit,gross.previous.profit-result.previous.total);
 assert.equal(result.net.revenue,gross.revenue);assert.equal(result.net.count,gross.count);
 assert.equal(reportAfterExpenses(gross,DEFAULT_FILTERS,plans.slice(1)).ready,false);
 assert.equal(reportAfterExpenses({...gross,coverage:.5},DEFAULT_FILTERS,plans).ready,false);
 assert.equal(reportAfterExpenses(gross,{...DEFAULT_FILTERS,category:2},plans).ready,false);
 assert.equal(reportAfterExpenses(gross,{...DEFAULT_FILTERS,min:50000},plans).ready,false);
 const snapshot=assistantContext(data,DEFAULT_FILTERS,'Демо',[],plans);
 assert.equal(snapshot.current.profit,gross.profit);assert.equal(snapshot.operatingExpenses.netProfit,result.net.profit);
});
test('campaign demo starts on an allowed day and respects empty or invalid schedules',()=>{
 assert.equal(firstOfferTime(defaultOffer),'2026-09-16T10:00');
 assert.equal(firstOfferTime({...defaultOffer,from:'2026-09-18'}),'2026-09-23T10:00');
 assert.equal(firstOfferTime({...defaultOffer,from:'2026-09-18',to:'2026-09-20'}),null);
 assert.equal(firstOfferTime({...defaultOffer,from:''}),null);
 assert.equal(firstOfferTime({...defaultOffer,to:'2030-01-01'}),null);
 assert.equal(firstOfferTime({...defaultOffer,weekdays:[]}),null);
});
