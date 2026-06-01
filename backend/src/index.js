require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./models/database');

const authRoutes = require('./routes/auth');
const agentRoutes = require('./routes/agentProfiles');
const customerRoutes = require('./routes/customers');
const templateRoutes = require('./routes/templates');
const generationRoutes = require('./routes/emailGenerations');
const sendRecordRoutes = require('./routes/sendRecords');
const alertRoutes = require('./routes/alerts');
const variableRoutes = require('./routes/variables');
const auditRoutes = require('./routes/audit');

const app = express();
const PORT = process.env.BACKEND_PORT || 53369;
const HOST = '127.0.0.1';

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43369}`,
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/email-generations', generationRoutes);
app.use('/api/send-records', sendRecordRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/variables', variableRoutes);
app.use('/api/audit', auditRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`Backend server running at http://${HOST}:${PORT}`);
  console.log(`API Base URL: http://${HOST}:${PORT}/api`);
});
