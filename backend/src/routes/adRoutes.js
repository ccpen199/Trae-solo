const express = require('express')
const router = express.Router()
const db = require('../models/database')

router.get('/', async (req, res) => {
  try {
    const ads = await db.query('SELECT * FROM ads WHERE is_active = 1 ORDER BY sort_order')
    res.json({ code: 200, data: ads })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

module.exports = router