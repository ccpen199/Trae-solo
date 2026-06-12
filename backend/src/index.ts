import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import http from 'http';
import multer from 'multer';
import { config } from './config';
import { initDatabase, db } from './database';
import { initSocketIO } from './socket';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import resumeRoutes from './routes/resumes';
import jobRoutes from './routes/jobs';
import matchingRoutes from './routes/matching';
import communityRoutes from './routes/community';
import chatRoutes from './routes/chat';
import enterpriseRoutes from './routes/enterprise';
import lmsRoutes from './routes/lms';
import notificationRoutes from './routes/notifications';
import permissionRoutes from './routes/permissions';

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

initDatabase();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(config.uploadDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未上传文件' });
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.originalname, size: req.file.size });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), uptime: process.uptime() });
});

app.get('/api/search', (req, res) => {
  const q = String(req.query.q || req.query.keyword || '').trim();
  const keyword = `%${q || '职场'}%`;
  const jobs = db.prepare(`
    SELECT id, title, department, location, industry, status, created_at
    FROM jobs
    WHERE status = 'open' AND (title LIKE ? OR department LIKE ? OR description LIKE ? OR location LIKE ? OR industry LIKE ?)
    ORDER BY created_at DESC
    LIMIT 8
  `).all(keyword, keyword, keyword, keyword, keyword);
  const courses = db.prepare(`
    SELECT id, title, category, status, created_at
    FROM courses
    WHERE title LIKE ? OR category LIKE ? OR description LIKE ?
    ORDER BY created_at DESC
    LIMIT 8
  `).all(keyword, keyword, keyword);
  const topics = db.prepare(`
    SELECT id, title, tags, status, views, likes, created_at
    FROM community_topics
    WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
    ORDER BY created_at DESC
    LIMIT 8
  `).all(keyword, keyword, keyword);
  res.json({
    query: q,
    total: jobs.length + courses.length + topics.length,
    results: { jobs, courses, topics }
  });
});

app.get('/api/admin/stats', (_req, res) => {
  const users = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  const jobs = db.prepare('SELECT COUNT(*) as cnt FROM jobs').get() as { cnt: number };
  const resumes = db.prepare('SELECT COUNT(*) as cnt FROM resumes').get() as { cnt: number };
  const courses = db.prepare('SELECT COUNT(*) as cnt FROM courses').get() as { cnt: number };
  const audits = db.prepare('SELECT COUNT(*) as cnt FROM audit_logs').get() as { cnt: number };
  res.json({
    stats: {
      userCount: users.cnt,
      jobCount: jobs.cnt,
      resumeCount: resumes.cnt,
      courseCount: courses.cnt,
      auditCount: audits.cnt
    }
  });
});

app.get('/api/admin/dashboard', (_req, res) => {
  const roleRows = db.prepare('SELECT role, COUNT(*) as count FROM users GROUP BY role').all() as Array<{ role: string; count: number }>;
  const openJobs = db.prepare('SELECT COUNT(*) as cnt FROM jobs WHERE status = ?').get('open') as { cnt: number };
  const pendingTopics = db.prepare('SELECT COUNT(*) as cnt FROM community_topics WHERE status = ? OR is_approved = 0').get('pending') as { cnt: number };
  res.json({
    overview: {
      title: '后台管理数据概览',
      openJobs: openJobs.cnt,
      pendingTopics: pendingTopics.cnt,
      roleDistribution: roleRows
    },
    modules: ['用户管理', '岗位管理', '课程管理', '内容审核', '操作审计日志']
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/lms', lmsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/permissions', permissionRoutes);

app.get('/api/stats/dashboard', (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  const jobCount = db.prepare('SELECT COUNT(*) as cnt FROM jobs WHERE status = ?').get('open') as { cnt: number };
  const applicationCount = db.prepare('SELECT COUNT(*) as cnt FROM job_applications').get() as { cnt: number };
  const courseCount = db.prepare('SELECT COUNT(*) as cnt FROM courses WHERE status = ?').get('published') as { cnt: number };
  res.json({ stats: { userCount: userCount.cnt, jobCount: jobCount.cnt, applicationCount: applicationCount.cnt, courseCount: courseCount.cnt } });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

const io = initSocketIO(server);
(global as any)._io = io;

server.listen(config.port, '127.0.0.1', () => {
  console.log(`🚀 Backend server running at http://127.0.0.1:${config.port}`);
  console.log(`📡 Socket.IO ready`);
});
