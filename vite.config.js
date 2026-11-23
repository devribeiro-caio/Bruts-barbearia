import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const clientRoot = path.join(projectRoot, 'client');

export default defineConfig({
  root: clientRoot,
  plugins: [react()],
  publicDir: path.join(clientRoot, 'public'),
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    fs: { allow: [projectRoot] },
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
  build: {
    outDir: path.join(clientRoot, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
  },
});
