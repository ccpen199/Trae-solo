import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.join(__dirname, ".."), "");
  const FRONTEND_PORT = parseInt(env.VITE_FRONTEND_PORT || env.FRONTEND_PORT || "49078");
  const BACKEND_PORT = parseInt(env.VITE_BACKEND_PORT || env.BACKEND_PORT || "59078");
  const HOST = env.HOST || "127.0.0.1";

  return {
    plugins: [react()],
    server: {
      host: HOST,
      port: FRONTEND_PORT,
      strictPort: true,
      proxy: {
        "/api": {
          target: `http://${HOST}:${BACKEND_PORT}`,
          changeOrigin: true,
        },
        "/socket.io": {
          target: `http://${HOST}:${BACKEND_PORT}`,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    preview: {
      host: HOST,
      port: FRONTEND_PORT,
      strictPort: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      sourcemap: mode === "development",
    },
  };
});
