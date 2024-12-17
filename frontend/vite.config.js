import * as path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  base: './',
  plugins: [react(), svgrPlugin()],
  server: {
    port: 80,
    proxy: {
      '/api': {
        target: isProduction ? 'http://team03.kwweb.duckdns.org:20302/api' : 'http://localhost:20302/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/socket.io': {
        target: isProduction ? 'http://team03.kwweb.duckdns.org:20302' : 'http://localhost:20302',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
