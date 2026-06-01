import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest, requireRoles } from '../middleware/auth';
import { findAll, findById, create, update, count } from '../dao/base';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const page_size = parseInt(req.query.page_size as string) || 20;
  const keyword = req.query.keyword as string;
  const status = req.query.status as string;
  const priority = req.query.priority as string;
  const source_channel = req.query.source_channel as string;
  const related_course_id = req.query.related_course_id as string;

  const where: Record<string, any> = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (source_channel) where.source_channel = source_channel;
  if (related_course_id) where.related_course_id = parseInt(related_course_id);

  const whereLike = keyword ? { infringing_content: keyword, clue_no: keyword } : undefined;

  const total = count('piracy_clues', { where, whereLike });
  const data = findAll('piracy_clues', {
    where,
    whereLike,
    orderBy: 'priority, created_at',
    orderDir: 'DESC',
    limit: page_size,
    offset: (page - 1) * page_size,
  });

  const result = data.map((clue: any) => {
    const course = clue.related_course_id ? findById('courses', clue.related_course_id) : null;
    const material = clue.related_material_id ? findById('materials', clue.related_material_id) : null;
    const discoverer = clue.discovered_by ? findById('users', clue.discovered_by) : null;
    const assignee = clue.assigned_to ? findById('users', clue.assigned_to) : null;
    return { ...clue, course, material, discoverer, assignee };
  });

  res.json({
    data: result,
    total,
    page,
    page_size,
  });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const clue = findById('piracy_clues', id);

  if (!clue) {
    res.status(404).json({ error: '线索不存在' });
    return;
  }

  const course = clue.related_course_id ? findById('courses', clue.related_course_id) : null;
  const material = clue.related_material_id ? findById('materials', clue.related_material_id) : null;
  const cases = findAll('enforcement_cases', { where: { piracy_clue_id: id } });

  res.json({
    ...clue,
    course,
    material,
    cases,
  });
});

router.post('/', authMiddleware, requireRoles('admin', 'operation', 'legal', 'customer_service'), (req: AuthRequest, res: Response) => {
  const {
    source_channel, infringing_url, infringing_platform, infringing_content,
    similarity_score, related_course_id, related_material_id, impact_scope,
    estimated_loss, evidence_screenshots, evidence_description, priority,
    discovered_date, assigned_to, notes,
  } = req.body;

  const clueNo = `CLUE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const clueId = create('piracy_clues', {
    clue_no: clueNo,
    source_channel,
    infringing_url,
    infringing_platform,
    infringing_content,
    similarity_score,
    related_course_id,
    related_material_id,
    impact_scope,
    estimated_loss,
    evidence_screenshots,
    evidence_description,
    status: 'pending',
    priority: priority || 'medium',
    discovered_date: discovered_date || new Date().toISOString().split('T')[0],
    discovered_by: req.user?.id,
    assigned_to,
    notes,
  });

  db.prepare(
    'INSERT INTO audit_logs (user_id, action, module, record_id, new_value) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user?.id, 'create', 'piracy_clues', clueId, JSON.stringify({ clue_no: clueNo, infringing_platform }));

  res.json({ id: clueId, clue_no: clueNo, message: '线索登记成功' });
});

router.put('/:id', authMiddleware, requireRoles('admin', 'operation', 'legal'), (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const existing = findById('piracy_clues', id);

  if (!existing) {
    res.status(404).json({ error: '线索不存在' });
    return;
  }

  const updateData: Record<string, any> = {};
  const allowedFields = [
    'source_channel', 'infringing_url', 'infringing_platform', 'infringing_content',
    'similarity_score', 'related_course_id', 'related_material_id', 'impact_scope',
    'estimated_loss', 'evidence_screenshots', 'evidence_description', 'status',
    'priority', 'discovered_date', 'assigned_to', 'notes',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  updateData.updated_at = new Date().toISOString();

  const success = update('piracy_clues', id, updateData);

  if (success) {
    db.prepare(
      'INSERT INTO audit_logs (user_id, action, module, record_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user?.id, 'update', 'piracy_clues', id, JSON.stringify(existing), JSON.stringify(updateData));

    res.json({ message: '线索更新成功' });
  } else {
    res.status(500).json({ error: '更新失败' });
  }
});

router.post('/batch-update', authMiddleware, requireRoles('admin', 'operation', 'legal'), (req: AuthRequest, res: Response) => {
  const { ids, status, assigned_to, priority } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: '请选择要处理的线索' });
    return;
  }

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
  if (status) updateData.status = status;
  if (assigned_to) updateData.assigned_to = assigned_to;
  if (priority) updateData.priority = priority;

  const placeholders = ids.map(() => '?').join(',');
  const sql = `UPDATE piracy_clues SET ${Object.keys(updateData).map((k) => `${k} = ?`).join(', ')} WHERE id IN (${placeholders})`;

  const params = [...Object.values(updateData), ...ids];
  const result = db.prepare(sql).run(...params);

  db.prepare(
    'INSERT INTO audit_logs (user_id, action, module, new_value) VALUES (?, ?, ?, ?)'
  ).run(req.user?.id, 'batch_update', 'piracy_clues', JSON.stringify({ ids, ...updateData }));

  res.json({ updated_count: result.changes, message: `批量更新了 ${result.changes} 条线索` });
});

export default router;
