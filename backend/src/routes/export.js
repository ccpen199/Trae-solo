const express = require('express');
const ExcelJS = require('exceljs');
const path = require('path');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/:caseId', authenticateToken, async (req, res) => {
  const { export_type, include_files = false, watermark = '' } = req.body;
  const caseId = req.params.caseId;

  const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(caseId);
  if (!caseData) {
    return res.status(404).json({ error: '案件不存在' });
  }

  const evidence = db.prepare(`
    SELECT e.*, g.group_name
    FROM evidence e
    LEFT JOIN evidence_groups g ON e.group_id = g.id
    WHERE e.case_id = ? AND e.is_active = 1
    ORDER BY g.group_order, e.sort_order
  `).all(caseId);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = req.user.name;
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('证据目录');

  worksheet.columns = [
    { header: '序号', key: 'number', width: 10 },
    { header: '证据编号', key: 'evidence_number', width: 20 },
    { header: '分组', key: 'group_name', width: 20 },
    { header: '证据名称', key: 'evidence_name', width: 40 },
    { header: '证据类型', key: 'evidence_type', width: 15 },
    { header: '来源', key: 'source', width: 20 },
    { header: '取得日期', key: 'obtain_date', width: 15 },
    { header: '保密级别', key: 'confidentiality_level', width: 12 },
    { header: '原件状态', key: 'original_status', width: 12 },
    { header: '证明目的', key: 'proof_purpose', width: 40 },
    { header: '争议焦点', key: 'dispute_focus', width: 30 },
    { header: '文件名', key: 'file_name', width: 30 },
  ];

  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  evidence.forEach((item, index) => {
    worksheet.addRow({
      number: index + 1,
      evidence_number: item.evidence_number,
      group_name: item.group_name || '',
      evidence_name: item.evidence_name,
      evidence_type: item.evidence_type || '',
      source: item.source || '',
      obtain_date: item.obtain_date || '',
      confidentiality_level: item.confidentiality_level || '',
      original_status: item.original_status || '',
      proof_purpose: item.proof_purpose || '',
      dispute_focus: item.dispute_focus || '',
      file_name: item.file_name || '',
    });
  });

  const filename = `${caseData.case_number}_证据目录_${Date.now()}.xlsx`;
  const exportPath = path.join(__dirname, '../../data/exports');
  const fs = require('fs');
  
  if (!fs.existsSync(exportPath)) {
    fs.mkdirSync(exportPath, { recursive: true });
  }

  const filepath = path.join(exportPath, filename);
  await workbook.xlsx.writeFile(filepath);

  db.prepare(`
    INSERT INTO export_records (case_id, export_type, file_name, file_path, watermark, exported_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(caseId, export_type || 'excel', filename, filepath, watermark, req.user.id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, record_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, 'export', 'evidence', caseId, `导出证据目录: ${caseData.case_name}`);

  res.download(filepath, filename, (err) => {
    if (err) {
      res.status(500).json({ error: '下载失败' });
    }
  });
});

router.get('/records/:caseId', authenticateToken, (req, res) => {
  const records = db.prepare(`
    SELECT er.*, u.name as exporter_name
    FROM export_records er
    LEFT JOIN users u ON er.exported_by = u.id
    WHERE er.case_id = ?
    ORDER BY er.created_at DESC
  `).all(req.params.caseId);

  res.json({ records });
});

module.exports = router;
