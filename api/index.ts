import express from 'express';
import cors from 'cors';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function loadProjectEnv() {
  const envPath = path.resolve(projectRoot, '.env');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadProjectEnv();

const app = express();
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59158);

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'may-89158-backend',
    app: '宠物健康全周期管理 SaaS 平台',
    dataMode: 'local mock fixtures',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/bootstrap', (_req, res) => {
  res.json({
    code: 0,
    data: {
      roles: ['owner', 'store_staff', 'store_manager', 'veterinarian'],
      modules: ['pets', 'appointments', 'inventory', 'members', 'medical-records'],
    },
    message: 'ok',
  });
});

const server = app.listen(port, host, () => {
  console.log(`may-89158 backend listening on http://${host}:${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});
