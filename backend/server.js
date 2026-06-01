require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const { init } = require('./db');
const routes = require('./routes');

const app = express();
const PORT = process.env.BACKEND_PORT || 53403;

init();

app.use(cors({
  origin: ['http://127.0.0.1:43403', 'http://localhost:43403'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/api', routes);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[backend] Gray release platform API running on http://127.0.0.1:${PORT}`);
});