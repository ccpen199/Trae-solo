import { Router, Request, Response } from 'express'
import { success } from '../utils/response'
import { runQuery, runQueryOne } from '../utils/db'

const router = Router()

router.get('/dashboard-stats', (req: Request, res: Response) => {
  const totalWorkers = runQueryOne('SELECT COUNT(*) as count FROM workers')
  const totalEmployers = runQueryOne('SELECT COUNT(*) as count FROM employers')
  const totalJobs = runQueryOne('SELECT COUNT(*) as count FROM job_requirements')
  const publishedJobs = runQueryOne('SELECT COUNT(*) as count FROM job_requirements WHERE status = ?', ['published'])
  const pendingJobs = runQueryOne('SELECT COUNT(*) as count FROM job_requirements WHERE status IN (?, ?, ?)', ['pending_review', 'ai_reviewed', 'manual_reviewed'])
  const totalMatches = runQueryOne('SELECT COUNT(*) as count FROM job_matches')
  const totalContracts = runQueryOne('SELECT COUNT(*) as count FROM contracts')
  const signedContracts = runQueryOne('SELECT COUNT(*) as count FROM contracts WHERE status = ?', ['fully_signed'])
  const totalPayments = runQueryOne('SELECT COUNT(*) as count FROM wage_payments')
  const paidPayments = runQueryOne('SELECT COUNT(*) as count FROM wage_payments WHERE status = ?', ['paid'])
  const overduePayments = runQueryOne('SELECT COUNT(*) as count FROM wage_payments WHERE status = ?', ['overdue'])
  const totalTrades = runQueryOne('SELECT COUNT(*) as count FROM trades')
  const activeTrades = runQueryOne(`
    SELECT COUNT(DISTINCT trade_id) as count 
    FROM job_requirements 
    WHERE status = 'published'
  `)

  const avgDailyWage = runQueryOne(`
    SELECT AVG(daily_wage) as avg_wage 
    FROM job_requirements 
    WHERE status = 'published' AND daily_wage > 0
  `)

  const greenHealthWorkers = runQueryOne('SELECT COUNT(*) as count FROM workers WHERE health_status = ?', ['green'])
  const yellowHealthWorkers = runQueryOne('SELECT COUNT(*) as count FROM workers WHERE health_status = ?', ['yellow'])
  const redHealthWorkers = runQueryOne('SELECT COUNT(*) as count FROM workers WHERE health_status = ?', ['red'])

  const tradeShortage = runQueryOne(`
    SELECT 
      t.name,
      COUNT(DISTINCT w.id) as supply_count,
      COALESCE(SUM(CASE WHEN j.status = 'published' THEN j.quantity ELSE 0 END), 0) as demand_count,
      CASE 
        WHEN COUNT(DISTINCT w.id) > 0 THEN ROUND(COALESCE(SUM(CASE WHEN j.status = 'published' THEN j.quantity ELSE 0 END), 0) * 100.0 / COUNT(DISTINCT w.id), 1)
        ELSE 100.0
      END as shortage_index
    FROM trades t
    LEFT JOIN workers w ON (',' || replace(replace(w.trade_ids, '[', ''), ']', '') || ',' LIKE '%,' || t.id || ',%')
    LEFT JOIN job_requirements j ON j.trade_id = t.id AND j.status = 'published'
    GROUP BY t.id, t.name
    ORDER BY shortage_index DESC
    LIMIT 1
  `)

  success(res, {
    totalWorkers: totalWorkers?.count || 0,
    totalEmployers: totalEmployers?.count || 0,
    totalJobs: totalJobs?.count || 0,
    publishedJobs: publishedJobs?.count || 0,
    pendingJobs: pendingJobs?.count || 0,
    totalMatches: totalMatches?.count || 0,
    totalContracts: totalContracts?.count || 0,
    signedContracts: signedContracts?.count || 0,
    totalPayments: totalPayments?.count || 0,
    paidPayments: paidPayments?.count || 0,
    overduePayments: overduePayments?.count || 0,
    totalTrades: totalTrades?.count || 0,
    activeTrades: activeTrades?.count || 0,
    avgDailyWage: Math.round(avgDailyWage?.avg_wage || 0),
    tradeShortageIndex: tradeShortage?.shortage_index || 0,
    mostNeededTrade: tradeShortage?.name || '-',
    healthStatus: {
      green: greenHealthWorkers?.count || 0,
      yellow: yellowHealthWorkers?.count || 0,
      red: redHealthWorkers?.count || 0
    }
  })
})

router.get('/region-heatmap', (req: Request, res: Response) => {
  const regions = runQuery(`
    SELECT 
      CASE 
        WHEN address LIKE '%北京%' THEN '北京市'
        WHEN address LIKE '%上海%' THEN '上海市'
        WHEN address LIKE '%广州%' THEN '广州市'
        WHEN address LIKE '%深圳%' THEN '深圳市'
        WHEN address LIKE '%杭州%' THEN '杭州市'
        WHEN address LIKE '%成都%' THEN '成都市'
        WHEN address LIKE '%武汉%' THEN '武汉市'
        WHEN address LIKE '%南京%' THEN '南京市'
        ELSE '其他'
      END as region,
      COUNT(DISTINCT w.id) as worker_count,
      COUNT(DISTINCT j.id) as job_count,
      COALESCE(AVG(j.daily_wage), 0) as avg_wage
    FROM workers w
    LEFT JOIN job_requirements j ON j.status = 'published' AND (
      CASE 
        WHEN w.address LIKE '%北京%' THEN '北京市'
        WHEN w.address LIKE '%上海%' THEN '上海市'
        WHEN w.address LIKE '%广州%' THEN '广州市'
        WHEN w.address LIKE '%深圳%' THEN '深圳市'
        WHEN w.address LIKE '%杭州%' THEN '杭州市'
        WHEN w.address LIKE '%成都%' THEN '成都市'
        WHEN w.address LIKE '%武汉%' THEN '武汉市'
        WHEN w.address LIKE '%南京%' THEN '南京市'
        ELSE '其他'
      END
    ) = (
      CASE 
        WHEN j.project_address LIKE '%北京%' THEN '北京市'
        WHEN j.project_address LIKE '%上海%' THEN '上海市'
        WHEN j.project_address LIKE '%广州%' THEN '广州市'
        WHEN j.project_address LIKE '%深圳%' THEN '深圳市'
        WHEN j.project_address LIKE '%杭州%' THEN '杭州市'
        WHEN j.project_address LIKE '%成都%' THEN '成都市'
        WHEN j.project_address LIKE '%武汉%' THEN '武汉市'
        WHEN j.project_address LIKE '%南京%' THEN '南京市'
        ELSE '其他'
      END
    )
    WHERE w.id IS NOT NULL
    GROUP BY region
    ORDER BY worker_count DESC
  `)

  const result = regions.map(r => ({
    ...r,
    demandRatio: r.job_count > 0 ? Math.round((r.job_count / Math.max(r.worker_count, 1)) * 100) / 100 : 0
  }))

  success(res, result)
})

router.get('/trade-shortage', (req: Request, res: Response) => {
  const trades = runQuery(`
    SELECT 
      t.id as trade_id,
      t.name as trade_name,
      COUNT(DISTINCT w.id) as supply_count,
      SUM(CASE WHEN j.status = 'published' THEN j.quantity ELSE 0 END) as demand_count,
      COALESCE(AVG(j.daily_wage), 0) as avg_wage
    FROM trades t
    LEFT JOIN workers w ON (',' || replace(replace(w.trade_ids, '[', ''), ']', '') || ',' LIKE '%,' || t.id || ',%')
    LEFT JOIN job_requirements j ON j.trade_id = t.id
    GROUP BY t.id, t.name
    ORDER BY demand_count DESC
  `)

  const result = trades.map(t => {
    const shortageIndex = t.supply_count > 0 
      ? Math.round((t.demand_count / Math.max(t.supply_count, 1)) * 100) / 100 
      : t.demand_count > 0 ? 9.99 : 0
    
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (shortageIndex > 2) trend = 'up'
    else if (shortageIndex < 0.5) trend = 'down'

    return {
      tradeId: t.trade_id,
      tradeName: t.trade_name,
      shortageIndex,
      demandCount: t.demand_count || 0,
      supplyCount: t.supply_count || 0,
      avgWage: Math.round(t.avg_wage || 0),
      trend
    }
  })

  success(res, result.sort((a, b) => b.shortageIndex - a.shortageIndex))
})

router.get('/team-credit', (req: Request, res: Response) => {
  const teams = runQuery(`
    SELECT 
      e.id as team_id,
      e.company_name as team_name,
      e.credit_rating as credit_score,
      CASE 
        WHEN e.credit_rating >= 90 THEN 'A'
        WHEN e.credit_rating >= 80 THEN 'B'
        WHEN e.credit_rating >= 70 THEN 'C'
        ELSE 'D'
      END as rating,
      COUNT(DISTINCT j.id) as total_projects,
      COUNT(DISTINCT c.id) as total_contracts,
      COUNT(DISTINCT CASE WHEN wp.status = 'paid' THEN wp.id END) as on_time_payments,
      COUNT(DISTINCT CASE WHEN wp.status = 'overdue' THEN wp.id END) as overdue_count,
      COUNT(DISTINCT CASE WHEN wp.status = 'pending' THEN wp.id END) as pending_count,
      COUNT(DISTINCT CASE WHEN wp.status = 'disputed' THEN wp.id END) as disputed_count
    FROM employers e
    LEFT JOIN job_requirements j ON j.employer_id = e.id
    LEFT JOIN contracts c ON c.employer_id = e.id
    LEFT JOIN wage_payments wp ON wp.employer_id = e.id
    GROUP BY e.id, e.company_name, e.credit_rating
    ORDER BY credit_score DESC
  `)

  const result = teams.map(t => ({
    ...t,
    onTimeRate: t.total_contracts > 0 ? Math.round((t.on_time_payments / Math.max(t.total_contracts, 1)) * 100) : 0,
    complaintCount: t.complaint_count || 0
  }))

  success(res, result)
})

router.get('/wage-arrears-risk', (req: Request, res: Response) => {
  const risks = runQuery(`
    SELECT 
      e.id as employer_id,
      e.company_name,
      COUNT(wp.id) as overdue_count,
      COALESCE(SUM(CASE WHEN wp.status = 'overdue' THEN wp.amount ELSE 0 END), 0) as total_overdue_amount,
      e.credit_rating,
      COUNT(c.id) as total_contracts
    FROM employers e
    LEFT JOIN wage_payments wp ON wp.employer_id = e.id AND wp.status = 'overdue'
    LEFT JOIN contracts c ON c.employer_id = e.id
    GROUP BY e.id, e.company_name, e.credit_rating
    HAVING overdue_count > 0 OR (e.credit_rating < 70 AND total_contracts > 0)
    ORDER BY overdue_count DESC, total_overdue_amount DESC
  `)

  const result = risks.map(r => {
    let riskLevel: 'low' | 'medium' | 'high' | 'critical'
    let riskScore = 0

    if (r.overdue_count >= 5 || r.total_overdue_amount >= 100000) {
      riskLevel = 'critical'
      riskScore = 95
    } else if (r.overdue_count >= 3 || r.total_overdue_amount >= 50000) {
      riskLevel = 'high'
      riskScore = 80
    } else if (r.overdue_count >= 1 || r.credit_rating < 70) {
      riskLevel = 'medium'
      riskScore = 60
    } else {
      riskLevel = 'low'
      riskScore = 30
    }

    const measures = riskLevel === 'critical' 
      ? '立即启动欠薪预警，冻结雇主新发布权限，启动监管调查'
      : riskLevel === 'high'
      ? '列为重点监管对象，要求提交保证金，限制新合同签署'
      : riskLevel === 'medium'
      ? '增加巡查频次，要求雇主提交工资支付保障计划'
      : '正常监管，定期复核'

    return {
      id: r.employer_id,
      employerId: r.employer_id,
      companyName: r.company_name,
      riskLevel,
      riskScore,
      overdueCount: r.overdue_count || 0,
      totalOverdueAmount: r.total_overdue_amount || 0,
      warningDate: new Date().toISOString().split('T')[0],
      measures
    }
  })

  success(res, result)
})

router.get('/work-trend', (req: Request, res: Response) => {
  const last12Months: { month: string; jobCount: number; matchCount: number }[] = []
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    const jobs = runQueryOne(`
      SELECT COUNT(*) as count FROM job_requirements 
      WHERE strftime('%Y-%m', created_at) = ?
    `, [month])
    
    const matches = runQueryOne(`
      SELECT COUNT(*) as count FROM job_matches 
      WHERE strftime('%Y-%m', created_at) = ?
    `, [month])

    last12Months.push({
      month,
      jobCount: jobs?.count || 0,
      matchCount: matches?.count || 0
    })
  }

  success(res, last12Months)
})

router.get('/wage-trend', (req: Request, res: Response) => {
  const wages = runQuery(`
    SELECT 
      strftime('%Y-%m', j.created_at) as month,
      AVG(j.daily_wage) as avg_wage,
      t.name as trade_name,
      t.id as trade_id
    FROM job_requirements j
    LEFT JOIN trades t ON j.trade_id = t.id
    WHERE j.status IN ('published', 'filled', 'closed') 
      AND j.daily_wage > 0
      AND j.created_at >= date('now', '-12 months')
    GROUP BY month, t.id, t.name
    ORDER BY month DESC, avg_wage DESC
  `)

  success(res, wages)
})

router.get('/review-records', (req: Request, res: Response) => {
  const records = runQuery(`
    SELECT 
      r.id,
      j.project_name,
      r.job_id,
      r.review_level,
      r.reviewer,
      r.result,
      r.comment,
      r.review_date
    FROM review_records r
    LEFT JOIN job_requirements j ON r.job_id = j.id
    ORDER BY r.review_date DESC
    LIMIT 20
  `)

  success(res, records)
})

export default router
