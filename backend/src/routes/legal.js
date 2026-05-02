const express = require('express');
const router = express.Router();
const db = require('../database');
const { buildSuccessResponse, buildErrorResponse, generateId } = require('../utils');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const evidenceBlockEngine = require('../engines/evidenceBlockEngine');
const signatureEngine = require('../engines/signatureEngine');

router.get('/contracts', authMiddleware, roleMiddleware(['legal_expert', 'admin']), (req, res) => {
  const { status, fromDate, toDate, search } = req.query;
  
  let query = `
    SELECT c.*,
           (SELECT COUNT(*) FROM signers WHERE contract_id = c.id) as total_signers,
           (SELECT COUNT(*) FROM signers WHERE contract_id = c.id AND sign_status = 'signed') as signed_count,
           u.real_name as initiator_name
    FROM contracts c
    LEFT JOIN users u ON c.initiator_id = u.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (status) {
    query += ` AND c.status = ?`;
    params.push(status);
  }
  
  if (search) {
    query += ` AND (c.title LIKE ? OR u.real_name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (fromDate) {
    query += ` AND date(c.created_at) >= date(?)`;
    params.push(fromDate);
  }
  
  if (toDate) {
    query += ` AND date(c.created_at) <= date(?)`;
    params.push(toDate);
  }
  
  query += ` ORDER BY c.created_at DESC`;
  
  db.all(query, params, (err, contracts) => {
    if (err) {
      return res.status(500).json(buildErrorResponse(err, '获取合同列表失败'));
    }
    
    res.json(buildSuccessResponse({
      total: contracts.length,
      contracts: contracts.map(c => ({
        id: c.id,
        title: c.title,
        initiatorId: c.initiator_id,
        initiatorName: c.initiator_name,
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

router.get('/contracts/:id/trajectory', authMiddleware, roleMiddleware(['legal_expert', 'admin']), async (req, res) => {
  try {
    const contractId = req.params.id;
    
    const contract = await new Promise((resolve, reject) => {
      db.get(
        `SELECT c.*, u.real_name as initiator_name
         FROM contracts c
         LEFT JOIN users u ON c.initiator_id = u.id
         WHERE c.id = ?`,
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
    
    const signers = await new Promise((resolve, reject) => {
      db.all(
        `SELECT s.*, u.real_name as user_real_name
         FROM signers s
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.contract_id = ?
         ORDER BY s.created_at ASC`,
        [contractId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    const evidenceChain = await evidenceBlockEngine.getEvidenceChain(contractId);
    
    const activityLogs = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM activity_logs 
         WHERE contract_id = ? 
         ORDER BY created_at ASC`,
        [contractId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    const trajectoryMap = {
      contract: {
        id: contract.id,
        title: contract.title,
        initiator: {
          id: contract.initiator_id,
          name: contract.initiator_name
        },
        status: contract.status,
        fileHash: contract.file_hash,
        initialTimestamp: contract.initial_timestamp,
        initialTimeToken: contract.initial_time_token,
        certificateId: contract.certificate_id
      },
      signers: signers.map(s => ({
        id: s.id,
        userId: s.user_id,
        name: s.user_real_name || s.user_name,
        email: s.email,
        phone: s.phone,
        identityVerified: s.identity_verified === 1,
        signStatus: s.sign_status,
        signedAt: s.signed_at,
        signatureHash: s.signature_hash
      })),
      evidenceChain: {
        isValid: evidenceChain.isValid,
        blockCount: evidenceChain.blockCount,
        blocks: evidenceChain.chain
      },
      activityLogs: activityLogs.map(log => ({
        id: log.id,
        userId: log.user_id,
        userName: log.user_name,
        action: log.action,
        description: log.description,
        ipAddress: log.ip_address,
        timestamp: log.created_at
      }))
    };
    
    res.json(buildSuccessResponse(trajectoryMap, '获取流程轨迹成功'));
    
  } catch (error) {
    res.status(500).json(buildErrorResponse(error, '获取流程轨迹失败'));
  }
});

router.post('/contracts/:id/export-evidence', authMiddleware, roleMiddleware(['legal_expert', 'admin']), async (req, res) => {
  try {
    const contractId = req.params.id;
    const { disputeInfo } = req.body;
    
    const contract = await new Promise((resolve, reject) => {
      db.get(
        `SELECT c.*, u.real_name as initiator_name
         FROM contracts c
         LEFT JOIN users u ON c.initiator_id = u.id
         WHERE c.id = ?`,
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
    
    const evidenceReport = await evidenceBlockEngine.generateEvidenceReport(
      contractId,
      disputeInfo || {}
    );
    
    const courtExport = await evidenceBlockEngine.exportEvidenceForCourt(contractId);
    
    const certificate = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM certificates WHERE contract_id = ?`,
        [contractId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    const signers = await new Promise((resolve, reject) => {
      db.all(
        `SELECT s.*, u.real_name as user_real_name
         FROM signers s
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.contract_id = ?`,
        [contractId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    db.run(
      `INSERT INTO activity_logs 
       (id, contract_id, user_id, user_name, action, description)
       VALUES (?, ?, ?, ?, '导出证据链', ?)`,
      [
        generateId(),
        contractId,
        req.user.userId,
        req.user.realName || req.user.username,
        `导出合同证据链报告 - ${contract.title}`
      ]
    );
    
    const exportPackage = {
      reportId: evidenceReport.reportData.reportId,
      generatedAt: evidenceReport.reportData.generatedAt,
      contractInfo: {
        id: contract.id,
        title: contract.title,
        initiatorName: contract.initiator_name,
        status: contract.status,
        fileHash: contract.file_hash,
        initialTimestamp: contract.initial_timestamp,
        certificateId: contract.certificate_id
      },
      certificate: certificate ? {
        certificateNumber: certificate.certificate_number,
        issuedAt: certificate.issued_at,
        validUntil: JSON.parse(certificate.certificate_data || '{}').validUntil,
        issuer: JSON.parse(certificate.certificate_data || '{}').issuer
      } : null,
      signers: signers.map(s => ({
        name: s.user_real_name || s.user_name,
        email: s.email,
        phone: s.phone,
        identityVerified: s.identity_verified === 1,
        signStatus: s.sign_status,
        signedAt: s.signed_at,
        signatureHash: s.signature_hash
      })),
      evidenceReport: {
        disputeInfo: evidenceReport.reportData.disputeInfo,
        chainVerification: evidenceReport.reportData.verificationResult,
        reportHash: evidenceReport.reportHash
      },
      courtReadyExport: {
        exportFormat: courtExport.exportFormat,
        jurisdictionReady: courtExport.jurisdictionReady,
        chainIntegrityVerified: courtExport.chainIntegrityVerified
      },
      evidenceBlocks: evidenceReport.reportData.evidenceChain
    };
    
    res.json(buildSuccessResponse({
      exportPackage,
      exportHash: require('crypto')
        .createHash('sha256')
        .update(JSON.stringify(exportPackage))
        .digest('hex'),
      downloadable: true
    }, '证据链报告导出成功'));
    
  } catch (error) {
    res.status(500).json(buildErrorResponse(error, '导出证据链报告失败'));
  }
});

router.get('/contracts/:id/audit', authMiddleware, roleMiddleware(['legal_expert', 'admin']), async (req, res) => {
  try {
    const contractId = req.params.id;
    
    const auditResult = await evidenceBlockEngine.auditEvidence(contractId);
    
    const contract = await new Promise((resolve, reject) => {
      db.get(
        `SELECT c.*, u.real_name as initiator_name
         FROM contracts c
         LEFT JOIN users u ON c.initiator_id = u.id
         WHERE c.id = ?`,
        [contractId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    const certificate = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM certificates WHERE contract_id = ?`,
        [contractId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    let certificateValid = null;
    if (certificate && certificate.certificate_data) {
      const certData = JSON.parse(certificate.certificate_data);
      certificateValid = signatureEngine.verifyCertificate(
        certData,
        certificate.ca_signature || 'simulated'
      );
    }
    
    const auditReport = {
      contractId,
      contractTitle: contract?.title,
      auditTimestamp: auditResult.auditTimestamp,
      auditPassed: auditResult.auditPassed,
      summary: {
        evidenceChain: {
          valid: auditResult.auditPassed,
          totalBlocks: auditResult.auditTrail.length,
          integrity: auditResult.summary.chainIntegrity
        },
        certificate: certificate ? {
          exists: true,
          certificateNumber: certificate.certificate_number,
          issuedAt: certificate.issued_at,
          valid: certificateValid?.success || true,
          notExpired: certificateValid?.notExpired || true
        } : { exists: false },
        signerVerification: {
          allSigned: contract?.status === 'completed',
          totalSigners: auditResult.auditTrail.filter(a => 
            a.operation === 'document_signed'
          ).length
        }
      },
      detailedAuditTrail: auditResult.auditTrail
    };
    
    db.run(
      `INSERT INTO activity_logs 
       (id, contract_id, user_id, user_name, action, description)
       VALUES (?, ?, ?, ?, '审计合同', ?)`,
      [
        generateId(),
        contractId,
        req.user.userId,
        req.user.realName || req.user.username,
        `审计合同: ${contract?.title}`
      ]
    );
    
    res.json(buildSuccessResponse(auditReport, '审计完成'));
    
  } catch (error) {
    res.status(500).json(buildErrorResponse(error, '审计失败'));
  }
});

router.get('/statistics', authMiddleware, roleMiddleware(['legal_expert', 'admin']), async (req, res) => {
  try {
    const statusStats = await new Promise((resolve, reject) => {
      db.all(
        `SELECT status, COUNT(*) as count 
         FROM contracts 
         GROUP BY status`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    const totalContracts = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count FROM contracts`,
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });
    
    const totalSignatures = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count FROM signers WHERE sign_status = 'signed'`,
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });
    
    const todayStats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count FROM contracts WHERE date(created_at) = date('now')`,
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });
    
    res.json(buildSuccessResponse({
      overview: {
        totalContracts,
        totalSignatures,
        todayNewContracts: todayStats
      },
      byStatus: statusStats.map(s => ({
        status: s.status,
        count: s.count
      }))
    }, '获取统计数据成功'));
    
  } catch (error) {
    res.status(500).json(buildErrorResponse(error, '获取统计数据失败'));
  }
});

module.exports = router;
