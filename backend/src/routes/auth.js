const express = require('express')
const router = express.Router()
const db = require('../database')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')

router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空')
], (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg 
      })
    }

    const { username, password } = req.body

    const admin = db.prepare(`
      SELECT a.*, r.name as role_name, r.display_name as role_display_name 
      FROM admins a 
      JOIN roles r ON a.role_id = r.id 
      WHERE a.username = ?
    `).get(username)

    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      })
    }

    if (admin.status !== 1) {
      return res.status(403).json({ 
        success: false, 
        message: '账号已被禁用，请联系管理员' 
      })
    }

    const isPasswordValid = bcrypt.compareSync(password, admin.password)
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      })
    }

    const token = jwt.sign(
      { userId: admin.id, username: admin.username, role: admin.role_name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role_name,
          roleName: admin.role_display_name
        }
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    })
  }
})

router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: '已退出登录'
  })
})

module.exports = router
