import { Router, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/overview', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const totalHouseholds = (db.prepare('SELECT COUNT(*) as count FROM households').get() as any).count
    const totalParcels = (db.prepare('SELECT COUNT(*) as count FROM parcels').get() as any).count
    const totalApplications = (db.prepare('SELECT COUNT(*) as count FROM applications').get() as any).count
    const totalAnomalies = (db.prepare('SELECT COUNT(*) as count FROM anomalies').get() as any).count
    const pendingAnomalies = (db.prepare("SELECT COUNT(*) as count FROM anomalies WHERE rectify_status IN ('pending','in_progress')").get() as any).count

    const appByStatus = db.prepare(
      "SELECT status, COUNT(*) as count FROM applications GROUP BY status"
    ).all() as any[]

    const appByType = db.prepare(
      "SELECT type, COUNT(*) as count FROM applications GROUP BY type"
    ).all() as any[]

    const parcelByUsage = db.prepare(
      "SELECT usage, COUNT(*) as count FROM parcels GROUP BY usage"
    ).all() as any[]

    const parcelByOwnership = db.prepare(
      "SELECT ownership_status, COUNT(*) as count FROM parcels GROUP BY ownership_status"
    ).all() as any[]

    const householdByEligibility = db.prepare(
      "SELECT eligibility_status, COUNT(*) as count FROM households GROUP BY eligibility_status"
    ).all() as any[]

    res.json({
      success: true,
      data: {
        totalHouseholds,
        totalParcels,
        totalApplications,
        totalAnomalies,
        pendingAnomalies,
        appByStatus,
        appByType,
        parcelByUsage,
        parcelByOwnership,
        householdByEligibility,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取综合统计失败' })
  }
})

router.get('/parcel-inventory', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const totalArea = db.prepare('SELECT COALESCE(SUM(area), 0) as total FROM parcels').get() as any
    const residenceArea = db.prepare("SELECT COALESCE(SUM(area), 0) as total FROM parcels WHERE usage = 'residence'").get() as any
    const productionArea = db.prepare("SELECT COALESCE(SUM(area), 0) as total FROM parcels WHERE usage = 'production'").get() as any
    const businessArea = db.prepare("SELECT COALESCE(SUM(area), 0) as total FROM parcels WHERE usage = 'business'").get() as any
    const otherArea = db.prepare("SELECT COALESCE(SUM(area), 0) as total FROM parcels WHERE usage = 'other'").get() as any

    const confirmedCount = (db.prepare("SELECT COUNT(*) as count FROM parcels WHERE ownership_status = 'confirmed'").get() as any).count
    const unconfirmedCount = (db.prepare("SELECT COUNT(*) as count FROM parcels WHERE ownership_status = 'unconfirmed'").get() as any).count
    const transferringCount = (db.prepare("SELECT COUNT(*) as count FROM parcels WHERE ownership_status = 'transferring'").get() as any).count
    const exitedCount = (db.prepare("SELECT COUNT(*) as count FROM parcels WHERE ownership_status = 'exited'").get() as any).count

    const exitedArea = db.prepare("SELECT COALESCE(SUM(area), 0) as total FROM parcels WHERE ownership_status = 'exited'").get() as any

    const avgArea = db.prepare('SELECT COALESCE(AVG(area), 0) as avg FROM parcels').get() as any

    res.json({
      success: true,
      data: {
        totalArea: totalArea.total,
        residenceArea: residenceArea.total,
        productionArea: productionArea.total,
        businessArea: businessArea.total,
        otherArea: otherArea.total,
        confirmedCount,
        unconfirmedCount,
        transferringCount,
        exitedCount,
        exitedArea: exitedArea.total,
        avgArea: avgArea.avg,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取宅基地存量统计失败' })
  }
})

router.get('/approval-duration', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const applications = db.prepare(
      `SELECT a.id, a.app_code, a.type, a.status, a.created_at,
       (SELECT operated_at FROM approval_records WHERE application_id = a.id AND action = 'approve' AND stage = 'village_review' ORDER BY operated_at LIMIT 1) as village_approved_at,
       (SELECT operated_at FROM approval_records WHERE application_id = a.id AND action = 'approve' AND stage = 'township_review' ORDER BY operated_at LIMIT 1) as township_approved_at,
       (SELECT operated_at FROM approval_records WHERE application_id = a.id AND action = 'approve' AND stage = 'supervisor_filing' ORDER BY operated_at LIMIT 1) as supervisor_approved_at
       FROM applications a WHERE a.status IN ('approved','supervisor_filing','township_review','village_review')
       ORDER BY a.created_at DESC`
    ).all() as any[]

    const durations = applications.map(app => {
      const created = new Date(app.created_at).getTime()
      const villageEnd = app.village_approved_at ? new Date(app.village_approved_at).getTime() : null
      const townshipEnd = app.township_approved_at ? new Date(app.township_approved_at).getTime() : null
      const supervisorEnd = app.supervisor_approved_at ? new Date(app.supervisor_approved_at).getTime() : null

      return {
        id: app.id,
        app_code: app.app_code,
        type: app.type,
        status: app.status,
        created_at: app.created_at,
        village_duration: villageEnd ? Math.ceil((villageEnd - created) / (1000 * 60 * 60 * 24)) : null,
        township_duration: townshipEnd && villageEnd ? Math.ceil((townshipEnd - villageEnd) / (1000 * 60 * 60 * 24)) : null,
        supervisor_duration: supervisorEnd && townshipEnd ? Math.ceil((supervisorEnd - townshipEnd) / (1000 * 60 * 60 * 24)) : null,
        total_duration: supervisorEnd ? Math.ceil((supervisorEnd - created) / (1000 * 60 * 60 * 24)) : null,
      }
    })

    const completedDurations = durations.filter(d => d.total_duration !== null)
    const avgTotal = completedDurations.length > 0
      ? completedDurations.reduce((sum, d) => sum + (d.total_duration || 0), 0) / completedDurations.length
      : 0

    res.json({
      success: true,
      data: {
        applications: durations,
        avgTotalDays: Math.round(avgTotal * 10) / 10,
        completedCount: completedDurations.length,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取审批时长统计失败' })
  }
})

router.get('/exit-compensation', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const exitApps = db.prepare(
      `SELECT a.*, h.head_name, h.id_card, p.parcel_code, p.area, p.usage
       FROM applications a
       LEFT JOIN households h ON a.household_id = h.id
       LEFT JOIN parcels p ON a.parcel_id = p.id
       WHERE a.type = 'exit'
       ORDER BY a.created_at DESC`
    ).all() as any[]

    const totalExitedArea = exitApps.reduce((sum, app) => sum + (app.area || 0), 0)
    const approvedExits = exitApps.filter(a => a.status === 'approved')
    const pendingExits = exitApps.filter(a => a.status !== 'approved' && a.status !== 'rejected')

    res.json({
      success: true,
      data: {
        totalExits: exitApps.length,
        approvedExits: approvedExits.length,
        pendingExits: pendingExits.length,
        totalExitedArea,
        applications: exitApps,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取退出补偿统计失败' })
  }
})

export default router
