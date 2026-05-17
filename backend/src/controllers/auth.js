const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getAsync, runAsync } = require('../database')
const { JWT_SECRET } = require('../middleware/auth')

async function register(req, res) {
  try {
    const { phone, password, nickname } = req.body
    
    if (!phone || !password) {
      return res.error('手机号和密码不能为空')
    }
    
    const existingUser = await getAsync('SELECT id FROM users WHERE phone = ?', [phone])
    if (existingUser) {
      return res.error('该手机号已注册')
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await runAsync(
      'INSERT INTO users (phone, password, nickname) VALUES (?, ?, ?)',
      [phone, hashedPassword, nickname || `用户${phone.slice(-4)}`]
    )
    
    const token = jwt.sign({ userId: result.lastID }, JWT_SECRET, { expiresIn: '7d' })
    const user = await getAsync('SELECT id, phone, nickname, avatar, total_duration, step_count, calories FROM users WHERE id = ?', [result.lastID])
    
    res.success({ user, token }, '注册成功')
  } catch (err) {
    res.error('注册失败: ' + err.message)
  }
}

async function login(req, res) {
  try {
    const { phone, password } = req.body
    
    if (!phone || !password) {
      return res.error('手机号和密码不能为空')
    }
    
    const user = await getAsync('SELECT * FROM users WHERE phone = ?', [phone])
    if (!user) {
      return res.error('用户不存在')
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.error('密码错误')
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    const { password: _, ...userInfo } = user
    
    res.success({ user: userInfo, token }, '登录成功')
  } catch (err) {
    res.error('登录失败: ' + err.message)
  }
}

async function getProfile(req, res) {
  res.success({ user: req.user })
}

module.exports = { register, login, getProfile }
