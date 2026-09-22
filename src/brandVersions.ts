import type {BrandProfile} from './brandSchema';

export type StoredBrandVersion=BrandProfile&{deletedAt?:string};
export const nextBrandVersion=(versions:StoredBrandVersion[])=>Math.max(0,...versions.map(v=>v.version))+1;

// Keep snapshots for existing coupons and jobs; deletion only removes a version from the library.
export function changeBrandVersion<B extends {version:number;name:string}>(brand:B,versions:StoredBrandVersion[],number:number,restore=false){
 const fail=(message:string,status:number):never=>{throw Object.assign(new Error(message),{status});};
 const target=versions.find(v=>v.version===number);
 if(!Number.isSafeInteger(number)||number<1||!target)fail('Версия стиля не найдена',404);
 const version={...target!};
 if(restore){delete version.deletedAt;return{brand,version};}
 if(version.deletedAt)return{brand,version};
 const remaining=versions.filter(v=>!v.deletedAt&&v.version!==number);
 if(!remaining.length)fail('Нельзя удалить единственную версию. Сначала сохраните новый стиль.',409);
 const fallback=remaining.reduce((a,b)=>a.version>b.version?a:b);
 return{brand:brand.version===number?{...brand,version:fallback.version,name:fallback.name}:brand,version:{...version,deletedAt:new Date().toISOString()}};
}
