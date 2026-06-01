const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const db = new Database(path.join(__dirname, '../database/training.db'));

router.post('/:courseId/checkin', authenticate, (req, res) => {
  const courseId = req.params.courseId;
  const userId = req.user.id;
  const { ip_address, device_info } = req.body;
  
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }

  const liveTime = new Date(course.live_time);
  const now = new Date();
  const diffMinutes = (now - liveTime) / (1000 * 60);
  const is_late = diffMinutes > 15;

  try {
    const existing = db.prepare('SELECT * FROM attendances WHERE course_id = ? AND user_id = ?').get(courseId, userId);
    
    db.prepare(`
      INSERT INTO attendances (course_id, user_id, check_in_time, status, ip_address, device_info, is_late)
      VALUES (?, ?, CURRENT_TIMESTAMP, 'present', ?, ?, ?)
      ON CONFLICT(course_id, user_id) DO UPDATE SET
        check_in_time = CURRENT_TIMESTAMP,
        status = 'present',
        ip_address = ?,
        device_info = ?,
        is_late = ?
    `).run(courseId, userId, ip_address, device_info, is_late ? 1 : 0, ip_address, device_info, is_late ? 1 : 0);

    if (!existing) {
      db.prepare('UPDATE course_enrollments SET progress = MIN(progress + 25, 100) WHERE course_id = ? AND user_id = ?').run(courseId, userId);
    }

    if (is_late && !existing?.is_late) {
      db.prepare(`
        INSERT INTO exceptions (type, course_id, user_id, description, status)
        VALUES ('late', ?, ?, '签到迟到', 'pending')
      `).run(courseId, userId);
    }

    res.json({ message: '签到成功', is_late });
  } catch (error) {
    res.status(500).json({ error: '签到失败' });
  }
});

router.get('/:courseId/attendance', authenticate, (req, res) => {
  const attendance = db.prepare('SELECT * FROM attendances WHERE course_id = ? AND user_id = ?').get(req.params.courseId, req.user.id);
  res.json(attendance || null);
});

router.post('/:courseId/question', authenticate, (req, res) => {
  const { content } = req.body;
  
  db.prepare(`
    INSERT INTO live_interactions (course_id, user_id, type, content)
    VALUES (?, ?, 'question', ?)
  `).run(req.params.courseId, req.user.id, content);
  
  res.json({ message: '提问成功' });
});

router.get('/:courseId/questions', authenticate, (req, res) => {
  const questions = db.prepare(`
    SELECT li.*, u.name as user_name
    FROM live_interactions li
    JOIN users u ON li.user_id = u.id
    WHERE li.course_id = ? AND li.type = 'question'
    ORDER BY li.created_at DESC
  `).all(req.params.courseId);
  res.json(questions);
});

router.post('/:courseId/poll', authenticate, requireRole('admin', 'instructor'), (req, res) => {
  const { question, options } = req.body;
  
  const result = db.prepare(`
    INSERT INTO polls (course_id, question, options, created_by)
    VALUES (?, ?, ?, ?)
  `).run(req.params.courseId, question, JSON.stringify(options), req.user.id);
  
  res.json({ id: result.lastInsertRowid, message: '投票创建成功' });
});

router.get('/:courseId/polls', authenticate, (req, res) => {
  const polls = db.prepare('SELECT * FROM polls WHERE course_id = ? ORDER BY created_at DESC').all(req.params.courseId);
  polls.forEach(poll => {
    poll.options = JSON.parse(poll.options);
    const votes = db.prepare('SELECT option_index, COUNT(*) as count FROM poll_votes WHERE poll_id = ? GROUP BY option_index').all(poll.id);
    poll.votes = votes;
    const userVote = db.prepare('SELECT * FROM poll_votes WHERE poll_id = ? AND user_id = ?').get(poll.id, req.user.id);
    poll.user_vote = userVote?.option_index;
  });
  res.json(polls);
});

router.post('/poll/:pollId/vote', authenticate, (req, res) => {
  const { option_index } = req.body;
  
  try {
    db.prepare(`
      INSERT INTO poll_votes (poll_id, user_id, option_index)
      VALUES (?, ?, ?)
    `).run(req.params.pollId, req.user.id, option_index);
    res.json({ message: '投票成功' });
  } catch (error) {
    res.status(400).json({ error: '已投过票' });
  }
});

router.post('/:courseId/chat', authenticate, (req, res) => {
  const { content } = req.body;
  
  db.prepare(`
    INSERT INTO live_interactions (course_id, user_id, type, content)
    VALUES (?, ?, 'chat', ?)
  `).run(req.params.courseId, req.user.id, content);
  
  res.json({ message: '发送成功' });
});

router.get('/:courseId/chat', authenticate, (req, res) => {
  const chats = db.prepare(`
    SELECT li.*, u.name as user_name
    FROM live_interactions li
    JOIN users u ON li.user_id = u.id
    WHERE li.course_id = ? AND li.type = 'chat'
    ORDER BY li.created_at ASC
    LIMIT 100
  `).all(req.params.courseId);
  res.json(chats);
});

router.post('/:courseId/materials', authenticate, requireRole('admin', 'instructor'), (req, res) => {
  const { materials } = req.body;
  db.prepare('UPDATE courses SET materials = ? WHERE id = ?').run(JSON.stringify(materials), req.params.courseId);
  res.json({ message: '资料更新成功' });
});

router.post('/:courseId/replay', authenticate, requireRole('admin', 'instructor'), (req, res) => {
  const { replay_url } = req.body;
  db.prepare('UPDATE courses SET replay_url = ?, status = ? WHERE id = ?').run(replay_url, 'completed', req.params.courseId);
  res.json({ message: '回放生成成功' });
});

module.exports = router;
