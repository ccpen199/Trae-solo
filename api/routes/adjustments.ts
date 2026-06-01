import express, { type Request, type Response } from 'express'
import db from '../database.js'

const router = express.Router()

function sendNotification(userIds: number[], title: string, content: string, type: string, relatedId: number) {
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, content, type, related_id)
    VALUES (?, ?, ?, ?, ?)
  `)
  userIds.forEach(userId => {
    insertNotif.run(userId, title, content, type, relatedId)
  })
}

router.get('/', (req: Request, res: Response) => {
  const { status, applicant_id, approver_id } = req.query

  let sql = `
    SELECT a.*,
           s.day_of_week, ts.name as slot_name, ts.start_time, ts.end_time,
           c.name as course_name, t.name as teacher_name, cl.name as class_name,
           cr.name as original_classroom,
           ncr.name as new_classroom,
           u.name as applicant_name,
           ap.name as approver_name
    FROM adjustments a
    JOIN schedules s ON a.original_schedule_id = s.id
    JOIN courses c ON s.course_id = c.id
    JOIN teachers t ON s.teacher_id = t.id
    JOIN classes cl ON s.class_id = cl.id
    JOIN time_slots ts ON s.slot_id = ts.id
    LEFT JOIN classrooms cr ON a.original_classroom_id = cr.id
    LEFT JOIN classrooms ncr ON a.new_classroom_id = ncr.id
    LEFT JOIN users u ON a.applicant_id = u.id
    LEFT JOIN users ap ON a.approver_id = ap.id
    WHERE 1=1
  `
  const params: any[] = []

  if (status) {
    sql += ' AND a.status = ?'
    params.push(status)
  }
  if (applicant_id) {
    sql += ' AND a.applicant_id = ?'
    params.push(applicant_id)
  }
  if (approver_id) {
    sql += ' AND a.approver_id = ?'
    params.push(approver_id)
  }
  sql += ' ORDER BY a.created_at DESC'

  const adjustments = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: adjustments
  })
})

router.get('/:id', (req: Request, res: Response) => {
  const adjustment = db.prepare(`
    SELECT a.*,
           s.day_of_week, ts.name as slot_name, ts.start_time, ts.end_time,
           c.name as course_name, t.name as teacher_name, cl.name as class_name,
           cr.name as original_classroom,
           ncr.name as new_classroom,
           u.name as applicant_name,
           ap.name as approver_name
    FROM adjustments a
    JOIN schedules s ON a.original_schedule_id = s.id
    JOIN courses c ON s.course_id = c.id
    JOIN teachers t ON s.teacher_id = t.id
    JOIN classes cl ON s.class_id = cl.id
    JOIN time_slots ts ON s.slot_id = ts.id
    LEFT JOIN classrooms cr ON a.original_classroom_id = cr.id
    LEFT JOIN classrooms ncr ON a.new_classroom_id = ncr.id
    LEFT JOIN users u ON a.applicant_id = u.id
    LEFT JOIN users ap ON a.approver_id = ap.id
    WHERE a.id = ?
  `).get(req.params.id)

  if (!adjustment) {
    return res.status(404).json({
      success: false,
      error: '调课申请不存在'
    })
  }

  res.json({
    success: true,
    data: adjustment
  })
})

router.post('/', (req: Request, res: Response) => {
  const {
    original_schedule_id,
    applicant_id,
    applicant_type,
    adjust_type,
    original_day_of_week,
    original_slot_id,
    original_classroom_id,
    new_day_of_week,
    new_slot_id,
    new_classroom_id,
    reason,
    affected_students
  } = req.body

  try {
    const result = db.prepare(`
      INSERT INTO adjustments (
        original_schedule_id, applicant_id, applicant_type, adjust_type,
        original_day_of_week, original_slot_id, original_classroom_id,
        new_day_of_week, new_slot_id, new_classroom_id,
        reason, affected_students
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      original_schedule_id,
      applicant_id,
      applicant_type,
      adjust_type,
      original_day_of_week,
      original_slot_id,
      original_classroom_id,
      new_day_of_week || null,
      new_slot_id || null,
      new_classroom_id || null,
      reason,
      affected_students || ''
    )

    const adjustment = db.prepare(`
      SELECT a.*, c.name as course_name, t.name as teacher_name
      FROM adjustments a
      JOIN schedules s ON a.original_schedule_id = s.id
      JOIN courses c ON s.course_id = c.id
      JOIN teachers t ON s.teacher_id = t.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid)

    const approvers = db.prepare(`
      SELECT id FROM users WHERE role IN ('admin', 'dean')
    `).all()
    sendNotification(
      approvers.map(u => u.id),
      '新调课申请待审批',
      `${adjustment.teacher_name} 申请调课：${adjustment.course_name}`,
      'adjustment',
      Number(result.lastInsertRowid)
    )

    res.status(201).json({
      success: true,
      data: adjustment
    })
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

router.post('/:id/approve', (req: Request, res: Response) => {
  const { approver_id, approval_comment } = req.body

  const adjustment = db.prepare('SELECT * FROM adjustments WHERE id = ?').get(req.params.id)
  if (!adjustment) {
    return res.status(404).json({
      success: false,
      error: '调课申请不存在'
    })
  }

  if (adjustment.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: '该申请已处理'
    })
  }

  const updateStmt = db.prepare(`
    UPDATE adjustments
    SET status = 'approved', approver_id = ?, approval_comment = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  updateStmt.run(approver_id, approval_comment || '', req.params.id)

  if (adjustment.adjust_type === 'cancel') {
    db.prepare('UPDATE schedules SET status = ? WHERE id = ?').run('cancelled', adjustment.original_schedule_id)
  } else if (adjustment.adjust_type === 'change_time' || adjustment.adjust_type === 'change_room') {
    db.prepare(`
      UPDATE schedules
      SET day_of_week = COALESCE(?, day_of_week),
          slot_id = COALESCE(?, slot_id),
          classroom_id = COALESCE(?, classroom_id),
          status = 'adjusted'
      WHERE id = ?
    `).run(adjustment.new_day_of_week, adjustment.new_slot_id, adjustment.new_classroom_id, adjustment.original_schedule_id)
  } else if (adjustment.adjust_type === 'reschedule') {
    const oldSchedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(adjustment.original_schedule_id)
    if (oldSchedule) {
      db.prepare(`
        INSERT INTO schedules (course_id, teacher_id, class_id, classroom_id, day_of_week, slot_id, week_type, start_week, end_week, semester, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'adjusted')
      `).run(
        oldSchedule.course_id,
        oldSchedule.teacher_id,
        oldSchedule.class_id,
        adjustment.new_classroom_id || oldSchedule.classroom_id,
        adjustment.new_day_of_week || oldSchedule.day_of_week,
        adjustment.new_slot_id || oldSchedule.slot_id,
        oldSchedule.week_type,
        oldSchedule.start_week,
        oldSchedule.end_week,
        oldSchedule.semester
      )
    }
  }

  const schedule = db.prepare(`
    SELECT s.*, c.name as course_name, t.name as teacher_name, u.id as user_id
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    JOIN teachers t ON s.teacher_id = t.id
    LEFT JOIN users u ON t.user_id = u.id
    WHERE s.id = ?
  `).get(adjustment.original_schedule_id)

  const classStudents = db.prepare(`
    SELECT u.id
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.class_id = ?
  `).all(schedule?.class_id)

  const userIds = classStudents.map(s => s.id)
  if (schedule?.user_id) userIds.push(schedule.user_id)

  const typeMap: Record<string, string> = {
    'change_time': 'adjustment',
    'change_room': 'room_change',
    'cancel': 'cancellation',
    'reschedule': 'makeup'
  }

  sendNotification(
    userIds,
    '调课申请已通过',
    `${schedule?.course_name} 的调课申请已通过审批`,
    typeMap[adjustment.adjust_type] || 'adjustment',
    Number(req.params.id)
  )

  res.json({
    success: true,
    message: '审批通过'
  })
})

router.post('/:id/reject', (req: Request, res: Response) => {
  const { approver_id, approval_comment } = req.body

  const adjustment = db.prepare('SELECT * FROM adjustments WHERE id = ?').get(req.params.id)
  if (!adjustment) {
    return res.status(404).json({
      success: false,
      error: '调课申请不存在'
    })
  }

  if (adjustment.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: '该申请已处理'
    })
  }

  db.prepare(`
    UPDATE adjustments
    SET status = 'rejected', approver_id = ?, approval_comment = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(approver_id, approval_comment || '', req.params.id)

  const schedule = db.prepare(`
    SELECT s.*, c.name as course_name, t.name as teacher_name, u.id as user_id
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    JOIN teachers t ON s.teacher_id = t.id
    LEFT JOIN users u ON t.user_id = u.id
    WHERE s.id = ?
  `).get(adjustment.original_schedule_id)

  if (schedule?.user_id) {
    sendNotification(
      [schedule.user_id],
      '调课申请被拒绝',
      `${schedule.course_name} 的调课申请被拒绝：${approval_comment || '无'}`,
      'adjustment',
      Number(req.params.id)
    )
  }

  res.json({
    success: true,
    message: '已拒绝'
  })
})

router.delete('/:id', (req: Request, res: Response) => {
  const adjustment = db.prepare('SELECT * FROM adjustments WHERE id = ?').get(req.params.id)
  if (!adjustment) {
    return res.status(404).json({
      success: false,
      error: '调课申请不存在'
    })
  }

  if (adjustment.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: '只能撤销待审批的申请'
    })
  }

  db.prepare('UPDATE adjustments SET status = ? WHERE id = ?').run('cancelled', req.params.id)

  res.json({
    success: true,
    message: '已撤销'
  })
})

export default router
