require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 56895;
const HOST = '127.0.0.1';

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 46895}`,
  credentials: true
}));

app.use(express.json());

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/auditors', require('./routes/auditors'));
app.use('/api/audit-plans', require('./routes/auditPlans'));
app.use('/api/checklists', require('./routes/checklists'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/reports', require('./routes/reports'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
