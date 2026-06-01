import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './database';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import meetingRoutes from './routes/meetings';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT || 55871;
const HOST = process.env.HOST || '127.0.0.1';

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://127.0.0.1:45871',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(Number(PORT), HOST, () => {
  console.log(`Cloud Meeting Server running on http://${HOST}:${PORT}`);
});
