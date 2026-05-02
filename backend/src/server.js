require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const purchaseRoutes = require('./routes/purchase');
const inventoryRoutes = require('./routes/inventory');
const prescriptionRoutes = require('./routes/prescription');
const saleRoutes = require('./routes/sale');

const app = express();
const PORT = process.env.PORT || 8910;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Pharmacy ERP Backend is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/sales', saleRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  Pharmacy ERP Backend Server`);
  console.log(`========================================`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Started at: ${new Date().toISOString()}`);
  console.log(`========================================`);
  console.log(`  Available Routes:`);
  console.log(`  GET  /health`);
  console.log(`  POST /api/auth/login`);
  console.log(`  GET  /api/auth/me`);
  console.log(`  GET  /api/purchases`);
  console.log(`  POST /api/purchases`);
  console.log(`  GET  /api/inventory/batches`);
  console.log(`  GET  /api/prescriptions`);
  console.log(`  POST /api/prescriptions`);
  console.log(`  GET  /api/sales`);
  console.log(`  POST /api/sales`);
  console.log(`========================================`);
});
