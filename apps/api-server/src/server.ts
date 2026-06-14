import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import app from './app.js';

const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59189);
const HOST = process.env.BACKEND_HOST || process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`[API Server] 服务已启动: http://${HOST}:${PORT}`);
  console.log(`[API Server] 健康检查: http://${HOST}:${PORT}/api/health`);
  console.log(`[API Server] 环境: ${process.env.NODE_ENV || 'development'}`);
});
