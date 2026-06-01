const express = require('express');
const router = express.Router();
const db = require('../database');

function generateCaseNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `AJ${year}${month}`;
  
  const result = db.prepare(
    'SELECT case_number FROM cases WHERE case_number LIKE ? ORDER BY case_number DESC LIMIT 1'
  ).get(`${prefix}%`);
  
  if (result) {
    const seq = parseInt(result.case_number.slice(-4)) + 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }
  return `${prefix}0001`;
}

router.get('/', (req, res) => {
  const { status, conflict_type, is_sensitive, page = 1, pageSize = 20 } = req.query;
  
  let whereClause = [];
  let params = [];
  
  if (status) {
    whereClause.push('status = ?');
    params.push(status);
  }
  if (conflict_type) {
    whereClause.push('conflict_type = ?');
    params.push(conflict_type);
  }
  if (is_sensitive === '1') {
    whereClause.push('is_sensitive = 1');
  }
  
  const whereSql = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM cases ${whereSql}`).get(...params);
  
  const cases = db.prepare(`
    SELECT * FROM cases ${whereSql}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  res.json({
    data: cases,
    total: total.count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/:id', (req, res) => {
  const caseItem = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: '案件不存在' });
  }
  
  const parties = db.prepare('SELECT * FROM parties WHERE case_id = ?').all(req.params.id);
  const evidences = db.prepare('SELECT * FROM evidences WHERE case_id = ?').all(req.params.id);
  
  res.json({
    ...caseItem,
    parties,
    evidences
  });
});

router.post('/', (req, res) => {
  const {
    conflict_type,
    incident_location,
    incident_time,
    appeal_content,
    urgency_level,
    is_sensitive,
    created_by,
    parties
  } = req.body;
  
  const partyKeys = new Set();
  if (parties && parties.length > 0) {
    for (const party of parties) {
      const key = `${party.name.trim()}-${(party.phone || '').trim()}`;
      if (partyKeys.has(key)) {
        return res.status(400).json({ 
          error: '当事人信息重复',
          message: `当事人信息重复：姓名"${party.name}"和电话"${party.phone}"的组合已存在，请检查后重新输入`
        });
      }
      partyKeys.add(key);
    }
  }
  
  const case_number = generateCaseNumber();
  
  const result = db.prepare(`
    INSERT INTO cases (case_number, conflict_type, incident_location, incident_time,
                       appeal_content, urgency_level, is_sensitive, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    case_number,
    conflict_type,
    incident_location,
    incident_time,
    appeal_content,
    urgency_level || 'normal',
    is_sensitive ? 1 : 0,
    created_by || 'system'
  );
  
  const caseId = result.lastInsertRowid;
  
  if (parties && parties.length > 0) {
    const insertParty = db.prepare(`
      INSERT INTO parties (case_id, name, phone, address, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    parties.forEach(party => {
      insertParty.run(caseId, party.name, party.phone, party.address, party.role);
    });
  }
  
  res.json({
    id: caseId,
    case_number,
    message: '案件创建成功'
  });
});

router.put('/:id', (req, res) => {
  const {
    conflict_type,
    incident_location,
    incident_time,
    appeal_content,
    urgency_level,
    is_sensitive,
    status,
    risk_level
  } = req.body;
  
  db.prepare(`
    UPDATE cases SET conflict_type = ?, incident_location = ?, incident_time = ?,
                    appeal_content = ?, urgency_level = ?, is_sensitive = ?,
                    status = ?, risk_level = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    conflict_type,
    incident_location,
    incident_time,
    appeal_content,
    urgency_level,
    is_sensitive ? 1 : 0,
    status || 'registered',
    risk_level || 'low',
    req.params.id
  );
  
  res.json({ message: '案件更新成功' });
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE cases SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, req.params.id);
  res.json({ message: '状态更新成功' });
});

router.get('/:id/parties', (req, res) => {
  const parties = db.prepare('SELECT * FROM parties WHERE case_id = ?').all(req.params.id);
  res.json(parties);
});

router.post('/:id/parties', (req, res) => {
  const { name, phone, address, role } = req.body;
  const result = db.prepare(`
    INSERT INTO parties (case_id, name, phone, address, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, name, phone, address, role);
  res.json({ id: result.lastInsertRowid, message: '当事人添加成功' });
});

router.get('/stats/summary', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM cases').get();
  const registered = db.prepare("SELECT COUNT(*) as count FROM cases WHERE status = 'registered'").get();
  const investigating = db.prepare("SELECT COUNT(*) as count FROM cases WHERE status = 'investigating'").get();
  const mediating = db.prepare("SELECT COUNT(*) as count FROM cases WHERE status = 'mediating'").get();
  const closed = db.prepare("SELECT COUNT(*) as count FROM cases WHERE status = 'closed'").get();
  const highRisk = db.prepare("SELECT COUNT(*) as count FROM cases WHERE risk_level = 'high'").get();
  
  res.json({
    total: total.count,
    registered: registered.count,
    investigating: investigating.count,
    mediating: mediating.count,
    closed: closed.count,
    highRisk: highRisk.count
  });
});

module.exports = router;
