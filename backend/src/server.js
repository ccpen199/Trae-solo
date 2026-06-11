require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.BACKEND_PORT || 59178;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://127.0.0.1:49178',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'smart-mobility-api' });
});

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const rideRoutes = require('./routes/rides');
const fenceRoutes = require('./routes/fences');
const socialRoutes = require('./routes/social');
const serviceRoutes = require('./routes/service');
const shopRoutes = require('./routes/shop');
const privacyRoutes = require('./routes/privacy');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/fences', fenceRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Smart Mobility API server running on http://127.0.0.1:${PORT}`);
  console.log(`📊 Health check: http://127.0.0.1:${PORT}/api/health`);
});

module.exports = app;
