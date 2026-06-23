require('dotenv').config();
const { server } = require('./app');

const PORT = process.env.PORT || 3001;

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('未处理的拒绝:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   校园热水IoT服务管理平台 - 后端服务                          ║
║                                                              ║
║   🚀 API 服务运行在:     http://localhost:${PORT}             ║
║   📡 WebSocket 端口:    ${process.env.WEBSOCKET_PORT || 8080} ║
║   📊 健康检查:           http://localhost:${PORT}/api/health   ║
║   📚 API 文档:           /api/*                               ║
║                                                              ║
║   🎯 可用命令:                                              ║
║      npm run dev       - 开发模式                             ║
║      npm run seed      - 初始化测试数据                       ║
║      npm run simulator - 启动设备模拟器                       ║
║      npm run analyzer  - 启动能耗分析器                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
