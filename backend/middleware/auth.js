const { getQuery, runQuery, allQuery } = require('../database');
const crypto = require('crypto');

const SESSION_EXPIRE_HOURS = 24;

function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

async function createSession(userId) {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRE_HOURS * 60 * 60 * 1000).toISOString();
  
  runQuery(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `, [sessionId, userId, expiresAt]);
  
  return sessionId;
}

async function getSession(sessionId) {
  if (!sessionId) return null;
  
  const session = getQuery(`
    SELECT s.*, u.username, u.role
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `, [sessionId]);
  
  if (!session) return null;
  
  if (new Date(session.expires_at) < new Date()) {
    runQuery('DELETE FROM sessions WHERE id = ?', [sessionId]);
    return null;
  }
  
  return session;
}

async function deleteSession(sessionId) {
  return runQuery('DELETE FROM sessions WHERE id = ?', [sessionId]);
}

async function verifyLogin(username, password) {
  const user = getQuery(`
    SELECT * FROM users WHERE username = ? AND password = ?
  `, [username, password]);
  
  return user;
}

function authMiddleware(requiredRole = 'admin') {
  return async (req, res, next) => {
    const sessionId = req.headers['x-session-id'] || req.query.session_id;
    
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: '未登录，请先登录'
      });
    }
    
    const session = await getSession(sessionId);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: '登录已过期，请重新登录'
      });
    }
    
    if (requiredRole && session.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    
    req.user = {
      id: session.user_id,
      username: session.username,
      role: session.role
    };
    
    next();
  };
}

module.exports = {
  authMiddleware,
  createSession,
  getSession,
  deleteSession,
  verifyLogin
};
