import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import net from 'net';

// 尝试读取后端端口信息
let backendPort = 3001;
try {
  const portInfoPath = path.join(__dirname, '..', 'backend', 'port-info.json');
  if (fs.existsSync(portInfoPath)) {
    const portInfo = JSON.parse(fs.readFileSync(portInfoPath, 'utf8'));
    backendPort = portInfo.backendPort || 3001;
    console.log(`检测到后端端口: ${backendPort}`);
  }
} catch (error) {
  console.warn('无法读取后端端口信息，使用默认端口 3001');
}

// 寻找可用的前端端口
function findAvailablePort(startPort: number, maxAttempts: number = 10): number {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    const server = net.createServer();
    
    try {
      server.listen(port, 'localhost');
      server.close();
      return port;
    } catch (error) {
      // 端口被占用，继续尝试
    }
  }
  
  return startPort; // 找不到可用端口时使用默认端口
}

const frontendPort = findAvailablePort(10000);
console.log(`前端将使用端口: ${frontendPort}`);

export default defineConfig({
  plugins: [react()],
  server: {
    port: frontendPort,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
      '/ws': {
        target: `ws://localhost:${backendPort}`,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
