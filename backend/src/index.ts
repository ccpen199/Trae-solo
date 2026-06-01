import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db, initDb } from './db.js';
import feedbackRouter from './routes/feedback.js';
import statsRouter from './routes/stats.js';
import defectsRouter from './routes/defects.js';
import healthRouter from './routes/health.js';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '..', '.env');
let BACKEND_PORT = 53407;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('BACKEND_PORT=')) {
      const portValue = trimmed.split('=')[1];
      const parsed = parseInt(portValue, 10);
      if (!isNaN(parsed)) {
        BACKEND_PORT = parsed;
      }
    }
  }
}

initDb();

const app = express();

app.use(cors({
  origin: 'http://127.0.0.1:46407',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 提供附件访问
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// 附件访问路由
app.get('/api/feedbacks/:id/attachments/:attId', (req, res) => {
  const { id, attId } = req.params;
  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ? AND feedback_id = ?').get(attId, id) as any;
  
  if (!attachment) {
    res.status(404).json({ success: false, error: '附件不存在' });
    return;
  }

  // 检查文件是否存在
  const filePath = attachment.file_path;
  if (fs.existsSync(filePath)) {
    res.sendFile(path.resolve(filePath));
  } else {
    // 如果文件不存在，返回一个占位图
    res.type(attachment.content_type);
    res.send(Buffer.alloc(0));
  }
});

app.use('/api/feedbacks', feedbackRouter);
app.use('/api/stats', statsRouter);
app.use('/api/defects', defectsRouter);
app.use('/api/health', healthRouter);

const seedDefects = () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM defects').get() as { count: number };
  if (count.count === 0) {
    const now = Date.now();
    const defects = [
      { id: randomUUID(), title: '登录模块session过期处理异常', description: '用户长时间未操作后，session过期时未正确重定向到登录页', status: 'open', priority: 'critical', assignee: '张三', created_by: '系统' },
      { id: randomUUID(), title: '首页加载性能优化', description: '首屏加载时间超过3秒，需要优化资源加载顺序', status: 'in_progress', priority: 'high', assignee: '李四', created_by: '系统' },
      { id: randomUUID(), title: '用户头像上传失败', description: '部分格式的图片上传后无法正确显示', status: 'open', priority: 'medium', assignee: '王五', created_by: '系统' },
      { id: randomUUID(), title: '列表分页组件样式问题', description: '分页按钮在移动端显示错乱', status: 'resolved', priority: 'low', assignee: '赵六', created_by: '系统' },
      { id: randomUUID(), title: '搜索功能关键词高亮失效', description: '搜索结果中关键词没有正确高亮显示', status: 'open', priority: 'medium', assignee: '张三', created_by: '系统' },
    ];
    const stmt = db.prepare('INSERT INTO defects (id, title, description, status, priority, assignee, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    defects.forEach(d => {
      stmt.run(d.id, d.title, d.description, d.status, d.priority, d.assignee, d.created_by, now, now);
    });
    console.log('已初始化测试缺陷数据');
  }
};

seedDefects();

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: err.message || '服务器内部错误'
  });
});

app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${BACKEND_PORT}`);
});
