import { Router } from 'express';
import { getDb } from '../db';
import { success, error, asyncHandler, authRequired, adminRequired, AuthRequest } from '../middleware';

const router = Router();

router.get('/todos', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM todos WHERE user_id = ? ORDER BY is_read ASC, created_at DESC LIMIT 20`).all(req.userId);
  success(res, rows.map((r: any) => ({
    id: r.id, type: r.type, title: r.title, description: r.description,
    relatedId: r.related_id, priority: r.priority, isRead: !!r.is_read,
    deadline: r.deadline, createdAt: r.created_at
  })));
}));

router.post('/todos/:id/read', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  db.prepare('UPDATE todos SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  success(res, null, '已标记已读');
}));

router.get('/notices', asyncHandler(async (_req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM notices ORDER BY published_at DESC').all();
  success(res, rows.map((r: any) => ({
    id: r.id, title: r.title, content: r.content, type: r.type,
    level: r.level, publisher: r.publisher, publishedAt: r.published_at
  })));
}));

router.get('/statistics', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) AS cnt FROM apply_records WHERE applicant_id = ?').get(req.userId) as any;
  const reviewing = db.prepare("SELECT COUNT(*) AS cnt FROM apply_records WHERE applicant_id = ? AND status IN ('submitted','reviewing')").get(req.userId) as any;
  const approved = db.prepare("SELECT COUNT(*) AS cnt FROM apply_records WHERE applicant_id = ? AND status IN ('approved','completed')").get(req.userId) as any;
  const rejected = db.prepare("SELECT COUNT(*) AS cnt FROM apply_records WHERE applicant_id = ? AND status = 'rejected'").get(req.userId) as any;
  const pendingSign = db.prepare(`SELECT COUNT(*) AS cnt FROM sign_documents sd
    INNER JOIN apply_records ar ON sd.apply_id = ar.id
    WHERE ar.applicant_id = ? AND sd.status IN ('pending','signing')`).get(req.userId) as any;

  success(res, {
    total: total.cnt, reviewing: reviewing.cnt, approved: approved.cnt,
    rejected: rejected.cnt, pendingSign: pendingSign.cnt
  });
}));

router.get('/track-list', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM apply_records WHERE applicant_id = ? ORDER BY updated_at DESC').all(req.userId);
  success(res, rows.map((r: any) => {
    const nodes = db.prepare('SELECT * FROM approval_nodes WHERE apply_id = ? ORDER BY node_level').all(r.id);
    return {
      id: r.id, itemId: r.item_id, itemName: r.item_name, itemCode: r.item_code,
      applicantName: r.applicant_name, enterpriseName: r.enterprise_name,
      status: r.status, currentStep: r.current_step, totalSteps: r.total_steps,
      rejectReason: r.reject_reason ? JSON.parse(r.reject_reason) : null,
      approvalNodes: nodes.map((n: any) => ({
        id: n.id, name: n.node_name, role: n.node_role, level: n.node_level,
        assignee: n.assignee_name, status: n.status, comment: n.comment, operatedAt: n.operated_at
      })),
      formData: JSON.parse(r.form_data || '{}'),
      materials: JSON.parse(r.materials || '[]'),
      createdAt: r.created_at, updatedAt: r.updated_at
    };
  }));
}));

router.get('/track-list/:id', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  const r: any = db.prepare('SELECT * FROM apply_records WHERE id = ? AND applicant_id = ?').get(req.params.id, req.userId);
  if (!r) return error(res, '申请不存在', 404);
  const nodes = db.prepare('SELECT * FROM approval_nodes WHERE apply_id = ? ORDER BY node_level').all(r.id);
  success(res, {
    id: r.id, itemName: r.item_name, itemCode: r.item_code,
    status: r.status, currentStep: r.current_step, totalSteps: r.total_steps,
    rejectReason: r.reject_reason ? JSON.parse(r.reject_reason) : null,
    approvalNodes: nodes.map((n: any) => ({
      id: n.id, name: n.node_name, role: n.node_role, level: n.node_level,
      assignee: n.assignee_name, status: n.status, comment: n.comment, operatedAt: n.operated_at
    })),
    formData: JSON.parse(r.form_data || '{}'),
    createdAt: r.created_at, updatedAt: r.updated_at
  });
}));

export default router;
