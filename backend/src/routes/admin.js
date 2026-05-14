const express = require('express');
const { getDb } = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getDb();

    const barCount = await db.prepare('SELECT COUNT(*) as count FROM product_bars').get();
    const entryCount = await db.prepare('SELECT COUNT(*) as count FROM entries').get();
    const userCount = await db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get();
    const ownerCount = await db.prepare('SELECT COUNT(*) as count FROM bar_owners WHERE status = 1').get();

    const recentBars = await db.prepare(`
      SELECT id, name, created_at FROM product_bars
      ORDER BY created_at DESC LIMIT 5
    `).all();

    res.json(success({
      bars: barCount?.count || 0,
      entries: entryCount?.count || 0,
      users: userCount?.count || 0,
      owners: ownerCount?.count || 0,
      recentBars: recentBars || []
    }));
  } catch (err) {
    logger.error('获取统计数据错误:', err);
    res.status(500).json(error('获取失败'));
  }
});

router.get('/logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const db = getDb();

    const countResult = await db.prepare('SELECT COUNT(*) as total FROM operation_logs').get();
    const total = countResult.total;

    const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const logs = await db.prepare(`
      SELECT ol.*, u.username
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      ORDER BY ol.created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(pageSize, 10), offset);

    res.json(success({
      list: logs || [],
      total,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10)
    }));
  } catch (err) {
    logger.error('获取操作日志错误:', err);
    res.status(500).json(error('获取失败'));
  }
});

router.get('/health', (req, res) => {
  res.json(success({ status: 'ok', timestamp: Date.now() }, '服务正常'));
});

module.exports = router;
