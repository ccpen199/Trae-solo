import express, { type Request, type Response } from 'express'
import db from '../database.js'

const router = express.Router()

function formatWeekRange(startWeek: number, endWeek: number, weekType: string) {
  const weekTypeText = weekType === 'all' ? '全周' : weekType === 'odd' ? '单周' : '双周'
  return `${weekTypeText} 第${startWeek}-${endWeek}周`
}

function checkConflicts(schedule: any, excludeId?: number) {
  const conflicts: any[] = []
  const { teacher_id, classroom_id, class_id, day_of_week, slot_id, week_type, start_week, end_week, semester, course_id } = schedule
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  const teacher = db.prepare('SELECT name FROM teachers WHERE id = ?').get(teacher_id)
  const classroom = db.prepare('SELECT name, capacity, classroom_type FROM classrooms WHERE id = ?').get(classroom_id)
  const cls = db.prepare('SELECT name, student_count FROM classes WHERE id = ?').get(class_id)
  const course = db.prepare('SELECT name, course_type FROM courses WHERE id = ?').get(course_id)
  const slot = db.prepare('SELECT name FROM time_slots WHERE id = ?').get(slot_id)

  const teacherConflictSql = `
    SELECT s.*, c.name as course_name, cr.name as classroom_name, ts.name as slot_name
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    JOIN classrooms cr ON s.classroom_id = cr.id
    JOIN time_slots ts ON s.slot_id = ts.id
    WHERE s.teacher_id = ? 
      AND s.day_of_week = ? 
      AND s.slot_id = ?
      AND s.semester = ?
      AND s.status = 'active'
      AND s.id != ?
      AND (
        (s.week_type = 'all' OR ? IN ('all', s.week_type))
        AND NOT (s.end_week < ? OR s.start_week > ?)
      )
  `
  const teacherConflicts = db.prepare(teacherConflictSql).all(
    teacher_id, day_of_week, slot_id, semester, excludeId || 0, week_type, start_week, end_week
  )
  if (teacherConflicts.length > 0) {
    const conflict = teacherConflicts[0]
    conflicts.push({
      type: 'teacher_time',
      severity: 'error',
      category: 'teacher',
      title: '教师时间冲突',
      message: `${teacher?.name || '教师'} ${weekDays[day_of_week - 1]} ${slot?.name || ''} 已有${conflict.course_name}排课 (${conflict.classroom_name})`,
      detailed_message: `${teacher?.name || '教师'} 在 ${weekDays[day_of_week - 1]} ${slot?.name || ''} (${formatWeekRange(conflict.start_week, conflict.end_week, conflict.week_type)}) 已有 ${conflict.course_name} 课程安排在 ${conflict.classroom_name}`,
      suggestion: '建议调整时间或更换教师',
      details: teacherConflicts
    })
  }

  const oddEvenOverlapSql = `
    SELECT s.*, c.name as course_name, t.name as teacher_name, ts.name as slot_name
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    JOIN teachers t ON s.teacher_id = t.id
    JOIN time_slots ts ON s.slot_id = ts.id
    WHERE s.class_id = ? 
      AND s.day_of_week = ? 
      AND s.slot_id = ?
      AND s.semester = ?
      AND s.status = 'active'
      AND s.id != ?
      AND s.week_type != ?
      AND ? = 'all'
      AND NOT (s.end_week < ? OR s.start_week > ?)
  `
  const oddEvenConflicts = db.prepare(oddEvenOverlapSql).all(
    class_id, day_of_week, slot_id, semester, excludeId || 0, week_type, week_type, start_week, end_week
  )
  if (oddEvenConflicts.length > 0) {
    const conflict = oddEvenConflicts[0]
    conflicts.push({
      type: 'odd_even_overlap',
      severity: 'warning',
      category: 'odd_even',
      title: '单双周重叠',
      message: `${weekDays[day_of_week - 1]} ${slot?.name || ''} 已有${conflict.week_type === 'odd' ? '单周' : '双周'}课，全周排课会重叠`,
      detailed_message: `${cls?.name || '班级'} 在 ${weekDays[day_of_week - 1]} ${slot?.name || ''} 已有 ${conflict.week_type === 'odd' ? '单周' : '双周'} 课程 ${conflict.course_name}，设置全周排课会导致重叠`,
      suggestion: '建议设置为单周或双周排课，避免与现有课程冲突',
      details: oddEvenConflicts
    })
  }

  const classroomConflictSql = `
    SELECT s.*, c.name as course_name, t.name as teacher_name, ts.name as slot_name
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    JOIN teachers t ON s.teacher_id = t.id
    JOIN time_slots ts ON s.slot_id = ts.id
    WHERE s.classroom_id = ? 
      AND s.day_of_week = ? 
      AND s.slot_id = ?
      AND s.semester = ?
      AND s.status = 'active'
      AND s.id != ?
      AND (
        (s.week_type = 'all' OR ? IN ('all', s.week_type))
        AND NOT (s.end_week < ? OR s.start_week > ?)
      )
  `
  const classroomConflicts = db.prepare(classroomConflictSql).all(
    classroom_id, day_of_week, slot_id, semester, excludeId || 0, week_type, start_week, end_week
  )
  if (classroomConflicts.length > 0) {
    const conflict = classroomConflicts[0]
    conflicts.push({
      type: 'classroom_time',
      severity: 'error',
      category: 'classroom',
      title: '教室时间冲突',
      message: `${classroom?.name || '教室'} ${weekDays[day_of_week - 1]} ${slot?.name || ''} 已有${conflict.course_name}排课`,
      detailed_message: `${classroom?.name || '教室'} 在 ${weekDays[day_of_week - 1]} ${slot?.name || ''} (${formatWeekRange(conflict.start_week, conflict.end_week, conflict.week_type)}) 已有 ${conflict.course_name} (${conflict.teacher_name}) 排课`,
      suggestion: '建议调整时间或更换教室',
      details: classroomConflicts
    })
  }

  const classConflictSql = `
    SELECT s.*, c.name as course_name, t.name as teacher_name, cr.name as classroom_name, ts.name as slot_name
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    JOIN teachers t ON s.teacher_id = t.id
    JOIN classrooms cr ON s.classroom_id = cr.id
    JOIN time_slots ts ON s.slot_id = ts.id
    WHERE s.class_id = ? 
      AND s.day_of_week = ? 
      AND s.slot_id = ?
      AND s.semester = ?
      AND s.status = 'active'
      AND s.id != ?
      AND (
        (s.week_type = 'all' OR ? IN ('all', s.week_type))
        AND NOT (s.end_week < ? OR s.start_week > ?)
      )
  `
  const classConflicts = db.prepare(classConflictSql).all(
    class_id, day_of_week, slot_id, semester, excludeId || 0, week_type, start_week, end_week
  )
  if (classConflicts.length > 0) {
    const conflict = classConflicts[0]
    conflicts.push({
      type: 'class_time',
      severity: 'error',
      category: 'class',
      title: '班级时间冲突',
      message: `${cls?.name || '班级'} ${weekDays[day_of_week - 1]} ${slot?.name || ''} 已有${conflict.course_name}排课`,
      detailed_message: `${cls?.name || '班级'} 在 ${weekDays[day_of_week - 1]} ${slot?.name || ''} (${formatWeekRange(conflict.start_week, conflict.end_week, conflict.week_type)}) 已有 ${conflict.course_name} (${conflict.teacher_name}) 排课`,
      suggestion: '建议调整时间或更换班级',
      details: classConflicts
    })
  }

  if (classroom && cls && classroom.capacity < cls.student_count) {
    conflicts.push({
      type: 'capacity_insufficient',
      severity: 'error',
      category: 'capacity',
      title: '教室容量不足',
      message: `容量不足：${classroom.name}${classroom.capacity}人，${cls.name}${cls.student_count}人`,
      detailed_message: `教室 ${classroom.name} 容量为 ${classroom.capacity} 人，但 ${cls.name} 有 ${cls.student_count} 名学生，超出容量 ${cls.student_count - classroom.capacity} 人`,
      suggestion: '建议更换更大容量的教室或分班授课',
      details: { classroom_capacity: classroom.capacity, class_student_count: cls.student_count }
    })
  }

  if (course && course.course_type === 'experiment' && classroom && classroom.classroom_type !== 'experiment') {
    conflicts.push({
      type: 'classroom_type_mismatch',
      severity: 'warning',
      category: 'classroom_type',
      title: '实验课类型不匹配',
      message: `实验室要求：${course.name}需要实验室，但当前是${classroom.classroom_type === 'normal' ? '普通' : classroom.classroom_type === 'multimedia' ? '多媒体' : '阶梯'}教室`,
      detailed_message: `课程 ${course.name} 是实验课，需要实验室教室，但当前选择的 ${classroom.name} 是 ${classroom.classroom_type === 'normal' ? '普通' : classroom.classroom_type === 'multimedia' ? '多媒体' : '阶梯'} 教室`,
      suggestion: '建议更换为实验室教室，或确认普通教室是否满足实验条件',
      details: { course_type: course.course_type, classroom_type: classroom.classroom_type }
    })
  }

  const teacherAvail = db.prepare(`
    SELECT is_available FROM teacher_availability 
    WHERE teacher_id = ? AND day_of_week = ? AND slot_id = ? AND semester = ?
  `).get(teacher_id, day_of_week, slot_id, semester)
  if (teacherAvail && teacherAvail.is_available === 0) {
    conflicts.push({
      type: 'teacher_unavailable',
      severity: 'error',
      category: 'teacher',
      title: '教师可用时段冲突',
      message: `${teacher?.name || '教师'} ${weekDays[day_of_week - 1]} ${slot?.name || ''} 为不可排课时段`,
      detailed_message: `${teacher?.name || '教师'} 在 ${weekDays[day_of_week - 1]} ${slot?.name || ''} 已设置为不可排课时段`,
      suggestion: '建议调整时间或与教师确认可用时间',
      details: null
    })
  }

  const classAvail = db.prepare(`
    SELECT is_available, reason FROM class_availability 
    WHERE class_id = ? AND day_of_week = ? AND slot_id = ? AND semester = ?
  `).get(class_id, day_of_week, slot_id, semester)
  if (classAvail && classAvail.is_available === 0) {
    conflicts.push({
      type: 'class_unavailable',
      severity: 'warning',
      category: 'class',
      title: '班级可排时段冲突',
      message: `${cls?.name || '班级'} ${weekDays[day_of_week - 1]} ${slot?.name || ''} 为${classAvail.reason || '不可排课时段'}`,
      detailed_message: `${cls?.name || '班级'} 在 ${weekDays[day_of_week - 1]} ${slot?.name || ''} 为 ${classAvail.reason || '不可排课时段'}`,
      suggestion: '建议调整时间或确认是否必须安排在此时段',
      details: { reason: classAvail.reason }
    })
  }

  return conflicts
}

router.get('/', (req: Request, res: Response) => {
  const { semester, teacher_id, class_id, classroom_id, day_of_week } = req.query

  let sql = `
    SELECT s.*, c.name as course_name, c.code as course_code, c.course_type,
           t.name as teacher_name, t.teacher_no,
           cl.name as class_name, cl.code as class_code, cl.student_count,
           cr.name as classroom_name, cr.building, cr.room_no, cr.capacity, cr.classroom_type,
           ts.slot_no, ts.start_time, ts.end_time, ts.name as slot_name
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    JOIN teachers t ON s.teacher_id = t.id
    JOIN classes cl ON s.class_id = cl.id
    JOIN classrooms cr ON s.classroom_id = cr.id
    JOIN time_slots ts ON s.slot_id = ts.id
    WHERE 1=1
  `
  const params: any[] = []

  if (semester) {
    sql += ' AND s.semester = ?'
    params.push(semester)
  }
  if (teacher_id) {
    sql += ' AND s.teacher_id = ?'
    params.push(teacher_id)
  }
  if (class_id) {
    sql += ' AND s.class_id = ?'
    params.push(class_id)
  }
  if (classroom_id) {
    sql += ' AND s.classroom_id = ?'
    params.push(classroom_id)
  }
  if (day_of_week) {
    sql += ' AND s.day_of_week = ?'
    params.push(day_of_week)
  }
  sql += ' ORDER BY s.day_of_week, ts.slot_no'

  const schedules = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: schedules
  })
})

router.get('/time-slots', (req: Request, res: Response) => {
  const slots = db.prepare('SELECT * FROM time_slots ORDER BY slot_no').all()
  res.json({
    success: true,
    data: slots
  })
})

router.get('/semesters', (req: Request, res: Response) => {
  const semesters = db.prepare(`
    SELECT DISTINCT semester
    FROM schedules
    ORDER BY semester DESC
  `).all()
  res.json({
    success: true,
    data: semesters.map(s => s.semester)
  })
})

router.get('/:id', (req: Request, res: Response) => {
  const schedule = db.prepare(`
    SELECT s.*, c.name as course_name, c.code as course_code,
           t.name as teacher_name, cl.name as class_name,
           cr.name as classroom_name, ts.start_time, ts.end_time, ts.name as slot_name
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    JOIN teachers t ON s.teacher_id = t.id
    JOIN classes cl ON s.class_id = cl.id
    JOIN classrooms cr ON s.classroom_id = cr.id
    JOIN time_slots ts ON s.slot_id = ts.id
    WHERE s.id = ?
  `).get(req.params.id)

  if (!schedule) {
    return res.status(404).json({
      success: false,
      error: '排课不存在'
    })
  }

  res.json({
    success: true,
    data: schedule
  })
})

router.post('/check-conflict', (req: Request, res: Response) => {
  const conflicts = checkConflicts(req.body)
  res.json({
    success: true,
    data: {
      hasConflict: conflicts.length > 0,
      conflicts,
      structured_conflicts: conflicts
    }
  })
})

router.post('/', (req: Request, res: Response) => {
  const { course_id, teacher_id, class_id, classroom_id, day_of_week, slot_id, week_type, start_week, end_week, semester } = req.body

  const conflicts = checkConflicts(req.body)
  if (conflicts.length > 0) {
    return res.status(400).json({
      success: false,
      error: '存在冲突',
      conflicts,
      structured_conflicts: conflicts
    })
  }

  try {
    const result = db.prepare(`
      INSERT INTO schedules (course_id, teacher_id, class_id, classroom_id, day_of_week, slot_id, week_type, start_week, end_week, semester)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(course_id, teacher_id, class_id, classroom_id, day_of_week, slot_id, week_type || 'all', start_week || 1, end_week || 18, semester)

    const schedule = db.prepare(`
      SELECT s.*, c.name as course_name, t.name as teacher_name, cl.name as class_name, cr.name as classroom_name
      FROM schedules s
      JOIN courses c ON s.course_id = c.id
      JOIN teachers t ON s.teacher_id = t.id
      JOIN classes cl ON s.class_id = cl.id
      JOIN classrooms cr ON s.classroom_id = cr.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({
      success: true,
      data: schedule
    })
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

router.put('/:id', (req: Request, res: Response) => {
  const { course_id, teacher_id, class_id, classroom_id, day_of_week, slot_id, week_type, start_week, end_week, semester } = req.body

  const conflicts = checkConflicts(req.body, Number(req.params.id))
  if (conflicts.length > 0) {
    return res.status(400).json({
      success: false,
      error: '存在冲突',
      conflicts
    })
  }

  try {
    const result = db.prepare(`
      UPDATE schedules
      SET course_id = ?, teacher_id = ?, class_id = ?, classroom_id = ?, 
          day_of_week = ?, slot_id = ?, week_type = ?, start_week = ?, end_week = ?, semester = ?
      WHERE id = ?
    `).run(course_id, teacher_id, class_id, classroom_id, day_of_week, slot_id, week_type, start_week, end_week, semester, req.params.id)

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: '排课不存在'
      })
    }

    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id)

    res.json({
      success: true,
      data: schedule
    })
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id)

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      error: '排课不存在'
    })
  }

  res.json({
    success: true,
    message: '删除成功'
  })
})

router.get('/conflicts/list', (req: Request, res: Response) => {
  const { semester } = req.query

  let sql = `
    SELECT sc.*, 
           s1.day_of_week as day1, ts1.name as slot1, c1.name as course1, t1.name as teacher1,
           s2.day_of_week as day2, ts2.name as slot2, c2.name as course2, t2.name as teacher2
    FROM schedule_conflicts sc
    JOIN schedules s1 ON sc.schedule_id1 = s1.id
    JOIN schedules s2 ON sc.schedule_id2 = s2.id
    JOIN courses c1 ON s1.course_id = c1.id
    JOIN courses c2 ON s2.course_id = c2.id
    JOIN teachers t1 ON s1.teacher_id = t1.id
    JOIN teachers t2 ON s2.teacher_id = t2.id
    JOIN time_slots ts1 ON s1.slot_id = ts1.id
    JOIN time_slots ts2 ON s2.slot_id = ts2.id
    WHERE 1=1
  `
  const params: any[] = []

  if (semester) {
    sql += ' AND s1.semester = ?'
    params.push(semester)
  }
  sql += ' ORDER BY sc.detected_at DESC'

  const conflicts = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: conflicts
  })
})

export default router
