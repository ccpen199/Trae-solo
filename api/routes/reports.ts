import express, { type Request, type Response } from 'express'
import db from '../database.js'

const router = express.Router()

router.get('/classroom-utilization', (req: Request, res: Response) => {
  const { semester, building } = req.query

  let sql = `
    SELECT 
      cr.id,
      cr.name,
      cr.building,
      cr.room_no,
      cr.capacity,
      cr.classroom_type,
      COUNT(s.id) as scheduled_slots,
      (COUNT(s.id) * 100.0 / (5 * 10 * 18)) as utilization_rate
    FROM classrooms cr
    LEFT JOIN schedules s ON cr.id = s.classroom_id 
      AND s.status = 'active'
      ${semester ? 'AND s.semester = ?' : ''}
    WHERE 1=1
    ${building ? 'AND cr.building = ?' : ''}
    GROUP BY cr.id
    ORDER BY utilization_rate DESC
  `

  const params: any[] = []
  if (semester) params.push(semester)
  if (building) params.push(building)

  const data = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: data.map(d => ({
      ...d,
      utilization_rate: Number(d.utilization_rate.toFixed(2))
    }))
  })
})

router.get('/teacher-workload', (req: Request, res: Response) => {
  const { semester, department_id } = req.query

  let sql = `
    SELECT 
      t.id,
      t.name,
      t.title,
      t.teacher_no,
      d.name as department_name,
      COUNT(s.id) as class_count,
      SUM(CASE WHEN s.week_type = 'all' THEN 2 ELSE 1 END) as weekly_hours
    FROM teachers t
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN schedules s ON t.id = s.teacher_id 
      AND s.status = 'active'
      ${semester ? 'AND s.semester = ?' : ''}
    WHERE 1=1
    ${department_id ? 'AND t.department_id = ?' : ''}
    GROUP BY t.id
    ORDER BY weekly_hours DESC
  `

  const params: any[] = []
  if (semester) params.push(semester)
  if (department_id) params.push(department_id)

  const data = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data
  })
})

router.get('/adjustment-statistics', (req: Request, res: Response) => {
  const { start_date, end_date } = req.query

  let sql = `
    SELECT 
      adjust_type,
      COUNT(*) as count
    FROM adjustments
    WHERE 1=1
    ${start_date ? 'AND DATE(created_at) >= ?' : ''}
    ${end_date ? 'AND DATE(created_at) <= ?' : ''}
    GROUP BY adjust_type
  `

  const params: any[] = []
  if (start_date) params.push(start_date)
  if (end_date) params.push(end_date)

  const typeStats = db.prepare(sql).all(...params)

  const statusSql = `
    SELECT 
      status,
      COUNT(*) as count
    FROM adjustments
    WHERE 1=1
    ${start_date ? 'AND DATE(created_at) >= ?' : ''}
    ${end_date ? 'AND DATE(created_at) <= ?' : ''}
    GROUP BY status
  `
  const statusStats = db.prepare(statusSql).all(...params)

  const total = db.prepare(`
    SELECT COUNT(*) as total
    FROM adjustments
    WHERE 1=1
    ${start_date ? 'AND DATE(created_at) >= ?' : ''}
    ${end_date ? 'AND DATE(created_at) <= ?' : ''}
  `).get(...params)

  res.json({
    success: true,
    data: {
      total: total.total,
      by_type: typeStats,
      by_status: statusStats
    }
  })
})

router.get('/pending-approvals', (req: Request, res: Response) => {
  const pending = db.prepare(`
    SELECT 
      COUNT(*) as count
    FROM adjustments
    WHERE status = 'pending'
  `).get()

  const recent = db.prepare(`
    SELECT a.*,
           c.name as course_name,
           t.name as teacher_name,
           u.name as applicant_name
    FROM adjustments a
    JOIN schedules s ON a.original_schedule_id = s.id
    JOIN courses c ON s.course_id = c.id
    JOIN teachers t ON s.teacher_id = t.id
    LEFT JOIN users u ON a.applicant_id = u.id
    WHERE a.status = 'pending'
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all()

  res.json({
    success: true,
    data: {
      count: pending.count,
      recent
    }
  })
})

router.get('/conflict-reasons', (req: Request, res: Response) => {
  const { semester } = req.query

  const conflicts = db.prepare(`
    SELECT 
      conflict_type,
      COUNT(*) as count,
      description
    FROM schedule_conflicts
    GROUP BY conflict_type
    ORDER BY count DESC
  `).all()

  res.json({
    success: true,
    data: conflicts
  })
})

router.get('/summary', (req: Request, res: Response) => {
  const { semester } = req.query

  const semesterParam = semester || '2024-2025-2'

  const courses = db.prepare('SELECT COUNT(*) as count FROM courses').get()
  const teachers = db.prepare('SELECT COUNT(*) as count FROM teachers').get()
  const classes = db.prepare('SELECT COUNT(*) as count FROM classes').get()
  const classrooms = db.prepare('SELECT COUNT(*) as count FROM classrooms').get()
  const schedules = db.prepare('SELECT COUNT(*) as count FROM schedules WHERE semester = ? AND status = ?').get(semesterParam, 'active')
  const adjustments = db.prepare('SELECT COUNT(*) as count FROM adjustments').get()
  const pendingAdjustments = db.prepare('SELECT COUNT(*) as count FROM adjustments WHERE status = ?').get('pending')

  res.json({
    success: true,
    data: {
      courses: courses.count,
      teachers: teachers.count,
      classes: classes.count,
      classrooms: classrooms.count,
      schedules: schedules.count,
      adjustments: adjustments.count,
      pending_adjustments: pendingAdjustments.count
    }
  })
})

router.get('/department-stats', (req: Request, res: Response) => {
  const data = db.prepare(`
    SELECT 
      d.id,
      d.name,
      d.code,
      COUNT(DISTINCT t.id) as teacher_count,
      COUNT(DISTINCT c.id) as class_count,
      COUNT(DISTINCT co.id) as course_count,
      COUNT(DISTINCT s.id) as schedule_count
    FROM departments d
    LEFT JOIN teachers t ON d.id = t.department_id
    LEFT JOIN classes c ON d.id = c.department_id
    LEFT JOIN courses co ON d.id = co.department_id
    LEFT JOIN schedules s ON co.id = s.course_id AND s.status = 'active'
    GROUP BY d.id
    ORDER BY d.id
  `).all()

  res.json({
    success: true,
    data
  })
})

router.get('/overview', (req: Request, res: Response) => {
  const semesterParam = '2024-2025-2'

  const classroomUtilization = db.prepare(`
    SELECT 
      cr.id,
      cr.name,
      COUNT(s.id) as scheduled_slots,
      (COUNT(s.id) * 100.0 / (5 * 10 * 18)) as utilization_rate
    FROM classrooms cr
    LEFT JOIN schedules s ON cr.id = s.classroom_id 
      AND s.status = 'active'
      AND s.semester = ?
    GROUP BY cr.id
  `).all(semesterParam)

  const avgUtilization = classroomUtilization.length > 0
    ? Number((classroomUtilization.reduce((sum, c) => sum + c.utilization_rate, 0) / classroomUtilization.length).toFixed(2))
    : 0

  const maxUtilization = classroomUtilization.length > 0
    ? Math.max(...classroomUtilization.map(c => c.utilization_rate))
    : 0

  const minUtilization = classroomUtilization.length > 0
    ? Math.min(...classroomUtilization.map(c => c.utilization_rate))
    : 0

  const highCount = classroomUtilization.filter(c => c.utilization_rate > 80).length
  const mediumCount = classroomUtilization.filter(c => c.utilization_rate >= 50 && c.utilization_rate <= 80).length
  const lowCount = classroomUtilization.filter(c => c.utilization_rate < 50).length

  const teacherWorkload = db.prepare(`
    SELECT 
      t.id,
      t.name,
      COUNT(s.id) as class_count,
      SUM(CASE WHEN s.week_type = 'all' THEN 2 ELSE 1 END) as weekly_hours
    FROM teachers t
    LEFT JOIN schedules s ON t.id = s.teacher_id 
      AND s.status = 'active'
      AND s.semester = ?
    GROUP BY t.id
  `).all(semesterParam)

  const workloads = teacherWorkload.map(t => t.weekly_hours)
  const avgWorkload = workloads.length > 0
    ? Number((workloads.reduce((sum, w) => sum + w, 0) / workloads.length).toFixed(2))
    : 0

  const maxWorkload = workloads.length > 0 ? Math.max(...workloads) : 0
  const minWorkload = workloads.length > 0 ? Math.min(...workloads) : 0

  const teacherWithMax = teacherWorkload.find(t => t.weekly_hours === maxWorkload)
  const teacherWithMin = teacherWorkload.find(t => t.weekly_hours === minWorkload)

  const adjustmentStats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM adjustments
    GROUP BY status
  `).all()

  const adjustmentTypes = db.prepare(`
    SELECT 
      adjust_type,
      COUNT(*) as count
    FROM adjustments
    GROUP BY adjust_type
  `).all()

  const totalAdjustments = adjustmentStats.reduce((sum, s) => sum + s.count, 0)
  const pendingAdjustments = adjustmentStats.find(s => s.status === 'pending')?.count || 0
  const approvedAdjustments = adjustmentStats.find(s => s.status === 'approved')?.count || 0
  const rejectedAdjustments = adjustmentStats.find(s => s.status === 'rejected')?.count || 0

  const conflictStats = db.prepare(`
    SELECT 
      conflict_type,
      COUNT(*) as count
    FROM schedule_conflicts
    WHERE detected_at >= date('now', 'start of month')
    GROUP BY conflict_type
  `).all()

  const totalConflicts = conflictStats.reduce((sum, c) => sum + c.count, 0)
  const teacherConflicts = conflictStats.find(c => c.conflict_type === 'teacher')?.count || 0
  const classroomConflicts = conflictStats.find(c => c.conflict_type === 'classroom')?.count || 0
  const classConflicts = conflictStats.find(c => c.conflict_type === 'class')?.count || 0
  const timeConflicts = conflictStats.find(c => c.conflict_type === 'time')?.count || 0

  const unreadNotifications = db.prepare(`
    SELECT COUNT(*) as count
    FROM notifications
    WHERE is_read = 0
  `).get()

  const recentConflicts = db.prepare(`
    SELECT 
      sc.*,
      c1.name as course1_name,
      c2.name as course2_name,
      t1.name as teacher1_name,
      t2.name as teacher2_name
    FROM schedule_conflicts sc
    JOIN schedules s1 ON sc.schedule_id1 = s1.id
    JOIN schedules s2 ON sc.schedule_id2 = s2.id
    JOIN courses c1 ON s1.course_id = c1.id
    JOIN courses c2 ON s2.course_id = c2.id
    JOIN teachers t1 ON s1.teacher_id = t1.id
    JOIN teachers t2 ON s2.teacher_id = t2.id
    ORDER BY sc.detected_at DESC
    LIMIT 5
  `).all()

  res.json({
    success: true,
    data: {
      classroom_utilization: {
        average: avgUtilization,
        max: Number(maxUtilization.toFixed(2)),
        min: Number(minUtilization.toFixed(2)),
        high_count: highCount,
        medium_count: mediumCount,
        low_count: lowCount,
        top5: classroomUtilization.sort((a, b) => b.utilization_rate - a.utilization_rate).slice(0, 5),
        bottom5: classroomUtilization.sort((a, b) => a.utilization_rate - b.utilization_rate).slice(0, 5)
      },
      teacher_workload: {
        average: avgWorkload,
        max: maxWorkload,
        min: minWorkload,
        max_teacher: teacherWithMax,
        min_teacher: teacherWithMin,
        top10: teacherWorkload.sort((a, b) => b.weekly_hours - a.weekly_hours).slice(0, 10)
      },
      adjustments: {
        total: totalAdjustments,
        pending: pendingAdjustments,
        approved: approvedAdjustments,
        rejected: rejectedAdjustments,
        by_type: adjustmentTypes
      },
      conflicts: {
        total: totalConflicts,
        teacher: teacherConflicts,
        classroom: classroomConflicts,
        class: classConflicts,
        time: timeConflicts,
        recent: recentConflicts
      },
      pending_approvals: pendingAdjustments,
      unread_notifications: unreadNotifications.count
    }
  })
})

export default router
