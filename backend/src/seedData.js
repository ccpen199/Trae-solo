const { db } = require('./database')

function seedDemoData() {
  const custCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count
  if (custCount > 0) {
    console.log('Demo data already exists, skipping...')
    return
  }

  console.log('Seeding demo data...')

  const insertCustomer = db.prepare(`
    INSERT INTO customers (code, name, contact, phone, address, billing_method)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  
  const c1 = insertCustomer.run('C001', '鲜冻食品有限公司', '张经理', '13800138001', '上海市浦东新区', 'daily')
  const c2 = insertCustomer.run('C002', '冷链物流集团', '李总', '13800138002', '北京市朝阳区', 'monthly')
  const c3 = insertCustomer.run('C003', '海洋水产公司', '王主管', '13800138003', '广州市天河区', 'weekly')

  const insertProduct = db.prepare(`
    INSERT INTO products (code, name, customer_id, temperature_zone_id, shelf_life_days, 
                          batch_required, package_type, inspection_required, storage_fee, handling_fee, unit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const p1 = insertProduct.run('P001', '进口冷冻牛肉', c1.lastInsertRowid, 1, 180, 1, '纸箱', 1, 5.0, 2.0, '箱')
  const p2 = insertProduct.run('P002', '速冻虾仁', c1.lastInsertRowid, 1, 90, 1, '塑料袋', 1, 4.5, 1.5, '袋')
  const p3 = insertProduct.run('P003', '冷藏鲜奶', c2.lastInsertRowid, 2, 7, 1, '瓶装', 1, 3.0, 1.0, '瓶')
  const p4 = insertProduct.run('P004', '新鲜果蔬', c3.lastInsertRowid, 2, 14, 1, '周转箱', 0, 2.5, 1.0, '箱')
  const p5 = insertProduct.run('P005', '恒温红酒', c2.lastInsertRowid, 3, 365, 0, '木箱', 0, 8.0, 3.0, '瓶')

  const insertInbound = db.prepare(`
    INSERT INTO inbound_records (record_no, customer_id, product_id, location_id, batch_no,
                                 production_date, expiry_date, quantity, weight, vehicle_no, arrival_time, inspection_status, status, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
  `)

  const loc1 = db.prepare('SELECT id FROM locations WHERE code = ?').get('F-001').id
  const loc2 = db.prepare('SELECT id FROM locations WHERE code = ?').get('F-002').id
  const loc3 = db.prepare('SELECT id FROM locations WHERE code = ?').get('C-001').id
  const loc4 = db.prepare('SELECT id FROM locations WHERE code = ?').get('T-001').id

  insertInbound.run('IR202605230001', c1.lastInsertRowid, p1.lastInsertRowid, loc1, 'B20260523001', '2026-05-01', '2026-10-28', 100, 2500, '沪A12345', 'passed', 'completed', '正常入库')
  insertInbound.run('IR202605230002', c1.lastInsertRowid, p2.lastInsertRowid, loc2, 'B20260523002', '2026-05-10', '2026-08-08', 500, 1000, '沪A67890', 'passed', 'completed', '正常入库')
  insertInbound.run('IR202605230003', c2.lastInsertRowid, p3.lastInsertRowid, loc3, 'B20260523003', '2026-05-20', '2026-05-27', 200, 400, '京B12345', 'passed', 'completed', '鲜奶入库')

  const insertInventory = db.prepare(`
    INSERT INTO inventory (customer_id, product_id, location_id, batch_no, production_date, expiry_date,
                           quantity, available_quantity, inbound_time, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'normal')
  `)

  insertInventory.run(c1.lastInsertRowid, p1.lastInsertRowid, loc1, 'B20260523001', '2026-05-01', '2026-10-28', 100, 100)
  insertInventory.run(c1.lastInsertRowid, p2.lastInsertRowid, loc2, 'B20260523002', '2026-05-10', '2026-08-08', 500, 500)
  insertInventory.run(c2.lastInsertRowid, p3.lastInsertRowid, loc3, 'B20260523003', '2026-05-20', '2026-05-27', 200, 200)
  insertInventory.run(c2.lastInsertRowid, p5.lastInsertRowid, loc4, 'B20260523005', '2025-06-01', '2027-06-01', 50, 50)

  db.prepare("UPDATE locations SET status = 'occupied' WHERE id IN (?, ?, ?, ?)").run(loc1, loc2, loc3, loc4)

  console.log('Demo data seeded successfully!')
}

seedDemoData()
