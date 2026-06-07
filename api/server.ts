import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';

const PORT = parseInt(process.env.BACKEND_PORT || '59054');
const HOST = '127.0.0.1';

const server = app.listen(PORT, HOST, () => {
  console.log(`[VMS Backend] Server ready on http://${HOST}:${PORT}`);
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
