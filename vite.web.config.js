import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'src/web',
  base: '/',
  build: {
    outDir: '../../web-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'src/web/index.html'
      }
    }
  },
  server: {
    port: 3000,
    host: true
  },
  resolve: {
    alias: {
      '@': '/src/web'
    }
  }
});
