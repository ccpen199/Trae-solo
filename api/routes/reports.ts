import { Router, type Request, type Response } from 'express'
import db, { toCamelCase } from '../db/index.js'
import type { Report, ApiResponse, PaginatedResponse, ReportStatus } from '../../shared/types.js'

const router = Router()

const generateReportNo = (): string => {
  const timestamp = Date.now()
  return `ADR${timestamp}`
}

const addProcessLog = (reportId: number, fromStatus: string | null, toStatus: string, operator: string, remark: string = ''): void => {
  const stmt = db.prepare(`
    INSERT INTO process_logs (report_id, from_status, to_status, operator, remark)
    VALUES (@reportId, @fromStatus, @toStatus, @operator, @remark)
  `)
  stmt.run({ reportId, fromStatus, toStatus, operator, remark })
}

const validateStatusTransition = (from: string, to: string): boolean => {
  const transitions: Record<string, string[]> = {
    draft: ['submitted'],
    submitted: ['reviewing', 'returned'],
    reviewing: ['reported', 'returned'],
    returned: ['submitted'],
    reported: ['receipt', 'archived'],
    receipt: ['archived'],
    archived: [],
  }
  return transitions[from]?.includes(to) || false
}

router.get('/', (req: Request, res: Response<PaginatedResponse<Report>>): void => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const status = req.query.status as string
    const drugId = req.query.drugId as string
    const search = req.query.search as string || ''
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const params: Record<string, unknown> = {}

    if (status) {
      conditions.push('status = @status')
      params.status = status
    }

    if (drugId) {
      conditions.push('drug_id = @drugId')
      params.drugId = parseInt(drugId)
    }

    if (search) {
      conditions.push('(patient_name LIKE @search OR report_no LIKE @search OR drug_name LIKE @search)')
      params.search = `%${search}%`
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM reports ${whereClause}`)
    const { count } = countStmt.get(params) as { count: number }

    const queryStmt = db.prepare(`
      SELECT * FROM reports ${whereClause}
      ORDER BY created_at DESC
      LIMIT @pageSize OFFSET @offset
    `)
    const rows = queryStmt.all({ ...params, pageSize, offset }) as Record<string, unknown>[]
    const reports = rows.map(row => toCamelCase<Report>(row))

    res.json({
      success: true,
      data: reports,
      pagination: {
        page,
        pageSize,
        total: count,
        totalPages: Math.ceil(count / pageSize),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reports',
    })
  }
})

router.get('/:id', (req: Request, res: Response<ApiResponse<Report>>): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare('SELECT * FROM reports WHERE id = @id')
    const row = stmt.get({ id }) as Record<string, unknown> | undefined

    if (!row) {
      res.status(404).json({
        success: false,
        error: 'Report not found',
      })
      return
    }

    res.json({
      success: true,
      data: toCamelCase<Report>(row),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch report',
    })
  }
})

router.post('/', (req: Request, res: Response<ApiResponse<Report>>): void => {
  try {
    const {
      patientName,
      patientGender,
      patientAge,
      patientId,
      drugId,
      drugName,
      dosage,
      route,
      startDate,
      reaction,
      reactionStart,
      severity,
      treatment,
      outcome,
      createdBy,
    } = req.body

    if (!patientName || !createdBy) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: patientName, createdBy',
      })
      return
    }

    const reportNo = generateReportNo()

    const stmt = db.prepare(`
      INSERT INTO reports (
        report_no, patient_name, patient_gender, patient_age, patient_id,
        drug_id, drug_name, dosage, route, start_date, reaction, reaction_start,
        severity, treatment, outcome, created_by, status
      ) VALUES (
        @reportNo, @patientName, @patientGender, @patientAge, @patientId,
        @drugId, @drugName, @dosage, @route, @startDate, @reaction, @reactionStart,
        @severity, @treatment, @outcome, @createdBy, 'draft'
      )
    `)

    const result = stmt.run({
      reportNo,
      patientName,
      patientGender: patientGender || null,
      patientAge: patientAge || null,
      patientId: patientId || null,
      drugId: drugId || null,
      drugName: drugName || null,
      dosage: dosage || null,
      route: route || null,
      startDate: startDate || null,
      reaction: reaction || null,
      reactionStart: reactionStart || null,
      severity: severity || null,
      treatment: treatment || null,
      outcome: outcome || null,
      createdBy,
    })

    const reportId = result.lastInsertRowid as number
    addProcessLog(reportId, null, 'draft', createdBy, '创建上报')

    const selectStmt = db.prepare('SELECT * FROM reports WHERE id = @id')
    const row = selectStmt.get({ id: reportId }) as Record<string, unknown>

    res.status(201).json({
      success: true,
      data: toCamelCase<Report>(row),
      message: 'Report created successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create report',
    })
  }
})

router.put('/:id', (req: Request, res: Response<ApiResponse<Report>>): void => {
  try {
    const { id } = req.params

    const checkStmt = db.prepare('SELECT * FROM reports WHERE id = @id')
    const existing = checkStmt.get({ id }) as Record<string, unknown> | undefined

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Report not found',
      })
      return
    }

    const currentStatus = existing.status as string
    if (currentStatus !== 'draft' && currentStatus !== 'returned') {
      res.status(400).json({
        success: false,
        error: 'Only draft or returned reports can be edited',
      })
      return
    }

    const {
      patientName,
      patientGender,
      patientAge,
      patientId,
      drugId,
      drugName,
      dosage,
      route,
      startDate,
      reaction,
      reactionStart,
      severity,
      treatment,
      outcome,
    } = req.body

    const stmt = db.prepare(`
      UPDATE reports
      SET patient_name = COALESCE(@patientName, patient_name),
          patient_gender = COALESCE(@patientGender, patient_gender),
          patient_age = COALESCE(@patientAge, patient_age),
          patient_id = COALESCE(@patientId, patient_id),
          drug_id = COALESCE(@drugId, drug_id),
          drug_name = COALESCE(@drugName, drug_name),
          dosage = COALESCE(@dosage, dosage),
          route = COALESCE(@route, route),
          start_date = COALESCE(@startDate, start_date),
          reaction = COALESCE(@reaction, reaction),
          reaction_start = COALESCE(@reactionStart, reaction_start),
          severity = COALESCE(@severity, severity),
          treatment = COALESCE(@treatment, treatment),
          outcome = COALESCE(@outcome, outcome),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `)

    stmt.run({
      id,
      patientName: patientName || null,
      patientGender: patientGender || null,
      patientAge: patientAge || null,
      patientId: patientId || null,
      drugId: drugId || null,
      drugName: drugName || null,
      dosage: dosage || null,
      route: route || null,
      startDate: startDate || null,
      reaction: reaction || null,
      reactionStart: reactionStart || null,
      severity: severity || null,
      treatment: treatment || null,
      outcome: outcome || null,
    })

    const selectStmt = db.prepare('SELECT * FROM reports WHERE id = @id')
    const row = selectStmt.get({ id }) as Record<string, unknown>

    res.json({
      success: true,
      data: toCamelCase<Report>(row),
      message: 'Report updated successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update report',
    })
  }
})

const createStatusHandler = (targetStatus: ReportStatus, logMessage: string) => {
  return (req: Request, res: Response<ApiResponse<Report>>): void => {
    try {
      const { id } = req.params
      const { operator, remark } = req.body

      const checkStmt = db.prepare('SELECT * FROM reports WHERE id = @id')
      const existing = checkStmt.get({ id }) as Record<string, unknown> | undefined

      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Report not found',
        })
        return
      }

      const currentStatus = existing.status as string
      if (!validateStatusTransition(currentStatus, targetStatus)) {
        res.status(400).json({
          success: false,
          error: `Invalid status transition from ${currentStatus} to ${targetStatus}`,
        })
        return
      }

      const stmt = db.prepare(`
        UPDATE reports
        SET status = @targetStatus,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `)
      stmt.run({ id, targetStatus })

      addProcessLog(id as unknown as number, currentStatus, targetStatus, operator || 'system', remark || logMessage)

      const selectStmt = db.prepare('SELECT * FROM reports WHERE id = @id')
      const row = selectStmt.get({ id }) as Record<string, unknown>

      res.json({
        success: true,
        data: toCamelCase<Report>(row),
        message: `Report ${targetStatus} successfully`,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : `Failed to ${targetStatus} report`,
      })
    }
  }
}

router.post('/:id/submit', createStatusHandler('submitted', '提交初报'))
router.post('/:id/review', createStatusHandler('reviewing', '质控复核'))
router.post('/:id/return', createStatusHandler('returned', '退回补充'))
router.post('/:id/report', createStatusHandler('reported', '正式上报'))
router.post('/:id/receipt', createStatusHandler('receipt', '监管回执'))

export default router
