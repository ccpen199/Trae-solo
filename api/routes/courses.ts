import express, { type Request, type Response } from 'express'
import db from '../database.js'

const router = express.Router()

router.get('/', (req: Request, res: Response) => {
  const { department_id, course_type } = req.query

  let sql = `
    SELECT c.*, d.name as department_name
    FROM courses c
    LEFT JOIN departments d ON c.department_id = d.id
    WHERE 1=1
  `
  const params: any[] = []

  if (department_id) {
    sql += ' AND c.department_id = ?'
    params.push(department_id)
  }
  if (course_type) {
    sql += ' AND c.course_type = ?'
    params.push(course_type)
  }
  sql += ' ORDER BY c.id DESC'

  const courses = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: courses
  })
})

router.get('/:id', (req: Request, res: Response) => {
  const course = db.prepare(`
    SELECT c.*, d.name as department_name
    FROM courses c
    LEFT JOIN departments d ON c.department_id = d.id
    WHERE c.id = ?
  `).get(req.params.id)

  if (!course) {
    return res.status(404).json({
      success: false,
      error: '课程不存在'
    })
  }

  res.json({
    success: true,
    data: course
  })
})

router.post('/', (req: Request, res: Response) => {
  const { name, code, credit, hours, course_type, department_id, description, experiment_requirements, need_odd_even } = req.body

  if (!name || !code) {
    return res.status(400).json({
      success: false,
      error: '课程名称和课程代码为必填项',
      errors: {
        name: !name ? '课程名称不能为空' : null,
        code: !code ? '课程代码不能为空' : null,
      }
    })
  }

  try {
    const result = db.prepare(`
      INSERT INTO courses (name, code, credit, hours, course_type, department_id, description, experiment_requirements, need_odd_even)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, code, credit || 0, hours || 0, course_type || 'normal', department_id || null, description || '', experiment_requirements || '', need_odd_even || 0)

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({
      success: true,
      data: course
    })
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        success: false,
        error: '课程代码已存在'
      })
    }
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

router.put('/:id', (req: Request, res: Response) => {
  const { name, code, credit, hours, course_type, department_id, description, experiment_requirements, need_odd_even } = req.body

  if (!name || !code) {
    return res.status(400).json({
      success: false,
      error: '课程名称和课程代码为必填项',
      errors: {
        name: !name ? '课程名称不能为空' : null,
        code: !code ? '课程代码不能为空' : null,
      }
    })
  }

  try {
    const result = db.prepare(`
      UPDATE courses
      SET name = ?, code = ?, credit = ?, hours = ?, course_type = ?, department_id = ?, description = ?, experiment_requirements = ?, need_odd_even = ?
      WHERE id = ?
    `).run(name, code, credit, hours, course_type, department_id || null, description, experiment_requirements || '', need_odd_even || 0, req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: '课程不存在'
      })
    }

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id)

    res.json({
      success: true,
      data: course
    })
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        success: false,
        error: '课程代码已存在'
      })
    }
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

router.delete('/:id', (req: Request, res: Response) => {
  const schedules = db.prepare('SELECT COUNT(*) as count FROM schedules WHERE course_id = ?').get(req.params.id)
  if (schedules.count > 0) {
    return res.status(400).json({
      success: false,
      error: '该课程已有排课记录，无法删除'
    })
  }

  const result = db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id)

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      error: '课程不存在'
    })
  }

  res.json({
    success: true,
    message: '删除成功'
  })
})

router.get('/departments/list', (req: Request, res: Response) => {
  const departments = db.prepare('SELECT * FROM departments ORDER BY id').all()
  res.json({
    success: true,
    data: departments
  })
})

export default router
