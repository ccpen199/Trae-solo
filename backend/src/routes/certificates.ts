import express from 'express';
import db from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import crypto from 'crypto';

const router = express.Router();

router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const certificates = db.prepare(`
      SELECT * FROM electronic_certificates 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user?.id);

    res.json({
      code: 200,
      data: certificates
    });
  } catch (error) {
    logger.error('获取电子证照列表失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.post('/', authenticateToken, (req: AuthRequest, res) => {
  const { certType, certNumber, certName, issuer, expireDate } = req.body;

  if (!certType || !certNumber) {
    return res.status(400).json({ code: 400, message: '必填项不能为空' });
  }

  try {
    const signature = crypto.createHmac('sha256', 'lst-gov-secret')
      .update(`${certType}-${certNumber}-${Date.now()}`)
      .digest('hex');

    const result = db.prepare(`
      INSERT INTO electronic_certificates 
      (user_id, cert_type, cert_number, cert_name, issuer, issuer_signature, 
       issue_date, expire_date, status, share_chain)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
    `).run(req.user?.id, certType, certNumber, certName, issuer, signature, expireDate, 1, 
           JSON.stringify([{ dept: issuer, time: new Date().toISOString(), action: '签发' }]));

    db.prepare(`
      INSERT INTO operation_logs (user_id, action, module, detail)
      VALUES (?, ?, ?, ?)
    `).run(req.user?.id, '添加电子证照', '电子证照库', certName);

    logger.info(`电子证照添加成功: ${certName}`);
    res.json({ code: 200, message: '添加成功', data: { id: result.lastInsertRowid } });
  } catch (error) {
    logger.error('添加电子证照失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.get('/:id/verify', authenticateToken, (req: AuthRequest, res) => {
  try {
    const cert = db.prepare('SELECT * FROM electronic_certificates WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user?.id) as any;

    if (!cert) {
      return res.status(404).json({ code: 404, message: '证照不存在' });
    }

    const now = new Date();
    const expireDate = new Date(cert.expire_date);
    const isValid = cert.status === 1 && expireDate > now;

    db.prepare(`
      UPDATE electronic_certificates 
      SET verify_count = verify_count + 1, last_verify_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);

    res.json({
      code: 200,
      data: {
        valid: isValid,
        message: isValid ? '证照有效' : (cert.status !== 1 ? '证照已注销' : '证照已过期'),
        expireDate: cert.expire_date,
        daysRemaining: isValid ? Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
      }
    });
  } catch (error) {
    logger.error('证照校验失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.post('/:id/share', authenticateToken, (req: AuthRequest, res) => {
  const { targetDept, purpose } = req.body;

  try {
    const cert = db.prepare('SELECT share_chain FROM electronic_certificates WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user?.id) as any;

    if (!cert) {
      return res.status(404).json({ code: 404, message: '证照不存在' });
    }

    const shareChain = JSON.parse(cert.share_chain || '[]');
    shareChain.push({
      dept: targetDept,
      time: new Date().toISOString(),
      action: '授权访问',
      purpose
    });

    db.prepare(`
      UPDATE electronic_certificates SET share_chain = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(shareChain), req.params.id);

    db.prepare(`
      INSERT INTO operation_logs (user_id, action, module, detail)
      VALUES (?, ?, ?, ?)
    `).run(req.user?.id, '证照共享授权', '电子证照库', `目标部门: ${targetDept}`);

    res.json({ code: 200, message: '授权成功' });
  } catch (error) {
    logger.error('证照共享授权失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

export default router;
