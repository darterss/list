import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/list/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3003', changeOrigin: true }
    }
  }
});
