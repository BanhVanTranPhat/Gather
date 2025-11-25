import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import inject from '@rollup/plugin-inject'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    inject({
      global: ['globalThis', 'global'],
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-phaser': ['phaser'],
          'vendor-socket': ['socket.io-client'],
          'vendor-webrtc': ['simple-peer'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      events: 'events',
      util: fileURLToPath(new URL('./src/polyfills/util.ts', import.meta.url)),
      stream: 'stream-browserify',
      globalThis: fileURLToPath(new URL('./src/polyfills/globalThis.ts', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['events', 'util', 'stream-browserify'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [],
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
})

