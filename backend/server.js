require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const PROJECT_DIR = path.resolve(__dirname, '..');
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '43448');
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '53448');

function checkPort(port) {
  const { execSync } = require('child_process');
  try {
    const pid = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t | head -n1`).toString().trim();
    if (pid) {
      try {
        const cwd = execSync(`lsof -a -p ${pid} -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1`).toString().trim();
        const cmd = execSync(`ps -o command= -p ${pid}`).toString().trim();
        if (cwd.startsWith(PROJECT_DIR)) {
          console.log(`端口 ${port} 被当前项目进程占用，PID: ${pid}，正在终止...`);
          execSync(`kill ${pid}`);
          return true;
        } else {
          console.log(`端口 ${port} 被外部进程占用: PID=${pid}, cwd=${cwd}, cmd=${cmd}`);
          return false;
        }
      } catch (e) {
        console.log(`端口 ${port} 占用信息无法确认，尝试使用备用端口`);
        return false;
      }
    }
    return true;
  } catch (e) {
    return true;
  }
}

function findAvailablePort(basePort, slot) {
  const slots = [0, 1000, 2000, 3000, 4000, 5000];
  const tail4 = basePort % 10000;
  for (let i = slot; i < slots.length; i++) {
    const port = 40000 + slots[i] + tail4;
    const backendPort = 50000 + slots[i] + tail4;
    const frontendOk = checkPort(port);
    const backendOk = checkPort(backendPort);
    if (frontendOk && backendOk) {
      return { frontendPort: port, backendPort, slot: i };
    }
  }
  return null;
}

const tail4 = BACKEND_PORT % 10000;
const frontendBase = FRONTEND_PORT - tail4;
const backendBase = BACKEND_PORT - tail4;
const currentSlot = Math.floor((frontendBase - 40000) / 1000);

const ports = findAvailablePort(tail4, currentSlot);
if (!ports) {
  console.error('所有端口槽位均被占用，无法启动！');
  console.error('请手动释放端口或检查占用进程');
  process.exit(1);
}

if (ports.frontendPort !== FRONTEND_PORT || ports.backendPort !== BACKEND_PORT) {
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(/FRONTEND_PORT=\d+/, `FRONTEND_PORT=${ports.frontendPort}`);
  envContent = envContent.replace(/BACKEND_PORT=\d+/, `BACKEND_PORT=${ports.backendPort}`);
  envContent = envContent.replace(/API_BASE_URL=http:\/\/127\.0\.0\.1:\d+\/api/, `API_BASE_URL=http://127.0.0.1:${ports.backendPort}/api`);
  envContent = envContent.replace(/VITE_API_BASE_URL=http:\/\/127\.0\.0\.1:\d+\/api/, `VITE_API_BASE_URL=http://127.0.0.1:${ports.backendPort}/api`);
  fs.writeFileSync(envPath, envContent);
  process.env.FRONTEND_PORT = String(ports.frontendPort);
  process.env.BACKEND_PORT = String(ports.backendPort);
  process.env.API_BASE_URL = `http://127.0.0.1:${ports.backendPort}/api`;
  process.env.VITE_API_BASE_URL = `http://127.0.0.1:${ports.backendPort}/api`;
  console.log(`端口已切换至备用槽位 ${ports.slot}: FRONTEND=${ports.frontendPort}, BACKEND=${ports.backendPort}`);
}

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
if (!fs.existsSync(dbPath)) {
  console.log('数据库不存在，正在初始化...');
  require('./init-db.js');
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const columns = db.prepare('PRAGMA table_info(platforms)').all().map(c => c.name);
const needColumns = ['license_expiry_date', 'suspension_reason', 'rectification_requirement', 'rectification_result', 'audit_remark', 'audit_time', 'latest_audit_user'];
needColumns.forEach(col => {
  if (!columns.includes(col)) {
    db.exec(`ALTER TABLE platforms ADD COLUMN ${col} TEXT`);
  }
});

db.exec(`CREATE TABLE IF NOT EXISTS platform_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform_id INTEGER,
  operation TEXT,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  operator TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
)`);

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '53448');

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT}`, `http://localhost:${process.env.FRONTEND_PORT}`],
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined'));

function logOperation(userType, userId, userName, operation, moduleName, recordId, detail, ip) {
  try {
    db.prepare(`
      INSERT INTO operation_logs (user_type, user_id, user_name, operation, module, record_id, detail, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userType, userId, userName, operation, moduleName, recordId, detail, ip || '127.0.0.1');
  } catch (e) {
    console.error('日志记录失败:', e);
  }
}

function buildCountQuery(query) {
  const lowerQ = query.toLowerCase();
  let mainFromIdx = -1;
  let depth = 0;
  for (let i = 0; i < lowerQ.length - 5; i++) {
    if (lowerQ[i] === '(') depth++;
    else if (lowerQ[i] === ')') depth--;
    else if (depth === 0 && lowerQ.substring(i, i + 6) === ' from ') {
      mainFromIdx = i;
    }
  }
  if (mainFromIdx === -1) return query;
  const rest = query.substring(mainFromIdx + 6);
  let fromClause = rest;
  const orderIdx = fromClause.toLowerCase().indexOf('order by');
  if (orderIdx !== -1) fromClause = fromClause.substring(0, orderIdx);
  return 'SELECT COUNT(*) as total FROM ' + fromClause;
}

function paginate(req, query, params = []) {
  const page = parseInt(req.query.page || 1);
  const pageSize = parseInt(req.query.pageSize || 20);
  const offset = (page - 1) * pageSize;

  const countQuery = buildCountQuery(query);
  const total = db.prepare(countQuery).get(...params).total;

  const dataQuery = query + ' LIMIT ? OFFSET ?';
  const data = db.prepare(dataQuery).all(...params, pageSize, offset);

  return {
    list: data,
    total
  };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/platforms', (req, res) => {
  try {
    const { status, name, licenseNo } = req.query;
    let query = `SELECT p.*,
      (SELECT COUNT(*) FROM drivers WHERE platform_id = p.id) as driver_count,
      (SELECT COUNT(*) FROM vehicles WHERE platform_id = p.id) as vehicle_count,
      (SELECT COUNT(*) FROM orders WHERE platform_id = p.id) as order_count
      FROM platforms p`;
    const params = [];
    const conditions = [];
    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }
    if (name) {
      conditions.push('p.name LIKE ?');
      params.push(`%${name}%`);
    }
    if (licenseNo) {
      conditions.push('p.license_no LIKE ?');
      params.push(`%${licenseNo}%`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY p.id DESC';
    const result = paginate(req, query, params);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/platforms/all', (req, res) => {
  try {
    const platforms = db.prepare('SELECT id, name, license_no, status FROM platforms ORDER BY id').all();
    res.json(platforms);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/platforms/:id', (req, res) => {
  try {
    const platform = db.prepare('SELECT * FROM platforms WHERE id = ?').get(req.params.id);
    if (!platform) {
      return res.status(404).json({ error: '平台不存在' });
    }
    const drivers = db.prepare('SELECT id, name, phone, id_card, driver_license_no, taxi_qualification_no, audit_status, driver_license_expiry_date, taxi_qualification_expiry_date FROM drivers WHERE platform_id = ? ORDER BY audit_status, name').all(req.params.id);
    const vehicles = db.prepare('SELECT id, plate_no, vehicle_license_no, operation_license_no, audit_status, vehicle_license_expiry_date, operation_license_expiry_date FROM vehicles WHERE platform_id = ? ORDER BY audit_status, plate_no').all(req.params.id);
    const orders = db.prepare('SELECT o.id, o.platform_order_no, d.name as driver_name, o.pickup_address, o.dropoff_address, o.pickup_time, o.total_amount, o.anomaly_tags, o.is_checked FROM orders o LEFT JOIN drivers d ON o.driver_id = d.id WHERE o.platform_id = ? ORDER BY o.pickup_time DESC LIMIT 20').all(req.params.id);
    const complaints = db.prepare('SELECT c.id, c.complaint_no, c.complaint_type, c.complainant_name, c.complaint_time, c.status, c.complaint_content FROM complaints c WHERE c.platform_id = ? ORDER BY c.complaint_time DESC LIMIT 20').all(req.params.id);
    const cases = db.prepare('SELECT cs.id, cs.case_no, cs.case_type, d.name as driver_name, cs.initial_fine_amount, cs.status, cs.created_at FROM enforcement_cases cs LEFT JOIN drivers d ON cs.driver_id = d.id WHERE cs.platform_id = ? ORDER BY cs.created_at DESC LIMIT 20').all(req.params.id);
    const logs = db.prepare('SELECT * FROM platform_logs WHERE platform_id = ? ORDER BY created_at DESC LIMIT 50').all(req.params.id);
    res.json({ ...platform, drivers, vehicles, orders, complaints, cases, logs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/platforms', (req, res) => {
  try {
    const { name, license_no, contact_person, contact_phone, address, status } = req.body;
    const result = db.prepare(`
      INSERT INTO platforms (name, license_no, contact_person, contact_phone, address, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, license_no, contact_person, contact_phone, address, status || 'active');
    logOperation('admin', 1, '系统管理员', '创建', 'platforms', result.lastInsertRowid,
      JSON.stringify(req.body), req.ip);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/platforms/:id', (req, res) => {
  try {
    const { name, license_no, contact_person, contact_phone, address, status, license_expiry_date, suspension_reason, rectification_requirement, rectification_result, audit_remark } = req.body;
    const oldPlatform = db.prepare('SELECT * FROM platforms WHERE id = ?').get(req.params.id);
    if (!oldPlatform) {
      return res.status(404).json({ error: '平台不存在' });
    }
    const result = db.prepare(`
      UPDATE platforms SET 
        name=?, license_no=?, contact_person=?, contact_phone=?, address=?, status=?, 
        license_expiry_date=?, suspension_reason=?, rectification_requirement=?, 
        rectification_result=?, audit_remark=?, audit_time=CURRENT_TIMESTAMP, latest_audit_user='系统管理员',
        updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(name, license_no, contact_person, contact_phone, address, status, 
      license_expiry_date, suspension_reason, rectification_requirement, 
      rectification_result, audit_remark, req.params.id);
    
    const logFields = ['name', 'license_no', 'contact_person', 'contact_phone', 'address', 'status', 
      'license_expiry_date', 'suspension_reason', 'rectification_requirement', 
      'rectification_result', 'audit_remark'];
    const insertLog = db.prepare('INSERT INTO platform_logs (platform_id, operation, field_name, old_value, new_value, operator) VALUES (?, ?, ?, ?, ?, ?)');
    logFields.forEach(field => {
      const oldVal = String(oldPlatform[field] || '');
      const newVal = String(req.body[field] || '');
      if (oldVal !== newVal) {
        insertLog.run(req.params.id, 'update', field, oldVal, newVal, '系统管理员');
      }
    });
    
    logOperation('admin', 1, '系统管理员', '更新', 'platforms', parseInt(req.params.id),
      JSON.stringify(req.body), req.ip);
    res.json({ id: req.params.id, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/drivers', (req, res) => {
  try {
    const platform_id = req.query.platformId || req.query.platform_id;
    const audit_status = req.query.auditStatus || req.query.audit_status;
    const keyword = req.query.keyword;
    let query = `SELECT d.*, p.name as platform_name
      FROM drivers d LEFT JOIN platforms p ON d.platform_id = p.id WHERE 1=1`;
    const params = [];
    if (platform_id) {
      query += ' AND d.platform_id = ?';
      params.push(platform_id);
    }
    if (audit_status) {
      query += ' AND d.audit_status = ?';
      params.push(audit_status);
    }
    if (keyword) {
      query += ' AND (d.name LIKE ? OR d.id_card LIKE ? OR d.phone LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    query += ' ORDER BY d.id DESC';
    const result = paginate(req, query, params);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/drivers/:id', (req, res) => {
  try {
    const driver = db.prepare(`
      SELECT d.*, p.name as platform_name FROM drivers d
      LEFT JOIN platforms p ON d.platform_id = p.id WHERE d.id = ?
    `).get(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: '司机不存在' });
    }
    const vehicles = db.prepare(`
      SELECT v.*, dvb.bind_date, dvb.status as bind_status
      FROM vehicles v INNER JOIN driver_vehicle_bind dvb ON v.id = dvb.vehicle_id
      WHERE dvb.driver_id = ? AND dvb.status = 'active'
    `).all(req.params.id);
    const orders = db.prepare('SELECT * FROM orders WHERE driver_id = ? ORDER BY pickup_time DESC LIMIT 10').all(req.params.id);
    const complaints = db.prepare('SELECT * FROM complaints WHERE driver_id = ? ORDER BY complaint_time DESC LIMIT 10').all(req.params.id);
    const cases = db.prepare('SELECT * FROM enforcement_cases WHERE driver_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id);
    res.json({ ...driver, vehicles, orders, complaints, cases });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/drivers', (req, res) => {
  try {
    const { name, id_card, phone, driver_license_no, driver_license_type,
      driver_license_issue_date, driver_license_expiry_date, taxi_qualification_no,
      taxi_qualification_issue_date, taxi_qualification_expiry_date, platform_id,
      audit_status, audit_remark } = req.body;
    const result = db.prepare(`
      INSERT INTO drivers (name, id_card, phone, driver_license_no, driver_license_type,
        driver_license_issue_date, driver_license_expiry_date, taxi_qualification_no,
        taxi_qualification_issue_date, taxi_qualification_expiry_date, platform_id,
        audit_status, audit_remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, id_card, phone, driver_license_no, driver_license_type,
      driver_license_issue_date, driver_license_expiry_date, taxi_qualification_no,
      taxi_qualification_issue_date, taxi_qualification_expiry_date, platform_id,
      audit_status || 'pending', audit_remark);
    logOperation('admin', 1, '系统管理员', '创建', 'drivers', result.lastInsertRowid,
      `创建司机档案: ${name}`, req.ip);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/drivers/:id', (req, res) => {
  try {
    const { name, id_card, phone, driver_license_no, driver_license_type,
      driver_license_issue_date, driver_license_expiry_date, taxi_qualification_no,
      taxi_qualification_issue_date, taxi_qualification_expiry_date, platform_id,
      audit_status, audit_remark } = req.body;
    const audit_time = audit_status && audit_status !== 'pending' ? new Date().toISOString() : null;
    const result = db.prepare(`
      UPDATE drivers SET name=?, id_card=?, phone=?, driver_license_no=?, driver_license_type=?,
        driver_license_issue_date=?, driver_license_expiry_date=?, taxi_qualification_no=?,
        taxi_qualification_issue_date=?, taxi_qualification_expiry_date=?, platform_id=?,
        audit_status=?, audit_remark=?, audit_time=COALESCE(?, audit_time), updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(name, id_card, phone, driver_license_no, driver_license_type,
      driver_license_issue_date, driver_license_expiry_date, taxi_qualification_no,
      taxi_qualification_issue_date, taxi_qualification_expiry_date, platform_id,
      audit_status, audit_remark, audit_time, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '司机不存在' });
    }
    logOperation('admin', 1, '系统管理员', '更新', 'drivers', parseInt(req.params.id),
      `更新司机档案，状态: ${audit_status}`, req.ip);
    res.json({ id: req.params.id, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/drivers/:id/audit', (req, res) => {
  try {
    const { audit_status, audit_remark } = req.body;
    const result = db.prepare(`
      UPDATE drivers SET audit_status=?, audit_remark=?, audit_time=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(audit_status, audit_remark, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '司机不存在' });
    }
    logOperation('admin', 1, '系统管理员', '审核', 'drivers', parseInt(req.params.id),
      `司机审核结果: ${audit_status} - ${audit_remark}`, req.ip);
    res.json({ success: true, audit_status, audit_remark });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/vehicles', (req, res) => {
  try {
    const platform_id = req.query.platformId || req.query.platform_id;
    const audit_status = req.query.auditStatus || req.query.audit_status;
    const keyword = req.query.keyword;
    let query = `SELECT v.*, p.name as platform_name
      FROM vehicles v LEFT JOIN platforms p ON v.platform_id = p.id WHERE 1=1`;
    const params = [];
    if (platform_id) {
      query += ' AND v.platform_id = ?';
      params.push(platform_id);
    }
    if (audit_status) {
      query += ' AND v.audit_status = ?';
      params.push(audit_status);
    }
    if (keyword) {
      query += ' AND (v.plate_no LIKE ? OR v.owner_name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    query += ' ORDER BY v.id DESC';
    const result = paginate(req, query, params);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/vehicles/:id', (req, res) => {
  try {
    const vehicle = db.prepare(`
      SELECT v.*, p.name as platform_name FROM vehicles v
      LEFT JOIN platforms p ON v.platform_id = p.id WHERE v.id = ?
    `).get(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: '车辆不存在' });
    }
    const drivers = db.prepare(`
      SELECT d.*, dvb.bind_date, dvb.status as bind_status
      FROM drivers d INNER JOIN driver_vehicle_bind dvb ON d.id = dvb.driver_id
      WHERE dvb.vehicle_id = ? AND dvb.status = 'active'
    `).all(req.params.id);
    const orders = db.prepare('SELECT * FROM orders WHERE vehicle_id = ? ORDER BY pickup_time DESC LIMIT 10').all(req.params.id);
    res.json({ ...vehicle, drivers, orders });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/vehicles', (req, res) => {
  try {
    const { plate_no, vehicle_type, color, brand, model, register_date,
      vehicle_license_no, vehicle_license_expiry_date, operation_license_no,
      operation_license_expiry_date, insurance_expiry_date, annual_inspection_expiry_date,
      platform_id, owner_name, owner_phone, audit_status, audit_remark } = req.body;
    const result = db.prepare(`
      INSERT INTO vehicles (plate_no, vehicle_type, color, brand, model, register_date,
        vehicle_license_no, vehicle_license_expiry_date, operation_license_no,
        operation_license_expiry_date, insurance_expiry_date, annual_inspection_expiry_date,
        platform_id, owner_name, owner_phone, audit_status, audit_remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(plate_no, vehicle_type, color, brand, model, register_date,
      vehicle_license_no, vehicle_license_expiry_date, operation_license_no,
      operation_license_expiry_date, insurance_expiry_date, annual_inspection_expiry_date,
      platform_id, owner_name, owner_phone, audit_status || 'pending', audit_remark);
    logOperation('admin', 1, '系统管理员', '创建', 'vehicles', result.lastInsertRowid,
      `创建车辆档案: ${plate_no}`, req.ip);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/vehicles/:id', (req, res) => {
  try {
    const { plate_no, vehicle_type, color, brand, model, register_date,
      vehicle_license_no, vehicle_license_expiry_date, operation_license_no,
      operation_license_expiry_date, insurance_expiry_date, annual_inspection_expiry_date,
      platform_id, owner_name, owner_phone, audit_status, audit_remark } = req.body;
    const audit_time = audit_status && audit_status !== 'pending' ? new Date().toISOString() : null;
    const result = db.prepare(`
      UPDATE vehicles SET plate_no=?, vehicle_type=?, color=?, brand=?, model=?, register_date=?,
        vehicle_license_no=?, vehicle_license_expiry_date=?, operation_license_no=?,
        operation_license_expiry_date=?, insurance_expiry_date=?, annual_inspection_expiry_date=?,
        platform_id=?, owner_name=?, owner_phone=?, audit_status=?, audit_remark=?,
        audit_time=COALESCE(?, audit_time), updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(plate_no, vehicle_type, color, brand, model, register_date,
      vehicle_license_no, vehicle_license_expiry_date, operation_license_no,
      operation_license_expiry_date, insurance_expiry_date, annual_inspection_expiry_date,
      platform_id, owner_name, owner_phone, audit_status, audit_remark, audit_time, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '车辆不存在' });
    }
    logOperation('admin', 1, '系统管理员', '更新', 'vehicles', parseInt(req.params.id),
      `更新车辆档案: ${plate_no}`, req.ip);
    res.json({ id: req.params.id, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/vehicles/:id/audit', (req, res) => {
  try {
    const { audit_status, audit_remark } = req.body;
    const result = db.prepare(`
      UPDATE vehicles SET audit_status=?, audit_remark=?, audit_time=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(audit_status, audit_remark, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '车辆不存在' });
    }
    logOperation('admin', 1, '系统管理员', '审核', 'vehicles', parseInt(req.params.id),
      `车辆审核结果: ${audit_status}`, req.ip);
    res.json({ success: true, audit_status, audit_remark });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/driver-vehicle-bind', (req, res) => {
  try {
    const { driver_id, vehicle_id, platform_id } = req.body;
    const result = db.prepare(`
      INSERT INTO driver_vehicle_bind (driver_id, vehicle_id, platform_id, bind_date, status)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'active')
    `).run(driver_id, vehicle_id, platform_id);
    logOperation('admin', 1, '系统管理员', '绑定', 'driver_vehicle_bind', result.lastInsertRowid,
      `司机 ${driver_id} 绑定车辆 ${vehicle_id}`, req.ip);
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/driver-vehicle-bind/:id/unbind', (req, res) => {
  try {
    const result = db.prepare(`
      UPDATE driver_vehicle_bind SET status='inactive', unbind_date=CURRENT_TIMESTAMP WHERE id=?
    `).run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '绑定记录不存在' });
    }
    logOperation('admin', 1, '系统管理员', '解绑', 'driver_vehicle_bind', parseInt(req.params.id),
      `解绑记录`, req.ip);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/orders', (req, res) => {
  try {
    const platform_id = req.query.platformId || req.query.platform_id;
    const driver_id = req.query.driverId || req.query.driver_id;
    const is_checked = req.query.checked !== undefined ? req.query.checked : req.query.is_checked;
    const anomaly = req.query.abnormal || req.query.anomaly;
    const keyword = req.query.keyword;
    const start_date = req.query.startDate || req.query.start_date;
    const end_date = req.query.endDate || req.query.end_date;
    let query = `SELECT o.*, p.name as platform_name, d.name as driver_name, d.id_card as driver_id_card,
      v.plate_no, d.audit_status as driver_audit_status
      FROM orders o
      LEFT JOIN platforms p ON o.platform_id = p.id
      LEFT JOIN drivers d ON o.driver_id = d.id
      LEFT JOIN vehicles v ON o.vehicle_id = v.id
      WHERE 1=1`;
    const params = [];
    if (platform_id) {
      query += ' AND o.platform_id = ?';
      params.push(platform_id);
    }
    if (driver_id) {
      query += ' AND o.driver_id = ?';
      params.push(driver_id);
    }
    if (is_checked !== undefined) {
      query += ' AND o.is_checked = ?';
      params.push(parseInt(is_checked));
    }
    if (anomaly) {
      query += " AND o.anomaly_tags IS NOT NULL AND o.anomaly_tags != ''";
    }
    if (keyword) {
      query += ' AND (o.platform_order_no LIKE ? OR o.pickup_address LIKE ? OR o.dropoff_address LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (start_date) {
      query += ' AND o.pickup_time >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND o.pickup_time <= ?';
      params.push(end_date);
    }
    query += ' ORDER BY o.pickup_time DESC';
    const result = paginate(req, query, params);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.*, p.name as platform_name, d.name as driver_name, d.phone as driver_phone,
        d.id_card as driver_id_card, v.plate_no, v.brand, v.model
      FROM orders o
      LEFT JOIN platforms p ON o.platform_id = p.id
      LEFT JOIN drivers d ON o.driver_id = d.id
      LEFT JOIN vehicles v ON o.vehicle_id = v.id
      WHERE o.id = ?
    `).get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    if (order.trajectory_points) {
      try {
        order.trajectory_points = JSON.parse(order.trajectory_points);
      } catch (e) {}
    }
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/orders/:id/check', (req, res) => {
  try {
    const { check_result, check_remark } = req.body;
    const result = db.prepare(`
      UPDATE orders SET is_checked=1, checked_time=CURRENT_TIMESTAMP WHERE id=?
    `).run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }
    logOperation('admin', 1, '系统管理员', '抽查', 'orders', parseInt(req.params.id),
      `订单抽查结果: ${check_result}`, req.ip);
    res.json({ success: true, check_result, check_remark });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/orders/:id/create-workorder', (req, res) => {
  try {
    const { work_order_type, title, description, violation_rule_id, priority } = req.body;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    const workOrderNo = `WO${Date.now()}`;
    const result = db.prepare(`
      INSERT INTO work_orders (work_order_no, source, source_id, work_order_type, title, description,
        driver_id, vehicle_id, platform_id, order_id, violation_rule_id, priority, status)
      VALUES (?, 'order_check', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(workOrderNo, req.params.id, work_order_type, title, description,
      order.driver_id, order.vehicle_id, order.platform_id, req.params.id,
      violation_rule_id, priority || 'normal');
    logOperation('admin', 1, '系统管理员', '创建工单', 'work_orders', result.lastInsertRowid,
      `从订单 ${req.params.id} 创建工单`, req.ip);
    res.json({ id: result.lastInsertRowid, work_order_no: workOrderNo });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/compliance-rules', (req, res) => {
  try {
    const { rule_type, is_active } = req.query;
    let query = 'SELECT * FROM compliance_rules WHERE 1=1';
    const params = [];
    if (rule_type) {
      query += ' AND rule_type = ?';
      params.push(rule_type);
    }
    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(parseInt(is_active));
    }
    query += ' ORDER BY id';
    const rules = db.prepare(query).all(...params);
    res.json({ data: rules });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/complaints', (req, res) => {
  try {
    const status = req.query.status;
    const complaint_type = req.query.type || req.query.complaint_type;
    const keyword = req.query.keyword;
    let query = `SELECT c.*, p.name as platform_name, d.name as driver_name, v.plate_no,
      o.platform_order_no
      FROM complaints c
      LEFT JOIN platforms p ON c.platform_id = p.id
      LEFT JOIN drivers d ON c.driver_id = d.id
      LEFT JOIN vehicles v ON c.vehicle_id = v.id
      LEFT JOIN orders o ON c.order_id = o.id
      WHERE 1=1`;
    const params = [];
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    if (complaint_type) {
      query += ' AND c.complaint_type = ?';
      params.push(complaint_type);
    }
    if (keyword) {
      query += ' AND (c.complaint_no LIKE ? OR c.complainant_name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    query += ' ORDER BY c.complaint_time DESC';
    const result = paginate(req, query, params);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/complaints/:id', (req, res) => {
  try {
    const complaint = db.prepare(`
      SELECT c.*, p.name as platform_name, d.name as driver_name, v.plate_no, o.platform_order_no
      FROM complaints c
      LEFT JOIN platforms p ON c.platform_id = p.id
      LEFT JOIN drivers d ON c.driver_id = d.id
      LEFT JOIN vehicles v ON c.vehicle_id = v.id
      LEFT JOIN orders o ON c.order_id = o.id
      WHERE c.id = ?
    `).get(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: '投诉不存在' });
    }
    if (complaint.evidence_urls) {
      try {
        complaint.evidence_urls = JSON.parse(complaint.evidence_urls);
      } catch (e) {}
    }
    res.json(complaint);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/complaints', (req, res) => {
  try {
    const { order_id, driver_id, vehicle_id, platform_id, complainant_name,
      complainant_phone, complaint_type, complaint_content, evidence_urls } = req.body;
    const complaintNo = `COMP${Date.now()}`;
    const evidenceStr = evidence_urls ? JSON.stringify(evidence_urls) : null;
    const result = db.prepare(`
      INSERT INTO complaints (complaint_no, order_id, driver_id, vehicle_id, platform_id,
        complainant_name, complainant_phone, complaint_type, complaint_content,
        complaint_time, evidence_urls, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 'pending')
    `).run(complaintNo, order_id, driver_id, vehicle_id, platform_id,
      complainant_name, complainant_phone, complaint_type, complaint_content, evidenceStr);
    logOperation('admin', 1, '系统管理员', '创建', 'complaints', result.lastInsertRowid,
      `创建投诉: ${complaint_type}`, req.ip);
    res.json({ id: result.lastInsertRowid, complaint_no: complaintNo, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/complaints/:id/handle', (req, res) => {
  try {
    const { handler, handle_result } = req.body;
    const result = db.prepare(`
      UPDATE complaints SET status='resolved', handler=?, handle_result=?, handle_time=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(handler, handle_result, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '投诉不存在' });
    }
    logOperation('admin', 1, '系统管理员', '处理', 'complaints', parseInt(req.params.id),
      `投诉处理结果: ${handle_result}`, req.ip);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/complaints/:id/create-workorder', (req, res) => {
  try {
    const { work_order_type, title, description, violation_rule_id, priority } = req.body;
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: '投诉不存在' });
    }
    const workOrderNo = `WO${Date.now()}`;
    const result = db.prepare(`
      INSERT INTO work_orders (work_order_no, source, source_id, work_order_type, title, description,
        driver_id, vehicle_id, platform_id, order_id, complaint_id, violation_rule_id, priority, status)
      VALUES (?, 'complaint', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(workOrderNo, req.params.id, work_order_type, title, description,
      complaint.driver_id, complaint.vehicle_id, complaint.platform_id,
      complaint.order_id, req.params.id, violation_rule_id, priority || 'normal');
    logOperation('admin', 1, '系统管理员', '创建工单', 'work_orders', result.lastInsertRowid,
      `从投诉 ${req.params.id} 创建工单`, req.ip);
    res.json({ id: result.lastInsertRowid, work_order_no: workOrderNo });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/work-orders', (req, res) => {
  try {
    const status = req.query.status;
    const work_order_type = req.query.type || req.query.work_order_type;
    const priority = req.query.priority;
    const source = req.query.source;
    const assign_to = req.query.assignee || req.query.assign_to;
    let query = `SELECT w.*, p.name as platform_name, d.name as driver_name, v.plate_no,
      o.platform_order_no, c.complaint_no, r.rule_name
      FROM work_orders w
      LEFT JOIN platforms p ON w.platform_id = p.id
      LEFT JOIN drivers d ON w.driver_id = d.id
      LEFT JOIN vehicles v ON w.vehicle_id = v.id
      LEFT JOIN orders o ON w.order_id = o.id
      LEFT JOIN complaints c ON w.complaint_id = c.id
      LEFT JOIN compliance_rules r ON w.violation_rule_id = r.id
      WHERE 1=1`;
    const params = [];
    if (status) {
      query += ' AND w.status = ?';
      params.push(status);
    }
    if (work_order_type) {
      query += ' AND w.work_order_type = ?';
      params.push(work_order_type);
    }
    if (priority) {
      query += ' AND w.priority = ?';
      params.push(priority);
    }
    if (source) {
      query += ' AND w.source = ?';
      params.push(source);
    }
    if (assign_to) {
      query += ' AND w.assign_to = ?';
      params.push(assign_to);
    }
    query += ' ORDER BY w.created_at DESC';
    const result = paginate(req, query, params);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/work-orders/:id', (req, res) => {
  try {
    const workOrder = db.prepare(`
      SELECT w.*, p.name as platform_name, d.name as driver_name, d.phone as driver_phone,
        d.id_card as driver_id_card, v.plate_no, v.brand, v.model, o.platform_order_no,
        c.complaint_no, c.complaint_content, r.rule_name, r.rule_code, r.violation_level,
        r.fine_amount_min, r.fine_amount_max, r.points_deducted
      FROM work_orders w
      LEFT JOIN platforms p ON w.platform_id = p.id
      LEFT JOIN drivers d ON w.driver_id = d.id
      LEFT JOIN vehicles v ON w.vehicle_id = v.id
      LEFT JOIN orders o ON w.order_id = o.id
      LEFT JOIN complaints c ON w.complaint_id = c.id
      LEFT JOIN compliance_rules r ON w.violation_rule_id = r.id
      WHERE w.id = ?
    `).get(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ error: '工单不存在' });
    }
    if (workOrder.verify_evidence) {
      try {
        workOrder.verify_evidence = JSON.parse(workOrder.verify_evidence);
      } catch (e) {}
    }
    res.json(workOrder);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/work-orders', (req, res) => {
  try {
    const { source, source_id, work_order_type, title, description,
      driver_id, vehicle_id, platform_id, order_id, complaint_id,
      violation_rule_id, priority } = req.body;
    const workOrderNo = `WO${Date.now()}`;
    const result = db.prepare(`
      INSERT INTO work_orders (work_order_no, source, source_id, work_order_type, title, description,
        driver_id, vehicle_id, platform_id, order_id, complaint_id, violation_rule_id, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(workOrderNo, source, source_id, work_order_type, title, description,
      driver_id, vehicle_id, platform_id, order_id, complaint_id,
      violation_rule_id, priority || 'normal');
    logOperation('admin', 1, '系统管理员', '创建', 'work_orders', result.lastInsertRowid,
      `创建工单: ${title}`, req.ip);
    res.json({ id: result.lastInsertRowid, work_order_no: workOrderNo, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/work-orders/:id/assign', (req, res) => {
  try {
    const { assign_to } = req.body;
    const result = db.prepare(`
      UPDATE work_orders SET assign_to=?, assign_time=CURRENT_TIMESTAMP, status='processing'
      WHERE id=?
    `).run(assign_to, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '工单不存在' });
    }
    logOperation('admin', 1, '系统管理员', '派单', 'work_orders', parseInt(req.params.id),
      `派单给: ${assign_to}`, req.ip);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/work-orders/:id/verify', (req, res) => {
  try {
    const { verify_result, verify_evidence } = req.body;
    const evidenceStr = verify_evidence ? JSON.stringify(verify_evidence) : null;
    const result = db.prepare(`
      UPDATE work_orders SET verify_result=?, verify_evidence=?, verify_time=CURRENT_TIMESTAMP,
      status='completed' WHERE id=?
    `).run(verify_result, evidenceStr, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '工单不存在' });
    }
    logOperation('admin', 1, '系统管理员', '核查', 'work_orders', parseInt(req.params.id),
      `核查结果: ${verify_result}`, req.ip);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/work-orders/:id/create-case', (req, res) => {
  try {
    const { case_type, title, violation_details, evidence_urls } = req.body;
    const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ error: '工单不存在' });
    }
    const caseNo = `CASE${Date.now()}`;
    const evidenceStr = evidence_urls ? JSON.stringify(evidence_urls) : null;
    const result = db.prepare(`
      INSERT INTO enforcement_cases (case_no, case_type, title, driver_id, vehicle_id,
        platform_id, work_order_id, complaint_id, violation_details, evidence_urls, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(caseNo, case_type, title, workOrder.driver_id, workOrder.vehicle_id,
      workOrder.platform_id, req.params.id, workOrder.complaint_id,
      violation_details, evidenceStr);
    logOperation('admin', 1, '系统管理员', '创建案件', 'enforcement_cases', result.lastInsertRowid,
      `从工单 ${req.params.id} 创建案件`, req.ip);
    res.json({ id: result.lastInsertRowid, case_no: caseNo });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/enforcement-cases', (req, res) => {
  try {
    const { status, case_type, is_appealed } = req.query;
    let query = `SELECT e.*, p.name as platform_name, d.name as driver_name, v.plate_no,
      w.work_order_no, c.complaint_no
      FROM enforcement_cases e
      LEFT JOIN platforms p ON e.platform_id = p.id
      LEFT JOIN drivers d ON e.driver_id = d.id
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      LEFT JOIN work_orders w ON e.work_order_id = w.id
      LEFT JOIN complaints c ON e.complaint_id = c.id
      WHERE 1=1`;
    const params = [];
    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }
    if (case_type) {
      query += ' AND e.case_type = ?';
      params.push(case_type);
    }
    if (is_appealed !== undefined) {
      query += ' AND e.is_appealed = ?';
      params.push(parseInt(is_appealed));
    }
    query += ' ORDER BY e.created_at DESC';
    const result = paginate(req, query, params);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/enforcement-cases/:id', (req, res) => {
  try {
    const caseItem = db.prepare(`
      SELECT e.*, p.name as platform_name, d.name as driver_name, d.phone as driver_phone,
        d.id_card as driver_id_card, v.plate_no, w.work_order_no, c.complaint_no
      FROM enforcement_cases e
      LEFT JOIN platforms p ON e.platform_id = p.id
      LEFT JOIN drivers d ON e.driver_id = d.id
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      LEFT JOIN work_orders w ON e.work_order_id = w.id
      LEFT JOIN complaints c ON e.complaint_id = c.id
      WHERE e.id = ?
    `).get(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ error: '案件不存在' });
    }
    if (caseItem.evidence_urls) {
      try {
        caseItem.evidence_urls = JSON.parse(caseItem.evidence_urls);
      } catch (e) {}
    }
    if (caseItem.rectification_evidence) {
      try {
        caseItem.rectification_evidence = JSON.parse(caseItem.rectification_evidence);
      } catch (e) {}
    }
    const penalties = db.prepare('SELECT * FROM penalties WHERE case_id = ?').all(req.params.id);
    res.json({ ...caseItem, penalties });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/enforcement-cases', (req, res) => {
  try {
    const { case_type, title, driver_id, vehicle_id, platform_id, work_order_id,
      complaint_id, violation_details, evidence_urls } = req.body;
    const caseNo = `CASE${Date.now()}`;
    const evidenceStr = evidence_urls ? JSON.stringify(evidence_urls) : null;
    const result = db.prepare(`
      INSERT INTO enforcement_cases (case_no, case_type, title, driver_id, vehicle_id,
        platform_id, work_order_id, complaint_id, violation_details, evidence_urls, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(caseNo, case_type, title, driver_id, vehicle_id, platform_id,
      work_order_id, complaint_id, violation_details, evidenceStr);
    logOperation('admin', 1, '系统管理员', '创建', 'enforcement_cases', result.lastInsertRowid,
      `创建案件: ${title}`, req.ip);
    res.json({ id: result.lastInsertRowid, case_no: caseNo, ...req.body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/enforcement-cases/:id/decision', (req, res) => {
  try {
    const { law_enforcement_officer, initial_decision, initial_fine_amount,
      initial_points_deducted } = req.body;
    const result = db.prepare(`
      UPDATE enforcement_cases SET law_enforcement_officer=?, law_enforcement_time=CURRENT_TIMESTAMP,
        initial_decision=?, initial_fine_amount=?, initial_points_deducted=?,
        decision_time=CURRENT_TIMESTAMP, status='decision_made'
      WHERE id=?
    `).run(law_enforcement_officer, initial_decision, initial_fine_amount,
      initial_points_deducted, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '案件不存在' });
    }
    const caseItem = db.prepare('SELECT * FROM enforcement_cases WHERE id = ?').get(req.params.id);
    const penaltyNo = `PEN${Date.now()}`;
    db.prepare(`
      INSERT INTO penalties (penalty_no, case_id, driver_id, vehicle_id, platform_id,
        penalty_type, penalty_amount, points_deducted, penalty_desc, penalty_time, status)
      VALUES (?, ?, ?, ?, ?, 'fine', ?, ?, ?, CURRENT_TIMESTAMP, 'unpaid')
    `).run(penaltyNo, req.params.id, caseItem.driver_id, caseItem.vehicle_id,
      caseItem.platform_id, initial_fine_amount, initial_points_deducted, initial_decision);
    logOperation('admin', 1, '系统管理员', '处罚决定', 'enforcement_cases', parseInt(req.params.id),
      `处罚决定: ${initial_decision}`, req.ip);
    res.json({ success: true, penalty_no: penaltyNo });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/enforcement-cases/:id/appeal', (req, res) => {
  try {
    const { appeal_content } = req.body;
    const result = db.prepare(`
      UPDATE enforcement_cases SET is_appealed=1, appeal_content=?, appeal_time=CURRENT_TIMESTAMP,
        status='appealed'
      WHERE id=?
    `).run(appeal_content, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '案件不存在' });
    }
    logOperation('admin', 1, '系统管理员', '申诉', 'enforcement_cases', parseInt(req.params.id),
      `申诉内容: ${appeal_content}`, req.ip);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/enforcement-cases/:id/review', (req, res) => {
  try {
    const { review_result, final_decision, final_fine_amount, final_points_deducted } = req.body;
    const result = db.prepare(`
      UPDATE enforcement_cases SET review_result=?, review_time=CURRENT_TIMESTAMP,
        final_decision=?, final_fine_amount=?, final_points_deducted=?, status='reviewed'
      WHERE id=?
    `).run(review_result, final_decision, final_fine_amount, final_points_deducted, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '案件不存在' });
    }
    logOperation('admin', 1, '系统管理员', '复核', 'enforcement_cases', parseInt(req.params.id),
      `复核结果: ${review_result}`, req.ip);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/enforcement-cases/:id/rectification', (req, res) => {
  try {
    const { rectification_requirements } = req.body;
    const result = db.prepare(`
      UPDATE enforcement_cases SET rectification_requirements=?, status='rectifying'
      WHERE id=?
    `).run(rectification_requirements, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '案件不存在' });
    }
    logOperation('admin', 1, '系统管理员', '整改要求', 'enforcement_cases', parseInt(req.params.id),
      `整改要求已下达`, req.ip);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/enforcement-cases/:id/rectification-complete', (req, res) => {
  try {
    const { rectification_result, rectification_evidence } = req.body;
    const evidenceStr = rectification_evidence ? JSON.stringify(rectification_evidence) : null;
    const result = db.prepare(`
      UPDATE enforcement_cases SET rectification_result=?, rectification_evidence=?,
        rectification_time=CURRENT_TIMESTAMP, status='closed'
      WHERE id=?
    `).run(rectification_result, evidenceStr, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '案件不存在' });
    }
    logOperation('admin', 1, '系统管理员', '整改完成', 'enforcement_cases', parseInt(req.params.id),
      `整改完成，案件结案`, req.ip);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/cases', (req, res) => {
  try {
    const status = req.query.status;
    const case_type = req.query.type || req.query.case_type;
    const is_appealed = req.query.appealed !== undefined ? req.query.appealed : req.query.is_appealed;
    let query = `SELECT e.*, p.name as platform_name, d.name as driver_name, v.plate_no,
      w.work_order_no, c.complaint_no
      FROM enforcement_cases e
      LEFT JOIN platforms p ON e.platform_id = p.id
      LEFT JOIN drivers d ON e.driver_id = d.id
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      LEFT JOIN work_orders w ON e.work_order_id = w.id
      LEFT JOIN complaints c ON e.complaint_id = c.id
      WHERE 1=1`;
    const params = [];
    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }
    if (case_type) {
      query += ' AND e.case_type = ?';
      params.push(case_type);
    }
    if (is_appealed !== undefined) {
      query += ' AND e.is_appealed = ?';
      params.push(parseInt(is_appealed));
    }
    query += ' ORDER BY e.created_at DESC';
    const result = paginate(req, query, params);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/cases/:id', (req, res) => {
  try {
    const caseItem = db.prepare(`
      SELECT e.*, p.name as platform_name, d.name as driver_name, d.phone as driver_phone,
        d.id_card as driver_id_card, v.plate_no, w.work_order_no, c.complaint_no
      FROM enforcement_cases e
      LEFT JOIN platforms p ON e.platform_id = p.id
      LEFT JOIN drivers d ON e.driver_id = d.id
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      LEFT JOIN work_orders w ON e.work_order_id = w.id
      LEFT JOIN complaints c ON e.complaint_id = c.id
      WHERE e.id = ?
    `).get(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ error: '案件不存在' });
    }
    if (caseItem.evidence_urls) {
      try {
        caseItem.evidence_urls = JSON.parse(caseItem.evidence_urls);
      } catch (e) {}
    }
    if (caseItem.rectification_evidence) {
      try {
        caseItem.rectification_evidence = JSON.parse(caseItem.rectification_evidence);
      } catch (e) {}
    }
    const penalties = db.prepare('SELECT * FROM penalties WHERE case_id = ?').all(req.params.id);
    res.json({ ...caseItem, penalties });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/cases/:id/penalty', (req, res) => {
  try {
    const { penaltyType, amount, points, basis, decision } = req.body;
    const law_enforcement_officer = '系统执法员';
    const initial_decision = decision || basis || penaltyType;
    const initial_fine_amount = amount || 0;
    const initial_points_deducted = points || 0;
    const result = db.prepare(`
      UPDATE enforcement_cases SET law_enforcement_officer=?, law_enforcement_time=CURRENT_TIMESTAMP,
        initial_decision=?, initial_fine_amount=?, initial_points_deducted=?,
        decision_time=CURRENT_TIMESTAMP, status='decision_made'
      WHERE id=?
    `).run(law_enforcement_officer, initial_decision, initial_fine_amount,
      initial_points_deducted, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '案件不存在' });
    }
    const caseItem = db.prepare('SELECT * FROM enforcement_cases WHERE id = ?').get(req.params.id);
    const penaltyNo = `PEN${Date.now()}`;
    db.prepare(`
      INSERT INTO penalties (penalty_no, case_id, driver_id, vehicle_id, platform_id,
        penalty_type, penalty_amount, points_deducted, penalty_desc, penalty_time, status)
      VALUES (?, ?, ?, ?, ?, 'fine', ?, ?, ?, CURRENT_TIMESTAMP, 'unpaid')
    `).run(penaltyNo, req.params.id, caseItem.driver_id, caseItem.vehicle_id,
      caseItem.platform_id, initial_fine_amount, initial_points_deducted, initial_decision);
    logOperation('admin', 1, '系统管理员', '处罚决定', 'enforcement_cases', parseInt(req.params.id),
      `处罚决定: ${initial_decision}`, req.ip);
    res.json({ success: true, penalty_no: penaltyNo });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/cases/:id/appeal', (req, res) => {
  try {
    const { content, reason } = req.body;
    const appeal_content = content || reason || '';
    const result = db.prepare(`
      UPDATE enforcement_cases SET is_appealed=1, appeal_content=?, appeal_time=CURRENT_TIMESTAMP,
        status='appealed'
      WHERE id=?
    `).run(appeal_content, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '案件不存在' });
    }
    logOperation('admin', 1, '系统管理员', '申诉', 'enforcement_cases', parseInt(req.params.id),
      `申诉内容: ${appeal_content}`, req.ip);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/cases/:id/review', (req, res) => {
  try {
    const { result: review_result, decision, fineAmount, pointsDeducted } = req.body;
    const final_decision = decision || review_result || '';
    const final_fine_amount = fineAmount || 0;
    const final_points_deducted = pointsDeducted || 0;
    const result = db.prepare(`
      UPDATE enforcement_cases SET review_result=?, review_time=CURRENT_TIMESTAMP,
        final_decision=?, final_fine_amount=?, final_points_deducted=?, status='reviewed'
      WHERE id=?
    `).run(review_result || '', final_decision, final_fine_amount, final_points_deducted, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '案件不存在' });
    }
    logOperation('admin', 1, '系统管理员', '复核', 'enforcement_cases', parseInt(req.params.id),
      `复核结果: ${review_result}`, req.ip);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/cases/:id/rectify', (req, res) => {
  try {
    const { requirements, content } = req.body;
    const rectification_requirements = requirements || content || '';
    const result = db.prepare(`
      UPDATE enforcement_cases SET rectification_requirements=?, status='rectifying'
      WHERE id=?
    `).run(rectification_requirements, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '案件不存在' });
    }
    logOperation('admin', 1, '系统管理员', '整改要求', 'enforcement_cases', parseInt(req.params.id),
      `整改要求已下达`, req.ip);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/penalties', (req, res) => {
  try {
    const { status, driver_id, platform_id } = req.query;
    let query = `SELECT pen.*, p.name as platform_name, d.name as driver_name, v.plate_no,
      e.case_no, e.title as case_title
      FROM penalties pen
      LEFT JOIN platforms p ON pen.platform_id = p.id
      LEFT JOIN drivers d ON pen.driver_id = d.id
      LEFT JOIN vehicles v ON pen.vehicle_id = v.id
      LEFT JOIN enforcement_cases e ON pen.case_id = e.id
      WHERE 1=1`;
    const params = [];
    if (status) {
      query += ' AND pen.status = ?';
      params.push(status);
    }
    if (driver_id) {
      query += ' AND pen.driver_id = ?';
      params.push(driver_id);
    }
    if (platform_id) {
      query += ' AND pen.platform_id = ?';
      params.push(platform_id);
    }
    query += ' ORDER BY pen.penalty_time DESC';
    const result = paginate(req, query, params);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/penalties/:id/pay', (req, res) => {
  try {
    const { paid_amount } = req.body;
    const result = db.prepare(`
      UPDATE penalties SET paid_amount=?, paid_time=CURRENT_TIMESTAMP, status='paid'
      WHERE id=?
    `).run(paid_amount, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '处罚记录不存在' });
    }
    logOperation('admin', 1, '系统管理员', '缴款', 'penalties', parseInt(req.params.id),
      `罚款已缴纳: ${paid_amount}元`, req.ip);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/reports/summary', (req, res) => {
  try {
    const { start_date, end_date, platform_id } = req.query;
    const baseClauses = [];
    const baseParams = [];
    const dateClauses = [];
    const dateParams = [];
    if (platform_id) {
      baseClauses.push('platform_id = ?');
      baseParams.push(platform_id);
    }
    if (start_date) {
      dateClauses.push('created_at >= ?');
      dateParams.push(start_date);
    }
    if (end_date) {
      dateClauses.push('created_at <= ?');
      dateParams.push(end_date);
    }

    const scopedClauses = [...baseClauses, ...dateClauses];
    const scopedParams = [...baseParams, ...dateParams];
    const where = (clauses) => clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    const count = (table, clauses = scopedClauses, params = scopedParams) =>
      db.prepare(`SELECT COUNT(*) as count FROM ${table}${where(clauses)}`).get(...params).count;
    const sum = (table, column, clauses = scopedClauses, params = scopedParams) =>
      db.prepare(`SELECT COALESCE(SUM(${column}), 0) as total FROM ${table}${where(clauses)}`).get(...params).total;

    const totalDrivers = count('drivers');
    const approvedDrivers = count('drivers', [...scopedClauses, 'audit_status = ?'], [...scopedParams, 'approved']);
    const pendingDrivers = count('drivers', [...scopedClauses, 'audit_status = ?'], [...scopedParams, 'pending']);
    const expiredDrivers = count('drivers', [
      ...baseClauses,
      "(driver_license_expiry_date < DATE('now') OR taxi_qualification_expiry_date < DATE('now'))"
    ], baseParams);

    const totalVehicles = count('vehicles');
    const approvedVehicles = count('vehicles', [...scopedClauses, 'audit_status = ?'], [...scopedParams, 'approved']);
    const pendingVehicles = count('vehicles', [...scopedClauses, 'audit_status = ?'], [...scopedParams, 'pending']);
    const expiredVehicles = count('vehicles', [
      ...baseClauses,
      `(vehicle_license_expiry_date < DATE('now')
        OR operation_license_expiry_date < DATE('now')
        OR insurance_expiry_date < DATE('now')
        OR annual_inspection_expiry_date < DATE('now'))`
    ], baseParams);

    const totalOrders = count('orders');
    const checkedOrders = count('orders', [...scopedClauses, 'is_checked = 1'], scopedParams);
    const anomalyOrders = count('orders', [...scopedClauses, "anomaly_tags IS NOT NULL AND anomaly_tags != ''"], scopedParams);

    const totalComplaints = count('complaints');
    const pendingComplaints = count('complaints', [...scopedClauses, 'status = ?'], [...scopedParams, 'pending']);

    const totalWorkOrders = count('work_orders');
    const pendingWorkOrders = count('work_orders', [...scopedClauses, 'status = ?'], [...scopedParams, 'pending']);
    const processingWorkOrders = count('work_orders', [...scopedClauses, 'status = ?'], [...scopedParams, 'processing']);

    const totalCases = count('enforcement_cases');
    const pendingCases = count('enforcement_cases', [...scopedClauses, 'status = ?'], [...scopedParams, 'pending']);
    const closedCases = count('enforcement_cases', [...scopedClauses, 'status = ?'], [...scopedParams, 'closed']);

    const totalPenalties = count('penalties');
    const totalFineAmount = sum('penalties', 'penalty_amount');
    const paidFineAmount = sum('penalties', 'paid_amount');

    res.json({
      drivers: {
        total: totalDrivers,
        approved: approvedDrivers,
        pending: pendingDrivers,
        expired: expiredDrivers,
        compliance_rate: totalDrivers > 0 ? Math.round(approvedDrivers / totalDrivers * 100) : 0
      },
      vehicles: {
        total: totalVehicles,
        approved: approvedVehicles,
        pending: pendingVehicles,
        expired: expiredVehicles,
        compliance_rate: totalVehicles > 0 ? Math.round(approvedVehicles / totalVehicles * 100) : 0
      },
      orders: {
        total: totalOrders,
        checked: checkedOrders,
        anomaly: anomalyOrders,
        check_rate: totalOrders > 0 ? Math.round(checkedOrders / totalOrders * 100) : 0
      },
      complaints: {
        total: totalComplaints,
        pending: pendingComplaints
      },
      work_orders: {
        total: totalWorkOrders,
        pending: pendingWorkOrders,
        processing: processingWorkOrders
      },
      cases: {
        total: totalCases,
        pending: pendingCases,
        closed: closedCases
      },
      penalties: {
        total: totalPenalties,
        total_fine_amount: totalFineAmount,
        paid_fine_amount: paidFineAmount,
        unpaid_fine_amount: totalFineAmount - paidFineAmount
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/reports/platform-compliance', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT p.id, p.name, p.license_no, p.status,
        (SELECT COUNT(*) FROM drivers WHERE platform_id = p.id) as total_drivers,
        (SELECT COUNT(*) FROM drivers WHERE platform_id = p.id AND audit_status = 'approved') as approved_drivers,
        (SELECT COUNT(*) FROM vehicles WHERE platform_id = p.id) as total_vehicles,
        (SELECT COUNT(*) FROM vehicles WHERE platform_id = p.id AND audit_status = 'approved') as approved_vehicles,
        (SELECT COUNT(*) FROM orders WHERE platform_id = p.id) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE platform_id = p.id AND anomaly_tags IS NOT NULL AND anomaly_tags != '') as anomaly_orders,
        (SELECT COUNT(*) FROM complaints WHERE platform_id = p.id) as total_complaints,
        (SELECT COUNT(*) FROM enforcement_cases WHERE platform_id = p.id) as total_cases,
        (SELECT COALESCE(SUM(penalty_amount), 0) FROM penalties WHERE platform_id = p.id) as total_fines
      FROM platforms p
      ORDER BY p.id
    `).all();

    const result = data.map(item => ({
      ...item,
      driver_compliance_rate: item.total_drivers > 0 ? Math.round(item.approved_drivers / item.total_drivers * 100) : 0,
      vehicle_compliance_rate: item.total_vehicles > 0 ? Math.round(item.approved_vehicles / item.total_vehicles * 100) : 0,
      order_anomaly_rate: item.total_orders > 0 ? Math.round(item.anomaly_orders / item.total_orders * 100) : 0
    }));
    res.json({ data: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/reports/complaint-hotspots', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT complaint_type, COUNT(*) as count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
      FROM complaints
      GROUP BY complaint_type
      ORDER BY count DESC
    `).all();
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/reports/penalty-summary', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let dateFilter = '';
    const params = [];
    if (start_date) {
      dateFilter += ' WHERE penalty_time >= ?';
      params.push(start_date);
    }
    if (end_date) {
      dateFilter += (dateFilter ? ' AND' : ' WHERE') + ' penalty_time <= ?';
      params.push(end_date);
    }

    const byType = db.prepare(`
      SELECT penalty_type, COUNT(*) as count, COALESCE(SUM(penalty_amount), 0) as total_amount
      FROM penalties ${dateFilter}
      GROUP BY penalty_type
      ORDER BY total_amount DESC
    `).all(...params);

    const byPlatform = db.prepare(`
      SELECT p.name as platform_name, COUNT(*) as count, COALESCE(SUM(pen.penalty_amount), 0) as total_amount
      FROM penalties pen
      LEFT JOIN platforms p ON pen.platform_id = p.id
      ${dateFilter.replace('WHERE', 'WHERE pen.platform_id IS NOT NULL' + (dateFilter.includes('penalty_time') ? ' AND ' + dateFilter.split('WHERE')[1] : ''))}
      GROUP BY pen.platform_id
      ORDER BY total_amount DESC
    `).all(...params);

    const total = db.prepare(`
      SELECT COUNT(*) as total_count,
        COALESCE(SUM(penalty_amount), 0) as total_amount,
        COALESCE(SUM(paid_amount), 0) as total_paid
      FROM penalties ${dateFilter}
    `).get(...params);

    res.json({ by_type: byType, by_platform: byPlatform, total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/reports/expiring-documents', (req, res) => {
  try {
    const days = parseInt(req.query.days || 90);
    const drivers = db.prepare(`
      SELECT d.id, d.name, d.id_card, d.phone, d.driver_license_expiry_date,
        d.taxi_qualification_expiry_date, p.name as platform_name,
        d.audit_status, d.audit_remark
      FROM drivers d
      LEFT JOIN platforms p ON d.platform_id = p.id
      WHERE (
        (d.driver_license_expiry_date IS NOT NULL AND date(d.driver_license_expiry_date) <= date('now', '+' || ? || ' days')) OR
        (d.taxi_qualification_expiry_date IS NOT NULL AND date(d.taxi_qualification_expiry_date) <= date('now', '+' || ? || ' days'))
      )
      ORDER BY CASE
        WHEN date(d.driver_license_expiry_date) <= date('now') THEN 1
        WHEN date(d.taxi_qualification_expiry_date) <= date('now') THEN 1
        ELSE 2
      END, d.driver_license_expiry_date, d.taxi_qualification_expiry_date
    `).all(days, days);

    const vehicles = db.prepare(`
      SELECT v.id, v.plate_no, v.brand, v.model, v.owner_name, v.owner_phone,
        v.vehicle_license_expiry_date, v.operation_license_expiry_date,
        v.insurance_expiry_date, v.annual_inspection_expiry_date, p.name as platform_name,
        v.audit_status, v.audit_remark
      FROM vehicles v
      LEFT JOIN platforms p ON v.platform_id = p.id
      WHERE (
        (v.vehicle_license_expiry_date IS NOT NULL AND date(v.vehicle_license_expiry_date) <= date('now', '+' || ? || ' days')) OR
        (v.operation_license_expiry_date IS NOT NULL AND date(v.operation_license_expiry_date) <= date('now', '+' || ? || ' days')) OR
        (v.insurance_expiry_date IS NOT NULL AND date(v.insurance_expiry_date) <= date('now', '+' || ? || ' days')) OR
        (v.annual_inspection_expiry_date IS NOT NULL AND date(v.annual_inspection_expiry_date) <= date('now', '+' || ? || ' days'))
      )
      ORDER BY CASE
        WHEN date(v.operation_license_expiry_date) <= date('now') THEN 1
        WHEN date(v.vehicle_license_expiry_date) <= date('now') THEN 1
        ELSE 2
      END, v.operation_license_expiry_date, v.vehicle_license_expiry_date
    `).all(days, days, days, days);

    res.json({ drivers, vehicles });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/reports/regional-risk', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT substr(pickup_address, 4, 3) as region, COUNT(*) as total_orders,
        SUM(CASE WHEN anomaly_tags IS NOT NULL AND anomaly_tags != '' THEN 1 ELSE 0 END) as anomaly_count,
        COUNT(DISTINCT driver_id) as driver_count
      FROM orders
      WHERE pickup_address LIKE '北京市%'
      GROUP BY region
      ORDER BY anomaly_count DESC
    `).all();

    const result = data.map(item => ({
      ...item,
      risk_level: item.anomaly_count === 0 ? 'low' :
                  item.anomaly_count < 3 ? 'medium' : 'high',
      anomaly_rate: item.total_orders > 0 ? Math.round(item.anomaly_count / item.total_orders * 100) : 0
    }));

    res.json({ data: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/operation-logs', (req, res) => {
  try {
    const { user_type, module, operation } = req.query;
    let query = 'SELECT * FROM operation_logs WHERE 1=1';
    const params = [];
    if (user_type) {
      query += ' AND user_type = ?';
      params.push(user_type);
    }
    if (module) {
      query += ' AND module = ?';
      params.push(module);
    }
    if (operation) {
      query += ' AND operation = ?';
      params.push(operation);
    }
    query += ' ORDER BY created_at DESC';
    const result = paginate(req, query, params);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', detail: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务已启动: http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});
