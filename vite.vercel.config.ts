import { fileURLToPath } from 'node:url';
import assetManifest from './app/asset-manifest.json';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';

// The showroom has no server endpoints. Deploy the same React/Three.js app to
// Vercel's CDN, while retaining the existing local Vinext/Cloudflare workflow.
export default defineConfig({
  root: fileURLToPath(new URL('./web', import.meta.url)),
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  plugins: [
    react(),
    {
      name: 'preload-primary-model',
      transformIndexHtml() {
        return [
          {
            tag: 'script',
            children: `(() => { const models = ${JSON.stringify({ zeekr: assetManifest['/models/zeekr-9x.glb'].url, n90: assetManifest['/models/n90-max-study.glb'].url })}; const key = new URLSearchParams(location.search).get('vehicle') === 'n90' ? 'n90' : 'zeekr'; const link = document.createElement('link'); link.rel = 'preload'; link.as = 'fetch'; link.crossOrigin = 'anonymous'; link.href = models[key]; document.head.appendChild(link); })();`,
            injectTo: 'head' as const,
          },
        ];
      },
    },
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
    dedupe: ['react', 'react-dom', 'three'],
  },
  css: { postcss: { plugins: [tailwindcss()] } },
  build: {
    outDir: '../dist-vercel',
    emptyOutDir: true,
    sourcemap: false,
  },
});
