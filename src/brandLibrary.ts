import {create} from 'zustand';
import {useEffect} from 'react';
import {api} from './store';
import {themes,type Design} from './domain';
import type {BrandProfile} from './brandSchema';
import {isVisibleBrand,type BrandChoice} from './brandCatalog';
export type {BrandChoice} from './brandCatalog';
const fallback=themes.filter(isVisibleBrand).map(t=>({...t,logo:t.id==='flanders'?'/brand/flanders-logo.webp':undefined,version:1,pattern:'',assetsCount:0,status:'example'}));
const library=create<{brands:BrandChoice[];error:string;loading:boolean}>(()=>({brands:fallback,error:'',loading:false}));
let pending:Promise<void>|undefined,loaded=false;
export function refreshBrands(){if(pending)return pending;library.setState({loading:true});pending=api<BrandChoice[]>('/brands').then(brands=>{const rank=(id:string)=>id==='kvartal'?0:id==='flanders'?1:2;brands.sort((a,b)=>rank(a.id)-rank(b.id)||a.name.localeCompare(b.name,'ru'));loaded=true;library.setState({brands,error:''});}).catch(e=>library.setState({error:e.message})).finally(()=>{pending=undefined;library.setState({loading:false});});return pending;}
export function useBrandLibrary(){const state=library();useEffect(()=>{if(!loaded)void refreshBrands();},[]);return state;}
export function applyBrand(design:Design,brand:BrandChoice):Design{return {...design,brandId:brand.id,brandVersion:brand.version,asset:brand.asset,variantId:undefined,logo:brand.logo,textStyle:undefined,brandTokens:{name:brand.name,primary:brand.primary,ink:brand.ink,paper:brand.paper,font:brand.font,pattern:brand.pattern,fontUrl:brand.fontUrl}};}
