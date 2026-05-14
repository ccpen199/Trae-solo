const express = require('express');
const { verifyToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

module.exports = function(db) {
  router.get('/list', optionalAuth, (req, res) => {
    try {
      const { page = 1, pageSize = 10, type, userId } = req.query;
      const offset = (page - 1) * pageSize;
      
      let whereClause = 'WHERE c.status = 1';
      const params = [];
      
      if (type) {
        whereClause += ' AND c.type = ?';
        params.push(type);
      }
      
      if (userId) {
        whereClause += ' AND c.user_id = ?';
        params.push(userId);
      }
      
      const contents = db.prepare(`
        SELECT c.*, u.nickname, u.avatar
        FROM contents c
        JOIN users u ON c.user_id = u.id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, parseInt(pageSize), offset);
      
      const total = db.prepare(`
        SELECT COUNT(*) as count FROM contents c
        ${whereClause}
      `).get(...params);
      
      const contentsWithProducts = contents.map(content => {
        let relatedProducts = [];
        if (content.product_ids) {
          const productIds = content.product_ids.split(',').map(id => parseInt(id.trim()));
          relatedProducts = db.prepare(`
            SELECT id, title, price, cover_image, sales
            FROM products WHERE id IN (${productIds.map(() => '?').join(',')})
          `).all(...productIds);
        }
        
        let isLiked = false;
        if (req.user) {
          const like = db.prepare('SELECT id FROM content_comments WHERE content_id = ? AND user_id = ?').get(content.id, req.user.id);
          isLiked = !!like;
        }
        
        return { ...content, relatedProducts, isLiked };
      });
      
      res.json({
        code: 200,
        message: '获取成功',
        data: {
          list: contentsWithProducts,
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
  
  router.get('/:id', optionalAuth, (req, res) => {
    try {
      const { id } = req.params;
      
      const content = db.prepare(`
        SELECT c.*, u.nickname, u.avatar
        FROM contents c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ? AND c.status = 1
      `).get(id);
      
      if (!content) {
        return res.status(404).json({
          code: 404,
          message: '内容不存在',
          data: null
        });
      }
      
      let relatedProducts = [];
      if (content.product_ids) {
        const productIds = content.product_ids.split(',').map(pid => parseInt(pid.trim()));
        relatedProducts = db.prepare(`
          SELECT id, title, price, cover_image, sales
          FROM products WHERE id IN (${productIds.map(() => '?').join(',')})
        `).all(...productIds);
      }
      
      const comments = db.prepare(`
        SELECT cc.*, u.nickname, u.avatar
        FROM content_comments cc
        JOIN users u ON cc.user_id = u.id
        WHERE cc.content_id = ?
        ORDER BY cc.created_at DESC
        LIMIT 20
      `).all(id);
      
      let isLiked = false;
      let isFollowing = false;
      if (req.user) {
        const like = db.prepare('SELECT id FROM content_comments WHERE content_id = ? AND user_id = ?').get(id, req.user.id);
        isLiked = !!like;
        
        const follow = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, content.user_id);
        isFollowing = !!follow;
      }
      
      res.json({
        code: 200,
        message: '获取成功',
        data: { 
          ...content, 
          relatedProducts, 
          comments, 
          isLiked, 
          isFollowing 
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
  
  router.post('/', verifyToken, (req, res) => {
    try {
      const { title, content, coverImage, images, videoUrl, type = 'article', productIds } = req.body;
      
      if (!content) {
        return res.status(400).json({
          code: 400,
          message: '内容不能为空',
          data: null
        });
      }
      
      const result = db.prepare(`
        INSERT INTO contents (user_id, title, content, cover_image, images, video_url, type, product_ids)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.user.id, 
        title || '', 
        content, 
        coverImage || '', 
        images || '', 
        videoUrl || '', 
        type,
        productIds || ''
      );
      
      res.json({
        code: 200,
        message: '发布成功',
        data: { id: result.lastInsertRowid }
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
  
  router.post('/:id/like', verifyToken, (req, res) => {
    try {
      const { id } = req.params;
      
      const content = db.prepare('SELECT id FROM contents WHERE id = ?').get(id);
      if (!content) {
        return res.status(404).json({
          code: 404,
          message: '内容不存在',
          data: null
        });
      }
      
      db.prepare('UPDATE contents SET likes = likes + 1 WHERE id = ?').run(id);
      
      res.json({
        code: 200,
        message: '点赞成功',
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
  
  router.post('/:id/comment', verifyToken, (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({
          code: 400,
          message: '评论内容不能为空',
          data: null
        });
      }
      
      const contentItem = db.prepare('SELECT id FROM contents WHERE id = ?').get(id);
      if (!contentItem) {
        return res.status(404).json({
          code: 404,
          message: '内容不存在',
          data: null
        });
      }
      
      const result = db.prepare(`
        INSERT INTO content_comments (content_id, user_id, content)
        VALUES (?, ?, ?)
      `).run(id, req.user.id, content);
      
      db.prepare('UPDATE contents SET comments = comments + 1 WHERE id = ?').run(id);
      
      const comment = db.prepare(`
        SELECT cc.*, u.nickname, u.avatar
        FROM content_comments cc
        JOIN users u ON cc.user_id = u.id
        WHERE cc.id = ?
      `).get(result.lastInsertRowid);
      
      res.json({
        code: 200,
        message: '评论成功',
        data: comment
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
  
  router.post('/follow/:userId', verifyToken, (req, res) => {
    try {
      const { userId } = req.params;
      
      if (parseInt(userId) === req.user.id) {
        return res.status(400).json({
          code: 400,
          message: '不能关注自己',
          data: null
        });
      }
      
      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
      if (!user) {
        return res.status(404).json({
          code: 404,
          message: '用户不存在',
          data: null
        });
      }
      
      const existing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, userId);
      
      if (existing) {
        db.prepare('DELETE FROM follows WHERE id = ?').run(existing.id);
        res.json({
          code: 200,
          message: '已取消关注',
          data: { isFollowing: false }
        });
      } else {
        db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user.id, userId);
        res.json({
          code: 200,
          message: '关注成功',
          data: { isFollowing: true }
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
  
  router.get('/follows/list', verifyToken, (req, res) => {
    try {
      const follows = db.prepare(`
        SELECT u.id, u.nickname, u.avatar
        FROM follows f
        JOIN users u ON f.following_id = u.id
        WHERE f.follower_id = ?
        ORDER BY f.created_at DESC
      `).all(req.user.id);
      
      res.json({
        code: 200,
        message: '获取成功',
        data: follows
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
