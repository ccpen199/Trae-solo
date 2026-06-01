const { db } = require('../models/database');

const getUsers = (req, res) => {
  const { role } = req.query;
  let query = 'SELECT * FROM users';
  const params = [];
  if (role) {
    query += ' WHERE role = ?';
    params.push(role);
  }
  const users = db.prepare(query).all(...params);
  res.json({ success: true, data: users });
};

const getUserById = (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }
  res.json({ success: true, data: user });
};

const createUser = (req, res) => {
  const { username, name, role } = req.body;
  try {
    const result = db.prepare('INSERT INTO users (username, name, role) VALUES (?, ?, ?)').run(username, name, role);
    res.json({ success: true, data: { id: result.lastInsertRowid, username, name, role } });
  } catch (err) {
    res.status(400).json({ success: false, message: '创建用户失败，用户名可能已存在' });
  }
};

module.exports = { getUsers, getUserById, createUser };
