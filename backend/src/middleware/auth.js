const jwt = require('jsonwebtoken')
const { getAsync } = require('../database')

const JWT_SECRET = process.env.JWT_SECRET || 'keep_fitness_app_secret_key_2026'

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.error('请先登录', 401)
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await getAsync('SELECT id, phone, nickname, avatar, total_duration, step_count, calories FROM users WHERE id = ?', [decoded.userId])
    
    if (!user) {
      return res.error('用户不存在', 401)
    }
    
    req.user = user
    next()
  } catch (err) {
    return res.error('登录已过期，请重新登录', 401)
  }
}

module.exports = { authMiddleware, JWT_SECRET }
