import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { outDir: 'dist', target: 'es2019', chunkSizeWarningLimit: 900 },
  server: { port: 5173 },
});
