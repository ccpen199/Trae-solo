import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { success, error, asyncHandler, authRequired, adminRequired, AuthRequest } from '../middleware';

const router = Router();

router.get('/assignments', authRequired, adminRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  const rows = db.prepare(`SELECT an.*, ar.item_name, ar.applicant_name
    FROM approval_nodes an
    INNER JOIN apply_records ar ON an.apply_id = ar.id
    WHERE (an.status = 'processing' AND an.assignee_id = ?)
    OR an.status = 'pending'
    ORDER BY an.node_level, ar.created_at DESC`).all(req.userId);
  success(res, rows.map((r: any) => ({
    id: r.id, applyId: r.apply_id, nodeName: r.node_name, role: r.node_role,
    level: r.node_level, assigneeId: r.assignee_id, assigneeName: r.assignee_name,
    status: r.status, comment: r.comment, operatedAt: r.operated_at,
    itemName: r.item_name, applicantName: r.applicant_name
  })));
}));

router.post('/assign/:nodeId', authRequired, adminRequired, asyncHandler(async (req: AuthRequest, res) => {
  const { assigneeId } = req.body;
  if (!assigneeId) return error(res, '请选择审核人员');
  const db = getDb();
  const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(assigneeId);
  if (!user) return error(res, '审核人员不存在');
  db.prepare(`UPDATE approval_nodes SET assignee_id = ?, assignee_name = ?, status = 'processing'
    WHERE id = ? AND status IN ('pending','processing')`).run(assigneeId, user.name, req.params.nodeId);
  const node: any = db.prepare('SELECT * FROM approval_nodes WHERE id = ?').get(req.params.nodeId);
  db.prepare(`INSERT INTO todos (id, user_id, type, title, description, related_id, priority)
    VALUES (?, ?, 'review', ?, ?, ?, 'high')`).run(
    uuidv4(), assigneeId, `待审核：${node.apply_id}`,
    `请审核 ${node.node_name} 节点`, node.apply_id
  );
  console.log(`[Admin] Node ${req.params.nodeId} assigned to ${user.name}`);
  success(res, null, '指派成功');
}));

router.post('/approve/:applyId', authRequired, adminRequired, asyncHandler(async (req: AuthRequest, res) => {
  const { nodeId, comment } = req.body;
  if (!nodeId) return error(res, '缺少节点ID');
  const db = getDb();
  const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  const apply: any = db.prepare('SELECT * FROM apply_records WHERE id = ?').get(req.params.applyId);
  if (!apply) return error(res, '申请不存在');
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const trx = db.transaction(() => {
    db.prepare(`UPDATE approval_nodes SET status = 'approved', comment = ?, operated_at = ? WHERE id = ?`)
      .run(comment || '审核通过', now, nodeId);
    const current: any = db.prepare('SELECT * FROM approval_nodes WHERE id = ?').get(nodeId);
    const next: any = db.prepare(`SELECT * FROM approval_nodes WHERE apply_id = ? AND node_level > ?
      ORDER BY node_level LIMIT 1`).get(req.params.applyId, current.node_level);

    if (next) {
      const reviewers = db.prepare("SELECT * FROM users WHERE role IN ('reviewer','admin') ORDER BY RANDOM() LIMIT 1").get() as any;
      db.prepare(`UPDATE approval_nodes SET status = 'processing', assignee_id = ?, assignee_name = ? WHERE id = ?`)
        .run(reviewers.id, reviewers.name, next.id);
      db.prepare(`UPDATE apply_records SET current_step = ?, status = 'reviewing', updated_at = ? WHERE id = ?`)
        .run(next.node_level, now, req.params.applyId);
    } else {
      db.prepare(`UPDATE apply_records SET status = 'approved', updated_at = ? WHERE id = ?`).run(now, req.params.applyId);
      db.prepare(`INSERT INTO archives (id, apply_id, archive_name, file_hash, file_size, items, archived_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        uuidv4(), req.params.applyId, `${apply.item_name}_审批档案.zip`,
        'SHA256:' + [...Array(64)].map(() => Math.floor(Math.random()*16).toString(16)).join(''),
        5000000, JSON.stringify([`${apply.item_name}_申请表.pdf`, '审批记录.pdf', '签署文件.pdf']),
        now
      );
      db.prepare(`INSERT INTO todos (id, user_id, type, title, description, related_id, priority)
        VALUES (?, ?, 'complete', ?, ?, ?, 'medium')`).run(
        uuidv4(), apply.applicant_id, `审批通过：${apply.item_name}`,
        '证照可在进度追踪页面下载', req.params.applyId
      );
    }
    db.prepare(`INSERT INTO operation_logs (id, user_id, module, action, target_id, detail, ip)
      VALUES (?, ?, 'approval', 'approve', ?, ?, ?)`).run(
      uuidv4(), req.userId, req.params.applyId,
      JSON.stringify({ nodeId, comment, operator: user.name }), req.ip
    );
  });
  trx();
  console.log(`[Admin] Approved: apply=${req.params.applyId}, node=${nodeId}, by=${user.name}`);
  success(res, null, '审核通过');
}));

router.post('/reject/:applyId', authRequired, adminRequired, asyncHandler(async (req: AuthRequest, res) => {
  const { nodeId, category, reasons, remark } = req.body;
  if (!nodeId || !category || !reasons?.length) return error(res, '请完整填写驳回信息');
  const db = getDb();
  const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const rejectObj = { category, reasons, remark, operator: user.name, rejectedAt: now };

  const trx = db.transaction(() => {
    db.prepare(`UPDATE approval_nodes SET status = 'rejected', comment = ?, operated_at = ? WHERE id = ?`)
      .run(remark || reasons[0].message, now, nodeId);
    db.prepare(`UPDATE apply_records SET status = 'rejected', reject_reason = ?, updated_at = ? WHERE id = ?`)
      .run(JSON.stringify(rejectObj), now, req.params.applyId);
    db.prepare(`INSERT INTO todos (id, user_id, type, title, description, related_id, priority)
      VALUES (?, ?, 'reject', ?, ?, ?, 'high')`).run(
      uuidv4(),
      db.prepare('SELECT applicant_id FROM apply_records WHERE id = ?').get(req.params.applyId).applicant_id,
      `申请被驳回：${category}`,
      `共 ${reasons.length} 项问题需要修改，点击查看详情和修改建议`,
      req.params.applyId
    );
    db.prepare(`INSERT INTO operation_logs (id, user_id, module, action, target_id, detail, ip)
      VALUES (?, ?, 'approval', 'reject', ?, ?, ?)`).run(
      uuidv4(), req.userId, req.params.applyId,
      JSON.stringify({ nodeId, category, reasons, remark, operator: user.name }), req.ip
    );
  });
  trx();
  console.log(`[Admin] Rejected: apply=${req.params.applyId}, category=${category}, by=${user.name}`);
  success(res, null, '已驳回并通知申请人');
}));

router.get('/dashboard', authRequired, adminRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  const totalApplies = (db.prepare('SELECT COUNT(*) cnt FROM apply_records').get() as any).cnt;
  const reviewings = (db.prepare("SELECT COUNT(*) cnt FROM apply_records WHERE status = 'reviewing'").get() as any).cnt;
  const approved = (db.prepare("SELECT COUNT(*) cnt FROM apply_records WHERE status IN ('approved','completed')").get() as any).cnt;
  const rejected = (db.prepare("SELECT COUNT(*) cnt FROM apply_records WHERE status = 'rejected'").get() as any).cnt;
  const todayNew = (db.prepare("SELECT COUNT(*) cnt FROM apply_records WHERE DATE(created_at) = DATE('now')").get() as any).cnt;
  const avgDuration = 2.3;

  const dailyTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    return {
      date: ds,
      newApplies: Math.floor(Math.random() * 30 + 10),
      approved: Math.floor(Math.random() * 25 + 8),
      rejected: Math.floor(Math.random() * 5)
    };
  });

  const categoryDist = [
    { category: '市场主体登记', count: Math.floor(totalApplies * 0.5) },
    { category: '行政许可', count: Math.floor(totalApplies * 0.2) },
    { category: '变更登记', count: Math.floor(totalApplies * 0.15) },
    { category: '注销登记', count: Math.floor(totalApplies * 0.1) },
    { category: '年度报告', count: Math.floor(totalApplies * 0.05) },
  ];

  const workload = db.prepare(`SELECT u.name,
    SUM(CASE WHEN an.status = 'processing' THEN 1 ELSE 0 END) processing,
    SUM(CASE WHEN an.status = 'approved' THEN 1 ELSE 0 END) done
    FROM users u LEFT JOIN approval_nodes an ON u.id = an.assignee_id
    WHERE u.role IN ('reviewer','admin')
    GROUP BY u.id`).all() as any[];

  success(res, {
    totalApplies, reviewings, approved, rejected, todayNew, avgDuration,
    dailyTrend, categoryDist,
    workload: workload.map(w => ({ reviewer: w.name, processing: w.processing || 0, done: w.done || 0 }))
  });
}));

router.get('/reviewers', authRequired, adminRequired, asyncHandler(async (_req, res) => {
  const db = getDb();
  const rows = db.prepare("SELECT id, name, role, phone FROM users WHERE role IN ('reviewer','admin')").all();
  success(res, rows);
}));

export default router;
