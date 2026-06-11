/**
 * local server entry file, for local development
 */
import app from './app.js';
import { initDatabase } from './data/seedData.js';

/**
 * start server with port
 */
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59171);

initDatabase().then(() => {
  console.log('Database initialized with mock data');
  const server = app.listen(PORT, HOST, () => {
    console.log(`Server ready on http://${HOST}:${PORT}`);
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
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
