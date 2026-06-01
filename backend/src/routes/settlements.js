const express = require('express');
const db = require('../database');
const dayjs = require('dayjs');
const router = express.Router();

router.get('/', (req, res) => {
  const { status, storeId } = req.query;
  let sql = `
    SELECT st.*, s.name as store_name
    FROM settlements st
    JOIN stores s ON st.store_id = s.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND st.status = ?';
    params.push(status);
  }
  if (storeId) {
    sql += ' AND st.store_id = ?';
    params.push(storeId);
  }
  
  sql += ' ORDER BY st.created_at DESC';
  
  const settlements = db.prepare(sql).all(...params);
  res.json(settlements);
});

router.get('/:id', (req, res) => {
  const settlement = db.prepare(`
    SELECT st.*, s.name as store_name
    FROM settlements st
    JOIN stores s ON st.store_id = s.id
    WHERE st.id = ?
  `).get(req.params.id);
  
  if (!settlement) {
    return res.status(404).json({ error: '结算单不存在' });
  }
  
  const items = db.prepare(`
    SELECT si.*, o.order_no, o.order_date
    FROM settlement_items si
    JOIN orders o ON si.order_id = o.id
    WHERE si.settlement_id = ?
  `).all(req.params.id);
  
  res.json({ ...settlement, items });
});

router.post('/generate', (req, res) => {
  const { store_id, start_date, end_date } = req.body;
  
  const orders = db.prepare(`
    SELECT id, order_no, order_date, total_amount
    FROM orders
    WHERE store_id = ? AND order_date >= ? AND order_date <= ? AND status = 'received'
  `).all(store_id, start_date, end_date);
  
  if (orders.length === 0) {
    return res.status(400).json({ error: '该时间段没有已完成收货的订单' });
  }
  
  const settlementNo = 'SM' + dayjs().format('YYYYMMDDHHmmss');
  
  let orderAmount = 0;
  let finalAmount = 0;
  
  const settlementItems = orders.map(order => {
    const receiptItems = db.prepare(`
      SELECT SUM(ri.received_qty * oi.price) as receipt_amount
      FROM receipt_items ri
      JOIN receipts r ON ri.receipt_id = r.id
      JOIN picking_items pi ON ri.picking_item_id = pi.id
      JOIN order_items oi ON pi.order_item_id = oi.id
      WHERE r.order_id = ?
    `).get(order.id);
    
    const receiptAmount = receiptItems.receipt_amount || 0;
    const diffAmount = order.total_amount - receiptAmount;
    
    orderAmount += order.total_amount;
    finalAmount += receiptAmount;
    
    return {
      order_id: order.id,
      order_amount: order.total_amount,
      receipt_amount: receiptAmount,
      diff_amount: diffAmount
    };
  });
  
  const result = db.prepare(`
    INSERT INTO settlements (settlement_no, store_id, start_date, end_date, order_amount, adjust_amount, final_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(settlementNo, store_id, start_date, end_date, orderAmount, orderAmount - finalAmount, finalAmount);
  
  const settlementId = result.lastInsertRowid;
  
  const insertItem = db.prepare(`
    INSERT INTO settlement_items (settlement_id, order_id, order_amount, receipt_amount, diff_amount)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  settlementItems.forEach(item => {
    insertItem.run(settlementId, item.order_id, item.order_amount, item.receipt_amount, item.diff_amount);
  });
  
  res.json({ id: settlementId, settlement_no: settlementNo, order_amount: orderAmount, final_amount: finalAmount });
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const settledAt = status === 'settled' ? dayjs().format('YYYY-MM-DD HH:mm:ss') : null;
  
  db.prepare(`
    UPDATE settlements SET status = ?, settled_at = ? WHERE id = ?
  `).run(status, settledAt, req.params.id);
  
  res.json({ id: req.params.id, status });
});

module.exports = router;
