const express = require('express');
const { getQuery, allQuery } = require('../database/schema');
const { authMiddleware } = require('../engines/permissionEngine');

const router = express.Router();

router.get('/student-stats', authMiddleware(['report:read']), async (req, res) => {
  try {
    const { class_id, grade } = req.query;
    
    let sql = `
      SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN sp.enrollment_status = 'studying' THEN 1 ELSE 0 END) as studying_count,
        SUM(CASE WHEN sp.enrollment_status = 'suspended' THEN 1 ELSE 0 END) as suspended_count,
        SUM(CASE WHEN sp.enrollment_status = 'withdrawn' THEN 1 ELSE 0 END) as withdrawn_count,
        SUM(CASE WHEN sp.enrollment_status = 'graduated' THEN 1 ELSE 0 END) as graduated_count,
        SUM(CASE WHEN u.gender = 'male' THEN 1 ELSE 0 END) as male_count,
        SUM(CASE WHEN u.gender = 'female' THEN 1 ELSE 0 END) as female_count
      FROM users u
      JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.role = 'student'
    `;
    const params = [];
    
    if (class_id) {
      sql += ' AND sp.class_id = ?';
      params.push(class_id);
    }
    
    if (grade) {
      sql += ' AND sp.class_id IN (SELECT id FROM classes WHERE grade = ?)';
      params.push(grade);
    }
    
    const stats = await getQuery(sql, params);
    
    let classDistribution = [];
    if (!class_id) {
      classDistribution = await allQuery(`
        SELECT 
          c.id, c.class_name, c.class_code, c.grade,
          COUNT(sp.id) as student_count,
          u.name as homeroom_teacher_name
        FROM classes c
        LEFT JOIN student_profiles sp ON c.id = sp.class_id
        LEFT JOIN users u ON c.homeroom_teacher_id = u.id
        GROUP BY c.id
        ORDER BY c.grade DESC, c.class_code
      `);
    }
    
    res.json({
      statistics: stats,
      classDistribution
    });
    
  } catch (error) {
    console.error('获取学生统计报表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/enrollment-stats', authMiddleware(['report:read']), async (req, res) => {
  try {
    const { term, academic_year, course_type } = req.query;
    
    if (!term || !academic_year) {
      return res.status(400).json({ error: '请提供学期和学年参数' });
    }
    
    let sql = `
      SELECT 
        c.id, c.course_name, c.course_code, c.course_type, c.credits, c.max_students,
        u.name as teacher_name,
        COUNT(e.id) as enrolled_count,
        (c.max_students - COUNT(e.id)) as remaining_spots
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'enrolled'
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.term = ? AND c.academic_year = ?
    `;
    const params = [term, academic_year];
    
    if (course_type) {
      sql += ' AND c.course_type = ?';
      params.push(course_type);
    }
    
    sql += ' GROUP BY c.id ORDER BY enrolled_count DESC';
    
    const courseStats = await allQuery(sql, params);
    
    const summary = {
      totalCourses: courseStats.length,
      totalEnrolled: courseStats.reduce((sum, c) => sum + c.enrolled_count, 0),
      fullCourses: courseStats.filter(c => c.enrolled_count >= c.max_students).length,
      avgEnrollment: courseStats.length > 0 
        ? Math.round(courseStats.reduce((sum, c) => sum + c.enrolled_count, 0) / courseStats.length * 100) / 100 
        : 0
    };
    
    const typeDistribution = await allQuery(`
      SELECT 
        c.course_type,
        COUNT(DISTINCT c.id) as course_count,
        COUNT(e.id) as enrolled_count
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'enrolled'
      WHERE c.term = ? AND c.academic_year = ?
      GROUP BY c.course_type
    `, [term, academic_year]);
    
    res.json({
      summary,
      courseStats,
      typeDistribution
    });
    
  } catch (error) {
    console.error('获取选课统计报表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/grade-stats', authMiddleware(['report:read']), async (req, res) => {
  try {
    const { term, academic_year, class_id, course_id } = req.query;
    
    if (!term || !academic_year) {
      return res.status(400).json({ error: '请提供学期和学年参数' });
    }
    
    let sql = `
      SELECT 
        g.grade_level,
        COUNT(*) as count
      FROM grades g
      WHERE g.term = ? AND g.academic_year = ? AND g.status IN ('approved', 'archived')
    `;
    const params = [term, academic_year];
    
    if (class_id) {
      sql += ` AND g.student_id IN (
        SELECT user_id FROM student_profiles WHERE class_id = ?
      )`;
      params.push(class_id);
    }
    
    if (course_id) {
      sql += ' AND g.course_id = ?';
      params.push(course_id);
    }
    
    sql += ' GROUP BY g.grade_level ORDER BY g.grade_level';
    
    const gradeDistribution = await allQuery(sql, params);
    
    let scoreStats = {
      total: 0,
      average: 0,
      maxScore: 0,
      minScore: 100,
      passRate: 0,
      excellentRate: 0
    };
    
    let scoreSql = `
      SELECT 
        COUNT(*) as total,
        AVG(g.total_score) as average,
        MAX(g.total_score) as maxScore,
        MIN(g.total_score) as minScore,
        SUM(CASE WHEN g.total_score >= 60 THEN 1 ELSE 0 END) as passed_count,
        SUM(CASE WHEN g.total_score >= 90 THEN 1 ELSE 0 END) as excellent_count
      FROM grades g
      WHERE g.term = ? AND g.academic_year = ? AND g.status IN ('approved', 'archived')
    `;
    const scoreParams = [term, academic_year];
    
    if (class_id) {
      scoreSql += ` AND g.student_id IN (
        SELECT user_id FROM student_profiles WHERE class_id = ?
      )`;
      scoreParams.push(class_id);
    }
    
    if (course_id) {
      scoreSql += ' AND g.course_id = ?';
      scoreParams.push(course_id);
    }
    
    const scoreResult = await getQuery(scoreSql, scoreParams);
    
    if (scoreResult.total > 0) {
      scoreStats = {
        total: scoreResult.total,
        average: Math.round(scoreResult.average * 100) / 100,
        maxScore: scoreResult.maxScore,
        minScore: scoreResult.minScore,
        passRate: Math.round(scoreResult.passed_count / scoreResult.total * 10000) / 100,
        excellentRate: Math.round(scoreResult.excellent_count / scoreResult.total * 10000) / 100
      };
    }
    
    res.json({
      scoreStats,
      gradeDistribution
    });
    
  } catch (error) {
    console.error('获取成绩统计报表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/attendance-stats', authMiddleware(['report:read']), async (req, res) => {
  try {
    const { start_date, end_date, class_id, course_id } = req.query;
    
    let sql = `
      SELECT 
        a.status,
        COUNT(*) as count
      FROM attendances a
      WHERE 1=1
    `;
    const params = [];
    
    if (start_date) {
      sql += ' AND a.attendance_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND a.attendance_date <= ?';
      params.push(end_date);
    }
    if (class_id) {
      sql += ` AND a.student_id IN (
        SELECT user_id FROM student_profiles WHERE class_id = ?
      )`;
      params.push(class_id);
    }
    if (course_id) {
      sql += ' AND a.course_id = ?';
      params.push(course_id);
    }
    
    sql += ' GROUP BY a.status';
    
    const statusDistribution = await allQuery(sql, params);
    
    const stats = {
      total: 0,
      present: 0,
      late: 0,
      early_leave: 0,
      absent: 0,
      leave: 0,
      attendanceRate: 0
    };
    
    for (const item of statusDistribution) {
      stats.total += item.count;
      stats[item.status] = item.count;
    }
    
    if (stats.total > 0) {
      stats.attendanceRate = Math.round(
        ((stats.present + stats.late + stats.leave + stats.early_leave) / stats.total * 10000)
      ) / 100;
    }
    
    let dailyTrend = [];
    if (start_date && end_date) {
      dailyTrend = await allQuery(`
        SELECT 
          a.attendance_date,
          COUNT(*) as total_records,
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count
        FROM attendances a
        WHERE a.attendance_date >= ? AND a.attendance_date <= ?
        ${class_id ? `AND a.student_id IN (SELECT user_id FROM student_profiles WHERE class_id = ?)` : ''}
        ${course_id ? 'AND a.course_id = ?' : ''}
        GROUP BY a.attendance_date
        ORDER BY a.attendance_date
      `, [start_date, end_date, ...(class_id ? [class_id] : []), ...(course_id ? [course_id] : [])]);
    }
    
    res.json({
      statistics: stats,
      statusDistribution,
      dailyTrend
    });
    
  } catch (error) {
    console.error('获取考勤统计报表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/class-ranking', authMiddleware(['report:read']), async (req, res) => {
  try {
    const { term, academic_year, class_id } = req.query;
    
    if (!term || !academic_year) {
      return res.status(400).json({ error: '请提供学期和学年参数' });
    }
    
    let sql = `
      SELECT 
        u.id as student_id,
        u.name as student_name,
        sp.student_number,
        c.class_name,
        c.class_code,
        COUNT(g.id) as course_count,
        SUM(g.grade_point * cr.credits) as weighted_gp,
        SUM(cr.credits) as total_credits,
        AVG(g.total_score) as average_score
      FROM users u
      JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN classes c ON sp.class_id = c.id
      LEFT JOIN grades g ON u.id = g.student_id AND g.term = ? AND g.academic_year = ? AND g.status IN ('approved', 'archived')
      LEFT JOIN courses cr ON g.course_id = cr.id
      WHERE u.role = 'student'
    `;
    const params = [term, academic_year];
    
    if (class_id) {
      sql += ' AND sp.class_id = ?';
      params.push(class_id);
    }
    
    sql += ' GROUP BY u.id, u.name, sp.student_number, c.class_name, c.class_code';
    sql += ' ORDER BY weighted_gp DESC, average_score DESC';
    
    const studentRanking = await allQuery(sql, params);
    
    const rankedStudents = studentRanking.map((s, index) => ({
      ...s,
      rank: index + 1,
      gpa: s.total_credits > 0 
        ? Math.round(s.weighted_gp / s.total_credits * 100) / 100 
        : 0
    }));
    
    res.json({
      ranking: rankedStudents,
      term,
      academic_year
    });
    
  } catch (error) {
    console.error('获取班级排名报表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/teacher-workload', authMiddleware(['report:read']), async (req, res) => {
  try {
    const { term, academic_year } = req.query;
    
    if (!term || !academic_year) {
      return res.status(400).json({ error: '请提供学期和学年参数' });
    }
    
    const workload = await allQuery(`
      SELECT 
        u.id as teacher_id,
        u.name as teacher_name,
        tp.department,
        tp.position,
        COUNT(DISTINCT c.id) as course_count,
        COUNT(DISTINCT s.id) as schedule_count,
        SUM(
          CAST(SUBSTR(s.end_time, 1, 2) AS INTEGER) * 60 + CAST(SUBSTR(s.end_time, 4, 2) AS INTEGER) -
          CAST(SUBSTR(s.start_time, 1, 2) AS INTEGER) * 60 - CAST(SUBSTR(s.start_time, 4, 2) AS INTEGER)
        ) / 60 as total_hours
      FROM users u
      JOIN teacher_profiles tp ON u.id = tp.user_id
      LEFT JOIN courses c ON u.id = c.teacher_id AND c.term = ? AND c.academic_year = ?
      LEFT JOIN schedules s ON u.id = s.teacher_id AND s.term = ? AND s.academic_year = ? AND s.status = 'active'
      WHERE u.role IN ('teacher', 'homeroom_teacher')
      GROUP BY u.id, u.name, tp.department, tp.position
      ORDER BY total_hours DESC
    `, [term, academic_year, term, academic_year]);
    
    const summary = {
      totalTeachers: workload.length,
      totalCourses: workload.reduce((sum, w) => sum + w.course_count, 0),
      totalSchedules: workload.reduce((sum, w) => sum + w.schedule_count, 0),
      totalHours: workload.reduce((sum, w) => sum + (w.total_hours || 0), 0),
      avgHours: workload.length > 0 
        ? Math.round(workload.reduce((sum, w) => sum + (w.total_hours || 0), 0) / workload.length * 100) / 100 
        : 0
    };
    
    res.json({
      summary,
      teacherWorkload: workload
    });
    
  } catch (error) {
    console.error('获取教师工作量报表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
