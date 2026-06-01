import { Router, Response } from 'express';
import { authMiddleware, AuthRequest, requireRoles } from '../middleware/auth';
import { findAll, findById, create, update, count } from '../dao/base';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const page_size = parseInt(req.query.page_size as string) || 20;
  const keyword = req.query.keyword as string;
  const status = req.query.status as string;

  const where: Record<string, any> = {};
  if (status) where.status = status;

  const whereLike = keyword ? { name: keyword } : undefined;

  const total = count('lecturers', { where, whereLike });
  const data = findAll('lecturers', {
    where,
    whereLike,
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
  const lecturer = findById('lecturers', id);

  if (!lecturer) {
    res.status(404).json({ error: '讲师不存在' });
    return;
  }

  const courses = findAll('courses', { where: { lecturer_id: id } });
  const materials = findAll('materials', { where: { lecturer_id: id } });

  res.json({
    ...lecturer,
    courses,
    materials,
  });
});

router.post('/', authMiddleware, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response) => {
  const { name, id_card, phone, email, contract_no, contract_start_date, contract_end_date } = req.body;

  if (!name) {
    res.status(400).json({ error: '讲师姓名不能为空' });
    return;
  }

  const lecturerId = create('lecturers', {
    name,
    id_card,
    phone,
    email,
    contract_no,
    contract_start_date,
    contract_end_date,
    status: 'active',
  });

  res.json({ id: lecturerId, message: '讲师创建成功' });
});

router.put('/:id', authMiddleware, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const existing = findById('lecturers', id);

  if (!existing) {
    res.status(404).json({ error: '讲师不存在' });
    return;
  }

  const updateData: Record<string, any> = {};
  const allowedFields = ['name', 'id_card', 'phone', 'email', 'contract_no', 'contract_start_date', 'contract_end_date', 'status'];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  updateData.updated_at = new Date().toISOString();

  const success = update('lecturers', id, updateData);

  if (success) {
    res.json({ message: '讲师信息更新成功' });
  } else {
    res.status(500).json({ error: '更新失败' });
  }
});

export default router;
