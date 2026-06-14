// vite.config.js
import { defineConfig, loadEnv } from "file:///Users/chen/Documents/trae_projects/local_projects/may-89069/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///Users/chen/Documents/trae_projects/local_projects/may-89069/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/Users/chen/Documents/trae_projects/local_projects/may-89069/frontend";
var vite_config_default = defineConfig(function(_a) {
  var mode = _a.mode;
  var env = loadEnv(mode, path.resolve(__vite_injected_original_dirname, ".."), "");
  var frontendPort = parseInt(env.FRONTEND_PORT || "49069");
  var backendPort = parseInt(env.BACKEND_PORT || "59069");
  return {
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      port: frontendPort,
      strictPort: true,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:".concat(backendPort),
          changeOrigin: true
        },
        "/socket.io": {
          target: "http://127.0.0.1:".concat(backendPort),
          ws: true,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: "127.0.0.1",
      port: frontendPort,
      strictPort: true
    },
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(env.VITE_API_BASE_URL || "http://127.0.0.1:".concat(backendPort, "/api")),
      "import.meta.env.VITE_FRONTEND_PORT": JSON.stringify(frontendPort),
      "import.meta.env.VITE_BACKEND_PORT": JSON.stringify(backendPort)
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvY2hlbi9Eb2N1bWVudHMvdHJhZV9wcm9qZWN0cy9sb2NhbF9wcm9qZWN0cy9tYXktODkwNjkvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9jaGVuL0RvY3VtZW50cy90cmFlX3Byb2plY3RzL2xvY2FsX3Byb2plY3RzL21heS04OTA2OS9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvY2hlbi9Eb2N1bWVudHMvdHJhZV9wcm9qZWN0cy9sb2NhbF9wcm9qZWN0cy9tYXktODkwNjkvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyhmdW5jdGlvbiAoX2EpIHtcbiAgICB2YXIgbW9kZSA9IF9hLm1vZGU7XG4gICAgdmFyIGVudiA9IGxvYWRFbnYobW9kZSwgcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJyksICcnKTtcbiAgICB2YXIgZnJvbnRlbmRQb3J0ID0gcGFyc2VJbnQoZW52LkZST05URU5EX1BPUlQgfHwgJzQ5MDY5Jyk7XG4gICAgdmFyIGJhY2tlbmRQb3J0ID0gcGFyc2VJbnQoZW52LkJBQ0tFTkRfUE9SVCB8fCAnNTkwNjknKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gICAgICAgIHNlcnZlcjoge1xuICAgICAgICAgICAgaG9zdDogJzEyNy4wLjAuMScsXG4gICAgICAgICAgICBwb3J0OiBmcm9udGVuZFBvcnQsXG4gICAgICAgICAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgICAgICAgICAgcHJveHk6IHtcbiAgICAgICAgICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBcImh0dHA6Ly8xMjcuMC4wLjE6XCIuY29uY2F0KGJhY2tlbmRQb3J0KSxcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy9zb2NrZXQuaW8nOiB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogXCJodHRwOi8vMTI3LjAuMC4xOlwiLmNvbmNhdChiYWNrZW5kUG9ydCksXG4gICAgICAgICAgICAgICAgICAgIHdzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHByZXZpZXc6IHtcbiAgICAgICAgICAgIGhvc3Q6ICcxMjcuMC4wLjEnLFxuICAgICAgICAgICAgcG9ydDogZnJvbnRlbmRQb3J0LFxuICAgICAgICAgICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgZGVmaW5lOiB7XG4gICAgICAgICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfQVBJX0JBU0VfVVJMJzogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfQVBJX0JBU0VfVVJMIHx8IFwiaHR0cDovLzEyNy4wLjAuMTpcIi5jb25jYXQoYmFja2VuZFBvcnQsIFwiL2FwaVwiKSksXG4gICAgICAgICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfRlJPTlRFTkRfUE9SVCc6IEpTT04uc3RyaW5naWZ5KGZyb250ZW5kUG9ydCksXG4gICAgICAgICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfQkFDS0VORF9QT1JUJzogSlNPTi5zdHJpbmdpZnkoYmFja2VuZFBvcnQpLFxuICAgICAgICB9LFxuICAgIH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBaVksU0FBUyxjQUFjLGVBQWU7QUFDdmEsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUd6QyxJQUFPLHNCQUFRLGFBQWEsU0FBVSxJQUFJO0FBQ3RDLE1BQUksT0FBTyxHQUFHO0FBQ2QsTUFBSSxNQUFNLFFBQVEsTUFBTSxLQUFLLFFBQVEsa0NBQVcsSUFBSSxHQUFHLEVBQUU7QUFDekQsTUFBSSxlQUFlLFNBQVMsSUFBSSxpQkFBaUIsT0FBTztBQUN4RCxNQUFJLGNBQWMsU0FBUyxJQUFJLGdCQUFnQixPQUFPO0FBQ3RELFNBQU87QUFBQSxJQUNILFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxJQUNqQixRQUFRO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixPQUFPO0FBQUEsUUFDSCxRQUFRO0FBQUEsVUFDSixRQUFRLG9CQUFvQixPQUFPLFdBQVc7QUFBQSxVQUM5QyxjQUFjO0FBQUEsUUFDbEI7QUFBQSxRQUNBLGNBQWM7QUFBQSxVQUNWLFFBQVEsb0JBQW9CLE9BQU8sV0FBVztBQUFBLFVBQzlDLElBQUk7QUFBQSxVQUNKLGNBQWM7QUFBQSxRQUNsQjtBQUFBLE1BQ0o7QUFBQSxJQUNKO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDTCxNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsSUFDaEI7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNKLHFDQUFxQyxLQUFLLFVBQVUsSUFBSSxxQkFBcUIsb0JBQW9CLE9BQU8sYUFBYSxNQUFNLENBQUM7QUFBQSxNQUM1SCxzQ0FBc0MsS0FBSyxVQUFVLFlBQVk7QUFBQSxNQUNqRSxxQ0FBcUMsS0FBSyxVQUFVLFdBQVc7QUFBQSxJQUNuRTtBQUFBLEVBQ0o7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
