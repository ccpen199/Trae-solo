import app, { initDatabase } from './app.js';

const HOST = process.env.BACKEND_HOST || process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59206);

initDatabase();

const server = app.listen(PORT, HOST, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║     SkillVerse API Server is running                    ║
  ║     Port: ${PORT}                                         ║
  ║     Base URL: http://${HOST}:${PORT}                     ║
  ║     Health: http://${HOST}:${PORT}/api/health            ║
  ╚══════════════════════════════════════════════════════════╝
  
  Test Accounts:
    Admin:    admin / 123456
    Creator:  林舞蹈家 / 123456
    User:     用户1 / 123456
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
