import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import departmentRoutes from './routes/departments';
import catalogRoutes from './routes/catalogs';
import applicationRoutes from './routes/applications';
import apiCallRoutes from './routes/apiCalls';
import qualityRoutes from './routes/quality';
import auditRoutes from './routes/audit';

const app = express();
const PORT = process.env.BACKEND_PORT || 58900;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48900}`,
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/departments', departmentRoutes);
app.use('/api/catalogs', catalogRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/api-calls', apiCallRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/audit', auditRoutes);

app.listen(parseInt(PORT as string), '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`);
});

export default app;
