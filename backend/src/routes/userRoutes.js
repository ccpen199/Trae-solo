const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../models/database')

router.post('/register', async (req, res) => {
  try {
    const { phone, password, nickname } = req.body
    
    if (!phone || !password) {
      return res.status(400).json({ code: 400, message: '手机号和密码不能为空' })
    }
    
    const existingUser = await db.get('SELECT * FROM users WHERE phone = ?', [phone])
    if (existingUser) {
      return res.status(400).json({ code: 400, message: '该手机号已注册' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await db.run(
      'INSERT INTO users (phone, password, nickname) VALUES (?, ?, ?)',
      [phone, hashedPassword, nickname || `用户${phone.slice(-4)}`]
    )
    
    res.json({ code: 200, message: '注册成功', data: { userId: result.lastID } })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body
    
    if (!phone || !password) {
      return res.status(400).json({ code: 400, message: '手机号和密码不能为空' })
    }
    
    const user = await db.get('SELECT * FROM users WHERE phone = ?', [phone])
    if (!user) {
      return res.status(400).json({ code: 400, message: '手机号或密码错误' })
    }
    
    if (!user.password) {
      return res.status(400).json({ code: 400, message: '该账号未设置密码，请使用快捷登录' })
    }
    
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(400).json({ code: 400, message: '手机号或密码错误' })
    }
    
    const token = jwt.sign({ userId: user.id, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '7d' })
    
    res.json({ 
      code: 200, 
      message: '登录成功', 
      data: { 
        token, 
        user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar }
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.post('/login/taobao', async (req, res) => {
  try {
    const { openid, nickname, avatar } = req.body
    
    if (!openid) {
      return res.status(400).json({ code: 400, message: '参数错误' })
    }
    
    let user = await db.get('SELECT * FROM users WHERE taobao_openid = ?', [openid])
    
    if (!user) {
      user = await db.get('SELECT * FROM users WHERE phone = ?', [openid.slice(-11)])
      if (user) {
        await db.run('UPDATE users SET taobao_openid = ? WHERE id = ?', [openid, user.id])
      } else {
        const result = await db.run(
          'INSERT INTO users (phone, nickname, avatar, taobao_openid) VALUES (?, ?, ?, ?)',
          [`13800${Math.random().toString(16).slice(2, 8)}`, nickname || '淘宝用户', avatar, openid]
        )
        user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID])
      }
    }
    
    const token = jwt.sign({ userId: user.id, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '7d' })
    
    res.json({ 
      code: 200, 
      message: '淘宝授权登录成功', 
      data: { 
        token, 
        user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar }
      }
    })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.post('/login/alipay', async (req, res) => {
  try {
    const { openid, nickname, avatar } = req.body
    
    if (!openid) {
      return res.status(400).json({ code: 400, message: '参数错误' })
    }
    
    let user = await db.get('SELECT * FROM users WHERE alipay_openid = ?', [openid])
    
    if (!user) {
      user = await db.get('SELECT * FROM users WHERE phone = ?', [openid.slice(-11)])
      if (user) {
        await db.run('UPDATE users SET alipay_openid = ? WHERE id = ?', [openid, user.id])
      } else {
        const result = await db.run(
          'INSERT INTO users (phone, nickname, avatar, alipay_openid) VALUES (?, ?, ?, ?)',
          [`13900${Math.random().toString(16).slice(2, 8)}`, nickname || '支付宝用户', avatar, openid]
        )
        user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID])
      }
    }
    
    const token = jwt.sign({ userId: user.id, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '7d' })
    
    res.json({ 
      code: 200, 
      message: '支付宝授权登录成功', 
      data: { 
        token, 
        user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar }
      }
    })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.post('/logout', async (req, res) => {
  res.json({ code: 200, message: '退出成功' })
})

router.post('/password/reset', async (req, res) => {
  try {
    const { phone, password } = req.body
    
    if (!phone || !password) {
      return res.status(400).json({ code: 400, message: '手机号和密码不能为空' })
    }
    
    const user = await db.get('SELECT * FROM users WHERE phone = ?', [phone])
    if (!user) {
      return res.status(400).json({ code: 400, message: '该手机号未注册' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id])
    
    res.json({ code: 200, message: '密码重置成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

module.exports = router