import db from '../utils/db.js';
import type { Submission, SubmissionFile, Grade, Annotation, SubmissionStatus } from '../types/index.js';

function rowToSubmission(row: Record<string, unknown>): Submission {
  return {
    id: row.id as number,
    experimentId: row.experiment_id as number,
    studentId: row.student_id as number,
    status: row.status as SubmissionStatus,
    submittedAt: row.submitted_at as string | undefined,
    gradedAt: row.graded_at as string | undefined,
    gradedBy: row.graded_by as number | undefined,
    totalScore: row.total_score as number | undefined,
    version: row.version as number,
    createdAt: row.created_at as string,
  };
}

function rowToSubmissionFile(row: Record<string, unknown>): SubmissionFile {
  return {
    id: row.id as number,
    submissionId: row.submission_id as number,
    filename: row.filename as string,
    originalName: row.original_name as string,
    fileType: row.file_type as string,
    fileSize: row.file_size as number,
    createdAt: row.created_at as string,
  };
}

function rowToGrade(row: Record<string, unknown>): Grade {
  return {
    id: row.id as number,
    submissionId: row.submission_id as number,
    rubricItemId: row.rubric_item_id as number,
    score: row.score as number,
    comment: row.comment as string | undefined,
    gradedBy: row.graded_by as number,
    createdAt: row.created_at as string,
  };
}

function rowToAnnotation(row: Record<string, unknown>): Annotation {
  return {
    id: row.id as number,
    submissionId: row.submission_id as number,
    content: row.content as string,
    createdBy: row.created_by as number,
    createdAt: row.created_at as string,
    resolved: !!row.resolved,
  };
}

export function findByStudent(studentId: number, experimentId?: number): Submission[] {
  let sql = 'SELECT * FROM submissions WHERE student_id = ?';
  const params: unknown[] = [studentId];
  
  if (experimentId) {
    sql += ' AND experiment_id = ?';
    params.push(experimentId);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToSubmission);
}

export function findByExperiment(experimentId: number, status?: SubmissionStatus): Submission[] {
  let sql = 'SELECT * FROM submissions WHERE experiment_id = ?';
  const params: unknown[] = [experimentId];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToSubmission);
}

export function findById(id: number): Submission | null {
  const row = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? rowToSubmission(row) : null;
}

export function findOrCreate(experimentId: number, studentId: number): Submission {
  const existing = db.prepare('SELECT * FROM submissions WHERE experiment_id = ? AND student_id = ?').get(experimentId, studentId) as Record<string, unknown> | undefined;
  
  if (existing) {
    return rowToSubmission(existing);
  }
  
  const result = db.prepare(`
    INSERT INTO submissions (experiment_id, student_id, status)
    VALUES (?, ?, 'draft')
  `).run(experimentId, studentId);
  
  return findById(result.lastInsertRowid as number)!;
}

export function getFiles(submissionId: number): SubmissionFile[] {
  const rows = db.prepare('SELECT * FROM submission_files WHERE submission_id = ? ORDER BY created_at DESC').all(submissionId) as Record<string, unknown>[];
  return rows.map(rowToSubmissionFile);
}

export function addFile(submissionId: number, data: {
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
}): SubmissionFile {
  const result = db.prepare(`
    INSERT INTO submission_files (submission_id, filename, original_name, file_type, file_size)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    submissionId,
    data.filename,
    data.originalName,
    data.fileType,
    data.fileSize
  );
  const row = db.prepare('SELECT * FROM submission_files WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
  return rowToSubmissionFile(row);
}

export function removeFile(fileId: number): void {
  db.prepare('DELETE FROM submission_files WHERE id = ?').run(fileId);
}

export function updateStatus(id: number, status: SubmissionStatus, submittedAt?: string): Submission | null {
  const params: unknown[] = [status];
  if (submittedAt) {
    params.push(submittedAt);
    params.push(id);
    db.prepare('UPDATE submissions SET status = ?, submitted_at = ? WHERE id = ?').run(...params);
  } else {
    params.push(id);
    db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run(...params);
  }
  return findById(id);
}

export function updateScore(id: number, totalScore: number, gradedBy: number): Submission | null {
  db.prepare(`
    UPDATE submissions SET total_score = ?, graded_by = ?, graded_at = CURRENT_TIMESTAMP, status = 'graded'
    WHERE id = ?
  `).run(totalScore, gradedBy, id);
  return findById(id);
}

export function getGrades(submissionId: number): Grade[] {
  const rows = db.prepare('SELECT * FROM grades WHERE submission_id = ? ORDER BY created_at DESC').all(submissionId) as Record<string, unknown>[];
  return rows.map(rowToGrade);
}

export function saveGrade(submissionId: number, rubricItemId: number, score: number, comment: string | undefined, gradedBy: number): Grade {
  const existing = db.prepare('SELECT * FROM grades WHERE submission_id = ? AND rubric_item_id = ?').get(submissionId, rubricItemId) as Record<string, unknown> | undefined;
  
  if (existing) {
    db.prepare('UPDATE grades SET score = ?, comment = ?, graded_by = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      score, comment || null, gradedBy, existing.id
    );
    const row = db.prepare('SELECT * FROM grades WHERE id = ?').get(existing.id) as Record<string, unknown>;
    return rowToGrade(row);
  }
  
  const result = db.prepare(`
    INSERT INTO grades (submission_id, rubric_item_id, score, comment, graded_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(submissionId, rubricItemId, score, comment || null, gradedBy);
  
  const row = db.prepare('SELECT * FROM grades WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
  return rowToGrade(row);
}

export function getAnnotations(submissionId: number): Annotation[] {
  const rows = db.prepare('SELECT * FROM annotations WHERE submission_id = ? ORDER BY created_at DESC').all(submissionId) as Record<string, unknown>[];
  return rows.map(rowToAnnotation);
}

export function addAnnotation(submissionId: number, content: string, createdBy: number): Annotation {
  const result = db.prepare(`
    INSERT INTO annotations (submission_id, content, created_by)
    VALUES (?, ?, ?)
  `).run(submissionId, content, createdBy);
  
  const row = db.prepare('SELECT * FROM annotations WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
  return rowToAnnotation(row);
}

export function addHistory(submissionId: number, action: string, statusBefore: string | undefined, statusAfter: string, performedBy: number, reason?: string): void {
  db.prepare(`
    INSERT INTO submission_history (submission_id, action, status_before, status_after, performed_by, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(submissionId, action, statusBefore || null, statusAfter, performedBy, reason || null);
}

export function getPendingGrading(graderId?: number): Submission[] {
  let sql = `
    SELECT s.* FROM submissions s
    WHERE s.status IN ('submitted', 'late', 'resubmitted')
  `;
  const params: unknown[] = [];
  sql += ' ORDER BY s.submitted_at ASC';
  
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToSubmission);
}
