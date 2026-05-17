const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database');
const { authenticate, requireStudent, requireTeacher } = require('../middleware');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    let requests;
    
    if (req.user.role === 'student') {
      requests = await allQuery(
        'SELECT * FROM tutoring_requests WHERE student_id = ? AND status = ? ORDER BY created_at DESC',
        [req.user.id, status]
      );
    } else {
      requests = await allQuery(
        'SELECT * FROM tutoring_requests WHERE status = ? ORDER BY created_at DESC',
        [status]
      );
    }

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取辅导请求失败',
      error: error.message
    });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const request = await getQuery('SELECT * FROM tutoring_requests WHERE id = ?', [id]);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: '辅导请求不存在'
      });
    }

    const student = await getQuery('SELECT * FROM users WHERE id = ?', [request.student_id]);
    
    res.json({
      success: true,
      data: {
        ...request,
        student: {
          name: student?.name,
          phone: student?.phone
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取请求详情失败',
      error: error.message
    });
  }
});

router.post('/', authenticate, requireStudent, async (req, res) => {
  try {
    const {
      name,
      grade,
      phone,
      location,
      latitude,
      longitude,
      time,
      subject,
      student_count
    } = req.body;

    if (!name || !grade || !phone || !location || !time || !subject) {
      return res.status(400).json({
        success: false,
        message: '请填写完整信息'
      });
    }

    const result = await runQuery(
      `INSERT INTO tutoring_requests 
       (student_id, name, grade, phone, location, latitude, longitude, time, subject, student_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, grade, phone, location, latitude, longitude, time, subject, student_count || 1]
    );

    const existingAddress = await getQuery(
      'SELECT * FROM address_history WHERE user_id = ? AND address = ?',
      [req.user.id, location]
    );

    if (existingAddress) {
      await runQuery(
        'UPDATE address_history SET used_count = used_count + 1, last_used_at = CURRENT_TIMESTAMP WHERE id = ?',
        [existingAddress.id]
      );
    } else {
      await runQuery(
        'INSERT INTO address_history (user_id, address, latitude, longitude) VALUES (?, ?, ?, ?)',
        [req.user.id, location, latitude, longitude]
      );
    }

    res.json({
      success: true,
      data: {
        id: result.lastID
      },
      message: '发布成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '发布失败',
      error: error.message
    });
  }
});

router.post('/:id/accept', authenticate, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const request = await getQuery('SELECT * FROM tutoring_requests WHERE id = ?', [id]);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: '辅导请求不存在'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '该请求已被接受或取消'
      });
    }

    await runQuery('BEGIN TRANSACTION');

    try {
      await runQuery(
        'UPDATE tutoring_requests SET status = ? WHERE id = ?',
        ['accepted', id]
      );

      const orderResult = await runQuery(
        `INSERT INTO orders (request_id, student_id, teacher_id, status)
         VALUES (?, ?, ?, ?)`,
        [id, request.student_id, teacherId, 'ongoing']
      );

      await runQuery('COMMIT');

      res.json({
        success: true,
        data: {
          orderId: orderResult.lastID
        },
        message: '接单成功'
      });
    } catch (txError) {
      await runQuery('ROLLBACK');
      throw txError;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '接单失败',
      error: error.message
    });
  }
});

router.delete('/:id', authenticate, requireStudent, async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await getQuery('SELECT * FROM tutoring_requests WHERE id = ? AND student_id = ?', [id, req.user.id]);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: '辅导请求不存在'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '只能取消待接单的请求'
      });
    }

    await runQuery('UPDATE tutoring_requests SET status = ? WHERE id = ?', ['cancelled', id]);

    res.json({
      success: true,
      message: '取消成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '取消失败',
      error: error.message
    });
  }
});

router.get('/address/history', authenticate, requireStudent, async (req, res) => {
  try {
    const addresses = await allQuery(
      'SELECT * FROM address_history WHERE user_id = ? ORDER BY last_used_at DESC LIMIT 10',
      [req.user.id]
    );

    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取地址历史失败',
      error: error.message
    });
  }
});

module.exports = router;
