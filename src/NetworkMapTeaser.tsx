import {ArrowUpRight,MapPin} from 'lucide-react';
import {useLocation,useNavigate} from 'react-router-dom';
import {MapSchematic} from './MapSchematic';
import {stores,type Filters} from './domain';

export function NetworkMapTeaser({filters}:{filters:Filters}){const navigate=useNavigate(),location=useLocation();return <button className="network-map-teaser" onClick={()=>navigate('/stores'+location.search)}><div className="map-teaser-icon"><MapPin size={23}/></div><div className="map-teaser-copy"><span>НОВЫЙ ВЗГЛЯД НА СЕТЬ</span><h3>Ваши магазины на карте</h3><p>Выбирайте точки, сравнивайте результаты и запускайте кампании.</p></div><div className="map-teaser-preview"><MapSchematic mini/><i className="teaser-dot one"/><i className="teaser-dot two"/><i className="teaser-dot three"/></div><span className="map-teaser-count">{filters.stores.length||stores.length}<small>магазинов</small></span><span className="map-teaser-arrow"><ArrowUpRight size={21}/></span></button>;}
