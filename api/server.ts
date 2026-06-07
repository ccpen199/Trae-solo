import 'dotenv/config';
import { server } from './app.js';
import { initDb } from './db/index.js';

const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '59074');
const HOST = '127.0.0.1';

initDb();

server.listen(BACKEND_PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${BACKEND_PORT}`);
  console.log(`Socket.IO ready on ws://${HOST}:${BACKEND_PORT}`);
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

export default server;
