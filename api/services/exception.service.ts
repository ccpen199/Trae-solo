import { query, get, run } from '../config/database.js';
import type { Exception, ExceptionType, ExceptionStatus, HandlingRecord, User } from '../types/index.js';

const EXCEPTION_JSON_FIELDS = ['evidence'];

function mapUserRow(row: Record<string, unknown>, prefix: string): User | undefined {
  const id = row[`${prefix}_id`];
  if (!id) return undefined;

  return {
    id: id as number,
    username: row[`${prefix}_username`] as string,
    name: row[`${prefix}_name`] as string,
    role: row[`${prefix}_role`] as User['role'],
    phone: row[`${prefix}_phone`] as string,
    email: row[`${prefix}_email`] as string | undefined,
    status: row[`${prefix}_status`] as User['status'],
    createdAt: row[`${prefix}_createdAt`] as string
  };
}

function mapHandlingRecordRow(row: Record<string, unknown>): HandlingRecord {
  return {
    id: row.id as number,
    operatorId: row.operatorId as number,
    operator: mapUserRow(row, 'operator'),
    action: row.action as string,
    comment: row.comment as string,
    createdAt: row.createdAt as string
  };
}

function mapExceptionRow(row: Record<string, unknown>): Exception {
  return {
    id: row.id as number,
    type: row.type as ExceptionType,
    relatedType: row.relatedType as Exception['relatedType'],
    relatedId: row.relatedId as number,
    reporterId: row.reporterId as number,
    reporter: mapUserRow(row, 'reporter'),
    assigneeId: row.assigneeId as number | undefined,
    assignee: mapUserRow(row, 'assignee'),
    title: row.title as string,
    description: row.description as string,
    evidence: (row.evidence as string[]) || [],
    status: row.status as ExceptionStatus,
    handlingRecords: [],
    resolution: row.resolution as string | undefined,
    closedAt: row.closedAt as string | undefined,
    createdAt: row.createdAt as string
  };
}

async function getHandlingRecordsByExceptionId(exceptionId: number): Promise<HandlingRecord[]> {
  const sql = `
    SELECT
      hr.id, hr.operator_id as operatorId, hr.action, hr.comment, hr.created_at as createdAt,
      u.id as operator_id, u.username as operator_username, u.name as operator_name,
      u.role as operator_role, u.phone as operator_phone, u.email as operator_email,
      u.status as operator_status, u.created_at as operator_createdAt
    FROM handling_records hr
    LEFT JOIN users u ON hr.operator_id = u.id
    WHERE hr.exception_id = ?
    ORDER BY hr.created_at DESC
  `;

  const rows = query<Record<string, unknown>>(sql, [exceptionId]);
  return rows.map(mapHandlingRecordRow);
}

export async function getExceptions(filters?: {
  type?: ExceptionType;
  status?: ExceptionStatus;
  assigneeId?: number;
}): Promise<Exception[]> {
  const conditions: string[] = [];
  const params: (string | number | null)[] = [];

  if (filters?.type !== undefined) {
    conditions.push('e.type = ?');
    params.push(filters.type);
  }

  if (filters?.status !== undefined) {
    conditions.push('e.status = ?');
    params.push(filters.status);
  }

  if (filters?.assigneeId !== undefined) {
    conditions.push('e.assignee_id = ?');
    params.push(filters.assigneeId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      e.id, e.type, e.related_type as relatedType, e.related_id as relatedId,
      e.reporter_id as reporterId, e.assignee_id as assigneeId,
      e.title, e.description, e.evidence_json as evidence,
      e.status, e.resolution, e.closed_at as closedAt, e.created_at as createdAt,
      r.id as reporter_id, r.username as reporter_username, r.name as reporter_name,
      r.role as reporter_role, r.phone as reporter_phone, r.email as reporter_email,
      r.status as reporter_status, r.created_at as reporter_createdAt,
      a.id as assignee_id, a.username as assignee_username, a.name as assignee_name,
      a.role as assignee_role, a.phone as assignee_phone, a.email as assignee_email,
      a.status as assignee_status, a.created_at as assignee_createdAt
    FROM exceptions e
    LEFT JOIN users r ON e.reporter_id = r.id
    LEFT JOIN users a ON e.assignee_id = a.id
    ${whereClause}
    ORDER BY e.created_at DESC
  `;

  const rows = query<Record<string, unknown>>(sql, params, EXCEPTION_JSON_FIELDS);

  const exceptions: Exception[] = [];
  for (const row of rows) {
    const exception = mapExceptionRow(row);
    exception.handlingRecords = await getHandlingRecordsByExceptionId(exception.id);
    exceptions.push(exception);
  }

  return exceptions;
}

export async function getExceptionById(id: number): Promise<Exception | null> {
  const sql = `
    SELECT
      e.id, e.type, e.related_type as relatedType, e.related_id as relatedId,
      e.reporter_id as reporterId, e.assignee_id as assigneeId,
      e.title, e.description, e.evidence_json as evidence,
      e.status, e.resolution, e.closed_at as closedAt, e.created_at as createdAt,
      r.id as reporter_id, r.username as reporter_username, r.name as reporter_name,
      r.role as reporter_role, r.phone as reporter_phone, r.email as reporter_email,
      r.status as reporter_status, r.created_at as reporter_createdAt,
      a.id as assignee_id, a.username as assignee_username, a.name as assignee_name,
      a.role as assignee_role, a.phone as assignee_phone, a.email as assignee_email,
      a.status as assignee_status, a.created_at as assignee_createdAt
    FROM exceptions e
    LEFT JOIN users r ON e.reporter_id = r.id
    LEFT JOIN users a ON e.assignee_id = a.id
    WHERE e.id = ?
    LIMIT 1
  `;

  const row = get<Record<string, unknown>>(sql, [id], EXCEPTION_JSON_FIELDS);

  if (!row) return null;

  const exception = mapExceptionRow(row);
  exception.handlingRecords = await getHandlingRecordsByExceptionId(exception.id);

  return exception;
}

export async function createException(data: Partial<Exception> & {
  type: ExceptionType;
  relatedType: string;
  relatedId: number;
  reporterId: number;
}): Promise<Exception> {
  const evidence = data.evidence || [];
  const status: ExceptionStatus = 'open';

  const sql = `
    INSERT INTO exceptions (
      type, related_type, related_id, reporter_id, title, description,
      evidence_json, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = run(sql, [
    data.type,
    data.relatedType,
    data.relatedId,
    data.reporterId,
    data.title || '',
    data.description || '',
    JSON.stringify(evidence),
    status
  ]);

  const exceptionId = result.lastInsertRowid as number;

  const exception = await getExceptionById(exceptionId);
  if (!exception) {
    throw new Error('创建异常工单失败');
  }

  return exception;
}

export async function assignException(
  id: number,
  assigneeId: number,
  operatorId: number
): Promise<Exception> {
  const existingException = await getExceptionById(id);
  if (!existingException) {
    throw new Error('异常工单不存在');
  }

  const sql = `
    UPDATE exceptions
    SET assignee_id = ?, status = ?
    WHERE id = ?
  `;

  run(sql, [assigneeId, 'investigating', id]);

  await addHandlingRecord(id, operatorId, '分配处理人', `分配给用户ID: ${assigneeId}`);

  const updatedException = await getExceptionById(id);
  if (!updatedException) {
    throw new Error('分配处理人失败');
  }

  return updatedException;
}

export async function addHandlingRecord(
  exceptionId: number,
  operatorId: number,
  action: string,
  comment: string
): Promise<HandlingRecord> {
  const sql = `
    INSERT INTO handling_records (exception_id, operator_id, action, comment)
    VALUES (?, ?, ?, ?)
  `;

  const result = run(sql, [exceptionId, operatorId, action, comment]);

  const recordId = result.lastInsertRowid as number;

  const recordSql = `
    SELECT
      hr.id, hr.operator_id as operatorId, hr.action, hr.comment, hr.created_at as createdAt,
      u.id as operator_id, u.username as operator_username, u.name as operator_name,
      u.role as operator_role, u.phone as operator_phone, u.email as operator_email,
      u.status as operator_status, u.created_at as operator_createdAt
    FROM handling_records hr
    LEFT JOIN users u ON hr.operator_id = u.id
    WHERE hr.id = ?
    LIMIT 1
  `;

  const row = get<Record<string, unknown>>(recordSql, [recordId]);
  if (!row) {
    throw new Error('添加处理记录失败');
  }

  return mapHandlingRecordRow(row);
}

export async function resolveException(
  id: number,
  resolution: string,
  operatorId: number
): Promise<Exception> {
  const existingException = await getExceptionById(id);
  if (!existingException) {
    throw new Error('异常工单不存在');
  }

  if (existingException.status === 'closed') {
    throw new Error('已关闭的工单无法解决');
  }

  const sql = `
    UPDATE exceptions
    SET status = ?, resolution = ?
    WHERE id = ?
  `;

  run(sql, ['resolved', resolution, id]);

  await addHandlingRecord(id, operatorId, '解决异常', resolution);

  const updatedException = await getExceptionById(id);
  if (!updatedException) {
    throw new Error('解决异常失败');
  }

  return updatedException;
}

export async function closeException(
  id: number,
  operatorId: number
): Promise<Exception> {
  const existingException = await getExceptionById(id);
  if (!existingException) {
    throw new Error('异常工单不存在');
  }

  if (existingException.status !== 'resolved') {
    throw new Error('只有已解决的工单可以关闭');
  }

  const sql = `
    UPDATE exceptions
    SET status = ?, closed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  run(sql, ['closed', id]);

  await addHandlingRecord(id, operatorId, '关闭工单', '工单已关闭');

  const updatedException = await getExceptionById(id);
  if (!updatedException) {
    throw new Error('关闭工单失败');
  }

  return updatedException;
}
