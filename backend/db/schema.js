const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const DB_DIR = path.join(__dirname, '..', 'data')
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
const DB_PATH = path.join(DB_DIR, 'app.sqlite')

let _db = null
function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
  }
  return _db
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'viewer',
  department TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_code TEXT UNIQUE NOT NULL,
  app_name TEXT NOT NULL,
  owner TEXT,
  category TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS environments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  env_name TEXT NOT NULL,
  env_type TEXT DEFAULT 'dev',
  base_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changelog TEXT,
  artifact TEXT,
  published_by TEXT,
  status TEXT DEFAULT 'draft',
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS secrets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  env_id INTEGER REFERENCES environments(id),
  key_name TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  expiry TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  env_id INTEGER REFERENCES environments(id),
  config_key TEXT NOT NULL,
  config_value TEXT,
  category TEXT,
  description TEXT,
  value_type TEXT DEFAULT 'string',
  effective_from TEXT,
  effective_to TEXT,
  owner TEXT,
  status TEXT DEFAULT 'active',
  version_no INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS config_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_id INTEGER NOT NULL REFERENCES configs(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL,
  config_value TEXT,
  changed_by TEXT,
  change_reason TEXT,
  action TEXT DEFAULT 'update',
  changed_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_no TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  app_id INTEGER REFERENCES applications(id),
  task_type TEXT,
  params TEXT,
  status TEXT DEFAULT 'created',
  created_by TEXT,
  submitted_by TEXT,
  executed_by TEXT,
  reviewed_by TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  submitted_at TEXT,
  executed_at TEXT,
  reviewed_at TEXT,
  closed_at TEXT,
  close_reason TEXT
);

CREATE TABLE IF NOT EXISTS task_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  operator TEXT,
  detail TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS execution_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER REFERENCES tasks(id),
  app_id INTEGER REFERENCES applications(id),
  action TEXT,
  request_payload TEXT,
  response_payload TEXT,
  status TEXT,
  started_at TEXT,
  finished_at TEXT,
  duration_ms INTEGER,
  operator TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS change_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  app_id INTEGER REFERENCES applications(id),
  change_type TEXT,
  risk_level TEXT DEFAULT 'low',
  description TEXT,
  window_start TEXT,
  window_end TEXT,
  status TEXT DEFAULT 'draft',
  result TEXT,
  created_by TEXT,
  approver TEXT,
  reviewer TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  approved_at TEXT,
  reviewed_at TEXT,
  closed_at TEXT,
  close_reason TEXT
);

CREATE TABLE IF NOT EXISTS change_order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  operator TEXT,
  detail TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_no TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  app_id INTEGER REFERENCES applications(id),
  severity TEXT DEFAULT 'info',
  source TEXT,
  status TEXT DEFAULT 'open',
  auto_action TEXT,
  detail TEXT,
  owner TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  handled_at TEXT,
  handled_by TEXT,
  handle_result TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT,
  action TEXT,
  target_type TEXT,
  target_id INTEGER,
  detail TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_type TEXT,
  ref_id INTEGER,
  file_name TEXT,
  file_path TEXT,
  file_size INTEGER,
  uploaded_by TEXT,
  uploaded_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS app_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_code TEXT UNIQUE NOT NULL,
  app_name TEXT NOT NULL,
  category TEXT,
  access_url TEXT,
  description TEXT,
  icon TEXT,
  open_condition TEXT,
  owner TEXT,
  visible_scope TEXT DEFAULT 'all',
  maintenance_status TEXT DEFAULT 'online',
  approval_required INTEGER DEFAULT 0,
  sort_weight INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS app_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  catalog_id INTEGER NOT NULL REFERENCES app_catalog(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  UNIQUE(user_id, catalog_id)
);

CREATE TABLE IF NOT EXISTS app_recent_access (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  catalog_id INTEGER NOT NULL REFERENCES app_catalog(id) ON DELETE CASCADE,
  accessed_at TEXT DEFAULT (datetime('now','localtime')),
  UNIQUE(user_id, catalog_id)
);

CREATE TABLE IF NOT EXISTS permission_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  req_no TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  catalog_id INTEGER REFERENCES app_catalog(id),
  applicant_id INTEGER NOT NULL,
  applicant TEXT NOT NULL,
  reason TEXT,
  scope TEXT,
  valid_from TEXT,
  valid_to TEXT,
  approver TEXT,
  status TEXT DEFAULT 'draft',
  approval_opinion TEXT,
  opened_at TEXT,
  expired_notified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  level TEXT DEFAULT 'info',
  publisher TEXT,
  status TEXT DEFAULT 'published',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_configs_app ON configs(app_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_exec_logs_app ON execution_logs(app_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_catalog_cat ON app_catalog(category);
CREATE INDEX IF NOT EXISTS idx_perm_req_status ON permission_requests(status);
CREATE INDEX IF NOT EXISTS idx_perm_req_applicant ON permission_requests(applicant);
`

function init(db) {
  db.exec(SCHEMA_SQL)
  _seed(db)
}

function _seed(db) {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c
  if (count === 0) {
    const bcrypt = require('bcryptjs')
    const insert = db.prepare(
      'INSERT INTO users (username, password, display_name, role, department, status) VALUES (?, ?, ?, ?, ?, ?)'
    )
    const users = [
      ['admin', bcrypt.hashSync('Admin@123', 10), '系统管理员', 'admin', '平台工程', 'active'],
      ['platform', bcrypt.hashSync('Platform@123', 10), '平台工程师', 'platform', '平台工程', 'active'],
      ['ops', bcrypt.hashSync('Ops@123', 10), '运维工程师', 'ops', '运维中心', 'active'],
      ['dev', bcrypt.hashSync('Dev@123', 10), '开发者', 'dev', '应用研发', 'active'],
      ['owner', bcrypt.hashSync('Owner@123', 10), '应用负责人', 'owner', '应用研发', 'active'],
      ['security', bcrypt.hashSync('Security@123', 10), '安全管理员', 'security', '安全合规', 'active'],
      ['viewer', bcrypt.hashSync('Viewer@123', 10), '访客', 'viewer', '访客组', 'active']
    ]
    users.forEach(u => insert.run(...u))
  }

  const appCount = db.prepare('SELECT COUNT(*) AS c FROM applications').get().c
  if (appCount === 0) {
    const insertApp = db.prepare(
      'INSERT INTO applications (app_code, app_name, owner, category, description, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    const apps = [
      ['ORDER-SVC', '订单服务', 'owner', '业务应用', '处理订单创建、支付、履约全流程', 'active', 'admin'],
      ['PAY-GATE', '支付网关', 'owner', '基础服务', '聚合多种支付渠道的统一支付网关', 'active', 'admin'],
      ['MSG-CENTER', '消息中心', 'owner', '基础服务', '统一消息分发与推送服务', 'active', 'admin']
    ]
    apps.forEach(a => insertApp.run(...a))

    const appsRows = db.prepare('SELECT id FROM applications ORDER BY id').all()
    const insertEnv = db.prepare(
      'INSERT INTO environments (app_id, env_name, env_type, base_url, status) VALUES (?, ?, ?, ?, ?)'
    )
    appsRows.forEach(r => {
      insertEnv.run(r.id, 'dev', 'dev', 'http://dev.local', 'active')
      insertEnv.run(r.id, 'staging', 'staging', 'http://staging.local', 'active')
      insertEnv.run(r.id, 'prod', 'prod', 'https://prod.example.com', 'active')
    })

    const insertCfg = db.prepare(
      'INSERT INTO configs (app_id, env_id, config_key, config_value, category, description, owner, status, version_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    appsRows.forEach((r, i) => {
      const envs = db.prepare('SELECT id, env_type FROM environments WHERE app_id = ?').all(r.id)
      envs.forEach((e, j) => {
        insertCfg.run(r.id, e.id, 'log.level', e.env_type === 'prod' ? 'INFO' : 'DEBUG', 'common', '日志级别', 'ops', 'active', 1)
        insertCfg.run(r.id, e.id, 'cache.ttl.seconds', String(300 + j * 100), 'performance', '缓存 TTL', 'ops', 'active', 1)
      })
    })

    const insertTask = db.prepare(
      'INSERT INTO tasks (task_no, title, app_id, task_type, params, status, created_by, created_at, executed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    insertTask.run('TASK-20260501-0001', '订单服务灰度发布', appsRows[0].id, 'deploy', '{"version":"1.2.0"}', 'executed', 'ops', datetimeNow(), datetimeNow())
    insertTask.run('TASK-20260501-0002', '支付网关配置巡检', appsRows[1].id, 'inspect', '{}', 'created', 'ops', datetimeNow(), null)

    const insertOrder = db.prepare(
      'INSERT INTO change_orders (order_no, title, app_id, change_type, risk_level, description, window_start, window_end, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    insertOrder.run('CO-20260501-0001', '订单服务 1.2.0 上线', appsRows[0].id, 'release', 'medium', '修复支付超时 bug，增加熔断保护', datetimeNow(), datetimeNow(3600), 'approved', 'owner', datetimeNow())

    const insertAlert = db.prepare(
      'INSERT INTO alerts (alert_no, title, app_id, severity, source, status, auto_action, detail, owner, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    insertAlert.run('ALERT-20260501-0001', '订单服务 5xx 比例超过阈值', appsRows[0].id, 'critical', 'monitor', 'open', 'auto_throttle', '5 分钟内 5xx 比例 5.2%', 'ops', datetimeNow())
    insertAlert.run('ALERT-20260501-0002', '检测到配置权限越权申请', appsRows[1].id, 'high', 'audit', 'pending', 'pending_human', '用户 dev 申请 prod 写权限', 'security', datetimeNow())

    // 应用目录 seed
    const insertCat = db.prepare(`
      INSERT INTO app_catalog (app_code, app_name, category, access_url, description, icon,
        open_condition, owner, visible_scope, maintenance_status, approval_required, sort_weight)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const catalogApps = [
      ['OA-SYSTEM', 'OA 办公系统', '办公协同', 'https://oa.example.com', '企业统一办公门户，包含审批、考勤、公文', '📁', '全员可访问', 'owner', 'all', 'online', 0, 10],
      ['HR-SYSTEM', '人力资源系统', '办公协同', 'https://hr.example.com', '人员信息、薪酬、招聘、培训管理', '👥', '需经理审批开通', 'owner', 'all', 'online', 1, 20],
      ['FIN-ERP', '财务 ERP 系统', '经营管理', 'https://erp.example.com', '财务核算、预算、报表系统', '💰', '需财务审批，仅财务人员', 'owner', 'department:财务', 'online', 1, 30],
      ['CRM-SYSTEM', '客户关系管理', '经营管理', 'https://crm.example.com', '客户、商机、合同、服务管理', '🤝', '销售及管理层可申请', 'owner', 'all', 'online', 0, 40],
      ['DATA-BI', '数据分析 BI', '数据智能', 'https://bi.example.com', '自助分析、可视化报表、数据大屏', '📊', '需数据权限审批', 'owner', 'all', 'online', 1, 50],
      ['DEV-PLATFORM', '研发效能平台', '研发工具', 'https://dev.example.com', '代码托管、CI/CD、测试管理', '⚙️', '研发人员自动开通', 'platform', 'department:应用研发,平台工程,运维中心', 'online', 0, 60],
      ['K8S-CONSOLE', 'K8s 容器平台', '研发工具', 'https://k8s.example.com', '容器编排、服务发布、弹性伸缩', '☸️', '需运维审批', 'ops', 'all', 'online', 1, 70],
      ['LOG-CENTER', '日志检索中心', '研发工具', 'https://log.example.com', '分布式日志采集与检索', '📜', '需安全审批，审计留痕', 'security', 'all', 'online', 1, 80],
      ['SEC-SCAN', '安全扫描平台', '安全合规', 'https://sec.example.com', '代码扫描、漏洞扫描、合规检查', '🔒', '全员可访问', 'security', 'all', 'online', 0, 90],
      ['POLICY-CENTER', '制度政策中心', '安全合规', 'https://policy.example.com', '公司规章制度、安全政策发布', '📋', '全员可访问', 'security', 'all', 'online', 0, 100]
    ]
    catalogApps.forEach(a => insertCat.run(...a))

    // 公告 seed
    const insertAnn = db.prepare(
      'INSERT INTO announcements (title, content, level, publisher) VALUES (?, ?, ?, ?)'
    )
    insertAnn.run('关于 5 月份系统例行维护通知', '5 月 30 日 22:00-次日 02:00 将进行平台底层存储扩容切换，期间部分应用可能出现短暂不可用，请提前安排业务。', 'warning', 'admin')
    insertAnn.run('新员工入职 IT 资源申请指引', '新入职员工可通过「权限申请」模块自助申请应用访问权限，审批通过后自动开通。', 'info', 'admin')
    insertAnn.run('【重要】账户密码安全规范更新', '即日起所有系统密码必须满足 12 位以上复杂度，包含大小写字母、数字和特殊字符，每 90 天强制更换。', 'danger', 'security')
    insertAnn.run('应用目录新增 3 款研发工具', 'K8s 容器平台、日志检索中心、安全扫描平台已上线，欢迎体验并反馈。', 'success', 'platform')

    // 权限申请 seed
    const insertPerm = db.prepare(`
      INSERT INTO permission_requests (req_no, title, catalog_id, applicant_id, applicant, reason,
        scope, valid_from, valid_to, approver, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertPerm.run('REQ-20260501-0001', '申请访问数据分析 BI', 5, 4, 'dev', '日常业务数据分析需求', '全部报表', datetimeNow(), datetimeNow(86400*180), 'owner', 'pending')
    insertPerm.run('REQ-20260501-0002', '申请访问 K8s 容器平台', 7, 4, 'dev', '负责订单服务发布', '命名空间 order-svc', datetimeNow(), datetimeNow(86400*365), 'ops', 'approved')
  }
}

function datetimeNow(offset = 0) {
  const d = new Date(Date.now() + offset * 1000)
  return d.toISOString().replace('T', ' ').substring(0, 19)
}

module.exports = { getDb, init }
