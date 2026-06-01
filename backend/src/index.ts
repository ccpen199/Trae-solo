import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { operationLogger } from './middleware/logger';
import { initDatabase } from './db/init';
import transfersRouter from './routes/transfers';
import reviewsRouter from './routes/reviews';
import coordinationsRouter from './routes/coordinations';
import resultsRouter from './routes/results';
import hospitalsRouter from './routes/hospitals';
import reportsRouter from './routes/reports';
import { ApiResponse } from './types';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '53457', 10);
const HOST = '127.0.0.1';
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '43457', 10);

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

initDatabase();

app.use(cors({
  origin: [
    'http://127.0.0.1:43457',
    'http://localhost:43457',
    'http://127.0.0.1:44457',
    'http://localhost:44457',
    'http://127.0.0.1:45457',
    'http://localhost:45457',
    'http://127.0.0.1:46457',
    'http://localhost:46457'
  ],
  credentials: true
}));

app.use(express.json());
app.use(operationLogger);

app.get('/api/health', (req, res) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    message: '服务运行正常'
  };
  res.json(response);
});

app.use('/api', transfersRouter);
app.use('/api', reviewsRouter);
app.use('/api', coordinationsRouter);
app.use('/api', resultsRouter);
app.use('/api', hospitalsRouter);
app.use('/api', reportsRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  const response: ApiResponse = {
    success: false,
    message: '服务器内部错误: ' + (err.message || '未知错误')
  };
  res.status(500).json(response);
});

app.use((req: express.Request, res: express.Response) => {
  const response: ApiResponse = {
    success: false,
    message: '接口不存在'
  };
  res.status(404).json(response);
});

app.listen(PORT, HOST, () => {
  console.log('Server started: http://' + HOST + ':' + PORT);
  console.log('Health check: http://' + HOST + ':' + PORT + '/api/health');
});

export default app;
