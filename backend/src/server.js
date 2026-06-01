import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import suppliersRouter from './routes/suppliers.js';
import linenItemsRouter from './routes/linenItems.js';
import floorRoomsRouter from './routes/floorRooms.js';
import distributionsRouter from './routes/distributions.js';
import collectionsRouter from './routes/collections.js';
import washingRouter from './routes/washing.js';
import damageReportsRouter from './routes/damageReports.js';
import settlementsRouter from './routes/settlements.js';
import inventoryRouter from './routes/inventory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.BACKEND_PORT || 58936;

app.use(cors({
  origin: ['http://127.0.0.1:48936', 'http://localhost:48936'],
  credentials: true
}));

app.use(express.json());
app.use(morgan('combined'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/suppliers', suppliersRouter);
app.use('/api/linen-items', linenItemsRouter);
app.use('/api/floor-rooms', floorRoomsRouter);
app.use('/api/distributions', distributionsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/washing', washingRouter);
app.use('/api/damage-reports', damageReportsRouter);
app.use('/api/settlements', settlementsRouter);
app.use('/api/inventory', inventoryRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
