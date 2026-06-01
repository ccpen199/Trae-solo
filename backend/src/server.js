require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const storesRouter = require('./routes/stores');
const vehiclesRouter = require('./routes/vehicles');
const customersRouter = require('./routes/customers');
const ordersRouter = require('./routes/orders');
const maintenancesRouter = require('./routes/maintenances');
const violationsRouter = require('./routes/violations');
const inspectionsRouter = require('./routes/inspections');
const financialRouter = require('./routes/financial');

const app = express();
const PORT = process.env.BACKEND_PORT || 57894;

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 47894}`, `http://localhost:${process.env.FRONTEND_PORT || 47894}`],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', (req, res) => {
  const db = require('./database');
  
  const vehicleStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END) as rented,
      SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
    FROM vehicles
  `).get();
  
  const orderStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN status = 'picked_up' THEN 1 ELSE 0 END) as picked_up,
      SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned
    FROM orders
  `).get();
  
  const today = new Date().toISOString().split('T')[0];
  const expiredVehicles = db.prepare(`
    SELECT COUNT(*) as count FROM vehicles 
    WHERE insurance_expire_date < ? OR inspection_expire_date < ?
  `).get(today, today);
  
  const revenueStats = db.prepare(`
    SELECT 
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(SUM(damage_fee), 0) as damage_fee,
      COALESCE(SUM(violation_fee), 0) as violation_fee
    FROM orders
  `).get();
  
  res.json({
    vehicles: vehicleStats,
    orders: orderStats,
    expired_vehicles: expiredVehicles.count,
    revenue: revenueStats
  });
});

app.use('/api/stores', storesRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/maintenances', maintenancesRouter);
app.use('/api/violations', violationsRouter);
app.use('/api/inspections', inspectionsRouter);
app.use('/api/financial', financialRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Fleet Management Backend running on http://127.0.0.1:${PORT}`);
});
