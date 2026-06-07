import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../utils/database';

type UserStatusRow = {
  status: string;
};

export function getUsers(req: AuthRequest, res: Response) {
  const role = req.user!.role;
  const { role: filterRole, status, keyword, page, pageSize } = req.query;

  if (role !== 'admin') {
    return res.status(403).json({ message: '只有管理员可以获取用户列表' });
  }

  let countSql = 'SELECT COUNT(*) as total FROM users u WHERE 1=1';
  let sql = `
    SELECT u.id, u.username, u.role, u.phone, u.status, u.avatar,
           u.real_name AS "realName", u.id_card AS "idCard",
           u.created_at AS "createdAt", u.updated_at AS "updatedAt",
           wp.gender, wp.birth_date AS "birthDate", wp.work_years AS "workYears",
           wp.skill_level AS "skillLevel",
           wp.has_biometric_data AS "hasBiometricData",
           wp.biometric_deleted AS "biometricDeleted",
           ep.company_name AS "companyName",
           ep.unified_credit_code AS "unifiedCreditCode",
           u.status AS "enterpriseVerificationStatus"
    FROM users u
    LEFT JOIN worker_profiles wp ON u.id = wp.user_id
    LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
    WHERE 1=1
  `;
  const params: any[] = [];
  const countParams: any[] = [];

  if (filterRole) {
    sql += ' AND u.role = ?';
    countSql += ' AND u.role = ?';
    params.push(filterRole);
    countParams.push(filterRole);
  }

  if (status) {
    sql += ' AND u.status = ?';
    countSql += ' AND u.status = ?';
    params.push(status);
    countParams.push(status);
  }

  if (keyword) {
    sql += ' AND (u.username LIKE ? OR u.real_name LIKE ? OR u.phone LIKE ?)';
    countSql += ' AND (u.username LIKE ? OR u.real_name LIKE ? OR u.phone LIKE ?)';
    const keywordStr = `%${keyword}%`;
    params.push(keywordStr, keywordStr, keywordStr);
    countParams.push(keywordStr, keywordStr, keywordStr);
  }

  sql += ' ORDER BY u.created_at DESC';

  const p = parseInt(page as string) || 1;
  const ps = parseInt(pageSize as string) || 20;
  const offset = (p - 1) * ps;
  sql += ' LIMIT ? OFFSET ?';
  params.push(ps, offset);

  const users = db.prepare(sql).all(...params);
  const countResult = db.prepare(countSql).get(...countParams) as any;

  res.json({
    users,
    total: countResult.total,
    page: p,
    pageSize: ps
  });
}

export function updateUserStatus(req: AuthRequest, res: Response) {
  const adminRole = req.user!.role;
  const { id } = req.params;
  const { status, reason } = req.body;

  if (adminRole !== 'admin') {
    return res.status(403).json({ message: '只有管理员可以操作用户状态' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserStatusRow | undefined;
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }

  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: '无效的用户状态，必须是 active 或 inactive' });
  }

  db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user!.id,
    status === 'active' ? 'user_activated' : 'user_deactivated',
    'users',
    id,
    JSON.stringify({ status: user.status }),
    JSON.stringify({ status, reason: reason || '未填写原因' }),
    req.ip
  );

  res.json({ message: `用户状态已更新为 ${status}` });
}

export function verifyEnterprise(req: AuthRequest, res: Response) {
  const adminRole = req.user!.role;
  const { id } = req.params;
  const { status, rejectReason } = req.body;

  if (adminRole !== 'admin') {
    return res.status(403).json({ message: '只有管理员可以审核企业' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(id, 'enterprise');
  if (!user) {
    return res.status(404).json({ message: '企业用户不存在' });
  }

  if (!['active', 'rejected'].includes(status)) {
    return res.status(400).json({ message: '无效的审核状态，必须是 active 或 rejected' });
  }

  db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    req.user!.id,
    status === 'active' ? 'verify_enterprise_approved' : 'verify_enterprise_rejected',
    'users',
    id,
    JSON.stringify({ status, rejectReason }),
    req.ip
  );

  res.json({ message: `企业审核${status === 'active' ? '通过' : '拒绝'}` });
}

export function getStatistics(req: AuthRequest, res: Response) {
  const role = req.user!.role;

  if (role !== 'admin') {
    return res.status(403).json({ message: '只有管理员可以查看统计数据' });
  }

  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  const totalWorkers = (db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('worker') as any).count;
  const totalEnterprises = (db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('enterprise') as any).count;
  const totalAdmins = (db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin') as any).count;

  const totalProjects = (db.prepare('SELECT COUNT(*) as count FROM construction_projects').get() as any).count;
  const activeProjects = (db.prepare('SELECT COUNT(*) as count FROM construction_projects WHERE status IN (?, ?, ?)').get('approved', 'started', 'under_construction') as any).count;

  const totalContracts = (db.prepare('SELECT COUNT(*) as count FROM labor_contracts').get() as any).count;
  const signedContracts = (db.prepare('SELECT COUNT(*) as count FROM labor_contracts WHERE status = ?').get('signed') as any).count;

  const pendingEnterpriseVerifications = (db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ? AND status = ?').get('enterprise', 'pending') as any).count;
  const pendingCertifications = (db.prepare('SELECT COUNT(*) as count FROM trade_certifications WHERE verification_status = ?').get('pending') as any).count;

  const socialSecurityWarnings = (db.prepare(`
    SELECT COUNT(*) as count 
    FROM social_security_records 
    WHERE payment_status = 'unpaid' OR payment_status = 'overdue'
  `).get() as any).count;

  const overdueSocialSecurity = (db.prepare(`
    SELECT COUNT(*) as count 
    FROM social_security_records 
    WHERE payment_status = 'overdue'
  `).get() as any).count;

  const totalAttendanceToday = (db.prepare(`
    SELECT COUNT(*) as count 
    FROM attendance_records 
    WHERE DATE(check_in_time) = DATE('now')
  `).get() as any).count;

  const totalPayrolls = (db.prepare('SELECT COUNT(*) as count FROM payrolls').get() as any).count;
  const totalPayrollAmount = (db.prepare('SELECT COALESCE(SUM(net_salary), 0) as total FROM payrolls').get() as any).total;

  const workersWithBiometric = (db.prepare('SELECT COUNT(*) as count FROM worker_profiles WHERE has_biometric_data = 1 AND biometric_deleted = 0').get() as any).count;

  res.json({
    users: {
      total: totalUsers,
      workers: totalWorkers,
      enterprises: totalEnterprises,
      admins: totalAdmins
    },
    projects: {
      total: totalProjects,
      active: activeProjects
    },
    contracts: {
      total: totalContracts,
      signed: signedContracts
    },
    pendingVerifications: {
      enterprises: pendingEnterpriseVerifications,
      certifications: pendingCertifications,
      total: pendingEnterpriseVerifications + pendingCertifications
    },
    socialSecurity: {
      warnings: socialSecurityWarnings,
      overdue: overdueSocialSecurity
    },
    attendance: {
      today: totalAttendanceToday
    },
    payrolls: {
      total: totalPayrolls,
      totalAmount: totalPayrollAmount
    },
    biometrics: {
      enrolled: workersWithBiometric
    }
  });
}

export function getSocialSecurityWarnings(req: AuthRequest, res: Response) {
  const role = req.user!.role;
  const { status, page, pageSize } = req.query;

  if (role !== 'admin') {
    return res.status(403).json({ message: '只有管理员可以查看社保预警' });
  }

  let sql = `
    SELECT ssr.id, ssr.worker_id AS "workerId", ssr.enterprise_id AS "enterpriseId",
           ssr.project_id AS "projectId", ssr.insurance_type AS "insuranceType",
           ssr.insurance_month AS "insuranceMonth", ssr.base_amount AS "baseAmount",
           ssr.personal_amount AS "personalAmount", ssr.enterprise_amount AS "enterpriseAmount",
           ssr.payment_amount AS "paymentAmount", ssr.payment_status AS "paymentStatus",
           ssr.payment_due_date AS "paymentDueDate", ssr.paid_at AS "paidAt",
           ssr.disposal_status AS "disposalStatus", ssr.disposal_action AS "disposalAction",
           ssr.remedial_deadline AS "remedialDeadline", ssr.is_reported AS "isReported",
           ssr.reported_at AS "reportedAt", ssr.reviewed_by AS "reviewedBy",
           ssr.disposal_result AS "disposalResult", ssr.disposal_note AS "disposalNote",
           ssr.warning_sent AS "warningSent", ssr.created_at AS "createdAt",
           u.real_name AS "workerName", u.phone,
           ep.company_name AS "companyName", cp.project_name AS "projectName",
           u2.real_name AS "reviewedByName"
    FROM social_security_records ssr
    JOIN users u ON ssr.worker_id = u.id
    LEFT JOIN enterprise_profiles ep ON ssr.enterprise_id = ep.user_id
    LEFT JOIN construction_projects cp ON ssr.project_id = cp.id
    LEFT JOIN users u2 ON ssr.reviewed_by = u2.id
    WHERE ssr.payment_status IN ('unpaid', 'overdue')
  `;
  const params: any[] = [];

  if (status) {
    sql += ' AND ssr.payment_status = ?';
    params.push(status);
  }

  sql += ' ORDER BY ssr.insurance_month DESC, ssr.created_at DESC';

  const p = parseInt(page as string) || 1;
  const ps = parseInt(pageSize as string) || 20;
  const offset = (p - 1) * ps;
  sql += ' LIMIT ? OFFSET ?';
  params.push(ps, offset);

  const warnings = db.prepare(sql).all(...params);

  const processedWarnings = warnings.map((w: any) => {
    let overdueDays = 0;
    let isOverdue90 = false;
    
    if (w.paymentDueDate) {
      const dueDate = new Date(w.paymentDueDate);
      const today = new Date();
      overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      isOverdue90 = overdueDays > 90;
    }

    return {
      ...w,
      overdueDays,
      isOverdue90
    };
  });

  const countSql = `
    SELECT COUNT(*) as total 
    FROM social_security_records 
    WHERE payment_status IN ('unpaid', 'overdue')
  `;
  const countResult = db.prepare(countSql).get() as any;

  res.json({
    warnings: processedWarnings,
    total: countResult.total,
    page: p,
    pageSize: ps
  });
}

export function updateSocialSecurityDisposal(req: AuthRequest, res: Response) {
  const adminRole = req.user!.role;
  const adminId = req.user!.id;
  const { id } = req.params;
  const { disposalStatus, disposalAction, remedialDeadline, disposalNote } = req.body;

  if (adminRole !== 'admin') {
    return res.status(403).json({ message: '只有管理员可以更新社保处置信息' });
  }

  const record = db.prepare('SELECT * FROM social_security_records WHERE id = ?').get(id);
  if (!record) {
    return res.status(404).json({ message: '社保记录不存在' });
  }

  const validStatuses = ['pending', 'notified', 'deadline_set', 'reported', 'completed'];
  if (disposalStatus && !validStatuses.includes(disposalStatus)) {
    return res.status(400).json({ message: '无效的处置状态' });
  }

  const validActions = ['notify_enterprise', 'set_deadline', 'report_regulator', 'completed'];
  if (disposalAction && !validActions.includes(disposalAction)) {
    return res.status(400).json({ message: '无效的处置动作' });
  }

  const updateFields: string[] = [];
  const updateParams: any[] = [];

  if (disposalStatus) {
    updateFields.push('disposal_status = ?');
    updateParams.push(disposalStatus);
  }
  if (disposalAction) {
    updateFields.push('disposal_action = ?');
    updateParams.push(disposalAction);
  }
  if (remedialDeadline) {
    updateFields.push('remedial_deadline = ?');
    updateParams.push(remedialDeadline);
  }
  if (disposalNote) {
    updateFields.push('disposal_note = ?');
    updateParams.push(disposalNote);
  }

  updateFields.push('reviewed_by = ?');
  updateParams.push(adminId);
  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  updateParams.push(id);

  const isReported = disposalAction === 'report_regulator' ? 1 : undefined;
  if (isReported) {
    updateFields.push('is_reported = ?');
    updateFields.push('reported_at = CURRENT_TIMESTAMP');
    updateParams.splice(updateParams.length - 1, 0, isReported);
  }

  const disposalResult = disposalAction === 'completed' ? '已完成补缴' : undefined;
  if (disposalResult) {
    updateFields.push('disposal_result = ?');
    updateParams.splice(updateParams.length - 1, 0, disposalResult);
  }

  const sql = `
    UPDATE social_security_records 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `;

  db.prepare(sql).run(...updateParams);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    adminId,
    'update_social_security_disposal',
    'social_security_records',
    id,
    JSON.stringify({
      disposalStatus,
      disposalAction,
      remedialDeadline,
      disposalNote,
      disposalResult
    }),
    req.ip
  );

  res.json({ message: '社保处置信息已更新' });
}

function generateDeletionCertificateNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `DEL-${dateStr}-${random}`;
}

function generateDestructionHash(): string {
  return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function deleteBiometricData(req: AuthRequest, res: Response) {
  const adminRole = req.user!.role;
  const operatorId = req.user!.id;
  const { workerId, deletionReason, dataTypes, deletionMethod = 'physical' } = req.body;

  if (adminRole !== 'admin') {
    return res.status(403).json({ message: '只有管理员可以删除生物特征数据' });
  }

  if (!workerId || !deletionReason || !dataTypes) {
    return res.status(400).json({ message: '请提供工人ID、删除原因和数据类型' });
  }

  const validMethods = ['physical', 'logical', 'crypto_destroy'];
  if (!validMethods.includes(deletionMethod)) {
    return res.status(400).json({ message: '无效的删除方式' });
  }

  const worker = db.prepare(`
    SELECT wp.*, u.real_name, u.username
    FROM worker_profiles wp
    JOIN users u ON wp.user_id = u.id
    WHERE wp.user_id = ?
  `).get(workerId) as any;

  if (!worker) {
    return res.status(404).json({ message: '工人不存在' });
  }

  if (worker.has_biometric_data === 0 || worker.biometric_deleted === 1) {
    return res.status(400).json({ message: '该工人没有可删除的生物特征数据' });
  }

  const certificateNo = generateDeletionCertificateNo();
  const destructionHash = generateDestructionHash();
  const now = new Date().toISOString();
  const reviewOpinion = '符合《建筑业用工实名制管理办法》第十一条、第二十八条规定，数据已彻底销毁，可追溯审计';

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE worker_profiles 
      SET has_biometric_data = 0, biometric_deleted = 1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(workerId);

    db.prepare(`
      INSERT INTO biometric_deletion_logs 
      (worker_id, deletion_reason, data_types, operator_id, deletion_certificate_no,
       deletion_method, deletion_result, review_opinion, execution_time, destruction_hash, audit_trail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      workerId,
      deletionReason,
      JSON.stringify(Array.isArray(dataTypes) ? dataTypes : [dataTypes]),
      operatorId,
      certificateNo,
      deletionMethod,
      'success',
      reviewOpinion,
      now,
      destructionHash,
      JSON.stringify({
        operator: operatorId,
        workerName: worker.real_name,
        timestamp: now,
        ipAddress: req.ip,
        certificateNo,
        destructionHash
      })
    );
  });

  transaction();

  res.json({ message: '生物特征数据已成功删除' });
}

export function getBiometricDeletionLogs(req: AuthRequest, res: Response) {
  const role = req.user!.role;
  const { workerId, page, pageSize } = req.query;

  if (role !== 'admin') {
    return res.status(403).json({ message: '只有管理员可以查看生物特征删除日志' });
  }

  let sql = `
    SELECT bdl.id,
           bdl.worker_id AS "workerId",
           bdl.deletion_reason AS "deletionReason",
           bdl.data_types AS "dataTypes",
           bdl.operator_id AS "operatorId",
           bdl.deletion_time AS "deletionTime",
           bdl.deletion_certificate_no AS "deletionCertificateNo",
           bdl.deletion_method AS "deletionMethod",
           bdl.deletion_result AS "deletionResult",
           bdl.review_opinion AS "reviewOpinion",
           bdl.execution_time AS "executionTime",
           bdl.destruction_hash AS "destructionHash",
           bdl.audit_trail AS "auditTrail",
           u1.real_name AS "workerName", u1.username AS "workerUsername",
           u2.real_name AS "operatorName", u2.username AS "operatorUsername"
    FROM biometric_deletion_logs bdl
    JOIN users u1 ON bdl.worker_id = u1.id
    JOIN users u2 ON bdl.operator_id = u2.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (workerId) {
    sql += ' AND bdl.worker_id = ?';
    params.push(workerId);
  }

  sql += ' ORDER BY bdl.deletion_time DESC';

  const p = parseInt(page as string) || 1;
  const ps = parseInt(pageSize as string) || 20;
  const offset = (p - 1) * ps;
  sql += ' LIMIT ? OFFSET ?';
  params.push(ps, offset);

  const logs = db.prepare(sql).all(...params);

  let countSql = 'SELECT COUNT(*) as total FROM biometric_deletion_logs WHERE 1=1';
  const countParams: any[] = [];
  if (workerId) {
    countSql += ' AND worker_id = ?';
    countParams.push(workerId);
  }
  const countResult = db.prepare(countSql).get(...countParams) as any;

  res.json({
    logs,
    total: countResult.total,
    page: p,
    pageSize: ps
  });
}

export function getAuditLogs(req: AuthRequest, res: Response) {
  const role = req.user!.role;
  const { userId, action, tableName, startDate, endDate, page, pageSize } = req.query;

  if (role !== 'admin') {
    return res.status(403).json({ message: '只有管理员可以查看审计日志' });
  }

  let countSql = 'SELECT COUNT(*) as total FROM audit_logs al WHERE 1=1';
  const countParams: any[] = [];
  let sql = `
    SELECT al.id, al.user_id AS "userId", al.action, al.table_name AS "tableName",
           al.record_id AS "recordId", al.old_values AS "oldValues",
           al.new_values AS "newValues", al.ip_address AS "ipAddress",
           al.created_at AS "createdAt", u.username, u.real_name AS "realName"
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (userId) {
    sql += ' AND al.user_id = ?';
    countSql += ' AND al.user_id = ?';
    params.push(userId);
    countParams.push(userId);
  }

  if (action) {
    sql += ' AND al.action LIKE ?';
    countSql += ' AND al.action LIKE ?';
    const actionValue = `%${action}%`;
    params.push(actionValue);
    countParams.push(actionValue);
  }

  if (tableName) {
    sql += ' AND al.table_name = ?';
    countSql += ' AND al.table_name = ?';
    params.push(tableName);
    countParams.push(tableName);
  }

  if (startDate) {
    sql += ' AND DATE(al.created_at) >= ?';
    countSql += ' AND DATE(al.created_at) >= ?';
    params.push(startDate);
    countParams.push(startDate);
  }

  if (endDate) {
    sql += ' AND DATE(al.created_at) <= ?';
    countSql += ' AND DATE(al.created_at) <= ?';
    params.push(endDate);
    countParams.push(endDate);
  }

  sql += ' ORDER BY al.created_at DESC';

  const p = parseInt(page as string) || 1;
  const ps = parseInt(pageSize as string) || 20;
  const offset = (p - 1) * ps;
  sql += ' LIMIT ? OFFSET ?';
  params.push(ps, offset);

  const logs = db.prepare(sql).all(...params);

  const countResult = db.prepare(countSql).get(...countParams) as any;

  res.json({
    logs,
    total: countResult.total,
    page: p,
    pageSize: ps
  });
}
