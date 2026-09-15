import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPagesStore, initialPagesData, type PagesData, type PagesPersistence, type LocalAsset} from '../src/pagesStore';
import {defaultDesign} from '../src/domain';
import {publicAssetURL} from '../src/runtime';

function memoryStorage(): PagesPersistence {
  let saved: PagesData | undefined;
  return {
    async read() { return saved && structuredClone(saved); },
    async mutate<T>(fn: (data: PagesData) => T) {
      const draft = structuredClone(saved || initialPagesData());
      const result = fn(draft);
      saved = draft;
      return structuredClone(result);
    },
  };
}

test('Pages keeps designs after reopening and rejects stale saves and unavailable assets', async () => {
  const storage = memoryStorage();
  const first = createPagesStore(storage);
  const saved = await first.request('/coupons/CP-104/design', {design: {...defaultDesign, title: 'Купон на сайте'}, expectedRevision: 0});
  assert.equal(saved.revision, 1);
  const reopened = createPagesStore(storage);
  assert.equal((await reopened.request('/coupons/CP-104')).design.title, 'Купон на сайте');
  await assert.rejects(reopened.request('/coupons/CP-104/design', {design: defaultDesign, expectedRevision: 0}), /другом окне/);
  await assert.rejects(reopened.request('/coupons/CP-104/design', {design: {...defaultDesign, asset: '/assets/copper.png'}, expectedRevision: 1}), /библиотеке/);
  assert.equal((await reopened.request('/coupons/CP-104')).revision, 1);
});

test('Pages persists uploaded bytes and confirmed brand versions with ownership checks', async () => {
  const storage = memoryStorage();
  const store = createPagesStore(storage);
  const asset: LocalAsset = {id: 'custom-logo', brandId: 'kvartal', name: 'Логотип', mime: 'image/svg+xml', url: '/uploads/custom-logo.svg', role: 'logo', source: 'browser', blob: new Blob(['logo-bytes'], {type: 'image/svg+xml'})};
  await store.saveAssets('kvartal', [asset]);
  const brand = await store.request('/brands/kvartal');
  const profile = await store.request('/brands/kvartal/versions', {...brand.profile, logoAssetId: asset.id});
  assert.equal(profile.version, 2);
  const reopened = createPagesStore(storage);
  const after = await reopened.request('/brands/kvartal');
  assert.equal(after.profile.logoAssetId, asset.id);
  assert.equal(await after.assets.find((a: LocalAsset) => a.id === asset.id).blob.text(), 'logo-bytes');
  await assert.rejects(store.request('/brands/copper/versions', profile), /другой сети/);
  await assert.rejects(store.saveAssets('copper', [asset]), /другой сети/);
});

test('Pages explicitly rejects AI jobs without recording fake success', async () => {
  const store = createPagesStore(memoryStorage());
  const status = await store.request('/status');
  assert.equal(status.connected, false);
  assert.equal(status.mode, 'pages');
  for (const path of ['/coupons/CP-104/generations', '/coupons/CP-104/variants/old/edits', '/brands/kvartal/analyses']) {
    await assert.rejects(store.request(path, {prompt: 'New image'}), /отдельный сервер/);
  }
  assert.deepEqual(await store.request('/coupons/CP-104/variants'), []);
  assert.equal((await store.request('/jobs/old')).status, 'interrupted');
});

test('Pages asset paths support project subdirectories and custom domains', () => {
  assert.equal(publicAssetURL('/assets/kvartal-right.png', '/srez/'), '/srez/assets/kvartal-right.png');
  assert.equal(publicAssetURL('/assets/kvartal-right.png', './'), './assets/kvartal-right.png');
  assert.equal(publicAssetURL('/favicon.svg', '/'), '/favicon.svg');
  assert.equal(publicAssetURL('/uploads/test.png', '/srez/'), '/uploads/test.png');
});
