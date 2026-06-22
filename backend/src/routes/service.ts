import { Router, Request, Response } from 'express';
import db from '../utils/db';
import { success, fail } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

const router = Router();

function generateNo(prefix: string): string {
  const now = new Date();
  const ts = now.getFullYear().toString()
    + (now.getMonth() + 1).toString().padStart(2, '0')
    + now.getDate().toString().padStart(2, '0')
    + now.getHours().toString().padStart(2, '0')
    + now.getMinutes().toString().padStart(2, '0')
    + now.getSeconds().toString().padStart(2, '0')
    + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return prefix + ts;
}

router.post('/license/apply', authMiddleware(['worker']), (req: Request, res: Response) => {
  const { business_name, business_scope, business_address, id_card_front_url, id_card_back_url } = req.body;
  const userId = req.user!.userId;

  const worker = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(userId) as any;
  if (!worker) {
    return fail(res, '工人信息不存在');
  }

  const user = db.prepare('SELECT real_name, id_card_number FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    return fail(res, '用户信息不存在');
  }

  if (!business_name || !business_scope) {
    return fail(res, '请填写完整的经营信息');
  }

  const existingPending = db.prepare(`
    SELECT * FROM individual_licenses WHERE worker_id = ? AND status IN ('pending', 'submitted', 'reviewing')
  `).get(worker.id);
  if (existingPending) {
    return fail(res, '您已有正在审核中的执照申请，请等待审核完成');
  }

  const applicationNo = generateNo('IL');
  const result = db.prepare(`
    INSERT INTO individual_licenses (worker_id, application_no, business_name, business_scope, business_address, id_card_front_url, id_card_back_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')
  `).run(
    worker.id,
    applicationNo,
    business_name,
    business_scope,
    business_address || '',
    id_card_front_url || '',
    id_card_back_url || ''
  );

  const application = db.prepare(`
    SELECT il.*, u.real_name, u.id_card_number, u.phone
    FROM individual_licenses il
    LEFT JOIN workers w ON il.worker_id = w.id
    LEFT JOIN users u ON w.user_id = u.id
    WHERE il.id = ?
  `).get(result.lastInsertRowid);

  return success(res, application, '营业执照代办申请已提交');
});

router.get('/license/my-applications', authMiddleware(['worker']), (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;
  const userId = req.user!.userId;

  const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as any;
  if (!worker) {
    return fail(res, '工人信息不存在');
  }

  const countRow = db.prepare(`SELECT COUNT(*) as count FROM individual_licenses WHERE worker_id = ?`).get(worker.id) as { count: number };

  const applications = db.prepare(`
    SELECT * FROM individual_licenses
    WHERE worker_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(worker.id, pageSize, offset);

  return success(res, applications, '查询成功', { total: countRow.count, page, pageSize });
});

router.put('/license/:id/approve', authMiddleware(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { approved, reject_reason } = req.body;

  const application = db.prepare('SELECT * FROM individual_licenses WHERE id = ?').get(id) as any;
  if (!application) {
    return fail(res, '申请记录不存在');
  }

  if (application.status === 'approved' || application.status === 'rejected') {
    return fail(res, '该申请已处理，不可重复操作');
  }

  if (approved) {
    const licenseNo = generateNo('LIC');
    const marketNo = generateNo('MSA');
    db.prepare(`
      UPDATE individual_licenses
      SET status = 'approved', market_supervision_no = ?, license_no = ?, license_url = ?, approved_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(
      marketNo,
      licenseNo,
      `/licenses/${licenseNo}.pdf`,
      id
    );
  } else {
    if (!reject_reason) {
      return fail(res, '请填写驳回原因');
    }
    db.prepare(`
      UPDATE individual_licenses
      SET status = 'rejected', reject_reason = ?, approved_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(reject_reason, id);
  }

  const updated = db.prepare('SELECT * FROM individual_licenses WHERE id = ?').get(id);
  return success(res, updated, approved ? '执照申请审核通过' : '执照申请已驳回');
});

router.post('/invoice/apply', authMiddleware(['worker', 'enterprise']), (req: Request, res: Response) => {
  const { invoice_type, amount, buyer_name, buyer_tax_id, service_content } = req.body;
  const userId = req.user!.userId;
  const role = req.user!.role;

  if (!amount || !buyer_name || !service_content) {
    return fail(res, '请填写完整的发票信息');
  }

  if (amount <= 0) {
    return fail(res, '发票金额必须大于0');
  }

  let applicantId: number | null = null;
  let sellerName = '';
  let sellerTaxId = '';

  if (role === 'worker') {
    const worker = db.prepare(`
      SELECT w.id, u.real_name, u.id_card_number
      FROM workers w LEFT JOIN users u ON w.user_id = u.id
      WHERE w.user_id = ?
    `).get(userId) as any;
    if (!worker) {
      return fail(res, '工人信息不存在');
    }
    applicantId = worker.id;
    sellerName = worker.real_name || '';
    sellerTaxId = worker.id_card_number || '';
  } else {
    const enterprise = db.prepare(`
      SELECT e.id, e.company_name, e.unified_social_code
      FROM enterprises e WHERE e.user_id = ?
    `).get(userId) as any;
    if (!enterprise) {
      return fail(res, '企业信息不存在');
    }
    applicantId = enterprise.id;
    sellerName = enterprise.company_name;
    sellerTaxId = enterprise.unified_social_code || '';
  }

  const taxRate = 0.03;
  const taxAmount = Number((amount * taxRate).toFixed(2));
  const totalAmount = Number((amount + taxAmount).toFixed(2));
  const invoiceNo = generateNo('INV');

  const result = db.prepare(`
    INSERT INTO invoices (applicant_type, applicant_id, invoice_no, invoice_type, amount, tax_rate, tax_amount, total_amount, buyer_name, buyer_tax_id, seller_name, seller_tax_id, service_content, ukey_serial, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'issuing')
  `).run(
    role,
    applicantId,
    invoiceNo,
    invoice_type || 'service',
    amount,
    taxRate,
    taxAmount,
    totalAmount,
    buyer_name,
    buyer_tax_id || '',
    sellerName,
    sellerTaxId,
    service_content,
    'UKEY-' + Math.random().toString(36).substring(2, 10).toUpperCase()
  );

  setTimeout(() => {
    db.prepare(`
      UPDATE invoices
      SET status = 'issued', invoice_url = ?, issued_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(`/invoices/${invoiceNo}.pdf`, result.lastInsertRowid);
  }, 100);

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(result.lastInsertRowid);
  return success(res, invoice, '发票申请已提交');
});

router.get('/invoices', authMiddleware(['worker', 'enterprise', 'admin']), (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;
  const { status } = req.query;
  const userId = req.user!.userId;
  const role = req.user!.role;

  const conditions: string[] = [];
  const params: any[] = [];

  if (role !== 'admin') {
    if (role === 'worker') {
      const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as any;
      if (worker) {
        conditions.push('(applicant_type = ? AND applicant_id = ?)');
        params.push('worker', worker.id);
      } else {
        return success(res, [], '查询成功', { total: 0, page, pageSize });
      }
    } else {
      const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as any;
      if (enterprise) {
        conditions.push('(applicant_type = ? AND applicant_id = ?)');
        params.push('enterprise', enterprise.id);
      } else {
        return success(res, [], '查询成功', { total: 0, page, pageSize });
      }
    }
  }

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countRow = db.prepare(`SELECT COUNT(*) as count FROM invoices ${whereClause}`).get(...params) as { count: number };

  const invoices = db.prepare(`
    SELECT i.*,
      CASE WHEN i.applicant_type = 'worker' THEN w1.real_name ELSE e1.company_name END as applicant_name,
      CASE WHEN i.applicant_type = 'worker' THEN u1.phone ELSE e1.company_phone END as applicant_phone
    FROM invoices i
    LEFT JOIN workers w1 ON i.applicant_type = 'worker' AND i.applicant_id = w1.id
    LEFT JOIN users u1 ON w1.user_id = u1.id
    LEFT JOIN enterprises e1 ON i.applicant_type = 'enterprise' AND i.applicant_id = e1.id
    ${whereClause}
    ORDER BY i.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  return success(res, invoices, '查询成功', { total: countRow.count, page, pageSize });
});

router.post('/attendance/offline-sync', authMiddleware(['worker']), (req: Request, res: Response) => {
  const { records } = req.body;
  const userId = req.user!.userId;

  const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as any;
  if (!worker) {
    return fail(res, '工人信息不存在');
  }

  if (!Array.isArray(records) || records.length === 0) {
    return fail(res, '没有需要同步的打卡数据');
  }

  let synced = 0;
  let conflicts = 0;
  const results: any[] = [];

  const tx = db.transaction((items: any[]) => {
    for (const rec of items) {
      const { job_application_id, date, check_in_time, check_out_time, check_in_lat, check_in_lng, check_out_lat, check_out_lng, status, notes, work_hours } = rec;

      if (!job_application_id || !date) {
        conflicts++;
        results.push({ date, job_application_id, success: false, reason: '缺少必要字段' });
        continue;
      }

      const jobApp = db.prepare('SELECT * FROM job_applications WHERE id = ? AND worker_id = ?').get(job_application_id, worker.id) as any;
      if (!jobApp) {
        conflicts++;
        results.push({ date, job_application_id, success: false, reason: '无此项目申请记录' });
        continue;
      }

      const existing = db.prepare('SELECT * FROM attendance_records WHERE job_application_id = ? AND date = ?').get(job_application_id, date) as any;

      if (existing) {
        if (existing.offline_mode === 1) {
          conflicts++;
          results.push({ date, job_application_id, success: false, reason: '该日期已有记录' });
          continue;
        }
      }

      let attStatus = status || 'normal';
      let workH = Number(work_hours) || 0;
      let checkInValid = 0;
      let checkOutValid = 0;

      if (check_in_lat !== undefined && check_in_lng !== undefined) {
        checkInValid = 1;
      }
      if (check_out_lat !== undefined && check_out_lng !== undefined) {
        checkOutValid = 1;
      }

      if (workH === 0 && check_in_time && check_out_time) {
        try {
          const [h1, m1] = check_in_time.split(':').map(Number);
          const [h2, m2] = check_out_time.split(':').map(Number);
          workH = Math.max(0, ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60);
        } catch {
          workH = 0;
        }
      }

      if (existing) {
        db.prepare(`
          UPDATE attendance_records
          SET check_in_time = ?, check_out_time = ?, check_in_lat = ?, check_in_lng = ?, check_out_lat = ?, check_out_lng = ?,
              check_in_valid = ?, check_out_valid = ?, offline_mode = 1, work_hours = ?, status = ?, notes = ?
          WHERE id = ?
        `).run(
          check_in_time || existing.check_in_time,
          check_out_time || existing.check_out_time,
          check_in_lat !== undefined ? check_in_lat : existing.check_in_lat,
          check_in_lng !== undefined ? check_in_lng : existing.check_in_lng,
          check_out_lat !== undefined ? check_out_lat : existing.check_out_lat,
          check_out_lng !== undefined ? check_out_lng : existing.check_out_lng,
          checkInValid || existing.check_in_valid,
          checkOutValid || existing.check_out_valid,
          workH || existing.work_hours,
          attStatus,
          notes || existing.notes,
          existing.id
        );
      } else {
        db.prepare(`
          INSERT INTO attendance_records (job_application_id, worker_id, job_post_id, date, check_in_time, check_out_time,
            check_in_lat, check_in_lng, check_out_lat, check_out_lng, check_in_valid, check_out_valid, offline_mode, work_hours, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
        `).run(
          job_application_id,
          worker.id,
          jobApp.job_post_id,
          date,
          check_in_time || null,
          check_out_time || null,
          check_in_lat !== undefined ? check_in_lat : null,
          check_in_lng !== undefined ? check_in_lng : null,
          check_out_lat !== undefined ? check_out_lat : null,
          check_out_lng !== undefined ? check_out_lng : null,
          checkInValid,
          checkOutValid,
          workH,
          attStatus,
          notes || ''
        );
      }

      synced++;
      results.push({ date, job_application_id, success: true });
    }
  });

  tx(records);

  return success(res, {
    synced,
    conflicts,
    total: records.length,
    details: results
  }, '离线打卡数据同步完成');
});

router.get('/attendance/report', authMiddleware(['worker', 'enterprise', 'admin']), (req: Request, res: Response) => {
  const { year, month, worker_id, enterprise_id } = req.query;
  const userId = req.user!.userId;
  const role = req.user!.role;

  const now = new Date();
  const reportYear = Number(year) || now.getFullYear();
  const reportMonth = Number(month) || (now.getMonth() + 1);
  const monthStr = `${reportYear}-${reportMonth.toString().padStart(2, '0')}`;

  let workerIdFilter: number | null = null;

  if (role === 'worker') {
    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as any;
    if (!worker) {
      return fail(res, '工人信息不存在');
    }
    workerIdFilter = worker.id;
  } else if (role === 'enterprise') {
    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as any;
    if (!enterprise) {
      return fail(res, '企业信息不存在');
    }
    if (worker_id) {
      const hasAccess = db.prepare(`
        SELECT 1 FROM job_applications ja
        LEFT JOIN job_posts jp ON ja.job_post_id = jp.id
        WHERE ja.worker_id = ? AND jp.enterprise_id = ?
        LIMIT 1
      `).get(worker_id, enterprise.id);
      if (!hasAccess) {
        return fail(res, '无权限查看该工人的考勤数据');
      }
      workerIdFilter = Number(worker_id);
    }
  } else {
    if (worker_id) {
      workerIdFilter = Number(worker_id);
    }
  }

  const params: any[] = [monthStr + '%'];
  if (workerIdFilter) {
    params.push(workerIdFilter);
  }

  const records = db.prepare(`
    SELECT ar.*, jp.title as job_title, jp.work_location, u.real_name as worker_name
    FROM attendance_records ar
    LEFT JOIN job_posts jp ON ar.job_post_id = jp.id
    LEFT JOIN workers w ON ar.worker_id = w.id
    LEFT JOIN users u ON w.user_id = u.id
    WHERE ar.date LIKE ?
    ${workerIdFilter ? ' AND ar.worker_id = ?' : ''}
    ORDER BY ar.date DESC
  `).all(...params) as any[];

  const summary = {
    total_days: records.length,
    normal_days: records.filter((r: any) => r.status === 'normal').length,
    late_days: records.filter((r: any) => r.status === 'late').length,
    early_leave_days: records.filter((r: any) => r.status === 'early_leave').length,
    absent_days: records.filter((r: any) => r.status === 'absent').length,
    leave_days: records.filter((r: any) => r.status === 'leave').length,
    total_work_hours: Number(records.reduce((sum: number, r: any) => sum + (r.work_hours || 0), 0).toFixed(2)),
    offline_count: records.filter((r: any) => r.offline_mode === 1).length
  };

  const byDate = records.reduce((acc: any, r: any) => {
    if (!acc[r.date]) acc[r.date] = [];
    acc[r.date].push(r);
    return acc;
  }, {});

  const byJob = records.reduce((acc: any, r: any) => {
    const key = r.job_post_id;
    if (!acc[key]) {
      acc[key] = {
        job_title: r.job_title,
        work_location: r.work_location,
        days: 0,
        total_work_hours: 0
      };
    }
    acc[key].days++;
    acc[key].total_work_hours += r.work_hours || 0;
    return acc;
  }, {});

  Object.keys(byJob).forEach(k => {
    byJob[k].total_work_hours = Number(byJob[k].total_work_hours.toFixed(2));
  });

  return success(res, {
    year: reportYear,
    month: reportMonth,
    month_str: monthStr,
    summary,
    by_date: byDate,
    by_job: Object.values(byJob),
    records
  }, '考勤报表获取成功');
});

router.get('/statistics/dashboard', authMiddleware(['admin']), (_req: Request, res: Response) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE status = ?').get('active') as { count: number };
  const totalWorkers = db.prepare('SELECT COUNT(*) as count FROM workers').get() as { count: number };
  const totalEnterprises = db.prepare('SELECT COUNT(*) as count FROM enterprises').get() as { count: number };
  const totalAdmins = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin') as { count: number };

  const totalProjects = db.prepare('SELECT COUNT(*) as count FROM job_posts').get() as { count: number };
  const activeProjects = db.prepare("SELECT COUNT(*) as count FROM job_posts WHERE status IN ('open', 'in_progress')").get() as { count: number };
  const completedProjects = db.prepare("SELECT COUNT(*) as count FROM job_posts WHERE status = 'completed'").get() as { count: number };

  const totalWageGuarantee = db.prepare('SELECT COALESCE(SUM(deposit_amount), 0) as total FROM wage_guarantees').get() as { total: number };
  const totalWageReleased = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM wage_releases WHERE status = ?').get('released') as { total: number };
  const pendingWageReleases = db.prepare('SELECT COUNT(*) as count FROM wage_releases WHERE status = ?').get('pending') as { count: number };

  const pendingAlerts = db.prepare("SELECT COUNT(*) as count FROM risk_alerts WHERE status = 'active'").get() as { count: number };
  const totalAlerts = db.prepare('SELECT COUNT(*) as count FROM risk_alerts').get() as { count: number };
  const todayAlerts = db.prepare("SELECT COUNT(*) as count FROM risk_alerts WHERE DATE(created_at) = DATE('now', 'localtime')").get() as { count: number };

  const highAlerts = db.prepare("SELECT COUNT(*) as count FROM risk_alerts WHERE severity IN ('high', 'critical') AND status = 'active'").get() as { count: number };

  const craftsmanDistribution = db.prepare(`
    SELECT craftsman_level, COUNT(*) as count
    FROM workers
    GROUP BY craftsman_level
    ORDER BY craftsman_level ASC
  `).all();

  const craftsmanLevelMap: any = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const item of craftsmanDistribution) {
    craftsmanLevelMap[(item as any).craftsman_level] = (item as any).count;
  }

  const newUsersLast7Days = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM users
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all();

  const wageReleasedLast7Days = db.prepare(`
    SELECT DATE(actual_release_date) as date, COALESCE(SUM(amount), 0) as total
    FROM wage_releases
    WHERE actual_release_date >= datetime('now', '-7 days') AND status = 'released'
    GROUP BY DATE(actual_release_date)
    ORDER BY date ASC
  `).all();

  const projectsByStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM job_posts
    GROUP BY status
  `).all();

  const topEnterprises = db.prepare(`
    SELECT e.id, e.company_name, e.credit_score, e.total_projects, e.total_workers_hired,
      COALESCE((SELECT SUM(deposit_amount) FROM wage_guarantees WHERE enterprise_id = e.id), 0) as total_guarantee
    FROM enterprises e
    ORDER BY total_guarantee DESC
    LIMIT 5
  `).all();

  const topWorkers = db.prepare(`
    SELECT w.id, u.real_name, w.primary_skill, w.craftsman_level, w.craftsman_score, w.total_projects, w.total_work_days
    FROM workers w
    LEFT JOIN users u ON w.user_id = u.id
    ORDER BY w.craftsman_score DESC
    LIMIT 5
  `).all();

  const totalAttendanceToday = db.prepare("SELECT COUNT(*) as count FROM attendance_records WHERE date = DATE('now', 'localtime')").get() as { count: number };
  const totalLicenses = db.prepare('SELECT COUNT(*) as count FROM individual_licenses').get() as { count: number };
  const totalInvoices = db.prepare('SELECT COUNT(*) as count FROM invoices').get() as { count: number };
  const totalInvoiceAmount = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE status = ?').get('issued') as { total: number };

  return success(res, {
    overview: {
      total_users: totalUsers.count,
      total_workers: totalWorkers.count,
      total_enterprises: totalEnterprises.count,
      total_admins: totalAdmins.count,
      total_projects: totalProjects.count,
      active_projects: activeProjects.count,
      completed_projects: completedProjects.count,
      total_wage_guarantee: totalWageGuarantee.total,
      total_wage_released: totalWageReleased.total,
      pending_wage_releases: pendingWageReleases.count,
      pending_alerts: pendingAlerts.count,
      total_alerts: totalAlerts.count,
      today_alerts: todayAlerts.count,
      high_severity_alerts: highAlerts.count,
      today_attendance: totalAttendanceToday.count,
      total_licenses: totalLicenses.count,
      total_invoices: totalInvoices.count,
      total_invoice_amount: totalInvoiceAmount.total
    },
    craftsman_distribution: {
      level_1: craftsmanLevelMap[1],
      level_2: craftsmanLevelMap[2],
      level_3: craftsmanLevelMap[3],
      level_4: craftsmanLevelMap[4],
      level_5: craftsmanLevelMap[5]
    },
    projects_by_status: projectsByStatus,
    trends: {
      new_users_last_7_days: newUsersLast7Days,
      wage_released_last_7_days: wageReleasedLast7Days
    },
    rankings: {
      top_enterprises: topEnterprises,
      top_workers: topWorkers
    }
  }, '平台运营数据总览获取成功');
});

export default router;
