const express = require('express');
const { getQuery, allQuery, runQuery } = require('../database/schema');
const { authMiddleware } = require('../engines/permissionEngine');
const { 
  calculateTotalScore, 
  calculateGradePoint, 
  calculateGPA,
  getCourseStatistics,
  getClassStatistics,
  processGradeImport,
  submitGrades,
  approveGrades,
  archiveGrades
} = require('../engines/gradeEngine');

const router = express.Router();

router.get('/', authMiddleware(['grade:read']), async (req, res) => {
  try {
    const { student_id, course_id, teacher_id, status, term, academic_year, page = 1, pageSize = 20 } = req.query;
    
    let sql = `
      SELECT g.*, 
             u.name as student_name, sp.student_number,
             c.course_name, c.credits, c.course_type,
             t.name as teacher_name
      FROM grades g
      JOIN users u ON g.student_id = u.id
      JOIN student_profiles sp ON g.student_id = sp.user_id
      JOIN courses c ON g.course_id = c.id
      JOIN users t ON g.teacher_id = t.id
      WHERE 1=1
    `;
    const params = [];
    
    if (student_id) {
      sql += ' AND g.student_id = ?';
      params.push(student_id);
    }
    
    if (course_id) {
      sql += ' AND g.course_id = ?';
      params.push(course_id);
    }
    
    if (teacher_id) {
      sql += ' AND g.teacher_id = ?';
      params.push(teacher_id);
    }
    
    if (status) {
      sql += ' AND g.status = ?';
      params.push(status);
    }
    
    if (term) {
      sql += ' AND g.term = ?';
      params.push(term);
    }
    
    if (academic_year) {
      sql += ' AND g.academic_year = ?';
      params.push(academic_year);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await getQuery(countSql, params);
    
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY g.academic_year DESC, g.term DESC, g.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const grades = await allQuery(sql, params);
    
    res.json({
      grades,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取成绩列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/my', authMiddleware(), async (req, res) => {
  try {
    const { course_id, term, academic_year, page = 1, pageSize = 20 } = req.query;
    
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: '只有学生可以查看自己的成绩' });
    }
    
    let sql = `
      SELECT g.*, 
             c.course_name, c.credits, c.course_type,
             t.name as teacher_name
      FROM grades g
      JOIN courses c ON g.course_id = c.id
      JOIN users t ON g.teacher_id = t.id
      WHERE g.student_id = ? AND g.status IN ('submitted', 'approved', 'archived')
    `;
    const params = [req.user.id];
    
    if (course_id) {
      sql += ' AND g.course_id = ?';
      params.push(course_id);
    }
    
    if (term) {
      sql += ' AND g.term = ?';
      params.push(term);
    }
    
    if (academic_year) {
      sql += ' AND g.academic_year = ?';
      params.push(academic_year);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await getQuery(countSql, params);
    
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY g.academic_year DESC, g.term DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const grades = await allQuery(sql, params);
    
    const gpaInfo = await calculateGPA(req.user.id, term, academic_year);
    
    res.json({
      grades,
      gpa: gpaInfo.gpa,
      totalCredits: gpaInfo.totalCredits,
      courseCount: gpaInfo.courseCount,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取我的成绩错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/gpa', authMiddleware(), async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: '只有学生可以查看自己的GPA' });
    }
    
    const gpaInfo = await calculateGPA(req.user.id, term, academic_year);
    
    res.json(gpaInfo);
    
  } catch (error) {
    console.error('获取GPA错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/', authMiddleware(['grade:create']), async (req, res) => {
  try {
    const { student_id, course_id, enrollment_id, usual_score, midterm_score, final_score, term, academic_year } = req.body;
    
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: '只有教师可以录入成绩' });
    }
    
    if (!student_id || !course_id || !term || !academic_year) {
      return res.status(400).json({ error: '学生ID、课程ID、学期、学年为必填项' });
    }
    
    const totalScore = calculateTotalScore(usual_score, midterm_score, final_score);
    const { gradePoint, gradeLevel } = calculateGradePoint(totalScore);
    
    const existingGrade = await getQuery(
      `SELECT * FROM grades 
       WHERE student_id = ? AND course_id = ? AND term = ? AND academic_year = ?`,
      [student_id, course_id, term, academic_year]
    );
    
    if (existingGrade) {
      if (existingGrade.status === 'archived') {
        return res.status(400).json({ error: '成绩已归档，无法修改' });
      }
      
      await runQuery(
        `UPDATE grades SET 
         usual_score = ?, midterm_score = ?, final_score = ?, 
         total_score = ?, grade_point = ?, grade_level = ?,
         teacher_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [usual_score, midterm_score, final_score, totalScore, gradePoint, gradeLevel, req.user.id, existingGrade.id]
      );
      
      res.json({
        success: true,
        action: 'updated',
        totalScore,
        gradePoint,
        gradeLevel,
        message: '成绩更新成功'
      });
    } else {
      const result = await runQuery(
        `INSERT INTO grades 
         (student_id, course_id, teacher_id, enrollment_id, usual_score, midterm_score, final_score, 
          total_score, grade_point, grade_level, status, term, academic_year)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
        [student_id, course_id, req.user.id, enrollment_id || null, usual_score, midterm_score, final_score, 
         totalScore, gradePoint, gradeLevel, term, academic_year]
      );
      
      res.json({
        success: true,
        action: 'created',
        gradeId: result.lastID,
        totalScore,
        gradePoint,
        gradeLevel,
        message: '成绩录入成功'
      });
    }
    
  } catch (error) {
    console.error('录入成绩错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/:id', authMiddleware(['grade:update']), async (req, res) => {
  try {
    const { usual_score, midterm_score, final_score } = req.body;
    
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: '只有教师可以修改成绩' });
    }
    
    const grade = await getQuery('SELECT * FROM grades WHERE id = ?', [req.params.id]);
    
    if (!grade) {
      return res.status(404).json({ error: '成绩记录不存在' });
    }
    
    if (grade.teacher_id !== req.user.id) {
      return res.status(403).json({ error: '您不是该成绩的录入教师' });
    }
    
    if (grade.status === 'archived') {
      return res.status(400).json({ error: '成绩已归档，无法修改' });
    }
    
    const totalScore = calculateTotalScore(
      usual_score ?? grade.usual_score,
      midterm_score ?? grade.midterm_score,
      final_score ?? grade.final_score
    );
    const { gradePoint, gradeLevel } = calculateGradePoint(totalScore);
    
    await runQuery(
      `UPDATE grades SET 
       usual_score = ?, midterm_score = ?, final_score = ?, 
       total_score = ?, grade_point = ?, grade_level = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        usual_score ?? grade.usual_score,
        midterm_score ?? grade.midterm_score,
        final_score ?? grade.final_score,
        totalScore, gradePoint, gradeLevel,
        req.params.id
      ]
    );
    
    res.json({
      success: true,
      totalScore,
      gradePoint,
      gradeLevel,
      message: '成绩更新成功'
    });
    
  } catch (error) {
    console.error('更新成绩错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/import', authMiddleware(['grade:create']), async (req, res) => {
  try {
    const { grades_data, course_id, term, academic_year } = req.body;
    
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: '只有教师可以批量导入成绩' });
    }
    
    if (!grades_data || !Array.isArray(grades_data) || !course_id || !term || !academic_year) {
      return res.status(400).json({ error: '成绩数据、课程ID、学期、学年为必填项' });
    }
    
    const result = await processGradeImport(grades_data, course_id, term, academic_year, req.user.id);
    
    res.json(result);
    
  } catch (error) {
    console.error('批量导入成绩错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/submit', authMiddleware(['grade:submit']), async (req, res) => {
  try {
    const { course_id, term, academic_year } = req.body;
    
    if (!course_id || !term || !academic_year) {
      return res.status(400).json({ error: '课程ID、学期、学年为必填项' });
    }
    
    const result = await submitGrades(course_id, term, academic_year);
    
    res.json(result);
    
  } catch (error) {
    console.error('提交成绩错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/approve', authMiddleware(['grade:approve']), async (req, res) => {
  try {
    const { course_id, term, academic_year } = req.body;
    
    if (!course_id || !term || !academic_year) {
      return res.status(400).json({ error: '课程ID、学期、学年为必填项' });
    }
    
    const result = await approveGrades(course_id, term, academic_year);
    
    res.json(result);
    
  } catch (error) {
    console.error('审核成绩错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/archive', authMiddleware(['grade:approve']), async (req, res) => {
  try {
    const { course_id, term, academic_year } = req.body;
    
    if (!course_id || !term || !academic_year) {
      return res.status(400).json({ error: '课程ID、学期、学年为必填项' });
    }
    
    const result = await archiveGrades(course_id, term, academic_year);
    
    res.json(result);
    
  } catch (error) {
    console.error('归档成绩错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/course-statistics/:courseId', authMiddleware(['grade:statistics']), async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    
    if (!term || !academic_year) {
      return res.status(400).json({ error: '请提供学期和学年参数' });
    }
    
    const statistics = await getCourseStatistics(req.params.courseId, term, academic_year);
    
    res.json(statistics);
    
  } catch (error) {
    console.error('获取课程成绩统计错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/class-statistics/:classId', authMiddleware(['grade:statistics']), async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    
    if (!term || !academic_year) {
      return res.status(400).json({ error: '请提供学期和学年参数' });
    }
    
    const statistics = await getClassStatistics(req.params.classId, term, academic_year);
    
    res.json(statistics);
    
  } catch (error) {
    console.error('获取班级成绩统计错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/my-teacher', authMiddleware(), async (req, res) => {
  try {
    const { course_id, term, academic_year, status, page = 1, pageSize = 20 } = req.query;
    
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: '只有教师可以查看自己的成绩录入' });
    }
    
    let sql = `
      SELECT g.*, 
             u.name as student_name, sp.student_number, c.class_name,
             cr.course_name, cr.credits, cr.course_type
      FROM grades g
      JOIN users u ON g.student_id = u.id
      JOIN student_profiles sp ON g.student_id = sp.user_id
      LEFT JOIN classes c ON sp.class_id = c.id
      JOIN courses cr ON g.course_id = cr.id
      WHERE g.teacher_id = ?
    `;
    const params = [req.user.id];
    
    if (course_id) {
      sql += ' AND g.course_id = ?';
      params.push(course_id);
    }
    
    if (term) {
      sql += ' AND g.term = ?';
      params.push(term);
    }
    
    if (academic_year) {
      sql += ' AND g.academic_year = ?';
      params.push(academic_year);
    }
    
    if (status) {
      sql += ' AND g.status = ?';
      params.push(status);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await getQuery(countSql, params);
    
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY g.academic_year DESC, g.term DESC, g.status ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const grades = await allQuery(sql, params);
    
    res.json({
      grades,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取教师成绩列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
