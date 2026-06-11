import express from 'express';
import cors from 'cors';
import { initDatabase } from './database';
import { seedDatabase } from './seed';
import routes from './routes';

const app = express();
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT) || 59169;

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://127.0.0.1:49169',
    'http://localhost:49169'
  ],
  credentials: true
}));
app.use(express.json());

app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  try {
    await initDatabase();
    console.log('Database initialized');
    
    await seedDatabase();
    console.log('Database seeded with sample data');
    
    app.listen(PORT, HOST, () => {
      console.log(`Server is running on http://${HOST}:${PORT}`);
      console.log(`API base URL: http://${HOST}:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
