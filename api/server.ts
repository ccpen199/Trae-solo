import 'dotenv/config';
import app from './app.js';
import { initDatabase, seedDatabase } from './db/index.js';

const PORT = parseInt(process.env.BACKEND_PORT || '59057');
const HOST = process.env.HOST || '127.0.0.1';

initDatabase();
seedDatabase();

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

export default app;