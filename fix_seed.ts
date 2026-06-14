import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
const db = new Database('server/src/data/app.sqlite')
db.pragma('foreign_keys = OFF')

const idType = (table: string) => {
  const cols = db.prepare('PRAGMA table_info(' + table + ')').all() as { name: string; type: string; pk: number }[]
  const pk = cols.find(c => c.pk === 1)
  return pk && /INT/i.test(pk.type) ? 'INTEGER' : 'TEXT'
}

const findUserByPhone = (phone: string) => db.prepare("SELECT * FROM users WHERE phone = ?").get(phone) as any
const findOrder = (id: string) => db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as any

const d1 = findUserByPhone('13800138001')
const d2 = findUserByPhone('13800138002')
const s1 = findUserByPhone('13900139001')
console.log('d1 id=', d1?.id, 'd2 id=', d2?.id, 's1 id=', s1?.id)
const driver1Id = String(d1.id)
const driver2Id = String(d2.id)
const shipper1Id = String(s1.id)
console.log('driver1Id type:', typeof driver1Id, 'value:', driver1Id)

// --------- settlements ---------
if (idType('invoices') === 'INTEGER') {
  console.log('invoices id=INTEGER')
}
const invExists = db.prepare("SELECT COUNT(*) as c FROM invoices WHERE invoice_no = '00123456'").get() as { c: number }
if (invExists.c === 0) {
  const o2 = findOrder('o_002')
  console.log('inserting invoices, settlements etc. o2 exists:', !!o2)

  // insert invoice - use OLD schema columns (seller_name/buyer_name/etc...)
  if (idType('invoices') === 'INTEGER') {
    const invCols = db.prepare('PRAGMA table_info(invoices)').all() as { name: string }[]
    const hasInvEntity = invCols.some(c => c.name === 'invoice_entity_id')
    const hasIssuedAt = invCols.some(c => c.name === 'issued_at')

    const cols = [
      'order_id', 'invoice_no', 'invoice_code', 'seller_name', 'seller_tax_no',
      'seller_address', 'seller_phone', 'seller_bank', 'seller_bank_account',
      'buyer_name', 'buyer_tax_no', 'buyer_address', 'buyer_phone', 'buyer_bank',
      'buyer_bank_account', 'amount', 'tax_amount', 'total_amount', 'tax_rate',
      'status', 'invoice_date'
    ]
    const qs = cols.map(() => '?').join(',')
    const ie = db.prepare("SELECT * FROM invoice_entities WHERE id = ?").get('ie_001') as any
    const buyer = db.prepare("SELECT * FROM shipper_profiles sp LEFT JOIN users u ON sp.user_id = u.id WHERE u.id = ?").get(shipper1Id) as any
    const params = [
      'o_002', '00123456', '011002600311',
      ie?.company_name || '北京宏远物流有限公司', ie?.tax_no || '91110101MA001ABC01',
      ie?.address || '北京市朝阳区建国路88号', ie?.phone || '010-88886666',
      ie?.bank_name || '中国工商银行北京分行', ie?.bank_account || '0200001009200001234',
      buyer?.company_name || buyer?.name || '王经理', buyer?.credit_code || buyer?.company_tax_no || '91110101MA001ABC01',
      buyer?.company_address || '', buyer?.company_phone || '',
      buyer?.bank_name || '', buyer?.bank_account || '',
      950, 85.5, 1035.5, 0.09,
      'issued', '2026-06-12 15:00:00'
    ]
    // 兼容新增列
    const extraCols: string[] = []
    const extraParams: any[] = []
    if (hasInvEntity) {
      extraCols.push('invoice_entity_id')
      extraParams.push('ie_001')
    }
    if (hasIssuedAt) {
      extraCols.push('issued_at')
      extraParams.push('2026-06-12 15:00:00')
    }
    db.prepare(`INSERT INTO invoices (${cols.join(',')}${extraCols.length ? ',' + extraCols.join(',') : ''}) VALUES (${qs}${extraCols.length ? ',' + extraCols.map(() => '?').join(',') : ''})`).run(...params, ...extraParams)
  } else {
    db.prepare(`INSERT OR IGNORE INTO invoices (id, order_id, invoice_entity_id, invoice_no, invoice_code, amount, tax_rate, tax_amount, status, issued_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'inv_001', 'o_002', 'ie_001', '00123456', '011002600311', 950, 0.09, 85.5, 'issued', '2026-06-12 15:00:00'
    )
  }

  // settlement
  db.prepare(`INSERT OR IGNORE INTO settlements (id, order_id, payer_id, payee_id, total_amount, freight_amount, fuel_amount, insurance_amount, platform_fee, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    's_001', 'o_002', shipper1Id, driver2Id, 950, 750, 120, 30, 50, 'completed', '2026-06-12 14:30:00'
  )

  // withdrawals
  db.prepare(`INSERT OR IGNORE INTO withdrawals (id, driver_id, amount, bank_card_no, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run('w_001', driver1Id, 5000, '6222021234567890', 'completed', '2026-06-10 10:00:00')
  db.prepare(`INSERT OR IGNORE INTO withdrawals (id, driver_id, amount, bank_card_no, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run('w_002', driver2Id, 3000, '6228489876543210', 'pending', '2026-06-12 16:00:00')

  // safety_checks
  const checkItems = JSON.stringify([
    { name: '轮胎气压', pass: true },
    { name: '刹车系统', pass: true },
    { name: '灯光信号', pass: true },
    { name: '灭火器', pass: true },
    { name: '三角警示牌', pass: true },
    { name: '行驶证', pass: true },
    { name: '驾驶证', pass: true },
    { name: '道路运输证', pass: true },
  ])
  db.prepare(`INSERT OR IGNORE INTO safety_checks (id, order_id, driver_id, check_items, photos, status, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('sc_001', 'o_001', driver1Id, checkItems, JSON.stringify([]), 'pass', '2026-06-13 08:15:00')
  db.prepare(`INSERT OR IGNORE INTO safety_checks (id, order_id, driver_id, check_items, photos, status, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('sc_002', 'o_002', driver2Id, checkItems, JSON.stringify([]), 'pass', '2026-06-12 08:45:00')

  // driving_logs (INTEGER pk)
  const dlType = idType('driving_logs')
  console.log('driving_logs pk:', dlType)
  if (dlType === 'INTEGER') {
    const dlStmt = db.prepare(`INSERT INTO driving_logs (driver_id, order_id, start_time, end_time, mileage, weather, road_condition, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    const existDl = db.prepare("SELECT COUNT(*) c FROM driving_logs WHERE driver_id = ? AND order_id = ?").get(driver1Id, 'o_001') as { c: number }
    if (existDl.c === 0) {
      dlStmt.run(driver1Id, 'o_001', '2026-06-13 08:30:00', null, 45, '晴', '高速畅通', '正常运输中')
      dlStmt.run(driver2Id, 'o_002', '2026-06-12 09:00:00', '2026-06-12 14:30:00', 320, '多云', '国道顺畅', '顺利送达')
    }
  } else {
    const dlStmt = db.prepare(`INSERT OR IGNORE INTO driving_logs (id, driver_id, order_id, start_time, end_time, mileage, weather, road_condition, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    dlStmt.run('dl_001', driver1Id, 'o_001', '2026-06-13 08:30:00', null, 45, '晴', '高速畅通', '正常运输中')
    dlStmt.run('dl_002', driver2Id, 'o_002', '2026-06-12 09:00:00', '2026-06-12 14:30:00', 320, '多云', '国道顺畅', '顺利送达')
  }

  // waybills
  db.prepare(`INSERT OR IGNORE INTO waybills (id, order_id, waybill_no, electronic_data, archived_at) VALUES (?, ?, ?, ?, ?)`).run('wb_001', 'o_002', 'WB2026061200002', JSON.stringify({
    orderNo: 'o_002',
    shipper: '北京宏远物流有限公司',
    consignee: '长沙某某公司',
    goods: '服装布匹',
    weight: 6.5,
    fee: 950,
    driver: '李建军',
    plateNo: '鄂A12345',
  }), '2026-06-12 14:30:00')

  console.log('补插完成')
} else {
  console.log('数据已存在，跳过')
}

console.log('=== VERIFY ===')
console.log('orders:', db.prepare('SELECT COUNT(*) FROM orders').get())
console.log('invoices:', db.prepare('SELECT COUNT(*) FROM invoices').get())
console.log('settlements:', db.prepare('SELECT COUNT(*) FROM settlements').get())
console.log('withdrawals:', db.prepare('SELECT COUNT(*) FROM withdrawals').get())
console.log('safety_checks:', db.prepare('SELECT COUNT(*) FROM safety_checks').get())
console.log('driving_logs:', db.prepare('SELECT COUNT(*) FROM driving_logs').get())
console.log('waybills:', db.prepare('SELECT COUNT(*) FROM waybills').get())
