const express = require('express');
const router = express.Router();
const { db } = require('../database');

const generateMaterialList = (companyType, urgent) => {
  const baseMaterials = [
    '身份证复印件',
    '租赁合同',
    '房产证复印件'
  ];
  
  const companyTypeMaterials = {
    'limited': ['公司章程', '股东会决议'],
    'sole': ['一人有限公司承诺书'],
    'partnership': ['合伙协议'],
    'individual': ['个体工商户申请书']
  };
  
  const materials = [...baseMaterials, ...(companyTypeMaterials[companyType] || [])];
  
  if (urgent) {
    materials.push('加急办理申请书');
  }
  
  return materials;
};

router.get('/', (req, res) => {
  const requirements = db.prepare(`
    SELECT r.*, c.name as client_name, c.phone as client_phone
    FROM registration_requirements r
    LEFT JOIN clients c ON r.client_id = c.id
    ORDER BY r.created_at DESC
  `).all();
  
  requirements.forEach(r => {
    if (r.shareholder_structure) {
      r.shareholder_structure = JSON.parse(r.shareholder_structure);
    }
    if (r.material_list) {
      r.material_list = JSON.parse(r.material_list);
    }
  });
  
  res.json(requirements);
});

router.get('/:id', (req, res) => {
  const requirement = db.prepare(`
    SELECT r.*, c.name as client_name, c.phone as client_phone
    FROM registration_requirements r
    LEFT JOIN clients c ON r.client_id = c.id
    WHERE r.id = ?
  `).get(req.params.id);
  
  if (!requirement) {
    return res.status(404).json({ error: '需求不存在' });
  }
  
  if (requirement.shareholder_structure) {
    requirement.shareholder_structure = JSON.parse(requirement.shareholder_structure);
  }
  if (requirement.material_list) {
    requirement.material_list = JSON.parse(requirement.material_list);
  }
  
  res.json(requirement);
});

router.post('/', (req, res) => {
  const {
    client_id, registration_region, company_type,
    shareholder_structure, business_scope, registered_capital,
    urgent_requirement, assigned_salesperson
  } = req.body;
  
  if (!client_id || !registration_region || !company_type) {
    return res.status(400).json({ error: '必填项缺失' });
  }
  
  const materialList = generateMaterialList(company_type, urgent_requirement);
  
  const result = db.prepare(`
    INSERT INTO registration_requirements (
      client_id, registration_region, company_type, shareholder_structure,
      business_scope, registered_capital, urgent_requirement, material_list,
      assigned_salesperson
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    client_id, registration_region, company_type,
    JSON.stringify(shareholder_structure || []),
    business_scope || null, registered_capital || 0,
    urgent_requirement ? 1 : 0,
    JSON.stringify(materialList),
    assigned_salesperson || null
  );
  
  const requirementId = result.lastInsertRowid;
  
  const steps = [
    { name: '工商提交', order: 1 },
    { name: '材料补正', order: 2 },
    { name: '领取执照', order: 3 },
    { name: '刻章', order: 4 },
    { name: '银行开户', order: 5 }
  ];
  
  const insertProgress = db.prepare(`
    INSERT INTO processing_progress (requirement_id, step_name, step_order)
    VALUES (?, ?, ?)
  `);
  
  steps.forEach(step => {
    insertProgress.run(requirementId, step.name, step.order);
  });
  
  materialList.forEach(material => {
    db.prepare(`
      INSERT INTO materials (requirement_id, name, type)
      VALUES (?, ?, ?)
    `).run(requirementId, material, 'document');
  });
  
  const requirement = db.prepare('SELECT * FROM registration_requirements WHERE id = ?').get(requirementId);
  if (requirement.shareholder_structure) {
    requirement.shareholder_structure = JSON.parse(requirement.shareholder_structure);
  }
  if (requirement.material_list) {
    requirement.material_list = JSON.parse(requirement.material_list);
  }
  
  res.status(201).json(requirement);
});

router.put('/:id', (req, res) => {
  const {
    registration_region, company_type, shareholder_structure,
    business_scope, registered_capital, urgent_requirement, status
  } = req.body;
  
  db.prepare(`
    UPDATE registration_requirements SET
      registration_region = ?, company_type = ?, shareholder_structure = ?,
      business_scope = ?, registered_capital = ?, urgent_requirement = ?,
      status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    registration_region, company_type, JSON.stringify(shareholder_structure || []),
    business_scope || null, registered_capital || 0, urgent_requirement ? 1 : 0,
    status || 'pending', req.params.id
  );
  
  const requirement = db.prepare('SELECT * FROM registration_requirements WHERE id = ?').get(req.params.id);
  if (requirement.shareholder_structure) {
    requirement.shareholder_structure = JSON.parse(requirement.shareholder_structure);
  }
  if (requirement.material_list) {
    requirement.material_list = JSON.parse(requirement.material_list);
  }
  
  res.json(requirement);
});

module.exports = router;
