import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../utils/database';
import fs from 'fs';
import path from 'path';

export function getTrades(req: AuthRequest, res: Response) {
  const { category } = req.query;
  let sql = 'SELECT * FROM trades WHERE 1=1';
  const params: any[] = [];
  
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  
  const trades = db.prepare(sql + ' ORDER BY gb_code').all(...params);
  res.json(trades);
}

export function submitCertification(req: AuthRequest, res: Response) {
  const workerId = req.user!.id;
  const { tradeId, certificateNumber, certificateType, certificateImage } = req.body;

  if (!tradeId || !certificateNumber || !certificateType) {
    return res.status(400).json({ message: '请填写完整的证书信息' });
  }

  const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(tradeId) as any;
  if (!trade) {
    return res.status(400).json({ message: '选择的工种不存在' });
  }

  const ocrResult = simulateOCR(certificateType, certificateNumber, req.user!.username);
  const verificationResult = simulateGovernmentVerification(certificateNumber);

  const insert = db.prepare(`
    INSERT INTO trade_certifications 
    (worker_id, trade_id, certificate_number, certificate_type, certificate_image, 
     ocr_result, ocr_confidence, verification_source, verification_status, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'government_simulation', ?, CURRENT_TIMESTAMP)
  `);

  const result = insert.run(
    workerId,
    tradeId,
    certificateNumber,
    certificateType,
    certificateImage || null,
    JSON.stringify(ocrResult),
    0.95,
    verificationResult ? 'verified' : 'rejected'
  );

  if (verificationResult) {
    db.prepare('UPDATE worker_profiles SET skill_level = MAX(skill_level, 1) WHERE user_id = ?').run(workerId);
  }

  res.json({
    id: result.lastInsertRowid,
    status: verificationResult ? 'verified' : 'rejected',
    ocrResult,
    message: verificationResult ? '证书核验通过' : '证书核验失败，请检查证书编号'
  });
}

function simulateOCR(certType: string, certNumber: string, username?: string) {
  return {
    certificateType: certType,
    certificateNumber: certNumber,
    holderName: username || '模拟用户',
    issueDate: '2020-01-01',
    expiryDate: '2026-01-01',
    issuingAuthority: '住房和城乡建设部'
  };
}

function simulateGovernmentVerification(certNumber: string) {
  return certNumber.length >= 8 && /^[A-Za-z0-9]+$/.test(certNumber);
}

export function getMyCertifications(req: AuthRequest, res: Response) {
  const workerId = req.user!.id;
  
  const certifications = db.prepare(`
    SELECT tc.*, t.gb_code, t.gb_name, t.category
    FROM trade_certifications tc
    JOIN trades t ON tc.trade_id = t.id
    WHERE tc.worker_id = ?
    ORDER BY tc.created_at DESC
  `).all(workerId) as any[];

  res.json(certifications);
}

export function getCertificationDetail(req: AuthRequest, res: Response) {
  const { id } = req.params;
  
  const certification = db.prepare(`
    SELECT tc.*, t.gb_code, t.gb_name, t.category, u.real_name as worker_name
    FROM trade_certifications tc
    JOIN trades t ON tc.trade_id = t.id
    JOIN users u ON tc.worker_id = u.id
    WHERE tc.id = ?
  `).get(id) as any;

  if (!certification) {
    return res.status(404).json({ message: '认证记录不存在' });
  }

  if (req.user!.role === 'worker' && certification.worker_id !== req.user!.id) {
    return res.status(403).json({ message: '无权查看他人认证' });
  }

  res.json(certification);
}

export function getAllCertifications(req: AuthRequest, res: Response) {
  const { verificationStatus, page, pageSize } = req.query;

  if (req.user!.role !== 'admin') {
    return res.status(403).json({ message: '只有管理员可以获取所有认证记录' });
  }

  let countSql = 'SELECT COUNT(*) as total FROM trade_certifications tc WHERE 1=1';
  let sql = `
    SELECT tc.id, tc.worker_id AS "workerId", tc.trade_id AS "tradeId",
           tc.certificate_number AS "certificateNumber",
           tc.certificate_type AS "certificateType",
           tc.certificate_image AS "certificateImage",
           tc.ocr_result AS "ocrResult", tc.ocr_confidence AS "ocrConfidence",
           tc.verification_source AS "verificationSource",
           tc.verification_status AS "verificationStatus",
           tc.verified_at AS "verifiedAt", tc.verified_by AS "verifiedBy",
           tc.created_at AS "createdAt",
           t.gb_code AS "gbCode", t.gb_name AS "gbName", t.category,
           u.real_name AS "workerName", u.username, u.phone
    FROM trade_certifications tc
    JOIN trades t ON tc.trade_id = t.id
    JOIN users u ON tc.worker_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  const countParams: any[] = [];

  if (verificationStatus) {
    sql += ' AND tc.verification_status = ?';
    countSql += ' AND tc.verification_status = ?';
    params.push(verificationStatus);
    countParams.push(verificationStatus);
  }

  sql += ' ORDER BY tc.created_at DESC';

  const p = parseInt(page as string) || 1;
  const ps = parseInt(pageSize as string) || 20;
  const offset = (p - 1) * ps;
  sql += ' LIMIT ? OFFSET ?';
  params.push(ps, offset);

  const certifications = db.prepare(sql).all(...params) as any[];
  const countResult = db.prepare(countSql).get(...countParams) as any;

  res.json({
    certifications,
    total: countResult.total,
    page: p,
    pageSize: ps
  });
}

export function verifyCertification(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { status } = req.body;

  const certification = db.prepare('SELECT * FROM trade_certifications WHERE id = ?').get(id) as any;
  if (!certification) {
    return res.status(404).json({ message: '认证记录不存在' });
  }

  db.prepare(`
    UPDATE trade_certifications 
    SET verification_status = ?, verified_at = CURRENT_TIMESTAMP, verified_by = ?
    WHERE id = ?
  `).run(status, req.user!.id, id);

  if (status === 'verified') {
    db.prepare('UPDATE worker_profiles SET skill_level = MAX(skill_level, 1) WHERE user_id = ?').run(certification.worker_id);
  }

  res.json({ message: '审核完成', status });
}

export function uploadCertificateImage(req: AuthRequest, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: '请上传证书图片' });
  }

  const uploadDir = path.join(__dirname, '../../uploads/certificates');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `${Date.now()}_${req.file.originalname}`;
  const filePath = path.join(uploadDir, fileName);
  
  fs.writeFileSync(filePath, req.file.buffer);

  const url = `/uploads/certificates/${fileName}`;
  res.json({ url, fileName });
}
