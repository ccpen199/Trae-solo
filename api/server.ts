/**
 * local server entry file, for local development
 */
import app from './app.js';

/**
 * start server with port
 */
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59320);

const server = app.listen(port, host, () => {
  console.log(`Server ready on http://${host}:${port}`);
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
