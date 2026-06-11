import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

/**
 * start server with port
 */
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59143);

const server = app.listen(PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`);
});

/**
 * close server
 */
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
