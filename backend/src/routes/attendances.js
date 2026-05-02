const express = require('express');
const { getQuery, allQuery, runQuery } = require('../database/schema');
const { authMiddleware } = require('../engines/permissionEngine');

const router = express.Router();

router.get('/', authMiddleware(['attendance:read']), async (req, res) => {
  try {
    const { student_id, course_id, teacher_id, schedule_id, attendance_date, status, page = 1, pageSize = 20 } = req.query;
    
    let sql = `
      SELECT a.*, 
             u.name as student_name, sp.student_number,
             c.course_name,
             t.name as teacher_name,
             s.day_of_week, s.start_time, s.end_time,
             cr.room_name
      FROM attendances a
      JOIN users u ON a.student_id = u.id
      JOIN student_profiles sp ON a.student_id = sp.user_id
      JOIN courses c ON a.course_id = c.id
      JOIN users t ON a.teacher_id = t.id
      LEFT JOIN schedules s ON a.schedule_id = s.id
      LEFT JOIN classrooms cr ON s.classroom_id = cr.id
      WHERE 1=1
    `;
    const params = [];
    
    if (student_id) {
      sql += ' AND a.student_id = ?';
      params.push(student_id);
    }
    
    if (course_id) {
      sql += ' AND a.course_id = ?';
      params.push(course_id);
    }
    
    if (teacher_id) {
      sql += ' AND a.teacher_id = ?';
      params.push(teacher_id);
    }
    
    if (schedule_id) {
      sql += ' AND a.schedule_id = ?';
      params.push(schedule_id);
    }
    
    if (attendance_date) {
      sql += ' AND a.attendance_date = ?';
      params.push(attendance_date);
    }
    
    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await getQuery(countSql, params);
    
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY a.attendance_date DESC, a.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const attendances = await allQuery(sql, params);
    
    res.json({
      attendances,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取考勤列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/my', authMiddleware(), async (req, res) => {
  try {
    const { course_id, attendance_date, status, page = 1, pageSize = 20 } = req.query;
    
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: '只有学生可以查看自己的考勤' });
    }
    
    let sql = `
      SELECT a.*, 
             c.course_name,
             t.name as teacher_name,
             s.day_of_week, s.start_time, s.end_time,
             cr.room_name
      FROM attendances a
      JOIN courses c ON a.course_id = c.id
      JOIN users t ON a.teacher_id = t.id
      LEFT JOIN schedules s ON a.schedule_id = s.id
      LEFT JOIN classrooms cr ON s.classroom_id = cr.id
      WHERE a.student_id = ?
    `;
    const params = [req.user.id];
    
    if (course_id) {
      sql += ' AND a.course_id = ?';
      params.push(course_id);
    }
    
    if (attendance_date) {
      sql += ' AND a.attendance_date = ?';
      params.push(attendance_date);
    }
    
    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await getQuery(countSql, params);
    
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY a.attendance_date DESC, a.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const attendances = await allQuery(sql, params);
    
    const statistics = {
      total: countResult.total,
      present: attendances.filter(a => a.status === 'present').length,
      late: attendances.filter(a => a.status === 'late').length,
      early_leave: attendances.filter(a => a.status === 'early_leave').length,
      absent: attendances.filter(a => a.status === 'absent').length,
      leave: attendances.filter(a => a.status === 'leave').length
    };
    
    res.json({
      attendances,
      statistics,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取我的考勤错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/', authMiddleware(['attendance:create']), async (req, res) => {
  try {
    const { schedule_id, attendance_date, records } = req.body;
    
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: '只有教师可以录入考勤' });
    }
    
    if (!schedule_id || !attendance_date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: '课表ID、考勤日期和考勤记录为必填项' });
    }
    
    const schedule = await getQuery(
      `SELECT s.*, c.course_name 
       FROM schedules s
       JOIN courses c ON s.course_id = c.id
       WHERE s.id = ? AND s.status = 'active'`,
      [schedule_id]
    );
    
    if (!schedule) {
      return res.status(404).json({ error: '课表不存在或已失效' });
    }
    
    if (schedule.teacher_id !== req.user.id) {
      return res.status(403).json({ error: '您不是该课程的授课教师' });
    }
    
    let successCount = 0;
    let failedCount = 0;
    const errors = [];
    
    for (const record of records) {
      try {
        const { student_id, status, remark } = record;
        
        if (!student_id || !status) {
          failedCount++;
          errors.push(`学生ID: ${student_id} - 缺少必要参数`);
          continue;
        }
        
        const validStatuses = ['present', 'late', 'early_leave', 'absent', 'leave'];
        if (!validStatuses.includes(status)) {
          failedCount++;
          errors.push(`学生ID: ${student_id} - 无效的考勤状态`);
          continue;
        }
        
        const existingAttendance = await getQuery(
          `SELECT * FROM attendances 
           WHERE schedule_id = ? AND student_id = ? AND attendance_date = ?`,
          [schedule_id, student_id, attendance_date]
        );
        
        if (existingAttendance) {
          await runQuery(
            `UPDATE attendances SET status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [status, remark, existingAttendance.id]
          );
        } else {
          await runQuery(
            `INSERT INTO attendances 
             (schedule_id, student_id, teacher_id, course_id, attendance_date, status, remark)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [schedule_id, student_id, req.user.id, schedule.course_id, attendance_date, status, remark]
          );
        }
        
        successCount++;
      } catch (err) {
        failedCount++;
        errors.push(`处理记录时出错: ${err.message}`);
      }
    }
    
    res.json({
      success: true,
      successCount,
      failedCount,
      errors,
      message: `考勤录入完成：成功${successCount}条，失败${failedCount}条`
    });
    
  } catch (error) {
    console.error('录入考勤错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/:id', authMiddleware(['attendance:update']), async (req, res) => {
  try {
    const { status, remark } = req.body;
    
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: '只有教师可以修改考勤' });
    }
    
    const attendance = await getQuery('SELECT * FROM attendances WHERE id = ?', [req.params.id]);
    
    if (!attendance) {
      return res.status(404).json({ error: '考勤记录不存在' });
    }
    
    if (attendance.teacher_id !== req.user.id) {
      return res.status(403).json({ error: '您不是该考勤记录的录入教师' });
    }
    
    let updateFields = [];
    let updateParams = [];
    
    if (status !== undefined) {
      const validStatuses = ['present', 'late', 'early_leave', 'absent', 'leave'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: '无效的考勤状态' });
      }
      updateFields.push('status = ?');
      updateParams.push(status);
    }
    
    if (remark !== undefined) {
      updateFields.push('remark = ?');
      updateParams.push(remark);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(req.params.id);
    
    await runQuery(
      `UPDATE attendances SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );
    
    res.json({
      success: true,
      message: '考勤记录更新成功'
    });
    
  } catch (error) {
    console.error('更新考勤错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/statistics', authMiddleware(['attendance:statistics']), async (req, res) => {
  try {
    const { course_id, class_id, start_date, end_date, teacher_id } = req.query;
    
    let sql = `
      SELECT 
        a.status,
        COUNT(*) as count
      FROM attendances a
      WHERE 1=1
    `;
    const params = [];
    
    if (course_id) {
      sql += ' AND a.course_id = ?';
      params.push(course_id);
    }
    
    if (teacher_id) {
      sql += ' AND a.teacher_id = ?';
      params.push(teacher_id);
    }
    
    if (class_id) {
      sql += ` AND a.student_id IN (
        SELECT user_id FROM student_profiles WHERE class_id = ?
      )`;
      params.push(class_id);
    }
    
    if (start_date) {
      sql += ' AND a.attendance_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      sql += ' AND a.attendance_date <= ?';
      params.push(end_date);
    }
    
    sql += ' GROUP BY a.status';
    
    const statusStats = await allQuery(sql, params);
    
    const statistics = {
      total: 0,
      present: 0,
      late: 0,
      early_leave: 0,
      absent: 0,
      leave: 0
    };
    
    for (const stat of statusStats) {
      statistics[stat.status] = stat.count;
      statistics.total += stat.count;
    }
    
    if (statistics.total > 0) {
      statistics.attendanceRate = Math.round(
        ((statistics.present + statistics.late + statistics.leave + statistics.early_leave) / statistics.total * 10000)
      ) / 100;
    } else {
      statistics.attendanceRate = 0;
    }
    
    res.json(statistics);
    
  } catch (error) {
    console.error('获取考勤统计错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/class/:classId', authMiddleware(['attendance:read']), async (req, res) => {
  try {
    const { course_id, start_date, end_date, page = 1, pageSize = 20 } = req.query;
    
    let sql = `
      SELECT a.*, 
             u.name as student_name, sp.student_number,
             c.course_name,
             t.name as teacher_name
      FROM attendances a
      JOIN users u ON a.student_id = u.id
      JOIN student_profiles sp ON a.student_id = sp.user_id
      JOIN courses c ON a.course_id = c.id
      JOIN users t ON a.teacher_id = t.id
      WHERE sp.class_id = ?
    `;
    const params = [req.params.classId];
    
    if (course_id) {
      sql += ' AND a.course_id = ?';
      params.push(course_id);
    }
    
    if (start_date) {
      sql += ' AND a.attendance_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      sql += ' AND a.attendance_date <= ?';
      params.push(end_date);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await getQuery(countSql, params);
    
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY a.attendance_date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const attendances = await allQuery(sql, params);
    
    res.json({
      attendances,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取班级考勤错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
