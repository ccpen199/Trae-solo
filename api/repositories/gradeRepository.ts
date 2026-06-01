import db from '../utils/db.js';
import type { GradeArchive, Course, Class } from '../types/index.js';

function rowToGradeArchive(row: Record<string, unknown>): GradeArchive {
  return {
    id: row.id as number,
    submissionId: row.submission_id as number,
    courseId: row.course_id as number,
    classId: row.class_id as number | undefined,
    experimentId: row.experiment_id as number,
    studentId: row.student_id as number,
    totalScore: row.total_score as number,
    gradingVersion: row.grading_version as number,
    archivedBy: row.archived_by as number,
    archivedAt: row.archived_at as string,
    adjustmentReason: row.adjustment_reason as string | undefined,
  };
}

function rowToCourse(row: Record<string, unknown>): Course {
  return {
    id: row.id as number,
    name: row.name as string,
    code: row.code as string,
    teacherId: row.teacher_id as number | undefined,
    createdAt: row.created_at as string,
  };
}

function rowToClass(row: Record<string, unknown>): Class {
  return {
    id: row.id as number,
    name: row.name as string,
    courseId: row.course_id as number,
    createdAt: row.created_at as string,
  };
}

export function findAllCourses(): Course[] {
  const rows = db.prepare('SELECT * FROM courses ORDER BY created_at DESC').all() as Record<string, unknown>[];
  return rows.map(rowToCourse);
}

export function findAllClasses(courseId?: number): Class[] {
  let sql = 'SELECT * FROM classes';
  const params: unknown[] = [];
  
  if (courseId) {
    sql += ' WHERE course_id = ?';
    params.push(courseId);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToClass);
}

export function archiveGrade(data: {
  submissionId: number;
  courseId: number;
  classId?: number;
  experimentId: number;
  studentId: number;
  totalScore: number;
  gradingVersion: number;
  archivedBy: number;
  adjustmentReason?: string;
}): GradeArchive {
  const result = db.prepare(`
    INSERT INTO grade_archives (submission_id, course_id, class_id, experiment_id, student_id, total_score, grading_version, archived_by, adjustment_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.submissionId,
    data.courseId,
    data.classId || null,
    data.experimentId,
    data.studentId,
    data.totalScore,
    data.gradingVersion,
    data.archivedBy,
    data.adjustmentReason || null
  );
  
  const row = db.prepare('SELECT * FROM grade_archives WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
  return rowToGradeArchive(row);
}

export function findArchives(courseId?: number, classId?: number, experimentId?: number): GradeArchive[] {
  let sql = 'SELECT * FROM grade_archives';
  const params: unknown[] = [];
  const conditions: string[] = [];
  
  if (courseId) {
    conditions.push('course_id = ?');
    params.push(courseId);
  }
  if (classId) {
    conditions.push('class_id = ?');
    params.push(classId);
  }
  if (experimentId) {
    conditions.push('experiment_id = ?');
    params.push(experimentId);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' ORDER BY archived_at DESC';
  
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToGradeArchive);
}

export function exportGrades(courseId?: number, classId?: number, experimentId?: number) {
  let sql = `
    SELECT 
      ga.*,
      u.name as student_name,
      u.student_id,
      e.title as experiment_title,
      c.name as course_name,
      c.code as course_code,
      cl.name as class_name
    FROM grade_archives ga
    JOIN users u ON ga.student_id = u.id
    JOIN experiments e ON ga.experiment_id = e.id
    JOIN courses c ON ga.course_id = c.id
    LEFT JOIN classes cl ON ga.class_id = cl.id
  `;
  const params: unknown[] = [];
  const conditions: string[] = [];
  
  if (courseId) {
    conditions.push('ga.course_id = ?');
    params.push(courseId);
  }
  if (classId) {
    conditions.push('ga.class_id = ?');
    params.push(classId);
  }
  if (experimentId) {
    conditions.push('ga.experiment_id = ?');
    params.push(experimentId);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' ORDER BY ga.archived_at DESC';
  
  return db.prepare(sql).all(...params) as Record<string, unknown>[];
}
