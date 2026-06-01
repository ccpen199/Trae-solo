const express = require('express');
const router = express.Router();
const db = require('../db');

function checkDuplicate(companyName, phone, excludeId = null) {
  let sql = 'SELECT * FROM leads WHERE (company_name = ? OR phone = ?)';
  const params = [companyName, phone];
  
  if (excludeId) {
    sql += ' AND id != ?';
    params.push(excludeId);
  }
  
  return db.prepare(sql).all(...params);
}

router.get('/', (req, res) => {
  try {
    const { status, follow_person, industry } = req.query;
    let sql = `
      SELECT l.*, 
             (SELECT follow_time FROM follow_ups WHERE lead_id = l.id ORDER BY follow_time DESC LIMIT 1) as last_follow_time,
             (SELECT next_follow_time FROM follow_ups WHERE lead_id = l.id AND next_follow_time IS NOT NULL ORDER BY follow_time DESC LIMIT 1) as next_follow_time,
             (SELECT COUNT(*) FROM follow_ups WHERE lead_id = l.id) as follow_count
      FROM leads l
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND l.status = ?';
      params.push(status);
    }
    if (follow_person) {
      sql += ' AND l.follow_person = ?';
      params.push(follow_person);
    }
    if (industry) {
      sql += ' AND l.industry = ?';
      params.push(industry);
    }
    
    sql += ' ORDER BY l.created_at DESC';
    
    const leads = db.prepare(sql).all(...params);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    
    const followUps = db.prepare('SELECT * FROM follow_ups WHERE lead_id = ? ORDER BY follow_time DESC').all(req.params.id);
    const viewings = db.prepare('SELECT * FROM viewings WHERE lead_id = ? ORDER BY viewing_time DESC').all(req.params.id);
    const quotes = db.prepare('SELECT * FROM quotes WHERE lead_id = ? ORDER BY created_at DESC').all(req.params.id);
    const contracts = db.prepare('SELECT * FROM contracts WHERE lead_id = ? ORDER BY created_at DESC').all(req.params.id);
    
    res.json({ ...lead, followUps, viewings, quotes, contracts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/check-duplicate', (req, res) => {
  const { company_name, phone } = req.body;
  try {
    const duplicates = checkDuplicate(company_name, phone);
    res.json({ hasDuplicate: duplicates.length > 0, duplicates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { company_name, contact_person, phone, email, company_scale, industry, required_area, budget, source_channel, follow_person, description } = req.body;
  try {
    const duplicates = checkDuplicate(company_name, phone);
    
    const result = db.prepare(`
      INSERT INTO leads (company_name, contact_person, phone, email, company_scale, industry, required_area, budget, source_channel, follow_person, description, is_duplicate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(company_name, contact_person || '', phone || '', email || '', company_scale || '', industry || '', required_area || 0, budget || 0, source_channel || '', follow_person || '', description || '', duplicates.length > 0 ? 1 : 0);
    
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ ...lead, hasDuplicate: duplicates.length > 0, duplicates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { company_name, contact_person, phone, email, company_scale, industry, required_area, budget, source_channel, follow_person, status, description } = req.body;
  try {
    db.prepare(`
      UPDATE leads 
      SET company_name = ?, contact_person = ?, phone = ?, email = ?, company_scale = ?, 
          industry = ?, required_area = ?, budget = ?, source_channel = ?, follow_person = ?, 
          status = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(company_name, contact_person || '', phone || '', email || '', company_scale || '', industry || '', required_area || 0, budget || 0, source_channel || '', follow_person || '', status || 'new', description || '', req.params.id);
    
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/merge', (req, res) => {
  const { merge_with_id } = req.body;
  try {
    const targetLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    const sourceLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(merge_with_id);
    
    if (!targetLead || !sourceLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    db.prepare('UPDATE follow_ups SET lead_id = ? WHERE lead_id = ?').run(req.params.id, merge_with_id);
    db.prepare('UPDATE viewings SET lead_id = ? WHERE lead_id = ?').run(req.params.id, merge_with_id);
    db.prepare('UPDATE quotes SET lead_id = ? WHERE lead_id = ?').run(req.params.id, merge_with_id);
    db.prepare('UPDATE contracts SET lead_id = ? WHERE lead_id = ?').run(req.params.id, merge_with_id);
    
    db.prepare(`
      UPDATE leads 
      SET is_duplicate = 0, merge_with_id = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);
    
    db.prepare(`
      UPDATE leads 
      SET status = 'merged', merge_with_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id, merge_with_id);
    
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM follow_ups WHERE lead_id = ?').run(req.params.id);
    db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/followups', (req, res) => {
  const { follow_type, follow_time, content, feedback, follow_person, next_follow_time } = req.body;
  try {
    if (next_follow_time) {
      const nextFollow = new Date(next_follow_time).getTime();
      const follow = new Date(follow_time || Date.now()).getTime();
      const now = Date.now();
      if (nextFollow < follow) {
        return res.status(400).json({ error: '下次跟进时间不能早于跟进时间' });
      }
      if (nextFollow < now) {
        return res.status(400).json({ error: '下次跟进时间不能早于当前时间' });
      }
    }
    
    const result = db.prepare(`
      INSERT INTO follow_ups (lead_id, follow_type, follow_time, content, feedback, follow_person, next_follow_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.id, follow_type || '', follow_time || null, content || '', feedback || '', follow_person || '', next_follow_time || null);
    
    db.prepare(`
      UPDATE leads SET status = 'following', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);
    
    const followUp = db.prepare('SELECT * FROM follow_ups WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(followUp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/followups', (req, res) => {
  try {
    const followUps = db.prepare('SELECT * FROM follow_ups WHERE lead_id = ? ORDER BY follow_time DESC').all(req.params.id);
    res.json(followUps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
