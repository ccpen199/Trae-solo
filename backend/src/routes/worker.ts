import { Router, Request, Response } from 'express';
import dayjs from 'dayjs';
import db from '../utils/db';
import { success, fail } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import type { Worker, Certificate, AttendanceRecord, PeerReview, WageRelease, JobPost } from '../types';

const router = Router();

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.get('/profile', authMiddleware(['worker']), (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const worker = db.prepare(`
    SELECT w.*, u.phone, u.real_name, u.id_card_number, u.avatar_url, u.face_verified, u.status
    FROM workers w
    INNER JOIN users u ON w.user_id = u.id
    WHERE w.user_id = ?
  `).get(userId);

  if (!worker) {
    return fail(res, '工人资料不存在', 404, 404);
  }

  return success(res, worker);
});

router.put('/profile', authMiddleware(['worker']), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const {
    gender,
    age,
    work_years,
    hometown,
    current_location,
    primary_skill,
    secondary_skills,
    daily_wage_expected,
    bio,
    emergency_contact,
    emergency_phone,
    avatar_url,
  } = req.body;

  const existing = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as Worker | undefined;
  if (!existing) {
    return fail(res, '工人资料不存在', 404, 404);
  }

  if (gender !== undefined && gender !== 'male' && gender !== 'female') {
    return fail(res, '性别参数不合法');
  }
  if (age !== undefined && (age < 16 || age > 100)) {
    return fail(res, '年龄参数不合法');
  }
  if (work_years !== undefined && work_years < 0) {
    return fail(res, '工作年限参数不合法');
  }
  if (daily_wage_expected !== undefined && daily_wage_expected < 0) {
    return fail(res, '期望日薪参数不合法');
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (gender !== undefined) { fields.push('gender = ?'); values.push(gender); }
  if (age !== undefined) { fields.push('age = ?'); values.push(age); }
  if (work_years !== undefined) { fields.push('work_years = ?'); values.push(work_years); }
  if (hometown !== undefined) { fields.push('hometown = ?'); values.push(hometown); }
  if (current_location !== undefined) { fields.push('current_location = ?'); values.push(current_location); }
  if (primary_skill !== undefined) { fields.push('primary_skill = ?'); values.push(primary_skill); }
  if (secondary_skills !== undefined) {
    fields.push('secondary_skills = ?');
    values.push(typeof secondary_skills === 'string' ? secondary_skills : JSON.stringify(secondary_skills));
  }
  if (daily_wage_expected !== undefined) { fields.push('daily_wage_expected = ?'); values.push(daily_wage_expected); }
  if (bio !== undefined) { fields.push('bio = ?'); values.push(bio); }
  if (emergency_contact !== undefined) { fields.push('emergency_contact = ?'); values.push(emergency_contact); }
  if (emergency_phone !== undefined) { fields.push('emergency_phone = ?'); values.push(emergency_phone); }

  fields.push('updated_at = datetime(\'now\', \'localtime\')');
  values.push(userId);

  if (fields.length > 1) {
    db.prepare(`UPDATE workers SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);
  }

  if (avatar_url !== undefined) {
    db.prepare('UPDATE users SET avatar_url = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(avatar_url, userId);
  }

  const worker = db.prepare(`
    SELECT w.*, u.phone, u.real_name, u.id_card_number, u.avatar_url, u.face_verified, u.status
    FROM workers w
    INNER JOIN users u ON w.user_id = u.id
    WHERE w.user_id = ?
  `).get(userId);

  return success(res, worker, '资料更新成功');
});

router.post('/certificates', authMiddleware(['worker']), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { cert_type, cert_name, cert_number, issue_date, expire_date, cert_image_url } = req.body;

  if (!cert_type || !cert_name) {
    return fail(res, '证书类型和名称不能为空');
  }

  const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as Worker | undefined;
  if (!worker) {
    return fail(res, '工人资料不存在', 404, 404);
  }

  const result = db.prepare(`
    INSERT INTO certificates (worker_id, cert_type, cert_name, cert_number, issue_date, expire_date, cert_image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(worker.id, cert_type, cert_name, cert_number || null, issue_date || null, expire_date || null, cert_image_url || null);

  const certificate = db.prepare('SELECT * FROM certificates WHERE id = ?').get(Number(result.lastInsertRowid));
  return success(res, certificate, '证书上传成功');
});

router.get('/certificates', authMiddleware(['worker']), (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as Worker | undefined;
  if (!worker) {
    return fail(res, '工人资料不存在', 404, 404);
  }

  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM certificates WHERE worker_id = ?');
  const { total } = countStmt.get(worker.id) as { total: number };

  const certificates = db.prepare(`
    SELECT * FROM certificates
    WHERE worker_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(worker.id, pageSize, offset) as Certificate[];

  return success(res, certificates, 'success', { total, page, pageSize });
});

router.delete('/certificates/:id', authMiddleware(['worker']), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const certId = Number(req.params.id);

  const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as Worker | undefined;
  if (!worker) {
    return fail(res, '工人资料不存在', 404, 404);
  }

  const cert = db.prepare('SELECT id, worker_id FROM certificates WHERE id = ?').get(certId) as Certificate | undefined;
  if (!cert) {
    return fail(res, '证书不存在', 404, 404);
  }

  if (cert.worker_id !== worker.id) {
    return fail(res, '无权删除该证书', 403, 403);
  }

  if (cert.verified === 1) {
    return fail(res, '已审核的证书无法删除');
  }

  db.prepare('DELETE FROM certificates WHERE id = ?').run(certId);
  return success(res, null, '证书删除成功');
});

router.post('/attendance/:applicationId/check-in', authMiddleware(['worker']), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const applicationId = Number(req.params.applicationId);
  const { latitude, longitude, offline_mode } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return fail(res, '请提供打卡位置经纬度');
  }

  const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as Worker | undefined;
  if (!worker) {
    return fail(res, '工人资料不存在', 404, 404);
  }

  const application = db.prepare(`
    SELECT ja.*, jp.latitude, jp.longitude, jp.geofence_radius, jp.status as job_status, jp.start_date, jp.end_date
    FROM job_applications ja
    INNER JOIN job_posts jp ON ja.job_post_id = jp.id
    WHERE ja.id = ? AND ja.worker_id = ?
  `).get(applicationId, worker.id) as any;

  if (!application) {
    return fail(res, '报名记录不存在', 404, 404);
  }

  if (application.application_status !== 'accepted') {
    return fail(res, '当前报名状态不允许打卡');
  }

  const today = dayjs().format('YYYY-MM-DD');

  if (application.job_status !== 'in_progress' && application.job_status !== 'open') {
    return fail(res, '项目当前状态不允许打卡');
  }

  if (today < application.start_date || today > application.end_date) {
    return fail(res, '不在项目工期范围内');
  }

  let checkInValid = 0;
  let distance = null;

  if (application.latitude !== null && application.longitude !== null && application.geofence_radius > 0) {
    distance = haversineDistance(latitude, longitude, application.latitude, application.longitude);
    checkInValid = distance <= application.geofence_radius ? 1 : 0;
  } else {
    checkInValid = 1;
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const checkInTime = dayjs().format('HH:mm:ss');

  let status = 'normal';
  if (checkInValid === 0 && !offline_mode) {
    status = 'absent';
  } else {
    const parts = (application.work_hours || '').split('-');
    if (parts.length === 2) {
      const workStart = parts[0].trim();
      if (checkInTime > workStart) {
        status = 'late';
      }
    }
  }

  const existing = db.prepare(`
    SELECT id FROM attendance_records
    WHERE job_application_id = ? AND date = ?
  `).get(applicationId, today);

  if (existing) {
    return fail(res, '今日已完成上班打卡');
  }

  db.prepare(`
    INSERT INTO attendance_records
    (job_application_id, worker_id, job_post_id, date, check_in_time, check_in_lat, check_in_lng, check_in_valid, offline_mode, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    applicationId,
    worker.id,
    application.job_post_id,
    today,
    now,
    latitude,
    longitude,
    checkInValid,
    offline_mode ? 1 : 0,
    status
  );

  const record = db.prepare(`
    SELECT * FROM attendance_records
    WHERE job_application_id = ? AND date = ?
  `).get(applicationId, today) as AttendanceRecord;

  return success(res, { ...record, distance }, '上班打卡成功');
});

router.post('/attendance/:applicationId/check-out', authMiddleware(['worker']), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const applicationId = Number(req.params.applicationId);
  const { latitude, longitude } = req.body;

  const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as Worker | undefined;
  if (!worker) {
    return fail(res, '工人资料不存在', 404, 404);
  }

  const today = dayjs().format('YYYY-MM-DD');
  const record = db.prepare(`
    SELECT * FROM attendance_records
    WHERE job_application_id = ? AND worker_id = ? AND date = ?
  `).get(applicationId, worker.id, today) as AttendanceRecord | undefined;

  if (!record) {
    return fail(res, '今日未进行上班打卡');
  }

  if (record.check_out_time) {
    return fail(res, '今日已完成下班打卡');
  }

  const application = db.prepare(`
    SELECT jp.latitude, jp.longitude, jp.geofence_radius, jp.work_hours, jp.daily_wage
    FROM job_applications ja
    INNER JOIN job_posts jp ON ja.job_post_id = jp.id
    WHERE ja.id = ?
  `).get(applicationId) as any;

  let checkOutValid = 0;
  let distance = null;

  if (latitude !== undefined && longitude !== undefined) {
    if (application.latitude !== null && application.longitude !== null && application.geofence_radius > 0) {
      distance = haversineDistance(latitude, longitude, application.latitude, application.longitude);
      checkOutValid = distance <= application.geofence_radius ? 1 : 0;
    } else {
      checkOutValid = 1;
    }
  } else {
    checkOutValid = record.check_in_valid;
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const checkOutTime = dayjs().format('HH:mm:ss');

  let status = record.status;
  if (status === 'normal' && application.work_hours) {
    const parts = application.work_hours.split('-');
    if (parts.length === 2) {
      const workEnd = parts[1].trim();
      if (checkOutTime < workEnd) {
        status = 'early_leave';
      }
    }
  }

  let workHours = 0;
  if (record.check_in_time) {
    const checkIn = dayjs(record.check_in_time, 'YYYY-MM-DD HH:mm:ss');
    const checkOut = dayjs(now, 'YYYY-MM-DD HH:mm:ss');
    workHours = checkOut.diff(checkIn, 'hour', true);
    workHours = Math.max(0, Math.round(workHours * 100) / 100);
  }

  db.prepare(`
    UPDATE attendance_records
    SET check_out_time = ?, check_out_lat = ?, check_out_lng = ?, check_out_valid = ?, work_hours = ?, status = ?
    WHERE id = ?
  `).run(now, latitude ?? null, longitude ?? null, checkOutValid, workHours, status, record.id);

  const updatedRecord = db.prepare('SELECT * FROM attendance_records WHERE id = ?').get(record.id) as AttendanceRecord;

  return success(res, { ...updatedRecord, distance }, '下班打卡成功');
});

router.get('/attendance', authMiddleware(['worker']), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { start_date, end_date, job_application_id } = req.query;

  const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as Worker | undefined;
  if (!worker) {
    return fail(res, '工人资料不存在', 404, 404);
  }

  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = ['worker_id = ?'];
  const params: any[] = [worker.id];

  if (start_date) {
    conditions.push('date >= ?');
    params.push(start_date);
  }
  if (end_date) {
    conditions.push('date <= ?');
    params.push(end_date);
  }
  if (job_application_id) {
    conditions.push('job_application_id = ?');
    params.push(Number(job_application_id));
  }

  const whereClause = conditions.join(' AND ');

  const { total } = db.prepare(`SELECT COUNT(*) as total FROM attendance_records WHERE ${whereClause}`).get(...params) as { total: number };

  const records = db.prepare(`
    SELECT ar.*, jp.title as job_title, jp.work_location
    FROM attendance_records ar
    INNER JOIN job_posts jp ON ar.job_post_id = jp.id
    WHERE ${whereClause}
    ORDER BY ar.date DESC, ar.check_in_time DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_days,
      SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END) as normal_days,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
      SUM(CASE WHEN status = 'early_leave' THEN 1 ELSE 0 END) as early_leave_days,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
      SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_days,
      SUM(work_hours) as total_work_hours
    FROM attendance_records
    WHERE ${whereClause}
  `).get(...params);

  return success(res, { list: records, summary }, 'success', { total, page, pageSize });
});

router.get('/craftsman-score', authMiddleware(['worker']), (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const worker = db.prepare(`
    SELECT w.*, u.real_name
    FROM workers w
    INNER JOIN users u ON w.user_id = u.id
    WHERE w.user_id = ?
  `).get(userId) as (Worker & { real_name?: string }) | undefined;

  if (!worker) {
    return fail(res, '工人资料不存在', 404, 404);
  }

  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  const { total } = db.prepare('SELECT COUNT(*) as total FROM craftsman_ratings WHERE worker_id = ?').get(worker.id) as { total: number };

  const history = db.prepare(`
    SELECT * FROM craftsman_ratings
    WHERE worker_id = ?
    ORDER BY rating_date DESC
    LIMIT ? OFFSET ?
  `).all(worker.id, pageSize, offset);

  const qualityStats = db.prepare(`
    SELECT
      AVG(quality_score) as avg_quality_score,
      COUNT(*) as total_inspections
    FROM quality_inspections
    WHERE worker_id = ?
  `).get(worker.id);

  const peerStats = db.prepare(`
    SELECT
      AVG(review_score) as avg_review_score,
      AVG(teamwork_score) as avg_teamwork_score,
      AVG(skill_score) as avg_skill_score,
      AVG(attitude_score) as avg_attitude_score,
      COUNT(*) as total_reviews
    FROM peer_reviews
    WHERE target_worker_id = ?
  `).get(worker.id);

  const attendanceStats = db.prepare(`
    SELECT
      COUNT(*) as total_days,
      SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END) as normal_days
    FROM attendance_records
    WHERE worker_id = ?
  `).get(worker.id);

  return success(res, {
    craftsman_level: worker.craftsman_level,
    craftsman_score: worker.craftsman_score,
    quality_score: worker.quality_score,
    peer_score: worker.peer_score,
    attendance_score: worker.attendance_score,
    total_projects: worker.total_projects,
    total_work_days: worker.total_work_days,
    quality_detail: qualityStats,
    peer_detail: peerStats,
    attendance_detail: attendanceStats,
    history: {
      list: history,
      total,
      page,
      pageSize,
    },
  });
});

router.get('/reviews', authMiddleware(['worker']), (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as Worker | undefined;
  if (!worker) {
    return fail(res, '工人资料不存在', 404, 404);
  }

  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;

  const { total } = db.prepare('SELECT COUNT(*) as total FROM peer_reviews WHERE target_worker_id = ?').get(worker.id) as { total: number };

  const reviews = db.prepare(`
    SELECT
      pr.*,
      jp.title as job_title,
      ru.real_name as reviewer_name,
      ru.avatar_url as reviewer_avatar
    FROM peer_reviews pr
    INNER JOIN job_posts jp ON pr.job_post_id = jp.id
    INNER JOIN workers rw ON pr.reviewer_worker_id = rw.id
    INNER JOIN users ru ON rw.user_id = ru.id
    WHERE pr.target_worker_id = ?
    ORDER BY pr.created_at DESC
    LIMIT ? OFFSET ?
  `).all(worker.id, pageSize, offset);

  const stats = db.prepare(`
    SELECT
      AVG(review_score) as avg_score,
      AVG(teamwork_score) as avg_teamwork,
      AVG(skill_score) as avg_skill,
      AVG(attitude_score) as avg_attitude,
      COUNT(*) as total_count,
      SUM(CASE WHEN review_score >= 4 THEN 1 ELSE 0 END) as good_count
    FROM peer_reviews
    WHERE target_worker_id = ?
  `).get(worker.id);

  return success(res, { list: reviews, stats }, 'success', { total, page, pageSize });
});

router.post('/peer-review', authMiddleware(['worker']), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { job_post_id, target_worker_id, review_score, teamwork_score, skill_score, attitude_score, review_content } = req.body;

  if (!job_post_id || !target_worker_id || review_score === undefined) {
    return fail(res, '请填写完整的评价信息');
  }

  const score = Number(review_score);
  if (isNaN(score) || score < 0 || score > 5) {
    return fail(res, '综合评分范围为 0-5');
  }

  const teamwork = Number(teamwork_score) || 0;
  const skill = Number(skill_score) || 0;
  const attitude = Number(attitude_score) || 0;

  const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as Worker | undefined;
  if (!worker) {
    return fail(res, '工人资料不存在', 404, 404);
  }

  if (worker.id === Number(target_worker_id)) {
    return fail(res, '不能对自己进行评价');
  }

  const targetWorker = db.prepare('SELECT id FROM workers WHERE id = ?').get(target_worker_id) as Worker | undefined;
  if (!targetWorker) {
    return fail(res, '被评价工人不存在', 404, 404);
  }

  const reviewerApp = db.prepare(`
    SELECT application_status FROM job_applications
    WHERE job_post_id = ? AND worker_id = ? AND application_status IN ('accepted', 'completed')
  `).get(Number(job_post_id), worker.id);

  if (!reviewerApp) {
    return fail(res, '您未参与该项目，无权进行评价');
  }

  const targetApp = db.prepare(`
    SELECT application_status FROM job_applications
    WHERE job_post_id = ? AND worker_id = ? AND application_status IN ('accepted', 'completed')
  `).get(Number(job_post_id), Number(target_worker_id));

  if (!targetApp) {
    return fail(res, '被评价工人未参与该项目');
  }

  const existing = db.prepare(`
    SELECT id FROM peer_reviews
    WHERE job_post_id = ? AND reviewer_worker_id = ? AND target_worker_id = ?
  `).get(Number(job_post_id), worker.id, Number(target_worker_id));

  if (existing) {
    return fail(res, '您已评价过该工友');
  }

  db.prepare(`
    INSERT INTO peer_reviews
    (job_post_id, reviewer_worker_id, target_worker_id, review_score, teamwork_score, skill_score, attitude_score, review_content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(Number(job_post_id), worker.id, Number(target_worker_id), score, teamwork, skill, attitude, review_content || null);

  const peerStats = db.prepare(`
    SELECT
      AVG(review_score) as avg_score
    FROM peer_reviews
    WHERE target_worker_id = ?
  `).get(Number(target_worker_id)) as { avg_score: number };

  const newPeerScore = peerStats.avg_score ? Math.round(peerStats.avg_score * 20) : 0;

  const current = db.prepare('SELECT quality_score, peer_score, attendance_score FROM workers WHERE id = ?').get(Number(target_worker_id)) as any;
  const newOverall = Math.round((current.quality_score + newPeerScore + current.attendance_score) / 3);
  let newLevel = 1;
  if (newOverall >= 80) newLevel = 5;
  else if (newOverall >= 65) newLevel = 4;
  else if (newOverall >= 50) newLevel = 3;
  else if (newOverall >= 30) newLevel = 2;

  db.prepare(`
    UPDATE workers
    SET peer_score = ?, craftsman_score = ?, craftsman_level = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(newPeerScore, newOverall, newLevel, Number(target_worker_id));

  return success(res, null, '评价提交成功');
});

router.get('/wages', authMiddleware(['worker']), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { status } = req.query;

  const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(userId) as Worker | undefined;
  if (!worker) {
    return fail(res, '工人资料不存在', 404, 404);
  }

  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = ['wr.worker_id = ?'];
  const params: any[] = [worker.id];

  if (status) {
    conditions.push('wr.status = ?');
    params.push(status);
  }

  const whereClause = conditions.join(' AND ');

  const { total } = db.prepare(`
    SELECT COUNT(*) as total FROM wage_releases wr WHERE ${whereClause}
  `).get(...params) as { total: number };

  const list = db.prepare(`
    SELECT
      wr.*,
      jp.title as job_title,
      jp.work_location,
      jp.daily_wage,
      wp.status as payment_status,
      wp.payment_method,
      wp.amount as paid_amount,
      wp.payslip_url
    FROM wage_releases wr
    INNER JOIN job_applications ja ON ja.id = wr.job_application_id
    INNER JOIN job_posts jp ON ja.job_post_id = jp.id
    LEFT JOIN wage_payments wp ON wp.wage_release_id = wr.id
    WHERE ${whereClause}
    ORDER BY wr.scheduled_release_date DESC, wr.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  const summary = db.prepare(`
    SELECT
      SUM(CASE WHEN wr.status IN ('pending', 'processing', 'held') THEN wr.amount ELSE 0 END) as pending_total,
      SUM(CASE WHEN wr.status = 'released' THEN wr.amount ELSE 0 END) as released_total,
      SUM(wr.amount) as total_amount,
      COUNT(*) as total_count
    FROM wage_releases wr
    WHERE wr.worker_id = ?
  `).get(worker.id);

  return success(res, { list, summary }, 'success', { total, page, pageSize });
});

export default router;
