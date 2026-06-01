const express = require('express');
const router = express.Router();

function generatePolicyNo() {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `POL${ymd}${random}`;
}

router.get('/', (req, res) => {
  const { farmer_id, status, limit = 50, offset = 0 } = req.query;
  let sql = `
    SELECT p.*, f.name as farmer_name, f.phone as farmer_phone, 
           u.name as insurer_name
    FROM policies p
    LEFT JOIN farmers f ON p.farmer_id = f.id
    LEFT JOIN users u ON p.insurer_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (farmer_id) {
    sql += ' AND p.farmer_id = ?';
    params.push(farmer_id);
  }
  if (status) {
    sql += ' AND p.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY p.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  let data = req.db.prepare(sql).all(...params);
  
  const policyIds = data.map(p => p.id);
  let relatedData = { reports: {}, surveys: {}, claims: {} };
  
  if (policyIds.length > 0) {
    const placeholders = policyIds.map(() => '?').join(',');
    
    const reports = req.db.prepare(`
      SELECT r.*, u.name as reporter_name
      FROM reports r
      LEFT JOIN users u ON r.reported_by = u.id
      WHERE r.policy_id IN (${placeholders})
      ORDER BY r.id DESC
    `).all(...policyIds);
    
    const surveys = req.db.prepare(`
      SELECT s.*, u.name as surveyor_name
      FROM surveys s
      LEFT JOIN users u ON s.surveyor_id = u.id
      WHERE s.policy_id IN (${placeholders})
      ORDER BY s.id DESC
    `).all(...policyIds);
    
    const claims = req.db.prepare(`
      SELECT c.*, u.name as reviewer_name, ca.approvals
      FROM claims c
      LEFT JOIN users u ON c.reviewer_id = u.id
      LEFT JOIN (
        SELECT claim_id, GROUP_CONCAT(approver_role || ':' || approval_status || ':' || COALESCE(approval_opinion,'') || ':' || COALESCE(approval_time,''), '|') as approvals
        FROM claim_approvals
        GROUP BY claim_id
      ) ca ON ca.claim_id = c.id
      WHERE c.policy_id IN (${placeholders})
      ORDER BY c.id DESC
    `).all(...policyIds);
    
    reports.forEach(r => {
      if (!relatedData.reports[r.policy_id]) relatedData.reports[r.policy_id] = [];
      relatedData.reports[r.policy_id].push(r);
    });
    
    surveys.forEach(s => {
      if (!relatedData.surveys[s.policy_id]) relatedData.surveys[s.policy_id] = [];
      relatedData.surveys[s.policy_id].push(s);
    });
    
    claims.forEach(c => {
      if (!relatedData.claims[c.policy_id]) relatedData.claims[c.policy_id] = [];
      relatedData.claims[c.policy_id].push(c);
    });
  }
  
  data = data.map(p => ({
    ...p,
    reports: relatedData.reports[p.id] || [],
    surveys: relatedData.surveys[p.id] || [],
    claims: relatedData.claims[p.id] || []
  }));
  
  let countSql = 'SELECT COUNT(*) as count FROM policies WHERE 1=1';
  const countParams = [];
  if (farmer_id) { countSql += ' AND farmer_id = ?'; countParams.push(farmer_id); }
  if (status) { countSql += ' AND status = ?'; countParams.push(status); }
  const total = req.db.prepare(countSql).get(...countParams).count;
  
  res.json({ data, total, limit: parseInt(limit), offset: parseInt(offset) });
});

router.get('/:id', (req, res) => {
  const data = req.db.prepare(`
    SELECT p.*, f.name as farmer_name, f.phone as farmer_phone, f.id_card as farmer_id_card,
           f.address as farmer_address, f.township, f.village,
           u.name as insurer_name
    FROM policies p
    LEFT JOIN farmers f ON p.farmer_id = f.id
    LEFT JOIN users u ON p.insurer_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!data) return res.status(404).json({ error: '保单不存在' });
  res.json(data);
});

router.post('/', (req, res) => {
  const {
    farmer_id, crop_type, crop_variety, plot_location, plot_latitude, plot_longitude,
    area, area_unit = 'mu', insurance_amount, premium, start_date, end_date,
    deductible_clause, deductible_ratio = 0.1, insurer_id
  } = req.body;

  if (!farmer_id || !crop_type || !plot_location || !area || !insurance_amount || !premium || !start_date || !end_date) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  const farmer = req.db.prepare('SELECT * FROM farmers WHERE id = ?').get(farmer_id);
  if (!farmer) return res.status(404).json({ error: '农户不存在' });

  const policy_no = generatePolicyNo();

  const info = req.db.prepare(`
    INSERT INTO policies (
      policy_no, farmer_id, crop_type, crop_variety, plot_location, plot_latitude, plot_longitude,
      area, area_unit, insurance_amount, premium, start_date, end_date,
      deductible_clause, deductible_ratio, insurer_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    policy_no, farmer_id, crop_type, crop_variety, plot_location, plot_latitude, plot_longitude,
    area, area_unit, insurance_amount, premium, start_date, end_date,
    deductible_clause, deductible_ratio, insurer_id
  );

  req.logOperation(insurer_id || 1, 'policy', 'create', info.lastInsertRowid, `创建保单: ${policy_no}`);

  const policy = req.db.prepare('SELECT * FROM policies WHERE id = ?').get(info.lastInsertRowid);
  res.json(policy);
});

router.put('/:id', (req, res) => {
  const policy = req.db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id);
  if (!policy) return res.status(404).json({ error: '保单不存在' });

  const {
    crop_type, crop_variety, plot_location, plot_latitude, plot_longitude,
    area, area_unit, insurance_amount, premium, start_date, end_date,
    deductible_clause, deductible_ratio, payment_status, status, insurer_id
  } = req.body;

  req.db.prepare(`
    UPDATE policies SET
      crop_type = COALESCE(?, crop_type),
      crop_variety = COALESCE(?, crop_variety),
      plot_location = COALESCE(?, plot_location),
      plot_latitude = COALESCE(?, plot_latitude),
      plot_longitude = COALESCE(?, plot_longitude),
      area = COALESCE(?, area),
      area_unit = COALESCE(?, area_unit),
      insurance_amount = COALESCE(?, insurance_amount),
      premium = COALESCE(?, premium),
      start_date = COALESCE(?, start_date),
      end_date = COALESCE(?, end_date),
      deductible_clause = COALESCE(?, deductible_clause),
      deductible_ratio = COALESCE(?, deductible_ratio),
      payment_status = COALESCE(?, payment_status),
      status = COALESCE(?, status),
      insurer_id = COALESCE(?, insurer_id),
      payment_time = CASE WHEN ? = 'paid' AND payment_status != 'paid' THEN CURRENT_TIMESTAMP ELSE payment_time END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    crop_type, crop_variety, plot_location, plot_latitude, plot_longitude,
    area, area_unit, insurance_amount, premium, start_date, end_date,
    deductible_clause, deductible_ratio, payment_status, status, insurer_id,
    payment_status, req.params.id
  );

  req.logOperation(insurer_id || 1, 'policy', 'update', req.params.id, `更新保单: ${policy.policy_no}`);

  const updated = req.db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/pay', (req, res) => {
  const policy = req.db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id);
  if (!policy) return res.status(404).json({ error: '保单不存在' });
  if (policy.payment_status === 'paid') return res.status(400).json({ error: '保单已支付' });

  req.db.prepare(`
    UPDATE policies SET payment_status = 'paid', payment_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);

  req.logOperation(1, 'policy', 'pay', req.params.id, `支付保费: ${policy.policy_no}`);

  const updated = req.db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
