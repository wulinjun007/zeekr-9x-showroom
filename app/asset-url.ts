import manifest from './asset-manifest.json' with { type: 'json' };
export function assetUrl(source: string) {
  const clean = source.split('?')[0];
  return (manifest as Record<string, { url: string }>)[clean]?.url ?? source;
}
