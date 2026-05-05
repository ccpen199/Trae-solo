require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const favoriteRoutes = require('./routes/favorites');
const productRoutes = require('./routes/products');
const companyRoutes = require('./routes/companies');

const app = express();
const PORT = process.env.PORT || 20793;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:30793';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/products', productRoutes);
app.use('/api/companies', companyRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Backend Server Running`);
  console.log(`========================================`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`API Base: http://localhost:${PORT}/api`);
  console.log(`========================================`);
});
