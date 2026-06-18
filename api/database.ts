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
    enterprise_id TEXT REFERENCES enterprises(id),
    status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'rejected')),
    form_data TEXT NOT NULL DEFAULT '{}',
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
      ['id_card', '居民身份证', '身份凭证', '厦门市公安局', '中华人民共和国居民身份证'],
      ['ss_card', '社会保障卡', '社保医保', '厦门市人力资源和社会保障局', '厦门市社会保障卡'],
      ['household', '居民户口簿', '身份凭证', '厦门市公安局', '居民户口簿'],
      ['driver_license', '机动车驾驶证', '交通出行', '厦门市公安局交通警察支队', '机动车驾驶证'],
      ['birth_cert', '出生医学证明', '身份凭证', '厦门市卫生健康委员会', '出生医学证明'],
      ['marriage_cert', '结婚证', '婚姻登记', '厦门市民政局', '中华人民共和国结婚证'],
      ['property_cert', '不动产权证书', '房产土地', '厦门市自然资源和规划局', '中华人民共和国不动产权证书'],
      ['business_license', '营业执照', '企业资质', '厦门市市场监督管理局', '营业执照'],
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
      INSERT INTO one_stop_services (id, name, category, description, icon, required_materials, involved_departments, estimated_days, flow_steps, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
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
      INSERT INTO policies (id, title, category, source, publish_date, summary, tags, view_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);

    const policies = [
      [
        'policy_001',
        '厦门市进一步优化营商环境实施方案',
        '营商环境',
        '厦门市人民政府',
        '2024-01-15',
        '围绕企业开办、项目审批、融资服务等方面推出28条具体措施，持续打造一流营商环境。',
        JSON.stringify(['营商环境', '企业服务', '放管服']),
      ],
      [
        'policy_002',
        '厦门市住房公积金提取新政',
        '住房公积金',
        '厦门市住房公积金管理中心',
        '2024-02-20',
        '租房提取额度提高至每月1500元，加装电梯可提取公积金，进一步扩大公积金使用范围。',
        JSON.stringify(['公积金', '住房保障', '民生']),
      ],
      [
        'policy_003',
        '厦门市高校毕业生就业创业扶持政策',
        '就业创业',
        '厦门市人力资源和社会保障局',
        '2024-03-01',
        '提供就业补贴、创业担保贷款、住房补贴等多重扶持，鼓励高校毕业生来厦就业创业。',
        JSON.stringify(['高校毕业生', '就业', '创业']),
      ],
      [
        'policy_004',
        '厦门市老年人意外伤害保险实施方案',
        '养老服务',
        '厦门市民政局',
        '2024-01-10',
        '为60周岁以上老年人购买意外伤害保险，每人每年保费50元，由政府全额承担。',
        JSON.stringify(['养老', '老年人', '民生保障']),
      ],
      [
        'policy_005',
        '厦门市新能源汽车推广应用补贴办法',
        '交通出行',
        '厦门市工业和信息化局',
        '2024-02-01',
        '对购买新能源汽车给予最高1万元购置补贴，建设充电桩给予建设运营补贴。',
        JSON.stringify(['新能源', '汽车补贴', '绿色出行']),
      ],
      [
        'policy_006',
        '厦门市小微企业减税降费政策',
        '财税金融',
        '厦门市税务局',
        '2024-01-01',
        '落实增值税小规模纳税人减免政策，小微企业所得税优惠，进一步减轻企业负担。',
        JSON.stringify(['小微企业', '减税降费', '税收优惠']),
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
      ['cert_004', 'user_002', 'id_card', '350204199202022345', '厦门市公安局', '2019-08-10', '2039-08-10', 'valid', JSON.stringify({ address: '厦门市湖里区仙岳路200号' }), 'QR004', 'https://verify.xm.gov.cn/cert/004'],
      ['cert_005', 'user_002', 'ss_card', 'D87654321', '厦门市人力资源和社会保障局', '2016-04-20', null, 'valid', JSON.stringify({ cardNo: '6212260000000005678' }), 'QR005', 'https://verify.xm.gov.cn/cert/005'],
    ];

    const certTransaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertCert.run(item);
      }
    });
    certTransaction(certs);

    const insertApp = db.prepare(`
      INSERT INTO applications (id, user_id, service_id, status, form_data, submit_time, current_step, total_steps)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const apps = [
      ['app_001', 'user_001', 'newborn_5in1', 'processing', JSON.stringify({ childName: '陈宝宝', gender: 'male', birthDate: '2024-05-01', hospital: '厦门市妇幼保健院' }), '2024-05-10 10:30:00', 3, 5],
      ['app_002', 'user_001', 'enterprise_start', 'completed', JSON.stringify({ enterpriseName: '厦门创新科技有限公司', industry: '信息技术' }), '2024-03-15 09:00:00', 5, 5],
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
    ];

    const historyTransaction = db.transaction((items: any[][]) => {
      for (const item of items) {
        insertHistory.run(item);
      }
    });
    historyTransaction(histories);
  }
}

seedData();

export default db;
