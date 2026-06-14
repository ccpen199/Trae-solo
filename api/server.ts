/**
 * local server entry file, for local development
 */
import 'dotenv/config';
import app from './app.js';
import { initDatabase, isDatabaseEmpty } from './data/database.js';
import { generateMockData } from './data/mockData.js';

/**
 * start server with port
 */
const HOST = process.env.BACKEND_HOST || process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59208);

async function startServer() {
  try {
    await initDatabase();

    const empty = await isDatabaseEmpty();
    if (empty) {
      console.log('Database is empty, generating mock data...');
      await generateMockData();
    }

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
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
