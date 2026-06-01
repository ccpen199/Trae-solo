require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');
const routes = require('./routes');

const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '../../.env');
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const PORT = parseInt(process.env.BACKEND_PORT) || 56931;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:46931';

const app = express();

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.use('/api', routes);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
  console.log(`Frontend allowed origin: ${FRONTEND_URL}`);
});

module.exports = app;
