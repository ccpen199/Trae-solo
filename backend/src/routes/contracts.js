const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { category } = req.query;
  
  let sql = 'SELECT * FROM contract_templates WHERE is_active = 1';
  const params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY created_at DESC';
  
  const templates = db.prepare(sql).all(...params);
  res.json(templates);
});

router.get('/:id', authenticateToken, (req, res) => {
  const template = db.prepare('SELECT * FROM contract_templates WHERE id = ? AND is_active = 1').get(req.params.id);
  
  if (!template) {
    return res.status(404).json({ error: '合同模板不存在' });
  }

  res.json(template);
});

router.post('/generate/:templateId', authenticateToken, requireRole(['company', 'admin']), (req, res) => {
  const template = db.prepare('SELECT * FROM contract_templates WHERE id = ? AND is_active = 1').get(req.params.templateId);
  
  if (!template) {
    return res.status(404).json({ error: '合同模板不存在' });
  }

  const { employerName, employeeName, position, salary, startDate, endDate, workLocation } = req.body;

  let contentCn = template.template_content_cn;
  let contentEn = template.template_content_en;

  const replacementsCn = {
    '甲方（用人单位）：': `甲方（用人单位）：${employerName || ''}`,
    '乙方（劳动者）：': `乙方（劳动者）：${employeeName || ''}`,
    '第一条 合同期限': `第一条 合同期限\n本合同自 ${startDate || '______年__月__日'} 起至 ${endDate || '______年__月__日'} 止`,
    '第二条 工作内容和工作地点': `第二条 工作内容和工作地点\n乙方同意从事 ${position || '______'} 岗位工作，工作地点为 ${workLocation || '______'}`,
    '第四条 劳动报酬': `第四条 劳动报酬\n乙方月工资为 ${salary || '______'} 元`
  };

  for (const [key, value] of Object.entries(replacementsCn)) {
    contentCn = contentCn.replace(key, value);
  }

  const replacementsEn = {
    'Party A (Employer):': `Party A (Employer): ${employerName || ''}`,
    'Party B (Employee):': `Party B (Employee): ${employeeName || ''}`,
    'Article 1 Contract Term': `Article 1 Contract Term\nThis contract is effective from ${startDate || '______'} to ${endDate || '______'}`,
    'Article 2 Work Content and Work Location': `Article 2 Work Content and Work Location\nParty B agrees to work as ${position || '______'} at ${workLocation || '______'}`,
    'Article 4 Labor Remuneration': `Article 4 Labor Remuneration\nParty B's monthly salary is ${salary || '______'} RMB`
  };

  for (const [key, value] of Object.entries(replacementsEn)) {
    contentEn = contentEn.replace(key, value);
  }

  res.json({
    template,
    generatedContent: {
      cn: contentCn,
      en: contentEn
    },
    tips: [
      '本合同模板仅供参考，具体条款请咨询专业法律顾问',
      '涉外合同需同时符合中国法律和相关国际条约规定',
      '建议在签署前交由人力资源和法务部门审核'
    ]
  });
});

module.exports = router;
