const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authMiddleware, adminMiddleware, readerMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `SELECT r.*, u.username FROM readers r 
               LEFT JOIN users u ON r.user_id = u.id 
               WHERE 1=1`;
    let countSql = 'SELECT COUNT(*) as total FROM readers WHERE 1=1';
    const params = [];
    const countParams = [];

    if (keyword) {
      sql += ' AND (r.name LIKE ? OR r.phone LIKE ? OR r.email LIKE ? OR r.id_card LIKE ?)';
      countSql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR id_card LIKE ?)';
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword);
      countParams.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword);
    }

    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const [readers, countResult] = await Promise.all([
      db.all(sql, params),
      db.get(countSql, countParams)
    ]);

    res.json({
      data: readers,
      total: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(countResult.total / pageSize)
    });
  } catch (error) {
    console.error('获取读者列表错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const reader = await db.get(
      `SELECT r.*, u.username FROM readers r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`,
      [id]
    );

    if (!reader) {
      return res.status(404).json({ message: '读者不存在' });
    }

    if (req.user.role === 'reader' && reader.user_id !== req.user.id) {
      return res.status(403).json({ message: '无权查看该读者信息' });
    }

    res.json(reader);
  } catch (error) {
    console.error('获取读者详情错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/:id/borrow-records', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const reader = await db.get('SELECT * FROM readers WHERE id = ?', [id]);
    if (!reader) {
      return res.status(404).json({ message: '读者不存在' });
    }

    if (req.user.role === 'reader' && reader.user_id !== req.user.id) {
      return res.status(403).json({ message: '无权查看该读者借阅记录' });
    }

    let sql = `SELECT br.*, b.title, b.author, b.isbn 
               FROM borrow_records br 
               LEFT JOIN books b ON br.book_id = b.id 
               WHERE br.reader_id = ?`;
    let countSql = 'SELECT COUNT(*) as total FROM borrow_records WHERE reader_id = ?';
    const params = [id];
    const countParams = [id];

    if (status) {
      sql += ' AND br.status = ?';
      countSql += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    sql += ' ORDER BY br.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const [records, countResult] = await Promise.all([
      db.all(sql, params),
      db.get(countSql, countParams)
    ]);

    res.json({
      data: records,
      total: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(countResult.total / pageSize)
    });
  } catch (error) {
    console.error('获取读者借阅记录错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      username,
      password,
      name,
      gender,
      birth_date,
      email,
      phone,
      address,
      id_card
    } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ message: '用户名、密码和姓名为必填项' });
    }

    const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const userId = uuidv4();
    const readerId = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);

    await db.run(
      'INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
      [userId, username, hashedPassword, 'reader']
    );

    await db.run(
      `INSERT INTO readers (id, user_id, name, gender, birth_date, email, phone, address, id_card, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [readerId, userId, name, gender, birth_date, email, phone, address, id_card, 'active']
    );

    const newReader = await db.get(
      `SELECT r.*, u.username FROM readers r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`,
      [readerId]
    );

    res.status(201).json(newReader);
  } catch (error) {
    console.error('添加读者错误:', error);
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
      gender,
      birth_date,
      email,
      phone,
      address,
      id_card,
      status
    } = req.body;

    const reader = await db.get('SELECT * FROM readers WHERE id = ?', [id]);
    if (!reader) {
      return res.status(404).json({ message: '读者不存在' });
    }

    if (username) {
      const existingUser = await db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, reader.user_id]);
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
      userParams.push(reader.user_id);

      await db.run(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`, userParams);
    } else if (password) {
      await db.run(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [bcrypt.hashSync(password, 10), reader.user_id]
      );
    }

    const readerUpdates = [];
    const readerParams = [];

    if (name !== undefined) { readerUpdates.push('name = ?'); readerParams.push(name); }
    if (gender !== undefined) { readerUpdates.push('gender = ?'); readerParams.push(gender); }
    if (birth_date !== undefined) { readerUpdates.push('birth_date = ?'); readerParams.push(birth_date); }
    if (email !== undefined) { readerUpdates.push('email = ?'); readerParams.push(email); }
    if (phone !== undefined) { readerUpdates.push('phone = ?'); readerParams.push(phone); }
    if (address !== undefined) { readerUpdates.push('address = ?'); readerParams.push(address); }
    if (id_card !== undefined) { readerUpdates.push('id_card = ?'); readerParams.push(id_card); }
    if (status !== undefined) { readerUpdates.push('status = ?'); readerParams.push(status); }

    if (readerUpdates.length > 0) {
      readerUpdates.push('updated_at = CURRENT_TIMESTAMP');
      readerParams.push(id);

      await db.run(`UPDATE readers SET ${readerUpdates.join(', ')} WHERE id = ?`, readerParams);
    }

    const updatedReader = await db.get(
      `SELECT r.*, u.username FROM readers r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`,
      [id]
    );

    res.json(updatedReader);
  } catch (error) {
    console.error('更新读者错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const reader = await db.get('SELECT * FROM readers WHERE id = ?', [id]);
    if (!reader) {
      return res.status(404).json({ message: '读者不存在' });
    }

    const borrowRecords = await db.get('SELECT COUNT(*) as count FROM borrow_records WHERE reader_id = ? AND status = ?', [id, 'borrowed']);
    if (borrowRecords.count > 0) {
      return res.status(400).json({ message: '该读者有未归还的图书，无法删除' });
    }

    await db.run('DELETE FROM reservations WHERE reader_id = ?', [id]);
    await db.run('DELETE FROM borrow_records WHERE reader_id = ?', [id]);
    await db.run('DELETE FROM readers WHERE id = ?', [id]);
    await db.run('DELETE FROM users WHERE id = ?', [reader.user_id]);

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除读者错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

module.exports = router;
