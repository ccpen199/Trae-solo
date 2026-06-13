import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[API Server] 服务已启动: http://localhost:${PORT}`);
  console.log(`[API Server] 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`[API Server] 环境: ${process.env.NODE_ENV || 'development'}`);
});
