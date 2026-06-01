const express = require('express');
const router = express.Router();
const db = require('../database');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

const reportsDir = path.join(__dirname, '..', 'data', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

router.get('/comparison/export', (req, res) => {
  const { checkin_date, format = 'csv' } = req.query;
  const date = checkin_date || new Date().toISOString().split('T')[0];
  
  const data = db.prepare(`
    SELECT 
      h.name as hotel_name,
      rt.name as room_name,
      cr.checkin_date,
      cr.our_total_price as our_price,
      cr.lowest_price,
      cr.lowest_channel,
      cr.price_difference,
      cr.price_difference_percent,
      CASE WHEN cr.is_price_inverted = 1 THEN '是' ELSE '否' END as is_price_inverted,
      CASE WHEN cr.is_inventory_anomaly = 1 THEN '是' ELSE '否' END as is_inventory_anomaly,
      cr.our_inventory,
      cr.lowest_inventory,
      cr.compared_at
    FROM comparison_results cr
    LEFT JOIN room_types rt ON cr.room_type_id = rt.id
    LEFT JOIN hotels h ON rt.hotel_id = h.id
    WHERE cr.checkin_date = ?
    ORDER BY cr.price_difference_percent DESC
  `).all(date);
  
  if (format === 'json') {
    res.json({ data, filename: `comparison_${date}.json` });
    return;
  }
  
  const filename = `comparison_${date}.csv`;
  const filepath = path.join(reportsDir, filename);
  
  const csvWriter = createCsvWriter({
    path: filepath,
    header: [
      { id: 'hotel_name', title: '酒店名称' },
      { id: 'room_name', title: '房型' },
      { id: 'checkin_date', title: '入住日期' },
      { id: 'our_price', title: '我方价格' },
      { id: 'lowest_price', title: '最低价格' },
      { id: 'lowest_channel', title: '最低渠道' },
      { id: 'price_difference', title: '价差' },
      { id: 'price_difference_percent', title: '价差%' },
      { id: 'is_price_inverted', title: '价格倒挂' },
      { id: 'is_inventory_anomaly', title: '库存异常' },
      { id: 'our_inventory', title: '我方库存' },
      { id: 'lowest_inventory', title: '最低库存' },
      { id: 'compared_at', title: '对比时间' }
    ]
  });
  
  csvWriter.writeRecords(data).then(() => {
    res.download(filepath, filename);
  });
});

router.get('/collection/export', (req, res) => {
  const { start_date, end_date, format = 'csv' } = req.query;
  const startDate = start_date || new Date().toISOString().split('T')[0];
  const endDate = end_date || new Date().toISOString().split('T')[0];
  
  const data = db.prepare(`
    SELECT 
      c.name as channel_name,
      hm.channel_hotel_name,
      rm.channel_room_name,
      pc.checkin_date,
      pc.checkout_date,
      pc.price,
      pc.tax,
      pc.total_price,
      pc.inventory,
      pc.promotion,
      pc.promotion_discount,
      pc.collection_status,
      pc.retry_count,
      pc.collected_at
    FROM price_collections pc
    LEFT JOIN room_mappings rm ON pc.room_mapping_id = rm.id
    LEFT JOIN hotel_mappings hm ON rm.hotel_mapping_id = hm.id
    LEFT JOIN channels c ON hm.channel_id = c.id
    WHERE pc.checkin_date >= ? AND pc.checkin_date <= ?
    ORDER BY pc.collected_at DESC
    LIMIT 5000
  `).all(startDate, endDate);
  
  if (format === 'json') {
    res.json({ data, filename: `collection_${startDate}_${endDate}.json` });
    return;
  }
  
  const filename = `collection_${startDate}_${endDate}.csv`;
  const filepath = path.join(reportsDir, filename);
  
  const csvWriter = createCsvWriter({
    path: filepath,
    header: [
      { id: 'channel_name', title: '渠道' },
      { id: 'channel_hotel_name', title: '渠道酒店' },
      { id: 'channel_room_name', title: '渠道房型' },
      { id: 'checkin_date', title: '入住日期' },
      { id: 'checkout_date', title: '离店日期' },
      { id: 'price', title: '房价' },
      { id: 'tax', title: '税费' },
      { id: 'total_price', title: '总价' },
      { id: 'inventory', title: '库存' },
      { id: 'promotion', title: '促销' },
      { id: 'promotion_discount', title: '折扣' },
      { id: 'collection_status', title: '采集状态' },
      { id: 'retry_count', title: '重试次数' },
      { id: 'collected_at', title: '采集时间' }
    ]
  });
  
  csvWriter.writeRecords(data).then(() => {
    res.download(filepath, filename);
  });
});

router.post('/testdata/generate', (req, res) => {
  const { checkin_date } = req.body;
  const date = checkin_date || new Date().toISOString().split('T')[0];
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  const checkoutDate = nextDate.toISOString().split('T')[0];
  
  const hotelResult = db.prepare('INSERT INTO hotels (name, address, city, star_rating) VALUES (?, ?, ?, ?)').run('测试酒店', '测试地址1号', '北京', 5);
  const hotelId = hotelResult.lastInsertRowid;
  
  const roomResult = db.prepare('INSERT INTO room_types (hotel_id, name, bed_type, max_guests, area) VALUES (?, ?, ?, ?, ?)').run(hotelId, '豪华大床房', '大床', 2, 45);
  const roomId = roomResult.lastInsertRowid;
  
  const channels = db.prepare('SELECT * FROM channels').all();
  const mappingResults = [];
  
  for (const channel of channels) {
    const hmResult = db.prepare('INSERT INTO hotel_mappings (hotel_id, channel_id, channel_hotel_id, channel_hotel_name, status, confidence) VALUES (?, ?, ?, ?, ?, ?)').run(hotelId, channel.id, `H${channel.id}_001`, `测试酒店${channel.name}店`, 'confirmed', 0.95);
    
    const rmResult = db.prepare('INSERT INTO room_mappings (room_type_id, hotel_mapping_id, channel_room_id, channel_room_name, breakfast, cancellation_policy, bed_type, status, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      roomId, hmResult.lastInsertRowid, `R${channel.id}_001`, `豪华大床房${channel.name}版`,
      channel.code === 'CTRIP' ? '含双早' : '含单早',
      channel.code === 'OWN' ? '免费取消' : '不可取消',
      '大床', 'confirmed', 0.9
    );
    
    mappingResults.push({ channel: channel.code, room_mapping_id: rmResult.lastInsertRowid });
  }
  
  const ownMapping = mappingResults.find(m => m.channel === 'OWN');
  const basePrice = 580;
  
  for (const mapping of mappingResults) {
    let price = basePrice;
    let tax = 30;
    let inventory = 10;
    let promotion = null;
    let promotionDiscount = null;
    
    if (mapping.channel === 'CTRIP') {
      price = 560;
      tax = 28;
      inventory = 5;
      promotion = '限时优惠';
      promotionDiscount = 20;
    } else if (mapping.channel === 'MEITUAN') {
      price = 520;
      tax = 26;
      inventory = 8;
    } else if (mapping.channel === 'FLIGGY') {
      price = 590;
      tax = 35;
      inventory = 12;
    } else if (mapping.channel === 'QUNAR') {
      price = 540;
      tax = 27;
      inventory = 0;
    }
    
    db.prepare('INSERT INTO price_collections (room_mapping_id, checkin_date, checkout_date, price, tax, total_price, inventory, promotion, promotion_discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      mapping.room_mapping_id, date, checkoutDate, price, tax, price + tax, inventory, promotion, promotionDiscount
    );
  }
  
  db.prepare('INSERT INTO price_collections (room_mapping_id, checkin_date, checkout_date, price, tax, total_price, collection_status, error_message, retry_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    ownMapping.room_mapping_id, date, checkoutDate, 0, 0, 0, 'failed', '网络超时', 2
  );
  
  res.json({ success: true, hotel_id: hotelId, room_id: roomId, date });
});

module.exports = router;
