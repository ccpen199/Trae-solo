const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const hospitalRoutes = require('./routes/hospitals');
const departmentRoutes = require('./routes/departments');
const communityRoutes = require('./routes/community');
const petRoutes = require('./routes/pets');
const healthRoutes = require('./routes/health');
const symptomRoutes = require('./routes/symptoms');
const adminRoutes = require('./routes/admin');
const consultationRoutes = require('./routes/consultations');

const app = express();
const PORT = 48311;

app.use(cors({
  origin: ['http://localhost:48310', 'http://127.0.0.1:48310'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/symptoms', symptomRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/consultations', consultationRoutes);

app.get('/api/healthz', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 云医宠后端服务已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📊 API 健康检查: http://localhost:${PORT}/api/healthz`);
});
