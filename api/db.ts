import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const db = new Database(path.join(__dirname, 'charging.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    nickname TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS vehicle_bindings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    vin TEXT NOT NULL,
    plate_number TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    battery_capacity REAL NOT NULL,
    is_authenticated INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS operators (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_phone TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS charging_stations (
    id TEXT PRIMARY KEY,
    operator_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    type TEXT NOT NULL DEFAULT '混合',
    available_piles INTEGER DEFAULT 0,
    total_piles INTEGER DEFAULT 0,
    rating REAL DEFAULT 4.5,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (operator_id) REFERENCES operators(id)
  );

  CREATE TABLE IF NOT EXISTS charging_piles (
    id TEXT PRIMARY KEY,
    station_id TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'DC',
    power_kw REAL NOT NULL DEFAULT 60,
    status TEXT NOT NULL DEFAULT '空闲',
    price_per_kwh REAL NOT NULL DEFAULT 1.0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (station_id) REFERENCES charging_stations(id)
  );

  CREATE TABLE IF NOT EXISTS charging_orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    pile_id TEXT NOT NULL,
    station_id TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    charged_kwh REAL DEFAULT 0,
    cost REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT '充电中',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pile_id) REFERENCES charging_piles(id),
    FOREIGN KEY (station_id) REFERENCES charging_stations(id)
  );

  CREATE TABLE IF NOT EXISTS settlement_rules (
    id TEXT PRIMARY KEY,
    operator_id TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    base_price REAL NOT NULL,
    peak_price REAL NOT NULL,
    valley_price REAL NOT NULL,
    peak_start TEXT NOT NULL,
    peak_end TEXT NOT NULL,
    valley_start TEXT NOT NULL,
    valley_end TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (operator_id) REFERENCES operators(id)
  );

  CREATE TABLE IF NOT EXISTS settlement_bills (
    id TEXT PRIMARY KEY,
    operator_id TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    total_kwh REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT '待结算',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (operator_id) REFERENCES operators(id)
  );

  CREATE TABLE IF NOT EXISTS community_posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    topic TEXT DEFAULT '充电体验',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT '已通过',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_tags (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`)

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
if (userCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, nickname, avatar) VALUES (?, ?, ?, ?)
  `)
  const users = [
    { id: uuidv4(), phone: '13800138001', nickname: '张伟', avatar: '' },
    { id: uuidv4(), phone: '13800138002', nickname: '李娜', avatar: '' },
    { id: uuidv4(), phone: '13800138003', nickname: '王强', avatar: '' },
    { id: uuidv4(), phone: '13800138004', nickname: '刘洋', avatar: '' },
    { id: uuidv4(), phone: '13800138005', nickname: '陈晓', avatar: '' },
  ]
  const userIds: string[] = []
  for (const u of users) {
    insertUser.run(u.id, u.phone, u.nickname, u.avatar)
    userIds.push(u.id)
  }

  const insertOperator = db.prepare(`
    INSERT INTO operators (id, name, contact_phone) VALUES (?, ?, ?)
  `)
  const operators = [
    { id: uuidv4(), name: '国网电动', contact_phone: '95598' },
    { id: uuidv4(), name: '特来电', contact_phone: '400-100-1666' },
    { id: uuidv4(), name: '星星充电', contact_phone: '400-828-0028' },
  ]
  const operatorIds: string[] = []
  for (const op of operators) {
    insertOperator.run(op.id, op.name, op.contact_phone)
    operatorIds.push(op.id)
  }

  const insertStation = db.prepare(`
    INSERT INTO charging_stations (id, operator_id, name, address, lat, lng, type, available_piles, total_piles, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const stations = [
    { id: uuidv4(), operator_id: operatorIds[0], name: '国网电动望京充电站', address: '北京市朝阳区望京西路', lat: 39.9942, lng: 116.4744, type: '快充', available_piles: 4, total_piles: 8, rating: 4.6 },
    { id: uuidv4(), operator_id: operatorIds[0], name: '国网电动中关村充电站', address: '北京市海淀区中关村大街', lat: 39.9839, lng: 116.3165, type: '混合', available_piles: 6, total_piles: 12, rating: 4.8 },
    { id: uuidv4(), operator_id: operatorIds[0], name: '国网电动陆家嘴充电站', address: '上海市浦东新区陆家嘴环路', lat: 31.2397, lng: 121.4998, type: '快充', available_piles: 3, total_piles: 10, rating: 4.5 },
    { id: uuidv4(), operator_id: operatorIds[1], name: '特来电徐家汇充电站', address: '上海市徐汇区漕溪北路', lat: 31.1956, lng: 121.4367, type: '混合', available_piles: 5, total_piles: 8, rating: 4.7 },
    { id: uuidv4(), operator_id: operatorIds[1], name: '特来电天河充电站', address: '广州市天河区天河路', lat: 23.1369, lng: 113.3250, type: '快充', available_piles: 7, total_piles: 12, rating: 4.4 },
    { id: uuidv4(), operator_id: operatorIds[1], name: '特来电南山充电站', address: '深圳市南山区科技园路', lat: 22.5431, lng: 113.9578, type: '混合', available_piles: 2, total_piles: 6, rating: 4.3 },
    { id: uuidv4(), operator_id: operatorIds[2], name: '星星充电福田充电站', address: '深圳市福田区深南大道', lat: 22.5382, lng: 114.0578, type: '快充', available_piles: 8, total_piles: 10, rating: 4.6 },
    { id: uuidv4(), operator_id: operatorIds[2], name: '星星充电武侯充电站', address: '成都市武侯区人民南路', lat: 30.6343, lng: 104.0668, type: '慢充', available_piles: 3, total_piles: 6, rating: 4.2 },
    { id: uuidv4(), operator_id: operatorIds[0], name: '国网电动洪山充电站', address: '武汉市洪山区珞喻路', lat: 30.5111, lng: 114.3628, type: '混合', available_piles: 5, total_piles: 10, rating: 4.5 },
    { id: uuidv4(), operator_id: operatorIds[1], name: '特来电西湖充电站', address: '杭州市西湖区保俶路', lat: 30.2598, lng: 120.1508, type: '快充', available_piles: 4, total_piles: 8, rating: 4.9 },
    { id: uuidv4(), operator_id: operatorIds[2], name: '星星充电鼓楼充电站', address: '南京市鼓楼区中山北路', lat: 32.0672, lng: 118.7698, type: '混合', available_piles: 6, total_piles: 10, rating: 4.4 },
    { id: uuidv4(), operator_id: operatorIds[0], name: '国网电动渝中充电站', address: '重庆市渝中区解放碑', lat: 29.5586, lng: 106.5774, type: '快充', available_piles: 3, total_piles: 8, rating: 4.3 },
    { id: uuidv4(), operator_id: operatorIds[1], name: '特来电雁塔充电站', address: '西安市雁塔区长安南路', lat: 34.2196, lng: 108.9453, type: '混合', available_piles: 5, total_piles: 10, rating: 4.5 },
    { id: uuidv4(), operator_id: operatorIds[2], name: '星星充电朝阳充电站', address: '北京市朝阳区建国路', lat: 39.9087, lng: 116.4603, type: '快充', available_piles: 6, total_piles: 12, rating: 4.7 },
    { id: uuidv4(), operator_id: operatorIds[0], name: '国网电动静安充电站', address: '上海市静安区南京西路', lat: 31.2289, lng: 121.4477, type: '快充', available_piles: 2, total_piles: 6, rating: 4.6 },
    { id: uuidv4(), operator_id: operatorIds[1], name: '特来电海珠充电站', address: '广州市海珠区新港东路', lat: 23.0926, lng: 113.3557, type: '慢充', available_piles: 4, total_piles: 8, rating: 4.1 },
    { id: uuidv4(), operator_id: operatorIds[2], name: '星星充电锦江充电站', address: '成都市锦江区春熙路', lat: 30.6575, lng: 104.0808, type: '混合', available_piles: 5, total_piles: 10, rating: 4.5 },
    { id: uuidv4(), operator_id: operatorIds[0], name: '国网电动江汉充电站', address: '武汉市江汉区解放大道', lat: 30.5951, lng: 114.2683, type: '快充', available_piles: 7, total_piles: 12, rating: 4.7 },
    { id: uuidv4(), operator_id: operatorIds[1], name: '特来电滨江充电站', address: '杭州市滨江区江南大道', lat: 30.2084, lng: 120.2104, type: '快充', available_piles: 3, total_piles: 8, rating: 4.6 },
    { id: uuidv4(), operator_id: operatorIds[2], name: '星星充电江宁充电站', address: '南京市江宁区东山街道', lat: 31.9541, lng: 118.8404, type: '混合', available_piles: 4, total_piles: 8, rating: 4.3 },
    { id: uuidv4(), operator_id: operatorIds[0], name: '国网电动江北充电站', address: '重庆市江北区观音桥', lat: 29.5807, lng: 106.5705, type: '快充', available_piles: 5, total_piles: 10, rating: 4.4 },
    { id: uuidv4(), operator_id: operatorIds[1], name: '特来电碑林充电站', address: '西安市碑林区南大街', lat: 34.2594, lng: 108.9352, type: '混合', available_piles: 2, total_piles: 6, rating: 4.2 },
  ]
  const stationIds: string[] = []
  for (const s of stations) {
    insertStation.run(s.id, s.operator_id, s.name, s.address, s.lat, s.lng, s.type, s.available_piles, s.total_piles, s.rating)
    stationIds.push(s.id)
  }

  const insertPile = db.prepare(`
    INSERT INTO charging_piles (id, station_id, code, type, power_kw, status, price_per_kwh) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const pileStatuses = ['空闲', '空闲', '空闲', '充电中', '空闲', '故障', '空闲', '空闲', '充电中', '空闲']
  const pileEntries: { id: string; station_id: string; code: string; type: string; power_kw: number; status: string; price_per_kwh: number }[] = []
  let pileIndex = 0
  for (const sid of stationIds) {
    const station = stations.find(s => s.id === sid)!
    const pileCount = station.total_piles
    for (let i = 0; i < pileCount; i++) {
      const isDc = station.type === '快充' || (station.type === '混合' && i < pileCount / 2)
      pileEntries.push({
        id: uuidv4(),
        station_id: sid,
        code: `${station.name.substring(0, 2)}${String(pileIndex + 1).padStart(3, '0')}`,
        type: isDc ? 'DC' : 'AC',
        power_kw: isDc ? (Math.random() > 0.5 ? 120 : 60) : 7,
        status: pileStatuses[i % pileStatuses.length],
        price_per_kwh: isDc ? (0.8 + Math.random() * 0.6) : (0.5 + Math.random() * 0.3),
      })
      pileIndex++
    }
  }
  const pileIds: string[] = []
  for (const p of pileEntries) {
    insertPile.run(p.id, p.station_id, p.code, p.type, p.power_kw, p.status, p.price_per_kwh)
    pileIds.push(p.id)
  }

  const insertOrder = db.prepare(`
    INSERT INTO charging_orders (id, user_id, pile_id, station_id, start_time, end_time, charged_kwh, cost, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const orderStatuses = ['充电中', '已完成', '已完成', '已完成', '已取消']
  for (let i = 0; i < 30; i++) {
    const userId = userIds[i % userIds.length]
    const pileId = pileIds[i % pileIds.length]
    const pile = pileEntries.find(p => p.id === pileId)!
    const stationId = pile.station_id
    const status = orderStatuses[i % orderStatuses.length]
    const dayOffset = Math.floor(Math.random() * 30)
    const startHour = 6 + Math.floor(Math.random() * 14)
    const startMin = Math.floor(Math.random() * 60)
    const startTime = `2026-05-${String(10 + dayOffset > 31 ? 10 + dayOffset - 31 : 10 + dayOffset).padStart(2, '0')} ${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`
    const durationMin = status === '充电中' ? 0 : 20 + Math.floor(Math.random() * 80)
    const chargedKwh = status === '充电中' ? +(Math.random() * 20).toFixed(2) : +((pile.power_kw * durationMin / 60) * (0.8 + Math.random() * 0.2)).toFixed(2)
    const cost = +(chargedKwh * pile.price_per_kwh).toFixed(2)
    const endHour = startHour + Math.floor((startMin + durationMin) / 60)
    const endMin = (startMin + durationMin) % 60
    const endTime = status === '充电中' ? null : `2026-05-${String(10 + dayOffset > 31 ? 10 + dayOffset - 31 : 10 + dayOffset).padStart(2, '0')} ${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`
    insertOrder.run(uuidv4(), userId, pileId, stationId, startTime, endTime, chargedKwh, cost, status)
  }

  const insertSettlementRule = db.prepare(`
    INSERT INTO settlement_rules (id, operator_id, rule_name, base_price, peak_price, valley_price, peak_start, peak_end, valley_start, valley_end)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const settlementRules = [
    { id: uuidv4(), operator_id: operatorIds[0], rule_name: '国网电动标准计费', base_price: 0.85, peak_price: 1.20, valley_price: 0.38, peak_start: '08:00', peak_end: '21:00', valley_start: '23:00', valley_end: '07:00' },
    { id: uuidv4(), operator_id: operatorIds[1], rule_name: '特来电分时计费', base_price: 0.90, peak_price: 1.35, valley_price: 0.42, peak_start: '09:00', peak_end: '22:00', valley_start: '00:00', valley_end: '06:00' },
    { id: uuidv4(), operator_id: operatorIds[2], rule_name: '星星充电阶梯计费', base_price: 0.80, peak_price: 1.15, valley_price: 0.35, peak_start: '08:30', peak_end: '20:30', valley_start: '22:00', valley_end: '06:00' },
  ]
  for (const r of settlementRules) {
    insertSettlementRule.run(r.id, r.operator_id, r.rule_name, r.base_price, r.peak_price, r.valley_price, r.peak_start, r.peak_end, r.valley_start, r.valley_end)
  }

  const insertSettlementBill = db.prepare(`
    INSERT INTO settlement_bills (id, operator_id, period_start, period_end, total_kwh, total_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const billStatuses = ['已结算', '待结算', '已结算']
  for (let i = 0; i < 6; i++) {
    const opIdx = i % 3
    insertSettlementBill.run(
      uuidv4(),
      operatorIds[opIdx],
      `2026-0${1 + Math.floor(i / 3)}-01`,
      `2026-0${1 + Math.floor(i / 3)}-15`,
      +(5000 + Math.random() * 15000).toFixed(2),
      +(4000 + Math.random() * 12000).toFixed(2),
      billStatuses[i % billStatuses.length],
    )
  }

  const insertCommunityPost = db.prepare(`
    INSERT INTO community_posts (id, user_id, title, content, topic, likes_count, comments_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const posts = [
    { user_id: userIds[0], title: '国网望京站充电体验超赞', content: '今天在望京站充了一次电，120kW快充桩速度很快，半小时就从20%充到80%，价格也很合理，推荐大家来试试！', topic: '充电体验', likes: 23, comments: 5 },
    { user_id: userIds[1], title: '特来电西湖站环境很好', content: '西湖特来电站周边环境真不错，充电的时候可以顺便逛逛西湖，充电桩维护得也很好，没有坏桩。', topic: '充电体验', likes: 45, comments: 12 },
    { user_id: userIds[2], title: '分享我的充电省钱攻略', content: '经过半年摸索，总结了几条省钱经验：1.尽量用谷电时段充电 2.办运营商会员卡有折扣 3.偏远站点价格更低 4.避开高峰期排队少。希望对大家有帮助！', topic: '省钱攻略', likes: 128, comments: 34 },
    { user_id: userIds[3], title: '比亚迪海豹充电适配问题', content: '最近发现海豹在某些星星充电的桩上充电速度上不去，只能到40kW，但同一桩别的车能到60kW，有人遇到过类似问题吗？', topic: '车型讨论', likes: 56, comments: 18 },
    { user_id: userIds[4], title: '重庆江北站排队太严重了', content: '周五晚上去江北站充电，等了快一个小时才有空桩，建议增加更多快充桩！而且有两根桩显示空闲但实际是故障的，希望运营方能及时维护。', topic: '充电体验', likes: 89, comments: 27 },
    { user_id: userIds[0], title: 'V2G功能体验：白天卖电赚了20块', content: '试了一下V2G功能，白天电价高的时候把车里的电卖给电网，赚了20块钱！虽然不多但比放着不用强多了，期待更多站支持V2G。', topic: 'V2G', likes: 76, comments: 21 },
    { user_id: userIds[1], title: '长途出行充电规划心得', content: '上次从上海开到杭州，提前用路径规划功能规划好充电站，全程无焦虑。关键是要留足余量，SOC低于30%就开始找站充电。', topic: '出行攻略', likes: 92, comments: 15 },
    { user_id: userIds[2], title: '蔚来ES6和特斯拉Model Y充电对比', content: '两个车都开过，充电方面特斯拉的超充体验确实更好，速度更快、适配性也更好。但蔚来换电也很方便，各有优势吧。', topic: '车型讨论', likes: 156, comments: 48 },
    { user_id: userIds[3], title: '南京鼓楼站服务有待提高', content: '鼓楼站位置不错，但是充电桩的线太短了，有些车位停进去够不着。另外APP上显示的空闲桩数不准，到了发现不一样。', topic: '充电体验', likes: 34, comments: 9 },
    { user_id: userIds[4], title: '推荐几个成都充电好去处', content: '成都锦江春熙路站和武侯站的体验都不错，充电的时候可以逛街吃饭。武侯站虽然只有慢充，但胜在人少不用排队。', topic: '出行攻略', likes: 67, comments: 11 },
    { user_id: userIds[0], title: '关于充电桩故障率的讨论', content: '最近一个月遇到了三次故障桩，分别是无法启动、中途断充、结算异常。大家遇到故障桩都是怎么处理的？运营商响应速度怎么样？', topic: '充电体验', likes: 43, comments: 16 },
    { user_id: userIds[1], title: '小鹏G9 800V平台充电速度实测', content: '今天在国网中关村站实测了一下小鹏G9的充电速度，SOC从10%到80%只用了20分钟！800V平台在支持高功率的桩上优势非常明显。', topic: '车型讨论', likes: 201, comments: 56 },
    { user_id: userIds[2], title: '谷电时段充电真的省很多', content: '算了一笔账，同样的电量，谷电时段（23:00-7:00）充电比峰电时段省将近60%！我一般设好定时充电，早上起来就满了，非常方便。', topic: '省钱攻略', likes: 145, comments: 38 },
    { user_id: userIds[3], title: '深圳南山站新增加了几根桩', content: '听说特来电南山站最近新增了4根120kW快充桩，总桩数达到10根了，排队情况应该会好很多，周末去试试看。', topic: '充电体验', likes: 28, comments: 7 },
  ]
  for (const p of posts) {
    insertCommunityPost.run(uuidv4(), p.user_id, p.title, p.content, p.topic, p.likes, p.comments, '已通过')
  }

  const insertUserTag = db.prepare(`
    INSERT INTO user_tags (id, user_id, tag) VALUES (?, ?, ?)
  `)
  const tags = ['高频用户', '长途中转', '谷电用户', 'V2G用户', '新用户', '会员用户', '快充偏好', '慢充偏好']
  for (const uid of userIds) {
    const userTags = tags.filter(() => Math.random() > 0.5)
    if (userTags.length === 0) userTags.push('新用户')
    for (const t of userTags) {
      insertUserTag.run(uuidv4(), uid, t)
    }
  }

  const insertVehicle = db.prepare(`
    INSERT INTO vehicle_bindings (id, user_id, vin, plate_number, brand, model, battery_capacity, is_authenticated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const vehicles = [
    { user_id: userIds[0], vin: 'LSVNV2182N1000001', plate_number: '京AD12345', brand: '特斯拉', model: 'Model Y', battery: 60, auth: 1 },
    { user_id: userIds[0], vin: 'LSVNV2182N1000002', plate_number: '京AD12346', brand: '比亚迪', model: '海豹', battery: 61.4, auth: 1 },
    { user_id: userIds[1], vin: 'LSVNV2182N1000003', plate_number: '沪BF67890', brand: '蔚来', model: 'ES6', battery: 75, auth: 1 },
    { user_id: userIds[2], vin: 'LSVNV2182N1000004', plate_number: '粤CG11111', brand: '小鹏', model: 'G9', battery: 98, auth: 0 },
    { user_id: userIds[3], vin: 'LSVNV2182N1000005', plate_number: '川DF22222', brand: '理想', model: 'L7', battery: 42.8, auth: 1 },
    { user_id: userIds[4], vin: 'LSVNV2182N1000006', plate_number: '鄂EH33333', brand: '比亚迪', model: '汉EV', battery: 76.9, auth: 0 },
  ]
  for (const v of vehicles) {
    insertVehicle.run(uuidv4(), v.user_id, v.vin, v.plate_number, v.brand, v.model, v.battery, v.auth)
  }
}

export default db
