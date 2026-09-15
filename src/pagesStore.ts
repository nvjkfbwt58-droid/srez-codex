import {get, update} from 'idb-keyval';
import {themes, type Design} from './domain';
import {initialProfile} from './initialBrandProfile';
import {profileSchema, type BrandProfile} from './brandSchema';
import {designSchema} from './designSchema';
import {rememberAsset} from './runtime';

export interface LocalAsset {
  id: string; brandId: string; name: string; mime: string; url: string;
  role: string; source: string; blob?: Blob; page?: number; parentId?: string;
}
interface LocalBrand {id: string; brandId: string; name: string; version: number; versions: BrandProfile[]; assets: LocalAsset[]}
interface LocalCoupon {id: string; brandId: string; revision: number; design: Design | null}
export interface PagesData {brands: LocalBrand[]; coupons: Record<string, LocalCoupon>}
export interface PagesPersistence {
  read(): Promise<PagesData | undefined>;
  mutate<T>(fn: (data: PagesData) => T): Promise<T>;
}
export function initialPagesData(): PagesData {
  return {coupons: {}, brands: themes.map(t => {
    const paths = t.id === 'kvartal' ? [t.asset, '/assets/kvartal-air.png', '/assets/kvartal-scene.png'] : [t.asset];
    const assets = paths.map((url, i) => ({id: `example-${t.id}-${i}`, brandId: t.id, name: `Пример · ${i + 1}`, mime: 'image/png', url, role: 'style', source: 'example'}));
    return {id: t.id, brandId: t.id, name: t.name, version: 1, assets, versions: [{...initialProfile(t), sourceAssets: assets.map(a => a.id)}]};
  })};
}
const storageKey = 'srez-pages-library-v1';
const persistence: PagesPersistence = {
  read: () => get<PagesData>(storageKey),
  async mutate<T>(fn: (data: PagesData) => T) {
    let result: T;
    await update<PagesData>(storageKey, saved => {
      const data = saved || initialPagesData();
      result = fn(data);
      return data;
    });
    return result!;
  },
};

export function createPagesStore(storage: PagesPersistence) {
  const brandOf = (data: PagesData, id: string) => {
    const brand = data.brands.find(b => b.id === id);
    if (!brand) throw new Error('Сеть не найдена');
    return brand;
  };
  function ownedAsset(brand: LocalBrand, id: string) {
    const asset = brand.assets.find(a => a.id === id);
    if (!asset) throw new Error('Материал не принадлежит выбранной сети');
    return asset;
  }
  return {
    async assets() {return (await storage.read() || initialPagesData()).brands.flatMap(b => b.assets);},
    async saveAssets(brandId: string, assets: LocalAsset[]) {
      await storage.mutate(data => {
        const brand = brandOf(data, brandId);
        if (assets.some(a => a.brandId !== brandId)) throw new Error('Материал принадлежит другой сети');
        brand.assets.push(...assets);
      });
      return {assets};
    },
    async request(url: string, body?: unknown): Promise<any> {
      if (url === '/status') return {connected: false, analysisConnected: false, mode: 'pages', storage: 'browser', models: {image: 'Не подключена', analysis: 'Не подключён'}, limits: {daily: 0, concurrent: 0, fileMB: 10}};
      if (/\/(generations|edits|analyses)$/.test(url)) throw new Error('В этой версии новые AI-изображения недоступны. Для генерации и анализа нужен отдельный сервер. Готовые примеры и ручное редактирование доступны.');
      if (url.startsWith('/jobs/')) return {id: url.split('/')[2], status: 'interrupted', error: {message: 'Работа требует сервера и не выполнялась в версии GitHub Pages.'}};
      const parts = url.split('/').filter(Boolean);
      if (parts[0] === 'brands') {
        if (!parts[1]) return (await storage.read() || initialPagesData()).brands.map(({versions, assets, ...brand}) => brand);
        if (parts[2] === 'versions' && body !== undefined) {
          const profile = profileSchema.parse(body);
          return storage.mutate(data => {
            const brand = brandOf(data, parts[1]);
            if (profile.brandId !== brand.id) throw new Error('Профиль принадлежит другой сети');
            for (const id of [...profile.sourceAssets, ...profile.provenance.flatMap(p => p.sourceAssetIds), profile.logoAssetId, profile.typography.display.assetId, profile.typography.body.assetId].filter((s): s is string => !!s)) ownedAsset(brand, id);
            const next = {...profile, version: brand.version + 1, status: 'confirmed' as const};
            brand.version = next.version;
            brand.name = next.name;
            brand.versions.push(next);
            return next;
          });
        }
        if (parts.length === 2 && body === undefined) {
          const brand = brandOf(await storage.read() || initialPagesData(), parts[1]);
          return {...brand, profile: brand.versions.find(v => v.version === brand.version)};
        }
      }
      if (parts[0] === 'coupons' && /^[\w-]{1,100}$/.test(parts[1] || '') && !['__proto__', 'constructor', 'prototype'].includes(parts[1])) {
        const id = parts[1];
        if (parts[2] === 'design' && body !== undefined) {
          const input = body as {design?: unknown; expectedRevision?: number};
          const design = designSchema.parse(input.design);
          return storage.mutate(data => {
            const brand = brandOf(data, design.brandId);
            const previous = Object.hasOwn(data.coupons, id) ? data.coupons[id] : undefined;
            if (input.expectedRevision !== (previous?.revision || 0)) throw new Error('Черновик изменился в другом окне. Обновите страницу перед сохранением.');
            for (const path of [design.asset, design.logo, design.brandTokens?.fontUrl].filter((p): p is string => !!p)) {
              if (!brand.assets.some(a => a.url === path)) throw new Error('Материал не найден в библиотеке этой сети');
            }
            if (design.variantId) throw new Error('Этот AI-вариант находится на отдельном сервере. Выберите доступную композицию.');
            const revision = (previous?.revision || 0) + 1;
            const coupon = {id, brandId: design.brandId, revision, design: {...design, revision}};
            data.coupons[id] = coupon;
            return coupon;
          });
        }
        if (parts[2] === 'variants') return [];
        if (parts.length === 2 && body === undefined) {
          const data = await storage.read();
          return data && Object.hasOwn(data.coupons, id) ? data.coupons[id] : {id, brandId: 'kvartal', revision: 0, design: null};
        }
      }
      throw new Error('Это действие требует подключения сервера.');
    },
  };
}

export const pagesStore = createPagesStore(persistence);
export async function initializePages() {
  for (const asset of await pagesStore.assets()) if (asset.blob) rememberAsset(asset.url, asset.blob);
}
