import net from 'net';
import { RARE_PORTS } from '../config';

const COMMON_PORTS = [3000, 3001, 3002, 4200, 4300, 5173, 5174, 8080, 8081, 8082, 9000, 9001];

export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

export function isCommonPort(port: number): boolean {
  return COMMON_PORTS.includes(port);
}

export async function findAvailablePort(preferredPort: number, fallbackPorts: number[] = RARE_PORTS): Promise<number> {
  if (isCommonPort(preferredPort)) {
    console.warn(`⚠️  端口 ${preferredPort} 是常见开发端口，建议使用稀有端口以避免冲突`);
  }
  
  const portsToCheck = [preferredPort, ...fallbackPorts.filter(p => p !== preferredPort)];
  
  for (const port of portsToCheck) {
    if (isCommonPort(port) && port !== preferredPort) {
      continue;
    }
    
    const available = await isPortAvailable(port);
    if (available) {
      if (port !== preferredPort) {
        console.log(`ℹ️  首选端口 ${preferredPort} 被占用，已自动选择可用端口: ${port}`);
      }
      return port;
    }
  }
  
  throw new Error(`无法找到可用端口。已检查: ${portsToCheck.join(', ')}`);
}

export async function checkPortAndValidate(configPort: number): Promise<number> {
  console.log(`🔍 正在检查端口配置...`);
  console.log(`📋 配置端口: ${configPort}`);
  
  const available = await isPortAvailable(configPort);
  
  if (!available) {
    console.warn(`⚠️  端口 ${configPort} 已被占用，正在查找可用端口...`);
    const newPort = await findAvailablePort(configPort);
    console.log(`✅ 找到可用端口: ${newPort}`);
    return newPort;
  }
  
  if (isCommonPort(configPort)) {
    console.warn(`⚠️  建议使用稀有端口。当前配置的 ${configPort} 是常见端口，存在冲突风险`);
    console.log(`💡 推荐稀有端口: ${RARE_PORTS.slice(0, 5).join(', ')}`);
  }
  
  console.log(`✅ 端口 ${configPort} 可用`);
  return configPort;
}

export default {
  isPortAvailable,
  isCommonPort,
  findAvailablePort,
  checkPortAndValidate,
};
