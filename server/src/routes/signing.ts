import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { success, error, asyncHandler, authRequired, AuthRequest } from '../middleware';

const router = Router();

router.get('/documents', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const { status } = req.query as any;
  const db = getDb();
  let sql = `SELECT sd.* FROM sign_documents sd
    INNER JOIN apply_records ar ON sd.apply_id = ar.id
    WHERE ar.applicant_id = ?`;
  const params: any[] = [req.userId];
  if (status) { sql += ' AND sd.status = ?'; params.push(status); }
  sql += ' ORDER BY sd.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  success(res, rows.map((r: any) => ({
    id: r.id, applyId: r.apply_id, applyName: r.apply_name, title: r.title,
    documentType: r.document_type, content: r.content, fileUrl: r.file_url,
    pages: r.pages, signPositions: JSON.parse(r.sign_positions || '[]'),
    requireSignerCount: r.require_signer_count, status: r.status,
    deadline: r.deadline, createdAt: r.created_at
  })));
}));

router.get('/documents/:id', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  const r: any = db.prepare(`SELECT sd.* FROM sign_documents sd
    INNER JOIN apply_records ar ON sd.apply_id = ar.id
    WHERE sd.id = ? AND ar.applicant_id = ?`).get(req.params.id, req.userId);
  if (!r) return error(res, '文件不存在', 404);
  success(res, {
    id: r.id, applyId: r.apply_id, applyName: r.apply_name, title: r.title,
    documentType: r.document_type, content: r.content, pages: r.pages,
    signPositions: JSON.parse(r.sign_positions || '[]'),
    requireSignerCount: r.require_signer_count, status: r.status,
    deadline: r.deadline, createdAt: r.created_at
  });
}));

router.get('/documents/:id/logs', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM sign_logs WHERE document_id = ? ORDER BY action_timestamp`).all(req.params.id);
  success(res, rows.map((r: any) => ({
    id: r.id, documentId: r.document_id, userId: r.user_id, userName: r.user_name,
    action: r.action, timestamp: r.action_timestamp,
    deviceInfo: r.device_info, ip: r.ip, location: r.location,
    biometricType: r.biometric_type, biometricVerified: !!r.biometric_verified,
    tsaTimestamp: r.tsa_timestamp, tsaHash: r.tsa_hash
  })));
}));

router.post('/sign', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const { documentId, positionIndex = 0, signature, useSeal = true } = req.body;
  if (!documentId) return error(res, '缺少documentId');
  const db = getDb();
  const doc: any = db.prepare(`SELECT sd.*, ar.applicant_id FROM sign_documents sd
    INNER JOIN apply_records ar ON sd.apply_id = ar.id
    WHERE sd.id = ?`).get(documentId);
  if (!doc) return error(res, '文件不存在', 404);

  const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  const now = new Date();
  const tsaTime = now.toISOString().slice(0, 19).replace('T', ' ') + '.' + String(now.getMilliseconds()).padStart(3, '0');
  const tsaHash = 'SHA256:' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  const logId = uuidv4();

  const trx = db.transaction(() => {
    db.prepare(`INSERT INTO sign_logs (id, document_id, user_id, user_name, action, action_timestamp,
      device_info, ip, location, biometric_type, biometric_verified, biometric_score,
      tsa_timestamp, tsa_hash, tsa_serial, signature_data, signature_type)
      VALUES (?, ?, ?, ?, 'sign', ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`).run(
      logId, documentId, req.userId, user.name, now.toISOString().slice(0, 19).replace('T', ' '),
      req.headers['user-agent'] || 'unknown',
      req.ip || '127.0.0.1', null, 'face', 98.5,
      tsaTime, tsaHash, 'TSA' + Date.now(), signature || null, 'SM2'
    );

    const positions = JSON.parse(doc.sign_positions || '[]');
    if (positions[positionIndex]) {
      positions[positionIndex].signedAt = now.toISOString().slice(0, 19).replace('T', ' ');
      positions[positionIndex].signerName = user.name;
      positions[positionIndex].signature = signature;
      if (useSeal) positions[positionIndex].seal = 'seal_applied';
    }
    const signedCount = positions.filter((p: any) => p.signedAt).length;
    const status = signedCount >= doc.require_signer_count ? 'completed' : 'signing';

    db.prepare('UPDATE sign_documents SET sign_positions = ?, status = ? WHERE id = ?')
      .run(JSON.stringify(positions), status, documentId);

    if (status === 'completed') {
      db.prepare(`UPDATE apply_records SET status = 'reviewing', current_step = 2, updated_at = ? WHERE id = ?`)
        .run(now.toISOString().slice(0, 19).replace('T', ' '), doc.apply_id);
      const firstPending: any = db.prepare(`SELECT * FROM approval_nodes
        WHERE apply_id = ? AND status = 'pending' ORDER BY node_level LIMIT 1`).get(doc.apply_id);
      if (firstPending) {
        const reviewers = db.prepare("SELECT * FROM users WHERE role IN ('reviewer','admin') ORDER BY RANDOM() LIMIT 1").get() as any;
        db.prepare(`UPDATE approval_nodes SET status = 'processing', assignee_id = ?, assignee_name = ? WHERE id = ?`)
          .run(reviewers.id, reviewers.name, firstPending.id);
      }
    }
    db.prepare("UPDATE todos SET is_read = 1 WHERE related_id = ? AND type = 'sign' AND user_id = ?")
      .run(documentId, req.userId);
  });
  trx();

  console.log(`[Sign] Signed: doc=${documentId}, user=${user.name}, tsa=${tsaTime}`);
  success(res, {
    success: true,
    signLog: { id: logId, tsaTimestamp: tsaTime, tsaHash },
    tsaInfo: { ts: now.getTime(), serialNumber: 'TSA' + Date.now() }
  }, '电子签名完成');
}));

router.post('/evidence', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const { applyId } = req.body;
  if (!applyId) return error(res, '缺少applyId');
  const db = getDb();
  const apply: any = db.prepare('SELECT * FROM apply_records WHERE id = ? AND applicant_id = ?').get(applyId, req.userId);
  if (!apply) return error(res, '申请不存在', 404);

  const items = [
    `${apply.item_name}_申请表.pdf`,
    `${apply.item_name}_签署日志.json`,
    '时间戳验证报告.pdf',
    'CA证书信息.pem',
    '审批流程记录.pdf'
  ];
  const size = Math.floor(2000000 + Math.random() * 3000000);
  const hash = 'SHA256:' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  const archiveId = uuidv4();

  db.prepare(`INSERT INTO archives (id, apply_id, archive_name, file_hash, file_size, items, archived_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`).run(
    archiveId, applyId, `证据包_${applyId}.zip`, hash, size, JSON.stringify(items)
  );

  console.log(`[Evidence] Package created: ${archiveId}, apply=${applyId}`);
  success(res, {
    id: archiveId, applyId, fileName: `证据包_${applyId}.zip`,
    fileHash: hash, createdAt: new Date().toISOString(),
    size, items
  }, '证据包生成成功');
}));

export default router;
