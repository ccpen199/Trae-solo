/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import hsCodeRoutes from './routes/hsCodes.js';
import taxRuleRoutes from './routes/taxRules.js';
import calculationRoutes from './routes/calculation.js';
import batchRoutes from './routes/batch.js';
import './db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app: express.Application = express();

const frontendPort = process.env.FRONTEND_PORT || '48827';
app.use(cors({
  origin: [`http://127.0.0.1:${frontendPort}`, `http://localhost:${frontendPort}`],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/hs-codes', hsCodeRoutes);
app.use('/api/tax-rules', taxRuleRoutes);
app.use('/api/calculation', calculationRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/auth', authRoutes);

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
