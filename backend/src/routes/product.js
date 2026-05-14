const express = require('express');
const { query, queryOne } = require('../database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/detail/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await queryOne('SELECT * FROM products WHERE id = ?', [id]);

    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在', data: null });
    }

    let isFavorite = false;
    if (req.user) {
      const favorite = await queryOne(
        'SELECT * FROM favorites WHERE user_id = ? AND product_id = ?',
        [req.user.id, id]
      );
      isFavorite = !!favorite;
    }

    const shop = await queryOne('SELECT * FROM shops WHERE id = ?', [product.shop_id]);

    let isFollowShop = false;
    if (req.user && shop) {
      const follow = await queryOne(
        'SELECT * FROM follows WHERE user_id = ? AND shop_id = ?',
        [req.user.id, shop.id]
      );
      isFollowShop = !!follow;
    }

    const relatedProducts = await query(
      'SELECT * FROM products WHERE category_id = ? AND id != ? ORDER BY sales DESC LIMIT 10',
      [product.category_id, id]
    );

    let relatedFavoriteMap = {};
    if (req.user && relatedProducts.length > 0) {
      const placeholders = relatedProducts.map(() => '?').join(',');
      const favorites = await query(
        `SELECT product_id FROM favorites WHERE user_id = ? AND product_id IN (${placeholders})`,
        [req.user.id, ...relatedProducts.map(p => p.id)]
      );
      favorites.forEach(f => {
        relatedFavoriteMap[f.product_id] = true;
      });
    }

    res.json({
      success: true,
      message: '获取成功',
      data: {
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        is_favorite: isFavorite,
        shop: shop ? {
          ...shop,
          is_follow: isFollowShop
        } : null,
        relatedProducts: relatedProducts.map(p => ({
          ...p,
          images: p.images ? JSON.parse(p.images) : [],
          is_favorite: relatedFavoriteMap[p.id] || false
        }))
      }
    });
  } catch (err) {
    console.error('获取商品详情失败:', err);
    res.json({ success: false, message: '获取失败', data: null });
  }
});

router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { keyword = '', page = 1, pageSize = 20, categoryId, sort = 'sales' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let sql = 'SELECT * FROM products WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as count FROM products WHERE 1=1';
    const params = [];
    const countParams = [];

    if (keyword) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      countSql += ' AND (name LIKE ? OR description LIKE ?)';
      const search = `%${keyword}%`;
      params.push(search, search);
      countParams.push(search, search);
    }

    if (categoryId) {
      sql += ' AND category_id = ?';
      countSql += ' AND category_id = ?';
      params.push(categoryId);
      countParams.push(categoryId);
    }

    let orderBy = 'sales DESC';
    if (sort === 'price_asc') {
      orderBy = 'price ASC';
    } else if (sort === 'price_desc') {
      orderBy = 'price DESC';
    } else if (sort === 'newest') {
      orderBy = 'created_at DESC';
    }

    sql += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);

    const products = await query(sql, params);
    const countResult = await queryOne(countSql, countParams);

    let favoriteMap = {};
    if (req.user && products.length > 0) {
      const placeholders = products.map(() => '?').join(',');
      const favorites = await query(
        `SELECT product_id FROM favorites WHERE user_id = ? AND product_id IN (${placeholders})`,
        [req.user.id, ...products.map(p => p.id)]
      );
      favorites.forEach(f => {
        favoriteMap[f.product_id] = true;
      });
    }

    res.json({
      success: true,
      message: '获取成功',
      data: {
        list: products.map(p => ({
          ...p,
          images: p.images ? JSON.parse(p.images) : [],
          is_favorite: favoriteMap[p.id] || false
        })),
        total: countResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    console.error('搜索商品失败:', err);
    res.json({ success: false, message: '搜索失败', data: { list: [], total: 0, page: 1, pageSize: 20 } });
  }
});

module.exports = router;
