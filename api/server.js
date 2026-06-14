import http from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { URL } from 'node:url';

function loadEnv() {
  try {
    const env = readFileSync(resolve(process.cwd(), '..', '.env'), 'utf8');
    for (const line of env.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (!process.env[key]) process.env[key] = rest.join('=');
    }
  } catch {
    try {
      const env = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
      for (const line of env.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const [key, ...rest] = trimmed.split('=');
        if (!process.env[key]) process.env[key] = rest.join('=');
      }
    } catch {
      // ignore
    }
  }
}

loadEnv();

const HOST = process.env.BACKEND_HOST || process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59203);

const searchCatalog = [
  { id: 'case-001', title: '现代简约三居室', tags: ['现代', '极简', '收纳'] },
  { id: 'case-002', title: '新中式样板间', tags: ['木色', '对称', '雅致'] },
  { id: 'case-003', title: '工业风LOFT', tags: ['砖墙', '金属', '开放'] },
];

const demoImages = {
  luxury: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury+modern+dining+room+gold+marble+elegant&image_size=landscape_16_9',
  modern: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern+minimalist+living+room+interior+design+bright+clean&image_size=landscape_16_9',
  industrial: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industrial+loft+interior+brick+metal+concrete&image_size=landscape_16_9',
  chinese: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese+traditional+modern+living+room+elegant+wood&image_size=landscape_16_9',
  japanese: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese+zen+interior+wood+bamboo+minimal&image_size=landscape_16_9',
  scandinavian: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=scandinavian+nordic+bedroom+cozy+wood+white&image_size=landscape_16_9',
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
    return json(res, 200, { success: true, message: 'ok', service: 'may-89203-backend' });
  }
  if (url.pathname === '/api/search') {
    const q = (url.searchParams.get('q') || '').trim();
    const results = searchCatalog.filter((item) => item.title.includes(q) || item.tags.some((t) => t.includes(q)));
    return json(res, 200, { success: true, query: q, results });
  }
  if (url.pathname === '/api/ide/v1/text_to_image') {
    const prompt = (url.searchParams.get('prompt') || '').toLowerCase();
    let imageUrl = demoImages.modern;
    if (prompt.includes('luxury')) imageUrl = demoImages.luxury;
    else if (prompt.includes('industrial')) imageUrl = demoImages.industrial;
    else if (prompt.includes('chinese')) imageUrl = demoImages.chinese;
    else if (prompt.includes('japanese')) imageUrl = demoImages.japanese;
    else if (prompt.includes('scandinavian')) imageUrl = demoImages.scandinavian;
    return json(res, 200, { success: true, imageUrl, prompt });
  }

  return json(res, 200, {
    success: true,
    message: 'may-89203 backend ready',
    results: searchCatalog,
  });
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
