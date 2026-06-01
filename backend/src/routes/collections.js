const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { room_mapping_id, checkin_date, status, page = 1, pageSize = 50 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT pc.*, rm.channel_room_name, hm.channel_hotel_name, c.name as channel_name
    FROM price_collections pc
    LEFT JOIN room_mappings rm ON pc.room_mapping_id = rm.id
    LEFT JOIN hotel_mappings hm ON rm.hotel_mapping_id = hm.id
    LEFT JOIN channels c ON hm.channel_id = c.id
    WHERE 1=1
  `;
  const params = [];
  
  if (room_mapping_id) {
    query += ' AND pc.room_mapping_id = ?';
    params.push(room_mapping_id);
  }
  if (checkin_date) {
    query += ' AND pc.checkin_date = ?';
    params.push(checkin_date);
  }
  if (status) {
    query += ' AND pc.collection_status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY pc.collected_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const collections = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM price_collections WHERE 1=1').get().count;
  
  res.json({ data: collections, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.post('/', (req, res) => {
  const { room_mapping_id, checkin_date, checkout_date, price, tax, inventory, promotion, promotion_discount } = req.body;
  const total_price = price + (tax || 0);
  
  const result = db.prepare(`
    INSERT INTO price_collections (room_mapping_id, checkin_date, checkout_date, price, tax, total_price, inventory, promotion, promotion_discount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(room_mapping_id, checkin_date, checkout_date, price, tax || 0, total_price, inventory || 0, promotion || null, promotion_discount || null);
  
  res.json({ id: result.lastInsertRowid, total_price });
});

router.post('/batch', (req, res) => {
  const { collections } = req.body;
  const stmt = db.prepare(`
    INSERT INTO price_collections (room_mapping_id, checkin_date, checkout_date, price, tax, total_price, inventory, promotion, promotion_discount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      const total_price = item.price + (item.tax || 0);
      stmt.run(item.room_mapping_id, item.checkin_date, item.checkout_date, item.price, item.tax || 0, total_price, item.inventory || 0, item.promotion || null, item.promotion_discount || null);
    }
  });
  
  insertMany(collections);
  res.json({ success: true, count: collections.length });
});

router.get('/failed', (req, res) => {
  const failed = db.prepare(`
    SELECT pc.*, rm.channel_room_name, hm.channel_hotel_name, c.name as channel_name
    FROM price_collections pc
    LEFT JOIN room_mappings rm ON pc.room_mapping_id = rm.id
    LEFT JOIN hotel_mappings hm ON rm.hotel_mapping_id = hm.id
    LEFT JOIN channels c ON hm.channel_id = c.id
    WHERE pc.collection_status != 'success'
    ORDER BY pc.collected_at DESC
    LIMIT 100
  `).all();
  res.json({ data: failed });
});

router.post('/:id/retry', (req, res) => {
  const record = db.prepare('SELECT * FROM price_collections WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: 'Record not found' });
  
  db.prepare(`
    UPDATE price_collections 
    SET retry_count = retry_count + 1, collection_status = 'success', error_message = NULL
    WHERE id = ?
  `).run(req.params.id);
  
  res.json({ success: true });
});

router.post('/:id/fail', (req, res) => {
  const { error_message } = req.body;
  db.prepare(`
    UPDATE price_collections 
    SET collection_status = 'failed', error_message = ?, retry_count = retry_count + 1
    WHERE id = ?
  `).run(error_message, req.params.id);
  
  res.json({ success: true });
});

module.exports = router;
