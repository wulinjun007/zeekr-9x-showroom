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
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'fetch',
              crossorigin: 'anonymous',
              href: assetManifest['/models/zeekr-9x.glb'].url,
            },
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
