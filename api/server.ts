/**
 * local server entry file, for local development
 */
import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * start server with port
 */
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59128);
const HOST = process.env.HOST || '127.0.0.1';

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
