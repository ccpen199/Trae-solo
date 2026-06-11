/**
 * local server entry file, for local development
 */
import 'dotenv/config';
console.log('Starting server...');
console.log('Loading app...');
import app from './app.js';

console.log('App loaded successfully');

/**
 * start server with port
 */
const PORT = Number(process.env.BACKEND_PORT) || 59096;
const HOST = '127.0.0.1';

console.log(`Attempting to listen on ${HOST}:${PORT}...`);
const server = app.listen(PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
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