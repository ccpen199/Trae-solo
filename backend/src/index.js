require('dotenv').config({ path: '../../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const homesRouter = require('./routes/homes');
const roomsRouter = require('./routes/rooms');
const devicesRouter = require('./routes/devices');
const automationsRouter = require('./routes/automations');
const voiceRouter = require('./routes/voice');
const { error } = require('./utils/response');

const app = express();
const PORT = process.env.PORT || 48451;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:48452',
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/homes', homesRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/automations', automationsRouter);
app.use('/api/voice', voiceRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '服务运行正常', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json(error('接口不存在'));
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json(error('服务器内部错误', process.env.NODE_ENV === 'development' ? err.message : undefined));
});

app.listen(PORT, () => {
  console.log(`\n🚀 智能家居后端服务已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`💾 数据库: ./data/app.sqlite\n`);
});

module.exports = app;
