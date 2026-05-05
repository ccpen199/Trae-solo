const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const cache = require('../config/redis');
const { UnauthorizedError, ValidationError, NotFoundError } = require('../middleware/errorHandler');

const login = async (username, password) => {
  if (!username || !password) {
    throw new ValidationError('用户名和密码不能为空');
  }

  const result = await query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('用户名或密码错误');
  }

  const user = result.rows[0];

  if (user.status !== 'active') {
    throw new UnauthorizedError('用户已被禁用');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('用户名或密码错误');
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone,
    },
  };
};

const logout = async (token) => {
  if (token) {
    await cache.del(`token:${token}`);
  }
  return { success: true, message: '登出成功' };
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError('用户不存在');
  }

  const user = result.rows[0];

  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isOldPasswordValid) {
    throw new ValidationError('原密码错误');
  }

  if (newPassword.length < 6) {
    throw new ValidationError('新密码长度不能少于6位');
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  await query(
    'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [hashedPassword, userId]
  );

  return { success: true, message: '密码修改成功' };
};

const getCurrentUser = async (userId) => {
  const result = await query(
    `SELECT u.id, u.username, u.name, u.role, u.email, u.phone, u.status, 
            s.id as student_id, s.student_id as student_no, s.major, s.class, s.grade
     FROM users u
     LEFT JOIN students s ON u.id = s.user_id
     WHERE u.id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('用户不存在');
  }

  return result.rows[0];
};

module.exports = {
  login,
  logout,
  changePassword,
  getCurrentUser,
};