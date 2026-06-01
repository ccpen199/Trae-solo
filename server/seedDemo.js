import db from './database.js';

const seedData = () => {
  const parts = [
    { sku: 'SP-001', name: '空调压缩机', model: 'GMCC YZG-15', category: '压缩机', compatible_devices: '美的1.5P空调,格力1.5P空调', supplier_id: 1, purchase_price: 580, shelf_life_months: 24, safety_stock: 5, specifications: '1.5匹 变频', unit: '台' },
    { sku: 'SP-002', name: '冰箱压缩机', model: 'Embraco EGY70HL', category: '压缩机', compatible_devices: '海尔200L冰箱,容声200L冰箱', supplier_id: 2, purchase_price: 420, shelf_life_months: 24, safety_stock: 3, specifications: '1/6HP R600a', unit: '台' },
    { sku: 'SP-003', name: '洗衣机电机', model: 'Welling YXQ-180', category: '电机', compatible_devices: '美的8KG滚筒,小天鹅8KG滚筒', supplier_id: 1, purchase_price: 280, shelf_life_months: 18, safety_stock: 8, specifications: '180W 变频', unit: '个' },
    { sku: 'SP-004', name: '空调遥控器', model: 'RN02A', category: '遥控器', compatible_devices: '美的全系列空调', supplier_id: 3, purchase_price: 45, shelf_life_months: 36, safety_stock: 20, specifications: '通用型', unit: '个' },
    { sku: 'SP-005', name: '冰箱温控器', model: 'WDF28', category: '温控器', compatible_devices: '海尔冰箱,容声冰箱,美菱冰箱', supplier_id: 3, purchase_price: 35, shelf_life_months: 24, safety_stock: 15, specifications: '机械温控', unit: '个' },
    { sku: 'SP-006', name: '空调电容', model: 'CBB65 450VAC', category: '电子元件', compatible_devices: '2P以下空调通用', supplier_id: 3, purchase_price: 25, shelf_life_months: 24, safety_stock: 30, specifications: '450VAC 50uf', unit: '个' },
    { sku: 'SP-007', name: '洗衣机电脑板', model: 'MB65-3000G', category: '控制板', compatible_devices: '美的6.5KG波轮', supplier_id: 1, purchase_price: 180, shelf_life_months: 12, safety_stock: 5, specifications: '原装主板', unit: '块' },
    { sku: 'SP-008', name: '空调铜管', model: '12.7*0.8mm', category: '配件耗材', compatible_devices: '1.5P-2P空调', supplier_id: 2, purchase_price: 15, shelf_life_months: 60, safety_stock: 50, specifications: '每米价格', unit: '米' },
  ];

  console.log('插入备件数据...');
  const partStmt = db.prepare(`
    INSERT INTO spare_parts (sku, name, model, category, compatible_devices, supplier_id, purchase_price, shelf_life_months, safety_stock, specifications, unit, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  parts.forEach(p => {
    partStmt.run(p.sku, p.name, p.model, p.category, p.compatible_devices, p.supplier_id, p.purchase_price, p.shelf_life_months, p.safety_stock, p.specifications, p.unit);
  });

  console.log('创建入库单...');
  const stockInData = [
    { supplier_id: 1, part_id: 1, location_id: 1, batch_no: 'B20260501', quantity: 10, unit_price: 580, expire_date: '2028-05-01' },
    { supplier_id: 2, part_id: 2, location_id: 1, batch_no: 'B20260502', quantity: 8, unit_price: 420, expire_date: '2028-05-01' },
    { supplier_id: 1, part_id: 3, location_id: 2, batch_no: 'B20260503', quantity: 15, unit_price: 280, expire_date: '2027-11-01' },
    { supplier_id: 3, part_id: 4, location_id: 3, batch_no: 'B20260504', quantity: 30, unit_price: 45, expire_date: '2029-05-01' },
    { supplier_id: 3, part_id: 5, location_id: 3, batch_no: 'B20260505', quantity: 25, unit_price: 35, expire_date: '2028-05-01' },
    { supplier_id: 3, part_id: 6, location_id: 4, batch_no: 'B20260506', quantity: 40, unit_price: 25, expire_date: '2028-05-01' },
    { supplier_id: 1, part_id: 7, location_id: 2, batch_no: 'B20260507', quantity: 8, unit_price: 180, expire_date: '2027-05-01' },
    { supplier_id: 2, part_id: 8, location_id: 4, batch_no: 'B20260508', quantity: 100, unit_price: 15, expire_date: '2031-05-01' },
  ];

  const now = new Date().toISOString();
  stockInData.forEach(item => {
    const inNo = `IN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const result = db.prepare(`
      INSERT INTO stock_in (in_no, supplier_id, part_id, location_id, batch_no, quantity, unit_price, expire_date, inspection_result, invoice_status, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'passed', 'uninvoiced', 'completed', 1, ?)
    `).run(inNo, item.supplier_id, item.part_id, item.location_id, item.batch_no, item.quantity, item.unit_price, item.expire_date, now);

    db.prepare(`
      INSERT INTO stock (part_id, location_id, batch_no, quantity, available_qty, unit_price, expire_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(item.part_id, item.location_id, item.batch_no, item.quantity, item.quantity, item.unit_price, item.expire_date);

    const txnNo = `TR${Date.now()}${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO stock_transactions (trans_no, trans_type, ref_id, ref_no, part_id, location_id, batch_no, qty_change, created_by, created_at)
      VALUES (?, 'stock_in', ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(txnNo, result.lastInsertRowid, inNo, item.part_id, item.location_id, item.batch_no, item.quantity, now);
  });

  console.log('创建工单...');
  const workOrders = [
    { device_model: '美的KFR-35GW', device_sn: 'MD2026001', customer_name: '张三', fault_description: '不制冷，压缩机异响', engineer_id: 3, priority: 'high' },
    { device_model: '海尔BCD-200STPA', device_sn: 'HR2025012', customer_name: '李四', fault_description: '不启动，控制板无显示', engineer_id: 3, priority: 'normal' },
    { device_model: '小天鹅TG80-1229EDS', device_sn: 'XTE2024123', customer_name: '王五', fault_description: '脱水时异响', engineer_id: 4, priority: 'normal' },
    { device_model: '格力KFR-35GW', device_sn: 'GL2026045', customer_name: '赵六', fault_description: '遥控器失灵', engineer_id: 4, priority: 'low' },
    { device_model: '容声BCD-200', device_sn: 'RS2025078', customer_name: '孙七', fault_description: '温度控制不准', engineer_id: 3, priority: 'normal' },
  ];

  workOrders.forEach(wo => {
    const woNo = `WO${Date.now()}${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO work_orders (wo_no, device_model, device_sn, customer_name, fault_description, engineer_id, priority, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 1, ?)
    `).run(woNo, wo.device_model, wo.device_sn, wo.customer_name, wo.fault_description, wo.engineer_id, wo.priority, now);
  });

  console.log('创建出库单...');
  const stockOutData = [
    { wo_id: 1, part_id: 1, location_id: 1, batch_no: 'B20260501', quantity: 1, engineer_id: 3, purpose: '维修更换' },
    { wo_id: 2, part_id: 7, location_id: 2, batch_no: 'B20260507', quantity: 1, engineer_id: 3, purpose: '更换控制板' },
    { wo_id: 3, part_id: 3, location_id: 2, batch_no: 'B20260503', quantity: 1, engineer_id: 4, purpose: '更换电机' },
    { wo_id: 4, part_id: 4, location_id: 3, batch_no: 'B20260504', quantity: 1, engineer_id: 4, purpose: '更换遥控器' },
  ];

  stockOutData.forEach(item => {
    const outNo = `OUT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO stock_out (out_no, wo_id, part_id, location_id, batch_no, quantity, unit_price, engineer_id, purpose, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 'pending', 1, ?)
    `).run(outNo, item.wo_id, item.part_id, item.location_id, item.batch_no, item.quantity, item.engineer_id, item.purpose, now);
  });

  console.log('数据插入完成!');
};

seedData();
