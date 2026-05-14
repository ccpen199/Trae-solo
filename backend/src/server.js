require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const merchantRoutes = require('./routes/merchants');
const productRoutes = require('./routes/products');
const addressRoutes = require('./routes/addresses');
const orderRoutes = require('./routes/orders');
const homeRoutes = require('./routes/home');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 9831;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/products', productRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '饿了么外卖服务运行正常' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});