const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const DB_PATH = path.resolve(__dirname, '../../data/app.sqlite');

let db = null;

function getDb() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function createTables() {
  const d = getDb();

  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT,
      phone TEXT,
      id_card TEXT,
      role TEXT DEFAULT 'citizen',
      auth_source TEXT DEFAULT 'local',
      org_name TEXT,
      level TEXT DEFAULT 'province',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      sort_order INTEGER DEFAULT 0,
      level TEXT DEFAULT 'province',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_items (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      type TEXT DEFAULT 'administrative',
      department TEXT,
      level TEXT DEFAULT 'province',
      status TEXT DEFAULT 'active',
      handle_scope TEXT,
      handle_conditions TEXT,
      required_materials TEXT,
      handle_flow TEXT,
      charge_standard TEXT,
      legal_basis TEXT,
      promise_days INTEGER DEFAULT 15,
      actual_days INTEGER,
      visit_count INTEGER DEFAULT 0,
      online_rate REAL DEFAULT 0,
      one_done_rate REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_guides (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      version INTEGER DEFAULT 1,
      is_current INTEGER DEFAULT 1,
      updated_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS auth_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      auth_source TEXT,
      ip_address TEXT,
      status TEXT DEFAULT 'success',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      service_id TEXT,
      order_no TEXT UNIQUE,
      pay_type TEXT,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      pay_channel TEXT,
      pay_time DATETIME,
      biz_type TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shared_materials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      material_type TEXT,
      source_level TEXT,
      source_org TEXT,
      file_path TEXT,
      shared_scope TEXT,
      status TEXT DEFAULT 'active',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS approval_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      applicant_id TEXT NOT NULL,
      service_id TEXT,
      current_node TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'normal',
      level TEXT,
      assigned_to TEXT,
      due_date DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS approval_flows (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      node_name TEXT,
      handler_id TEXT,
      handler_name TEXT,
      action TEXT,
      opinion TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      question TEXT NOT NULL,
      answer TEXT,
      ai_answer TEXT,
      source TEXT DEFAULT 'ai',
      status TEXT DEFAULT 'answered',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT,
      assigned_to TEXT,
      assigned_dept TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'normal',
      deadline DATETIME,
      replied_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_replies (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      replier_id TEXT,
      replier_name TEXT,
      content TEXT,
      is_official INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monitor_logs (
      id TEXT PRIMARY KEY,
      api_path TEXT NOT NULL,
      method TEXT,
      status_code INTEGER,
      response_time INTEGER,
      is_timeout INTEGER DEFAULT 0,
      error_msg TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_availability (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      check_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_available INTEGER DEFAULT 1,
      error_msg TEXT,
      response_time INTEGER
    );

    CREATE TABLE IF NOT EXISTS behavior_stats (
      id TEXT PRIMARY KEY,
      service_id TEXT,
      service_name TEXT,
      visit_count INTEGER DEFAULT 0,
      apply_count INTEGER DEFAULT 0,
      complete_count INTEGER DEFAULT 0,
      avg_days REAL,
      bottleneck_node TEXT,
      stat_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS biz_metrics (
      id TEXT PRIMARY KEY,
      metric_name TEXT NOT NULL,
      metric_value REAL,
      unit TEXT,
      period TEXT,
      year INTEGER,
      month INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedData() {
  const d = getDb();

  const userCount = d.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (userCount > 0) return;

  const insert = d.transaction(() => {
    const now = new Date().toISOString();

    // --- 用户 ---
    const pw = bcrypt.hashSync('123456', 10);
    const users = [
      { id: uuidv4(), username: 'admin', password: pw, real_name: '系统管理员', phone: '13800000001', role: 'admin', auth_source: 'local', org_name: '省政务服务中心', level: 'province' },
      { id: uuidv4(), username: 'platform', password: pw, real_name: '平台运维', phone: '13800000006', role: 'staff', auth_source: 'local', org_name: '省政务服务中心', level: 'province' },
      { id: uuidv4(), username: 'ops', password: pw, real_name: '运营专员', phone: '13800000007', role: 'staff', auth_source: 'local', org_name: '省政务服务中心', level: 'province' },
      { id: uuidv4(), username: '张三', password: pw, real_name: '张三', phone: '13800000002', role: 'staff', auth_source: 'local', org_name: '市政务服务中心', level: 'city' },
      { id: uuidv4(), username: '李四', password: pw, real_name: '李四', phone: '13800000003', role: 'citizen', auth_source: 'local', level: 'province' },
      { id: uuidv4(), username: '王五', password: pw, real_name: '王五', phone: '13800000004', role: 'staff', auth_source: 'ca', org_name: '区行政审批局', level: 'district' },
      { id: uuidv4(), username: '赵六', password: pw, real_name: '赵六', phone: '13800000005', role: 'citizen', auth_source: 'alipay', level: 'city' },
      { id: uuidv4(), username: '陈七', password: pw, real_name: '陈七', phone: '13800000008', role: 'citizen', auth_source: 'minzhengtong', level: 'province' },
    ];
    const insertUser = d.prepare(`INSERT INTO users (id, username, password, real_name, phone, role, auth_source, org_name, level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    users.forEach(u => insertUser.run(u.id, u.username, u.password, u.real_name, u.phone, u.role, u.auth_source, u.org_name, u.level));

    // --- 服务分类（5大类 + 10子类） ---
    const categories = [];
    const insertCat = d.prepare(`INSERT INTO service_categories (id, name, parent_id, sort_order, level) VALUES (?, ?, ?, ?, ?)`);

    const topCategories = [
      { name: '政务服务', subs: ['户籍管理', '出入境管理', '身份证办理'] },
      { name: '社会保障', subs: ['社保缴纳', '医保报销', '养老金领取'] },
      { name: '医疗健康', subs: ['预约挂号', '健康档案', '生育登记'] },
      { name: '教育科研', subs: ['学籍管理', '考试报名'] },
      { name: '住房保障', subs: ['公积金提取', '公租房申请'] },
    ];

    topCategories.forEach((tc, i) => {
      const parentId = uuidv4();
      categories.push({ id: parentId, name: tc.name, parent_id: null, sort_order: i, level: 'province' });
      insertCat.run(parentId, tc.name, null, i, 'province');
      tc.subs.forEach((sub, j) => {
        const subId = uuidv4();
        categories.push({ id: subId, name: sub, parent_id: parentId, sort_order: j, level: 'province' });
        insertCat.run(subId, sub, parentId, j, 'province');
      });
    });

    // --- 服务事项（20条） ---
    const insertItem = d.prepare(`INSERT INTO service_items (id, category_id, name, code, type, department, level, status, handle_scope, handle_conditions, required_materials, handle_flow, charge_standard, legal_basis, promise_days, actual_days, visit_count, online_rate, one_done_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const items = [
      { catIdx: 1, name: '户口迁移办理', code: 'HZ-001', type: 'administrative', department: '公安局', handle_scope: '全省', handle_conditions: '符合户口迁移政策', required_materials: '身份证、户口本、迁移证明', handle_flow: '1.提交申请→2.审核材料→3.审批→4.办理迁移', charge_standard: '免费', legal_basis: '《户口登记条例》', promise_days: 15, actual_days: 10, visit_count: 5230, online_rate: 0.85, one_done_rate: 0.78 },
      { catIdx: 1, name: '居住证办理', code: 'HZ-002', type: 'administrative', department: '公安局', handle_scope: '全市', handle_conditions: '居住满6个月', required_materials: '身份证、居住证明、照片', handle_flow: '1.申请→2.受理→3.制证→4.发证', charge_standard: '免费', legal_basis: '《居住证暂行条例》', promise_days: 10, actual_days: 7, visit_count: 8120, online_rate: 0.92, one_done_rate: 0.88 },
      { catIdx: 1, name: '护照办理', code: 'CR-001', type: 'administrative', department: '出入境管理支队', handle_scope: '全省', handle_conditions: '中国公民', required_materials: '身份证、照片、申请表', handle_flow: '1.预约→2.现场采集→3.审批→4.制证发证', charge_standard: '120元/本', legal_basis: '《护照法》', promise_days: 7, actual_days: 5, visit_count: 6540, online_rate: 0.90, one_done_rate: 0.82 },
      { catIdx: 2, name: '身份证换领', code: 'SFZ-001', type: 'administrative', department: '公安局', handle_scope: '全市', handle_conditions: '身份证到期或损坏', required_materials: '旧身份证、照片', handle_flow: '1.申请→2.信息录入→3.审核→4.制证发证', charge_standard: '20元', legal_basis: '《居民身份证法》', promise_days: 30, actual_days: 15, visit_count: 9870, online_rate: 0.75, one_done_rate: 0.70 },
      { catIdx: 3, name: '社保参保登记', code: 'SB-001', type: 'administrative', department: '社保局', handle_scope: '全省', handle_conditions: '用人单位或灵活就业人员', required_materials: '身份证、劳动合同、申请表', handle_flow: '1.提交材料→2.审核→3.登记→4.发卡', charge_standard: '免费', legal_basis: '《社会保险法》', promise_days: 5, actual_days: 3, visit_count: 12500, online_rate: 0.95, one_done_rate: 0.90 },
      { catIdx: 3, name: '医保异地就医备案', code: 'YB-001', type: 'administrative', department: '医保局', handle_scope: '全国', handle_conditions: '异地居住或转诊', required_materials: '身份证、医保卡、备案申请表', handle_flow: '1.申请→2.审核→3.备案登记→4.通知', charge_standard: '免费', legal_basis: '《基本医疗保险异地就医结算办法》', promise_days: 3, actual_days: 1, visit_count: 7800, online_rate: 0.98, one_done_rate: 0.95 },
      { catIdx: 4, name: '养老金资格认证', code: 'YL-001', type: 'administrative', department: '社保局', handle_scope: '全省', handle_conditions: '退休人员', required_materials: '身份证', handle_flow: '1.人脸识别→2.核验→3.认证完成', charge_standard: '免费', legal_basis: '《养老保险条例》', promise_days: 1, actual_days: 0, visit_count: 15600, online_rate: 0.99, one_done_rate: 0.99 },
      { catIdx: 5, name: '医院预约挂号', code: 'YY-001', type: 'service', department: '卫健委', handle_scope: '全省', handle_conditions: '参保人员', required_materials: '身份证、医保卡', handle_flow: '1.选择医院科室→2.预约时间→3.确认挂号', charge_standard: '按医院标准', legal_basis: '《医疗机构管理条例》', promise_days: 1, actual_days: 0, visit_count: 23400, online_rate: 0.96, one_done_rate: 0.94 },
      { catIdx: 5, name: '居民健康档案建立', code: 'JK-001', type: 'service', department: '卫健委', handle_scope: '全市', handle_conditions: '辖区居民', required_materials: '身份证', handle_flow: '1.申请→2.体检→3.建档→4.归档', charge_standard: '免费', legal_basis: '《基本公共卫生服务规范》', promise_days: 3, actual_days: 2, visit_count: 4560, online_rate: 0.70, one_done_rate: 0.65 },
      { catIdx: 6, name: '生育登记', code: 'SY-001', type: 'administrative', department: '卫健委', handle_scope: '全省', handle_conditions: '符合生育政策', required_materials: '身份证、结婚证、户口本', handle_flow: '1.提交申请→2.审核→3.登记发证', charge_standard: '免费', legal_basis: '《人口与计划生育法》', promise_days: 5, actual_days: 3, visit_count: 6780, online_rate: 0.88, one_done_rate: 0.82 },
      { catIdx: 7, name: '学籍异动办理', code: 'XJ-001', type: 'administrative', department: '教育局', handle_scope: '全市', handle_conditions: '在校学生', required_materials: '学籍证明、转学申请', handle_flow: '1.申请→2.转入转出学校审核→3.教育局审批', charge_standard: '免费', legal_basis: '《学籍管理办法》', promise_days: 10, actual_days: 7, visit_count: 3450, online_rate: 0.80, one_done_rate: 0.72 },
      { catIdx: 7, name: '中考高考报名', code: 'KS-001', type: 'administrative', department: '教育考试院', handle_scope: '全省', handle_conditions: '符合报考条件', required_materials: '身份证、学历证明、照片', handle_flow: '1.网上报名→2.资格审核→3.缴费→4.打印准考证', charge_standard: '按标准收费', legal_basis: '《教育法》', promise_days: 5, actual_days: 3, visit_count: 18200, online_rate: 0.99, one_done_rate: 0.97 },
      { catIdx: 8, name: '公积金提取', code: 'GJJ-001', type: 'administrative', department: '公积金管理中心', handle_scope: '全市', handle_conditions: '满足提取条件', required_materials: '身份证、银行卡、提取申请表', handle_flow: '1.申请→2.审核→3.划款', charge_standard: '免费', legal_basis: '《住房公积金管理条例》', promise_days: 3, actual_days: 2, visit_count: 14300, online_rate: 0.94, one_done_rate: 0.90 },
      { catIdx: 8, name: '公租房申请', code: 'GZF-001', type: 'administrative', department: '住建局', handle_scope: '全市', handle_conditions: '低收入家庭、无房户', required_materials: '身份证、收入证明、无房证明', handle_flow: '1.提交申请→2.资格审核→3.公示→4.摇号配租', charge_standard: '免费', legal_basis: '《公共租赁住房管理办法》', promise_days: 30, actual_days: 25, visit_count: 5670, online_rate: 0.65, one_done_rate: 0.55 },
      { catIdx: 9, name: '社保缴费查询', code: 'SB-002', type: 'query', department: '社保局', handle_scope: '全省', handle_conditions: '参保人员', required_materials: '身份证', handle_flow: '1.身份验证→2.查询→3.结果展示', charge_standard: '免费', legal_basis: '《社会保险法》', promise_days: 1, actual_days: 0, visit_count: 28900, online_rate: 0.99, one_done_rate: 0.99 },
      { catIdx: 10, name: '医保报销申请', code: 'YB-002', type: 'administrative', department: '医保局', handle_scope: '全省', handle_conditions: '参保人员产生医疗费用', required_materials: '发票、费用清单、病历', handle_flow: '1.提交材料→2.审核→3.报销打款', charge_standard: '免费', legal_basis: '《基本医疗保险条例》', promise_days: 20, actual_days: 15, visit_count: 9200, online_rate: 0.78, one_done_rate: 0.70 },
      { catIdx: 9, name: '养老金领取办理', code: 'YL-002', type: 'administrative', department: '社保局', handle_scope: '全省', handle_conditions: '达到法定退休年龄', required_materials: '身份证、退休审批表、银行卡', handle_flow: '1.申请→2.审核→3.核定待遇→4.发放', charge_standard: '免费', legal_basis: '《养老保险条例》', promise_days: 15, actual_days: 10, visit_count: 7650, online_rate: 0.82, one_done_rate: 0.76 },
      { catIdx: 6, name: '出生医学证明办理', code: 'SY-002', type: 'administrative', department: '卫健委', handle_scope: '全省', handle_conditions: '新生儿父母', required_materials: '父母身份证、出生记录', handle_flow: '1.医院开具→2.信息核验→3.签发', charge_standard: '免费', legal_basis: '《出生医学证明管理办法》', promise_days: 3, actual_days: 1, visit_count: 8900, online_rate: 0.60, one_done_rate: 0.55 },
      { catIdx: 4, name: '居住证签注', code: 'HZ-003', type: 'administrative', department: '公安局', handle_scope: '全市', handle_conditions: '居住证到期前30天', required_materials: '身份证、居住证', handle_flow: '1.申请签注→2.核验→3.签注完成', charge_standard: '免费', legal_basis: '《居住证暂行条例》', promise_days: 1, actual_days: 0, visit_count: 4320, online_rate: 0.95, one_done_rate: 0.93 },
      { catIdx: 10, name: '异地就医结算', code: 'YB-003', type: 'administrative', department: '医保局', handle_scope: '全国', handle_conditions: '已备案的异地就医人员', required_materials: '医保卡、就诊记录', handle_flow: '1.就医→2.直接结算→3.个人支付自付部分', charge_standard: '免费', legal_basis: '《异地就医结算办法》', promise_days: 1, actual_days: 0, visit_count: 11200, online_rate: 0.93, one_done_rate: 0.90 },
    ];

    const itemIds = [];
    items.forEach((item) => {
      const id = uuidv4();
      itemIds.push(id);
      insertItem.run(
        id, categories[item.catIdx].id, item.name, item.code, item.type, item.department, 'province', 'active',
        item.handle_scope, item.handle_conditions, item.required_materials, item.handle_flow,
        item.charge_standard, item.legal_basis, item.promise_days, item.actual_days,
        item.visit_count, item.online_rate, item.one_done_rate
      );
    });

    // --- 办理指南 ---
    const insertGuide = d.prepare(`INSERT INTO service_guides (id, service_id, title, content, version, is_current, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    items.forEach((item, i) => {
      insertGuide.run(
        uuidv4(), itemIds[i], `${item.name}办理指南`,
        `## ${item.name}办理指南\n\n### 办理条件\n${item.handle_conditions}\n\n### 所需材料\n${item.required_materials}\n\n### 办理流程\n${item.handle_flow}\n\n### 收费标准\n${item.charge_standard}\n\n### 法律依据\n${item.legal_basis}\n\n### 承诺时限\n${item.promise_days}个工作日`,
        1, 1, users[0].id
      );
    });

    // --- 支付记录 ---
    const insertPayment = d.prepare(`INSERT INTO payments (id, user_id, service_id, order_no, pay_type, amount, status, pay_channel, pay_time, biz_type, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const payStatuses = ['pending', 'completed', 'completed', 'completed', 'failed', 'completed', 'completed', 'refunded', 'completed', 'completed'];
    const payTypes = ['fee', 'fine', 'fee', 'fee', 'tax', 'fee', 'fine', 'fee', 'tax', 'fee'];
    const payChannels = ['alipay', 'wechat', 'bank', 'alipay', 'wechat', 'bank', 'alipay', 'wechat', 'bank', 'alipay'];
    for (let i = 0; i < 10; i++) {
      const payTime = payStatuses[i] === 'pending' || payStatuses[i] === 'failed' ? null : new Date(Date.now() - (10 - i) * 86400000).toISOString();
      insertPayment.run(
        uuidv4(), users[(i % 3) + 2].id, itemIds[i % itemIds.length],
        `ORD${Date.now()}${String(i).padStart(4, '0')}`, payTypes[i],
        parseFloat((Math.random() * 500 + 10).toFixed(2)), payStatuses[i], payChannels[i],
        payTime, payTypes[i] === 'tax' ? 'tax' : 'service',
        `支付记录${i + 1}`
      );
    }

    // --- 审批任务 ---
    const insertApproval = d.prepare(`INSERT INTO approval_tasks (id, title, applicant_id, service_id, current_node, status, priority, level, assigned_to, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const approvalData = [
      { title: '户口迁移审批', applicantIdx: 2, serviceIdx: 0, current_node: '材料审核', status: 'pending', priority: 'normal', assigned_to: users[1].id, due_date: new Date(Date.now() + 7 * 86400000).toISOString() },
      { title: '公租房资格审批', applicantIdx: 4, serviceIdx: 13, current_node: '初审', status: 'in_progress', priority: 'high', assigned_to: users[3].id, due_date: new Date(Date.now() + 5 * 86400000).toISOString() },
      { title: '护照办理审批', applicantIdx: 2, serviceIdx: 2, current_node: '制证', status: 'in_progress', priority: 'normal', assigned_to: users[1].id, due_date: new Date(Date.now() + 3 * 86400000).toISOString() },
      { title: '医保报销审批', applicantIdx: 3, serviceIdx: 15, current_node: '已办结', status: 'completed', priority: 'normal', assigned_to: users[3].id, completed_at: new Date(Date.now() - 2 * 86400000).toISOString() },
      { title: '学籍异动审批', applicantIdx: 4, serviceIdx: 10, current_node: '待提交', status: 'pending', priority: 'low', assigned_to: users[1].id, due_date: new Date(Date.now() + 15 * 86400000).toISOString() },
    ];
    const approvalIds = [];
    approvalData.forEach(a => {
      const id = uuidv4();
      approvalIds.push(id);
      insertApproval.run(id, a.title, users[a.applicantIdx].id, itemIds[a.serviceIdx], a.current_node, a.status, a.priority, 'province', a.assigned_to, a.due_date, now);
    });

    // --- 审批流转记录 ---
    const insertFlow = d.prepare(`INSERT INTO approval_flows (id, task_id, node_name, handler_id, handler_name, action, opinion) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const flowData = [
      { taskIdx: 0, node_name: '提交申请', handler_idx: 2, action: 'submit', opinion: '提交户口迁移申请' },
      { taskIdx: 0, node_name: '材料审核', handler_idx: 1, action: 'reviewing', opinion: '材料审核中' },
      { taskIdx: 1, node_name: '提交申请', handler_idx: 4, action: 'submit', opinion: '提交公租房申请' },
      { taskIdx: 1, node_name: '初审', handler_idx: 3, action: 'in_progress', opinion: '初审进行中' },
      { taskIdx: 2, node_name: '提交申请', handler_idx: 2, action: 'submit', opinion: '申请办理护照' },
      { taskIdx: 2, node_name: '信息核验', handler_idx: 1, action: 'approved', opinion: '信息核验通过' },
      { taskIdx: 3, node_name: '提交申请', handler_idx: 3, action: 'submit', opinion: '申请医保报销' },
      { taskIdx: 3, node_name: '审核', handler_idx: 3, action: 'approved', opinion: '报销材料齐全，审核通过' },
      { taskIdx: 3, node_name: '已办结', handler_idx: 3, action: 'completed', opinion: '报销款项已打款' },
    ];
    flowData.forEach(f => {
      insertFlow.run(uuidv4(), approvalIds[f.taskIdx], f.node_name, users[f.handler_idx].id, users[f.handler_idx].real_name, f.action, f.opinion);
    });

    // --- 行为统计 ---
    const insertBehavior = d.prepare(`INSERT INTO behavior_stats (id, service_id, service_name, visit_count, apply_count, complete_count, avg_days, bottleneck_node, stat_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const statDate = new Date().toISOString().split('T')[0];
    items.forEach((item, i) => {
      insertBehavior.run(
        uuidv4(), itemIds[i], item.name,
        item.visit_count, Math.floor(item.visit_count * 0.4), Math.floor(item.visit_count * 0.35),
        item.actual_days || 0, i % 3 === 0 ? '材料审核' : (i % 3 === 1 ? '现场办理' : '审批环节'),
        statDate
      );
    });

    // --- 营商环境指标 ---
    const insertBiz = d.prepare(`INSERT INTO biz_metrics (id, metric_name, metric_value, unit, period, year, month) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const bizMetricsData = [
      { name: '政务服务网上可办率', value: 95.8, unit: '%', period: 'monthly' },
      { name: '一网通办率', value: 89.3, unit: '%', period: 'monthly' },
      { name: '平均办理时限', value: 5.2, unit: '天', period: 'monthly' },
      { name: '群众满意度', value: 92.1, unit: '%', period: 'monthly' },
      { name: '材料减免率', value: 45.6, unit: '%', period: 'monthly' },
      { name: '跨省通办事项数', value: 128, unit: '项', period: 'monthly' },
      { name: '电子证照应用率', value: 78.5, unit: '%', period: 'monthly' },
      { name: '数据共享调用量', value: 156800, unit: '万次', period: 'monthly' },
      { name: '好差评主动评价率', value: 83.2, unit: '%', period: 'monthly' },
      { name: '企业开办平均时限', value: 1.5, unit: '天', period: 'monthly' },
      { name: '工程建设项目审批时限', value: 45, unit: '天', period: 'monthly' },
      { name: '不动产登记平均时限', value: 3, unit: '天', period: 'monthly' },
    ];
    bizMetricsData.forEach(m => {
      insertBiz.run(uuidv4(), m.name, m.value, m.unit, m.period, currentYear, currentMonth);
    });

    // --- AI问答知识库（consultations表，20条） ---
    const insertConsult = d.prepare(`INSERT INTO consultations (id, user_id, question, answer, ai_answer, source, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const consultations = [
      { q: '如何办理户口迁移', a: '户口迁移需要先到迁入地派出所申请，提交身份证、户口本、迁移证明等材料，审核通过后即可办理迁移手续。', ai: '您好！户口迁移办理流程如下：\n1. 到迁入地派出所提交申请\n2. 准备材料：身份证、户口本、迁移证明\n3. 审核通过后办理迁移\n一般承诺15个工作日办结。' },
      { q: '居住证怎么办理', a: '居住证办理需要居住满6个月，携带身份证和居住证明到辖区派出所办理。', ai: '您好！居住证办理须知：\n1. 前提条件：居住满6个月\n2. 所需材料：身份证、居住证明、照片\n3. 办理地点：辖区派出所\n4. 办理时限：10个工作日\n也可通过线上平台预约办理。' },
      { q: '护照办理需要什么材料', a: '护照办理需要身份证、照片和申请表，到出入境管理支队办理。', ai: '您好！护照办理所需材料：\n1. 本人身份证\n2. 近期正面免冠照片\n3. 填写《中国公民出入境证件申请表》\n办理地点：出入境管理支队\n费用：120元/本\n办理时限：7个工作日' },
      { q: '社保怎么参保', a: '社保参保需要身份证、劳动合同和申请表，到社保局办理。', ai: '您好！社保参保登记流程：\n1. 准备材料：身份证、劳动合同、参保申请表\n2. 办理渠道：社保局窗口或线上平台\n3. 办理时限：5个工作日\n4. 费用：免费\n灵活就业人员也可参保，需提供灵活就业证明。' },
      { q: '医保异地就医怎么备案', a: '异地就医需要先备案，携带身份证和医保卡到医保局或线上办理。', ai: '您好！异地就医备案指南：\n1. 备案条件：异地居住或转诊\n2. 所需材料：身份证、医保卡、备案申请表\n3. 办理方式：线上（国家医保服务平台）或线下\n4. 办理时限：3个工作日\n5. 费用：免费\n备案后可实现异地直接结算。' },
      { q: '养老金如何领取', a: '达到法定退休年龄后，携带身份证、退休审批表和银行卡到社保局办理。', ai: '您好！养老金领取办理：\n1. 条件：达到法定退休年龄并累计缴费满15年\n2. 材料：身份证、退休审批表、银行卡\n3. 流程：申请→审核→核定待遇→按月发放\n4. 办理时限：15个工作日\n也可通过线上进行资格认证。' },
      { q: '如何预约挂号', a: '可通过卫健委平台或医院官方渠道进行预约挂号。', ai: '您好！预约挂号方式：\n1. 线上预约：卫健委平台、医院官网/APP\n2. 电话预约：拨打医院预约电话\n3. 现场预约：医院自助机\n4. 所需：身份证、医保卡\n建议提前1-7天预约。' },
      { q: '公积金怎么提取', a: '公积金提取需要身份证、银行卡和提取申请表，到公积金中心办理。', ai: '您好！公积金提取指南：\n1. 提取条件：购房、租房、退休等\n2. 所需材料：身份证、银行卡、提取申请表\n3. 办理方式：公积金中心窗口或线上\n4. 办理时限：3个工作日\n5. 费用：免费' },
      { q: '公租房如何申请', a: '公租房申请需为低收入家庭或无房户，提交身份证、收入证明和无房证明。', ai: '您好！公租房申请流程：\n1. 申请条件：低收入家庭、无房户\n2. 所需材料：身份证、收入证明、无房证明\n3. 流程：提交申请→资格审核→公示→摇号配租\n4. 办理时限：30个工作日\n5. 费用：免费\n详情可咨询当地住建局。' },
      { q: '身份证到期怎么换', a: '身份证到期前可到派出所换领，需要旧身份证和照片。', ai: '您好！身份证换领指南：\n1. 换领条件：身份证到期或损坏\n2. 所需材料：旧身份证、照片\n3. 办理地点：户籍所在地派出所\n4. 流程：申请→信息录入→审核→制证发证\n5. 费用：20元\n6. 时限：30个工作日\n建议到期前3个月办理。' },
      { q: '生育登记在哪里办', a: '生育登记到当地卫健委窗口或线上办理。', ai: '您好！生育登记办理：\n1. 条件：符合生育政策\n2. 材料：身份证、结婚证、户口本\n3. 方式：卫健委窗口或线上\n4. 时限：5个工作日\n5. 费用：免费' },
      { q: '学籍异动怎么办理', a: '学籍异动需要转学申请和学籍证明，经转入转出学校审核后报教育局审批。', ai: '您好！学籍异动办理流程：\n1. 条件：在校学生需转学\n2. 材料：学籍证明、转学申请\n3. 流程：申请→转入转出学校审核→教育局审批\n4. 时限：10个工作日\n5. 费用：免费\n建议提前与双方学校沟通。' },
      { q: '中考怎么报名', a: '中考报名通过教育考试院官网进行网上报名。', ai: '您好！中考报名流程：\n1. 条件：符合报考条件的初中毕业生\n2. 材料：身份证、学历证明、照片\n3. 流程：网上报名→资格审核→缴费→打印准考证\n4. 时限：5个工作日\n5. 费用：按标准收费\n关注教育考试院官网获取报名时间。' },
      { q: '医保报销需要什么材料', a: '医保报销需要发票、费用清单和病历。', ai: '您好！医保报销所需材料：\n1. 医疗费用发票\n2. 费用清单\n3. 病历记录\n4. 医保卡\n5. 银行卡\n办理时限：20个工作日\n建议保留好所有就医票据。' },
      { q: '出生证明怎么办理', a: '出生证明在出生医院开具，需要父母身份证和出生记录。', ai: '您好！出生医学证明办理：\n1. 条件：新生儿父母\n2. 材料：父母身份证、出生记录\n3. 流程：医院开具→信息核验→签发\n4. 时限：3个工作日\n5. 费用：免费\n建议在新生儿出生后1个月内办理。' },
      { q: '居住证如何签注', a: '居住证到期前30天可申请签注，带身份证和居住证办理。', ai: '您好！居住证签注指南：\n1. 签注时间：到期前30天\n2. 材料：身份证、居住证\n3. 方式：线上或线下\n4. 时限：即时办结\n5. 费用：免费\n逾期未签注将影响居住证使用。' },
      { q: '社保缴费怎么查询', a: '社保缴费可通过社保局官网或APP查询。', ai: '您好！社保缴费查询方式：\n1. 线上：社保局官网、APP、小程序\n2. 线下：社保局窗口、自助机\n3. 所需：身份证或社保卡\n4. 可查询：缴费明细、个人账户余额\n5. 费用：免费' },
      { q: '异地就医怎么结算', a: '异地就医需先备案，备案后可直接结算。', ai: '您好！异地就医直接结算：\n1. 前提：已完成异地就医备案\n2. 结算方式：持医保卡在就医地直接结算\n3. 只需支付个人自付部分\n4. 无需回参保地报销\n5. 费用：免费\n如未备案，需先备案再就医。' },
      { q: '健康档案怎么建立', a: '居民健康档案到社区卫生服务中心建立，带身份证即可。', ai: '您好！居民健康档案建立：\n1. 条件：辖区居民\n2. 材料：身份证\n3. 流程：申请→体检→建档→归档\n4. 地点：社区卫生服务中心\n5. 时限：3个工作日\n6. 费用：免费' },
      { q: '营业执照怎么办', a: '营业执照到市场监管局办理或线上申请。', ai: '您好！营业执照办理：\n1. 条件：拟设立企业或个体工商户\n2. 材料：身份证、经营场所证明、申请书\n3. 方式：市场监管局窗口或线上\n4. 时限：1-5个工作日\n5. 费用：免费\n企业开办已实现一网通办。' },
    ];
    consultations.forEach(c => {
      insertConsult.run(uuidv4(), null, c.q, c.a, c.ai, 'ai', 'answered');
    });

    // --- 服务可用性 ---
    const insertAvailability = d.prepare(`INSERT INTO service_availability (id, service_id, check_time, is_available, error_msg, response_time) VALUES (?, ?, ?, ?, ?, ?)`);
    items.forEach((_, i) => {
      const isAvailable = Math.random() > 0.1 ? 1 : 0;
      insertAvailability.run(uuidv4(), itemIds[i], now, isAvailable, isAvailable ? null : '服务超时', Math.floor(Math.random() * 500 + 50));
    });

    // --- 共享材料 ---
    const insertMaterial = d.prepare(`INSERT INTO shared_materials (id, title, material_type, source_level, source_org, file_path, shared_scope, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const materialsData = [
      { title: '身份证电子证照模板', material_type: 'template', source_level: 'province', source_org: '公安厅', file_path: '/materials/id_card_template.pdf', shared_scope: 'province' },
      { title: '社保参保申请表', material_type: 'form', source_level: 'province', source_org: '人社厅', file_path: '/materials/social_insurance_form.pdf', shared_scope: 'province' },
      { title: '公积金提取申请表', material_type: 'form', source_level: 'city', source_org: '公积金中心', file_path: '/materials/housing_fund_form.pdf', shared_scope: 'city' },
      { title: '户籍迁移审批表', material_type: 'form', source_level: 'province', source_org: '公安厅', file_path: '/materials/hukou_migration_form.pdf', shared_scope: 'province' },
      { title: '医保报销材料清单', material_type: 'guide', source_level: 'province', source_org: '医保局', file_path: '/materials/medical_reimbursement_guide.pdf', shared_scope: 'province' },
    ];
    materialsData.forEach(m => {
      insertMaterial.run(uuidv4(), m.title, m.material_type, m.source_level, m.source_org, m.file_path, m.shared_scope, 'active', users[0].id);
    });

  });

  insert();
}

function initDatabase() {
  createTables();
  seedData();
}

module.exports = { getDb, initDatabase };
