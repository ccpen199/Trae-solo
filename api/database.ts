import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'xiamen_service.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initSql = `
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    id_type TEXT NOT NULL CHECK(id_type IN ('personal', 'enterprise', 'government')),
    real_name TEXT NOT NULL,
    id_card_no TEXT,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    avatar TEXT,
    roles TEXT NOT NULL DEFAULT '[]',
    auth_level INTEGER NOT NULL DEFAULT 1,
    verified BOOLEAN NOT NULL DEFAULT 0,
    password_hash TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificate_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    issuer TEXT,
    description TEXT,
    template_config TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    cert_type_id TEXT NOT NULL REFERENCES certificate_types(id),
    cert_no TEXT NOT NULL,
    issuer TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    status TEXT NOT NULL CHECK(status IN ('valid', 'expired', 'revoked')),
    metadata TEXT NOT NULL DEFAULT '{}',
    qr_code TEXT,
    verify_url TEXT,
    file_url TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_consents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    data_scope TEXT NOT NULL,
    purpose TEXT NOT NULL,
    valid_from DATETIME NOT NULL,
    valid_to DATETIME,
    status TEXT NOT NULL CHECK(status IN ('active', 'expired', 'revoked')),
    revoked_at DATETIME,
    revoked_reason TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS one_stop_services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    required_materials TEXT NOT NULL DEFAULT '[]',
    involved_departments TEXT NOT NULL DEFAULT '[]',
    estimated_days INTEGER,
    flow_steps TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enterprises (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    credit_code TEXT NOT NULL UNIQUE,
    legal_person TEXT NOT NULL,
    establish_date DATE NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'deregistered', 'abnormal')),
    industry TEXT,
    registered_address TEXT,
    business_scope TEXT,
    lifecycle_stage TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    service_id TEXT NOT NULL REFERENCES one_stop_services(id),
    service_name TEXT,
    enterprise_id TEXT REFERENCES enterprises(id),
    status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'rejected')),
    form_data TEXT NOT NULL DEFAULT '{}',
    orchestration_instance_id TEXT,
    materials TEXT NOT NULL DEFAULT '[]',
    submit_time DATETIME NOT NULL,
    complete_time DATETIME,
    current_step INTEGER NOT NULL DEFAULT 0,
    total_steps INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_steps (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES applications(id),
    step_id TEXT NOT NULL,
    step_name TEXT NOT NULL,
    department TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
    result TEXT,
    error_message TEXT,
    start_time DATETIME,
    end_time DATETIME,
    operator TEXT,
    remark TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subsidy_policies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    amount TEXT,
    eligibility TEXT NOT NULL DEFAULT '[]',
    application_start DATE,
    application_end DATE,
    required_materials TEXT NOT NULL DEFAULT '[]',
    process_steps TEXT NOT NULL DEFAULT '[]',
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subsidy_applications (
    id TEXT PRIMARY KEY,
    enterprise_id TEXT NOT NULL REFERENCES enterprises(id),
    policy_id TEXT NOT NULL REFERENCES subsidy_policies(id),
    status TEXT NOT NULL CHECK(status IN ('draft', 'submitted', 'reviewing', 'approved', 'rejected', 'paid')),
    amount REAL,
    apply_time DATETIME,
    review_time DATETIME,
    payment_time DATETIME,
    materials TEXT NOT NULL DEFAULT '[]',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grids (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    area TEXT,
    boundary TEXT,
    population INTEGER,
    households INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grid_events (
    id TEXT PRIMARY KEY,
    grid_id TEXT NOT NULL REFERENCES grids(id),
    type TEXT NOT NULL,
    type_icon TEXT,
    description TEXT NOT NULL,
    reporter TEXT,
    reporter_phone TEXT,
    report_time DATETIME NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('reported', 'assigned', 'processing', 'resolved', 'closed')),
    assignee TEXT,
    assigned_time DATETIME,
    resolved_time DATETIME,
    closed_time DATETIME,
    latitude REAL,
    longitude REAL,
    images TEXT DEFAULT '[]',
    priority TEXT NOT NULL DEFAULT 'medium',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_history (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES grid_events(id),
    action TEXT NOT NULL,
    operator TEXT NOT NULL,
    remark TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS policies (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    source TEXT,
    publish_date DATE NOT NULL,
    summary TEXT,
    content TEXT,
    eligibility TEXT NOT NULL DEFAULT '[]',
    apply_url TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hospitals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    level TEXT,
    address TEXT,
    phone TEXT,
    longitude REAL,
    latitude REAL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    hospital_id TEXT NOT NULL REFERENCES hospitals(id),
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    department_id TEXT NOT NULL REFERENCES departments(id),
    name TEXT NOT NULL,
    title TEXT,
    specialty TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    hospital_id TEXT NOT NULL REFERENCES hospitals(id),
    department_id TEXT NOT NULL REFERENCES departments(id),
    doctor_id TEXT NOT NULL REFERENCES doctors(id),
    appointment_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    fee REAL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS venues (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('stadium', 'library', 'museum', 'theater', 'community')),
    address TEXT,
    capacity INTEGER,
    opening_hours TEXT,
    phone TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    result TEXT NOT NULL,
    request_data TEXT,
    response_data TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orchestration_instances (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES one_stop_services(id),
    service_name TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL CHECK(status IN ('running', 'completed', 'failed')),
    steps TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    overall_progress INTEGER NOT NULL DEFAULT 0,
    form_data TEXT NOT NULL DEFAULT '{}',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_cert_type ON certificates(cert_type_id);
CREATE INDEX IF NOT EXISTS idx_data_consents_user_id ON data_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_application_steps_application_id ON application_steps(application_id);
CREATE INDEX IF NOT EXISTS idx_grid_events_grid_id ON grid_events(grid_id);
CREATE INDEX IF NOT EXISTS idx_grid_events_status ON grid_events(status);
CREATE INDEX IF NOT EXISTS idx_event_history_event_id ON event_history(event_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_orchestration_instances_user_id ON orchestration_instances(user_id);
`;

db.exec(initSql);

function seedData() {
  const certTypeCount = db.prepare('SELECT COUNT(*) as count FROM certificate_types').get() as { count: number };
  if (certTypeCount.count === 0) {
    const insertCertType = db.prepare(`
      INSERT INTO certificate_types (id, name, category, issuer, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    const certTypes = [
      ['id_card', '居民身份证', 'identity', '厦门市公安局', '中华人民共和国居民身份证'],
      ['ss_card', '社会保障卡', 'social', '厦门市人力资源和社会保障局', '厦门市社会保障卡'],
      ['household', '居民户口簿', 'identity', '厦门市公安局', '居民户口簿'],
      ['driver_license', '机动车驾驶证', 'traffic', '厦门市公安局交通警察支队', '机动车驾驶证'],
      ['birth_cert', '出生医学证明', 'identity', '厦门市卫生健康委员会', '出生医学证明'],
      ['marriage_cert', '结婚证', 'marriage', '厦门市民政局', '中华人民共和国结婚证'],
      ['property_cert', '不动产权证书', 'property', '厦门市自然资源和规划局', '中华人民共和国不动产权证书'],
      ['business_license', '营业执照', 'enterprise', '厦门市市场监督管理局', '营业执照'],
      ['ss_card_medical', '医疗保险凭证', 'social', '厦门市医保局', '医保电子凭证'],
      ['gjj_card', '公积金缴存凭证', 'property', '厦门市公积金中心', '住房公积金缴存证明'],
      ['birth_plan', '生育服务证', 'marriage', '厦门市卫健委', '生育登记服务单'],
      ['edu_diploma', '学历证书', 'education', '厦门市教育局', '高等教育学历证书'],
      ['vocational', '职业资格证书', 'professional', '厦门市人社局', '国家职业资格证书'],
    ];

    const transaction = db.transaction((items: string[][]) => {
      for (const item of items) {
        insertCertType.run(item);
      }
    });
    transaction(certTypes);
  }

  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM one_stop_services').get() as { count: number };
  if (serviceCount.count === 0) {
    const insertService = db.prepare(`
      INSERT INTO one_stop_services (id, name, category, description, icon, required_materials, involved_departments, estimated_days, flow_steps, active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const services = [
      [
        'newborn_5in1',
        '新生儿五证联办',
        '个人服务',
        '新生儿出生医学证明、预防接种证、户口登记、医保参保、社保卡申领五证联办',
        'baby',
        JSON.stringify(['父母身份证', '结婚证', '出生医学证明']),
        JSON.stringify(['卫健委', '公安局', '医保局', '人社局']),
        15,
        JSON.stringify([
          { id: 'step1', name: '出生医学证明', department: '卫健委', apiEndpoint: '/api/wsj/birth-cert', dependsOn: [], parallel: true, requiredData: ['父母身份信息', '新生儿信息'] },
          { id: 'step2', name: '预防接种证', department: '卫健委', apiEndpoint: '/api/wsj/vaccine-cert', dependsOn: ['step1'], parallel: false, requiredData: ['出生医学证明编号'] },
          { id: 'step3', name: '户口登记', department: '公安局', apiEndpoint: '/api/gaj/household-reg', dependsOn: ['step1'], parallel: true, requiredData: ['出生医学证明', '父母户口本'] },
          { id: 'step4', name: '医保参保登记', department: '医保局', apiEndpoint: '/api/ybj/insurance-reg', dependsOn: ['step3'], parallel: false, requiredData: ['户口登记证明', '新生儿信息'] },
          { id: 'step5', name: '社保卡申领', department: '人社局', apiEndpoint: '/api/rsj/ss-card-apply', dependsOn: ['step4'], parallel: false, requiredData: ['医保参保凭证'] },
        ]),
        1,
      ],
      [
        'enterprise_start',
        '企业开办一窗通',
        '企业服务',
        '企业开办全流程一窗通办，包含名称核准、工商登记、刻章备案、税务登记、社保开户',
        'building-2',
        JSON.stringify(['法人身份证', '公司章程', '经营场所证明']),
        JSON.stringify(['市场监管局', '公安局', '税务局', '人社局']),
        3,
        JSON.stringify([
          { id: 's1', name: '名称核准', department: '市场监管局', apiEndpoint: '/api/scjg/name-approve', dependsOn: [], parallel: false, requiredData: ['企业名称', '股东信息'] },
          { id: 's2', name: '工商登记', department: '市场监管局', apiEndpoint: '/api/scjg/business-reg', dependsOn: ['s1'], parallel: false, requiredData: ['名称核准通知书', '公司章程'] },
          { id: 's3', name: '刻章备案', department: '公安局', apiEndpoint: '/api/gaj/seal-register', dependsOn: ['s2'], parallel: true, requiredData: ['营业执照'] },
          { id: 's4', name: '税务登记', department: '税务局', apiEndpoint: '/api/swj/tax-reg', dependsOn: ['s2'], parallel: true, requiredData: ['营业执照', '法人信息'] },
          { id: 's5', name: '社保开户', department: '人社局', apiEndpoint: '/api/rsj/social-account', dependsOn: ['s2'], parallel: true, requiredData: ['营业执照', '法人信息'] },
        ]),
        2,
      ],
      [
        'citizen_after_death',
        '公民身后事联办',
        '个人服务',
        '死亡证明、户口注销、社保终止、公积金提取、丧葬费申领一站式办理',
        'heart-handshake',
        JSON.stringify(['死亡证明', '经办人身份证', '亲属关系证明']),
        JSON.stringify(['卫健委', '公安局', '人社局', '公积金中心', '民政局']),
        20,
        JSON.stringify([
          { id: 'd1', name: '死亡证明开具', department: '卫健委', apiEndpoint: '/api/wsj/death-cert', dependsOn: [], parallel: false, requiredData: ['死者信息', '医院/公安证明'] },
          { id: 'd2', name: '户口注销', department: '公安局', apiEndpoint: '/api/gaj/household-cancel', dependsOn: ['d1'], parallel: false, requiredData: ['死亡证明', '户口本'] },
          { id: 'd3', name: '社保关系终止', department: '人社局', apiEndpoint: '/api/rsj/social-cancel', dependsOn: ['d2'], parallel: true, requiredData: ['死亡证明', '户口注销证明'] },
          { id: 'd4', name: '公积金提取', department: '公积金中心', apiEndpoint: '/api/gjj/extract', dependsOn: ['d2'], parallel: true, requiredData: ['死亡证明', '继承公证'] },
          { id: 'd5', name: '丧葬费申领', department: '人社局', apiEndpoint: '/api/rsj/funeral-allowance', dependsOn: ['d3'], parallel: false, requiredData: ['死亡证明', '社保终止证明'] },
        ]),
        3,
      ],
      [
        'school_enrollment',
        '入学一件事',
        '个人服务',
        '义务教育入学报名、房产核验、居住证查验、社保缴纳证明一站式办理',
        'graduation-cap',
        JSON.stringify(['户口本', '房产证或租赁合同', '父母身份证', '儿童预防接种证']),
        JSON.stringify(['教育局', '公安局', '自然资源和规划局', '人社局']),
        10,
        JSON.stringify([
          { id: 'se1', name: '房产信息核验', department: '自然资源和规划局', apiEndpoint: '/api/ghj/property-verify', dependsOn: [], parallel: true, requiredData: ['房产证编号', '产权人信息'] },
          { id: 'se2', name: '居住证查验', department: '公安局', apiEndpoint: '/api/gaj/residence-permit', dependsOn: [], parallel: true, requiredData: ['居住证编号', '持有人信息'] },
          { id: 'se3', name: '社保缴纳证明', department: '人社局', apiEndpoint: '/api/rsj/social-proof', dependsOn: [], parallel: true, requiredData: ['参保人信息'] },
          { id: 'se4', name: '入学资格审核', department: '教育局', apiEndpoint: '/api/jyj/enrollment-verify', dependsOn: ['se1', 'se2', 'se3'], parallel: false, requiredData: ['房产核验结果', '居住证信息', '社保缴纳记录'] },
          { id: 'se5', name: '学位分配', department: '教育局', apiEndpoint: '/api/jyj/school-assign', dependsOn: ['se4'], parallel: false, requiredData: ['入学资格审核结果', '志愿信息'] },
          { id: 'se6', name: '录取通知发放', department: '教育局', apiEndpoint: '/api/jyj/admission-notice', dependsOn: ['se5'], parallel: false, requiredData: ['学位分配结果', '家长联系方式'] },
        ]),
        4,
      ],
      [
        'retirement',
        '退休一件事',
        '个人服务',
        '退休审批、养老金核定、医保退休、公积金提取一站式办理',
        'umbrella',
        JSON.stringify(['身份证', '社保卡', '个人档案', '劳动合同']),
        JSON.stringify(['人社局', '医保局', '公积金中心']),
        15,
        JSON.stringify([
          { id: 'r1', name: '退休资格审核', department: '人社局', apiEndpoint: '/api/rsj/retirement-verify', dependsOn: [], parallel: false, requiredData: ['身份信息', '缴费年限', '个人档案'] },
          { id: 'r2', name: '养老金核定', department: '人社局', apiEndpoint: '/api/rsj/pension-calc', dependsOn: ['r1'], parallel: false, requiredData: ['退休审批结果', '缴费基数记录'] },
          { id: 'r3', name: '医保退休办理', department: '医保局', apiEndpoint: '/api/ybj/medicare-retire', dependsOn: ['r1'], parallel: true, requiredData: ['退休审批结果', '医保缴费记录'] },
          { id: 'r4', name: '公积金提取', department: '公积金中心', apiEndpoint: '/api/gjj/retire-extract', dependsOn: ['r1'], parallel: true, requiredData: ['退休审批结果', '公积金账户信息'] },
          { id: 'r5', name: '退休证办理', department: '人社局', apiEndpoint: '/api/rsj/retirement-cert', dependsOn: ['r2', 'r3'], parallel: false, requiredData: ['养老金核定结果', '医保退休结果'] },
        ]),
        5,
      ],
      [
        'vehicle_transfer',
        '车辆过户一件事',
        '个人服务',
        '车辆交易、过户登记、保险变更、税费缴纳一站式办理',
        'car',
        JSON.stringify(['身份证', '机动车登记证书', '行驶证', '购车发票']),
        JSON.stringify(['公安局', '税务局', '银保监局']),
        5,
        JSON.stringify([
          { id: 'vt1', name: '车辆信息核验', department: '公安局', apiEndpoint: '/api/gaj/vehicle-verify', dependsOn: [], parallel: false, requiredData: ['车牌号', '车架号'] },
          { id: 'vt2', name: '交易税费缴纳', department: '税务局', apiEndpoint: '/api/swj/vehicle-tax', dependsOn: ['vt1'], parallel: false, requiredData: ['车辆评估价格', '交易双方信息'] },
          { id: 'vt3', name: '过户登记', department: '公安局', apiEndpoint: '/api/gaj/transfer-reg', dependsOn: ['vt2'], parallel: false, requiredData: ['完税证明', '交易合同', '双方身份信息'] },
          { id: 'vt4', name: '保险变更', department: '银保监局', apiEndpoint: '/api/ybj/insurance-change', dependsOn: ['vt3'], parallel: false, requiredData: ['新行驶证信息', '新车主信息'] },
          { id: 'vt5', name: '临时号牌申领', department: '公安局', apiEndpoint: '/api/gaj/temp-plate', dependsOn: ['vt3'], parallel: true, requiredData: ['过户登记结果'] },
        ]),
        6,
      ],
      [
        'citizen_retirement',
        '公民退休相关服务',
        '个人服务',
        '退休人员优待证、老年卡、公交优惠卡一站式办理',
        'user-pension',
        JSON.stringify(['身份证', '退休证', '照片']),
        JSON.stringify(['民政局', '人社局', '交通局']),
        7,
        JSON.stringify([
          { id: 'cr1', name: '退休人员信息核验', department: '人社局', apiEndpoint: '/api/rsj/retiree-verify', dependsOn: [], parallel: false, requiredData: ['身份证', '退休证编号'] },
          { id: 'cr2', name: '老年优待证办理', department: '民政局', apiEndpoint: '/api/mzj/senior-card', dependsOn: ['cr1'], parallel: true, requiredData: ['退休人员信息', '一寸照片'] },
          { id: 'cr3', name: '公交优惠卡办理', department: '交通局', apiEndpoint: '/api/jtj/bus-card', dependsOn: ['cr1'], parallel: true, requiredData: ['退休人员信息', '一寸照片'] },
          { id: 'cr4', name: '养老服务补贴申请', department: '民政局', apiEndpoint: '/api/mzj/pension-subsidy', dependsOn: ['cr2'], parallel: false, requiredData: ['老年优待证', '收入证明'] },
          { id: 'cr5', name: '证件领取通知', department: '政务服务中心', apiEndpoint: '/api/zwzx/notify', dependsOn: ['cr2', 'cr3'], parallel: false, requiredData: ['办理结果', '联系方式'] },
        ]),
        7,
      ],
      [
        'enterprise_cancel',
        '企业注销一件事',
        '企业服务',
        '工商注销、税务注销、社保注销、公章缴销一站式办理',
        'building-minus',
        JSON.stringify(['营业执照正副本', '公章', '清算报告', '法人身份证']),
        JSON.stringify(['市场监管局', '税务局', '人社局', '公安局']),
        20,
        JSON.stringify([
          { id: 'ec1', name: '税务注销清算', department: '税务局', apiEndpoint: '/api/swj/tax-cancel', dependsOn: [], parallel: false, requiredData: ['营业执照', '近三年财报', '清算报告'] },
          { id: 'ec2', name: '社保账户注销', department: '人社局', apiEndpoint: '/api/rsj/social-cancel-acc', dependsOn: ['ec1'], parallel: true, requiredData: ['税务清税证明', '社保缴费记录'] },
          { id: 'ec3', name: '工商注销登记', department: '市场监管局', apiEndpoint: '/api/scjg/company-cancel', dependsOn: ['ec1'], parallel: false, requiredData: ['清税证明', '清算报告', '股东会决议'] },
          { id: 'ec4', name: '公章缴销备案', department: '公安局', apiEndpoint: '/api/gaj/seal-cancel', dependsOn: ['ec3'], parallel: false, requiredData: ['注销通知书', '公章及印鉴卡'] },
          { id: 'ec5', name: '银行账户销户告知', department: '银保监局', apiEndpoint: '/api/ybj/bank-cancel', dependsOn: ['ec3'], parallel: true, requiredData: ['注销通知书'] },
          { id: 'ec6', name: '注销完成通知', department: '市场监管局', apiEndpoint: '/api/scjg/complete-notify', dependsOn: ['ec3', 'ec4'], parallel: false, requiredData: ['全部注销结果'] },
        ]),
        8,
      ],
      [
        'graduate_employment',
        '大学生就业服务',
        '个人服务',
        '毕业生就业报到、档案转递、落户申请、社保增员一站式办理',
        'graduation',
        JSON.stringify(['毕业证', '学位证', '报到证', '身份证', '劳动合同']),
        JSON.stringify(['人社局', '公安局', '教育局']),
        10,
        JSON.stringify([
          { id: 'ge1', name: '就业报到登记', department: '人社局', apiEndpoint: '/api/rsj/graduate-report', dependsOn: [], parallel: false, requiredData: ['报到证', '毕业证', '就业协议'] },
          { id: 'ge2', name: '档案接收转递', department: '人社局', apiEndpoint: '/api/rsj/archive-transfer', dependsOn: ['ge1'], parallel: false, requiredData: ['报到登记结果', '档案保管单位信息'] },
          { id: 'ge3', name: '就业信息核验', department: '教育局', apiEndpoint: '/api/jyj/edu-verify', dependsOn: ['ge1'], parallel: true, requiredData: ['毕业证', '学位证'] },
          { id: 'ge4', name: '落户申请办理', department: '公安局', apiEndpoint: '/api/gaj/settle-apply', dependsOn: ['ge2', 'ge3'], parallel: false, requiredData: ['就业证明', '学历核验结果', '档案接收证明'] },
          { id: 'ge5', name: '社保账户增员', department: '人社局', apiEndpoint: '/api/rsj/social-add', dependsOn: ['ge4'], parallel: false, requiredData: ['落户结果', '劳动合同'] },
        ]),
        9,
      ],
      [
        'gjj_extract',
        '公积金提取一件事',
        '个人服务',
        '购房、租房、还贷、离职等多场景公积金提取一站式办理',
        'wallet',
        JSON.stringify(['身份证', '公积金卡', '提取证明材料']),
        JSON.stringify(['公积金中心', '银行']),
        3,
        JSON.stringify([
          { id: 'ge1', name: '提取条件核验', department: '公积金中心', apiEndpoint: '/api/gjj/condition-verify', dependsOn: [], parallel: false, requiredData: ['身份证', '提取场景', '证明材料'] },
          { id: 'ge2', name: '个人账户信息查询', department: '公积金中心', apiEndpoint: '/api/gjj/account-query', dependsOn: ['ge1'], parallel: false, requiredData: ['条件核验结果', '身份信息'] },
          { id: 'ge3', name: '提取金额计算', department: '公积金中心', apiEndpoint: '/api/gjj/amount-calc', dependsOn: ['ge2'], parallel: false, requiredData: ['账户余额', '提取限额标准'] },
          { id: 'ge4', name: '提取申请提交', department: '公积金中心', apiEndpoint: '/api/gjj/apply-extract', dependsOn: ['ge3'], parallel: false, requiredData: ['金额计算结果', '收款银行账户'] },
          { id: 'ge5', name: '资金拨付到账', department: '银行', apiEndpoint: '/api/bank/transfer', dependsOn: ['ge4'], parallel: false, requiredData: ['提取审批结果', '账户信息'] },
        ]),
        10,
      ],
      [
        'subsidy_stabilize',
        '稳岗补贴申领',
        '企业服务',
        '企业稳岗返还补贴申报、审核、公示、拨付全流程办理',
        'coins',
        JSON.stringify(['营业执照', '失业保险缴费证明', '裁员情况说明', '企业财务报表']),
        JSON.stringify(['人社局', '财政局']),
        30,
        JSON.stringify([
          { id: 'ss1', name: '企业资格核验', department: '人社局', apiEndpoint: '/api/rsj/ent-qualify', dependsOn: [], parallel: false, requiredData: ['统一社会信用代码', '参保缴费记录'] },
          { id: 'ss2', name: '裁员率核算', department: '人社局', apiEndpoint: '/api/rsj/layoff-rate', dependsOn: ['ss1'], parallel: false, requiredData: ['上年度参保人数', '减员人数'] },
          { id: 'ss3', name: '返还金额测算', department: '人社局', apiEndpoint: '/api/rsj/subsidy-calc', dependsOn: ['ss2'], parallel: false, requiredData: ['裁员率结果', '失业保险缴费金额'] },
          { id: 'ss4', name: '材料受理审核', department: '人社局', apiEndpoint: '/api/rsj/subsidy-review', dependsOn: ['ss3'], parallel: false, requiredData: ['申报材料', '测算结果'] },
          { id: 'ss5', name: '社会公示', department: '人社局', apiEndpoint: '/api/rsj/subsidy-public', dependsOn: ['ss4'], parallel: false, requiredData: ['审核通过名单'] },
          { id: 'ss6', name: '资金拨付', department: '财政局', apiEndpoint: '/api/czj/subsidy-pay', dependsOn: ['ss5'], parallel: false, requiredData: ['公示无异议名单', '企业账户信息'] },
        ]),
        11,
      ],
    ];

    const transaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertService.run(item);
      }
    });
    transaction(services);
  }

  const gridCount = db.prepare('SELECT COUNT(*) as count FROM grids').get() as { count: number };
  if (gridCount.count === 0) {
    const insertGrid = db.prepare(`
      INSERT INTO grids (id, code, name, area, population, households)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const grids = [
      ['grid_001', '350203001001', '思明区中华街道仁安社区第一网格', '0.8平方公里', 3256, 1120],
      ['grid_002', '350203001002', '思明区中华街道仁安社区第二网格', '0.6平方公里', 2890, 980],
      ['grid_003', '350203002001', '思明区厦港街道福海社区第一网格', '1.2平方公里', 4120, 1450],
      ['grid_004', '350205001001', '海沧区海沧街道海发社区第一网格', '1.5平方公里', 5680, 1890],
      ['grid_005', '350206001001', '湖里区殿前街道兴隆社区第一网格', '0.9平方公里', 6230, 2100],
      ['grid_006', '350203003001', '思明区鼓浪屿街道龙头社区第一网格', '0.5平方公里', 1820, 620],
      ['grid_007', '350211001001', '集美区集美街道银亭社区第一网格', '1.1平方公里', 4850, 1680],
      ['grid_008', '350212001001', '同安区大同街道三秀社区第一网格', '0.7平方公里', 3680, 1250],
    ];

    const transaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertGrid.run(item);
      }
    });
    transaction(grids);
  }

  const subsidyCount = db.prepare('SELECT COUNT(*) as count FROM subsidy_policies').get() as { count: number };
  if (subsidyCount.count === 0) {
    const insertSubsidy = db.prepare(`
      INSERT INTO subsidy_policies (id, name, category, amount, eligibility, application_start, application_end, required_materials, process_steps, description, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const subsidies = [
      [
        'tech_sme_2024',
        '2024年度科技型中小企业研发费用补贴',
        '科技研发',
        '最高50万元',
        JSON.stringify(['科技型中小企业认定', '年度研发费用100万元以上', '注册地在厦门']),
        '2024-03-01',
        '2024-05-31',
        JSON.stringify(['研发费用专项审计报告', '科技型中小企业入库登记编号', '企业营业执照']),
        JSON.stringify(['在线申报', '材料审核', '专家评审', '公示', '资金拨付']),
        '为支持科技型中小企业加大研发投入，按照上一年度研发费用的一定比例给予补贴。',
      ],
      [
        'enterprise_stabilize',
        '企业稳岗返还补贴',
        '人社就业',
        '按失业保险费50%返还',
        JSON.stringify(['裁员率低于5.5%', '足额缴纳失业保险12个月以上', '30人以下企业裁员率不高于20%']),
        '2024-01-01',
        '2024-12-31',
        JSON.stringify(['失业保险缴费证明', '上年度裁员情况说明', '企业财务报表']),
        JSON.stringify(['系统自动识别', '企业确认申请', '审核公示', '资金返还']),
        '对符合条件的参保企业，按企业及其职工上年度实际缴纳失业保险费的50%返还。',
      ],
      [
        'graduate_employment',
        '高校毕业生就业见习补贴',
        '人社就业',
        '每人每月2000元',
        JSON.stringify(['吸纳离校2年内未就业高校毕业生', '签订1年以上劳动合同', '缴纳社会保险']),
        '2024-01-01',
        '2024-12-31',
        JSON.stringify(['毕业生身份证', '毕业证书', '劳动合同', '社保缴费证明']),
        JSON.stringify(['在线申报', '资格审核', '材料复核', '补贴发放']),
        '对企业吸纳离校2年内未就业高校毕业生就业的，给予就业见习补贴。',
      ],
    ];

    const transaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertSubsidy.run(item);
      }
    });
    transaction(subsidies);
  }

  const hospitalCount = db.prepare('SELECT COUNT(*) as count FROM hospitals').get() as { count: number };
  if (hospitalCount.count === 0) {
    const insertHospital = db.prepare(`
      INSERT INTO hospitals (id, name, level, address, phone, longitude, latitude)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const hospitals = [
      ['hospital_001', '厦门大学附属第一医院', '三级甲等', '厦门市思明区镇海路55号', '0592-2137888', 118.0792, 24.4543],
      ['hospital_002', '厦门大学附属中山医院', '三级甲等', '厦门市思明区湖滨南路201-209号', '0592-2292201', 118.0876, 24.4789],
      ['hospital_003', '厦门市中医院', '三级甲等', '厦门市湖里区仙岳路1739号', '0592-5579666', 118.1234, 24.5012],
      ['hospital_004', '厦门市妇幼保健院', '三级甲等', '厦门市思明区镇海路10号', '0592-2662020', 118.0801, 24.4556],
    ];

    const transaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertHospital.run(item);
      }
    });
    transaction(hospitals);

    const insertDept = db.prepare(`
      INSERT INTO departments (id, hospital_id, name, description)
      VALUES (?, ?, ?, ?)
    `);

    const departments = [
      ['dept_001', 'hospital_001', '内科', '诊治呼吸、消化、心血管、神经等内科疾病'],
      ['dept_002', 'hospital_001', '外科', '诊治普外、骨科、泌尿、神经等外科疾病'],
      ['dept_003', 'hospital_001', '妇产科', '妇科疾病诊治、孕产妇保健、分娩'],
      ['dept_004', 'hospital_001', '儿科', '诊治儿童常见病、多发病'],
      ['dept_005', 'hospital_002', '心内科', '诊治心血管系统疾病'],
      ['dept_006', 'hospital_002', '消化内科', '诊治消化系统疾病'],
      ['dept_007', 'hospital_003', '中医内科', '中医辨证论治内科疾病'],
      ['dept_008', 'hospital_003', '针灸科', '针灸、推拿、理疗'],
      ['dept_009', 'hospital_004', '妇科', '诊治妇科疾病'],
      ['dept_010', 'hospital_004', '产科', '产前检查、分娩、产后康复'],
    ];

    const deptTransaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertDept.run(item);
      }
    });
    deptTransaction(departments);

    const insertDoctor = db.prepare(`
      INSERT INTO doctors (id, department_id, name, title, specialty)
      VALUES (?, ?, ?, ?, ?)
    `);

    const doctors = [
      ['doc_001', 'dept_001', '张医生', '主任医师', '心血管疾病'],
      ['doc_002', 'dept_001', '李医生', '副主任医师', '呼吸系统疾病'],
      ['doc_003', 'dept_002', '王医生', '主任医师', '普外科'],
      ['doc_004', 'dept_003', '陈医生', '副主任医师', '妇科肿瘤'],
      ['doc_005', 'dept_004', '刘医生', '主治医师', '小儿内科'],
      ['doc_006', 'dept_005', '林医生', '主任医师', '冠心病介入治疗'],
      ['doc_007', 'dept_007', '黄医生', '副主任中医师', '中医脾胃病'],
      ['doc_008', 'dept_009', '赵医生', '主任医师', '妇科内分泌'],
      ['doc_009', 'dept_010', '吴医生', '副主任医师', '高危妊娠'],
      ['doc_010', 'dept_008', '郑医生', '主治医师', '针灸治疗'],
    ];

    const doctorTransaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertDoctor.run(item);
      }
    });
    doctorTransaction(doctors);
  }

  const venueCount = db.prepare('SELECT COUNT(*) as count FROM venues').get() as { count: number };
  if (venueCount.count === 0) {
    const insertVenue = db.prepare(`
      INSERT INTO venues (id, name, type, address, capacity, opening_hours, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const venues = [
      ['venue_001', '厦门市体育中心体育场', 'stadium', '厦门市思明区体育路2号', 30000, '06:00-22:00', '0592-5146191'],
      ['venue_002', '厦门市图书馆', 'library', '厦门市思明区体育路95号', 5000, '09:00-21:00', '0592-5371888'],
      ['venue_003', '厦门市博物馆', 'museum', '厦门市思明区体育路95号文化艺术中心', 2000, '09:00-17:00', '0592-5371607'],
      ['venue_004', '闽南大戏院', 'theater', '厦门市思明区会展北片区横三路', 1500, '10:00-20:00', '0592-8065555'],
      ['venue_005', '厦门市青少年宫', 'community', '厦门市思明区育青路10号', 1200, '08:30-20:30', '0592-2911666'],
      ['venue_006', '厦门市工人体育馆', 'stadium', '厦门市思明区体育路95号', 4500, '06:00-22:00', '0592-2661900'],
    ];

    const transaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertVenue.run(item);
      }
    });
    transaction(venues);
  }

  const policyCount = db.prepare('SELECT COUNT(*) as count FROM policies').get() as { count: number };
  if (policyCount.count === 0) {
    const insertPolicy = db.prepare(`
      INSERT INTO policies (id, title, category, source, publish_date, summary, content, eligibility, tags, view_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const policies = [
      [
        'policy_001',
        '厦门市基本养老保险关系转移接续办法',
        '社会保障',
        '厦门市人力资源和社会保障局',
        '2024-01-15',
        '规范基本养老保险关系跨省、跨市转移接续，保障参保人员养老保险权益无缝衔接。',
        '一、适用范围\n本办法适用于参加厦门市基本养老保险的参保人员，跨省、跨市流动就业时养老保险关系的转移接续。\n\n二、转移条件\n1. 参保人员已按规定缴纳基本养老保险费\n2. 未达到法定退休年龄\n3. 在转入地已建立基本养老保险账户\n\n三、办理流程\n1. 参保人员向转出地社保经办机构申请出具参保缴费凭证\n2. 向转入地社保经办机构提出转移申请\n3. 两地社保经办机构在45个工作日内完成转移接续',
        JSON.stringify(['已参加基本养老保险', '跨地区流动就业', '未达到法定退休年龄']),
        JSON.stringify(['养老保险', '社保转移', '民生保障']),
        3200,
      ],
      [
        'policy_002',
        '厦门市住房公积金提取新政',
        '住房公积金',
        '厦门市住房公积金管理中心',
        '2024-02-20',
        '租房提取额度提高至每月1500元，加装电梯可提取公积金，进一步扩大公积金使用范围。',
        '一、租房提取\n职工连续足额缴存住房公积金满3个月，本人及配偶在本市无自有住房且租赁住房的，可提取夫妻双方住房公积金支付房租，每人每月最高提取额度由1200元提高至1500元。\n\n二、加装电梯提取\n本市既有住宅加装电梯的，房屋所有权人及其配偶、直系亲属可提取住房公积金用于支付加装电梯费用。\n\n三、大病医疗提取\n职工本人或配偶、未成年子女患重大疾病的，可提取住房公积金用于支付医疗费用。',
        JSON.stringify(['连续缴存公积金3个月以上', '本市无自有住房(租房提取)', '房屋所有权人(加装电梯提取)']),
        JSON.stringify(['公积金', '住房保障', '民生', '租房']),
        4500,
      ],
      [
        'policy_003',
        '厦门市高校毕业生就业创业扶持政策',
        '就业创业',
        '厦门市人力资源和社会保障局',
        '2024-03-01',
        '提供就业补贴、创业担保贷款、住房补贴等多重扶持，鼓励高校毕业生来厦就业创业。',
        '一、就业补贴\n1. 新引进落户的全日制本科毕业生可享受1万元一次性生活补贴\n2. 硕士研究生可享受3万元一次性生活补贴\n3. 博士研究生可享受5万元一次性生活补贴\n\n二、创业扶持\n1. 创业担保贷款最高额度30万元，全额贴息\n2. 创业孵化基地入驻企业可享受2年免租金\n3. 创业成功一次性奖励1万元\n\n三、住房保障\n1. 符合条件的高校毕业生可申请人才公寓\n2. 租房补贴标准为每月800-1500元',
        JSON.stringify(['全日制本科及以上学历', '毕业5年内', '在厦就业或创业', '已落户厦门']),
        JSON.stringify(['高校毕业生', '就业', '创业', '人才引进', '补贴']),
        5000,
      ],
      [
        'policy_004',
        '厦门市城乡居民基本医疗保险实施办法',
        '医疗健康',
        '厦门市医疗保障局',
        '2024-01-10',
        '完善城乡居民基本医疗保险制度，提高住院报销比例，扩大门诊特殊病种范围。',
        '一、参保对象\n1. 具有厦门市户籍的城乡居民\n2. 持有效居住证的非本市户籍人员\n3. 在厦就读的全日制大中小学生\n\n二、报销标准\n1. 住院报销比例：一级医院90%、二级医院80%、三级医院70%\n2. 门诊特殊病种扩大至30种\n3. 年度最高支付限额提高至40万元\n\n三、缴费标准\n城乡居民个人缴费标准为每人每年400元，财政补助不低于680元',
        JSON.stringify(['具有厦门市户籍', '持有效居住证', '在厦就读学生']),
        JSON.stringify(['医保', '医疗健康', '民生保障', '报销']),
        3800,
      ],
      [
        'policy_005',
        '厦门市义务教育阶段招生入学工作意见',
        '教育',
        '厦门市教育局',
        '2024-02-01',
        '规范义务教育阶段招生入学工作，推进免试就近入学，完善积分入学制度。',
        '一、入学年龄\n年满6周岁的适龄儿童应当接受并完成义务教育。\n\n二、入学方式\n1. 户籍适龄儿童：按划片免试就近入学\n2. 随迁子女：实行积分入学制度\n3. 政策性照顾对象：按规定安排入学\n\n三、积分入学\n随迁子女积分入学项目包括：务工社保积分、稳定居住积分、计划生育积分等，总分满120分。\n\n四、报名方式\n统一通过"i厦门"平台或"入学一件事"在线办理',
        JSON.stringify(['年满6周岁', '本市户籍或持居住证', '随迁子女需积分达线']),
        JSON.stringify(['义务教育', '入学', '教育', '积分入学']),
        4200,
      ],
      [
        'policy_006',
        '厦门市失业保险稳岗返还政策',
        '社会保障',
        '厦门市人力资源和社会保障局',
        '2024-01-01',
        '对不裁员或少裁员的参保企业，返还其上年度实际缴纳失业保险费的50%至80%。',
        '一、返还标准\n1. 30人（含）以下企业：裁员率不高于20%的，按80%返还\n2. 30人以上企业：裁员率不高于5.5%的，按50%返还\n3. 参保职工1000人以上企业：裁员率不高于5.5%的，按60%返还\n\n二、申请条件\n1. 依法参加失业保险并足额缴纳失业保险费12个月以上\n2. 上年度未裁员或裁员率符合规定标准\n3. 生产经营活动符合国家及所在区域产业和环保政策\n\n三、办理方式\n免申即享，系统自动比对审核',
        JSON.stringify(['足额缴纳失业保险12个月以上', '裁员率符合标准', '符合产业和环保政策']),
        JSON.stringify(['失业保险', '稳岗', '企业扶持', '返还']),
        2800,
      ],
      [
        'policy_007',
        '厦门市居民医保门诊共济保障机制',
        '医疗健康',
        '厦门市医疗保障局',
        '2024-03-15',
        '建立职工医保门诊共济保障机制，将普通门诊费用纳入统筹基金支付范围。',
        '一、保障范围\n将职工医保参保人员普通门诊费用纳入统筹基金支付，门诊统筹年度最高支付限额为3000元。\n\n二、报销比例\n1. 一级及以下医疗机构：70%\n2. 二级医疗机构：60%\n3. 三级医疗机构：50%\n\n三、个人账户改革\n1. 单位缴费部分全部计入统筹基金\n2. 个人缴费部分仍计入个人账户\n3. 个人账户可家庭成员共济使用',
        JSON.stringify(['参加职工基本医疗保险', '在定点医疗机构就诊']),
        JSON.stringify(['门诊共济', '医保改革', '医疗健康', '个人账户']),
        2100,
      ],
      [
        'policy_008',
        '厦门市学前教育资助政策',
        '教育',
        '厦门市教育局',
        '2024-04-01',
        '对家庭经济困难在园儿童给予保教费资助，确保适龄儿童平等接受学前教育。',
        '一、资助对象\n1. 经认定的家庭经济困难在园儿童\n2. 残疾儿童\n3. 孤儿\n4. 优抚对象子女\n\n二、资助标准\n1. 公办幼儿园：全额免除保教费\n2. 民办幼儿园：每学期资助2000元\n\n三、申请流程\n1. 家长向幼儿园提出申请\n2. 幼儿园初审并公示\n3. 教育部门审核确认\n4. 资金直接拨付至幼儿园',
        JSON.stringify(['家庭经济困难', '在园就读', '厦门市户籍或持居住证']),
        JSON.stringify(['学前教育', '教育资助', '民生保障', '幼儿园']),
        1500,
      ],
      [
        'policy_009',
        '厦门市新能源汽车购车补贴政策',
        '交通运输',
        '厦门市工业和信息化局',
        '2024-02-10',
        '对购置新能源汽车的消费者给予购车补贴，支持新能源汽车推广应用。',
        '一、补贴标准\n1. 购置10万元以下新能源乘用车：补贴5000元\n2. 购置10-20万元新能源乘用车：补贴8000元\n3. 购置20万元以上新能源乘用车：补贴12000元\n4. 新能源商用车按购车价格10%补贴，最高不超过3万元\n\n二、申请条件\n1. 购车发票日期在政策有效期内\n2. 车辆在厦门上牌注册\n3. 购车人为厦门户籍或持有效居住证\n\n三、办理方式\n通过"i厦门"平台在线申请，购车后6个月内提出申请',
        JSON.stringify(['购置新能源汽车', '在厦门上牌注册', '购车人符合身份要求']),
        JSON.stringify(['新能源', '汽车', '购车补贴', '绿色出行', '环保']),
        3500,
      ],
      [
        'policy_010',
        '厦门市养老服务补贴实施办法',
        '社会保障',
        '厦门市民政局',
        '2024-01-20',
        '完善养老服务补贴制度，为经济困难老年人提供居家养老、机构养老服务补贴。',
        '一、补贴对象\n1. 低保家庭中60周岁以上失能老人\n2. 80周岁以上独居空巢老人\n3. 70周岁以上计划生育特殊家庭老人\n\n二、补贴标准\n1. 居家养老服务补贴：每人每月200-500元\n2. 机构养老服务补贴：每人每月500-1200元\n3. 高龄津贴：80-89岁每人每月100元，90-99岁200元，100岁以上500元\n\n三、申请流程\n向户籍所在地社区（村）居委会提出申请，经街道（镇）审核后发放',
        JSON.stringify(['年满60周岁以上', '家庭经济困难或符合特定条件', '厦门市户籍']),
        JSON.stringify(['养老', '养老服务', '补贴', '高龄津贴', '民生保障']),
        2400,
      ],
      [
        'policy_011',
        '厦门市职业技能提升行动实施方案',
        '就业创业',
        '厦门市人力资源和社会保障局',
        '2024-03-10',
        '大规模开展职业技能培训，提高劳动者技能水平，按规定给予培训补贴。',
        '一、培训补贴标准\n1. 初级工培训：补贴1000-1500元\n2. 中级工培训：补贴1500-2500元\n3. 高级工培训：补贴2500-4000元\n4. 技师、高级技师培训：补贴4000-8000元\n5. 创业培训：补贴1200元\n\n二、补贴对象\n1. 企业职工\n2. 就业重点群体（高校毕业生、农民工、失业人员等）\n3. 贫困劳动力\n\n三、培训方式\n线上线下结合，支持企业自主开展培训',
        JSON.stringify(['参加职业技能培训', '取得职业资格证书', '符合补贴对象身份']),
        JSON.stringify(['职业技能', '培训', '就业', '技能提升', '补贴']),
        1800,
      ],
      [
        'policy_012',
        '厦门市高层次人才住房保障办法',
        '住房公积金',
        '厦门市住房保障和房屋管理局',
        '2024-02-25',
        '为高层次人才提供购房补贴、租房补贴、人才公寓等多渠道住房保障。',
        '一、保障对象\n1. A+类人才（诺贝尔奖、院士等）\n2. A类人才（国家级领军人才）\n3. B类人才（省级领军人才）\n4. C类人才（市级领军人才）\n\n二、保障标准\n1. 购房补贴：A+类1000万元，A类500万元，B类250万元，C类130万元\n2. 租房补贴：A类每月10000元，B类每月6000元，C类每月3500元\n3. 人才公寓：按层次提供免租或优惠租住\n\n三、申请条件\n1. 与在厦单位签订3年以上劳动合同\n2. 已在厦缴纳社保\n3. 本人及配偶在厦无自有住房',
        JSON.stringify(['符合高层次人才认定标准', '在厦就业创业', '在厦无自有住房']),
        JSON.stringify(['人才', '住房保障', '购房补贴', '租房补贴', '人才引进']),
        3100,
      ],
      [
        'policy_013',
        '厦门市科技创新研发费用补助政策',
        '科技创新',
        '厦门市科学技术局',
        '2024-01-30',
        '鼓励企业加大研发投入，对企业研发费用给予补助，支持科技创新。',
        '一、补助标准\n1. 企业研发费用年度增长10%以上的，按新增研发费用的20%给予补助，最高500万元\n2. 科技型中小企业研发费用按实际发生额的25%给予补助，最高300万元\n3. 高新技术企业研发费用按实际发生额的15%给予补助，最高400万元\n\n二、申请条件\n1. 在厦门市注册登记的企业法人\n2. 研发费用纳入统计\n3. 研发管理制度健全\n4. 信用记录良好\n\n三、申报时间\n每年4-5月通过"厦门科技"平台申报',
        JSON.stringify(['在厦门注册的企业', '有研发费用投入', '研发管理制度健全']),
        JSON.stringify(['科技', '创新', '研发', '研发费用', '企业补助']),
        1900,
      ],
      [
        'policy_014',
        '厦门市中小微企业纾困专项资金管理办法',
        '财政金融',
        '厦门市财政局',
        '2024-03-20',
        '设立中小微企业纾困专项资金，帮助企业应对疫情等困难，缓解资金压力。',
        '一、支持范围\n1. 受疫情影响较大的困难行业企业\n2. 有发展前景但暂时受困的中小微企业\n3. 重点产业链配套企业\n\n二、支持方式\n1. 贷款贴息：按企业实际获得贷款利息的50%给予贴息，单笔最高100万元\n2. 担保费补贴：按实际担保费的50%给予补贴，单笔最高50万元\n3. 应急周转：提供短期资金周转支持\n\n三、申请条件\n1. 在厦门注册的中小微企业\n2. 符合国家产业政策\n3. 企业信用良好\n4. 具有持续经营能力',
        JSON.stringify(['厦门注册的中小微企业', '符合支持范围', '信用记录良好']),
        JSON.stringify(['中小微企业', '纾困', '贷款贴息', '融资', '资金支持']),
        1200,
      ],
      [
        'policy_015',
        '厦门市绿色建筑发展专项资金管理办法',
        '生态环保',
        '厦门市建设局',
        '2024-02-15',
        '推广绿色建筑，对达到星级标准的绿色建筑项目给予资金奖励。',
        '一、奖励标准\n1. 一星级绿色建筑：每平方米奖励10元，最高不超过100万元\n2. 二星级绿色建筑：每平方米奖励20元，最高不超过200万元\n3. 三星级绿色建筑：每平方米奖励30元，最高不超过300万元\n4. 超低能耗建筑：每平方米奖励50元，最高不超过500万元\n\n二、申请条件\n1. 在厦门市行政区域内的建筑项目\n2. 取得绿色建筑标识证书\n3. 项目单位无不良信用记录\n\n三、申请流程\n项目竣工验收后6个月内，通过"厦门市建设局"官网申报',
        JSON.stringify(['取得绿色建筑标识', '在厦门建设的项目', '竣工验收合格']),
        JSON.stringify(['绿色建筑', '环保', '节能减排', '建筑', '奖励']),
        900,
      ],
    ];

    const transaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertPolicy.run(item);
      }
    });
    transaction(policies);
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, id_type, real_name, id_card_no, phone, email, roles, auth_level, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const users = [
      ['user_001', 'personal', '陈小明', '350203199001011234', '13800138001', 'chenxm@example.com', JSON.stringify(['user']), 2, 1],
      ['user_002', 'personal', '林小红', '350204199202022345', '13800138002', 'linxh@example.com', JSON.stringify(['user']), 2, 1],
      ['user_003', 'enterprise', '厦门科技有限公司', '91350200MA12345678', '13900139001', 'contact@xmtech.com', JSON.stringify(['enterprise']), 2, 1],
      ['user_004', 'government', '王管理员', '350203198505055678', '13700137001', 'wangadmin@xm.gov.cn', JSON.stringify(['government', 'grid_admin']), 3, 1],
      ['user_005', 'government', '李网格员', '350206198808086789', '13600136001', 'ligwy@xm.gov.cn', JSON.stringify(['government', 'grid_worker']), 2, 1],
      ['user_006', 'personal', '陈女士', '350203199503037890', '13800138003', 'chennvshi@example.com', JSON.stringify(['user']), 2, 1],
    ];

    const transaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertUser.run(item);
      }
    });
    transaction(users);

    const insertCert = db.prepare(`
      INSERT INTO certificates (id, user_id, cert_type_id, cert_no, issuer, issue_date, expiry_date, status, metadata, qr_code, verify_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const certs = [
      ['cert_001', 'user_001', 'id_card', '350203199001011234', '厦门市公安局', '2018-05-01', '2038-05-01', 'valid', JSON.stringify({ address: '厦门市思明区镇海路100号' }), 'QR001', 'https://verify.xm.gov.cn/cert/001'],
      ['cert_002', 'user_001', 'ss_card', 'D12345678', '厦门市人力资源和社会保障局', '2015-03-15', null, 'valid', JSON.stringify({ cardNo: '6212260000000001234' }), 'QR002', 'https://verify.xm.gov.cn/cert/002'],
      ['cert_003', 'user_001', 'driver_license', '35020019900101001', '厦门市公安局交通警察支队', '2012-06-20', '2028-06-20', 'valid', JSON.stringify({ class: 'C1', points: 12 }), 'QR003', 'https://verify.xm.gov.cn/cert/003'],
      ['cert_006', 'user_001', 'ss_card_medical', 'Y20240001234', '厦门市医保局', '2020-01-01', null, 'valid', JSON.stringify({ cardNo: 'YBC20240001' }), 'QR006', 'https://verify.xm.gov.cn/cert/006'],
      ['cert_007', 'user_001', 'gjj_card', 'GJJ20240001', '厦门市公积金中心', '2018-06-01', null, 'valid', JSON.stringify({ accountNo: 'GJJ350201990001', balance: 125600 }), 'QR007', 'https://verify.xm.gov.cn/cert/007'],
      ['cert_008', 'user_001', 'marriage_cert', 'J350203201500123', '厦门市民政局', '2015-10-10', null, 'valid', JSON.stringify({ spouse: '林小红', marriageDate: '2015-10-10' }), 'QR008', 'https://verify.xm.gov.cn/cert/008'],
      ['cert_009', 'user_001', 'property_cert', 'BDC3502032020001', '厦门市自然资源和规划局', '2020-05-15', null, 'valid', JSON.stringify({ propertyAddress: '厦门市思明区环岛路188号1栋201室', area: '89.5平方米' }), 'QR009', 'https://verify.xm.gov.cn/cert/009'],
      ['cert_010', 'user_001', 'edu_diploma', 'XMU2012000123', '厦门市教育局', '2012-06-30', null, 'valid', JSON.stringify({ school: '厦门大学', degree: '本科', major: '计算机科学与技术' }), 'QR010', 'https://verify.xm.gov.cn/cert/010'],
      ['cert_011', 'user_001', 'vocational', 'ZYZG201805001', '厦门市人社局', '2018-05-20', null, 'valid', JSON.stringify({ profession: '软件工程师', level: '中级' }), 'QR011', 'https://verify.xm.gov.cn/cert/011'],
      ['cert_004', 'user_002', 'id_card', '350204199202022345', '厦门市公安局', '2019-08-10', '2039-08-10', 'valid', JSON.stringify({ address: '厦门市湖里区仙岳路200号' }), 'QR004', 'https://verify.xm.gov.cn/cert/004'],
      ['cert_005', 'user_002', 'ss_card', 'D87654321', '厦门市人力资源和社会保障局', '2016-04-20', null, 'valid', JSON.stringify({ cardNo: '6212260000000005678' }), 'QR005', 'https://verify.xm.gov.cn/cert/005'],
      ['cert_012', 'user_002', 'household', 'HH35020419920001', '厦门市公安局', '2016-01-01', null, 'valid', JSON.stringify({ householdType: '家庭户', members: 3 }), 'QR012', 'https://verify.xm.gov.cn/cert/012'],
      ['cert_013', 'user_002', 'birth_cert', 'CS2016000123', '厦门市卫生健康委员会', '2016-08-15', null, 'valid', JSON.stringify({ childName: '陈宝宝', gender: '男' }), 'QR013', 'https://verify.xm.gov.cn/cert/013'],
      ['cert_014', 'user_002', 'ss_card_medical', 'Y20240005678', '厦门市医保局', '2019-03-10', null, 'valid', JSON.stringify({ cardNo: 'YBC20240002' }), 'QR014', 'https://verify.xm.gov.cn/cert/014'],
    ];

    const certTransaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertCert.run(item);
      }
    });
    certTransaction(certs);

    const insertApp = db.prepare(`
      INSERT INTO applications (id, user_id, service_id, service_name, status, form_data, submit_time, current_step, total_steps)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const apps = [
      ['app_001', 'user_001', 'newborn_5in1', '新生儿五证联办', 'processing', JSON.stringify({ childName: '陈宝宝', gender: 'male', birthDate: '2024-05-01', hospital: '厦门市妇幼保健院' }), '2024-05-10 10:30:00', 3, 5],
      ['app_002', 'user_001', 'enterprise_start', '企业开办一窗通', 'completed', JSON.stringify({ enterpriseName: '厦门创新科技有限公司', industry: '信息技术' }), '2024-03-15 09:00:00', 5, 5],
      ['app_003', 'user_001', 'school_enrollment', '入学一件事', 'processing', JSON.stringify({ childName: '陈小乐', schoolChoice1: '厦门实验小学', schoolChoice2: '厦门第二实验小学', propertyAddress: '厦门市思明区环岛路188号' }), '2024-06-01 08:30:00', 3, 6],
      ['app_004', 'user_001', 'subsidy_stabilize', '稳岗补贴申领', 'processing', JSON.stringify({ enterpriseName: '厦门科技有限公司', employeesLastYear: 120, layoffCount: 3, insurancePaid: 285600 }), '2024-06-05 14:00:00', 2, 6],
      ['app_005', 'user_001', 'gjj_extract', '公积金提取一件事', 'completed', JSON.stringify({ extractType: 'renting', monthlyRent: 3500, extractMonths: 12, bankAccount: '6222020000001234567' }), '2024-04-20 10:00:00', 5, 5],
      ['app_006', 'user_001', 'retirement', '退休一件事', 'completed', JSON.stringify({ retireDate: '2024-02-01', workYears: 32, pensionMonths: 384, medicareMonths: 360 }), '2024-01-15 09:30:00', 5, 5],
    ];

    const appTransaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertApp.run(item);
      }
    });
    appTransaction(apps);

    const insertAppStep = db.prepare(`
      INSERT INTO application_steps (application_id, step_id, step_name, department, status, start_time, end_time, operator, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const appSteps = [
      ['app_001', 'step1', '出生医学证明', '卫健委', 'completed', '2024-05-10 10:35:00', '2024-05-10 14:20:00', '张医生', '出生医学证明已开具'],
      ['app_001', 'step2', '预防接种证', '卫健委', 'completed', '2024-05-11 09:00:00', '2024-05-11 10:30:00', '社区卫生中心', '预防接种证已办理'],
      ['app_001', 'step3', '户口登记', '公安局', 'running', '2024-05-12 08:30:00', null, null, '正在审核中'],
      ['app_001', 'step4', '医保参保登记', '医保局', 'pending', null, null, null, '等待户口登记完成'],
      ['app_001', 'step5', '社保卡申领', '人社局', 'pending', null, null, null, '等待医保参保完成'],
      ['app_002', 's1', '名称核准', '市场监管局', 'completed', '2024-03-15 09:05:00', '2024-03-15 11:30:00', '注册科', '名称核准通过'],
      ['app_002', 's2', '工商登记', '市场监管局', 'completed', '2024-03-15 14:00:00', '2024-03-16 09:00:00', '注册科', '营业执照已颁发'],
      ['app_002', 's3', '刻章备案', '公安局', 'completed', '2024-03-16 10:00:00', '2024-03-16 15:30:00', '治安支队', '公章已备案'],
      ['app_002', 's4', '税务登记', '税务局', 'completed', '2024-03-16 10:30:00', '2024-03-17 09:00:00', '征管科', '税务登记完成'],
      ['app_002', 's5', '社保开户', '人社局', 'completed', '2024-03-16 11:00:00', '2024-03-17 10:00:00', '社保中心', '社保账户已开立'],
      ['app_003', 'se1', '房产信息核验', '自然资源和规划局', 'completed', '2024-06-01 08:35:00', '2024-06-01 09:20:00', '产权中心', '房产信息核验通过'],
      ['app_003', 'se2', '居住证查验', '公安局', 'completed', '2024-06-01 08:40:00', '2024-06-01 09:00:00', '人口管理科', '居住证有效'],
      ['app_003', 'se3', '社保缴纳证明', '人社局', 'completed', '2024-06-01 08:45:00', '2024-06-01 09:30:00', '社保中心', '连续缴纳社保60个月'],
      ['app_003', 'se4', '入学资格审核', '教育局', 'running', '2024-06-02 09:00:00', null, null, '正在综合审核各项材料'],
      ['app_003', 'se5', '学位分配', '教育局', 'pending', null, null, null, '等待资格审核通过'],
      ['app_003', 'se6', '录取通知发放', '教育局', 'pending', null, null, null, '等待学位分配结果'],
      ['app_004', 'ss1', '企业资格核验', '人社局', 'completed', '2024-06-05 14:05:00', '2024-06-05 15:00:00', '就业促进科', '企业参保状态正常'],
      ['app_004', 'ss2', '裁员率核算', '人社局', 'running', '2024-06-06 09:00:00', null, null, '正在核算上年度裁员率2.5%'],
      ['app_004', 'ss3', '返还金额测算', '人社局', 'pending', null, null, null, '等待裁员率结果'],
      ['app_004', 'ss4', '材料受理审核', '人社局', 'pending', null, null, null, '等待金额测算完成'],
      ['app_004', 'ss5', '社会公示', '人社局', 'pending', null, null, null, '等待审核通过名单'],
      ['app_004', 'ss6', '资金拨付', '财政局', 'pending', null, null, null, '等待公示无异议'],
      ['app_005', 'ge1', '提取条件核验', '公积金中心', 'completed', '2024-04-20 10:05:00', '2024-04-20 10:30:00', '业务窗口', '租房提取条件满足'],
      ['app_005', 'ge2', '个人账户信息查询', '公积金中心', 'completed', '2024-04-20 10:35:00', '2024-04-20 10:40:00', '系统自动', '账户余额125,600元'],
      ['app_005', 'ge3', '提取金额计算', '公积金中心', 'completed', '2024-04-20 10:45:00', '2024-04-20 10:50:00', '系统自动', '可提取额度18,000元'],
      ['app_005', 'ge4', '提取申请提交', '公积金中心', 'completed', '2024-04-20 10:55:00', '2024-04-20 11:30:00', '审批员', '提取申请审批通过'],
      ['app_005', 'ge5', '资金拨付到账', '银行', 'completed', '2024-04-21 09:00:00', '2024-04-21 09:05:00', '工商银行', '18,000元已到账'],
      ['app_006', 'r1', '退休资格审核', '人社局', 'completed', '2024-01-15 09:35:00', '2024-01-16 11:00:00', '养老科', '退休资格审核通过'],
      ['app_006', 'r2', '养老金核定', '人社局', 'completed', '2024-01-17 09:00:00', '2024-01-18 16:00:00', '养老科', '月养老金4,580元'],
      ['app_006', 'r3', '医保退休办理', '医保局', 'completed', '2024-01-17 09:30:00', '2024-01-19 10:00:00', '医保中心', '医保退休办理完成'],
      ['app_006', 'r4', '公积金提取', '公积金中心', 'completed', '2024-01-17 10:00:00', '2024-01-20 14:00:00', '公积金中心', '公积金余额一次性提取'],
      ['app_006', 'r5', '退休证办理', '人社局', 'completed', '2024-01-22 09:00:00', '2024-01-25 16:00:00', '制证中心', '退休证已制作完成'],
    ];

    const appStepTransaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertAppStep.run(item);
      }
    });
    appStepTransaction(appSteps);

    const insertEnterprise = db.prepare(`
      INSERT INTO enterprises (id, user_id, name, credit_code, legal_person, establish_date, status, industry, registered_address, business_scope, lifecycle_stage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const enterprises = [
      ['ent_001', 'user_003', '厦门科技有限公司', '91350200MA12345678', '陈小明', '2024-03-18', 'active', '软件和信息技术服务业', '厦门市思明区软件园二期', '软件开发、信息系统集成、技术咨询服务', '成长阶段'],
    ];

    const entTransaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertEnterprise.run(item);
      }
    });
    entTransaction(enterprises);

    const insertEvent = db.prepare(`
      INSERT INTO grid_events (id, grid_id, type, type_icon, description, reporter, reporter_phone, report_time, status, assignee, assigned_time, priority, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const events = [
      ['event_001', 'grid_001', '环境卫生', 'trash-2', '仁安社区15号楼前垃圾桶满溢，垃圾散落', '张阿姨', '13800138101', '2024-06-10 08:15:00', 'processing', '李网格员', '2024-06-10 08:20:00', 'low', 24.4543, 118.0792],
      ['event_002', 'grid_001', '设施损坏', 'wrench', '社区健身器材损坏，存在安全隐患', '王先生', '13800138102', '2024-06-10 09:30:00', 'assigned', '李网格员', '2024-06-10 09:35:00', 'medium', 24.4550, 118.0785],
      ['event_003', 'grid_003', '噪音扰民', 'volume-x', '福海社区某店铺夜间施工噪音扰民', '居民投诉', '13800138103', '2024-06-09 22:30:00', 'resolved', '赵网格员', '2024-06-09 22:35:00', 'high', 24.4450, 118.0820],
      ['event_004', 'grid_005', '占道经营', 'store', '兴隆路沿街摊贩占道经营', '城管转办', null, '2024-06-10 07:45:00', 'reported', null, null, 'medium', 24.5200, 118.1100],
      ['event_005', 'grid_001', '消防安全', 'flame', '仁安社区3号楼消防通道被车辆堵塞', '匿名举报', null, '2024-06-08 15:20:00', 'closed', '李网格员', '2024-06-08 15:25:00', 'high', 24.4540, 118.0800],
      ['event_006', 'grid_002', '绿化维护', 'tree-deciduous', '仁安社区第二网格行道树树枝遮挡路灯', '陈女士', '13800138104', '2024-06-07 10:00:00', 'closed', '王网格员', '2024-06-07 10:10:00', 'low', 24.4535, 118.0795],
      ['event_007', 'grid_004', '道路破损', 'construction', '海发社区海林路路面坑洼积水严重', '孙先生', '13800138105', '2024-06-11 07:20:00', 'processing', '周网格员', '2024-06-11 07:30:00', 'medium', 24.4900, 118.0500],
      ['event_008', 'grid_006', '环境卫生', 'trash-2', '鼓浪屿龙头路游客遗留垃圾未及时清理', '景区巡查', null, '2024-06-11 10:15:00', 'assigned', '刘网格员', '2024-06-11 10:20:00', 'medium', 24.4480, 118.0690],
      ['event_009', 'grid_007', '噪音扰民', 'volume-x', '银亭社区某KTV营业时间超出规定且音量过大', '附近居民', '13800138106', '2024-06-10 23:40:00', 'resolved', '陈网格员', '2024-06-11 00:05:00', 'high', 24.5700, 118.1000],
      ['event_010', 'grid_008', '违章建筑', 'building', '三秀社区有人在顶楼私自搭建铁皮房', '郑先生', '13800138107', '2024-06-09 09:00:00', 'processing', '林网格员', '2024-06-09 09:15:00', 'high', 24.7200, 118.1500],
      ['event_011', 'grid_003', '设施损坏', 'wrench', '福海社区公共厕所水龙头损坏漏水严重', '社区巡查', null, '2024-06-11 14:30:00', 'reported', null, null, 'medium', 24.4460, 118.0830],
      ['event_012', 'grid_005', '环境卫生', 'trash-2', '兴隆社区8号楼附近绿化带内积存白色垃圾', '赵女士', '13800138108', '2024-06-11 16:00:00', 'assigned', '李网格员', '2024-06-11 16:10:00', 'low', 24.5210, 118.1110],
    ];

    const eventTransaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertEvent.run(item);
      }
    });
    eventTransaction(events);

    const insertHistory = db.prepare(`
      INSERT INTO event_history (event_id, action, operator, remark)
      VALUES (?, ?, ?, ?)
    `);

    const histories = [
      ['event_001', '事件上报', '系统', '居民通过APP上报垃圾桶满溢'],
      ['event_001', '分派', '网格管理员', '分派给李网格员处理'],
      ['event_001', '开始处理', '李网格员', '已联系环卫部门，预计2小时内清理'],
      ['event_002', '事件上报', '系统', '健身器材损坏上报'],
      ['event_002', '分派', '网格管理员', '分派给李网格员处理'],
      ['event_003', '事件上报', '系统', '夜间噪音投诉'],
      ['event_003', '分派', '网格管理员', '分派给赵网格员处理'],
      ['event_003', '现场处理', '赵网格员', '已劝导施工方停止夜间施工'],
      ['event_003', '事件解决', '赵网格员', '问题已解决，施工方承诺22:00后停止施工'],
      ['event_003', '结案', '网格管理员', '投诉人表示满意，予以结案'],
      ['event_005', '事件上报', '系统', '消防通道堵塞举报'],
      ['event_005', '分派', '网格管理员', '分派给李网格员处理'],
      ['event_005', '现场处理', '李网格员', '联系车主移车，已疏通消防通道'],
      ['event_005', '结案', '网格管理员', '问题已解决，已对车主进行安全教育'],
      ['event_006', '事件上报', '系统', '行道树遮挡路灯上报'],
      ['event_006', '分派', '网格管理员', '分派给王网格员处理'],
      ['event_006', '现场处理', '王网格员', '已联系园林部门修剪树枝'],
      ['event_006', '结案', '网格管理员', '修剪完成，路灯照明恢复正常'],
      ['event_007', '事件上报', '系统', '路面坑洼积水上报'],
      ['event_007', '分派', '网格管理员', '分派给周网格员处理'],
      ['event_007', '开始处理', '周网格员', '已联系市政部门，等待安排施工修复'],
      ['event_008', '事件上报', '系统', '景区垃圾未清理上报'],
      ['event_008', '分派', '网格管理员', '分派给刘网格员处理'],
      ['event_009', '事件上报', '系统', 'KTV噪音扰民投诉'],
      ['event_009', '分派', '网格管理员', '分派给陈网格员处理'],
      ['event_009', '现场处理', '陈网格员', '已到场劝导，KTV同意调低音量并按时闭店'],
      ['event_009', '事件解决', '陈网格员', 'KTV已整改，后续将加强巡查'],
      ['event_010', '事件上报', '系统', '违章搭建铁皮房上报'],
      ['event_010', '分派', '网格管理员', '分派给林网格员处理'],
      ['event_010', '开始处理', '林网格员', '已现场核实，正在联系城管执法部门处理'],
      ['event_011', '事件上报', '系统', '公厕水龙头损坏上报'],
      ['event_012', '事件上报', '系统', '绿化带垃圾上报'],
      ['event_012', '分派', '网格管理员', '分派给李网格员处理'],
    ];

    const historyTransaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertHistory.run(item);
      }
    });
    historyTransaction(histories);

    const insertConsent = db.prepare(`
      INSERT INTO data_consents (id, user_id, data_scope, purpose, valid_from, valid_to, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const consents = [
      ['consent_001', 'user_001', JSON.stringify(['社保缴纳记录', '就业信息', '工龄认定材料']), '人社局办理退休审批', '2024-01-01T00:00:00.000Z', '2025-12-31T23:59:59.000Z', 'active'],
      ['consent_002', 'user_001', JSON.stringify(['公积金缴存记录', '贷款信息', '账户余额']), '公积金中心提取公积金', '2024-02-15T00:00:00.000Z', '2025-02-14T23:59:59.000Z', 'active'],
      ['consent_003', 'user_001', JSON.stringify(['就诊记录', '处方信息', '检验报告', '住院记录']), '卫健委健康档案查询', '2024-03-01T00:00:00.000Z', '2025-02-28T23:59:59.000Z', 'active'],
      ['consent_004', 'user_001', JSON.stringify(['学籍信息', '学历信息', '成绩信息']), '教育局入学资格审核', '2023-04-01T00:00:00.000Z', '2023-09-30T23:59:59.000Z', 'expired'],
      ['consent_005', 'user_001', JSON.stringify(['房产信息', '产权登记信息', '交易记录']), '自然资源和规划局房产核验', '2024-05-10T00:00:00.000Z', '2025-05-09T23:59:59.000Z', 'active'],
      ['consent_006', 'user_001', JSON.stringify(['车辆信息', '驾驶证信息', '违章记录']), '公安局交通警察支队车辆过户', '2024-01-15T00:00:00.000Z', '2024-06-14T23:59:59.000Z', 'expired'],
      ['consent_007', 'user_001', JSON.stringify(['医保缴费记录', '报销记录', '个人账户信息']), '医保局医保退休办理', '2023-11-01T00:00:00.000Z', '2024-10-31T23:59:59.000Z', 'revoked'],
    ];

    const consentTransaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertConsent.run(item);
      }
    });
    consentTransaction(consents);

    const orchCount = db.prepare('SELECT COUNT(*) as count FROM orchestration_instances').get() as { count: number };
    if (orchCount.count === 0) {
      const insertOrch = db.prepare(`
        INSERT INTO orchestration_instances (id, service_id, service_name, user_id, status, steps, start_time, end_time, overall_progress, form_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const orchInstances = [
        [
          'orch_001',
          'newborn_5in1',
          '新生儿五证联办',
          'user_001',
          'running',
          JSON.stringify([
            { stepId: 'step1', name: '出生医学证明', status: 'completed', department: '卫健委', startTime: '2024-05-10T10:35:00Z', endTime: '2024-05-10T14:20:00Z' },
            { stepId: 'step2', name: '预防接种证', status: 'completed', department: '卫健委', startTime: '2024-05-11T09:00:00Z', endTime: '2024-05-11T10:30:00Z' },
            { stepId: 'step3', name: '户口登记', status: 'running', department: '公安局', startTime: '2024-05-12T08:30:00Z' },
            { stepId: 'step4', name: '医保参保登记', status: 'pending', department: '医保局' },
            { stepId: 'step5', name: '社保卡申领', status: 'pending', department: '人社局' },
          ]),
          '2024-05-10 10:30:00',
          null,
          40,
          JSON.stringify({ childName: '陈宝宝', gender: 'male', birthDate: '2024-05-01' }),
        ],
        [
          'orch_002',
          'enterprise_start',
          '企业开办一窗通',
          'user_001',
          'completed',
          JSON.stringify([
            { stepId: 's1', name: '名称核准', status: 'completed', department: '市场监管局', startTime: '2024-03-15T09:05:00Z', endTime: '2024-03-15T11:30:00Z' },
            { stepId: 's2', name: '工商登记', status: 'completed', department: '市场监管局', startTime: '2024-03-15T14:00:00Z', endTime: '2024-03-16T09:00:00Z' },
            { stepId: 's3', name: '刻章备案', status: 'completed', department: '公安局', startTime: '2024-03-16T10:00:00Z', endTime: '2024-03-16T15:30:00Z' },
            { stepId: 's4', name: '税务登记', status: 'completed', department: '税务局', startTime: '2024-03-16T10:30:00Z', endTime: '2024-03-17T09:00:00Z' },
            { stepId: 's5', name: '社保开户', status: 'completed', department: '人社局', startTime: '2024-03-16T11:00:00Z', endTime: '2024-03-17T10:00:00Z' },
          ]),
          '2024-03-15 09:00:00',
          '2024-03-17 18:00:00',
          100,
          JSON.stringify({ enterpriseName: '厦门创新科技有限公司', industry: '信息技术' }),
        ],
        [
          'orch_003',
          'school_enrollment',
          '入学一件事',
          'user_001',
          'running',
          JSON.stringify([
            { stepId: 'se1', name: '房产信息核验', status: 'completed', department: '自然资源和规划局', startTime: '2024-06-01T08:35:00Z', endTime: '2024-06-01T09:20:00Z' },
            { stepId: 'se2', name: '居住证查验', status: 'completed', department: '公安局', startTime: '2024-06-01T08:40:00Z', endTime: '2024-06-01T09:00:00Z' },
            { stepId: 'se3', name: '社保缴纳证明', status: 'completed', department: '人社局', startTime: '2024-06-01T08:45:00Z', endTime: '2024-06-01T09:30:00Z' },
            { stepId: 'se4', name: '入学资格审核', status: 'running', department: '教育局', startTime: '2024-06-02T09:00:00Z' },
            { stepId: 'se5', name: '学位分配', status: 'pending', department: '教育局' },
            { stepId: 'se6', name: '录取通知发放', status: 'pending', department: '教育局' },
          ]),
          '2024-06-01 08:30:00',
          null,
          50,
          JSON.stringify({ childName: '陈小乐', schoolChoice1: '厦门实验小学' }),
        ],
        [
          'orch_004',
          'subsidy_stabilize',
          '稳岗补贴申领',
          'user_001',
          'running',
          JSON.stringify([
            { stepId: 'ss1', name: '企业资格核验', status: 'completed', department: '人社局', startTime: '2024-06-05T14:05:00Z', endTime: '2024-06-05T15:00:00Z' },
            { stepId: 'ss2', name: '裁员率核算', status: 'running', department: '人社局', startTime: '2024-06-06T09:00:00Z' },
            { stepId: 'ss3', name: '返还金额测算', status: 'pending', department: '人社局' },
            { stepId: 'ss4', name: '材料受理审核', status: 'pending', department: '人社局' },
            { stepId: 'ss5', name: '社会公示', status: 'pending', department: '人社局' },
            { stepId: 'ss6', name: '资金拨付', status: 'pending', department: '财政局' },
          ]),
          '2024-06-05 14:00:00',
          null,
          17,
          JSON.stringify({ enterpriseName: '厦门科技有限公司', employeesLastYear: 120 }),
        ],
      ];

      const orchTransaction = db.transaction((items: any[][]) => {
        for (const item of items) {
          insertOrch.run(item);
        }
      });
      orchTransaction(orchInstances);
    }

    const insertSubsidyApp = db.prepare(`
      INSERT INTO subsidy_applications (id, enterprise_id, policy_id, status, amount, apply_time, review_time, payment_time, materials)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const subsidyApps = [
      ['subapp_001', 'ent_001', 'tech_sme_2024', 'reviewing', 350000, '2024-06-10 10:00:00', null, null, JSON.stringify(['研发费用专项审计报告', '科技型中小企业入库登记编号', '企业营业执照'])],
      ['subapp_002', 'ent_001', 'enterprise_stabilize', 'approved', 86000, '2024-02-01 09:00:00', '2024-03-05 11:00:00', null, JSON.stringify(['失业保险缴费证明', '企业财务报表', '上年度裁员情况说明'])],
      ['subapp_003', 'ent_001', 'graduate_employment', 'reviewing', 24000, '2024-05-20 14:00:00', null, null, JSON.stringify(['毕业生身份证', '毕业证书', '劳动合同'])],
      ['subapp_004', 'ent_001', 'tech_sme_2024', 'paid', 280000, '2024-03-15 10:00:00', '2024-04-10 14:30:00', '2024-04-25 10:00:00', JSON.stringify(['研发费用专项审计报告', '科技型中小企业入库登记编号'])],
      ['subapp_005', 'ent_001', 'enterprise_stabilize', 'rejected', 0, '2024-06-01 09:30:00', '2024-06-15 16:00:00', null, JSON.stringify(['失业保险缴费证明', '裁员情况说明'])],
      ['subapp_006', 'ent_001', 'enterprise_stabilize', 'paid', 125000, '2024-01-10 09:00:00', '2024-02-05 11:00:00', '2024-02-20 10:00:00', JSON.stringify(['失业保险缴费证明', '2023年度企业财报'])],
    ];

    const subsidyAppTransaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertSubsidyApp.run(item);
      }
    });
    subsidyAppTransaction(subsidyApps);

    const apptCount = db.prepare('SELECT COUNT(*) as count FROM appointments').get() as { count: number };
    if (apptCount.count === 0) {
      const insertAppt = db.prepare(`
        INSERT INTO appointments (id, user_id, hospital_id, department_id, doctor_id, appointment_date, time_slot, status, fee)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const appointments = [
        ['appt_001', 'user_001', 'hospital_001', 'dept_001', 'doc_001', '2024-06-20', '08:30-09:00', 'confirmed', 50],
        ['appt_002', 'user_001', 'hospital_003', 'dept_008', 'doc_010', '2024-06-22', '15:00-15:30', 'pending', 80],
        ['appt_003', 'user_001', 'hospital_001', 'dept_003', 'doc_004', '2024-06-15', '10:00-10:30', 'completed', 60],
        ['appt_004', 'user_001', 'hospital_002', 'dept_005', 'doc_006', '2024-06-18', '09:30-10:00', 'cancelled', 70],
        ['appt_005', 'user_002', 'hospital_004', 'dept_010', 'doc_009', '2024-06-25', '14:00-14:30', 'pending', 100],
        ['appt_006', 'user_001', 'hospital_003', 'dept_007', 'doc_007', '2024-06-28', '16:00-16:30', 'confirmed', 50],
      ];

      const apptTransaction = db.transaction((items: any[][]) => {
        for (const item of items) {
          insertAppt.run(item);
        }
      });
      apptTransaction(appointments);
    }
  }
}

seedData();

export default db;
