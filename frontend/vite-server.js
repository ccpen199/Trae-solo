import { createServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
const projectPath = path.resolve(__dirname, '..');

let envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envConfig[key.trim()] = value.trim();
  });
}

const TAIL4 = envConfig.TAIL4 || '3395';
const SLOTS = [
  { f: 40000, b: 50000 },
  { f: 41000, b: 51000 },
  { f: 42000, b: 52000 },
  { f: 43000, b: 53000 },
  { f: 44000, b: 54000 },
  { f: 45000, b: 55000 }
];

function checkPort(port) {
  try {
    const result = execSync(`lsof -ti tcp:${port} 2>/dev/null || echo ''`, { encoding: 'utf8' }).trim();
    return result ? result.split('\n') : [];
  } catch (e) {
    return [];
  }
}

function isProjectProcess(pid, projectPath) {
  try {
    const cwd = execSync(`lsof -p ${pid} -a -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2-`, { encoding: 'utf8' }).trim();
    const cmdline = execSync(`ps -p ${pid} -o command= 2>/dev/null`, { encoding: 'utf8' }).trim();
    return cwd.includes(projectPath) || cmdline.includes('may-63395');
  } catch (e) {
    return false;
  }
}

function findAvailablePort() {
  const defaultBackend = parseInt(envConfig.BACKEND_PORT) || 53395;
  
  for (let i = 0; i < SLOTS.length; i++) {
    const frontendPort = SLOTS[i].f + parseInt(TAIL4);
    const backendPort = SLOTS[i].b + parseInt(TAIL4);
    
    const frontendPids = checkPort(frontendPort);
    let canUse = true;
    
    for (const pid of frontendPids) {
      if (isProjectProcess(pid, projectPath)) {
        console.log(`端口 ${frontendPort} 被本项目旧进程占用 (PID ${pid}), 终止中...`);
        try {
          process.kill(parseInt(pid), 'SIGTERM');
          execSync(`sleep 1`);
        } catch (e) {}
      } else {
        console.log(`端口 ${frontendPort} 被其他项目占用 (PID ${pid}), 跳过`);
        canUse = false;
        break;
      }
    }
    
    if (canUse) {
      return { frontendPort, backendPort: defaultBackend, slot: i };
    }
  }
  return null;
}

const ports = findAvailablePort();
if (!ports) {
  console.error('所有端口槽位均被占用，请手动释放端口后重试');
  process.exit(1);
}

if (ports.slot > 0) {
  envConfig.FRONTEND_PORT = ports.frontendPort;
  envConfig.CORS_ORIGIN = `http://127.0.0.1:${ports.frontendPort}`;
  
  const newEnv = Object.entries(envConfig).map(([k, v]) => `${k}=${v}`).join('\n');
  fs.writeFileSync(envPath, newEnv + '\n');
  console.log(`前端端口冲突，已切换到第 ${ports.slot + 1} 备用槽位: ${ports.frontendPort}`);
}

const server = await createServer({
  configFile: false,
  plugins: [vue()],
  server: {
    port: ports.frontendPort,
    strictPort: true,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${ports.backendPort}`,
        changeOrigin: true
      }
    }
  },
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(envConfig.API_BASE_URL || `http://127.0.0.1:${ports.backendPort}`)
  }
});

await server.listen();

console.log(`
╔══════════════════════════════════════════════════════════════╗
║          统一身份 SSO 平台 - 前端服务已启动                     ║
╠══════════════════════════════════════════════════════════════╣
║  访问地址: http://127.0.0.1:${ports.frontendPort}                        ║
║  API 代理: http://127.0.0.1:${ports.backendPort}                        ║
╚══════════════════════════════════════════════════════════════╝
`);

server.printUrls();
