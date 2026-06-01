const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM checklist_categories ORDER BY id').all();
  res.json(categories);
});

router.get('/categories/:id/items', (req, res) => {
  const items = db.prepare(
    'SELECT * FROM checklist_items WHERE category_id = ? ORDER BY sort_order, id'
  ).all(req.params.id);
  res.json(items);
});

router.get('/audit/:auditPlanId', (req, res) => {
  const checklists = db.prepare(`
    SELECT ac.*, ci.item_text, ci.max_score, ci.category_id, cc.name as category_name
    FROM audit_checklists ac
    JOIN checklist_items ci ON ac.checklist_item_id = ci.id
    JOIN checklist_categories cc ON ci.category_id = cc.id
    WHERE ac.audit_plan_id = ?
    ORDER BY cc.id, ci.sort_order
  `).all(req.params.auditPlanId);
  res.json(checklists);
});

router.get('/audit/:auditPlanId/with-structure', (req, res) => {
  const categories = db.prepare('SELECT * FROM checklist_categories ORDER BY id').all();
  const items = db.prepare(`
    SELECT ci.*, ac.id as audit_checklist_id, ac.score, ac.notes, ac.photo_path, ac.filled_at
    FROM checklist_items ci
    LEFT JOIN audit_checklists ac ON ci.id = ac.checklist_item_id AND ac.audit_plan_id = ?
    ORDER BY ci.category_id, ci.sort_order
  `).all(req.params.auditPlanId);
  
  const result = categories.map(cat => ({
    ...cat,
    items: items.filter(item => item.category_id === cat.id)
  }));
  
  res.json(result);
});

router.post('/audit/:auditPlanId', (req, res) => {
  const { auditPlanId } = req.params;
  const { checklist_item_id, score, notes, photo_path, filled_by } = req.body;
  
  const existing = db.prepare(
    'SELECT id FROM audit_checklists WHERE audit_plan_id = ? AND checklist_item_id = ?'
  ).get(auditPlanId, checklist_item_id);
  
  if (existing) {
    db.prepare(
      'UPDATE audit_checklists SET score=?, notes=?, photo_path=?, filled_by=?, filled_at=CURRENT_TIMESTAMP WHERE id=?'
    ).run(score, notes, photo_path, filled_by, existing.id);
    res.json({ id: existing.id, checklist_item_id, score, notes, photo_path });
  } else {
    const result = db.prepare(
      'INSERT INTO audit_checklists (audit_plan_id, checklist_item_id, score, notes, photo_path, filled_by, filled_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).run(auditPlanId, checklist_item_id, score, notes, photo_path, filled_by);
    res.json({ id: result.lastInsertRowid, checklist_item_id, score, notes, photo_path });
  }
});

router.post('/audit/:auditPlanId/batch', (req, res) => {
  const { auditPlanId } = req.params;
  const { items, filled_by } = req.body;
  
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      const existing = db.prepare(
        'SELECT id FROM audit_checklists WHERE audit_plan_id = ? AND checklist_item_id = ?'
      ).get(auditPlanId, item.checklist_item_id);
      
      if (existing) {
        db.prepare(
          'UPDATE audit_checklists SET score=?, notes=?, photo_path=?, filled_by=?, filled_at=CURRENT_TIMESTAMP WHERE id=?'
        ).run(item.score, item.notes, item.photo_path, filled_by, existing.id);
      } else {
        db.prepare(
          'INSERT INTO audit_checklists (audit_plan_id, checklist_item_id, score, notes, photo_path, filled_by, filled_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
        ).run(auditPlanId, item.checklist_item_id, item.score, item.notes, item.photo_path, filled_by);
      }
    }
  });
  
  insertMany(items);
  res.json({ success: true, count: items.length });
});

module.exports = router;
