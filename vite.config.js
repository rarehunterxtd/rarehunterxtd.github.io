import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
