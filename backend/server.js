require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 47731;

app.use(cors({
  origin: ['http://localhost:47732', 'http://127.0.0.1:47732'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: '登录已过期' });
    }
    req.user = user;
    next();
  });
}

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ success: false, message: '请输入用户名和密码' });
    }
    
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || user.password !== md5(password)) {
      return res.json({ success: false, message: '用户名或密码错误' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const { password: _, ...userInfo } = user;
    res.json({ success: true, data: { token, user: userInfo } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, nickname } = req.body;
    if (!username || !password || !nickname) {
      return res.json({ success: false, message: '请填写完整信息' });
    }
    
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
    
    try {
      const stmt = db.prepare('INSERT INTO users (username, password, nickname, avatar) VALUES (?, ?, ?, ?)');
      const result = stmt.run(username, md5(password), nickname, avatar);
      
      const token = jwt.sign(
        { id: result.lastInsertRowid, username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({ success: true, data: { token, user: { id: result.lastInsertRowid, username, nickname, avatar } } });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.json({ success: false, message: '用户名已存在' });
      }
      throw err;
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.get('/api/user/profile', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, username, nickname, avatar, bio, followers, following, balance, is_anchor, is_verified FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, data: user });
});

app.get('/api/user/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = db.prepare('SELECT id, username, nickname, avatar, bio, followers, following, is_anchor, is_verified FROM users WHERE id = ?').get(userId);
  if (!user) return res.json({ success: false, message: '用户不存在' });
  res.json({ success: true, data: user });
});

app.post('/api/user/follow/:id', authenticateToken, (req, res) => {
  const followingId = parseInt(req.params.id);
  const followerId = req.user.id;
  
  if (followingId === followerId) {
    return res.json({ success: false, message: '不能关注自己' });
  }
  
  const follow = db.prepare('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?').get(followerId, followingId);
  
  if (follow) {
    db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(followerId, followingId);
    db.prepare('UPDATE users SET following = following - 1 WHERE id = ?').run(followerId);
    db.prepare('UPDATE users SET followers = followers - 1 WHERE id = ?').run(followingId);
    res.json({ success: true, data: { isFollowing: false } });
  } else {
    db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(followerId, followingId);
    db.prepare('UPDATE users SET following = following + 1 WHERE id = ?').run(followerId);
    db.prepare('UPDATE users SET followers = followers + 1 WHERE id = ?').run(followingId);
    res.json({ success: true, data: { isFollowing: true } });
  }
});

app.get('/api/user/follow-status/:id', authenticateToken, (req, res) => {
  const followingId = parseInt(req.params.id);
  const followerId = req.user.id;
  
  const follow = db.prepare('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?').get(followerId, followingId);
  res.json({ success: true, data: { isFollowing: !!follow } });
});

app.get('/api/live/rooms', (req, res) => {
  const { page = 1, limit = 15, category } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT lr.*, u.nickname, u.avatar, u.is_verified 
    FROM live_rooms lr 
    LEFT JOIN users u ON lr.anchor_id = u.id 
    WHERE lr.status = 1
  `;
  let params = [];
  
  if (category) {
    query += ' AND lr.category = ?';
    params.push(category);
  }
  
  query += ' ORDER BY lr.viewers DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  const rooms = db.prepare(query).all(...params);
  res.json({ success: true, data: rooms });
});

app.get('/api/live/room/:id', (req, res) => {
  const room = db.prepare(`
    SELECT lr.*, u.nickname, u.avatar, u.is_verified, u.followers 
    FROM live_rooms lr 
    LEFT JOIN users u ON lr.anchor_id = u.id 
    WHERE lr.id = ?
  `).get(parseInt(req.params.id));
  res.json({ success: true, data: room });
});

app.get('/api/live/comments/:roomId', (req, res) => {
  const comments = db.prepare(`
    SELECT lc.*, u.nickname, u.avatar 
    FROM live_comments lc 
    LEFT JOIN users u ON lc.user_id = u.id 
    WHERE lc.live_room_id = ? 
    ORDER BY lc.created_at DESC LIMIT 50
  `).all(parseInt(req.params.roomId));
  res.json({ success: true, data: comments.reverse() });
});

app.post('/api/live/comment/:roomId', authenticateToken, (req, res) => {
  const { content } = req.body;
  if (!content) return res.json({ success: false, message: '请输入评论内容' });
  
  const stmt = db.prepare('INSERT INTO live_comments (live_room_id, user_id, content) VALUES (?, ?, ?)');
  const result = stmt.run(parseInt(req.params.roomId), req.user.id, content);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

app.get('/api/gifts', (req, res) => {
  const gifts = db.prepare('SELECT * FROM gifts ORDER BY price').all();
  res.json({ success: true, data: gifts });
});

app.post('/api/gift/send', authenticateToken, (req, res) => {
  const { receiverId, giftId, count = 1, liveRoomId } = req.body;
  
  const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(giftId);
  if (!gift) return res.json({ success: false, message: '礼物不存在' });
  
  const totalPrice = gift.price * count;
  const sender = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  
  if (sender.balance < totalPrice) {
    return res.json({ success: false, message: '余额不足' });
  }
  
  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(totalPrice, req.user.id);
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(totalPrice, receiverId);
  db.prepare('INSERT INTO gift_records (sender_id, receiver_id, gift_id, count, total_price, live_room_id) VALUES (?, ?, ?, ?, ?, ?)').run(req.user.id, receiverId, giftId, count, totalPrice, liveRoomId || null);
  
  res.json({ success: true, data: { totalPrice } });
});

app.get('/api/posts', (req, res) => {
  const { page = 1, limit = 15 } = req.query;
  const offset = (page - 1) * limit;
  
  const posts = db.prepare(`
    SELECT p.*, u.nickname, u.avatar 
    FROM posts p 
    LEFT JOIN users u ON p.user_id = u.id 
    ORDER BY p.created_at DESC LIMIT ? OFFSET ?
  `).all(parseInt(limit), offset);
  res.json({ success: true, data: posts });
});

app.post('/api/posts', authenticateToken, (req, res) => {
  const { content, images, type = 1 } = req.body;
  if (!content) return res.json({ success: false, message: '请输入内容' });
  
  const stmt = db.prepare('INSERT INTO posts (user_id, content, images, type) VALUES (?, ?, ?, ?)');
  const result = stmt.run(req.user.id, content, images || '', type);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

app.get('/api/rank/anchor', (req, res) => {
  const users = db.prepare(`
    SELECT id, nickname, avatar, followers, is_verified 
    FROM users 
    WHERE is_anchor = 1 
    ORDER BY followers DESC LIMIT 100
  `).all();
  res.json({ success: true, data: users });
});

app.get('/api/rank/rich', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.nickname, u.avatar, u.is_verified, 
           COALESCE(SUM(gr.total_price), 0) as total_spent
    FROM users u
    LEFT JOIN gift_records gr ON u.id = gr.sender_id
    GROUP BY u.id
    ORDER BY total_spent DESC LIMIT 100
  `).all();
  res.json({ success: true, data: users });
});

app.get('/api/search', (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.json({ success: true, data: [] });
  
  const exactResults = db.prepare(`
    SELECT id, nickname, avatar, followers, is_verified
    FROM users 
    WHERE nickname = ?
    ORDER BY followers DESC
  `).all(keyword);
  
  const fuzzyResults = db.prepare(`
    SELECT id, nickname, avatar, followers, is_verified
    FROM users 
    WHERE nickname LIKE ? AND nickname != ?
    ORDER BY followers DESC LIMIT 50
  `).all(`%${keyword}%`, keyword);
  
  const allResults = [...exactResults, ...fuzzyResults];
  res.json({ success: true, data: allResults });
});

app.put('/api/user/profile', authenticateToken, (req, res) => {
  const { nickname, bio, avatar } = req.body;
  const updates = [];
  const params = [];
  
  if (nickname) {
    updates.push('nickname = ?');
    params.push(nickname);
  }
  if (bio !== undefined) {
    updates.push('bio = ?');
    params.push(bio);
  }
  if (avatar) {
    updates.push('avatar = ?');
    params.push(avatar);
  }
  
  if (updates.length === 0) {
    return res.json({ success: false, message: '没有更新内容' });
  }
  
  params.push(req.user.id);
  
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json({ success: true, message: '更新成功' });
});

app.get('/api/categories', (req, res) => {
  const categories = db.prepare("SELECT DISTINCT category FROM live_rooms WHERE category != ''").all();
  res.json({ success: true, data: categories.map(c => c.category) });
});

app.listen(PORT, () => {
  console.log(`🚀 千鹤直播后端服务已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`💾 数据库: ${process.env.DB_PATH}`);
});
