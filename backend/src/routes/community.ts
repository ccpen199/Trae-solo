import { Router } from 'express';
import db from '../database.js';
import { authMiddleware, AuthRequest, adminMiddleware } from '../middleware/auth.js';
import { successResponse, errorResponse, generateRequestNo, paginate } from '../utils/common.js';

const router = Router();

router.post('/repair/submit', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { repair_type, title, description, address, contact_phone, images } = req.body;

  if (!repair_type || !title || !description || !address || !contact_phone) {
    return errorResponse(res, '报修类型、标题、描述、地址和联系电话不能为空');
  }

  const result = db.prepare(
    `INSERT INTO community_repairs 
     (user_id, repair_type, title, description, address, contact_phone, images) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    repair_type,
    title,
    description,
    address,
    contact_phone,
    JSON.stringify(images || [])
  );

  const repair = db.prepare('SELECT * FROM community_repairs WHERE id = ?').get(result.lastInsertRowid);

  return successResponse(res, repair, '报修提交成功');
});

router.get('/repair/list', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { page = 1, pageSize = 10, status, repair_type } = req.query as any;

  let sql = 'SELECT * FROM community_repairs WHERE user_id = ?';
  const params: any[] = [userId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (repair_type) {
    sql += ' AND repair_type = ?';
    params.push(repair_type);
  }

  sql += ' ORDER BY created_at DESC';

  const repairs = db.prepare(sql).all(...params);
  
  const result = paginate(repairs.map((r: any) => ({
    ...r,
    images: r.images ? JSON.parse(r.images) : []
  })), parseInt(page), parseInt(pageSize));

  return successResponse(res, result);
});

router.get('/repair/:id', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  const repair: any = db.prepare(
    'SELECT * FROM community_repairs WHERE id = ? AND user_id = ?'
  ).get(id, userId);

  if (!repair) {
    return errorResponse(res, '报修记录不存在', 404);
  }

  if (repair.images) {
    repair.images = JSON.parse(repair.images);
  }

  repair.progress_logs = [
    { step: 1, name: '提交报修', status: 'completed', time: repair.created_at, remark: '报修已提交' },
    { step: 2, name: '派单处理', status: repair.status !== 'pending' ? 'completed' : 'processing', time: repair.assignee ? repair.created_at : null, remark: repair.assignee ? `已派单给${repair.assignee}` : '待派单' },
    { step: 3, name: '上门维修', status: repair.status === 'processing' || repair.status === 'completed' ? 'completed' : 'pending', time: null, remark: '待上门' },
    { step: 4, name: '维修完成', status: repair.status === 'completed' ? 'completed' : 'pending', time: repair.handle_time, remark: repair.handle_result || '待完成' }
  ];

  return successResponse(res, repair);
});

router.put('/repair/:id/status', adminMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, assignee, handle_result } = req.body;

  if (!status) {
    return errorResponse(res, '状态不能为空');
  }

  const repair = db.prepare('SELECT * FROM community_repairs WHERE id = ?').get(id);
  if (!repair) {
    return errorResponse(res, '报修记录不存在', 404);
  }

  const updateFields: string[] = [];
  const updateParams: any[] = [];

  updateFields.push('status = ?');
  updateParams.push(status);

  if (assignee) {
    updateFields.push('assignee = ?');
    updateParams.push(assignee);
  }

  if (handle_result) {
    updateFields.push('handle_result = ?');
    updateParams.push(handle_result);
  }

  if (status === 'completed') {
    updateFields.push('handle_time = datetime(\"now\")');
  }

  updateFields.push('updated_at = datetime(\"now\")');
  updateParams.push(id);

  db.prepare(
    `UPDATE community_repairs SET ${updateFields.join(', ')} WHERE id = ?`
  ).run(...updateParams);

  const updatedRepair = db.prepare('SELECT * FROM community_repairs WHERE id = ?').get(id);

  return successResponse(res, updatedRepair, '状态更新成功');
});

router.post('/help/publish', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { help_type, title, description, address, contact_phone, reward, images } = req.body;

  if (!help_type || !title || !description || !address || !contact_phone) {
    return errorResponse(res, '互助类型、标题、描述、地址和联系电话不能为空');
  }

  const result = db.prepare(
    `INSERT INTO community_help 
     (user_id, help_type, title, description, address, contact_phone, reward, images) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    help_type,
    title,
    description,
    address,
    contact_phone,
    reward || null,
    JSON.stringify(images || [])
  );

  const help = db.prepare('SELECT * FROM community_help WHERE id = ?').get(result.lastInsertRowid);

  return successResponse(res, help, '互助信息发布成功');
});

router.get('/help/list', (req, res) => {
  const { page = 1, pageSize = 10, status, help_type, keyword } = req.query as any;

  let sql = `SELECT ch.*, u.username, u.avatar 
             FROM community_help ch 
             LEFT JOIN users u ON ch.user_id = u.id`;
  const params: any[] = [];
  const conditions: string[] = [];

  if (status) {
    conditions.push('ch.status = ?');
    params.push(status);
  }

  if (help_type) {
    conditions.push('ch.help_type = ?');
    params.push(help_type);
  }

  if (keyword) {
    conditions.push('(ch.title LIKE ? OR ch.description LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY ch.created_at DESC';

  const helpList = db.prepare(sql).all(...params);
  
  const result = paginate(helpList.map((h: any) => ({
    ...h,
    images: h.images ? JSON.parse(h.images) : []
  })), parseInt(page), parseInt(pageSize));

  return successResponse(res, result);
});

router.get('/help/:id', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;

  const help: any = db.prepare(
    `SELECT ch.*, u.username, u.avatar, u.real_name 
     FROM community_help ch 
     LEFT JOIN users u ON ch.user_id = u.id 
     WHERE ch.id = ?`
  ).get(id);

  if (!help) {
    return errorResponse(res, '互助信息不存在', 404);
  }

  if (help.images) {
    help.images = JSON.parse(help.images);
  }

  return successResponse(res, help);
});

router.post('/help/:id/accept', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  const help = db.prepare('SELECT * FROM community_help WHERE id = ?').get(id);
  if (!help) {
    return errorResponse(res, '互助信息不存在', 404);
  }

  if (help.status !== 'open') {
    return errorResponse(res, '该互助信息已被接受或已完成');
  }

  if (help.user_id === userId) {
    return errorResponse(res, '不能接受自己发布的互助');
  }

  db.prepare(
    `UPDATE community_help 
     SET status = 'accepted', helper_id = ?, updated_at = datetime(\"now\") 
     WHERE id = ?`
  ).run(userId, id);

  const updatedHelp = db.prepare(
    `SELECT ch.*, u.username as helper_name 
     FROM community_help ch 
     LEFT JOIN users u ON ch.helper_id = u.id 
     WHERE ch.id = ?`
  ).get(id);

  return successResponse(res, updatedHelp, '已接受互助');
});

router.put('/help/:id/complete', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  const help = db.prepare('SELECT * FROM community_help WHERE id = ?').get(id);
  if (!help) {
    return errorResponse(res, '互助信息不存在', 404);
  }

  if (help.user_id !== userId && help.helper_id !== userId) {
    return errorResponse(res, '只有发布者或接受者才能标记完成');
  }

  if (help.status !== 'accepted') {
    return errorResponse(res, '该互助尚未被接受');
  }

  db.prepare(
    `UPDATE community_help 
     SET status = 'completed', complete_time = datetime(\"now\"), updated_at = datetime(\"now\") 
     WHERE id = ?`
  ).run(id);

  return successResponse(res, { id, status: 'completed' }, '互助已完成');
});

router.get('/my/help', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { page = 1, pageSize = 10, type = 'published' } = req.query as any;

  let sql = '';
  let params: any[] = [];

  if (type === 'published') {
    sql = 'SELECT * FROM community_help WHERE user_id = ? ORDER BY created_at DESC';
    params = [userId];
  } else if (type === 'accepted') {
    sql = 'SELECT * FROM community_help WHERE helper_id = ? ORDER BY created_at DESC';
    params = [userId];
  }

  const helpList = db.prepare(sql).all(...params);
  const result = paginate(helpList.map((h: any) => ({
    ...h,
    images: h.images ? JSON.parse(h.images) : []
  })), parseInt(page), parseInt(pageSize));

  return successResponse(res, result);
});

export default router;
