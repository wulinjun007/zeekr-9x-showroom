import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const publicDir = path.join(root, 'public');
const assets = {};
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(file);
      continue;
    }
    if (!/\.(glb|jpg|png|webp)$/i.test(file)) continue;
    const data = fs.readFileSync(file),
      hash = createHash('sha256').update(data).digest('hex').slice(0, 16);
    const source =
      '/' + path.relative(publicDir, file).split(path.sep).join('/');
    const url = '/cdn/' + hash + source,
      dest = path.join(publicDir, url);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (!fs.existsSync(dest)) fs.writeFileSync(dest, data);
    assets[source] = {
      url,
      bytes: data.length,
      sha256: createHash('sha256').update(data).digest('hex'),
    };
  }
}
for (const dir of ['models', 'materials']) walk(path.join(publicDir, dir));
fs.writeFileSync(
  path.join(root, 'app/asset-manifest.json'),
  JSON.stringify(assets, null, 2) + '\n',
);
console.log(
  `Prepared ${Object.keys(assets).length} content-addressed resources; original model/texture bytes preserved.`,
);
