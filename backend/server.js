import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

config({ path: join(projectRoot, '.env') });

const express = (await import('express')).default;
const cors = (await import('cors')).default;
const db = (await import('./db.js')).default;
const authRoutes = (await import('./routes/auth.js')).default;
const addressRoutes = (await import('./routes/addresses.js')).default;
const workOrderRoutes = (await import('./routes/workorders.js')).default;
const dispatchRoutes = (await import('./routes/dispatch.js')).default;
const serviceRoutes = (await import('./routes/service.js')).default;
const exceptionRoutes = (await import('./routes/exceptions.js')).default;
const settlementRoutes = (await import('./routes/settlements.js')).default;
const uploadRoutes = (await import('./routes/upload.js')).default;

const app = express();
const PORT = process.env.BACKEND_PORT || 53424;

app.use(cors({ origin: 'http://127.0.0.1:43424' }));
app.use(express.json());

app.use('/uploads', express.static(join(projectRoot, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/workorders', workOrderRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, _next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `上传错误: ${err.message}` });
  }
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务已启动: http://127.0.0.1:${PORT}`);
});
