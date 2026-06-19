/**
 * local server entry file, for local development
 */
import app from './app.js';

/**
 * start server with port
 */
const rawPort = Number(process.env.PORT || 3003);
const PORT = rawPort > 40000 ? 3003 : rawPort;
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
