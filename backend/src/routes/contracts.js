const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { generateId, computeFileHash, buildSuccessResponse, buildErrorResponse } = require('../utils');
const { authMiddleware } = require('../middleware/auth');
const timeStampEngine = require('../engines/timeStampEngine');
const evidenceBlockEngine = require('../engines/evidenceBlockEngine');
const signatureEngine = require('../engines/signatureEngine');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = generateId() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(
        buildErrorResponse(new Error('未上传文件'), '请选择要上传的文件')
      );
    }
    
    const { title, signers } = req.body;
    
    if (!title) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json(
        buildErrorResponse(new Error('缺少合同标题'), '请填写合同标题')
      );
    }
    
    let parsedSigners = [];
    try {
      parsedSigners = signers ? JSON.parse(signers) : [];
    } catch (e) {
      parsedSigners = [];
    }
    
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = computeFileHash(fileBuffer);
    
    const contractId = generateId();
    
    const timeStampResult = timeStampEngine.lockInitialState(
      contractId,
      fileHash,
      req.user.userId
    );
    
    db.run(
      `INSERT INTO contracts 
       (id, title, initiator_id, file_path, file_hash, initial_timestamp, initial_time_token, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_signature')`,
      [
        contractId,
        title,
        req.user.userId,
        req.file.path,
        fileHash,
        timeStampResult.timestamp,
        timeStampResult.timeToken
      ]
    );
    
    const signerIds = [];
    for (const signer of parsedSigners) {
      const signerId = generateId();
      signerIds.push(signerId);
      
      db.run(
        `INSERT INTO signers 
         (id, contract_id, user_id, user_name, email, phone, sign_status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [
          signerId,
          contractId,
          signer.userId || null,
          signer.userName || signer.email || '签署方',
          signer.email || null,
          signer.phone || null
        ]
      );
    }
    
    await evidenceBlockEngine.createEvidenceBlock(
      contractId,
      'document_uploaded',
      { userId: req.user.userId, userName: req.user.realName || req.user.username },
      {
        fileName: req.file.originalname,
        fileHash,
        fileSize: req.file.size,
        signerCount: parsedSigners.length,
        timeToken: timeStampResult.timeToken
      }
    );
    
    db.run(
      `INSERT INTO file_versions 
       (id, contract_id, version, file_path, file_hash, timestamp, operator_id)
       VALUES (?, ?, 1, ?, ?, ?, ?)`,
      [
        generateId(),
        contractId,
        req.file.path,
        fileHash,
        timeStampResult.timestamp,
        req.user.userId
      ]
    );
    
    db.run(
      `INSERT INTO activity_logs 
       (id, contract_id, user_id, user_name, action, description)
       VALUES (?, ?, ?, ?, '上传合同', ?)`,
      [
        generateId(),
        contractId,
        req.user.userId,
        req.user.realName || req.user.username,
        `上传合同: ${title}`
      ]
    );
    
    res.json(buildSuccessResponse({
      contractId,
      title,
      fileHash,
      timestamp: timeStampResult.timestamp,
      timeToken: timeStampResult.timeToken,
      status: 'pending_signature',
      signers: parsedSigners.map((s, i) => ({
        id: signerIds[i],
        ...s
      }))
    }, '合同上传成功'));
    
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json(buildErrorResponse(error, '上传失败'));
  }
});

router.get('/list', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;
  const { status, initiatorOnly } = req.query;
  
  let query = `
    SELECT DISTINCT c.*, 
           (SELECT COUNT(*) FROM signers WHERE contract_id = c.id) as total_signers,
           (SELECT COUNT(*) FROM signers WHERE contract_id = c.id AND sign_status = 'signed') as signed_count
    FROM contracts c
    LEFT JOIN signers s ON c.id = s.contract_id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (initiatorOnly === 'true' || role === 'user') {
    query += ` AND (c.initiator_id = ? OR s.user_id = ?)`;
    params.push(userId, userId);
  }
  
  if (status) {
    query += ` AND c.status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY c.created_at DESC`;
  
  db.all(query, params, (err, contracts) => {
    if (err) {
      return res.status(500).json(buildErrorResponse(err, '获取合同列表失败'));
    }
    
    res.json(buildSuccessResponse({
      contracts: contracts.map(c => ({
        id: c.id,
        title: c.title,
        initiatorId: c.initiator_id,
        status: c.status,
        fileHash: c.file_hash,
        initialTimestamp: c.initial_timestamp,
        certificateId: c.certificate_id,
        totalSigners: c.total_signers,
        signedCount: c.signed_count,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }))
    }, '获取成功'));
  });
});

router.get('/:id', authMiddleware, (req, res) => {
  const contractId = req.params.id;
  const userId = req.user.userId;
  const role = req.user.role;
  
  db.get(
    `SELECT c.*, 
            (SELECT COUNT(*) FROM signers WHERE contract_id = c.id) as total_signers,
            (SELECT COUNT(*) FROM signers WHERE contract_id = c.id AND sign_status = 'signed') as signed_count
     FROM contracts c
     WHERE c.id = ?`,
    [contractId],
    async (err, contract) => {
      if (err) {
        return res.status(500).json(buildErrorResponse(err, '获取合同详情失败'));
      }
      
      if (!contract) {
        return res.status(404).json(
          buildErrorResponse(new Error('合同不存在'), '合同不存在')
        );
      }
      
      const isInitiator = contract.initiator_id === userId;
      const isLegalExpert = role === 'legal_expert';
      
      if (!isInitiator && !isLegalExpert) {
        const signer = await new Promise((resolve) => {
          db.get(
            `SELECT * FROM signers WHERE contract_id = ? AND user_id = ?`,
            [contractId, userId],
            (err, row) => resolve(row)
          );
        });
        
        if (!signer) {
          return res.status(403).json(
            buildErrorResponse(new Error('无权限'), '您没有权限查看此合同')
          );
        }
      }
      
      db.all(
        `SELECT * FROM signers WHERE contract_id = ? ORDER BY created_at ASC`,
        [contractId],
        (err, signers) => {
          if (err) {
            return res.status(500).json(buildErrorResponse(err, '获取签署方信息失败'));
          }
          
          res.json(buildSuccessResponse({
            contract: {
              id: contract.id,
              title: contract.title,
              initiatorId: contract.initiator_id,
              filePath: contract.file_path,
              fileHash: contract.file_hash,
              initialTimestamp: contract.initial_timestamp,
              initialTimeToken: contract.initial_time_token,
              status: contract.status,
              certificateId: contract.certificate_id,
              totalSigners: contract.total_signers,
              signedCount: contract.signed_count,
              createdAt: contract.created_at,
              updatedAt: contract.updated_at
            },
            signers: signers.map(s => ({
              id: s.id,
              userId: s.user_id,
              userName: s.user_name,
              email: s.email,
              phone: s.phone,
              identityVerified: s.identity_verified === 1,
              signStatus: s.sign_status,
              signedAt: s.signed_at,
              signatureHash: s.signature_hash
            }))
          }, '获取成功'));
        }
      );
    }
  );
});

router.get('/:id/download', authMiddleware, (req, res) => {
  const contractId = req.params.id;
  const userId = req.user.userId;
  const role = req.user.role;
  
  db.get(
    `SELECT * FROM contracts WHERE id = ?`,
    [contractId],
    (err, contract) => {
      if (err) {
        return res.status(500).json(buildErrorResponse(err, '获取合同信息失败'));
      }
      
      if (!contract) {
        return res.status(404).json(
          buildErrorResponse(new Error('合同不存在'), '合同不存在')
        );
      }
      
      const isInitiator = contract.initiator_id === userId;
      const isLegalExpert = role === 'legal_expert';
      const isSignerPromise = new Promise((resolve) => {
        db.get(
          `SELECT * FROM signers WHERE contract_id = ? AND user_id = ?`,
          [contractId, userId],
          (err, row) => resolve(!!row)
        );
      });
      
      isSignerPromise.then((isSigner) => {
        if (!isInitiator && !isLegalExpert && !isSigner) {
          return res.status(403).json(
            buildErrorResponse(new Error('无权限'), '您没有权限下载此合同')
          );
        }
        
        if (!fs.existsSync(contract.file_path)) {
          return res.status(404).json(
            buildErrorResponse(new Error('文件不存在'), '合同文件不存在')
          );
        }
        
        const fileName = `${contract.title}.pdf`;
        res.download(contract.file_path, fileName);
      });
    }
  );
});

router.get('/:id/activity-log', authMiddleware, (req, res) => {
  const contractId = req.params.id;
  const userId = req.user.userId;
  const role = req.user.role;
  
  db.all(
    `SELECT * FROM activity_logs WHERE contract_id = ? ORDER BY created_at DESC`,
    [contractId],
    (err, logs) => {
      if (err) {
        return res.status(500).json(buildErrorResponse(err, '获取操作日志失败'));
      }
      
      res.json(buildSuccessResponse({
        logs: logs.map(log => ({
          id: log.id,
          userId: log.user_id,
          userName: log.user_name,
          action: log.action,
          description: log.description,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          createdAt: log.created_at
        }))
      }, '获取成功'));
    }
  );
});

module.exports = router;
