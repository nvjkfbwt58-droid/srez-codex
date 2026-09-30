import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seedData,campaignsSeed,type Group} from '../src/domain';
import {demoCategories,migrateDemoRules} from '../src/demoCatalog';
import {isExampleCampaign,visibleCampaigns,withoutArchivedCampaign} from '../src/campaignLibrary';

test('demo assortment has distinct products, coherent groups and purchases across the entire catalog',()=>{
 const data=seedData(),products=new Map(data.products.map(p=>[p.id,p]));
 assert.equal(data.products.length,192);assert.equal(new Set(data.products.map(p=>p.name)).size,192);
 assert.equal(new Set(data.products.map(p=>p.groupId)).size,16);
 assert.equal(demoCategories.length,4);
 assert.ok(data.products.every(p=>p.category===(Number(p.id.slice(1))-1)%4));
 const purchased=new Set<string>();
 for(const receipt of data.receipts)for(const line of receipt.lines){
  purchased.add(line.productId);const p=products.get(line.productId)!;
  assert.equal(line.groupId,p.groupId);assert.equal(line.category,p.category);
 }
 assert.equal(purchased.size,192);
 assert.ok(!data.products.some(p=>/Светлый сорт|Классический вкус|Чипсы с солью/.test(p.name)));
});

test('old demo selections migrate recursively without changing custom rules',()=>{
 const input:Group={id:'root',logic:'AND',children:[{id:'nested',logic:'OR',children:[{id:'r',field:'category',op:'yes',value:2,window:60,values:['g-2-Чипсы с солью','category:2','custom-group']}]}]};
 const result=migrateDemoRules(input),rule=(result.children[0] as Group).children[0];
 assert.ok(!('children' in rule));assert.deepEqual(rule.values,['demo-cookies','category:2','custom-group']);
 assert.equal(migrateDemoRules(result).children.length,1);
 assert.equal(((input.children[0] as Group).children[0] as any).values[0],'g-2-Чипсы с солью');
});

test('hiding examples preserves personal coupons and handles older unlabelled examples',()=>{
 const samples=campaignsSeed(),old={...samples[0],example:undefined};
 const own={...samples[0],id:'custom',example:false};
 assert.ok(isExampleCampaign(old));assert.equal(isExampleCampaign(own),false);
 assert.deepEqual(visibleCampaigns([old,samples[1],own],false),[own]);
 assert.equal(visibleCampaigns([old,own],true).length,2);
});

test('archive deletion removes only its linked history and refuses non-archived campaigns',()=>{
 const archived={...campaignsSeed()[0],status:'archived' as const},other=campaignsSeed()[1];
 const receipt={id:'sale',type:'sale' as const,customerId:'test',storeId:'S1',at:'2026-09-14',lines:[]};
 const event={campaignId:archived.id,assignmentId:'assignment',operationId:'operation',receipt,discount:0,returnedLines:[]};
 const refund={...receipt,id:'refund',type:'return' as const,originalId:'sale'};
 const log={id:'log',campaign:archived.id,text:'Test',at:receipt.at};
 const state={campaigns:[archived,other],events:[event,{...event,campaignId:other.id,receipt:{...receipt,id:'other-sale'}}],returns:[refund,{...refund,id:'other-refund',originalId:'other-sale'}],logs:[log,{...log,id:'other-log',campaign:other.id}]};
 const next=withoutArchivedCampaign(state,archived.id)!;
 assert.deepEqual(next.campaigns,[other]);assert.equal(next.events.length,1);assert.equal(next.events[0].campaignId,other.id);
 assert.deepEqual(next.returns.map(r=>r.id),['other-refund']);assert.deepEqual(next.logs.map(l=>l.id),['other-log']);
 assert.equal(withoutArchivedCampaign(state,other.id),null);assert.equal(withoutArchivedCampaign(state,'missing'),null);
 assert.equal(state.campaigns.length,2);
});
