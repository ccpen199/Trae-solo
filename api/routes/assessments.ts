import { Router, type Request, type Response } from 'express'
import db, { toCamelCase } from '../db/index.js'
import type { Assessment, ApiResponse, FinalLevel } from '../../shared/types.js'

const router = Router()

router.get('/', (req: Request, res: Response<ApiResponse<Assessment[]>>): void => {
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
      SELECT * FROM assessments
      WHERE report_id = @reportId
      ORDER BY assessed_at DESC
    `)
    const rows = stmt.all({ reportId }) as Record<string, unknown>[]
    const assessments = rows.map(row => toCamelCase<Assessment>(row))

    res.json({
      success: true,
      data: assessments,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch assessments',
    })
  }
})

const calculateFinalLevel = (
  temporalRelation: number,
  withdrawalImprovement: number,
  rechallengeReaction: number,
  concomitantMedication: number,
  severityLevel: number
): FinalLevel => {
  const avg = (temporalRelation + withdrawalImprovement + rechallengeReaction + concomitantMedication + severityLevel) / 5
  if (avg >= 8) return 'definite'
  if (avg >= 6) return 'probable'
  if (avg >= 4) return 'possible'
  return 'unlikely'
}

const validateScore = (score: number): boolean => {
  return typeof score === 'number' && score >= 0 && score <= 10
}

router.post('/', (req: Request, res: Response<ApiResponse<Assessment>>): void => {
  try {
    const {
      reportId,
      temporalRelation,
      withdrawalImprovement,
      rechallengeReaction,
      concomitantMedication,
      severityLevel,
      assessedBy,
      remark,
    } = req.body

    if (!reportId || !assessedBy) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: reportId, assessedBy',
      })
      return
    }

    const scores = [temporalRelation, withdrawalImprovement, rechallengeReaction, concomitantMedication, severityLevel]
    for (const score of scores) {
      if (!validateScore(score)) {
        res.status(400).json({
          success: false,
          error: 'All scores must be numbers between 0 and 10',
        })
        return
      }
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

    const finalLevel = calculateFinalLevel(
      temporalRelation,
      withdrawalImprovement,
      rechallengeReaction,
      concomitantMedication,
      severityLevel
    )

    const stmt = db.prepare(`
      INSERT INTO assessments (
        report_id, temporal_relation, withdrawal_improvement, rechallenge_reaction,
        concomitant_medication, severity_level, final_level, assessed_by, remark
      ) VALUES (
        @reportId, @temporalRelation, @withdrawalImprovement, @rechallengeReaction,
        @concomitantMedication, @severityLevel, @finalLevel, @assessedBy, @remark
      )
    `)

    const result = stmt.run({
      reportId,
      temporalRelation,
      withdrawalImprovement,
      rechallengeReaction,
      concomitantMedication,
      severityLevel,
      finalLevel,
      assessedBy,
      remark: remark || '',
    })

    const selectStmt = db.prepare('SELECT * FROM assessments WHERE id = @id')
    const row = selectStmt.get({ id: result.lastInsertRowid }) as Record<string, unknown>

    res.status(201).json({
      success: true,
      data: toCamelCase<Assessment>(row),
      message: 'Assessment created successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create assessment',
    })
  }
})

router.get('/report/:reportId', (req: Request, res: Response<ApiResponse<Assessment[]>>): void => {
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
      SELECT * FROM assessments
      WHERE report_id = @reportId
      ORDER BY assessed_at DESC
    `)
    const rows = stmt.all({ reportId }) as Record<string, unknown>[]
    const assessments = rows.map(row => toCamelCase<Assessment>(row))

    res.json({
      success: true,
      data: assessments,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch assessments',
    })
  }
})

export default router
