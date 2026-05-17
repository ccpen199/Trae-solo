const express = require('express');
const db = require('../db');
const dayjs = require('dayjs');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/coaches', (req, res) => {
  try {
    const { specialty } = req.query;
    
    let query = 'SELECT * FROM coaches WHERE status = 1';
    const params = [];

    if (specialty) {
      query += ' AND specialty LIKE ?';
      params.push(`%${specialty}%`);
    }

    query += ' ORDER BY rating DESC';
    
    const coaches = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: coaches
    });
  } catch (error) {
    console.error('获取教练列表错误:', error);
    res.json({
      success: false,
      message: '获取教练列表失败'
    });
  }
});

router.get('/coach/:id', (req, res) => {
  try {
    const coachId = req.params.id;
    
    const coach = db.prepare('SELECT * FROM coaches WHERE id = ?').get(coachId);
    
    if (!coach) {
      return res.json({
        success: false,
        message: '教练不存在'
      });
    }

    const schedules = [];
    for (let i = 0; i < 7; i++) {
      const date = dayjs().add(i, 'day').format('YYYY-MM-DD');
      const daySchedules = db.prepare(`
        SELECT * FROM coach_schedules 
        WHERE coach_id = ? AND date = ? AND is_booked = 0 AND status = 1
        ORDER BY start_time ASC
      `).all(coachId, date);
      
      if (daySchedules.length > 0) {
        schedules.push({
          date,
          weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayjs(date).day()],
          times: daySchedules
        });
      }
    }

    res.json({
      success: true,
      data: {
        coach,
        schedules
      }
    });
  } catch (error) {
    console.error('获取教练详情错误:', error);
    res.json({
      success: false,
      message: '获取教练详情失败'
    });
  }
});

router.post('/generate-schedules', (req, res) => {
  try {
    const { coachId } = req.body;
    
    const coach = db.prepare('SELECT * FROM coaches WHERE id = ?').get(coachId);
    if (!coach) {
      return res.json({
        success: false,
        message: '教练不存在'
      });
    }

    const insertSchedule = db.prepare(`
      INSERT OR IGNORE INTO coach_schedules (coach_id, date, start_time, end_time)
      VALUES (?, ?, ?, ?)
    `);

    const timeSlots = [
      { start: '09:00', end: '10:00' },
      { start: '10:30', end: '11:30' },
      { start: '14:00', end: '15:00' },
      { start: '15:30', end: '16:30' },
      { start: '19:00', end: '20:00' },
      { start: '20:30', end: '21:30' }
    ];

    for (let i = 0; i < 14; i++) {
      const date = dayjs().add(i, 'day').format('YYYY-MM-DD');
      timeSlots.forEach(slot => {
        insertSchedule.run(coachId, date, slot.start, slot.end);
      });
    }

    res.json({
      success: true,
      message: '生成教练时间成功'
    });
  } catch (error) {
    console.error('生成教练时间错误:', error);
    res.json({
      success: false,
      message: '生成失败'
    });
  }
});

router.post('/book', authMiddleware, (req, res) => {
  try {
    const { scheduleId, coachId } = req.body;

    if (!scheduleId || !coachId) {
      return res.json({
        success: false,
        message: '参数错误'
      });
    }

    const schedule = db.prepare('SELECT * FROM coach_schedules WHERE id = ? AND coach_id = ?').get(scheduleId, coachId);
    
    if (!schedule) {
      return res.json({
        success: false,
        message: '该时间段不存在'
      });
    }

    if (schedule.is_booked === 1) {
      return res.json({
        success: false,
        message: '该时间段已被预约'
      });
    }

    const insertBooking = db.prepare('INSERT INTO coach_bookings (user_id, coach_id, schedule_id) VALUES (?, ?, ?)');
    const updateSchedule = db.prepare('UPDATE coach_schedules SET is_booked = 1 WHERE id = ?');

    insertBooking.run(req.user.id, coachId, scheduleId);
    updateSchedule.run(scheduleId);

    res.json({
      success: true,
      message: '预约成功'
    });
  } catch (error) {
    console.error('预约私教错误:', error);
    res.json({
      success: false,
      message: '预约失败，请稍后重试'
    });
  }
});

router.get('/my-bookings', authMiddleware, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT cb.*, cs.date, cs.start_time, cs.end_time, c.name as coach_name, c.avatar, c.title
      FROM coach_bookings cb
      JOIN coach_schedules cs ON cb.schedule_id = cs.id
      JOIN coaches c ON cb.coach_id = c.id
      WHERE cb.user_id = ? AND cb.status = 1
      ORDER BY cs.date DESC, cs.start_time DESC
    `).all(req.user.id);

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('获取我的私教预约错误:', error);
    res.json({
      success: false,
      message: '获取预约列表失败'
    });
  }
});

module.exports = router;
