import express from 'express';
import db from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import crypto from 'crypto';
import forge from 'node-forge';

const router = express.Router();

router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const seals = db.prepare(`
      SELECT id, seal_name, seal_type, gb_standard, status, created_at
      FROM electronic_seals 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user?.id);

    res.json({
      code: 200,
      data: seals
    });
  } catch (error) {
    logger.error('获取电子印章列表失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.post('/', authenticateToken, (req: AuthRequest, res) => {
  const { sealName, sealType } = req.body;

  if (!sealName) {
    return res.status(400).json({ code: 400, message: '印章名称不能为空' });
  }

  try {
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const privateKey = forge.pki.privateKeyToPem(keys.privateKey);
    const certificate = forge.pki.certificateFromPem(forge.pki.createCertificate().publicKey = keys.publicKey);

    const sealData = {
      name: sealName,
      type: sealType,
      standard: 'GB/T 33481-2016',
      createTime: new Date().toISOString(),
      userId: req.user?.id
    };

    const result = db.prepare(`
      INSERT INTO electronic_seals 
      (user_id, seal_name, seal_type, seal_data, certificate, private_key, gb_standard, status)
      VALUES (?, ?, ?, ?, ?, ?, 'GB/T 33481-2016', 1)
    `).run(req.user?.id, sealName, sealType, JSON.stringify(sealData), 
           forge.pki.certificateToPem(certificate as any), privateKey);

    db.prepare(`
      INSERT INTO operation_logs (user_id, action, module, detail)
      VALUES (?, ?, ?, ?)
    `).run(req.user?.id, '创建电子印章', '电子印章系统', sealName);

    logger.info(`电子印章创建成功: ${sealName}`);
    res.json({ code: 200, message: '印章创建成功', data: { id: result.lastInsertRowid } });
  } catch (error) {
    logger.error('创建电子印章失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.post('/:id/sign', authenticateToken, (req: AuthRequest, res) => {
  const { documentName, documentHash } = req.body;

  if (!documentHash) {
    return res.status(400).json({ code: 400, message: '文档哈希不能为空' });
  }

  try {
    const seal = db.prepare('SELECT * FROM electronic_seals WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user?.id) as any;

    if (!seal) {
      return res.status(404).json({ code: 404, message: '印章不存在' });
    }

    if (seal.status !== 1) {
      return res.status(400).json({ code: 400, message: '印章已停用' });
    }

    const privateKey = forge.pki.privateKeyFromPem(seal.private_key);
    const md = forge.md.sha256.create();
    md.update(documentHash, 'utf8');
    const signature = forge.util.encode64(privateKey.sign(md));

    const result = db.prepare(`
      INSERT INTO seal_records (seal_id, document_name, document_hash, signature, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, documentName, documentHash, signature, req.ip);

    db.prepare(`
      INSERT INTO operation_logs (user_id, action, module, detail)
      VALUES (?, ?, ?, ?)
    `).run(req.user?.id, '文档盖章', '电子印章系统', documentName);

    logger.info(`文档盖章成功: ${documentName}`);
    res.json({
      code: 200,
      message: '盖章成功',
      data: {
        recordId: result.lastInsertRowid,
        signature,
        signTime: new Date().toISOString(),
        standard: 'GB/T 33481-2016'
      }
    });
  } catch (error) {
    logger.error('文档盖章失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.get('/records/list', authenticateToken, (req: AuthRequest, res) => {
  try {
    const records = db.prepare(`
      SELECT sr.*, es.seal_name 
      FROM seal_records sr
      LEFT JOIN electronic_seals es ON sr.seal_id = es.id
      WHERE es.user_id = ?
      ORDER BY sr.created_at DESC
      LIMIT 20
    `).all(req.user?.id);

    res.json({
      code: 200,
      data: records
    });
  } catch (error) {
    logger.error('获取用印记录失败', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

export default router;
