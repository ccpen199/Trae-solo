import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var port = Number(env.PORT || 49144);
    var backendUrl = env.VITE_BACKEND_URL || 'http://127.0.0.1:59144';
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
            },
        },
        server: {
            host: '127.0.0.1',
            port: port,
            strictPort: true,
            proxy: {
                '/api': {
                    target: backendUrl,
                    changeOrigin: true,
                },
            },
        },
    };
});
