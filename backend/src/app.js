require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const messageRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 11861;

app.use(cors({
  origin: ['http://localhost:11861', 'http://127.0.0.1:11861', 'http://localhost:11862', 'http://127.0.0.1:11862'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/config', (req, res) => {
  res.json({
    statuses: {
      pending_collect: '待日志采集',
      pending_parse: '待解析索引',
      pending_query: '待查询分析',
      pending_alert: '待告警',
      archived: '已归档'
    },
    roles: {
      developer: '开发',
      operator: '运维',
      security: '安全',
      analyst: '数据分析',
      admin: '管理员'
    },
    priorities: {
      low: '低',
      normal: '中',
      high: '高',
      urgent: '紧急'
    }
  });
});

const distPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(distPath)) {
  console.log('前端静态文件目录存在，启用静态文件服务');
  
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: '接口不存在' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.log('前端静态文件目录不存在，仅提供 API 服务');
  console.log('请先运行: cd frontend && npm run build');
  
  app.use((req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ message: '接口不存在' });
    } else {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>日志分析平台</title></head>
        <body style="padding: 40px; font-family: sans-serif;">
          <h1>日志分析平台</h1>
          <p>API 服务已启动</p>
          <p style="color: #666;">前端静态文件未构建，请执行:</p>
          <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
cd /Users/chen/Documents/trae_projects/local_projects/xm-11186/frontend
npm run build
          </pre>
          <p>或者在开发模式下单独启动前端:</p>
          <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
cd /Users/chen/Documents/trae_projects/local_projects/xm-11186/frontend
npm run dev
          </pre>
          <h2>API 测试</h2>
          <p><a href="/api/health">/api/health</a> - 健康检查</p>
          <p><a href="/api/config">/api/config</a> - 配置信息</p>
        </body>
        </html>
      `);
    }
  });
}

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || '服务器内部错误'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`  日志分析平台服务已启动`);
  console.log(`========================================`);
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log(`  API 前缀: /api`);
  if (fs.existsSync(distPath)) {
    console.log(`  前端状态: 已集成 (从 frontend/dist 提供)`);
  } else {
    console.log(`  前端状态: 需要单独构建或启动 dev server`);
  }
  console.log(`========================================`);
});

module.exports = app;
