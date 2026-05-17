const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database');
const { authenticate } = require('../middleware');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.id;
    const role = req.user.role;

    let sql = `
      SELECT 
        o.*,
        tr.name as student_name,
        tr.phone as student_phone,
        tr.location,
        tr.time as class_time,
        tr.subject,
        u.name as teacher_name,
        u.phone as teacher_phone
      FROM orders o
      LEFT JOIN tutoring_requests tr ON o.request_id = tr.id
      LEFT JOIN users u ON o.teacher_id = u.id
      WHERE 
    `;

    const params = [];

    if (role === 'student') {
      sql += ' o.student_id = ?';
      params.push(userId);
    } else {
      sql += ' o.teacher_id = ?';
      params.push(userId);
    }

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC';

    const orders = await allQuery(sql, params);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error.message
    });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const order = await getQuery(
      `SELECT 
        o.*,
        tr.name as student_name,
        tr.phone as student_phone,
        tr.grade,
        tr.location,
        tr.time as class_time,
        tr.subject,
        tr.student_count,
        u.name as teacher_name,
        u.phone as teacher_phone
      FROM orders o
      LEFT JOIN tutoring_requests tr ON o.request_id = tr.id
      LEFT JOIN users u ON o.teacher_id = u.id
      WHERE o.id = ?`,
      [id]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (role === 'student' && order.student_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权查看此订单'
      });
    }

    if (role === 'teacher' && order.teacher_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权查看此订单'
      });
    }

    const classRecords = await allQuery(
      'SELECT * FROM class_records WHERE order_id = ? ORDER BY start_time DESC',
      [id]
    );

    const review = await getQuery(
      'SELECT * FROM reviews WHERE order_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...order,
        classRecords,
        review
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error.message
    });
  }
});

router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [id]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (order.student_id !== userId && order.teacher_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权操作此订单'
      });
    }

    if (order.status !== 'ongoing') {
      return res.status(400).json({
        success: false,
        message: '只能取消进行中的订单'
      });
    }

    await runQuery('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', id]);
    await runQuery('UPDATE tutoring_requests SET status = ? WHERE id = ?', ['cancelled', order.request_id]);

    res.json({
      success: true,
      message: '订单已取消'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '取消失败',
      error: error.message
    });
  }
});

router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [id]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (order.teacher_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '只有老师可以完成订单'
      });
    }

    if (order.status !== 'ongoing') {
      return res.status(400).json({
        success: false,
        message: '只能完成进行中的订单'
      });
    }

    await runQuery('UPDATE orders SET status = ? WHERE id = ?', ['completed', id]);
    await runQuery('UPDATE tutoring_requests SET status = ? WHERE id = ?', ['completed', order.request_id]);

    res.json({
      success: true,
      message: '订单已完成'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '操作失败',
      error: error.message
    });
  }
});

router.post('/:id/review', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的评分（1-5星）'
      });
    }

    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [id]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (order.student_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '只有学生可以评价'
      });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: '只能评价已完成的订单'
      });
    }

    const existingReview = await getQuery('SELECT * FROM reviews WHERE order_id = ?', [id]);

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: '该订单已评价'
      });
    }

    await runQuery(
      'INSERT INTO reviews (order_id, student_id, teacher_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [id, userId, order.teacher_id, rating, comment || '']
    );

    res.json({
      success: true,
      message: '评价成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '评价失败',
      error: error.message
    });
  }
});

router.post('/:id/class-record', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { start_time, end_time, notes } = req.body;

    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [id]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (order.teacher_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '只有老师可以添加上课记录'
      });
    }

    const duration = start_time && end_time 
      ? Math.round((new Date(end_time) - new Date(start_time)) / 60000)
      : null;

    await runQuery(
      'INSERT INTO class_records (order_id, start_time, end_time, duration, notes) VALUES (?, ?, ?, ?, ?)',
      [id, start_time || null, end_time || null, duration, notes || '']
    );

    res.json({
      success: true,
      message: '上课记录已添加'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加失败',
      error: error.message
    });
  }
});

module.exports = router;
