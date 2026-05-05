const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `SELECT a.*, u.username FROM admins a 
               LEFT JOIN users u ON a.user_id = u.id 
               WHERE 1=1`;
    let countSql = 'SELECT COUNT(*) as total FROM admins WHERE 1=1';
    const params = [];
    const countParams = [];

    if (keyword) {
      sql += ' AND (a.name LIKE ? OR a.phone LIKE ? OR a.email LIKE ?)';
      countSql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword);
      countParams.push(likeKeyword, likeKeyword, likeKeyword);
    }

    sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const admins = db.all(sql, params);
    const countResult = db.get(countSql, countParams);

    res.json({
      data: admins,
      total: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(countResult.total / pageSize)
    });
  } catch (error) {
    console.error('获取管理员列表错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const admin = db.get(
      `SELECT a.*, u.username FROM admins a 
       LEFT JOIN users u ON a.user_id = u.id 
       WHERE a.id = ?`,
      [id]
    );

    if (!admin) {
      return res.status(404).json({ message: '管理员不存在' });
    }

    res.json(admin);
  } catch (error) {
    console.error('获取管理员详情错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      username,
      password,
      name,
      email,
      phone,
    } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ message: '用户名、密码和姓名为必填项' });
    }

    const existingUser = db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const userId = uuidv4();
    const adminId = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
      'INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
      [userId, username, hashedPassword, 'admin']
    );

    db.run(
      `INSERT INTO admins (id, user_id, name, email, phone) 
       VALUES (?, ?, ?, ?, ?)`,
      [adminId, userId, name, email, phone]
    );

    const newAdmin = db.get(
      `SELECT a.*, u.username FROM admins a 
       LEFT JOIN users u ON a.user_id = u.id 
       WHERE a.id = ?`,
      [adminId]
    );

    res.status(201).json(newAdmin);
  } catch (error) {
    console.error('添加管理员错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      password,
      name,
      email,
      phone,
    } = req.body;

    const admin = db.get('SELECT * FROM admins WHERE id = ?', [id]);
    if (!admin) {
      return res.status(404).json({ message: '管理员不存在' });
    }

    if (username) {
      const existingUser = db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, admin.user_id]);
      if (existingUser) {
        return res.status(400).json({ message: '用户名已存在' });
      }

      const userUpdates = [];
      const userParams = [];

      userUpdates.push('username = ?');
      userParams.push(username);

      if (password) {
        userUpdates.push('password = ?');
        userParams.push(bcrypt.hashSync(password, 10));
      }

      userUpdates.push('updated_at = CURRENT_TIMESTAMP');
      userParams.push(admin.user_id);

      db.run(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`, userParams);
    } else if (password) {
      db.run(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [bcrypt.hashSync(password, 10), admin.user_id]
      );
    }

    const adminUpdates = [];
    const adminParams = [];

    if (name !== undefined) { adminUpdates.push('name = ?'); adminParams.push(name); }
    if (email !== undefined) { adminUpdates.push('email = ?'); adminParams.push(email); }
    if (phone !== undefined) { adminUpdates.push('phone = ?'); adminParams.push(phone); }

    if (adminUpdates.length > 0) {
      adminUpdates.push('updated_at = CURRENT_TIMESTAMP');
      adminParams.push(id);

      db.run(`UPDATE admins SET ${adminUpdates.join(', ')} WHERE id = ?`, adminParams);
    }

    const updatedAdmin = db.get(
      `SELECT a.*, u.username FROM admins a 
       LEFT JOIN users u ON a.user_id = u.id 
       WHERE a.id = ?`,
      [id]
    );

    res.json(updatedAdmin);
  } catch (error) {
    console.error('更新管理员错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const admin = db.get('SELECT * FROM admins WHERE id = ?', [id]);
    if (!admin) {
      return res.status(404).json({ message: '管理员不存在' });
    }

    const adminCount = db.get('SELECT COUNT(*) as count FROM admins');
    if (adminCount.count <= 1) {
      return res.status(400).json({ message: '至少需要保留一个管理员账户' });
    }

    db.run('DELETE FROM admins WHERE id = ?', [id]);
    db.run('DELETE FROM users WHERE id = ?', [admin.user_id]);

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除管理员错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

module.exports = router;
