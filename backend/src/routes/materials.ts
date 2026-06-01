import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest, requireRoles } from '../middleware/auth';
import { findAll, findById, create, update, count } from '../dao/base';
import { Material } from '../types';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const page_size = parseInt(req.query.page_size as string) || 20;
  const keyword = req.query.keyword as string;
  const type = req.query.type as string;
  const authorization_status = req.query.authorization_status as string;
  const course_id = req.query.course_id as string;
  const lecturer_id = req.query.lecturer_id as string;

  const where: Record<string, any> = {};
  if (type) where.type = type;
  if (authorization_status) where.authorization_status = authorization_status;
  if (course_id) where.course_id = parseInt(course_id);
  if (lecturer_id) where.lecturer_id = parseInt(lecturer_id);

  const whereLike = keyword ? { name: keyword, material_code: keyword } : undefined;

  const total = count('materials', { where, whereLike });
  const data = findAll('materials', {
    where,
    whereLike,
    orderBy: 'created_at',
    orderDir: 'DESC',
    limit: page_size,
    offset: (page - 1) * page_size,
  });

  const result = data.map((material: Material) => {
    const course = material.course_id ? findById('courses', material.course_id) : null;
    const lecturer = material.lecturer_id ? findById('lecturers', material.lecturer_id) : null;
    return { ...material, course, lecturer };
  });

  res.json({
    data: result,
    total,
    page,
    page_size,
  });
});

router.get('/expiring-soon', authMiddleware, (req: AuthRequest, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const query = `
    SELECT m.*, c.name as course_name, l.name as lecturer_name
    FROM materials m
    LEFT JOIN courses c ON m.course_id = c.id
    LEFT JOIN lecturers l ON m.lecturer_id = l.id
    WHERE m.authorization_end_date IS NOT NULL
    AND m.authorization_end_date <= DATE('now', '+${days} days')
    AND m.authorization_end_date >= DATE('now')
    AND m.status = 'active'
    ORDER BY m.authorization_end_date ASC
  `;
  const data = db.prepare(query).all();
  res.json(data);
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const material = findById('materials', id);

  if (!material) {
    res.status(404).json({ error: '素材不存在' });
    return;
  }

  const course = material.course_id ? findById('courses', material.course_id) : null;
  const lecturer = material.lecturer_id ? findById('lecturers', material.lecturer_id) : null;
  const authorizations = findAll('material_authorizations', { where: { material_id: id } });

  res.json({
    ...material,
    course,
    lecturer,
    authorizations,
  });
});

router.post('/', authMiddleware, requireRoles('admin', 'operation', 'lecturer'), (req: AuthRequest, res: Response) => {
  const {
    material_code, name, type, course_id, lecturer_id, source,
    authorization_status, authorization_start_date, authorization_end_date,
    usage_scope, watermark_strategy, download_permission, description,
  } = req.body;

  if (!material_code || !name || !type) {
    res.status(400).json({ error: '素材编码、名称和类型不能为空' });
    return;
  }

  const existing = db.prepare('SELECT id FROM materials WHERE material_code = ?').get(material_code);
  if (existing) {
    res.status(400).json({ error: '素材编码已存在' });
    return;
  }

  const materialId = create('materials', {
    material_code,
    name,
    type,
    course_id,
    lecturer_id,
    source: source || 'original',
    authorization_status: authorization_status || 'pending',
    authorization_start_date,
    authorization_end_date,
    usage_scope,
    watermark_strategy: watermark_strategy || 'none',
    download_permission: download_permission || 0,
    description,
    created_by: req.user?.id,
  });

  db.prepare(
    'INSERT INTO audit_logs (user_id, action, module, record_id, new_value) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user?.id, 'create', 'materials', materialId, JSON.stringify({ material_code, name, type }));

  res.json({ id: materialId, message: '素材创建成功' });
});

router.put('/:id', authMiddleware, requireRoles('admin', 'operation', 'lecturer'), (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const existing = findById('materials', id);

  if (!existing) {
    res.status(404).json({ error: '素材不存在' });
    return;
  }

  const updateData: Record<string, any> = {};
  const allowedFields = [
    'name', 'type', 'course_id', 'lecturer_id', 'source', 'authorization_status',
    'authorization_start_date', 'authorization_end_date', 'usage_scope', 'usage_scope_detail',
    'watermark_strategy', 'watermark_content', 'download_permission', 'status', 'description', 'version'
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  updateData.updated_at = new Date().toISOString();

  const success = update('materials', id, updateData);

  if (success) {
    db.prepare(
      'INSERT INTO audit_logs (user_id, action, module, record_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user?.id, 'update', 'materials', id, JSON.stringify(existing), JSON.stringify(updateData));

    res.json({ message: '素材更新成功' });
  } else {
    res.status(500).json({ error: '更新失败' });
  }
});

router.post('/:id/authorize', authMiddleware, requireRoles('admin', 'legal'), (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { authorization_type, authorized_party, authorizing_party, start_date, end_date, territory, terms } = req.body;

  const material = findById('materials', id);
  if (!material) {
    res.status(404).json({ error: '素材不存在' });
    return;
  }

  const authId = create('material_authorizations', {
    material_id: id,
    authorization_type,
    authorized_party,
    authorizing_party,
    start_date,
    end_date,
    territory,
    terms,
    status: 'active',
  });

  update('materials', id, {
    authorization_status: 'authorized',
    authorization_start_date: start_date,
    authorization_end_date: end_date,
    updated_at: new Date().toISOString(),
  });

  db.prepare(
    'INSERT INTO audit_logs (user_id, action, module, record_id, new_value) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user?.id, 'authorize', 'materials', id, JSON.stringify({ authorization_type, start_date, end_date }));

  res.json({ id: authId, message: '授权成功' });
});

export default router;
