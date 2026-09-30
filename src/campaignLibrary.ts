import type {Campaign,Receipt,Redemption} from './domain';

const exampleIds=new Set(['CP-104','CP-105','CP-097']);
export function isExampleCampaign(c:Campaign){return c.example??exampleIds.has(c.id);}
export function visibleCampaigns(campaigns:Campaign[],showExamples:boolean){return showExamples?campaigns:campaigns.filter(c=>!isExampleCampaign(c));}

interface CampaignHistory {
 campaigns:Campaign[];events:Redemption[];returns:Receipt[];
 logs:{id:string;campaign:string;text:string;at:string}[];
}
export function withoutArchivedCampaign(state:CampaignHistory,id:string):CampaignHistory|null{
 if(state.campaigns.find(c=>c.id===id)?.status!=='archived')return null;
 const sales=new Set(state.events.filter(e=>e.campaignId===id).map(e=>e.receipt.id));
 return {
  campaigns:state.campaigns.filter(c=>c.id!==id),events:state.events.filter(e=>e.campaignId!==id),
  returns:state.returns.filter(r=>r.couponId!==id&&(!r.originalId||!sales.has(r.originalId))),
  logs:state.logs.filter(l=>l.campaign!==id),
 };
}
