const express = require('express');
const { verifyToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

module.exports = function(db) {
  router.get('/categories', (req, res) => {
    try {
      const categories = db.prepare(`
        SELECT id, name, icon, sort 
        FROM categories 
        WHERE parent_id = 0 
        ORDER BY sort ASC, id ASC
      `).all();
      
      res.json({
        code: 200,
        message: '获取成功',
        data: categories
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.get('/channels', (req, res) => {
    try {
      const channels = db.prepare(`
        SELECT id, name, icon, link 
        FROM channels 
        WHERE status = 1 
        ORDER BY sort ASC, id ASC
      `).all();
      
      res.json({
        code: 200,
        message: '获取成功',
        data: channels
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.get('/list', optionalAuth, (req, res) => {
    try {
      const { page = 1, pageSize = 10, categoryId, keyword, sort = 'default' } = req.query;
      const offset = (page - 1) * pageSize;
      
      let whereClause = 'WHERE status = 1';
      const params = [];
      
      if (categoryId) {
        whereClause += ' AND category_id = ?';
        params.push(categoryId);
      }
      
      if (keyword) {
        whereClause += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
      
      let orderBy = 'ORDER BY id DESC';
      if (sort === 'sales') {
        orderBy = 'ORDER BY sales DESC';
      } else if (sort === 'price_asc') {
        orderBy = 'ORDER BY price ASC';
      } else if (sort === 'price_desc') {
        orderBy = 'ORDER BY price DESC';
      }
      
      const products = db.prepare(`
        SELECT id, title, price, original_price, sales, cover_image, shop_name 
        FROM products 
        ${whereClause} 
        ${orderBy} 
        LIMIT ? OFFSET ?
      `).all(...params, parseInt(pageSize), offset);
      
      const total = db.prepare(`SELECT COUNT(*) as count FROM products ${whereClause}`).get(...params);
      
      let productsWithFavorite = products;
      if (req.user) {
        productsWithFavorite = products.map(p => {
          const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?').get(req.user.id, p.id);
          return { ...p, isFavorite: !!fav };
        });
      }
      
      res.json({
        code: 200,
        message: '获取成功',
        data: {
          list: productsWithFavorite,
          total: total.count,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.get('/recommend', optionalAuth, (req, res) => {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      const offset = (page - 1) * pageSize;
      
      const products = db.prepare(`
        SELECT id, title, price, original_price, sales, cover_image, shop_name 
        FROM products 
        WHERE status = 1 AND is_recommend = 1
        ORDER BY RANDOM() 
        LIMIT ? OFFSET ?
      `).all(parseInt(pageSize), offset);
      
      const total = db.prepare(`SELECT COUNT(*) as count FROM products WHERE status = 1 AND is_recommend = 1`).get();
      
      let productsWithFavorite = products;
      if (req.user) {
        productsWithFavorite = products.map(p => {
          const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?').get(req.user.id, p.id);
          return { ...p, isFavorite: !!fav };
        });
      }
      
      res.json({
        code: 200,
        message: '获取成功',
        data: {
          list: productsWithFavorite,
          total: total.count,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.get('/detail/:id', optionalAuth, (req, res) => {
    try {
      const { id } = req.params;
      
      const product = db.prepare(`
        SELECT * FROM products WHERE id = ? AND status = 1
      `).get(id);
      
      if (!product) {
        return res.status(404).json({
          code: 404,
          message: '商品不存在',
          data: null
        });
      }
      
      const comments = db.prepare(`
        SELECT pc.*, u.nickname, u.avatar
        FROM product_comments pc
        LEFT JOIN users u ON pc.user_id = u.id
        WHERE pc.product_id = ?
        ORDER BY pc.created_at DESC
        LIMIT 10
      `).all(id);
      
      const skus = db.prepare(`
        SELECT * FROM product_skus WHERE product_id = ?
      `).all(id);
      
      let isFavorite = false;
      if (req.user) {
        const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?').get(req.user.id, id);
        isFavorite = !!fav;
      }
      
      const relatedProducts = db.prepare(`
        SELECT id, title, price, cover_image, sales
        FROM products 
        WHERE category_id = ? AND id != ? AND status = 1
        ORDER BY RANDOM()
        LIMIT 6
      `).all(product.category_id, id);
      
      res.json({
        code: 200,
        message: '获取成功',
        data: {
          ...product,
          isFavorite,
          skus,
          comments,
          relatedProducts
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.post('/favorite/:id', verifyToken, (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const product = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
      if (!product) {
        return res.status(404).json({
          code: 404,
          message: '商品不存在',
          data: null
        });
      }
      
      const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?').get(userId, id);
      
      if (existing) {
        db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?').run(userId, id);
        res.json({
          code: 200,
          message: '已取消收藏',
          data: { isFavorite: false }
        });
      } else {
        db.prepare('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)').run(userId, id);
        res.json({
          code: 200,
          message: '收藏成功',
          data: { isFavorite: true }
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.get('/favorites', verifyToken, (req, res) => {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      const offset = (page - 1) * pageSize;
      
      const favorites = db.prepare(`
        SELECT p.*, f.created_at as favorite_time
        FROM favorites f
        JOIN products p ON f.product_id = p.id
        WHERE f.user_id = ? AND p.status = 1
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
      `).all(req.user.id, parseInt(pageSize), offset);
      
      const total = db.prepare(`
        SELECT COUNT(*) as count FROM favorites f
        JOIN products p ON f.product_id = p.id
        WHERE f.user_id = ? AND p.status = 1
      `).get(req.user.id);
      
      res.json({
        code: 200,
        message: '获取成功',
        data: {
          list: favorites,
          total: total.count,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.get('/search-hot', (req, res) => {
    try {
      const hotWords = [
        { keyword: 'iPhone 15', hot: 9999 },
        { keyword: '连衣裙', hot: 8888 },
        { keyword: '护肤品', hot: 7777 },
        { keyword: '运动鞋', hot: 6666 },
        { keyword: '车厘子', hot: 5555 },
        { keyword: '扫地机器人', hot: 4444 }
      ];
      
      res.json({
        code: 200,
        message: '获取成功',
        data: hotWords
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.get('/search-suggestions', (req, res) => {
    try {
      const { keyword } = req.query;
      
      if (!keyword) {
        return res.json({
          code: 200,
          message: '获取成功',
          data: []
        });
      }
      
      const products = db.prepare(`
        SELECT title FROM products 
        WHERE title LIKE ? 
        LIMIT 10
      `).all(`%${keyword}%`);
      
      const suggestions = products.map(p => p.title);
      
      res.json({
        code: 200,
        message: '获取成功',
        data: suggestions
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.get('/search-history', verifyToken, (req, res) => {
    try {
      const history = db.prepare(`
        SELECT DISTINCT keyword, last_search_at
        FROM search_history
        WHERE user_id = ?
        ORDER BY last_search_at DESC
        LIMIT 20
      `).all(req.user.id);
      
      res.json({
        code: 200,
        message: '获取成功',
        data: history
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.post('/search-history', verifyToken, (req, res) => {
    try {
      const { keyword } = req.body;
      
      if (!keyword) {
        return res.status(400).json({
          code: 400,
          message: '关键词不能为空',
          data: null
        });
      }
      
      const existing = db.prepare('SELECT id FROM search_history WHERE user_id = ? AND keyword = ?').get(req.user.id, keyword);
      
      if (existing) {
        db.prepare(`
          UPDATE search_history 
          SET search_count = search_count + 1, last_search_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(existing.id);
      } else {
        db.prepare(`
          INSERT INTO search_history (user_id, keyword)
          VALUES (?, ?)
        `).run(req.user.id, keyword);
      }
      
      res.json({
        code: 200,
        message: '保存成功',
        data: null
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  router.delete('/search-history', verifyToken, (req, res) => {
    try {
      const { keyword } = req.query;
      
      if (keyword) {
        db.prepare('DELETE FROM search_history WHERE user_id = ? AND keyword = ?').run(req.user.id, keyword);
      } else {
        db.prepare('DELETE FROM search_history WHERE user_id = ?').run(req.user.id);
      }
      
      res.json({
        code: 200,
        message: '删除成功',
        data: null
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        message: '服务器错误',
        data: null
      });
    }
  });
  
  return router;
};
