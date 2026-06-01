import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest, requireRoles } from '../middleware/auth';
import { findAll, findById, create, update, count } from '../dao/base';
import { Course } from '../types';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const page_size = parseInt(req.query.page_size as string) || 20;
  const keyword = req.query.keyword as string;
  const status = req.query.status as string;
  const category = req.query.category as string;

  const whereLike: Record<string, string> = {};
  const where: Record<string, any> = {};

  if (keyword) {
    whereLike.name = keyword;
    whereLike.course_code = keyword;
  }
  if (status) {
    where.status = status;
  }
  if (category) {
    where.category = category;
  }

  const total = count('courses', { where, whereLike });
  const data = findAll('courses', {
    where,
    whereLike: keyword ? { name: keyword, course_code: keyword } : undefined,
    orderBy: 'created_at',
    orderDir: 'DESC',
    limit: page_size,
    offset: (page - 1) * page_size,
  });

  res.json({
    data,
    total,
    page,
    page_size,
  });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const course = findById('courses', id);

  if (!course) {
    res.status(404).json({ error: '课程不存在' });
    return;
  }

  const lecturer = course.lecturer_id ? findById('lecturers', course.lecturer_id) : null;
  const materials = findAll('materials', { where: { course_id: id } });

  res.json({
    ...course,
    lecturer,
    materials,
  });
});

router.post('/', authMiddleware, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response) => {
  const { course_code, name, description, lecturer_id, category, price, is_free } = req.body;

  if (!course_code || !name) {
    res.status(400).json({ error: '课程编码和名称不能为空' });
    return;
  }

  const existing = db.prepare('SELECT id FROM courses WHERE course_code = ?').get(course_code);
  if (existing) {
    res.status(400).json({ error: '课程编码已存在' });
    return;
  }

  const courseId = create('courses', {
    course_code,
    name,
    description,
    lecturer_id,
    category,
    status: 'draft',
    price: price || 0,
    is_free: is_free || 0,
    created_by: req.user?.id,
  });

  db.prepare(
    'INSERT INTO audit_logs (user_id, action, module, record_id, new_value) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user?.id, 'create', 'courses', courseId, JSON.stringify({ course_code, name }));

  res.json({ id: courseId, message: '课程创建成功' });
});

router.put('/:id', authMiddleware, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, description, lecturer_id, category, price, is_free, status } = req.body;

  const existing = findById('courses', id);
  if (!existing) {
    res.status(404).json({ error: '课程不存在' });
    return;
  }

  const updateData: Record<string, any> = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (lecturer_id !== undefined) updateData.lecturer_id = lecturer_id;
  if (category !== undefined) updateData.category = category;
  if (price !== undefined) updateData.price = price;
  if (is_free !== undefined) updateData.is_free = is_free;
  if (status !== undefined) updateData.status = status;
  updateData.updated_at = new Date().toISOString();

  const success = update('courses', id, updateData);

  if (success) {
    db.prepare(
      'INSERT INTO audit_logs (user_id, action, module, record_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user?.id, 'update', 'courses', id, JSON.stringify(existing), JSON.stringify(updateData));

    res.json({ message: '课程更新成功' });
  } else {
    res.status(500).json({ error: '更新失败' });
  }
});

router.post('/:id/submit-review', authMiddleware, requireRoles('admin', 'operation', 'lecturer'), (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const course = findById('courses', id);

  if (!course) {
    res.status(404).json({ error: '课程不存在' });
    return;
  }

  const materials = findAll('materials', { where: { course_id: id } });
  const unauthorizedMaterials = materials.filter((m: any) => m.authorization_status !== 'authorized');

  if (unauthorizedMaterials.length > 0) {
    res.status(400).json({
      error: '存在未授权的素材，无法提交审核',
      unauthorized_materials: unauthorizedMaterials.map((m: any) => ({ id: m.id, name: m.name })),
    });
    return;
  }

  update('courses', id, { status: 'pending_review', updated_at: new Date().toISOString() });

  db.prepare(
    'INSERT INTO audit_logs (user_id, action, module, record_id, new_value) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user?.id, 'submit_review', 'courses', id, JSON.stringify({ status: 'pending_review' }));

  res.json({ message: '已提交审核' });
});

export default router;
