const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { initSchema } = require('./db/schema');
const { seedData } = require('./db/seed');

const brandsRoutes = require('./routes/brands');
const serviceCentersRoutes = require('./routes/service_centers');
const techniciansRoutes = require('./routes/technicians');
const ordersRoutes = require('./routes/orders');
const dispatchesRoutes = require('./routes/dispatches');
const onSiteRoutes = require('./routes/on_site');
const serviceTicketsRoutes = require('./routes/service_tickets');
const settlementsRoutes = require('./routes/settlements');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.BACKEND_PORT || 53426;

app.use(cors({ origin: 'http://127.0.0.1:43426' }));
app.use(express.json());

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

initSchema(db);
seedData(db);

app.locals.db = db;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/brands', brandsRoutes);
app.use('/api/service-centers', serviceCentersRoutes);
app.use('/api/technicians', techniciansRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/dispatches', dispatchesRoutes);
app.use('/api/on-site-records', onSiteRoutes);
app.use('/api/service-tickets', serviceTicketsRoutes);
app.use('/api/settlements', settlementsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running at http://127.0.0.1:${PORT}`);
});
