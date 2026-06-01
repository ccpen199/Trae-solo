const db = require('../db');
const bcrypt = require('bcryptjs');
const { success, error, pagination } = require('../utils/response');

const getUsers = (req, res) => {
  const { page = 1, pageSize = 10, role } = req.query;
  let whereClause = ' WHERE 1=1';
  const params = [];

  if (role) {
    whereClause += ' AND role = ?';
    params.push(role);
  }

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM users' + whereClause);
  const { total } = countStmt.get(...params);

  const offset = (page - 1) * pageSize;
  const users = db.prepare(`
    SELECT id, username, name, role, phone, status, created_at
    FROM users ${whereClause} ORDER BY id ASC LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json(pagination(users, total, parseInt(page), parseInt(pageSize)));
};

const getNurses = (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM nurses n JOIN users u ON n.user_id = u.id');
  const { total } = countStmt.get();

  const nurses = db.prepare(`
    SELECT n.id, u.name, u.phone, n.license_no, n.qualifications as qualification,
           n.years_of_experience as experience_years, n.rating, n.skills, n.status
    FROM nurses n 
    JOIN users u ON n.user_id = u.id 
    ORDER BY n.id ASC LIMIT ? OFFSET ?
  `).all(parseInt(pageSize), offset);

  res.json(pagination(nurses, total, parseInt(page), parseInt(pageSize)));
};

const getUserById = (req, res) => {
  const { id } = req.params;
  const user = db.prepare('SELECT id, username, name, role, phone, status, created_at FROM users WHERE id = ?').get(id);
  
  if (!user) {
    return res.status(404).json(error('用户不存在'));
  }

  if (user.role === 'nurse') {
    const nurse = db.prepare('SELECT * FROM nurses WHERE user_id = ?').get(id);
    user.nurse_info = nurse || null;
  }

  res.json(success(user, '查询成功'));
};

const createUser = (req, res) => {
  const { username, password, name, role, phone } = req.body;

  if (!username || !password || !name || !role) {
    return res.status(400).json(error('缺少必要参数'));
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json(error('用户名已存在'));
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(`
    INSERT INTO users (username, password, name, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(username, hashedPassword, name, role, phone || null);
  const user = db.prepare('SELECT id, username, name, role, phone, status, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  
  res.status(201).json(success(user, '创建成功'));
};

const createNurse = (req, res) => {
  const { username, password, name, phone, license_no, qualification, experience_years, skills, status } = req.body;

  if (!username || !password || !name || !license_no) {
    return res.status(400).json(error('缺少必要参数'));
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json(error('用户名已存在'));
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, name, role, phone, status)
    VALUES (?, ?, ?, 'nurse', ?, ?)
  `);
  const userResult = insertUser.run(username, hashedPassword, name, phone || null, status || 'active');

  const insertNurse = db.prepare(`
    INSERT INTO nurses (user_id, license_no, qualifications, years_of_experience, skills, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertNurse.run(userResult.lastInsertRowid, license_no, qualification || '', experience_years || 0, skills || '', 'available');

  const nurse = db.prepare(`
    SELECT n.id, u.name, u.phone, n.license_no, n.qualifications as qualification,
           n.years_of_experience as experience_years, n.rating, n.skills, n.status
    FROM nurses n 
    JOIN users u ON n.user_id = u.id 
    WHERE n.user_id = ?
  `).get(userResult.lastInsertRowid);

  res.status(201).json(success(nurse, '创建成功'));
};

const updateUser = (req, res) => {
  const { id } = req.params;
  const { name, phone, status } = req.body;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

  if (!existing) {
    return res.status(404).json(error('用户不存在'));
  }

  db.prepare(`
    UPDATE users SET name = COALESCE(?, name),
    phone = COALESCE(?, phone), status = COALESCE(?, status),
    updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(name || existing.name, phone || existing.phone, status || existing.status, id);

  const user = db.prepare('SELECT id, username, name, role, phone, status, created_at FROM users WHERE id = ?').get(id);
  res.json(success(user, '更新成功'));
};

const updateNurse = (req, res) => {
  const { id } = req.params;
  const { name, phone, license_no, qualification, experience_years, skills, status } = req.body;
  
  const existing = db.prepare('SELECT * FROM nurses WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json(error('护士不存在'));
  }

  db.prepare(`
    UPDATE nurses SET 
      license_no = COALESCE(?, license_no),
      qualifications = COALESCE(?, qualifications),
      years_of_experience = COALESCE(?, years_of_experience),
      skills = COALESCE(?, skills),
      status = COALESCE(?, status)
    WHERE id = ?
  `).run(license_no || existing.license_no, qualification !== undefined ? qualification : existing.qualifications, 
        experience_years !== undefined ? experience_years : existing.years_of_experience, 
        skills !== undefined ? skills : existing.skills, status || existing.status, id);

  if (name || phone) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(existing.user_id);
    db.prepare(`
      UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?
    `).run(name || user.name, phone || user.phone, existing.user_id);
  }

  const nurse = db.prepare(`
    SELECT n.id, u.name, u.phone, n.license_no, n.qualifications as qualification,
           n.years_of_experience as experience_years, n.rating, n.skills, n.status
    FROM nurses n 
    JOIN users u ON n.user_id = u.id 
    WHERE n.id = ?
  `).get(id);

  res.json(success(nurse, '更新成功'));
};

const deleteUser = (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  
  if (!existing) {
    return res.status(404).json(error('用户不存在'));
  }

  if (existing.role === 'nurse') {
    db.prepare('DELETE FROM nurses WHERE user_id = ?').run(id);
  }
  
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json(success(null, '删除成功'));
};

module.exports = { 
  getUsers, 
  getNurses,
  getUserById, 
  createUser, 
  createNurse,
  updateUser,
  updateNurse,
  deleteUser 
};
