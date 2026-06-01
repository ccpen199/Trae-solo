import express, { type Request, type Response } from 'express'
import db, { initDatabase } from '../database.js'

const router = express.Router()

router.post('/reset', (req: Request, res: Response) => {
  const tables = [
    'notifications',
    'adjustments',
    'schedule_conflicts',
    'schedules',
    'time_slots',
    'calendar',
    'classrooms',
    'students',
    'classes',
    'teachers',
    'courses',
    'departments',
    'users',
    'operation_logs'
  ]

  try {
    tables.forEach(table => {
      db.prepare(`DELETE FROM ${table}`).run()
      db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table)
    })

    initDatabase()

    res.json({
      success: true,
      message: '数据已重置并重新初始化种子数据'
    })
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

router.get('/test-data', (req: Request, res: Response) => {
  const data = {
    users: db.prepare('SELECT * FROM users LIMIT 5').all(),
    departments: db.prepare('SELECT * FROM departments').all(),
    courses: db.prepare('SELECT * FROM courses').all(),
    teachers: db.prepare('SELECT * FROM teachers').all(),
    classes: db.prepare('SELECT * FROM classes').all(),
    classrooms: db.prepare('SELECT * FROM classrooms').all(),
    schedules: db.prepare('SELECT * FROM schedules LIMIT 5').all(),
    time_slots: db.prepare('SELECT * FROM time_slots').all()
  }

  res.json({
    success: true,
    data
  })
})

router.get('/examples', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      normal: [
        {
          title: '正常排课',
          description: '为数据结构课程在周一第1-2节排课',
          endpoint: 'POST /api/schedules',
          request: {
            course_id: 1,
            teacher_id: 1,
            class_id: 1,
            classroom_id: 1,
            day_of_week: 1,
            slot_id: 1,
            week_type: 'all',
            start_week: 1,
            end_week: 18,
            semester: '2024-2025-2'
          }
        },
        {
          title: '正常调课申请',
          description: '申请将某节课从周一改到周三',
          endpoint: 'POST /api/adjustments',
          request: {
            original_schedule_id: 1,
            applicant_id: 3,
            applicant_type: 'teacher',
            adjust_type: 'change_time',
            original_day_of_week: 1,
            original_slot_id: 1,
            original_classroom_id: 1,
            new_day_of_week: 3,
            new_slot_id: 1,
            new_classroom_id: 1,
            reason: '教师有会议冲突',
            affected_students: '45人'
          }
        }
      ],
      boundary: [
        {
          title: '单周排课',
          description: '只在单周排课',
          request: { week_type: 'odd' }
        },
        {
          title: '最大周数边界',
          description: '从第1周到第18周排课',
          request: { start_week: 1, end_week: 18 }
        }
      ],
      conflict: [
        {
          title: '教师时间冲突',
          description: '同一教师在同一时间排多门课',
          error: '教师时间冲突'
        },
        {
          title: '教室容量不足',
          description: '教室容量小于班级人数',
          error: '教室容量不足'
        },
        {
          title: '实验课类型不匹配',
          description: '实验课排到普通教室',
          error: '实验课需要使用实验室教室'
        }
      ],
      failure: [
        {
          title: '审批已处理的申请',
          description: '对已批准的申请再次审批',
          error: '该申请已处理'
        },
        {
          title: '删除有排课的课程',
          description: '删除已有排课记录的课程',
          error: '该课程已有排课记录，无法删除'
        }
      ]
    }
  })
})

export default router
