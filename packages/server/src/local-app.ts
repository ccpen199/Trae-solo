import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

const { DatabaseSync } = require('node:sqlite');
dotenv.config();

const GD_CITIES = [
  '广州市', '深圳市', '珠海市', '汕头市', '佛山市',
  '韶关市', '湛江市', '肇庆市', '江门市', '茂名市',
  '惠州市', '梅州市', '汕尾市', '河源市', '阳江市',
  '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市',
];

const CITY_CODES: Record<string, string> = {
  广州市: '440100',
  深圳市: '440300',
  珠海市: '440400',
  汕头市: '440500',
  佛山市: '440600',
  韶关市: '440200',
  湛江市: '440800',
  肇庆市: '441200',
  江门市: '440700',
  茂名市: '440900',
  惠州市: '441300',
  梅州市: '441400',
  汕尾市: '441500',
  河源市: '441600',
  阳江市: '441700',
  清远市: '441800',
  东莞市: '441900',
  中山市: '442000',
  潮州市: '445100',
  揭阳市: '445200',
  云浮市: '445300',
};

type DbOrder = {
  id: string;
  order_no: string;
  applicant_phone: string;
  order_type: string;
  status: string;
  total_amount: number;
  payment_status: string;
  applicant_city: string;
  pickup_contact_name: string;
  pickup_contact_phone: string;
  pickup_address: string;
  delivery_address: string;
  sla_deadline: string;
  created_at: string;
  detail_json: string;
};

type DbUser = {
  id: string;
  phone: string;
  password: string;
  role: string;
  city: string | null;
  real_name_masked: string | null;
  id_card_masked: string | null;
  real_name_verified: number;
};

const app = express();
const port = Number(process.env.PORT || 59229);
const host = process.env.HOST || '127.0.0.1';

function resolveSqlitePath() {
  const url = process.env.DATABASE_URL || 'file:./data/local-dev.sqlite';
  const filePath = url.startsWith('file:') ? url.slice('file:'.length) : './data/local-dev.sqlite';
  return path.resolve(process.cwd(), filePath);
}

const dbPath = resolveSqlitePath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      phone TEXT PRIMARY KEY,
      id TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      city TEXT,
      real_name_masked TEXT,
      id_card_masked TEXT,
      real_name_verified INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS city_configs (
      city TEXT PRIMARY KEY,
      city_code TEXT NOT NULL,
      config_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT NOT NULL UNIQUE,
      applicant_phone TEXT NOT NULL,
      order_type TEXT NOT NULL,
      status TEXT NOT NULL,
      total_amount REAL NOT NULL,
      payment_status TEXT NOT NULL,
      applicant_city TEXT NOT NULL,
      pickup_contact_name TEXT,
      pickup_contact_phone TEXT,
      pickup_address TEXT,
      delivery_address TEXT,
      sla_deadline TEXT NOT NULL,
      created_at TEXT NOT NULL,
      detail_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courier_tasks (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      courier_phone TEXT NOT NULL,
      status TEXT NOT NULL,
      task_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_access_logs (
      id TEXT PRIMARY KEY,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      latency_ms INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const insert = db.prepare(`
      INSERT INTO users (phone, id, password, role, city, real_name_masked, id_card_masked, real_name_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    [
      ['13912345678', 'u-applicant-001', 'Admin@123456', 'APPLICANT', '广州市', '张*', '4401****1234', 1],
      ['13800000001', 'u-admin-001', 'Admin@123456', 'PROVINCE_ADMIN', '广东省', '省级管理员', null, 1],
      ['13800000101', 'u-city-001', 'Admin@123456', 'CITY_OPERATOR', '广州市', '广州运营', null, 1],
      ['13800000201', 'u-approver-001', 'Admin@123456', 'APPROVER', '广州市', '广州审批', null, 1],
      ['138000003011', 'u-courier-001', 'Admin@123456', 'COURIER', '广州市', '邮政揽收员', null, 1],
    ].forEach((row) => insert.run(...row));
  }

  const cityCount = db.prepare('SELECT COUNT(*) AS count FROM city_configs').get() as { count: number };
  if (cityCount.count === 0) {
    const insert = db.prepare('INSERT INTO city_configs (city, city_code, config_json, updated_at) VALUES (?, ?, ?, ?)');
    GD_CITIES.forEach((city, index) => {
      const cfg = {
        city,
        cityCode: CITY_CODES[city],
        isVisaEnabled: true,
        isIdCardEnabled: city !== '清远市',
        isViolationEnabled: true,
        isInspectionEnabled: index < 18,
        visaServiceFee: 25,
        idCardServiceFee: 20 + (index % 4),
        violationServiceFee: 5,
        inspectionServiceFee: 30,
        courierFeeStandard: 18,
        slaPickupMinutes: 120,
        slaProcessHours: 72,
        hotlinePhone: '11185',
        operatorNotice: city === '广州市' ? '高峰时段将优先调度同区邮政揽收员' : '',
        updatedAt: new Date().toISOString(),
      };
      insert.run(city, CITY_CODES[city], JSON.stringify(cfg), new Date().toISOString());
    });
  }

  const orderCount = db.prepare('SELECT COUNT(*) AS count FROM orders').get() as { count: number };
  if (orderCount.count === 0) {
    createOrderRecord({
      applicantPhone: '13912345678',
      orderType: 'HK_MACAO_VISA',
      applicantCity: '广州市',
      pickupAddress: '广州市天河区天河路385号',
      pickupContactName: '张三',
      pickupContactPhone: '13912345678',
      deliveryAddress: '广州市天河区天河北路233号',
      deliveryContactName: '张三',
      deliveryContactPhone: '13912345678',
      serviceFee: 25,
      governmentFee: 80,
      courierFee: 36,
      status: 'COURIER_ASSIGNED',
      paymentStatus: 'PAID',
      extra: { visaType: 'HK_G_SIGN', entryCount: '一次', validMonths: 12 },
    });
  }
}

function nowIso() {
  return new Date().toISOString();
}

function addHours(hours: number) {
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

function maskPhone(phone = '') {
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

function maskName(name = '') {
  if (!name) return '';
  return `${name[0]}*`;
}

function orderNo(prefix: string) {
  const d = new Date();
  const date = d.toISOString().slice(0, 10).replace(/-/g, '');
  return `${prefix}${date}${String(Math.floor(Math.random() * 900000) + 100000)}`;
}

function encodeToken(user: DbUser) {
  return Buffer.from(JSON.stringify({
    phone: user.phone,
    userId: user.id,
    role: user.role,
    city: user.city,
    realNameVerified: Boolean(user.real_name_verified),
  })).toString('base64url');
}

function decodeToken(auth?: string): Partial<DbUser> {
  const token = auth?.replace(/^Bearer\s+/i, '');
  if (!token) return {};
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    return { phone: payload.phone, id: payload.userId, role: payload.role, city: payload.city } as Partial<DbUser>;
  } catch {
    return {};
  }
}

function currentUser(req: Request): DbUser {
  const token = decodeToken(req.headers.authorization);
  const phone = token.phone || '13912345678';
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as DbUser | undefined;
  return user || (db.prepare('SELECT * FROM users WHERE phone = ?').get('13912345678') as DbUser);
}

function ok(res: Response, data: unknown = null, message = 'ok') {
  return res.json({ code: 0, message, data, timestamp: Date.now() });
}

function fail(res: Response, status: number, message: string) {
  return res.status(status).json({ code: status, message, timestamp: Date.now() });
}

function paginated(res: Response, list: unknown[], total = list.length, page = 1, pageSize = 20) {
  return ok(res, { list, total, page, pageSize });
}

function cityConfig(city: string) {
  const row = db.prepare('SELECT config_json FROM city_configs WHERE city = ?').get(city) as { config_json: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.config_json);
}

function allCityConfigs() {
  return (db.prepare('SELECT config_json FROM city_configs ORDER BY city_code ASC').all() as Array<{ config_json: string }>)
    .map((row) => JSON.parse(row.config_json));
}

function rowToOrder(row: DbOrder) {
  const detail = JSON.parse(row.detail_json || '{}');
  return {
    id: row.id,
    orderNo: row.order_no,
    orderType: row.order_type,
    status: row.status,
    serviceFee: detail.serviceFee || 0,
    governmentFee: detail.governmentFee || 0,
    courierFee: detail.courierFee || 0,
    totalAmount: row.total_amount,
    paymentStatus: row.payment_status,
    applicantCity: row.applicant_city,
    pickupAddressMasked: row.pickup_address ? `${row.pickup_address.slice(0, 6)}****` : '',
    deliveryAddressMasked: row.delivery_address ? `${row.delivery_address.slice(0, 6)}****` : '',
    pickupContact: { name: maskName(row.pickup_contact_name), phone: maskPhone(row.pickup_contact_phone) },
    deliveryContact: { name: maskName(detail.deliveryContactName || row.pickup_contact_name), phone: maskPhone(detail.deliveryContactPhone || row.pickup_contact_phone) },
    slaDeadline: row.sla_deadline,
    createdAt: row.created_at,
    statusLogs: detail.statusLogs || [
      { toStatus: 'CREATED', remark: '订单创建', createdAt: row.created_at },
      { toStatus: row.status, remark: '本地开发数据同步', createdAt: nowIso() },
    ],
    emsShipments: detail.emsShipments || [],
    electronicReceipt: row.status === 'COMPLETED' ? {
      receiptNo: `REC-${row.order_no}`,
      issuedAt: nowIso(),
      verifyCode: row.id.slice(0, 8).toUpperCase(),
    } : null,
    ...detail.extra,
  };
}

function createOrderRecord(input: {
  applicantPhone: string;
  orderType: string;
  applicantCity: string;
  pickupAddress?: string;
  pickupContactName?: string;
  pickupContactPhone?: string;
  deliveryAddress?: string;
  deliveryContactName?: string;
  deliveryContactPhone?: string;
  serviceFee: number;
  governmentFee: number;
  courierFee: number;
  status?: string;
  paymentStatus?: string;
  extra?: Record<string, unknown>;
}) {
  const id = randomUUID();
  const totalAmount = Number(input.serviceFee) + Number(input.governmentFee) + Number(input.courierFee);
  const createdAt = nowIso();
  const status = input.status || 'PENDING_PICKUP';
  const detail = {
    serviceFee: input.serviceFee,
    governmentFee: input.governmentFee,
    courierFee: input.courierFee,
    deliveryContactName: input.deliveryContactName || input.pickupContactName,
    deliveryContactPhone: input.deliveryContactPhone || input.pickupContactPhone,
    statusLogs: [
      { toStatus: 'CREATED', remark: '订单创建', createdAt },
      { toStatus: status, remark: input.paymentStatus === 'PAID' ? '已支付并进入办理流程' : '等待支付', createdAt },
    ],
    extra: input.extra || {},
  };
  const prefix = input.orderType.includes('VIOLATION') ? 'GDVIO' : input.orderType.includes('INSPECTION') ? 'GDINS' : input.orderType.includes('ID_CARD') ? 'GDIDC' : 'GDHKM';
  const no = orderNo(prefix);
  db.prepare(`
    INSERT INTO orders (
      id, order_no, applicant_phone, order_type, status, total_amount, payment_status, applicant_city,
      pickup_contact_name, pickup_contact_phone, pickup_address, delivery_address, sla_deadline, created_at, detail_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    no,
    input.applicantPhone,
    input.orderType,
    status,
    totalAmount,
    input.paymentStatus || 'PAID',
    input.applicantCity,
    input.pickupContactName || '',
    input.pickupContactPhone || '',
    input.pickupAddress || '',
    input.deliveryAddress || input.pickupAddress || '',
    addHours(72),
    createdAt,
    JSON.stringify(detail),
  );

  db.prepare('INSERT INTO courier_tasks (id, order_id, courier_phone, status, task_type, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(randomUUID(), id, '138000003011', status === 'COMPLETED' ? 'COMPLETED' : 'PENDING', 'PICKUP', createdAt);

  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as DbOrder;
}

initDb();

app.use(cors({ origin: true, credentials: true, exposedHeaders: ['X-Trace-Id'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    try {
      db.prepare('INSERT INTO api_access_logs (id, method, path, status_code, latency_ms, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(randomUUID(), req.method, req.path, res.statusCode, Date.now() - start, nowIso());
    } catch {
      // Logging must never block local development API responses.
    }
  });
  next();
});

app.get(['/health', '/api/health'], (_req, res) => ok(res, {
  status: 'UP',
  db: 'sqlite',
  dbPath,
  timestamp: Date.now(),
  gdCities: GD_CITIES.length,
}, 'ok'));

app.post('/api/v1/auth/login', (req, res) => {
  const { phone, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as DbUser | undefined;
  if (!user || user.password !== password) return fail(res, 401, '手机号或密码错误');
  return ok(res, {
    token: encodeToken(user),
    user: {
      id: user.id,
      role: user.role,
      city: user.city,
      phone: maskPhone(user.phone),
      realNameVerified: Boolean(user.real_name_verified),
      realNameMasked: user.real_name_masked,
      idCardMasked: user.id_card_masked,
    },
  }, '登录成功');
});

app.post('/api/v1/auth/register', (req, res) => {
  const { phone, password } = req.body;
  const exists = db.prepare('SELECT phone FROM users WHERE phone = ?').get(phone);
  if (exists) return fail(res, 409, '该手机号已注册');
  const user: DbUser = {
    id: randomUUID(),
    phone,
    password,
    role: 'APPLICANT',
    city: '广州市',
    real_name_masked: null,
    id_card_masked: null,
    real_name_verified: 0,
  };
  db.prepare('INSERT INTO users (phone, id, password, role, city, real_name_masked, id_card_masked, real_name_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(user.phone, user.id, user.password, user.role, user.city, user.real_name_masked, user.id_card_masked, user.real_name_verified);
  return ok(res, { token: encodeToken(user), user: { id: user.id, role: user.role, phone: maskPhone(phone), realNameVerified: false } }, '注册成功');
});

app.get('/api/v1/auth/me', (req, res) => {
  const user = currentUser(req);
  return ok(res, {
    id: user.id,
    role: user.role,
    city: user.city,
    phone: maskPhone(user.phone),
    realNameMasked: user.real_name_masked,
    idCardMasked: user.id_card_masked,
    realNameVerified: Boolean(user.real_name_verified),
  });
});

app.post('/api/v1/auth/identity-verify', (req, res) => {
  const user = currentUser(req);
  const { realName, idCard } = req.body;
  db.prepare('UPDATE users SET real_name_masked = ?, id_card_masked = ?, real_name_verified = 1 WHERE phone = ?')
    .run(maskName(realName), `${String(idCard || '').slice(0, 4)}****${String(idCard || '').slice(-4)}`, user.phone);
  const updated = db.prepare('SELECT * FROM users WHERE phone = ?').get(user.phone) as DbUser;
  return ok(res, { verified: true, newToken: encodeToken(updated), faceScore: 0.96 }, '实名核验通过');
});

app.get('/api/v1/admin/city-configs', (_req, res) => ok(res, allCityConfigs()));

app.get('/api/v1/admin/city-configs/:city', (req, res) => {
  const cfg = cityConfig(req.params.city);
  if (!cfg) return fail(res, 404, '城市配置不存在');
  return ok(res, cfg);
});

app.put('/api/v1/admin/city-configs/:city', (req, res) => {
  const cfg = { ...(cityConfig(req.params.city) || {}), ...req.body, city: req.params.city, updatedAt: nowIso() };
  db.prepare('INSERT OR REPLACE INTO city_configs (city, city_code, config_json, updated_at) VALUES (?, ?, ?, ?)')
    .run(req.params.city, cfg.cityCode || CITY_CODES[req.params.city] || '', JSON.stringify(cfg), nowIso());
  return ok(res, cfg, '城市配置已更新');
});

app.get('/api/v1/orders/list', (req, res) => {
  const user = currentUser(req);
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 20);
  const status = req.query.status as string | undefined;
  const rows = db.prepare('SELECT * FROM orders WHERE applicant_phone = ? ORDER BY created_at DESC').all(user.phone) as DbOrder[];
  const filtered = status ? rows.filter((row) => row.status === status) : rows;
  const list = filtered.slice((page - 1) * pageSize, page * pageSize).map(rowToOrder);
  return paginated(res, list, filtered.length, page, pageSize);
});

app.post('/api/v1/orders/visa', (req, res) => {
  const user = currentUser(req);
  const cfg = cityConfig(req.body.applicantCity) || {};
  const order = createOrderRecord({
    applicantPhone: user.phone,
    orderType: String(req.body.visaType || '').startsWith('TAIWAN') ? 'TAIWAN_VISA' : 'HK_MACAO_VISA',
    applicantCity: req.body.applicantCity || '广州市',
    pickupAddress: req.body.pickupAddress,
    pickupContactName: req.body.pickupContactName,
    pickupContactPhone: req.body.pickupContactPhone,
    deliveryAddress: req.body.deliveryAddress || req.body.pickupAddress,
    deliveryContactName: req.body.deliveryContactName || req.body.pickupContactName,
    deliveryContactPhone: req.body.deliveryContactPhone || req.body.pickupContactPhone,
    serviceFee: Number(cfg.visaServiceFee || 25),
    governmentFee: 80,
    courierFee: Number(cfg.courierFeeStandard || 18) * 2,
    extra: { visaType: req.body.visaType, validMonths: req.body.validMonths, entryCount: req.body.entryCount },
  });
  return ok(res, { orderId: order.id, orderNo: order.order_no, totalAmount: order.total_amount }, '签注申请已提交，等待揽收员上门');
});

app.post('/api/v1/orders/id-card', (req, res) => {
  const user = currentUser(req);
  const cfg = cityConfig(req.body.applicantCity) || {};
  const order = createOrderRecord({
    applicantPhone: user.phone,
    orderType: 'ID_CARD_REPLACEMENT',
    applicantCity: req.body.applicantCity || '广州市',
    pickupAddress: req.body.pickupAddress,
    pickupContactName: req.body.pickupContactName,
    pickupContactPhone: req.body.pickupContactPhone,
    deliveryAddress: req.body.deliveryAddress || req.body.pickupAddress,
    deliveryContactName: req.body.deliveryContactName || req.body.pickupContactName,
    deliveryContactPhone: req.body.deliveryContactPhone || req.body.pickupContactPhone,
    serviceFee: Number(cfg.idCardServiceFee || 20),
    governmentFee: 40,
    courierFee: Number(cfg.courierFeeStandard || 18) * 2,
    extra: { replaceReason: req.body.replaceReason },
  });
  return ok(res, { orderId: order.id, orderNo: order.order_no, totalAmount: order.total_amount }, '身份证补换领申请已提交');
});

app.get('/api/v1/orders/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as DbOrder | undefined;
  if (!row) return fail(res, 404, '订单不存在');
  return ok(res, rowToOrder(row));
});

app.post('/api/v1/orders/:id/cancel', (req, res) => {
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('CANCELLED', req.params.id);
  return ok(res, null, '订单已取消');
});

app.post('/api/v1/vehicle/violation/query', (req, res) => {
  const plate = String(req.body.plateNumber || '粤A12345').toUpperCase();
  const violations = [
    {
      id: 'vio-001',
      plateNumberMasked: `${plate.slice(0, 2)}***${plate.slice(-2)}`,
      violationCode: '1345',
      violationDesc: '机动车违反禁止标线指示',
      violationLocation: '广州市天河区黄埔大道西',
      violationTime: addHours(-96),
      fineAmount: 200,
      lateFee: 0,
      deductPoints: 3,
      source: 'TRAFFIC_12123',
    },
    {
      id: 'vio-002',
      plateNumberMasked: `${plate.slice(0, 2)}***${plate.slice(-2)}`,
      violationCode: '1625',
      violationDesc: '驾驶机动车超过规定时速20%以上未达50%',
      violationLocation: '深圳市南山区深南大道',
      violationTime: addHours(-180),
      fineAmount: 150,
      lateFee: 15,
      deductPoints: 6,
      source: 'MINISTRY_POLICE_DB',
    },
  ];
  return ok(res, {
    queryScope: req.body.queryScope || 'NATIONWIDE',
    citiesQueried: req.body.queryScope === 'GUANGDONG' ? 21 : 426,
    stats: {
      count: violations.length,
      totalFine: violations.reduce((sum, item) => sum + item.fineAmount, 0),
      totalLate: violations.reduce((sum, item) => sum + item.lateFee, 0),
      totalPoints: violations.reduce((sum, item) => sum + item.deductPoints, 0),
    },
    violations,
  });
});

app.post('/api/v1/vehicle/violation/pay', (req, res) => {
  const user = currentUser(req);
  const selected = Array.isArray(req.body.violationIds) ? req.body.violationIds.length : 1;
  const order = createOrderRecord({
    applicantPhone: user.phone,
    orderType: 'VIOLATION_PAYMENT',
    applicantCity: req.body.applicantCity || '广州市',
    pickupAddress: '线上办理',
    pickupContactName: req.body.ownerName || '张三',
    pickupContactPhone: user.phone,
    deliveryAddress: '电子回执',
    serviceFee: 5 * selected,
    governmentFee: 200 * selected,
    courierFee: 0,
    extra: { plateNumber: req.body.plateNumber, violationIds: req.body.violationIds },
  });
  return ok(res, { orderId: order.id, orderNo: order.order_no, totalAmount: order.total_amount }, '违章缴费订单已创建');
});

app.post('/api/v1/vehicle/inspection', (req, res) => {
  const user = currentUser(req);
  const cfg = cityConfig(req.body.applicantCity) || {};
  const order = createOrderRecord({
    applicantPhone: user.phone,
    orderType: 'VEHICLE_INSPECTION',
    applicantCity: req.body.applicantCity || '广州市',
    pickupAddress: req.body.pickupAddress,
    pickupContactName: req.body.pickupContactName,
    pickupContactPhone: req.body.pickupContactPhone,
    deliveryAddress: req.body.deliveryAddress || req.body.pickupAddress,
    deliveryContactName: req.body.deliveryContactName || req.body.pickupContactName,
    deliveryContactPhone: req.body.deliveryContactPhone || req.body.pickupContactPhone,
    serviceFee: Number(cfg.inspectionServiceFee || 30),
    governmentFee: 0,
    courierFee: Number(cfg.courierFeeStandard || 18) * 2,
    extra: { plateNumber: req.body.plateNumber, vehicleType: req.body.vehicleType },
  });
  return ok(res, { orderId: order.id, orderNo: order.order_no, totalAmount: order.total_amount }, '六年免检申请已提交');
});

app.post('/api/v1/payments/:orderId/create', (req, res) => {
  db.prepare('UPDATE orders SET payment_status = ?, status = ? WHERE id = ?').run('PAID', 'PENDING_PICKUP', req.params.orderId);
  return ok(res, { payUrl: 'mock://wechat-pay', channel: req.body.channel || 'WECHAT_PAY' }, '支付已受理');
});

app.get('/api/v1/ems/orders/:orderId/shipments', (req, res) => {
  return ok(res, [{
    shipmentNo: `EMS${Date.now()}`,
    orderId: req.params.orderId,
    status: 'IN_TRANSIT',
    trackingLogs: [
      { statusDesc: '揽收员已上门取件', location: '广州天河揽投部', occurredAt: addHours(-8) },
      { statusDesc: '邮件已到达广州处理中心', location: '广州邮件处理中心', occurredAt: addHours(-4) },
    ],
  }]);
});

app.get('/api/v1/admin/stats/sla-overview', (req, res) => {
  const totalOrders = (db.prepare('SELECT COUNT(*) AS count FROM orders').get() as { count: number }).count;
  return ok(res, {
    city: req.query.city || '全省',
    period: '最近30天',
    totalOrders: Math.max(totalOrders, 12847),
    processing: 892,
    slaWarning: 47,
    slaBreached: 13,
    pendingCourier: 124,
    pendingApproval: 356,
    pendingOcr: 89,
    slaRate: '99.87%',
  });
});

app.get('/api/v1/admin/alerts/stats', (_req, res) => ok(res, {
  total: 457,
  unhandled: 112,
  handleRate: '75.49%',
  byType: [
    { type: 'SLA_WARNING', _count: 47 },
    { type: 'PAYMENT_EXCEPTION', _count: 9 },
  ],
  byLevel: [
    { level: 'WARNING', _count: 68 },
    { level: 'DANGER', _count: 21 },
  ],
}));

app.get('/api/v1/admin/alerts', (req, res) => paginated(res, [
  { id: 'alert-001', type: 'SLA_WARNING', level: 'WARNING', city: '广州市', title: '签注订单即将超时', isHandled: false, createdAt: nowIso() },
  { id: 'alert-002', type: 'OCR_FAILURE', level: 'INFO', city: '深圳市', title: '材料OCR置信度低，需人工复核', isHandled: false, createdAt: nowIso() },
], 2, Number(req.query.page || 1), Number(req.query.pageSize || 20)));

app.post('/api/v1/admin/alerts/:id/handle', (_req, res) => ok(res, null, '预警已处理'));

app.get('/api/v1/admin/fund/accounts', (_req, res) => ok(res, {
  accounts: GD_CITIES.slice(0, 5).map((city, index) => ({
    id: `fund-${index}`,
    accountNo: `REG-${CITY_CODES[city]}`,
    accountType: index === 0 ? 'REGULATORY' : 'SERVICE_REVENUE',
    managedCity: city,
    balance: 250000 + index * 30000,
    frozenAmount: 12000 + index * 500,
  })),
  summary: { balance: 1480000, frozen: 68000 },
}));

app.get('/api/v1/admin/fund/transactions', (req, res) => paginated(res, [
  { id: 'ft-001', transNo: 'FT202406180001', transType: 'SERVICE_FEE_COLLECT', amount: 25, balanceAfter: 250025, createdAt: nowIso() },
  { id: 'ft-002', transNo: 'FT202406180002', transType: 'GOVERNMENT_FEE_TRANSFER', amount: 80, balanceAfter: 249945, createdAt: nowIso() },
], 2, Number(req.query.page || 1), Number(req.query.pageSize || 20)));

app.get('/api/v1/admin/orders/overview', (_req, res) => ok(res, {
  days: 7,
  totalOrders: 846,
  totalRevenue: 48620,
  byType: ['HK_MACAO_VISA', 'ID_CARD_REPLACEMENT', 'VIOLATION_PAYMENT', 'VEHICLE_INSPECTION'].map((type, index) => ({ type, count: 120 + index * 40, revenue: 6000 + index * 1800 })),
  byStatus: ['PENDING_PICKUP', 'APPROVING', 'IN_DELIVERY', 'COMPLETED'].map((status, index) => ({ status, count: 80 + index * 30 })),
  daily: Array.from({ length: 7 }).map((_, index) => ({ date: new Date(Date.now() - (6 - index) * 86400000).toISOString().slice(0, 10), count: 80 + index * 8, revenue: 3200 + index * 450 })),
}));

app.get('/api/v1/approval/pending', (req, res) => paginated(res, [
  { id: 'apr-001', orderNo: 'GDHKM202406180001', orderType: 'HK_MACAO_VISA', applicantCity: '广州市', status: 'APPROVING', createdAt: nowIso() },
], 1, Number(req.query.page || 1), Number(req.query.pageSize || 20)));

app.post('/api/v1/approval/:id/approve', (_req, res) => ok(res, null, '审批操作已记录'));

function courierTasks() {
  const rows = db.prepare(`
    SELECT t.*, o.order_no, o.order_type, o.created_at AS order_created_at
    FROM courier_tasks t
    JOIN orders o ON o.id = t.order_id
    ORDER BY t.created_at DESC
  `).all() as Array<Record<string, any>>;
  return rows.map((row, index) => ({
    id: row.id,
    orderId: row.order_id,
    orderNo: row.order_no,
    orderType: row.order_type,
    status: row.status,
    taskType: row.task_type,
    distance: (1.2 + index * 0.7).toFixed(1),
    appointment: { from: addHours(2 + index), to: addHours(4 + index) },
    createdAt: row.created_at,
  }));
}

app.get('/api/v1/courier/stats/today', (_req, res) => {
  const tasks = courierTasks();
  return ok(res, {
    total: tasks.length,
    pending: tasks.filter((task) => task.status === 'PENDING').length,
    picked: tasks.filter((task) => task.status === 'PICKED').length,
    completed: tasks.filter((task) => task.status === 'COMPLETED').length,
    todayTaskCount: tasks.length,
    isOnDuty: true,
  });
});

app.get('/api/v1/courier/tasks', (req, res) => {
  const status = req.query.status as string | undefined;
  const tasks = courierTasks().filter((task) => !status || status === 'all' || task.status === status);
  return paginated(res, tasks, tasks.length, Number(req.query.page || 1), Number(req.query.pageSize || 100));
});

app.post('/api/v1/courier/duty/toggle', (req, res) => ok(res, { isOnDuty: Boolean(req.body.onDuty) }, '状态已更新'));
app.post('/api/v1/courier/location/report', (_req, res) => ok(res, null, '位置已上报'));

app.post('/api/v1/courier/tasks/:id/:action', (req, res) => {
  const statusMap: Record<string, string> = {
    accept: 'ACCEPTED',
    depart: 'EN_ROUTE',
    arrive: 'ARRIVED',
    pickup: 'PICKED',
    deliver: 'DELIVERING',
    complete: 'COMPLETED',
  };
  const nextStatus = statusMap[req.params.action] || 'ACCEPTED';
  db.prepare('UPDATE courier_tasks SET status = ? WHERE id = ?').run(nextStatus, req.params.id);
  return ok(res, { status: nextStatus }, '工单状态已更新');
});

app.use('/api', (req, res) => fail(res, 404, `接口不存在: ${req.method} ${req.path}`));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  fail(res, 500, err.message || '服务器内部错误');
});

app.listen(port, host, () => {
  console.log(`[local-api] Postal Gov local API listening on http://${host}:${port}`);
  console.log(`[local-api] SQLite database: ${dbPath}`);
});
