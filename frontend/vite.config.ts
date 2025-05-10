import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/list/' : '/',

  plugins: [react()],

  server: {
    proxy: {
      // В dev любое обращение к /api/* будет проксироваться на localhost:3003/api/*
      '/api': {
        target: 'http://127.0.0.1:3003',
        changeOrigin: true,
        ws: false,
      },
    },
  },

  build: {
    outDir: 'dist',
  },
}))
