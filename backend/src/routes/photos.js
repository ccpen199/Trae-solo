const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

router.post('/upload', authMiddleware, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '没有上传文件' });
  }

  const { beauty_settings, filter_used, scene_type, is_public } = req.body;
  const fileUrl = `/uploads/${req.file.filename}`;

  try {
    const result = db.prepare(`INSERT INTO photos (user_id, original_url, beauty_settings, filter_used, scene_type, is_public) VALUES (?, ?, ?, ?, ?, ?)`).run(
      req.user.id, fileUrl, beauty_settings, filter_used, scene_type, is_public ? 1 : 0
    );

    res.status(201).json({
      message: '照片上传成功',
      photoId: result.lastInsertRowid,
      url: fileUrl
    });
  } catch (error) {
    res.status(500).json({ message: '保存照片失败', error: error.message });
  }
});

router.put('/:photoId/edit', authMiddleware, (req, res) => {
  const { photoId } = req.params;
  const { edited_url, beauty_settings, filter_used } = req.body;

  try {
    const photo = db.prepare('SELECT id FROM photos WHERE id = ? AND user_id = ?').get(photoId, req.user.id);
    if (!photo) {
      return res.status(404).json({ message: '照片不存在或无权编辑' });
    }

    const updates = [];
    const params = [];

    if (edited_url) {
      updates.push('edited_url = ?');
      params.push(edited_url);
    }
    if (beauty_settings) {
      updates.push('beauty_settings = ?');
      params.push(beauty_settings);
    }
    if (filter_used) {
      updates.push('filter_used = ?');
      params.push(filter_used);
    }

    if (updates.length > 0) {
      params.push(photoId);
      db.prepare(`UPDATE photos SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    res.json({ message: '编辑已保存' });
  } catch (error) {
    res.status(500).json({ message: '保存编辑失败', error: error.message });
  }
});

router.get('/my', authMiddleware, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const photos = db.prepare('SELECT * FROM photos WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(req.user.id, parseInt(limit), offset);
    const count = db.prepare('SELECT COUNT(*) as total FROM photos WHERE user_id = ?').get(req.user.id);
    
    res.json({
      photos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count.total
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取照片失败', error: error.message });
  }
});

router.get('/:photoId', authMiddleware, (req, res) => {
  const { photoId } = req.params;
  
  try {
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(photoId);
    if (!photo) {
      return res.status(404).json({ message: '照片不存在' });
    }
    res.json({ photo });
  } catch (error) {
    res.status(500).json({ message: '获取照片失败', error: error.message });
  }
});

router.delete('/:photoId', authMiddleware, (req, res) => {
  const { photoId } = req.params;
  
  try {
    const photo = db.prepare('SELECT id FROM photos WHERE id = ? AND user_id = ?').get(photoId, req.user.id);
    if (!photo) {
      return res.status(404).json({ message: '照片不存在或无权删除' });
    }
    
    db.prepare('DELETE FROM photos WHERE id = ?').run(photoId);
    res.json({ message: '照片已删除' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

router.post('/edit-session', authMiddleware, (req, res) => {
  const { photo_id, session_data, network_status, ai_enabled } = req.body;

  try {
    const result = db.prepare(`INSERT INTO edit_sessions (user_id, photo_id, session_data, network_status, ai_enabled) VALUES (?, ?, ?, ?, ?)`).run(
      req.user.id, photo_id, session_data, network_status || 'online', ai_enabled ? 1 : 0
    );
    res.status(201).json({ sessionId: result.lastInsertRowid, message: '修图会话已创建' });
  } catch (error) {
    res.status(500).json({ message: '创建修图会话失败', error: error.message });
  }
});

router.put('/edit-session/:sessionId', authMiddleware, (req, res) => {
  const { sessionId } = req.params;
  const { session_data, status, network_status, ai_enabled } = req.body;

  try {
    const session = db.prepare('SELECT id FROM edit_sessions WHERE id = ? AND user_id = ?').get(sessionId, req.user.id);
    if (!session) {
      return res.status(404).json({ message: '修图会话不存在' });
    }

    const updates = [];
    const params = [];

    if (session_data) { updates.push('session_data = ?'); params.push(session_data); }
    if (status) { updates.push('status = ?'); params.push(status); }
    if (network_status) { updates.push('network_status = ?'); params.push(network_status); }
    if (ai_enabled !== undefined) { updates.push('ai_enabled = ?'); params.push(ai_enabled ? 1 : 0); }

    if (updates.length > 0) {
      params.push(sessionId);
      db.prepare(`UPDATE edit_sessions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...params);
    }

    res.json({ message: '修图会话已更新' });
  } catch (error) {
    res.status(500).json({ message: '更新修图会话失败', error: error.message });
  }
});

module.exports = router;