import app from './app.js';
import dotenv from 'dotenv';
dotenv.config();

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || '59190');
const server = app.listen(PORT, HOST, () => {
  console.log(`[starpass] backend listening on http://${HOST}:${PORT}`);
});

const graceful = (sig: string) => {
  console.log(`[starpass] ${sig} received, shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGINT', () => graceful('SIGINT'));
process.on('SIGTERM', () => graceful('SIGTERM'));

export default server;
