import type {Design} from './domain';
// Exact copy changes stay editable and cost nothing. Visual instructions continue
// to the image model. Offer fields are deliberately absent from this patch type.
export function studioTextEdit(text:string):Partial<Pick<Design,'title'|'description'|'showDescription'>>|null {
 const value=text.trim();
 if(/^(?:убери|скрой|выключи)\s+описание[.!]?$/i.test(value))return{showDescription:false};
 if(/^(?:покажи|верни|включи)\s+описание[.!]?$/i.test(value))return{showDescription:true};
 const m=value.match(/^(?:(?:измени|замени|поменяй)\s+)?(заголовок|название|описание)\s*(?::\s*|на\s+)([\s\S]+)$/i);
 if(!m)return null;
 const copy=m[2].trim().replace(/^[«“"]|[»”"]$/g,'');
 if(m[1].toLowerCase()==='описание'){
  if(copy.length>240)throw new Error('Описание должно быть не длиннее 240 символов.');
  return{description:copy,showDescription:true};
 }
 if(copy.length>140)throw new Error('Заголовок должен быть не длиннее 140 символов.');
 return{title:copy};
}
