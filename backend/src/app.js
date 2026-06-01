require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('./database/init');
const whitelistRoutes = require('./routes/whitelist');
const userRoutes = require('./routes/user');
const commissionRoutes = require('./routes/commission');
const creditRoutes = require('./routes/credit');
const bankRoutes = require('./routes/bank');
const advanceRoutes = require('./routes/advance');

const app = express();
const PORT = process.env.PORT || 44837;

app.use(cors({
  origin: [`http://localhost:${process.env.FRONTEND_PORT || 45837}`],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.use('/api/whitelist', whitelistRoutes);
app.use('/api/user', userRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/credit', creditRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/advance', advanceRoutes);

app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: '服务运行正常', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 后端服务已启动: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
});
