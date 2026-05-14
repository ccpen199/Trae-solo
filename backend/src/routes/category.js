const express = require('express');
const { db } = require('../db');
const { authMiddleware, adminMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM questions q WHERE q.category_id = c.id AND q.status = 1) as question_count,
             (SELECT COUNT(*) FROM articles a WHERE a.category_id = c.id AND a.status = 1) as article_count
      FROM categories c
      WHERE c.status = 1
      ORDER BY c.sort ASC, c.id ASC
    `;

    const categories = await await db.prepare(sql).all();

    res.json({
      success: true,
      data: {
        list: categories
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败'
    });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, sort = 0 } = req.body;
    const now = Date.now();

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '分类名称不能为空'
      });
    }

    const existing = await db.prepare('SELECT id FROM categories WHERE name = ?').get(name.trim());
    if (existing) {
      return res.status(400).json({
        success: false,
        message: '分类名称已存在'
      });
    }

    const result = await db.prepare(`
      INSERT INTO categories (name, description, sort, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(name.trim(), description || '', sort, 1, now);

    const category = await db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastID);

    res.json({
      success: true,
      message: '创建成功',
      data: { category }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: '创建失败，请稍后重试'
    });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, sort, status } = req.body;

    const category = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    const updateFields = [];
    const values = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      values.push(description);
    }
    if (sort !== undefined) {
      updateFields.push('sort = ?');
      values.push(sort);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      values.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有可更新的字段'
      });
    }

    values.push(id);

    await db.prepare(`UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: '更新失败，请稍后重试'
    });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    await db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: '删除失败，请稍后重试'
    });
  }
});

module.exports = router;
