import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🏠 装修家居UGC社区与设计师撮合平台`);
  console.log(`🚀 后端服务运行中: http://localhost:${PORT}`);
  console.log(`📡 API健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================\n`);
});
