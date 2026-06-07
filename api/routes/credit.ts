import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/records', (req: Request, res: Response): void => {
  try {
    const { page = '1', pageSize = '10', enterprise_id, category, level } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let whereClauses: string[] = []
    let params: any[] = []

    if (enterprise_id) {
      whereClauses.push('enterprise_id = ?')
      params.push(enterprise_id)
    }
    if (category) {
      whereClauses.push('category = ?')
      params.push(category)
    }
    if (level) {
      whereClauses.push('level = ?')
      params.push(level)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM credit_records ${whereSql}`)
    const { total } = countStmt.get(...params) as any

    const stmt = db.prepare(`
      SELECT cr.*, e.name as enterprise_name 
      FROM credit_records cr 
      LEFT JOIN enterprises e ON cr.enterprise_id = e.id
      ${whereSql}
      ORDER BY cr.id DESC
      LIMIT ? OFFSET ?
    `)
    const records = stmt.all(...params, limit, offset)

    res.json({ success: true, data: { list: records, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    console.error('Get credit records error:', error)
    res.status(500).json({ success: false, error: 'Failed to get credit records' })
  }
})

router.get('/records/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const record = db.prepare(`
      SELECT cr.*, e.name as enterprise_name 
      FROM credit_records cr 
      LEFT JOIN enterprises e ON cr.enterprise_id = e.id
      WHERE cr.id = ?
    `).get(id)

    if (!record) {
      res.status(404).json({ success: false, error: 'Credit record not found' })
      return
    }

    res.json({ success: true, data: record })
  } catch (error) {
    console.error('Get credit record detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to get credit record' })
  }
})

router.post('/records', (req: Request, res: Response): void => {
  try {
    const { enterprise_id, category, score, level, details, source, record_date } = req.body

    if (!enterprise_id || !category) {
      res.status(400).json({ success: false, error: 'enterprise_id and category are required' })
      return
    }

    const enterprise = db.prepare('SELECT id FROM enterprises WHERE id = ?').get(enterprise_id)
    if (!enterprise) {
      res.status(404).json({ success: false, error: 'Enterprise not found' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO credit_records (enterprise_id, category, score, level, details, source, record_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      enterprise_id,
      category,
      score || 100,
      level || 'A',
      details || null,
      source || null,
      record_date || null
    )

    const record = db.prepare('SELECT * FROM credit_records WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: record })
  } catch (error) {
    console.error('Create credit record error:', error)
    res.status(500).json({ success: false, error: 'Failed to create credit record' })
  }
})

router.put('/records/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { category, score, level, details, source, record_date } = req.body

    const existing = db.prepare('SELECT id FROM credit_records WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Credit record not found' })
      return
    }

    const stmt = db.prepare(`
      UPDATE credit_records 
      SET category = ?, score = ?, level = ?, details = ?, source = ?, record_date = ?
      WHERE id = ?
    `)
    stmt.run(category, score, level, details, source, record_date, id)

    const record = db.prepare('SELECT * FROM credit_records WHERE id = ?').get(id)
    res.json({ success: true, data: record })
  } catch (error) {
    console.error('Update credit record error:', error)
    res.status(500).json({ success: false, error: 'Failed to update credit record' })
  }
})

router.delete('/records/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const existing = db.prepare('SELECT id FROM credit_records WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Credit record not found' })
      return
    }

    db.prepare('DELETE FROM credit_records WHERE id = ?').run(id)
    res.json({ success: true, data: { message: 'Credit record deleted successfully' } })
  } catch (error) {
    console.error('Delete credit record error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete credit record' })
  }
})

router.post('/reports/generate', (req: Request, res: Response): void => {
  try {
    const { enterprise_id, report_type } = req.body

    if (!enterprise_id) {
      res.status(400).json({ success: false, error: 'enterprise_id is required' })
      return
    }

    const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(enterprise_id) as any
    if (!enterprise) {
      res.status(404).json({ success: false, error: 'Enterprise not found' })
      return
    }

    const records = db.prepare(`
      SELECT * FROM credit_records 
      WHERE enterprise_id = ? 
      ORDER BY id DESC
    `).all(enterprise_id)

    if (records.length === 0) {
      res.status(400).json({ success: false, error: 'No credit records found for this enterprise' })
      return
    }

    let totalScore = 0
    const categoryScores: any = {}

    for (const record of records as any[]) {
      totalScore += record.score
      if (!categoryScores[record.category]) {
        categoryScores[record.category] = []
      }
      categoryScores[record.category].push(record.score)
    }

    const overallScore = totalScore / records.length
    let overallLevel = 'A'

    if (overallScore >= 90) overallLevel = 'A'
    else if (overallScore >= 80) overallLevel = 'B'
    else if (overallScore >= 70) overallLevel = 'C'
    else if (overallScore >= 60) overallLevel = 'D'
    else overallLevel = 'E'

    const categoryAverages: any = {}
    for (const category in categoryScores) {
      const scores = categoryScores[category]
      categoryAverages[category] = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
    }

    const content = {
      enterprise: {
        name: enterprise.name,
        unified_code: enterprise.unified_code,
        type: enterprise.type,
        industry: enterprise.industry
      },
      overall_score: overallScore,
      overall_level: overallLevel,
      category_scores: categoryAverages,
      record_count: records.length,
      records: records,
      generated_at: new Date().toISOString()
    }

    const stmt = db.prepare(`
      INSERT INTO credit_reports (enterprise_id, report_type, overall_score, overall_level, content)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      enterprise_id,
      report_type || 'standard',
      overallScore,
      overallLevel,
      JSON.stringify(content)
    )

    const report = db.prepare('SELECT * FROM credit_reports WHERE id = ?').get(result.lastInsertRowid)

    res.json({
      success: true,
      data: {
        ...(report as object),
        content: content
      }
    })
  } catch (error) {
    console.error('Generate credit report error:', error)
    res.status(500).json({ success: false, error: 'Failed to generate credit report' })
  }
})

router.get('/reports', (req: Request, res: Response): void => {
  try {
    const { page = '1', pageSize = '10', enterprise_id } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let whereSql = ''
    let params: any[] = []

    if (enterprise_id) {
      whereSql = 'WHERE enterprise_id = ?'
      params.push(enterprise_id)
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM credit_reports ${whereSql}`)
    const { total } = countStmt.get(...params) as any

    const stmt = db.prepare(`
      SELECT cr.*, e.name as enterprise_name 
      FROM credit_reports cr 
      LEFT JOIN enterprises e ON cr.enterprise_id = e.id
      ${whereSql}
      ORDER BY cr.generated_at DESC
      LIMIT ? OFFSET ?
    `)
    const reports = stmt.all(...params, limit, offset)

    res.json({ success: true, data: { list: reports, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    console.error('Get credit reports error:', error)
    res.status(500).json({ success: false, error: 'Failed to get credit reports' })
  }
})

router.get('/reports/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const report = db.prepare(`
      SELECT cr.*, e.name as enterprise_name 
      FROM credit_reports cr 
      LEFT JOIN enterprises e ON cr.enterprise_id = e.id
      WHERE cr.id = ?
    `).get(id) as any

    if (!report) {
      res.status(404).json({ success: false, error: 'Credit report not found' })
      return
    }

    if (report.content) {
      report.content = JSON.parse(report.content)
    }

    res.json({ success: true, data: report })
  } catch (error) {
    console.error('Get credit report detail error:', error)
    res.status(500).json({ success: false, error: 'Failed to get credit report' })
  }
})

router.get('/reports/:id/export-pdf', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const report = db.prepare('SELECT * FROM credit_reports WHERE id = ?').get(id) as any
    if (!report) {
      res.status(404).json({ success: false, error: 'Credit report not found' })
      return
    }

    const content = report.content ? JSON.parse(report.content) : {}

    res.json({
      success: true,
      data: {
        message: 'PDF export placeholder - would generate actual PDF in production',
        report_id: id,
        enterprise_name: content.enterprise?.name,
        overall_score: content.overall_score,
        overall_level: content.overall_level,
        format: 'PDF',
        status: 'ready_for_export'
      }
    })
  } catch (error) {
    console.error('Export PDF error:', error)
    res.status(500).json({ success: false, error: 'Failed to export PDF' })
  }
})

router.get('/enterprise/:id/report', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(id) as any
    if (!enterprise) {
      res.status(404).json({ success: false, error: 'Enterprise not found' })
      return
    }

    let report = db.prepare(`
      SELECT * FROM credit_reports 
      WHERE enterprise_id = ? 
      ORDER BY generated_at DESC 
      LIMIT 1
    `).get(id) as any

    if (!report) {
      const records = db.prepare(`
        SELECT * FROM credit_records 
        WHERE enterprise_id = ? 
        ORDER BY id DESC
      `).all(id)

      if (records.length === 0) {
        res.status(400).json({ success: false, error: 'No credit records found for this enterprise' })
        return
      }

      let totalScore = 0
      const categoryScores: any = {}

      for (const record of records as any[]) {
        totalScore += record.score
        if (!categoryScores[record.category]) {
          categoryScores[record.category] = []
        }
        categoryScores[record.category].push(record.score)
      }

      const overallScore = totalScore / records.length
      let overallLevel = 'A'

      if (overallScore >= 90) overallLevel = 'A'
      else if (overallScore >= 80) overallLevel = 'B'
      else if (overallScore >= 70) overallLevel = 'C'
      else if (overallScore >= 60) overallLevel = 'D'
      else overallLevel = 'E'

      const categoryAverages: any = {}
      for (const category in categoryScores) {
        const scores = categoryScores[category]
        categoryAverages[category] = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
      }

      const content = {
        enterprise: {
          name: enterprise.name,
          unified_code: enterprise.unified_code,
          type: enterprise.type,
          industry: enterprise.industry
        },
        overall_score: overallScore,
        overall_level: overallLevel,
        category_scores: categoryAverages,
        record_count: records.length,
        records: records,
        generated_at: new Date().toISOString()
      }

      const stmt = db.prepare(`
        INSERT INTO credit_reports (enterprise_id, report_type, overall_score, overall_level, content)
        VALUES (?, ?, ?, ?, ?)
      `)
      const result = stmt.run(
        id,
        'standard',
        overallScore,
        overallLevel,
        JSON.stringify(content)
      )

      report = db.prepare('SELECT * FROM credit_reports WHERE id = ?').get(result.lastInsertRowid) as any
    }

    if (report.content) {
      report.content = JSON.parse(report.content)
    }

    res.json({ success: true, data: report })
  } catch (error) {
    console.error('Get enterprise credit report error:', error)
    res.status(500).json({ success: false, error: 'Failed to get enterprise credit report' })
  }
})

export default router
