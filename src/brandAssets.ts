export type RemovableAsset={id:string;parentId?:string;deletedAt?:string;deletedWith?:string};
export function changeBrandAssets<T extends RemovableAsset>(assets:T[],id:string,restore=false):T[]{
 if(!assets.some(a=>a.id===id))throw Object.assign(new Error('Материал этой сети не найден'),{status:404});
 const now=new Date().toISOString();
 return assets.map(a=>{
  if(restore&&a.deletedWith===id){const next={...a};delete next.deletedAt;delete next.deletedWith;return next;}
  if(!restore&&!a.deletedAt&&(a.id===id||a.parentId===id))return{...a,deletedAt:now,deletedWith:id};
  return a;
 });
}
