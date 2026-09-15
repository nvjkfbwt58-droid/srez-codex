import {writeFile, readFile, access} from 'node:fs/promises';
import {join} from 'node:path';

const root = 'dist-pages';
const html = await readFile(join(root, 'index.html'), 'utf8');
if (/\b(?:src|href)="\/(?!\/)/.test(html)) throw new Error('Pages HTML contains a root-relative asset URL');
for (const name of ['kvartal-right', 'kvartal-air', 'kvartal-scene', 'copper', 'lemon']) {
  await access(join(root, 'assets', name + '.png'));
  await access(join(root, 'assets', name + '.webp')); 
}
await writeFile(join(root, '.nojekyll'), '');
console.log('GitHub Pages package ready in dist-pages (hash routes; browser storage).');
