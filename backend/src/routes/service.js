const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, keyword, category, department } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = ['status = ?'];
  let params = ['active'];
  
  if (keyword) {
    where.push('(name LIKE ? OR item_code LIKE ? OR description LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (category) {
    where.push('category = ?');
    params.push(category);
  }
  if (department) {
    where.push('department = ?');
    params.push(department);
  }
  
  const whereSql = 'WHERE ' + where.join(' AND ');
  
  const services = db.prepare(`
    SELECT * FROM service_items ${whereSql}
    ORDER BY item_code
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM service_items ${whereSql}
  `).get(...params).count;
  
  res.json({ list: services, total });
});

router.get('/categories', (req, res) => {
  const categories = db.prepare(`
    SELECT DISTINCT category as name, COUNT(*) as count
    FROM service_items
    WHERE status = 'active'
    GROUP BY category
    ORDER BY count DESC
  `).all();
  
  res.json(categories);
});

router.get('/:code', (req, res) => {
  const service = db.prepare('SELECT * FROM service_items WHERE item_code = ?').get(req.params.code);
  
  if (!service) {
    return res.status(404).json({ error: '服务事项不存在' });
  }
  
  let materials = [];
  let flowSteps = [];

  try {
    materials = db.prepare(`
      SELECT * FROM service_materials WHERE service_id = ? ORDER BY sort_order
    `).all(service.id);
  } catch (err) {
    if (!String(err.message || '').includes('no such table')) throw err;
  }

  try {
    flowSteps = db.prepare(`
      SELECT * FROM service_flow WHERE service_id = ? ORDER BY step_order
    `).all(service.id);
  } catch (err) {
    if (!String(err.message || '').includes('no such table')) throw err;
  }
  
  service.required_materials_list = materials.length > 0 ? materials : [
    { id: 1, name: '营业执照原件', type: '证照', required: true, original_count: 1, copy_count: 0, description: '有效期内的营业执照', instructions: '需加盖企业公章' },
    { id: 2, name: '法定代表人身份证', type: '证件', required: true, original_count: 0, copy_count: 1, description: '正反面复印件', instructions: '需本人签字确认' },
    { id: 3, name: '授权委托书', type: '文书', required: true, original_count: 1, copy_count: 0, description: '加盖公章的授权委托书', instructions: '需明确委托事项和权限' },
    { id: 4, name: '经办人身份证明', type: '证件', required: false, original_count: 0, copy_count: 1, description: '经办人身份证复印件', instructions: '委托办理时需提供' }
  ];
  
  service.flow_steps = flowSteps.length > 0 ? flowSteps : [
    { step: 1, name: '申请与受理', description: '申请人提交申请材料，受理人员进行初审', duration: '1个工作日' },
    { step: 2, name: '审查与决定', description: '业务部门进行实质审查并作出审批决定', duration: '5个工作日' },
    { step: 3, name: '颁证与送达', description: '制作批准文书并通知申请人', duration: '2个工作日' }
  ];
  
  res.json(service);
});

module.exports = router;
