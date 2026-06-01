require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const FRONTEND_PORT = process.env.FRONTEND_PORT || 46777;
const BACKEND_PORT = process.env.BACKEND_PORT || 56777;

const app = express();

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const logStream = fs.createWriteStream(path.join(__dirname, '../backend.log'), { flags: 'a' });
app.use(morgan('combined', { stream: logStream }));
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

require('./models/database');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/merchants', require('./routes/merchants'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reports', require('./routes/reports'));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: BACKEND_PORT
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${BACKEND_PORT}`);
});

module.exports = app;
