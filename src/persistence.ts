import type {PersistStorage} from 'zustand/middleware';

// UI-only changes must not serialize campaign assignments and history again.
export function selectiveStorage<S extends object>():PersistStorage<S>{
 let previous:S|undefined;
 return {
  getItem(name){try{const raw=localStorage.getItem(name);if(!raw)return null;const value=JSON.parse(raw);previous=value.state;return value;}catch{return null;}},
  setItem(name,value){
   if(typeof localStorage==='undefined')return;
   const keys=Object.keys(value.state) as (keyof S)[];
   if(previous&&keys.length===Object.keys(previous).length&&keys.every(key=>Object.is(previous![key],value.state[key])))return;
   localStorage.setItem(name,JSON.stringify(value));previous=value.state;
  },
  removeItem(name){previous=undefined;if(typeof localStorage!=='undefined')localStorage.removeItem(name);},
 };
}
