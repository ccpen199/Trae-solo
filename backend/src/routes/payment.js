import express from 'express';
import db from '../database.js';

const router = express.Router();

function generateOrderNo() {
  return 'SS' + Date.now() + Math.floor(Math.random() * 1000);
}

router.post('/create', (req, res) => {
  const { person_id, insurance_type, year_grade, amount } = req.body;

  const person = db.prepare('SELECT * FROM insured_persons WHERE id = ?').get(person_id);
  if (!person) {
    return res.json({ success: false, message: '参保人不存在' });
  }

  const governmentSubsidy = amount * 0.3;
  const orderNo = generateOrderNo();

  db.prepare(`
    INSERT INTO payment_orders 
    (insured_person_id, order_no, insurance_type, year_grade, amount, government_subsidy, subsidy_flag, tax_bureau_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    person_id,
    orderNo,
    insurance_type,
    year_grade || 'standard',
    amount,
    governmentSubsidy,
    1,
    person.social_security_agency_code
  );

  db.prepare('INSERT INTO audit_logs (action, module, details) VALUES (?, ?, ?)')
    .run('order_create', 'payment', `Order: ${orderNo}, Amount: ${amount}`);

  res.json({
    success: true,
    order_no: orderNo,
    amount,
    government_subsidy: governmentSubsidy,
    total_amount: amount - governmentSubsidy
  });
});

router.post('/pay', (req, res) => {
  const { order_no, payment_method } = req.body;

  const order = db.prepare('SELECT * FROM payment_orders WHERE order_no = ?').get(order_no);
  if (!order) {
    return res.json({ success: false, message: '订单不存在' });
  }

  if (order.status === 'paid') {
    return res.json({ success: false, message: '订单已支付' });
  }

  db.prepare(`
    UPDATE payment_orders 
    SET status = 'paid', payment_method = ?, paid_at = CURRENT_TIMESTAMP
    WHERE order_no = ?
  `).run(payment_method || 'online', order_no);

  db.prepare('INSERT INTO audit_logs (action, module, details) VALUES (?, ?, ?)')
    .run('order_pay', 'payment', `Order: ${order_no}, Method: ${payment_method}`);

  res.json({
    success: true,
    message: '支付成功',
    transaction_id: 'TXN' + Date.now()
  });
});

router.get('/orders/:person_id', (req, res) => {
  const { person_id } = req.params;
  
  const orders = db.prepare(`
    SELECT * FROM payment_orders 
    WHERE insured_person_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(person_id);

  res.json({ success: true, data: orders });
});

router.get('/order/:order_no', (req, res) => {
  const { order_no } = req.params;
  
  const order = db.prepare('SELECT * FROM payment_orders WHERE order_no = ?').get(order_no);

  if (order) {
    res.json({ success: true, data: order });
  } else {
    res.json({ success: false, message: '订单不存在' });
  }
});

router.get('/insurance-types', (req, res) => {
  res.json({
    success: true,
    data: [
      { code: 'pension', name: '养老保险', grades: [
        { code: 'low', name: '低档', amount: 200 },
        { code: 'standard', name: '标准档', amount: 500 },
        { code: 'high', name: '高档', amount: 1000 }
      ]},
      { code: 'medical', name: '医疗保险(新农合)', grades: [
        { code: 'standard', name: '标准档', amount: 380 },
        { code: 'high', name: '高档', amount: 680 }
      ]}
    ]
  });
});

export default router;
