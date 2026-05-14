const express = require('express');
const { getDb } = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/entry/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;
    const db = getDb();

    const contents = await db.prepare(`
      SELECT * FROM contents 
      WHERE entry_id = ? AND status = 1
      ORDER BY sort ASC, created_at ASC
    `).all(parseInt(entryId, 10));

    res.json(success(contents || []));
  } catch (err) {
    logger.error('获取内容列表错误:', err);
    res.status(500).json(error('获取失败'));
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { entry_id, content_type, content_data, sort = 0 } = req.body || {};

    if (!entry_id || !content_type || !content_data) {
      return res.status(400).json(error('词条ID、内容类型和内容数据不能为空'));
    }

    const validTypes = ['text', 'image', 'link'];
    if (!validTypes.includes(content_type)) {
      return res.status(400).json(error('无效的内容类型'));
    }

    const db = getDb();
    const entry = await db.prepare('SELECT id FROM entries WHERE id = ?').get(parseInt(entry_id, 10));
    if (!entry) {
      return res.status(404).json(error('词条不存在'));
    }

    const result = await db.prepare(`
      INSERT INTO contents (entry_id, content_type, content_data, sort, status, created_by)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(
      parseInt(entry_id, 10),
      content_type,
      typeof content_data === 'string' ? content_data : JSON.stringify(content_data),
      parseInt(sort, 10),
      req.user.id
    );

    const content = await db.prepare('SELECT * FROM contents WHERE id = ?').get(result.lastInsertRowid);
    logger.info(`创建内容成功, ID: ${result.lastInsertRowid}`);

    res.json(success(content, '创建成功'));
  } catch (err) {
    logger.error('创建内容错误:', err);
    res.status(500).json(error('创建失败'));
  }
});

router.post('/batch', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { entry_id, contents = [] } = req.body || {};

    if (!entry_id || !Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json(error('词条ID和内容列表不能为空'));
    }

    const db = getDb();
    const entry = await db.prepare('SELECT id FROM entries WHERE id = ?').get(parseInt(entry_id, 10));
    if (!entry) {
      return res.status(404).json(error('词条不存在'));
    }

    const insertStmt = db.prepare(`
      INSERT INTO contents (entry_id, content_type, content_data, sort, status, created_by)
      VALUES (?, ?, ?, ?, 1, ?)
    `);

    for (const item of contents) {
      if (item.content_type && item.content_data) {
        await insertStmt.run(
          parseInt(entry_id, 10),
          item.content_type,
          typeof item.content_data === 'string' ? item.content_data : JSON.stringify(item.content_data),
          parseInt(item.sort || 0, 10),
          req.user.id
        );
      }
    }

    logger.info(`批量创建内容成功, 数量: ${contents.length}`);

    res.json(success(null, '批量创建成功'));
  } catch (err) {
    logger.error('批量创建内容错误:', err);
    res.status(500).json(error('批量创建失败'));
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content_type, content_data, sort, status } = req.body || {};

    const db = getDb();
    const existing = await db.prepare('SELECT * FROM contents WHERE id = ?').get(parseInt(id, 10));
    if (!existing) {
      return res.status(404).json(error('内容不存在'));
    }

    await db.prepare(`
      UPDATE contents 
      SET content_type = COALESCE(?, content_type),
          content_data = COALESCE(?, content_data),
          sort = COALESCE(?, sort),
          status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      content_type ?? null,
      content_data !== undefined ? (typeof content_data === 'string' ? content_data : JSON.stringify(content_data)) : null,
      sort !== undefined ? parseInt(sort, 10) : null,
      status !== undefined ? parseInt(status, 10) : null,
      parseInt(id, 10)
    );

    const content = await db.prepare('SELECT * FROM contents WHERE id = ?').get(parseInt(id, 10));
    logger.info(`更新内容成功, ID: ${id}`);

    res.json(success(content, '更新成功'));
  } catch (err) {
    logger.error('更新内容错误:', err);
    res.status(500).json(error('更新失败'));
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const existing = await db.prepare('SELECT * FROM contents WHERE id = ?').get(parseInt(id, 10));
    if (!existing) {
      return res.status(404).json(error('内容不存在'));
    }

    await db.prepare('DELETE FROM contents WHERE id = ?').run(parseInt(id, 10));
    logger.info(`删除内容, ID: ${id}`);

    res.json(success(null, '删除成功'));
  } catch (err) {
    logger.error('删除内容错误:', err);
    res.status(500).json(error('删除失败'));
  }
});

module.exports = router;
