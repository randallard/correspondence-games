/**
 * @fileoverview Vite configuration for Prisoner's Dilemma game
 * @module vite.config
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ViteYaml from '@modyfi/vite-plugin-yaml';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), ViteYaml()],
  base: '/correspondence-games/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        /**
         * Manual chunk strategy for optimal loading performance.
         * Separates vendor libraries from application code to maximize
         * browser caching effectiveness.
         */
        manualChunks: {
          // React core libraries - rarely change
          'react-vendor': ['react', 'react-dom'],
          // Crypto and compression libraries - stable
          'crypto-vendor': ['crypto-js', 'lz-string'],
          // Validation library - stable
          'zod-vendor': ['zod'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
