const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const { page = 1, pageSize = 10, status, project_id } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  
  if (req.user.role === 'owner') {
    where.push('q.owner_id = ?');
    params.push(req.user.id);
  }
  if (req.user.company_id) {
    where.push('q.company_id = ?');
    params.push(req.user.company_id);
  }
  if (status) { where.push('q.status = ?'); params.push(status); }
  if (project_id) { where.push('q.project_id = ?'); params.push(project_id); }
  
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const list = db.prepare(`
    SELECT q.*, p.title as project_title, u.name as owner_name, c.name as company_name
    FROM quotations q
    LEFT JOIN projects p ON q.project_id = p.id
    LEFT JOIN users u ON q.owner_id = u.id
    LEFT JOIN companies c ON q.company_id = c.id
    ${whereClause}
    ORDER BY q.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM quotations q ${whereClause}`).get(...params).count;
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

router.get('/:id', auth, (req, res) => {
  const { id } = req.params;
  
  const quotation = db.prepare(`
    SELECT q.*, p.title as project_title, u.name as owner_name, u.phone as owner_phone,
           c.name as company_name, c.contact_phone as company_phone
    FROM quotations q
    LEFT JOIN projects p ON q.project_id = p.id
    LEFT JOIN users u ON q.owner_id = u.id
    LEFT JOIN companies c ON q.company_id = c.id
    WHERE q.id = ?
  `).get(id);
  
  if (!quotation) {
    return res.json({ code: 404, message: '报价单不存在' });
  }
  
  const items = db.prepare(`
    SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY sort_order
  `).all(id);
  
  const itemsByCategory = {};
  items.forEach(item => {
    if (!itemsByCategory[item.category]) {
      itemsByCategory[item.category] = [];
    }
    itemsByCategory[item.category].push(item);
  });
  
  const categorySummary = Object.keys(itemsByCategory).map(category => {
    const categoryItems = itemsByCategory[category];
    const total = categoryItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
    return { category, total, items: categoryItems };
  });

  const paymentStages = db.prepare(`
    SELECT * FROM fund_supervision 
    WHERE project_id = ? 
    ORDER BY id
  `).all(quotation.project_id || 0);

  const materialPriceRefs = db.prepare(`
    SELECT mpm.*, qi.item_name as quote_item_name, qi.unit_price as quote_unit_price,
           (mpm.price - qi.unit_price) as price_diff,
           CASE WHEN mpm.price > qi.unit_price THEN 'up' 
                WHEN mpm.price < qi.unit_price THEN 'down' 
                ELSE 'stable' END as price_trend
    FROM quotation_items qi
    LEFT JOIN material_price_monitor mpm ON qi.item_name LIKE '%' || mpm.material_name || '%'
    WHERE qi.quotation_id = ? AND mpm.price IS NOT NULL
    LIMIT 10
  `).all(id);

  const auditLogs = db.prepare(`
    SELECT al.*, u.name as operator_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.module = 'quotations' AND al.target_id = ?
    ORDER BY al.created_at DESC
  `).all(id);

  const fundSupervision = db.prepare(`
    SELECT fs.*, u.name as payer_name, u2.name as payee_name
    FROM fund_supervision fs
    LEFT JOIN users u ON fs.payer_id = u.id
    LEFT JOIN users u2 ON fs.payee_id = u2.id
    WHERE fs.project_id = ?
    ORDER BY fs.id
  `).all(quotation.project_id || 0);
  
  res.json({ 
    code: 200, 
    data: { 
      ...quotation, 
      items, 
      itemsByCategory, 
      categorySummary,
      payment_stages: paymentStages,
      material_price_refs: materialPriceRefs,
      audit_logs: auditLogs,
      fund_supervision: fundSupervision
    } 
  });
});

router.post('/:id/confirm', auth, (req, res) => {
  const { id } = req.params;
  const { remark } = req.body;
  
  const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);
  if (!quotation) {
    return res.json({ code: 404, message: '报价单不存在' });
  }
  
  db.prepare('UPDATE quotations SET status = ? WHERE id = ? AND owner_id = ?').run('confirmed', id, req.user.id);
  
  db.prepare(`INSERT INTO audit_logs (user_id, action, module, target_id, request_data, ip) 
              VALUES (?, 'confirm', 'quotations', ?, ?, ?)`).run(
    req.user.id, id, JSON.stringify({ remark }), req.ip
  );
  
  const existingFunds = db.prepare('SELECT COUNT(*) as count FROM fund_supervision WHERE project_id = ?').get(quotation.project_id || 0).count;
  
  if (quotation.project_id && existingFunds === 0) {
    const stages = [
      { stage: 'stage_1', name: '设计阶段', ratio: 10, condition: '设计方案确认后释放' },
      { stage: 'stage_2', name: '拆改阶段', ratio: 10, condition: '拆改工程验收合格后释放' },
      { stage: 'stage_3', name: '水电阶段', ratio: 20, condition: '水电工程验收合格后释放' },
      { stage: 'stage_4', name: '泥瓦阶段', ratio: 20, condition: '泥瓦工程验收合格后释放' },
      { stage: 'stage_5', name: '木工阶段', ratio: 15, condition: '木工工程验收合格后释放' },
      { stage: 'stage_6', name: '油漆阶段', ratio: 15, condition: '油漆工程验收合格后释放' },
      { stage: 'stage_7', name: '安装阶段', ratio: 8, condition: '安装工程验收合格后释放' },
      { stage: 'stage_8', name: '竣工验收', ratio: 2, condition: '竣工验收合格后释放' }
    ];
    
    const insertFund = db.prepare(`INSERT INTO fund_supervision (project_id, stage, stage_name, amount, payment_ratio, status, release_condition)
                                   VALUES (?, ?, ?, ?, ?, 'frozen', ?)`);
    
    stages.forEach(s => {
      insertFund.run(
        quotation.project_id, 
        s.stage, 
        s.name, 
        Math.round(quotation.total_amount * s.ratio / 100), 
        s.ratio, 
        s.condition
      );
    });
  }
  
  res.json({ code: 200, message: '报价已确认' });
});

router.post('/:id/reject', auth, (req, res) => {
  const { id } = req.params;
  const { reject_reason } = req.body;
  
  const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);
  if (!quotation) {
    return res.json({ code: 404, message: '报价单不存在' });
  }
  
  db.prepare('UPDATE quotations SET status = ? WHERE id = ? AND owner_id = ?').run('rejected', id, req.user.id);
  
  db.prepare(`INSERT INTO audit_logs (user_id, action, module, target_id, request_data, ip) 
              VALUES (?, 'reject', 'quotations', ?, ?, ?)`).run(
    req.user.id, id, JSON.stringify({ reject_reason }), req.ip
  );
  
  res.json({ code: 200, message: '报价已驳回' });
});

router.post('/calculate', auth, (req, res) => {
  const { area, layout_type, style, quality_level = 'standard' } = req.body;
  
  const basePricePerSqm = {
    '经济简约': 800,
    'standard': 1200,
    '品质优选': 1800,
    '豪华定制': 2500
  };
  
  const styleFactor = {
    '现代简约': 1.0,
    '北欧风格': 1.1,
    '新中式': 1.3,
    '轻奢美式': 1.4,
    '日式极简': 1.05,
    '欧式古典': 1.5,
    '工业风格': 0.95,
    '地中海': 1.2
  };
  
  const basePrice = basePricePerSqm[quality_level] || 1200;
  const factor = styleFactor[style] || 1.0;
  const totalEstimate = Math.round(area * basePrice * factor);
  
  const breakdown = {
    hard_decoration: Math.round(totalEstimate * 0.55),
    soft_decoration: Math.round(totalEstimate * 0.25),
    appliances: Math.round(totalEstimate * 0.15),
    design_fee: Math.round(totalEstimate * 0.05)
  };

  const paymentStages = [
    { stage: 'stage_1', stage_name: '设计阶段', payment_ratio: 10, amount: Math.round(totalEstimate * 0.10), release_condition: '设计方案确认后释放' },
    { stage: 'stage_2', stage_name: '拆改阶段', payment_ratio: 10, amount: Math.round(totalEstimate * 0.10), release_condition: '拆改工程验收合格后释放' },
    { stage: 'stage_3', stage_name: '水电阶段', payment_ratio: 20, amount: Math.round(totalEstimate * 0.20), release_condition: '水电工程验收合格后释放' },
    { stage: 'stage_4', stage_name: '泥瓦阶段', payment_ratio: 20, amount: Math.round(totalEstimate * 0.20), release_condition: '泥瓦工程验收合格后释放' },
    { stage: 'stage_5', stage_name: '木工阶段', payment_ratio: 15, amount: Math.round(totalEstimate * 0.15), release_condition: '木工工程验收合格后释放' },
    { stage: 'stage_6', stage_name: '油漆阶段', payment_ratio: 15, amount: Math.round(totalEstimate * 0.15), release_condition: '油漆工程验收合格后释放' },
    { stage: 'stage_7', stage_name: '安装阶段', payment_ratio: 8, amount: Math.round(totalEstimate * 0.08), release_condition: '安装工程验收合格后释放' },
    { stage: 'stage_8', stage_name: '竣工验收', payment_ratio: 2, amount: Math.round(totalEstimate * 0.02), release_condition: '竣工验收合格后释放' }
  ];

  const materialPrices = db.prepare(`
    SELECT material_name, specification, brand, unit, price, trend, change_rate, price_date
    FROM material_price_monitor
    ORDER BY id
    LIMIT 8
  `).all();

  const itemBreakdown = [
    { category: '硬装-拆改', items: [
      { item_name: '墙体拆除', unit: '平米', quantity: Math.round(area * 0.2), unit_price: 80 },
      { item_name: '垃圾清运', unit: '车', quantity: Math.ceil(area / 30), unit_price: 300 }
    ]},
    { category: '硬装-水电', items: [
      { item_name: '水路改造', unit: '米', quantity: Math.round(area * 0.5), unit_price: 85 },
      { item_name: '电路改造', unit: '米', quantity: Math.round(area * 1.5), unit_price: 65 }
    ]},
    { category: '硬装-泥瓦', items: [
      { item_name: '地面找平', unit: '平米', quantity: area, unit_price: 55 },
      { item_name: '地砖铺贴', unit: '平米', quantity: Math.round(area * 0.8), unit_price: 120 }
    ]},
    { category: '硬装-木工', items: [
      { item_name: '吊顶制作', unit: '平米', quantity: Math.round(area * 0.4), unit_price: 180 },
      { item_name: '定制衣柜', unit: '平米', quantity: Math.round(area * 0.15), unit_price: 680 }
    ]},
    { category: '硬装-油漆', items: [
      { item_name: '墙面批灰', unit: '平米', quantity: Math.round(area * 2.5), unit_price: 45 },
      { item_name: '乳胶漆', unit: '平米', quantity: Math.round(area * 2.5), unit_price: 38 }
    ]}
  ];

  itemBreakdown.forEach(cat => {
    cat.items.forEach(item => {
      item.total_price = Math.round(item.quantity * item.unit_price);
    });
  });
  
  res.json({ 
    code: 200, 
    data: { 
      total_estimate: totalEstimate,
      per_sqm_price: Math.round(totalEstimate / area),
      breakdown,
      payment_stages: paymentStages,
      material_price_refs: materialPrices,
      item_breakdown: itemBreakdown
    }
  });
});

module.exports = router;
