import db from '../utils/db.js';
import type { Experiment, RubricItem, ExperimentStatus } from '../types/index.js';

function rowToExperiment(row: Record<string, unknown>): Experiment {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description as string,
    objectives: row.objectives as string,
    template: row.template as string | undefined,
    courseId: row.course_id as number,
    deadline: row.deadline as string,
    lateDeadline: row.late_deadline as string | undefined,
    status: row.status as ExperimentStatus,
    version: row.version as number,
    createdBy: row.created_by as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToRubricItem(row: Record<string, unknown>): RubricItem {
  return {
    id: row.id as number,
    experimentId: row.experiment_id as number,
    name: row.name as string,
    description: row.description as string,
    maxScore: row.max_score as number,
    weight: row.weight as number,
    sortOrder: row.sort_order as number,
  };
}

export function findAll(courseId?: number, status?: ExperimentStatus): Experiment[] {
  let sql = 'SELECT * FROM experiments';
  const params: unknown[] = [];
  const conditions: string[] = [];
  
  if (courseId) {
    conditions.push('course_id = ?');
    params.push(courseId);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToExperiment);
}

export function findById(id: number): Experiment | null {
  const row = db.prepare('SELECT * FROM experiments WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? rowToExperiment(row) : null;
}

export function getRubricItems(experimentId: number): RubricItem[] {
  const rows = db.prepare('SELECT * FROM rubric_items WHERE experiment_id = ? ORDER BY sort_order ASC').all(experimentId) as Record<string, unknown>[];
  return rows.map(rowToRubricItem);
}

export function create(data: {
  title: string;
  description: string;
  objectives: string;
  template?: string;
  courseId: number;
  deadline: string;
  lateDeadline?: string;
  status: ExperimentStatus;
  createdBy: number;
}): Experiment {
  const stmt = db.prepare(`
    INSERT INTO experiments (title, description, objectives, template, course_id, deadline, late_deadline, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.title,
    data.description,
    data.objectives,
    data.template || null,
    data.courseId,
    data.deadline,
    data.lateDeadline || null,
    data.status,
    data.createdBy
  );
  return findById(result.lastInsertRowid as number)!;
}

export function addRubricItem(experimentId: number, data: {
  name: string;
  description: string;
  maxScore: number;
  weight: number;
  sortOrder: number;
}): RubricItem {
  const stmt = db.prepare(`
    INSERT INTO rubric_items (experiment_id, name, description, max_score, weight, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    experimentId,
    data.name,
    data.description,
    data.maxScore,
    data.weight,
    data.sortOrder
  );
  const row = db.prepare('SELECT * FROM rubric_items WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
  return rowToRubricItem(row);
}

export function update(id: number, data: Partial<{
  title: string;
  description: string;
  objectives: string;
  template: string;
  deadline: string;
  lateDeadline: string;
  status: ExperimentStatus;
}>): Experiment | null {
  const fields: string[] = [];
  const params: unknown[] = [];
  
  if (data.title !== undefined) {
    fields.push('title = ?');
    params.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    params.push(data.description);
  }
  if (data.objectives !== undefined) {
    fields.push('objectives = ?');
    params.push(data.objectives);
  }
  if (data.template !== undefined) {
    fields.push('template = ?');
    params.push(data.template);
  }
  if (data.deadline !== undefined) {
    fields.push('deadline = ?');
    params.push(data.deadline);
  }
  if (data.lateDeadline !== undefined) {
    fields.push('late_deadline = ?');
    params.push(data.lateDeadline);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  
  db.prepare(`UPDATE experiments SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return findById(id);
}

export function saveVersion(experimentId: number, version: number, changedBy: number): void {
  const exp = findById(experimentId);
  if (!exp) return;
  
  db.prepare(`
    INSERT INTO experiment_versions (experiment_id, version, title, description, objectives, deadline, changed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    experimentId,
    version,
    exp.title,
    exp.description,
    exp.objectives,
    exp.deadline,
    changedBy
  );
}
