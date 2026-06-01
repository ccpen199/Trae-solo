import express, { type Request, type Response } from 'express'
import db from '../database.js'

const router = express.Router()

router.get('/', (req: Request, res: Response) => {
  const { department_id } = req.query

  let sql = `
    SELECT t.*, d.name as department_name
    FROM teachers t
    LEFT JOIN departments d ON t.department_id = d.id
    WHERE 1=1
  `
  const params: any[] = []

  if (department_id) {
    sql += ' AND t.department_id = ?'
    params.push(department_id)
  }
  sql += ' ORDER BY t.id DESC'

  const teachers = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: teachers
  })
})

router.get('/:id', (req: Request, res: Response) => {
  const teacher = db.prepare(`
    SELECT t.*, d.name as department_name
    FROM teachers t
    LEFT JOIN departments d ON t.department_id = d.id
    WHERE t.id = ?
  `).get(req.params.id)

  if (!teacher) {
    return res.status(404).json({
      success: false,
      error: '教师不存在'
    })
  }

  res.json({
    success: true,
    data: teacher
  })
})

router.post('/', (req: Request, res: Response) => {
  const { name, title, department_id, teacher_no, phone, email } = req.body

  if (!name || !teacher_no) {
    return res.status(400).json({
      success: false,
      error: '教师姓名和工号为必填项',
      errors: {
        name: !name ? '教师姓名不能为空' : null,
        teacher_no: !teacher_no ? '教师工号不能为空' : null,
      }
    })
  }

  try {
    const result = db.prepare(`
      INSERT INTO teachers (name, title, department_id, teacher_no, phone, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, title || '', department_id || null, teacher_no, phone || '', email || '')

    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({
      success: true,
      data: teacher
    })
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        success: false,
        error: '教师编号已存在'
      })
    }
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

router.put('/:id', (req: Request, res: Response) => {
  const { name, title, department_id, teacher_no, phone, email } = req.body

  if (!name || !teacher_no) {
    return res.status(400).json({
      success: false,
      error: '教师姓名和工号为必填项',
      errors: {
        name: !name ? '教师姓名不能为空' : null,
        teacher_no: !teacher_no ? '教师工号不能为空' : null,
      }
    })
  }

  try {
    const result = db.prepare(`
      UPDATE teachers
      SET name = ?, title = ?, department_id = ?, teacher_no = ?, phone = ?, email = ?
      WHERE id = ?
    `).run(name, title, department_id || null, teacher_no, phone || '', email || '', req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: '教师不存在'
      })
    }

    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id)

    res.json({
      success: true,
      data: teacher
    })
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        success: false,
        error: '教师编号已存在'
      })
    }
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

router.delete('/:id', (req: Request, res: Response) => {
  const schedules = db.prepare('SELECT COUNT(*) as count FROM schedules WHERE teacher_id = ?').get(req.params.id)
  if (schedules.count > 0) {
    return res.status(400).json({
      success: false,
      error: '该教师已有排课记录，无法删除'
    })
  }

  const result = db.prepare('DELETE FROM teachers WHERE id = ?').run(req.params.id)

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      error: '教师不存在'
    })
  }

  res.json({
    success: true,
    message: '删除成功'
  })
})

router.get('/:id/schedules', (req: Request, res: Response) => {
  const { semester } = req.query

  let sql = `
    SELECT s.*, c.name as course_name, c.code as course_code,
           cl.name as class_name, cr.name as classroom_name, cr.building, cr.room_no,
           ts.start_time, ts.end_time, ts.name as slot_name
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    JOIN classes cl ON s.class_id = cl.id
    JOIN classrooms cr ON s.classroom_id = cr.id
    JOIN time_slots ts ON s.slot_id = ts.id
    WHERE s.teacher_id = ?
  `
  const params: any[] = [req.params.id]

  if (semester) {
    sql += ' AND s.semester = ?'
    params.push(semester)
  }
  sql += ' ORDER BY s.day_of_week, s.slot_id'

  const schedules = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: schedules
  })
})

router.get('/:id/availability', (req: Request, res: Response) => {
  const { semester } = req.query
  const semesterValue = semester || '2024-2025-2'

  const availability = db.prepare(`
    SELECT ta.*, ts.slot_no, ts.start_time, ts.end_time, ts.name as slot_name
    FROM teacher_availability ta
    JOIN time_slots ts ON ta.slot_id = ts.id
    WHERE ta.teacher_id = ? AND ta.semester = ?
    ORDER BY ta.day_of_week, ts.slot_no
  `).all(req.params.id, semesterValue)

  res.json({
    success: true,
    data: availability
  })
})

router.post('/:id/availability', (req: Request, res: Response) => {
  const { day_of_week, slot_id, semester, is_available } = req.body
  const teacherId = req.params.id

  try {
    const result = db.prepare(`
      INSERT OR REPLACE INTO teacher_availability (teacher_id, day_of_week, slot_id, semester, is_available)
      VALUES (?, ?, ?, ?, ?)
    `).run(teacherId, day_of_week, slot_id, semester || '2024-2025-2', is_available !== undefined ? is_available : 1)

    res.json({
      success: true,
      message: '可用时段已更新'
    })
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

router.put('/:id/availability/batch', (req: Request, res: Response) => {
  const { availability, semester } = req.body
  const teacherId = req.params.id
  const semesterValue = semester || '2024-2025-2'

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO teacher_availability (teacher_id, day_of_week, slot_id, semester, is_available)
    VALUES (?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction((items: any[]) => {
    for (const item of items) {
      insertStmt.run(teacherId, item.day_of_week, item.slot_id, semesterValue, item.is_available)
    }
  })

  try {
    transaction(availability)
    res.json({
      success: true,
      message: '可用时段已批量更新'
    })
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

export default router
