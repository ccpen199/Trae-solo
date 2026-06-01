const express = require('express')
const router = express.Router()
const reportGenerator = require('../services/reportGenerator')

router.get('/', async (req, res) => {
  try {
    const logs = await reportGenerator.getAuditLogs()
    res.json({ success: true, data: logs })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

module.exports = router
