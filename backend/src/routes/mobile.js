const express = require('express');
const router = express.Router();
const { db } = require('../models/db');
const QRCode = require('qrcode');

router.get('/offline-archives', (req, res) => {
  const { userId, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = `
    SELECT o.*, e.name as enterprise_name, e.unified_social_credit
    FROM offline_archives o
    JOIN enterprises e ON o.enterprise_id = e.id
    WHERE 1=1
  `;
  let countSql = `SELECT COUNT(*) as count FROM offline_archives WHERE 1=1`;
  let params = [];
  let countParams = [];
  
  if (userId) {
    sql += ` AND o.user_id = ?`;
    countSql += ` AND user_id = ?`;
    params.push(userId);
    countParams.push(userId);
  }
  
  sql += ` ORDER BY o.downloaded_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), offset);
  
  const list = db.prepare(sql).all(...params);
  const { count } = db.prepare(countSql).get(...countParams);
  
  res.json({
    list: list.map(item => ({
      ...item,
      archive_data: JSON.parse(item.archive_data)
    })),
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/offline-archives/:enterpriseId', async (req, res) => {
  const { enterpriseId } = req.params;
  const { userId } = req.body;
  
  const enterprise = db.prepare(`
    SELECT e.*, h.total_score, h.risk_level,
           h.business_score, h.judicial_score, h.bidding_score,
           h.qualification_score, h.personnel_score, h.credit_score
    FROM enterprises e
    LEFT JOIN health_scores h ON e.id = h.enterprise_id
    WHERE e.id = ?
  `).get(enterpriseId);
  
  if (!enterprise) {
    return res.status(404).json({ error: '企业不存在' });
  }
  
  const judicial = db.prepare(`SELECT * FROM judicial_records WHERE enterprise_id = ?`).all(enterpriseId);
  const bidding = db.prepare(`SELECT * FROM bidding_records WHERE enterprise_id = ?`).all(enterpriseId);
  const qualification = db.prepare(`SELECT * FROM qualifications WHERE enterprise_id = ?`).all(enterpriseId);
  const personnel = db.prepare(`SELECT * FROM personnel WHERE enterprise_id = ?`).all(enterpriseId);
  const credit = db.prepare(`SELECT * FROM credit_records WHERE enterprise_id = ?`).all(enterpriseId);
  const abnormal = db.prepare(`SELECT * FROM business_abnormalities WHERE enterprise_id = ?`).all(enterpriseId);
  
  const archiveData = {
    enterprise,
    judicial,
    bidding,
    qualification,
    personnel,
    credit,
    abnormal,
    archivedAt: new Date().toISOString()
  };
  
  const qrCodeData = JSON.stringify({
    enterpriseId,
    name: enterprise.name,
    creditCode: enterprise.unified_social_credit,
    timestamp: Date.now()
  });
  
  let qrCodeUrl = '';
  try {
    qrCodeUrl = await QRCode.toDataURL(qrCodeData);
  } catch (err) {
    console.error('QR code generation failed:', err);
  }
  
  const existing = db.prepare(`
    SELECT * FROM offline_archives WHERE enterprise_id = ? AND user_id = ?
  `).get(enterpriseId, userId || 1);
  
  if (existing) {
    db.prepare(`
      UPDATE offline_archives 
      SET archive_data = ?, qr_code = ?, downloaded_at = ?
      WHERE id = ?
    `).run(
      JSON.stringify(archiveData),
      qrCodeUrl,
      new Date().toISOString(),
      existing.id
    );
    res.json({
      success: true,
      archiveId: existing.id,
      qrCode: qrCodeUrl,
      archiveData,
      message: '离线档案已更新'
    });
  } else {
    const result = db.prepare(`
      INSERT INTO offline_archives (enterprise_id, user_id, archive_data, qr_code)
      VALUES (?, ?, ?, ?)
    `).run(
      enterpriseId,
      userId || 1,
      JSON.stringify(archiveData),
      qrCodeUrl
    );
    
    res.json({
      success: true,
      archiveId: result.lastInsertRowid,
      qrCode: qrCodeUrl,
      archiveData,
      message: '离线档案已保存'
    });
  }
});

router.get('/offline-archives/:id', (req, res) => {
  const archive = db.prepare(`
    SELECT o.*, e.name as enterprise_name, e.unified_social_credit
    FROM offline_archives o
    JOIN enterprises e ON o.enterprise_id = e.id
    WHERE o.id = ?
  `).get(req.params.id);
  
  if (!archive) {
    return res.status(404).json({ error: '离线档案不存在' });
  }
  
  res.json({
    ...archive,
    archive_data: JSON.parse(archive.archive_data)
  });
});

router.get('/qrcode/:enterpriseId', async (req, res) => {
  const { enterpriseId } = req.params;
  
  const enterprise = db.prepare(`SELECT * FROM enterprises WHERE id = ?`).get(enterpriseId);
  if (!enterprise) {
    return res.status(404).json({ error: '企业不存在' });
  }
  
  const qrData = JSON.stringify({
    type: 'enterprise',
    enterpriseId,
    name: enterprise.name,
    creditCode: enterprise.unified_social_credit,
    apiEndpoint: `/api/enterprises/${enterpriseId}/penetration`,
    timestamp: Date.now()
  });
  
  try {
    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff'
      }
    });
    
    res.json({
      enterpriseId,
      enterpriseName: enterprise.name,
      qrCode: qrCodeUrl,
      qrData: JSON.parse(qrData),
      downloadUrl: `/api/mobile/qrcode/${enterpriseId}/download`
    });
  } catch (err) {
    res.status(500).json({ error: '二维码生成失败' });
  }
});

router.get('/qrcode/:enterpriseId/download', async (req, res) => {
  const { enterpriseId } = req.params;
  
  const enterprise = db.prepare(`SELECT * FROM enterprises WHERE id = ?`).get(enterpriseId);
  if (!enterprise) {
    return res.status(404).json({ error: '企业不存在' });
  }
  
  const qrData = JSON.stringify({
    type: 'enterprise',
    enterpriseId,
    name: enterprise.name,
    creditCode: enterprise.unified_social_credit,
    apiEndpoint: `/api/enterprises/${enterpriseId}/penetration`,
    timestamp: Date.now()
  });
  
  try {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qrcode_${enterprise.name}.png"`);
    
    QRCode.toFileStream(res, qrData, {
      width: 300,
      margin: 2,
      type: 'png'
    });
  } catch (err) {
    res.status(500).json({ error: '二维码下载失败' });
  }
});

router.post('/qrcode/scan', (req, res) => {
  const { qrData } = req.body;
  
  if (!qrData) {
    return res.status(400).json({ error: '缺少二维码数据' });
  }
  
  let parsed;
  try {
    parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
  } catch (err) {
    return res.status(400).json({ error: '无效的二维码数据' });
  }
  
  if (parsed.type !== 'enterprise' || !parsed.enterpriseId) {
    return res.status(400).json({ error: '二维码不是企业资质码' });
  }
  
  const enterprise = db.prepare(`
    SELECT e.*, h.total_score, h.risk_level
    FROM enterprises e
    LEFT JOIN health_scores h ON e.id = h.enterprise_id
    WHERE e.id = ?
  `).get(parsed.enterpriseId);
  
  if (!enterprise) {
    return res.status(404).json({ error: '企业不存在' });
  }
  
  const qualifications = db.prepare(`
    SELECT * FROM qualifications 
    WHERE enterprise_id = ? AND status = '有效'
    ORDER BY issue_date DESC
  `).all(parsed.enterpriseId);
  
  const personnel = db.prepare(`
    SELECT * FROM personnel WHERE enterprise_id = ?
  `).all(parsed.enterpriseId);
  
  const creditRecords = db.prepare(`
    SELECT * FROM credit_records 
    WHERE enterprise_id = ? AND status = '有效'
    ORDER BY effective_date DESC
  `).all(parsed.enterpriseId);
  
  const inBlacklist = db.prepare(`
    SELECT COUNT(*) as count FROM subcontractor_blacklist 
    WHERE enterprise_id = ? AND status = '黑名单中'
  `).get(parsed.enterpriseId).count > 0;
  
  res.json({
    scanned: true,
    scanTime: new Date().toISOString(),
    enterprise,
    qualifications,
    personnel,
    creditRecords,
    riskAlerts: {
      inBlacklist,
      hasBadCredit: creditRecords.some(c => c.credit_type.includes('失信') || c.credit_type.includes('处罚')),
      riskLevel: enterprise.risk_level
    },
    quickActions: [
      { label: '查看详细档案', action: 'viewDetail', url: `/enterprise/${parsed.enterpriseId}` },
      { label: '生成尽调报告', action: 'generateReport', url: `/api/reports/generate` },
      { label: '加入重点关注', action: 'follow' }
    ]
  });
});

router.delete('/offline-archives/:id', (req, res) => {
  const archive = db.prepare(`SELECT * FROM offline_archives WHERE id = ?`).get(req.params.id);
  if (!archive) {
    return res.status(404).json({ error: '离线档案不存在' });
  }
  
  db.prepare(`DELETE FROM offline_archives WHERE id = ?`).run(req.params.id);
  
  res.json({
    success: true,
    message: '离线档案已删除'
  });
});

module.exports = router;
