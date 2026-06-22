import app from './app.js';
import { runSeed } from './seed.js';

console.log('Initializing database and seeding data...');
runSeed();

const PORT = Number(process.env.BACKEND_PORT || process.env.PORT) || 3001;
const HOST = '127.0.0.1';

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
