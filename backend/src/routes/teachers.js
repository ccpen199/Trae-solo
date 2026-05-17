const express = require('express');
const { allQuery } = require('../database');
const { authenticate } = require('../middleware');

const router = express.Router();

router.get('/online', authenticate, async (req, res) => {
  try {
    const teachers = await allQuery(`
      SELECT 
        u.id,
        u.name,
        u.phone,
        u.is_online,
        tp.subjects,
        tp.experience,
        tp.introduction,
        tp.hourly_rate,
        (SELECT COUNT(*) FROM orders o WHERE o.teacher_id = u.id AND o.status = 'completed') as completed_orders,
        NULL as avg_rating
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE u.role = 'teacher' AND u.is_online = 1
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      data: teachers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取在线老师失败',
      error: error.message
    });
  }
});

module.exports = router;
