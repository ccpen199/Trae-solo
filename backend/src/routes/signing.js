const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const db = require('../database');
const { generateId, computeFileHash, buildSuccessResponse, buildErrorResponse } = require('../utils');
const { authMiddleware } = require('../middleware/auth');
const signatureEngine = require('../engines/signatureEngine');
const timeStampEngine = require('../engines/timeStampEngine');
const evidenceBlockEngine = require('../engines/evidenceBlockEngine');
const sealManagerEngine = require('../engines/sealManagerEngine');

router.post('/verify-identity', authMiddleware, async (req, res) => {
  try {
    const { contractId, signerId } = req.body;
    
    if (!contractId || !signerId) {
      return res.status(400).json(
        buildErrorResponse(new Error('缺少参数'), '合同ID和签署方ID不能为空')
      );
    }
    
    const signer = await new Promise((resolve, reject) => {
      db.get(
        `SELECT s.*, u.identity_verified as user_identity_verified, u.real_name
         FROM signers s
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.id = ? AND s.contract_id = ?`,
        [signerId, contractId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!signer) {
      return res.status(404).json(
        buildErrorResponse(new Error('签署方不存在'), '签署方信息不存在')
      );
    }
    
    if (signer.user_id !== req.user.userId) {
      return res.status(403).json(
        buildErrorResponse(new Error('无权限'), '您不是该合同的签署方')
      );
    }
    
    if (signer.sign_status !== 'pending') {
      return res.status(400).json(
        buildErrorResponse(new Error('状态错误'), '该签署方已完成签署或签署状态异常')
      );
    }
    
    const userVerified = signer.user_identity_verified === 1;
    
    if (!userVerified) {
      return res.status(400).json(
        buildErrorResponse(new Error('身份未认证'), '请先完成实名认证后再签署')
      );
    }
    
    db.run(
      `UPDATE signers SET identity_verified = 1 WHERE id = ?`,
      [signerId]
    );
    
    const seals = await sealManagerEngine.getSealForSigning(contractId, req.user.userId);
    
    await evidenceBlockEngine.createEvidenceBlock(
      contractId,
      'identity_verified',
      { userId: req.user.userId, userName: signer.real_name || req.user.realName },
      {
        signerId,
        verificationMethod: 'system_identity_verified',
        verifiedAt: new Date().toISOString()
      }
    );
    
    db.run(
      `INSERT INTO activity_logs 
       (id, contract_id, user_id, user_name, action, description)
       VALUES (?, ?, ?, ?, '身份核验', ?)`,
      [
        generateId(),
        contractId,
        req.user.userId,
        signer.real_name || req.user.realName,
        `签署方身份核验通过`
      ]
    );
    
    res.json(buildSuccessResponse({
      identityVerified: true,
      signerId,
      contractId,
      availableSeals: seals.availableSeals || [seals.seal],
      recommendedSeal: seals.seal
    }, '身份核验通过'));
    
  } catch (error) {
    res.status(500).json(buildErrorResponse(error, '身份核验失败'));
  }
});

router.post('/sign', authMiddleware, async (req, res) => {
  try {
    const { contractId, signerId, sealId } = req.body;
    
    if (!contractId || !signerId) {
      return res.status(400).json(
        buildErrorResponse(new Error('缺少参数'), '合同ID和签署方ID不能为空')
      );
    }
    
    const contract = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM contracts WHERE id = ?`,
        [contractId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!contract) {
      return res.status(404).json(
        buildErrorResponse(new Error('合同不存在'), '合同不存在')
      );
    }
    
    const signer = await new Promise((resolve, reject) => {
      db.get(
        `SELECT s.*, u.real_name, u.identity_verified as user_verified
         FROM signers s
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.id = ? AND s.contract_id = ?`,
        [signerId, contractId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!signer) {
      return res.status(404).json(
        buildErrorResponse(new Error('签署方不存在'), '签署方信息不存在')
      );
    }
    
    if (signer.user_id !== req.user.userId) {
      return res.status(403).json(
        buildErrorResponse(new Error('无权限'), '您不是该合同的签署方')
      );
    }
    
    if (signer.sign_status === 'signed') {
      return res.status(400).json(
        buildErrorResponse(new Error('已签署'), '您已完成该合同的签署')
      );
    }
    
    if (signer.identity_verified !== 1 && signer.user_verified !== 1) {
      return res.status(400).json(
        buildErrorResponse(new Error('未核验身份'), '请先完成身份核验')
      );
    }
    
    if (!fs.existsSync(contract.file_path)) {
      return res.status(404).json(
        buildErrorResponse(new Error('文件不存在'), '合同文件不存在')
      );
    }
    
    const fileBuffer = fs.readFileSync(contract.file_path);
    const fileHash = computeFileHash(fileBuffer);
    
    const keyPair = signatureEngine.generateKeyPair(req.user.userId);
    
    const signatureResult = signatureEngine.signDocument(
      fileHash,
      keyPair.privateKey,
      req.user.userId
    );
    
    const timeStampResult = timeStampEngine.generateTimestamp(
      signatureResult.signature,
      { contractId, signerId, operation: 'document_signing' }
    );
    
    const signedAt = new Date().toISOString();
    
    db.run(
      `UPDATE signers 
       SET sign_status = 'signed', 
           signed_at = ?, 
           signature_hash = ?,
           identity_verified = 1
       WHERE id = ?`,
      [signedAt, signatureResult.signature, signerId]
    );
    
    await evidenceBlockEngine.createEvidenceBlock(
      contractId,
      'document_signed',
      { userId: req.user.userId, userName: signer.real_name || req.user.realName },
      {
        signerId,
        signature: signatureResult.signature,
        signatureHash: fileHash,
        timestamp: timeStampResult.timestamp,
        timeToken: timeStampResult.timeToken,
        sealId: sealId
      }
    );
    
    const allSigners = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM signers WHERE contract_id = ?`,
        [contractId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    const allSigned = allSigners.every(s => s.sign_status === 'signed');
    
    if (allSigned) {
      const certificateResult = signatureEngine.issueCertificate(
        contractId,
        {
          signers: allSigners.map(s => ({
            userId: s.user_id,
            userName: s.user_name,
            signedAt: s.signed_at
          }))
        },
        {
          fileHash: contract.file_hash,
          initialTimestamp: contract.initial_timestamp
        }
      );
      
      db.run(
        `INSERT INTO certificates 
         (id, contract_id, certificate_number, certificate_data, issued_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          certificateResult.certificateNumber,
          contractId,
          certificateResult.certificateNumber,
          JSON.stringify(certificateResult.certificateData),
          new Date().toISOString()
        ]
      );
      
      db.run(
        `UPDATE contracts 
         SET status = 'completed', certificate_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [certificateResult.certificateNumber, contractId]
      );
      
      await evidenceBlockEngine.createEvidenceBlock(
        contractId,
        'certificate_issued',
        { userId: 'system', userName: '系统' },
        {
          certificateNumber: certificateResult.certificateNumber,
          certificateHash: certificateResult.hash,
          issuedAt: certificateResult.certificateData.issuedAt
        }
      );
      
      await evidenceBlockEngine.createEvidenceBlock(
        contractId,
        'contract_completed',
        { userId: 'system', userName: '系统' },
        {
          totalSigners: allSigners.length,
          completedAt: new Date().toISOString()
        }
      );
      
    } else {
      db.run(
        `UPDATE contracts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [contractId]
      );
    }
    
    db.run(
      `INSERT INTO activity_logs 
       (id, contract_id, user_id, user_name, action, description)
       VALUES (?, ?, ?, ?, '签署合同', ?)`,
      [
        generateId(),
        contractId,
        req.user.userId,
        signer.real_name || req.user.realName,
        `完成合同签署`
      ]
    );
    
    const updatedContract = await new Promise((resolve, reject) => {
      db.get(
        `SELECT c.*, 
                (SELECT COUNT(*) FROM signers WHERE contract_id = c.id) as total_signers,
                (SELECT COUNT(*) FROM signers WHERE contract_id = c.id AND sign_status = 'signed') as signed_count
         FROM contracts c
         WHERE c.id = ?`,
        [contractId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    res.json(buildSuccessResponse({
      contractId,
      signerId,
      signedAt,
      signature: signatureResult.signature,
      timestamp: timeStampResult.timestamp,
      timeToken: timeStampResult.timeToken,
      contractStatus: updatedContract.status,
      totalSigners: updatedContract.total_signers,
      signedCount: updatedContract.signed_count,
      allSigned: updatedContract.status === 'completed',
      certificateId: updatedContract.certificate_id
    }, '签署成功'));
    
  } catch (error) {
    console.error('Sign error:', error);
    res.status(500).json(buildErrorResponse(error, '签署失败'));
  }
});

router.get('/my-pending', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  
  db.all(
    `SELECT s.*, c.title, c.status as contract_status, c.file_hash, c.initial_timestamp
     FROM signers s
     JOIN contracts c ON s.contract_id = c.id
     WHERE s.user_id = ? AND s.sign_status = 'pending'
     ORDER BY c.created_at DESC`,
    [userId],
    (err, pendingSignatures) => {
      if (err) {
        return res.status(500).json(buildErrorResponse(err, '获取待签署列表失败'));
      }
      
      res.json(buildSuccessResponse({
        pendingCount: pendingSignatures.length,
        pendingSignatures: pendingSignatures.map(p => ({
          contractId: p.contract_id,
          signerId: p.id,
          title: p.title,
          contractStatus: p.contract_status,
          fileHash: p.file_hash,
          initialTimestamp: p.initial_timestamp,
          signStatus: p.sign_status,
          identityVerified: p.identity_verified === 1
        }))
      }, '获取成功'));
    }
  );
});

module.exports = router;
