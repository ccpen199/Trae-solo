import { Router, Request, Response } from 'express';
import db from '../utils/db';
import { success, fail } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import dayjs from 'dayjs';
import type { JobPost, JobApplication, Contract } from '../types';

interface ApplicationWithReview extends JobApplication {
  enterprise_id: number;
  workers_needed: number;
  accepted_count: number;
}

interface ApplicationWithContract extends JobApplication {
  enterprise_id: number;
  daily_wage: number;
  start_date: string;
  end_date: string;
  worker_user_id: number;
  enterprise_user_id: number;
}

interface ApplicationWithWage extends JobApplication {
  daily_wage: number;
  start_date: string;
  end_date: string;
}

interface ApplicationWithConfirm extends JobApplication {
  enterprise_id: number;
  daily_wage: number;
  start_date: string;
  end_date: string;
  wage_guarantee_id: number;
}

interface ApplicationWithAuth extends JobApplication {
  worker_user_id: number;
  enterprise_user_id: number;
}

const router = Router();

function generateOrderNo(prefix: string): string {
  const now = Date.now();
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${now}${rand}`;
}

router.post('/posts', authMiddleware(['enterprise']), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      title,
      skill_required,
      workers_needed,
      start_date,
      end_date,
      daily_wage,
      work_location,
      latitude,
      longitude,
      geofence_radius,
      accommodation_provided,
      accommodation_detail,
      meals_provided,
      meals_detail,
      insurance_provided,
      insurance_detail,
      work_hours,
      description,
    } = req.body;

    if (!title || !skill_required || !workers_needed || !start_date || !end_date || !daily_wage || !work_location) {
      return fail(res, '请填写完整的用工需求信息', 400);
    }

    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as { id: number } | undefined;
    if (!enterprise) {
      return fail(res, '企业信息不存在', 404);
    }

    const start = dayjs(start_date);
    const end = dayjs(end_date);
    if (!start.isValid() || !end.isValid()) {
      return fail(res, '日期格式无效', 400);
    }
    if (end.isBefore(start)) {
      return fail(res, '结束日期不能早于开始日期', 400);
    }

    const durationDays = end.diff(start, 'day') + 1;
    const wage_deposit_amount = Math.round(Number(daily_wage) * Number(workers_needed) * durationDays * 1.1 * 100) / 100;

    const result = db.prepare(`
      INSERT INTO job_posts (
        enterprise_id, title, skill_required, workers_needed, start_date, end_date,
        daily_wage, work_location, latitude, longitude, geofence_radius,
        accommodation_provided, accommodation_detail, meals_provided, meals_detail,
        insurance_provided, insurance_detail, work_hours, description,
        status, wage_deposit_amount, deposit_paid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, 0)
    `).run(
      enterprise.id,
      title,
      skill_required,
      workers_needed,
      start_date,
      end_date,
      daily_wage,
      work_location,
      latitude,
      longitude,
      geofence_radius || 500,
      accommodation_provided || 0,
      accommodation_detail,
      meals_provided || 0,
      meals_detail,
      insurance_provided || 0,
      insurance_detail,
      work_hours,
      description,
      wage_deposit_amount
    );

    const post = db.prepare('SELECT * FROM job_posts WHERE id = ?').get(result.lastInsertRowid) as JobPost;
    success(res, { ...post, duration_days: durationDays, wage_deposit_amount }, '用工需求发布成功');
  } catch (err) {
    const message = err instanceof Error ? err.message : '发布用工需求失败';
    fail(res, message);
  }
});

router.get('/posts', authMiddleware(), (req: Request, res: Response) => {
  try {
    const {
      keyword,
      skill_required,
      min_wage,
      max_wage,
      status,
      page = 1,
      pageSize = 20,
    } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    if (keyword) {
      conditions.push('(jp.title LIKE ? OR jp.description LIKE ? OR jp.work_location LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }
    if (skill_required) {
      conditions.push('jp.skill_required LIKE ?');
      params.push(`%${skill_required}%`);
    }
    if (min_wage) {
      conditions.push('jp.daily_wage >= ?');
      params.push(Number(min_wage));
    }
    if (max_wage) {
      conditions.push('jp.daily_wage <= ?');
      params.push(Number(max_wage));
    }
    if (status) {
      conditions.push('jp.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const totalRow = db.prepare(`
      SELECT COUNT(*) as count FROM job_posts jp ${whereClause}
    `).get(...params) as { count: number };

    const offset = (Number(page) - 1) * Number(pageSize);
    const posts = db.prepare(`
      SELECT jp.*, e.company_name, e.verified, e.credit_score
      FROM job_posts jp
      JOIN enterprises e ON jp.enterprise_id = e.id
      ${whereClause}
      ORDER BY jp.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(pageSize), offset);

    success(res, posts, 'success', {
      total: totalRow.count,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取用工需求列表失败';
    fail(res, message);
  }
});

router.get('/posts/:id', authMiddleware(), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = db.prepare(`
      SELECT jp.*, e.company_name, e.verified, e.credit_score,
             e.company_address, e.company_phone, e.industry_type
      FROM job_posts jp
      JOIN enterprises e ON jp.enterprise_id = e.id
      WHERE jp.id = ?
    `).get(Number(id));

    if (!post) {
      return fail(res, '用工需求不存在', 404);
    }

    const applications = db.prepare(`
      SELECT ja.*, w.user_id as worker_user_id, u.real_name, u.avatar_url,
             w.primary_skill, w.work_years, w.craftsman_level, w.daily_wage_expected
      FROM job_applications ja
      JOIN workers w ON ja.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE ja.job_post_id = ?
      ORDER BY ja.applied_at DESC
    `).all(Number(id));

    success(res, { ...post, applications });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取用工需求详情失败';
    fail(res, message);
  }
});

router.put('/posts/:id', authMiddleware(['enterprise']), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const {
      title,
      skill_required,
      workers_needed,
      start_date,
      end_date,
      daily_wage,
      work_location,
      latitude,
      longitude,
      geofence_radius,
      accommodation_provided,
      accommodation_detail,
      meals_provided,
      meals_detail,
      insurance_provided,
      insurance_detail,
      work_hours,
      description,
      status,
    } = req.body;

    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as { id: number } | undefined;
    if (!enterprise) {
      return fail(res, '企业信息不存在', 404);
    }

    const existing = db.prepare('SELECT * FROM job_posts WHERE id = ? AND enterprise_id = ?').get(Number(id), enterprise.id) as JobPost | undefined;
    if (!existing) {
      return fail(res, '用工需求不存在或无权限操作', 404);
    }

    if (status && !['open', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return fail(res, '无效的状态值', 400);
    }

    let wage_deposit_amount = existing.wage_deposit_amount;
    if (start_date || end_date || daily_wage || workers_needed) {
      const newStart = start_date ? dayjs(start_date) : dayjs(existing.start_date);
      const newEnd = end_date ? dayjs(end_date) : dayjs(existing.end_date);
      if (newEnd.isBefore(newStart)) {
        return fail(res, '结束日期不能早于开始日期', 400);
      }
      const durationDays = newEnd.diff(newStart, 'day') + 1;
      const newDailyWage = daily_wage ?? existing.daily_wage;
      const newWorkersNeeded = workers_needed ?? existing.workers_needed;
      wage_deposit_amount = Math.round(Number(newDailyWage) * Number(newWorkersNeeded) * durationDays * 1.1 * 100) / 100;
    }

    db.prepare(`
      UPDATE job_posts
      SET title = COALESCE(?, title),
          skill_required = COALESCE(?, skill_required),
          workers_needed = COALESCE(?, workers_needed),
          start_date = COALESCE(?, start_date),
          end_date = COALESCE(?, end_date),
          daily_wage = COALESCE(?, daily_wage),
          work_location = COALESCE(?, work_location),
          latitude = COALESCE(?, latitude),
          longitude = COALESCE(?, longitude),
          geofence_radius = COALESCE(?, geofence_radius),
          accommodation_provided = COALESCE(?, accommodation_provided),
          accommodation_detail = COALESCE(?, accommodation_detail),
          meals_provided = COALESCE(?, meals_provided),
          meals_detail = COALESCE(?, meals_detail),
          insurance_provided = COALESCE(?, insurance_provided),
          insurance_detail = COALESCE(?, insurance_detail),
          work_hours = COALESCE(?, work_hours),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          wage_deposit_amount = ?,
          updated_at = datetime('now', 'localtime')
      WHERE id = ? AND enterprise_id = ?
    `).run(
      title,
      skill_required,
      workers_needed,
      start_date,
      end_date,
      daily_wage,
      work_location,
      latitude,
      longitude,
      geofence_radius,
      accommodation_provided,
      accommodation_detail,
      meals_provided,
      meals_detail,
      insurance_provided,
      insurance_detail,
      work_hours,
      description,
      status,
      wage_deposit_amount,
      Number(id),
      enterprise.id
    );

    const updated = db.prepare('SELECT * FROM job_posts WHERE id = ?').get(Number(id)) as JobPost;
    success(res, updated, '用工需求更新成功');
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新用工需求失败';
    fail(res, message);
  }
});

router.post('/posts/:id/pay-deposit', authMiddleware(['enterprise']), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { payment_method = 'bank_transfer', payment_order_no } = req.body || {};

    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as { id: number } | undefined;
    if (!enterprise) {
      return fail(res, '企业信息不存在', 404);
    }

    const post = db.prepare('SELECT * FROM job_posts WHERE id = ? AND enterprise_id = ?').get(Number(id), enterprise.id) as JobPost | undefined;
    if (!post) {
      return fail(res, '用工需求不存在或无权限操作', 404);
    }

    if (post.deposit_paid === 1) {
      return fail(res, '保证金已支付，无需重复支付', 400);
    }

    const guarantee_no = generateOrderNo('WG');

    const insertGuarantee = db.prepare(`
      INSERT INTO wage_guarantees (
        job_post_id, enterprise_id, guarantee_no, deposit_amount, paid_amount,
        payment_method, payment_order_no, payment_time, release_status, total_released
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), 'locked', 0)
    `);

    const updatePost = db.prepare(`
      UPDATE job_posts SET deposit_paid = 1, updated_at = datetime('now', 'localtime') WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      insertGuarantee.run(
        Number(id),
        enterprise.id,
        guarantee_no,
        post.wage_deposit_amount,
        post.wage_deposit_amount,
        payment_method || 'bank_transfer',
        payment_order_no
      );
      updatePost.run(Number(id));
    });

    transaction();

    const guarantee = db.prepare('SELECT * FROM wage_guarantees WHERE guarantee_no = ?').get(guarantee_no);
    success(res, guarantee, '工资保证金支付成功');
  } catch (err) {
    const message = err instanceof Error ? err.message : '支付保证金失败';
    fail(res, message);
  }
});

router.post('/posts/:id/apply', authMiddleware(['worker']), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { notes } = req.body || {};

    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as { id: number } | undefined;
    if (!worker) {
      return fail(res, '工人信息不存在', 404);
    }

    const post = db.prepare('SELECT * FROM job_posts WHERE id = ?').get(Number(id)) as JobPost | undefined;
    if (!post) {
      return fail(res, '用工需求不存在', 404);
    }

    if (post.status !== 'open') {
      return fail(res, '该用工需求不接受申请', 400);
    }

    if (post.deposit_paid !== 1) {
      return fail(res, '企业尚未支付工资保证金，暂不接受申请', 400);
    }

    const existingApp = db.prepare(
      'SELECT id FROM job_applications WHERE job_post_id = ? AND worker_id = ?'
    ).get(Number(id), worker.id);
    if (existingApp) {
      return fail(res, '您已申请过该用工需求', 400);
    }

    const result = db.prepare(`
      INSERT INTO job_applications (job_post_id, worker_id, application_status, notes)
      VALUES (?, ?, 'pending', ?)
    `).run(Number(id), worker.id, notes);

    const application = db.prepare(`
      SELECT ja.*, jp.title, jp.daily_wage, jp.work_location, jp.start_date, jp.end_date
      FROM job_applications ja
      JOIN job_posts jp ON ja.job_post_id = jp.id
      WHERE ja.id = ?
    `).get(result.lastInsertRowid);

    success(res, application, '申请提交成功');
  } catch (err) {
    const message = err instanceof Error ? err.message : '提交申请失败';
    fail(res, message);
  }
});

router.get('/my-posts', authMiddleware(['enterprise']), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { status, page = 1, pageSize = 20 } = req.query;

    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as { id: number } | undefined;
    if (!enterprise) {
      return fail(res, '企业信息不存在', 404);
    }

    const conditions: string[] = ['jp.enterprise_id = ?'];
    const params: any[] = [enterprise.id];

    if (status) {
      conditions.push('jp.status = ?');
      params.push(status);
    }

    const whereClause = conditions.join(' AND ');

    const totalRow = db.prepare(`
      SELECT COUNT(*) as count FROM job_posts jp WHERE ${whereClause}
    `).get(...params) as { count: number };

    const offset = (Number(page) - 1) * Number(pageSize);
    const posts = db.prepare(`
      SELECT jp.*,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_post_id = jp.id) as application_count,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_post_id = jp.id AND ja.application_status = 'accepted') as accepted_count
      FROM job_posts jp
      WHERE ${whereClause}
      ORDER BY jp.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(pageSize), offset);

    success(res, posts, 'success', {
      total: totalRow.count,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取我的用工需求列表失败';
    fail(res, message);
  }
});

router.get('/my-applications', authMiddleware(['worker']), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { application_status, page = 1, pageSize = 20 } = req.query;

    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as { id: number } | undefined;
    if (!worker) {
      return fail(res, '工人信息不存在', 404);
    }

    const conditions: string[] = ['ja.worker_id = ?'];
    const params: any[] = [worker.id];

    if (application_status) {
      conditions.push('ja.application_status = ?');
      params.push(application_status);
    }

    const whereClause = conditions.join(' AND ');

    const totalRow = db.prepare(`
      SELECT COUNT(*) as count FROM job_applications ja WHERE ${whereClause}
    `).get(...params) as { count: number };

    const offset = (Number(page) - 1) * Number(pageSize);
    const applications = db.prepare(`
      SELECT ja.*, jp.title, jp.daily_wage, jp.work_location, jp.start_date, jp.end_date,
             jp.company_name as company_name_temp,
             e.company_name, e.verified
      FROM job_applications ja
      JOIN job_posts jp ON ja.job_post_id = jp.id
      JOIN enterprises e ON jp.enterprise_id = e.id
      WHERE ${whereClause}
      ORDER BY ja.applied_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(pageSize), offset);

    success(res, applications, 'success', {
      total: totalRow.count,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取我的申请记录失败';
    fail(res, message);
  }
});

router.put('/applications/:id/review', authMiddleware(['enterprise']), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { application_status, notes } = req.body;

    if (!['accepted', 'rejected'].includes(application_status)) {
      return fail(res, '审核状态无效', 400);
    }

    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as { id: number } | undefined;
    if (!enterprise) {
      return fail(res, '企业信息不存在', 404);
    }

    const application = db.prepare(`
      SELECT ja.*, jp.enterprise_id, jp.workers_needed,
             (SELECT COUNT(*) FROM job_applications ja2 WHERE ja2.job_post_id = ja.job_post_id AND ja2.application_status = 'accepted') as accepted_count
      FROM job_applications ja
      JOIN job_posts jp ON ja.job_post_id = jp.id
      WHERE ja.id = ? AND jp.enterprise_id = ?
    `).get(Number(id), enterprise.id) as ApplicationWithReview | undefined;

    if (!application) {
      return fail(res, '申请不存在或无权限操作', 404);
    }

    if (application.application_status !== 'pending') {
      return fail(res, '该申请已审核，无法重复操作', 400);
    }

    if (application_status === 'accepted' && application.accepted_count >= application.workers_needed) {
      return fail(res, '该用工需求招募人数已满', 400);
    }

    db.prepare(`
      UPDATE job_applications
      SET application_status = ?,
          reviewed_at = datetime('now', 'localtime'),
          reviewed_by = ?,
          hire_date = CASE WHEN ? = 'accepted' THEN datetime('now', 'localtime') ELSE hire_date END,
          notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(application_status, enterprise.id, application_status, notes, Number(id));

    if (application_status === 'accepted') {
      const acceptedCount = db.prepare(`
        SELECT COUNT(*) as count FROM job_applications 
        WHERE job_post_id = ? AND application_status = 'accepted'
      `).get(application.job_post_id) as { count: number };

      if (acceptedCount.count >= application.workers_needed) {
        db.prepare(`
          UPDATE job_posts SET status = 'in_progress', updated_at = datetime('now', 'localtime') WHERE id = ?
        `).run(application.job_post_id);
      }
    }

    const updated = db.prepare(`
      SELECT ja.*, jp.title, u.real_name as worker_name, u.phone as worker_phone
      FROM job_applications ja
      JOIN job_posts jp ON ja.job_post_id = jp.id
      JOIN workers w ON ja.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE ja.id = ?
    `).get(Number(id));

    success(res, updated, application_status === 'accepted' ? '已录用该工人' : '已拒绝该申请');
  } catch (err) {
    const message = err instanceof Error ? err.message : '审核申请失败';
    fail(res, message);
  }
});

router.post('/applications/:id/sign-contract', authMiddleware(), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { id } = req.params;
    const { contract_content } = req.body;

    const application = db.prepare(`
      SELECT ja.*, jp.enterprise_id, jp.daily_wage, jp.start_date, jp.end_date,
             w.user_id as worker_user_id, e.user_id as enterprise_user_id
      FROM job_applications ja
      JOIN job_posts jp ON ja.job_post_id = jp.id
      JOIN workers w ON ja.worker_id = w.id
      JOIN enterprises e ON jp.enterprise_id = e.id
      WHERE ja.id = ?
    `).get(Number(id)) as ApplicationWithContract | undefined;

    if (!application) {
      return fail(res, '申请不存在', 404);
    }

    if (application.application_status !== 'accepted') {
      return fail(res, '仅已录用的申请可以签署合同', 400);
    }

    let isAuthorized = false;
    if (userRole === 'worker' && application.worker_user_id === userId) {
      isAuthorized = true;
    } else if (userRole === 'enterprise' && application.enterprise_user_id === userId) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return fail(res, '无权限操作该合同', 403);
    }

    let contract = db.prepare('SELECT * FROM contracts WHERE job_application_id = ?').get(Number(id)) as Contract | undefined;

    if (!contract) {
      const start = dayjs(application.start_date);
      const end = dayjs(application.end_date);
      const durationDays = end.diff(start, 'day') + 1;
      const totalAmount = Math.round(Number(application.daily_wage) * durationDays * 100) / 100;
      const contractNo = generateOrderNo('CT');

      const result = db.prepare(`
        INSERT INTO contracts (job_application_id, contract_no, contract_content, total_amount)
        VALUES (?, ?, ?, ?)
      `).run(Number(id), contractNo, contract_content || '', totalAmount);

      contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(result.lastInsertRowid) as Contract;
    }

    if (userRole === 'worker') {
      if (contract.signed_by_worker === 1) {
        return fail(res, '您已签署该合同', 400);
      }
      db.prepare(`
        UPDATE contracts 
        SET signed_by_worker = 1, 
            worker_signed_at = datetime('now', 'localtime'),
            contract_content = COALESCE(?, contract_content),
            status = CASE WHEN signed_by_enterprise = 1 THEN 'signed' ELSE 'draft' END
        WHERE id = ?
      `).run(contract_content, contract.id);
    } else {
      if (contract.signed_by_enterprise === 1) {
        return fail(res, '您已签署该合同', 400);
      }
      db.prepare(`
        UPDATE contracts 
        SET signed_by_enterprise = 1, 
            enterprise_signed_at = datetime('now', 'localtime'),
            contract_content = COALESCE(?, contract_content),
            status = CASE WHEN signed_by_worker = 1 THEN 'signed' ELSE 'draft' END
        WHERE id = ?
      `).run(contract_content, contract.id);
    }

    const updatedContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contract.id);
    success(res, updatedContract, '合同签署成功');
  } catch (err) {
    const message = err instanceof Error ? err.message : '签署合同失败';
    fail(res, message);
  }
});

router.post('/applications/:id/signoff', authMiddleware(['worker']), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as { id: number } | undefined;
    if (!worker) {
      return fail(res, '工人信息不存在', 404);
    }

    const application = db.prepare(`
      SELECT ja.*, jp.daily_wage, jp.start_date, jp.end_date
      FROM job_applications ja
      JOIN job_posts jp ON ja.job_post_id = jp.id
      WHERE ja.id = ? AND ja.worker_id = ?
    `).get(Number(id), worker.id) as ApplicationWithWage | undefined;

    if (!application) {
      return fail(res, '申请不存在或无权限操作', 404);
    }

    if (application.application_status !== 'accepted') {
      return fail(res, '仅已录用的申请可以签收', 400);
    }

    if (application.worker_signoff === 1) {
      return fail(res, '您已完成完工签收', 400);
    }

    const attendanceStats = db.prepare(`
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status IN ('normal', 'late', 'early_leave') THEN 1 ELSE 0 END) as work_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(work_hours) as total_hours
      FROM attendance_records
      WHERE job_application_id = ?
    `).get(Number(id)) as {
      total_days: number;
      work_days: number;
      absent_days: number;
      total_hours: number;
    };

    const actualWorkDays = attendanceStats.work_days || 0;
    const wagePayable = Math.round(actualWorkDays * Number(application.daily_wage) * 100) / 100;

    db.prepare(`
      UPDATE job_applications
      SET worker_signoff = 1,
          worker_signoff_at = datetime('now', 'localtime'),
          notes = COALESCE(notes || '
', '') || '工人签收: 实际出勤' || ? || '天, 应发工资' || ? || '元'
      WHERE id = ?
    `).run(actualWorkDays, wagePayable, Number(id));

    const updated = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(Number(id)) as JobApplication;
    success(res, {
      ...updated,
      attendance: attendanceStats,
      actual_work_days: actualWorkDays,
      wage_payable: wagePayable,
    }, '完工签收成功');
  } catch (err) {
    const message = err instanceof Error ? err.message : '完工签收失败';
    fail(res, message);
  }
});

router.post('/applications/:id/confirm', authMiddleware(['enterprise']), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as { id: number } | undefined;
    if (!enterprise) {
      return fail(res, '企业信息不存在', 404);
    }

    const application = db.prepare(`
      SELECT ja.*, jp.enterprise_id, jp.daily_wage, jp.start_date, jp.end_date,
             wg.id as wage_guarantee_id
      FROM job_applications ja
      JOIN job_posts jp ON ja.job_post_id = jp.id
      LEFT JOIN wage_guarantees wg ON jp.id = wg.job_post_id
      WHERE ja.id = ? AND jp.enterprise_id = ?
    `).get(Number(id), enterprise.id) as ApplicationWithConfirm | undefined;

    if (!application) {
      return fail(res, '申请不存在或无权限操作', 404);
    }

    if (application.worker_signoff !== 1) {
      return fail(res, '工人尚未完成签收，请等待工人签收后再确认', 400);
    }

    if (application.enterprise_confirm === 1) {
      return fail(res, '您已完成完工确认', 400);
    }

    const attendanceStats = db.prepare(`
      SELECT 
        SUM(CASE WHEN status IN ('normal', 'late', 'early_leave') THEN 1 ELSE 0 END) as work_days
      FROM attendance_records
      WHERE job_application_id = ?
    `).get(Number(id)) as { work_days: number };

    const actualWorkDays = attendanceStats.work_days || 0;
    const releaseAmount = Math.round(actualWorkDays * Number(application.daily_wage) * 100) / 100;

    const scheduledReleaseDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
    const releaseNo = generateOrderNo('WR');

    const updateApplication = db.prepare(`
      UPDATE job_applications
      SET enterprise_confirm = 1,
          enterprise_confirm_at = datetime('now', 'localtime'),
          completion_date = datetime('now', 'localtime'),
          application_status = 'completed'
      WHERE id = ?
    `);

    const insertRelease = db.prepare(`
      INSERT INTO wage_releases (
        wage_guarantee_id, job_application_id, worker_id, release_no,
        amount, release_reason, scheduled_release_date, status
      ) VALUES (?, ?, ?, ?, ?, 'work_completion', ?, 'pending')
    `);

    const updateGuarantee = db.prepare(`
      UPDATE wage_guarantees
      SET total_released = total_released + ?,
          release_status = CASE 
            WHEN total_released + ? >= deposit_amount THEN 'fully_released' 
            ELSE 'partial_released' 
          END,
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    const updatePostStatus = db.prepare(`
      UPDATE job_posts
      SET status = CASE 
        WHEN (
          SELECT COUNT(*) FROM job_applications 
          WHERE job_post_id = ? AND application_status != 'completed'
        ) = 0 THEN 'completed'
        ELSE status
      END,
      updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    const updateEnterpriseStats = db.prepare(`
      UPDATE enterprises
      SET total_projects = total_projects + 1,
          total_workers_hired = total_workers_hired + 1,
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
        AND NOT EXISTS (
          SELECT 1 FROM job_applications ja2
          JOIN job_posts jp2 ON ja2.job_post_id = jp2.id
          WHERE jp2.enterprise_id = enterprises.id
            AND ja2.id = ?
            AND ja2.application_status = 'completed'
        )
    `);

    const transaction = db.transaction(() => {
      updateApplication.run(Number(id));
      insertRelease.run(
        application.wage_guarantee_id,
        Number(id),
        application.worker_id,
        releaseNo,
        releaseAmount,
        scheduledReleaseDate
      );
      if (application.wage_guarantee_id) {
        updateGuarantee.run(releaseAmount, releaseAmount, application.wage_guarantee_id);
      }
      updatePostStatus.run(application.job_post_id, application.job_post_id);
      updateEnterpriseStats.run(enterprise.id, Number(id));
    });

    transaction();

    const wageRelease = db.prepare('SELECT * FROM wage_releases WHERE release_no = ?').get(releaseNo);
    const updatedApplication = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(Number(id));

    success(res, {
      application: updatedApplication,
      wage_release: wageRelease,
      actual_work_days: actualWorkDays,
      release_amount: releaseAmount,
      scheduled_release_date: scheduledReleaseDate,
    }, '完工确认成功，工资将于T+1日释放');
  } catch (err) {
    const message = err instanceof Error ? err.message : '确认完工失败';
    fail(res, message);
  }
});

router.get('/applications/:id/contract', authMiddleware(), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { id } = req.params;

    const application = db.prepare(`
      SELECT ja.*, w.user_id as worker_user_id, e.user_id as enterprise_user_id
      FROM job_applications ja
      JOIN workers w ON ja.worker_id = w.id
      JOIN job_posts jp ON ja.job_post_id = jp.id
      JOIN enterprises e ON jp.enterprise_id = e.id
      WHERE ja.id = ?
    `).get(Number(id)) as ApplicationWithAuth | undefined;

    if (!application) {
      return fail(res, '申请不存在', 404);
    }

    let isAuthorized = false;
    if (userRole === 'worker' && application.worker_user_id === userId) {
      isAuthorized = true;
    } else if (userRole === 'enterprise' && application.enterprise_user_id === userId) {
      isAuthorized = true;
    } else if (userRole === 'admin') {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return fail(res, '无权限查看该合同', 403);
    }

    const contract = db.prepare(`
      SELECT c.*, jp.title, jp.daily_wage, jp.start_date, jp.end_date, jp.work_location,
             e.company_name, e.legal_person, e.company_address, e.company_phone,
             u.real_name as worker_name, u.id_card_number as worker_id_card, u.phone as worker_phone
      FROM contracts c
      JOIN job_applications ja ON c.job_application_id = ja.id
      JOIN job_posts jp ON ja.job_post_id = jp.id
      JOIN enterprises e ON jp.enterprise_id = e.id
      JOIN workers w ON ja.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE c.job_application_id = ?
    `).get(Number(id));

    if (!contract) {
      return fail(res, '合同尚未创建', 404);
    }

    success(res, contract);
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取合同详情失败';
    fail(res, message);
  }
});

router.get('/applications/:id/attendance', authMiddleware(), (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { id } = req.params;
    const { page = 1, pageSize = 50 } = req.query;

    const application = db.prepare(`
      SELECT ja.*, w.user_id as worker_user_id, e.user_id as enterprise_user_id
      FROM job_applications ja
      JOIN workers w ON ja.worker_id = w.id
      JOIN job_posts jp ON ja.job_post_id = jp.id
      JOIN enterprises e ON jp.enterprise_id = e.id
      WHERE ja.id = ?
    `).get(Number(id)) as ApplicationWithAuth | undefined;

    if (!application) {
      return fail(res, '申请不存在', 404);
    }

    let isAuthorized = false;
    if (userRole === 'worker' && application.worker_user_id === userId) {
      isAuthorized = true;
    } else if (userRole === 'enterprise' && application.enterprise_user_id === userId) {
      isAuthorized = true;
    } else if (userRole === 'admin') {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return fail(res, '无权限查看该考勤记录', 403);
    }

    const totalRow = db.prepare(`
      SELECT COUNT(*) as count FROM attendance_records WHERE job_application_id = ?
    `).get(Number(id)) as { count: number };

    const offset = (Number(page) - 1) * Number(pageSize);
    const attendance = db.prepare(`
      SELECT * FROM attendance_records
      WHERE job_application_id = ?
      ORDER BY date DESC
      LIMIT ? OFFSET ?
    `).all(Number(id), Number(pageSize), offset);

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END) as normal_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN status = 'early_leave' THEN 1 ELSE 0 END) as early_leave_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_days,
        SUM(work_hours) as total_work_hours,
        AVG(work_hours) as avg_work_hours
      FROM attendance_records
      WHERE job_application_id = ?
    `).get(Number(id));

    success(res, { records: attendance, statistics: stats }, 'success', {
      total: totalRow.count,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取考勤记录失败';
    fail(res, message);
  }
});

export default router;
