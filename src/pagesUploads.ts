import {pagesStore, type LocalAsset} from './pagesStore';
import {rememberAsset} from './runtime';
import pdfWorkerURL from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

async function raster(blob: Blob) {
  const bitmap = await createImageBitmap(blob);
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 25e6) throw new Error('Изображение слишком большое: максимум 25 мегапикселей');
    const ratio = Math.min(1, 2048 / bitmap.width, 2048 / bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Не удалось прочитать изображение')), 'image/png'));
  } finally { bitmap.close(); }
}

export async function uploadPagesAssets(brandId: string, form: FormData) {
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (!files.length || files.length > 10) throw new Error('Выберите от 1 до 10 файлов');
  const result: LocalAsset[] = [];
  function add(blob: Blob, name: string, role: string, extension: string, extra: Partial<LocalAsset> = {}) {
    const id = crypto.randomUUID();
    const asset: LocalAsset = {id, brandId, name, mime: blob.type, url: `/uploads/${id}.${extension}`, role, source: 'browser', blob, ...extra};
    result.push(asset);
    return asset;
  }
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) throw new Error('Максимальный размер файла — 10 МБ');
    const ext = file.name.split('.').at(-1)?.toLowerCase() || '';
    const role = String(form.get('role') || 'style');
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) add(await raster(file), file.name, role, 'png');
    else if (ext === 'svg') {
      const text = await file.text();
      if (!/<svg[\s>]/i.test(text) || /<script|<foreignObject|on\w+\s*=|href\s*=|url\s*\(|<!ENTITY|<!DOCTYPE/i.test(text)) throw new Error('SVG содержит активное или внешнее содержимое');
      add(new Blob([text], {type: 'image/svg+xml'}), file.name, role, 'svg');
    } else if (['woff', 'woff2', 'ttf', 'otf'].includes(ext)) {
      const bytes = new Uint8Array(await file.slice(0, 4).arrayBuffer());
      const sig = Array.from(bytes, x => x.toString(16).padStart(2, '0')).join('');
      if (!['774f4646', '774f4632', '00010000', '4f54544f'].includes(sig)) throw new Error('Некорректный файл шрифта');
      add(new Blob([file], {type: `font/${ext}`}), file.name, 'font', ext);
    } else if (ext === 'pdf') {
      const {getDocument, GlobalWorkerOptions} = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = pdfWorkerURL;
      const doc = await getDocument({data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false}).promise;
      try {
        const pages = [...new Set(String(form.get('pages') || '1,2,3').split(',').map(Number))].filter(n => Number.isInteger(n) && n >= 1 && n <= doc.numPages).slice(0, 5);
        if (!pages.length) throw new Error('Укажите существующие страницы PDF');
        const parent = add(new Blob([file], {type: 'application/pdf'}), file.name, 'brandbook', 'pdf');
        for (const pageNumber of pages) {
          const page = await doc.getPage(pageNumber);
          const original = page.getViewport({scale: 1});
          const viewport = page.getViewport({scale: Math.min(1.3, 2048 / Math.max(original.width, original.height))});
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
          await page.render({canvas, canvasContext: canvas.getContext('2d')!, viewport}).promise;
          const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Не удалось прочитать страницу PDF')), 'image/png'));
          add(blob, `${file.name} · стр. ${pageNumber}`, 'style', 'png', {parentId: parent.id, page: pageNumber});
        }
      } finally { await doc.destroy(); }
    } else throw new Error('Поддерживаются PNG, JPG, WebP, безопасный SVG, PDF и шрифты');
  }
  const saved = await pagesStore.saveAssets(brandId, result);
  for (const asset of result) rememberAsset(asset.url, asset.blob!);
  return saved;
}
