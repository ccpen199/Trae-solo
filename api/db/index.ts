import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite'
const fullDbPath = path.resolve(__dirname, '../../', dbPath)

const dbDir = path.dirname(fullDbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

export const db = new Database(fullDbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDb() {
  const createTablesSQL = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'personal',
    company TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    sender_name TEXT NOT NULL,
    sender_phone TEXT NOT NULL,
    sender_address TEXT NOT NULL,
    receiver_name TEXT NOT NULL,
    receiver_phone TEXT NOT NULL,
    receiver_address TEXT NOT NULL,
    goods_type TEXT NOT NULL,
    weight REAL NOT NULL,
    urgency TEXT NOT NULL DEFAULT 'standard',
    routing_plan TEXT,
    carrier TEXT,
    estimated_delivery TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tracking_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    event_time TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exceptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    type TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    description TEXT NOT NULL,
    response_status TEXT NOT NULL DEFAULT 'alert',
    responder_id INTEGER,
    resolved_at TEXT,
    detected_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS express_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    rider_id INTEGER REFERENCES riders(id),
    protocol_id INTEGER REFERENCES protocols(id),
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    special_items TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    estimated_minutes INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS riders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    latitude REAL NOT NULL DEFAULT 0,
    longitude REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'available',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    service_area TEXT NOT NULL,
    rating REAL NOT NULL DEFAULT 0,
    services TEXT NOT NULL,
    contact TEXT NOT NULL,
    booked_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bulk_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    provider_id INTEGER REFERENCES providers(id),
    item_desc TEXT NOT NULL,
    floors INTEGER NOT NULL DEFAULT 1,
    has_elevator INTEGER NOT NULL DEFAULT 0,
    floor_height REAL,
    disassembly_required INTEGER NOT NULL DEFAULT 0,
    fee REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS networks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    throughput INTEGER NOT NULL DEFAULT 0,
    capacity INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'normal'
);

CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    network_id INTEGER NOT NULL REFERENCES networks(id),
    plate TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_transit',
    route TEXT
);

CREATE TABLE IF NOT EXISTS protocols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    requirements TEXT NOT NULL,
    temperature_range TEXT,
    container_spec TEXT,
    active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS decrypt_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    admin_id INTEGER,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_tracking_order ON tracking_events(order_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_order ON exceptions(order_id);
CREATE INDEX IF NOT EXISTS idx_express_rider ON express_orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_network ON vehicles(network_id);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_decrypt_status ON decrypt_requests(status);
`

  db.exec(createTablesSQL)
  seedData()
  console.log('Database initialized at', fullDbPath)
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  const decryptCount = db.prepare('SELECT COUNT(*) as count FROM decrypt_requests').get() as { count: number }
  const auditCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as { count: number }
  if (userCount.count > 0 && decryptCount.count > 0 && auditCount.count > 0) return

  const hash = bcrypt.hashSync('password123', 10)
  const now = new Date()

  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (phone, name, role, company, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `)

    insertUser.run('13800138001', '张三', 'personal', null, hash)
    insertUser.run('13800138002', '李四', 'merchant', '淘宝旗舰店', hash)
    insertUser.run('13800138003', '王五', 'enterprise', '华为技术有限公司', hash)
    insertUser.run('13800138004', '客服小王', 'customer_service', null, hash)
    insertUser.run('13800138005', '张经理', 'manager', null, hash)

    const insertAdmin = db.prepare(`
      INSERT INTO admin_users (username, name, role, password_hash)
      VALUES (?, ?, ?, ?)
    `)
    insertAdmin.run('admin', '系统管理员', 'admin', hash)

    const insertRider = db.prepare(`
      INSERT INTO riders (name, phone, latitude, longitude, status)
      VALUES (?, ?, ?, ?, ?)
    `)
    insertRider.run('骑手小李', '13900139001', 31.2304, 121.4737, 'available')
    insertRider.run('骑手小张', '13900139002', 31.2354, 121.4787, 'available')
    insertRider.run('骑手小王', '13900139003', 31.2254, 121.4687, 'busy')

    const insertProvider = db.prepare(`
      INSERT INTO providers (name, service_area, rating, services, contact, booked_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    insertProvider.run('顺丰家具安装服务', '上海市全市', 4.8, '家具拆装、空调移机、大件搬运', '400-123-4567', 156)
    insertProvider.run('安心搬家公司', '浦东新区', 4.6, '居民搬家、公司搬迁、钢琴搬运', '400-123-4568', 89)
    insertProvider.run('专业拆装团队', '徐汇区、黄浦区', 4.9, '办公家具拆装、民用家具维修', '400-123-4569', 234)

    const insertProtocol = db.prepare(`
      INSERT INTO protocols (name, category, requirements, temperature_range, container_spec, active)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    insertProtocol.run('药品冷链运输', 'medical', '全程温控、GSP认证、温度记录', '2-8℃', '医用冷藏箱', 1)
    insertProtocol.run('活体宠物运输', 'pet', '航空箱规格、有氧舱、检疫证明', '18-25℃', 'IATA标准航空箱', 1)
    insertProtocol.run('易碎品运输', 'fragile', '缓冲包装、轻拿轻放、保价服务', null, '定制缓冲包装', 1)
    insertProtocol.run('贵重物品运输', 'valuable', '全程保价、双人押运、实时监控', null, '密封防盗箱', 1)

    const cities = [
      { name: '北京转运中心', city: '北京', lat: 39.9042, lng: 116.4074, throughput: 8500, capacity: 10000 },
      { name: '上海转运中心', city: '上海', lat: 31.2304, lng: 121.4737, throughput: 9200, capacity: 10000 },
      { name: '广州转运中心', city: '广州', lat: 23.1291, lng: 113.2644, throughput: 7800, capacity: 10000 },
      { name: '深圳转运中心', city: '深圳', lat: 22.5431, lng: 114.0579, throughput: 6500, capacity: 8000 },
      { name: '杭州转运中心', city: '杭州', lat: 30.2741, lng: 120.1551, throughput: 5800, capacity: 7000 },
      { name: '成都转运中心', city: '成都', lat: 30.5728, lng: 104.0668, throughput: 4500, capacity: 6000 },
      { name: '武汉转运中心', city: '武汉', lat: 30.5928, lng: 114.3055, throughput: 5200, capacity: 6500 },
      { name: '西安转运中心', city: '西安', lat: 34.3416, lng: 108.9398, throughput: 3800, capacity: 5000 },
    ]

    const insertNetwork = db.prepare(`
      INSERT INTO networks (name, city, latitude, longitude, throughput, capacity, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    cities.forEach(city => {
      const ratio = city.throughput / city.capacity
      const status = ratio > 0.9 ? 'overloaded' : ratio > 0.7 ? 'busy' : 'normal'
      insertNetwork.run(city.name, city.city, city.lat, city.lng, city.throughput, city.capacity, status)
    })

    const plates = ['京A12345', '沪B67890', '粤C11111', '粤D22222', '浙E33333', '川F44444', '鄂G55555', '陕H66666']
    const insertVehicle = db.prepare(`
      INSERT INTO vehicles (network_id, plate, latitude, longitude, status, route)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    for (let i = 0; i < 20; i++) {
      const networkId = (i % 8) + 1
      const baseLat = cities[networkId - 1].lat + (Math.random() - 0.5) * 2
      const baseLng = cities[networkId - 1].lng + (Math.random() - 0.5) * 2
      const statuses = ['in_transit', 'loading', 'unloading', 'idle']
      insertVehicle.run(
        networkId,
        plates[i % plates.length] + String(Math.floor(i / plates.length) + 1),
        baseLat,
        baseLng,
        statuses[i % 4],
        `${cities[networkId - 1].city}专线`
      )
    }

    const insertOrder = db.prepare(`
      INSERT INTO orders (order_no, user_id, sender_name, sender_phone, sender_address,
        receiver_name, receiver_phone, receiver_address, goods_type, weight, urgency,
        routing_plan, carrier, estimated_delivery, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const orderData = [
    {
      order_no: 'SF2024010100001',
      user_id: 1,
      sender_name: '张三',
      sender_phone: '13800138001',
      sender_address: '上海市浦东新区张江高科技园区',
      receiver_name: '李四',
      receiver_phone: '13900139001',
      receiver_address: '北京市朝阳区望京SOHO',
      goods_type: '电子产品',
      weight: 2.5,
      urgency: 'express',
      status: 'in_transit',
    },
    {
      order_no: 'SF2024010100002',
      user_id: 2,
      sender_name: '淘宝旗舰店',
      sender_phone: '13800138002',
      sender_address: '杭州市余杭区阿里巴巴西溪园区',
      receiver_name: '王五',
      receiver_phone: '13900139002',
      receiver_address: '深圳市南山区科技园',
      goods_type: '服装',
      weight: 1.2,
      urgency: 'standard',
      status: 'delivered',
    },
    {
      order_no: 'SF2024010100003',
      user_id: 1,
      sender_name: '张三',
      sender_phone: '13800138001',
      sender_address: '上海市浦东新区张江高科技园区',
      receiver_name: '赵六',
      receiver_phone: '13900139003',
      receiver_address: '广州市天河区珠江新城',
      goods_type: '文件',
      weight: 0.5,
      urgency: 'urgent',
      status: 'pending',
    },
    {
      order_no: 'SF2024010100004',
      user_id: 3,
      sender_name: '华为技术有限公司',
      sender_phone: '13800138003',
      sender_address: '深圳市龙岗区坂田华为基地',
      receiver_name: '孙七',
      receiver_phone: '13900139004',
      receiver_address: '成都市高新区天府软件园',
      goods_type: '精密仪器',
      weight: 15.0,
      urgency: 'standard',
      status: 'exception',
    },
  ]

    orderData.forEach(od => {
      const routing = generateRoutingPlan(od.goods_type, od.urgency, od.weight)
      insertOrder.run(
        od.order_no, od.user_id, od.sender_name, od.sender_phone, od.sender_address,
        od.receiver_name, od.receiver_phone, od.receiver_address, od.goods_type, od.weight,
        od.urgency, routing.plan, routing.carrier, routing.eta, od.status
      )
    })

    const insertTracking = db.prepare(`
      INSERT INTO tracking_events (order_id, location, description, status, event_time)
      VALUES (?, ?, ?, ?, ?)
    `)

    insertTracking.run(1, '上海市浦东新区', '快件已揽收，揽收员: 王师傅', 'picked_up', new Date(now.getTime() - 86400000 * 2).toISOString())
    insertTracking.run(1, '上海转运中心', '快件已到达上海转运中心，分拣中', 'in_transit', new Date(now.getTime() - 86400000 * 1.5).toISOString())
    insertTracking.run(1, '上海转运中心', '快件已发出，下一站: 北京转运中心', 'in_transit', new Date(now.getTime() - 86400000 * 1.2).toISOString())
    insertTracking.run(1, '北京转运中心', '快件已到达北京转运中心，等待分拣', 'in_transit', new Date(now.getTime() - 86400000 * 0.5).toISOString())
    insertTracking.run(1, '北京转运中心', '快件分拣完成，预计2小时内派送', 'out_for_delivery', new Date(now.getTime() - 3600000 * 3).toISOString())
    insertTracking.run(1, '北京市朝阳区', '快递员张伟正在派送中', 'out_for_delivery', new Date(now.getTime() - 3600000 * 1).toISOString())

    insertTracking.run(2, '杭州市余杭区', '快件已揽收，揽收员: 李师傅', 'picked_up', new Date(now.getTime() - 86400000 * 3).toISOString())
    insertTracking.run(2, '杭州转运中心', '快件已到达杭州转运中心', 'in_transit', new Date(now.getTime() - 86400000 * 2.5).toISOString())
    insertTracking.run(2, '杭州转运中心', '快件已发出，下一站: 深圳转运中心', 'in_transit', new Date(now.getTime() - 86400000 * 2).toISOString())
    insertTracking.run(2, '深圳转运中心', '快件已到达深圳转运中心', 'in_transit', new Date(now.getTime() - 86400000 * 1).toISOString())
    insertTracking.run(2, '深圳市南山区', '快递员刘芳正在派送中', 'out_for_delivery', new Date(now.getTime() - 7200000).toISOString())
    insertTracking.run(2, '深圳市南山区', '快件已签收，签收人: 本人', 'delivered', new Date(now.getTime() - 3600000).toISOString())

    insertTracking.run(3, '上海市浦东新区', '快件待揽收，已分配揽收员', 'created', new Date(now.getTime() - 3600000 * 5).toISOString())

    insertTracking.run(4, '深圳市龙岗区', '快件已揽收，揽收员: 赵师傅', 'picked_up', new Date(now.getTime() - 86400000 * 2).toISOString())
    insertTracking.run(4, '深圳转运中心', '快件已到达深圳转运中心', 'in_transit', new Date(now.getTime() - 86400000 * 1.5).toISOString())
    insertTracking.run(4, '深圳转运中心', '检测到快件外包装破损，已启动异常处理流程', 'exception', new Date(now.getTime() - 86400000).toISOString())
    insertTracking.run(4, '深圳转运中心', '异常件已通知片区经理，等待现场确认', 'exception', new Date(now.getTime() - 3600000 * 8).toISOString())
    insertTracking.run(4, '深圳转运中心', '片区经理已到场确认，内件疑似受损', 'exception', new Date(now.getTime() - 3600000 * 4).toISOString())

    const insertException = db.prepare(`
      INSERT INTO exceptions (order_id, type, level, description, response_status, detected_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    insertException.run(4, '破损', 2, '精密仪器外包装破损，疑似内部损坏', 'alert', new Date(now.getTime() - 86400000).toISOString())
  }

  if (decryptCount.count === 0) {
    const insertDecryptRequest = db.prepare(`
      INSERT INTO decrypt_requests (user_id, admin_id, target_type, target_id, reason, status, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const decryptRequests = [
      {
        user_id: 1,
        admin_id: 1,
        target_type: 'order:sender_phone',
        target_id: 1,
        reason: '客户投诉处理，需要联系寄件人核实收件信息',
        status: 'pending',
        expires_at: null,
        created_at: new Date(now.getTime() - 3600000 * 2).toISOString(),
      },
      {
        user_id: 2,
        admin_id: 1,
        target_type: 'order:receiver_phone',
        target_id: 2,
        reason: '大客户专属客服，需要完整联系方式进行回访',
        status: 'approved',
        expires_at: new Date(now.getTime() + 86400000).toISOString(),
        created_at: new Date(now.getTime() - 3600000 * 8).toISOString(),
      },
      {
        user_id: 3,
        admin_id: 1,
        target_type: 'express:rider_phone',
        target_id: 1,
        reason: '紧急件需要直接联系骑手确认送达时间',
        status: 'approved',
        expires_at: new Date(now.getTime() + 3600000 * 4).toISOString(),
        created_at: new Date(now.getTime() - 3600000 * 5).toISOString(),
      },
      {
        user_id: 4,
        admin_id: 1,
        target_type: 'order:sender_phone',
        target_id: 3,
        reason: '未授权申请查看用户信息',
        status: 'rejected',
        expires_at: null,
        created_at: new Date(now.getTime() - 3600000 * 12).toISOString(),
      },
      {
        user_id: 5,
        admin_id: 1,
        target_type: 'order',
        target_id: 4,
        reason: '异常件处理，需要完整的收发件人信息进行理赔处理',
        status: 'pending',
        expires_at: null,
        created_at: new Date(now.getTime() - 3600000 * 1).toISOString(),
      },
    ]
    decryptRequests.forEach(req => {
      insertDecryptRequest.run(
        req.user_id, req.admin_id, req.target_type, req.target_id,
        req.reason, req.status, req.expires_at, req.created_at
      )
    })
  }

  if (auditCount.count === 0) {
    const insertAuditLog = db.prepare(`
      INSERT INTO audit_logs (admin_id, action, target, detail, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    const auditLogs = [
      { admin_id: 1, action: 'DECRYPT_REQUEST_APPROVE', target: '解密申请 #2', detail: '批准大客户客服查看收件人电话', created_at: new Date(now.getTime() - 3600000 * 7).toISOString() },
      { admin_id: 1, action: 'DECRYPT_REQUEST_APPROVE', target: '解密申请 #3', detail: '批准紧急件联系骑手', created_at: new Date(now.getTime() - 3600000 * 4).toISOString() },
      { admin_id: 1, action: 'DECRYPT_REQUEST_REJECT', target: '解密申请 #4', detail: '拒绝未授权查看用户信息申请，原因：超出岗位权限范围', created_at: new Date(now.getTime() - 3600000 * 11).toISOString() },
      { admin_id: 1, action: 'RULE_CHANGED', target: '脱敏规则：手机号', detail: '修改手机号脱敏规则为保留前3后4', created_at: new Date(now.getTime() - 86400000 * 2).toISOString() },
      { admin_id: 1, action: 'POLICY_UPDATED', target: '数据安全策略', detail: '更新数据安全策略版本至 v3.2', created_at: new Date(now.getTime() - 86400000 * 5).toISOString() },
      { admin_id: 1, action: 'LOGIN_SUCCESS', target: '系统登录', detail: '管理员从 IP 192.168.1.100 登录成功', created_at: new Date(now.getTime() - 3600000 * 10).toISOString() },
      { admin_id: 1, action: 'LOGIN_FAILED', target: '系统登录', detail: '用户 admin 密码错误，登录失败', created_at: new Date(now.getTime() - 3600000 * 10.5).toISOString() },
      { admin_id: 1, action: 'DECRYPT_REQUEST_CREATE', target: '解密申请 #5', detail: '片区经理申请查看异常件 #4 完整信息', created_at: new Date(now.getTime() - 3600000 * 1).toISOString() },
    ]
    auditLogs.forEach(log => {
      insertAuditLog.run(log.admin_id, log.action, log.target, log.detail, log.created_at)
    })
  }
}

function generateRoutingPlan(goodsType: string, urgency: string, weight: number) {
  const carriers = ['顺丰速运', '顺丰航空', '顺丰特惠', '顺丰特快']
  let carrier = '顺丰速运'
  let days = 3

  if (urgency === 'urgent') {
    carrier = '顺丰特快'
    days = 1
  } else if (urgency === 'express') {
    carrier = '顺丰航空'
    days = 2
  } else if (weight > 20) {
    carrier = '顺丰特惠'
    days = 4
  }

  if (goodsType === '电子产品' || goodsType === '精密仪器') {
    carrier = '顺丰航空'
  }

  const eta = new Date()
  eta.setDate(eta.getDate() + days)

  return {
    carrier,
    plan: `${carrier} - ${urgency === 'urgent' ? '航空直达' : urgency === 'express' ? '航空干线' : '陆运干线'}`,
    eta: eta.toISOString().split('T')[0],
  }
}

export default db
