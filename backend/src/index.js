import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import './database.js';

import certificationRoutes from './routes/certification.js';
import paymentRoutes from './routes/payment.js';
import walletRoutes from './routes/wallet.js';
import cardRoutes from './routes/card.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 58959;

app.use(cors({
  origin: ['http://127.0.0.1:48959', 'http://localhost:48959'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/certification', certificationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/card', cardRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/persons/search', (req, res) => {
  const { id_card, name } = req.query;
  
  let query = 'SELECT * FROM insured_persons WHERE 1=1';
  const params = [];
  
  if (id_card) {
    query += ' AND id_card LIKE ?';
    params.push('%' + id_card + '%');
  }
  if (name) {
    query += ' AND name LIKE ?';
    params.push('%' + name + '%');
  }
  
  query += ' ORDER BY created_at DESC LIMIT 50';
  
  const persons = db.prepare(query).all(...params);
  res.json({ success: true, data: persons });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
});
