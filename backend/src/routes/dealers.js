const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  try {
    const { region, keyword } = req.query;

    let sql = 'SELECT * FROM dealers WHERE 1=1';
    const params = [];

    if (region) {
      sql += ' AND region = ?';
      params.push(region);
    }

    if (keyword) {
      sql += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY created_at DESC';

    const dealers = db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: dealers
    });
  } catch (error) {
    console.error('获取经销商列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取经销商列表失败'
    });
  }
});

router.get('/regions', (req, res) => {
  try {
    const regions = db.prepare(`
      SELECT DISTINCT region FROM dealers ORDER BY region
    `).all().map(r => r.region);

    res.json({
      success: true,
      data: regions
    });
  } catch (error) {
    console.error('获取区域列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取区域列表失败'
    });
  }
});

router.get('/:id/personnel', (req, res) => {
  try {
    const { id } = req.params;

    const personnel = db.prepare(`
      SELECT * FROM personnel WHERE dealer_id = ? ORDER BY name
    `).all(id);

    res.json({
      success: true,
      data: personnel
    });
  } catch (error) {
    console.error('获取经销商人员列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取经销商人员列表失败'
    });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, code, region } = req.body;

    if (!name || !code || !region) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const result = db.prepare(`
      INSERT INTO dealers (name, code, region) VALUES (?, ?, ?)
    `).run(name, code, region);

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        message: '经销商添加成功'
      }
    });
  } catch (error) {
    console.error('添加经销商失败:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({
        success: false,
        message: '经销商代码已存在'
      });
    }
    res.status(500).json({
      success: false,
      message: '添加经销商失败'
    });
  }
});

module.exports = router;
