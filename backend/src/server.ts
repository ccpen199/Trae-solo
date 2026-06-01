import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase } from './db';
import returnRequestsRouter from './routes/returnRequests';
import warehouseRouter from './routes/warehouse';
import processingRouter from './routes/processing';
import refundsRouter from './routes/refunds';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 58826;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48826}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/return-requests', returnRequestsRouter);
app.use('/api/warehouse', warehouseRouter);
app.use('/api/processing', processingRouter);
app.use('/api/refunds', refundsRouter);

app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
