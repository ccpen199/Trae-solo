const express = require('express');
const { getDb } = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { success, error, pagination } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', status } = req.query;
    const db = getDb();

    let whereConditions = [];
    let params = [];

    if (keyword) {
      whereConditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (status !== undefined && status !== '') {
      whereConditions.push('status = ?');
      params.push(parseInt(status, 10));
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await db.prepare(`SELECT COUNT(*) as total FROM product_bars ${whereSql}`).get(...params);
    const total = countResult.total;

    const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const bars = await db.prepare(`
      SELECT pb.*, 
             (SELECT COUNT(*) FROM entries WHERE bar_id = pb.id AND status = 1) as entry_count,
             (SELECT name FROM categories WHERE id = pb.category_id) as category_name
      FROM product_bars pb
      ${whereSql}
      ORDER BY pb.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize, 10), offset);

    res.json(success(pagination(bars || [], total, page, pageSize)));
  } catch (err) {
    logger.error('获取产品吧列表错误:', err);
    res.status(500).json(error('获取失败'));
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const bar = await db.prepare(`
      SELECT pb.*,
             (SELECT name FROM categories WHERE id = pb.category_id) as category_name,
             (SELECT name FROM leaf_nodes WHERE id = pb.leaf_node_id) as leaf_node_name
      FROM product_bars pb WHERE pb.id = ?
    `).get(parseInt(id, 10));

    if (!bar) {
      return res.status(404).json(error('产品吧不存在'));
    }

    await db.prepare('UPDATE product_bars SET view_count = view_count + 1 WHERE id = ?').run(parseInt(id, 10));

    const entries = await db.prepare(`
      SELECT e.*,
             (SELECT COUNT(*) FROM contents WHERE entry_id = e.id AND status = 1) as content_count
      FROM entries e 
      WHERE e.bar_id = ? AND e.status = 1
      ORDER BY e.sort ASC, e.created_at DESC
    `).all(parseInt(id, 10));

    const owners = await db.prepare(`
      SELECT bo.*, u.username, u.nickname, u.avatar
      FROM bar_owners bo
      JOIN users u ON bo.user_id = u.id
      WHERE bo.bar_id = ? AND bo.status = 1
    `).all(parseInt(id, 10));

    res.json(success({ ...bar, entries: entries || [], owners: owners || [] }));
  } catch (err) {
    logger.error('获取产品吧详情错误:', err);
    res.status(500).json(error('获取失败'));
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, cover_image, category_id, leaf_node_id } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json(error('产品吧名称不能为空'));
    }

    const db = getDb();
    const existing = await db.prepare('SELECT id FROM product_bars WHERE name = ?').get(name.trim());
    if (existing) {
      return res.status(400).json(error('产品吧名称已存在'));
    }

    const result = await db.prepare(`
      INSERT INTO product_bars (name, description, cover_image, category_id, leaf_node_id, status, created_by)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(
      name.trim(),
      description || null,
      cover_image || null,
      category_id ? parseInt(category_id, 10) : null,
      leaf_node_id ? parseInt(leaf_node_id, 10) : null,
      req.user.id
    );

    const bar = await db.prepare('SELECT * FROM product_bars WHERE id = ?').get(result.lastInsertRowid);
    logger.info(`创建产品吧成功: ${name}, ID: ${result.lastInsertRowid}`);

    res.json(success(bar, '创建成功'));
  } catch (err) {
    logger.error('创建产品吧错误:', err);
    res.status(500).json(error('创建失败'));
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, cover_image, category_id, leaf_node_id, status } = req.body || {};

    const db = getDb();
    const existing = await db.prepare('SELECT * FROM product_bars WHERE id = ?').get(parseInt(id, 10));
    if (!existing) {
      return res.status(404).json(error('产品吧不存在'));
    }

    if (name && name.trim() && name.trim() !== existing.name) {
      const duplicate = await db.prepare('SELECT id FROM product_bars WHERE name = ? AND id != ?').get(name.trim(), parseInt(id, 10));
      if (duplicate) {
        return res.status(400).json(error('产品吧名称已存在'));
      }
    }

    await db.prepare(`
      UPDATE product_bars 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          cover_image = COALESCE(?, cover_image),
          category_id = COALESCE(?, category_id),
          leaf_node_id = COALESCE(?, leaf_node_id),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      description ?? null,
      cover_image ?? null,
      category_id ? parseInt(category_id, 10) : null,
      leaf_node_id ? parseInt(leaf_node_id, 10) : null,
      status !== undefined ? parseInt(status, 10) : null,
      parseInt(id, 10)
    );

    const bar = await db.prepare('SELECT * FROM product_bars WHERE id = ?').get(parseInt(id, 10));
    logger.info(`更新产品吧成功: ${bar.name}, ID: ${id}`);

    res.json(success(bar, '更新成功'));
  } catch (err) {
    logger.error('更新产品吧错误:', err);
    res.status(500).json(error('更新失败'));
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const existing = await db.prepare('SELECT * FROM product_bars WHERE id = ?').get(parseInt(id, 10));
    if (!existing) {
      return res.status(404).json(error('产品吧不存在'));
    }

    await db.prepare('DELETE FROM product_bars WHERE id = ?').run(parseInt(id, 10));
    logger.info(`删除产品吧: ${existing.name}, ID: ${id}`);

    res.json(success(null, '删除成功'));
  } catch (err) {
    logger.error('删除产品吧错误:', err);
    res.status(500).json(error('删除失败'));
  }
});

module.exports = router;
