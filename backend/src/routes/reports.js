const express = require('express')
const router = express.Router()
const reportGenerator = require('../services/reportGenerator')

router.post('/generate', async (req, res) => {
  try {
    const { creditCode, accountManager, authFile } = req.body
    const report = await reportGenerator.generateReport(creditCode, accountManager, authFile)
    res.json({ success: true, data: report })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.post('/:reportNo/regenerate', async (req, res) => {
  try {
    const { accountManager } = req.body
    const report = await reportGenerator.regenerateReport(req.params.reportNo, accountManager)
    res.json({ success: true, data: report })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.post('/:id/export', async (req, res) => {
  try {
    const { exportedBy } = req.body
    const result = await reportGenerator.exportReport(req.params.id, exportedBy)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const report = await reportGenerator.getReport(req.params.id)
    if (!report) {
      return res.status(404).json({ success: false, error: '报告不存在' })
    }
    res.json({ success: true, data: report })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const reports = await reportGenerator.getReportList()
    res.json({ success: true, data: reports })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

module.exports = router
