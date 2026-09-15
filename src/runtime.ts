export const isPages = import.meta.env?.MODE === 'pages';
const localAssetURLs = new Map<string, string>();

export function publicAssetURL(path: string, base = import.meta.env?.BASE_URL || '/') {
  return path.startsWith('/assets/') || path === '/favicon.svg'
    ? base + path.slice(1)
    : path;
}

export function assetURL(path: string) {
  return isPages ? localAssetURLs.get(path) || publicAssetURL(path) : path;
}

export function rememberAsset(path: string, blob: Blob) {
  const previous = localAssetURLs.get(path);
  if (previous) URL.revokeObjectURL(previous);
  localAssetURLs.set(path, URL.createObjectURL(blob));
}
