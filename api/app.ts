import express from 'express';
import cors from 'cors';
import cipRoutes from './routes/cip.js';
import authRoutes from './routes/auth.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api', authRoutes);
app.use('/api', cipRoutes);

export default app;
