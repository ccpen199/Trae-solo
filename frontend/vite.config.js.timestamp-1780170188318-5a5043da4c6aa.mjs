// vite.config.js
import { defineConfig, loadEnv } from "file:///Users/chen/Documents/trae_projects/local_projects/may-88822/frontend/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/chen/Documents/trae_projects/local_projects/may-88822/frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { fileURLToPath, URL } from "node:url";
import fs from "node:fs";
var __vite_injected_original_import_meta_url = "file:///Users/chen/Documents/trae_projects/local_projects/may-88822/frontend/vite.config.js";
var projectRoot = fileURLToPath(new URL("..", __vite_injected_original_import_meta_url));
var readRootEnv = () => {
  const envPath = fileURLToPath(new URL("../.env", __vite_injected_original_import_meta_url));
  if (!fs.existsSync(envPath)) return {};
  return fs.readFileSync(envPath, "utf8").split(/\r?\n/).reduce((values, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return values;
    const match = trimmed.match(/^([^=\s]+)\s*=\s*(.*)$/);
    if (!match) return values;
    const [, key, rawValue] = match;
    values[key] = rawValue.replace(/^['"]|['"]$/g, "");
    return values;
  }, {});
};
var vite_config_default = defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, projectRoot, ""), ...readRootEnv() };
  const host = "127.0.0.1";
  const frontendPort = Number(env.FRONTEND_PORT || 48822);
  const backendPort = Number(env.BACKEND_PORT || 58822);
  const backendTarget = env.API_BASE_URL || `http://127.0.0.1:${backendPort}`;
  return {
    envDir: projectRoot,
    plugins: [vue()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
      }
    },
    server: {
      host,
      port: frontendPort,
      strictPort: true,
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true
        }
      }
    },
    preview: {
      host,
      port: frontendPort,
      strictPort: true,
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvY2hlbi9Eb2N1bWVudHMvdHJhZV9wcm9qZWN0cy9sb2NhbF9wcm9qZWN0cy9tYXktODg4MjIvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9jaGVuL0RvY3VtZW50cy90cmFlX3Byb2plY3RzL2xvY2FsX3Byb2plY3RzL21heS04ODgyMi9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvY2hlbi9Eb2N1bWVudHMvdHJhZV9wcm9qZWN0cy9sb2NhbF9wcm9qZWN0cy9tYXktODg4MjIvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCdcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJ1xuXG5jb25zdCBwcm9qZWN0Um9vdCA9IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi4nLCBpbXBvcnQubWV0YS51cmwpKVxuXG5jb25zdCByZWFkUm9vdEVudiA9ICgpID0+IHtcbiAgY29uc3QgZW52UGF0aCA9IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi4vLmVudicsIGltcG9ydC5tZXRhLnVybCkpXG5cbiAgaWYgKCFmcy5leGlzdHNTeW5jKGVudlBhdGgpKSByZXR1cm4ge31cblxuICByZXR1cm4gZnMucmVhZEZpbGVTeW5jKGVudlBhdGgsICd1dGY4JylcbiAgICAuc3BsaXQoL1xccj9cXG4vKVxuICAgIC5yZWR1Y2UoKHZhbHVlcywgbGluZSkgPT4ge1xuICAgICAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpXG4gICAgICBpZiAoIXRyaW1tZWQgfHwgdHJpbW1lZC5zdGFydHNXaXRoKCcjJykpIHJldHVybiB2YWx1ZXNcblxuICAgICAgY29uc3QgbWF0Y2ggPSB0cmltbWVkLm1hdGNoKC9eKFtePVxcc10rKVxccyo9XFxzKiguKikkLylcbiAgICAgIGlmICghbWF0Y2gpIHJldHVybiB2YWx1ZXNcblxuICAgICAgY29uc3QgWywga2V5LCByYXdWYWx1ZV0gPSBtYXRjaFxuICAgICAgdmFsdWVzW2tleV0gPSByYXdWYWx1ZS5yZXBsYWNlKC9eWydcIl18WydcIl0kL2csICcnKVxuICAgICAgcmV0dXJuIHZhbHVlc1xuICAgIH0sIHt9KVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGVudiA9IHsgLi4ubG9hZEVudihtb2RlLCBwcm9qZWN0Um9vdCwgJycpLCAuLi5yZWFkUm9vdEVudigpIH1cbiAgY29uc3QgaG9zdCA9ICcxMjcuMC4wLjEnXG4gIGNvbnN0IGZyb250ZW5kUG9ydCA9IE51bWJlcihlbnYuRlJPTlRFTkRfUE9SVCB8fCA0ODgyMilcbiAgY29uc3QgYmFja2VuZFBvcnQgPSBOdW1iZXIoZW52LkJBQ0tFTkRfUE9SVCB8fCA1ODgyMilcbiAgY29uc3QgYmFja2VuZFRhcmdldCA9IGVudi5BUElfQkFTRV9VUkwgfHwgYGh0dHA6Ly8xMjcuMC4wLjE6JHtiYWNrZW5kUG9ydH1gXG5cbiAgcmV0dXJuIHtcbiAgICBlbnZEaXI6IHByb2plY3RSb290LFxuICAgIHBsdWdpbnM6IFt2dWUoKV0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSlcbiAgICAgIH1cbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgaG9zdCxcbiAgICAgIHBvcnQ6IGZyb250ZW5kUG9ydCxcbiAgICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgICBwcm94eToge1xuICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGJhY2tlbmRUYXJnZXQsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIHByZXZpZXc6IHtcbiAgICAgIGhvc3QsXG4gICAgICBwb3J0OiBmcm9udGVuZFBvcnQsXG4gICAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgICAgcHJveHk6IHtcbiAgICAgICAgJy9hcGknOiB7XG4gICAgICAgICAgdGFyZ2V0OiBiYWNrZW5kVGFyZ2V0LFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpWSxTQUFTLGNBQWMsZUFBZTtBQUN2YSxPQUFPLFNBQVM7QUFDaEIsU0FBUyxlQUFlLFdBQVc7QUFDbkMsT0FBTyxRQUFRO0FBSG1PLElBQU0sMkNBQTJDO0FBS25TLElBQU0sY0FBYyxjQUFjLElBQUksSUFBSSxNQUFNLHdDQUFlLENBQUM7QUFFaEUsSUFBTSxjQUFjLE1BQU07QUFDeEIsUUFBTSxVQUFVLGNBQWMsSUFBSSxJQUFJLFdBQVcsd0NBQWUsQ0FBQztBQUVqRSxNQUFJLENBQUMsR0FBRyxXQUFXLE9BQU8sRUFBRyxRQUFPLENBQUM7QUFFckMsU0FBTyxHQUFHLGFBQWEsU0FBUyxNQUFNLEVBQ25DLE1BQU0sT0FBTyxFQUNiLE9BQU8sQ0FBQyxRQUFRLFNBQVM7QUFDeEIsVUFBTSxVQUFVLEtBQUssS0FBSztBQUMxQixRQUFJLENBQUMsV0FBVyxRQUFRLFdBQVcsR0FBRyxFQUFHLFFBQU87QUFFaEQsVUFBTSxRQUFRLFFBQVEsTUFBTSx3QkFBd0I7QUFDcEQsUUFBSSxDQUFDLE1BQU8sUUFBTztBQUVuQixVQUFNLENBQUMsRUFBRSxLQUFLLFFBQVEsSUFBSTtBQUMxQixXQUFPLEdBQUcsSUFBSSxTQUFTLFFBQVEsZ0JBQWdCLEVBQUU7QUFDakQsV0FBTztBQUFBLEVBQ1QsR0FBRyxDQUFDLENBQUM7QUFDVDtBQUVBLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxFQUFFLEdBQUcsUUFBUSxNQUFNLGFBQWEsRUFBRSxHQUFHLEdBQUcsWUFBWSxFQUFFO0FBQ2xFLFFBQU0sT0FBTztBQUNiLFFBQU0sZUFBZSxPQUFPLElBQUksaUJBQWlCLEtBQUs7QUFDdEQsUUFBTSxjQUFjLE9BQU8sSUFBSSxnQkFBZ0IsS0FBSztBQUNwRCxRQUFNLGdCQUFnQixJQUFJLGdCQUFnQixvQkFBb0IsV0FBVztBQUV6RSxTQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixTQUFTLENBQUMsSUFBSSxDQUFDO0FBQUEsSUFDZixTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLE1BQ3REO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ047QUFBQSxNQUNBLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxVQUNOLFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxRQUNoQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0EsTUFBTTtBQUFBLE1BQ04sWUFBWTtBQUFBLE1BQ1osT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFVBQ04sUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFFBQ2hCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
