import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';
import suppliersRouter from './routes/suppliers.js';
import resourcesRouter from './routes/resources.js';
import materialsRouter from './routes/materials.js';
import routesRouter from './routes/routes.js';
import notificationsRouter from './routes/notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 58943;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48943}`,
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/suppliers', suppliersRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/routes', routesRouter);
app.use('/api/notifications', notificationsRouter);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
