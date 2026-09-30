import Papa from 'papaparse';
import {addDays,DAY,type Product,type Offer} from './domain';

export interface Partner {id:string;name:string;website:string;description:string;address:string;contact:string;notes:string;official?:boolean}
export interface PartnerProduct {id:string;partnerId:string;name:string;line:string;style:string;abv:number|null;url:string;image:string;productId?:string}
export interface StockBatch {id:string;productId:string;partnerId:string;storeId:string;quantity:number;expiresOn:string|null;lot:string;source:'demo'|'manual'|'import'}
export const officialPartners:Partner[]=[{id:'flanders',name:'Фландерс',website:'https://flanders.ru/catalog/',description:'Пивоварня полного цикла с собственным производством солода. Четыре линейки в официальном каталоге.',address:'Оренбургская область, Медногорск, Комсомольская улица, 33',contact:'',notes:'',official:true},{id:'copper',name:'Медный двор',website:'',description:'Вымышленный партнёр для примера переключения между разными партнёрами. Товары и партии — демонстрационные.',address:'',contact:'',notes:''}];
const catalogRows:[string,string,string,string,number,string][]=[
 ['flanders-lager-gold','Flanders Gold Lager','Классическое пиво','Светлый лагер',4,'medal-flanders-lager-gold-480'],
 ['flanders-helles-lager','Flanders Helles Lager','Классическое пиво','Мюнхенский хеллес',4.5,'medal-flanders-helles-480'],
 ['flanders-weissbier','Flanders Blanche','Классическое пиво','Бланш',4.5,'medal-flanders-blanche-480'],
 ['zlata-praha','Злата Прага','Классическое пиво','Чешский пилснер',4.6,'medal-zlata-praha-480'],
 ['ivan-goz','Иван Гог','Крафтовое пиво','Американский эль',5.9,'medal-ivan-goz-480'],
 ['brazilian-lager','Brazilian Lager','Крафтовое пиво','Кофейный лагер',4.5,'medal-brazilian-lager-480'],
 ['american-pale-ale','American Pale Ale','Крафтовое пиво','Эль Нового света',5.5,'medal-american-pale-ale-480'],
 ['shokoladny-lager','Шоколадный лагер','Крафтовое пиво','Международный тёмный лагер',4.5,'medal-shokoladny-lager-480'],
 ['mednogorskoe','Медногорское','Уральская коллекция','Светлое',4.5,'poster-mednogorskoe-1500'],
 ['zoloto-ermaka','Золото Ермака','Уральская коллекция','Чешский лагер',4.6,'poster-zoloto-ermaka-1500'],
 ['shamansky','Шаманский','Уральская коллекция','Конопляный эль',5.5,'poster-shamansky-el-1500'],
 ['martiniano-bianco','Martiniano Bianco','Пивные напитки','',5.5,'poster-martiniano-bianco-1500'],
 ['chyorniy-russki','Чёрный Русский','Пивные напитки','',6.9,'poster-chyorniy-russki-1500'],
 ['vishnevy-plombir','Вишнёвый Пломбир','Пивные напитки','',5.5,'poster-vishnevy-plombir-1500'],
 ['brat-granat','Брат Гранат','Пивные напитки','',6.9,'poster-brat-granat-1500'],
 ['cola-limon','Cola Лимон','Пивные напитки','',6.9,'poster-cola-limon-1500']
];
export const flandersProducts:PartnerProduct[]=catalogRows.map(([id,name,line,style,abv,image])=>({id,partnerId:'flanders',name,line,style,abv,url:`https://flanders.ru/catalog/${id}/`,image:`/brand/flanders/${image}.webp`}));
export function calendarDate(value:string){return /^\d{4}-\d\d-\d\d$/.test(value)&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
export function remainingDays(batch:StockBatch,asOf:string){return batch.expiresOn&&calendarDate(batch.expiresOn)&&calendarDate(asOf)?Math.round((Date.parse(batch.expiresOn+'T12:00Z')-Date.parse(asOf+'T12:00Z'))/DAY):null;}
export function stockStatus(batch:StockBatch,asOf:string){const days=remainingDays(batch,asOf);return days===null?'unknown':days<0?'expired':days===0?'today':days<30?'soon':'fresh';}
export function batchErrors(batch:StockBatch,products:Product[],partners:Partner[]){const errors:string[]=[];if(!batch.id.trim()||batch.id.length>100)errors.push('Укажите ID партии до 100 символов');if(!products.some(p=>p.id===batch.productId))errors.push('Выберите товар из базы');if(!partners.some(p=>p.id===batch.partnerId))errors.push('Выберите партнёра');if(!/^S([1-9]|1[0-2])$/.test(batch.storeId))errors.push('Неизвестный магазин');if(!Number.isFinite(batch.quantity)||batch.quantity<0||batch.quantity>1000000)errors.push('Остаток должен быть от 0 до 1 000 000');if(batch.expiresOn&&!calendarDate(batch.expiresOn))errors.push('Проверьте срок годности');return errors;}
export function demoBatches(today:string):StockBatch[]{return [3,4,7,8,11,12,15,16].map((n,i)=>({id:'DEMO-LOT-'+(i+1),productId:'P'+String(n).padStart(3,'0'),partnerId:'copper',storeId:'S'+(i%4+1),quantity:[18,24,9,32,15,7,28,20][i],expiresOn:i===7?null:addDays(today,[-2,0,4,9,17,29,45][i]),lot:'Условная партия '+(i+1),source:'demo'}));}
export const stockColumns=['batch_id','product_id','partner_id','store_id','quantity','expires_on','lot'];
export function parseStockCSV(text:string,products:Product[],partners:Partner[],existing:StockBatch[]){
 const parsed=Papa.parse<Record<string,string>>(text,{header:true,skipEmptyLines:true}),errors:string[]=[],rows:StockBatch[]=[];
 if(stockColumns.some(k=>!parsed.meta.fields?.includes(k)))return {rows,errors:['Используйте шаблон: отсутствуют обязательные столбцы.']};
 errors.push(...parsed.errors.map(e=>e.message));const seen=new Set<string>();
 parsed.data.forEach((r,i)=>{const b:StockBatch={id:r.batch_id.trim(),productId:r.product_id.trim(),partnerId:r.partner_id.trim(),storeId:r.store_id.trim(),quantity:r.quantity.trim()===''?NaN:Number(r.quantity),expiresOn:r.expires_on.trim()||null,lot:r.lot.trim().slice(0,150),source:'import'};const e=batchErrors(b,products,partners);if(rows.length>=10000)e.push('Максимум 10 000 партий');if(seen.has(b.id))e.push('ID партии повторяется в файле');const old=existing.find(x=>x.id===b.id);if(old&&(old.storeId!==b.storeId||old.productId!==b.productId||old.partnerId!==b.partnerId))e.push('У существующей партии другой магазин, товар или партнёр');seen.add(b.id);errors.push(...e.map(s=>`Строка ${i+2}: ${s}`));rows.push(b);});return {rows,errors};
}
export function mergeBatches(existing:StockBatch[],rows:StockBatch[]){const map=new Map(existing.map(b=>[b.id,b]));for(const b of rows)map.set(b.id,b);return [...map.values()];}

export function stockOfferErrors(batch:StockBatch|undefined,offer:Offer,today:string):string[]{
 if(!batch||batch.quantity<=0||!batch.expiresOn||batch.productId!==offer.productId||offer.category!==null||offer.stores.some(id=>id!==batch.storeId)||offer.to>batch.expiresOn||offer.from>batch.expiresOn)return ['Проверьте партию: товар, магазин, остаток и окончание акции не позже срока годности'];
 if((remainingDays(batch,today)??-1)<0)return ['Срок годности партии истёк'];return [];
}
