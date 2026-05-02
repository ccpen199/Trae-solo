import { Router } from 'express'
import dashboardService from '../services/dashboardService.js'
import { StatusDisplayNames } from '../config/constants.js'

const router = Router()

router.get('/status-counts', async (req, res) => {
  try {
    const counts = await dashboardService.getStatusCounts()
    res.json({ success: true, data: counts })
  } catch (error) {
    console.error('Error getting status counts:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.get('/statistics', async (req, res) => {
  try {
    const dateRange = req.query.startDate && req.query.endDate
      ? { start: req.query.startDate, end: req.query.endDate }
      : null

    const stats = await dashboardService.getStatistics(dateRange)
    res.json({ success: true, data: stats })
  } catch (error) {
    console.error('Error getting statistics:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.get('/kanban', async (req, res) => {
  try {
    const kanbanData = await dashboardService.getKanbanData()
    const result = {}
    
    for (const [status, items] of Object.entries(kanbanData)) {
      result[status] = {
        statusName: StatusDisplayNames[status],
        count: items.length,
        items,
      }
    }
    
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Error getting kanban data:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.get('/recent-activities', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'system'
    const limit = parseInt(req.query.limit) || 20
    const activities = await dashboardService.getRecentActivities(userId, limit)
    res.json({ success: true, data: activities })
  } catch (error) {
    console.error('Error getting recent activities:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.get('/todo-counts', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'system'
    const counts = await dashboardService.getTodoCounts(userId)
    res.json({ success: true, data: counts })
  } catch (error) {
    console.error('Error getting todo counts:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

router.get('/exception-counts', async (req, res) => {
  try {
    const counts = await dashboardService.getExceptionCounts()
    res.json({ success: true, data: counts })
  } catch (error) {
    console.error('Error getting exception counts:', error)
    res.status(500).json({ success: false, errors: [error.message] })
  }
})

export default router
