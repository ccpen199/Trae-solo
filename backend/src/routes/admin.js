const express = require('express');
const { get } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await get('SELECT COUNT(*) as count FROM users');
    const doctors = await get('SELECT COUNT(*) as count FROM doctors');
    const hospitals = await get('SELECT COUNT(*) as count FROM hospitals');
    const pets = await get('SELECT COUNT(*) as count FROM pets');
    const consultations = await get('SELECT COUNT(*) as count FROM consultations');
    const posts = await get('SELECT COUNT(*) as count FROM community_posts');

    res.json({
      success: true,
      data: {
        users: users.count,
        doctors: doctors.count,
        hospitals: hospitals.count,
        pets: pets.count,
        consultations: consultations.count,
        posts: posts.count
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ success: false, message: '获取统计数据失败' });
  }
});

module.exports = router;
