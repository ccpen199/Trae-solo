const express = require('express');
const PDFDocument = require('pdfkit');
const { db } = require('../database');
const router = express.Router();

function calculateScore(auditPlanId) {
  const scores = db.prepare(`
    SELECT ci.category_id, cc.name as category_name, cc.max_score as category_max,
           SUM(ac.score) as category_score, SUM(ci.max_score) as category_total
    FROM audit_checklists ac
    JOIN checklist_items ci ON ac.checklist_item_id = ci.id
    JOIN checklist_categories cc ON ci.category_id = cc.id
    WHERE ac.audit_plan_id = ?
    GROUP BY ci.category_id
  `).all(auditPlanId);
  
  const totalScore = scores.reduce((sum, s) => sum + (s.category_score || 0), 0);
  const totalPossible = scores.reduce((sum, s) => sum + (s.category_total || 0), 0);
  
  return {
    categoryScores: scores,
    totalScore,
    totalPossible,
    percentage: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0
  };
}

function getRiskLevel(percentage, criticalIssueCount) {
  if (criticalIssueCount > 0) return 'high';
  if (percentage >= 90) return 'low';
  if (percentage >= 75) return 'medium';
  return 'high';
}

router.get('/generate/:auditPlanId', (req, res) => {
  const auditPlanId = req.params.auditPlanId;
  
  const plan = db.prepare(`
    SELECT ap.*, s.name as supplier_name, f.name as factory_name, f.address as factory_address,
           a.name as auditor_name
    FROM audit_plans ap
    JOIN suppliers s ON ap.supplier_id = s.id
    JOIN factories f ON ap.factory_id = f.id
    JOIN auditors a ON ap.auditor_id = a.id
    WHERE ap.id = ?
  `).get(auditPlanId);
  
  if (!plan) {
    return res.status(404).json({ error: 'Audit plan not found' });
  }
  
  const scoreData = calculateScore(auditPlanId);
  
  const issues = db.prepare(`
    SELECT ai.*, cc.name as category_name
    FROM audit_issues ai
    LEFT JOIN checklist_categories cc ON ai.category_id = cc.id
    WHERE ai.audit_plan_id = ?
    ORDER BY CASE ai.severity WHEN 'critical' THEN 1 WHEN 'major' THEN 2 WHEN 'minor' THEN 3 ELSE 4 END
  `).all(auditPlanId);
  
  const criticalIssues = issues.filter(i => i.severity === 'critical' && i.status !== 'closed');
  const openIssues = issues.filter(i => i.status !== 'closed');
  const closedIssues = issues.filter(i => i.status === 'closed');
  
  const riskLevel = getRiskLevel(scoreData.percentage, criticalIssues.length);
  const conclusion = criticalIssues.length > 0 
    ? '未通过 - 存在严重问题未整改' 
    : (scoreData.percentage >= 75 ? '通过' : '有条件通过 - 需整改一般问题');
  
  const existingReport = db.prepare(
    'SELECT id FROM audit_reports WHERE audit_plan_id = ?'
  ).get(auditPlanId);
  
  if (existingReport) {
    db.prepare(`
      UPDATE audit_reports 
      SET total_score=?, risk_level=?, conclusion=?, issues_summary=?, rectification_status=?,
          generated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      scoreData.percentage,
      riskLevel,
      conclusion,
      `总问题数: ${issues.length}, 已关闭: ${closedIssues.length}, 待整改: ${openIssues.length}, 严重问题: ${criticalIssues.length}`,
      openIssues.length === 0 ? 'completed' : 'pending',
      existingReport.id
    );
  } else {
    db.prepare(`
      INSERT INTO audit_reports (audit_plan_id, total_score, risk_level, conclusion, issues_summary, rectification_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      auditPlanId,
      scoreData.percentage,
      riskLevel,
      conclusion,
      `总问题数: ${issues.length}, 已关闭: ${closedIssues.length}, 待整改: ${openIssues.length}, 严重问题: ${criticalIssues.length}`,
      openIssues.length === 0 ? 'completed' : 'pending'
    );
  }
  
  res.json({
    plan,
    score: scoreData,
    riskLevel,
    conclusion,
    issues: {
      all: issues,
      critical: criticalIssues,
      open: openIssues,
      closed: closedIssues
    }
  });
});

router.get('/', (req, res) => {
  const reports = db.prepare(`
    SELECT ar.*, ap.audit_date, 
           s.name as supplier_name, f.name as factory_name,
           a.name as auditor_name
    FROM audit_reports ar
    JOIN audit_plans ap ON ar.audit_plan_id = ap.id
    JOIN suppliers s ON ap.supplier_id = s.id
    JOIN factories f ON ap.factory_id = f.id
    JOIN auditors a ON ap.auditor_id = a.id
    ORDER BY ar.generated_at DESC
  `).all();
  res.json(reports);
});

router.get('/export-pdf/:auditPlanId', (req, res) => {
  const auditPlanId = req.params.auditPlanId;
  
  const plan = db.prepare(`
    SELECT ap.*, s.name as supplier_name, f.name as factory_name, f.address as factory_address,
           a.name as auditor_name
    FROM audit_plans ap
    JOIN suppliers s ON ap.supplier_id = s.id
    JOIN factories f ON ap.factory_id = f.id
    JOIN auditors a ON ap.auditor_id = a.id
    WHERE ap.id = ?
  `).get(auditPlanId);
  
  const scoreData = calculateScore(auditPlanId);
  
  const issues = db.prepare(`
    SELECT ai.*, cc.name as category_name
    FROM audit_issues ai
    LEFT JOIN checklist_categories cc ON ai.category_id = cc.id
    WHERE ai.audit_plan_id = ?
    ORDER BY CASE ai.severity WHEN 'critical' THEN 1 WHEN 'major' THEN 2 WHEN 'minor' THEN 3 ELSE 4 END
  `).all(auditPlanId);
  
  const criticalIssues = issues.filter(i => i.severity === 'critical' && i.status !== 'closed');
  const riskLevel = getRiskLevel(scoreData.percentage, criticalIssues.length);
  const conclusion = criticalIssues.length > 0 
    ? '未通过 - 存在严重问题未整改' 
    : (scoreData.percentage >= 75 ? '通过' : '有条件通过 - 需整改一般问题');
  
  db.prepare(
    'UPDATE audit_reports SET exported_count = exported_count + 1 WHERE audit_plan_id = ?'
  ).run(auditPlanId);
  
  db.prepare(
    'INSERT INTO audit_logs (audit_plan_id, action, action_by, details) VALUES (?, ?, ?, ?)'
  ).run(auditPlanId, 'export_report', 'system', `导出PDF报告，风险等级: ${riskLevel}`);
  
  const doc = new PDFDocument({ margin: 50 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="audit-report-${auditPlanId}.pdf"`);
  
  doc.pipe(res);
  
  doc.fontSize(24).font('Helvetica-Bold').text('工厂验厂报告', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(10).fillColor('red').opacity(0.3).text('CONFIDENTIAL - 内部机密文件', { align: 'center' });
  doc.opacity(1).fillColor('black');
  doc.moveDown();
  
  doc.fontSize(14).font('Helvetica-Bold').text('一、基本信息');
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text(`供应商: ${plan.supplier_name}`);
  doc.text(`工厂名称: ${plan.factory_name}`);
  doc.text(`工厂地址: ${plan.factory_address}`);
  doc.text(`审核类型: ${plan.audit_type}`);
  doc.text(`审核员: ${plan.auditor_name}`);
  doc.text(`审核日期: ${plan.audit_date}`);
  doc.text(`审核时间: ${plan.start_time} - ${plan.end_time}`);
  doc.moveDown();
  
  doc.fontSize(14).font('Helvetica-Bold').text('二、评分汇总');
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text(`总得分: ${scoreData.percentage}%`);
  doc.text(`风险等级: ${riskLevel === 'low' ? '低' : riskLevel === 'medium' ? '中' : '高'}`);
  doc.text(`最终结论: ${conclusion}`);
  doc.moveDown();
  
  doc.fontSize(14).font('Helvetica-Bold').text('三、分类评分');
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  scoreData.categoryScores.forEach(cat => {
    const catPercent = cat.category_total > 0 ? Math.round((cat.category_score / cat.category_total) * 100) : 0;
    doc.text(`${cat.category_name}: ${cat.category_score}/${cat.category_total} (${catPercent}%)`);
  });
  doc.moveDown();
  
  doc.fontSize(14).font('Helvetica-Bold').text('四、问题明细');
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  
  if (issues.length === 0) {
    doc.text('无发现问题');
  } else {
    issues.forEach((issue, idx) => {
      const severityText = issue.severity === 'critical' ? '严重' : issue.severity === 'major' ? '主要' : '一般';
      const statusText = issue.status === 'closed' ? '已关闭' : issue.status === 'rechecking' ? '复查中' : '待整改';
      doc.text(`${idx + 1}. [${severityText}] [${statusText}] ${issue.description}`);
      if (issue.responsible_person) {
        doc.text(`   责任人: ${issue.responsible_person}, 截止日期: ${issue.deadline || '未设置'}`);
      }
      doc.moveDown(0.3);
    });
  }
  
  doc.moveDown();
  doc.fontSize(10).fillColor('gray');
  doc.text(`报告生成时间: ${new Date().toLocaleString()}`);
  doc.text(`审计记录: 该报告已记录导出日志，可追溯`);
  
  doc.end();
});

module.exports = router;
