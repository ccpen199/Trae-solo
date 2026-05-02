export const PORTS_CONFIG = {
  BACKEND_PORT: 8247,
  FRONTEND_PORT: 9358,
  DATABASE_PORT: 5433,
  REDIS_PORT: 6380,
  WEBSOCKET_PORT: 8248,
} as const;

export const RESERVED_PORTS: number[] = [
  3000, 3001, 3002,
  5173, 5174, 5175,
  8000, 8080, 8443,
  4200, 4201,
  5000, 5001,
  9000, 9001,
  3030, 3031,
  8081, 8082,
  9090, 9091,
  80, 443, 21, 22,
];

export const PORT_FALLBACK_RANGE = {
  start: 20000,
  end: 30000,
} as const;

export function isPortReserved(port: number): boolean {
  return RESERVED_PORTS.includes(port);
}

export function getPortConfig(): typeof PORTS_CONFIG {
  return { ...PORTS_CONFIG };
}

export function getFallbackPort(originalPort: number): number {
  const basePort = originalPort + 100;
  const maxFallback = basePort + 50;
  
  for (let port = basePort; port <= maxFallback; port++) {
    if (!isPortReserved(port)) {
      return port;
    }
  }
  
  const randomPort = Math.floor(
    Math.random() * (PORT_FALLBACK_RANGE.end - PORT_FALLBACK_RANGE.start)
  ) + PORT_FALLBACK_RANGE.start;
  
  return randomPort;
}

export function validatePort(port: number): { valid: boolean; reason?: string } {
  if (port < 1 || port > 65535) {
    return { valid: false, reason: '端口号必须在 1-65535 之间' };
  }
  
  if (port < 1024) {
    return { valid: false, reason: '不建议使用 1024 以下的特权端口' };
  }
  
  if (isPortReserved(port)) {
    return { valid: false, reason: `端口 ${port} 是常见开发端口，已被保留，请选择其他端口` };
  }
  
  return { valid: true };
}
