import {addDays,offerDates,type Offer} from './domain';
export function firstOfferTime(offer:Offer):string|null{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(offer.from)||!/^\d{4}-\d{2}-\d{2}$/.test(offer.to)||!Number.isFinite(Date.parse(offer.from))||!Number.isFinite(Date.parse(offer.to))||offer.from>offer.to||Date.parse(offer.to)-Date.parse(offer.from)>89*86400000||!Number.isInteger(offer.hourFrom)||offer.hourFrom<0||offer.hourFrom>23)return null;
 for(let day=offer.from;day<=offer.to;day=addDays(day,1)){
  if(offer.weekdays.includes(new Date(day+'T12:00:00Z').getUTCDay()))return `${day}T${String(offer.hourFrom).padStart(2,'0')}:00`;
 }
 return null;
}
export function launchSummary(offer:Offer,recipients:number){return{recipients,reserve:recipients*offer.cap,dates:offerDates(offer),firstTime:firstOfferTime(offer)};}
