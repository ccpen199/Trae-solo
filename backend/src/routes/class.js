const express = require('express');
const db = require('../models/database');
const router = express.Router();

router.post('/create', (req, res) => {
  try {
    const { name, subject } = req.body;
    const teacherId = req.user.id;

    if (!name) {
      return res.json({ success: false, message: '班级名称必填' });
    }

    const stmt = db.prepare('INSERT INTO classes (teacher_id, name, subject) VALUES (?, ?, ?)');
    const result = stmt.run(teacherId, name, subject);
    const classId = result.lastInsertRowid;

    res.json({ success: true, message: '创建成功', data: { id: classId } });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

router.get('/list', (req, res) => {
  try {
    const teacherId = req.user.id;

    const classes = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM class_members WHERE class_id = c.id) as member_count
      FROM classes c
      WHERE c.teacher_id = ?
      ORDER BY c.created_at DESC
    `).all(teacherId);

    res.json({ success: true, data: classes });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '获取班级列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const classId = req.params.id;

    const classInfo = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM class_members WHERE class_id = c.id) as member_count
      FROM classes c
      WHERE c.id = ? AND c.teacher_id = ?
    `).get(classId, req.user.id);

    if (!classInfo) {
      return res.json({ success: false, message: '班级不存在' });
    }
    res.json({ success: true, data: classInfo });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id/members', (req, res) => {
  try {
    const classId = req.params.id;

    const members = db.prepare('SELECT * FROM class_members WHERE class_id = ? ORDER BY created_at DESC').all(classId);
    res.json({ success: true, data: members });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '获取成员列表失败' });
  }
});

router.post('/:id/members', (req, res) => {
  try {
    const classId = req.params.id;
    const { name, phone, role } = req.body;

    if (!name) {
      return res.json({ success: false, message: '姓名必填' });
    }

    const stmt = db.prepare('INSERT INTO class_members (class_id, name, phone, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(classId, name, phone, role || 'student');

    res.json({ success: true, message: '添加成功', data: { id: result.lastInsertRowid } });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/members/:memberId/score', (req, res) => {
  try {
    const { classId, memberId } = req.params;
    const { score } = req.body;

    db.prepare('UPDATE class_members SET score = ? WHERE id = ? AND class_id = ?').run(score, memberId, classId);
    res.json({ success: true, message: '评分成功' });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/members/:memberId/reset-score', (req, res) => {
  try {
    const { classId, memberId } = req.params;

    db.prepare('UPDATE class_members SET score = 0 WHERE id = ? AND class_id = ?').run(memberId, classId);
    res.json({ success: true, message: '重置成功' });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id/notices', (req, res) => {
  try {
    const classId = req.params.id;

    const notices = db.prepare('SELECT * FROM class_notices WHERE class_id = ? ORDER BY created_at DESC').all(classId);
    res.json({ success: true, data: notices });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '获取通知失败' });
  }
});

router.post('/:id/notices', (req, res) => {
  try {
    const classId = req.params.id;
    const { content } = req.body;

    if (!content) {
      return res.json({ success: false, message: '通知内容必填' });
    }

    const stmt = db.prepare('INSERT INTO class_notices (class_id, content) VALUES (?, ?)');
    const result = stmt.run(classId, content);

    res.json({ success: true, message: '发布成功', data: { id: result.lastInsertRowid } });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id/messages', (req, res) => {
  try {
    const classId = req.params.id;

    const messages = db.prepare('SELECT * FROM class_messages WHERE class_id = ? ORDER BY created_at DESC LIMIT 50').all(classId);
    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '获取消息失败' });
  }
});

router.post('/:id/messages', (req, res) => {
  try {
    const classId = req.params.id;
    const { content } = req.body;

    if (!content) {
      return res.json({ success: false, message: '消息内容必填' });
    }

    const stmt = db.prepare('INSERT INTO class_messages (class_id, sender_id, sender_name, content) VALUES (?, ?, ?, ?)');
    const result = stmt.run(classId, req.user.id, req.user.phone, content);

    res.json({ success: true, message: '发送成功', data: { id: result.lastInsertRowid } });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;