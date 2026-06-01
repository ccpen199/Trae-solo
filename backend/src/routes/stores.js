const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const stores = db.prepare(`
    SELECT s.*, e.name as manager_name 
    FROM stores s
    LEFT JOIN employees e ON s.manager_id = e.id
  `).all();
  res.json(stores);
});

const storeTemplates = [
  { code: 'ST001', name: '朝阳门店', default_address: '北京市朝阳区建国路88号' },
  { code: 'ST002', name: '海淀门店', default_address: '北京市海淀区中关村大街1号' },
  { code: 'ST003', name: '西城门店', default_address: '北京市西城区金融街1号' },
  { code: 'ST004', name: '东城门店', default_address: '北京市东城区王府井大街1号' },
  { code: 'ST005', name: '丰台门店', default_address: '北京市丰台区丰台路1号' },
  { code: 'ST006', name: '石景山门店', default_address: '北京市石景山区石景山路1号' },
  { code: 'ST007', name: '通州门店', default_address: '北京市通州区新华大街1号' },
  { code: 'ST008', name: '昌平门店', default_address: '北京市昌平区政府街1号' },
  { code: 'ST009', name: '大兴门店', default_address: '北京市大兴区兴丰大街1号' },
  { code: 'ST010', name: '顺义门店', default_address: '北京市顺义区府前西街1号' }
];

router.get('/templates', (req, res) => {
  const existingCodes = db.prepare('SELECT code FROM stores').all().map(s => s.code);
  const availableTemplates = storeTemplates.filter(t => !existingCodes.includes(t.code));
  res.json(availableTemplates);
});

router.get('/template/:code', (req, res) => {
  const template = storeTemplates.find(t => t.code === req.params.code);
  if (template) {
    res.json(template);
  } else {
    res.status(404).json({ error: '门店模板不存在' });
  }
});

router.get('/:id', (req, res) => {
  const store = db.prepare(`
    SELECT s.*, e.name as manager_name 
    FROM stores s
    LEFT JOIN employees e ON s.manager_id = e.id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!store) {
    return res.status(404).json({ error: '门店不存在' });
  }
  res.json(store);
});

router.get('/:id/calendar', (req, res) => {
  const calendar = db.prepare(`
    SELECT day_of_week, is_delivery_day, cut_off_time
    FROM delivery_calendars
    WHERE store_id = ?
    ORDER BY day_of_week
  `).all(req.params.id);
  res.json(calendar);
});

router.put('/:id/calendar', (req, res) => {
  const { calendar } = req.body;
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO delivery_calendars (store_id, day_of_week, is_delivery_day, cut_off_time)
    VALUES (?, ?, ?, ?)
  `);
  
  calendar.forEach(c => {
    stmt.run(req.params.id, c.day_of_week, c.is_delivery_day, c.cut_off_time);
  });
  
  res.json({ success: true });
});

router.get('/:id/inventory', (req, res) => {
  const inventory = db.prepare(`
    SELECT i.*, p.name as product_name, p.code as product_code, p.spec, p.unit, p.category
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE i.store_id = ?
  `).all(req.params.id);
  res.json(inventory);
});

router.post('/', (req, res) => {
  const { code, name, address, manager_id, phone } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO stores (code, name, address, manager_id, phone)
      VALUES (?, ?, ?, ?, ?)
    `).run(code, name, address, manager_id, phone);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
