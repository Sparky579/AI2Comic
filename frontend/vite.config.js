import { defineConfig } from 'vite'
// Force cache bust
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  cacheDir: './vite_cache',
  plugins: [react()],
  server: {
    port: 16332,
    allowedHosts: ['ai2comic.sparky.qzz.io', 'ai2comic-api.sparky.qzz.io'],
    hmr: {
      clientPort: 443,
      host: 'ai2comic.sparky.qzz.io',
    },
    cors: true,
    fs: {
      strict: false,
    },
  },
})
