const express = require('express');
const router = express.Router();
const { authenticateToken, requireSupport } = require('../middlewares/auth');
const lawyerRanking = require('../engines/LawyerRanking');
const { get, all } = require('../config/database');

router.get('/rankings', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    
    const lawyers = await lawyerRanking.getLawyerRankings(
      category,
      parseInt(limit)
    );

    res.json({
      success: true,
      lawyers: lawyers.map(l => ({
        ...l,
        specializations: JSON.parse(l.specializations || '[]')
      }))
    });
  } catch (error) {
    console.error('获取律师排名错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const lawyer = await get(`
      SELECT l.*, u.username, u.real_name, u.avatar_url, u.phone
      FROM lawyers l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ? AND l.license_verified = 1
    `, [req.params.id]);

    if (!lawyer) {
      return res.status(404).json({ success: false, message: '律师不存在' });
    }

    const reviews = await all(`
      SELECT r.*, u.real_name as client_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.lawyer_id = ?
      ORDER BY r.created_at DESC
      LIMIT 20
    `, [lawyer.id]);

    res.json({
      success: true,
      lawyer: {
        ...lawyer,
        specializations: JSON.parse(lawyer.specializations || '[]')
      },
      recentReviews: reviews
    });
  } catch (error) {
    console.error('获取律师详情错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/specializations/list', (req, res) => {
  const specializations = [
    { id: 'civil', name: '民事纠纷', icon: 'balance' },
    { id: 'contract', name: '合同纠纷', icon: 'file-text' },
    { id: 'labor', name: '劳动争议', icon: 'briefcase' },
    { id: 'criminal', name: '刑事辩护', icon: 'shield' },
    { id: 'corporate', name: '公司事务', icon: 'building' },
    { id: 'intellectual', name: '知识产权', icon: 'lightbulb' },
    { id: 'real_estate', name: '房产纠纷', icon: 'home' },
    { id: 'traffic', name: '交通事故', icon: 'car' },
    { id: 'consumer', name: '消费维权', icon: 'shopping-cart' }
  ];

  res.json({
    success: true,
    specializations
  });
});

module.exports = router;
