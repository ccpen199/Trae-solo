const express = require('express')
const router = express.Router()
const reportGenerator = require('../services/reportGenerator')

router.get('/', async (req, res) => {
  try {
    const history = await reportGenerator.getQueryHistory()
    res.json({ success: true, data: history })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

module.exports = router
