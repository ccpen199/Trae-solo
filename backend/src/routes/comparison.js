const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { room_type_id, checkin_date, is_price_inverted, is_inventory_anomaly, page = 1, pageSize = 50 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT cr.*, rt.name as room_name, h.name as hotel_name
    FROM comparison_results cr
    LEFT JOIN room_types rt ON cr.room_type_id = rt.id
    LEFT JOIN hotels h ON rt.hotel_id = h.id
    WHERE 1=1
  `;
  const params = [];
  
  if (room_type_id) {
    query += ' AND cr.room_type_id = ?';
    params.push(room_type_id);
  }
  if (checkin_date) {
    query += ' AND cr.checkin_date = ?';
    params.push(checkin_date);
  }
  if (is_price_inverted === '1') {
    query += ' AND cr.is_price_inverted = 1';
  }
  if (is_inventory_anomaly === '1') {
    query += ' AND cr.is_inventory_anomaly = 1';
  }
  
  query += ' ORDER BY cr.compared_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const results = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM comparison_results WHERE 1=1').get().count;
  
  res.json({ data: results, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/raw/:room_type_id/:checkin_date', (req, res) => {
  const { room_type_id, checkin_date } = req.params;
  
  const rawData = db.prepare(`
    SELECT pc.*, c.name as channel_name, c.code as channel_code, rm.status as mapping_status
    FROM price_collections pc
    LEFT JOIN room_mappings rm ON pc.room_mapping_id = rm.id
    LEFT JOIN hotel_mappings hm ON rm.hotel_mapping_id = hm.id
    LEFT JOIN channels c ON hm.channel_id = c.id
    WHERE rm.room_type_id = ? AND pc.checkin_date = ?
    ORDER BY pc.collected_at DESC
  `).all(room_type_id, checkin_date);
  
  res.json({ data: rawData });
});

router.post('/run', (req, res) => {
  const { checkin_date } = req.body;
  const date = checkin_date || new Date().toISOString().split('T')[0];
  
  const roomMappings = db.prepare(`
    SELECT DISTINCT rm.room_type_id, rt.name as room_name
    FROM room_mappings rm
    LEFT JOIN room_types rt ON rm.room_type_id = rt.id
    WHERE rm.status = 'confirmed' AND rm.room_type_id IS NOT NULL
  `).all();
  
  const results = [];
  
  for (const mapping of roomMappings) {
    if (!mapping.room_type_id) continue;
    
    const prices = db.prepare(`
      SELECT pc.*, c.code as channel_code
      FROM price_collections pc
      LEFT JOIN room_mappings rm ON pc.room_mapping_id = rm.id
      LEFT JOIN hotel_mappings hm ON rm.hotel_mapping_id = hm.id
      LEFT JOIN channels c ON hm.channel_id = c.id
      WHERE rm.room_type_id = ? AND pc.checkin_date = ? AND pc.collection_status = 'success'
      ORDER BY pc.collected_at DESC
    `).all(mapping.room_type_id, date);
    
    if (prices.length < 2) continue;
    
    const ourPrice = prices.find(p => p.channel_code === 'OWN');
    const competitorPrices = prices.filter(p => p.channel_code !== 'OWN');
    
    if (!ourPrice || competitorPrices.length === 0) continue;
    
    const lowest = competitorPrices.reduce((min, p) => p.total_price < min.total_price ? p : min, competitorPrices[0]);
    
    const priceDiff = ourPrice.total_price - lowest.total_price;
    const priceDiffPercent = ((priceDiff / ourPrice.total_price) * 100).toFixed(2);
    
    const isPriceInverted = priceDiff > 0;
    const isInventoryAnomaly = (ourPrice.inventory > 0 && lowest.inventory === 0) || (ourPrice.inventory === 0 && lowest.inventory > 5);
    
    const result = db.prepare(`
      INSERT INTO comparison_results 
      (room_type_id, checkin_date, our_price, our_total_price, lowest_price, lowest_channel, 
       price_difference, price_difference_percent, is_price_inverted, is_inventory_anomaly, 
       our_inventory, lowest_inventory)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      mapping.room_type_id, date, ourPrice.price, ourPrice.total_price,
      lowest.total_price, lowest.channel_code, priceDiff, priceDiffPercent,
      isPriceInverted ? 1 : 0, isInventoryAnomaly ? 1 : 0,
      ourPrice.inventory, lowest.inventory
    );
    
    results.push({
      id: result.lastInsertRowid,
      room_type_id: mapping.room_type_id,
      room_name: mapping.room_name,
      our_price: ourPrice.total_price,
      lowest_price: lowest.total_price,
      lowest_channel: lowest.channel_code,
      price_diff: priceDiff,
      price_diff_percent: priceDiffPercent,
      is_price_inverted: isPriceInverted,
      is_inventory_anomaly: isInventoryAnomaly
    });
  }
  
  res.json({ success: true, count: results.length, results });
});

router.get('/summary', (req, res) => {
  const { checkin_date } = req.query;
  const date = checkin_date || new Date().toISOString().split('T')[0];
  
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_comparisons,
      SUM(CASE WHEN is_price_inverted = 1 THEN 1 ELSE 0 END) as inverted_count,
      SUM(CASE WHEN is_inventory_anomaly = 1 THEN 1 ELSE 0 END) as inventory_anomaly_count,
      AVG(price_difference) as avg_price_diff,
      MIN(lowest_price) as min_price,
      MAX(our_total_price) as max_price
    FROM comparison_results
    WHERE checkin_date = ?
  `).get(date);
  
  const topInverted = db.prepare(`
    SELECT cr.*, h.name as hotel_name, rt.name as room_name
    FROM comparison_results cr
    LEFT JOIN room_types rt ON cr.room_type_id = rt.id
    LEFT JOIN hotels h ON rt.hotel_id = h.id
    WHERE cr.checkin_date = ? AND cr.is_price_inverted = 1
    ORDER BY cr.price_difference_percent DESC
    LIMIT 10
  `).all(date);
  
  res.json({ stats, topInverted });
});

module.exports = router;
