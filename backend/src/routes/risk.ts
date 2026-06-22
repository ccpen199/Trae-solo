import { Router, Request, Response } from 'express';
import db from '../utils/db';
import { success, fail } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/alerts/scan', authMiddleware(['admin']), (_req: Request, res: Response) => {
  const newAlerts: any[] = [];
  const tx = db.transaction(() => {
    const executingContracts = db.prepare(`
      SELECT c.*, ja.worker_id, ja.job_post_id, jp.enterprise_id, jp.end_date, jp.daily_wage
      FROM contracts c
      LEFT JOIN job_applications ja ON c.job_application_id = ja.id
      LEFT JOIN job_posts jp ON ja.job_post_id = jp.id
      WHERE c.status = 'executing'
    `).all() as any[];

    const today = new Date();
    for (const contract of executingContracts) {
      if (contract.end_date) {
        const endDate = new Date(contract.end_date);
        const diffDays = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 15 && contract.status === 'executing') {
          const existing = db.prepare(`
            SELECT id FROM risk_alerts
            WHERE related_type = 'contract' AND related_id = ? AND alert_type = 'contract_breach' AND status IN ('active', 'acknowledged')
          `).get(contract.id);

          if (!existing) {
            const result = db.prepare(`
              INSERT INTO risk_alerts (alert_type, severity, related_type, related_id, enterprise_id, worker_id, title, description, data_context)
              VALUES (?, ?, 'contract', ?, ?, ?, ?, ?, ?)
            `).run(
              'contract_breach',
              'high',
              contract.id,
              contract.enterprise_id,
              contract.worker_id,
              `合同执行异常: 合同号 ${contract.contract_no}`,
              `合同预计完工日期已超过 ${diffDays} 天，合同仍处于执行中状态，请核实是否存在违约情况`,
              JSON.stringify({ contract_id: contract.id, contract_no: contract.contract_no, overdue_days: diffDays })
            );
            newAlerts.push({ id: result.lastInsertRowid, type: 'contract_breach', contract_no: contract.contract_no });
          }
        }
      }
    }

    const delayedReleases = db.prepare(`
      SELECT wr.*, wg.enterprise_id, u.real_name as worker_name, jp.title as job_title
      FROM wage_releases wr
      LEFT JOIN wage_guarantees wg ON wr.wage_guarantee_id = wg.id
      LEFT JOIN workers w ON wr.worker_id = w.id
      LEFT JOIN users u ON w.user_id = u.id
      LEFT JOIN job_applications ja ON wr.job_application_id = ja.id
      LEFT JOIN job_posts jp ON ja.job_post_id = jp.id
      WHERE wr.status = 'pending'
    `).all() as any[];

    for (const release of delayedReleases) {
      if (release.scheduled_release_date) {
        const scheduled = new Date(release.scheduled_release_date);
        const diffDays = Math.floor((today.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 2) {
          const existing = db.prepare(`
            SELECT id FROM risk_alerts
            WHERE related_type = 'wage_release' AND related_id = ? AND alert_type = 'wage_delay' AND status IN ('active', 'acknowledged')
          `).get(release.id);

          if (!existing) {
            const severity = diffDays >= 5 ? 'critical' : diffDays >= 3 ? 'high' : 'medium';
            const result = db.prepare(`
              INSERT INTO risk_alerts (alert_type, severity, related_type, related_id, enterprise_id, worker_id, title, description, data_context)
              VALUES (?, ?, 'wage_release', ?, ?, ?, ?, ?, ?)
            `).run(
              'wage_delay',
              severity,
              release.id,
              release.enterprise_id,
              release.worker_id,
              `工资发放延迟: 发放号 ${release.release_no}`,
              `工人 ${release.worker_name || '未知'} 的工资发放已延迟 ${diffDays} 天，应发放日期 ${release.scheduled_release_date}，项目: ${release.job_title || '未知'}`,
              JSON.stringify({ release_id: release.id, release_no: release.release_no, delay_days: diffDays, amount: release.amount })
            );
            newAlerts.push({ id: result.lastInsertRowid, type: 'wage_delay', release_no: release.release_no, delay_days: diffDays });
          }
        }
      }
    }

    const workersWithAbnormalAttendance = db.prepare(`
      SELECT worker_id, COUNT(*) as abnormal_count
      FROM (
        SELECT
          worker_id,
          date,
          CASE
            WHEN status IN ('late', 'early_leave', 'absent') THEN 1
            WHEN check_in_valid = 0 OR check_out_valid = 0 THEN 1
            ELSE 0
          END as is_abnormal
        FROM attendance_records
        WHERE date >= date('now', '-6 days')
      ) sub
      WHERE is_abnormal = 1
      GROUP BY worker_id
      HAVING abnormal_count >= 3
    `).all() as any[];

    for (const wa of workersWithAbnormalAttendance) {
      const existing = db.prepare(`
        SELECT id FROM risk_alerts
        WHERE related_type = 'worker' AND related_id = ? AND alert_type = 'attendance_abnormal' AND status IN ('active', 'acknowledged')
        AND created_at >= datetime('now', '-24 hours')
      `).get(wa.worker_id);

      if (!existing) {
        const worker = db.prepare(`
          SELECT w.*, u.real_name, u.phone
          FROM workers w LEFT JOIN users u ON w.user_id = u.id
          WHERE w.id = ?
        `).get(wa.worker_id) as any;

        const severity = wa.abnormal_count >= 5 ? 'high' : 'medium';
        const result = db.prepare(`
          INSERT INTO risk_alerts (alert_type, severity, related_type, related_id, worker_id, title, description, data_context)
          VALUES (?, ?, 'worker', ?, ?, ?, ?, ?)
        `).run(
          'attendance_abnormal',
          severity,
          wa.worker_id,
          wa.worker_id,
          `连续异常考勤: 工人 ${worker?.real_name || 'ID:' + wa.worker_id}`,
          `近7天内该工人有 ${wa.abnormal_count} 天考勤异常（迟到/早退/旷工/打卡无效），请关注`,
          JSON.stringify({ worker_id: wa.worker_id, abnormal_count: wa.abnormal_count, days: 7 })
        );
        newAlerts.push({ id: result.lastInsertRowid, type: 'attendance_abnormal', worker_id: wa.worker_id, abnormal_count: wa.abnormal_count });
      }
    }

    const workersWithQualityIssues = db.prepare(`
      SELECT worker_id, job_application_id, GROUP_CONCAT(quality_score) as scores, COUNT(*) as fail_count
      FROM (
        SELECT
          worker_id,
          job_application_id,
          quality_score,
          ROW_NUMBER() OVER (PARTITION BY worker_id ORDER BY inspection_date DESC) as rn
        FROM quality_inspections
      ) sub
      WHERE rn <= 2 AND quality_score < 60
      GROUP BY worker_id, job_application_id
      HAVING fail_count >= 2
    `).all() as any[];

    for (const wq of workersWithQualityIssues) {
      const existing = db.prepare(`
        SELECT id FROM risk_alerts
        WHERE related_type = 'job_application' AND related_id = ? AND alert_type = 'quality_issue' AND status IN ('active', 'acknowledged')
      `).get(wq.job_application_id);

      if (!existing) {
        const worker = db.prepare(`
          SELECT w.*, u.real_name, u.phone
          FROM workers w LEFT JOIN users u ON w.user_id = u.id
          WHERE w.id = ?
        `).get(wq.worker_id) as any;

        const scores = wq.scores.split(',').map(Number);
        const result = db.prepare(`
          INSERT INTO risk_alerts (alert_type, severity, related_type, related_id, worker_id, title, description, data_context)
          VALUES (?, ?, 'job_application', ?, ?, ?, ?, ?)
        `).run(
          'quality_issue',
          'high',
          wq.job_application_id,
          wq.worker_id,
          `连续质量抽检不合格: 工人 ${worker?.real_name || 'ID:' + wq.worker_id}`,
          `该工人最近2次质量抽检均不合格，分数分别为: ${scores.join('分, ')}分，请关注其工作质量`,
          JSON.stringify({ worker_id: wq.worker_id, job_application_id: wq.job_application_id, scores, fail_count: wq.fail_count })
        );
        newAlerts.push({ id: result.lastInsertRowid, type: 'quality_issue', worker_id: wq.worker_id, scores });
      }
    }
  });

  tx();

  return success(res, {
    scanned: true,
    new_alerts_count: newAlerts.length,
    new_alerts: newAlerts
  }, '风控扫描完成');
});

router.get('/alerts', authMiddleware(['admin', 'enterprise']), (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;
  const { alert_type, severity, status } = req.query;
  const userId = req.user!.userId;
  const role = req.user!.role;

  const conditions: string[] = [];
  const params: any[] = [];

  if (role === 'enterprise') {
    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as any;
    if (enterprise) {
      conditions.push('(ra.enterprise_id = ? OR ra.worker_id IN (SELECT worker_id FROM job_applications ja WHERE ja.job_post_id IN (SELECT id FROM job_posts WHERE enterprise_id = ?)))');
      params.push(enterprise.id, enterprise.id);
    } else {
      return success(res, [], '查询成功', { total: 0, page, pageSize });
    }
  }

  if (alert_type) {
    conditions.push('ra.alert_type = ?');
    params.push(alert_type);
  }
  if (severity) {
    conditions.push('ra.severity = ?');
    params.push(severity);
  }
  if (status) {
    conditions.push('ra.status = ?');
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countRow = db.prepare(`SELECT COUNT(*) as count FROM risk_alerts ra ${whereClause}`).get(...params) as { count: number };

  const alerts = db.prepare(`
    SELECT ra.*, e.company_name, u1.real_name as worker_name, u2.real_name as handler_name
    FROM risk_alerts ra
    LEFT JOIN enterprises e ON ra.enterprise_id = e.id
    LEFT JOIN workers w ON ra.worker_id = w.id
    LEFT JOIN users u1 ON w.user_id = u1.id
    LEFT JOIN users u2 ON ra.handled_by = u2.id
    ${whereClause}
    ORDER BY
      CASE ra.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END ASC,
      ra.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  return success(res, alerts, '查询成功', { total: countRow.count, page, pageSize });
});

router.get('/alerts/:id', authMiddleware(['admin', 'enterprise']), (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const role = req.user!.role;

  let alert: any;
  if (role === 'enterprise') {
    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as any;
    if (!enterprise) {
      return fail(res, '企业信息不存在');
    }
    alert = db.prepare(`
      SELECT ra.*, e.company_name, u1.real_name as worker_name, u1.phone as worker_phone, u2.real_name as handler_name
      FROM risk_alerts ra
      LEFT JOIN enterprises e ON ra.enterprise_id = e.id
      LEFT JOIN workers w ON ra.worker_id = w.id
      LEFT JOIN users u1 ON w.user_id = u1.id
      LEFT JOIN users u2 ON ra.handled_by = u2.id
      WHERE ra.id = ? AND (ra.enterprise_id = ? OR ra.worker_id IN (SELECT worker_id FROM job_applications ja WHERE ja.job_post_id IN (SELECT id FROM job_posts WHERE enterprise_id = ?)))
    `).get(id, enterprise.id, enterprise.id);
  } else {
    alert = db.prepare(`
      SELECT ra.*, e.company_name, u1.real_name as worker_name, u1.phone as worker_phone, u2.real_name as handler_name
      FROM risk_alerts ra
      LEFT JOIN enterprises e ON ra.enterprise_id = e.id
      LEFT JOIN workers w ON ra.worker_id = w.id
      LEFT JOIN users u1 ON w.user_id = u1.id
      LEFT JOIN users u2 ON ra.handled_by = u2.id
      WHERE ra.id = ?
    `).get(id);
  }

  if (!alert) {
    return fail(res, '预警记录不存在或无权限查看');
  }

  let relatedDetail: any = null;
  if (alert.related_type && alert.related_id) {
    switch (alert.related_type) {
      case 'contract':
        relatedDetail = db.prepare(`
          SELECT c.*, jp.title as job_title, u.real_name as worker_name
          FROM contracts c
          LEFT JOIN job_applications ja ON c.job_application_id = ja.id
          LEFT JOIN job_posts jp ON ja.job_post_id = jp.id
          LEFT JOIN workers w ON ja.worker_id = w.id
          LEFT JOIN users u ON w.user_id = u.id
          WHERE c.id = ?
        `).get(alert.related_id);
        break;
      case 'wage_release':
        relatedDetail = db.prepare(`
          SELECT wr.*, wg.guarantee_no, jp.title as job_title, u.real_name as worker_name
          FROM wage_releases wr
          LEFT JOIN wage_guarantees wg ON wr.wage_guarantee_id = wg.id
          LEFT JOIN job_applications ja ON wr.job_application_id = ja.id
          LEFT JOIN job_posts jp ON ja.job_post_id = jp.id
          LEFT JOIN workers w ON wr.worker_id = w.id
          LEFT JOIN users u ON w.user_id = u.id
          WHERE wr.id = ?
        `).get(alert.related_id);
        break;
      case 'worker':
        relatedDetail = db.prepare(`
          SELECT w.*, u.real_name, u.phone, u.id_card_number
          FROM workers w LEFT JOIN users u ON w.user_id = u.id
          WHERE w.id = ?
        `).get(alert.related_id);
        break;
      case 'job_application':
        relatedDetail = db.prepare(`
          SELECT ja.*, jp.title as job_title, jp.work_location, u.real_name as worker_name
          FROM job_applications ja
          LEFT JOIN job_posts jp ON ja.job_post_id = jp.id
          LEFT JOIN workers w ON ja.worker_id = w.id
          LEFT JOIN users u ON w.user_id = u.id
          WHERE ja.id = ?
        `).get(alert.related_id);
        break;
    }
  }

  return success(res, { ...alert, related_detail: relatedDetail });
});

router.put('/alerts/:id', authMiddleware(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, handling_notes } = req.body;
  const userId = req.user!.userId;

  const validStatuses = ['active', 'acknowledged', 'resolved', 'ignored'];
  if (status && !validStatuses.includes(status)) {
    return fail(res, '无效的状态值');
  }

  const alert = db.prepare('SELECT * FROM risk_alerts WHERE id = ?').get(id);
  if (!alert) {
    return fail(res, '预警记录不存在');
  }

  db.prepare(`
    UPDATE risk_alerts
    SET status = ?, handling_notes = ?, handled_by = ?, handled_at = datetime('now', 'localtime'), updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    status || (alert as any).status,
    handling_notes || (alert as any).handling_notes,
    userId,
    id
  );

  const updated = db.prepare(`
    SELECT ra.*, u.real_name as handler_name
    FROM risk_alerts ra
    LEFT JOIN users u ON ra.handled_by = u.id
    WHERE ra.id = ?
  `).get(id);

  return success(res, updated, '预警处理成功');
});

router.get('/alerts/statistics', authMiddleware(['admin', 'enterprise']), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const role = req.user!.role;

  let whereClause = '';
  const params: any[] = [];

  if (role === 'enterprise') {
    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as any;
    if (enterprise) {
      whereClause = 'WHERE (enterprise_id = ? OR worker_id IN (SELECT worker_id FROM job_applications ja WHERE ja.job_post_id IN (SELECT id FROM job_posts WHERE enterprise_id = ?)))';
      params.push(enterprise.id, enterprise.id);
    }
  }

  const totalCount = db.prepare(`SELECT COUNT(*) as count FROM risk_alerts ${whereClause}`).get(...params) as { count: number };

  const byType = db.prepare(`
    SELECT alert_type, COUNT(*) as count
    FROM risk_alerts
    ${whereClause}
    GROUP BY alert_type
    ORDER BY count DESC
  `).all(...params);

  const bySeverity = db.prepare(`
    SELECT severity, COUNT(*) as count
    FROM risk_alerts
    ${whereClause}
    GROUP BY severity
    ORDER BY
      CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END ASC
  `).all(...params);

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM risk_alerts
    ${whereClause}
    GROUP BY status
    ORDER BY count DESC
  `).all(...params);

  const activeCount = db.prepare(`SELECT COUNT(*) as count FROM risk_alerts ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'active'`).get(...params) as { count: number };

  const last7DaysTrend = db.prepare(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count
    FROM risk_alerts
    ${whereClause ? whereClause + ' AND' : 'WHERE'} created_at >= datetime('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(...params);

  return success(res, {
    total: totalCount.count,
    active_count: activeCount.count,
    by_type: byType,
    by_severity: bySeverity,
    by_status: byStatus,
    last_7_days_trend: last7DaysTrend
  }, '预警统计数据获取成功');
});

router.post('/contracts/monitor', authMiddleware(['admin']), (_req: Request, res: Response) => {
  const updatedContracts: any[] = [];
  const tx = db.transaction(() => {
    const contracts = db.prepare(`
      SELECT c.*, ja.worker_id, ja.job_post_id, jp.enterprise_id, jp.end_date, jp.daily_wage, jp.start_date
      FROM contracts c
      LEFT JOIN job_applications ja ON c.job_application_id = ja.id
      LEFT JOIN job_posts jp ON ja.job_post_id = jp.id
      WHERE c.status IN ('signed', 'executing')
    `).all() as any[];

    const today = new Date();

    for (const contract of contracts) {
      let breachFlag = false;
      let breachReasons: string[] = [];

      if (contract.end_date) {
        const endDate = new Date(contract.end_date);
        const diffDays = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 30 && contract.status === 'executing') {
          breachFlag = true;
          breachReasons.push(`合同超期未完成 ${diffDays} 天`);
        }
      }

      const attendance = db.prepare(`
        SELECT
          COUNT(*) as total_days,
          SUM(CASE WHEN status IN ('absent') THEN 1 ELSE 0 END) as absent_days
        FROM attendance_records
        WHERE job_application_id = ? AND date >= ?
      `).get(contract.job_application_id, contract.start_date || '2000-01-01') as any;

      if (attendance && attendance.total_days > 10 && attendance.absent_days / attendance.total_days > 0.3) {
        breachFlag = true;
        breachReasons.push(`矿工率过高: ${((attendance.absent_days / attendance.total_days) * 100).toFixed(1)}%`);
      }

      const qualityIssues = db.prepare(`
        SELECT COUNT(*) as count
        FROM quality_inspections
        WHERE job_application_id = ? AND rectification_required = 1 AND rectification_completed = 0
      `).get(contract.job_application_id) as { count: number };

      if (qualityIssues.count >= 3) {
        breachFlag = true;
        breachReasons.push(`存在 ${qualityIssues.count} 项未整改的质量问题`);
      }

      if (breachFlag && contract.status !== 'breached') {
        db.prepare(`
          UPDATE contracts
          SET status = 'breached', breach_reason = ?, updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(breachReasons.join('; '), contract.id);

        db.prepare(`
          INSERT INTO risk_alerts (alert_type, severity, related_type, related_id, enterprise_id, worker_id, title, description, data_context)
          VALUES (?, ?, 'contract', ?, ?, ?, ?, ?, ?)
        `).run(
          'contract_breach',
          'high',
          contract.id,
          contract.enterprise_id,
          contract.worker_id,
          `合同违约标记: 合同号 ${contract.contract_no}`,
          `该合同已被标记为违约，原因: ${breachReasons.join('; ')}`,
          JSON.stringify({ contract_id: contract.id, contract_no: contract.contract_no, breach_reasons: breachReasons })
        );

        updatedContracts.push({
          id: contract.id,
          contract_no: contract.contract_no,
          breach_reasons: breachReasons
        });
      }
    }
  });

  tx();

  return success(res, {
    monitored: true,
    breached_count: updatedContracts.length,
    breached_contracts: updatedContracts
  }, '合同履约监测完成');
});

export default router;
