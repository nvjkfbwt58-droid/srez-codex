import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
export class Store {
 db:DatabaseSync;dir:string;
 constructor(dir:string){this.dir=resolve(dir);mkdirSync(this.dir,{recursive:true});mkdirSync(resolve(this.dir,'assets'),{recursive:true});this.db=new DatabaseSync(resolve(this.dir,'srez.sqlite'));this.db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records (kind TEXT NOT NULL,id TEXT NOT NULL,brand TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(kind,id)); CREATE TABLE IF NOT EXISTS idempotency (scope TEXT NOT NULL,key TEXT NOT NULL,hash TEXT NOT NULL,job TEXT NOT NULL,PRIMARY KEY(scope,key));');}
 get<T=any>(kind:string,id:string):T|undefined {const row=this.db.prepare('SELECT body FROM records WHERE kind=? AND id=?').get(kind,id) as {body:string}|undefined;return row?JSON.parse(row.body):undefined;}
 all<T=any>(kind:string,brand?:string):T[]{const rows=(brand?this.db.prepare('SELECT body FROM records WHERE kind=? AND brand=?').all(kind,brand):this.db.prepare('SELECT body FROM records WHERE kind=?').all(kind)) as {body:string}[];return rows.map(r=>JSON.parse(r.body));}
 put(kind:string,value:any){this.db.prepare('INSERT INTO records(kind,id,brand,body) VALUES(?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET brand=excluded.brand,body=excluded.body').run(kind,value.id,value.brandId||'kvartal',JSON.stringify(value));return value;}
 transaction<T>(fn:()=>T){this.db.exec('BEGIN IMMEDIATE');try{const v=fn();this.db.exec('COMMIT');return v;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 close(){this.db.close();}
}
