import {stores, type Filters, type Campaign, defaultDesign, defaultOffer, baseSegment, DEMO_NOW} from './domain';

// Demonstration locations near the named districts, not actual retail addresses.
const locations = [
 [37.5914,55.7502,'Центр','Арбат'],[37.5144,55.8062,'Север','Сокол'],
 [37.6535,55.7419,'Центр','Таганский'],[37.5737,55.7244,'Центр','Хамовники'],
 [37.6797,55.7725,'Восток','Басманный'],[37.7460,55.6506,'Юг','Марьино'],
 [37.7892,55.7954,'Восток','Измайлово'],[37.3654,55.8461,'Запад','Митино'],
 [37.7871,55.7526,'Восток','Перово'],[37.6051,55.7658,'Центр','Тверской'],
 [37.4048,55.8042,'Запад','Строгино'],[37.5769,55.5482,'Юг','Бутово'],
] as const;
export const mapStores=stores.map((store,i)=>({...store,lng:locations[i][0],lat:locations[i][1],district:locations[i][2],area:locations[i][3]}));
export const districts=['Все районы','Центр','Север','Восток','Юг','Запад'];
export type MapMetric='revenue'|'count'|'growth';
export const validStoreIds=(ids:readonly string[])=>stores.filter(s=>ids.includes(s.id)).map(s=>s.id);
export function initialMapSelection(ids:readonly string[]){return ids.length?validStoreIds(ids):stores.map(s=>s.id);}
export function selectedFilters(filters:Filters,ids:readonly string[]):Filters {
 const valid=validStoreIds(ids);
 if(!valid.length)throw new Error('Выберите хотя бы один магазин');
 return {...filters,stores:valid.length===stores.length?[]:valid};
}
export function storeSearch(filters:Filters,ids:readonly string[],existing=''){
 const next=selectedFilters(filters,ids),params=new URLSearchParams(existing);
 params.set('from',next.from);params.set('to',next.to);
 if(next.stores.length)params.set('stores',next.stores.join(','));else params.set('stores','all');
 return '?'+params.toString();
}
export function growthPercent(current:number,previous:number){return previous>0?(current/previous-1)*100:null;}
export function createStoreCampaign(ids:readonly string[],uniqueId:string):Campaign {
 const valid=validStoreIds(ids);if(!valid.length)throw new Error('Выберите хотя бы один магазин');
 return {id:uniqueId,name:valid.length===1?'Предложение · '+stores.find(s=>s.id===valid[0])!.name:'Предложение для '+valid.length+' магазинов',status:'draft',step:0,rules:structuredClone(baseSegment),offer:{...structuredClone(defaultOffer),stores:valid},design:structuredClone(defaultDesign),assignments:[],created:DEMO_NOW};
}
export function schematicPoint(lng:number,lat:number){return {x:8+(lng-37.30)/.59*84,y:8+(55.90-lat)/.40*80};}

export function selectionTotals(rows:{id:string;revenue:number;count:number;previous:{revenue:number}}[],ids:readonly string[]){
 const included=new Set(ids);let revenue=0,count=0,previous=0;
 for(const row of rows)if(included.has(row.id)){revenue+=row.revenue;count+=row.count;previous+=row.previous.revenue;}
 return {revenue,count,average:count?Math.round(revenue/count):0,growth:growthPercent(revenue,previous)};
}
