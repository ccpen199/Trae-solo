import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/stats', (req: Request, res: Response): void => {
  const { region, startDate, endDate } = req.query

  let whereClause = '1=1'
  const params: any[] = []

  if (startDate) {
    whereClause += ' AND verify_time >= ?'
    params.push(startDate)
  }
  if (endDate) {
    whereClause += ' AND verify_time <= ?'
    params.push(endDate)
  }

  const totalVerified = db.prepare(`
    SELECT COUNT(*) as count FROM certifications WHERE status = 'success' AND ${whereClause}
  `).get(...params) as { count: number }

  const totalFailed = db.prepare(`
    SELECT COUNT(*) as count FROM certifications WHERE status = 'failed' AND ${whereClause}
  `).get(...params) as { count: number }

  const todayStr = new Date().toISOString().replace('T', ' ').substring(0, 10)
  const todayCount = db.prepare(`
    SELECT COUNT(*) as count FROM certifications WHERE DATE(verify_time) = ? AND ${whereClause}
  `).get(todayStr, ...params) as { count: number }

  const monthlyTrend = db.prepare(`
    SELECT DATE(verify_time) as date, COUNT(*) as count
    FROM certifications
    WHERE verify_time IS NOT NULL AND ${whereClause}
    GROUP BY DATE(verify_time)
    ORDER BY date DESC
    LIMIT 30
  `).all(...params)

  const regionDistribution = db.prepare(`
    SELECT
      CASE
        WHEN SUBSTR(id_card, 1, 4) = '3701' THEN '济南市'
        WHEN SUBSTR(id_card, 1, 4) = '3702' THEN '青岛市'
        WHEN SUBSTR(id_card, 1, 4) = '3706' THEN '烟台市'
        WHEN SUBSTR(id_card, 1, 4) = '3707' THEN '潍坊市'
        WHEN SUBSTR(id_card, 1, 4) = '3713' THEN '临沂市'
        WHEN SUBSTR(id_card, 1, 4) = '3708' THEN '济宁市'
        WHEN SUBSTR(id_card, 1, 4) = '3703' THEN '淄博市'
        WHEN SUBSTR(id_card, 1, 4) = '3710' THEN '威海市'
        WHEN SUBSTR(id_card, 1, 4) = '3714' THEN '德州市'
        WHEN SUBSTR(id_card, 1, 4) = '3709' THEN '泰安市'
        ELSE '其他'
      END as region,
      COUNT(*) as count
    FROM certifications
    WHERE ${whereClause}
    GROUP BY region
    ORDER BY count DESC
  `).all(...params)

  const failureReasons = db.prepare(`
    SELECT failure_reason as reason, COUNT(*) as count
    FROM certifications
    WHERE status = 'failed' AND failure_reason IS NOT NULL AND ${whereClause}
    GROUP BY failure_reason
    ORDER BY count DESC
  `).all(...params)

  const hourlyDistribution = db.prepare(`
    SELECT CAST(STRFTIME('%H', verify_time) AS INTEGER) as hour, COUNT(*) as count
    FROM certifications
    WHERE verify_time IS NOT NULL AND ${whereClause}
    GROUP BY hour
    ORDER BY hour
  `).all(...params)

  res.json({
    success: true,
    data: {
      totalVerified: totalVerified.count,
      totalFailed: totalFailed.count,
      todayCount: todayCount.count,
      monthlyTrend,
      regionDistribution,
      failureReasons,
      hourlyDistribution
    }
  })
})

export default router
