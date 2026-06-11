import Database from 'better-sqlite3'
import { mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbDir = join(__dirname, 'data')
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
}

const dbPath = join(dbDir, 'gov.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('citizen', 'staff', 'admin')),
    ca_token TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('government', 'convenience')),
    sub_category TEXT NOT NULL,
    department_id TEXT NOT NULL REFERENCES departments(id),
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    access_type TEXT NOT NULL CHECK(access_type IN ('http', 'webhook', 'api-gateway')),
    access_config TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('online', 'offline', 'pending')),
    applicant_count INTEGER NOT NULL DEFAULT 0,
    process_steps TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES services(id),
    name TEXT NOT NULL,
    description TEXT,
    ocr_fields TEXT NOT NULL DEFAULT '[]',
    required INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    service_id TEXT NOT NULL REFERENCES services(id),
    status TEXT NOT NULL DEFAULT 'submitted',
    form_data TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS health_metrics (
    id TEXT PRIMARY KEY,
    department_id TEXT NOT NULL REFERENCES departments(id),
    avg_response_time REAL NOT NULL,
    failure_rate REAL NOT NULL,
    timeout_count INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('healthy', 'warning', 'critical')),
    checked_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS heatmap_data (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES services(id),
    region TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    date TEXT NOT NULL
  );
`)

const seedCheck = db.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number }
if (seedCheck.count === 0) {
  const insertDepartment = db.prepare('INSERT INTO departments (id, name, contact) VALUES (?, ?, ?)')
  const departments = [
    { id: 'dept-001', name: '人社局', contact: '0571-88012345' },
    { id: 'dept-002', name: '税务局', contact: '0571-88012346' },
    { id: 'dept-003', name: '住建局', contact: '0571-88012347' },
    { id: 'dept-004', name: '自然资源局', contact: '0571-88012348' },
    { id: 'dept-005', name: '城管局', contact: '0571-88012349' },
    { id: 'dept-006', name: '水务局', contact: '0571-88012350' },
    { id: 'dept-007', name: '供电公司', contact: '0571-88012351' },
    { id: 'dept-008', name: '燃气公司', contact: '0571-88012352' },
  ]
  for (const d of departments) {
    insertDepartment.run(d.id, d.name, d.contact)
  }

  const insertUser = db.prepare('INSERT INTO users (id, name, role, ca_token) VALUES (?, ?, ?, ?)')
  const users = [
    { id: 'user-001', name: '张三', role: 'citizen', ca_token: 'ca-token-zhangsan' },
    { id: 'user-002', name: '李四', role: 'staff', ca_token: 'ca-token-lisi' },
    { id: 'user-003', name: '王五', role: 'admin', ca_token: 'ca-token-wangwu' },
  ]
  for (const u of users) {
    insertUser.run(u.id, u.name, u.role, u.ca_token)
  }

  const insertService = db.prepare(`INSERT INTO services (id, name, category, sub_category, department_id, description, icon, access_type, access_config, status, applicant_count, process_steps) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const services = [
    {
      id: 'svc-001', name: '社保缴纳', category: 'government', sub_category: '社会保障',
      department_id: 'dept-001', description: '办理社会保险缴纳业务，包括养老、医疗、失业等险种',
      icon: 'shield', access_type: 'api-gateway',
      access_config: JSON.stringify({ endpoint: '/api/social-insurance/pay', method: 'POST' }),
      status: 'online', applicant_count: 15280,
      process_steps: JSON.stringify(['填写个人信息', '选择缴纳险种', '确认缴纳金额', '在线支付', '生成缴费凭证']),
    },
    {
      id: 'svc-002', name: '税务预约', category: 'government', sub_category: '税务服务',
      department_id: 'dept-002', description: '预约办税时间，减少现场排队等待',
      icon: 'calendar', access_type: 'http',
      access_config: JSON.stringify({ endpoint: '/api/tax/appointment', method: 'POST' }),
      status: 'online', applicant_count: 8930,
      process_steps: JSON.stringify(['选择业务类型', '选择预约时间', '填写预约信息', '确认预约', '获取预约编号']),
    },
    {
      id: 'svc-003', name: '投诉反馈', category: 'government', sub_category: '城市治理',
      department_id: 'dept-005', description: '提交城市管理相关投诉和建议',
      icon: 'message-square', access_type: 'webhook',
      access_config: JSON.stringify({ endpoint: '/api/complaint/submit', method: 'POST', callback: '/api/complaint/callback' }),
      status: 'online', applicant_count: 22150,
      process_steps: JSON.stringify(['选择投诉类型', '填写投诉内容', '上传佐证材料', '提交投诉', '跟踪处理进度']),
    },
    {
      id: 'svc-004', name: '住房公积金提取', category: 'government', sub_category: '住房保障',
      department_id: 'dept-003', description: '办理住房公积金提取业务',
      icon: 'home', access_type: 'api-gateway',
      access_config: JSON.stringify({ endpoint: '/api/housing-fund/withdraw', method: 'POST' }),
      status: 'online', applicant_count: 11340,
      process_steps: JSON.stringify(['选择提取原因', '填写提取信息', '上传证明材料', '审核确认', '资金到账']),
    },
    {
      id: 'svc-005', name: '营业执照办理', category: 'government', sub_category: '市场准入',
      department_id: 'dept-004', description: '在线申请办理营业执照',
      icon: 'briefcase', access_type: 'api-gateway',
      access_config: JSON.stringify({ endpoint: '/api/business-license/apply', method: 'POST' }),
      status: 'pending', applicant_count: 5670,
      process_steps: JSON.stringify(['填写企业信息', '上传法人材料', '选择经营范围', '提交审核', '领取执照']),
    },
    {
      id: 'svc-006', name: '户籍迁移', category: 'government', sub_category: '人口管理',
      department_id: 'dept-004', description: '办理户口迁移手续',
      icon: 'users', access_type: 'http',
      access_config: JSON.stringify({ endpoint: '/api/hukou/transfer', method: 'POST' }),
      status: 'offline', applicant_count: 3420,
      process_steps: JSON.stringify(['填写迁移信息', '上传户籍材料', '社区审核', '派出所审批', '完成迁移']),
    },
    {
      id: 'svc-007', name: '水费缴纳', category: 'convenience', sub_category: '生活缴费',
      department_id: 'dept-006', description: '在线缴纳水费',
      icon: 'droplets', access_type: 'http',
      access_config: JSON.stringify({ endpoint: '/api/water/pay', method: 'POST' }),
      status: 'online', applicant_count: 34560,
      process_steps: JSON.stringify(['输入水表编号', '查询欠费信息', '确认缴费金额', '在线支付', '获取缴费凭证']),
    },
    {
      id: 'svc-008', name: '电费缴纳', category: 'convenience', sub_category: '生活缴费',
      department_id: 'dept-007', description: '在线缴纳电费',
      icon: 'zap', access_type: 'http',
      access_config: JSON.stringify({ endpoint: '/api/electricity/pay', method: 'POST' }),
      status: 'online', applicant_count: 45230,
      process_steps: JSON.stringify(['输入电表编号', '查询用电信息', '确认缴费金额', '在线支付', '获取缴费凭证']),
    },
    {
      id: 'svc-009', name: '燃气费缴纳', category: 'convenience', sub_category: '生活缴费',
      department_id: 'dept-008', description: '在线缴纳燃气费',
      icon: 'flame', access_type: 'http',
      access_config: JSON.stringify({ endpoint: '/api/gas/pay', method: 'POST' }),
      status: 'online', applicant_count: 28910,
      process_steps: JSON.stringify(['输入燃气表编号', '查询欠费信息', '确认缴费金额', '在线支付', '获取缴费凭证']),
    },
    {
      id: 'svc-010', name: '不动产信息查询', category: 'convenience', sub_category: '房产服务',
      department_id: 'dept-004', description: '查询不动产登记信息',
      icon: 'building', access_type: 'api-gateway',
      access_config: JSON.stringify({ endpoint: '/api/real-estate/query', method: 'GET' }),
      status: 'online', applicant_count: 9870,
      process_steps: JSON.stringify(['身份验证', '输入查询条件', '获取查询结果', '下载证明文件']),
    },
    {
      id: 'svc-011', name: '交通违章处理', category: 'convenience', sub_category: '交通出行',
      department_id: 'dept-005', description: '在线处理交通违章罚款',
      icon: 'car', access_type: 'http',
      access_config: JSON.stringify({ endpoint: '/api/traffic/violation', method: 'POST' }),
      status: 'online', applicant_count: 18430,
      process_steps: JSON.stringify(['输入车牌号', '查询违章记录', '确认违章信息', '在线缴费', '获取处理凭证']),
    },
    {
      id: 'svc-012', name: '城市公交充值', category: 'convenience', sub_category: '交通出行',
      department_id: 'dept-005', description: '为公交卡在线充值',
      icon: 'credit-card', access_type: 'http',
      access_config: JSON.stringify({ endpoint: '/api/transit/recharge', method: 'POST' }),
      status: 'online', applicant_count: 31200,
      process_steps: JSON.stringify(['输入公交卡号', '选择充值金额', '在线支付', '充值到账确认']),
    },
  ]
  for (const s of services) {
    insertService.run(s.id, s.name, s.category, s.sub_category, s.department_id, s.description, s.icon, s.access_type, s.access_config, s.status, s.applicant_count, s.process_steps)
  }

  const insertMaterial = db.prepare('INSERT INTO materials (id, service_id, name, description, ocr_fields, required) VALUES (?, ?, ?, ?, ?, ?)')
  const materials = [
    { id: 'mat-001', service_id: 'svc-001', name: '身份证', description: '申请人身份证正反面', ocr_fields: JSON.stringify([{ field: 'name', label: '姓名', confidence: 0.98 }, { field: 'id_number', label: '身份证号', confidence: 0.97 }, { field: 'address', label: '住址', confidence: 0.92 }]), required: 1 },
    { id: 'mat-002', service_id: 'svc-001', name: '社保缴费证明', description: '近期社保缴费记录', ocr_fields: JSON.stringify([{ field: 'payment_month', label: '缴费月份', confidence: 0.95 }, { field: 'amount', label: '缴费金额', confidence: 0.93 }]), required: 1 },
    { id: 'mat-003', service_id: 'svc-001', name: '银行卡', description: '用于扣费的银行卡信息', ocr_fields: JSON.stringify([{ field: 'card_number', label: '卡号', confidence: 0.96 }, { field: 'bank_name', label: '开户行', confidence: 0.91 }]), required: 1 },
    { id: 'mat-004', service_id: 'svc-002', name: '身份证', description: '办税人身份证', ocr_fields: JSON.stringify([{ field: 'name', label: '姓名', confidence: 0.98 }, { field: 'id_number', label: '身份证号', confidence: 0.97 }]), required: 1 },
    { id: 'mat-005', service_id: 'svc-002', name: '税务登记证', description: '企业税务登记证明', ocr_fields: JSON.stringify([{ field: 'tax_id', label: '税号', confidence: 0.96 }, { field: 'company_name', label: '企业名称', confidence: 0.94 }]), required: 1 },
    { id: 'mat-006', service_id: 'svc-003', name: '现场照片', description: '投诉问题现场照片', ocr_fields: JSON.stringify([]), required: 0 },
    { id: 'mat-007', service_id: 'svc-003', name: '身份证', description: '投诉人身份证明', ocr_fields: JSON.stringify([{ field: 'name', label: '姓名', confidence: 0.98 }, { field: 'id_number', label: '身份证号', confidence: 0.97 }]), required: 1 },
    { id: 'mat-008', service_id: 'svc-003', name: '相关证明材料', description: '与投诉事项相关的证明文件', ocr_fields: JSON.stringify([]), required: 0 },
    { id: 'mat-009', service_id: 'svc-004', name: '身份证', description: '申请人身份证', ocr_fields: JSON.stringify([{ field: 'name', label: '姓名', confidence: 0.98 }, { field: 'id_number', label: '身份证号', confidence: 0.97 }]), required: 1 },
    { id: 'mat-010', service_id: 'svc-004', name: '购房合同', description: '房产购买合同或租赁合同', ocr_fields: JSON.stringify([{ field: 'contract_no', label: '合同编号', confidence: 0.94 }, { field: 'address', label: '房屋地址', confidence: 0.91 }]), required: 1 },
    { id: 'mat-011', service_id: 'svc-004', name: '银行卡', description: '收款银行卡', ocr_fields: JSON.stringify([{ field: 'card_number', label: '卡号', confidence: 0.96 }]), required: 1 },
    { id: 'mat-012', service_id: 'svc-005', name: '身份证', description: '法人身份证', ocr_fields: JSON.stringify([{ field: 'name', label: '姓名', confidence: 0.98 }, { field: 'id_number', label: '身份证号', confidence: 0.97 }]), required: 1 },
    { id: 'mat-013', service_id: 'svc-005', name: '经营场所证明', description: '公司注册地址证明', ocr_fields: JSON.stringify([{ field: 'address', label: '地址', confidence: 0.90 }]), required: 1 },
    { id: 'mat-014', service_id: 'svc-006', name: '身份证', description: '迁移人身份证', ocr_fields: JSON.stringify([{ field: 'name', label: '姓名', confidence: 0.98 }, { field: 'id_number', label: '身份证号', confidence: 0.97 }]), required: 1 },
    { id: 'mat-015', service_id: 'svc-006', name: '户口本', description: '原户口本信息', ocr_fields: JSON.stringify([{ field: 'household_no', label: '户号', confidence: 0.93 }, { field: 'address', label: '户籍地址', confidence: 0.89 }]), required: 1 },
    { id: 'mat-016', service_id: 'svc-006', name: '房产证明', description: '迁入地房产证明', ocr_fields: JSON.stringify([{ field: 'owner', label: '产权人', confidence: 0.92 }, { field: 'address', label: '房产地址', confidence: 0.90 }]), required: 1 },
    { id: 'mat-017', service_id: 'svc-007', name: '水费账单', description: '近期水费账单', ocr_fields: JSON.stringify([{ field: 'meter_no', label: '水表号', confidence: 0.95 }, { field: 'amount', label: '欠费金额', confidence: 0.93 }]), required: 1 },
    { id: 'mat-018', service_id: 'svc-008', name: '电费账单', description: '近期电费账单', ocr_fields: JSON.stringify([{ field: 'meter_no', label: '电表号', confidence: 0.95 }, { field: 'amount', label: '欠费金额', confidence: 0.94 }]), required: 1 },
    { id: 'mat-019', service_id: 'svc-009', name: '燃气费账单', description: '近期燃气费账单', ocr_fields: JSON.stringify([{ field: 'meter_no', label: '燃气表号', confidence: 0.94 }, { field: 'amount', label: '欠费金额', confidence: 0.92 }]), required: 1 },
    { id: 'mat-020', service_id: 'svc-010', name: '身份证', description: '查询人身份证', ocr_fields: JSON.stringify([{ field: 'name', label: '姓名', confidence: 0.98 }, { field: 'id_number', label: '身份证号', confidence: 0.97 }]), required: 1 },
    { id: 'mat-021', service_id: 'svc-011', name: '行驶证', description: '机动车行驶证', ocr_fields: JSON.stringify([{ field: 'plate_no', label: '车牌号', confidence: 0.97 }, { field: 'vehicle_type', label: '车辆类型', confidence: 0.93 }]), required: 1 },
    { id: 'mat-022', service_id: 'svc-011', name: '驾驶证', description: '驾驶人驾驶证', ocr_fields: JSON.stringify([{ field: 'name', label: '姓名', confidence: 0.98 }, { field: 'license_no', label: '驾驶证号', confidence: 0.96 }]), required: 1 },
    { id: 'mat-023', service_id: 'svc-012', name: '公交卡信息', description: '公交卡卡号信息', ocr_fields: JSON.stringify([{ field: 'card_no', label: '卡号', confidence: 0.95 }]), required: 1 },
  ]
  for (const m of materials) {
    insertMaterial.run(m.id, m.service_id, m.name, m.description, m.ocr_fields, m.required)
  }

  const insertHealth = db.prepare('INSERT INTO health_metrics (id, department_id, avg_response_time, failure_rate, timeout_count, status, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
  const healthMetrics = [
    { id: 'hm-001', department_id: 'dept-001', avg_response_time: 120, failure_rate: 0.02, timeout_count: 3, status: 'healthy', checked_at: '2026-06-09 08:00:00' },
    { id: 'hm-002', department_id: 'dept-002', avg_response_time: 250, failure_rate: 0.05, timeout_count: 8, status: 'warning', checked_at: '2026-06-09 08:00:00' },
    { id: 'hm-003', department_id: 'dept-003', avg_response_time: 180, failure_rate: 0.03, timeout_count: 5, status: 'healthy', checked_at: '2026-06-09 08:00:00' },
    { id: 'hm-004', department_id: 'dept-004', avg_response_time: 450, failure_rate: 0.12, timeout_count: 22, status: 'critical', checked_at: '2026-06-09 08:00:00' },
    { id: 'hm-005', department_id: 'dept-005', avg_response_time: 200, failure_rate: 0.04, timeout_count: 6, status: 'healthy', checked_at: '2026-06-09 08:00:00' },
    { id: 'hm-006', department_id: 'dept-006', avg_response_time: 320, failure_rate: 0.08, timeout_count: 15, status: 'warning', checked_at: '2026-06-09 08:00:00' },
    { id: 'hm-007', department_id: 'dept-007', avg_response_time: 150, failure_rate: 0.01, timeout_count: 2, status: 'healthy', checked_at: '2026-06-09 08:00:00' },
    { id: 'hm-008', department_id: 'dept-008', avg_response_time: 380, failure_rate: 0.09, timeout_count: 18, status: 'warning', checked_at: '2026-06-09 08:00:00' },
  ]
  for (const h of healthMetrics) {
    insertHealth.run(h.id, h.department_id, h.avg_response_time, h.failure_rate, h.timeout_count, h.status, h.checked_at)
  }

  const insertHeatmap = db.prepare('INSERT INTO heatmap_data (id, service_id, region, time_slot, count, date) VALUES (?, ?, ?, ?, ?, ?)')
  const regions = ['中心城区', '东区', '西区', '南区', '北区']
  const timeSlots = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00']
  const serviceIds = ['svc-001', 'svc-002', 'svc-003', 'svc-004', 'svc-007', 'svc-008', 'svc-009', 'svc-010', 'svc-011', 'svc-012']
  const dates = ['2026-06-07', '2026-06-08', '2026-06-09']
  let heatmapId = 1
  for (const date of dates) {
    for (const svcId of serviceIds) {
      for (const region of regions) {
        for (const slot of timeSlots) {
          const count = Math.floor(Math.random() * 80) + 5
          insertHeatmap.run(`hm-data-${String(heatmapId++).padStart(4, '0')}`, svcId, region, slot, count, date)
        }
      }
    }
  }

  const insertCase = db.prepare('INSERT INTO cases (id, user_id, service_id, status, form_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
  const caseStatuses = ['submitted', 'processing', 'approved', 'rejected', 'completed']
  const caseData = [
    { id: 'case-001', user_id: 'user-001', service_id: 'svc-001', status: 'completed', form_data: JSON.stringify({ name: '张三', id_number: '330102199001011234', insurance_type: '养老保险' }), created_at: '2026-05-15 09:30:00', updated_at: '2026-05-18 14:20:00' },
    { id: 'case-002', user_id: 'user-001', service_id: 'svc-007', status: 'completed', form_data: JSON.stringify({ meter_no: 'WH20230001', amount: 85.6 }), created_at: '2026-05-20 10:15:00', updated_at: '2026-05-20 10:16:00' },
    { id: 'case-003', user_id: 'user-001', service_id: 'svc-008', status: 'processing', form_data: JSON.stringify({ meter_no: 'DL20230567', amount: 230.45 }), created_at: '2026-06-01 14:22:00', updated_at: '2026-06-01 14:22:00' },
    { id: 'case-004', user_id: 'user-001', service_id: 'svc-003', status: 'processing', form_data: JSON.stringify({ type: '噪音投诉', content: '夜间施工噪音扰民', address: 'xx路88号' }), created_at: '2026-06-02 08:45:00', updated_at: '2026-06-03 11:00:00' },
    { id: 'case-005', user_id: 'user-001', service_id: 'svc-011', status: 'approved', form_data: JSON.stringify({ plate_no: '浙A12345', violation_id: 'V2026060001' }), created_at: '2026-06-03 16:30:00', updated_at: '2026-06-05 09:10:00' },
    { id: 'case-006', user_id: 'user-001', service_id: 'svc-004', status: 'submitted', form_data: JSON.stringify({ name: '张三', reason: '购房提取', amount: 50000 }), created_at: '2026-06-05 11:00:00', updated_at: '2026-06-05 11:00:00' },
    { id: 'case-007', user_id: 'user-001', service_id: 'svc-010', status: 'completed', form_data: JSON.stringify({ query_type: '个人房产', id_number: '330102199001011234' }), created_at: '2026-05-10 09:00:00', updated_at: '2026-05-10 09:05:00' },
    { id: 'case-008', user_id: 'user-001', service_id: 'svc-012', status: 'completed', form_data: JSON.stringify({ card_no: 'BUS202300123', amount: 200 }), created_at: '2026-05-25 13:20:00', updated_at: '2026-05-25 13:21:00' },
    { id: 'case-009', user_id: 'user-002', service_id: 'svc-002', status: 'completed', form_data: JSON.stringify({ name: '李四', appointment_date: '2026-06-01', business_type: '增值税申报' }), created_at: '2026-05-28 15:30:00', updated_at: '2026-06-01 10:00:00' },
    { id: 'case-010', user_id: 'user-002', service_id: 'svc-001', status: 'processing', form_data: JSON.stringify({ name: '李四', id_number: '330102198805052345', insurance_type: '医疗保险' }), created_at: '2026-06-04 10:00:00', updated_at: '2026-06-06 09:30:00' },
    { id: 'case-011', user_id: 'user-002', service_id: 'svc-005', status: 'submitted', form_data: JSON.stringify({ company_name: '某某科技有限公司', legal_person: '李四' }), created_at: '2026-06-06 14:00:00', updated_at: '2026-06-06 14:00:00' },
    { id: 'case-012', user_id: 'user-002', service_id: 'svc-009', status: 'completed', form_data: JSON.stringify({ meter_no: 'GAS20230089', amount: 156.80 }), created_at: '2026-05-22 16:45:00', updated_at: '2026-05-22 16:46:00' },
    { id: 'case-013', user_id: 'user-001', service_id: 'svc-009', status: 'completed', form_data: JSON.stringify({ meter_no: 'GAS20230012', amount: 98.50 }), created_at: '2026-05-18 11:30:00', updated_at: '2026-05-18 11:31:00' },
    { id: 'case-014', user_id: 'user-001', service_id: 'svc-002', status: 'rejected', form_data: JSON.stringify({ name: '张三', appointment_date: '2026-05-30', business_type: '个税申报' }), created_at: '2026-05-27 09:15:00', updated_at: '2026-05-29 10:00:00' },
    { id: 'case-015', user_id: 'user-002', service_id: 'svc-003', status: 'completed', form_data: JSON.stringify({ type: '环境投诉', content: '垃圾堆积未清理', address: 'xx街道56号' }), created_at: '2026-05-12 08:20:00', updated_at: '2026-05-15 16:30:00' },
    { id: 'case-016', user_id: 'user-001', service_id: 'svc-004', status: 'completed', form_data: JSON.stringify({ name: '张三', reason: '租房提取', amount: 12000 }), created_at: '2026-04-20 10:00:00', updated_at: '2026-04-25 14:00:00' },
    { id: 'case-017', user_id: 'user-002', service_id: 'svc-008', status: 'processing', form_data: JSON.stringify({ meter_no: 'DL20230456', amount: 185.30 }), created_at: '2026-06-07 15:00:00', updated_at: '2026-06-07 15:00:00' },
    { id: 'case-018', user_id: 'user-001', service_id: 'svc-006', status: 'submitted', form_data: JSON.stringify({ name: '张三', target_address: 'xx新区xx路12号' }), created_at: '2026-06-08 09:30:00', updated_at: '2026-06-08 09:30:00' },
    { id: 'case-019', user_id: 'user-002', service_id: 'svc-011', status: 'completed', form_data: JSON.stringify({ plate_no: '浙B67890', violation_id: 'V2026050012' }), created_at: '2026-05-08 14:00:00', updated_at: '2026-05-10 10:30:00' },
    { id: 'case-020', user_id: 'user-001', service_id: 'svc-001', status: 'approved', form_data: JSON.stringify({ name: '张三', id_number: '330102199001011234', insurance_type: '失业保险' }), created_at: '2026-06-07 11:30:00', updated_at: '2026-06-08 16:00:00' },
    { id: 'case-021', user_id: 'user-002', service_id: 'svc-004', status: 'approved', form_data: JSON.stringify({ name: '李四', reason: '退休提取', amount: 120000 }), created_at: '2026-06-06 09:00:00', updated_at: '2026-06-08 11:00:00' },
    { id: 'case-022', user_id: 'user-001', service_id: 'svc-012', status: 'processing', form_data: JSON.stringify({ card_no: 'BUS202300123', amount: 500 }), created_at: '2026-06-09 08:00:00', updated_at: '2026-06-09 08:00:00' },
    { id: 'case-023', user_id: 'user-002', service_id: 'svc-007', status: 'completed', form_data: JSON.stringify({ meter_no: 'WH20230045', amount: 62.30 }), created_at: '2026-05-30 10:20:00', updated_at: '2026-05-30 10:21:00' },
    { id: 'case-024', user_id: 'user-001', service_id: 'svc-005', status: 'processing', form_data: JSON.stringify({ company_name: '某某餐饮有限公司', legal_person: '张三' }), created_at: '2026-06-08 14:30:00', updated_at: '2026-06-09 09:00:00' },
    { id: 'case-025', user_id: 'user-002', service_id: 'svc-010', status: 'completed', form_data: JSON.stringify({ query_type: '房产验证', id_number: '330102198805052345' }), created_at: '2026-05-15 11:00:00', updated_at: '2026-05-15 11:03:00' },
    { id: 'case-026', user_id: 'user-001', service_id: 'svc-001', status: 'submitted', form_data: JSON.stringify({ name: '张三', insurance_type: '养老保险' }), created_at: '2026-06-10 08:15:00', updated_at: '2026-06-10 08:15:00' },
    { id: 'case-027', user_id: 'user-002', service_id: 'svc-007', status: 'completed', form_data: JSON.stringify({ meter_no: 'WH20230099', amount: 78.5 }), created_at: '2026-06-10 08:30:00', updated_at: '2026-06-10 08:30:30' },
    { id: 'case-028', user_id: 'user-001', service_id: 'svc-008', status: 'processing', form_data: JSON.stringify({ meter_no: 'DL20230888', amount: 156.8 }), created_at: '2026-06-10 09:00:00', updated_at: '2026-06-10 09:05:00' },
    { id: 'case-029', user_id: 'user-002', service_id: 'svc-004', status: 'submitted', form_data: JSON.stringify({ name: '李四', reason: '购房提取' }), created_at: '2026-06-10 09:20:00', updated_at: '2026-06-10 09:20:00' },
    { id: 'case-030', user_id: 'user-001', service_id: 'svc-011', status: 'completed', form_data: JSON.stringify({ plate_no: '浙A88888', violation_id: 'V20260610001' }), created_at: '2026-06-10 09:45:00', updated_at: '2026-06-10 09:46:00' },
    { id: 'case-031', user_id: 'user-002', service_id: 'svc-002', status: 'submitted', form_data: JSON.stringify({ name: '李四', appointment_date: '2026-06-15' }), created_at: '2026-06-10 10:00:00', updated_at: '2026-06-10 10:00:00' },
    { id: 'case-032', user_id: 'user-001', service_id: 'svc-009', status: 'completed', form_data: JSON.stringify({ meter_no: 'GAS20230333', amount: 125.6 }), created_at: '2026-06-10 10:15:00', updated_at: '2026-06-10 10:15:40' },
    { id: 'case-033', user_id: 'user-002', service_id: 'svc-003', status: 'processing', form_data: JSON.stringify({ type: '服务投诉', content: '窗口排队时间长' }), created_at: '2026-06-10 10:30:00', updated_at: '2026-06-10 10:35:00' },
    { id: 'case-034', user_id: 'user-001', service_id: 'svc-010', status: 'completed', form_data: JSON.stringify({ query_type: '个人房产' }), created_at: '2026-06-10 10:45:00', updated_at: '2026-06-10 10:45:20' },
    { id: 'case-035', user_id: 'user-002', service_id: 'svc-001', status: 'processing', form_data: JSON.stringify({ name: '李四', insurance_type: '医疗保险' }), created_at: '2026-06-10 11:00:00', updated_at: '2026-06-10 11:05:00' },
    { id: 'case-036', user_id: 'user-001', service_id: 'svc-012', status: 'completed', form_data: JSON.stringify({ card_no: 'BUS202300456', amount: 300 }), created_at: '2026-06-10 11:15:00', updated_at: '2026-06-10 11:15:30' },
    { id: 'case-037', user_id: 'user-002', service_id: 'svc-008', status: 'submitted', form_data: JSON.stringify({ meter_no: 'DL20230999', amount: 210.5 }), created_at: '2026-06-10 11:30:00', updated_at: '2026-06-10 11:30:00' },
    { id: 'case-038', user_id: 'user-001', service_id: 'svc-007', status: 'processing', form_data: JSON.stringify({ meter_no: 'WH20230100', amount: 92.3 }), created_at: '2026-06-10 13:00:00', updated_at: '2026-06-10 13:02:00' },
    { id: 'case-039', user_id: 'user-002', service_id: 'svc-005', status: 'submitted', form_data: JSON.stringify({ company_name: '某某科技公司' }), created_at: '2026-06-10 13:15:00', updated_at: '2026-06-10 13:15:00' },
    { id: 'case-040', user_id: 'user-001', service_id: 'svc-002', status: 'completed', form_data: JSON.stringify({ name: '张三', appointment_date: '2026-06-12' }), created_at: '2026-06-10 13:30:00', updated_at: '2026-06-10 13:30:15' },
    { id: 'case-041', user_id: 'user-002', service_id: 'svc-011', status: 'processing', form_data: JSON.stringify({ plate_no: '浙B66666' }), created_at: '2026-06-10 13:45:00', updated_at: '2026-06-10 13:48:00' },
    { id: 'case-042', user_id: 'user-001', service_id: 'svc-006', status: 'submitted', form_data: JSON.stringify({ name: '张三', target_address: 'xx新区' }), created_at: '2026-06-10 14:00:00', updated_at: '2026-06-10 14:00:00' },
  ]
  for (const c of caseData) {
    insertCase.run(c.id, c.user_id, c.service_id, c.status, c.form_data, c.created_at, c.updated_at)
  }
}

export default db
