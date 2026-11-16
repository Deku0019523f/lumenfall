import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: false, // assets/ est copié par tools/copy-assets.mjs
  build: { outDir: 'dist', target: 'es2019', chunkSizeWarningLimit: 900 },
  server: { port: 5173 },
});
