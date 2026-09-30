import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {defaultOffer} from '../src/domain';
import {flandersProducts,stockStatus,stockOfferErrors,type StockBatch} from '../src/partnerCatalog';
import {flandersMaterials} from '../src/flandersCatalog';
import {createPagesStore,initialPagesData,type PagesData} from '../src/pagesStore';
test('Flanders includes all 16 products, four lines and local official materials',()=>{
 assert.equal(flandersProducts.length,16);assert.equal(new Set(flandersProducts.map(p=>p.line)).size,4);
 for(const asset of [...flandersMaterials,...flandersProducts.map(p=>({url:p.image}))])assert.ok(existsSync(resolve('public','.'+asset.url)),asset.url);
});
test('expiry bands and launch checks exclude expired, empty, mismatched and unknown batches',()=>{
 const batch:StockBatch={id:'TEST',productId:'P003',partnerId:'flanders',storeId:'S1',quantity:20,expiresOn:'2026-10-20',lot:'Test',source:'manual'};
 const offer={...defaultOffer,productId:'P003',category:null,stores:['S1'],from:'2026-09-29',to:'2026-10-12'};
 assert.deepEqual(stockOfferErrors(batch,offer,'2026-09-29'),[]);
 assert.equal(stockStatus({...batch,expiresOn:'2026-10-28'},'2026-09-29'),'soon');
 assert.equal(stockStatus({...batch,expiresOn:'2026-10-29'},'2026-09-29'),'fresh');
 for(const changed of [undefined,{...batch,quantity:0},{...batch,expiresOn:null},{...batch,expiresOn:'2026-09-28'},{...batch,storeId:'S2'}])assert.ok(stockOfferErrors(changed,offer,'2026-09-29').length);
 assert.ok(stockOfferErrors(batch,{...offer,to:'2026-10-21'},'2026-09-29').length);
});
test('existing Pages libraries gain Flanders without losing saved designs or edits',async()=>{
 let saved:PagesData=initialPagesData();saved.brands=saved.brands.filter(b=>b.id!=='flanders');saved.brands[0].name='User network';
 const store=createPagesStore({read:async()=>structuredClone(saved),mutate:async(fn)=>fn(saved)});
 const choices=await store.request('/brands');assert.ok(choices.some((b:any)=>b.id==='flanders'));assert.ok(choices.some((b:any)=>b.id==='copper'));assert.ok(!choices.some((b:any)=>b.id==='lemon'));
 assert.equal(saved.brands[0].name,'User network');const brand=await store.request('/brands/flanders');
 assert.equal(brand.profile.logoAssetId,'official-flanders-logo');assert.equal(brand.profile.typography.display.family,'Prata');assert.equal(brand.assets.length,20);
 await store.request('/brands');assert.equal(saved.brands.filter(b=>b.id==='flanders').length,1);
});
