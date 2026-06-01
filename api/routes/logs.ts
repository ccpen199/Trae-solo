import { Router, type Request, type Response } from 'express'
import db, { toCamelCase } from '../db/index.js'
import type { ProcessLog, ApiResponse } from '../../shared/types.js'

const router = Router()

router.get('/', (req: Request, res: Response<ApiResponse<ProcessLog[]>>): void => {
  try {
    const { reportId } = req.query
    if (!reportId) {
      res.status(400).json({
        success: false,
        error: 'reportId is required',
      })
      return
    }

    const checkStmt = db.prepare('SELECT id FROM reports WHERE id = @id')
    const reportExists = checkStmt.get({ id: reportId })
    if (!reportExists) {
      res.status(404).json({
        success: false,
        error: 'Report not found',
      })
      return
    }

    const stmt = db.prepare(`
      SELECT * FROM process_logs
      WHERE report_id = @reportId
      ORDER BY operate_at ASC
    `)
    const rows = stmt.all({ reportId }) as Record<string, unknown>[]
    const logs = rows.map(row => toCamelCase<ProcessLog>(row))

    res.json({
      success: true,
      data: logs,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch process logs',
    })
  }
})

router.get('/report/:reportId', (req: Request, res: Response<ApiResponse<ProcessLog[]>>): void => {
  try {
    const { reportId } = req.params

    const checkStmt = db.prepare('SELECT id FROM reports WHERE id = @id')
    const reportExists = checkStmt.get({ id: reportId })
    if (!reportExists) {
      res.status(404).json({
        success: false,
        error: 'Report not found',
      })
      return
    }

    const stmt = db.prepare(`
      SELECT * FROM process_logs
      WHERE report_id = @reportId
      ORDER BY operate_at ASC
    `)
    const rows = stmt.all({ reportId }) as Record<string, unknown>[]
    const logs = rows.map(row => toCamelCase<ProcessLog>(row))

    res.json({
      success: true,
      data: logs,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch process logs',
    })
  }
})

export default router
