import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function getPortConfig() {
  const envPath = path.join(__dirname, '../.env');
  let frontendPort, backendPort;
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const fmatch = envContent.match(/FRONTEND_PORT=(\d+)/);
    if (fmatch) frontendPort = parseInt(fmatch[1]);
    const bmatch = envContent.match(/BACKEND_PORT=(\d+)/);
    if (bmatch) backendPort = parseInt(bmatch[1]);
  }
  
  return { frontendPort, backendPort, envPath };
}

function isPortInUse(port) {
  try {
    execSync(`lsof -ti tcp:${port}`, { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

function getPortWithSlot(slot, tail4) {
  return {
    frontend: 40000 + slot * 1000 + tail4,
    backend: 50000 + slot * 1000 + tail4
  };
}

function findAvailablePort() {
  const projectDir = path.basename(path.dirname(__dirname));
  const numMatch = projectDir.match(/-(\d+)/);
  const numStr = numMatch ? numMatch[1] : '0000';
  const tail4 = parseInt(numStr.slice(-4).padStart(4, '0'));

  const { frontendPort, backendPort, envPath } = getPortConfig();

  if (frontendPort && !isPortInUse(frontendPort)) {
    return { frontendPort, backendPort };
  }

  for (let slot = 0; slot <= 5; slot++) {
    const ports = getPortWithSlot(slot, tail4);
    if (!isPortInUse(ports.frontend)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/FRONTEND_PORT=\d+/, `FRONTEND_PORT=${ports.frontend}`);
      envContent = envContent.replace(/BACKEND_PORT=\d+/, `BACKEND_PORT=${ports.backend}`);
      envContent = envContent.replace(/API_BASE_URL=http:\/\/127\.0\.0\.1:\d+/, `API_BASE_URL=http://127.0.0.1:${ports.backend}`);
      fs.writeFileSync(envPath, envContent);
      console.log(`端口已更新: FRONTEND_PORT=${ports.frontend}, BACKEND_PORT=${ports.backend}`);
      return { frontendPort: ports.frontend, backendPort: ports.backend };
    }
  }

  console.error('所有端口槽位均被占用，请手动释放端口或调整配置');
  process.exit(1);
}

const { frontendPort, backendPort } = findAvailablePort();

export default defineConfig({
  plugins: [react()],
  server: {
    port: frontendPort,
    strictPort: true,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true
      }
    }
  }
});
