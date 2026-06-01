const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

module.exports = (db) => {
  const router = express.Router();
  const { authenticateToken } = require('../middleware/auth')(db);

  const uploadDir = path.join(__dirname, '../uploads/avatars');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`)
  });
  const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

  router.get('/profile', authenticateToken, (req, res) => {
    res.json({ user: req.user });
  });

  router.put('/profile', authenticateToken, (req, res) => {
    const { nickname, email, phone, avatar } = req.body;

    const result = db.prepare(`
      UPDATE users 
      SET nickname = COALESCE(?, nickname),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          avatar = COALESCE(?, avatar),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nickname, email, phone, avatar, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = db.prepare('SELECT id, username, email, phone, nickname, avatar, member_level FROM users WHERE id = ?')
      .get(req.user.id);

    res.json({ success: true, user });
  });

  router.post('/avatar', authenticateToken, upload.single('avatar'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    db.prepare('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(avatarUrl, req.user.id);

    res.json({ success: true, avatar: avatarUrl });
  });

  router.get('/meetings', authenticateToken, (req, res) => {
    const { status = 'all' } = req.query;

    let query = `
      SELECT m.*, 
             COUNT(DISTINCT mp.id) as participant_count,
             u.nickname as host_name,
             u.avatar as host_avatar
      FROM meetings m
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id AND mp.leave_time IS NULL
      LEFT JOIN users u ON m.host_id = u.id
      WHERE m.host_id = ?
    `;
    const params = [req.user.id];

    if (status !== 'all') {
      query += ' AND m.status = ?';
      params.push(status);
    }

    query += ' GROUP BY m.id ORDER BY m.start_time DESC';

    const meetings = db.prepare(query).all(...params);
    res.json({ meetings });
  });

  return router;
};
