const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database/init');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads/announcements');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.use(authenticate);

router.get('/', (req, res) => {
  const user = req.user;
  let announcements = [];

  if (user.role === 'admin') {
    announcements = db.prepare(`
      SELECT a.*, u.name as author_name,
        (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = a.id AND ar.read_at IS NOT NULL) as read_count,
        (SELECT COUNT(*) FROM guardians g JOIN students s ON g.student_id = s.id WHERE s.class_id IN (SELECT id FROM classes)) as total_count
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      WHERE a.is_published = 1
      ORDER BY a.created_at DESC
    `).all();
  } else if (user.role === 'teacher') {
    const teacherClasses = db.prepare('SELECT class_id FROM class_teachers WHERE teacher_id = ?').all(user.id).map(c => c.class_id);
    const placeholders = teacherClasses.map(() => '?').join(',') || 'NULL';
    
    announcements = db.prepare(`
      SELECT a.*, u.name as author_name,
        (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = a.id AND ar.read_at IS NOT NULL) as read_count,
        (SELECT COUNT(DISTINCT g.user_id) FROM guardians g JOIN students s ON g.student_id = s.id WHERE s.class_id IN (${placeholders})) as total_count
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      WHERE a.is_published = 1 AND (
        a.scope_type = 'school' OR
        (a.scope_type = 'class' AND a.scope_id IN (${placeholders}))
      )
      ORDER BY a.created_at DESC
    `).all([...teacherClasses, ...teacherClasses]);
  } else if (user.role === 'guardian') {
    const guardianClasses = db.prepare(`
      SELECT DISTINCT s.class_id FROM guardians g
      JOIN students s ON g.student_id = s.id
      WHERE g.user_id = ?
    `).all(user.id).map(c => c.class_id);
    const placeholders = guardianClasses.map(() => '?').join(',') || 'NULL';

    announcements = db.prepare(`
      SELECT a.*, u.name as author_name,
        ar.read_at, ar.confirmed_at
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = ?
      WHERE a.is_published = 1 AND (
        a.scope_type = 'school' OR
        (a.scope_type = 'class' AND a.scope_id IN (${placeholders}))
      )
      ORDER BY a.created_at DESC
    `).all(user.id, ...guardianClasses);
  }

  res.json(announcements);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const user = req.user;

  let announcement;
  if (user.role === 'admin' || user.role === 'teacher') {
    announcement = db.prepare(`
      SELECT a.*, u.name as author_name
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `).get(id);
  } else {
    announcement = db.prepare(`
      SELECT a.*, u.name as author_name, ar.read_at, ar.confirmed_at
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = ?
      WHERE a.id = ?
    `).get(user.id, id);
  }

  if (!announcement) {
    return res.status(404).json({ error: '公告不存在' });
  }

  announcement.attachments = db.prepare('SELECT * FROM announcement_attachments WHERE announcement_id = ?').all(id);

  if (user.role === 'admin' || user.role === 'teacher') {
    announcement.read_status = db.prepare(`
      SELECT u.id, u.name, u.phone, ar.read_at, ar.confirmed_at
      FROM announcement_reads ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.announcement_id = ?
    `).all(id);
  }

  res.json(announcement);
});

router.post('/', requireRoles('admin', 'teacher'), upload.array('attachments', 10), (req, res) => {
  const { title, content, scope_type, scope_id, priority, need_confirmation, scheduled_at } = req.body;
  const user = req.user;

  if (!title || !content || !scope_type) {
    return res.status(400).json({ error: '标题、内容和发布范围不能为空' });
  }

  const tx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO announcements (title, content, author_id, scope_type, scope_id, priority, need_confirmation, scheduled_at, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(title, content, user.id, scope_type, scope_id || null, priority || 'normal', need_confirmation ? 1 : 0, scheduled_at || null);

    const announcementId = result.lastInsertRowid;

    if (req.files && req.files.length > 0) {
      const insertAttachment = db.prepare(`
        INSERT INTO announcement_attachments (announcement_id, filename, original_name, file_path, file_size, mime_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const file of req.files) {
        insertAttachment.run(announcementId, file.filename, file.originalname, file.path, file.size, file.mimetype);
      }
    }

    return announcementId;
  });

  try {
    const announcementId = tx();
    res.json({ id: announcementId, message: '公告发布成功' });
  } catch (error) {
    res.status(500).json({ error: '发布失败: ' + error.message });
  }
});

router.post('/:id/read', (req, res) => {
  const { id } = req.params;
  const user = req.user;

  db.prepare(`
    INSERT OR REPLACE INTO announcement_reads (announcement_id, user_id, read_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `).run(id, user.id);

  res.json({ message: '已标记为已读' });
});

router.post('/:id/confirm', (req, res) => {
  const { id } = req.params;
  const user = req.user;

  db.prepare(`
    INSERT OR REPLACE INTO announcement_reads (announcement_id, user_id, read_at, confirmed_at)
    VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(id, user.id);

  res.json({ message: '确认回执已提交' });
});

router.get('/:id/attachments/:attachmentId/download', (req, res) => {
  const { id, attachmentId } = req.params;

  const attachment = db.prepare('SELECT * FROM announcement_attachments WHERE id = ? AND announcement_id = ?').get(attachmentId, id);
  if (!attachment) {
    return res.status(404).json({ error: '附件不存在' });
  }

  if (!fs.existsSync(attachment.file_path)) {
    return res.status(404).json({ error: '文件不存在' });
  }

  res.download(attachment.file_path, attachment.original_name);
});

router.delete('/:id', requireRoles('admin', 'teacher'), (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const announcement = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id);
  if (!announcement) {
    return res.status(404).json({ error: '公告不存在' });
  }

  if (user.role !== 'admin' && announcement.author_id !== user.id) {
    return res.status(403).json({ error: '无权限删除此公告' });
  }

  const attachments = db.prepare('SELECT * FROM announcement_attachments WHERE announcement_id = ?').all(id);
  for (const att of attachments) {
    if (fs.existsSync(att.file_path)) {
      fs.unlinkSync(att.file_path);
    }
  }

  db.prepare('DELETE FROM announcement_attachments WHERE announcement_id = ?').run(id);
  db.prepare('DELETE FROM announcement_reads WHERE announcement_id = ?').run(id);
  db.prepare('DELETE FROM announcements WHERE id = ?').run(id);

  res.json({ message: '公告已删除' });
});

module.exports = router;
