import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, path.resolve(__dirname, '..'), '');
    var frontendPort = parseInt(env.FRONTEND_PORT || '49069');
    var backendPort = parseInt(env.BACKEND_PORT || '59069');
    return {
        plugins: [react()],
        server: {
            host: '127.0.0.1',
            port: frontendPort,
            strictPort: true,
            proxy: {
                '/api': {
                    target: "http://127.0.0.1:".concat(backendPort),
                    changeOrigin: true,
                },
                '/socket.io': {
                    target: "http://127.0.0.1:".concat(backendPort),
                    ws: true,
                    changeOrigin: true,
                },
            },
        },
        preview: {
            host: '127.0.0.1',
            port: frontendPort,
            strictPort: true,
        },
        define: {
            'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || "http://127.0.0.1:".concat(backendPort, "/api")),
            'import.meta.env.VITE_FRONTEND_PORT': JSON.stringify(frontendPort),
            'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(backendPort),
        },
    };
});
