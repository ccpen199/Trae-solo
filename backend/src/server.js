
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const http = require('http');

const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resumes');
const jobRoutes = require('./routes/jobs');
const recommendationRoutes = require('./routes/recommendations');
const toolboxRoutes = require('./routes/toolbox');
const imRoutes = require('./routes/im');
const adminRoutes = require('./routes/admin');

const PROJECT_DIR = path.resolve(__dirname, '../..');
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT) || 49069;
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT) || 59069;
const CORS_ORIGIN = process.env.CORS_ORIGIN || `http://127.0.0.1:${FRONTEND_PORT}`;

console.log('环境变量检查:');
console.log(`  FRONTEND_PORT: ${process.env.FRONTEND_PORT} -> ${FRONTEND_PORT}`);
console.log(`  BACKEND_PORT: ${process.env.BACKEND_PORT} -> ${BACKEND_PORT}`);
console.log(`  .env 路径: ${path.resolve(__dirname, '../../.env')}`);

const app = express();
const server = http.createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    project: 'headhunter-platform',
    port: BACKEND_PORT
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/toolbox', toolboxRoutes);
app.use('/api/im', imRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'API 接口不存在', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

const activeSockets = new Map();

io.on('connection', (socket) => {
  console.log('WebSocket connected:', socket.id);

  socket.on('join', (userId) => {
    activeSockets.set(userId, socket.id);
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });

  socket.on('send_message', (data) => {
    const { receiver_id, content, message_type, resume_id, interview_id } = data;
    const receiverSocketId = activeSockets.get(receiver_id);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new_message', {
        ...data,
        sender_id: socket.handshake.query.userId,
        created_at: new Date().toISOString()
      });
    }
  });

  socket.on('webrtc_offer', (data) => {
    io.to(`user_${data.targetUserId}`).emit('webrtc_offer', {
      from: data.fromUserId,
      offer: data.offer,
      roomId: data.roomId
    });
  });

  socket.on('webrtc_answer', (data) => {
    io.to(`user_${data.targetUserId}`).emit('webrtc_answer', {
      from: data.fromUserId,
      answer: data.answer,
      roomId: data.roomId
    });
  });

  socket.on('webrtc_ice_candidate', (data) => {
    io.to(`user_${data.targetUserId}`).emit('webrtc_ice_candidate', {
      from: data.fromUserId,
      candidate: data.candidate,
      roomId: data.roomId
    });
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of activeSockets.entries()) {
      if (socketId === socket.id) {
        activeSockets.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

function checkPort(port) {
  return new Promise((resolve) => {
    const tester = http.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close();
      resolve(true);
    });
    tester.listen(port, '127.0.0.1');
  });
}

async function findAvailablePort(basePort, slot) {
  const tail4 = 9069;
  const slotBase = 40000 + slot * 1000 + tail4;
  const backendSlotBase = 50000 + slot * 1000 + tail4;
  
  const frontendAvailable = await checkPort(slotBase);
  const backendAvailable = await checkPort(backendSlotBase);
  
  if (frontendAvailable && backendAvailable) {
    return { frontend: slotBase, backend: backendSlotBase, slot };
  }
  return null;
}

async function startServer() {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const logDir = path.join(__dirname, '../../');
  const logStream = fs.createWriteStream(path.join(logDir, 'backend.log'), { flags: 'a' });
  const originalStdout = process.stdout.write.bind(process.stdout);
  process.stdout.write = (...args) => {
    originalStdout(...args);
    logStream.write(...args);
  };

  console.log('='.repeat(60));
  console.log('猎头生态型人才协作平台 - 后端服务启动中...');
  console.log('='.repeat(60));
  console.log(`项目目录: ${PROJECT_DIR}`);

  let currentFrontendPort = parseInt(process.env.FRONTEND_PORT);
  let currentBackendPort = parseInt(process.env.BACKEND_PORT);

  const backendAvailable = await checkPort(currentBackendPort);

  if (!backendAvailable) {
    console.log(`后端端口 ${currentBackendPort} 被占用，尝试备用槽位...`);
    
    let found = false;
    for (let slot = 1; slot <= 5; slot++) {
      const result = await findAvailablePort(0, slot);
      if (result) {
        currentFrontendPort = result.frontend;
        currentBackendPort = result.backend;
        found = true;
        console.log(`找到可用端口: FRONTEND=${currentFrontendPort}, BACKEND=${currentBackendPort} (槽位 ${slot})`);
        
        const envPath = path.join(__dirname, '../../.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(/FRONTEND_PORT=\d+/, `FRONTEND_PORT=${currentFrontendPort}`);
        envContent = envContent.replace(/BACKEND_PORT=\d+/, `BACKEND_PORT=${currentBackendPort}`);
        envContent = envContent.replace(/API_BASE_URL=http:\/\/127\.0\.0\.1:\d+\/api/, `API_BASE_URL=http://127.0.0.1:${currentBackendPort}/api`);
        envContent = envContent.replace(/VITE_API_BASE_URL=http:\/\/127\.0\.0\.1:\d+\/api/, `VITE_API_BASE_URL=http://127.0.0.1:${currentBackendPort}/api`);
        envContent = envContent.replace(/CORS_ORIGIN=http:\/\/127\.0\.0\.1:\d+/, `CORS_ORIGIN=http://127.0.0.1:${currentFrontendPort}`);
        fs.writeFileSync(envPath, envContent);
        console.log('.env 已更新');
        break;
      }
    }
    
    if (!found) {
      console.error('所有端口槽位均被占用，请手动释放端口后重试。');
      console.error(`占用端口: FRONTEND=${currentFrontendPort}, BACKEND=${currentBackendPort}`);
      process.exit(1);
    }
  }

  server.listen(currentBackendPort, '127.0.0.1', () => {
    console.log('='.repeat(60));
    console.log('✅ 后端服务启动成功!');
    console.log(`📍 服务地址: http://127.0.0.1:${currentBackendPort}`);
    console.log(`🔌 API 前缀: http://127.0.0.1:${currentBackendPort}/api`);
    console.log(`💊 健康检查: http://127.0.0.1:${currentBackendPort}/api/health`);
    console.log(`🌐 CORS Origin: ${CORS_ORIGIN}`);
    console.log(`📡 WebSocket: 已启用`);
    console.log('='.repeat(60));
    console.log('📚 可用 API 路由:');
    console.log('   POST /api/auth/login         - 用户登录');
    console.log('   POST /api/auth/register      - 用户注册');
    console.log('   GET  /api/auth/me            - 当前用户信息');
    console.log('   GET  /api/resumes            - 简历列表');
    console.log('   POST /api/resumes            - 创建简历');
    console.log('   GET  /api/jobs               - 职位悬赏列表');
    console.log('   POST /api/jobs               - 创建职位悬赏');
    console.log('   GET  /api/recommendations    - 推荐记录列表');
    console.log('   POST /api/recommendations    - 创建推荐（触发分佣合约）');
    console.log('   GET  /api/toolbox/portrait/:id  - 人才画像');
    console.log('   GET  /api/toolbox/poaching-risk/:id - 挖角风险评估');
    console.log('   GET  /api/toolbox/salary-band - 薪酬带宽查询');
    console.log('   GET  /api/im/conversations   - IM会话列表');
    console.log('   POST /api/im/interview/schedule - 预约视频面试');
    console.log('   GET  /api/admin/dashboard    - 管理后台仪表盘');
    console.log('='.repeat(60));
  });
}

startServer().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
