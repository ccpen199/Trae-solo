import 'dotenv/config';
/**
 * local server entry file, for local development
 */
import app from './app.js';
import { initDatabase } from './db.js';

/**
 * Initialize database first
 */
console.log('Initializing database...');
try {
  initDatabase();
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Database initialization failed:', error);
  process.exit(1);
}

/**
 * start server with port
 */
const PORT = Number(process.env.BACKEND_PORT) || 59079;

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server ready on port ${PORT}`);
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