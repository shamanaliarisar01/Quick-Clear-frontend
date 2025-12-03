import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),

  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: '',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://quick-clear-backend-production.up.railway.app',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})

