const express = require('express');
const { db } = require('../database');

const router = express.Router();

router.get('/banners', (req, res) => {
  try {
    const banners = db.prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC').all();
    res.json({
      success: true,
      data: banners,
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
    res.json({
      success: true,
      data: categories,
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.get('/recommendations', (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const appliances = db.prepare(`
      SELECT a.*, c.name as category_name, c.icon as category_icon
      FROM appliances a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'available'
      ORDER BY a.views DESC, a.created_at DESC
      LIMIT ?
    `).all(limit);

    const result = appliances.map(app => ({
      ...app,
      images: app.images ? JSON.parse(app.images) : []
    }));

    res.json({
      success: true,
      data: result,
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.get('/appliances', (req, res) => {
  try {
    const { 
      keyword = '', 
      category_id, 
      condition, 
      min_price, 
      max_price, 
      location,
      sort_by = 'views',
      sort_order = 'desc',
      page = 1,
      page_size = 10
    } = req.query;

    let sql = `
      SELECT a.*, c.name as category_name, c.icon as category_icon
      FROM appliances a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'available'
    `;
    const params = [];

    if (keyword) {
      sql += ' AND (a.name LIKE ? OR a.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (category_id) {
      sql += ' AND a.category_id = ?';
      params.push(category_id);
    }

    if (condition) {
      sql += ' AND a.condition = ?';
      params.push(condition);
    }

    if (min_price) {
      sql += ' AND a.daily_rent >= ?';
      params.push(min_price);
    }

    if (max_price) {
      sql += ' AND a.daily_rent <= ?';
      params.push(max_price);
    }

    if (location) {
      sql += ' AND a.location LIKE ?';
      params.push(`%${location}%`);
    }

    const validSortFields = ['views', 'daily_rent', 'created_at'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'views';
    const sortOrder = sort_order === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY a.${sortField} ${sortOrder}`;

    const countSql = sql.replace('SELECT a.*, c.name as category_name, c.icon as category_icon', 'SELECT COUNT(*) as count');
    const total = db.prepare(countSql).get(...params).count;

    const offset = (page - 1) * page_size;
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(page_size), offset);

    const appliances = db.prepare(sql).all(...params);

    const result = appliances.map(app => ({
      ...app,
      images: app.images ? JSON.parse(app.images) : []
    }));

    res.json({
      success: true,
      data: {
        list: result,
        total,
        page: parseInt(page),
        page_size: parseInt(page_size),
        total_pages: Math.ceil(total / page_size)
      },
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get appliances error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

router.get('/appliances/:id', (req, res) => {
  try {
    const { id } = req.params;

    const appliance = db.prepare(`
      SELECT a.*, c.name as category_name, c.icon as category_icon, u.id as owner_id, u.nickname as owner_name, u.avatar as owner_avatar
      FROM appliances a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.owner_id = u.id
      WHERE a.id = ?
    `).get(id);

    if (!appliance) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    db.prepare('UPDATE appliances SET views = views + 1 WHERE id = ?').run(id);

    const result = {
      ...appliance,
      images: appliance.images ? JSON.parse(appliance.images) : []
    };

    res.json({
      success: true,
      data: result,
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get appliance detail error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

module.exports = router;
