const db = require('../database/config');
const { ROLES, ROLE_LABELS } = require('../utils/constants');

const getUserById = (id) => {
  const stmt = db.prepare(`
    SELECT id, username, name, role, email, phone, is_active, created_at, updated_at
    FROM users
    WHERE id = ?
  `);

  return stmt.get(id);
};

const getUserByUsername = (username) => {
  const stmt = db.prepare(`
    SELECT * FROM users WHERE username = ?
  `);

  return stmt.get(username);
};

const getAllUsers = (options = {}) => {
  const { role, isActive, limit = 50, offset = 0 } = options;

  let conditions = ['1=1'];
  let params = [];

  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }
  if (isActive !== undefined) {
    conditions.push('is_active = ?');
    params.push(isActive ? 1 : 0);
  }

  const whereClause = conditions.join(' AND ');

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM users WHERE ${whereClause}
  `);
  const countResult = countStmt.get(...params);
  const total = countResult.total;

  params.push(limit, offset);
  const dataStmt = db.prepare(`
    SELECT id, username, name, role, email, phone, is_active, created_at, updated_at
    FROM users
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);

  const data = dataStmt.all(...params);

  return {
    total,
    data,
    limit,
    offset,
  };
};

const createUser = (userData) => {
  const { username, password, name, role, email, phone } = userData;

  const existing = getUserByUsername(username);
  if (existing) {
    return { success: false, message: '用户名已存在' };
  }

  if (!Object.values(ROLES).includes(role)) {
    return { success: false, message: '无效的角色类型' };
  }

  const stmt = db.prepare(`
    INSERT INTO users (username, password, name, role, email, phone, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `);

  const result = stmt.run(
    username,
    password,
    name,
    role,
    email || null,
    phone || null
  );

  return {
    success: true,
    data: {
      id: result.lastInsertRowid,
      username,
      name,
      role,
    },
  };
};

const updateUser = (id, userData) => {
  const { name, email, phone, isActive } = userData;

  const user = getUserById(id);
  if (!user) {
    return { success: false, message: '用户不存在' };
  }

  const stmt = db.prepare(`
    UPDATE users 
    SET name = ?, email = ?, phone = ?, is_active = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  const result = stmt.run(
    name || user.name,
    email !== undefined ? email : user.email,
    phone !== undefined ? phone : user.phone,
    isActive !== undefined ? (isActive ? 1 : 0) : user.is_active,
    id
  );

  if (result.changes === 0) {
    return { success: false, message: '用户未更新' };
  }

  return {
    success: true,
    data: {
      id,
      updated: true,
    },
  };
};

const updatePassword = (id, oldPassword, newPassword) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) {
    return { success: false, message: '用户不存在' };
  }

  if (user.password !== oldPassword) {
    return { success: false, message: '原密码错误' };
  }

  const stmt = db.prepare(`
    UPDATE users 
    SET password = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  const result = stmt.run(newPassword, id);

  return {
    success: result.changes > 0,
    data: {
      id,
      updated: result.changes > 0,
    },
  };
};

const getUsersByRole = (role) => {
  const stmt = db.prepare(`
    SELECT id, username, name, role, email, phone
    FROM users
    WHERE role = ? AND is_active = 1
    ORDER BY name ASC
  `);

  return stmt.all(role);
};

const getRoleList = () => {
  return Object.entries(ROLE_LABELS).map(([code, name]) => ({
    code,
    name,
  }));
};

const login = (username, password) => {
  const user = getUserByUsername(username);
  if (!user) {
    return { success: false, message: '用户不存在' };
  }

  if (user.password !== password) {
    return { success: false, message: '密码错误' };
  }

  if (!user.is_active) {
    return { success: false, message: '用户已禁用' };
  }

  return {
    success: true,
    data: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      roleLabel: ROLE_LABELS[user.role],
      email: user.email,
      phone: user.phone,
    },
  };
};

module.exports = {
  getUserById,
  getUserByUsername,
  getAllUsers,
  createUser,
  updateUser,
  updatePassword,
  getUsersByRole,
  getRoleList,
  login,
};
