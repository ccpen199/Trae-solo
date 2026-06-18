import { Router, Response } from 'express';
import db from '../models/database';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware(), (req: AuthRequest, res: Response) => {
  const { page = 1, pageSize = 10, role, status, city, keyword, minRating } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let where = [];
  let params: any[] = [];

  if (role) {
    where.push('w.role = ?');
    params.push(role);
  }
  if (status) {
    where.push('w.status = ?');
    params.push(status);
  }
  if (city) {
    where.push('w.service_cities LIKE ?');
    params.push(`%${city}%`);
  }
  if (keyword) {
    where.push('(w.name LIKE ? OR w.skills LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (minRating) {
    where.push('w.rating >= ?');
    params.push(Number(minRating));
  }

  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as count FROM workers w ${whereSql}`).get(...params) as any;
  const workers = db.prepare(`
    SELECT w.*,
      (SELECT COUNT(*) FROM orders o WHERE o.worker_id = w.id AND o.status = 'completed') as completed_orders,
      (SELECT AVG(r.rating) FROM reviews r WHERE r.worker_id = w.id) as avg_rating
    FROM workers w
    ${whereSql}
    ORDER BY w.rating DESC, w.order_count DESC
    LIMIT ? OFFSET ?
  `).get(...params, Number(pageSize), offset);

  const list = db.prepare(`
    SELECT w.*,
      (SELECT COUNT(*) FROM orders o WHERE o.worker_id = w.id AND o.status = 'completed') as completed_orders
    FROM workers w
    ${whereSql}
    ORDER BY w.rating DESC, w.order_count DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  res.json({
    list,
    total: total.count,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});

router.get('/:id', authMiddleware(), (req: AuthRequest, res: Response) => {
  const worker = db.prepare(`
    SELECT w.*,
      (SELECT COUNT(*) FROM orders o WHERE o.worker_id = w.id AND o.status = 'completed') as completed_orders
    FROM workers w WHERE w.id = ?
  `).get(req.params.id) as any;

  if (!worker) {
    return res.status(404).json({ error: '阿姨不存在' });
  }

  const certificates = db.prepare('SELECT * FROM skill_certificates WHERE worker_id = ?').all(req.params.id);
  const reviews = db.prepare(`
    SELECT r.*, e.name as employer_name, o.title as order_title
    FROM reviews r
    LEFT JOIN employers e ON r.employer_id = e.id
    LEFT JOIN orders o ON r.order_id = o.id
    WHERE r.worker_id = ?
    ORDER BY r.created_at DESC
    LIMIT 10
  `).all(req.params.id);

  const recentOrders = db.prepare(`
    SELECT o.*, e.name as employer_name
    FROM orders o
    LEFT JOIN employers e ON o.employer_id = e.id
    WHERE o.worker_id = ?
    ORDER BY o.created_at DESC
    LIMIT 5
  `).all(req.params.id);

  const trainingProgress = db.prepare(`
    SELECT tp.*, tc.title as course_title, tc.category, tc.level
    FROM training_progress tp
    LEFT JOIN training_courses tc ON tp.course_id = tc.id
    WHERE tp.worker_id = ?
  `).all(req.params.id);

  res.json({
    worker: {
      ...worker,
      skills: worker.skills ? worker.skills.split(',') : [],
      languages: worker.languages ? worker.languages.split(',') : [],
      certificates_data: worker.certificates ? JSON.parse(worker.certificates) : [],
      lbs_fence_data: worker.lbs_fence ? JSON.parse(worker.lbs_fence) : null,
      service_cities_data: worker.service_cities ? JSON.parse(worker.service_cities) : [],
    },
    certificates,
    reviews,
    recentOrders,
    trainingProgress,
  });
});

router.post('/', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  const { name, id_card, role, phone, age, gender, experience_years, native_place, education, skills, languages, service_cities } = req.body;

  if (!name || !id_card || !role || !phone || !age || !gender) {
    return res.status(400).json({ error: '必填项不能为空' });
  }

  const userId = uuidv4();
  const workerId = uuidv4();

  const tx = db.transaction(() => {
    const hashedPassword = require('bcryptjs').hashSync('worker123', 10);
    db.prepare('INSERT INTO users (id, username, password, role, phone) VALUES (?, ?, ?, ?, ?)')
      .run(userId, phone, hashedPassword, 'worker', phone);

    db.prepare(`
      INSERT INTO workers (id, user_id, name, id_card, role, phone, age, gender, experience_years, native_place, education, skills, languages, lbs_fence, service_cities, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      workerId, userId, name, id_card, role, phone, age, gender,
      experience_years || 0, native_place || '', education || '',
      skills ? skills.join(',') : '', languages ? languages.join(',') : '',
      JSON.stringify({ center: { lng: 121.4737, lat: 31.2304 }, radius: 5000 }),
      service_cities ? JSON.stringify(service_cities) : JSON.stringify(['上海市']),
      'active'
    );
  });

  try {
    tx();
    res.json({ success: true, id: workerId, message: '创建成功' });
  } catch (error) {
    res.status(500).json({ error: '创建失败' });
  }
});

router.put('/:id', authMiddleware(['admin', 'worker']), (req: AuthRequest, res: Response) => {
  const workerId = req.params.id;
  const existing = db.prepare('SELECT * FROM workers WHERE id = ?').get(workerId) as any;
  if (!existing) {
    return res.status(404).json({ error: '阿姨不存在' });
  }

  if (req.user!.role === 'worker' && existing.user_id !== req.user!.id) {
    return res.status(403).json({ error: '无权限修改' });
  }

  const { name, phone, age, experience_years, native_place, education, skills, languages, service_cities, health_report_url, health_report_expiry } = req.body;

  db.prepare(`
    UPDATE workers SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      age = COALESCE(?, age),
      experience_years = COALESCE(?, experience_years),
      native_place = COALESCE(?, native_place),
      education = COALESCE(?, education),
      skills = COALESCE(?, skills),
      languages = COALESCE(?, languages),
      service_cities = COALESCE(?, service_cities),
      health_report_url = COALESCE(?, health_report_url),
      health_report_expiry = COALESCE(?, health_report_expiry),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name, phone, age, experience_years, native_place, education,
    skills ? skills.join(',') : existing.skills,
    languages ? languages.join(',') : existing.languages,
    service_cities ? JSON.stringify(service_cities) : existing.service_cities,
    health_report_url, health_report_expiry, workerId
  );

  res.json({ success: true, message: '更新成功' });
});

router.post('/:id/certificates', authMiddleware(['admin', 'worker']), (req: AuthRequest, res: Response) => {
  const workerId = req.params.id;
  const { certificate_type, certificate_number, issuing_authority, issue_date, expiry_date, image_url, ocr_data } = req.body;

  if (!certificate_type || !certificate_number || !issuing_authority || !issue_date || !image_url) {
    return res.status(400).json({ error: '必填项不能为空' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO skill_certificates (id, worker_id, certificate_type, certificate_number, issuing_authority, issue_date, expiry_date, image_url, ocr_data, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, workerId, certificate_type, certificate_number, issuing_authority, issue_date, expiry_date, image_url, ocr_data ? JSON.stringify(ocr_data) : null, 0);

  res.json({ success: true, id, message: '证书上传成功' });
});

router.get('/:id/certificates', authMiddleware(), (req: AuthRequest, res: Response) => {
  const certificates = db.prepare('SELECT * FROM skill_certificates WHERE worker_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ list: certificates });
});

export default router;
