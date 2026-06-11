import db from '../database/index.js';
import type { Student, StudentQueryParams, PageResponse } from '../../shared/types.js';

function mapStudentRow(row: any): Student {
  return {
    id: row.id,
    studentNo: row.student_no,
    name: row.name,
    gender: row.gender as Student['gender'],
    grade: row.grade,
    className: row.class,
    schoolId: row.school_id,
    idCard: row.id_card,
    phone: row.phone,
    faceData: row.face_data,
    isPoverty: row.is_poverty === 1,
    isFundingEligible: row.is_funding_eligible === 1,
    status: row.status as Student['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    schoolName: row.school_name,
  };
}

export function getList(
  params: StudentQueryParams,
  schoolIds: number[]
): PageResponse<Student> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const whereClauses: string[] = [];
  const queryParams: any[] = [];

  if (schoolIds.length > 0) {
    const placeholders = schoolIds.map(() => '?').join(',');
    whereClauses.push(`s.school_id IN (${placeholders})`);
    queryParams.push(...schoolIds);
  }

  if (params.keyword) {
    whereClauses.push('(s.name LIKE ? OR s.student_no LIKE ? OR s.id_card LIKE ?)');
    const keyword = `%${params.keyword}%`;
    queryParams.push(keyword, keyword, keyword);
  }

  if (params.schoolId) {
    whereClauses.push('s.school_id = ?');
    queryParams.push(params.schoolId);
  }

  if (params.grade) {
    whereClauses.push('s.grade = ?');
    queryParams.push(params.grade);
  }

  if (params.className) {
    whereClauses.push('s.class = ?');
    queryParams.push(params.className);
  }

  if (params.isPoverty !== undefined) {
    whereClauses.push('s.is_poverty = ?');
    queryParams.push(params.isPoverty ? 1 : 0);
  }

  if (params.status) {
    whereClauses.push('s.status = ?');
    queryParams.push(params.status);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*) as total
    FROM students s
    ${whereSql}
  `;

  const countRow = db.prepare(countSql).get(...queryParams) as { total: number };
  const total = countRow.total;

  const listSql = `
    SELECT s.*, sc.name as school_name
    FROM students s
    LEFT JOIN schools sc ON s.school_id = sc.id
    ${whereSql}
    ORDER BY s.id DESC
    LIMIT ? OFFSET ?
  `;

  const rows = db.prepare(listSql).all(...queryParams, pageSize, offset) as any[];
  const list = rows.map(mapStudentRow);

  return {
    list,
    total,
    page,
    pageSize,
  };
}

export function getById(id: number, schoolIds: number[]): Student {
  const whereClauses: string[] = ['s.id = ?'];
  const queryParams: any[] = [id];

  if (schoolIds.length > 0) {
    const placeholders = schoolIds.map(() => '?').join(',');
    whereClauses.push(`s.school_id IN (${placeholders})`);
    queryParams.push(...schoolIds);
  }

  const sql = `
    SELECT s.*, sc.name as school_name
    FROM students s
    LEFT JOIN schools sc ON s.school_id = sc.id
    WHERE ${whereClauses.join(' AND ')}
  `;

  const row = db.prepare(sql).get(...queryParams) as any;

  if (!row) {
    throw new Error('学生不存在或无权限访问');
  }

  return mapStudentRow(row);
}

export function create(data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Student {
  const existing = db.prepare(`
    SELECT id FROM students WHERE student_no = ? OR id_card = ?
  `).get(data.studentNo, data.idCard);

  if (existing) {
    throw new Error('学号或身份证号已存在');
  }

  const result = db.prepare(`
    INSERT INTO students (
      student_no, name, gender, grade, class, school_id, id_card, phone,
      face_data, is_poverty, is_funding_eligible, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.studentNo,
    data.name,
    data.gender,
    data.grade,
    data.className,
    data.schoolId,
    data.idCard,
    data.phone || null,
    data.faceData || null,
    data.isPoverty ? 1 : 0,
    data.isFundingEligible ? 1 : 0,
    data.status
  );

  return getById(result.lastInsertRowid as number, []);
}

export function update(
  id: number,
  data: Partial<Omit<Student, 'id' | 'createdAt' | 'updatedAt'>>,
  schoolIds: number[]
): Student {
  const whereClauses: string[] = ['id = ?'];
  const queryParams: any[] = [];

  if (schoolIds.length > 0) {
    const placeholders = schoolIds.map(() => '?').join(',');
    whereClauses.push(`school_id IN (${placeholders})`);
    queryParams.push(...schoolIds);
  }

  const checkSql = `SELECT id FROM students WHERE ${whereClauses.join(' AND ')}`;
  const existing = db.prepare(checkSql).get(id, ...queryParams);

  if (!existing) {
    throw new Error('学生不存在或无权限访问');
  }

  const updateFields: string[] = [];
  const updateParams: any[] = [];

  if (data.studentNo !== undefined) {
    updateFields.push('student_no = ?');
    updateParams.push(data.studentNo);
  }
  if (data.name !== undefined) {
    updateFields.push('name = ?');
    updateParams.push(data.name);
  }
  if (data.gender !== undefined) {
    updateFields.push('gender = ?');
    updateParams.push(data.gender);
  }
  if (data.grade !== undefined) {
    updateFields.push('grade = ?');
    updateParams.push(data.grade);
  }
  if (data.className !== undefined) {
    updateFields.push('class = ?');
    updateParams.push(data.className);
  }
  if (data.schoolId !== undefined) {
    updateFields.push('school_id = ?');
    updateParams.push(data.schoolId);
  }
  if (data.idCard !== undefined) {
    updateFields.push('id_card = ?');
    updateParams.push(data.idCard);
  }
  if (data.phone !== undefined) {
    updateFields.push('phone = ?');
    updateParams.push(data.phone || null);
  }
  if (data.faceData !== undefined) {
    updateFields.push('face_data = ?');
    updateParams.push(data.faceData || null);
  }
  if (data.isPoverty !== undefined) {
    updateFields.push('is_poverty = ?');
    updateParams.push(data.isPoverty ? 1 : 0);
  }
  if (data.isFundingEligible !== undefined) {
    updateFields.push('is_funding_eligible = ?');
    updateParams.push(data.isFundingEligible ? 1 : 0);
  }
  if (data.status !== undefined) {
    updateFields.push('status = ?');
    updateParams.push(data.status);
  }

  updateFields.push('updated_at = CURRENT_TIMESTAMP');

  const updateSql = `
    UPDATE students
    SET ${updateFields.join(', ')}
    WHERE ${whereClauses.join(' AND ')}
  `;

  db.prepare(updateSql).run(...updateParams, id, ...queryParams);

  return getById(id, schoolIds);
}

export function deleteStudent(id: number, schoolIds: number[]): void {
  const whereClauses: string[] = ['id = ?'];
  const queryParams: any[] = [id];

  if (schoolIds.length > 0) {
    const placeholders = schoolIds.map(() => '?').join(',');
    whereClauses.push(`school_id IN (${placeholders})`);
    queryParams.push(...schoolIds);
  }

  const result = db.prepare(`
    DELETE FROM students WHERE ${whereClauses.join(' AND ')}
  `).run(...queryParams);

  if (result.changes === 0) {
    throw new Error('学生不存在或无权限访问');
  }
}

export function uploadFace(id: number, faceData: string, schoolIds: number[]): void {
  const whereClauses: string[] = ['id = ?'];
  const queryParams: any[] = [];

  if (schoolIds.length > 0) {
    const placeholders = schoolIds.map(() => '?').join(',');
    whereClauses.push(`school_id IN (${placeholders})`);
    queryParams.push(...schoolIds);
  }

  const result = db.prepare(`
    UPDATE students
    SET face_data = ?, updated_at = CURRENT_TIMESTAMP
    WHERE ${whereClauses.join(' AND ')}
  `).run(faceData, id, ...queryParams);

  if (result.changes === 0) {
    throw new Error('学生不存在或无权限访问');
  }
}

export { deleteStudent as delete };
