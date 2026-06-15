import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import serviceRoutes from './routes/serviceRoutes.js';
import mockRoutes from './routes/mockRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', mockRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '惠州社区平台服务运行正常 (Mock模式)',
    mode: 'mock',
  });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/huizhou_community')
  .then(() => {
    console.log('MongoDB connected - switching to production mode');
  })
  .catch(err => {
    console.log('Running in mock mode (MongoDB not available)');
    console.log('Mock mode: Data will not persist between server restarts');
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API base: http://localhost:${PORT}/api`);
});
