import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { success, error, asyncHandler, authRequired, AuthRequest } from '../middleware';

const router = Router();

router.get('/items', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const { category, keyword } = req.query as any;
  const db = getDb();
  let sql = 'SELECT * FROM form_templates WHERE 1=1';
  const params: any[] = [];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (keyword) { sql += ' AND (name LIKE ? OR code LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  sql += ' ORDER BY is_hot DESC, created_at DESC';
  const rows = db.prepare(sql).all(...params);
  success(res, rows.map((r: any) => ({
    id: r.id, code: r.code, name: r.name, category: r.category, description: r.description,
    estimatedDays: r.estimated_days,
    requiredMaterials: JSON.parse(r.required_materials || '[]'),
    formFields: JSON.parse(r.form_fields || '[]'),
    isHot: !!r.is_hot, icon: r.icon
  })));
}));

router.get('/items/:id', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  const r: any = db.prepare('SELECT * FROM form_templates WHERE id = ?').get(req.params.id);
  if (!r) return error(res, '事项不存在', 404);
  success(res, {
    id: r.id, code: r.code, name: r.name, category: r.category, description: r.description,
    estimatedDays: r.estimated_days,
    requiredMaterials: JSON.parse(r.required_materials || '[]'),
    formFields: JSON.parse(r.form_fields || '[]'),
    approvalProcess: JSON.parse(r.approval_process || '[]'),
    isHot: !!r.is_hot
  });
}));

router.post('/apply', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const { itemId, formData, materials = [] } = req.body;
  if (!itemId) return error(res, '请选择登记事项');
  const db = getDb();
  const item: any = db.prepare('SELECT * FROM form_templates WHERE id = ?').get(itemId);
  if (!item) return error(res, '登记事项不存在');

  const process = JSON.parse(item.approval_process || '[]');
  const applyId = 'APP' + Date.now();

  const trx = db.transaction(() => {
    const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    db.prepare(`INSERT INTO apply_records (id, item_id, item_name, item_code, applicant_id, applicant_name,
      enterprise_name, form_data, materials, status, current_step, total_steps)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 1, ?)`).run(
      applyId, itemId, item.name, item.code, req.userId, user.name,
      user.enterprise_name, JSON.stringify(formData), JSON.stringify(materials), process.length
    );
    process.forEach((n: any, idx: number) => {
      db.prepare(`INSERT INTO approval_nodes (id, apply_id, node_name, node_role, node_level, status)
        VALUES (?, ?, ?, ?, ?, ?)`).run(uuidv4(), applyId, n.name, n.role, n.level, idx === 0 ? 'processing' : 'pending');
    });
    db.prepare(`INSERT INTO sign_documents (id, apply_id, apply_name, title, document_type, sign_positions,
      require_signer_count, status) VALUES (?, ?, ?, ?, 'application', ?, 1, 'pending')`).run(
      'SD' + Date.now(), applyId, item.name, `${item.name}申请书`,
      JSON.stringify([{ page: 1, x: 100, y: 700, width: 180, height: 80, signerRole: '申请人' }])
    );
    db.prepare(`INSERT INTO todos (id, user_id, type, title, description, related_id, priority, deadline)
      VALUES (?, ?, 'sign', ?, '请完成电子签名', ?, 'high', ?)`).run(
      uuidv4(), req.userId, `${item.name}待签署`, 'SD' + Date.now(),
      new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' ')
    );
  });
  trx();

  console.log(`[Apply] Created: ${applyId}, item=${item.name}`);
  success(res, { id: applyId }, '申请提交成功');
}));

router.get('/records', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const { status } = req.query as any;
  const db = getDb();
  let sql = 'SELECT * FROM apply_records WHERE applicant_id = ?';
  const params: any[] = [req.userId];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  success(res, rows.map((r: any) => {
    const nodes = db.prepare('SELECT * FROM approval_nodes WHERE apply_id = ? ORDER BY node_level').all(r.id);
    return {
      id: r.id, itemId: r.item_id, itemName: r.item_name, itemCode: r.item_code,
      applicantId: r.applicant_id, applicantName: r.applicant_name,
      enterpriseName: r.enterprise_name,
      formData: JSON.parse(r.form_data || '{}'),
      materials: JSON.parse(r.materials || '[]'),
      status: r.status, currentStep: r.current_step, totalSteps: r.total_steps,
      rejectReason: r.reject_reason ? JSON.parse(r.reject_reason) : null,
      approvalNodes: nodes.map((n: any) => ({
        id: n.id, name: n.node_name, role: n.node_role, level: n.node_level,
        assignee: n.assignee_name, status: n.status, comment: n.comment, operatedAt: n.operated_at
      })),
      createdAt: r.created_at, updatedAt: r.updated_at
    };
  }));
}));

router.get('/records/:id', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  const r: any = db.prepare('SELECT * FROM apply_records WHERE id = ? AND applicant_id = ?')
    .get(req.params.id, req.userId);
  if (!r) return error(res, '申请记录不存在', 404);
  const nodes = db.prepare('SELECT * FROM approval_nodes WHERE apply_id = ? ORDER BY node_level').all(r.id);
  success(res, {
    id: r.id, itemId: r.item_id, itemName: r.item_name, itemCode: r.item_code,
    formData: JSON.parse(r.form_data || '{}'),
    materials: JSON.parse(r.materials || '[]'),
    status: r.status, currentStep: r.current_step, totalSteps: r.total_steps,
    rejectReason: r.reject_reason ? JSON.parse(r.reject_reason) : null,
    approvalNodes: nodes.map((n: any) => ({
      id: n.id, name: n.node_name, role: n.node_role, level: n.node_level,
      assignee: n.assignee_name, status: n.status, comment: n.comment, operatedAt: n.operated_at
    })),
    createdAt: r.created_at, updatedAt: r.updated_at
  });
}));

router.get('/licenses', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM electronic_licenses WHERE user_id = ? AND status = \'valid\'').all(req.userId);
  success(res, rows.map((r: any) => ({
    id: r.id, licenseType: r.license_type, licenseNo: r.license_no, holderName: r.holder_name,
    issuer: r.issuer, issueDate: r.issue_date, validFrom: r.valid_from, validTo: r.valid_to,
    status: r.status, canBeShared: !!r.can_be_shared
  })));
}));

export default router;
