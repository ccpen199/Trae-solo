const express = require('express');
const router = express.Router();
const { generateId } = require('../utils');

module.exports = (db) => {
  router.get('/', (req, res) => {
    try {
      const { recipient_id, status, related_type } = req.query;
      
      let query = `
        SELECT m.*, u.name as recipient_name
        FROM messages m
        LEFT JOIN users u ON m.recipient_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (recipient_id) {
        query += ' AND m.recipient_id = ?';
        params.push(recipient_id);
      }

      if (status) {
        query += ' AND m.status = ?';
        params.push(status);
      }

      if (related_type) {
        query += ' AND m.related_type = ?';
        params.push(related_type);
      }

      query += ' ORDER BY m.created_at DESC';

      const messages = db.prepare(query).all(...params);
      res.json({ success: true, data: messages });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/unread/count', (req, res) => {
    try {
      const { recipient_id } = req.query;
      
      if (!recipient_id) {
        return res.status(400).json({ 
          success: false, 
          message: '接收人ID为必填项' 
        });
      }

      const count = db.prepare(`
        SELECT COUNT(*) as count 
        FROM messages 
        WHERE recipient_id = ? AND status = 'UNREAD'
      `).get(recipient_id);

      res.json({ 
        success: true, 
        data: { 
          unread_count: count.count 
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      const message = db.prepare(`
        SELECT m.*, u.name as recipient_name
        FROM messages m
        LEFT JOIN users u ON m.recipient_id = u.id
        WHERE m.id = ?
      `).get(id);
      
      if (!message) {
        return res.status(404).json({ success: false, message: '消息不存在' });
      }

      res.json({ success: true, data: message });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/', (req, res) => {
    try {
      const { recipient_id, title, content, related_type, related_id } = req.body;

      if (!recipient_id || !title) {
        return res.status(400).json({ 
          success: false, 
          message: '接收人ID和标题为必填项' 
        });
      }

      const id = generateId();

      const insertMessage = db.prepare(`
        INSERT INTO messages (
          id, recipient_id, title, content, related_type, related_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      insertMessage.run(
        id,
        recipient_id,
        title,
        content,
        related_type,
        related_id,
        'UNREAD'
      );

      res.status(201).json({ 
        success: true, 
        data: { id } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.put('/:id/read', (req, res) => {
    try {
      const { id } = req.params;

      const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
      
      if (!message) {
        return res.status(404).json({ success: false, message: '消息不存在' });
      }

      if (message.status === 'READ') {
        return res.json({ success: true, data: { id, status: 'READ' } });
      }

      db.prepare(`
        UPDATE messages 
        SET status = 'READ'
        WHERE id = ?
      `).run(id);

      res.json({ 
        success: true, 
        data: { id, status: 'READ' } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.put('/read/batch', (req, res) => {
    try {
      const { message_ids, recipient_id } = req.body;

      if (!message_ids || !Array.isArray(message_ids)) {
        return res.status(400).json({ 
          success: false, 
          message: '消息ID列表为必填项且必须为数组' 
        });
      }

      const placeholders = message_ids.map(() => '?').join(',');
      
      let query = `
        UPDATE messages 
        SET status = 'READ'
        WHERE id IN (${placeholders})
      `;
      const params = [...message_ids];

      if (recipient_id) {
        query += ' AND recipient_id = ?';
        params.push(recipient_id);
      }

      const result = db.prepare(query).run(...params);

      res.json({ 
        success: true, 
        data: { 
          updated_count: result.changes 
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.put('/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, status } = req.body;

      const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
      
      if (!message) {
        return res.status(404).json({ success: false, message: '消息不存在' });
      }

      let updateFields = [];
      let updateParams = [];

      if (title) {
        updateFields.push('title = ?');
        updateParams.push(title);
      }

      if (content) {
        updateFields.push('content = ?');
        updateParams.push(content);
      }

      if (status) {
        const validStatuses = ['UNREAD', 'READ'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ 
            success: false, 
            message: '无效的消息状态' 
          });
        }
        updateFields.push('status = ?');
        updateParams.push(status);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: '没有需要更新的字段' 
        });
      }

      updateParams.push(id);
      const query = `UPDATE messages SET ${updateFields.join(', ')} WHERE id = ?`;
      db.prepare(query).run(...updateParams);

      res.json({ success: true, data: { id } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.delete('/:id', (req, res) => {
    try {
      const { id } = req.params;

      const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
      
      if (!message) {
        return res.status(404).json({ success: false, message: '消息不存在' });
      }

      db.prepare('DELETE FROM messages WHERE id = ?').run(id);

      res.json({ success: true, data: { id } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
