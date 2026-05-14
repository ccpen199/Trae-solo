const express = require('express');
const { getDb } = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const categories = await db.prepare(`
      SELECT * FROM categories WHERE status = 1
      ORDER BY level ASC, sort ASC, id ASC
    `).all();

    res.json(success(categories || []));
  } catch (err) {
    logger.error('获取分类列表错误:', err);
    res.status(500).json(error('获取失败'));
  }
});

router.get('/tree', async (req, res) => {
  try {
    const db = getDb();
    const allCategories = await db.prepare(`
      SELECT * FROM categories WHERE status = 1
      ORDER BY level ASC, sort ASC, id ASC
    `).all();

    const buildTree = (parentId = 0) => {
      const children = (allCategories || []).filter(c => c.parent_id === parentId);
      return children.map(c => ({
        ...c,
        children: buildTree(c.id)
      }));
    };

    const tree = buildTree(0);
    res.json(success(tree));
  } catch (err) {
    logger.error('获取分类树错误:', err);
    res.status(500).json(error('获取失败'));
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, parent_id = 0, sort = 0 } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json(error('分类名称不能为空'));
    }

    const db = getDb();
    const parentId = parseInt(parent_id, 10) || 0;
    const level = parentId === 0 ? 1 : 2;

    const result = await db.prepare(`
      INSERT INTO categories (name, parent_id, level, sort, status)
      VALUES (?, ?, ?, ?, 1)
    `).run(name.trim(), parentId, level, parseInt(sort, 10));

    logger.info(`创建分类成功: ${name}`);
    res.json(success({ id: result.lastInsertRowid }, '创建成功'));
  } catch (err) {
    logger.error('创建分类错误:', err);
    res.status(500).json(error('创建失败'));
  }
});

router.get('/leaf-nodes', async (req, res) => {
  try {
    const { category_id } = req.query;
    const db = getDb();

    let whereConditions = ['status = 1'];
    let params = [];

    if (category_id) {
      whereConditions.push('category_id = ?');
      params.push(parseInt(category_id, 10));
    }

    const whereSql = `WHERE ${whereConditions.join(' AND ')}`;
    const nodes = await db.prepare(`SELECT * FROM leaf_nodes ${whereSql} ORDER BY id ASC`).all(...params);

    res.json(success(nodes || []));
  } catch (err) {
    logger.error('获取叶子节点错误:', err);
    res.status(500).json(error('获取失败'));
  }
});

router.post('/leaf-nodes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, category_id, external_id } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json(error('节点名称不能为空'));
    }

    const db = getDb();
    const result = await db.prepare(`
      INSERT INTO leaf_nodes (name, category_id, external_id, status)
      VALUES (?, ?, ?, 1)
    `).run(
      name.trim(),
      category_id ? parseInt(category_id, 10) : null,
      external_id || null
    );

    logger.info(`创建叶子节点成功: ${name}`);
    res.json(success({ id: result.lastInsertRowid }, '创建成功'));
  } catch (err) {
    logger.error('创建叶子节点错误:', err);
    res.status(500).json(error('创建失败'));
  }
});

module.exports = router;
