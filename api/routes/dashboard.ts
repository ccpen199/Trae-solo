import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/statistics', (req: Request, res: Response): void => {
  try {
    const enterpriseCount = db.prepare('SELECT COUNT(*) as count FROM enterprises').get() as any
    const serviceAppCount = db.prepare('SELECT COUNT(*) as count FROM service_applications').get() as any
    const policyCount = db.prepare('SELECT COUNT(*) as count FROM policies WHERE status = ?').get('active') as any
    const appealCount = db.prepare('SELECT COUNT(*) as count FROM appeals').get() as any
    const creditRecordCount = db.prepare('SELECT COUNT(*) as count FROM credit_records').get() as any
    const biddingProjectCount = db.prepare('SELECT COUNT(*) as count FROM bidding_projects WHERE status = ?').get('open') as any
    const financeProductCount = db.prepare('SELECT COUNT(*) as count FROM finance_products WHERE status = ?').get('active') as any
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any
    const materialCount = db.prepare('SELECT COUNT(*) as count FROM materials WHERE verified = ?').get(1) as any
    const supplyChainCount = db.prepare('SELECT COUNT(*) as count FROM supply_chain WHERE status = ?').get('active') as any

    const pendingAppeals = db.prepare('SELECT COUNT(*) as count FROM appeals WHERE status = ?').get('pending') as any
    const processingAppeals = db.prepare('SELECT COUNT(*) as count FROM appeals WHERE status = ?').get('processing') as any
    const resolvedAppeals = db.prepare('SELECT COUNT(*) as count FROM appeals WHERE status = ?').get('resolved') as any

    const pendingServices = db.prepare('SELECT COUNT(*) as count FROM service_applications WHERE status = ?').get('pending') as any
    const processingServices = db.prepare('SELECT COUNT(*) as count FROM service_applications WHERE status = ?').get('processing') as any
    const completedServices = db.prepare('SELECT COUNT(*) as count FROM service_applications WHERE status = ?').get('completed') as any

    const approvedFinance = db.prepare('SELECT COUNT(*) as count FROM finance_applications WHERE status = ?').get('approved') as any
    const pendingFinance = db.prepare('SELECT COUNT(*) as count FROM finance_applications WHERE status = ?').get('pending') as any
    const totalApprovedAmount = db.prepare('SELECT COALESCE(SUM(approved_amount), 0) as total FROM finance_applications WHERE status = ?').get('approved') as any

    const industryStats = db.prepare(`
      SELECT industry, COUNT(*) as count 
      FROM enterprises 
      WHERE industry IS NOT NULL
      GROUP BY industry 
      ORDER BY count DESC 
      LIMIT 10
    `).all()

    const appealTypeStats = db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM appeals 
      GROUP BY type 
      ORDER BY count DESC
    `).all()

    const policyCategoryStats = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM policies 
      WHERE status = 'active'
      GROUP BY category 
      ORDER BY count DESC
    `).all()

    const serviceCategoryStats = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM service_items 
      WHERE status = 'active'
      GROUP BY category 
      ORDER BY count DESC
    `).all()

    const recentAppeals = db.prepare(`
      SELECT a.*, e.name as enterprise_name 
      FROM appeals a 
      LEFT JOIN enterprises e ON a.enterprise_id = e.id
      ORDER BY a.id DESC 
      LIMIT 5
    `).all()

    const recentServices = db.prepare(`
      SELECT sa.*, e.name as enterprise_name, si.name as service_name
      FROM service_applications sa 
      LEFT JOIN enterprises e ON sa.enterprise_id = e.id
      LEFT JOIN service_items si ON sa.service_item_id = si.id
      ORDER BY sa.id DESC 
      LIMIT 5
    `).all()

    const monthlyEnterpriseStats = db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM enterprises
      WHERE created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all()

    const monthlyAppealStats = db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM appeals
      WHERE created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all()

    const creditLevelStats = db.prepare(`
      SELECT 
        CASE 
          WHEN level = 'A' THEN 'A级'
          WHEN level = 'B' THEN 'B级'
          WHEN level = 'C' THEN 'C级'
          WHEN level = 'D' THEN 'D级'
          ELSE '其他'
        END as level,
        COUNT(*) as count
      FROM credit_records
      GROUP BY level
      ORDER BY level
    `).all()

    const topEnterprises = db.prepare(`
      SELECT e.*, 
             (SELECT COUNT(*) FROM service_applications sa WHERE sa.enterprise_id = e.id) as service_count,
             (SELECT COUNT(*) FROM appeals a WHERE a.enterprise_id = e.id) as appeal_count
      FROM enterprises e
      ORDER BY e.registered_capital DESC
      LIMIT 5
    `).all()

    const supplyDemandStats = db.prepare(`
      SELECT direction, COUNT(*) as count 
      FROM supply_chain 
      WHERE status = 'active'
      GROUP BY direction
    `).all()

    res.json({
      success: true,
      data: {
        overview: {
          total_enterprises: enterpriseCount.count,
          total_service_applications: serviceAppCount.count,
          total_active_policies: policyCount.count,
          total_appeals: appealCount.count,
          total_credit_records: creditRecordCount.count,
          total_open_bidding: biddingProjectCount.count,
          total_active_finance_products: financeProductCount.count,
          total_users: userCount.count,
          total_verified_materials: materialCount.count,
          total_active_supply_chain: supplyChainCount.count
        },
        appeal_status: {
          pending: pendingAppeals.count,
          processing: processingAppeals.count,
          resolved: resolvedAppeals.count
        },
        service_application_status: {
          pending: pendingServices.count,
          processing: processingServices.count,
          completed: completedServices.count
        },
        finance_status: {
          approved: approvedFinance.count,
          pending: pendingFinance.count,
          total_approved_amount: totalApprovedAmount.total
        },
        industry_distribution: industryStats,
        appeal_type_distribution: appealTypeStats,
        policy_category_distribution: policyCategoryStats,
        service_category_distribution: serviceCategoryStats,
        credit_level_distribution: creditLevelStats,
        supply_demand_distribution: supplyDemandStats,
        recent_appeals: recentAppeals,
        recent_service_applications: recentServices,
        monthly_enterprise_growth: monthlyEnterpriseStats,
        monthly_appeal_trend: monthlyAppealStats,
        top_enterprises_by_capital: topEnterprises
      }
    })
  } catch (error) {
    console.error('Get dashboard statistics error:', error)
    res.status(500).json({ success: false, error: 'Failed to get dashboard statistics' })
  }
})

router.get('/overview', (req: Request, res: Response): void => {
  try {
    const enterpriseCount = db.prepare('SELECT COUNT(*) as count FROM enterprises').get() as any
    const activeEnterpriseCount = db.prepare('SELECT COUNT(*) as count FROM enterprises WHERE status = ?').get('active') as any
    const serviceAppCount = db.prepare('SELECT COUNT(*) as count FROM service_applications').get() as any
    const policyCount = db.prepare('SELECT COUNT(*) as count FROM policies WHERE status = ?').get('active') as any
    const appealCount = db.prepare('SELECT COUNT(*) as count FROM appeals').get() as any
    const biddingProjectCount = db.prepare('SELECT COUNT(*) as count FROM bidding_projects WHERE status = ?').get('open') as any
    const financeProductCount = db.prepare('SELECT COUNT(*) as count FROM finance_products WHERE status = ?').get('active') as any

    const resolvedRate = appealCount.count > 0 
      ? Math.round((db.prepare('SELECT COUNT(*) as count FROM appeals WHERE status = ?').get('resolved') as any).count / appealCount.count * 100)
      : 0

    const completionRate = serviceAppCount.count > 0
      ? Math.round((db.prepare('SELECT COUNT(*) as count FROM service_applications WHERE status = ?').get('completed') as any).count / serviceAppCount.count * 100)
      : 0

    const todayServiceApps = db.prepare(`
      SELECT COUNT(*) as count 
      FROM service_applications 
      WHERE strftime('%Y-%m-%d', submitted_at) = date('now')
    `).get() as any

    const todayAppeals = db.prepare(`
      SELECT COUNT(*) as count 
      FROM appeals 
      WHERE strftime('%Y-%m-%d', created_at) = date('now')
    `).get() as any

    const weekServiceApps = db.prepare(`
      SELECT COUNT(*) as count 
      FROM service_applications 
      WHERE submitted_at >= date('now', '-7 days')
    `).get() as any

    const weekAppeals = db.prepare(`
      SELECT COUNT(*) as count 
      FROM appeals 
      WHERE created_at >= date('now', '-7 days')
    `).get() as any

    res.json({
      success: true,
      data: {
        key_metrics: [
          { label: '企业总数', value: enterpriseCount.count, trend: '+12%', color: 'blue' },
          { label: '活跃企业', value: activeEnterpriseCount.count, trend: '+8%', color: 'green' },
          { label: '办件总量', value: serviceAppCount.count, trend: '+23%', color: 'purple' },
          { label: '政策总数', value: policyCount.count, trend: '+5%', color: 'orange' },
          { label: '诉求总数', value: appealCount.count, trend: '+15%', color: 'red' },
          { label: '招标项目', value: biddingProjectCount.count, trend: '+7%', color: 'cyan' }
        ],
        rates: {
          appeal_resolved_rate: resolvedRate,
          service_completion_rate: completionRate
        },
        today_stats: {
          new_service_applications: todayServiceApps.count,
          new_appeals: todayAppeals.count
        },
        week_stats: {
          new_service_applications: weekServiceApps.count,
          new_appeals: weekAppeals.count
        }
      }
    })
  } catch (error) {
    console.error('Get dashboard overview error:', error)
    res.status(500).json({ success: false, error: 'Failed to get dashboard overview' })
  }
})

router.get('/enterprise/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(id)
    if (!enterprise) {
      res.status(404).json({ success: false, error: 'Enterprise not found' })
      return
    }

    const serviceCount = db.prepare('SELECT COUNT(*) as count FROM service_applications WHERE enterprise_id = ?').get(id) as any
    const appealCount = db.prepare('SELECT COUNT(*) as count FROM appeals WHERE enterprise_id = ?').get(id) as any
    const policyMatchCount = db.prepare('SELECT COUNT(*) as count FROM policy_matches WHERE enterprise_id = ?').get(id) as any
    const creditRecordCount = db.prepare('SELECT COUNT(*) as count FROM credit_records WHERE enterprise_id = ?').get(id) as any
    const materialCount = db.prepare('SELECT COUNT(*) as count FROM materials WHERE enterprise_id = ?').get(id) as any
    const financeAppCount = db.prepare('SELECT COUNT(*) as count FROM finance_applications WHERE enterprise_id = ?').get(id) as any
    const biddingAppCount = db.prepare('SELECT COUNT(*) as count FROM bidding_applications WHERE enterprise_id = ?').get(id) as any

    const avgCreditScore = db.prepare('SELECT AVG(score) as avg FROM credit_records WHERE enterprise_id = ?').get(id) as any

    const latestCreditReport = db.prepare(`
      SELECT * FROM credit_reports 
      WHERE enterprise_id = ? 
      ORDER BY generated_at DESC 
      LIMIT 1
    `).get(id)

    const pendingServices = db.prepare(`
      SELECT sa.*, si.name as service_name 
      FROM service_applications sa
      LEFT JOIN service_items si ON sa.service_item_id = si.id
      WHERE sa.enterprise_id = ? AND sa.status NOT IN ('completed', 'rejected')
      ORDER BY sa.created_at DESC
    `).all(id)

    const pendingAppeals = db.prepare(`
      SELECT a.*, d.name as department_name
      FROM appeals a
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE a.enterprise_id = ? AND a.status NOT IN ('resolved', 'closed')
      ORDER BY a.created_at DESC
    `).all(id)

    const matchedPolicies = db.prepare(`
      SELECT pm.*, p.title, p.category, p.amount, d.name as department_name
      FROM policy_matches pm
      LEFT JOIN policies p ON pm.policy_id = p.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE pm.enterprise_id = ?
      ORDER BY pm.match_score DESC
      LIMIT 5
    `).all(id)

    const recentActivities = db.prepare(`
      SELECT 
        id,
        'service' as type,
        status,
        created_at,
        (SELECT name FROM service_items WHERE id = service_item_id) as title
      FROM service_applications 
      WHERE enterprise_id = ?
      UNION ALL
      SELECT 
        id,
        'appeal' as type,
        status,
        created_at,
        title
      FROM appeals 
      WHERE enterprise_id = ?
      ORDER BY id DESC
      LIMIT 10
    `).all(id, id)

    res.json({
      success: true,
      data: {
        enterprise,
        statistics: {
          total_services: serviceCount.count,
          total_appeals: appealCount.count,
          matched_policies: policyMatchCount.count,
          credit_records: creditRecordCount.count,
          materials: materialCount.count,
          finance_applications: financeAppCount.count,
          bidding_applications: biddingAppCount.count,
          average_credit_score: avgCreditScore.avg || null
        },
        latest_credit_report: latestCreditReport,
        pending_services: pendingServices,
        pending_appeals: pendingAppeals,
        matched_policies: matchedPolicies,
        recent_activities: recentActivities
      }
    })
  } catch (error) {
    console.error('Get enterprise dashboard error:', error)
    res.status(500).json({ success: false, error: 'Failed to get enterprise dashboard' })
  }
})

router.get('/trends', (req: Request, res: Response): void => {
  try {
    const monthlyData = db.prepare(`
      SELECT 
        m.month,
        COALESCE(e.count, 0) as new_enterprises,
        COALESCE(s.count, 0) as new_services,
        COALESCE(a.count, 0) as new_appeals,
        COALESCE(f.count, 0) as new_finance_apps
      FROM (
        SELECT DISTINCT strftime('%Y-%m', created_at) as month
        FROM enterprises
        WHERE created_at >= date('now', '-12 months')
        UNION
        SELECT DISTINCT strftime('%Y-%m', created_at) as month
        FROM service_applications
        WHERE created_at >= date('now', '-12 months')
        UNION
        SELECT DISTINCT strftime('%Y-%m', created_at) as month
        FROM appeals
        WHERE created_at >= date('now', '-12 months')
        UNION
        SELECT DISTINCT strftime('%Y-%m', created_at) as month
        FROM finance_applications
        WHERE created_at >= date('now', '-12 months')
      ) m
      LEFT JOIN (
        SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
        FROM enterprises WHERE created_at >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', created_at)
      ) e ON m.month = e.month
      LEFT JOIN (
        SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
        FROM service_applications WHERE created_at >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', created_at)
      ) s ON m.month = s.month
      LEFT JOIN (
        SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
        FROM appeals WHERE created_at >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', created_at)
      ) a ON m.month = a.month
      LEFT JOIN (
        SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
        FROM finance_applications WHERE created_at >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', created_at)
      ) f ON m.month = f.month
      ORDER BY m.month ASC
    `).all()

    res.json({
      success: true,
      data: monthlyData
    })
  } catch (error) {
    console.error('Get trends error:', error)
    res.status(500).json({ success: false, error: 'Failed to get trend data' })
  }
})

export default router
