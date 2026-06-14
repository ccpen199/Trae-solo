import http from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { URL } from 'node:url';

function loadEnv() {
  try {
    const env = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of env.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (!process.env[key]) process.env[key] = rest.join('=');
    }
  } catch {
    // .env is optional for fallback starts.
  }
}

loadEnv();

const HOST = process.env.BACKEND_HOST || process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59202);

const stats = {
  activeOrders: 18,
  onlineWorkers: 42,
  pendingEscrow: 126800,
  qualityAlerts: 6,
};

const products = [
  { id: 'part-001', name: '智能门锁锁体', category: 'lock', price: 280, stock: 44 },
  { id: 'part-002', name: 'PPR水管快接套件', category: 'plumbing', price: 36, stock: 180 },
  { id: 'part-003', name: '16A防溅插座', category: 'electric', price: 45, stock: 96 },
];

const orders = [
  { id: 'ORD20240614001', faultTypeName: '空调不制冷', status: 'in_service', homeownerName: '陈女士', amount: 468 },
  { id: 'ORD20240614002', faultTypeName: '插座故障', status: 'pending', homeownerName: '周先生', amount: 185 },
  { id: 'ORD20240614003', faultTypeName: '水管渗漏', status: 'matched', homeownerName: '王先生', amount: 320 },
];

const cart = {
  items: [{ productId: 'part-003', quantity: 2, price: 45 }],
  total: 90,
};

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(body);
}

function handle(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);

  if (url.pathname === '/api/health') {
    return json(res, 200, { success: true, message: 'ok', service: 'may-89202-backend' });
  }
  if (url.pathname === '/api/search') {
    const q = url.searchParams.get('q') || '';
    return json(res, 200, {
      success: true,
      query: q,
      results: [...orders, ...products].filter((item) => JSON.stringify(item).includes(q)).slice(0, 10),
    });
  }
  if (url.pathname === '/api/admin/stats' || url.pathname === '/api/admin/dashboard') {
    return json(res, 200, { success: true, data: stats, stats });
  }
  if (url.pathname === '/api/products') return json(res, 200, { success: true, products, data: products });
  if (url.pathname === '/api/orders') return json(res, 200, { success: true, orders, data: orders });
  if (url.pathname === '/api/cart') return json(res, 200, { success: true, cart, data: cart });

  return json(res, 404, { success: false, error: 'API not found' });
}

const server = http.createServer(handle);
server.listen(PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} signal received`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
