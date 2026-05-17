import express from 'express';
import { getDB } from '../db/index.js';

const router = express.Router();
const db = getDB();

router.get('/', (req, res) => {
  try {
    const { category, age_group, is_rehabilitation } = req.query;
    let query = 'SELECT * FROM courses WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (age_group) {
      query += ' AND (age_group = ? OR age_group = "all")';
      params.push(age_group);
    }
    if (is_rehabilitation !== undefined) {
      query += ' AND is_rehabilitation = ?';
      params.push(is_rehabilitation === 'true' ? 1 : 0);
    }

    const courses = db.prepare(query).all(params);
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, message: '获取课程列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    
    if (!course) {
      return res.status(404).json({ success: false, message: '课程不存在' });
    }
    
    res.json({ success: true, data: course });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ success: false, message: '获取课程详情失败' });
  }
});

router.post('/session/start', (req, res) => {
  try {
    const { user_id, course_id, device_connected = false } = req.body;
    
    if (!user_id || !course_id) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    const stmt = db.prepare(`
      INSERT INTO course_sessions (user_id, course_id, start_time, device_connected, status)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?, 'ongoing')
    `);
    const result = stmt.run(user_id, course_id, device_connected ? 1 : 0);
    
    res.json({ 
      success: true, 
      data: { 
        session_id: result.lastInsertRowid,
        device_connected
      } 
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ success: false, message: '开始课程失败' });
  }
});

router.post('/session/update', (req, res) => {
  try {
    const { session_id, duration, heart_rate, calories, device_connected } = req.body;
    
    if (!session_id) {
      return res.status(400).json({ success: false, message: '缺少会话ID' });
    }

    const session = db.prepare('SELECT * FROM course_sessions WHERE id = ?').get(session_id);
    if (!session) {
      return res.status(404).json({ success: false, message: '会话不存在' });
    }

    let updateFields = [];
    let params = [];

    if (duration !== undefined) {
      updateFields.push('total_duration = ?');
      params.push(duration);
    }
    if (heart_rate !== undefined && session.device_connected) {
      updateFields.push('avg_heart_rate = COALESCE(avg_heart_rate, ?), max_heart_rate = MAX(COALESCE(max_heart_rate, 0), ?)');
      params.push(heart_rate, heart_rate);
    }
    if (calories !== undefined && session.device_connected) {
      updateFields.push('total_calories = ?');
      params.push(calories);
    }
    if (device_connected !== undefined) {
      updateFields.push('device_connected = ?');
      params.push(device_connected ? 1 : 0);
    }

    if (updateFields.length > 0) {
      const query = `UPDATE course_sessions SET ${updateFields.join(', ')} WHERE id = ?`;
      params.push(session_id);
      db.prepare(query).run(params);
    }

    const updatedSession = db.prepare('SELECT * FROM course_sessions WHERE id = ?').get(session_id);
    res.json({ success: true, data: updatedSession });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ success: false, message: '更新会话数据失败' });
  }
});

router.post('/session/end', (req, res) => {
  try {
    const { session_id } = req.body;
    
    if (!session_id) {
      return res.status(400).json({ success: false, message: '缺少会话ID' });
    }

    db.prepare(`
      UPDATE course_sessions 
      SET end_time = CURRENT_TIMESTAMP, status = 'completed'
      WHERE id = ?
    `).run(session_id);

    const session = db.prepare('SELECT * FROM course_sessions WHERE id = ?').get(session_id);
    
    db.prepare(`
      UPDATE users 
      SET total_duration = total_duration + ?, total_calories = total_calories + ?
      WHERE id = ?
    `).run(session.total_duration || 0, session.total_calories || 0, session.user_id);

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ success: false, message: '结束课程失败' });
  }
});

router.get('/session/:id', (req, res) => {
  try {
    const { id } = req.params;
    const session = db.prepare('SELECT * FROM course_sessions WHERE id = ?').get(id);
    
    if (!session) {
      return res.status(404).json({ success: false, message: '会话不存在' });
    }
    
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ success: false, message: '获取会话数据失败' });
  }
});

export default router;
