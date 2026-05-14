const express = require('express');
const { getDb } = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { success, error, pagination } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, bar_id } = req.query;
    const db = getDb();

    let whereConditions = [];
    let params = [];

    if (bar_id) {
      whereConditions.push('bo.bar_id = ?');
      params.push(parseInt(bar_id, 10));
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await db.prepare(`SELECT COUNT(*) as total FROM bar_owners bo ${whereSql}`).get(...params);
    const total = countResult.total;

    const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const owners = await db.prepare(`
      SELECT bo.*, u.username, u.nickname, u.avatar, pb.name as bar_name
      FROM bar_owners bo
      JOIN users u ON bo.user_id = u.id
      JOIN product_bars pb ON bo.bar_id = pb.id
      ${whereSql}
      ORDER BY bo.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize, 10), offset);

    res.json(success(pagination(owners || [], total, page, pageSize)));
  } catch (err) {
    logger.error('获取吧主列表错误:', err);
    res.status(500).json(error('获取失败'));
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { bar_id, user_id, role = 'owner' } = req.body || {};

    if (!bar_id || !user_id) {
      return res.status(400).json(error('产品吧ID和用户ID不能为空'));
    }

    const db = getDb();
    const bar = await db.prepare('SELECT id FROM product_bars WHERE id = ?').get(parseInt(bar_id, 10));
    if (!bar) {
      return res.status(404).json(error('产品吧不存在'));
    }

    const user = await db.prepare('SELECT id, username FROM users WHERE id = ?').get(parseInt(user_id, 10));
    if (!user) {
      return res.status(404).json(error('用户不存在'));
    }

    const existing = await db.prepare('SELECT id FROM bar_owners WHERE bar_id = ? AND user_id = ?').get(parseInt(bar_id, 10), parseInt(user_id, 10));
    if (existing) {
      return res.status(400).json(error('该用户已是此产品吧吧主'));
    }

    const result = await db.prepare(`
      INSERT INTO bar_owners (bar_id, user_id, role, status, approved_by, approved_at)
      VALUES (?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
    `).run(
      parseInt(bar_id, 10),
      parseInt(user_id, 10),
      role,
      req.user.id
    );

    logger.info(`添加吧主成功: 用户 ${user.username} -> 吧 ID ${bar_id}`);
    res.json(success({ id: result.lastInsertRowid }, '添加成功'));
  } catch (err) {
    logger.error('添加吧主错误:', err);
    res.status(500).json(error('添加失败'));
  }
});

router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (status === undefined) {
      return res.status(400).json(error('状态不能为空'));
    }

    const db = getDb();
    const existing = await db.prepare('SELECT * FROM bar_owners WHERE id = ?').get(parseInt(id, 10));
    if (!existing) {
      return res.status(404).json(error('吧主记录不存在'));
    }

    await db.prepare(`
      UPDATE bar_owners SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(parseInt(status, 10), req.user.id, parseInt(id, 10));

    logger.info(`更新吧主状态: ID ${id} -> ${status}`);
    res.json(success(null, '更新成功'));
  } catch (err) {
    logger.error('更新吧主状态错误:', err);
    res.status(500).json(error('更新失败'));
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const existing = await db.prepare('SELECT * FROM bar_owners WHERE id = ?').get(parseInt(id, 10));
    if (!existing) {
      return res.status(404).json(error('吧主记录不存在'));
    }

    await db.prepare('DELETE FROM bar_owners WHERE id = ?').run(parseInt(id, 10));
    logger.info(`删除吧主记录: ID ${id}`);

    res.json(success(null, '删除成功'));
  } catch (err) {
    logger.error('删除吧主错误:', err);
    res.status(500).json(error('删除失败'));
  }
});

module.exports = router;
