const express = require('express');
const { getQuery, allQuery, runQuery } = require('../database/schema');
const { authMiddleware } = require('../engines/permissionEngine');
const { validateSchedule, generateScheduleSuggestions } = require('../engines/scheduleConflictEngine');

const router = express.Router();

router.get('/', authMiddleware(['schedule:read']), async (req, res) => {
  try {
    const { teacher_id, class_id, course_id, day_of_week, term, academic_year, page = 1, pageSize = 50 } = req.query;
    
    let sql = `
      SELECT s.*, c.course_name, c.credits, c.course_type,
              u.name as teacher_name, cr.room_name, cr.building, cl.class_name
      FROM schedules s
      JOIN courses c ON s.course_id = c.id
      JOIN users u ON s.teacher_id = u.id
      LEFT JOIN classrooms cr ON s.classroom_id = cr.id
      LEFT JOIN classes cl ON s.class_id = cl.id
      WHERE 1=1
    `;
    const params = [];
    
    if (teacher_id) {
      sql += ' AND s.teacher_id = ?';
      params.push(teacher_id);
    }
    
    if (class_id) {
      sql += ' AND s.class_id = ?';
      params.push(class_id);
    }
    
    if (course_id) {
      sql += ' AND s.course_id = ?';
      params.push(course_id);
    }
    
    if (day_of_week) {
      sql += ' AND s.day_of_week = ?';
      params.push(day_of_week);
    }
    
    if (term) {
      sql += ' AND s.term = ?';
      params.push(term);
    }
    
    if (academic_year) {
      sql += ' AND s.academic_year = ?';
      params.push(academic_year);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await getQuery(countSql, params);
    
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY s.day_of_week, s.start_time LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const schedules = await allQuery(sql, params);
    
    res.json({
      schedules,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取课表列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id', authMiddleware(['schedule:read']), async (req, res) => {
  try {
    const schedule = await getQuery(
      `SELECT s.*, c.course_name, c.credits, c.course_type,
              u.name as teacher_name, cr.room_name, cr.building, cl.class_name
       FROM schedules s
       JOIN courses c ON s.course_id = c.id
       JOIN users u ON s.teacher_id = u.id
       LEFT JOIN classrooms cr ON s.classroom_id = cr.id
       LEFT JOIN classes cl ON s.class_id = cl.id
       WHERE s.id = ?`,
      [req.params.id]
    );
    
    if (!schedule) {
      return res.status(404).json({ error: '课表不存在' });
    }
    
    res.json({ schedule });
    
  } catch (error) {
    console.error('获取课表详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/', authMiddleware(['schedule:create']), async (req, res) => {
  try {
    const {
      course_id, teacher_id, classroom_id, class_id,
      day_of_week, start_time, end_time, week_type = 'all',
      term, academic_year, status = 'active'
    } = req.body;
    
    if (!course_id || !teacher_id || !day_of_week || !start_time || !end_time || !term || !academic_year) {
      return res.status(400).json({ error: '课程、教师、星期、时间、学期、学年为必填项' });
    }
    
    const validation = await validateSchedule(req.body);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: '排课冲突',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }
    
    const result = await runQuery(
      `INSERT INTO schedules 
       (course_id, teacher_id, classroom_id, class_id, day_of_week, start_time, end_time, week_type, term, academic_year, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_id, teacher_id, classroom_id || null, class_id || null, 
       day_of_week, start_time, end_time, week_type, term, academic_year, status]
    );
    
    res.json({
      success: true,
      scheduleId: result.lastID,
      warnings: validation.warnings,
      message: '排课成功'
    });
    
  } catch (error) {
    console.error('创建课表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/:id', authMiddleware(['schedule:update']), async (req, res) => {
  try {
    const {
      classroom_id, class_id, day_of_week, start_time, end_time, 
      week_type, term, academic_year, status
    } = req.body;
    
    const existingSchedule = await getQuery('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
    if (!existingSchedule) {
      return res.status(404).json({ error: '课表不存在' });
    }
    
    const updateData = { ...existingSchedule, ...req.body };
    const validation = await validateSchedule(updateData, req.params.id);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: '排课冲突',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }
    
    let updateFields = [];
    let updateParams = [];
    
    if (classroom_id !== undefined) {
      updateFields.push('classroom_id = ?');
      updateParams.push(classroom_id);
    }
    if (class_id !== undefined) {
      updateFields.push('class_id = ?');
      updateParams.push(class_id);
    }
    if (day_of_week !== undefined) {
      updateFields.push('day_of_week = ?');
      updateParams.push(day_of_week);
    }
    if (start_time !== undefined) {
      updateFields.push('start_time = ?');
      updateParams.push(start_time);
    }
    if (end_time !== undefined) {
      updateFields.push('end_time = ?');
      updateParams.push(end_time);
    }
    if (week_type !== undefined) {
      updateFields.push('week_type = ?');
      updateParams.push(week_type);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(status);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(req.params.id);
    
    await runQuery(
      `UPDATE schedules SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );
    
    res.json({
      success: true,
      warnings: validation.warnings,
      message: '课表更新成功'
    });
    
  } catch (error) {
    console.error('更新课表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.delete('/:id', authMiddleware(['schedule:delete']), async (req, res) => {
  try {
    const schedule = await getQuery('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
    if (!schedule) {
      return res.status(404).json({ error: '课表不存在' });
    }
    
    const enrollmentCount = await getQuery(
      'SELECT COUNT(*) as count FROM enrollments WHERE schedule_id = ?',
      [req.params.id]
    );
    
    if (enrollmentCount.count > 0) {
      return res.status(400).json({ error: '该课表下还有已选学生，请先处理选课记录' });
    }
    
    await runQuery('DELETE FROM schedules WHERE id = ?', [req.params.id]);
    
    res.json({
      success: true,
      message: '课表删除成功'
    });
    
  } catch (error) {
    console.error('删除课表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/validate', authMiddleware(['schedule:create']), async (req, res) => {
  try {
    const validation = await validateSchedule(req.body);
    
    res.json({
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings
    });
    
  } catch (error) {
    console.error('验证排课错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/suggestions/:courseId', authMiddleware(['schedule:generate']), async (req, res) => {
  try {
    const suggestions = await generateScheduleSuggestions(req.params.courseId);
    
    if (suggestions.error) {
      return res.status(404).json({ error: suggestions.error });
    }
    
    res.json(suggestions);
    
  } catch (error) {
    console.error('获取排课建议错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/teacher/:teacherId', authMiddleware(['schedule:read']), async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    
    if (!term || !academic_year) {
      return res.status(400).json({ error: '请提供学期和学年参数' });
    }
    
    const schedules = await allQuery(
      `SELECT s.*, c.course_name, c.credits, c.course_type,
              cr.room_name, cr.building, cl.class_name
       FROM schedules s
       JOIN courses c ON s.course_id = c.id
       LEFT JOIN classrooms cr ON s.classroom_id = cr.id
       LEFT JOIN classes cl ON s.class_id = cl.id
       WHERE s.teacher_id = ? 
         AND s.term = ? 
         AND s.academic_year = ?
         AND s.status = 'active'
       ORDER BY s.day_of_week, s.start_time`,
      [req.params.teacherId, term, academic_year]
    );
    
    const weekly = Array(7).fill(null).map(() => []);
    schedules.forEach(s => {
      weekly[s.day_of_week - 1].push(s);
    });
    
    res.json({
      schedules,
      weeklySchedule: weekly,
      totalHours: schedules.length * 2
    });
    
  } catch (error) {
    console.error('获取教师课表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/class/:classId', authMiddleware(['schedule:read']), async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    
    if (!term || !academic_year) {
      return res.status(400).json({ error: '请提供学期和学年参数' });
    }
    
    const schedules = await allQuery(
      `SELECT s.*, c.course_name, c.credits, c.course_type,
              u.name as teacher_name, cr.room_name, cr.building
       FROM schedules s
       JOIN courses c ON s.course_id = c.id
       JOIN users u ON s.teacher_id = u.id
       LEFT JOIN classrooms cr ON s.classroom_id = cr.id
       WHERE s.class_id = ? 
         AND s.term = ? 
         AND s.academic_year = ?
         AND s.status = 'active'
       ORDER BY s.day_of_week, s.start_time`,
      [req.params.classId, term, academic_year]
    );
    
    const weekly = Array(7).fill(null).map(() => []);
    schedules.forEach(s => {
      weekly[s.day_of_week - 1].push(s);
    });
    
    res.json({
      schedules,
      weeklySchedule: weekly
    });
    
  } catch (error) {
    console.error('获取班级课表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/my', authMiddleware(), async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    
    if (!term || !academic_year) {
      return res.status(400).json({ error: '请提供学期和学年参数' });
    }
    
    let schedules = [];
    
    if (req.user.role === 'student') {
      schedules = await allQuery(
        `SELECT s.*, c.course_name, c.credits, c.course_type,
                u.name as teacher_name, cr.room_name, cr.building
         FROM enrollments e
         JOIN schedules s ON e.schedule_id = s.id
         JOIN courses c ON s.course_id = c.id
         JOIN users u ON s.teacher_id = u.id
         LEFT JOIN classrooms cr ON s.classroom_id = cr.id
         WHERE e.student_id = ? 
           AND e.term = ? 
           AND e.academic_year = ?
           AND e.status = 'enrolled'
           AND s.status = 'active'
         ORDER BY s.day_of_week, s.start_time`,
        [req.user.id, term, academic_year]
      );
    } else if (req.user.role === 'teacher' || req.user.role === 'homeroom_teacher') {
      schedules = await allQuery(
        `SELECT s.*, c.course_name, c.credits, c.course_type,
                cr.room_name, cr.building, cl.class_name
         FROM schedules s
         JOIN courses c ON s.course_id = c.id
         LEFT JOIN classrooms cr ON s.classroom_id = cr.id
         LEFT JOIN classes cl ON s.class_id = cl.id
         WHERE s.teacher_id = ? 
           AND s.term = ? 
           AND s.academic_year = ?
           AND s.status = 'active'
         ORDER BY s.day_of_week, s.start_time`,
        [req.user.id, term, academic_year]
      );
    }
    
    const weekly = Array(7).fill(null).map(() => []);
    schedules.forEach(s => {
      weekly[s.day_of_week - 1].push(s);
    });
    
    res.json({
      schedules,
      weeklySchedule: weekly,
      totalHours: schedules.length * 2
    });
    
  } catch (error) {
    console.error('获取我的课表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/teacher', authMiddleware(), async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'homeroom_teacher') {
      return res.status(403).json({ error: '只有教师可以查看自己的课表' });
    }
    
    const { term, academic_year } = req.query;
    
    if (!term || !academic_year) {
      return res.status(400).json({ error: '请提供学期和学年参数' });
    }
    
    const schedules = await allQuery(
      `SELECT s.*, c.course_name, c.credits, c.course_type,
              cr.room_name, cr.building, cl.class_name
       FROM schedules s
       JOIN courses c ON s.course_id = c.id
       LEFT JOIN classrooms cr ON s.classroom_id = cr.id
       LEFT JOIN classes cl ON s.class_id = cl.id
       WHERE s.teacher_id = ? 
         AND s.term = ? 
         AND s.academic_year = ?
         AND s.status = 'active'
       ORDER BY s.day_of_week, s.start_time`,
      [req.user.id, term, academic_year]
    );
    
    const weekly = Array(7).fill(null).map(() => []);
    schedules.forEach(s => {
      weekly[s.day_of_week - 1].push(s);
    });
    
    res.json({
      schedules,
      weeklySchedule: weekly,
      totalHours: schedules.length * 2
    });
    
  } catch (error) {
    console.error('获取教师课表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
