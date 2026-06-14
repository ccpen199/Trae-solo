const express = require('express');
const router = express.Router();
const { db } = require('../models/db');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const reportsDir = path.resolve(__dirname, '../../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

router.get('/', (req, res) => {
  const { enterpriseId, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = `
    SELECT r.*, e.name as enterprise_name
    FROM due_diligence_reports r
    JOIN enterprises e ON r.enterprise_id = e.id
    WHERE 1=1
  `;
  let countSql = `SELECT COUNT(*) as count FROM due_diligence_reports WHERE 1=1`;
  let params = [];
  let countParams = [];
  
  if (enterpriseId) {
    sql += ` AND r.enterprise_id = ?`;
    countSql += ` AND enterprise_id = ?`;
    params.push(enterpriseId);
    countParams.push(enterpriseId);
  }
  
  sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), offset);
  
  const list = db.prepare(sql).all(...params);
  const { count } = db.prepare(countSql).get(...countParams);
  
  res.json({
    list,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/generate', (req, res) => {
  const { enterpriseId, reportType, userId, reportName } = req.body;
  
  if (!enterpriseId) {
    return res.status(400).json({ error: '缺少企业ID' });
  }
  
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
  
  const now = new Date().toISOString();
  const fileName = `due_diligence_${enterpriseId}_${Date.now()}.pdf`;
  const filePath = path.join(reportsDir, fileName);
  
  const insertStmt = db.prepare(`
    INSERT INTO due_diligence_reports (enterprise_id, user_id, report_name, report_type, file_path, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = insertStmt.run(
    enterpriseId,
    userId || 1,
    reportName || `${enterprise.name}尽调报告`,
    reportType || 'standard',
    filePath,
    '生成中'
  );
  
  const reportId = result.lastInsertRowid;
  
  const judicial = db.prepare(`SELECT * FROM judicial_records WHERE enterprise_id = ?`).all(enterpriseId);
  const bidding = db.prepare(`SELECT * FROM bidding_records WHERE enterprise_id = ?`).all(enterpriseId);
  const qualification = db.prepare(`SELECT * FROM qualifications WHERE enterprise_id = ?`).all(enterpriseId);
  const personnel = db.prepare(`SELECT * FROM personnel WHERE enterprise_id = ?`).all(enterpriseId);
  const credit = db.prepare(`SELECT * FROM credit_records WHERE enterprise_id = ?`).all(enterpriseId);
  const abnormal = db.prepare(`SELECT * FROM business_abnormalities WHERE enterprise_id = ?`).all(enterpriseId);
  const rigging = db.prepare(`SELECT * FROM bid_rigging_suspects WHERE enterprise_id = ?`).all(enterpriseId);
  const blacklist = db.prepare(`SELECT * FROM subcontractor_blacklist WHERE enterprise_id = ?`).all(enterpriseId);
  
  const doc = new PDFDocument({ margin: 50 });
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);
  
  doc.fontSize(20).font('Helvetica-Bold').text('建筑企业尽职调查报告', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).font('Helvetica').text(`报告编号: DD-${reportId}`);
  doc.text(`生成时间: ${now}`);
  doc.text(`报告类型: ${reportType === 'detailed' ? '详细版' : '标准版'}`);
  doc.moveDown();
  
  doc.fontSize(16).font('Helvetica-Bold').text('一、企业基本信息');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  const basicInfo = [
    ['企业名称', enterprise.name],
    ['统一社会信用代码', enterprise.unified_social_credit],
    ['法定代表人', enterprise.legal_representative],
    ['注册资本', enterprise.registered_capital],
    ['成立日期', enterprise.establishment_date],
    ['经营范围', enterprise.business_scope],
    ['地址', enterprise.address],
    ['经营状态', enterprise.status]
  ];
  basicInfo.forEach(([label, value]) => {
    doc.text(`${label}: ${value || '-'}`);
  });
  
  doc.moveDown();
  doc.fontSize(16).font('Helvetica-Bold').text('二、企业健康度评分');
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica-Bold').text(`综合评分: ${enterprise.total_score}分`);
  doc.text(`风险等级: ${enterprise.risk_level}`);
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  
  const scores = [
    ['工商信息', enterprise.business_score, 25],
    ['司法风险', enterprise.judicial_score, 25],
    ['招投标记录', enterprise.bidding_score, 15],
    ['资质情况', enterprise.qualification_score, 15],
    ['人员配置', enterprise.personnel_score, 10],
    ['信用状况', enterprise.credit_score, 10]
  ];
  
  scores.forEach(([name, score, max]) => {
    doc.text(`${name}: ${score}/${max}`);
    const barWidth = 300;
    const filledWidth = (score / max) * barWidth;
    const y = doc.y;
    doc.rect(doc.x, y, barWidth, 10).stroke();
    doc.rect(doc.x, y, filledWidth, 10).fill();
    doc.moveDown(1.5);
  });
  
  if (judicial.length > 0) {
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('三、司法风险信息');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    judicial.forEach((j, idx) => {
      doc.text(`${idx + 1}. [${j.case_type}] ${j.case_reason}`);
      doc.text(`   法院: ${j.court} | 案号: ${j.case_number}`);
      doc.text(`   立案日期: ${j.filing_date} | 判决结果: ${j.judgment_result || '未判决'}`);
      if (j.amount) doc.text(`   涉及金额: ¥${j.amount.toLocaleString()}`);
      doc.moveDown(0.3);
    });
  }
  
  if (bidding.length > 0) {
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('四、招投标记录');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    bidding.slice(0, reportType === 'detailed' ? undefined : 5).forEach((b, idx) => {
      doc.text(`${idx + 1}. ${b.project_name}`);
      doc.text(`   金额: ¥${b.bidding_amount.toLocaleString()} | 状态: ${b.winning_status}`);
      doc.text(`   日期: ${b.bidding_date} | 招标人: ${b.tenderee}`);
      doc.moveDown(0.3);
    });
  }
  
  if (qualification.length > 0) {
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('五、企业资质信息');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    qualification.forEach((q, idx) => {
      doc.text(`${idx + 1}. ${q.qualification_type} - ${q.qualification_level}`);
      doc.text(`   证书编号: ${q.certificate_number} | 发证机关: ${q.issuing_authority}`);
      doc.text(`   有效期: ${q.issue_date} 至 ${q.expiry_date} | 状态: ${q.status}`);
      doc.moveDown(0.3);
    });
  }
  
  if (personnel.length > 0) {
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('六、核心人员信息');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    personnel.forEach((p, idx) => {
      doc.text(`${idx + 1}. ${p.name} - ${p.position}`);
      doc.text(`   资质证书: ${p.qualification_certificates}`);
      doc.text(`   注册编号: ${p.registration_number}`);
      doc.moveDown(0.3);
    });
  }
  
  if (credit.length > 0) {
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('七、信用记录');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    credit.forEach((c, idx) => {
      doc.text(`${idx + 1}. [${c.credit_type}] ${c.credit_level} - ${c.description}`);
      doc.text(`   生效日期: ${c.effective_date} | 公示截止: ${c.display_deadline}`);
      doc.text(`   状态: ${c.status} | 修复状态: ${c.repair_status}`);
      doc.moveDown(0.3);
    });
  }
  
  if (abnormal.length > 0 || rigging.length > 0 || blacklist.length > 0) {
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('八、风险预警信息');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    
    if (abnormal.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('经营异常:');
      doc.fontSize(10).font('Helvetica');
      abnormal.forEach((a, idx) => {
        doc.text(`  ${idx + 1}. [${a.abnormal_type}] ${a.abnormal_reason}`);
        doc.text(`     决定机关: ${a.decision_authority} | 日期: ${a.decision_date}`);
        doc.text(`     状态: ${a.status}`);
      });
      doc.moveDown(0.5);
    }
    
    if (rigging.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('围标串标嫌疑:');
      doc.fontSize(10).font('Helvetica');
      rigging.forEach((r, idx) => {
        doc.text(`  ${idx + 1}. ${r.project_name} - ${r.risk_level}`);
        doc.text(`     嫌疑原因: ${r.suspicion_reason}`);
        doc.text(`     关联企业: ${r.related_enterprises}`);
      });
      doc.moveDown(0.5);
    }
    
    if (blacklist.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('黑名单记录:');
      doc.fontSize(10).font('Helvetica');
      blacklist.forEach((b, idx) => {
        doc.text(`  ${idx + 1}. 列入原因: ${b.reason}`);
        doc.text(`     列入日期: ${b.inclusion_date} | 风险等级: ${b.risk_level}`);
      });
    }
  }
  
  doc.addPage();
  doc.fontSize(14).font('Helvetica-Bold').text('数据来源说明');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('本报告数据来源于以下官方渠道：');
  doc.text('• 国家企业信用信息公示系统 (http://www.gsxt.gov.cn)');
  doc.text('• 中国裁判文书网 (https://wenshu.court.gov.cn)');
  doc.text('• 中国执行信息公开网 (http://zxgk.court.gov.cn)');
  doc.text('• 全国公共资源交易平台 (http://www.ggzy.gov.cn)');
  doc.text('• 住房和城乡建设部 (http://www.mohurd.gov.cn)');
  doc.text('• 信用中国 (https://www.creditchina.gov.cn)');
  doc.text('• 全国建筑市场监管公共服务平台 (http://jzsc.mohurd.gov.cn)');
  doc.moveDown();
  doc.fontSize(9).font('Helvetica-Oblique').text('免责声明：本报告仅供参考，不构成任何投资建议或法律意见。数据更新以官方渠道为准。');
  
  doc.end();
  
  writeStream.on('finish', () => {
    db.prepare(`
      UPDATE due_diligence_reports SET status = '已完成' WHERE id = ?
    `).run(reportId);
    
    res.json({
      success: true,
      reportId,
      reportName: reportName || `${enterprise.name}尽调报告`,
      filePath,
      downloadUrl: `/api/reports/${reportId}/download`
    });
  });
});

router.get('/:id/download', (req, res) => {
  const report = db.prepare(`SELECT * FROM due_diligence_reports WHERE id = ?`).get(req.params.id);
  
  if (!report) {
    return res.status(404).json({ error: '报告不存在' });
  }
  
  if (!fs.existsSync(report.file_path)) {
    return res.status(404).json({ error: '报告文件已删除' });
  }
  
  res.download(report.file_path, `${report.report_name || '尽调报告'}.pdf`);
});

router.get('/:id/json', (req, res) => {
  const report = db.prepare(`
    SELECT r.*, e.name as enterprise_name
    FROM due_diligence_reports r
    JOIN enterprises e ON r.enterprise_id = e.id
    WHERE r.id = ?
  `).get(req.params.id);
  
  if (!report) {
    return res.status(404).json({ error: '报告不存在' });
  }
  
  const enterpriseId = report.enterprise_id;
  
  const enterprise = db.prepare(`
    SELECT e.*, h.total_score, h.risk_level,
           h.business_score, h.judicial_score, h.bidding_score,
           h.qualification_score, h.personnel_score, h.credit_score
    FROM enterprises e
    LEFT JOIN health_scores h ON e.id = h.enterprise_id
    WHERE e.id = ?
  `).get(enterpriseId);
  
  const judicial = db.prepare(`SELECT * FROM judicial_records WHERE enterprise_id = ?`).all(enterpriseId);
  const bidding = db.prepare(`SELECT * FROM bidding_records WHERE enterprise_id = ?`).all(enterpriseId);
  const qualification = db.prepare(`SELECT * FROM qualifications WHERE enterprise_id = ?`).all(enterpriseId);
  const personnel = db.prepare(`SELECT * FROM personnel WHERE enterprise_id = ?`).all(enterpriseId);
  const credit = db.prepare(`SELECT * FROM credit_records WHERE enterprise_id = ?`).all(enterpriseId);
  const abnormal = db.prepare(`SELECT * FROM business_abnormalities WHERE enterprise_id = ?`).all(enterpriseId);
  const rigging = db.prepare(`SELECT * FROM bid_rigging_suspects WHERE enterprise_id = ?`).all(enterpriseId);
  const blacklist = db.prepare(`SELECT * FROM subcontractor_blacklist WHERE enterprise_id = ?`).all(enterpriseId);
  
  res.json({
    report,
    enterprise,
    scores: {
      total: enterprise.total_score,
      business: enterprise.business_score,
      judicial: enterprise.judicial_score,
      bidding: enterprise.bidding_score,
      qualification: enterprise.qualification_score,
      personnel: enterprise.personnel_score,
      credit: enterprise.credit_score
    },
    judicial,
    bidding,
    qualification,
    personnel,
    credit,
    abnormal,
    rigging,
    blacklist
  });
});

module.exports = router;
