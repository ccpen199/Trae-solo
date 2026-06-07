import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './models/database';
import { seedData } from './utils/seed';
import authRoutes from './routes/auth';
import deviceRoutes from './routes/devices';
import sceneRoutes from './routes/scenes';
import serviceRoutes from './routes/services';
import productRoutes from './routes/products';
import tradeinRoutes from './routes/tradein';
import energyRoutes from './routes/energy';
import pointRoutes from './routes/points';
import firmwareRoutes from './routes/firmware';
import channelRoutes from './routes/channels';
import irBridgeRoutes from './routes/ir-bridges';
import healthRoutes from './routes/health';
import dashboardRoutes from './routes/dashboard';
import homeRoutes from './routes/home';

dotenv.config();

initDatabase();
seedData();

const app = express();

app.use(cors({ origin: 'http://127.0.0.1:48940' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/scenes', sceneRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tradein', tradeinRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/points', pointRoutes);
app.use('/api/firmware', firmwareRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/ir-bridges', irBridgeRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/home', homeRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Haier IoT Platform API is running', timestamp: new Date().toISOString() });
});

const PORT = parseInt(process.env.PORT || '58940', 10);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});
