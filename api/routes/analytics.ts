import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'
import type { ApiResponse } from '../../shared/types.js'

const router = Router()

const extractKeywords = (text: string): string[] => {
  if (!text) return []
  const separators = /[，,、。；;！!\s]+/
  return text.split(separators).filter(k => k.length > 0 && k.length < 20)
}

router.get('/drug-stats', (req: Request, res: Response<ApiResponse>): void => {
  try {
    const stmt = db.prepare(`
      SELECT 
        d.id as drug_id,
        d.name as drug_name,
        COUNT(r.id) as report_count,
        SUM(CASE WHEN r.severity = 'severe' OR r.severity = 'life-threatening' OR r.severity = 'fatal' THEN 1 ELSE 0 END) as severe_count
      FROM drugs d
      LEFT JOIN reports r ON d.id = r.drug_id
      GROUP BY d.id, d.name
      ORDER BY report_count DESC
      LIMIT 10
    `)
    const data = stmt.all()

    res.json({
      success: true,
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch drug stats',
    })
  }
})

router.get('/reaction-stats', (req: Request, res: Response<ApiResponse>): void => {
  try {
    const stmt = db.prepare(`
      SELECT reaction
      FROM reports
      WHERE reaction IS NOT NULL AND reaction != ''
    `)
    const rows = stmt.all() as { reaction: string }[]

    const keywordCount: Record<string, number> = {}
    for (const row of rows) {
      const keywords = extractKeywords(row.reaction)
      for (const keyword of keywords) {
        keywordCount[keyword] = (keywordCount[keyword] || 0) + 1
      }
    }

    const data = Object.entries(keywordCount)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)

    res.json({
      success: true,
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reaction stats',
    })
  }
})

router.get('/severity-stats', (req: Request, res: Response<ApiResponse>): void => {
  try {
    const stmt = db.prepare(`
      SELECT 
        severity,
        COUNT(*) as count
      FROM reports
      WHERE severity IS NOT NULL
      GROUP BY severity
      ORDER BY 
        CASE severity
          WHEN 'mild' THEN 1
          WHEN 'moderate' THEN 2
          WHEN 'severe' THEN 3
          WHEN 'life-threatening' THEN 4
          WHEN 'fatal' THEN 5
          ELSE 6
        END
    `)
    const data = stmt.all()

    res.json({
      success: true,
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch severity stats',
    })
  }
})

router.get('/timeline', (req: Request, res: Response<ApiResponse>): void => {
  try {
    const stmt = db.prepare(`
      SELECT 
        STRFTIME('%Y-%m', created_at) as month,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
        SUM(CASE WHEN status = 'reported' THEN 1 ELSE 0 END) as reported_count
      FROM reports
      WHERE created_at >= DATE('now', '-6 months')
      GROUP BY STRFTIME('%Y-%m', created_at)
      ORDER BY month ASC
    `)
    const data = stmt.all()

    res.json({
      success: true,
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch timeline',
    })
  }
})

router.get('/duplicates', (req: Request, res: Response<ApiResponse>): void => {
  try {
    const stmt = db.prepare(`
      SELECT 
        r1.id as report_id,
        r1.report_no,
        r1.patient_name,
        r1.drug_name,
        r1.reaction,
        r1.created_at,
        COUNT(r2.id) as duplicate_count
      FROM reports r1
      LEFT JOIN reports r2 ON 
        r1.id != r2.id
        AND r1.patient_name = r2.patient_name
        AND r1.drug_name = r2.drug_name
        AND r1.reaction = r2.reaction
        AND ABS(JULIANDAY(r1.created_at) - JULIANDAY(r2.created_at)) <= 30
      WHERE r1.patient_name IS NOT NULL 
        AND r1.drug_name IS NOT NULL 
        AND r1.reaction IS NOT NULL
      GROUP BY r1.id
      HAVING duplicate_count > 0
      ORDER BY duplicate_count DESC
      LIMIT 20
    `)
    const data = stmt.all()

    res.json({
      success: true,
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch duplicates',
    })
  }
})

export default router
