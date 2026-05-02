const { getQuery, allQuery, runQuery } = require('../database/schema');

const enrollmentRules = {
  maxCreditsPerTerm: 24,
  minCreditsPerTerm: 12,
  maxCoursesPerTerm: 8,
  allowCourseConflict: false,
  requirePrerequisites: true,
  enrollmentDeadlineDays: 7
};

const checkEnrollmentRules = async (studentId, courseId, term, academicYear) => {
  const errors = [];
  const warnings = [];
  
  const studentProfile = await getQuery(
    `SELECT sp.*, c.class_name, c.grade 
     FROM student_profiles sp 
     LEFT JOIN classes c ON sp.class_id = c.id 
     WHERE sp.user_id = ?`,
    [studentId]
  );
  
  if (!studentProfile) {
    errors.push('学生档案不存在');
    return { valid: false, errors, warnings };
  }
  
  if (studentProfile.enrollment_status !== 'studying' && studentProfile.enrollment_status !== 'enrolled') {
    errors.push('学生当前状态不允许选课');
    return { valid: false, errors, warnings };
  }
  
  const course = await getQuery(
    `SELECT c.*, u.name as teacher_name 
     FROM courses c 
     LEFT JOIN users u ON c.teacher_id = u.id 
     WHERE c.id = ?`,
    [courseId]
  );
  
  if (!course) {
    errors.push('课程不存在');
    return { valid: false, errors, warnings };
  }
  
  if (course.status !== 'published') {
    errors.push('课程未发布，不可选课');
    return { valid: false, errors, warnings };
  }
  
  if (course.term !== term || course.academic_year !== academicYear) {
    errors.push('课程不属于当前学期');
    return { valid: false, errors, warnings };
  }
  
  const existingEnrollment = await getQuery(
    `SELECT * FROM enrollments 
     WHERE student_id = ? AND course_id = ? AND term = ? AND academic_year = ?`,
    [studentId, courseId, term, academicYear]
  );
  
  if (existingEnrollment) {
    if (existingEnrollment.status === 'enrolled') {
      errors.push('已选该课程，请勿重复选课');
    } else if (existingEnrollment.status === 'dropped') {
      warnings.push('曾退选该课程，请确认是否重新选择');
    }
  }
  
  const currentEnrollments = await allQuery(
    `SELECT e.*, c.credits, c.course_type, s.day_of_week, s.start_time, s.end_time
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     LEFT JOIN schedules s ON e.schedule_id = s.id
     WHERE e.student_id = ? AND e.status = 'enrolled' AND e.term = ? AND e.academic_year = ?`,
    [studentId, term, academicYear]
  );
  
  const currentCredits = currentEnrollments.reduce((sum, e) => sum + (e.credits || 0), 0);
  const currentCourseCount = currentEnrollments.length;
  
  if (currentCredits + course.credits > enrollmentRules.maxCreditsPerTerm) {
    errors.push(`已选学分(${currentCredits}) + 拟选学分(${course.credits}) 超过最大限制(${enrollmentRules.maxCreditsPerTerm})`);
  }
  
  if (currentCourseCount >= enrollmentRules.maxCoursesPerTerm) {
    errors.push(`已选课程数量(${currentCourseCount}) 超过最大限制(${enrollmentRules.maxCoursesPerTerm})`);
  }
  
  if (!enrollmentRules.allowCourseConflict) {
    const courseSchedules = await allQuery(
      `SELECT * FROM schedules WHERE course_id = ? AND term = ? AND academic_year = ?`,
      [courseId, term, academicYear]
    );
    
    for (const schedule of courseSchedules) {
      const conflict = currentEnrollments.find(e => 
        e.day_of_week === schedule.day_of_week &&
        !(e.end_time <= schedule.start_time || e.start_time >= schedule.end_time)
      );
      
      if (conflict) {
        errors.push(`课程时间冲突：与已选课程时间重叠`);
      }
    }
  }
  
  if (enrollmentRules.requirePrerequisites && course.prerequisite) {
    const prerequisites = course.prerequisite.split(',').map(p => p.trim());
    
    for (const prereqCode of prerequisites) {
      const hasCompleted = await getQuery(
        `SELECT g.* FROM grades g
         JOIN courses c ON g.course_id = c.id
         WHERE g.student_id = ? AND c.course_code = ? AND g.status = 'archived'`,
        [studentId, prereqCode]
      );
      
      if (!hasCompleted) {
        errors.push(`未满足先修条件：需要先修 ${prereqCode}`);
      }
    }
  }
  
  const enrolledCount = await getQuery(
    `SELECT COUNT(*) as count FROM enrollments 
     WHERE course_id = ? AND status = 'enrolled'`,
    [courseId]
  );
  
  if (enrolledCount.count >= course.max_students) {
    errors.push(`课程已满，当前已选${enrolledCount.count}人，最大容量${course.max_students}人`);
  }
  
  if (enrolledCount.count === 0 && course.min_students > 1) {
    warnings.push(`该课程当前选课人数为0，如最终选课人数不足${course.min_students}人可能停开`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    currentCredits,
    currentCourseCount,
    enrolledCount: enrolledCount.count,
    maxCapacity: course.max_students
  };
};

const validateDropCourse = async (studentId, courseId, term, academicYear) => {
  const errors = [];
  
  const enrollment = await getQuery(
    `SELECT * FROM enrollments 
     WHERE student_id = ? AND course_id = ? AND term = ? AND academic_year = ?`,
    [studentId, courseId, term, academicYear]
  );
  
  if (!enrollment) {
    errors.push('未找到选课记录');
    return { valid: false, errors };
  }
  
  if (enrollment.status === 'dropped') {
    errors.push('该课程已退选');
    return { valid: false, errors };
  }
  
  if (enrollment.status !== 'enrolled') {
    errors.push('当前选课状态不允许退选');
    return { valid: false, errors };
  }
  
  const course = await getQuery('SELECT * FROM courses WHERE id = ?', [courseId]);
  if (course && course.course_type === 'required') {
    errors.push('必修课不可退选');
    return { valid: false, errors };
  }
  
  return { valid: true, errors };
};

const processEnrollment = async (studentId, courseId, term, academicYear, scheduleId = null) => {
  const validation = await checkEnrollmentRules(studentId, courseId, term, academicYear);
  
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings
    };
  }
  
  const existingDropped = await getQuery(
    `SELECT * FROM enrollments 
     WHERE student_id = ? AND course_id = ? AND term = ? AND academic_year = ? AND status = 'dropped'`,
    [studentId, courseId, term, academicYear]
  );
  
  if (existingDropped) {
    await runQuery(
      `UPDATE enrollments SET status = 'enrolled', enroll_time = CURRENT_TIMESTAMP, drop_time = NULL, schedule_id = ? WHERE id = ?`,
      [scheduleId, existingDropped.id]
    );
  } else {
    await runQuery(
      `INSERT INTO enrollments (student_id, course_id, schedule_id, term, academic_year, status) 
       VALUES (?, ?, ?, ?, ?, 'enrolled')`,
      [studentId, courseId, scheduleId, term, academicYear]
    );
  }
  
  return {
    success: true,
    warnings: validation.warnings,
    message: '选课成功'
  };
};

const processDropCourse = async (studentId, courseId, term, academicYear) => {
  const validation = await validateDropCourse(studentId, courseId, term, academicYear);
  
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors
    };
  }
  
  await runQuery(
    `UPDATE enrollments SET status = 'dropped', drop_time = CURRENT_TIMESTAMP 
     WHERE student_id = ? AND course_id = ? AND term = ? AND academic_year = ?`,
    [studentId, courseId, term, academicYear]
  );
  
  return {
    success: true,
    message: '退选成功'
  };
};

module.exports = {
  enrollmentRules,
  checkEnrollmentRules,
  validateDropCourse,
  processEnrollment,
  processDropCourse
};
