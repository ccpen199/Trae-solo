const express = require('express');
const router = express.Router();
const { generateId } = require('../utils');

module.exports = (db) => {
  router.post('/login', (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: '用户名和密码为必填项' 
        });
      }

      const user = db.prepare(
        'SELECT * FROM users WHERE username = ? AND password = ?'
      ).get(username, password);

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: '用户名或密码错误' 
        });
      }

      const { password: _, ...userWithoutPassword } = user;

      res.json({ 
        success: true, 
        data: userWithoutPassword 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/', (req, res) => {
    try {
      const { role } = req.query;
      
      let query = 'SELECT id, username, name, role, created_at FROM users WHERE 1=1';
      const params = [];

      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }

      query += ' ORDER BY created_at';

      const users = db.prepare(query).all(...params);
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      const user = db.prepare(
        'SELECT id, username, name, role, created_at FROM users WHERE id = ?'
      ).get(id);
      
      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/', (req, res) => {
    try {
      const { username, password, role, name } = req.body;

      if (!username || !password || !role || !name) {
        return res.status(400).json({ 
          success: false, 
          message: '所有字段为必填项' 
        });
      }

      const existingUser = db.prepare(
        'SELECT * FROM users WHERE username = ?'
      ).get(username);

      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: '用户名已存在' 
        });
      }

      const validRoles = ['DISPATCHER', 'YARD_WORKER', 'DRIVER', 'ADMIN', 'AUDITOR'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          success: false, 
          message: '无效的角色类型' 
        });
      }

      const id = generateId();

      const insertUser = db.prepare(`
        INSERT INTO users (id, username, password, role, name)
        VALUES (?, ?, ?, ?, ?)
      `);

      insertUser.run(id, username, password, role, name);

      res.status(201).json({ 
        success: true, 
        data: { id, username, name, role } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.put('/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { name, role, password } = req.body;

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      
      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      let updateFields = [];
      let updateParams = [];

      if (name) {
        updateFields.push('name = ?');
        updateParams.push(name);
      }

      if (role) {
        const validRoles = ['DISPATCHER', 'YARD_WORKER', 'DRIVER', 'ADMIN', 'AUDITOR'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ 
            success: false, 
            message: '无效的角色类型' 
          });
        }
        updateFields.push('role = ?');
        updateParams.push(role);
      }

      if (password) {
        updateFields.push('password = ?');
        updateParams.push(password);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: '没有需要更新的字段' 
        });
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateParams.push(id);

      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      db.prepare(query).run(...updateParams);

      res.json({ success: true, data: { id } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
