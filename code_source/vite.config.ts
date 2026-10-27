import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Builds from code_source/ directly into the repository root (../)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../',
    emptyOutDir: false,
    assetsDir: 'assets',
    minify: false,
    cssMinify: false,
    rollupOptions: {
      output: {
        banner: '/*! MyPC Chess Build */\n',
        entryFileNames: 'assets/index-CcsGiZvm.js',
        chunkFileNames: 'assets/[name].js',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/index-BtfQxKnt.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
