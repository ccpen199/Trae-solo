import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
var frontendHost = process.env.FRONTEND_HOST || '127.0.0.1';
var frontendPort = Number(process.env.FRONTEND_PORT || process.env.PORT || 5173);
var backendTarget = process.env.VITE_API_TARGET ||
    "http://".concat(process.env.BACKEND_HOST || '127.0.0.1', ":").concat(process.env.BACKEND_PORT || 3001);
export default defineConfig({
    plugins: [react()],
    server: {
        host: frontendHost,
        port: frontendPort,
        strictPort: true,
        proxy: {
            '/api': {
                target: backendTarget,
                changeOrigin: true
            },
            '/socket.io': {
                target: backendTarget,
                changeOrigin: true,
                ws: true
            }
        }
    },
    preview: {
        host: frontendHost,
        port: frontendPort,
        strictPort: true
    }
});
