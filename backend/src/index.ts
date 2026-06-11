import express from 'express';
import cors from 'cors';
import { initDatabase } from './database';
import { seedDatabase } from './seed';
import routes from './routes';

const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(cors());
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
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
