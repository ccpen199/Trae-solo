import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from './database.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.BACKEND_PORT || 56778;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 46778}`,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/categories', async (req, res) => {
  const categories = await db.all('SELECT * FROM poi_categories');
  res.json(categories);
});

app.get('/api/pois', async (req, res) => {
  const { category, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT p.*, c.name as category_name FROM pois p LEFT JOIN poi_categories c ON p.category_id = c.id WHERE p.status = 1';
  const params = [];
  
  if (category) {
    query += ' AND p.category_id = ?';
    params.push(category);
  }
  
  query += ' ORDER BY p.rating DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const pois = await db.all(query, ...params);
  const totalResult = await db.get('SELECT COUNT(*) as count FROM pois WHERE status = 1');
  
  res.json({ list: pois, total: totalResult.count, page: parseInt(page), limit: parseInt(limit) });
});

app.get('/api/pois/:id', async (req, res) => {
  const poi = await db.get(`
    SELECT p.*, c.name as category_name 
    FROM pois p 
    LEFT JOIN poi_categories c ON p.category_id = c.id 
    WHERE p.id = ?
  `, req.params.id);
  
  if (!poi) {
    return res.status(404).json({ error: 'POI not found' });
  }
  
  res.json(poi);
});

app.post('/api/pois', async (req, res) => {
  const { name, category_id, address, latitude, longitude, business_hours, avg_price, facilities, accessibility, contact, tags, description } = req.body;
  
  const result = await db.run(`
    INSERT INTO pois (name, category_id, address, latitude, longitude, business_hours, avg_price, facilities, accessibility, contact, tags, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, name, category_id, address, latitude, longitude, business_hours, avg_price, facilities, accessibility, contact, tags, description);
  
  res.json({ id: result.lastID, ...req.body });
});

app.get('/api/notes', async (req, res) => {
  const { category, page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT n.*, u.nickname, u.avatar, p.name as poi_name, c.id as category_id
    FROM notes n 
    LEFT JOIN users u ON n.user_id = u.id 
    LEFT JOIN pois p ON n.poi_id = p.id
    LEFT JOIN poi_categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params = [];
  
  if (category) {
    query += ' AND c.id = ?';
    params.push(category);
  }
  
  if (status !== undefined) {
    query += ' AND n.status = ?';
    params.push(status);
  } else {
    query += ' AND n.status = 1';
  }
  
  query += ' ORDER BY n.hot_score DESC, n.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const notes = await db.all(query, ...params);
  
  let countQuery = 'SELECT COUNT(*) as count FROM notes n LEFT JOIN pois p ON n.poi_id = p.id WHERE 1=1';
  const countParams = [];
  if (category) {
    countQuery += ' AND p.category_id = ?';
    countParams.push(category);
  }
  if (status !== undefined) {
    countQuery += ' AND n.status = ?';
    countParams.push(status);
  } else {
    countQuery += ' AND n.status = 1';
  }
  const totalResult = await db.get(countQuery, ...countParams);
  
  res.json({ list: notes, total: totalResult.count, page: parseInt(page), limit: parseInt(limit) });
});

app.get('/api/notes/:id', async (req, res) => {
  await db.run('UPDATE notes SET view_count = view_count + 1 WHERE id = ?', req.params.id);
  
  const note = await db.get(`
    SELECT n.*, u.nickname, u.avatar, p.name as poi_name, p.address, p.avg_price
    FROM notes n 
    LEFT JOIN users u ON n.user_id = u.id 
    LEFT JOIN pois p ON n.poi_id = p.id
    WHERE n.id = ?
  `, req.params.id);
  
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  res.json(note);
});

app.post('/api/notes', async (req, res) => {
  const { user_id, poi_id, title, content, images, risk_tips } = req.body;
  
  const result = await db.run(`
    INSERT INTO notes (user_id, poi_id, title, content, images, risk_tips, status)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `, user_id || 1, poi_id, title, content, images, risk_tips);
  
  res.json({ id: result.lastID, ...req.body, status: 0 });
});

app.post('/api/notes/:id/like', async (req, res) => {
  const { user_id } = req.body;
  const noteId = req.params.id;
  
  try {
    await db.run('INSERT OR IGNORE INTO likes (user_id, note_id) VALUES (?, ?)', user_id || 1, noteId);
    await db.run('UPDATE notes SET like_count = like_count + 1, hot_score = hot_score + 1 WHERE id = ?', noteId);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.get('/api/notes/:id/comments', async (req, res) => {
  const comments = await db.all(`
    SELECT c.*, u.nickname, u.avatar
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.note_id = ? AND c.status = 1
    ORDER BY c.created_at DESC
  `, req.params.id);
  
  res.json(comments);
});

app.post('/api/notes/:id/comments', async (req, res) => {
  const { user_id, content } = req.body;
  const noteId = req.params.id;
  
  const result = await db.run(`
    INSERT INTO comments (user_id, note_id, content)
    VALUES (?, ?, ?)
  `, user_id || 1, noteId, content);
  
  await db.run('UPDATE notes SET comment_count = comment_count + 1 WHERE id = ?', noteId);
  
  res.json({ id: result.lastID, success: true });
});

app.get('/api/admin/notes/pending', async (req, res) => {
  const notes = await db.all(`
    SELECT n.*, u.nickname, p.name as poi_name
    FROM notes n
    LEFT JOIN users u ON n.user_id = u.id
    LEFT JOIN pois p ON n.poi_id = p.id
    WHERE n.status = 0
    ORDER BY n.created_at DESC
  `);
  
  res.json(notes);
});

app.get('/api/admin/notes/approved', async (req, res) => {
  const notes = await db.all(`
    SELECT n.*, u.nickname, p.name as poi_name
    FROM notes n
    LEFT JOIN users u ON n.user_id = u.id
    LEFT JOIN pois p ON n.poi_id = p.id
    WHERE n.status = 1
    ORDER BY n.created_at DESC
  `);
  
  res.json(notes);
});

app.get('/api/admin/notes/rejected', async (req, res) => {
  const notes = await db.all(`
    SELECT n.*, u.nickname, p.name as poi_name, a.reason
    FROM notes n
    LEFT JOIN users u ON n.user_id = u.id
    LEFT JOIN pois p ON n.poi_id = p.id
    LEFT JOIN audit_logs a ON n.id = a.note_id
    WHERE n.status = 2
    ORDER BY n.created_at DESC
  `);
  
  res.json(notes);
});

app.post('/api/admin/notes/:id/audit', async (req, res) => {
  const { status, reason } = req.body;
  const noteId = req.params.id;
  
  await db.run('UPDATE notes SET status = ? WHERE id = ?', status, noteId);
  
  await db.run(`
    INSERT INTO audit_logs (note_id, reviewer_id, action, reason)
    VALUES (?, ?, ?, ?)
  `, noteId, 4, status === 1 ? 'approve' : 'reject', reason);
  
  if (status === 1) {
    await db.run('UPDATE notes SET hot_score = view_count * 0.1 + like_count * 0.5 + comment_count * 0.4 WHERE id = ?', noteId);
  }
  
  res.json({ success: true });
});

app.get('/api/reviews', async (req, res) => {
  const { poi_id } = req.query;
  
  let query = `
    SELECT r.*, u.nickname, u.avatar
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.status = 1
  `;
  const params = [];
  
  if (poi_id) {
    query += ' AND r.poi_id = ?';
    params.push(poi_id);
  }
  
  query += ' ORDER BY r.created_at DESC';
  
  const reviews = await db.all(query, ...params);
  res.json(reviews);
});

app.post('/api/reviews', async (req, res) => {
  const { user_id, poi_id, note_id, rating, content } = req.body;
  
  const result = await db.run(`
    INSERT INTO reviews (user_id, poi_id, note_id, rating, content, credibility_score)
    VALUES (?, ?, ?, ?, ?, 0.8)
  `, user_id || 1, poi_id, note_id, rating, content);
  
  const avgRating = await db.get('SELECT AVG(rating) as avg FROM reviews WHERE poi_id = ?', poi_id);
  const count = await db.get('SELECT COUNT(*) as count FROM reviews WHERE poi_id = ?', poi_id);
  await db.run('UPDATE pois SET rating = ?, review_count = ? WHERE id = ?', avgRating.avg, count.count, poi_id);
  
  res.json({ id: result.lastID, success: true });
});

app.post('/api/upload', (req, res) => {
  const { image } = req.body;
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  const filename = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
  const filepath = path.join(uploadDir, filename);
  
  fs.writeFile(filepath, base64Data, 'base64', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Upload failed' });
    }
    res.json({ url: `/uploads/${filename}` });
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
