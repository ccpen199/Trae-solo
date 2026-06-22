import { Router, Request, Response } from 'express';
import db from '../utils/db';
import { success, fail } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import type { AttendanceRecord } from '../types';

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

router.post('/guarantee', authMiddleware(['enterprise']), (req: Request, res: Response) => {
  const { job_post_id, deposit_amount, payment_method } = req.body;
  const userId = req.user!.userId;

  if (!job_post_id || !deposit_amount) {
    return fail(res, '缺少必要参数');
  }

  const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(userId) as any;
  if (!enterprise) {
    return fail(res, '企业信息不存在');
  }

  const jobPost = db.prepare('SELECT * FROM job_posts WHERE id = ? AND enterprise_id = ?').get(job_post_id, enterprise.id) as any;
  if (!jobPost) {
    return fail(res, '招聘信息不存在');
  }

  const existing = db.prepare('SELECT * FROM wage_guarantees WHERE job_post_id = ?').get(job_post_id) as any;
  if (existing) {
    return fail(res, '该招聘已存在工资保证金担保');
  }

  const guaranteeNo = generateNo('WG');
  const result = db.prepare(`
    INSERT INTO wage_guarantees (job_post_id, enterprise_id, guarantee_no, deposit_amount, paid_amount, payment_method, payment_order_no, payment_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `).run(
    job_post_id,
    enterprise.id,
    guaranteeNo,
    deposit_amount,
    deposit_amount,
    payment_method || 'bank_transfer',
    generateNo('PO')
  );

  db.prepare('UPDATE job_posts SET wage_deposit_amount = ?, deposit_paid = 1 WHERE id = ?').run(deposit_amount, job_post_id);

  const guarantee = db.prepare('SELECT * FROM wage_guarantees WHERE id = ?').get(result.lastInsertRowid);
  return success(res, guarantee, '创建工资保证金担保成功');
});

router.get('/guarantees', authMiddleware(['enterprise', 'admin']), (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;
  const userId = req.user!.userId;
  const role = req.user!.role;

  let whereClause = '';
  const params: any[] = [];

  if (role === 'enterprise') {
    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as any;
    if (!enterprise) {
      return success(res, [], '查询成功', { total: 0, page, pageSize });
    }
    whereClause = 'WHERE wg.enterprise_id = ?';
    params.push(enterprise.id);
  }

  const countRow = db.prepare(`SELECT COUNT(*) as count FROM wage_guarantees wg ${whereClause}`).get(...params) as { count: number };

  const guarantees = db.prepare(`
    SELECT wg.*, jp.title as job_title, jp.work_location
    FROM wage_guarantees wg
    LEFT JOIN job_posts jp ON wg.job_post_id = jp.id
    ${whereClause}
    ORDER BY wg.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  return success(res, guarantees, '查询成功', { total: countRow.count, page, pageSize });
});

router.get('/guarantees/:id', authMiddleware(['enterprise', 'admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const role = req.user!.role;

  let guarantee: any;
  if (role === 'enterprise') {
    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as any;
    if (!enterprise) {
      return fail(res, '企业信息不存在');
    }
    guarantee = db.prepare(`
      SELECT wg.*, jp.title as job_title, jp.work_location, jp.daily_wage, e.company_name
      FROM wage_guarantees wg
      LEFT JOIN job_posts jp ON wg.job_post_id = jp.id
      LEFT JOIN enterprises e ON wg.enterprise_id = e.id
      WHERE wg.id = ? AND wg.enterprise_id = ?
    `).get(id, enterprise.id);
  } else {
    guarantee = db.prepare(`
      SELECT wg.*, jp.title as job_title, jp.work_location, jp.daily_wage, e.company_name
      FROM wage_guarantees wg
      LEFT JOIN job_posts jp ON wg.job_post_id = jp.id
      LEFT JOIN enterprises e ON wg.enterprise_id = e.id
      WHERE wg.id = ?
    `).get(id);
  }

  if (!guarantee) {
    return fail(res, '保证金记录不存在');
  }

  const releases = db.prepare(`
    SELECT wr.*, u.real_name as worker_name, u.phone as worker_phone
    FROM wage_releases wr
    LEFT JOIN workers w ON wr.worker_id = w.id
    LEFT JOIN users u ON w.user_id = u.id
    WHERE wr.wage_guarantee_id = ?
    ORDER BY wr.created_at DESC
  `).all(id);

  return success(res, { ...guarantee, releases });
});

router.post('/process-releases', authMiddleware(['admin']), (_req: Request, res: Response) => {
  const now = new Date();
  const todayStr = now.getFullYear().toString()
    + '-' + (now.getMonth() + 1).toString().padStart(2, '0')
    + '-' + now.getDate().toString().padStart(2, '0');

  const pendingReleases = db.prepare(`
    SELECT wr.*, wg.deposit_amount as total_deposit, wg.total_released
    FROM wage_releases wr
    LEFT JOIN wage_guarantees wg ON wr.wage_guarantee_id = wg.id
    WHERE wr.status = 'pending' AND wr.scheduled_release_date <= date(?)
  `).all(todayStr) as any[];

  let processed = 0;
  const errors: string[] = [];

  const tx = db.transaction((releases: any[]) => {
    for (const release of releases) {
      try {
        db.prepare(`
          UPDATE wage_releases
          SET status = 'released', actual_release_date = datetime('now', 'localtime')
          WHERE id = ?
        `).run(release.id);

        const paymentNo = generateNo('WP');
        db.prepare(`
          INSERT INTO wage_payments (wage_release_id, payment_no, payment_method, amount, bank_name, bank_account, account_holder, bank_order_no, status, payslip_generated, payslip_url, processed_at)
          VALUES (?, ?, 'bank_transfer', ?, ?, ?, ?, ?, 'success', 1, ?, datetime('now', 'localtime'))
        `).run(
          release.id,
          paymentNo,
          release.amount,
          release.bank_name,
          release.bank_account,
          release.account_holder,
          generateNo('BO'),
          `/payslips/${paymentNo}.pdf`
        );

        const payslipUrl = `/payslips/${release.release_no}.pdf`;
        db.prepare('UPDATE wage_releases SET payslip_url = ? WHERE id = ?').run(payslipUrl, release.id);

        const newTotalReleased = (release.total_released || 0) + release.amount;
        let releaseStatus = 'partial_released';
        if (newTotalReleased >= release.total_deposit) {
          releaseStatus = 'fully_released';
        }
        db.prepare(`
          UPDATE wage_guarantees
          SET total_released = ?, release_status = ?, updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(newTotalReleased, releaseStatus, release.wage_guarantee_id);

        processed++;
      } catch (e: any) {
        errors.push(`处理记录 ${release.id} 失败: ${e.message}`);
      }
    }
  });

  tx(pendingReleases);

  return success(res, { processed, total: pendingReleases.length, errors }, '工资发放处理完成');
});

router.get('/my-releases', authMiddleware(['worker']), (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;
  const userId = req.user!.userId;

  const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as any;
  if (!worker) {
    return fail(res, '工人信息不存在');
  }

  const countRow = db.prepare(`
    SELECT COUNT(*) as count FROM wage_releases wr WHERE wr.worker_id = ?
  `).get(worker.id) as { count: number };

  const releases = db.prepare(`
    SELECT wr.*, wg.guarantee_no, jp.title as job_title, wp.payment_no, wp.status as payment_status
    FROM wage_releases wr
    LEFT JOIN wage_guarantees wg ON wr.wage_guarantee_id = wg.id
    LEFT JOIN job_posts jp ON wg.job_post_id = jp.id
    LEFT JOIN wage_payments wp ON wr.id = wp.wage_release_id
    WHERE wr.worker_id = ?
    ORDER BY wr.created_at DESC
    LIMIT ? OFFSET ?
  `).all(worker.id, pageSize, offset);

  return success(res, releases, '查询成功', { total: countRow.count, page, pageSize });
});

router.post('/release/:id/hold', authMiddleware(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const release = db.prepare('SELECT * FROM wage_releases WHERE id = ?').get(id) as any;
  if (!release) {
    return fail(res, '工资发放记录不存在');
  }

  if (release.status === 'released') {
    return fail(res, '该工资已发放，无法暂停');
  }

  db.prepare(`
    UPDATE wage_releases
    SET status = 'held', updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(id);

  const releaseNo = release.release_no;
  const alertType = 'credit_risk';
  const severity = 'high';
  db.prepare(`
    INSERT INTO risk_alerts (alert_type, severity, related_type, related_id, title, description, data_context)
    VALUES (?, ?, 'wage_release', ?, ?, ?, ?)
  `).run(
    alertType,
    severity,
    id,
    `工资发放被暂停: ${releaseNo}`,
    reason || '风控触发',
    JSON.stringify({ release_id: id, reason })
  );

  const updated = db.prepare('SELECT * FROM wage_releases WHERE id = ?').get(id);
  return success(res, updated, '工资发放已暂停');
});

router.post('/payroll/process', authMiddleware(['admin']), (req: Request, res: Response) => {
  const { release_ids } = req.body;

  if (!Array.isArray(release_ids) || release_ids.length === 0) {
    return fail(res, '请选择要处理的发放记录');
  }

  const releases = db.prepare(`
    SELECT wr.*, wg.deposit_amount as total_deposit, wg.total_released
    FROM wage_releases wr
    LEFT JOIN wage_guarantees wg ON wr.wage_guarantee_id = wg.id
    WHERE wr.id IN (${release_ids.map(() => '?').join(',')}) AND wr.status = 'pending'
  `).all(...release_ids) as any[];

  if (releases.length === 0) {
    return fail(res, '没有待处理的发放记录');
  }

  let processed = 0;
  const failed: number[] = [];

  const tx = db.transaction((items: any[]) => {
    for (const release of items) {
      try {
        db.prepare(`
          UPDATE wage_releases
          SET status = 'released', actual_release_date = datetime('now', 'localtime')
          WHERE id = ?
        `).run(release.id);

        const paymentNo = generateNo('WP');
        db.prepare(`
          INSERT INTO wage_payments (wage_release_id, payment_no, payment_method, amount, bank_name, bank_account, account_holder, bank_order_no, status, payslip_generated, payslip_url, processed_at)
          VALUES (?, ?, 'bank_transfer', ?, ?, ?, ?, ?, 'success', 1, ?, datetime('now', 'localtime'))
        `).run(
          release.id,
          paymentNo,
          release.amount,
          release.bank_name,
          release.bank_account,
          release.account_holder,
          generateNo('BO'),
          `/payslips/${paymentNo}.pdf`
        );

        const payslipUrl = `/payslips/${release.release_no}.pdf`;
        db.prepare('UPDATE wage_releases SET payslip_url = ? WHERE id = ?').run(payslipUrl, release.id);

        const newTotalReleased = (release.total_released || 0) + release.amount;
        let releaseStatus = 'partial_released';
        if (newTotalReleased >= release.total_deposit) {
          releaseStatus = 'fully_released';
        }
        db.prepare(`
          UPDATE wage_guarantees
          SET total_released = ?, release_status = ?, updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(newTotalReleased, releaseStatus, release.wage_guarantee_id);

        processed++;
      } catch {
        failed.push(release.id);
      }
    }
  });

  tx(releases);

  return success(res, {
    processed,
    total: releases.length,
    failed,
    failed_count: failed.length
  }, '批量代发处理完成');
});

router.get('/payroll/:paymentId/payslip', authMiddleware(['worker', 'enterprise', 'admin']), (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const userId = req.user!.userId;
  const role = req.user!.role;

  let payment: any;

  if (role === 'worker') {
    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as any;
    if (!worker) {
      return fail(res, '工人信息不存在');
    }
    payment = db.prepare(`
      SELECT wp.*, wr.release_no, wr.amount as release_amount, wr.scheduled_release_date, wr.actual_release_date, wr.worker_id,
        wg.guarantee_no, jp.title as job_title, jp.daily_wage, jp.work_location,
        u.real_name as worker_name, u.phone as worker_phone, u.id_card_number
      FROM wage_payments wp
      LEFT JOIN wage_releases wr ON wp.wage_release_id = wr.id
      LEFT JOIN wage_guarantees wg ON wr.wage_guarantee_id = wg.id
      LEFT JOIN job_posts jp ON wg.job_post_id = jp.id
      LEFT JOIN workers w ON wr.worker_id = w.id
      LEFT JOIN users u ON w.user_id = u.id
      WHERE wp.id = ? AND wr.worker_id = ?
    `).get(paymentId, worker.id);
  } else if (role === 'enterprise') {
    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as any;
    if (!enterprise) {
      return fail(res, '企业信息不存在');
    }
    payment = db.prepare(`
      SELECT wp.*, wr.release_no, wr.amount as release_amount, wr.scheduled_release_date, wr.actual_release_date,
        wg.guarantee_no, jp.title as job_title, jp.daily_wage, jp.work_location,
        u.real_name as worker_name, u.phone as worker_phone, u.id_card_number
      FROM wage_payments wp
      LEFT JOIN wage_releases wr ON wp.wage_release_id = wr.id
      LEFT JOIN wage_guarantees wg ON wr.wage_guarantee_id = wg.id
      LEFT JOIN job_posts jp ON wg.job_post_id = jp.id
      LEFT JOIN workers w ON wr.worker_id = w.id
      LEFT JOIN users u ON w.user_id = u.id
      WHERE wp.id = ? AND wg.enterprise_id = ?
    `).get(paymentId, enterprise.id);
  } else {
    payment = db.prepare(`
      SELECT wp.*, wr.release_no, wr.amount as release_amount, wr.scheduled_release_date, wr.actual_release_date,
        wg.guarantee_no, jp.title as job_title, jp.daily_wage, jp.work_location,
        u.real_name as worker_name, u.phone as worker_phone, u.id_card_number
      FROM wage_payments wp
      LEFT JOIN wage_releases wr ON wp.wage_release_id = wr.id
      LEFT JOIN wage_guarantees wg ON wr.wage_guarantee_id = wg.id
      LEFT JOIN job_posts jp ON wg.job_post_id = jp.id
      LEFT JOIN workers w ON wr.worker_id = w.id
      LEFT JOIN users u ON w.user_id = u.id
      WHERE wp.id = ?
    `).get(paymentId);
  }

  if (!payment) {
    return fail(res, '工资条记录不存在或无权限查看');
  }

  const attendanceRecords = db.prepare(`
    SELECT ar.date, ar.status, ar.work_hours, ar.check_in_time, ar.check_out_time
    FROM attendance_records ar
    WHERE ar.job_application_id = (
      SELECT job_application_id FROM wage_releases WHERE id = (
        SELECT wage_release_id FROM wage_payments WHERE id = ?
      )
    )
    ORDER BY ar.date ASC
  `).all(paymentId) as AttendanceRecord[];

  const workDays = attendanceRecords.filter((r: any) => r.status !== 'absent' && r.status !== 'leave').length;
  const totalWorkHours = attendanceRecords.reduce((sum: number, r: any) => sum + (r.work_hours || 0), 0);
  const grossPay = payment.release_amount;
  const taxRate = 0.03;
  const taxAmount = grossPay * taxRate;
  const netPay = grossPay - taxAmount;

  const payslip = {
    ...payment,
    period_start: attendanceRecords.length > 0 ? attendanceRecords[0].date : null,
    period_end: attendanceRecords.length > 0 ? attendanceRecords[attendanceRecords.length - 1].date : null,
    attendance: {
      work_days: workDays,
      total_work_hours: totalWorkHours,
      daily_rate: payment.daily_wage,
      records: attendanceRecords
    },
    earnings: {
      base_salary: grossPay,
      total_gross: grossPay
    },
    deductions: {
      income_tax: taxAmount,
      total_deductions: taxAmount
    },
    net_pay: netPay,
    generated_at: new Date().toISOString()
  };

  return success(res, payslip, '获取电子工资条成功');
});

export default router;
