import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import routes from './routes';
import { seedDatabase } from './utils/seed';

dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '50000');
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '40000');

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    name: 'Home Service Platform API',
    version: '1.0.0',
    health: '/api/health',
  });
});

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    await seedDatabase();
    console.log('Database seeded');

    app.listen(PORT, '127.0.0.1', () => {
      console.log(`Server running on http://127.0.0.1:${PORT}`);
      console.log(`API endpoint: http://127.0.0.1:${PORT}/api`);
      console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
