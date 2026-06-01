import express, {
  type Request,
  type Response,
} from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activities.js';
import prizeRoutes from './routes/prizes.js';
import lotteryRoutes from './routes/lottery.js';
import riskRoutes from './routes/risk.js';
import reportRoutes from './routes/reports.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app: express.Application = express();

app.use(cors({
  origin: process.env.VITE_FRONTEND_URL || 'http://127.0.0.1:43481',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/prizes', prizeRoutes);
app.use('/api/lottery', lotteryRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/reports', reportRoutes);

app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      code: 200,
      message: 'ok',
      data: { status: 'healthy' },
      timestamp: Date.now()
    });
  },
);

app.use(errorHandler);
app.use(notFoundHandler);

export default app;
