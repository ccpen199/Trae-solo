import Database from 'better-sqlite3'
import { mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DB_PATH = `${__dirname}/../data/social_insurance.db`

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function initDatabase(): Database.Database {
  const dir = dirname(DB_PATH)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  createTables()
  seedData()

  return db
}

function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      id_card VARCHAR(18) UNIQUE NOT NULL,
      user_type VARCHAR(20) NOT NULL,
      gender VARCHAR(10),
      birth_date DATE,
      phone VARCHAR(20),
      address TEXT,
      real_name_verified BOOLEAN DEFAULT FALSE,
      face_image_url VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS insurance_record (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      insurance_type VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL,
      insured_months INTEGER DEFAULT 0,
      personal_account DECIMAL(12,2) DEFAULT 0,
      last_payment_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id)
    );

    CREATE TABLE IF NOT EXISTS payment_record (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      insurance_type VARCHAR(20) NOT NULL,
      payment_month VARCHAR(6) NOT NULL,
      payment_base DECIMAL(12,2) NOT NULL,
      personal_payment DECIMAL(12,2) DEFAULT 0,
      unit_payment DECIMAL(12,2) DEFAULT 0,
      payment_date DATE,
      status VARCHAR(20) DEFAULT 'normal',
      FOREIGN KEY (user_id) REFERENCES user(id)
    );

    CREATE TABLE IF NOT EXISTS benefit_application (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      application_type VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      months INTEGER,
      bank_card_number VARCHAR(30),
      bank_name VARCHAR(100),
      face_verify_id VARCHAR(50),
      deficiency_materials TEXT,
      commitment_signed BOOLEAN DEFAULT FALSE,
      commitment_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME,
      processor_id VARCHAR(36),
      FOREIGN KEY (user_id) REFERENCES user(id)
    );

    CREATE TABLE IF NOT EXISTS medical_institution (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      level VARCHAR(20),
      type VARCHAR(20) NOT NULL,
      address TEXT,
      longitude DECIMAL(10,6),
      latitude DECIMAL(10,6),
      phone VARCHAR(20),
      work_hours VARCHAR(100),
      rating DECIMAL(2,1) DEFAULT 3.0,
      is_medical_insurance BOOLEAN DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS institution_department (
      id VARCHAR(36) PRIMARY KEY,
      institution_id VARCHAR(36) NOT NULL,
      name VARCHAR(50) NOT NULL,
      description TEXT,
      FOREIGN KEY (institution_id) REFERENCES medical_institution(id)
    );

    CREATE TABLE IF NOT EXISTS institution_medicine (
      id VARCHAR(36) PRIMARY KEY,
      institution_id VARCHAR(36) NOT NULL,
      medicine_name VARCHAR(100) NOT NULL,
      specification VARCHAR(100),
      in_catalog BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (institution_id) REFERENCES medical_institution(id)
    );

    CREATE TABLE IF NOT EXISTS risk_control_rule (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(30) NOT NULL,
      severity VARCHAR(20) NOT NULL,
      condition_expr TEXT,
      action VARCHAR(20) NOT NULL,
      enabled BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS risk_warning (
      id VARCHAR(36) PRIMARY KEY,
      rule_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      severity VARCHAR(20) NOT NULL,
      description TEXT,
      amount DECIMAL(12,2),
      status VARCHAR(20) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      handler_id VARCHAR(36),
      handled_at DATETIME,
      handle_result TEXT,
      FOREIGN KEY (rule_id) REFERENCES risk_control_rule(id),
      FOREIGN KEY (user_id) REFERENCES user(id)
    );

    CREATE TABLE IF NOT EXISTS policy_document (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      document_number VARCHAR(100),
      issue_date DATE,
      issuing_department VARCHAR(200),
      content TEXT,
      effective_date DATE,
      expiry_date DATE,
      status VARCHAR(20) DEFAULT 'draft'
    );

    CREATE TABLE IF NOT EXISTS policy_tag (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      category VARCHAR(20) NOT NULL,
      parent_id VARCHAR(36),
      description TEXT,
      FOREIGN KEY (parent_id) REFERENCES policy_tag(id)
    );

    CREATE TABLE IF NOT EXISTS policy_tag_rel (
      id VARCHAR(36) PRIMARY KEY,
      policy_id VARCHAR(36) NOT NULL,
      tag_id VARCHAR(36) NOT NULL,
      FOREIGN KEY (policy_id) REFERENCES policy_document(id),
      FOREIGN KEY (tag_id) REFERENCES policy_tag(id)
    );

    CREATE TABLE IF NOT EXISTS service_log (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      channel VARCHAR(20) NOT NULL,
      business_type VARCHAR(50) NOT NULL,
      application_id VARCHAR(36),
      processing_time INTEGER,
      status VARCHAR(20) NOT NULL,
      rejection_reason TEXT,
      satisfaction INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id)
    );
  `)
}

function seedData(): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM user').get() as { count: number }
  if (userCount.count > 0) return

  const insertUser = db.prepare(`
    INSERT INTO user (id, name, id_card, user_type, gender, birth_date, phone, address, real_name_verified, face_image_url)
    VALUES (@id, @name, @id_card, @user_type, @gender, @birth_date, @phone, @address, @real_name_verified, @face_image_url)
  `)

  const users = [
    { id: 'u-001', name: '张三', id_card: '110101199001011234', user_type: 'insured', gender: '男', birth_date: '1990-01-01', phone: '13800138001', address: '北京市东城区建国门大街1号', real_name_verified: 1, face_image_url: '/uploads/face/u-001.jpg' },
    { id: 'u-002', name: '李四', id_card: '310101198505052345', user_type: 'insured', gender: '女', birth_date: '1985-05-05', phone: '13800138002', address: '上海市黄浦区南京路100号', real_name_verified: 1, face_image_url: '/uploads/face/u-002.jpg' },
    { id: 'u-003', name: '王五', id_card: '440101199203033456', user_type: 'insured', gender: '男', birth_date: '1992-03-03', phone: '13800138003', address: '广州市天河区体育西路50号', real_name_verified: 0, face_image_url: null },
    { id: 'u-004', name: '管理员', id_card: '110101198001014567', user_type: 'admin', gender: '男', birth_date: '1980-01-01', phone: '13800138004', address: '北京市西城区金融街8号', real_name_verified: 1, face_image_url: '/uploads/face/u-004.jpg' },
    { id: 'u-005', name: '陈机构', id_card: '330101197506065678', user_type: 'institution', gender: '女', birth_date: '1975-06-06', phone: '13800138005', address: '杭州市西湖区文三路200号', real_name_verified: 1, face_image_url: '/uploads/face/u-005.jpg' },
  ]

  const insertInsurance = db.prepare(`
    INSERT INTO insurance_record (id, user_id, insurance_type, status, insured_months, personal_account, last_payment_date)
    VALUES (@id, @user_id, @insurance_type, @status, @insured_months, @personal_account, @last_payment_date)
  `)

  const insurances = [
    { id: 'ir-001', user_id: 'u-001', insurance_type: 'pension', status: 'active', insured_months: 120, personal_account: 45600.00, last_payment_date: '2026-05-15' },
    { id: 'ir-002', user_id: 'u-001', insurance_type: 'medical', status: 'active', insured_months: 120, personal_account: 3200.00, last_payment_date: '2026-05-15' },
    { id: 'ir-003', user_id: 'u-002', insurance_type: 'pension', status: 'active', insured_months: 180, personal_account: 68400.00, last_payment_date: '2026-05-20' },
    { id: 'ir-004', user_id: 'u-003', insurance_type: 'unemployment', status: 'suspended', insured_months: 36, personal_account: 0, last_payment_date: '2026-01-10' },
  ]

  const insertPayment = db.prepare(`
    INSERT INTO payment_record (id, user_id, insurance_type, payment_month, payment_base, personal_payment, unit_payment, payment_date, status)
    VALUES (@id, @user_id, @insurance_type, @payment_month, @payment_base, @personal_payment, @unit_payment, @payment_date, @status)
  `)

  const payments = [
    { id: 'pr-001', user_id: 'u-001', insurance_type: 'pension', payment_month: '202605', payment_base: 8000.00, personal_payment: 640.00, unit_payment: 1280.00, payment_date: '2026-05-15', status: 'normal' },
    { id: 'pr-002', user_id: 'u-001', insurance_type: 'medical', payment_month: '202605', payment_base: 8000.00, personal_payment: 160.00, unit_payment: 640.00, payment_date: '2026-05-15', status: 'normal' },
    { id: 'pr-003', user_id: 'u-002', insurance_type: 'pension', payment_month: '202605', payment_base: 12000.00, personal_payment: 960.00, unit_payment: 1920.00, payment_date: '2026-05-20', status: 'normal' },
    { id: 'pr-004', user_id: 'u-003', insurance_type: 'unemployment', payment_month: '202601', payment_base: 5000.00, personal_payment: 25.00, unit_payment: 350.00, payment_date: '2026-01-10', status: 'overdue' },
  ]

  const insertInstitution = db.prepare(`
    INSERT INTO medical_institution (id, name, level, type, address, longitude, latitude, phone, work_hours, rating, is_medical_insurance)
    VALUES (@id, @name, @level, @type, @address, @longitude, @latitude, @phone, @work_hours, @rating, @is_medical_insurance)
  `)

  const institutions = [
    { id: 'mi-001', name: '省人民医院', level: '三甲', type: 'comprehensive', address: '北京市东城区东交民巷1号', longitude: 116.4100, latitude: 39.9100, phone: '010-88001000', work_hours: '08:00-17:00', rating: 4.5, is_medical_insurance: 1 },
    { id: 'mi-002', name: '市中心医院', level: '三乙', type: 'comprehensive', address: '上海市黄浦区人民大道200号', longitude: 121.4700, latitude: 31.2300, phone: '021-63201000', work_hours: '08:00-17:30', rating: 4.2, is_medical_insurance: 1 },
    { id: 'mi-003', name: '区中医院', level: '二甲', type: 'traditional_chinese', address: '广州市越秀区大德路108号', longitude: 113.2600, latitude: 23.1300, phone: '020-81881000', work_hours: '08:00-17:00', rating: 3.8, is_medical_insurance: 1 },
    { id: 'mi-004', name: '社区卫生服务中心', level: '一级', type: 'community', address: '杭州市西湖区文三路500号', longitude: 120.1300, latitude: 30.2700, phone: '0571-88801000', work_hours: '08:30-17:00', rating: 3.5, is_medical_insurance: 0 },
  ]

  const insertDepartment = db.prepare(`
    INSERT INTO institution_department (id, institution_id, name, description)
    VALUES (@id, @institution_id, @name, @description)
  `)

  const departments = [
    { id: 'dept-001', institution_id: 'mi-001', name: '内科', description: '消化内科、心血管内科、呼吸内科' },
    { id: 'dept-002', institution_id: 'mi-001', name: '外科', description: '普外科、骨科、神经外科' },
    { id: 'dept-003', institution_id: 'mi-002', name: '妇产科', description: '妇科、产科、计划生育' },
    { id: 'dept-004', institution_id: 'mi-003', name: '中医科', description: '针灸推拿、中医内科、中医骨伤' },
    { id: 'dept-005', institution_id: 'mi-004', name: '全科', description: '社区常见病、慢性病管理' },
    { id: 'dept-006', institution_id: 'mi-001', name: '急诊科', description: '24小时急诊服务' },
  ]

  const insertMedicine = db.prepare(`
    INSERT INTO institution_medicine (id, institution_id, medicine_name, specification, in_catalog)
    VALUES (@id, @institution_id, @medicine_name, @specification, @in_catalog)
  `)

  const medicines = [
    { id: 'med-001', institution_id: 'mi-001', medicine_name: '阿莫西林胶囊', specification: '0.5g*24粒', in_catalog: 1 },
    { id: 'med-002', institution_id: 'mi-001', medicine_name: '布洛芬缓释胶囊', specification: '0.3g*20粒', in_catalog: 1 },
    { id: 'med-003', institution_id: 'mi-002', medicine_name: '复方丹参滴丸', specification: '27mg*180丸', in_catalog: 1 },
    { id: 'med-004', institution_id: 'mi-003', medicine_name: '六味地黄丸', specification: '360丸', in_catalog: 1 },
    { id: 'med-005', institution_id: 'mi-001', medicine_name: '参芪扶正注射液', specification: '250ml', in_catalog: 0 },
  ]

  const insertRule = db.prepare(`
    INSERT INTO risk_control_rule (id, name, type, severity, condition_expr, action, enabled)
    VALUES (@id, @name, @type, @severity, @condition_expr, @action, @enabled)
  `)

  const rules = [
    { id: 'rcr-001', name: '重复申领检测', type: 'duplicate_application', severity: 'high', condition_expr: 'same_user_same_type_within_30_days', action: 'block', enabled: 1 },
    { id: 'rcr-002', name: '高额待遇异常', type: 'abnormal_amount', severity: 'medium', condition_expr: 'amount > 3 * avg_amount', action: 'review', enabled: 1 },
    { id: 'rcr-003', name: '缴费年限异常', type: 'contribution_anomaly', severity: 'low', condition_expr: 'insured_months < 12 AND status = active', action: 'warn', enabled: 1 },
    { id: 'rcr-004', name: '身份信息不一致', type: 'identity_mismatch', severity: 'high', condition_expr: 'id_card_mismatch OR face_mismatch', action: 'block', enabled: 1 },
  ]

  const insertTag = db.prepare(`
    INSERT INTO policy_tag (id, name, category, parent_id, description)
    VALUES (@id, @name, @category, @parent_id, @description)
  `)

  const tags = [
    { id: 'tag-001', name: '养老保险', category: 'insurance', parent_id: null, description: '养老保险相关政策' },
    { id: 'tag-002', name: '医疗保险', category: 'insurance', parent_id: null, description: '医疗保险相关政策' },
    { id: 'tag-003', name: '失业保险', category: 'insurance', parent_id: null, description: '失业保险相关政策' },
    { id: 'tag-004', name: '工伤保险', category: 'insurance', parent_id: null, description: '工伤保险相关政策' },
    { id: 'tag-005', name: '生育保险', category: 'insurance', parent_id: null, description: '生育保险相关政策' },
    { id: 'tag-006', name: '养老金计发', category: 'benefit', parent_id: 'tag-001', description: '养老金计算与发放' },
    { id: 'tag-007', name: '医保报销', category: 'benefit', parent_id: 'tag-002', description: '医保报销比例与流程' },
    { id: 'tag-008', name: '失业金申领', category: 'benefit', parent_id: 'tag-003', description: '失业金申领条件与流程' },
    { id: 'tag-009', name: '缴费基数', category: 'payment', parent_id: null, description: '社保缴费基数调整' },
    { id: 'tag-010', name: '转移接续', category: 'transfer', parent_id: null, description: '社保关系转移接续' },
  ]

  const insertPolicy = db.prepare(`
    INSERT INTO policy_document (id, title, document_number, issue_date, issuing_department, content, effective_date, expiry_date, status)
    VALUES (@id, @title, @document_number, @issue_date, @issuing_department, @content, @effective_date, @expiry_date, @status)
  `)

  const policies = [
    { id: 'pd-001', title: '关于调整2026年度社会保险缴费基数上下限的通知', document_number: '人社发〔2026〕12号', issue_date: '2026-01-15', issuing_department: '省人力资源和社会保障厅', content: '根据上年度全省全口径城镇单位就业人员平均工资情况，现对2026年度社会保险缴费基数上下限进行调整。缴费基数上限为20000元/月，下限为4000元/月。', effective_date: '2026-02-01', expiry_date: '2027-01-31', status: 'effective' },
    { id: 'pd-002', title: '关于进一步完善失业保险金申领发放有关工作的通知', document_number: '人社发〔2026〕18号', issue_date: '2026-03-10', issuing_department: '省人力资源和社会保障厅', content: '为进一步规范失业保险金申领发放工作，简化申领流程，推行网上办理，实现失业保险金申领"最多跑一次"。取消户籍地限制，可在参保地或居住地申领。', effective_date: '2026-04-01', expiry_date: null, status: 'effective' },
  ]

  const insertTagRel = db.prepare(`
    INSERT INTO policy_tag_rel (id, policy_id, tag_id)
    VALUES (@id, @policy_id, @tag_id)
  `)

  const tagRels = [
    { id: 'ptr-001', policy_id: 'pd-001', tag_id: 'tag-009' },
    { id: 'ptr-002', policy_id: 'pd-001', tag_id: 'tag-001' },
    { id: 'ptr-003', policy_id: 'pd-001', tag_id: 'tag-002' },
    { id: 'ptr-004', policy_id: 'pd-002', tag_id: 'tag-003' },
    { id: 'ptr-005', policy_id: 'pd-002', tag_id: 'tag-008' },
  ]

  const insertServiceLog = db.prepare(`
    INSERT INTO service_log (id, user_id, channel, business_type, application_id, processing_time, status, rejection_reason, satisfaction, created_at)
    VALUES (@id, @user_id, @channel, @business_type, @application_id, @processing_time, @status, @rejection_reason, @satisfaction, @created_at)
  `)

  const serviceLogs = [
    { id: 'sl-001', user_id: 'u-001', channel: 'online', business_type: 'pension_query', application_id: null, processing_time: 2, status: 'success', rejection_reason: null, satisfaction: 5, created_at: '2026-05-10 09:30:00' },
    { id: 'sl-002', user_id: 'u-002', channel: 'online', business_type: 'benefit_application', application_id: 'ba-001', processing_time: 15, status: 'success', rejection_reason: null, satisfaction: 4, created_at: '2026-05-12 14:20:00' },
    { id: 'sl-003', user_id: 'u-003', channel: 'window', business_type: 'unemployment_apply', application_id: 'ba-002', processing_time: 30, status: 'rejected', rejection_reason: '材料不完整，缺少解除劳动关系证明', satisfaction: 2, created_at: '2026-05-15 10:00:00' },
    { id: 'sl-004', user_id: 'u-001', channel: 'online', business_type: 'payment_query', application_id: null, processing_time: 1, status: 'success', rejection_reason: null, satisfaction: 5, created_at: '2026-05-18 16:45:00' },
    { id: 'sl-005', user_id: 'u-003', channel: 'online', business_type: 'unemployment_apply', application_id: 'ba-003', processing_time: 20, status: 'success', rejection_reason: null, satisfaction: 4, created_at: '2026-05-20 11:30:00' },
    { id: 'sl-006', user_id: 'u-002', channel: 'window', business_type: 'medical_reimbursement', application_id: 'ba-004', processing_time: 25, status: 'rejected', rejection_reason: '发票信息与就诊记录不符', satisfaction: 1, created_at: '2026-05-22 09:15:00' },
  ]

  const insertWarning = db.prepare(`
    INSERT INTO risk_warning (id, rule_id, user_id, severity, description, amount, status, created_at, handler_id, handled_at, handle_result)
    VALUES (@id, @rule_id, @user_id, @severity, @description, @amount, @status, @created_at, @handler_id, @handled_at, @handle_result)
  `)

  const warnings = [
    { id: 'rw-001', rule_id: 'rcr-002', user_id: 'u-002', severity: 'medium', description: '该用户养老金申领金额超过平均水平的3倍', amount: 15000.00, status: 'pending', created_at: '2026-05-25 10:00:00', handler_id: null, handled_at: null, handle_result: null },
    { id: 'rw-002', rule_id: 'rcr-003', user_id: 'u-003', severity: 'low', description: '该用户失业保险缴费年限不足12个月但状态为参保中', amount: null, status: 'handled', created_at: '2026-05-20 14:30:00', handler_id: 'u-004', handled_at: '2026-05-21 09:00:00', handle_result: '经核实为正常参保，缴费中断后恢复' },
  ]

  const transaction = db.transaction(() => {
    for (const u of users) insertUser.run(u)
    for (const i of insurances) insertInsurance.run(i)
    for (const p of payments) insertPayment.run(p)
    for (const inst of institutions) insertInstitution.run(inst)
    for (const d of departments) insertDepartment.run(d)
    for (const m of medicines) insertMedicine.run(m)
    for (const r of rules) insertRule.run(r)
    for (const t of tags) insertTag.run(t)
    for (const p of policies) insertPolicy.run(p)
    for (const tr of tagRels) insertTagRel.run(tr)
    for (const sl of serviceLogs) insertServiceLog.run(sl)
    for (const w of warnings) insertWarning.run(w)
  })

  transaction()
}
