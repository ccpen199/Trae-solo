const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/:caseId/agreements', (req, res) => {
  const agreements = db.prepare(`
    SELECT * FROM agreements WHERE case_id = ? ORDER BY created_at DESC
  `).all(req.params.caseId);
  
  const agreementsWithRecords = agreements.map(agreement => {
    const records = db.prepare(`
      SELECT * FROM performance_records WHERE agreement_id = ?
    `).all(agreement.id);
    return { ...agreement, performance_records: records };
  });
  
  res.json(agreementsWithRecords);
});

router.post('/:caseId/agreements', (req, res) => {
  const { agreement_number, sign_date, content, performance_nodes, signed_file_path } = req.body;
  
  const result = db.prepare(`
    INSERT INTO agreements (case_id, agreement_number, sign_date, content, performance_nodes, signed_file_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.caseId, agreement_number, sign_date, content, performance_nodes, signed_file_path);
  
  const agreementId = result.lastInsertRowid;
  
  if (performance_nodes) {
    const nodes = JSON.parse(performance_nodes);
    const insertNode = db.prepare(`
      INSERT INTO performance_records (agreement_id, node_name, planned_date, status)
      VALUES (?, ?, ?, 'pending')
    `);
    nodes.forEach(node => {
      insertNode.run(agreementId, node.name, node.planned_date);
    });
  }
  
  db.prepare("UPDATE cases SET status = 'agreed', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(req.params.caseId);
  
  res.json({ id: agreementId, message: '协议添加成功' });
});

router.get('/:caseId/follow-ups', (req, res) => {
  const followUps = db.prepare(`
    SELECT * FROM follow_ups WHERE case_id = ? ORDER BY follow_up_time DESC
  `).all(req.params.caseId);
  res.json(followUps);
});

router.post('/:caseId/follow-ups', (req, res) => {
  const { follow_up_time, follow_up_person, result, has_dispute_again, dispute_again_description } = req.body;
  
  const result2 = db.prepare(`
    INSERT INTO follow_ups (case_id, follow_up_time, follow_up_person, result, has_dispute_again, dispute_again_description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    req.params.caseId,
    follow_up_time,
    follow_up_person,
    result,
    has_dispute_again ? 1 : 0,
    dispute_again_description
  );
  
  if (has_dispute_again) {
    db.prepare("UPDATE cases SET status = 'reopened', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(req.params.caseId);
  }
  
  res.json({ id: result2.lastInsertRowid, message: '回访记录添加成功' });
});

router.put('/performance/:id', (req, res) => {
  const { actual_date, status, remark } = req.body;
  
  db.prepare(`
    UPDATE performance_records SET actual_date = ?, status = ?, remark = ?
    WHERE id = ?
  `).run(actual_date, status, remark, req.params.id);
  
  res.json({ message: '履行记录更新成功' });
});

router.delete('/agreements/:id', (req, res) => {
  db.prepare('DELETE FROM performance_records WHERE agreement_id = ?').run(req.params.id);
  db.prepare('DELETE FROM agreements WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.delete('/follow-ups/:id', (req, res) => {
  db.prepare('DELETE FROM follow_ups WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
