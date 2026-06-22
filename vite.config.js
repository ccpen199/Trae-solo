import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var host = env.HOST || '127.0.0.1';
    var frontendPort = Number(env.FRONTEND_PORT || 49311);
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        server: {
            host: host,
            port: frontendPort,
            strictPort: true,
        },
        preview: {
            host: host,
            port: frontendPort,
            strictPort: true,
        }
    };
});
