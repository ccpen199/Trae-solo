import { Router } from 'express';
import multer from 'multer';
import { getDb } from '../db/init.js';
import { auth, requireRole } from '../middleware/auth.js';
import { success, error, paginate } from '../utils/response.js';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'data/uploads/');
    },
    filename(req, file, cb) {
      const ext = file.originalname.split('.').pop();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
    },
  }),
});

function addAuditLog(userId, action, targetType, targetId, detail, ip) {
  const db = getDb();
  db.prepare(
    `INSERT INTO audit_logs (user_id, action, target_type, target_id, detail, ip_address) VALUES (?,?,?,?,?,?)`
  ).run(userId, action, targetType, targetId, JSON.stringify(detail || {}), ip || '');
}

function formatJob(row) {
  if (!row) return null;
  return {
    ...row,
    review_site_photos: JSON.parse(row.review_site_photos || '[]'),
    required_skills: JSON.parse(row.required_skills || '[]'),
  };
}

function formatApplication(row) {
  if (!row) return null;
  return {
    ...row,
    identity_tags: JSON.parse(row.identity_tags || '[]'),
    skill_certs: JSON.parse(row.skill_certs || '[]'),
  };
}

function addReviewLog(jobId, reviewerId, reviewType, oldStatus, newStatus, result) {
  const db = getDb();
  db.prepare(
    `INSERT INTO job_review_logs (job_id, reviewer_id, review_type, old_status, new_status, result) VALUES (?,?,?,?,?,?)`
  ).run(jobId, reviewerId, reviewType, oldStatus, newStatus, result || '');
}

router.get('/', (req, res) => {
  const { category, pay_type, location, safety_level, status, page = 1, pageSize = 10 } = req.query;
  const db = getDb();
  const conditions = [];
  const params = [];
  if (category) { conditions.push('j.category = ?'); params.push(category); }
  if (pay_type) { conditions.push('j.pay_type = ?'); params.push(pay_type); }
  if (location) { conditions.push('j.location LIKE ?'); params.push(`%${location}%`); }
  if (safety_level) { conditions.push('j.safety_level = ?'); params.push(Number(safety_level)); }
  if (status) { conditions.push('j.status = ?'); params.push(status); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM jobs j ${where}`).get(...params).cnt;
  const offset = (page - 1) * pageSize;
  const list = db.prepare(
    `SELECT j.*, u.nickname as employer_nickname, u.employer_name FROM jobs j LEFT JOIN users u ON j.employer_id = u.id ${where} ORDER BY j.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset).map(formatJob);
  res.json(paginate(list, total, page, pageSize));
});

router.post('/', auth, requireRole('employer'), (req, res) => {
  const {
    title, description, category, pay_type, pay_amount, pay_unit,
    location, lat, lng, work_start, work_end, safety_level,
    required_skills, required_count,
  } = req.body;
  if (!title || !pay_type) {
    return res.status(400).json(error('标题和薪资类型为必填'));
  }
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO jobs (employer_id, title, description, category, pay_type, pay_amount, pay_unit, location, lat, lng, work_start, work_end, safety_level, required_skills, required_count, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'pending_review')`
  ).run(
    req.user.id, title, description || '', category || '', pay_type,
    pay_amount || 0, pay_unit || '', location || '', lat || 0, lng || 0,
    work_start || '', work_end || '', safety_level || 1,
    JSON.stringify(required_skills || []), required_count || 1
  );
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
  addAuditLog(req.user.id, 'create_job', 'job', result.lastInsertRowid, { title }, req.ip);
  res.json(success(formatJob(job)));
});

router.get('/my-applications', auth, requireRole('worker'), (req, res) => {
  const db = getDb();
  const rows = db.prepare(
    `SELECT ja.*,
            j.employer_id as job_employer_id,
            j.title as job_title,
            j.description as job_description,
            j.category as job_category,
            j.pay_type as job_pay_type,
            j.pay_amount as job_pay_amount,
            j.pay_unit as job_pay_unit,
            j.location as job_location,
            j.lat as job_lat,
            j.lng as job_lng,
            j.work_start as job_work_start,
            j.work_end as job_work_end,
            j.safety_level as job_safety_level,
            j.status as job_status,
            j.review_ocr_status as job_review_ocr_status,
            j.review_ocr_result as job_review_ocr_result,
            j.review_site_status as job_review_site_status,
            j.review_site_photos as job_review_site_photos,
            j.required_skills as job_required_skills,
            j.required_count as job_required_count,
            j.applied_count as job_applied_count,
            j.created_at as job_created_at,
            j.updated_at as job_updated_at,
            u.nickname as employer_nickname,
            u.employer_name as employer_name
     FROM job_applications ja
     LEFT JOIN jobs j ON ja.job_id = j.id
     LEFT JOIN users u ON j.employer_id = u.id
     WHERE ja.worker_id = ?
     ORDER BY ja.created_at DESC`
  ).all(req.user.id);

  const list = rows.map((row) => ({
    id: row.id,
    job_id: row.job_id,
    worker_id: row.worker_id,
    status: row.status,
    cover_letter: row.cover_letter,
    created_at: row.created_at,
    updated_at: row.updated_at,
    job: formatJob({
      id: row.job_id,
      employer_id: row.job_employer_id,
      title: row.job_title,
      description: row.job_description,
      category: row.job_category,
      pay_type: row.job_pay_type,
      pay_amount: row.job_pay_amount,
      pay_unit: row.job_pay_unit,
      location: row.job_location,
      lat: row.job_lat,
      lng: row.job_lng,
      work_start: row.job_work_start,
      work_end: row.job_work_end,
      safety_level: row.job_safety_level,
      status: row.job_status,
      review_ocr_status: row.job_review_ocr_status,
      review_ocr_result: row.job_review_ocr_result,
      review_site_status: row.job_review_site_status,
      review_site_photos: row.job_review_site_photos,
      required_skills: row.job_required_skills,
      required_count: row.job_required_count,
      applied_count: row.job_applied_count,
      employer_nickname: row.employer_nickname,
      employer_name: row.employer_name,
      created_at: row.job_created_at,
      updated_at: row.job_updated_at,
    }),
  }));

  res.json(success(list));
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const job = db.prepare(
    `SELECT j.*,
            u.nickname as employer_nickname,
            u.avatar as employer_avatar,
            u.employer_name,
            u.employer_type,
            u.business_license,
            u.created_at as employer_created_at
     FROM jobs j
     LEFT JOIN users u ON j.employer_id = u.id
     WHERE j.id = ?`
  ).get(req.params.id);
  if (!job) return res.status(404).json(error('职位不存在'));

  const reviewLogs = db.prepare(
    `SELECT rl.*, u.nickname as reviewer_nickname
     FROM job_review_logs rl
     LEFT JOIN users u ON rl.reviewer_id = u.id
     WHERE rl.job_id = ?
     ORDER BY rl.created_at DESC`
  ).all(req.params.id);

  res.json(success({
    ...formatJob(job),
    review_logs: reviewLogs,
  }));
});

router.put('/:id', auth, (req, res) => {
  const db = getDb();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json(error('职位不存在'));
  const isAdminLike = ['admin', 'platform', 'ops'].includes(req.user.role);
  if (job.employer_id !== req.user.id && !isAdminLike) return res.status(403).json(error('无权修改此职位'));
  const fields = [];
  const values = [];
  const allowed = ['title', 'description', 'category', 'pay_type', 'pay_amount', 'pay_unit', 'location', 'lat', 'lng', 'work_start', 'work_end', 'safety_level', 'required_skills', 'required_count', 'status'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(key === 'required_skills' ? JSON.stringify(req.body[key]) : req.body[key]);
    }
  }
  if (fields.length === 0) return res.status(400).json(error('无更新字段'));
  fields.push("updated_at = datetime('now','localtime')");
  values.push(req.params.id);
  db.prepare(`UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  addAuditLog(req.user.id, 'update_job', 'job', Number(req.params.id), req.body, req.ip);
  res.json(success(formatJob(updated)));
});

router.post('/:id/apply', auth, requireRole('worker'), (req, res) => {
  const db = getDb();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json(error('职位不存在'));
  if (job.status !== 'approved') return res.status(400).json(error('该职位未通过审核，无法申请'));
  const existing = db.prepare('SELECT id FROM job_applications WHERE job_id = ? AND worker_id = ?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json(error('已申请过该职位'));
  const { cover_letter } = req.body;
  const result = db.prepare(
    `INSERT INTO job_applications (job_id, worker_id, cover_letter) VALUES (?,?,?)`
  ).run(Number(req.params.id), req.user.id, cover_letter || '');
  db.prepare('UPDATE jobs SET applied_count = applied_count + 1 WHERE id = ?').run(Number(req.params.id));
  addAuditLog(req.user.id, 'apply_job', 'job_application', result.lastInsertRowid, { job_id: Number(req.params.id) }, req.ip);
  const app = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(result.lastInsertRowid);
  res.json(success(app));
});

router.get('/:id/applications', auth, (req, res) => {
  const db = getDb();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json(error('职位不存在'));
  if (req.user.role === 'worker') {
    const ownApplications = db.prepare(
      `SELECT ja.*,
              u.nickname,
              u.avatar,
              u.identity_tags,
              u.skill_certs,
              u.credit_score,
              u.phone as worker_phone
       FROM job_applications ja
       LEFT JOIN users u ON ja.worker_id = u.id
       WHERE ja.job_id = ? AND ja.worker_id = ?
       ORDER BY ja.created_at DESC`
    ).all(req.params.id, req.user.id).map(formatApplication);
    return res.json(success(ownApplications));
  }
  if (job.employer_id !== req.user.id && !['admin', 'platform', 'ops'].includes(req.user.role)) {
    return res.status(403).json(error('无权查看申请人'));
  }
  const list = db.prepare(
    `SELECT ja.*,
            u.nickname,
            u.avatar,
            u.identity_tags,
            u.skill_certs,
            u.credit_score,
            u.phone as worker_phone
     FROM job_applications ja
     LEFT JOIN users u ON ja.worker_id = u.id
     WHERE ja.job_id = ?
     ORDER BY ja.created_at DESC`
  ).all(req.params.id).map(formatApplication);
  res.json(success(list));
});

router.put('/:id/applications/:appId', auth, requireRole('employer'), (req, res) => {
  const db = getDb();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json(error('职位不存在'));
  if (job.employer_id !== req.user.id) return res.status(403).json(error('无权操作'));
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json(error('状态仅支持 accepted 或 rejected'));
  }
  db.prepare("UPDATE job_applications SET status = ?, updated_at = datetime('now','localtime') WHERE id = ? AND job_id = ?")
    .run(status, Number(req.params.appId), Number(req.params.id));
  if (status === 'accepted') {
    const app = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(Number(req.params.appId));
    if (app) {
      db.prepare(
        `INSERT OR IGNORE INTO chat_conversations (job_id, employer_id, worker_id) VALUES (?,?,?)`
      ).run(Number(req.params.id), req.user.id, app.worker_id);
    }
  }
  addAuditLog(req.user.id, `application_${status}`, 'job_application', Number(req.params.appId), { job_id: Number(req.params.id) }, req.ip);
  const updated = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(Number(req.params.appId));
  res.json(success(updated));
});

router.post('/:id/review-ocr', auth, requireRole('employer'), upload.single('license'), (req, res) => {
  if (!req.file) return res.status(400).json(error('请上传营业执照文件'));
  const db = getDb();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json(error('职位不存在'));
  if (job.employer_id !== req.user.id) return res.status(403).json(error('无权操作'));
  db.prepare(
    `UPDATE jobs SET review_ocr_status = 'passed', review_ocr_result = ?, updated_at = datetime('now','localtime') WHERE id = ?`
  ).run(req.file.path, Number(req.params.id));
  addReviewLog(Number(req.params.id), req.user.id, 'ocr', job.review_ocr_status, 'passed', req.file.originalname);
  addAuditLog(req.user.id, 'review_ocr', 'job', Number(req.params.id), { file: req.file.path }, req.ip);
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  res.json(success(formatJob(updated)));
});

router.post('/:id/review-site', auth, requireRole('employer'), upload.array('photos', 5), (req, res) => {
  const db = getDb();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json(error('职位不存在'));
  if (job.employer_id !== req.user.id) return res.status(403).json(error('无权操作'));
  const photos = (req.files || []).map(f => f.path);
  db.prepare(
    `UPDATE jobs SET review_site_status = 'passed', review_site_photos = ?, updated_at = datetime('now','localtime') WHERE id = ?`
  ).run(JSON.stringify(photos), Number(req.params.id));
  addReviewLog(Number(req.params.id), req.user.id, 'site', job.review_site_status, 'passed', JSON.stringify(photos));
  addAuditLog(req.user.id, 'review_site', 'job', Number(req.params.id), { photos }, req.ip);
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  res.json(success(formatJob(updated)));
});

router.post('/:id/review-ocr-admin', auth, requireRole('admin', 'platform', 'ops'), (req, res) => {
  const { status, result } = req.body;
  if (!['passed', 'failed'].includes(status)) {
    return res.status(400).json(error('状态仅支持 passed 或 failed'));
  }
  const db = getDb();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json(error('职位不存在'));
  db.prepare(
    `UPDATE jobs SET review_ocr_status = ?, review_ocr_result = ?, updated_at = datetime('now','localtime') WHERE id = ?`
  ).run(status, result || '', Number(req.params.id));
  addReviewLog(Number(req.params.id), req.user.id, 'ocr', job.review_ocr_status, status, result || '');
  addAuditLog(req.user.id, 'review_ocr_admin', 'job', Number(req.params.id), { status, result }, req.ip);
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  res.json(success(formatJob(updated)));
});

router.post('/:id/review-site-admin', auth, requireRole('admin', 'platform', 'ops'), (req, res) => {
  const { status, result } = req.body;
  if (!['passed', 'failed'].includes(status)) {
    return res.status(400).json(error('状态仅支持 passed 或 failed'));
  }
  const db = getDb();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json(error('职位不存在'));
  db.prepare(
    `UPDATE jobs SET review_site_status = ?, updated_at = datetime('now','localtime') WHERE id = ?`
  ).run(status, Number(req.params.id));
  addReviewLog(Number(req.params.id), req.user.id, 'site', job.review_site_status, status, result || '');
  addAuditLog(req.user.id, 'review_site_admin', 'job', Number(req.params.id), { status, result }, req.ip);
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  res.json(success(formatJob(updated)));
});

router.post('/:id/review-status', auth, requireRole('admin', 'platform', 'ops'), (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'closed'].includes(status)) {
    return res.status(400).json(error('状态仅支持 approved、rejected 或 closed'));
  }
  const db = getDb();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json(error('职位不存在'));
  db.prepare(
    `UPDATE jobs SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?`
  ).run(status, Number(req.params.id));
  addReviewLog(Number(req.params.id), req.user.id, 'status', job.status, status, '');
  addAuditLog(req.user.id, `job_${status}`, 'job', Number(req.params.id), { status }, req.ip);
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  res.json(success(formatJob(updated)));
});

export default router;
