const express = require('express');
const Joi = require('joi');
const { allAsync, getAsync, runAsync } = require('../utils/db');

const router = express.Router();

const tagSchema = Joi.object({
  tag_id: Joi.string().required(),
  name: Joi.string().required(),
  status: Joi.number().integer().min(0).max(1),
  creator: Joi.string().allow('', null),
});

router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 100, status } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status !== undefined && status !== '') {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const tags = await allAsync(
      `SELECT * FROM tags ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    const totalResult = await getAsync(
      `SELECT COUNT(*) as total FROM tags ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        list: tags,
        total: totalResult.total,
        page: Number(page),
        pageSize: Number(pageSize)
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '获取标签列表失败'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const tag = await getAsync('SELECT * FROM tags WHERE id = ?', [req.params.id]);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '标签不存在'
      });
    }

    const deviceCount = await getAsync(`
      SELECT COUNT(*) as count FROM device_tags WHERE tag_id = ?
    `, [tag.tag_id]);

    res.json({
      success: true,
      data: { ...tag, device_count: deviceCount.count },
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取标签详情失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '获取标签详情失败'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { error, value } = tagSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        message: error.details[0].message
      });
    }

    const result = await runAsync(`
      INSERT INTO tags (tag_id, name, status, creator)
      VALUES (?, ?, ?, ?)
    `, [value.tag_id, value.name, value.status ?? 1, value.creator || 'admin']);

    res.json({
      success: true,
      data: { id: result.lastID },
      message: '创建标签成功'
    });
  } catch (error) {
    console.error('创建标签失败:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '标签ID已存在'
      });
    }
    res.status(500).json({
      success: false,
      data: null,
      message: '创建标签失败'
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { error, value } = tagSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        message: error.details[0].message
      });
    }

    const existing = await getAsync('SELECT * FROM tags WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '标签不存在'
      });
    }

    await runAsync(`
      UPDATE tags SET
        tag_id = ?, name = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [value.tag_id, value.name, value.status ?? 1, req.params.id]);

    res.json({
      success: true,
      data: null,
      message: '更新标签成功'
    });
  } catch (error) {
    console.error('更新标签失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '更新标签失败'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await getAsync('SELECT * FROM tags WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '标签不存在'
      });
    }

    await runAsync('DELETE FROM tags WHERE id = ?', [req.params.id]);
    await runAsync('DELETE FROM device_tags WHERE tag_id = ?', [existing.tag_id]);

    res.json({
      success: true,
      data: null,
      message: '删除标签成功'
    });
  } catch (error) {
    console.error('删除标签失败:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '删除标签失败'
    });
  }
});

module.exports = router;
