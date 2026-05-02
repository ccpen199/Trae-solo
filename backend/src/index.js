const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const { authenticateToken } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const repositoryRoutes = require('./routes/repositories');
const branchRoutes = require('./routes/branches');
const mergeRequestRoutes = require('./routes/mergeRequests');
const ciCdRoutes = require('./routes/ciCd');
const messageRoutes = require('./routes/messages');
const auditRoutes = require('./routes/audit');
const rulesRoutes = require('./routes/rules');

const app = express();
const PORT = process.env.PORT || 11731;

app.use(cors({
  origin: ['http://localhost:11732', 'http://127.0.0.1:11732'],
  credentials: true
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/auth', authRoutes);
app.use('/api/repositories', authenticateToken, repositoryRoutes);
app.use('/api/branches', authenticateToken, branchRoutes);
app.use('/api/merge-requests', authenticateToken, mergeRequestRoutes);
app.use('/api/ci-cd', authenticateToken, ciCdRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);
app.use('/api/audit', authenticateToken, auditRoutes);
app.use('/api/rules', authenticateToken, rulesRoutes);

app.get('/api/stats', authenticateToken, (req, res) => {
  const db = require('./database');
  
  const repoStats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM repositories
    GROUP BY status
  `).all();

  const mrStats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM merge_requests
    GROUP BY status
  `).all();

  const pipelineStats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM ci_pipelines
    GROUP BY status
  `).all();

  const userStats = db.prepare(`
    SELECT 
      role,
      COUNT(*) as count
    FROM users
    GROUP BY role
  `).all();

  const todoStats = db.prepare(`
    SELECT 
      COUNT(*) as pending_todos
    FROM messages
    WHERE recipient_id = ? AND is_read = 0 AND type = 'todo'
  `).get(req.user.id);

  res.json({
    repositories: repoStats.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {}),
    merge_requests: mrStats.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {}),
    pipelines: pipelineStats.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {}),
    users: userStats.reduce((acc, item) => {
      acc[item.role] = item.count;
      return acc;
    }, {}),
    my_todos: todoStats.pending_todos
  });
});

app.get('/api/reports/merge-requests', authenticateToken, (req, res) => {
  const db = require('./database');
  const { start_time, end_time, group_by } = req.query;

  let timeCondition = '';
  const params = [];

  if (start_time) {
    timeCondition += ' AND created_at >= ?';
    params.push(Math.floor(new Date(start_time).getTime() / 1000));
  }

  if (end_time) {
    timeCondition += ' AND created_at <= ?';
    params.push(Math.floor(new Date(end_time).getTime() / 1000));
  }

  const groupField = group_by === 'day' ? 'date(created_at, "unixepoch")' : 
                     group_by === 'week' ? 'strftime("%Y-%W", created_at, "unixepoch")' :
                     group_by === 'month' ? 'strftime("%Y-%m", created_at, "unixepoch")' : 'status';

  const mrTrend = db.prepare(`
    SELECT 
      ${groupField} as period,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'merged' THEN 1 ELSE 0 END) as merged,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
      AVG(CASE WHEN status = 'merged' THEN updated_at - created_at ELSE NULL END) as avg_merge_time
    FROM merge_requests
    WHERE 1=1 ${timeCondition}
    GROUP BY period
    ORDER BY period
  `).all(...params);

  const byReviewer = db.prepare(`
    SELECT 
      u.username as reviewer,
      COUNT(mr.id) as total_reviews,
      SUM(CASE WHEN mr.status = 'merged' THEN 1 ELSE 0 END) as approved,
      AVG(mr.updated_at - mr.created_at) as avg_review_time
    FROM merge_requests mr
    LEFT JOIN users u ON mr.reviewer_id = u.id
    WHERE mr.reviewer_id IS NOT NULL ${timeCondition}
    GROUP BY u.id, u.username
    ORDER BY total_reviews DESC
    LIMIT 10
  `).all(...params);

  res.json({
    trend: mrTrend,
    by_reviewer: byReviewer
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           代码托管平台协作系统 - 后端服务                   ║
╠══════════════════════════════════════════════════════════╣
║  服务地址: http://localhost:${PORT}                          ║
║  健康检查: http://localhost:${PORT}/health                    ║
║  API文档: 请参考路由配置                                      ║
╠══════════════════════════════════════════════════════════╣
║  默认账号:                                                   ║
║    admin / admin123    (管理员)                              ║
║    developer / admin123 (开发者)                             ║
║    reviewer / admin123  (审查者)                             ║
║    devops / admin123    (运维)                               ║
╚══════════════════════════════════════════════════════════╝
  `);
});
