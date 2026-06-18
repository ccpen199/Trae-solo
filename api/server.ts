import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import { initDatabase } from './src/utils/initDb.js';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

initDatabase();

const server = app.listen(Number(PORT), HOST, () => {
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
