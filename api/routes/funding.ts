import { Router, Response } from 'express';
import QRCode from 'qrcode';
import db from '../database/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { operationLog } from '../middleware/logger.js';
import { getAccessibleSchoolIds } from '../middleware/permission.js';
import { success, error } from '../utils/response.js';
import type { FundingRecord, FundingQueryParams, PageResponse, FundingStatus } from '../../shared/types.js';

const router = Router();

router.get('/', authMiddleware, operationLog('funding', '获取资助名单'), (req: AuthRequest, res: Response): void => {
  const accessibleSchoolIds = getAccessibleSchoolIds(req);
  if (accessibleSchoolIds && accessibleSchoolIds.length === 0) {
    res.json(success<PageResponse<FundingRecord>>({ list: [], total: 0, page: 1, pageSize: 10 }));
    return;
  }

  const { page = 1, pageSize = 10, schoolId, studentId, status, batchNo } = req.query as FundingQueryParams;
  const offset = (Number(page) - 1) * Number(pageSize);

  let whereClause = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (accessibleSchoolIds) {
    whereClause += ` AND f.school_id IN (${accessibleSchoolIds.map(() => '?').join(',')})`;
    params.push(...accessibleSchoolIds);
  }

  if (schoolId) {
    if (!accessibleSchoolIds || accessibleSchoolIds.includes(Number(schoolId))) {
      whereClause += ' AND f.school_id = ?';
      params.push(Number(schoolId));
    }
  }

  if (studentId) {
    whereClause += ' AND f.student_id = ?';
    params.push(Number(studentId));
  }

  if (status) {
    whereClause += ' AND f.status = ?';
    params.push(status);
  }

  if (batchNo) {
    whereClause += ' AND f.batch_no = ?';
    params.push(batchNo);
  }

  const countSql = `
    SELECT COUNT(*) as total
    FROM funding_records f
    ${whereClause}
  `;

  const { total } = db.prepare(countSql).get(...params) as { total: number };

  const listSql = `
    SELECT f.*, sc.name as school_name, s.class as class_name
    FROM funding_records f
    LEFT JOIN schools sc ON f.school_id = sc.id
    LEFT JOIN students s ON f.student_id = s.id
    ${whereClause}
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const rows = db.prepare(listSql).all(...params, Number(pageSize), offset) as Array<{
    id: number;
    student_id: number;
    student_name: string;
    school_id: number;
    school_name: string;
    funding_type: string;
    amount: number;
    batch_no: string;
    status: string;
    apply_time: string;
    approve_time?: string;
    distribute_time?: string;
    receive_time?: string;
    voucher_code?: string;
    class_name: string;
  }>;

  const list: FundingRecord[] = rows.map(row => ({
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    schoolId: row.school_id,
    schoolName: row.school_name,
    fundingType: row.funding_type,
    amount: row.amount,
    batchNo: row.batch_no,
    status: row.status as FundingStatus,
    applyTime: row.apply_time,
    approveTime: row.approve_time,
    distributeTime: row.distribute_time,
    receiveTime: row.receive_time,
    voucherCode: row.voucher_code,
    className: row.class_name,
  }));

  res.json(success<PageResponse<FundingRecord>>({
    list,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  }));
});

router.post('/compare', authMiddleware, operationLog('funding', '名单比对'), (req: AuthRequest, res: Response): void => {
  const accessibleSchoolIds = getAccessibleSchoolIds(req);
  if (accessibleSchoolIds && accessibleSchoolIds.length === 0) {
    res.json(success({ matches: [], mismatches: [], total: 0, matchCount: 0, mismatchCount: 0 }));
    return;
  }

  const { schoolId, studentIds } = req.body as { schoolId?: number; studentIds?: number[] };

  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    res.status(400).json(error('学生ID列表不能为空'));
    return;
  }

  let schoolCondition = '';
  const params: (string | number)[] = [...studentIds];

  if (schoolId) {
    if (!accessibleSchoolIds || accessibleSchoolIds.includes(schoolId)) {
      schoolCondition = ' AND school_id = ?';
      params.push(schoolId);
    } else {
      res.status(403).json(error('无权限操作该学校的数据'));
      return;
    }
  } else if (accessibleSchoolIds) {
    schoolCondition = ` AND school_id IN (${accessibleSchoolIds.map(() => '?').join(',')})`;
    params.push(...accessibleSchoolIds);
  }

  const placeholders = studentIds.map(() => '?').join(',');
  const sql = `
    SELECT id, student_id, student_name, is_funding_eligible, is_poverty, status
    FROM students
    WHERE id IN (${placeholders})${schoolCondition}
  `;

  const students = db.prepare(sql).all(...params) as Array<{
    id: number;
    student_id: number;
    student_name: string;
    is_funding_eligible: number;
    is_poverty: number;
    status: string;
  }>;

  const matches: Array<{ id: number; name: string; isEligible: boolean; isPoverty: boolean }> = [];
  const mismatches: Array<{ id: number; name: string; reason: string }> = [];

  students.forEach(student => {
    const isEligible = student.is_funding_eligible === 1;
    const isPoverty = student.is_poverty === 1;
    
    if (isEligible && student.status === 'active') {
      matches.push({
        id: student.id,
        name: student.name,
        isEligible,
        isPoverty,
      });
    } else {
      let reason = '';
      if (!isEligible) reason = '不符合资助条件';
      else if (student.status !== 'active') reason = '学生状态异常';
      mismatches.push({
        id: student.id,
        name: student.name,
        reason,
      });
    }
  });

  if (mismatches.length > 0) {
    const alertSql = `
      INSERT INTO alert_records (school_id, type, level, title, description, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const targetSchoolId = schoolId || (accessibleSchoolIds ? accessibleSchoolIds[0] : 1);
    db.prepare(alertSql).run(
      targetSchoolId,
      'funding_exception',
      'low',
      '资助名单异常',
      `学校资助名单与学籍库存在${mismatches.length}条差异，请复核。`,
      'pending'
    );
  }

  res.json(success({
    matches,
    mismatches,
    total: students.length,
    matchCount: matches.length,
    mismatchCount: mismatches.length,
  }, '比对完成'));
});

router.get('/distribution', authMiddleware, operationLog('funding', '获取发放进度'), (req: AuthRequest, res: Response): void => {
  const accessibleSchoolIds = getAccessibleSchoolIds(req);
  if (accessibleSchoolIds && accessibleSchoolIds.length === 0) {
    res.json(success<Array<{ schoolId: number; schoolName: string; total: number; pending: number; approved: number; distributed: number; received: number }>>([]));
    return;
  }

  const { schoolId, batchNo } = req.query as { schoolId?: string; batchNo?: string };

  let whereClause = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (accessibleSchoolIds) {
    whereClause += ` AND school_id IN (${accessibleSchoolIds.map(() => '?').join(',')})`;
    params.push(...accessibleSchoolIds);
  }

  if (schoolId) {
    if (!accessibleSchoolIds || accessibleSchoolIds.includes(Number(schoolId))) {
      whereClause += ' AND school_id = ?';
      params.push(Number(schoolId));
    }
  }

  if (batchNo) {
    whereClause += ' AND batch_no = ?';
    params.push(batchNo);
  }

  const sql = `
    SELECT 
      school_id,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'distributed' THEN 1 ELSE 0 END) as distributed,
      SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received
    FROM funding_records
    ${whereClause}
    GROUP BY school_id
  `;

  const rows = db.prepare(sql).all(...params) as Array<{
    school_id: number;
    total: number;
    pending: number;
    approved: number;
    distributed: number;
    received: number;
  }>;

  const schoolIds = rows.map(r => r.school_id);
  const schoolNames: Record<number, string> = {};
  
  if (schoolIds.length > 0) {
    const schoolRows = db.prepare(`
      SELECT id, name FROM schools WHERE id IN (${schoolIds.map(() => '?').join(',')})
    `).all(...schoolIds) as Array<{ id: number; name: string }>;
    
    schoolRows.forEach(s => {
      schoolNames[s.id] = s.name;
    });
  }

  const distribution = rows.map(row => ({
    schoolId: row.school_id,
    schoolName: schoolNames[row.school_id],
    total: row.total,
    pending: row.pending,
    approved: row.approved,
    distributed: row.distributed,
    received: row.received,
  }));

  res.json(success(distribution));
});

router.put('/distribution/:id', authMiddleware, operationLog('funding', '更新发放状态'), (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { status } = req.body as { status: FundingStatus };
  const accessibleSchoolIds = getAccessibleSchoolIds(req);

  if (!status) {
    res.status(400).json(error('状态不能为空'));
    return;
  }

  const validStatuses: FundingStatus[] = ['pending', 'approved', 'distributed', 'received'];
  if (!validStatuses.includes(status)) {
    res.status(400).json(error('无效的状态值'));
    return;
  }

  const existing = db.prepare('SELECT school_id, status FROM funding_records WHERE id = ?').get(Number(id)) as { school_id: number; status: string } | undefined;
  if (!existing) {
    res.status(404).json(error('资助记录不存在'));
    return;
  }

  if (accessibleSchoolIds && !accessibleSchoolIds.includes(existing.school_id)) {
    res.status(403).json(error('无权限操作该学校的数据'));
    return;
  }

  const now = new Date().toISOString();
  const fields: string[] = ['status = ?', 'updated_at = ?'];
  const params: (string | number)[] = [status, now];

  if (status === 'approved') fields.push('approve_time = ?'), params.push(now);
  if (status === 'distributed') fields.push('distribute_time = ?'), params.push(now);
  if (status === 'received') fields.push('receive_time = ?'), params.push(now);

  params.push(Number(id));

  db.prepare(`UPDATE funding_records SET ${fields.join(', ')} WHERE id = ?`).run(...params);

  res.json(success(null, '状态更新成功'));
});

router.get('/voucher/:id', authMiddleware, operationLog('funding', '生成电子凭证'), async (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const accessibleSchoolIds = getAccessibleSchoolIds(req);

  const record = db.prepare(`
    SELECT f.*, sc.name as school_name, s.class as class_name
    FROM funding_records f
    LEFT JOIN schools sc ON f.school_id = sc.id
    LEFT JOIN students s ON f.student_id = s.id
    WHERE f.id = ?
  `).get(Number(id)) as {
    id: number;
    student_id: number;
    student_name: string;
    school_id: number;
    school_name: string;
    funding_type: string;
    amount: number;
    batch_no: string;
    status: string;
    apply_time: string;
    approve_time?: string;
    distribute_time?: string;
    receive_time?: string;
    voucher_code?: string;
    class_name: string;
  } | undefined;

  if (!record) {
    res.status(404).json(error('资助记录不存在'));
    return;
  }

  if (accessibleSchoolIds && !accessibleSchoolIds.includes(record.school_id)) {
    res.status(403).json(error('无权限查看该数据'));
    return;
  }

  if (record.status !== 'distributed' && record.status !== 'received') {
    res.status(400).json(error('该资助尚未发放，无法生成凭证'));
    return;
  }

  let voucherCode = record.voucher_code;
  if (!voucherCode) {
    voucherCode = `FUND-${Date.now()}-${record.id}`;
    db.prepare('UPDATE funding_records SET voucher_code = ? WHERE id = ?').run(voucherCode, Number(id));
  }

  const voucherData = {
    voucherCode,
    studentName: record.student_name,
    schoolName: record.school_name,
    className: record.class_name,
    fundingType: record.funding_type,
    amount: record.amount,
    batchNo: record.batch_no,
    distributeTime: record.distribute_time || record.approve_time,
    status: record.status,
  };

  const qrCodeData = JSON.stringify(voucherData);
  const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

  res.json(success({
    ...voucherData,
    qrCode: qrCodeUrl,
  }, '电子凭证生成成功'));
});

export default router;
