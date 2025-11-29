import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false, // For development with self-signed certificates
        ws: true, // Enable WebSocket proxying
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
