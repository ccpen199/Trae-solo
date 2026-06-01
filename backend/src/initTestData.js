const { db } = require('./database');

function initTestData() {
  console.log('开始初始化测试数据...');

  const materials = [
    { code: 'MAT001', name: '电阻100Ω', spec: '1/4W', unit: '个', category: '电子', safety_stock: 1000 },
    { code: 'MAT002', name: '电容10uF', spec: '50V', unit: '个', category: '电子', safety_stock: 500 },
    { code: 'MAT003', name: '芯片STM32', spec: 'F103C8T6', unit: '个', category: '电子', safety_stock: 100 },
    { code: 'MAT004', name: 'PCB板', spec: '2层板', unit: '块', category: '电子', safety_stock: 50 },
    { code: 'MAT005', name: '电阻200Ω', spec: '1/4W', unit: '个', category: '电子', safety_stock: 800 },
    { code: 'MAT006', name: '外壳ABS', spec: '100x50x20', unit: '个', category: '机械', safety_stock: 200 },
    { code: 'MAT007', name: '螺丝M3', spec: '8mm', unit: '个', category: '机械', safety_stock: 1000 }
  ];

  const insertMaterial = db.prepare(`
    INSERT OR IGNORE INTO materials (code, name, spec, unit, category, safety_stock)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  materials.forEach(m => {
    insertMaterial.run(m.code, m.name, m.spec, m.unit, m.category, m.safety_stock);
  });
  console.log(`物料数据初始化完成`);

  const products = [
    { code: 'PROD001', name: '智能控制器', spec: 'V1.0' },
    { code: 'PROD002', name: '传感器模块', spec: 'V2.0' }
  ];

  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products (code, name, spec)
    VALUES (?, ?, ?)
  `);

  products.forEach(p => {
    insertProduct.run(p.code, p.name, p.spec);
  });
  console.log(`产品数据初始化完成`);

  const bomResult = db.prepare(`
    INSERT OR IGNORE INTO boms (product_id, version, status, created_by)
    VALUES (1, 'V1.0', 'active', 'system')
  `).run();

  const bomId = bomResult.lastInsertRowid || 1;

  const bomItems = [
    { bom_id: bomId, material_id: 1, quantity: 10, process: 'SMT' },
    { bom_id: bomId, material_id: 2, quantity: 5, process: 'SMT' },
    { bom_id: bomId, material_id: 3, quantity: 1, process: 'SMT' },
    { bom_id: bomId, material_id: 4, quantity: 1, process: '组装' },
    { bom_id: bomId, material_id: 6, quantity: 1, process: '组装' },
    { bom_id: bomId, material_id: 7, quantity: 4, process: '组装' }
  ];

  const insertBomItem = db.prepare(`
    INSERT OR IGNORE INTO bom_items (bom_id, material_id, quantity, process, remark)
    VALUES (?, ?, ?, ?, ?)
  `);

  bomItems.forEach(item => {
    insertBomItem.run(item.bom_id, item.material_id, item.quantity, item.process, '');
  });
  console.log(`BOM数据初始化完成，BOM ID: ${bomId}`);

  const inventoryItems = [
    { material_id: 1, warehouse_id: 1, quantity: 500, location: 'A-01-01', batch_no: 'B2024001' },
    { material_id: 2, warehouse_id: 1, quantity: 200, location: 'A-01-02', batch_no: 'B2024002' },
    { material_id: 3, warehouse_id: 1, quantity: 50, location: 'A-02-01', batch_no: 'B2024003' },
    { material_id: 4, warehouse_id: 1, quantity: 30, location: 'B-01-01', batch_no: 'B2024004' },
    { material_id: 5, warehouse_id: 1, quantity: 1000, location: 'A-01-03', batch_no: 'B2024005' },
    { material_id: 6, warehouse_id: 2, quantity: 100, location: 'C-01-01', batch_no: 'B2024006' },
    { material_id: 7, warehouse_id: 2, quantity: 500, location: 'C-01-02', batch_no: 'B2024007' }
  ];

  const insertInventory = db.prepare(`
    INSERT OR IGNORE INTO inventory (material_id, warehouse_id, location, quantity, batch_no)
    VALUES (?, ?, ?, ?, ?)
  `);

  inventoryItems.forEach(item => {
    insertInventory.run(item.material_id, item.warehouse_id, item.location, item.quantity, item.batch_no);
  });
  console.log(`库存数据初始化完成`);

  const inTransitItems = [
    { material_id: 3, quantity: 100, po_no: 'PO2024001', expected_arrival: '2026-05-25', supplier: '芯片供应商A' },
    { material_id: 2, quantity: 500, po_no: 'PO2024002', expected_arrival: '2026-05-22', supplier: '电容供应商B' }
  ];

  const insertInTransit = db.prepare(`
    INSERT OR IGNORE INTO in_transit (material_id, quantity, po_no, expected_arrival, supplier, status)
    VALUES (?, ?, ?, ?, ?, 'shipping')
  `);

  inTransitItems.forEach(item => {
    insertInTransit.run(item.material_id, item.quantity, item.po_no, item.expected_arrival, item.supplier);
  });
  console.log(`在途物料数据初始化完成`);

  const substituteResult = db.prepare(`
    INSERT OR IGNORE INTO substitute_rules (original_material_id, substitute_material_id, priority, approval_required, approved, approved_by, remark)
    VALUES (1, 5, 1, 1, 1, 'admin', '电阻替代，阻值差异不影响电路')
  `).run();
  console.log(`替代料规则初始化完成，规则ID: ${substituteResult.lastInsertRowid}`);

  const workOrderResult = db.prepare(`
    INSERT OR IGNORE INTO work_orders (wo_no, product_id, bom_id, quantity, production_line, planned_start_date, planned_end_date, status, kitting_status, created_by)
    VALUES ('WO202605001', 1, ?, 100, 'Line-A', '2026-05-22', '2026-05-25', 'created', 'pending', 'system')
  `).run(bomId);
  console.log(`工单数据初始化完成，工单ID: ${workOrderResult.lastInsertRowid}`);

  console.log('测试数据初始化完成！');
}

module.exports = { initTestData };
