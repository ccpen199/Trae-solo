const { getQuery, allQuery } = require('../database/schema');

const timeSlots = {
  1: { start: '08:00', end: '08:45' },
  2: { start: '08:55', end: '09:40' },
  3: { start: '10:00', end: '10:45' },
  4: { start: '10:55', end: '11:40' },
  5: { start: '14:00', end: '14:45' },
  6: { start: '14:55', end: '15:40' },
  7: { start: '16:00', end: '16:45' },
  8: { start: '16:55', end: '17:40' },
  9: { start: '19:00', end: '19:45' },
  10: { start: '19:55', end: '20:40' }
};

const isTimeOverlap = (start1, end1, start2, end2) => {
  return !(end1 <= start2 || start1 >= end2);
};

const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const checkTeacherConflict = async (teacherId, dayOfWeek, startTime, endTime, excludeScheduleId = null) => {
  const conflicts = [];
  
  const teacherSchedules = await allQuery(
    `SELECT s.*, c.course_name, cr.room_name
     FROM schedules s
     JOIN courses c ON s.course_id = c.id
     LEFT JOIN classrooms cr ON s.classroom_id = cr.id
     WHERE s.teacher_id = ? 
       AND s.day_of_week = ? 
       AND s.status = 'active'
       ${excludeScheduleId ? 'AND s.id != ?' : ''}`,
    excludeScheduleId ? [teacherId, dayOfWeek, excludeScheduleId] : [teacherId, dayOfWeek]
  );
  
  for (const schedule of teacherSchedules) {
    if (isTimeOverlap(startTime, endTime, schedule.start_time, schedule.end_time)) {
      conflicts.push({
        type: 'teacher',
        message: `教师与课程"${schedule.course_name}"时间冲突`,
        conflictSchedule: schedule
      });
    }
  }
  
  return conflicts;
};

const checkClassroomConflict = async (classroomId, dayOfWeek, startTime, endTime, excludeScheduleId = null) => {
  const conflicts = [];
  
  if (!classroomId) return conflicts;
  
  const classroomSchedules = await allQuery(
    `SELECT s.*, c.course_name, u.name as teacher_name
     FROM schedules s
     JOIN courses c ON s.course_id = c.id
     JOIN users u ON s.teacher_id = u.id
     WHERE s.classroom_id = ? 
       AND s.day_of_week = ? 
       AND s.status = 'active'
       ${excludeScheduleId ? 'AND s.id != ?' : ''}`,
    excludeScheduleId ? [classroomId, dayOfWeek, excludeScheduleId] : [classroomId, dayOfWeek]
  );
  
  for (const schedule of classroomSchedules) {
    if (isTimeOverlap(startTime, endTime, schedule.start_time, schedule.end_time)) {
      conflicts.push({
        type: 'classroom',
        message: `教室与课程"${schedule.course_name}"时间冲突`,
        conflictSchedule: schedule
      });
    }
  }
  
  return conflicts;
};

const checkClassConflict = async (classId, dayOfWeek, startTime, endTime, excludeScheduleId = null) => {
  const conflicts = [];
  
  if (!classId) return conflicts;
  
  const classSchedules = await allQuery(
    `SELECT s.*, c.course_name, u.name as teacher_name
     FROM schedules s
     JOIN courses c ON s.course_id = c.id
     JOIN users u ON s.teacher_id = u.id
     WHERE s.class_id = ? 
       AND s.day_of_week = ? 
       AND s.status = 'active'
       ${excludeScheduleId ? 'AND s.id != ?' : ''}`,
    excludeScheduleId ? [classId, dayOfWeek, excludeScheduleId] : [classId, dayOfWeek]
  );
  
  for (const schedule of classSchedules) {
    if (isTimeOverlap(startTime, endTime, schedule.start_time, schedule.end_time)) {
      conflicts.push({
        type: 'class',
        message: `班级与课程"${schedule.course_name}"时间冲突`,
        conflictSchedule: schedule
      });
    }
  }
  
  return conflicts;
};

const checkStudentConflict = async (studentId, dayOfWeek, startTime, endTime) => {
  const conflicts = [];
  
  const studentSchedules = await allQuery(
    `SELECT s.*, c.course_name, u.name as teacher_name, cr.room_name
     FROM enrollments e
     JOIN schedules s ON e.schedule_id = s.id
     JOIN courses c ON s.course_id = c.id
     JOIN users u ON s.teacher_id = u.id
     LEFT JOIN classrooms cr ON s.classroom_id = cr.id
     WHERE e.student_id = ? 
       AND s.day_of_week = ? 
       AND s.status = 'active'
       AND e.status = 'enrolled'`,
    [studentId, dayOfWeek]
  );
  
  for (const schedule of studentSchedules) {
    if (isTimeOverlap(startTime, endTime, schedule.start_time, schedule.end_time)) {
      conflicts.push({
        type: 'student',
        message: `与已选课程"${schedule.course_name}"时间冲突`,
        conflictSchedule: schedule
      });
    }
  }
  
  return conflicts;
};

const validateSchedule = async (scheduleData, excludeScheduleId = null) => {
  const {
    course_id,
    teacher_id,
    classroom_id,
    class_id,
    day_of_week,
    start_time,
    end_time,
    term,
    academic_year
  } = scheduleData;
  
  const errors = [];
  const warnings = [];
  
  const teacher = await getQuery('SELECT * FROM users WHERE id = ? AND role = ?', [teacher_id, 'teacher']);
  if (!teacher) {
    errors.push('指定的教师不存在或不是教师角色');
  }
  
  if (classroom_id) {
    const classroom = await getQuery('SELECT * FROM classrooms WHERE id = ?', [classroom_id]);
    if (!classroom) {
      errors.push('指定的教室不存在');
    } else if (classroom.status !== 'available') {
      warnings.push(`教室当前状态为"${classroom.status}"，可能不可用`);
    }
  }
  
  const teacherConflicts = await checkTeacherConflict(
    teacher_id, day_of_week, start_time, end_time, excludeScheduleId
  );
  errors.push(...teacherConflicts.map(c => c.message));
  
  if (classroom_id) {
    const classroomConflicts = await checkClassroomConflict(
      classroom_id, day_of_week, start_time, end_time, excludeScheduleId
    );
    errors.push(...classroomConflicts.map(c => c.message));
  }
  
  if (class_id) {
    const classConflicts = await checkClassConflict(
      class_id, day_of_week, start_time, end_time, excludeScheduleId
    );
    errors.push(...classConflicts.map(c => c.message));
  }
  
  const course = await getQuery('SELECT * FROM courses WHERE id = ?', [course_id]);
  if (course && course.term !== term) {
    warnings.push('课程所属学期与排课学期不一致');
  }
  
  const startMins = parseTime(start_time);
  const endMins = parseTime(end_time);
  if (endMins <= startMins) {
    errors.push('结束时间必须晚于开始时间');
  }
  
  const duration = endMins - startMins;
  if (duration < 40) {
    warnings.push('排课时长较短，建议不少于40分钟');
  }
  if (duration > 240) {
    warnings.push('排课时长较长，建议单次不超过4小时');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

const findAvailableClassrooms = async (dayOfWeek, startTime, endTime, capacity = 0, excludeClassroomId = null) => {
  const allClassrooms = await allQuery(
    `SELECT * FROM classrooms 
     WHERE status = 'available' 
       AND capacity >= ?
       ${excludeClassroomId ? 'AND id != ?' : ''}
     ORDER BY capacity`,
    excludeClassroomId ? [capacity, excludeClassroomId] : [capacity]
  );
  
  const availableClassrooms = [];
  
  for (const classroom of allClassrooms) {
    const conflicts = await checkClassroomConflict(
      classroom.id, dayOfWeek, startTime, endTime
    );
    
    if (conflicts.length === 0) {
      availableClassrooms.push(classroom);
    }
  }
  
  return availableClassrooms;
};

const generateScheduleSuggestions = async (courseId, preferredTimeSlots = []) => {
  const course = await getQuery('SELECT * FROM courses WHERE id = ?', [courseId]);
  if (!course) {
    return { error: '课程不存在' };
  }
  
  const suggestions = [];
  const daysOfWeek = [1, 2, 3, 4, 5, 6, 7];
  
  for (const day of daysOfWeek) {
    for (let slot = 1; slot <= 10; slot += 2) {
      if (!timeSlots[slot] || !timeSlots[slot + 1]) continue;
      
      const startTime = timeSlots[slot].start;
      const endTime = timeSlots[slot + 1].end;
      
      const availableClassrooms = await findAvailableClassrooms(
        day, startTime, endTime, course.min_students
      );
      
      const teacherConflicts = await checkTeacherConflict(
        course.teacher_id, day, startTime, endTime
      );
      
      if (teacherConflicts.length === 0 && availableClassrooms.length > 0) {
        suggestions.push({
          day_of_week: day,
          day_name: ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'][day],
          start_time: startTime,
          end_time: endTime,
          available_classrooms: availableClassrooms.slice(0, 3),
          score: calculateSuggestionScore(day, slot)
        });
      }
    }
  }
  
  suggestions.sort((a, b) => b.score - a.score);
  
  return {
    course,
    suggestions: suggestions.slice(0, 5)
  };
};

const calculateSuggestionScore = (day, slot) => {
  let score = 100;
  
  if (day >= 6) score -= 30;
  
  if (slot >= 9) score -= 20;
  else if (slot >= 7) score -= 10;
  else if (slot >= 5) score -= 5;
  
  return score;
};

const getTeacherWeeklySchedule = async (teacherId, term, academicYear) => {
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
    [teacherId, term, academicYear]
  );
  
  const weekly = Array(7).fill(null).map(() => []);
  schedules.forEach(s => {
    weekly[s.day_of_week - 1].push(s);
  });
  
  return weekly;
};

const getClassWeeklySchedule = async (classId, term, academicYear) => {
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
    [classId, term, academicYear]
  );
  
  const weekly = Array(7).fill(null).map(() => []);
  schedules.forEach(s => {
    weekly[s.day_of_week - 1].push(s);
  });
  
  return weekly;
};

const getStudentWeeklySchedule = async (studentId, term, academicYear) => {
  const schedules = await allQuery(
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
    [studentId, term, academicYear]
  );
  
  const weekly = Array(7).fill(null).map(() => []);
  schedules.forEach(s => {
    weekly[s.day_of_week - 1].push(s);
  });
  
  return weekly;
};

module.exports = {
  timeSlots,
  isTimeOverlap,
  checkTeacherConflict,
  checkClassroomConflict,
  checkClassConflict,
  checkStudentConflict,
  validateSchedule,
  findAvailableClassrooms,
  generateScheduleSuggestions,
  getTeacherWeeklySchedule,
  getClassWeeklySchedule,
  getStudentWeeklySchedule
};
