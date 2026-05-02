const express = require('express');
const { getQuery, allQuery, runQuery } = require('../database/schema');
const { authMiddleware } = require('../engines/permissionEngine');

const router = express.Router();

router.get('/', authMiddleware(['class:read']), async (req, res) => {
  try {
    const { grade, status, keyword, page = 1, pageSize = 20 } = req.query;
    
    let sql = `
      SELECT c.*, u.name as homeroom_teacher_name
      FROM classes c
      LEFT JOIN users u ON c.homeroom_teacher_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (grade) {
      sql += ' AND c.grade = ?';
      params.push(grade);
    }
    
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }
    
    if (keyword) {
      sql += ' AND (c.class_name LIKE ? OR c.class_code LIKE ?)';
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await getQuery(countSql, params);
    
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY c.grade DESC, c.class_code ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const classes = await allQuery(sql, params);
    
    res.json({
      classes,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取班级列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id', authMiddleware(['class:read']), async (req, res) => {
  try {
    const classInfo = await getQuery(
      `SELECT c.*, u.name as homeroom_teacher_name
       FROM classes c
       LEFT JOIN users u ON c.homeroom_teacher_id = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    
    if (!classInfo) {
      return res.status(404).json({ error: '班级不存在' });
    }
    
    const students = await allQuery(
      `SELECT u.id, u.name, u.gender, sp.student_number, sp.enrollment_status
       FROM users u
       JOIN student_profiles sp ON u.id = sp.user_id
       WHERE sp.class_id = ?
       ORDER BY sp.student_number`,
      [req.params.id]
    );
    
    res.json({ class: classInfo, students });
    
  } catch (error) {
    console.error('获取班级详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/', authMiddleware(['class:create']), async (req, res) => {
  try {
    const { class_name, class_code, grade, homeroom_teacher_id, status = 'active' } = req.body;
    
    if (!class_name || !class_code || !grade) {
      return res.status(400).json({ error: '班级名称、班级代码、年级为必填项' });
    }
    
    const existingClass = await getQuery('SELECT * FROM classes WHERE class_code = ?', [class_code]);
    if (existingClass) {
      return res.status(400).json({ error: '班级代码已存在' });
    }
    
    const result = await runQuery(
      `INSERT INTO classes (class_name, class_code, grade, homeroom_teacher_id, status)
       VALUES (?, ?, ?, ?, ?)`,
      [class_name, class_code, grade, homeroom_teacher_id || null, status]
    );
    
    res.json({
      success: true,
      classId: result.lastID,
      message: '班级创建成功'
    });
    
  } catch (error) {
    console.error('创建班级错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/:id', authMiddleware(['class:update']), async (req, res) => {
  try {
    const { class_name, class_code, grade, homeroom_teacher_id, status, student_count } = req.body;
    
    const existingClass = await getQuery('SELECT * FROM classes WHERE id = ?', [req.params.id]);
    if (!existingClass) {
      return res.status(404).json({ error: '班级不存在' });
    }
    
    let updateFields = [];
    let updateParams = [];
    
    if (class_name !== undefined) {
      updateFields.push('class_name = ?');
      updateParams.push(class_name);
    }
    if (class_code !== undefined) {
      updateFields.push('class_code = ?');
      updateParams.push(class_code);
    }
    if (grade !== undefined) {
      updateFields.push('grade = ?');
      updateParams.push(grade);
    }
    if (homeroom_teacher_id !== undefined) {
      updateFields.push('homeroom_teacher_id = ?');
      updateParams.push(homeroom_teacher_id);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(status);
    }
    if (student_count !== undefined) {
      updateFields.push('student_count = ?');
      updateParams.push(student_count);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(req.params.id);
    
    await runQuery(
      `UPDATE classes SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );
    
    res.json({
      success: true,
      message: '班级信息更新成功'
    });
    
  } catch (error) {
    console.error('更新班级信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.delete('/:id', authMiddleware(['class:delete']), async (req, res) => {
  try {
    const classInfo = await getQuery('SELECT * FROM classes WHERE id = ?', [req.params.id]);
    if (!classInfo) {
      return res.status(404).json({ error: '班级不存在' });
    }
    
    const studentCount = await getQuery(
      'SELECT COUNT(*) as count FROM student_profiles WHERE class_id = ?',
      [req.params.id]
    );
    
    if (studentCount.count > 0) {
      return res.status(400).json({ error: '班级下还有学生，无法删除' });
    }
    
    await runQuery('DELETE FROM classes WHERE id = ?', [req.params.id]);
    
    res.json({
      success: true,
      message: '班级删除成功'
    });
    
  } catch (error) {
    console.error('删除班级错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id/schedule', authMiddleware(['class:read']), async (req, res) => {
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
      [req.params.id, term, academic_year]
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

router.get('/:id/statistics', authMiddleware(['class:read']), async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    
    const classStudents = await allQuery(
      `SELECT u.id, u.name, sp.student_number
       FROM users u
       JOIN student_profiles sp ON u.id = sp.user_id
       WHERE sp.class_id = ?`,
      [req.params.id]
    );
    
    const attendanceStats = await getQuery(
      `SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN status = 'early_leave' THEN 1 ELSE 0 END) as early_leave_count,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_count
       FROM attendances a
       JOIN student_profiles sp ON a.student_id = sp.user_id
       WHERE sp.class_id = ?`,
      [req.params.id]
    );
    
    res.json({
      studentCount: classStudents.length,
      attendanceStatistics: attendanceStats
    });
    
  } catch (error) {
    console.error('获取班级统计错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
