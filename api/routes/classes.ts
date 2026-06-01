import express, { type Request, type Response } from 'express'
import db from '../database.js'

const router = express.Router()

router.get('/', (req: Request, res: Response) => {
  const { department_id, grade } = req.query

  let sql = `
    SELECT c.*, d.name as department_name
    FROM classes c
    LEFT JOIN departments d ON c.department_id = d.id
    WHERE 1=1
  `
  const params: any[] = []

  if (department_id) {
    sql += ' AND c.department_id = ?'
    params.push(department_id)
  }
  if (grade) {
    sql += ' AND c.grade = ?'
    params.push(grade)
  }
  sql += ' ORDER BY c.id DESC'

  const classes = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: classes
  })
})

router.get('/:id', (req: Request, res: Response) => {
  const cls = db.prepare(`
    SELECT c.*, d.name as department_name
    FROM classes c
    LEFT JOIN departments d ON c.department_id = d.id
    WHERE c.id = ?
  `).get(req.params.id)

  if (!cls) {
    return res.status(404).json({
      success: false,
      error: '班级不存在'
    })
  }

  res.json({
    success: true,
    data: cls
  })
})

router.post('/', (req: Request, res: Response) => {
  const { name, code, grade, student_count, department_id } = req.body

  if (!name || !code) {
    return res.status(400).json({
      success: false,
      error: '班级名称和班级代码为必填项',
      errors: {
        name: !name ? '班级名称不能为空' : null,
        code: !code ? '班级代码不能为空' : null,
      }
    })
  }

  try {
    const result = db.prepare(`
      INSERT INTO classes (name, code, grade, student_count, department_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, code, grade, student_count || 0, department_id || null)

    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({
      success: true,
      data: cls
    })
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        success: false,
        error: '班级代码已存在'
      })
    }
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

router.put('/:id', (req: Request, res: Response) => {
  const { name, code, grade, student_count, department_id } = req.body

  if (!name || !code) {
    return res.status(400).json({
      success: false,
      error: '班级名称和班级代码为必填项',
      errors: {
        name: !name ? '班级名称不能为空' : null,
        code: !code ? '班级代码不能为空' : null,
      }
    })
  }

  try {
    const result = db.prepare(`
      UPDATE classes
      SET name = ?, code = ?, grade = ?, student_count = ?, department_id = ?
      WHERE id = ?
    `).run(name, code, grade, student_count, department_id || null, req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: '班级不存在'
      })
    }

    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id)

    res.json({
      success: true,
      data: cls
    })
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        success: false,
        error: '班级代码已存在'
      })
    }
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

router.delete('/:id', (req: Request, res: Response) => {
  const schedules = db.prepare('SELECT COUNT(*) as count FROM schedules WHERE class_id = ?').get(req.params.id)
  if (schedules.count > 0) {
    return res.status(400).json({
      success: false,
      error: '该班级已有排课记录，无法删除'
    })
  }

  const result = db.prepare('DELETE FROM classes WHERE id = ?').run(req.params.id)

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      error: '班级不存在'
    })
  }

  res.json({
    success: true,
    message: '删除成功'
  })
})

router.get('/:id/students', (req: Request, res: Response) => {
  const students = db.prepare(`
    SELECT s.*
    FROM students s
    WHERE s.class_id = ?
    ORDER BY s.id
  `).all(req.params.id)

  res.json({
    success: true,
    data: students
  })
})

router.get('/:id/schedules', (req: Request, res: Response) => {
  const { semester } = req.query

  let sql = `
    SELECT s.*, c.name as course_name, c.code as course_code,
           t.name as teacher_name, cr.name as classroom_name, cr.building, cr.room_no,
           ts.start_time, ts.end_time, ts.name as slot_name
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    JOIN teachers t ON s.teacher_id = t.id
    JOIN classrooms cr ON s.classroom_id = cr.id
    JOIN time_slots ts ON s.slot_id = ts.id
    WHERE s.class_id = ?
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
    SELECT ca.*, ts.slot_no, ts.start_time, ts.end_time, ts.name as slot_name
    FROM class_availability ca
    JOIN time_slots ts ON ca.slot_id = ts.id
    WHERE ca.class_id = ? AND ca.semester = ?
    ORDER BY ca.day_of_week, ts.slot_no
  `).all(req.params.id, semesterValue)

  res.json({
    success: true,
    data: availability
  })
})

router.post('/:id/availability', (req: Request, res: Response) => {
  const { day_of_week, slot_id, semester, is_available, reason } = req.body
  const classId = req.params.id

  try {
    const result = db.prepare(`
      INSERT OR REPLACE INTO class_availability (class_id, day_of_week, slot_id, semester, is_available, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(classId, day_of_week, slot_id, semester || '2024-2025-2', is_available !== undefined ? is_available : 1, reason || '')

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
  const classId = req.params.id
  const semesterValue = semester || '2024-2025-2'

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO class_availability (class_id, day_of_week, slot_id, semester, is_available, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction((items: any[]) => {
    for (const item of items) {
      insertStmt.run(classId, item.day_of_week, item.slot_id, semesterValue, item.is_available, item.reason || '')
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
