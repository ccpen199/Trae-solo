import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'
import db from '../db.js'
import { authMiddleware } from './auth.js'

const router = Router()

router.use(authMiddleware)

function mapEfficiencyReport(row: any) {
  const score = Number(row?.efficiency_score ?? 78)
  const totalConsumption = Number(row?.total_consumption_kwh ?? 1200)
  const peakRatio = Number(row?.peak_ratio ?? 0.32)
  const valleyRatio = Number(row?.valley_ratio ?? 0.28)
  const recommendations = String(row?.recommendations || '优化空调与照明运行时段；提高谷时用电比例；持续跟踪重点设备能耗')
    .split(/[；;]/)
    .map((item) => item.trim())
    .filter(Boolean)

  return {
    id: String(row?.id ?? Date.now()),
    date: dayjs(row?.created_at || row?.period || new Date()).format('YYYY-MM-DD'),
    overallScore: score,
    items: [
      {
        category: '用电效率',
        score,
        description: score >= 80 ? '整体用电效率较高' : '仍有用电效率优化空间',
      },
      {
        category: '峰谷用电',
        score: Math.round(Math.max(55, Math.min(95, 70 + valleyRatio * 50 - peakRatio * 20))),
        description: `峰时占比 ${(peakRatio * 100).toFixed(0)}%，谷时占比 ${(valleyRatio * 100).toFixed(0)}%`,
      },
      {
        category: '设备能效',
        score: Math.round(Math.max(60, Math.min(92, score - 4))),
        description: '重点设备负载处于可监测范围',
      },
      {
        category: '照明系统',
        score: Math.round(Math.max(62, Math.min(96, score + 5))),
        description: '公共区域照明具备进一步节能空间',
      },
    ],
    recommendations: recommendations.map((item, index) => ({
      id: `${row?.id ?? 'new'}-${index}`,
      title: item.length > 18 ? item.slice(0, 18) : item,
      description: item,
      impact: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
      category: index === 0 ? '用电' : index === 1 ? '峰谷' : '设备',
    })),
    estimatedSavings: Math.max(600, Math.round(totalConsumption * 0.16)),
  }
}

router.get('/efficiency', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const reports = db.prepare(`
      SELECT * FROM energy_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 6
    `).all(userId)
    res.json({ success: true, data: reports.map(mapEfficiencyReport) })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/efficiency/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const period = req.body?.period || dayjs().format('YYYY-MM')
    const reportType = req.body?.report_type || req.body?.reportType || 'monthly'

    const bills = db.prepare(`
      SELECT SUM(total_kwh) as total_kwh, SUM(peak_kwh) as peak_kwh,
             SUM(valley_kwh) as valley_kwh
      FROM electricity_bills WHERE user_id = ? AND billing_period LIKE ?
    `).get(userId, `${period}%`) as any

    const totalConsumption = bills?.total_kwh || 0
    const peakRatio = totalConsumption > 0 ? (bills?.peak_kwh || 0) / totalConsumption : 0.32
    const valleyRatio = totalConsumption > 0 ? (bills?.valley_kwh || 0) / totalConsumption : 0.28

    let score = 68
    if (peakRatio < 0.35) score += 12
    if (valleyRatio > 0.25) score += 10
    if (totalConsumption > 0 && totalConsumption < 5000) score += 5
    score = Math.min(100, Math.max(0, score))

    const recommendations = [
      peakRatio > 0.35 ? '峰电占比较高，建议将部分用电转移至谷电时段' : '峰谷用电结构较稳定，建议继续跟踪重点时段负荷',
      valleyRatio < 0.25 ? '谷电利用率偏低，建议增加夜间低谷用电比例' : '谷时用电比例良好，可继续保持错峰策略',
      '建议对空调、照明和大功率设备建立月度能效巡检',
    ]

    const result = db.prepare(`
      INSERT INTO energy_reports (user_id, report_type, period, total_consumption_kwh, peak_ratio, valley_ratio, efficiency_score, recommendations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      reportType,
      period,
      totalConsumption,
      parseFloat(peakRatio.toFixed(2)),
      parseFloat(valleyRatio.toFixed(2)),
      score,
      recommendations.join('；')
    )

    const report = db.prepare('SELECT * FROM energy_reports WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: mapEfficiencyReport(report), message: '能效诊断报告生成成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/reports', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { report_type, period } = req.query

    let sql = 'SELECT * FROM energy_reports WHERE user_id = ?'
    const params: any[] = [userId]

    if (report_type) { sql += ' AND report_type = ?'; params.push(report_type as string) }
    if (period) { sql += ' AND period = ?'; params.push(period as string) }

    sql += ' ORDER BY created_at DESC'
    const reports = db.prepare(sql).all(...params)
    res.json({ success: true, data: reports })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/reports/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { report_type, period } = req.body

    if (!report_type || !period) {
      res.status(400).json({ success: false, error: '请提供报告类型和周期' })
      return
    }

    const bills = db.prepare(`
      SELECT SUM(total_kwh) as total_kwh, SUM(peak_kwh) as peak_kwh,
             SUM(valley_kwh) as valley_kwh, SUM(flat_kwh) as flat_kwh,
             SUM(total_amount) as total_amount
      FROM electricity_bills WHERE user_id = ? AND billing_period LIKE ?
    `).get(userId, `${period}%`) as any

    const totalConsumption = bills?.total_kwh || 0
    const peakRatio = totalConsumption > 0 ? (bills?.peak_kwh || 0) / totalConsumption : 0
    const valleyRatio = totalConsumption > 0 ? (bills?.valley_kwh || 0) / totalConsumption : 0

    let score = 50
    if (peakRatio < 0.35) score += 15
    if (valleyRatio > 0.25) score += 15
    if (totalConsumption < 500) score += 10
    else if (totalConsumption > 5000) score -= 10
    score = Math.min(100, Math.max(0, score))

    const recommendations: string[] = []
    if (peakRatio > 0.35) recommendations.push('峰电占比较高，建议将部分用电转移至谷电时段')
    if (valleyRatio < 0.25) recommendations.push('谷电利用率偏低，建议增加夜间用电比例')
    if (totalConsumption > 5000) recommendations.push('用电量较大，建议评估光伏和储能系统投资')
    if (score >= 80) recommendations.push('用电效率良好，建议继续保持当前用能习惯')
    if (recommendations.length === 0) recommendations.push('建议安装智能电表进行更精细的用能管理')

    const result = db.prepare(`
      INSERT INTO energy_reports (user_id, report_type, period, total_consumption_kwh, peak_ratio, valley_ratio, efficiency_score, recommendations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, report_type, period, totalConsumption, parseFloat(peakRatio.toFixed(2)), parseFloat(valleyRatio.toFixed(2)), score, recommendations.join('；'))

    const report = db.prepare('SELECT * FROM energy_reports WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: report, message: '能效诊断报告生成成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/pv-plans', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const plans = db.prepare('SELECT * FROM pv_plans WHERE user_id = ? ORDER BY created_at DESC').all(userId)
    res.json({ success: true, data: plans })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/pv-plans/recommend', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { roof_area, monthly_consumption } = req.body

    if (!roof_area || !monthly_consumption) {
      res.status(400).json({ success: false, error: '请提供屋顶面积和月用电量' })
      return
    }

    const capacity = Math.min(roof_area / 8, monthly_consumption / 110)
    const estimatedGeneration = capacity * 110
    const investmentCost = capacity * 5000
    const paybackYears = investmentCost / (estimatedGeneration * 0.85 * 12)
    const co2Reduction = estimatedGeneration * 12 * 0.000876

    const result = db.prepare(`
      INSERT INTO pv_plans (user_id, roof_area, monthly_consumption, recommended_capacity, estimated_generation, investment_cost, payback_years, co2_reduction)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, roof_area, monthly_consumption, parseFloat(capacity.toFixed(1)),
      parseFloat(estimatedGeneration.toFixed(0)), parseFloat(investmentCost.toFixed(0)),
      parseFloat(paybackYears.toFixed(1)), parseFloat(co2Reduction.toFixed(1)))

    const plan = db.prepare('SELECT * FROM pv_plans WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: plan, message: '光伏接入方案生成成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/carbon', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const records = db.prepare('SELECT * FROM carbon_records WHERE user_id = ? ORDER BY period DESC').all(userId)
    res.json({ success: true, data: records })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/carbon/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { period, electricity_kwh, transport_km } = req.body

    if (!period) {
      res.status(400).json({ success: false, error: '请提供计算周期' })
      return
    }

    const elecKwh = electricity_kwh || 0
    const transportKm = transport_km || 0
    const electricityCarbon = elecKwh * 0.000876
    const transportCarbon = transportKm * 0.00021
    const totalCarbon = electricityCarbon + transportCarbon

    const tips: string[] = []
    if (electricityCarbon > 0.5) tips.push('电力碳排放较高，建议安装光伏系统或购买绿电')
    if (transportCarbon > 0.2) tips.push('交通碳排放较高，建议使用公共交通或新能源车')
    if (totalCarbon < 0.3) tips.push('碳排放较低，继续保持绿色生活方式')
    if (tips.length === 0) tips.push('建议进一步优化用能习惯，减少碳排放')

    const result = db.prepare(`
      INSERT INTO carbon_records (user_id, period, electricity_carbon, transport_carbon, total_carbon, reduction_tips)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, period, parseFloat(electricityCarbon.toFixed(4)),
      parseFloat(transportCarbon.toFixed(4)), parseFloat(totalCarbon.toFixed(4)), tips.join('；'))

    const record = db.prepare('SELECT * FROM carbon_records WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: record, message: '碳足迹计算完成' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/carbon-records', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { limit } = req.query
    const lim = limit ? parseInt(limit as string) : 20

    const records = db.prepare(`
      SELECT * FROM carbon_records WHERE user_id = ?
      ORDER BY created_at DESC LIMIT ?
    `).all(userId, lim)

    res.json({ success: true, data: records })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/device-alerts', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { status, severity } = req.query

    let sql = `
      SELECT da.*, sd.device_name FROM device_alerts da
      LEFT JOIN smart_devices sd ON da.device_id = sd.id
      WHERE da.user_id = ?
    `
    const params: any[] = [userId]

    if (status) { sql += ' AND da.status = ?'; params.push(status as string) }
    if (severity) { sql += ' AND da.severity = ?'; params.push(severity as string) }

    sql += ` ORDER BY CASE da.severity 
      WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, 
      da.created_at DESC`

    const alerts = db.prepare(sql).all(...params)
    res.json({ success: true, data: alerts })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const user = (req as any).user
    const customerType = user.customer_type
    const isAdmin = user.role === 'admin'

    const latestBills = db.prepare(`
      SELECT billing_period, total_kwh, peak_kwh, valley_kwh, total_amount
      FROM electricity_bills WHERE user_id = ? ORDER BY billing_period DESC LIMIT 6
    `).all(userId) as { billing_period: string; total_kwh: number; total_amount: number }[]

    const peakValley = db.prepare(`
      SELECT SUM(peak_kwh) as peak, SUM(valley_kwh) as valley, SUM(flat_kwh) as flat
      FROM electricity_bills WHERE user_id = ?
    `).get(userId) as any

    const totalPeak = peakValley?.peak || 0
    const totalValley = peakValley?.valley || 0
    const totalFlat = peakValley?.flat || 0
    const totalAll = totalPeak + totalValley + totalFlat

    const devices = db.prepare('SELECT * FROM smart_devices WHERE user_id = ?').all(userId) as any[]
    const highLoadDevices = devices.filter(d => d.power_consumption > 5 && d.status === 'online')

    const latestReport = db.prepare('SELECT * FROM energy_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId) as any

    const unpaidBills = db.prepare(`
      SELECT COUNT(*) as count, SUM(total_amount) as total FROM electricity_bills
      WHERE user_id = ? AND status IN ('unpaid', 'overdue')
    `).get(userId) as any

    const meterRealtime = db.prepare(`
      SELECT * FROM meter_readings WHERE user_id = ? ORDER BY reading_time DESC LIMIT 1
    `).get(userId)

    const weather = db.prepare(`
      SELECT * FROM weather_data WHERE area LIKE '%广州%' ORDER BY recorded_at DESC LIMIT 1
    `).get()

    const deviceAlerts = db.prepare(`
      SELECT da.*, sd.device_name FROM device_alerts da
      LEFT JOIN smart_devices sd ON da.device_id = sd.id
      WHERE da.user_id = ? AND da.status != 'resolved'
      ORDER BY CASE da.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, da.created_at DESC
    `).all(userId)

    const currentPrice = db.prepare(`
      SELECT * FROM price_tariffs WHERE customer_type = ? AND effective_to IS NULL
    `).all(customerType)

    const outages = db.prepare(`
      SELECT * FROM outage_notices WHERE status IN ('planned', 'emergency')
      ORDER BY start_time DESC LIMIT 5
    `).all()

    const pointsBalance = db.prepare(`
      SELECT points_balance FROM users WHERE id = ?
    `).get(userId) as any

    const totalAmountPaid = db.prepare(`
      SELECT SUM(total_amount) as total FROM electricity_bills WHERE user_id = ? AND status = 'paid'
    `).get(userId) as any

    const totalKwh = db.prepare(`
      SELECT SUM(total_kwh) as total FROM electricity_bills WHERE user_id = ?
    `).get(userId) as any

    const latestCarbon = db.prepare(`
      SELECT total_carbon FROM carbon_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(userId) as any

    let customerSpecificData: any = {}
    let stats: any[] = []

    if (isAdmin) {
      const userStats = db.prepare(`
        SELECT customer_type, COUNT(*) as count FROM users GROUP BY customer_type
      `).all()

      const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any
      const totalRevenue = db.prepare('SELECT SUM(total_amount) as total FROM electricity_bills WHERE status = ?').get('paid') as any
      const pendingSubsidies = db.prepare('SELECT COUNT(*) as count FROM subsidies WHERE status = ?').get('pending') as any
      const activeAlerts = db.prepare('SELECT COUNT(*) as count FROM device_alerts WHERE status = ?').get('open') as any

      const auditAlerts = db.prepare(`
        SELECT * FROM audit_records WHERE result IN ('warning', 'fail') ORDER BY created_at DESC LIMIT 10
      `).all()

      const priceAudit = db.prepare(`
        SELECT 
          u.id, u.username, u.customer_type,
          eb.billing_period, eb.total_kwh, eb.total_amount,
          (eb.total_amount / eb.total_kwh) as avg_price,
          pt.peak as peak_price, pt.valley as valley_price
        FROM electricity_bills eb
        JOIN users u ON eb.user_id = u.id
        JOIN (
          SELECT customer_type, 
                 MAX(CASE WHEN period_type = 'peak' THEN price_per_kwh END) as peak,
                 MAX(CASE WHEN period_type = 'valley' THEN price_per_kwh END) as valley
          FROM price_tariffs WHERE effective_to IS NULL
          GROUP BY customer_type
        ) pt ON u.customer_type = pt.customer_type
        WHERE eb.total_kwh > 0
        LIMIT 20
      `).all()

      stats = [
        { label: '用户总数', value: totalUsers?.count || 0, unit: '户', icon: 'Users', color: 'navy' },
        { label: '累计营收', value: (totalRevenue?.total || 0).toLocaleString(), unit: '元', icon: 'DollarSign', color: 'green' },
        { label: '待审补贴', value: pendingSubsidies?.count || 0, unit: '笔', icon: 'FileText', color: 'amber' },
        { label: '活跃告警', value: activeAlerts?.count || 0, unit: '条', icon: 'AlertTriangle', color: 'red' },
      ]

      customerSpecificData = {
        systemStats: {
          totalUsers: totalUsers?.count || 0,
          totalRevenue: totalRevenue?.total || 0,
          pendingSubsidies: pendingSubsidies?.count || 0,
          activeAlerts: activeAlerts?.count || 0,
          userDistribution: userStats
        },
        auditAlerts,
        priceAudit: priceAudit.map((pa: any) => ({
          ...pa,
          priceAbnormal: pa.avg_price > pa.peak_price * 1.1 || pa.avg_price < pa.valley_price * 0.9
        }))
      }
    } else if (customerType === 'individual' || customerType === 'family') {
      const seasonalPattern = db.prepare(`
        SELECT 
          strftime('%m', billing_period) as month,
          SUM(total_kwh) as total_kwh,
          AVG(total_kwh) as avg_kwh
        FROM electricity_bills WHERE user_id = ?
        GROUP BY strftime('%m', billing_period)
        ORDER BY month
      `).all(userId)

      const homeDevices = db.prepare(`
        SELECT * FROM smart_devices WHERE user_id = ?
        ORDER BY CASE status WHEN 'online' THEN 1 ELSE 2 END
      `).all(userId)

      const energyTips = db.prepare(`
        SELECT * FROM energy_tips 
        WHERE (customer_type = ? OR customer_type IS NULL)
        ORDER BY RANDOM() LIMIT 3
      `).all(customerType)

      const customerLabel = customerType === 'individual' ? '个人' : '家庭'
      stats = [
        { label: `本月${customerLabel}电费`, value: (latestBills[0]?.total_amount || 0).toLocaleString(), unit: '元', icon: 'Zap', color: 'navy' },
        { label: '累计用电量', value: (totalKwh?.total || 0).toLocaleString(), unit: 'kWh', icon: 'Gauge', color: 'green' },
        { label: '碳排放', value: (latestCarbon?.total_carbon || 0).toFixed(2), unit: 'kgCO₂', icon: 'Leaf', color: 'amber' },
        { label: '积分余额', value: (pointsBalance?.points_balance || 0).toLocaleString(), unit: '分', icon: 'Gift', color: 'red' },
      ]

      customerSpecificData = {
        seasonalPattern,
        homeDevices,
        energyTips,
        currentPrice,
        outages,
        userType: 'residential',
        customerLabel
      }
    } else if (customerType === 'enterprise' || customerType === 'park') {
      const energyReports = db.prepare(`
        SELECT * FROM energy_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
      `).all(userId) as any[]

      const peakValleyRatio = {
        peak: totalAll > 0 ? (totalPeak / totalAll).toFixed(2) : 0,
        valley: totalAll > 0 ? (totalValley / totalAll).toFixed(2) : 0,
        flat: totalAll > 0 ? (totalFlat / totalAll).toFixed(2) : 0,
      }

      const deviceLoadWarnings = devices.filter(d => d.power_consumption > 10 && d.status === 'online').map(d => ({
        device_name: d.device_name,
        power_consumption: d.power_consumption,
        warning: d.power_consumption > 30 ? '严重过载' : '负载偏高'
      }))

      const pvPlan = db.prepare(`
        SELECT * FROM pv_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
      `).get(userId) as any

      customerSpecificData = {
        energyEfficiency: {
          latestReport,
          reports: energyReports,
          efficiencyScore: latestReport?.efficiency_score || 0
        },
        peakValleyRatio,
        deviceLoadWarnings,
        reportShortcuts: [
          { type: 'monthly', label: '月度能效报告', available: true },
          { type: 'quarterly', label: '季度能效报告', available: true },
          { type: 'annual', label: '年度能效报告', available: true }
        ],
        pvPlanStatus: pvPlan ? {
          hasPlan: true,
          capacity: pvPlan.recommended_capacity,
          estimatedGeneration: pvPlan.estimated_generation,
          paybackYears: pvPlan.payback_years
        } : { hasPlan: false },
        currentPrice,
        userType: 'commercial'
      }

      const customerLabel = customerType === 'enterprise' ? '企业' : '园区'
      stats = [
        { label: `本月${customerLabel}电费`, value: (latestBills[0]?.total_amount || 0).toLocaleString(), unit: '元', icon: 'Zap', color: 'navy' },
        { label: '累计用电量', value: (totalKwh?.total || 0).toLocaleString(), unit: 'kWh', icon: 'Gauge', color: 'green' },
        { label: '碳排放', value: ((latestCarbon?.total_carbon || 0) / 1000).toFixed(2), unit: 'tCO₂', icon: 'Leaf', color: 'amber' },
        { label: '能效评分', value: latestReport?.efficiency_score || 0, unit: '分', icon: 'TrendingUp', color: 'red' },
      ]
      customerSpecificData.customerLabel = customerLabel
    }

    const displayCustomerType = isAdmin ? 'admin' : customerType

    res.json({
      success: true,
      data: {
        baseData: {
          latestBills,
          peakValleyRatio: {
            peak: totalAll > 0 ? (totalPeak / totalAll).toFixed(2) : 0,
            valley: totalAll > 0 ? (totalValley / totalAll).toFixed(2) : 0,
            flat: totalAll > 0 ? (totalFlat / totalAll).toFixed(2) : 0,
          },
          deviceLoadAlerts: highLoadDevices.map(d => ({
            device_name: d.device_name,
            power_consumption: d.power_consumption,
            status: d.status,
            alert: d.power_consumption > 20 ? 'high' : 'medium'
          })),
          latestReport,
          unpaidBills,
        },
        stats,
        customerType: displayCustomerType,
        isAdmin,
        meterRealtime,
        weather,
        deviceAlerts,
        ...customerSpecificData
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
