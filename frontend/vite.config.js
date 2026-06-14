import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'favicon-handler',
      configureServer(server) {
        server.middlewares.use('/favicon.ico', (req, res) => {
          const svgPath = path.join(__dirname, 'public', 'favicon.svg');
          if (fs.existsSync(svgPath)) {
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            fs.createReadStream(svgPath).pipe(res);
          } else {
            res.statusCode = 204;
            res.end();
          }
        });
      }
    }
  ],
  server: {
    host: '127.0.0.1',
    port: 49030,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:59030',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: '127.0.0.1',
    port: 49030,
    strictPort: true
  }
});
