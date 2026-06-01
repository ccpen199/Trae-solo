import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import dishesRoutes from './routes/dishes.js';
import ingredientsRoutes from './routes/ingredients.js';
import trialsRoutes from './routes/trials.js';
import launchRoutes from './routes/launch.js';
import feedbackRoutes from './routes/feedback.js';
import acceptanceRoutes from './routes/acceptance.js';
import './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.BACKEND_PORT || 58927;

const frontendPort = process.env.FRONTEND_PORT || 48927;
app.use(cors({
  origin: [
    `http://127.0.0.1:${frontendPort}`,
    `http://localhost:${frontendPort}`
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/dishes', dishesRoutes);
app.use('/api/ingredients', ingredientsRoutes);
app.use('/api/trials', trialsRoutes);
app.use('/api/launch', launchRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/acceptance', acceptanceRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
