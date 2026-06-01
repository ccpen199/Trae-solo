import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'app.sqlite');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS dramas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      genre TEXT NOT NULL DEFAULT '',
      copyright_holder TEXT NOT NULL DEFAULT '',
      actors TEXT NOT NULL DEFAULT '',
      synopsis TEXT NOT NULL DEFAULT '',
      cover_url TEXT NOT NULL DEFAULT '',
      episode_count INTEGER NOT NULL DEFAULT 0,
      payment_type TEXT NOT NULL DEFAULT 'per_episode',
      shelf_status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      drama_id INTEGER NOT NULL,
      episode_number INTEGER NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      video_url TEXT NOT NULL DEFAULT '',
      poster_url TEXT NOT NULL DEFAULT '',
      preview_duration INTEGER NOT NULL DEFAULT 0,
      subtitle_file TEXT NOT NULL DEFAULT '',
      plot_tags TEXT NOT NULL DEFAULT '',
      review_notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'uploaded',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (drama_id) REFERENCES dramas(id) ON DELETE CASCADE,
      UNIQUE(drama_id, episode_number)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      drama_id INTEGER NOT NULL,
      episode_id INTEGER,
      reviewer TEXT NOT NULL DEFAULT '',
      copyright_check INTEGER NOT NULL DEFAULT 0,
      sensitive_content_check INTEGER NOT NULL DEFAULT 0,
      quality_check INTEGER NOT NULL DEFAULT 0,
      subtitle_check INTEGER NOT NULL DEFAULT 0,
      payment_config_check INTEGER NOT NULL DEFAULT 0,
      overall_result TEXT NOT NULL DEFAULT 'pending',
      rejection_reason TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (drama_id) REFERENCES dramas(id) ON DELETE CASCADE,
      FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS distributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      drama_id INTEGER NOT NULL,
      episode_id INTEGER,
      recommendation_slot TEXT NOT NULL DEFAULT '',
      campaign TEXT NOT NULL DEFAULT '',
      unlock_price REAL NOT NULL DEFAULT 0,
      member_benefit TEXT NOT NULL DEFAULT '',
      distribution_channel TEXT NOT NULL DEFAULT '',
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (drama_id) REFERENCES dramas(id) ON DELETE CASCADE,
      FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      drama_id INTEGER NOT NULL,
      episode_id INTEGER,
      play_count INTEGER NOT NULL DEFAULT 0,
      completion_count INTEGER NOT NULL DEFAULT 0,
      payment_conversion INTEGER NOT NULL DEFAULT 0,
      cancellation_count INTEGER NOT NULL DEFAULT 0,
      complaint_count INTEGER NOT NULL DEFAULT 0,
      dropoff_point INTEGER NOT NULL DEFAULT 0,
      stat_date TEXT NOT NULL DEFAULT (date('now','localtime')),
      FOREIGN KEY (drama_id) REFERENCES dramas(id) ON DELETE CASCADE,
      FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE SET NULL,
      UNIQUE(drama_id, episode_id, stat_date)
    );
  `);
}
initSchema();

function seedData() {
  const dramaCount = db.prepare('SELECT COUNT(*) as cnt FROM dramas').get().cnt;
  if (dramaCount > 0) return;

  const insertDrama = db.prepare(`INSERT INTO dramas (title, genre, copyright_holder, actors, synopsis, cover_url, episode_count, payment_type, shelf_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertEpisode = db.prepare(`INSERT INTO episodes (drama_id, episode_number, title, video_url, poster_url, preview_duration, subtitle_file, plot_tags, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertReview = db.prepare(`INSERT INTO reviews (drama_id, episode_id, reviewer, copyright_check, sensitive_content_check, quality_check, subtitle_check, payment_config_check, overall_result) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertDist = db.prepare(`INSERT INTO distributions (drama_id, episode_id, recommendation_slot, campaign, unlock_price, member_benefit, distribution_channel, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertAnalytics = db.prepare(`INSERT INTO analytics (drama_id, episode_id, play_count, completion_count, payment_conversion, cancellation_count, complaint_count, dropoff_point, stat_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const dramas = [
    ['都市奇缘', '都市爱情', '星辰影视', '李明,张婷,王磊', '两个陌生人在都市中意外相遇，展开一段奇妙的缘分之旅。', 'https://picsum.photos/seed/drama1/400/600', 12, 'per_episode', 'published'],
    ['复仇之路', '悬疑推理', '烈火传媒', '陈华,林小雨', '十年前的真相逐渐浮出水面，复仇者与被复仇者的命运交织。', 'https://picsum.photos/seed/drama2/400/600', 20, 'vip_only', 'review'],
    ['青春无悔', '校园青春', '蓝天影业', '赵阳,刘雪,周杰', '一群年轻人在大学校园里追逐梦想，经历友情、爱情与成长。', 'https://picsum.photos/seed/drama3/400/600', 16, 'free', 'published'],
    ['商海风云', '商战', '金鼎文化', '孙浩,吴芳', '商业帝国的明争暗斗，一场没有硝烟的战争。', 'https://picsum.photos/seed/drama4/400/600', 24, 'per_episode', 'draft'],
    ['古风传说', '古装玄幻', '华影制作', '郑天宇,林婉儿,马明', '一个关于上古神器的传说，牵扯出几代人的恩怨情仇。', 'https://picsum.photos/seed/drama5/400/600', 30, 'vip_only', 'published']
  ];

  for (const d of dramas) {
    const info = insertDrama.run(...d);
    const dramaId = info.lastInsertRowid;
    const epCount = d[6];
    for (let i = 1; i <= epCount; i++) {
      const epTitle = `第${i}集：${['相遇','离别','重逢','秘密','真相','危机','抉择','牺牲','觉醒','希望'][i % 10]}`;
      const status = d[8] === 'published' ? (i <= 3 ? 'distributed' : 'approved') : (d[8] === 'review' ? 'pending_review' : 'uploaded');
      const epInfo = insertEpisode.run(dramaId, i, epTitle, `https://cdn.example.com/video/d${dramaId}/ep${i}.mp4`, `https://picsum.photos/seed/ep${dramaId}-${i}/400/225`, 30, `https://cdn.example.com/sub/d${dramaId}/ep${i}.srt`, '剧情,情感', status);
      const epId = epInfo.lastInsertRowid;
      if (status === 'approved' || status === 'distributed' || status === 'pending_review') {
        insertReview.run(dramaId, epId, '审核员A', 1, 1, 1, 1, 1, status === 'pending_review' ? 'pending' : 'approved');
      }
      if (status === 'distributed') {
        insertDist.run(dramaId, epId, '首页推荐', '暑期活动', d[7] === 'per_episode' ? 3 : 0, '会员免费看', '短视频平台', 1);
      }
      if (status === 'distributed' || status === 'approved') {
        const playCount = Math.floor(Math.random() * 50000) + 10000;
        const completionCount = Math.floor(playCount * (0.4 + Math.random() * 0.3));
        const paymentConversion = Math.floor(completionCount * (0.1 + Math.random() * 0.15));
        const dropoff = Math.floor(30 + Math.random() * 40);
        insertAnalytics.run(dramaId, epId, playCount, completionCount, paymentConversion, Math.floor(paymentConversion * 0.03), Math.floor(playCount * 0.002), dropoff, '2026-05-26');
      }
    }
  }
}
seedData();

const app = express();
app.use(cors({ origin: 'http://127.0.0.1:43416', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), db: DB_PATH });
});

app.get('/api/dramas', (req, res) => {
  const rows = db.prepare('SELECT * FROM dramas ORDER BY updated_at DESC').all();
  res.json({ data: rows });
});

app.get('/api/dramas/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM dramas WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  row.episodes = db.prepare('SELECT * FROM episodes WHERE drama_id = ? ORDER BY episode_number').all(row.id);
  row.reviews = db.prepare('SELECT * FROM reviews WHERE drama_id = ? ORDER BY created_at DESC').all(row.id);
  row.distributions = db.prepare('SELECT * FROM distributions WHERE drama_id = ? ORDER BY version DESC').all(row.id);
  row.analytics = db.prepare('SELECT * FROM analytics WHERE drama_id = ? ORDER BY stat_date DESC').all(row.id);
  res.json({ data: row });
});

app.post('/api/dramas', (req, res) => {
  const { title, genre, copyright_holder, actors, synopsis, cover_url, episode_count, payment_type, shelf_status } = req.body;
  const info = db.prepare(`INSERT INTO dramas (title, genre, copyright_holder, actors, synopsis, cover_url, episode_count, payment_type, shelf_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    title || '', genre || '', copyright_holder || '', actors || '', synopsis || '', cover_url || '', episode_count || 0, payment_type || 'per_episode', shelf_status || 'draft'
  );
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/dramas/:id', (req, res) => {
  const { title, genre, copyright_holder, actors, synopsis, cover_url, episode_count, payment_type, shelf_status } = req.body;
  db.prepare(`UPDATE dramas SET title=?, genre=?, copyright_holder=?, actors=?, synopsis=?, cover_url=?, episode_count=?, payment_type=?, shelf_status=?, updated_at=datetime('now','localtime') WHERE id=?`).run(
    title || '', genre || '', copyright_holder || '', actors || '', synopsis || '', cover_url || '', episode_count || 0, payment_type || 'per_episode', shelf_status || 'draft', req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/dramas/:id', (req, res) => {
  db.prepare('DELETE FROM dramas WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/dramas/:id/episodes', (req, res) => {
  const rows = db.prepare('SELECT * FROM episodes WHERE drama_id = ? ORDER BY episode_number').all(req.params.id);
  res.json({ data: rows });
});

app.post('/api/dramas/:id/episodes', (req, res) => {
  const { episode_number, title, video_url, poster_url, preview_duration, subtitle_file, plot_tags, review_notes } = req.body;
  const info = db.prepare(`INSERT INTO episodes (drama_id, episode_number, title, video_url, poster_url, preview_duration, subtitle_file, plot_tags, review_notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'uploaded')`).run(
    req.params.id, episode_number || 1, title || '', video_url || '', poster_url || '', preview_duration || 0, subtitle_file || '', plot_tags || '', review_notes || ''
  );
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/episodes/:id', (req, res) => {
  const { title, video_url, poster_url, preview_duration, subtitle_file, plot_tags, review_notes, status } = req.body;
  db.prepare(`UPDATE episodes SET title=?, video_url=?, poster_url=?, preview_duration=?, subtitle_file=?, plot_tags=?, review_notes=?, status=?, updated_at=datetime('now','localtime') WHERE id=?`).run(
    title || '', video_url || '', poster_url || '', preview_duration || 0, subtitle_file || '', plot_tags || '', review_notes || '', status || 'uploaded', req.params.id
  );
  res.json({ ok: true });
});

app.post('/api/episodes/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare(`UPDATE episodes SET status=?, updated_at=datetime('now','localtime') WHERE id=?`).run(status || 'uploaded', req.params.id);
  res.json({ ok: true });
});

app.delete('/api/episodes/:id', (req, res) => {
  db.prepare('DELETE FROM episodes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/reviews', (req, res) => {
  const rows = db.prepare(`SELECT r.*, d.title as drama_title, e.episode_number FROM reviews r LEFT JOIN dramas d ON r.drama_id = d.id LEFT JOIN episodes e ON r.episode_id = e.id ORDER BY r.created_at DESC`).all();
  res.json({ data: rows });
});

app.post('/api/reviews', (req, res) => {
  const { drama_id, episode_id, reviewer, copyright_check, sensitive_content_check, quality_check, subtitle_check, payment_config_check, overall_result, rejection_reason } = req.body;
  const info = db.prepare(`INSERT INTO reviews (drama_id, episode_id, reviewer, copyright_check, sensitive_content_check, quality_check, subtitle_check, payment_config_check, overall_result, rejection_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    drama_id, episode_id || null, reviewer || '', copyright_check || 0, sensitive_content_check || 0, quality_check || 0, subtitle_check || 0, payment_config_check || 0, overall_result || 'pending', rejection_reason || ''
  );
  if (overall_result === 'approved' && episode_id) {
    db.prepare(`UPDATE episodes SET status='approved', updated_at=datetime('now','localtime') WHERE id=?`).run(episode_id);
  }
  res.json({ id: info.lastInsertRowid });
});

app.get('/api/distributions', (req, res) => {
  const rows = db.prepare(`SELECT d.*, dr.title as drama_title, e.episode_number FROM distributions d LEFT JOIN dramas dr ON d.drama_id = dr.id LEFT JOIN episodes e ON d.episode_id = e.id ORDER BY d.created_at DESC`).all();
  res.json({ data: rows });
});

app.post('/api/distributions', (req, res) => {
  const { drama_id, episode_id, recommendation_slot, campaign, unlock_price, member_benefit, distribution_channel } = req.body;
  const latest = db.prepare('SELECT MAX(version) as max_v FROM distributions WHERE drama_id=? AND episode_id=?').get(drama_id, episode_id || null);
  const version = (latest?.max_v || 0) + 1;
  const info = db.prepare(`INSERT INTO distributions (drama_id, episode_id, recommendation_slot, campaign, unlock_price, member_benefit, distribution_channel, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    drama_id, episode_id || null, recommendation_slot || '', campaign || '', unlock_price || 0, member_benefit || '', distribution_channel || '', version
  );
  if (episode_id) {
    db.prepare(`UPDATE episodes SET status='distributed', updated_at=datetime('now','localtime') WHERE id=?`).run(episode_id);
  }
  res.json({ id: info.lastInsertRowid, version });
});

app.get('/api/analytics', (req, res) => {
  const rows = db.prepare(`SELECT a.*, d.title as drama_title, e.episode_number FROM analytics a LEFT JOIN dramas d ON a.drama_id = d.id LEFT JOIN episodes e ON a.episode_id = e.id ORDER BY a.stat_date DESC`).all();
  res.json({ data: rows });
});

app.get('/api/analytics/drama/:id', (req, res) => {
  const rows = db.prepare(`SELECT * FROM analytics WHERE drama_id = ? ORDER BY stat_date DESC`).all(req.params.id);
  res.json({ data: rows });
});

app.get('/api/analytics/summary', (req, res) => {
  const dramaCount = db.prepare(`SELECT COUNT(*) as cnt FROM dramas`).get().cnt;
  const stats = db.prepare(`
    SELECT 
      SUM(play_count) as total_plays,
      SUM(completion_count) as total_completions,
      SUM(payment_conversion) as total_payments,
      SUM(cancellation_count) as total_cancellations,
      SUM(complaint_count) as total_complaints
    FROM analytics
  `).get();
  const summary = {
    total_dramas: dramaCount,
    total_plays: stats.total_plays || 0,
    total_completions: stats.total_completions || 0,
    total_payments: stats.total_payments || 0,
    total_cancellations: stats.total_cancellations || 0,
    total_complaints: stats.total_complaints || 0
  };
  const dramaStats = db.prepare(`
    SELECT d.id, d.title, d.genre, d.shelf_status,
      COALESCE(SUM(a.play_count), 0) as total_plays,
      COALESCE(SUM(a.completion_count), 0) as total_completions,
      COALESCE(SUM(a.payment_conversion), 0) as total_payments,
      COALESCE(CAST(SUM(a.completion_count) AS REAL) / NULLIF(SUM(a.play_count), 0), 0) as completion_rate,
      COALESCE(CAST(SUM(a.payment_conversion) AS REAL) / NULLIF(SUM(a.completion_count), 0), 0) as conversion_rate
    FROM dramas d LEFT JOIN analytics a ON d.id = a.drama_id
    GROUP BY d.id
  `).all();
  res.json({ summary, dramaStats });
});

const PORT = 53416;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Drama platform backend running on http://127.0.0.1:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});
