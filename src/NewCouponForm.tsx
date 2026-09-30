import {useState} from 'react';
import {ArrowRight,Check,Plus} from 'lucide-react';
import {useBrandLibrary,applyBrand,type BrandChoice} from './brandLibrary';
import {defaultDesign,defaultOffer,type Design} from './domain';
import {Button,Field} from './ui';
import {CouponRenderer} from './Coupon';
import {PartnerStyleModal} from './PartnerStyleModal';

export function NewCouponForm({initialName='Новый купон',initialStyle='kvartal',initialDesign,onCancel,onCreate}:{initialName?:string;initialStyle?:string;initialDesign?:Design;onCancel:()=>void;onCreate:(name:string,design:Design)=>void}){
 const {brands,error,loading}=useBrandLibrary(),[name,setName]=useState(initialName),[style,setStyle]=useState(initialStyle),[adding,setAdding]=useState(false);
 const selected=brands.find(b=>b.id===style);
 function partnerAdded(brand:BrandChoice){setStyle(brand.id);setAdding(false);}
 return <section className="panel new-coupon-form">
  <span className="pm-eyebrow">Новый купон</span><h2>В каком стиле создаём?</h2>
  <p>Выберите стиль своей сети или партнёра, к которому относится акция. Аудиторию, условия и текст настроим дальше.</p>
  <div className="new-coupon-styles" role="group" aria-label="Базовый стиль купона">{brands.map(b=><button key={b.id} className={'new-coupon-style '+(style===b.id?'selected':'')} aria-pressed={style===b.id} onClick={()=>setStyle(b.id)}>
   <span className="style-choice-caption"><i style={{background:b.primary}}/><b>{b.name}</b><small>{b.id==='kvartal'?'своя сеть':b.id==='copper'?'вымышленный пример':'партнёр'}</small>{style===b.id&&<Check size={16}/>}</span>
   <span className="style-choice-preview" aria-hidden="true" inert><CouponRenderer design={applyBrand(defaultDesign,b)} offer={defaultOffer} format="list"/></span>
   <small>{b.assetsCount} материалов · {b.font}</small>
  </button>)}<button className="new-coupon-style add-style" onClick={()=>setAdding(true)}><Plus size={25}/><b>Добавить партнёра</b><small>Логотип, цвета, шрифт и материалы — без выхода из создания купона</small></button></div>
  {error&&<p className="error-box" role="alert">{error}</p>}
  {!selected&&<p role="alert">Выберите доступный стиль купона.</p>}
  <Field label="Название купона"><input maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></Field>
  <div className="modal-actions"><Button onClick={onCancel}>Отмена</Button><Button primary disabled={!name.trim()||!selected||loading} onClick={()=>{if(selected)onCreate(name.trim(),initialDesign?.brandId===selected.id?initialDesign:applyBrand(defaultDesign,selected));}}>Создать купон<ArrowRight size={16}/></Button></div>
  {adding&&<PartnerStyleModal onClose={()=>setAdding(false)} onSaved={partnerAdded}/>}
 </section>;
}
