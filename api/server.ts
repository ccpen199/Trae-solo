import app from './app.js';
import dotenv from 'dotenv';
import { initDb } from './db.js';

dotenv.config();

initDb();

const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '53433', 10);

const server = app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`Server ready on http://127.0.0.1:${BACKEND_PORT}`);
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
