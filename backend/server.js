const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { DatabaseSync } = require('node:sqlite');

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(__dirname, '..', '.env'));

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || '56344');
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || '46344');
const dataDir = path.join(__dirname, 'data');
const uploadDir = path.join(dataDir, 'uploads');
const dbPath = path.join(dataDir, 'airport_service.db');

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK(role IN ('admin','cs','staff','operation')),
    name TEXT NOT NULL,
    phone TEXT,
    area TEXT,
    shift TEXT CHECK(shift IN ('早班','中班','晚班','白班')),
    queue TEXT,
    status TEXT DEFAULT 'online',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS flights (
    id TEXT PRIMARY KEY,
    flight_no TEXT NOT NULL UNIQUE,
    airline TEXT,
    departure_time TEXT,
    arrival_time TEXT,
    terminal TEXT,
    gate TEXT,
    status TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    flight_id TEXT,
    passenger_name TEXT NOT NULL,
    passenger_phone TEXT NOT NULL,
    passenger_id_card TEXT,
    terminal TEXT NOT NULL,
    area TEXT NOT NULL,
    seat_no TEXT,
    service_type TEXT NOT NULL,
    service_category TEXT,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','urgent','critical')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','assigned','processing','transferred','exception','completed','closed','cancelled')),
    assigned_to_id TEXT,
    assigned_at TEXT,
    accepted_at TEXT,
    arrived_at TEXT,
    completed_at TEXT,
    sla_deadline TEXT,
    is_exception INTEGER DEFAULT 0,
    exception_type TEXT,
    satisfaction_score INTEGER CHECK(satisfaction_score BETWEEN 1 AND 5),
    satisfaction_feedback TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flight_id) REFERENCES flights(id),
    FOREIGN KEY (assigned_to_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ticket_attachments (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ticket_logs (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    operator_id TEXT,
    operator_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ticket_transfers (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    from_user_id TEXT,
    to_user_id TEXT NOT NULL,
    from_queue TEXT,
    to_queue TEXT,
    reason TEXT,
    operator_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ticket_assistance (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL UNIQUE,
    arrival_time TEXT,
    assistance_content TEXT,
    assistance_duration INTEGER,
    tools_used TEXT,
    cross_department TEXT,
    compensation_offered TEXT,
    passenger_confirmation INTEGER DEFAULT 0,
    confirmed_at TEXT,
    signature TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS compensations (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL,
    description TEXT,
    approved_by TEXT,
    approved_at TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS feedbacks (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL UNIQUE,
    call_time TEXT,
    caller_id TEXT,
    satisfaction INTEGER CHECK(satisfaction BETWEEN 1 AND 5),
    feedback_text TEXT,
    follow_up_needed INTEGER DEFAULT 0,
    follow_up_detail TEXT,
    resolved INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS exception_queue (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('baggage_delay','special_assistance','facility_fault','complaint_escalation','mis_assignment','other')),
    priority TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'open' CHECK(status IN ('open','processing','resolved','closed')),
    assigned_to_id TEXT,
    description TEXT,
    resolution TEXT,
    escalated INTEGER DEFAULT 0,
    escalated_to TEXT,
    arrived INTEGER DEFAULT 0,
    arrived_at TEXT,
    assistance_recorded INTEGER DEFAULT 0,
    transferred INTEGER DEFAULT 0,
    compensation_provided INTEGER DEFAULT 0,
    passenger_confirmed INTEGER DEFAULT 0,
    reviewed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sla_rules (
    id TEXT PRIMARY KEY,
    service_type TEXT NOT NULL,
    priority TEXT NOT NULL,
    response_time INTEGER NOT NULL,
    resolution_time INTEGER NOT NULL,
    escalation_time INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS service_queues (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    terminal TEXT,
    area TEXT,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
  CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at);
  CREATE INDEX IF NOT EXISTS idx_tickets_flight ON tickets(flight_id);
  CREATE INDEX IF NOT EXISTS idx_ticket_logs_ticket ON ticket_logs(ticket_id);
  CREATE INDEX IF NOT EXISTS idx_exception_status ON exception_queue(status);
`);

const alterColumns = [
  'ALTER TABLE exception_queue ADD COLUMN arrived INTEGER DEFAULT 0',
  'ALTER TABLE exception_queue ADD COLUMN arrived_at TEXT',
  'ALTER TABLE exception_queue ADD COLUMN assistance_recorded INTEGER DEFAULT 0',
  'ALTER TABLE exception_queue ADD COLUMN transferred INTEGER DEFAULT 0',
  'ALTER TABLE exception_queue ADD COLUMN compensation_provided INTEGER DEFAULT 0',
  'ALTER TABLE exception_queue ADD COLUMN passenger_confirmed INTEGER DEFAULT 0',
  'ALTER TABLE exception_queue ADD COLUMN reviewed INTEGER DEFAULT 0',
];
for (const sql of alterColumns) {
  try { db.exec(sql); } catch (e) {}
}

function count(table) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getCurrentShift() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return '早班';
  if (hour >= 14 && hour < 22) return '中班';
  return '晚班';
}

function calculateSLAdeadline(priority, serviceType) {
  const rules = {
    critical: { response: 5, resolution: 30 },
    urgent: { response: 10, resolution: 60 },
    normal: { response: 30, resolution: 120 },
    low: { response: 60, resolution: 240 }
  };
  const rule = rules[priority] || rules.normal;
  const deadline = new Date(Date.now() + rule.response * 60 * 1000);
  return deadline.toISOString();
}

function seed() {
  if (count('users') === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, role, name, phone, area, shift, queue)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    [
      ['u-admin', 'admin', '机场总值班', '010-1000', 'T3', '白班', '管理组'],
      ['u-cs-1', 'cs', '李晓', '010-1001', '值机区', '早班', '值机服务队列'],
      ['u-cs-2', 'cs', '王晨', '010-1002', '登机口', '中班', '登机口服务队列'],
      ['u-cs-3', 'cs', '张悦', '010-1006', '到达厅', '晚班', '行李服务队列'],
      ['u-staff-1', 'staff', '赵航', '010-1003', '行李区', '白班', '行李服务队列'],
      ['u-staff-2', 'staff', '周宁', '010-1004', '安检区', '晚班', '安检服务队列'],
      ['u-staff-3', 'staff', '陈璐', '010-1005', '服务台', '早班', '问讯服务队列'],
      ['u-staff-4', 'staff', '林洋', '010-1007', 'T1航站楼', '中班', '特殊旅客队列'],
      ['u-op-1', 'operation', '郑凯', '010-1008', '运营中心', '白班', '运营调度'],
      ['u-op-2', 'operation', '黄丽', '010-1009', '运营中心', '晚班', '投诉处理队列']
    ].forEach((row) => insertUser.run(...row));
  }

  if (count('flights') === 0) {
    const insertFlight = db.prepare(`
      INSERT INTO flights (id, flight_no, airline, departure_time, arrival_time, terminal, gate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = Date.now();
    [
      ['f-1', 'CA1831', '中国国航', new Date(now + 2 * 3600 * 1000).toISOString(), new Date(now + 4 * 3600 * 1000).toISOString(), 'T3', 'C12', 'boarding'],
      ['f-2', 'MU5102', '东方航空', new Date(now + 3 * 3600 * 1000).toISOString(), new Date(now + 5 * 3600 * 1000).toISOString(), 'T2', 'B08', 'on-time'],
      ['f-3', 'CZ3105', '南方航空', new Date(now - 30 * 60 * 1000).toISOString(), new Date(now + 2 * 3600 * 1000).toISOString(), 'T2', 'D03', 'delayed'],
      ['f-4', 'HU7601', '海南航空', new Date(now + 4 * 3600 * 1000).toISOString(), new Date(now + 7 * 3600 * 1000).toISOString(), 'T1', 'A05', 'boarding'],
      ['f-5', 'CA982', '中国国航', new Date(now - 2 * 3600 * 1000).toISOString(), new Date(now + 1 * 3600 * 1000).toISOString(), 'T3', 'E21', 'arrived'],
      ['f-6', 'SC1156', '山东航空', new Date(now + 5 * 3600 * 1000).toISOString(), new Date(now + 7 * 3600 * 1000).toISOString(), 'T1', 'A18', 'on-time']
    ].forEach((row) => insertFlight.run(...row));
  }

  if (count('service_queues') === 0) {
    const insertQueue = db.prepare(`
      INSERT INTO service_queues (id, name, terminal, area, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    [
      ['q-1', '值机服务队列', 'T1/T2/T3', '值机区', '值机、选座、行李托运相关'],
      ['q-2', '登机口服务队列', 'T1/T2/T3', '登机口', '登机、特殊旅客引导'],
      ['q-3', '行李服务队列', 'T1/T2/T3', '行李区', '行李提取、行李延误、破损'],
      ['q-4', '问讯服务队列', 'T1/T2/T3', '服务台', '问路、信息查询'],
      ['q-5', '安检服务队列', 'T1/T2/T3', '安检区', '安检相关协助'],
      ['q-6', '特殊旅客队列', 'T1/T2/T3', '全区域', '轮椅、无人陪伴、婴儿'],
      ['q-7', '投诉处理队列', '运营中心', '全区域', '旅客投诉处理'],
      ['q-8', '设施故障队列', '运营中心', '全区域', '设施设备故障报修']
    ].forEach((row) => insertQueue.run(...row));
  }

  if (count('sla_rules') === 0) {
    const insertSLA = db.prepare(`
      INSERT INTO sla_rules (id, service_type, priority, response_time, resolution_time, escalation_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const types = ['轮椅协助', '行李咨询', '延误解释', '投诉处理', '设施报修', '特殊旅客', '问讯服务', '其他'];
    const priorities = ['critical', 'urgent', 'normal', 'low'];
    let idx = 0;
    for (const type of types) {
      for (const priority of priorities) {
        const times = {
          critical: [5, 30, 15],
          urgent: [10, 60, 30],
          normal: [30, 120, 60],
          low: [60, 240, 120]
        };
        const t = times[priority];
        insertSLA.run(`sla-${idx++}`, type, priority, t[0], t[1], t[2]);
      }
    }
  }

  if (count('tickets') === 0) {
    const insertTicket = db.prepare(`
      INSERT INTO tickets (id, flight_id, passenger_name, passenger_phone, passenger_id_card,
        terminal, area, seat_no, service_type, service_category, priority, description,
        status, assigned_to_id, assigned_at, accepted_at, arrived_at, completed_at,
        sla_deadline, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertLog = db.prepare(`
      INSERT INTO ticket_logs (id, ticket_id, action, detail, operator_id, operator_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const now = Date.now();

    const tickets = [
      {
        id: 't-1',
        flightId: 'f-1',
        passengerName: '张女士',
        phone: '13800000001',
        idCard: '110101199001011234',
        terminal: 'T3',
        area: 'C12登机口',
        seat: '32A',
        serviceType: '轮椅协助',
        category: '特殊旅客',
        priority: 'urgent',
        description: '腿部受伤，需要轮椅协助登机',
        status: 'processing',
        assignedTo: 'u-staff-4',
        assignedAt: new Date(now - 25 * 60 * 1000).toISOString(),
        acceptedAt: new Date(now - 20 * 60 * 1000).toISOString(),
        arrivedAt: new Date(now - 15 * 60 * 1000).toISOString(),
        completedAt: null,
        createdBy: 'u-cs-1',
        createdAt: new Date(now - 30 * 60 * 1000).toISOString()
      },
      {
        id: 't-2',
        flightId: 'f-3',
        passengerName: '刘先生',
        phone: '13800000002',
        idCard: '310101198505056789',
        terminal: 'T2',
        area: 'D03登机口',
        seat: '15C',
        serviceType: '延误解释',
        category: '航班服务',
        priority: 'normal',
        description: '航班延误2小时，需要了解具体原因和后续安排',
        status: 'assigned',
        assignedTo: 'u-cs-2',
        assignedAt: new Date(now - 15 * 60 * 1000).toISOString(),
        acceptedAt: null,
        arrivedAt: null,
        completedAt: null,
        createdBy: 'u-cs-2',
        createdAt: new Date(now - 20 * 60 * 1000).toISOString()
      },
      {
        id: 't-3',
        flightId: 'f-5',
        passengerName: 'Miller John',
        phone: '13800000003',
        idCard: 'AB1234567',
        terminal: 'T3',
        area: 'E21行李提取',
        seat: null,
        serviceType: '行李咨询',
        category: '行李服务',
        priority: 'normal',
        description: '国际航班到达，行李未出来，已等待40分钟',
        status: 'exception',
        assignedTo: 'u-staff-1',
        assignedAt: new Date(now - 60 * 60 * 1000).toISOString(),
        acceptedAt: new Date(now - 55 * 60 * 1000).toISOString(),
        arrivedAt: new Date(now - 50 * 60 * 1000).toISOString(),
        completedAt: null,
        createdBy: 'u-cs-3',
        createdAt: new Date(now - 70 * 60 * 1000).toISOString()
      },
      {
        id: 't-4',
        flightId: null,
        passengerName: '王奶奶',
        phone: '13800000004',
        idCard: '110101194501010011',
        terminal: 'T2',
        area: 'B03服务台',
        seat: null,
        serviceType: '问讯服务',
        category: '信息查询',
        priority: 'low',
        description: '找不到卫生间，需要指引',
        status: 'completed',
        assignedTo: 'u-staff-3',
        assignedAt: new Date(now - 120 * 60 * 1000).toISOString(),
        acceptedAt: new Date(now - 118 * 60 * 1000).toISOString(),
        arrivedAt: new Date(now - 115 * 60 * 1000).toISOString(),
        completedAt: new Date(now - 110 * 60 * 1000).toISOString(),
        createdBy: 'u-staff-3',
        createdAt: new Date(now - 125 * 60 * 1000).toISOString()
      },
      {
        id: 't-5',
        flightId: 'f-2',
        passengerName: '陈先生',
        phone: '13800000005',
        idCard: '440101199012123456',
        terminal: 'T2',
        area: 'B08登机口',
        seat: '8F',
        serviceType: '投诉处理',
        category: '服务投诉',
        priority: 'critical',
        description: '头等舱旅客，投诉地面服务态度恶劣，要求值班经理处理',
        status: 'exception',
        assignedTo: 'u-op-2',
        assignedAt: new Date(now - 45 * 60 * 1000).toISOString(),
        acceptedAt: new Date(now - 40 * 60 * 1000).toISOString(),
        arrivedAt: new Date(now - 35 * 60 * 1000).toISOString(),
        completedAt: null,
        createdBy: 'u-admin',
        createdAt: new Date(now - 50 * 60 * 1000).toISOString()
      }
    ];

    for (const t of tickets) {
      insertTicket.run(
        t.id, t.flightId, t.passengerName, t.phone, t.idCard,
        t.terminal, t.area, t.seat, t.serviceType, t.category, t.priority, t.description,
        t.status, t.assignedTo, t.assignedAt, t.acceptedAt, t.arrivedAt, t.completedAt,
        calculateSLAdeadline(t.priority, t.serviceType), t.createdBy, t.createdAt
      );

      insertLog.run(generateId('log'), t.id, 'create', '工单创建', t.createdBy, '系统');
      if (t.assignedTo) {
        insertLog.run(generateId('log'), t.id, 'assign', `派单给 ${t.assignedTo}`, t.createdBy, '系统');
      }
    }

    const insertException = db.prepare(`
      INSERT INTO exception_queue (id, ticket_id, type, priority, status, assigned_to_id, description, escalated, escalated_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertException.run(
      'ex-1', 't-3', 'baggage_delay', 'urgent', 'processing', 'u-staff-1',
      'CA982航班到达旅客行李延误，已联系行李查询', 0, null
    );
    insertException.run(
      'ex-2', 't-5', 'complaint_escalation', 'critical', 'processing', 'u-op-2',
      '头等舱旅客投诉服务态度，已升级至值班经理', 1, 'u-admin'
    );

    const insertAssistance = db.prepare(`
      INSERT INTO ticket_assistance (id, ticket_id, arrival_time, assistance_content, assistance_duration, passenger_confirmation, confirmed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAssistance.run(
      'ta-1', 't-4', new Date(now - 115 * 60 * 1000).toISOString(),
      '指引旅客至最近卫生间，并告知航班信息显示屏位置', 5, 1, new Date(now - 110 * 60 * 1000).toISOString()
    );

    const insertFeedback = db.prepare(`
      INSERT INTO feedbacks (id, ticket_id, call_time, caller_id, satisfaction, feedback_text, resolved)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertFeedback.run(
      'fb-1', 't-4', new Date(now - 90 * 60 * 1000).toISOString(),
      'u-cs-1', 5, '服务人员态度很好，指引清晰', 1
    );

    const updateTicket = db.prepare(`UPDATE tickets SET satisfaction_score = 5 WHERE id = 't-4'`);
    updateTicket.run();
  }
}

seed();

const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, '..', 'backend.log'), { flags: 'a' });

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.on('finish', () => {
    accessLogStream.write(`${new Date().toISOString()} ${req.method} ${req.url} ${res.statusCode}\n`);
  });
  next();
});

function addTicketLog(ticketId, action, detail, operatorId, operatorName) {
  const stmt = db.prepare(`
    INSERT INTO ticket_logs (id, ticket_id, action, detail, operator_id, operator_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    generateId('log'), 
    ticketId, 
    action, 
    detail || null, 
    operatorId || null, 
    operatorName || null
  );
}

function assignTicketByRules(ticketId, terminal, area, serviceType, priority) {
  const currentShift = getCurrentShift();
  const queueMap = {
    '值机服务': '值机服务队列',
    '行李咨询': '行李服务队列',
    '行李服务': '行李服务队列',
    '轮椅协助': '特殊旅客队列',
    '特殊旅客': '特殊旅客队列',
    '登机口': '登机口服务队列',
    '问讯服务': '问讯服务队列',
    '投诉处理': '投诉处理队列',
    '设施报修': '设施故障队列'
  };

  const targetQueue = queueMap[serviceType] || Object.values(queueMap).find(q => serviceType.includes(q.replace('队列', ''))) || '问讯服务队列';

  const user = db.prepare(`
    SELECT u.id, u.name, u.queue, COUNT(t.id) as ticket_count
    FROM users u
    LEFT JOIN tickets t ON t.assigned_to_id = u.id AND t.status IN ('assigned','processing')
    WHERE (u.queue = ? OR u.area LIKE ?)
      AND u.status = 'online'
      AND (u.shift = ? OR u.shift = '白班')
    GROUP BY u.id
    ORDER BY ticket_count ASC, u.id ASC
    LIMIT 1
  `).get(targetQueue, `%${area}%`, currentShift);

  if (user) {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE tickets
      SET assigned_to_id = ?, assigned_at = ?, sla_deadline = ?, status = 'assigned'
      WHERE id = ?
    `).run(user.id, now, calculateSLAdeadline(priority, serviceType), ticketId);

    addTicketLog(ticketId, 'assign', `自动派单给 ${user.name} (${user.queue})`, 'system', '系统');
    return user;
  }
  return null;
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: 'connected',
    users: count('users'),
    flights: count('flights'),
    tickets: count('tickets'),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/dashboard', (req, res) => {
  const staffByRole = db.prepare(`
    SELECT role, COUNT(*) AS count
    FROM users
    GROUP BY role
    ORDER BY role
  `).all();

  const flights = db.prepare(`
    SELECT
      id,
      flight_no AS flightNo,
      airline,
      terminal,
      gate,
      status,
      departure_time AS departureTime,
      arrival_time AS arrivalTime
    FROM flights
    ORDER BY departure_time ASC
    LIMIT 10
  `).all();

  const tickets = db.prepare(`
    SELECT
      t.id,
      t.passenger_name AS passengerName,
      t.service_type AS serviceType,
      t.status,
      t.priority,
      t.created_at AS createdAt,
      t.terminal,
      t.area,
      f.flight_no AS flightNo,
      COALESCE(u.name, '未分配') AS assignedTo
    FROM tickets t
    LEFT JOIN flights f ON f.id = t.flight_id
    LEFT JOIN users u ON u.id = t.assigned_to_id
    ORDER BY t.created_at DESC
    LIMIT 10
  `).all();

  const statusCounts = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM tickets
    GROUP BY status
  `).all();

  const priorityCounts = db.prepare(`
    SELECT priority, COUNT(*) AS count
    FROM tickets
    GROUP BY priority
  `).all();

  const totalStaff = staffByRole.reduce((sum, item) => sum + item.count, 0);
  const customerService = staffByRole.filter((item) => item.role === 'cs').reduce((sum, item) => sum + item.count, 0);
  const pendingCount = statusCounts.find(s => s.status === 'pending')?.count || 0;
  const processingCount = statusCounts.find(s => s.status === 'processing')?.count || 0;
  const completedCount = statusCounts.find(s => s.status === 'completed')?.count || 0;
  const exceptionCount = statusCounts.find(s => s.status === 'exception')?.count || 0;

  res.json({
    success: true,
    data: {
      summary: {
        totalStaff,
        customerService,
        activeFlights: flights.filter((item) => item.status !== 'landed' && item.status !== 'arrived').length,
        openTickets: count('tickets'),
        pendingTickets: pendingCount,
        processingTickets: processingCount,
        completedTickets: completedCount,
        exceptionTickets: exceptionCount,
      },
      staffByRole,
      statusCounts,
      priorityCounts,
      flights,
      tickets,
    },
  });
});

app.get('/api/users', (req, res) => {
  const { role, queue, status } = req.query;
  let sql = `
    SELECT id, role, name, phone, area, shift, queue, status, created_at AS createdAt
    FROM users WHERE 1=1
  `;
  const params = [];
  if (role) { sql += ' AND role = ?'; params.push(role); }
  if (queue) { sql += ' AND queue LIKE ?'; params.push(`%${queue}%`); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY role, name';
  const users = db.prepare(sql).all(...params);
  res.json({ success: true, data: users });
});

app.get('/api/flights', (req, res) => {
  const { flightNo, terminal, status } = req.query;
  let sql = `
    SELECT
      id, flight_no AS flightNo, airline, terminal, gate, status,
      departure_time AS departureTime, arrival_time AS arrivalTime
    FROM flights WHERE 1=1
  `;
  const params = [];
  if (flightNo) { sql += ' AND flight_no LIKE ?'; params.push(`%${flightNo}%`); }
  if (terminal) { sql += ' AND terminal = ?'; params.push(terminal); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY departure_time ASC LIMIT 50';
  const flights = db.prepare(sql).all(...params);
  res.json({ success: true, data: flights });
});

app.get('/api/flights/:id', (req, res) => {
  const flight = db.prepare(`
    SELECT
      id, flight_no AS flightNo, airline, terminal, gate, status,
      departure_time AS departureTime, arrival_time AS arrivalTime
    FROM flights WHERE id = ?
  `).get(req.params.id);
  if (!flight) return res.status(404).json({ success: false, message: '航班不存在' });
  res.json({ success: true, data: flight });
});

app.get('/api/tickets', (req, res) => {
  const { status, priority, terminal, serviceType, assignedTo, flightNo, passengerName, page = 1, pageSize = 20 } = req.query;
  
  let countSql = `SELECT COUNT(*) AS total FROM tickets t LEFT JOIN flights f ON f.id = t.flight_id WHERE 1=1`;
  let dataSql = `
    SELECT
      t.id,
      t.flight_id AS flightId,
      t.passenger_name AS passengerName,
      t.passenger_phone AS passengerPhone,
      t.terminal,
      t.area,
      t.service_type AS serviceType,
      t.service_category AS serviceCategory,
      t.priority,
      t.status,
      t.description,
      t.assigned_to_id AS assignedToId,
      t.assigned_at AS assignedAt,
      t.accepted_at AS acceptedAt,
      t.arrived_at AS arrivedAt,
      t.completed_at AS completedAt,
      t.sla_deadline AS slaDeadline,
      t.is_exception AS isException,
      t.exception_type AS exceptionType,
      t.satisfaction_score AS satisfactionScore,
      t.created_at AS createdAt,
      t.updated_at AS updatedAt,
      f.flight_no AS flightNo,
      COALESCE(u.name, '未分配') AS assignedToName
    FROM tickets t
    LEFT JOIN flights f ON f.id = t.flight_id
    LEFT JOIN users u ON u.id = t.assigned_to_id
    WHERE 1=1
  `;
  
  const params = [];
  const countParams = [];
  
  if (status) { dataSql += ' AND t.status = ?'; countSql += ' AND t.status = ?'; params.push(status); countParams.push(status); }
  if (priority) { dataSql += ' AND t.priority = ?'; countSql += ' AND t.priority = ?'; params.push(priority); countParams.push(priority); }
  if (terminal) { dataSql += ' AND t.terminal = ?'; countSql += ' AND t.terminal = ?'; params.push(terminal); countParams.push(terminal); }
  if (serviceType) { dataSql += ' AND t.service_type LIKE ?'; countSql += ' AND t.service_type LIKE ?'; params.push(`%${serviceType}%`); countParams.push(`%${serviceType}%`); }
  if (assignedTo) { dataSql += ' AND t.assigned_to_id = ?'; countSql += ' AND t.assigned_to_id = ?'; params.push(assignedTo); countParams.push(assignedTo); }
  if (flightNo) { dataSql += ' AND f.flight_no LIKE ?'; countSql += ' AND f.flight_no LIKE ?'; params.push(`%${flightNo}%`); countParams.push(`%${flightNo}%`); }
  if (passengerName) { dataSql += ' AND t.passenger_name LIKE ?'; countSql += ' AND t.passenger_name LIKE ?'; params.push(`%${passengerName}%`); countParams.push(`%${passengerName}%`); }
  
  const offset = (page - 1) * pageSize;
  dataSql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), offset);
  
  const { total } = db.prepare(countSql).get(...countParams);
  const tickets = db.prepare(dataSql).all(...params);
  
  res.json({ success: true, data: { tickets, total, page: Number(page), pageSize: Number(pageSize) } });
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = db.prepare(`
    SELECT
      t.id,
      t.flight_id AS flightId,
      t.passenger_name AS passengerName,
      t.passenger_phone AS passengerPhone,
      t.passenger_id_card AS passengerIdCard,
      t.terminal,
      t.area,
      t.seat_no AS seatNo,
      t.service_type AS serviceType,
      t.service_category AS serviceCategory,
      t.priority,
      t.status,
      t.description,
      t.assigned_to_id AS assignedToId,
      t.assigned_at AS assignedAt,
      t.accepted_at AS acceptedAt,
      t.arrived_at AS arrivedAt,
      t.completed_at AS completedAt,
      t.sla_deadline AS slaDeadline,
      t.is_exception AS isException,
      t.exception_type AS exceptionType,
      t.satisfaction_score AS satisfactionScore,
      t.satisfaction_feedback AS satisfactionFeedback,
      t.created_by AS createdBy,
      t.created_at AS createdAt,
      t.updated_at AS updatedAt,
      f.flight_no AS flightNo,
      f.airline,
      f.departure_time AS departureTime,
      f.arrival_time AS arrivalTime,
      f.gate,
      u.name AS assignedToName,
      u.role AS assignedToRole,
      u.phone AS assignedToPhone,
      u.queue AS assignedToQueue
    FROM tickets t
    LEFT JOIN flights f ON f.id = t.flight_id
    LEFT JOIN users u ON u.id = t.assigned_to_id
    WHERE t.id = ?
  `).get(req.params.id);
  
  if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
  
  const logs = db.prepare(`
    SELECT id, action, detail, operator_id AS operatorId, operator_name AS operatorName, created_at AS createdAt
    FROM ticket_logs WHERE ticket_id = ? ORDER BY created_at DESC
  `).all(req.params.id);
  
  const attachments = db.prepare(`
    SELECT id, file_name AS fileName, file_path AS filePath, file_size AS fileSize, mime_type AS mimeType, created_at AS createdAt
    FROM ticket_attachments WHERE ticket_id = ? ORDER BY created_at DESC
  `).all(req.params.id);
  
  const transfers = db.prepare(`
    SELECT
      tt.id,
      tt.from_user_id AS fromUserId,
      tt.to_user_id AS toUserId,
      tt.from_queue AS fromQueue,
      tt.to_queue AS toQueue,
      tt.reason,
      tt.operator_id AS operatorId,
      tt.created_at AS createdAt,
      fu.name AS fromUserName,
      tu.name AS toUserName
    FROM ticket_transfers tt
    LEFT JOIN users fu ON fu.id = tt.from_user_id
    LEFT JOIN users tu ON tu.id = tt.to_user_id
    WHERE tt.ticket_id = ? ORDER BY tt.created_at DESC
  `).all(req.params.id);
  
  const assistance = db.prepare(`
    SELECT
      id, arrival_time AS arrivalTime, assistance_content AS assistanceContent,
      assistance_duration AS assistanceDuration, tools_used AS toolsUsed,
      cross_department AS crossDepartment, compensation_offered AS compensationOffered,
      passenger_confirmation AS passengerConfirmation, confirmed_at AS confirmedAt
    FROM ticket_assistance WHERE ticket_id = ?
  `).get(req.params.id);
  
  const compensation = db.prepare(`
    SELECT id, type, amount, description, status, approved_by AS approvedBy, approved_at AS approvedAt, created_at AS createdAt
    FROM compensations WHERE ticket_id = ? ORDER BY created_at DESC
  `).all(req.params.id);
  
  const feedback = db.prepare(`
    SELECT id, call_time AS callTime, caller_id AS callerId, satisfaction, feedback_text AS feedbackText, follow_up_needed AS followUpNeeded, follow_up_detail AS followUpDetail, resolved, created_at AS createdAt
    FROM feedbacks WHERE ticket_id = ?
  `).get(req.params.id);
  
  res.json({
    success: true,
    data: { ticket, logs, attachments, transfers, assistance, compensation, feedback }
  });
});

app.post('/api/tickets', (req, res) => {
  const {
    flightId, passengerName, passengerPhone, passengerIdCard,
    terminal, area, seatNo, serviceType, serviceCategory,
    priority, description, createdBy
  } = req.body;
  
  if (!passengerName || !passengerPhone || !terminal || !area || !serviceType || !description) {
    return res.status(400).json({ success: false, message: '必填项缺失' });
  }
  
  const ticketId = generateId('t');
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO tickets (
      id, flight_id, passenger_name, passenger_phone, passenger_id_card,
      terminal, area, seat_no, service_type, service_category, priority,
      description, status, sla_deadline, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ticketId, flightId || null, passengerName, passengerPhone, passengerIdCard || null,
    terminal, area, seatNo || null, serviceType, serviceCategory || null, priority || 'normal',
    description, 'pending', calculateSLAdeadline(priority || 'normal', serviceType),
    createdBy || 'u-cs-1', now, now
  );
  
  addTicketLog(ticketId, 'create', `创建工单，服务类型：${serviceType}`, createdBy || 'u-cs-1', '客服');
  
  const assignedUser = assignTicketByRules(ticketId, terminal, area, serviceType, priority || 'normal');
  
  res.json({
    success: true,
    data: { ticketId, assignedTo: assignedUser || null, status: assignedUser ? 'assigned' : 'pending' }
  });
});

app.put('/api/tickets/:id/assign', (req, res) => {
  const { userId, operatorId, operatorName } = req.body;
  const { id } = req.params;
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(400).json({ success: false, message: '用户不存在' });
  
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE tickets SET assigned_to_id = ?, assigned_at = ?, status = 'assigned', updated_at = ?
    WHERE id = ?
  `).run(userId, now, now, id);
  
  addTicketLog(id, 'assign', `手动派单给 ${user.name}`, operatorId || 'u-admin', operatorName || '管理员');
  
  res.json({ success: true, message: '派单成功' });
});

app.put('/api/tickets/:id/accept', (req, res) => {
  const { operatorId, operatorName } = req.body;
  const { id } = req.params;
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
  if (ticket.status !== 'assigned') {
    return res.status(400).json({ success: false, message: '工单状态不允许接单' });
  }
  
  const now = new Date().toISOString();
  db.prepare(`UPDATE tickets SET status = 'processing', accepted_at = ?, updated_at = ? WHERE id = ?`)
    .run(now, now, id);
  
  addTicketLog(id, 'accept', '工作人员已接单', operatorId, operatorName);
  
  res.json({ success: true, message: '接单成功' });
});

app.put('/api/tickets/:id/arrive', (req, res) => {
  const { operatorId, operatorName } = req.body;
  const { id } = req.params;
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
  if (ticket.status !== 'processing') {
    return res.status(400).json({ success: false, message: '工单状态不允许登记到场' });
  }
  
  const now = new Date().toISOString();
  db.prepare(`UPDATE tickets SET arrived_at = ?, updated_at = ? WHERE id = ?`).run(now, now, id);
  
  db.prepare(`
    INSERT OR IGNORE INTO ticket_assistance (id, ticket_id, arrival_time)
    VALUES (?, ?, ?)
  `).run(generateId('ta'), id, now);
  
  addTicketLog(id, 'arrive', '工作人员已到达现场', operatorId, operatorName);
  
  res.json({ success: true, message: '到场登记成功' });
});

app.put('/api/tickets/:id/assist', (req, res) => {
  const { assistanceContent, assistanceDuration, toolsUsed, crossDepartment, compensationOffered, operatorId, operatorName } = req.body;
  const { id } = req.params;
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
  
  const existing = db.prepare('SELECT * FROM ticket_assistance WHERE ticket_id = ?').get(id);
  const now = new Date().toISOString();
  
  if (existing) {
    db.prepare(`
      UPDATE ticket_assistance SET
        assistance_content = ?, assistance_duration = ?, tools_used = ?,
        cross_department = ?, compensation_offered = ?
      WHERE ticket_id = ?
    `).run(assistanceContent, assistanceDuration || null, toolsUsed || null, crossDepartment || null, compensationOffered || null, id);
  } else {
    db.prepare(`
      INSERT INTO ticket_assistance (id, ticket_id, assistance_content, assistance_duration, tools_used, cross_department, compensation_offered, arrival_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(generateId('ta'), id, assistanceContent, assistanceDuration || null, toolsUsed || null, crossDepartment || null, compensationOffered || null, now);
  }
  
  addTicketLog(id, 'assist', `更新协助内容：${assistanceContent?.substring(0, 50)}`, operatorId, operatorName);
  
  res.json({ success: true, message: '协助内容已保存' });
});

app.put('/api/tickets/:id/confirm', (req, res) => {
  const { signature, operatorId, operatorName } = req.body;
  const { id } = req.params;
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
  
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE ticket_assistance SET passenger_confirmation = 1, confirmed_at = ?, signature = ?
    WHERE ticket_id = ?
  `).run(now, signature || null, id);
  
  addTicketLog(id, 'confirm', '旅客已确认服务完成', operatorId, operatorName);
  
  res.json({ success: true, message: '旅客确认成功' });
});

app.put('/api/tickets/:id/complete', (req, res) => {
  const { operatorId, operatorName } = req.body;
  const { id } = req.params;
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
  if (!['processing', 'transferred'].includes(ticket.status)) {
    return res.status(400).json({ success: false, message: '工单状态不允许完成' });
  }
  
  const now = new Date().toISOString();
  db.prepare(`UPDATE tickets SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?`)
    .run(now, now, id);
  
  addTicketLog(id, 'complete', '工单已完成', operatorId, operatorName);
  
  res.json({ success: true, message: '工单已完成' });
});

app.put('/api/tickets/:id/transfer', (req, res) => {
  const { toUserId, toQueue, reason, operatorId, operatorName } = req.body;
  const { id } = req.params;
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
  
  const toUser = db.prepare('SELECT * FROM users WHERE id = ?').get(toUserId);
  if (!toUser) return res.status(400).json({ success: false, message: '目标用户不存在' });
  
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO ticket_transfers (id, ticket_id, from_user_id, to_user_id, from_queue, to_queue, reason, operator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(generateId('tf'), id, ticket.assigned_to_id, toUserId, null, toQueue || null, reason || null, operatorId);
  
  db.prepare(`
    UPDATE tickets SET assigned_to_id = ?, assigned_at = ?, status = 'assigned', updated_at = ?
    WHERE id = ?
  `).run(toUserId, now, now, id);
  
  addTicketLog(id, 'transfer', `转交给 ${toUser.name}，原因：${reason || '无'}`, operatorId, operatorName);
  
  res.json({ success: true, message: '转交成功' });
});

app.put('/api/tickets/:id/exception', (req, res) => {
  const { type, priority, description, operatorId, operatorName } = req.body;
  const { id } = req.params;
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
  
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT OR REPLACE INTO exception_queue (id, ticket_id, type, priority, status, description, created_at)
    VALUES (
      COALESCE((SELECT id FROM exception_queue WHERE ticket_id = ?), ?),
      ?, ?, ?, 'open', ?, ?
    )
  `).run(id, generateId('ex'), id, type, priority || 'normal', description || null, now);
  
  db.prepare(`UPDATE tickets SET status = 'exception', is_exception = 1, exception_type = ?, updated_at = ? WHERE id = ?`)
    .run(type, now, id);
  
  addTicketLog(id, 'exception', `加入异常队列，类型：${type}`, operatorId, operatorName);
  
  res.json({ success: true, message: '已加入异常队列' });
});

app.put('/api/tickets/:id/escalate', (req, res) => {
  const { escalatedTo, operatorId, operatorName } = req.body;
  const { id } = req.params;
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
  
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE exception_queue SET escalated = 1, escalated_to = ? WHERE ticket_id = ?
  `).run(escalatedTo || 'u-admin', id);
  
  db.prepare(`UPDATE tickets SET priority = 'critical', updated_at = ? WHERE id = ?`).run(now, id);
  
  addTicketLog(id, 'escalate', `已升级处理，升级至：${escalatedTo || '值班经理'}`, operatorId, operatorName);
  
  res.json({ success: true, message: '升级成功' });
});

app.post('/api/tickets/:id/feedback', (req, res) => {
  const { callerId, satisfaction, feedbackText, followUpNeeded, followUpDetail, resolved } = req.body;
  const { id } = req.params;
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
  
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT OR REPLACE INTO feedbacks (id, ticket_id, call_time, caller_id, satisfaction, feedback_text, follow_up_needed, follow_up_detail, resolved, created_at)
    VALUES (
      COALESCE((SELECT id FROM feedbacks WHERE ticket_id = ?), ?),
      ?, ?, ?, ?, ?, ?, ?, ?
    )
  `).run(id, generateId('fb'), id, now, callerId || 'u-cs-1', satisfaction, feedbackText || null, followUpNeeded ? 1 : 0, followUpDetail || null, resolved ? 1 : 1, now);
  
  if (satisfaction) {
    db.prepare(`UPDATE tickets SET satisfaction_score = ?, satisfaction_feedback = ?, status = 'closed', updated_at = ? WHERE id = ?`)
      .run(satisfaction, feedbackText || null, now, id);
  }
  
  addTicketLog(id, 'feedback', `旅客回访完成，满意度：${satisfaction}分`, callerId || 'u-cs-1', '客服');
  
  res.json({ success: true, message: '回访记录已保存' });
});

app.post('/api/tickets/:id/compensation', (req, res) => {
  const { type, amount, description, operatorId, operatorName } = req.body;
  const { id } = req.params;
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
  
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO compensations (id, ticket_id, type, amount, description, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(generateId('cp'), id, type, amount || null, description || null, now);
  
  addTicketLog(id, 'compensation', `提交补偿方案：${type}，金额：${amount || '协商'}`, operatorId, operatorName);
  
  res.json({ success: true, message: '补偿方案已提交' });
});

app.post('/api/tickets/:id/upload', upload.array('files', 10), (req, res) => {
  const { id } = req.params;
  const { operatorId, operatorName } = req.body;
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
  
  const attachments = [];
  for (const file of req.files || []) {
    const attId = generateId('att');
    db.prepare(`
      INSERT INTO ticket_attachments (id, ticket_id, file_name, file_path, file_size, mime_type, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(attId, id, file.originalname, file.path, file.size, file.mimetype, operatorId || 'u-cs-1');
    attachments.push({ id: attId, fileName: file.originalname, fileSize: file.size });
  }
  
  addTicketLog(id, 'upload', `上传附件 ${attachments.length} 个`, operatorId || 'u-cs-1', operatorName || '客服');
  
  res.json({ success: true, data: attachments });
});

app.get('/api/exception-queue', (req, res) => {
  const { status, type, priority } = req.query;
  let sql = `
    SELECT
      eq.id, eq.ticket_id AS ticketId, eq.type, eq.priority, eq.status,
      eq.description, eq.assigned_to_id AS assignedToId, eq.escalated,
      eq.escalated_to AS escalatedTo, eq.created_at AS createdAt, eq.resolved_at AS resolvedAt,
      eq.arrived, eq.arrived_at AS arrivedAt, eq.assistance_recorded AS assistanceRecorded,
      eq.transferred, eq.compensation_provided AS compensationProvided,
      eq.passenger_confirmed AS passengerConfirmed, eq.reviewed,
      t.passenger_name AS passengerName, t.service_type AS serviceType, t.terminal, t.area,
      t.flight_id AS flightId, f.flight_no AS flightNo,
      t.satisfaction_score AS satisfactionScore,
      COALESCE(u.name, '未分配') AS assignedToName
    FROM exception_queue eq
    LEFT JOIN tickets t ON t.id = eq.ticket_id
    LEFT JOIN flights f ON f.id = t.flight_id
    LEFT JOIN users u ON u.id = eq.assigned_to_id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND eq.status = ?'; params.push(status); }
  if (type) { sql += ' AND eq.type = ?'; params.push(type); }
  if (priority) { sql += ' AND eq.priority = ?'; params.push(priority); }
  sql += ' ORDER BY eq.created_at DESC';
  
  const items = db.prepare(sql).all(...params);
  res.json({ success: true, data: items });
});

app.put('/api/exception-queue/:id/resolve', (req, res) => {
  const { id } = req.params;
  const {
    resolution,
    operatorId,
    operatorName,
    arrived,
    arrivalTime,
    assistanceContent,
    transferred,
    transferTo,
    transferReason,
    compensationType,
    compensationAmount,
    compensationDetail,
    passengerConfirmed,
    confirmationMethod,
    passengerSignature,
    reviewNote,
    satisfactionScore,
  } = req.body;
  
  const item = db.prepare('SELECT * FROM exception_queue WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ success: false, message: '异常记录不存在' });
  
  const now = new Date().toISOString();
  const ticketId = item.ticket_id;
  
  const actions = [];
  
  if (arrived && arrivalTime) {
    db.prepare(`UPDATE tickets SET arrived_at = ?, updated_at = ? WHERE id = ?`).run(arrivalTime, now, ticketId);
    addTicketLog(ticketId, 'arrive', `异常处理到场：${arrivalTime}`, operatorId, operatorName);
    actions.push('到场登记');
  }
  
  if (assistanceContent) {
    const assistId = generateId('ta');
    const existing = db.prepare('SELECT * FROM ticket_assistance WHERE ticket_id = ?').get(ticketId);
    if (existing) {
      db.prepare(`
        UPDATE ticket_assistance SET assistance_content = ?, arrival_time = COALESCE(arrival_time, ?)
        WHERE ticket_id = ?
      `).run(assistanceContent, arrivalTime || now, ticketId);
    } else {
      db.prepare(`
        INSERT INTO ticket_assistance (id, ticket_id, assistance_content, arrival_time)
        VALUES (?, ?, ?, ?)
      `).run(assistId, ticketId, assistanceContent, arrivalTime || now);
    }
    addTicketLog(ticketId, 'assist', `协助记录：${assistanceContent}`, operatorId, operatorName);
    actions.push('协助记录');
  }
  
  if (transferred && transferTo) {
    const transferId = generateId('trans');
    db.prepare(`
      INSERT INTO ticket_transfers (id, ticket_id, from_user_id, to_user_id, reason, operator_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(transferId, ticketId, operatorId, transferTo, transferReason || '异常处理转交', operatorId, now);
    addTicketLog(ticketId, 'transfer', `转交给 ${transferTo}：${transferReason || '异常处理转交'}`, operatorId, operatorName);
    actions.push('跨部门转交');
  }
  
  if (compensationType && compensationType !== 'none') {
    const compId = generateId('comp');
    db.prepare(`
      INSERT INTO compensations (id, ticket_id, type, amount, description, status, approved_by, approved_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(compId, ticketId, compensationType, compensationAmount || 0, compensationDetail || '', 'approved', operatorId, now, now);
    addTicketLog(ticketId, 'compensation', `补偿方案：${compensationType} ${compensationAmount ? '金额' + compensationAmount : ''} ${compensationDetail || ''}`, operatorId, operatorName);
    actions.push('补偿方案');
  }
  
  if (passengerConfirmed) {
    const assistExisting = db.prepare('SELECT * FROM ticket_assistance WHERE ticket_id = ?').get(ticketId);
    if (assistExisting) {
      db.prepare(`
        UPDATE ticket_assistance SET passenger_confirmation = 1, confirmed_at = ?
        WHERE ticket_id = ?
      `).run(now, ticketId);
    } else {
      db.prepare(`
        INSERT INTO ticket_assistance (id, ticket_id, passenger_confirmation, confirmed_at)
        VALUES (?, ?, 1, ?)
      `).run(generateId('ta'), ticketId, now);
    }
    addTicketLog(ticketId, 'confirm', `旅客确认：${confirmationMethod || 'manual'} ${passengerSignature ? '，签名：' + passengerSignature : ''}`, operatorId, operatorName);
    actions.push('旅客确认');
  }
  
  if (satisfactionScore) {
    db.prepare(`UPDATE tickets SET satisfaction_score = ?, updated_at = ? WHERE id = ?`).run(satisfactionScore, now, ticketId);
    addTicketLog(ticketId, 'satisfaction', `满意度评分：${satisfactionScore}分`, operatorId, operatorName);
    actions.push('满意度评价');
  }
  
  if (reviewNote) {
    addTicketLog(ticketId, 'review', `复查记录：${reviewNote}`, operatorId, operatorName);
    actions.push('复查记录');
  }
  
  db.prepare(`
    UPDATE exception_queue
    SET status = 'resolved', resolution = ?, resolved_at = ?,
        arrived = ?, arrived_at = ?, assistance_recorded = ?, transferred = ?,
        compensation_provided = ?, passenger_confirmed = ?, reviewed = ?
    WHERE id = ?
  `).run(
    resolution || null, now,
    arrived ? 1 : 0, arrivalTime || null,
    assistanceContent ? 1 : 0,
    transferred ? 1 : 0,
    compensationType ? 1 : 0,
    passengerConfirmed ? 1 : 0,
    reviewNote ? 1 : 0,
    id
  );
  
  db.prepare(`UPDATE tickets SET status = 'completed', updated_at = ? WHERE id = ?`).run(now, ticketId);
  
  const actionSummary = actions.length > 0 ? `处理环节：${actions.join(' → ')}` : '';
  addTicketLog(ticketId, 'resolve', `异常已解决：${resolution || '无'} ${actionSummary}`, operatorId, operatorName);
  
  res.json({ success: true, message: '异常已解决', data: { actions } });
});

app.get('/api/reports/summary', (req, res) => {
  const { startDate, endDate } = req.query;
  const params = [];
  const ticketWhere = [];
  const exceptionWhere = [];
  const feedbackWhere = [];
  
  if (startDate && endDate) {
    ticketWhere.push('t.created_at BETWEEN ? AND ?');
    exceptionWhere.push('eq.created_at BETWEEN ? AND ?');
    feedbackWhere.push('f.created_at BETWEEN ? AND ?');
    params.push(startDate, endDate, startDate, endDate, startDate, endDate);
  }
  
  const ticketWhereStr = ticketWhere.length > 0 ? 'WHERE ' + ticketWhere.join(' AND ') : '';
  const exceptionWhereStr = exceptionWhere.length > 0 ? 'WHERE ' + exceptionWhere.join(' AND ') : '';
  const feedbackWhereStr = feedbackWhere.length > 0 ? 'WHERE ' + feedbackWhere.join(' AND ') : '';
  const ticketAndStr = ticketWhere.length > 0 ? 'AND ' + ticketWhere.join(' AND ').replace(/t\./g, '') : '';
  
  const total = db.prepare(`SELECT COUNT(*) AS count FROM tickets t ${ticketWhereStr}`).get(...params.slice(0, 2)).count;
  const completed = db.prepare(`SELECT COUNT(*) AS count FROM tickets t WHERE status IN ('completed','closed') ${ticketAndStr}`).get(...params.slice(0, 2)).count;
  
  const exceptionStats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status IN ('open','processing') THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN status IN ('resolved','closed') THEN 1 ELSE 0 END) AS resolved
    FROM exception_queue eq
    ${exceptionWhereStr}
  `).get(...params.slice(2, 4));
  const exception = exceptionStats.active || 0;
  const exceptionResolved = exceptionStats.resolved || 0;
  
  const slaStats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN strftime('%s', COALESCE(accepted_at, assigned_at)) - strftime('%s', created_at) <= 900 THEN 1 ELSE 0 END) AS withinSLA,
      SUM(CASE WHEN strftime('%s', COALESCE(accepted_at, assigned_at)) - strftime('%s', created_at) > 900 THEN 1 ELSE 0 END) AS overdue,
      AVG(CASE WHEN strftime('%s', COALESCE(accepted_at, assigned_at)) - strftime('%s', created_at) > 900
               THEN strftime('%s', COALESCE(accepted_at, assigned_at)) - strftime('%s', created_at) - 900
               ELSE 0 END) AS avgOverdueSeconds
    FROM tickets t
    WHERE (accepted_at IS NOT NULL OR assigned_at IS NOT NULL)
    ${ticketAndStr}
  `).get(...params.slice(0, 2));
  
  const escalatedCount = db.prepare(`
    SELECT COUNT(*) AS count FROM exception_queue eq
    WHERE escalated = 1
    ${exceptionWhereStr.replace('WHERE', 'AND')}
  `).get(...params.slice(2, 4)).count || 0;
  
  const byServiceType = db.prepare(`
    SELECT service_type AS serviceType, COUNT(*) AS count
    FROM tickets t ${ticketWhereStr}
    GROUP BY service_type ORDER BY count DESC LIMIT 10
  `).all(...params.slice(0, 2));
  
  const byStatus = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM tickets t ${ticketWhereStr}
    GROUP BY status
  `).all(...params.slice(0, 2));
  
  const byPriority = db.prepare(`
    SELECT priority, COUNT(*) AS count
    FROM tickets t ${ticketWhereStr}
    GROUP BY priority
  `).all(...params.slice(0, 2));
  
  const byTerminal = db.prepare(`
    SELECT terminal, COUNT(*) AS count
    FROM tickets t ${ticketWhereStr}
    GROUP BY terminal ORDER BY count DESC
  `).all(...params.slice(0, 2));
  
  const byArea = db.prepare(`
    SELECT area, COUNT(*) AS count
    FROM tickets t ${ticketWhereStr}
    GROUP BY area ORDER BY count DESC LIMIT 10
  `).all(...params.slice(0, 2));
  
  const byQueue = db.prepare(`
    SELECT
      COALESCE(sq.name, '未分配') AS queueName,
      COUNT(*) AS count
    FROM tickets t
    LEFT JOIN users u ON u.id = t.assigned_to_id
    LEFT JOIN service_queues sq ON sq.id = u.queue
    ${ticketWhereStr}
    GROUP BY sq.id ORDER BY count DESC LIMIT 8
  `).all(...params.slice(0, 2));
  
  const byShift = db.prepare(`
    SELECT
      COALESCE(u.shift, '未分配') AS shift,
      COUNT(*) AS count
    FROM tickets t
    LEFT JOIN users u ON u.id = t.assigned_to_id
    ${ticketWhereStr}
    GROUP BY u.shift ORDER BY count DESC
  `).all(...params.slice(0, 2));
  
  const byExceptionType = db.prepare(`
    SELECT type, COUNT(*) AS count
    FROM exception_queue eq
    ${exceptionWhereStr}
    GROUP BY type ORDER BY count DESC
  `).all(...params.slice(2, 4));
  
  const avgSatisfaction = db.prepare(`
    SELECT AVG(satisfaction_score) AS avg
    FROM tickets t
    WHERE satisfaction_score IS NOT NULL
    ${ticketAndStr}
  `).get(...params.slice(0, 2)).avg || 0;
  
  const satisfactionDistribution = db.prepare(`
    SELECT
      satisfaction_score AS score,
      COUNT(*) AS count
    FROM tickets t
    WHERE satisfaction_score IS NOT NULL
    ${ticketAndStr}
    GROUP BY satisfaction_score ORDER BY satisfaction_score DESC
  `).all(...params.slice(0, 2));
  
  const feedbackStats = db.prepare(`
    SELECT
      COUNT(*) AS totalCalls,
      SUM(CASE WHEN follow_up_needed = 1 THEN 1 ELSE 0 END) AS followUpNeeded,
      AVG(satisfaction) AS avgSatisfaction
    FROM feedbacks f
    ${feedbackWhereStr}
  `).get(...params.slice(4, 6));
  
  const responseTimes = db.prepare(`
    SELECT
      t.id,
      strftime('%s', COALESCE(t.accepted_at, t.assigned_at)) - strftime('%s', t.created_at) AS response_seconds
    FROM tickets t
    WHERE t.accepted_at IS NOT NULL OR t.assigned_at IS NOT NULL
    ${ticketAndStr}
    LIMIT 1000
  `).all(...params.slice(0, 2));
  
  const avgResponse = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((s, r) => s + (r.response_seconds || 0), 0) / responseTimes.length)
    : 0;
  
  const responseTimeDistribution = [
    { label: '15分钟内', min: 0, max: 900, count: 0 },
    { label: '15-30分钟', min: 900, max: 1800, count: 0 },
    { label: '30-60分钟', min: 1800, max: 3600, count: 0 },
    { label: '1小时以上', min: 3600, max: Infinity, count: 0 },
  ];
  responseTimes.forEach(rt => {
    const sec = rt.response_seconds || 0;
    for (const bucket of responseTimeDistribution) {
      if (sec >= bucket.min && sec < bucket.max) {
        bucket.count++;
        break;
      }
    }
  });
  
  const resolutionTimes = db.prepare(`
    SELECT
      t.id,
      strftime('%s', t.completed_at) - strftime('%s', t.created_at) AS resolution_seconds
    FROM tickets t
    WHERE t.completed_at IS NOT NULL
    ${ticketAndStr}
    LIMIT 1000
  `).all(...params.slice(0, 2));
  
  const avgResolution = resolutionTimes.length > 0
    ? Math.round(resolutionTimes.reduce((s, r) => s + (r.resolution_seconds || 0), 0) / resolutionTimes.length)
    : 0;
  
  const flightIssues = db.prepare(`
    SELECT
      f.flight_no AS flightNo,
      f.airline,
      COUNT(t.id) AS ticketCount
    FROM flights f
    LEFT JOIN tickets t ON t.flight_id = f.id
    ${ticketWhereStr.replace('WHERE', 'AND t.')}
    GROUP BY f.id
    HAVING ticketCount > 0
    ORDER BY ticketCount DESC LIMIT 10
  `).all(...params.slice(0, 2));
  
  const staffPerformance = db.prepare(`
    SELECT
      u.id,
      u.name,
      u.role,
      COUNT(t.id) AS ticketCount,
      AVG(CASE WHEN t.completed_at IS NOT NULL
               THEN strftime('%s', t.completed_at) - strftime('%s', t.created_at)
               ELSE NULL END) AS avgResolutionSeconds,
      AVG(t.satisfaction_score) AS avgSatisfaction
    FROM users u
    LEFT JOIN tickets t ON t.assigned_to_id = u.id
    ${ticketWhereStr.replace('WHERE', 'AND t.')}
    WHERE u.role IN ('staff','cs','operation')
    GROUP BY u.id
    ORDER BY ticketCount DESC LIMIT 10
  `).all(...params.slice(0, 2));
  
  res.json({
    success: true,
    data: {
      totalTickets: total,
      completedTickets: completed,
      exceptionTickets: exception,
      exceptionResolvedTickets: exceptionResolved,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      avgResponseSeconds: avgResponse,
      avgResolutionSeconds: avgResolution,
      slaComplianceRate: slaStats.total > 0 ? Math.round((slaStats.withinSLA / slaStats.total) * 100) : 0,
      slaOverdueCount: slaStats.overdue || 0,
      avgOverdueSeconds: Math.round(slaStats.avgOverdueSeconds || 0),
      escalatedCount,
      totalFeedbackCalls: feedbackStats.totalCalls || 0,
      followUpNeededCount: feedbackStats.followUpNeeded || 0,
      feedbackAvgSatisfaction: Math.round((feedbackStats.avgSatisfaction || 0) * 10) / 10,
      byServiceType,
      byStatus,
      byPriority,
      byTerminal,
      byArea,
      byQueue,
      byShift,
      byExceptionType,
      satisfactionDistribution,
      responseTimeDistribution,
      flightIssues,
      staffPerformance,
    }
  });
});

app.get('/api/service-queues', (req, res) => {
  const queues = db.prepare(`SELECT id, name, terminal, area, description FROM service_queues ORDER BY name`).all();
  res.json({ success: true, data: queues });
});

app.get('/api/sla-rules', (req, res) => {
  const rules = db.prepare(`SELECT id, service_type AS serviceType, priority, response_time AS responseTime, resolution_time AS resolutionTime, escalation_time AS escalationTime FROM sla_rules`).all();
  res.json({ success: true, data: rules });
});

app.use('/api/uploads', express.static(uploadDir));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API not found',
    path: req.path,
    method: req.method,
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  accessLogStream.write(`${new Date().toISOString()} ERROR ${req.method} ${req.url} ${err.message}\n`);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Airport service backend running on http://${HOST}:${PORT}`);
  console.log(`Frontend URL: http://127.0.0.1:${FRONTEND_PORT}`);
});
