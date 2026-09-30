import {themes} from './domain';
import type {BrandProfile} from './brandSchema';
export interface BrandChoice {id:string;name:string;version:number;primary:string;ink:string;paper:string;font:string;asset:string;logo?:string;fontUrl?:string;pattern:string;assetsCount:number;status:string;deletedAt?:string}
export function brandChoice(brand:any,profile:BrandProfile,assets:any[]):BrandChoice{
 const active=assets.filter(a=>!a.deletedAt),theme=themes.find(t=>t.id===brand.id);
 return {id:brand.id,name:profile.name,version:brand.version,primary:profile.palette.primary,ink:profile.palette.onPrimary,paper:profile.palette.canvas,font:profile.typography.display.family||profile.typography.display.fallback,asset:active.find(a=>a.mime.startsWith('image/')&&a.role!=='logo'&&profile.sourceAssets.includes(a.id))?.url||theme?.asset||'/assets/brand-neutral.svg',logo:active.find(a=>a.id===profile.logoAssetId)?.url,fontUrl:active.find(a=>a.id===profile.typography.display.assetId)?.url,pattern:profile.patterns.join(' '),assetsCount:active.length,status:profile.status,deletedAt:brand.deletedAt};
}

// Retain old styles for saved coupon designs; keep only the labelled example partner in the current catalog.
export const isVisibleBrand=(brand:{id:string;deletedAt?:string})=>!brand.deletedAt&&brand.id!=='lemon';
