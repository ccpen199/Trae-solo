import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var host = env.HOST || '127.0.0.1';
    var frontendPort = Number(env.FRONTEND_PORT || 49158);
    var backendPort = Number(env.BACKEND_PORT || env.PORT || 59158);
    var apiBaseUrl = env.VITE_API_BASE_URL || "http://".concat(host, ":").concat(backendPort);
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            host: host,
            port: frontendPort,
            strictPort: true,
            proxy: {
                '/api': {
                    target: apiBaseUrl,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
    };
});
