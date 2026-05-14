const express = require('express');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

module.exports = function(db) {
  router.get('/', verifyToken, (req, res) => {
    try {
      const { type, page = 1, pageSize = 20 } = req.query;
      const offset = (page - 1) * pageSize;
      
      let whereClause = 'WHERE user_id = ?';
      const params = [req.user.id];
      
      if (type) {
        whereClause += ' AND type = ?';
        params.push(type);
      }
      
      const messages = db.prepare(`
        SELECT * FROM messages
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, parseInt(pageSize), offset);
      
      const total = db.prepare(`
        SELECT COUNT(*) as count FROM messages
        ${whereClause}
      `).get(...params);
      
      res.json({
        code: 200,
        message: '获取成功',
        data: {
          list: messages,
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
  
  router.get('/unread-count', verifyToken, (req, res) => {
    try {
      const count = db.prepare(`
        SELECT COUNT(*) as count FROM messages
        WHERE user_id = ? AND is_read = 0
      `).get(req.user.id);
      
      const typeCounts = db.prepare(`
        SELECT type, COUNT(*) as count FROM messages
        WHERE user_id = ? AND is_read = 0
        GROUP BY type
      `).all(req.user.id);
      
      const result = {
        total: count.count,
        types: {}
      };
      
      typeCounts.forEach(tc => {
        result.types[tc.type] = tc.count;
      });
      
      res.json({
        code: 200,
        message: '获取成功',
        data: result
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
  
  router.post('/read/:id', verifyToken, (req, res) => {
    try {
      const { id } = req.params;
      
      db.prepare(`
        UPDATE messages SET is_read = 1
        WHERE id = ? AND user_id = ?
      `).run(id, req.user.id);
      
      res.json({
        code: 200,
        message: '已标记为已读',
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
  
  router.post('/read-all', verifyToken, (req, res) => {
    try {
      const { type } = req.body;
      
      let whereClause = 'WHERE user_id = ?';
      const params = [req.user.id];
      
      if (type) {
        whereClause += ' AND type = ?';
        params.push(type);
      }
      
      db.prepare(`
        UPDATE messages SET is_read = 1
        ${whereClause}
      `).run(...params);
      
      res.json({
        code: 200,
        message: '全部已读',
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
  
  router.get('/chats', verifyToken, (req, res) => {
    try {
      const chats = db.prepare(`
        SELECT * FROM chats
        WHERE user_id = ?
        ORDER BY last_time DESC
      `).all(req.user.id);
      
      res.json({
        code: 200,
        message: '获取成功',
        data: chats
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
  
  router.get('/chats/:shopId/messages', verifyToken, (req, res) => {
    try {
      const { shopId } = req.params;
      const { page = 1, pageSize = 50 } = req.query;
      const offset = (page - 1) * pageSize;
      
      const chat = db.prepare(`
        SELECT * FROM chats WHERE user_id = ? AND shop_id = ?
      `).get(req.user.id, shopId);
      
      if (!chat) {
        return res.json({
          code: 200,
          message: '获取成功',
          data: { list: [] }
        });
      }
      
      const messages = db.prepare(`
        SELECT * FROM chat_messages
        WHERE chat_id = ?
        ORDER BY created_at ASC
        LIMIT ? OFFSET ?
      `).all(chat.id, parseInt(pageSize), offset);
      
      db.prepare(`
        UPDATE chats SET unread_count = 0 WHERE id = ?
      `).run(chat.id);
      
      res.json({
        code: 200,
        message: '获取成功',
        data: { list: messages }
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
  
  router.post('/chats/:shopId/messages', verifyToken, (req, res) => {
    try {
      const { shopId } = req.params;
      const { content, type = 'text' } = req.body;
      
      if (!content) {
        return res.status(400).json({
          code: 400,
          message: '消息内容不能为空',
          data: null
        });
      }
      
      let chat = db.prepare(`
        SELECT * FROM chats WHERE user_id = ? AND shop_id = ?
      `).get(req.user.id, shopId);
      
      if (!chat) {
        const result = db.prepare(`
          INSERT INTO chats (user_id, shop_id, last_message, last_time)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `).run(req.user.id, shopId, content);
        chat = { id: result.lastInsertRowid };
      } else {
        db.prepare(`
          UPDATE chats SET last_message = ?, last_time = CURRENT_TIMESTAMP WHERE id = ?
        `).run(content, chat.id);
      }
      
      const result = db.prepare(`
        INSERT INTO chat_messages (chat_id, sender_id, sender_type, content, type)
        VALUES (?, ?, ?, ?, ?)
      `).run(chat.id, req.user.id, 'user', content, type);
      
      setTimeout(() => {
        db.prepare(`
          INSERT INTO chat_messages (chat_id, sender_id, sender_type, content, type)
          VALUES (?, ?, ?, ?, ?)
        `).run(chat.id, shopId, 'shop', '您好，请问有什么可以帮您的？', 'text');
        
        db.prepare(`
          UPDATE chats SET last_message = ?, unread_count = unread_count + 1 WHERE id = ?
        `).run('您好，请问有什么可以帮您的？', chat.id);
      }, 1000);
      
      const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(result.lastInsertRowid);
      
      res.json({
        code: 200,
        message: '发送成功',
        data: message
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
