import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
import {Store} from '../server/store';
import {createApp} from '../server/app';
import {seedData,defaultDesign,themes,report,DEFAULT_FILTERS} from '../src/domain';

// Always create a new directory: no supplied path can select a working database.
const directory=await mkdtemp(join(tmpdir(),'srez-audit-'));
const store=new Store(directory);
try {
  const baseline=new DatabaseSync(':memory:');
  try {
    baseline.exec(await readFile('db/migrations/001-initial.sql','utf8'));
    for(const table of ['records','idempotency']){
      assert.deepEqual(store.db.prepare(`PRAGMA table_info(${table})`).all(),baseline.prepare(`PRAGMA table_info(${table})`).all());
      assert.deepEqual(store.db.prepare(`PRAGMA index_list(${table})`).all(),baseline.prepare(`PRAGMA index_list(${table})`).all());
    }
  } finally { baseline.close(); }
  // No providers and no listen(): cannot call paid AI or an existing server.
  createApp({store,publicDir:resolve('public')});
  for(const brandId of ['kvartal','copper']){
    const theme=themes.find(t=>t.id===brandId)!;
    store.put('coupon',{id:'AUDIT-'+brandId,brandId,revision:0,variants:[],design:{...defaultDesign,brandId,asset:theme.asset}});
  }
  const data=seedData();
  await writeFile(join(directory,'demo-dataset.json'),JSON.stringify(data));
  await writeFile(join(directory,'empty.env'),'');
  const totals=report(data,DEFAULT_FILTERS);
  assert.equal(data.receipts.length,110873);
  assert.equal(totals.revenue,2281824350);
  const manifest={directory,database:join(directory,'srez.sqlite'),dotenv:join(directory,'empty.env'),dataset:join(directory,'demo-dataset.json'),schemaVersion:data.schemaVersion,brands:store.all('brand').map(b=>b.id),coupons:['AUDIT-kvartal','AUDIT-copper'],accounts:[],operations:data.receipts.length,revenueKopecks:totals.revenue};
  await writeFile(join(directory,'audit-manifest.json'),JSON.stringify(manifest,null,2));
  console.log(JSON.stringify(manifest,null,2));
} finally { store.close(); }
