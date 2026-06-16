import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var frontendHost = env.FRONTEND_HOST || env.HOST || '127.0.0.1';
    var backendHost = env.BACKEND_HOST || env.HOST || '127.0.0.1';
    var frontendPort = Number(env.FRONTEND_PORT || 49220);
    var backendPort = Number(env.BACKEND_PORT || 59220);
    var backendTarget = "http://".concat(backendHost, ":").concat(backendPort);
    return {
        plugins: [react()],
        server: {
            host: frontendHost,
            port: frontendPort,
            strictPort: true,
            proxy: {
                '/api': {
                    target: backendTarget,
                    changeOrigin: true,
                },
                '/socket.io': {
                    target: backendTarget,
                    changeOrigin: true,
                    ws: true,
                },
            },
        },
    };
});
