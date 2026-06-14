import db from './db.js'
import type Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'

function idType(table: string): 'INTEGER' | 'TEXT' {
  const cols = db.prepare('PRAGMA table_info(' + table + ')').all() as { name: string; type: string; pk: number }[]
  const pk = cols.find(c => c.pk === 1)
  if (pk && /INT/i.test(pk.type)) return 'INTEGER'
  return 'TEXT'
}

interface InsertCfg {
  pk: string
  columnOrder: string[]
  values?: any[]
}

function prepInsert(table: string, cfg: InsertCfg): { stmt: Database.Statement; run: (args: any[]) => any } {
  const colTypes = db.prepare('PRAGMA table_info(' + table + ')').all() as { name: string; type: string; pk: number; notnull: number; dflt_value: any }[]
  const pk = colTypes.find(c => c.pk === 1)
  const isIntPk = pk && /INT/i.test(pk.type)

  let cols: string[]
  let placeholders: string[]
  if (isIntPk) {
    cols = cfg.columnOrder.filter(c => c !== cfg.pk)
    placeholders = cols.map(() => '?')
  } else {
    cols = cfg.columnOrder
    placeholders = cols.map(() => '?')
  }
  const sql = `INSERT${/driving_logs|driver_profiles|shipper_profiles|users/.test(table) ? '' : ' OR IGNORE'} INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`
  const stmt = db.prepare(sql)

  return {
    stmt,
    run: (args: any[]) => {
      let realArgs: any[]
      if (isIntPk) {
        const idx = cfg.columnOrder.indexOf(cfg.pk)
        realArgs = args.filter((_, i) => i !== idx)
      } else {
        realArgs = args
      }
      return stmt.run(...realArgs)
    }
  }
}

function seedIfEmpty() {
  const existingDriver1 = db.prepare("SELECT id FROM users WHERE phone = '13800138001' AND role = 'driver'").get()
  if (existingDriver1) return

  const insertUser = prepInsert('users', {
    pk: 'id',
    columnOrder: ['id', 'username', 'password', 'role', 'phone', 'name', 'avatar']
  })

  const insertDriverProfile = prepInsert('driver_profiles', {
    pk: 'id',
    columnOrder: ['id', 'user_id', 'id_card_no', 'transport_license_no', 'qualification_no', 'certification_status', 'bank_card_no', 'bank_name']
  })

  const insertShipperProfile = prepInsert('shipper_profiles', {
    pk: 'id',
    columnOrder: ['id', 'user_id', 'company_name', 'credit_code']
  })

  const insertInvoiceEntity = prepInsert('invoice_entities', {
    pk: 'id',
    columnOrder: ['id', 'shipper_id', 'company_name', 'tax_no', 'address', 'phone', 'bank_name', 'bank_account']
  })

  const insertFreight = prepInsert('freights', {
    pk: 'id',
    columnOrder: ['id', 'shipper_id', 'origin', 'destination', 'goods_type', 'weight', 'freight_fee', 'need_vat', 'invoice_entity_id', 'status', 'description', 'created_at']
  })

  const insertOrder = prepInsert('orders', {
    pk: 'id',
    columnOrder: ['id', 'freight_id', 'driver_id', 'shipper_id', 'status', 'waybill_no', 'pickup_time', 'delivery_time', 'total_fee', 'created_at']
  })

  const insertInvoice = prepInsert('invoices', {
    pk: 'id',
    columnOrder: ['id', 'order_id', 'invoice_entity_id', 'invoice_no', 'invoice_code', 'amount', 'tax_rate', 'tax_amount', 'status', 'issued_at']
  })

  const insertSettlement = prepInsert('settlements', {
    pk: 'id',
    columnOrder: ['id', 'order_id', 'payer_id', 'payee_id', 'total_amount', 'freight_amount', 'fuel_amount', 'insurance_amount', 'platform_fee', 'status', 'created_at']
  })

  const insertWithdrawal = prepInsert('withdrawals', {
    pk: 'id',
    columnOrder: ['id', 'driver_id', 'amount', 'bank_card_no', 'status', 'created_at']
  })

  const insertSafetyCheck = prepInsert('safety_checks', {
    pk: 'id',
    columnOrder: ['id', 'order_id', 'driver_id', 'check_items', 'photos', 'status', 'checked_at']
  })

  const insertDrivingLog = prepInsert('driving_logs', {
    pk: 'id',
    columnOrder: ['id', 'driver_id', 'order_id', 'start_time', 'end_time', 'mileage', 'weather', 'road_condition', 'remarks']
  })

  const insertWaybill = prepInsert('waybills', {
    pk: 'id',
    columnOrder: ['id', 'order_id', 'waybill_no', 'electronic_data', 'archived_at']
  })

  let info = insertUser.run([uuidv4(), '13800138001', 'xxxx', 'driver', '13800138001', '张立国', ''])
  const driver1Id = String(info.lastInsertRowid)
  info = insertUser.run([uuidv4(), '13800138002', 'xxxx', 'driver', '13800138002', '李建军', ''])
  const driver2Id = String(info.lastInsertRowid)
  info = insertUser.run([uuidv4(), '13900139001', 'xxxx', 'shipper', '13900139001', '王经理', ''])
  const shipper1Id = String(info.lastInsertRowid)
  info = insertUser.run([uuidv4(), '13900139002', 'xxxx', 'shipper', '13900139002', '赵总', ''])
  const shipper2Id = String(info.lastInsertRowid)
  insertUser.run([uuidv4(), '13700137001', 'xxxx', 'admin', '13700137001', '系统管理员', ''])

  insertDriverProfile.run([uuidv4(), driver1Id, '110101198501011234', '京交运管许字11010100001', '11010120050101001', 'passed', '6222021234567890', '中国工商银行'])
  insertDriverProfile.run([uuidv4(), driver2Id, '310101198805055678', '沪交运管许字31010100002', '31010120080505002', 'pending', '6228489876543210', '中国农业银行'])

  insertShipperProfile.run([uuidv4(), shipper1Id, '北京宏远物流有限公司', '91110101MA001ABC01'])
  insertShipperProfile.run([uuidv4(), shipper2Id, '上海盛达供应链管理有限公司', '91310101MA002DEF02'])

  const entity1Id = 'ie_001'
  const entity2Id = 'ie_002'

  insertInvoiceEntity.run([entity1Id, shipper1Id, '北京宏远物流有限公司', '91110101MA001ABC01', '北京市朝阳区建国路88号', '010-88886666', '中国工商银行北京分行', '0200001009200001234'])
  insertInvoiceEntity.run([entity2Id, shipper2Id, '上海盛达供应链管理有限公司', '91310101MA002DEF02', '上海市浦东新区世纪大道100号', '021-66668888', '中国建设银行上海分行', '31001585800052501234'])

  const freightsData = [
    { id: 'f_001', origin: '北京', destination: '天津', goods_type: '日用百货', weight: 12.5, freight_fee: 2800, needVat: 1, entityId: entity1Id, status: 'open', desc: '纸箱包装，轻拿轻放' },
    { id: 'f_002', origin: '上海', destination: '杭州', goods_type: '电子产品', weight: 3.2, freight_fee: 1500, needVat: 1, entityId: entity2Id, status: 'open', desc: '高值货，需买保险' },
    { id: 'f_003', origin: '广州', destination: '深圳', goods_type: '建材', weight: 25.0, freight_fee: 3200, needVat: 0, entityId: null, status: 'open', desc: '瓷砖，需防雨' },
    { id: 'f_004', origin: '成都', destination: '重庆', goods_type: '生鲜水果', weight: 8.0, freight_fee: 1600, needVat: 1, entityId: entity1Id, status: 'accepted', desc: '冷藏运输，时效4小时' },
    { id: 'f_005', origin: '武汉', destination: '长沙', goods_type: '服装布匹', weight: 6.5, freight_fee: 950, needVat: 0, entityId: null, status: 'open', desc: '普通货运' },
    { id: 'f_006', origin: '南京', destination: '合肥', goods_type: '机械设备', weight: 18.0, freight_fee: 2400, needVat: 1, entityId: entity2Id, status: 'open', desc: '大型机器，需吊车装卸' },
  ]

  const now = new Date()
  freightsData.forEach((f, i) => {
    const d = new Date(now.getTime() - i * 3600 * 1000 * 2)
    insertFreight.run([f.id, shipper1Id, f.origin, f.destination, f.goods_type, f.weight, f.freight_fee, f.needVat, f.entityId, f.status, f.desc, d.toISOString()])
  })

  const order1Id = 'o_001'
  insertOrder.run([order1Id, 'f_004', driver1Id, shipper1Id, 'transit', 'YD2026061300001', '2026-06-13 08:30:00', null, 1600, '2026-06-13 08:00:00'])

  const order2Id = 'o_002'
  insertOrder.run([order2Id, 'f_005', driver2Id, shipper1Id, 'completed', 'YD2026061200002', '2026-06-12 09:00:00', '2026-06-12 14:30:00', 950, '2026-06-12 08:00:00'])

  const inv1Id = 'inv_001'
  insertInvoice.run([inv1Id, order2Id, entity1Id, '00123456', '011002600311', 950, 0.09, 85.5, 'issued', '2026-06-12 15:00:00'])

  const s1Id = 's_001'
  insertSettlement.run([s1Id, order2Id, shipper1Id, driver2Id, 950, 750, 120, 30, 50, 'completed', '2026-06-12 14:30:00'])

  insertWithdrawal.run(['w_001', driver1Id, 5000, '6222021234567890', 'completed', '2026-06-10 10:00:00'])
  insertWithdrawal.run(['w_002', driver2Id, 3000, '6228489876543210', 'pending', '2026-06-12 16:00:00'])

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

  insertSafetyCheck.run(['sc_001', order1Id, driver1Id, checkItems, JSON.stringify([]), 'pass', '2026-06-13 08:15:00'])
  insertSafetyCheck.run(['sc_002', order2Id, driver2Id, checkItems, JSON.stringify([]), 'pass', '2026-06-12 08:45:00'])

  insertDrivingLog.run(['dl_001', driver1Id, order1Id, '2026-06-13 08:30:00', null, 45, '晴', '高速畅通', '正常运输中'])
  insertDrivingLog.run(['dl_002', driver2Id, order2Id, '2026-06-12 09:00:00', '2026-06-12 14:30:00', 320, '多云', '国道顺畅', '顺利送达'])

  insertWaybill.run(['wb_001', order2Id, 'WB2026061200002', JSON.stringify({
    orderNo: order2Id,
    shipper: '北京宏远物流有限公司',
    consignee: '长沙某某公司',
    goods: '服装布匹',
    weight: 6.5,
    fee: 950,
    driver: '李建军',
    plateNo: '鄂A12345',
  }), '2026-06-12 14:30:00'])
}

seedIfEmpty()

export { seedIfEmpty }
