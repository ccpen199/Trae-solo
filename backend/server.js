const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('./db');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 58856;

app.use(cors({
  origin: [
    `http://127.0.0.1:${process.env.FRONTEND_PORT || 48856}`,
    `http://localhost:${process.env.FRONTEND_PORT || 48856}`
  ],
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/dashboard/stats', (req, res) => {
  try {
    const totalRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get();
    const availableRooms = db.prepare('SELECT COUNT(*) as count FROM rooms WHERE status = ?').get('available');
    const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get();
    const activeContracts = db.prepare('SELECT COUNT(*) as count FROM contracts WHERE status = ?').get('active');
    const totalBuildings = db.prepare('SELECT COUNT(*) as count FROM buildings').get();

    res.json({
      totalRooms: totalRooms.count,
      availableRooms: availableRooms.count,
      totalLeads: totalLeads.count,
      activeContracts: activeContracts.count,
      totalBuildings: totalBuildings.count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const buildingsRouter = require('./routes/buildings');
const roomsRouter = require('./routes/rooms');
const leadsRouter = require('./routes/leads');
const viewingsRouter = require('./routes/viewings');
const quotesRouter = require('./routes/quotes');
const contractsRouter = require('./routes/contracts');
const reportsRouter = require('./routes/reports');

app.use('/api/buildings', buildingsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/viewings', viewingsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/reports', reportsRouter);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
