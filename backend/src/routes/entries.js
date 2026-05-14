const express = require('express');
const { getDb } = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { success, error, pagination } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, bar_id, keyword = '' } = req.query;
    const db = getDb();

    let whereConditions = ['e.status = 1'];
    let params = [];

    if (bar_id) {
      whereConditions.push('e.bar_id = ?');
      params.push(parseInt(bar_id, 10));
    }

    if (keyword) {
      whereConditions.push('(e.title LIKE ? OR e.content LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereSql = `WHERE ${whereConditions.join(' AND ')}`;

    const countResult = await db.prepare(`SELECT COUNT(*) as total FROM entries e ${whereSql}`).get(...params);
    const total = countResult.total;

    const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const entries = await db.prepare(`
      SELECT e.*, 
             pb.name as bar_name,
             (SELECT COUNT(*) FROM contents WHERE entry_id = e.id AND status = 1) as content_count
      FROM entries e
      LEFT JOIN product_bars pb ON e.bar_id = pb.id
      ${whereSql}
      ORDER BY e.sort ASC, e.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize, 10), offset);

    res.json(success(pagination(entries || [], total, page, pageSize)));
  } catch (err) {
    logger.error('获取词条列表错误:', err);
    res.status(500).json(error('获取失败'));
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const entry = await db.prepare(`
      SELECT e.*, pb.name as bar_name
      FROM entries e
      LEFT JOIN product_bars pb ON e.bar_id = pb.id
      WHERE e.id = ?
    `).get(parseInt(id, 10));

    if (!entry || entry.status !== 1) {
      return res.status(404).json(error('词条不存在'));
    }

    const contents = await db.prepare(`
      SELECT * FROM contents 
      WHERE entry_id = ? AND status = 1
      ORDER BY sort ASC, created_at ASC
    `).all(parseInt(id, 10));

    res.json(success({ ...entry, contents: contents || [] }));
  } catch (err) {
    logger.error('获取词条详情错误:', err);
    res.status(500).json(error('获取失败'));
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { bar_id, title, content, entry_type, sort = 0 } = req.body || {};

    if (!bar_id || !title) {
      return res.status(400).json(error('产品吧ID和标题不能为空'));
    }

    const db = getDb();
    const bar = await db.prepare('SELECT id FROM product_bars WHERE id = ?').get(parseInt(bar_id, 10));
    if (!bar) {
      return res.status(404).json(error('产品吧不存在'));
    }

    const result = await db.prepare(`
      INSERT INTO entries (bar_id, title, content, entry_type, sort, status, created_by)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(
      parseInt(bar_id, 10),
      title.trim(),
      content || null,
      entry_type || 'text',
      parseInt(sort, 10),
      req.user.id
    );

    const entry = await db.prepare('SELECT * FROM entries WHERE id = ?').get(result.lastInsertRowid);
    logger.info(`创建词条成功: ${title}, ID: ${result.lastInsertRowid}`);

    res.json(success(entry, '创建成功'));
  } catch (err) {
    logger.error('创建词条错误:', err);
    res.status(500).json(error('创建失败'));
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, entry_type, sort, status } = req.body || {};

    const db = getDb();
    const existing = await db.prepare('SELECT * FROM entries WHERE id = ?').get(parseInt(id, 10));
    if (!existing) {
      return res.status(404).json(error('词条不存在'));
    }

    await db.prepare(`
      UPDATE entries 
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          entry_type = COALESCE(?, entry_type),
          sort = COALESCE(?, sort),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      content ?? null,
      entry_type ?? null,
      sort !== undefined ? parseInt(sort, 10) : null,
      status !== undefined ? parseInt(status, 10) : null,
      parseInt(id, 10)
    );

    const entry = await db.prepare('SELECT * FROM entries WHERE id = ?').get(parseInt(id, 10));
    logger.info(`更新词条成功: ${entry.title}, ID: ${id}`);

    res.json(success(entry, '更新成功'));
  } catch (err) {
    logger.error('更新词条错误:', err);
    res.status(500).json(error('更新失败'));
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const existing = await db.prepare('SELECT * FROM entries WHERE id = ?').get(parseInt(id, 10));
    if (!existing) {
      return res.status(404).json(error('词条不存在'));
    }

    await db.prepare('DELETE FROM entries WHERE id = ?').run(parseInt(id, 10));
    logger.info(`删除词条: ${existing.title}, ID: ${id}`);

    res.json(success(null, '删除成功'));
  } catch (err) {
    logger.error('删除词条错误:', err);
    res.status(500).json(error('删除失败'));
  }
});

module.exports = router;
