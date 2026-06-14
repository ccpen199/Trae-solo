const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });

const { db, initDatabase } = require('./db');

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const tvRoutes = require('./routes/tv');
const peopleRoutes = require('./routes/people');
const reviewRoutes = require('./routes/reviews');
const playlistRoutes = require('./routes/playlists');
const newsRoutes = require('./routes/news');
const communityRoutes = require('./routes/community');
const quizRoutes = require('./routes/quizzes');
const liveRoutes = require('./routes/live');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 59024;
const PROJECT_DIR = process.env.PROJECT_DIR || '/Users/chen/Documents/trae_projects/local_projects/may-89024';

const logStream = fs.createWriteStream(path.join(__dirname, '../../backend.log'), { flags: 'a' });

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://trae-api-cn.mchost.guru', '*.trae-api-cn.mchost.guru'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'http://127.0.0.1:59024', 'https://trae-api-cn.mchost.guru']
    }
  }
}));

app.use(cors({
  origin: [
    'http://127.0.0.1:49024',
    'http://localhost:49024',
    'http://127.0.0.1:41024',
    'http://127.0.0.1:42024',
    'http://127.0.0.1:43024',
    'http://127.0.0.1:44024',
    'http://127.0.0.1:45024'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logStream }));
app.use(morgan('dev'));

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    project: 'CineHub',
    version: '1.0.0'
  });
});

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const limit = Math.min(parseInt(req.query.limit) || 8, 20);

  if (!keyword) {
    return res.json({
      query: keyword,
      total: 0,
      data: { movies: [], tvShows: [], people: [] },
      movies: [],
      tvShows: [],
      people: []
    });
  }

  const like = `%${keyword}%`;
  const movies = db.prepare(`
    SELECT id, title, original_title, year, rating, genres, poster_url, plot
    FROM movies
    WHERE status = 'active' AND (title LIKE ? OR original_title LIKE ? OR director LIKE ? OR genres LIKE ?)
    ORDER BY rating DESC, vote_count DESC
    LIMIT ?
  `).all(like, like, like, like, limit);

  const tvShows = db.prepare(`
    SELECT id, title, original_title, start_year, rating, genres, poster_url, plot
    FROM tv_shows
    WHERE active_status = 'active' AND (title LIKE ? OR original_title LIKE ? OR creator LIKE ? OR genres LIKE ?)
    ORDER BY rating DESC, vote_count DESC
    LIMIT ?
  `).all(like, like, like, like, limit);

  const people = db.prepare(`
    SELECT id, name, original_name, avatar_url, known_for, popularity
    FROM people
    WHERE status = 'active' AND (name LIKE ? OR original_name LIKE ? OR known_for LIKE ?)
    ORDER BY popularity DESC
    LIMIT ?
  `).all(like, like, like, limit);

  res.json({
    query: keyword,
    total: movies.length + tvShows.length + people.length,
    data: { movies, tvShows, people },
    movies,
    tvShows,
    people
  });
});

app.get('/api/products', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const movies = db.prepare(`
    SELECT id, title as name, genres as category, plot as description, rating as price,
           poster_url, year, director
    FROM movies
    WHERE status = 'active'
    ORDER BY rating DESC, vote_count DESC
    LIMIT ?
  `).all(limit);
  res.json({ products: movies, total: movies.length, message: 'CineHub将影视条目映射为可浏览内容商品' });
});

app.get('/api/orders', (req, res) => {
  const reviews = db.prepare(`
    SELECT id, content_type, content_id, rating, content, status, created_at
    FROM reviews
    ORDER BY created_at DESC
    LIMIT 20
  `).all();
  res.json({ orders: reviews, total: reviews.length, message: 'CineHub使用影评、片单和社区互动流程，无传统订单' });
});

app.get('/api/cart', (req, res) => {
  res.json({ items: [], total: 0, message: 'CineHub为内容社区，无购物车' });
});

app.get('/api/admin/stats', (req, res) => {
  res.json({
    users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    movies: db.prepare('SELECT COUNT(*) as count FROM movies').get().count,
    tvShows: db.prepare('SELECT COUNT(*) as count FROM tv_shows').get().count,
    reviews: db.prepare('SELECT COUNT(*) as count FROM reviews').get().count,
    topics: db.prepare('SELECT COUNT(*) as count FROM topics').get().count
  });
});

app.get('/api/ide/v1/text_to_image', (req, res) => {
  const prompt = String(req.query.prompt || 'CineHub').slice(0, 80);
  const imageSize = String(req.query.image_size || 'square');
  const landscape = imageSize.includes('landscape');
  const portrait = imageSize.includes('portrait');
  const width = landscape ? 640 : portrait ? 480 : 512;
  const height = landscape ? 360 : portrait ? 640 : 512;
  const safePrompt = prompt
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  res.type('image/svg+xml').send(`
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#111827"/>
      <stop offset="1" stop-color="#7c2d12"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="18" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.22)"/>
  <text x="50%" y="46%" text-anchor="middle" fill="#fff7ed" font-family="Arial, sans-serif" font-size="32" font-weight="700">CineHub</text>
  <text x="50%" y="55%" text-anchor="middle" fill="#fed7aa" font-family="Arial, sans-serif" font-size="18">${safePrompt}</text>
</svg>`);
});

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/tv', tvRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  logStream.write(`[${new Date().toISOString()}] ERROR: ${err.stack}\n`);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'API路由不存在' });
});

function execText(command) {
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    exec(command, (error, stdout) => {
      resolve(stdout.trim());
    });
  });
}

async function checkPort(port) {
  const output = await execText(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null || true`);
  const pids = output.split(/\s+/).filter(Boolean);

  for (const pid of pids) {
    const cwdOutput = await execText(`lsof -p ${pid} -a -d cwd -Fn 2>/dev/null || true`);
    const cwdTrimmed = cwdOutput
      .split('\n')
      .find((line) => line.startsWith('n'))
      ?.slice(1)
      .trim() || '';

    if (!cwdTrimmed.startsWith(PROJECT_DIR)) {
      throw new Error(`端口 ${port} 被其他项目占用 (PID: ${pid}, CWD: ${cwdTrimmed || 'unknown'})`);
    }

    await execText(`kill ${pid} 2>/dev/null || true`);
    console.log(`已终止占用端口 ${port} 的本项目进程 ${pid}`);
  }

  if (pids.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function startServer() {
  try {
    await checkPort(PORT);

    app.listen(PORT, '127.0.0.1', () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    CineHub 后端服务已启动                     ║
╠══════════════════════════════════════════════════════════════╣
║  服务地址: http://127.0.0.1:${PORT}                          ║
║  API 前缀: http://127.0.0.1:${PORT}/api                      ║
║  健康检查: http://127.0.0.1:${PORT}/api/health               ║
║  数据库: SQLite (./data/app.sqlite)                          ║
║  环境: ${process.env.NODE_ENV || 'development'}              ║
╠══════════════════════════════════════════════════════════════╣
║  预设账号:                                                   ║
║  - admin / admin123  (管理员)                                ║
║  - moderator / mod123  (审核员)                              ║
║  - user1 / user123  (普通用户)                               ║
╚══════════════════════════════════════════════════════════════╝
      `);
      logStream.write(`[${new Date().toISOString()}] Server started on http://127.0.0.1:${PORT}\n`);
    });
  } catch (err) {
    console.error('启动失败:', err.message);
    console.log('\n请按以下方式处理:');
    console.log('1. 手动终止占用端口的其他进程 (如果确认归属)');
    console.log('2. 或修改 .env 中的 PORT_SLOT 使用备用端口槽位');
    console.log('   备用槽位: 41000/51000, 42000/52000, 43000/53000, 44000/54000, 45000/55000 + tail4');
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
