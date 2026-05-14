const express = require('express');
const { query, queryOne } = require('../database');
const { optionalAuth, authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/banners', async (req, res) => {
  try {
    const banners = await query('SELECT * FROM banners WHERE status = 1 ORDER BY sort ASC');
    res.json({ success: true, message: '获取成功', data: banners });
  } catch (err) {
    console.error('获取banner失败:', err);
    res.json({ success: false, message: '获取失败', data: [] });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await query('SELECT * FROM categories ORDER BY sort ASC');
    res.json({ success: true, message: '获取成功', data: categories });
  } catch (err) {
    console.error('获取分类失败:', err);
    res.json({ success: false, message: '获取失败', data: [] });
  }
});

router.get('/activity-icons', async (req, res) => {
  try {
    const icons = await query('SELECT * FROM activity_icons ORDER BY sort ASC');
    res.json({ success: true, message: '获取成功', data: icons });
  } catch (err) {
    console.error('获取活动图标失败:', err);
    res.json({ success: false, message: '获取失败', data: [] });
  }
});

router.get('/buy-products', async (req, res) => {
  try {
    const products = await query('SELECT * FROM products WHERE is_buy = 1 ORDER BY sales DESC LIMIT 10');
    res.json({ success: true, message: '获取成功', data: products });
  } catch (err) {
    console.error('获取百亿补贴商品失败:', err);
    res.json({ success: false, message: '获取失败', data: [] });
  }
});

router.get('/hot-products', optionalAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, categoryId, keyword } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let sql = 'SELECT * FROM products WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as count FROM products WHERE 1=1';
    const params = [];
    const countParams = [];

    if (categoryId) {
      sql += ' AND category_id = ?';
      countSql += ' AND category_id = ?';
      params.push(categoryId);
      countParams.push(categoryId);
    }

    if (keyword) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      countSql += ' AND (name LIKE ? OR description LIKE ?)';
      const search = `%${keyword}%`;
      params.push(search, search);
      countParams.push(search, search);
    }

    sql += ' ORDER BY is_hot DESC, sales DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const products = await query(sql, params);
    const countResult = await queryOne(countSql, countParams);

    const productIds = products.map(p => p.id);

    let favoriteMap = {};
    if (req.user && productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      const favorites = await query(
        `SELECT product_id FROM favorites WHERE user_id = ? AND product_id IN (${placeholders})`,
        [req.user.id, ...productIds]
      );
      favorites.forEach(f => {
        favoriteMap[f.product_id] = true;
      });
    }

    const productsWithFavorite = products.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
      is_favorite: favoriteMap[p.id] || false
    }));

    res.json({
      success: true,
      message: '获取成功',
      data: {
        list: productsWithFavorite,
        total: countResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    console.error('获取商品列表失败:', err);
    res.json({ success: false, message: '获取失败', data: { list: [], total: 0, page: 1, pageSize: 10 } });
  }
});

router.get('/index', optionalAuth, async (req, res) => {
  try {
    const [banners, categories, icons, buyProducts, hotProducts] = await Promise.all([
      query('SELECT * FROM banners WHERE status = 1 ORDER BY sort ASC'),
      query('SELECT * FROM categories ORDER BY sort ASC'),
      query('SELECT * FROM activity_icons ORDER BY sort ASC'),
      query('SELECT * FROM products WHERE is_buy = 1 ORDER BY sales DESC LIMIT 10'),
      query('SELECT * FROM products ORDER BY is_hot DESC, sales DESC LIMIT 20')
    ]);

    let favoriteMap = {};
    const allProductIds = [...buyProducts, ...hotProducts].map(p => p.id);
    
    if (req.user && allProductIds.length > 0) {
      const placeholders = allProductIds.map(() => '?').join(',');
      const favorites = await query(
        `SELECT product_id FROM favorites WHERE user_id = ? AND product_id IN (${placeholders})`,
        [req.user.id, ...allProductIds]
      );
      favorites.forEach(f => {
        favoriteMap[f.product_id] = true;
      });
    }

    const processProducts = (products) => products.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
      is_favorite: favoriteMap[p.id] || false
    }));

    res.json({
      success: true,
      message: '获取成功',
      data: {
        banners,
        categories,
        activityIcons: icons,
        buyProducts: processProducts(buyProducts),
        hotProducts: processProducts(hotProducts)
      }
    });
  } catch (err) {
    console.error('获取首页数据失败:', err);
    res.json({
      success: false,
      message: '获取失败',
      data: {
        banners: [],
        categories: [],
        activityIcons: [],
        buyProducts: [],
        hotProducts: []
      }
    });
  }
});

module.exports = router;
