require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const PORT = process.env.BACKEND_PORT || 53483;
const app = express();

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43483}`,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const db = require('./database');
const routes = require('./routes');

app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
  console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
});

module.exports = app;
