import app from './app';

const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.BACKEND_PORT || process.env.PORT || 59309;

app.listen(PORT, HOST, () => {
  console.log(`\n========================================`);
  console.log(`🏠 装修家居UGC社区与设计师撮合平台`);
  console.log(`🚀 后端服务运行中: http://${HOST}:${PORT}`);
  console.log(`📡 API健康检查: http://${HOST}:${PORT}/api/health`);
  console.log(`========================================\n`);
});
