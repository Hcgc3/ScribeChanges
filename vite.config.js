import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Use package source directly to simplify dev and avoid FS allow issues with dist chunks
      "@music-editor/score-viewer": path.resolve(__dirname, "packages/score-viewer/src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-slider'],
          music: ['opensheetmusicdisplay', 'tone'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    fs: { allow: [path.resolve(__dirname), path.resolve(__dirname, 'packages')] },
  },
})
