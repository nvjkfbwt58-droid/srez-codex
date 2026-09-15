import {isPages} from './runtime';

export async function uploadAssets(brandId: string, body: FormData) {
  if (isPages) return (await import('./pagesUploads')).uploadPagesAssets(brandId, body);
  const response = await fetch('/api/brands/' + brandId + '/assets', {method: 'POST', body});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Не удалось загрузить материалы');
  return result;
}
