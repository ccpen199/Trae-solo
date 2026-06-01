const express = require('express');
const router = express.Router();
const db = require('../db');

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
}

router.get('/', (req, res) => {
  try {
    const { lead_id, status } = req.query;
    let sql = `
      SELECT q.*, l.company_name
      FROM quotes q
      JOIN leads l ON q.lead_id = l.id
      WHERE 1=1
    `;
    const params = [];
    
    if (lead_id) {
      sql += ' AND q.lead_id = ?';
      params.push(lead_id);
    }
    if (status) {
      sql += ' AND q.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY q.created_at DESC';
    
    const quotes = db.prepare(sql).all(...params);
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const quote = db.prepare(`
      SELECT q.*, l.company_name
      FROM quotes q
      JOIN leads l ON q.lead_id = l.id
      WHERE q.id = ?
    `).get(req.params.id);
    
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    
    if (quote.room_ids) {
      const roomIdList = quote.room_ids.split(',').map(id => parseInt(id.trim()));
      if (roomIdList.length > 0) {
        const placeholders = roomIdList.map(() => '?').join(',');
        const rooms = db.prepare(`
          SELECT r.*, b.name as building_name, f.floor_number
          FROM rooms r
          JOIN buildings b ON r.building_id = b.id
          JOIN floors f ON r.floor_id = f.id
          WHERE r.id IN (${placeholders})
        `).all(...roomIdList);
        quote.rooms = rooms;
      }
    }
    
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { lead_id, viewing_id, room_ids, base_rent, discount_policy, discount_amount, final_price, payment_method, valid_days, created_by } = req.body;
  try {
    if (room_ids && room_ids.length > 0) {
      for (const roomId of room_ids) {
        const room = db.prepare('SELECT status FROM rooms WHERE id = ?').get(roomId);
        if (room && room.status === 'rented') {
          return res.status(400).json({ error: `房源 ${roomId} 已出租，无法报价` });
        }
      }
    }
    
    const maxVersion = db.prepare('SELECT MAX(version) as max FROM quotes WHERE lead_id = ?').get(lead_id);
    const version = (maxVersion.max || 0) + 1;
    
    const expireDate = addDays(new Date(), valid_days || 30);
    
    const result = db.prepare(`
      INSERT INTO quotes (lead_id, viewing_id, version, room_ids, base_rent, discount_policy, discount_amount, final_price, payment_method, valid_days, expire_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(lead_id, viewing_id || null, version, room_ids ? room_ids.join(',') : '', base_rent || 0, discount_policy || '', discount_amount || 0, final_price || 0, payment_method || '', valid_days || 30, expireDate, created_by || '');
    
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/lock', (req, res) => {
  try {
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    
    if (quote.is_locked) {
      return res.status(400).json({ error: '报价已锁定，无法重复锁定' });
    }
    
    db.prepare('UPDATE quotes SET is_locked = 1, status = ? WHERE id = ?').run('locked', req.params.id);
    const updatedQuote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    res.json(updatedQuote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const quote = db.prepare('SELECT is_locked FROM quotes WHERE id = ?').get(req.params.id);
    if (quote && quote.is_locked) {
      return res.status(400).json({ error: '报价已锁定，无法修改' });
    }
    
    const { lead_id, viewing_id, room_ids, base_rent, discount_policy, discount_amount, final_price, payment_method, valid_days, status } = req.body;
    
    db.prepare(`
      UPDATE quotes 
      SET lead_id = ?, viewing_id = ?, room_ids = ?, base_rent = ?, discount_policy = ?, 
          discount_amount = ?, final_price = ?, payment_method = ?, valid_days = ?, status = ?
      WHERE id = ?
    `).run(lead_id, viewing_id || null, room_ids ? (Array.isArray(room_ids) ? room_ids.join(',') : room_ids) : '', base_rent || 0, discount_policy || '', discount_amount || 0, final_price || 0, payment_method || '', valid_days || 30, status || 'draft', req.params.id);
    
    const updatedQuote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    res.json(updatedQuote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
