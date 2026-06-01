require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

require('./database');

const productsRouter = require('./routes/products');
const policiesRouter = require('./routes/policies');
const claimsRouter = require('./routes/claims');
const reportsRouter = require('./routes/reports');
const commonRouter = require('./routes/common');

const app = express();
const PORT = process.env.BACKEND_PORT || 53427;

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 43427}`, `http://localhost:${process.env.FRONTEND_PORT || 43427}`],
  credentials: true
}));

app.use(express.json());

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use((req, res, next) => {
  const logStr = `${new Date().toISOString()} ${req.method} ${req.url}\n`;
  fs.appendFile(path.join(logsDir, 'backend.log'), logStr, () => {});
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString() });
});

app.use('/api/products', productsRouter);
app.use('/api/policies', policiesRouter);
app.use('/api/claims', claimsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api', commonRouter);

const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  const errorStr = `${new Date().toISOString()} ERROR: ${err.message}\n${err.stack}\n`;
  fs.appendFile(path.join(logsDir, 'backend.log'), errorStr, () => {});
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
