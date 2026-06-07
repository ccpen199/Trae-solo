import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db = null;

const TABLES = [
  `CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    parent_id INTEGER,
    level INTEGER DEFAULT 1,
    contact_phone TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (parent_id) REFERENCES departments(id)
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    real_name TEXT NOT NULL,
    id_number TEXT,
    phone TEXT,
    email TEXT,
    user_type TEXT NOT NULL DEFAULT 'person' CHECK(user_type IN ('person','enterprise','staff','admin')),
    department_id INTEGER,
    role TEXT DEFAULT 'user' CHECK(role IN ('user','operator','reviewer','admin','super_admin')),
    avatar TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','disabled','locked')),
    last_login_at TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (department_id) REFERENCES departments(id)
  )`,
  `CREATE TABLE IF NOT EXISTS service_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    department_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    type TEXT DEFAULT 'promise' CHECK(type IN ('promise','approval','compulsory','service')),
    description TEXT,
    legal_basis TEXT,
    conditions TEXT,
    required_materials TEXT,
    process_config TEXT,
    time_limit INTEGER DEFAULT 20,
    time_unit TEXT DEFAULT 'workday' CHECK(time_unit IN ('workday','natural_day')),
    charge_standard TEXT,
    result_type TEXT,
    online_handle INTEGER DEFAULT 1,
    handle_window TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','draft')),
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (department_id) REFERENCES departments(id)
  )`,
  `CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    item_id INTEGER,
    category TEXT DEFAULT 'paper' CHECK(category IN ('paper','electronic','both')),
    is_required INTEGER DEFAULT 1,
    description TEXT,
    template_path TEXT,
    sample_path TEXT,
    format_requirement TEXT,
    source_channel TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (item_id) REFERENCES service_items(id)
  )`,
  `CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_no TEXT UNIQUE NOT NULL,
    item_id INTEGER NOT NULL,
    applicant_id INTEGER NOT NULL,
    applicant_name TEXT NOT NULL,
    applicant_phone TEXT,
    status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted','accepted','reviewing','supplementing','approved','rejected','completed','archived','withdrawn')),
    current_step TEXT,
    urgency TEXT DEFAULT 'normal' CHECK(urgency IN ('normal','urgent','very_urgent')),
    submit_data TEXT,
    result_content TEXT,
    result_file TEXT,
    deadline TEXT,
    accept_at TEXT,
    complete_at TEXT,
    archive_at TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (item_id) REFERENCES service_items(id),
    FOREIGN KEY (applicant_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS case_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    handler_id INTEGER,
    handler_name TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','rejected','returned')),
    opinion TEXT,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (handler_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS case_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    material_name TEXT NOT NULL,
    file_path TEXT,
    file_name TEXT,
    check_status TEXT DEFAULT 'pending' CHECK(check_status IN ('pending','passed','failed')),
    check_opinion TEXT,
    uploaded_at TEXT DEFAULT (datetime('now','localtime')),
    checked_at TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (material_id) REFERENCES materials(id)
  )`,
  `CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    cert_type TEXT NOT NULL,
    holder_id INTEGER,
    holder_name TEXT NOT NULL,
    holder_id_number TEXT,
    issue_department TEXT,
    issue_date TEXT,
    expire_date TEXT,
    file_path TEXT,
    status TEXT DEFAULT 'valid' CHECK(status IN ('valid','expired','revoked','replacing')),
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (holder_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'system' CHECK(type IN ('system','case','certificate','approval')),
    is_read INTEGER DEFAULT 0,
    link TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    speed_score INTEGER CHECK(speed_score BETWEEN 1 AND 5),
    attitude_score INTEGER CHECK(attitude_score BETWEEN 1 AND 5),
    quality_score INTEGER CHECK(quality_score BETWEEN 1 AND 5),
    content TEXT,
    is_anonymous INTEGER DEFAULT 0,
    reply TEXT,
    replied_at TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS approval_flows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    item_id INTEGER,
    department_id INTEGER,
    steps TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (item_id) REFERENCES service_items(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
  )`,
  `CREATE TABLE IF NOT EXISTS data_sharing_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_dept TEXT NOT NULL,
    target_dept TEXT NOT NULL,
    data_type TEXT NOT NULL,
    data_content TEXT,
    purpose TEXT,
    status TEXT DEFAULT 'requested' CHECK(status IN ('requested','approved','rejected','completed')),
    requested_at TEXT DEFAULT (datetime('now','localtime')),
    completed_at TEXT,
    FOREIGN KEY (source_dept) REFERENCES departments(name),
    FOREIGN KEY (target_dept) REFERENCES departments(name)
  )`
];

function seedDepartments() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM departments').get().cnt;
  if (count > 0) return;

  const departments = [
    { name: '公安厅', code: 'GA' },
    { name: '人社厅', code: 'RS' },
    { name: '医保局', code: 'YB' },
    { name: '税务局', code: 'SW' },
    { name: '教育厅', code: 'JY' },
    { name: '住建厅', code: 'ZJ' },
    { name: '民政厅', code: 'MZ' },
    { name: '司法厅', code: 'SF' },
    { name: '财政厅', code: 'CZ' },
    { name: '自然资源厅', code: 'ZR' },
    { name: '生态环境厅', code: 'ST' },
    { name: '交通运输厅', code: 'JT' },
    { name: '水利厅', code: 'SL' },
    { name: '农业农村厅', code: 'NY' },
    { name: '商务厅', code: 'SWB' },
    { name: '文旅厅', code: 'WL' },
    { name: '卫健委', code: 'WJ' },
    { name: '应急厅', code: 'YJ' },
    { name: '审计厅', code: 'SJ' },
    { name: '市场监管局', code: 'SC' },
    { name: '林草局', code: 'LC' },
    { name: '体育局', code: 'TY' },
    { name: '统计局', code: 'TJ' },
    { name: '人防办', code: 'RF' },
    { name: '信访局', code: 'XF' },
    { name: '地震局', code: 'DZ' },
    { name: '气象局', code: 'QX' },
    { name: '邮政局', code: 'YZ' },
    { name: '药监局', code: 'YJY' },
    { name: '知识产权局', code: 'ZS' },
    { name: '广电局', code: 'GD' },
    { name: '档案局', code: 'DA' },
    { name: '机关事务局', code: 'JG' },
    { name: '外事办', code: 'WS' },
    { name: '侨务办', code: 'QW' },
    { name: '地方金融监管局', code: 'JR' },
    { name: '粮食和储备局', code: 'LS' },
    { name: '能源局', code: 'NYN' },
    { name: '数据局', code: 'SJU' },
    { name: '政务服务管理局', code: 'ZW' }
  ];

  const insert = db.prepare('INSERT INTO departments (name, code) VALUES (?, ?)');
  const transaction = db.transaction(() => {
    for (const dept of departments) {
      insert.run(dept.name, dept.code);
    }
  });
  transaction();
}

function seedAdminUser() {
  const hash = bcrypt.hashSync('admin123', 10);
  const users = [
    { username: 'admin', real_name: '系统管理员', user_type: 'admin', role: 'super_admin', department_id: 40, status: 'active', phone: null, id_number: null },
    { username: 'platform', real_name: '平台管理员', user_type: 'staff', role: 'admin', department_id: 40, status: 'active', phone: '13800002222', id_number: '530102198801011235' },
    { username: 'ops', real_name: '业务经办员', user_type: 'staff', role: 'operator', department_id: 1, status: 'active', phone: '13800003333', id_number: '530102198701011236' },
    { username: 'reviewer', real_name: '审核专员', user_type: 'staff', role: 'reviewer', department_id: 1, status: 'active', phone: '13800004444', id_number: '530102198601011237' },
    { username: 'citizen', real_name: '张三', user_type: 'person', role: 'user', department_id: null, status: 'active', phone: '13800001111', id_number: '530102199001011234' },
  ];
  const insert = db.prepare(`
    INSERT OR IGNORE INTO users (username, password_hash, real_name, user_type, role, department_id, status, phone, id_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const transaction = db.transaction(() => {
    for (const u of users) {
      insert.run(u.username, hash, u.real_name, u.user_type, u.role, u.department_id, u.status, u.phone, u.id_number);
    }
  });
  transaction();
}

function seedServiceItems() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM service_items').get().cnt;
  if (count > 0) return;

  const processConfig = JSON.stringify([
    { step: '受理', type: 'accept' },
    { step: '审核', type: 'review' },
    { step: '审批', type: 'approve' },
    { step: '办结', type: 'complete' }
  ]);

  const items = [
    { name: '居民身份证换领', code: 'GA001', dept_code: 'GA', category: '户籍管理', type: 'promise', description: '居民身份证有效期满、损坏或信息变更时申请换领新证', legal_basis: '《中华人民共和国居民身份证法》', conditions: '居民身份证有效期满、证件损坏或登记项目变更', required_materials: JSON.stringify(['户口簿', '原居民身份证', '近期免冠照片']), time_limit: 60, result_type: '居民身份证' },
    { name: '社保卡申领', code: 'RS001', dept_code: 'RS', category: '社会保障', type: 'service', description: '首次申领或补换社会保障卡', legal_basis: '《中华人民共和国社会保险法》', conditions: '参加社会保险的人员', required_materials: JSON.stringify(['身份证', '照片回执', '申请表']), time_limit: 30, result_type: '社会保障卡' },
    { name: '医保异地就医备案', code: 'YB001', dept_code: 'YB', category: '医疗保障', type: 'service', description: '跨省或省内异地就医备案登记', legal_basis: '《基本医疗保险跨省异地就医结算经办规程》', conditions: '参加基本医疗保险需异地就医人员', required_materials: JSON.stringify(['身份证', '社保卡', '异地就医备案表']), time_limit: 5, result_type: '备案确认' },
    { name: '增值税一般纳税人登记', code: 'SW001', dept_code: 'SW', category: '税务服务', type: 'approval', description: '增值税一般纳税人资格登记', legal_basis: '《增值税一般纳税人登记管理办法》', conditions: '年应税销售额超过规定标准或主动申请', required_materials: JSON.stringify(['营业执照', '税务登记证', '一般纳税人登记表']), time_limit: 5, result_type: '一般纳税人资格证明' },
    { name: '住房公积金提取', code: 'ZJ001', dept_code: 'ZJ', category: '住房保障', type: 'service', description: '住房公积金提取业务办理', legal_basis: '《住房公积金管理条例》', conditions: '购买、建造、翻建自住住房或退休等情形', required_materials: JSON.stringify(['身份证', '公积金联名卡', '提取原因证明材料', '申请表']), time_limit: 3, result_type: '提取资金' },
    { name: '个体工商户注册', code: 'SC001', dept_code: 'SC', category: '市场准入', type: 'approval', description: '个体工商户设立登记', legal_basis: '《个体工商户条例》', conditions: '有经营能力的城镇待业人员、农村村民等', required_materials: JSON.stringify(['身份证', '经营场所证明', '申请书', '照片']), time_limit: 3, result_type: '营业执照' },
    { name: '建筑工程施工许可证核发', code: 'ZJ002', dept_code: 'ZJ', category: '工程建设', type: 'approval', description: '建筑工程施工许可证的核发', legal_basis: '《中华人民共和国建筑法》', conditions: '已取得用地批准、规划许可等前置手续', required_materials: JSON.stringify(['用地批准文件', '规划许可证', '施工图审查合格书', '中标通知书', '施工合同']), time_limit: 15, result_type: '施工许可证' },
    { name: '最低生活保障申请', code: 'MZ001', dept_code: 'MZ', category: '社会救助', type: 'service', description: '城乡居民最低生活保障申请', legal_basis: '《社会救助暂行办法》', conditions: '家庭人均收入低于当地最低生活保障标准', required_materials: JSON.stringify(['身份证', '户口簿', '收入证明', '申请表']), time_limit: 30, result_type: '低保证' },
    { name: '法律援助申请', code: 'SF001', dept_code: 'SF', category: '法律服务', type: 'service', description: '经济困难公民法律援助申请', legal_basis: '《法律援助法》', conditions: '经济困难且需要法律帮助的公民', required_materials: JSON.stringify(['身份证', '经济困难证明', '案件相关材料']), time_limit: 7, result_type: '法律援助决定书' },
    { name: '不动产登记', code: 'ZR001', dept_code: 'ZR', category: '不动产', type: 'approval', description: '不动产权利登记', legal_basis: '《不动产登记暂行条例》', conditions: '取得不动产权利的当事人', required_materials: JSON.stringify(['身份证', '权属来源证明', '宗地图', '申请表']), time_limit: 30, result_type: '不动产权证' },
    { name: '环境影响评价审批', code: 'ST001', dept_code: 'ST', category: '环境保护', type: 'approval', description: '建设项目环境影响评价文件审批', legal_basis: '《中华人民共和国环境影响评价法》', conditions: '建设对环境有影响的项目', required_materials: JSON.stringify(['项目建议书', '环评报告书', '公众参与说明']), time_limit: 60, result_type: '环评批复' },
    { name: '道路运输经营许可', code: 'JT001', dept_code: 'JT', category: '交通运输', type: 'approval', description: '道路运输经营许可证核发', legal_basis: '《道路运输条例》', conditions: '具备相应车辆、人员及管理制度', required_materials: JSON.stringify(['身份证', '车辆证明', '驾驶员资格证', '安全生产管理制度', '申请表']), time_limit: 20, result_type: '道路运输经营许可证' },
    { name: '取水许可', code: 'SL001', dept_code: 'SL', category: '水利服务', type: 'approval', description: '取水许可证核发', legal_basis: '《取水许可和水资源费征收管理条例》', conditions: '利用取水工程或设施直接从江河湖泊或地下取用水资源', required_materials: JSON.stringify(['申请书', '水资源论证报告', '取水工程方案']), time_limit: 45, result_type: '取水许可证' },
    { name: '农作物种子生产经营许可', code: 'NY001', dept_code: 'NY', category: '农业服务', type: 'approval', description: '农作物种子生产经营许可证核发', legal_basis: '《种子法》', conditions: '具备种子生产经营条件和检验设施', required_materials: JSON.stringify(['申请表', '检验设施证明', '生产地点证明', '品种权属证明']), time_limit: 20, result_type: '种子生产经营许可证' },
    { name: '外商投资企业备案', code: 'SWB001', dept_code: 'SWB', category: '商务服务', type: 'service', description: '外商投资企业设立及变更备案', legal_basis: '《外商投资法》', conditions: '外国投资者在中国境内投资', required_materials: JSON.stringify(['投资方证明', '企业章程', '法定代表人身份证明']), time_limit: 3, result_type: '备案回执' },
    { name: '旅行社业务经营许可', code: 'WL001', dept_code: 'WL', category: '文化旅游', type: 'approval', description: '旅行社业务经营许可证核发', legal_basis: '《旅行社条例》', conditions: '有固定的经营场所和必要的营业设施', required_materials: JSON.stringify(['申请书', '营业执照', '法定代表人履历', '导游人员证明', '营业设施证明']), time_limit: 20, result_type: '旅行社业务经营许可证' },
    { name: '医师执业注册', code: 'WJ001', dept_code: 'WJ', category: '医疗卫生', type: 'service', description: '医师执业注册办理', legal_basis: '《医师法》', conditions: '取得医师资格', required_materials: JSON.stringify(['医师资格证书', '身份证', '聘用证明', '体检证明']), time_limit: 20, result_type: '医师执业证' },
    { name: '安全生产许可', code: 'YJ001', dept_code: 'YJ', category: '应急管理', type: 'approval', description: '安全生产许可证核发', legal_basis: '《安全生产许可证条例》', conditions: '从事矿山、危险化学品等高危行业', required_materials: JSON.stringify(['申请表', '安全评价报告', '安全管理制度', '应急预案']), time_limit: 45, result_type: '安全生产许可证' },
    { name: '特种设备使用登记', code: 'SC002', dept_code: 'SC', category: '市场准入', type: 'approval', description: '特种设备使用登记办理', legal_basis: '《特种设备安全法》', conditions: '使用特种设备的单位或个人', required_materials: JSON.stringify(['使用登记表', '产品合格证', '监督检验证明', '操作人员证书']), time_limit: 15, result_type: '使用登记证' },
    { name: '林木采伐许可', code: 'LC001', dept_code: 'LC', category: '林业服务', type: 'approval', description: '林木采伐许可证核发', legal_basis: '《森林法》', conditions: '需要采伐林木的单位或个人', required_materials: JSON.stringify(['采伐申请表', '林权证明', '伐区调查设计文件']), time_limit: 30, result_type: '林木采伐许可证' }
  ];

  const insertItem = db.prepare(`
    INSERT INTO service_items (name, code, department_id, category, type, description, legal_basis, conditions, required_materials, process_config, time_limit, time_unit, result_type, online_handle, status)
    VALUES (?, ?, (SELECT id FROM departments WHERE code = ?), ?, ?, ?, ?, ?, ?, ?, ?, 'workday', ?, 1, 'active')
  `);

  const transaction = db.transaction(() => {
    for (const item of items) {
      insertItem.run(item.name, item.code, item.dept_code, item.category, item.type, item.description, item.legal_basis, item.conditions, item.required_materials, processConfig, item.time_limit, item.result_type);
    }
  });
  transaction();
}

function seedMaterials() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM materials').get().cnt;
  if (count > 0) return;

  const sampleMaterials = [
    { name: '身份证复印件', code: 'MAT001', item_id: 1, category: 'both', is_required: 1, description: '申请人身份证正反面复印件', source_channel: '公安部门' },
    { name: '户口簿', code: 'MAT002', item_id: 1, category: 'paper', is_required: 1, description: '原件及复印件', source_channel: '公安部门' },
    { name: '申请表', code: 'MAT003', item_id: 2, category: 'both', is_required: 1, description: '社保卡申领登记表', source_channel: '人社部门' },
    { name: '照片回执', code: 'MAT004', item_id: 2, category: 'paper', is_required: 1, description: '符合规格的数码照片回执', source_channel: '照相馆' },
    { name: '异地就医备案表', code: 'MAT005', item_id: 3, category: 'both', is_required: 1, description: '异地就医备案申请表', source_channel: '医保部门' },
    { name: '营业执照', code: 'MAT006', item_id: 4, category: 'both', is_required: 1, description: '营业执照副本', source_channel: '市场监管部门' },
    { name: '公积金联名卡', code: 'MAT007', item_id: 5, category: 'both', is_required: 1, description: '住房公积金联名卡', source_channel: '公积金中心' },
    { name: '经营场所证明', code: 'MAT008', item_id: 6, category: 'paper', is_required: 1, description: '房屋租赁合同或产权证', source_channel: '房产部门' },
    { name: '用地批准文件', code: 'MAT009', item_id: 7, category: 'paper', is_required: 1, description: '建设用地批准书', source_channel: '自然资源部门' },
    { name: '收入证明', code: 'MAT010', item_id: 8, category: 'paper', is_required: 1, description: '家庭收入证明材料', source_channel: '所在单位或社区' },
    { name: '经济困难证明', code: 'MAT011', item_id: 9, category: 'paper', is_required: 1, description: '经济困难状况证明', source_channel: '民政部门' },
    { name: '权属来源证明', code: 'MAT012', item_id: 10, category: 'paper', is_required: 1, description: '不动产权属来源证明文件', source_channel: '自然资源部门' },
    { name: '环评报告书', code: 'MAT013', item_id: 11, category: 'paper', is_required: 1, description: '环境影响评价报告书', source_channel: '环评机构' },
    { name: '驾驶员资格证', code: 'MAT014', item_id: 12, category: 'paper', is_required: 1, description: '机动车驾驶员资格证', source_channel: '交通运输部门' },
    { name: '水资源论证报告', code: 'MAT015', item_id: 13, category: 'paper', is_required: 1, description: '水资源论证报告书', source_channel: '水利部门' }
  ];

  const insert = db.prepare(`
    INSERT INTO materials (name, code, item_id, category, is_required, description, source_channel)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const mat of sampleMaterials) {
      insert.run(mat.name, mat.code, mat.item_id, mat.category, mat.is_required, mat.description, mat.source_channel);
    }
  });
  transaction();
}

function seedDemoCases() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM cases').get().cnt;
  if (count > 0) return;

  const cases = [
    { case_no: 'YN20260601000001', item_id: 1, applicant_id: 1, applicant_name: '系统管理员', applicant_phone: '13800000000', status: 'accepted', current_step: '审核', urgency: 'normal', deadline: '2026-07-20' },
    { case_no: 'YN20260602000002', item_id: 2, applicant_id: 1, applicant_name: '系统管理员', applicant_phone: '13800000000', status: 'reviewing', current_step: '审批', urgency: 'normal', deadline: '2026-07-01' },
    { case_no: 'YN20260603000003', item_id: 5, applicant_id: 1, applicant_name: '系统管理员', applicant_phone: '13800000000', status: 'completed', current_step: '办结', urgency: 'normal', deadline: '2026-06-10', complete_at: '2026-06-05' },
    { case_no: 'YN20260603000004', item_id: 8, applicant_id: 1, applicant_name: '系统管理员', applicant_phone: '13800000000', status: 'submitted', current_step: '受理', urgency: 'urgent', deadline: '2026-07-03' },
    { case_no: 'YN20260604000005', item_id: 10, applicant_id: 1, applicant_name: '系统管理员', applicant_phone: '13800000000', status: 'approved', current_step: '办结', urgency: 'normal', deadline: '2026-07-04' }
  ];

  const insertCase = db.prepare(`
    INSERT INTO cases (case_no, item_id, applicant_id, applicant_name, applicant_phone, status, current_step, urgency, deadline, complete_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertStep = db.prepare(`
    INSERT INTO case_steps (case_id, step_name, step_order, status, started_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const stepsTemplate = ['受理', '审核', '审批', '办结'];

  const transaction = db.transaction(() => {
    for (const c of cases) {
      insertCase.run(c.case_no, c.item_id, c.applicant_id, c.applicant_name, c.applicant_phone, c.status, c.current_step, c.urgency, c.deadline, c.complete_at || null);
      const caseId = db.prepare('SELECT last_insert_rowid() as id').get().id;
      const currentIdx = stepsTemplate.indexOf(c.current_step);
      for (let i = 0; i < stepsTemplate.length; i++) {
        let stepStatus = 'pending';
        let startedAt = null;
        let completedAt = null;
        if (i < currentIdx) {
          stepStatus = 'completed';
          startedAt = '2026-06-01 09:00:00';
          completedAt = '2026-06-02 17:00:00';
        } else if (i === currentIdx && (c.status === 'completed' || c.status === 'approved')) {
          stepStatus = 'completed';
          startedAt = '2026-06-03 09:00:00';
          completedAt = '2026-06-05 17:00:00';
        } else if (i === currentIdx) {
          stepStatus = 'processing';
          startedAt = '2026-06-03 09:00:00';
        }
        insertStep.run(caseId, stepsTemplate[i], i + 1, stepStatus, startedAt, completedAt);
      }
    }
  });
  transaction();
}

function seedNotifications() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM notifications').get().cnt;
  if (count > 0) return;

  const notifications = [
    { user_id: 1, title: '您的案件已受理', content: '您的居民身份证换领申请已受理，正在审核中。', type: 'case', link: '/cases/1' },
    { user_id: 1, title: '社保卡申领审核中', content: '您的社保卡申领已进入审批环节。', type: 'case', link: '/cases/2' },
    { user_id: 1, title: '住房公积金提取已完成', content: '您的住房公积金提取业务已办结，请及时查收。', type: 'case', link: '/cases/3' },
    { user_id: 1, title: '系统维护通知', content: '系统将于2026年6月10日22:00-次日6:00进行维护升级。', type: 'system', link: '' },
    { user_id: 1, title: '欢迎注册云南省一体化政务服务平台', content: '您已成功注册，可以开始办理各类政务服务事项。', type: 'system', link: '' }
  ];

  const insert = db.prepare(`
    INSERT INTO notifications (user_id, title, content, type, link)
    VALUES (?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const n of notifications) {
      insert.run(n.user_id, n.title, n.content, n.type, n.link);
    }
  });
  transaction();
}

export function initDB() {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const dbPath = process.env.DB_PATH
    ? path.resolve(projectRoot, process.env.DB_PATH)
    : path.resolve(projectRoot, 'data/app.sqlite');

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  for (const sql of TABLES) {
    db.exec(sql);
  }

  seedDepartments();
  seedAdminUser();
  seedServiceItems();
  seedMaterials();
  seedDemoCases();
  seedNotifications();

  db.prepare(`UPDATE users SET department_id = 40 WHERE username = 'admin' AND department_id IS NULL`).run();
  db.prepare(`UPDATE users SET department_id = 40 WHERE username = 'platform' AND department_id IS NULL`).run();
  db.prepare(`UPDATE users SET department_id = 1 WHERE username = 'ops' AND department_id IS NULL`).run();
  db.prepare(`UPDATE users SET department_id = 1 WHERE username = 'reviewer' AND department_id IS NULL`).run();

  const caseCount = db.prepare("SELECT COUNT(*) as cnt FROM cases WHERE applicant_id = (SELECT id FROM users WHERE username = 'citizen')").get().cnt;
  if (caseCount === 0) {
    const citizenId = db.prepare("SELECT id FROM users WHERE username = 'citizen'").get();
    if (citizenId) {
      const insertCase = db.prepare(`
        INSERT INTO cases (case_no, item_id, applicant_id, applicant_name, applicant_phone, status, current_step, urgency, deadline)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertStep = db.prepare(`
        INSERT INTO case_steps (case_id, step_name, step_order, status, started_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const newCases = [
        { case_no: 'YN20260604000006', item_id: 1, applicant_name: '张三', phone: '13800001111', status: 'submitted', current_step: '受理', urgency: 'normal', deadline: '2026-08-01' },
        { case_no: 'YN20260604000007', item_id: 3, applicant_name: '张三', phone: '13800001111', status: 'reviewing', current_step: '审核', urgency: 'normal', deadline: '2026-06-15' },
        { case_no: 'YN20260604000008', item_id: 5, applicant_name: '张三', phone: '13800001111', status: 'completed', current_step: '办结', urgency: 'normal', deadline: '2026-06-10', complete_at: '2026-06-03' },
      ];
      const stepsTemplate = ['受理', '审核', '审批', '办结'];
      const tx = db.transaction(() => {
        for (const c of newCases) {
          insertCase.run(c.case_no, c.item_id, citizenId.id, c.applicant_name, c.phone, c.status, c.current_step, c.urgency, c.deadline);
          const caseId = db.prepare('SELECT last_insert_rowid() as id').get().id;
          const currentIdx = stepsTemplate.indexOf(c.current_step);
          for (let i = 0; i < stepsTemplate.length; i++) {
            let stepStatus = 'pending';
            let startedAt = null;
            let completedAt = null;
            if (i < currentIdx) {
              stepStatus = 'completed';
              startedAt = '2026-06-01 09:00:00';
              completedAt = '2026-06-02 17:00:00';
            } else if (i === currentIdx && (c.status === 'completed' || c.status === 'approved')) {
              stepStatus = 'completed';
              startedAt = '2026-06-03 09:00:00';
              completedAt = '2026-06-03 17:00:00';
            } else if (i === currentIdx) {
              stepStatus = 'processing';
              startedAt = '2026-06-03 09:00:00';
            }
            insertStep.run(caseId, stepsTemplate[i], i + 1, stepStatus, startedAt, completedAt);
          }
        }
        db.prepare(`INSERT INTO notifications (user_id, title, content, type, link) VALUES (?, ?, ?, 'case', ?)`).run(citizenId.id, '事项提交成功', '您提交的居民身份证换领申请已成功，办件编号：YN20260604000006', '/cases/6');
        db.prepare(`INSERT INTO notifications (user_id, title, content, type, link) VALUES (?, ?, ?, 'case', ?)`).run(citizenId.id, '审核进行中', '您的医保异地就医备案正在审核中。', '/cases/7');
        db.prepare(`INSERT INTO notifications (user_id, title, content, type, link) VALUES (?, ?, ?, 'case', ?)`).run(citizenId.id, '办件已办结', '您的住房公积金提取业务已办结。', '/cases/8');
      });
      tx();
    }
  }

  console.log('Database initialized and seeded.');
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}
