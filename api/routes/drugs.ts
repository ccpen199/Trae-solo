import { Router, type Request, type Response } from 'express'
import db, { toCamelCase } from '../db/index.js'
import type { Drug, ApiResponse, PaginatedResponse } from '../../shared/types.js'

const router = Router()

router.get('/', (req: Request, res: Response<PaginatedResponse<Drug>>): void => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = req.query.search as string || ''
    const offset = (page - 1) * pageSize

    let whereClause = ''
    const params: Record<string, unknown> = {}

    if (search) {
      whereClause = 'WHERE name LIKE @search OR batch_number LIKE @search OR generic_name LIKE @search OR manufacturer LIKE @search'
      params.search = `%${search}%`
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM drugs ${whereClause}`)
    const { count } = countStmt.get(params) as { count: number }

    const queryStmt = db.prepare(`
      SELECT * FROM drugs ${whereClause}
      ORDER BY created_at DESC
      LIMIT @pageSize OFFSET @offset
    `)
    const rows = queryStmt.all({ ...params, pageSize, offset }) as Record<string, unknown>[]
    const drugs = rows.map(row => toCamelCase<Drug>(row))

    res.json({
      success: true,
      data: drugs,
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
      error: error instanceof Error ? error.message : 'Failed to fetch drugs',
    })
  }
})

router.get('/:id', (req: Request, res: Response<ApiResponse<Drug>>): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare('SELECT * FROM drugs WHERE id = @id')
    const row = stmt.get({ id }) as Record<string, unknown> | undefined

    if (!row) {
      res.status(404).json({
        success: false,
        error: 'Drug not found',
      })
      return
    }

    res.json({
      success: true,
      data: toCamelCase<Drug>(row),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch drug',
    })
  }
})

router.post('/', (req: Request, res: Response<ApiResponse<Drug>>): void => {
  try {
    const { name, genericName, batchNumber, manufacturer, holder, indications, risks } = req.body

    const requiredFields = ['name', 'genericName', 'batchNumber', 'manufacturer', 'holder', 'indications', 'risks']
    const fieldLabels: Record<string, string> = {
      name: '药品名称',
      genericName: '通用名',
      batchNumber: '批号',
      manufacturer: '厂家',
      holder: '上市许可持有人',
      indications: '适应症',
      risks: '风险信息',
    }
    const missing = requiredFields.filter(field => !req.body[field]?.trim())

    if (missing.length > 0) {
      res.status(400).json({
        success: false,
        error: `缺少必填字段：${missing.map(f => fieldLabels[f]).join('、')}`,
      })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO drugs (name, generic_name, batch_number, manufacturer, holder, indications, risks)
      VALUES (@name, @genericName, @batchNumber, @manufacturer, @holder, @indications, @risks)
    `)
    const result = stmt.run({
      name,
      genericName,
      batchNumber,
      manufacturer,
      holder,
      indications,
      risks,
    })

    const selectStmt = db.prepare('SELECT * FROM drugs WHERE id = @id')
    const row = selectStmt.get({ id: result.lastInsertRowid }) as Record<string, unknown>

    res.status(201).json({
      success: true,
      data: toCamelCase<Drug>(row),
      message: 'Drug created successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create drug',
    })
  }
})

router.put('/:id', (req: Request, res: Response<ApiResponse<Drug>>): void => {
  try {
    const { id } = req.params
    const { name, genericName, batchNumber, manufacturer, holder, indications, risks } = req.body

    const checkStmt = db.prepare('SELECT id FROM drugs WHERE id = @id')
    const exists = checkStmt.get({ id })
    if (!exists) {
      res.status(404).json({
        success: false,
        error: 'Drug not found',
      })
      return
    }

    const requiredFields = ['name', 'genericName', 'batchNumber', 'manufacturer', 'holder', 'indications', 'risks']
    const fieldLabels: Record<string, string> = {
      name: '药品名称',
      genericName: '通用名',
      batchNumber: '批号',
      manufacturer: '厂家',
      holder: '上市许可持有人',
      indications: '适应症',
      risks: '风险信息',
    }
    const missing = requiredFields.filter(field => !req.body[field]?.trim())

    if (missing.length > 0) {
      res.status(400).json({
        success: false,
        error: `缺少必填字段：${missing.map(f => fieldLabels[f]).join('、')}`,
      })
      return
    }

    const stmt = db.prepare(`
      UPDATE drugs
      SET name = @name,
          generic_name = @genericName,
          batch_number = @batchNumber,
          manufacturer = @manufacturer,
          holder = @holder,
          indications = @indications,
          risks = @risks,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `)
    stmt.run({
      id,
      name,
      genericName,
      batchNumber,
      manufacturer,
      holder,
      indications,
      risks,
    })

    const selectStmt = db.prepare('SELECT * FROM drugs WHERE id = @id')
    const row = selectStmt.get({ id }) as Record<string, unknown>

    res.json({
      success: true,
      data: toCamelCase<Drug>(row),
      message: 'Drug updated successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update drug',
    })
  }
})

router.delete('/:id', (req: Request, res: Response<ApiResponse>): void => {
  try {
    const { id } = req.params

    const checkStmt = db.prepare('SELECT id FROM drugs WHERE id = @id')
    const exists = checkStmt.get({ id })
    if (!exists) {
      res.status(404).json({
        success: false,
        error: 'Drug not found',
      })
      return
    }

    const reportCount = db.prepare('SELECT COUNT(*) as count FROM reports WHERE drug_id = @id').get({ id }) as { count: number }
    if (reportCount.count > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete drug with existing reports',
      })
      return
    }

    const stmt = db.prepare('DELETE FROM drugs WHERE id = @id')
    stmt.run({ id })

    res.json({
      success: true,
      message: 'Drug deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete drug',
    })
  }
})

export default router
