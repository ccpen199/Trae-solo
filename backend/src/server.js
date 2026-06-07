require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { db, initDatabase } = require('./database');
const { seedData } = require('./seed');

const insuredRoutes = require('./routes/insured');
const credentialRoutes = require('./routes/credential');
const prescriptionRoutes = require('./routes/prescription');
const offsiteRoutes = require('./routes/offsite');
const settlementRoutes = require('./routes/settlement');
const alertsRoutes = require('./routes/alerts');
const verificationRoutes = require('./routes/verification');
const familyRoutes = require('./routes/family');
const institutionsRoutes = require('./routes/institutions');
const policyRoutes = require('./routes/policy');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.BACKEND_PORT || 58835;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48835}`,
  credentials: true
}));

app.use(express.json());

app.use('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/insured', insuredRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/offsite', offsiteRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/institutions', institutionsRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

function startServer() {
  initDatabase();
  
  const count = db.prepare('SELECT COUNT(*) as cnt FROM insured_persons').get();
  if (count.cnt === 0) {
    seedData();
  }
  
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`✅ 医保服务后端启动成功`);
    console.log(`📍 监听地址: http://127.0.0.1:${PORT}`);
    console.log(`🔍 健康检查: http://127.0.0.1:${PORT}/api/health`);
  });
}

startServer();
