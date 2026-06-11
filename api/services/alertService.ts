import db from '../database/index.js';
import type { AlertRecord, AlertQueryParams, PageResponse, AlertStatus, AlertType, AlertLevel } from '@shared/types';

export const alertService = {
  getList(params: AlertQueryParams, schoolIds: number[]): PageResponse<AlertRecord> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const offset = (page - 1) * pageSize;

    const whereConditions: string[] = [];
    const queryParams: (string | number | boolean)[] = [];

    if (schoolIds.length > 0) {
      whereConditions.push(`ar.school_id IN (${schoolIds.map(() => '?').join(', ')})`);
      queryParams.push(...schoolIds);
    }

    if (params.schoolId) {
      whereConditions.push('ar.school_id = ?');
      queryParams.push(params.schoolId);
    }

    if (params.type) {
      whereConditions.push('ar.type = ?');
      queryParams.push(params.type);
    }

    if (params.level) {
      whereConditions.push('ar.level = ?');
      queryParams.push(params.level);
    }

    if (params.status) {
      whereConditions.push('ar.status = ?');
      queryParams.push(params.status);
    }

    if (params.keyword) {
      whereConditions.push('(ar.title LIKE ? OR ar.description LIKE ? OR ar.student_name LIKE ?)');
      queryParams.push(`%${params.keyword}%`, `%${params.keyword}%`, `%${params.keyword}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM alert_records ar
      ${whereClause}
    `;

    const listSql = `
      SELECT 
        ar.id,
        ar.school_id,
        s.name as school_name,
        ar.type,
        ar.level,
        ar.student_id,
        ar.student_name,
        ar.title,
        ar.description,
        ar.status,
        ar.handler_id,
        ar.handler_name,
        ar.handle_time,
        ar.handle_remark,
        ar.created_at
      FROM alert_records ar
      LEFT JOIN schools s ON ar.school_id = s.id
      ${whereClause}
      ORDER BY ar.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countResult = db.prepare(countSql).get(...queryParams) as { total: number };
    const list = db.prepare(listSql).all(...queryParams, pageSize, offset) as any[];

    const formattedList: AlertRecord[] = list.map(item => ({
      id: item.id,
      schoolId: item.school_id,
      schoolName: item.school_name,
      type: item.type,
      level: item.level,
      studentId: item.student_id,
      studentName: item.student_name,
      title: item.title,
      description: item.description,
      status: item.status,
      handlerId: item.handler_id,
      handlerName: item.handler_name,
      handleTime: item.handle_time,
      handleRemark: item.handle_remark,
      createdAt: item.created_at,
    }));

    return {
      list: formattedList,
      total: countResult.total,
      page,
      pageSize,
    };
  },

  processAlert(
    id: number,
    data: { status: AlertStatus; remark: string },
    userId: number,
    userName: string,
    schoolIds: number[]
  ): AlertRecord | null {
    const existing = db.prepare(`
      SELECT id, school_id, status FROM alert_records WHERE id = ?
    `).get(id) as { id: number; school_id: number; status: AlertStatus } | undefined;

    if (!existing) {
      return null;
    }

    if (schoolIds.length > 0 && !schoolIds.includes(existing.school_id)) {
      return null;
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE alert_records
      SET 
        status = ?,
        handler_id = ?,
        handler_name = ?,
        handle_time = ?,
        handle_remark = ?
      WHERE id = ?
    `).run(data.status, userId, userName, now, data.remark, id);

    const result = db.prepare(`
      SELECT 
        ar.id,
        ar.school_id,
        s.name as school_name,
        ar.type,
        ar.level,
        ar.student_id,
        ar.student_name,
        ar.title,
        ar.description,
        ar.status,
        ar.handler_id,
        ar.handler_name,
        ar.handle_time,
        ar.handle_remark,
        ar.created_at
      FROM alert_records ar
      LEFT JOIN schools s ON ar.school_id = s.id
      WHERE ar.id = ?
    `).get(id) as any;

    if (!result) return null;

    return {
      id: result.id,
      schoolId: result.school_id,
      schoolName: result.school_name,
      type: result.type,
      level: result.level,
      studentId: result.student_id,
      studentName: result.student_name,
      title: result.title,
      description: result.description,
      status: result.status,
      handlerId: result.handler_id,
      handlerName: result.handler_name,
      handleTime: result.handle_time,
      handleRemark: result.handle_remark,
      createdAt: result.created_at,
    };
  },

  createAlert(data: {
    schoolId: number;
    type: AlertType;
    level: AlertLevel;
    studentId?: number;
    studentName?: string;
    title: string;
    description: string;
  }): AlertRecord {
    const result = db.prepare(`
      INSERT INTO alert_records (
        school_id,
        type,
        level,
        student_id,
        student_name,
        title,
        description,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      data.schoolId,
      data.type,
      data.level,
      data.studentId || null,
      data.studentName || null,
      data.title,
      data.description
    );

    const newId = result.lastInsertRowid as number;

    const record = db.prepare(`
      SELECT 
        ar.id,
        ar.school_id,
        s.name as school_name,
        ar.type,
        ar.level,
        ar.student_id,
        ar.student_name,
        ar.title,
        ar.description,
        ar.status,
        ar.handler_id,
        ar.handler_name,
        ar.handle_time,
        ar.handle_remark,
        ar.created_at
      FROM alert_records ar
      LEFT JOIN schools s ON ar.school_id = s.id
      WHERE ar.id = ?
    `).get(newId) as any;

    return {
      id: record.id,
      schoolId: record.school_id,
      schoolName: record.school_name,
      type: record.type,
      level: record.level,
      studentId: record.student_id,
      studentName: record.student_name,
      title: record.title,
      description: record.description,
      status: record.status,
      handlerId: record.handler_id,
      handlerName: record.handler_name,
      handleTime: record.handle_time,
      handleRemark: record.handle_remark,
      createdAt: record.created_at,
    };
  },
};

export default alertService;
