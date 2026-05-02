const express = require('express');
const { getQuery, allQuery, runQuery } = require('../database/schema');
const { authMiddleware } = require('../engines/permissionEngine');
const { processEnrollment, processDropCourse, checkEnrollmentRules } = require('../engines/enrollmentEngine');

const router = express.Router();

router.get('/', authMiddleware(['enrollment:read']), async (req, res) => {
  try {
    const { student_id, course_id, status, term, academic_year, page = 1, pageSize = 20 } = req.query;
    
    let sql = `
      SELECT e.*, u.name as student_name, sp.student_number, c.class_name,
              cr.course_name, cr.credits, cr.course_type, t.name as teacher_name
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN student_profiles sp ON e.student_id = sp.user_id
      LEFT JOIN classes c ON sp.class_id = c.id
      JOIN courses cr ON e.course_id = cr.id
      LEFT JOIN users t ON cr.teacher_id = t.id
      WHERE 1=1
    `;
    const params = [];
    
    if (student_id) {
      sql += ' AND e.student_id = ?';
      params.push(student_id);
    }
    
    if (course_id) {
      sql += ' AND e.course_id = ?';
      params.push(course_id);
    }
    
    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }
    
    if (term) {
      sql += ' AND e.term = ?';
      params.push(term);
    }
    
    if (academic_year) {
      sql += ' AND e.academic_year = ?';
      params.push(academic_year);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await getQuery(countSql, params);
    
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY e.enroll_time DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const enrollments = await allQuery(sql, params);
    
    res.json({
      enrollments,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取选课列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/my', authMiddleware(), async (req, res) => {
  try {
    const { status, term, academic_year, page = 1, pageSize = 20 } = req.query;
    
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: '只有学生可以查看自己的选课' });
    }
    
    let sql = `
      SELECT e.*, cr.course_name, cr.credits, cr.course_type, cr.description,
              t.name as teacher_name, s.day_of_week, s.start_time, s.end_time,
              cl.class_name, cr.room_name
      FROM enrollments e
      JOIN courses cr ON e.course_id = cr.id
      LEFT JOIN users t ON cr.teacher_id = t.id
      LEFT JOIN schedules s ON e.schedule_id = s.id
      LEFT JOIN classrooms cl ON s.classroom_id = cl.id
      WHERE e.student_id = ?
    `;
    const params = [req.user.id];
    
    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }
    
    if (term) {
      sql += ' AND e.term = ?';
      params.push(term);
    }
    
    if (academic_year) {
      sql += ' AND e.academic_year = ?';
      params.push(academic_year);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await getQuery(countSql, params);
    
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY e.enroll_time DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const enrollments = await allQuery(sql, params);
    
    const totalCredits = enrollments
      .filter(e => e.status === 'enrolled')
      .reduce((sum, e) => sum + (e.credits || 0), 0);
    
    res.json({
      enrollments,
      totalCredits,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取我的选课错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/enroll', authMiddleware(), async (req, res) => {
  try {
    const { course_id, schedule_id, term, academic_year } = req.body;
    
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: '只有学生可以选课' });
    }
    
    if (!course_id || !term || !academic_year) {
      return res.status(400).json({ error: '课程ID、学期、学年为必填项' });
    }
    
    const result = await processEnrollment(
      req.user.id, 
      course_id, 
      term, 
      academic_year, 
      schedule_id
    );
    
    if (!result.success) {
      return res.status(400).json({
        error: '选课失败',
        errors: result.errors,
        warnings: result.warnings
      });
    }
    
    res.json({
      success: true,
      warnings: result.warnings,
      message: result.message
    });
    
  } catch (error) {
    console.error('选课错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/drop', authMiddleware(), async (req, res) => {
  try {
    const { course_id, term, academic_year } = req.body;
    
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: '只有学生可以退课' });
    }
    
    if (!course_id || !term || !academic_year) {
      return res.status(400).json({ error: '课程ID、学期、学年为必填项' });
    }
    
    const result = await processDropCourse(
      req.user.id, 
      course_id, 
      term, 
      academic_year
    );
    
    if (!result.success) {
      return res.status(400).json({
        error: '退课失败',
        errors: result.errors
      });
    }
    
    res.json({
      success: true,
      message: result.message
    });
    
  } catch (error) {
    console.error('退课错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/validate', authMiddleware(), async (req, res) => {
  try {
    const { course_id, term, academic_year } = req.body;
    
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: '只有学生可以验证选课' });
    }
    
    if (!course_id || !term || !academic_year) {
      return res.status(400).json({ error: '课程ID、学期、学年为必填项' });
    }
    
    const result = await checkEnrollmentRules(
      req.user.id, 
      course_id, 
      term, 
      academic_year
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('验证选课错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/statistics', authMiddleware(['enrollment:read']), async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    
    let sql = `
      SELECT 
        c.id as course_id,
        c.course_name,
        c.course_code,
        c.credits,
        c.max_students,
        c.min_students,
        c.course_type,
        u.name as teacher_name,
        COUNT(DISTINCT e.id) as enrolled_count,
        (c.max_students - COUNT(DISTINCT e.id)) as remaining_spots
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id 
        AND e.status = 'enrolled'
        ${term ? 'AND e.term = ?' : ''}
        ${academic_year ? 'AND e.academic_year = ?' : ''}
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.status = 'published'
      GROUP BY c.id
      ORDER BY enrolled_count DESC
    `;
    
    const params = [];
    if (term) params.push(term);
    if (academic_year) params.push(academic_year);
    
    const courseStats = await allQuery(sql, params);
    
    const totalEnrolled = courseStats.reduce((sum, c) => sum + c.enrolled_count, 0);
    const avgEnrolled = courseStats.length > 0 ? totalEnrolled / courseStats.length : 0;
    
    const fullCourses = courseStats.filter(c => c.enrolled_count >= c.max_students);
    const lowCourses = courseStats.filter(c => c.enrolled_count < c.min_students && c.enrolled_count > 0);
    
    res.json({
      courseStats,
      summary: {
        totalCourses: courseStats.length,
        totalEnrolled,
        avgEnrolled: Math.round(avgEnrolled * 100) / 100,
        fullCourses: fullCourses.length,
        lowCourses: lowCourses.length
      }
    });
    
  } catch (error) {
    console.error('获取选课统计错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/available', authMiddleware(), async (req, res) => {
  try {
    const { term, academic_year, course_type, keyword, page = 1, pageSize = 20 } = req.query;
    
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: '只有学生可以查看可选课程' });
    }
    
    if (!term || !academic_year) {
      return res.status(400).json({ error: '请提供学期和学年参数' });
    }
    
    let sql = `
      SELECT c.*, u.name as teacher_name,
             (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'enrolled') as enrolled_count,
             (c.max_students - (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'enrolled')) as remaining_spots,
             (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.student_id = ? AND e.status = 'enrolled') as is_enrolled
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.status = 'published' AND c.term = ? AND c.academic_year = ?
    `;
    const params = [req.user.id, term, academic_year];
    
    if (course_type) {
      sql += ' AND c.course_type = ?';
      params.push(course_type);
    }
    
    if (keyword) {
      sql += ' AND (c.course_name LIKE ? OR c.course_code LIKE ? OR c.department LIKE ? OR u.name LIKE ?)';
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await getQuery(countSql, params);
    
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY c.course_type, c.course_code LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const courses = await allQuery(sql, params);
    
    res.json({
      courses,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取可选课程错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
