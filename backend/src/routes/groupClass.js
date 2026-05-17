const express = require('express');
const db = require('../db');
const dayjs = require('dayjs');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/classes', (req, res) => {
  try {
    const { storeId, date } = req.query;
    
    let query = `
      SELECT gcs.*, gc.name as class_name, gc.cover_image, gc.duration, gc.difficulty, 
             s.name as store_name, s.address as store_address
      FROM group_class_schedules gcs
      JOIN group_classes gc ON gcs.class_id = gc.id
      JOIN stores s ON gcs.store_id = s.id
      WHERE gc.status = 1 AND gcs.status = 1
    `;
    const params = [];

    if (storeId) {
      query += ' AND gcs.store_id = ?';
      params.push(storeId);
    }

    if (date) {
      query += ' AND DATE(gcs.start_time) = ?';
      params.push(date);
    }

    query += ' ORDER BY gcs.start_time ASC';
    
    const schedules = db.prepare(query).all(...params);

    const classes = db.prepare('SELECT * FROM group_classes WHERE status = 1').all();

    res.json({
      success: true,
      data: {
        schedules,
        classes
      }
    });
  } catch (error) {
    console.error('获取团课列表错误:', error);
    res.json({
      success: false,
      message: '获取团课列表失败'
    });
  }
});

router.get('/class/:id', (req, res) => {
  try {
    const classId = req.params.id;
    
    const classInfo = db.prepare('SELECT * FROM group_classes WHERE id = ?').get(classId);
    
    if (!classInfo) {
      return res.json({
        success: false,
        message: '课程不存在'
      });
    }

    const schedules = db.prepare(`
      SELECT gcs.*, s.name as store_name, s.address as store_address
      FROM group_class_schedules gcs
      JOIN stores s ON gcs.store_id = s.id
      WHERE gcs.class_id = ? AND gcs.status = 1 AND gcs.start_time > CURRENT_TIMESTAMP
      ORDER BY gcs.start_time ASC
      LIMIT 10
    `).all(classId);

    res.json({
      success: true,
      data: {
        class: classInfo,
        schedules
      }
    });
  } catch (error) {
    console.error('获取课程详情错误:', error);
    res.json({
      success: false,
      message: '获取课程详情失败'
    });
  }
});

router.post('/book', authMiddleware, (req, res) => {
  try {
    const { scheduleId } = req.body;

    if (!scheduleId) {
      return res.json({
        success: false,
        message: '请选择课程场次'
      });
    }

    const schedule = db.prepare('SELECT * FROM group_class_schedules WHERE id = ?').get(scheduleId);
    
    if (!schedule) {
      return res.json({
        success: false,
        message: '场次不存在'
      });
    }

    if (schedule.booked_count >= schedule.capacity) {
      return res.json({
        success: false,
        message: '该场次已满员'
      });
    }

    const existingBooking = db.prepare('SELECT id FROM group_bookings WHERE user_id = ? AND schedule_id = ?').get(req.user.id, scheduleId);
    
    if (existingBooking) {
      return res.json({
        success: false,
        message: '您已预约该场次'
      });
    }

    const insertBooking = db.prepare('INSERT INTO group_bookings (user_id, schedule_id) VALUES (?, ?)');
    const updateSchedule = db.prepare('UPDATE group_class_schedules SET booked_count = booked_count + 1 WHERE id = ?');

    insertBooking.run(req.user.id, scheduleId);
    updateSchedule.run(scheduleId);

    res.json({
      success: true,
      message: '预约成功'
    });
  } catch (error) {
    console.error('预约团课错误:', error);
    res.json({
      success: false,
      message: '预约失败，请稍后重试'
    });
  }
});

router.get('/my-bookings', authMiddleware, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT gb.*, gcs.start_time, gcs.end_time, gcs.coach_name, gc.name as class_name, gc.cover_image, s.name as store_name
      FROM group_bookings gb
      JOIN group_class_schedules gcs ON gb.schedule_id = gcs.id
      JOIN group_classes gc ON gcs.class_id = gc.id
      JOIN stores s ON gcs.store_id = s.id
      WHERE gb.user_id = ? AND gb.status = 1
      ORDER BY gcs.start_time DESC
    `).all(req.user.id);

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('获取我的预约错误:', error);
    res.json({
      success: false,
      message: '获取预约列表失败'
    });
  }
});

router.post('/cancel-booking', authMiddleware, (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = db.prepare('SELECT * FROM group_bookings WHERE id = ? AND user_id = ?').get(bookingId, req.user.id);
    
    if (!booking) {
      return res.json({
        success: false,
        message: '预约记录不存在'
      });
    }

    db.prepare('UPDATE group_bookings SET status = 0 WHERE id = ?').run(bookingId);
    db.prepare('UPDATE group_class_schedules SET booked_count = booked_count - 1 WHERE id = ?').run(booking.schedule_id);

    res.json({
      success: true,
      message: '取消预约成功'
    });
  } catch (error) {
    console.error('取消预约错误:', error);
    res.json({
      success: false,
      message: '取消失败，请稍后重试'
    });
  }
});

module.exports = router;
