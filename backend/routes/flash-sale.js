const express = require('express');
const { db } = require('../database');
const { success, error } = require('../utils/response');
const { optionalAuthMiddleware, authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/list', optionalAuthMiddleware, (req, res) => {
  try {
    const now = new Date().toISOString();
    
    const ongoingSales = db.prepare(`
      SELECT fs.*,
        CASE WHEN r.id IS NOT NULL AND r.enabled = 1 THEN 1 ELSE 0 END as has_reminder
      FROM flash_sales fs
      LEFT JOIN reminders r ON r.flash_sale_id = fs.id AND r.user_id = ? AND r.enabled = 1
      WHERE fs.status = 'ongoing' 
        AND datetime(fs.start_time) <= datetime(?)
        AND datetime(fs.end_time) >= datetime(?)
      ORDER BY fs.start_time ASC
    `).all(req.user?.id || null, now, now);

    const upcomingSales = db.prepare(`
      SELECT fs.*,
        CASE WHEN r.id IS NOT NULL AND r.enabled = 1 THEN 1 ELSE 0 END as has_reminder
      FROM flash_sales fs
      LEFT JOIN reminders r ON r.flash_sale_id = fs.id AND r.user_id = ? AND r.enabled = 1
      WHERE (fs.status = 'upcoming' OR datetime(fs.start_time) > datetime(?))
        AND datetime(fs.end_time) >= datetime(?)
      ORDER BY fs.start_time ASC
      LIMIT 20
    `).all(req.user?.id || null, now, now);

    return res.json(success({
      ongoing: ongoingSales,
      upcoming: upcomingSales
    }));
  } catch (err) {
    console.error('获取秒杀列表失败:', err);
    return res.status(500).json(error('获取秒杀列表失败'));
  }
});

router.get('/:id', optionalAuthMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    
    const sale = db.prepare(`
      SELECT fs.*,
        CASE WHEN r.id IS NOT NULL AND r.enabled = 1 THEN 1 ELSE 0 END as has_reminder
      FROM flash_sales fs
      LEFT JOIN reminders r ON r.flash_sale_id = fs.id AND r.user_id = ? AND r.enabled = 1
      WHERE fs.id = ?
    `).get(req.user?.id || null, id);

    if (!sale) {
      return res.status(404).json(error('秒杀商品不存在'));
    }

    return res.json(success(sale));
  } catch (err) {
    console.error('获取秒杀详情失败:', err);
    return res.status(500).json(error('获取秒杀详情失败'));
  }
});

module.exports = router;
