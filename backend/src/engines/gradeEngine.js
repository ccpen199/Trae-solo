const { getQuery, allQuery, runQuery } = require('../database/schema');

const gradeConfig = {
  weightings: {
    usual: 0.3,
    midterm: 0.3,
    final: 0.4
  },
  gpThresholds: [
    { min: 90, max: 100, gp: 4.0, level: 'A' },
    { min: 85, max: 89.9, gp: 3.7, level: 'A-' },
    { min: 82, max: 84.9, gp: 3.3, level: 'B+' },
    { min: 78, max: 81.9, gp: 3.0, level: 'B' },
    { min: 75, max: 77.9, gp: 2.7, level: 'B-' },
    { min: 72, max: 74.9, gp: 2.3, level: 'C+' },
    { min: 68, max: 71.9, gp: 2.0, level: 'C' },
    { min: 64, max: 67.9, gp: 1.7, level: 'C-' },
    { min: 60, max: 63.9, gp: 1.0, level: 'D' },
    { min: 0, max: 59.9, gp: 0.0, level: 'F' }
  ]
};

const calculateTotalScore = (usualScore, midtermScore, finalScore, customWeightings = null) => {
  const weights = customWeightings || gradeConfig.weightings;
  
  const total = 
    (usualScore || 0) * weights.usual +
    (midtermScore || 0) * weights.midterm +
    (finalScore || 0) * weights.final;
  
  return Math.round(total * 100) / 100;
};

const calculateGradePoint = (totalScore) => {
  for (const threshold of gradeConfig.gpThresholds) {
    if (totalScore >= threshold.min && totalScore <= threshold.max) {
      return {
        gradePoint: threshold.gp,
        gradeLevel: threshold.level
      };
    }
  }
  return { gradePoint: 0.0, gradeLevel: 'F' };
};

const calculateCourseRanks = async (courseId, term, academicYear) => {
  const grades = await allQuery(
    `SELECT g.*, u.name as student_name
     FROM grades g
     JOIN users u ON g.student_id = u.id
     WHERE g.course_id = ? AND g.term = ? AND g.academic_year = ?
     ORDER BY g.total_score DESC`,
    [courseId, term, academicYear]
  );
  
  let currentRank = 1;
  let prevScore = null;
  let sameScoreCount = 0;
  
  const rankedGrades = grades.map((grade, index) => {
    if (prevScore === null || grade.total_score < prevScore) {
      currentRank = index + 1;
      sameScoreCount = 1;
    } else if (grade.total_score === prevScore) {
      sameScoreCount++;
    }
    
    prevScore = grade.total_score;
    
    return {
      ...grade,
      rank: currentRank
    };
  });
  
  for (const grade of rankedGrades) {
    await runQuery(
      'UPDATE grades SET rank = ? WHERE id = ?',
      [grade.rank, grade.id]
    );
  }
  
  return rankedGrades;
};

const calculateGPA = async (studentId, term = null, academicYear = null) => {
  let sql = `
    SELECT g.*, c.credits, c.course_type
    FROM grades g
    JOIN courses c ON g.course_id = c.id
    WHERE g.student_id = ? AND g.status IN ('approved', 'archived')
  `;
  const params = [studentId];
  
  if (term) {
    sql += ' AND g.term = ?';
    params.push(term);
  }
  if (academicYear) {
    sql += ' AND g.academic_year = ?';
    params.push(academicYear);
  }
  
  const grades = await allQuery(sql, params);
  
  let totalCredits = 0;
  let totalWeightedGP = 0;
  
  for (const grade of grades) {
    if (grade.grade_point !== null && grade.credits > 0) {
      totalCredits += grade.credits;
      totalWeightedGP += grade.grade_point * grade.credits;
    }
  }
  
  const gpa = totalCredits > 0 ? Math.round(totalWeightedGP / totalCredits * 100) / 100 : 0;
  
  return {
    gpa,
    totalCredits,
    totalWeightedGP: Math.round(totalWeightedGP * 100) / 100,
    courseCount: grades.length
  };
};

const getCourseStatistics = async (courseId, term, academicYear) => {
  const grades = await allQuery(
    `SELECT g.*, u.name as student_name
     FROM grades g
     JOIN users u ON g.student_id = u.id
     WHERE g.course_id = ? AND g.term = ? AND g.academic_year = ?
     ORDER BY g.total_score DESC`,
    [courseId, term, academicYear]
  );
  
  if (grades.length === 0) {
    return {
      courseId,
      term,
      academicYear,
      studentCount: 0,
      averageScore: 0,
      maxScore: 0,
      minScore: 0,
      passRate: 0,
      excellentRate: 0,
      gradeDistribution: {},
      scoreRanges: {}
    };
  }
  
  const scores = grades.map(g => g.total_score || 0);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  
  const passedCount = scores.filter(s => s >= 60).length;
  const excellentCount = scores.filter(s => s >= 90).length;
  const passRate = Math.round(passedCount / scores.length * 10000) / 100;
  const excellentRate = Math.round(excellentCount / scores.length * 10000) / 100;
  
  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  const scoreRanges = { '0-59': 0, '60-69': 0, '70-79': 0, '80-89': 0, '90-100': 0 };
  
  for (const grade of grades) {
    if (grade.grade_level) {
      gradeDistribution[grade.grade_level.charAt(0)] = (gradeDistribution[grade.grade_level.charAt(0)] || 0) + 1;
    }
    
    const score = grade.total_score || 0;
    if (score >= 90) scoreRanges['90-100']++;
    else if (score >= 80) scoreRanges['80-89']++;
    else if (score >= 70) scoreRanges['70-79']++;
    else if (score >= 60) scoreRanges['60-69']++;
    else scoreRanges['0-59']++;
  }
  
  return {
    courseId,
    term,
    academicYear,
    studentCount: grades.length,
    averageScore: Math.round(averageScore * 100) / 100,
    maxScore,
    minScore,
    passRate,
    excellentRate,
    gradeDistribution,
    scoreRanges,
    topStudents: grades.slice(0, 10).map(g => ({
      studentId: g.student_id,
      studentName: g.student_name,
      totalScore: g.total_score,
      rank: g.rank
    }))
  };
};

const getClassStatistics = async (classId, term, academicYear) => {
  const classGrades = await allQuery(
    `SELECT g.*, c.course_name, c.credits, u.name as student_name
     FROM grades g
     JOIN courses c ON g.course_id = c.id
     JOIN users u ON g.student_id = u.id
     JOIN student_profiles sp ON g.student_id = sp.user_id
     WHERE sp.class_id = ? AND g.term = ? AND g.academic_year = ?
       AND g.status IN ('approved', 'archived')`,
    [classId, term, academicYear]
  );
  
  if (classGrades.length === 0) {
    return {
      classId,
      term,
      academicYear,
      studentCount: 0,
      averageGPA: 0,
      courseStats: []
    };
  }
  
  const studentIds = [...new Set(classGrades.map(g => g.student_id))];
  const courseIds = [...new Set(classGrades.map(g => g.course_id))];
  
  const studentGPAs = [];
  for (const studentId of studentIds) {
    const gpaInfo = await calculateGPA(studentId, term, academicYear);
    studentGPAs.push({ studentId, ...gpaInfo });
  }
  
  const averageGPA = studentGPAs.length > 0 
    ? studentGPAs.reduce((a, b) => a + b.gpa, 0) / studentGPAs.length 
    : 0;
  
  const courseStats = [];
  for (const courseId of courseIds) {
    const courseStat = await getCourseStatistics(courseId, term, academicYear);
    courseStats.push(courseStat);
  }
  
  const gpaDistribution = {
    '0-1.0': 0, '1.0-2.0': 0, '2.0-3.0': 0, '3.0-3.5': 0, '3.5-4.0': 0
  };
  
  for (const sg of studentGPAs) {
    if (sg.gpa >= 3.5) gpaDistribution['3.5-4.0']++;
    else if (sg.gpa >= 3.0) gpaDistribution['3.0-3.5']++;
    else if (sg.gpa >= 2.0) gpaDistribution['2.0-3.0']++;
    else if (sg.gpa >= 1.0) gpaDistribution['1.0-2.0']++;
    else gpaDistribution['0-1.0']++;
  }
  
  return {
    classId,
    term,
    academicYear,
    studentCount: studentIds.length,
    averageGPA: Math.round(averageGPA * 100) / 100,
    gpaDistribution,
    studentGPAs: studentGPAs.sort((a, b) => b.gpa - a.gpa),
    courseStats
  };
};

const processGradeImport = async (gradesData, courseId, term, academicYear, teacherId) => {
  const results = {
    success: [],
    failed: [],
    warnings: []
  };
  
  for (const gradeData of gradesData) {
    try {
      const { student_id, usual_score, midterm_score, final_score } = gradeData;
      
      const student = await getQuery(
        'SELECT u.*, sp.student_number FROM users u JOIN student_profiles sp ON u.id = sp.user_id WHERE u.id = ?',
        [student_id]
      );
      
      if (!student) {
        results.failed.push({ ...gradeData, error: '学生不存在' });
        continue;
      }
      
      const enrollment = await getQuery(
        `SELECT * FROM enrollments 
         WHERE student_id = ? AND course_id = ? AND term = ? AND academic_year = ? AND status = 'enrolled'`,
        [student_id, courseId, term, academicYear]
      );
      
      if (!enrollment) {
        results.failed.push({ ...gradeData, error: '学生未选修该课程' });
        continue;
      }
      
      const totalScore = calculateTotalScore(usual_score, midterm_score, final_score);
      const { gradePoint, gradeLevel } = calculateGradePoint(totalScore);
      
      const existingGrade = await getQuery(
        `SELECT * FROM grades 
         WHERE student_id = ? AND course_id = ? AND term = ? AND academic_year = ?`,
        [student_id, courseId, term, academicYear]
      );
      
      if (existingGrade) {
        if (existingGrade.status === 'archived') {
          results.failed.push({ ...gradeData, error: '成绩已归档，无法修改' });
          continue;
        }
        
        await runQuery(
          `UPDATE grades SET 
           usual_score = ?, midterm_score = ?, final_score = ?, 
           total_score = ?, grade_point = ?, grade_level = ?,
           teacher_id = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [usual_score, midterm_score, final_score, totalScore, gradePoint, gradeLevel, teacherId, existingGrade.id]
        );
        
        results.success.push({ ...gradeData, action: 'updated', totalScore, gradePoint, gradeLevel });
      } else {
        const result = await runQuery(
          `INSERT INTO grades 
           (student_id, course_id, teacher_id, enrollment_id, usual_score, midterm_score, final_score, 
            total_score, grade_point, grade_level, status, term, academic_year)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
          [student_id, courseId, teacherId, enrollment.id, usual_score, midterm_score, final_score, 
           totalScore, gradePoint, gradeLevel, term, academicYear]
        );
        
        results.success.push({ ...gradeData, action: 'created', id: result.lastID, totalScore, gradePoint, gradeLevel });
      }
      
    } catch (error) {
      results.failed.push({ ...gradeData, error: error.message });
    }
  }
  
  await calculateCourseRanks(courseId, term, academicYear);
  
  return results;
};

const submitGrades = async (courseId, term, academicYear) => {
  const grades = await allQuery(
    `SELECT * FROM grades 
     WHERE course_id = ? AND term = ? AND academic_year = ? AND status = 'draft'`,
    [courseId, term, academicYear]
  );
  
  for (const grade of grades) {
    await runQuery(
      "UPDATE grades SET status = 'submitted', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [grade.id]
    );
  }
  
  return {
    submittedCount: grades.length,
    message: `已提交 ${grades.length} 条成绩记录`
  };
};

const approveGrades = async (courseId, term, academicYear) => {
  const grades = await allQuery(
    `SELECT * FROM grades 
     WHERE course_id = ? AND term = ? AND academic_year = ? AND status = 'submitted'`,
    [courseId, term, academicYear]
  );
  
  for (const grade of grades) {
    await runQuery(
      "UPDATE grades SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [grade.id]
    );
  }
  
  return {
    approvedCount: grades.length,
    message: `已审核通过 ${grades.length} 条成绩记录`
  };
};

const archiveGrades = async (courseId, term, academicYear) => {
  const grades = await allQuery(
    `SELECT * FROM grades 
     WHERE course_id = ? AND term = ? AND academic_year = ? AND status = 'approved'`,
    [courseId, term, academicYear]
  );
  
  for (const grade of grades) {
    await runQuery(
      "UPDATE grades SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [grade.id]
    );
  }
  
  return {
    archivedCount: grades.length,
    message: `已归档 ${grades.length} 条成绩记录`
  };
};

module.exports = {
  gradeConfig,
  calculateTotalScore,
  calculateGradePoint,
  calculateCourseRanks,
  calculateGPA,
  getCourseStatistics,
  getClassStatistics,
  processGradeImport,
  submitGrades,
  approveGrades,
  archiveGrades
};
