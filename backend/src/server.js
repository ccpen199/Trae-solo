require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./database');

const hotelsRouter = require('./routes/hotels');
const roomsRouter = require('./routes/rooms');
const mappingsRouter = require('./routes/mappings');
const collectionsRouter = require('./routes/collections');
const comparisonRouter = require('./routes/comparison');
const strategiesRouter = require('./routes/strategies');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 56894;

app.use(cors({
  origin: `http://127.0.0.1:${parseInt(process.env.FRONTEND_PORT) || 46894}`,
  credentials: true
}));

app.use(express.json());

app.use('/api/hotels', hotelsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/mappings', mappingsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/comparison', comparisonRouter);
app.use('/api/strategies', strategiesRouter);
app.use('/api/reports', reportsRouter);

app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

app.get('/api/stats', (req, res) => {
  const hotelCount = db.prepare('SELECT COUNT(*) as count FROM hotels').get().count;
  const roomCount = db.prepare('SELECT COUNT(*) as count FROM room_types').get().count;
  const collectionCount = db.prepare('SELECT COUNT(*) as count FROM price_collections').get().count;
  const comparisonCount = db.prepare('SELECT COUNT(*) as count FROM comparison_results').get().count;
  const pendingMappings = db.prepare("SELECT COUNT(*) as count FROM hotel_mappings WHERE status = 'pending'").get().count;
  const failedCollections = db.prepare("SELECT COUNT(*) as count FROM price_collections WHERE collection_status != 'success'").get().count;
  
  res.json({
    hotels: hotelCount,
    rooms: roomCount,
    collections: collectionCount,
    comparisons: comparisonCount,
    pending_mappings: pendingMappings,
    failed_collections: failedCollections
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
  console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
});
