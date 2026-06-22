import { Router, Request, Response } from 'express';
import db from '../utils/db';
import { success, fail } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import type { Enterprise } from '../types';

const router = Router();

router.get('/profile', authMiddleware(['enterprise']), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const enterprise = db.prepare(`
      SELECT e.*, u.phone, u.real_name as contact_name, u.avatar_url
      FROM enterprises e
      JOIN users u ON e.user_id = u.id
      WHERE e.user_id = ?
    `).get(userId) as Enterprise & { phone: string; contact_name: string; avatar_url?: string };

    if (!enterprise) {
      return fail(res, '企业信息不存在', 404);
    }

    success(res, enterprise);
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取企业资料失败';
    fail(res, message);
  }
});

router.put('/profile', authMiddleware(['enterprise']), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      company_name,
      unified_social_code,
      legal_person,
      legal_person_id_card,
      company_address,
      company_phone,
      company_email,
      industry_type,
      registered_capital,
    } = req.body;

    const existing = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as { id: number } | undefined;
    if (!existing) {
      return fail(res, '企业信息不存在', 404);
    }

    db.prepare(`
      UPDATE enterprises
      SET company_name = COALESCE(?, company_name),
          unified_social_code = COALESCE(?, unified_social_code),
          legal_person = COALESCE(?, legal_person),
          legal_person_id_card = COALESCE(?, legal_person_id_card),
          company_address = COALESCE(?, company_address),
          company_phone = COALESCE(?, company_phone),
          company_email = COALESCE(?, company_email),
          industry_type = COALESCE(?, industry_type),
          registered_capital = COALESCE(?, registered_capital),
          updated_at = datetime('now', 'localtime')
      WHERE user_id = ?
    `).run(
      company_name,
      unified_social_code,
      legal_person,
      legal_person_id_card,
      company_address,
      company_phone,
      company_email,
      industry_type,
      registered_capital,
      userId
    );

    const updated = db.prepare(`
      SELECT e.*, u.phone, u.real_name as contact_name, u.avatar_url
      FROM enterprises e
      JOIN users u ON e.user_id = u.id
      WHERE e.user_id = ?
    `).get(userId);

    success(res, updated, '企业资料更新成功');
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新企业资料失败';
    fail(res, message);
  }
});

router.post('/verify', authMiddleware(['enterprise']), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      unified_social_code,
      business_license_url,
      legal_person,
      legal_person_id_card,
      company_name,
    } = req.body;

    if (!unified_social_code || !business_license_url || !legal_person || !legal_person_id_card) {
      return fail(res, '请提交完整的认证资料', 400);
    }

    const existing = db.prepare('SELECT id, verified FROM enterprises WHERE user_id = ?').get(userId) as { id: number; verified: number } | undefined;
    if (!existing) {
      return fail(res, '企业信息不存在', 404);
    }

    if (existing.verified === 1) {
      return fail(res, '企业已完成认证，无需重复提交', 400);
    }

    db.prepare(`
      UPDATE enterprises
      SET company_name = COALESCE(?, company_name),
          unified_social_code = ?,
          business_license_url = ?,
          legal_person = ?,
          legal_person_id_card = ?,
          verified = 2,
          updated_at = datetime('now', 'localtime')
      WHERE user_id = ?
    `).run(
      company_name,
      unified_social_code,
      business_license_url,
      legal_person,
      legal_person_id_card,
      userId
    );

    const updated = db.prepare(`
      SELECT company_name, unified_social_code, business_license_url, 
             legal_person, verified, verified_at
      FROM enterprises WHERE user_id = ?
    `).get(userId);

    success(res, updated, '认证资料已提交，等待审核');
  } catch (err) {
    const message = err instanceof Error ? err.message : '提交认证资料失败';
    fail(res, message);
  }
});

router.get('/credit-score', authMiddleware(['enterprise']), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const enterprise = db.prepare(
      'SELECT id, credit_score FROM enterprises WHERE user_id = ?'
    ).get(userId) as { id: number; credit_score: number } | undefined;

    if (!enterprise) {
      return fail(res, '企业信息不存在', 404);
    }

    const alerts = db.prepare(`
      SELECT id, alert_type, severity, title, description, created_at, status
      FROM risk_alerts
      WHERE enterprise_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(enterprise.id);

    const creditHistory = db.prepare(`
      SELECT 
        'payment' as type,
        created_at as event_at,
        '按时发放工资' as description,
        5 as score_change
      FROM wage_releases wr
      JOIN wage_guarantees wg ON wr.wage_guarantee_id = wg.id
      WHERE wg.enterprise_id = ? AND wr.status = 'released'
      UNION ALL
      SELECT 
        'alert' as type,
        created_at as event_at,
        title as description,
        CASE severity 
          WHEN 'low' THEN -2 
          WHEN 'medium' THEN -5 
          WHEN 'high' THEN -10 
          WHEN 'critical' THEN -20 
          ELSE 0 
        END as score_change
      FROM risk_alerts
      WHERE enterprise_id = ? AND status IN ('active', 'resolved')
      ORDER BY event_at DESC
      LIMIT 100
    `).all(enterprise.id, enterprise.id);

    success(res, {
      credit_score: enterprise.credit_score,
      credit_level: enterprise.credit_score >= 90 ? 'AAA' :
                    enterprise.credit_score >= 80 ? 'AA' :
                    enterprise.credit_score >= 70 ? 'A' :
                    enterprise.credit_score >= 60 ? 'B' : 'C',
      alerts,
      credit_history: creditHistory,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取信用评分失败';
    fail(res, message);
  }
});

router.get('/statistics', authMiddleware(['enterprise']), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const enterprise = db.prepare(
      'SELECT id, total_projects, total_workers_hired FROM enterprises WHERE user_id = ?'
    ).get(userId) as { id: number; total_projects: number; total_workers_hired: number } | undefined;

    if (!enterprise) {
      return fail(res, '企业信息不存在', 404);
    }

    const postStats = db.prepare(`
      SELECT 
        COUNT(*) as total_posts,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_posts,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_posts,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_posts,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_posts,
        SUM(workers_needed) as total_workers_needed,
        SUM(wage_deposit_amount) as total_deposit
      FROM job_posts
      WHERE enterprise_id = ?
    `).get(enterprise.id) as {
      total_posts: number;
      open_posts: number;
      in_progress_posts: number;
      completed_posts: number;
      cancelled_posts: number;
      total_workers_needed: number;
      total_deposit: number;
    };

    const applicationStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT ja.worker_id) as unique_workers,
        SUM(CASE WHEN ja.application_status = 'accepted' THEN 1 ELSE 0 END) as accepted_applications,
        SUM(CASE WHEN ja.application_status = 'completed' THEN 1 ELSE 0 END) as completed_applications,
        SUM(CASE WHEN ja.worker_signoff = 1 AND ja.enterprise_confirm = 1 THEN 1 ELSE 0 END) as fully_completed
      FROM job_applications ja
      JOIN job_posts jp ON ja.job_post_id = jp.id
      WHERE jp.enterprise_id = ?
    `).get(enterprise.id) as {
      unique_workers: number;
      accepted_applications: number;
      completed_applications: number;
      fully_completed: number;
    };

    const wageStats = db.prepare(`
      SELECT 
        COALESCE(SUM(wr.amount), 0) as total_wages_released,
        COALESCE(SUM(CASE WHEN wr.status = 'pending' THEN wr.amount ELSE 0 END), 0) as pending_wages,
        COALESCE(SUM(CASE WHEN wr.status = 'released' THEN wr.amount ELSE 0 END), 0) as released_wages,
        COUNT(wr.id) as total_release_orders
      FROM wage_releases wr
      JOIN wage_guarantees wg ON wr.wage_guarantee_id = wg.id
      WHERE wg.enterprise_id = ?
    `).get(enterprise.id) as {
      total_wages_released: number;
      pending_wages: number;
      released_wages: number;
      total_release_orders: number;
    };

    const attendanceStats = db.prepare(`
      SELECT 
        COUNT(*) as total_attendance_days,
        SUM(CASE WHEN ar.status = 'normal' THEN 1 ELSE 0 END) as normal_days,
        SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(ar.work_hours) as total_work_hours
      FROM attendance_records ar
      JOIN job_posts jp ON ar.job_post_id = jp.id
      WHERE jp.enterprise_id = ?
    `).get(enterprise.id) as {
      total_attendance_days: number;
      normal_days: number;
      late_days: number;
      absent_days: number;
      total_work_hours: number;
    };

    success(res, {
      basic: {
        total_projects: enterprise.total_projects,
        total_workers_hired: enterprise.total_workers_hired,
      },
      posts: postStats,
      applications: applicationStats,
      wages: wageStats,
      attendance: attendanceStats,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取统计数据失败';
    fail(res, message);
  }
});

export default router;
