import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.BACKEND_PORT || '53430');
const HOST = '127.0.0.1';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`);
  console.log(`API base: http://${HOST}:${PORT}/api`);
  console.log(`Health check: http://${HOST}:${PORT}/api/health`);
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
