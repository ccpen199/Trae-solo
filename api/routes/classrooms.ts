import express, { type Request, type Response } from 'express'
import db from '../database.js'

const router = express.Router()

router.get('/', (req: Request, res: Response) => {
  const { building, classroom_type, min_capacity } = req.query

  let sql = `
    SELECT *
    FROM classrooms
    WHERE 1=1
  `
  const params: any[] = []

  if (building) {
    sql += ' AND building = ?'
    params.push(building)
  }
  if (classroom_type) {
    sql += ' AND classroom_type = ?'
    params.push(classroom_type)
  }
  if (min_capacity) {
    sql += ' AND capacity >= ?'
    params.push(min_capacity)
  }
  sql += ' ORDER BY id DESC'

  const classrooms = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: classrooms
  })
})

router.get('/buildings', (req: Request, res: Response) => {
  const buildings = db.prepare(`
    SELECT DISTINCT building
    FROM classrooms
    ORDER BY building
  `).all()

  res.json({
    success: true,
    data: buildings.map(b => b.building)
  })
})

router.get('/:id', (req: Request, res: Response) => {
  const classroom = db.prepare('SELECT * FROM classrooms WHERE id = ?').get(req.params.id)

  if (!classroom) {
    return res.status(404).json({
      success: false,
      error: '教室不存在'
    })
  }

  res.json({
    success: true,
    data: classroom
  })
})

router.post('/', (req: Request, res: Response) => {
  const { name, building, room_no, capacity, classroom_type, equipment, status } = req.body

  try {
    const result = db.prepare(`
      INSERT INTO classrooms (name, building, room_no, capacity, classroom_type, equipment, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, building, room_no, capacity || 0, classroom_type || 'normal', equipment || '', status || 'available')

    const classroom = db.prepare('SELECT * FROM classrooms WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({
      success: true,
      data: classroom
    })
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        success: false,
        error: '该教学楼此教室号已存在'
      })
    }
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

router.put('/:id', (req: Request, res: Response) => {
  const { name, building, room_no, capacity, classroom_type, equipment, status } = req.body

  try {
    const result = db.prepare(`
      UPDATE classrooms
      SET name = ?, building = ?, room_no = ?, capacity = ?, classroom_type = ?, equipment = ?, status = ?
      WHERE id = ?
    `).run(name, building, room_no, capacity, classroom_type, equipment || '', status, req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: '教室不存在'
      })
    }

    const classroom = db.prepare('SELECT * FROM classrooms WHERE id = ?').get(req.params.id)

    res.json({
      success: true,
      data: classroom
    })
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        success: false,
        error: '该教学楼此教室号已存在'
      })
    }
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

router.delete('/:id', (req: Request, res: Response) => {
  const schedules = db.prepare('SELECT COUNT(*) as count FROM schedules WHERE classroom_id = ?').get(req.params.id)
  if (schedules.count > 0) {
    return res.status(400).json({
      success: false,
      error: '该教室已有排课记录，无法删除'
    })
  }

  const result = db.prepare('DELETE FROM classrooms WHERE id = ?').run(req.params.id)

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      error: '教室不存在'
    })
  }

  res.json({
    success: true,
    message: '删除成功'
  })
})

router.get('/:id/availability', (req: Request, res: Response) => {
  const { semester, day_of_week } = req.query

  let sql = `
    SELECT s.*, c.name as course_name, t.name as teacher_name,
           ts.start_time, ts.end_time, ts.name as slot_name
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    JOIN teachers t ON s.teacher_id = t.id
    JOIN time_slots ts ON s.slot_id = ts.id
    WHERE s.classroom_id = ? AND s.status = 'active'
  `
  const params: any[] = [req.params.id]

  if (semester) {
    sql += ' AND s.semester = ?'
    params.push(semester)
  }
  if (day_of_week) {
    sql += ' AND s.day_of_week = ?'
    params.push(day_of_week)
  }
  sql += ' ORDER BY s.day_of_week, s.slot_id'

  const schedules = db.prepare(sql).all(...params)

  const allSlots = db.prepare('SELECT * FROM time_slots ORDER BY slot_no').all()

  res.json({
    success: true,
    data: {
      occupied: schedules,
      allSlots
    }
  })
})

export default router
