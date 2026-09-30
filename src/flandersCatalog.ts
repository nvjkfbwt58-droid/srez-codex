import {flandersProducts,officialPartners} from './partnerCatalog';
export {flandersProducts} from './partnerCatalog';
export interface PartnerDetails {name?:string;description:string;website:string;address:string;contact:string;notes:string}
export const flandersDetails:PartnerDetails=officialPartners[0];
export const flandersMaterials=[
 {id:'official-flanders-logo',brandId:'flanders',name:'Официальный логотип Фландерс',mime:'image/webp',url:'/brand/flanders-logo.webp',role:'logo',source:'official'},
 {id:'official-flanders-font-cyr',brandId:'flanders',name:'Prata · кириллица',mime:'font/woff2',url:'/brand/flanders-prata-cyr.woff2',role:'font',source:'official'},
 {id:'official-flanders-font-latin',brandId:'flanders',name:'Prata · латиница',mime:'font/woff2',url:'/brand/flanders-prata-latin.woff2',role:'font',source:'official'},
 ...flandersProducts.map(p=>({id:'official-'+p.id,brandId:'flanders',name:p.name,mime:'image/webp',url:p.image,role:'product',source:'official'}))
];
