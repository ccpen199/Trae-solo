const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');

function loadProjectEnv() {
  const envPath = path.resolve(projectRoot, '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
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
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59162);

app.use(cors());
app.use(express.json());

const nameRoutes = require('./src/routes/nameRoutes');
const masterRoutes = require('./src/routes/masterRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

app.use('/api/names', nameRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/report', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '中华姓名学智能起名系统运行正常' });
});

app.listen(PORT, HOST, () => {
  console.log(`起名系统后端服务已启动: http://${HOST}:${PORT}`);
});

module.exports = app;
