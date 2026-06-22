import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var host = env.HOST || '127.0.0.1';
    var frontendPort = Number(env.FRONTEND_PORT || '49308');
    var backendUrl = env.BACKEND_URL || 'http://127.0.0.1:59308';
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@shared': path.resolve(__dirname, './shared'),
            },
        },
        server: {
            host: host,
            port: frontendPort,
            strictPort: true,
            proxy: {
                '/api': {
                    target: backendUrl,
                    changeOrigin: true,
                },
            },
        },
        preview: {
            host: host,
            port: frontendPort,
            strictPort: true,
        },
    };
});
