import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest, requireRoles } from '../middleware/auth';
import { findAll, findById, create, update, count } from '../dao/base';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const page_size = parseInt(req.query.page_size as string) || 20;
  const status = req.query.status as string;
  const case_type = req.query.case_type as string;
  const piracy_clue_id = req.query.piracy_clue_id as string;

  const where: Record<string, any> = {};
  if (status) where.status = status;
  if (case_type) where.case_type = case_type;
  if (piracy_clue_id) where.piracy_clue_id = parseInt(piracy_clue_id);

  const total = count('enforcement_cases', { where });
  const data = findAll('enforcement_cases', {
    where,
    orderBy: 'created_at',
    orderDir: 'DESC',
    limit: page_size,
    offset: (page - 1) * page_size,
  });

  const result = data.map((caseItem: any) => {
    const clue = caseItem.piracy_clue_id ? findById('piracy_clues', caseItem.piracy_clue_id) : null;
    const course = caseItem.related_course_id ? findById('courses', caseItem.related_course_id) : null;
    const handler = caseItem.handled_by ? findById('users', caseItem.handled_by) : null;
    return { ...caseItem, clue, course, handler };
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
  const caseItem = findById('enforcement_cases', id);

  if (!caseItem) {
    res.status(404).json({ error: '案件不存在' });
    return;
  }

  const clue = caseItem.piracy_clue_id ? findById('piracy_clues', caseItem.piracy_clue_id) : null;
  const attachments = findAll('enforcement_attachments', { where: { case_id: id } });

  res.json({
    ...caseItem,
    clue,
    attachments,
  });
});

router.post('/', authMiddleware, requireRoles('admin', 'legal'), (req: AuthRequest, res: Response) => {
  const {
    piracy_clue_id, case_type, related_course_id, related_material_id,
    infringing_url, infringing_platform,
  } = req.body;

  if (!piracy_clue_id) {
    res.status(400).json({ error: '请关联盗版线索' });
    return;
  }

  const clue = findById('piracy_clues', piracy_clue_id);
  if (!clue) {
    res.status(404).json({ error: '关联的盗版线索不存在' });
    return;
  }

  const caseNo = `CASE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const caseId = create('enforcement_cases', {
    case_no: caseNo,
    piracy_clue_id,
    case_type: case_type || 'takedown',
    status: 'notice_sent',
    related_course_id: related_course_id || clue.related_course_id,
    related_material_id: related_material_id || clue.related_material_id,
    infringing_url: infringing_url || clue.infringing_url,
    infringing_platform: infringing_platform || clue.infringing_platform,
    notice_sent_date: new Date().toISOString().split('T')[0],
    handled_by: req.user?.id,
  });

  update('piracy_clues', piracy_clue_id, {
    status: 'processing',
    updated_at: new Date().toISOString(),
  });

  db.prepare(
    'INSERT INTO audit_logs (user_id, action, module, record_id, new_value) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user?.id, 'create', 'enforcement_cases', caseId, JSON.stringify({ case_no: caseNo, piracy_clue_id }));

  res.json({ id: caseId, case_no: caseNo, message: '维权案件创建成功' });
});

router.put('/:id/status', authMiddleware, requireRoles('admin', 'legal'), (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { status, result_description, settlement_amount } = req.body;

  const existing = findById('enforcement_cases', id);
  if (!existing) {
    res.status(404).json({ error: '案件不存在' });
    return;
  }

  const validStatuses = ['notice_sent', 'platform_notified', 'lawyer_letter_sent', 'takedown_confirmed', 'reviewing', 'closed', 'appealing'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: '无效的状态' });
    return;
  }

  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'platform_notified') updateData.platform_response_date = new Date().toISOString().split('T')[0];
  if (status === 'lawyer_letter_sent') updateData.lawyer_letter_sent_date = new Date().toISOString().split('T')[0];
  if (status === 'takedown_confirmed') updateData.takedown_date = new Date().toISOString().split('T')[0];
  if (result_description) updateData.result_description = result_description;
  if (settlement_amount !== undefined) updateData.settlement_amount = settlement_amount;

  const success = update('enforcement_cases', id, updateData);

  if (success && (status === 'closed' || status === 'takedown_confirmed')) {
    update('piracy_clues', existing.piracy_clue_id, {
      status: status === 'closed' ? 'closed' : 'resolved',
      updated_at: new Date().toISOString(),
    });
  }

  if (success) {
    db.prepare(
      'INSERT INTO audit_logs (user_id, action, module, record_id, new_value) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user?.id, 'update_status', 'enforcement_cases', id, JSON.stringify({ status }));

    res.json({ message: '案件状态更新成功' });
  } else {
    res.status(500).json({ error: '更新失败' });
  }
});

router.post('/:id/attachments', authMiddleware, requireRoles('admin', 'legal'), (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { file_name, file_path, file_type, attachment_type, description } = req.body;

  const caseItem = findById('enforcement_cases', id);
  if (!caseItem) {
    res.status(404).json({ error: '案件不存在' });
    return;
  }

  if (!file_name || !file_path) {
    res.status(400).json({ error: '文件名和路径不能为空' });
    return;
  }

  const attachmentId = create('enforcement_attachments', {
    case_id: id,
    file_name,
    file_path,
    file_type,
    attachment_type: attachment_type || 'other',
    description,
    uploaded_by: req.user?.id,
  });

  db.prepare(
    'INSERT INTO audit_logs (user_id, action, module, record_id, new_value) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user?.id, 'add_attachment', 'enforcement_cases', id, JSON.stringify({ file_name, attachment_type }));

  res.json({ id: attachmentId, message: '附件上传成功' });
});

export default router;
