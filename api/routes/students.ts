import { Router, Response } from 'express';
import db from '../database/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { operationLog } from '../middleware/logger.js';
import { requireRole, getAccessibleSchoolIds } from '../middleware/permission.js';
import { success, error } from '../utils/response.js';
import type { Student, StudentQueryParams, PageResponse } from '../../shared/types.js';

const router = Router();

router.get('/', authMiddleware, operationLog('students', '获取学生列表'), (req: AuthRequest, res: Response): void => {
  const accessibleSchoolIds = getAccessibleSchoolIds(req);
  if (accessibleSchoolIds && accessibleSchoolIds.length === 0) {
    res.json(success<PageResponse<Student>>({ list: [], total: 0, page: 1, pageSize: 10 }));
    return;
  }

  const { page = 1, pageSize = 10, keyword, schoolId, grade, className, isPoverty, status } = req.query as StudentQueryParams;
  const offset = (Number(page) - 1) * Number(pageSize);

  let whereClause = 'WHERE 1=1';
  const params: (string | number | boolean)[] = [];

  if (accessibleSchoolIds) {
    whereClause += ` AND s.school_id IN (${accessibleSchoolIds.map(() => '?').join(',')})`;
    params.push(...accessibleSchoolIds);
  }

  if (schoolId) {
    if (!accessibleSchoolIds || accessibleSchoolIds.includes(Number(schoolId))) {
      whereClause += ' AND s.school_id = ?';
      params.push(Number(schoolId));
    }
  }

  if (keyword) {
    whereClause += ' AND (s.name LIKE ? OR s.student_no LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (grade) {
    whereClause += ' AND s.grade = ?';
    params.push(grade);
  }

  if (className) {
    whereClause += ' AND s.class = ?';
    params.push(className);
  }

  if (isPoverty !== undefined) {
    whereClause += ' AND s.is_poverty = ?';
    params.push(isPoverty);
  }

  if (status) {
    whereClause += ' AND s.status = ?';
    params.push(status);
  }

  const countSql = `
    SELECT COUNT(*) as total
    FROM students s
    ${whereClause}
  `;

  const { total } = db.prepare(countSql).get(...params) as { total: number };

  const listSql = `
    SELECT s.*, sc.name as school_name
    FROM students s
    LEFT JOIN schools sc ON s.school_id = sc.id
    ${whereClause}
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const rows = db.prepare(listSql).all(...params, Number(pageSize), offset) as Array<{
    id: number;
    student_no: string;
    name: string;
    gender: string;
    grade: string;
    class: string;
    school_id: number;
    id_card: string;
    phone?: string;
    face_data?: string;
    is_poverty: number;
    is_funding_eligible: number;
    status: string;
    created_at: string;
    updated_at: string;
    school_name: string;
  }>;

  const list: Student[] = rows.map(row => ({
    id: row.id,
    studentNo: row.student_no,
    name: row.name,
    gender: row.gender as 'male' | 'female',
    grade: row.grade,
    className: row.class,
    schoolId: row.school_id,
    idCard: row.id_card,
    phone: row.phone,
    faceData: row.face_data,
    isPoverty: row.is_poverty === 1,
    isFundingEligible: row.is_funding_eligible === 1,
    status: row.status as 'active' | 'graduated' | 'suspended',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    schoolName: row.school_name,
  }));

  res.json(success<PageResponse<Student>>({
    list,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  }));
});

router.post('/', authMiddleware, requireRole('school_admin'), operationLog('students', '创建学生'), (req: AuthRequest, res: Response): void => {
  const accessibleSchoolIds = getAccessibleSchoolIds(req);
  const { studentNo, name, gender, grade, className, schoolId, idCard, phone, isPoverty, isFundingEligible } = req.body as Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'status'>;

  if (!studentNo || !name || !gender || !grade || !className || !schoolId || !idCard) {
    res.status(400).json(error('必填字段不能为空'));
    return;
  }

  if (accessibleSchoolIds && !accessibleSchoolIds.includes(schoolId)) {
    res.status(403).json(error('无权限操作该学校的数据'));
    return;
  }

  const exists = db.prepare('SELECT id FROM students WHERE student_no = ? OR id_card = ?').get(studentNo, idCard);
  if (exists) {
    res.status(400).json(error('学号或身份证号已存在'));
    return;
  }

  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO students (student_no, name, gender, grade, class, school_id, id_card, phone, is_poverty, is_funding_eligible, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    studentNo,
    name,
    gender,
    grade,
    className,
    schoolId,
    idCard,
    phone || null,
    isPoverty ? 1 : 0,
    isFundingEligible !== false ? 1 : 0,
    'active',
    now,
    now
  );

  const student = db.prepare(`
    SELECT s.*, sc.name as school_name
    FROM students s
    LEFT JOIN schools sc ON s.school_id = sc.id
    WHERE s.id = ?
  `).get(result.lastInsertRowid) as {
    id: number;
    student_no: string;
    name: string;
    gender: string;
    grade: string;
    class: string;
    school_id: number;
    id_card: string;
    phone?: string;
    face_data?: string;
    is_poverty: number;
    is_funding_eligible: number;
    status: string;
    created_at: string;
    updated_at: string;
    school_name: string;
  };

  const studentData: Student = {
    id: student.id,
    studentNo: student.student_no,
    name: student.name,
    gender: student.gender as 'male' | 'female',
    grade: student.grade,
    className: student.class,
    schoolId: student.school_id,
    idCard: student.id_card,
    phone: student.phone,
    faceData: student.face_data,
    isPoverty: student.is_poverty === 1,
    isFundingEligible: student.is_funding_eligible === 1,
    status: student.status as 'active' | 'graduated' | 'suspended',
    createdAt: student.created_at,
    updatedAt: student.updated_at,
    schoolName: student.school_name,
  };

  res.json(success<Student>(studentData, '创建成功'));
});

router.get('/:id', authMiddleware, operationLog('students', '获取学生详情'), (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const accessibleSchoolIds = getAccessibleSchoolIds(req);

  const row = db.prepare(`
    SELECT s.*, sc.name as school_name
    FROM students s
    LEFT JOIN schools sc ON s.school_id = sc.id
    WHERE s.id = ?
  `).get(Number(id)) as {
    id: number;
    student_no: string;
    name: string;
    gender: string;
    grade: string;
    class: string;
    school_id: number;
    id_card: string;
    phone?: string;
    face_data?: string;
    is_poverty: number;
    is_funding_eligible: number;
    status: string;
    created_at: string;
    updated_at: string;
    school_name: string;
  } | undefined;

  if (!row) {
    res.status(404).json(error('学生不存在'));
    return;
  }

  if (accessibleSchoolIds && !accessibleSchoolIds.includes(row.school_id)) {
    res.status(403).json(error('无权限查看该学生数据'));
    return;
  }

  const student: Student = {
    id: row.id,
    studentNo: row.student_no,
    name: row.name,
    gender: row.gender as 'male' | 'female',
    grade: row.grade,
    className: row.class,
    schoolId: row.school_id,
    idCard: row.id_card,
    phone: row.phone,
    faceData: row.face_data,
    isPoverty: row.is_poverty === 1,
    isFundingEligible: row.is_funding_eligible === 1,
    status: row.status as 'active' | 'graduated' | 'suspended',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    schoolName: row.school_name,
  };

  res.json(success<Student>(student));
});

router.put('/:id', authMiddleware, requireRole('school_admin'), operationLog('students', '更新学生'), (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const accessibleSchoolIds = getAccessibleSchoolIds(req);

  const existing = db.prepare('SELECT school_id FROM students WHERE id = ?').get(Number(id)) as { school_id: number } | undefined;
  if (!existing) {
    res.status(404).json(error('学生不存在'));
    return;
  }

  if (accessibleSchoolIds && !accessibleSchoolIds.includes(existing.school_id)) {
    res.status(403).json(error('无权限操作该学校的数据'));
    return;
  }

  const { studentNo, name, gender, grade, className, schoolId, idCard, phone, isPoverty, isFundingEligible, status } = req.body as Partial<Student>;

  const now = new Date().toISOString();
  const fields: string[] = [];
  const params: (string | number | boolean | null)[] = [];

  if (studentNo) { fields.push('student_no = ?'); params.push(studentNo); }
  if (name) { fields.push('name = ?'); params.push(name); }
  if (gender) { fields.push('gender = ?'); params.push(gender); }
  if (grade) { fields.push('grade = ?'); params.push(grade); }
  if (className) { fields.push('class = ?'); params.push(className); }
  if (schoolId) { fields.push('school_id = ?'); params.push(schoolId); }
  if (idCard) { fields.push('id_card = ?'); params.push(idCard); }
  if (phone !== undefined) { fields.push('phone = ?'); params.push(phone || null); }
  if (isPoverty !== undefined) { fields.push('is_poverty = ?'); params.push(isPoverty ? 1 : 0); }
  if (isFundingEligible !== undefined) { fields.push('is_funding_eligible = ?'); params.push(isFundingEligible ? 1 : 0); }
  if (status) { fields.push('status = ?'); params.push(status); }

  fields.push('updated_at = ?');
  params.push(now);
  params.push(Number(id));

  db.prepare(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare(`
    SELECT s.*, sc.name as school_name
    FROM students s
    LEFT JOIN schools sc ON s.school_id = sc.id
    WHERE s.id = ?
  `).get(Number(id)) as {
    id: number;
    student_no: string;
    name: string;
    gender: string;
    grade: string;
    class: string;
    school_id: number;
    id_card: string;
    phone?: string;
    face_data?: string;
    is_poverty: number;
    is_funding_eligible: number;
    status: string;
    created_at: string;
    updated_at: string;
    school_name: string;
  };

  const student: Student = {
    id: updated.id,
    studentNo: updated.student_no,
    name: updated.name,
    gender: updated.gender as 'male' | 'female',
    grade: updated.grade,
    className: updated.class,
    schoolId: updated.school_id,
    idCard: updated.id_card,
    phone: updated.phone,
    faceData: updated.face_data,
    isPoverty: updated.is_poverty === 1,
    isFundingEligible: updated.is_funding_eligible === 1,
    status: updated.status as 'active' | 'graduated' | 'suspended',
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
    schoolName: updated.school_name,
  };

  res.json(success<Student>(student, '更新成功'));
});

router.delete('/:id', authMiddleware, requireRole('school_admin'), operationLog('students', '删除学生'), (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const accessibleSchoolIds = getAccessibleSchoolIds(req);

  const existing = db.prepare('SELECT school_id FROM students WHERE id = ?').get(Number(id)) as { school_id: number } | undefined;
  if (!existing) {
    res.status(404).json(error('学生不存在'));
    return;
  }

  if (accessibleSchoolIds && !accessibleSchoolIds.includes(existing.school_id)) {
    res.status(403).json(error('无权限操作该学校的数据'));
    return;
  }

  db.prepare('DELETE FROM students WHERE id = ?').run(Number(id));
  res.json(success(null, '删除成功'));
});

router.post('/:id/face', authMiddleware, requireRole('school_admin'), operationLog('students', '上传人脸照片'), (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { faceData } = req.body as { faceData: string };
  const accessibleSchoolIds = getAccessibleSchoolIds(req);

  if (!faceData) {
    res.status(400).json(error('人脸数据不能为空'));
    return;
  }

  const existing = db.prepare('SELECT school_id FROM students WHERE id = ?').get(Number(id)) as { school_id: number } | undefined;
  if (!existing) {
    res.status(404).json(error('学生不存在'));
    return;
  }

  if (accessibleSchoolIds && !accessibleSchoolIds.includes(existing.school_id)) {
    res.status(403).json(error('无权限操作该学校的数据'));
    return;
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE students SET face_data = ?, updated_at = ? WHERE id = ?').run(faceData, now, Number(id));

  res.json(success(null, '人脸照片上传成功'));
});

export default router;
