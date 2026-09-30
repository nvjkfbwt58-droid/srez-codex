import {PartnerStyleModal} from './PartnerStyleModal';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Plus,Palette,Trash2,Ticket,Undo2,Pencil,ArrowRight} from 'lucide-react';
import {api,useStore} from './store';
import {useBrandLibrary,refreshBrands,applyBrand,type BrandChoice} from './brandLibrary';
import {Button,Field,Modal} from './ui';
import {assetURL} from './runtime';
import {defaultDesign,defaultOffer} from './domain';
import {newCampaign} from './Campaigns';
import {CouponRenderer} from './Coupon';

export function Partners(){
 const state=useStore(),{brands,error:libraryError,loading}=useBrandLibrary(),navigate=useNavigate();
 const partners=brands.filter(b=>b.id!=='kvartal').sort((a,b)=>Number(b.id==='flanders')-Number(a.id==='flanders'));
 const [adding,setAdding]=useState(false);
 const [editing,setEditing]=useState<{id?:string;name:string}|null>(null),[removing,setRemoving]=useState<BrandChoice|null>(null),[deleted,setDeleted]=useState<string|null>(null),[saving,setSaving]=useState(false),[error,setError]=useState('');
 async function savePartner(){
  if(!editing?.name.trim()){setError('Укажите название партнёра.');return;}
  setSaving(true);setError('');
  try{
   let id=editing.id;
   if(id){const saved=await api('/brands/'+id);await api('/brands/'+id+'/versions',{...saved.profile,name:editing.name.trim()});}
   else {const created=await api<{id:string}>('/brands',{name:editing.name.trim(),primary:'#31594A'});id=created.id;}
   // The saved brand profile is the single source for the name in style pickers and partner cards.
   useStore.setState(s=>({partnerDetails:{...s.partnerDetails,[id!]:{...(s.partnerDetails[id!]||{description:'',website:'',address:'',contact:'',notes:''}),name:editing.name.trim()}}}));
   await refreshBrands();setEditing(null);navigate('/brand?style='+id+'&from=partners');
  }catch(e){setError((e as Error).message);}finally{setSaving(false);}
 }
 async function removePartner(id:string,restore=false){
  setSaving(true);setError('');
  try{await api('/brands/'+id+(restore?'/restore':''),{},restore?'POST':'DELETE');await refreshBrands();setDeleted(restore?null:id);setRemoving(null);state.notify(restore?'Партнёр восстановлен':'Партнёр убран');}
  catch(e){setError((e as Error).message);}finally{setSaving(false);}
 }
 function createCoupon(brand:BrandChoice){navigate('/campaigns/new',{state:{name:'Купон · '+brand.name,styleId:brand.id}});}
 return <div className="partner-styles">
  <section className="panel partner-style-intro">
   <div><span className="pm-eyebrow">Стили партнёров</span><h2>У каждого партнёра — свой характер.</h2><p>Соберите логотип, материалы и правила. Они станут основой для купонов и работы ИИ-дизайнера.</p><div className="row wrap"><Button primary disabled={partners.length>=30||loading} onClick={()=>{setError('');setAdding(true);}}><Plus size={17}/>Настроить стиль партнёра</Button><Button onClick={()=>navigate('/brand?style=kvartal')}><Palette size={17}/>Стиль своей сети</Button></div></div>
   <ol><li><b>Логотип и материалы</b><span>Фото, брендбук, упаковка и примеры оформления</span></li><li><b>Цвета, шрифт и тон</b><span>Ручная настройка или анализ выбранных материалов</span></li><li><b>Купон в стиле партнёра</b><span>Предпросмотр, сохранение версии и создание купона</span></li></ol>
  </section>
  {(error||libraryError)&&!editing&&!removing&&<p role="alert" className="error-box section-gap">{error||libraryError}</p>}
  {deleted&&<Button className="section-gap" disabled={saving} onClick={()=>void removePartner(deleted,true)}><Undo2 size={15}/>Вернуть удалённого партнёра</Button>}
  <div className="split section-gap"><h2>Партнёры <small>{partners.length} из 30</small></h2></div>
  <div className="partner-style-grid">{partners.map(brand=><article className="panel partner-style-card" key={brand.id}>
   <header><div className="partner-style-mark">{brand.logo?<img src={assetURL(brand.logo)} alt=""/>:<Palette size={22}/>}</div><div><h3>{brand.name}</h3><small>{brand.assetsCount} материалов · {brand.font}</small>{brand.id==='copper'&&<span className="badge sample-badge">Вымышленный пример</span>}</div><Button aria-label={'Убрать партнёра '+brand.name} disabled={saving} onClick={()=>{setError('');setRemoving(brand);}}><Trash2 size={16}/></Button></header>
   <div className="partner-coupon-preview"><CouponRenderer design={applyBrand(defaultDesign,brand)} offer={defaultOffer} format="list"/></div>
   {brand.id==='copper'&&<p className="partner-example-note">Несуществующий партнёр для примера переключения между разными стилями.</p>}
   <div className="partner-style-actions"><Button primary onClick={()=>navigate('/brand?style='+brand.id+'&from=partners')}><Palette size={16}/>Настроить стиль<ArrowRight size={15}/></Button><Button onClick={()=>createCoupon(brand)}><Ticket size={16}/>Создать купон</Button></div>
   <button className="text-button section-gap" onClick={()=>{setError('');setEditing({id:brand.id,name:brand.name});}}><Pencil size={13}/>Переименовать</button>
  </article>)}</div>
  {!partners.length&&<section className="panel empty section-gap"><h3>Добавьте первого партнёра</h3><p>Загрузите его материалы и сохраните фирменный стиль для купонов.</p></section>}
  {adding&&<PartnerStyleModal onClose={()=>setAdding(false)} onSaved={()=>{setAdding(false);state.notify('Стиль партнёра сохранён');}}/>}
  {editing&&<Modal title={editing.id?'Название партнёра':'Новый партнёр'} onClose={()=>{if(!saving)setEditing(null);}}><Field label="Название"><input autoFocus maxLength={80} value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})} placeholder="Например, Фландерс"/></Field><p>Дальше можно загрузить логотип, материалы и настроить стиль.</p>{error&&<p role="alert" className="error-box">{error}</p>}<div className="modal-actions"><Button disabled={saving} onClick={()=>setEditing(null)}>Отмена</Button><Button primary disabled={saving||!editing.name.trim()} onClick={()=>void savePartner()}>{saving?'Сохраняем…':editing.id?'Сохранить':'К материалам'}</Button></div></Modal>}
  {removing&&<Modal title={'Убрать «'+removing.name+'»?'} onClose={()=>{if(!saving)setRemoving(null);}}><p>Партнёр исчезнет из списка и выбора стиля. Готовые купоны сохранят своё оформление. Удаление можно отменить.</p>{error&&<p role="alert" className="error-box">{error}</p>}<div className="modal-actions"><Button disabled={saving} onClick={()=>setRemoving(null)}>Отмена</Button><Button primary disabled={saving} onClick={()=>void removePartner(removing.id)}>Убрать партнёра</Button></div></Modal>}
 </div>;
}
