import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import './models/database.js';
import sopsRouter from './routes/sops.js';
import workOrdersRouter from './routes/workOrders.js';
import productsRouter from './routes/products.js';
import processesRouter from './routes/processes.js';
import usersRouter from './routes/users.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 58840;

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 48840}`, `http://localhost:${process.env.FRONTEND_PORT || 48840}`],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/sops', sopsRouter);
app.use('/api/work-orders', workOrdersRouter);
app.use('/api/products', productsRouter);
app.use('/api/processes', processesRouter);
app.use('/api/users', usersRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
