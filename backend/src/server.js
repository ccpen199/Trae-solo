const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const routes = require('./routes');
require('./models/initDB');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 50000;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 40000}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    message: '智慧充电停车一体系统 API',
    version: '1.0.0',
    docs: 'Visit /api/health for health check'
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  console.log(`API endpoint: http://127.0.0.1:${PORT}/api`);
});

module.exports = app;
