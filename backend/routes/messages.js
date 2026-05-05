const express = require('express');
const router = express.Router();
const rateLimiter = require('../middleware/rateLimiter');
const { containsSensitiveWord, censorSensitiveWords } = require('../utils/sensitiveWords');
const { allQuery, getQuery, runQuery } = require('../database');

router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE status = 1';
    const params = [];
    
    if (status !== undefined) {
      whereClause = 'WHERE status = ?';
      params.push(parseInt(status));
    }
    
    const totalResult = getQuery(`
      SELECT COUNT(*) as total FROM messages ${whereClause}
    `, params);
    
    const messages = allQuery(`
      SELECT id, name, content, reply, created_at 
      FROM messages 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    res.json({
      success: true,
      data: {
        list: messages,
        total: totalResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('留言列表获取失败:', error);
    res.status(500).json({ success: false, message: '获取留言列表失败' });
  }
});

router.post('/', rateLimiter(60000, 5), (req, res) => {
  try {
    const { name, email, content } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({ 
        success: false, 
        message: '姓名和留言内容不能为空' 
      });
    }
    
    if (name.trim().length === 0 || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '姓名和留言内容不能为空白' 
      });
    }
    
    if (content.length > 1000) {
      return res.status(400).json({ 
        success: false, 
        message: '留言内容不能超过1000个字符' 
      });
    }
    
    const hasSensitive = containsSensitiveWord(name) || containsSensitiveWord(content);
    const isSensitive = hasSensitive ? 1 : 0;
    
    const ip = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    
    const result = runQuery(`
      INSERT INTO messages (name, email, content, ip, user_agent, is_sensitive, status)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `, [
      censorSensitiveWords(name),
      email || '',
      censorSensitiveWords(content),
      ip,
      userAgent,
      isSensitive
    ]);
    
    res.json({
      success: true,
      message: isSensitive 
        ? '留言已提交，正在审核中' 
        : '留言已提交，等待审核通过后显示',
      data: {
        id: result.lastInsertRowid
      }
    });
  } catch (error) {
    console.error('留言提交失败:', error);
    res.status(500).json({ success: false, message: '留言提交失败，请稍后重试' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const message = getQuery('SELECT * FROM messages WHERE id = ?', [id]);
    if (!message) {
      return res.status(404).json({ success: false, message: '留言不存在' });
    }
    
    runQuery('DELETE FROM messages WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: '留言已删除'
    });
  } catch (error) {
    console.error('删除留言失败:', error);
    res.status(500).json({ success: false, message: '删除留言失败' });
  }
});

module.exports = router;
