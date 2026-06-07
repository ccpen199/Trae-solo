require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.BACKEND_PORT || 59047;

app.use(cors({ origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 49047}` }));
app.use(express.json());

initDB();

app.use('/api/credit', require('./routes/credit'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/business', require('./routes/business'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/coordinator', require('./routes/coordinator'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'shanxi-rural-finance', timestamp: new Date().toISOString() });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend running on http://127.0.0.1:${PORT}`);
});
