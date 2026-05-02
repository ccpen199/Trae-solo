const express = require('express');
const { getQuery, allQuery, runQuery } = require('../database/schema');
const { authMiddleware } = require('../engines/permissionEngine');

const router = express.Router();

router.get('/', authMiddleware(['course:read']), async (req, res) => {
  try {
    const { course_type, status, teacher_id, term, academic_year, keyword, page = 1, pageSize = 20 } = req.query;
    
    let sql = `
      SELECT c.*, u.name as teacher_name
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (course_type) {
      sql += ' AND c.course_type = ?';
      params.push(course_type);
    }
    
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }
    
    if (teacher_id) {
      sql += ' AND c.teacher_id = ?';
      params.push(teacher_id);
    }
    
    if (term) {
      sql += ' AND c.term = ?';
      params.push(term);
    }
    
    if (academic_year) {
      sql += ' AND c.academic_year = ?';
      params.push(academic_year);
    }
    
    if (keyword) {
      sql += ' AND (c.course_name LIKE ? OR c.course_code LIKE ? OR c.department LIKE ?)';
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await getQuery(countSql, params);
    
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY c.academic_year DESC, c.term DESC, c.course_code ASC LIMIT ? OFFSET ?`;
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
    console.error('获取课程列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id', authMiddleware(['course:read']), async (req, res) => {
  try {
    const course = await getQuery(
      `SELECT c.*, u.name as teacher_name
       FROM courses c
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    
    if (!course) {
      return res.status(404).json({ error: '课程不存在' });
    }
    
    const enrolledCount = await getQuery(
      'SELECT COUNT(*) as count FROM enrollments WHERE course_id = ? AND status = ?',
      [req.params.id, 'enrolled']
    );
    
    res.json({ 
      course,
      enrolledCount: enrolledCount.count
    });
    
  } catch (error) {
    console.error('获取课程详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/', authMiddleware(['course:create']), async (req, res) => {
  try {
    const {
      course_name, course_code, course_type, credits, hours, department,
      description, prerequisite, max_students, min_students, teacher_id,
      term, academic_year, status = 'draft'
    } = req.body;
    
    if (!course_name || !course_code || !course_type || !credits || !hours || !term || !academic_year) {
      return res.status(400).json({ error: '课程名称、代码、类型、学分、学时、学期、学年为必填项' });
    }
    
    const existingCourse = await getQuery('SELECT * FROM courses WHERE course_code = ?', [course_code]);
    if (existingCourse) {
      return res.status(400).json({ error: '课程代码已存在' });
    }
    
    const result = await runQuery(
      `INSERT INTO courses 
       (course_name, course_code, course_type, credits, hours, department, description, 
        prerequisite, max_students, min_students, teacher_id, term, academic_year, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_name, course_code, course_type, credits, hours, department, description,
       prerequisite, max_students || 30, min_students || 5, teacher_id || null, term, academic_year, status]
    );
    
    res.json({
      success: true,
      courseId: result.lastID,
      message: '课程创建成功'
    });
    
  } catch (error) {
    console.error('创建课程错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/:id', authMiddleware(['course:update']), async (req, res) => {
  try {
    const {
      course_name, course_code, course_type, credits, hours, department,
      description, prerequisite, max_students, min_students, teacher_id,
      term, academic_year, status
    } = req.body;
    
    const existingCourse = await getQuery('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (!existingCourse) {
      return res.status(404).json({ error: '课程不存在' });
    }
    
    let updateFields = [];
    let updateParams = [];
    
    if (course_name !== undefined) {
      updateFields.push('course_name = ?');
      updateParams.push(course_name);
    }
    if (course_code !== undefined) {
      updateFields.push('course_code = ?');
      updateParams.push(course_code);
    }
    if (course_type !== undefined) {
      updateFields.push('course_type = ?');
      updateParams.push(course_type);
    }
    if (credits !== undefined) {
      updateFields.push('credits = ?');
      updateParams.push(credits);
    }
    if (hours !== undefined) {
      updateFields.push('hours = ?');
      updateParams.push(hours);
    }
    if (department !== undefined) {
      updateFields.push('department = ?');
      updateParams.push(department);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(description);
    }
    if (prerequisite !== undefined) {
      updateFields.push('prerequisite = ?');
      updateParams.push(prerequisite);
    }
    if (max_students !== undefined) {
      updateFields.push('max_students = ?');
      updateParams.push(max_students);
    }
    if (min_students !== undefined) {
      updateFields.push('min_students = ?');
      updateParams.push(min_students);
    }
    if (teacher_id !== undefined) {
      updateFields.push('teacher_id = ?');
      updateParams.push(teacher_id);
    }
    if (term !== undefined) {
      updateFields.push('term = ?');
      updateParams.push(term);
    }
    if (academic_year !== undefined) {
      updateFields.push('academic_year = ?');
      updateParams.push(academic_year);
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
      `UPDATE courses SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );
    
    res.json({
      success: true,
      message: '课程信息更新成功'
    });
    
  } catch (error) {
    console.error('更新课程信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.delete('/:id', authMiddleware(['course:delete']), async (req, res) => {
  try {
    const course = await getQuery('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (!course) {
      return res.status(404).json({ error: '课程不存在' });
    }
    
    const enrolledCount = await getQuery(
      'SELECT COUNT(*) as count FROM enrollments WHERE course_id = ? AND status = ?',
      [req.params.id, 'enrolled']
    );
    
    if (enrolledCount.count > 0) {
      return res.status(400).json({ error: '课程下还有已选学生，无法删除' });
    }
    
    await runQuery('DELETE FROM courses WHERE id = ?', [req.params.id]);
    
    res.json({
      success: true,
      message: '课程删除成功'
    });
    
  } catch (error) {
    console.error('删除课程错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/:id/publish', authMiddleware(['course:publish']), async (req, res) => {
  try {
    const course = await getQuery('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (!course) {
      return res.status(404).json({ error: '课程不存在' });
    }
    
    if (course.status === 'published') {
      return res.json({ success: true, message: '课程已发布' });
    }
    
    if (!course.teacher_id) {
      return res.status(400).json({ error: '请先指定授课教师' });
    }
    
    await runQuery(
      "UPDATE courses SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [req.params.id]
    );
    
    res.json({
      success: true,
      message: '课程发布成功'
    });
    
  } catch (error) {
    console.error('发布课程错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id/enrollments', authMiddleware(['course:read']), async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    
    let sql = `
      SELECT e.*, u.name as student_name, sp.student_number, c.class_name
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN student_profiles sp ON e.student_id = sp.user_id
      LEFT JOIN classes c ON sp.class_id = c.id
      WHERE e.course_id = ?
    `;
    const params = [req.params.id];
    
    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
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

module.exports = router;
