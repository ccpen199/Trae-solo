const express = require('express');
const router = express.Router();

function generateReportNo() {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RPT${ymd}${random}`;
}

router.get('/', (req, res) => {
  const { policy_id, farmer_id, status, limit = 50, offset = 0 } = req.query;
  let sql = `
    SELECT r.*, p.policy_no, p.crop_type, p.area as policy_area,
           f.name as farmer_name, f.phone as farmer_phone,
           u.name as reporter_name
    FROM reports r
    LEFT JOIN policies p ON r.policy_id = p.id
    LEFT JOIN farmers f ON r.farmer_id = f.id
    LEFT JOIN users u ON r.reported_by = u.id
    WHERE 1=1
  `;
  const params = [];
  if (policy_id) { sql += ' AND r.policy_id = ?'; params.push(policy_id); }
  if (farmer_id) { sql += ' AND r.farmer_id = ?'; params.push(farmer_id); }
  if (status) { sql += ' AND r.status = ?'; params.push(status); }
  sql += ' ORDER BY r.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const data = req.db.prepare(sql).all(...params);
  let countSql = 'SELECT COUNT(*) as count FROM reports WHERE 1=1';
  const countParams = [];
  if (policy_id) { countSql += ' AND policy_id = ?'; countParams.push(policy_id); }
  if (farmer_id) { countSql += ' AND farmer_id = ?'; countParams.push(farmer_id); }
  if (status) { countSql += ' AND status = ?'; countParams.push(status); }
  const total = req.db.prepare(countSql).get(...countParams).count;
  
  res.json({ data, total, limit: parseInt(limit), offset: parseInt(offset) });
});

router.get('/:id', (req, res) => {
  const data = req.db.prepare(`
    SELECT r.*, p.policy_no, p.crop_type, p.area as policy_area, p.insurance_amount,
           p.start_date, p.end_date, p.deductible_ratio,
           f.name as farmer_name, f.phone as farmer_phone, f.id_card as farmer_id_card,
           f.address as farmer_address, f.township, f.village,
           u.name as reporter_name
    FROM reports r
    LEFT JOIN policies p ON r.policy_id = p.id
    LEFT JOIN farmers f ON r.farmer_id = f.id
    LEFT JOIN users u ON r.reported_by = u.id
    WHERE r.id = ?
  `).get(req.params.id);
  if (!data) return res.status(404).json({ error: '报案不存在' });
  res.json(data);
});

router.post('/', (req, res) => {
  const {
    policy_id, disaster_type, disaster_time, photos, location,
    latitude, longitude, damaged_area, emergency_contact,
    emergency_phone, description, reported_by
  } = req.body;

  if (!policy_id || !disaster_type || !disaster_time || !damaged_area || !emergency_contact || !emergency_phone) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  const policy = req.db.prepare('SELECT * FROM policies WHERE id = ?').get(policy_id);
  if (!policy) return res.status(404).json({ error: '保单不存在' });
  if (policy.status !== 'active') return res.status(400).json({ error: '保单未生效' });
  if (policy.payment_status !== 'paid') return res.status(400).json({ error: '保单保费未支付' });

  const now = new Date();
  const startDate = new Date(policy.start_date);
  const endDate = new Date(policy.end_date);
  if (now < startDate || now > endDate) {
    return res.status(400).json({ error: '不在保险期间内' });
  }

  if (damaged_area > policy.area) {
    return res.status(400).json({ error: '受损面积不能超过投保面积' });
  }

  const duplicate = req.db.prepare(`
    SELECT * FROM reports 
    WHERE policy_id = ? AND disaster_type = ? AND status != 'rejected'
    AND ABS(strftime('%s', disaster_time) - strftime('%s', ?)) < 86400
  `).get(policy_id, disaster_type, disaster_time);
  if (duplicate) {
    return res.status(400).json({ error: '疑似重复报案，请核实', duplicate_report_id: duplicate.id });
  }

  const report_no = generateReportNo();

  const info = req.db.prepare(`
    INSERT INTO reports (
      report_no, policy_id, farmer_id, disaster_type, disaster_time, photos, location,
      latitude, longitude, damaged_area, emergency_contact, emergency_phone,
      description, status, reported_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    report_no, policy_id, policy.farmer_id, disaster_type, disaster_time, photos, location,
    latitude, longitude, damaged_area, emergency_contact, emergency_phone,
    description, reported_by
  );

  req.db.prepare(`UPDATE policies SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(policy_id);
  req.logOperation(reported_by || 1, 'report', 'create', info.lastInsertRowid, `创建报案: ${report_no}`);

  const report = req.db.prepare('SELECT * FROM reports WHERE id = ?').get(info.lastInsertRowid);
  res.json(report);
});

router.put('/:id', (req, res) => {
  const report = req.db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: '报案不存在' });

  const {
    disaster_type, disaster_time, photos, location, latitude, longitude,
    damaged_area, emergency_contact, emergency_phone, description, status, reported_by
  } = req.body;

  req.db.prepare(`
    UPDATE reports SET
      disaster_type = COALESCE(?, disaster_type),
      disaster_time = COALESCE(?, disaster_time),
      photos = COALESCE(?, photos),
      location = COALESCE(?, location),
      latitude = COALESCE(?, latitude),
      longitude = COALESCE(?, longitude),
      damaged_area = COALESCE(?, damaged_area),
      emergency_contact = COALESCE(?, emergency_contact),
      emergency_phone = COALESCE(?, emergency_phone),
      description = COALESCE(?, description),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    disaster_type, disaster_time, photos, location, latitude, longitude,
    damaged_area, emergency_contact, emergency_phone, description, status,
    req.params.id
  );

  req.logOperation(reported_by || 1, 'report', 'update', req.params.id, `更新报案: ${report.report_no}`);

  const updated = req.db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
