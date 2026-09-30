import {useState} from 'react';
import {PartnerStyleModal} from './PartnerStyleModal';
import {useNavigate} from 'react-router-dom';
import {Check,Plus} from 'lucide-react';
import {useBrandLibrary,applyBrand} from './brandLibrary';
import {useStore} from './store';
import type {Campaign} from './domain';
export function CouponStylePicker({campaign,disabled=false}:{campaign:Campaign;disabled?:boolean}){const {brands,error}=useBrandLibrary(),navigate=useNavigate(),[adding,setAdding]=useState(false);return <section className="coupon-style-selector"><span>Стиль купона</span><div role="group" aria-label="Стиль купона">{brands.map(b=><button key={b.id} disabled={disabled} aria-pressed={campaign.design.brandId===b.id} onClick={()=>useStore.getState().updateCampaign(campaign.id,{design:applyBrand(campaign.design,b)},'Выбран стиль купона')}><i style={{background:b.primary}}/>{b.name}{b.id==='copper'&&<small> · вымышленный пример</small>}{campaign.design.brandId===b.id&&<Check size={14}/>}</button>)}<button disabled={disabled} onClick={()=>setAdding(true)}><Plus size={15}/>Добавить партнёра</button></div>{error&&<small role="alert">Не удалось обновить библиотеку: {error}</small>}{adding&&<PartnerStyleModal onClose={()=>setAdding(false)} onSaved={brand=>{useStore.getState().updateCampaign(campaign.id,{design:applyBrand(campaign.design,brand)},'Выбран стиль партнёра');setAdding(false);}}/>}</section>;}
