import Database from 'better-sqlite3'
import dayjs from 'dayjs'

export interface MonthlyStatsItem {
  month: string
  permitApplications: number
  violationReports: number
  accidentRecords: number
  ebikeRegistrations: number
  appointments: number
  certificatesIssued: number
}

export interface MonthlyStats {
  currentYear: number
  data: MonthlyStatsItem[]
}

export interface EfficiencyStats {
  totalApplications: number
  pendingApplications: number
  approvedApplications: number
  rejectedApplications: number
  averageProcessingTime: number
  averageRating: number
  completionRate: number
  autoApprovalRate: number
  processingEfficiency: Array<{
    businessType: string
    total: number
    completed: number
    averageTime: number
  }>
}

export interface AbnormalOrder {
  id: number
  businessType: string
  businessId: number
  title: string
  abnormalityType: string
  description: string
  createdAt: string
}

export interface DashboardStats {
  todayNew: {
    permit: number
    violation: number
    accident: number
    ebike: number
    appointment: number
    certificate: number
  }
  pendingTasks: {
    permit: number
    violation: number
    accident: number
    ebike: number
    workflow: number
  }
  totalStats: {
    users: number
    permits: number
    violations: number
    accidents: number
    ebikes: number
    appointments: number
    certificates: number
  }
  monthlyTrend: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
    }>
  }
  businessDistribution: Array<{
    type: string
    count: number
    percentage: number
  }>
  statusDistribution: Array<{
    status: string
    count: number
    percentage: number
  }>
}

export default class StatsService {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  getMonthlyStats(year?: number): MonthlyStats {
    const targetYear = year || dayjs().year()
    const data: MonthlyStatsItem[] = []

    for (let month = 1; month <= 12; month++) {
      const monthStr = `${targetYear}-${month.toString().padStart(2, '0')}`
      const startDate = `${monthStr}-01`
      const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD')

      const permitCount = this.countByDateRange('permit_applications', startDate, endDate)
      const violationCount = this.countByDateRange('violation_reports', startDate, endDate)
      const accidentCount = this.countByDateRange('accident_records', startDate, endDate)
      const ebikeCount = this.countByDateRange('ebike_registrations', startDate, endDate)
      const appointmentCount = this.countByDateRange('appointments', startDate, endDate)
      const certificateCount = this.countByDateRange('certificates', startDate, endDate)

      data.push({
        month: monthStr,
        permitApplications: permitCount,
        violationReports: violationCount,
        accidentRecords: accidentCount,
        ebikeRegistrations: ebikeCount,
        appointments: appointmentCount,
        certificatesIssued: certificateCount,
      })
    }

    return {
      currentYear: targetYear,
      data,
    }
  }

  private countByDateRange(tableName: string, startDate: string, endDate: string): number {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM ${tableName}
      WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
    `).get(startDate, endDate) as { count: number }

    return result.count || 0
  }

  getEfficiencyStats(startDate?: string, endDate?: string): EfficiencyStats {
    const start = startDate || dayjs().subtract(30, 'day').format('YYYY-MM-DD')
    const end = endDate || dayjs().format('YYYY-MM-DD')

    const totalApplications = this.db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT id, created_at, 'permit' as type FROM permit_applications
        UNION ALL SELECT id, created_at, 'violation' as type FROM violation_reports
        UNION ALL SELECT id, created_at, 'ebike' as type FROM ebike_registrations
        UNION ALL SELECT id, created_at, 'certificate' as type FROM certificates
      ) t WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
    `).get(start, end) as { count: number }

    const pendingApplications = this.db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM permit_applications WHERE status = 'pending'
        UNION ALL SELECT id FROM violation_reports WHERE status IN ('pending', 'processing')
        UNION ALL SELECT id FROM ebike_registrations WHERE status = 'pending'
        UNION ALL SELECT id FROM workflow_tasks WHERE status = 'pending'
      ) t
    `).get() as { count: number }

    const approvedApplications = this.db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT id, created_at FROM permit_applications WHERE status IN ('approved', 'verified')
        UNION ALL SELECT id, created_at FROM violation_reports WHERE status = 'verified'
        UNION ALL SELECT id, created_at FROM ebike_registrations WHERE status = 'approved'
        UNION ALL SELECT id, created_at FROM certificates WHERE status = 'valid'
      ) t WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
    `).get(start, end) as { count: number }

    const rejectedApplications = this.db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT id, created_at FROM permit_applications WHERE status = 'rejected'
        UNION ALL SELECT id, created_at FROM violation_reports WHERE status = 'rejected'
        UNION ALL SELECT id, created_at FROM ebike_registrations WHERE status = 'rejected'
        UNION ALL SELECT id, created_at FROM workflow_tasks WHERE status = 'rejected'
      ) t WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
    `).get(start, end) as { count: number }

    const averageProcessingTime = this.calculateAverageProcessingTime(start, end)

    const averageRatingResult = this.db.prepare(`
      SELECT AVG(rating) as avg_rating FROM appointments 
      WHERE rating IS NOT NULL AND DATE(created_at) >= ? AND DATE(created_at) <= ?
    `).get(start, end) as { avg_rating: number | null }

    const autoApproved = this.db.prepare(`
      SELECT COUNT(*) as count FROM permit_applications 
      WHERE status = 'approved' 
        AND verified_at IS NOT NULL
        AND DATE(created_at) >= ? AND DATE(created_at) <= ?
    `).get(start, end) as { count: number }

    const processingEfficiency = this.getBusinessProcessingEfficiency(start, end)

    const totalCompleted = approvedApplications.count + rejectedApplications.count
    const completionRate = totalApplications.count > 0 
      ? Math.round((totalCompleted / totalApplications.count) * 100) 
      : 0

    const totalApproved = approvedApplications.count
    const autoApprovalRate = totalApproved > 0
      ? Math.round((autoApproved.count / totalApproved) * 100)
      : 0

    return {
      totalApplications: totalApplications.count || 0,
      pendingApplications: pendingApplications.count || 0,
      approvedApplications: approvedApplications.count || 0,
      rejectedApplications: rejectedApplications.count || 0,
      averageProcessingTime,
      averageRating: averageRatingResult.avg_rating || 0,
      completionRate,
      autoApprovalRate,
      processingEfficiency,
    }
  }

  private calculateAverageProcessingTime(start: string, end: string): number {
    const processingTimes: number[] = []

    const permits = this.db.prepare(`
      SELECT 
        JULIANDAY(COALESCE(verified_at, updated_at)) - JULIANDAY(created_at) as days
      FROM permit_applications
      WHERE status IN ('approved', 'verified', 'rejected')
        AND DATE(created_at) >= ? AND DATE(created_at) <= ?
    `).all(start, end) as Array<{ days: number }>

    const violations = this.db.prepare(`
      SELECT 
        JULIANDAY(updated_at) - JULIANDAY(created_at) as days
      FROM violation_reports
      WHERE status IN ('verified', 'rejected')
        AND DATE(created_at) >= ? AND DATE(created_at) <= ?
    `).all(start, end) as Array<{ days: number }>

    const ebikes = this.db.prepare(`
      SELECT 
        JULIANDAY(updated_at) - JULIANDAY(created_at) as days
      FROM ebike_registrations
      WHERE status IN ('approved', 'rejected')
        AND DATE(created_at) >= ? AND DATE(created_at) <= ?
    `).all(start, end) as Array<{ days: number }>

    processingTimes.push(...permits.map(p => p.days * 24))
    processingTimes.push(...violations.map(v => v.days * 24))
    processingTimes.push(...ebikes.map(e => e.days * 24))

    if (processingTimes.length === 0) return 0

    const avgHours = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
    return Math.round(avgHours * 10) / 10
  }

  private getBusinessProcessingEfficiency(start: string, end: string): Array<{
    businessType: string
    total: number
    completed: number
    averageTime: number
  }> {
    const businessTypes = [
      { type: 'permit', name: '进京证', table: 'permit_applications' },
      { type: 'violation', name: '违法举报', table: 'violation_reports' },
      { type: 'ebike', name: '电动车登记', table: 'ebike_registrations' },
      { type: 'certificate', name: '证照办理', table: 'certificates' },
    ]

    return businessTypes.map(bt => {
      const total = this.countByDateRange(bt.table, start, end)

      const completedResult = this.db.prepare(`
        SELECT 
          COUNT(*) as count,
          AVG(JULIANDAY(updated_at) - JULIANDAY(created_at)) as avg_days
        FROM ${bt.table}
        WHERE status IN ('approved', 'verified', 'valid', 'confirmed', 'verified', 'closed')
          AND DATE(created_at) >= ? AND DATE(created_at) <= ?
      `).get(start, end) as { count: number; avg_days: number | null }

      return {
        businessType: bt.name,
        total,
        completed: completedResult.count || 0,
        averageTime: completedResult.avg_days ? Math.round(completedResult.avg_days * 24 * 10) / 10 : 0,
      }
    })
  }

  getAbnormalOrders(): AbnormalOrder[] {
    const abnormalOrders: AbnormalOrder[] = []

    const longPendingPermits = this.db.prepare(`
      SELECT 
        id, plate_number as title, created_at,
        JULIANDAY('now') - JULIANDAY(created_at) as days
      FROM permit_applications 
      WHERE status = 'pending' 
        AND JULIANDAY('now') - JULIANDAY(created_at) > 3
    `).all() as Array<{ id: number; title: string; created_at: string; days: number }>

    longPendingPermits.forEach(p => {
      abnormalOrders.push({
        id: p.id,
        businessType: 'permit',
        businessId: p.id,
        title: `进京证申请 - ${p.title}`,
        abnormalityType: '超时未处理',
        description: `该申请已等待${Math.floor(p.days)}天未处理`,
        createdAt: p.created_at,
      })
    })

    const longPendingViolations = this.db.prepare(`
      SELECT 
        id, plate_number as title, created_at,
        JULIANDAY('now') - JULIANDAY(created_at) as days
      FROM violation_reports 
      WHERE status IN ('pending', 'processing')
        AND JULIANDAY('now') - JULIANDAY(created_at) > 5
    `).all() as Array<{ id: number; title: string; created_at: string; days: number }>

    longPendingViolations.forEach(v => {
      abnormalOrders.push({
        id: v.id,
        businessType: 'violation',
        businessId: v.id,
        title: `违法举报 - ${v.title}`,
        abnormalityType: '超时未处理',
        description: `该举报已等待${Math.floor(v.days)}天未处理完成`,
        createdAt: v.created_at,
      })
    })

    const longPendingAccidents = this.db.prepare(`
      SELECT 
        id, location as title, created_at,
        JULIANDAY('now') - JULIANDAY(created_at) as days
      FROM accident_records 
      WHERE status IN ('pending', 'negotiating')
        AND JULIANDAY('now') - JULIANDAY(created_at) > 7
    `).all() as Array<{ id: number; title: string; created_at: string; days: number }>

    longPendingAccidents.forEach(a => {
      abnormalOrders.push({
        id: a.id,
        businessType: 'accident',
        businessId: a.id,
        title: `事故处理 - ${a.title}`,
        abnormalityType: '处理周期过长',
        description: `该事故已处理${Math.floor(a.days)}天未结案`,
        createdAt: a.created_at,
      })
    })

    const longPendingEbikes = this.db.prepare(`
      SELECT 
        id, CONCAT(brand, ' ', model) as title, created_at,
        JULIANDAY('now') - JULIANDAY(created_at) as days
      FROM ebike_registrations 
      WHERE status = 'pending'
        AND JULIANDAY('now') - JULIANDAY(created_at) > 3
    `).all() as Array<{ id: number; title: string; created_at: string; days: number }>

    longPendingEbikes.forEach(e => {
      abnormalOrders.push({
        id: e.id,
        businessType: 'ebike',
        businessId: e.id,
        title: `电动车登记 - ${e.title}`,
        abnormalityType: '超时未处理',
        description: `该登记申请已等待${Math.floor(e.days)}天未处理`,
        createdAt: e.created_at,
      })
    })

    const highRejectionPermits = this.db.prepare(`
      SELECT 
        owner_id_card,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM permit_applications
      WHERE DATE(created_at) >= DATE('now', '-30 days')
      GROUP BY owner_id_card
      HAVING rejected > 0 AND rejected * 1.0 / total > 0.5
    `).all() as Array<{ owner_id_card: string; total: number; rejected: number }>

    highRejectionPermits.forEach(hr => {
      abnormalOrders.push({
        id: Date.now() + Math.random(),
        businessType: 'permit',
        businessId: 0,
        title: `高拒签率申请人 - ${hr.owner_id_card}`,
        abnormalityType: '高拒签率',
        description: `该申请人近30天内申请${hr.total}次，被拒${hr.rejected}次，拒签率${Math.round(hr.rejected / hr.total * 100)}%`,
        createdAt: new Date().toISOString(),
      })
    })

    const duplicateReports = this.db.prepare(`
      SELECT 
        plate_number, violation_time,
        COUNT(*) as count
      FROM violation_reports
      WHERE DATE(created_at) >= DATE('now', '-7 days')
      GROUP BY plate_number, violation_time
      HAVING count > 1
    `).all() as Array<{ plate_number: string; violation_time: string; count: number }>

    duplicateReports.forEach(dr => {
      abnormalOrders.push({
        id: Date.now() + Math.random(),
        businessType: 'violation',
        businessId: 0,
        title: `重复举报 - ${dr.plate_number}`,
        abnormalityType: '重复举报',
        description: `同一车辆同一时间被举报${dr.count}次`,
        createdAt: new Date().toISOString(),
      })
    })

    const expiredPermits = this.db.prepare(`
      SELECT 
        id, plate_number, leave_date
      FROM permit_applications
      WHERE status = 'expired'
        AND DATE(leave_date) >= DATE('now', '-7 days')
      LIMIT 10
    `).all() as Array<{ id: number; plate_number: string; leave_date: string }>

    expiredPermits.forEach(ep => {
      abnormalOrders.push({
        id: ep.id,
        businessType: 'permit',
        businessId: ep.id,
        title: `进京证到期 - ${ep.plate_number}`,
        abnormalityType: '证照到期',
        description: `该车进京证已于${ep.leave_date}到期`,
        createdAt: ep.leave_date,
      })
    })

    return abnormalOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  getDashboardStats(): DashboardStats {
    const today = dayjs().format('YYYY-MM-DD')

    const todayNew = {
      permit: this.countByDateRange('permit_applications', today, today),
      violation: this.countByDateRange('violation_reports', today, today),
      accident: this.countByDateRange('accident_records', today, today),
      ebike: this.countByDateRange('ebike_registrations', today, today),
      appointment: this.countByDateRange('appointments', today, today),
      certificate: this.countByDateRange('certificates', today, today),
    }

    const pendingTasks = {
      permit: this.countByStatus('permit_applications', 'pending'),
      violation: this.countByStatus('violation_reports', 'processing'),
      accident: this.countByStatus('accident_records', 'negotiating'),
      ebike: this.countByStatus('ebike_registrations', 'pending'),
      workflow: this.countByStatus('workflow_tasks', 'pending'),
    }

    const totalStats = {
      users: this.countAll('users'),
      permits: this.countAll('permit_applications'),
      violations: this.countAll('violation_reports'),
      accidents: this.countAll('accident_records'),
      ebikes: this.countAll('ebike_registrations'),
      appointments: this.countAll('appointments'),
      certificates: this.countAll('certificates'),
    }

    const monthlyTrend = this.getMonthlyTrend()
    const businessDistribution = this.getBusinessDistribution()
    const statusDistribution = this.getStatusDistribution()

    return {
      todayNew,
      pendingTasks,
      totalStats,
      monthlyTrend,
      businessDistribution,
      statusDistribution,
    }
  }

  private countByStatus(table: string, status: string): number {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM ${table} WHERE status = ?
    `).get(status) as { count: number }

    return result.count || 0
  }

  private countAll(table: string): number {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM ${table}
    `).get() as { count: number }

    return result.count || 0
  }

  private getMonthlyTrend(): {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
    }>
  } {
    const labels: string[] = []
    const permitData: number[] = []
    const violationData: number[] = []
    const ebikeData: number[] = []

    for (let i = 5; i >= 0; i--) {
      const date = dayjs().subtract(i, 'month')
      labels.push(date.format('YYYY-MM'))
      const startDate = date.startOf('month').format('YYYY-MM-DD')
      const endDate = date.endOf('month').format('YYYY-MM-DD')

      permitData.push(this.countByDateRange('permit_applications', startDate, endDate))
      violationData.push(this.countByDateRange('violation_reports', startDate, endDate))
      ebikeData.push(this.countByDateRange('ebike_registrations', startDate, endDate))
    }

    return {
      labels,
      datasets: [
        { label: '进京证办理', data: permitData },
        { label: '违法举报', data: violationData },
        { label: '电动车登记', data: ebikeData },
      ],
    }
  }

  private getBusinessDistribution(): Array<{
    type: string
    count: number
    percentage: number
  }> {
    const types = [
      { type: '进京证办理', table: 'permit_applications' },
      { type: '违法举报', table: 'violation_reports' },
      { type: '事故处理', table: 'accident_records' },
      { type: '电动车登记', table: 'ebike_registrations' },
      { type: '预约服务', table: 'appointments' },
      { type: '证照办理', table: 'certificates' },
    ]

    const total = types.reduce((sum, t) => sum + this.countAll(t.table), 0)

    return types.map(t => {
      const count = this.countAll(t.table)
      return {
        type: t.type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }
    })
  }

  private getStatusDistribution(): Array<{
    status: string
    count: number
    percentage: number
  }> {
    const statuses = ['待处理', '处理中', '已完成', '已拒绝']
    const counts = [
      this.countByStatus('permit_applications', 'pending') +
      this.countByStatus('violation_reports', 'pending') +
      this.countByStatus('ebike_registrations', 'pending') +
      this.countByStatus('workflow_tasks', 'pending'),
      this.countByStatus('violation_reports', 'processing') +
      this.countByStatus('accident_records', 'negotiating') +
      this.countByStatus('appointments', 'confirmed'),
      this.countByStatus('permit_applications', 'approved') +
      this.countByStatus('permit_applications', 'verified') +
      this.countByStatus('violation_reports', 'verified') +
      this.countByStatus('ebike_registrations', 'approved') +
      this.countByStatus('certificates', 'valid') +
      this.countByStatus('accident_records', 'closed') +
      this.countByStatus('workflow_tasks', 'approved') +
      this.countByStatus('appointments', 'completed'),
      this.countByStatus('permit_applications', 'rejected') +
      this.countByStatus('violation_reports', 'rejected') +
      this.countByStatus('ebike_registrations', 'rejected') +
      this.countByStatus('workflow_tasks', 'rejected'),
    ]

    const total = counts.reduce((sum, c) => sum + c, 0)

    return statuses.map((status, index) => ({
      status,
      count: counts[index],
      percentage: total > 0 ? Math.round((counts[index] / total) * 100) : 0,
    }))
  }

  getUserStats(userId: number): {
    permits: number
    violations: number
    accidents: number
    ebikes: number
    appointments: number
    certificates: number
  } {
    return {
      permits: this.countByUserId('permit_applications', userId),
      violations: this.countByUserId('violation_reports', userId, 'reporter_id'),
      accidents: this.countByUserId('accident_records', userId, 'reporter_id'),
      ebikes: this.countByUserId('ebike_registrations', userId, 'owner_id'),
      appointments: this.countByUserId('appointments', userId),
      certificates: this.countByUserId('certificates', userId),
    }
  }

  private countByUserId(table: string, userId: number, userIdColumn = 'user_id'): number {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM ${table} WHERE ${userIdColumn} = ?
    `).get(userId) as { count: number }

    return result.count || 0
  }
}
