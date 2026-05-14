const jwt = require('jsonwebtoken');
const db = require('./database');

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateOrderNo() {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(1000 + Math.random() * 9000).toString();
  return `HJJ${timestamp}${random}`;
}

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: '登录失效' });
  }
  req.userId = decoded.userId;
  next();
}

function success(data = null, message = '成功') {
  return { success: true, data, message };
}

function error(message = '失败') {
  return { success: false, message };
}

function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(params);
  } catch (err) {
    throw err;
  }
}

function queryOne(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.get(params);
  } catch (err) {
    throw err;
  }
}

function execute(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(params);
    return { lastID: parseInt(result.lastInsertRowid), changes: result.changes };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  generateCode,
  generateOrderNo,
  generateToken,
  verifyToken,
  authenticate,
  success,
  error,
  query,
  queryOne,
  execute
};
