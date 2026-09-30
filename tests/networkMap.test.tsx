import {engagementReport as activity} from '../src/engagement';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderToString} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {DEFAULT_FILTERS,defaultOffer,report,seedData,stores} from '../src/domain';
import {createStoreCampaign,initialMapSelection,mapStores,schematicPoint,selectedFilters,selectionTotals,storeSearch} from '../src/networkMapData';
import {NetworkMap} from '../src/NetworkMap';
import {NetworkMapCanvas} from '../src/NetworkMapCanvas';
import {useStore} from '../src/store';

test('map selection distinguishes no selection, all stores and a subset; links keep the period and category',()=>{
 assert.equal(initialMapSelection([]).length,12);
 assert.throws(()=>selectedFilters(DEFAULT_FILTERS,[]),/Выберите/);
 assert.deepEqual(selectedFilters(DEFAULT_FILTERS,['S4','S1','S1','unknown']).stores,['S1','S4']);
 const url=new URLSearchParams(storeSearch(DEFAULT_FILTERS,['S2'],'?category=2&stores=S8'));
 assert.equal(url.get('stores'),'S2');assert.equal(url.get('category'),'2');assert.equal(url.get('from'),DEFAULT_FILTERS.from);
 assert.equal(new URLSearchParams(storeSearch(DEFAULT_FILTERS,stores.map(s=>s.id))).get('stores'),'all');
 assert.equal(new Set(mapStores.map(s=>s.id)).size,12);
 assert.ok(mapStores.every(s=>{const p=schematicPoint(s.lng,s.lat);return p.x>0&&p.x<100&&p.y>0&&p.y<100;}));
});

test('map campaign carries only the selected stores without changing the baseline offer',()=>{
 const before=structuredClone(defaultOffer),c=createStoreCampaign(['S3','S1'],'MAP-TEST');
 assert.deepEqual(c.offer.stores,['S1','S3']);assert.equal(c.status,'draft');assert.equal(c.step,0);assert.equal(c.assignments.length,0);
 c.offer.stores.push('S8');assert.deepEqual(defaultOffer,before);assert.throws(()=>createStoreCampaign([],'EMPTY'),/Выберите/);
});

const data=seedData();
test('map visits and unique customers reconcile with the selected locations',()=>{
 const all=activity(data,DEFAULT_FILTERS),selection=['S1','S4','S7'];
 const expected=activity(data,{...DEFAULT_FILTERS,stores:selection}),actual=selectionTotals(all.stores,selection);
 assert.equal(actual.count,expected.count);assert.equal(actual.customers,expected.customers);
 assert.equal(selectionTotals(all.stores,stores.map(s=>s.id)).count,all.count);
 assert.deepEqual(selectionTotals([],[]),{count:0,customers:0,growth:null});
});

test('map opens with a stable loading state, every store and actions without starting a campaign',()=>{
 useStore.getInitialState().data=data;const before=useStore.getState().campaigns.length;
 const html=renderToString(<MemoryRouter initialEntries={['/stores']}><NetworkMap filters={DEFAULT_FILTERS} onFilters={()=>{}}/></MemoryRouter>);
 assert.match(html,/Создать кампанию/);assert.match(html,/Открыть карту на весь экран/);assert.match(html,/Загружаем карту/);
 assert.ok(!html.includes('schematic-viewport'));assert.match(html,/aria-busy="true"/);
 for(const s of stores)assert.ok(html.includes('Открыть магазин '+s.name));
 assert.ok(!html.includes('NaN'));assert.equal(useStore.getState().campaigns.length,before);
});

test('explicit lightweight mode keeps the offline map and selectable store markers',()=>{
 const html=renderToString(<NetworkMapCanvas selected={['S1']} focused={null} labels={{}} onPick={()=>{}} onStatus={()=>{}} schematic/>);
 assert.match(html,/Демонстрационная схема магазинов/);assert.ok(!html.includes('Загружаем карту'));
 assert.equal((html.match(/class="store-pin /g)||[]).length,stores.length);
 assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
});
