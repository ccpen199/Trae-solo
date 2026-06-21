import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
var projectRoot = new URL('.', import.meta.url).pathname;
var srcPath = new URL('./src', import.meta.url).pathname;
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, projectRoot, '');
    var host = env.VITE_HOST || '127.0.0.1';
    var port = Number(env.VITE_PORT || 5173);
    var apiTarget = env.VITE_API_TARGET || 'http://127.0.0.1:59300';
    var wsTarget = env.VITE_WS_TARGET || 'ws://127.0.0.1:59301';
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': srcPath,
            },
        },
        server: {
            port: port,
            host: host,
            strictPort: true,
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true,
                },
                '/ws': {
                    target: wsTarget,
                    ws: true,
                    changeOrigin: true,
                },
            },
        },
    };
});
