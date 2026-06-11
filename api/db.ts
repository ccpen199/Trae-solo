import Database from 'better-sqlite3'
import { mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, 'data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const dbPath = join(dataDir, 'union.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS organization (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    level TEXT NOT NULL CHECK(level IN ('province', 'city', 'base')),
    parent_id TEXT,
    member_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id) REFERENCES organization(id)
  );

  CREATE TABLE IF NOT EXISTS member (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    id_card TEXT NOT NULL UNIQUE,
    employee_no TEXT NOT NULL,
    org_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'rejected')),
    points INTEGER DEFAULT 0,
    join_date TEXT,
    phone TEXT,
    password TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES organization(id)
  );

  CREATE TABLE IF NOT EXISTS member_tag (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    FOREIGN KEY (member_id) REFERENCES member(id)
  );

  CREATE TABLE IF NOT EXISTS voucher_template (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    total_quantity INTEGER NOT NULL,
    remaining_quantity INTEGER NOT NULL,
    expiry_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'expired')),
    org_id TEXT NOT NULL,
    budget_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES organization(id),
    FOREIGN KEY (budget_id) REFERENCES budget_plan(id)
  );

  CREATE TABLE IF NOT EXISTS voucher (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'unused' CHECK(status IN ('unused', 'used', 'expired')),
    issued_at TEXT DEFAULT (datetime('now')),
    used_at TEXT,
    FOREIGN KEY (template_id) REFERENCES voucher_template(id),
    FOREIGN KEY (member_id) REFERENCES member(id)
  );

  CREATE TABLE IF NOT EXISTS budget_plan (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    title TEXT NOT NULL,
    total_amount REAL NOT NULL,
    used_amount REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'executing', 'completed')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES organization(id)
  );

  CREATE TABLE IF NOT EXISTS approval_step (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    step INTEGER NOT NULL,
    approver TEXT NOT NULL,
    approver_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    comment TEXT,
    timestamp TEXT,
    FOREIGN KEY (plan_id) REFERENCES budget_plan(id)
  );

  CREATE TABLE IF NOT EXISTS points_product (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    points INTEGER NOT NULL,
    stock INTEGER NOT NULL,
    category TEXT NOT NULL,
    image TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS points_order (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'shipped', 'completed', 'cancelled')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (member_id) REFERENCES member(id),
    FOREIGN KEY (product_id) REFERENCES points_product(id)
  );

  CREATE TABLE IF NOT EXISTS booking (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('vip_lounge', 'train_ticket', 'health_checkup', 'legal_consult')),
    resource_id TEXT NOT NULL,
    resource_name TEXT NOT NULL,
    booking_date TEXT NOT NULL,
    booking_time TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (member_id) REFERENCES member(id)
  );

  CREATE TABLE IF NOT EXISTS supplier (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'applying' CHECK(status IN ('applying', 'approved', 'suspended', 'blacklisted')),
    score REAL DEFAULT 0,
    contact TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS supplier_assessment (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL,
    score REAL NOT NULL,
    comment TEXT,
    assessor TEXT NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (supplier_id) REFERENCES supplier(id)
  );

  CREATE TABLE IF NOT EXISTS recommendation_rule (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    conditions_json TEXT NOT NULL,
    benefit_ids_json TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS member_audit (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    action TEXT NOT NULL,
    source TEXT NOT NULL,
    operator_id TEXT,
    operator_name TEXT,
    reason TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (member_id) REFERENCES member(id)
  );
`)

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_member_org ON member(org_id);
  CREATE INDEX IF NOT EXISTS idx_member_status ON member(status);
  CREATE INDEX IF NOT EXISTS idx_voucher_member ON voucher(member_id);
  CREATE INDEX IF NOT EXISTS idx_voucher_template ON voucher(template_id);
  CREATE INDEX IF NOT EXISTS idx_booking_member ON booking(member_id);
  CREATE INDEX IF NOT EXISTS idx_booking_type ON booking(type);
  CREATE INDEX IF NOT EXISTS idx_budget_org ON budget_plan(org_id);
  CREATE INDEX IF NOT EXISTS idx_supplier_status ON supplier(status);
  CREATE INDEX IF NOT EXISTS idx_member_tag_member ON member_tag(member_id);
  CREATE INDEX IF NOT EXISTS idx_audit_member ON member_audit(member_id);
`)

const orgCount = db.prepare('SELECT COUNT(*) as count FROM organization').get() as { count: number }
if (orgCount.count === 0) {
  const insertOrg = db.prepare(`
    INSERT INTO organization (id, name, level, parent_id, member_count) VALUES (?, ?, ?, ?, ?)
  `)

  const insertMember = db.prepare(`
    INSERT INTO member (id, name, id_card, employee_no, org_id, status, points, join_date, phone, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertTag = db.prepare(`
    INSERT INTO member_tag (id, member_id, tag) VALUES (?, ?, ?)
  `)

  const insertVoucherTemplate = db.prepare(`
    INSERT INTO voucher_template (id, name, amount, total_quantity, remaining_quantity, expiry_date, status, org_id, budget_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertVoucher = db.prepare(`
    INSERT INTO voucher (id, template_id, member_id, code, status, issued_at, used_at) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertPointsProduct = db.prepare(`
    INSERT INTO points_product (id, name, points, stock, category, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertBudgetPlan = db.prepare(`
    INSERT INTO budget_plan (id, org_id, title, total_amount, used_amount, status) VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertApprovalStep = db.prepare(`
    INSERT INTO approval_step (id, plan_id, step, approver, approver_name, status, comment, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertBooking = db.prepare(`
    INSERT INTO booking (id, member_id, type, resource_id, resource_name, booking_date, booking_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertSupplier = db.prepare(`
    INSERT INTO supplier (id, name, category, status, score, contact, description) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertSupplierAssessment = db.prepare(`
    INSERT INTO supplier_assessment (id, supplier_id, score, comment, assessor, date) VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertRecommendationRule = db.prepare(`
    INSERT INTO recommendation_rule (id, name, conditions_json, benefit_ids_json, priority, enabled) VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertAudit = db.prepare(`
    INSERT INTO member_audit (id, member_id, action, source, operator_id, operator_name, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const seedAll = db.transaction(() => {
    insertOrg.run('org-1', 'XX省总工会', 'province', null, 0)
    insertOrg.run('org-2', 'XX市总工会', 'city', 'org-1', 0)
    insertOrg.run('org-3', 'YY市总工会', 'city', 'org-1', 0)
    insertOrg.run('org-4', 'XX市教育工会', 'base', 'org-2', 0)
    insertOrg.run('org-5', 'XX市卫生工会', 'base', 'org-2', 0)
    insertOrg.run('org-6', 'YY市交通工会', 'base', 'org-3', 0)
    insertOrg.run('org-7', 'YY市建设工会', 'base', 'org-3', 0)

    const members = [
      { id: 'mem-1', name: '张三', idCard: '320101199001011234', empNo: 'EDU001', orgId: 'org-4', status: 'active', points: 2500, joinDate: '2023-01-15', phone: '13800138001', pwd: '123456' },
      { id: 'mem-2', name: '李四', idCard: '320101199205052345', empNo: 'EDU002', orgId: 'org-4', status: 'active', points: 1800, joinDate: '2023-02-20', phone: '13800138002', pwd: '123456' },
      { id: 'mem-3', name: '王五', idCard: '320101198810103456', empNo: 'EDU003', orgId: 'org-4', status: 'active', points: 3200, joinDate: '2023-03-10', phone: '13800138003', pwd: '123456' },
      { id: 'mem-4', name: '赵六', idCard: '320101199503154567', empNo: 'HEA001', orgId: 'org-5', status: 'active', points: 1500, joinDate: '2023-04-05', phone: '13800138004', pwd: '123456' },
      { id: 'mem-5', name: '钱七', idCard: '320101198706205678', empNo: 'HEA002', orgId: 'org-5', status: 'active', points: 4100, joinDate: '2023-05-12', phone: '13800138005', pwd: '123456' },
      { id: 'mem-6', name: '孙八', idCard: '320101199208256789', empNo: 'HEA003', orgId: 'org-5', status: 'pending', points: 0, joinDate: '2024-01-08', phone: '13800138006', pwd: '123456' },
      { id: 'mem-7', name: '周九', idCard: '320101199311307890', empNo: 'TRA001', orgId: 'org-6', status: 'active', points: 2800, joinDate: '2023-06-18', phone: '13800138007', pwd: '123456' },
      { id: 'mem-8', name: '吴十', idCard: '320101198512088901', empNo: 'TRA002', orgId: 'org-6', status: 'active', points: 3600, joinDate: '2023-07-22', phone: '13800138008', pwd: '123456' },
      { id: 'mem-9', name: '郑十一', idCard: '320101199609129012', empNo: 'TRA003', orgId: 'org-6', status: 'active', points: 1200, joinDate: '2023-08-30', phone: '13800138009', pwd: '123456' },
      { id: 'mem-10', name: '冯十二', idCard: '320101199004170123', empNo: 'CON001', orgId: 'org-7', status: 'active', points: 5000, joinDate: '2023-01-25', phone: '13800138010', pwd: '123456' },
      { id: 'mem-11', name: '陈十三', idCard: '320101199807221234', empNo: 'CON002', orgId: 'org-7', status: 'active', points: 900, joinDate: '2023-09-14', phone: '13800138011', pwd: '123456' },
      { id: 'mem-12', name: '褚十四', idCard: '320101199104272345', empNo: 'CON003', orgId: 'org-7', status: 'active', points: 2200, joinDate: '2023-10-03', phone: '13800138012', pwd: '123456' },
      { id: 'mem-13', name: '卫十五', idCard: '320101199312013456', empNo: 'EDU004', orgId: 'org-4', status: 'pending', points: 0, joinDate: '2024-02-14', phone: '13800138013', pwd: '123456' },
      { id: 'mem-14', name: '蒋十六', idCard: '320101198808054567', empNo: 'EDU005', orgId: 'org-4', status: 'rejected', points: 0, joinDate: '2024-02-28', phone: '13800138014', pwd: '123456' },
      { id: 'mem-15', name: '沈十七', idCard: '320101199506105678', empNo: 'HEA004', orgId: 'org-5', status: 'active', points: 3100, joinDate: '2023-11-11', phone: '13800138015', pwd: '123456' },
      { id: 'mem-16', name: '韩十八', idCard: '320101199109156789', empNo: 'HEA005', orgId: 'org-5', status: 'pending', points: 0, joinDate: '2024-03-05', phone: '13800138016', pwd: '123456' },
      { id: 'mem-17', name: '杨十九', idCard: '320101199407206890', empNo: 'TRA004', orgId: 'org-6', status: 'rejected', points: 0, joinDate: '2024-03-15', phone: '13800138017', pwd: '123456' },
      { id: 'mem-18', name: '朱二十', idCard: '320101198703257901', empNo: 'TRA005', orgId: 'org-6', status: 'active', points: 1900, joinDate: '2023-12-20', phone: '13800138018', pwd: '123456' },
      { id: 'mem-19', name: '秦二一', idCard: '320101199605308012', empNo: 'CON004', orgId: 'org-7', status: 'active', points: 2700, joinDate: '2024-01-20', phone: '13800138019', pwd: '123456' },
      { id: 'mem-20', name: '尤二二', idCard: '320101199208049123', empNo: 'CON005', orgId: 'org-7', status: 'active', points: 1400, joinDate: '2024-02-08', phone: '13800138020', pwd: '123456' },
      { id: 'mem-21', name: '许二三', idCard: '320101199911098234', empNo: 'EDU006', orgId: 'org-4', status: 'active', points: 600, joinDate: '2024-04-01', phone: '13800138021', pwd: '123456' },
      { id: 'mem-22', name: '何二四', idCard: '320101199003149345', empNo: 'HEA006', orgId: 'org-5', status: 'active', points: 3800, joinDate: '2023-06-06', phone: '13800138022', pwd: '123456' },
      { id: 'mem-23', name: '吕二五', idCard: '320101198511197456', empNo: 'TRA006', orgId: 'org-6', status: 'active', points: 4500, joinDate: '2023-03-01', phone: '13800138023', pwd: '123456' },
    ]

    for (const m of members) {
      insertMember.run(m.id, m.name, m.idCard, m.empNo, m.orgId, m.status, m.points, m.joinDate, m.phone, m.pwd)
    }

    const tags = [
      { id: 'tag-1', memberId: 'mem-1', tag: '青年教师' },
      { id: 'tag-2', memberId: 'mem-1', tag: '技术岗' },
      { id: 'tag-3', memberId: 'mem-2', tag: '青年' },
      { id: 'tag-4', memberId: 'mem-2', tag: '管理岗' },
      { id: 'tag-5', memberId: 'mem-3', tag: '资深职工' },
      { id: 'tag-6', memberId: 'mem-3', tag: '中年' },
      { id: 'tag-7', memberId: 'mem-4', tag: '青年' },
      { id: 'tag-8', memberId: 'mem-4', tag: '技术岗' },
      { id: 'tag-9', memberId: 'mem-5', tag: '资深职工' },
      { id: 'tag-10', memberId: 'mem-5', tag: '管理岗' },
      { id: 'tag-11', memberId: 'mem-5', tag: '中年' },
      { id: 'tag-12', memberId: 'mem-7', tag: '青年' },
      { id: 'tag-13', memberId: 'mem-7', tag: '技术岗' },
      { id: 'tag-14', memberId: 'mem-8', tag: '资深职工' },
      { id: 'tag-15', memberId: 'mem-8', tag: '中年' },
      { id: 'tag-16', memberId: 'mem-10', tag: '资深职工' },
      { id: 'tag-17', memberId: 'mem-10', tag: '管理岗' },
      { id: 'tag-18', memberId: 'mem-11', tag: '青年教师' },
      { id: 'tag-19', memberId: 'mem-12', tag: '中年' },
      { id: 'tag-20', memberId: 'mem-12', tag: '技术岗' },
      { id: 'tag-21', memberId: 'mem-15', tag: '管理岗' },
      { id: 'tag-22', memberId: 'mem-15', tag: '中年' },
      { id: 'tag-23', memberId: 'mem-18', tag: '资深职工' },
      { id: 'tag-24', memberId: 'mem-19', tag: '青年' },
      { id: 'tag-25', memberId: 'mem-19', tag: '技术岗' },
      { id: 'tag-26', memberId: 'mem-21', tag: '青年教师' },
      { id: 'tag-27', memberId: 'mem-22', tag: '资深职工' },
      { id: 'tag-28', memberId: 'mem-22', tag: '管理岗' },
      { id: 'tag-29', memberId: 'mem-23', tag: '资深职工' },
      { id: 'tag-30', memberId: 'mem-23', tag: '中年' },
    ]
    for (const t of tags) {
      insertTag.run(t.id, t.memberId, t.tag)
    }

    insertVoucherTemplate.run('vt-1', '春节慰问金', 500, 100, 72, '2025-12-31', 'active', 'org-1', 'bp-1')
    insertVoucherTemplate.run('vt-2', '五一劳动节福利', 300, 50, 35, '2025-06-30', 'active', 'org-2', 'bp-3')
    insertVoucherTemplate.run('vt-3', '困难职工帮扶金', 1000, 20, 15, '2025-09-30', 'active', 'org-1', 'bp-3')

    const vouchers = [
      { id: 'v-1', templateId: 'vt-1', memberId: 'mem-1', code: 'VC2025SP0001', status: 'unused', issuedAt: '2025-01-20 10:00:00', usedAt: null },
      { id: 'v-2', templateId: 'vt-1', memberId: 'mem-2', code: 'VC2025SP0002', status: 'used', issuedAt: '2025-01-20 10:00:00', usedAt: '2025-02-05 14:30:00' },
      { id: 'v-3', templateId: 'vt-1', memberId: 'mem-3', code: 'VC2025SP0003', status: 'unused', issuedAt: '2025-01-20 10:00:00', usedAt: null },
      { id: 'v-4', templateId: 'vt-2', memberId: 'mem-4', code: 'VC2025LY0001', status: 'unused', issuedAt: '2025-04-25 09:00:00', usedAt: null },
      { id: 'v-5', templateId: 'vt-2', memberId: 'mem-5', code: 'VC2025LY0002', status: 'used', issuedAt: '2025-04-25 09:00:00', usedAt: '2025-05-01 11:20:00' },
      { id: 'v-6', templateId: 'vt-3', memberId: 'mem-10', code: 'VC2025KF0001', status: 'unused', issuedAt: '2025-03-01 08:00:00', usedAt: null },
      { id: 'v-7', templateId: 'vt-1', memberId: 'mem-7', code: 'VC2025SP0004', status: 'unused', issuedAt: '2025-01-20 10:00:00', usedAt: null },
      { id: 'v-8', templateId: 'vt-2', memberId: 'mem-8', code: 'VC2025LY0003', status: 'unused', issuedAt: '2025-04-25 09:00:00', usedAt: null },
    ]
    for (const v of vouchers) {
      insertVoucher.run(v.id, v.templateId, v.memberId, v.code, v.status, v.issuedAt, v.usedAt)
    }

    const products = [
      { id: 'pp-1', name: '品牌保温杯', points: 200, stock: 50, category: '生活用品', image: '/images/cup.jpg', desc: '316不锈钢保温杯500ml' },
      { id: 'pp-2', name: '运动背包', points: 500, stock: 30, category: '运动户外', image: '/images/bag.jpg', desc: '防水轻量运动背包30L' },
      { id: 'pp-3', name: '图书卡100元', points: 800, stock: 100, category: '文化教育', image: '/images/book.jpg', desc: '新华书店100元购书卡' },
      { id: 'pp-4', name: '体检套餐抵扣券', points: 1500, stock: 20, category: '健康医疗', image: '/images/health.jpg', desc: '基础体检套餐抵扣200元' },
      { id: 'pp-5', name: '电影票2张', points: 300, stock: 80, category: '文化教育', image: '/images/movie.jpg', desc: '全国通用电影兑换券2张' },
      { id: 'pp-6', name: '超市购物卡200元', points: 1800, stock: 15, category: '生活用品', image: '/images/shop.jpg', desc: '大型超市200元购物卡' },
      { id: 'pp-7', name: '瑜伽垫', points: 350, stock: 40, category: '运动户外', image: '/images/yoga.jpg', desc: '加厚防滑瑜伽垫6mm' },
      { id: 'pp-8', name: '家庭药箱', points: 600, stock: 25, category: '健康医疗', image: '/images/med.jpg', desc: '家庭常备药品收纳箱' },
      { id: 'pp-9', name: '食用油一桶', points: 450, stock: 60, category: '生活用品', image: '/images/oil.jpg', desc: '5L品牌非转基因食用油' },
    ]
    for (const p of products) {
      insertPointsProduct.run(p.id, p.name, p.points, p.stock, p.category, p.image, p.desc)
    }

    insertBudgetPlan.run('bp-1', 'org-4', '2025年春节慰问预算', 50000, 15000, 'executing')
    insertBudgetPlan.run('bp-2', 'org-5', '2025年度职工培训预算', 80000, 0, 'pending')
    insertBudgetPlan.run('bp-3', 'org-2', '2025年度困难帮扶预算', 120000, 10000, 'approved')

    insertApprovalStep.run('as-1', 'bp-1', 1, 'admin-org-5', 'XX市卫生工会管理员', 'approved', '同意', '2025-01-10 09:30:00')
    insertApprovalStep.run('as-2', 'bp-1', 2, 'admin-org-2', 'XX市总工会管理员', 'approved', '同意发放', '2025-01-11 14:20:00')
    insertApprovalStep.run('as-3', 'bp-2', 1, 'admin-org-5', 'XX市卫生工会管理员', 'pending', null, null)
    insertApprovalStep.run('as-4', 'bp-2', 2, 'admin-org-2', 'XX市总工会管理员', 'pending', null, null)
    insertApprovalStep.run('as-5', 'bp-3', 1, 'admin-org-2', 'XX市总工会管理员', 'approved', '同意', '2025-01-05 10:00:00')
    insertApprovalStep.run('as-6', 'bp-3', 2, 'admin-org-1', 'XX省总工会管理员', 'approved', '审批通过', '2025-01-06 16:45:00')

    const bookings = [
      { id: 'bk-1', memberId: 'mem-1', type: 'vip_lounge', resourceId: 'lounge-1', resourceName: 'T2航站楼贵宾厅A区', date: '2025-06-15', time: '08:00', status: 'confirmed' },
      { id: 'bk-2', memberId: 'mem-7', type: 'train_ticket', resourceId: 'train-G101', resourceName: 'G101 南京→上海', date: '2025-06-20', time: null, status: 'pending' },
      { id: 'bk-3', memberId: 'mem-4', type: 'health_checkup', resourceId: 'hpkg-1', resourceName: '基础健康体检套餐', date: '2025-07-01', time: '09:00', status: 'confirmed' },
      { id: 'bk-4', memberId: 'mem-10', type: 'legal_consult', resourceId: 'lawyer-1', resourceName: '李律师-劳动纠纷', date: '2025-06-25', time: '14:00', status: 'completed' },
      { id: 'bk-5', memberId: 'mem-5', type: 'vip_lounge', resourceId: 'lounge-2', resourceName: 'T1航站楼贵宾厅B区', date: '2025-07-10', time: '10:00', status: 'pending' },
      { id: 'bk-6', memberId: 'mem-12', type: 'train_ticket', resourceId: 'train-D302', resourceName: 'D302 苏州→杭州', date: '2025-07-05', time: null, status: 'confirmed' },
      { id: 'bk-7', memberId: 'mem-19', type: 'health_checkup', resourceId: 'hpkg-2', resourceName: '女性关爱体检套餐', date: '2025-07-15', time: '08:30', status: 'pending' },
    ]
    for (const b of bookings) {
      insertBooking.run(b.id, b.memberId, b.type, b.resourceId, b.resourceName, b.date, b.time, b.status)
    }

    const suppliers = [
      { id: 'sup-1', name: 'XX健康体检中心', category: '健康医疗', status: 'approved', score: 4.5, contact: '025-88881111', desc: '三甲合作体检机构' },
      { id: 'sup-2', name: 'XX旅行社有限公司', category: '出行服务', status: 'approved', score: 4.2, contact: '025-88882222', desc: '工会指定差旅服务商' },
      { id: 'sup-3', name: '正义律师事务所', category: '法律咨询', status: 'approved', score: 4.8, contact: '025-88883333', desc: '劳动法专业律所' },
      { id: 'sup-4', name: 'XX商贸有限公司', category: '生活用品', status: 'applying', score: 0, contact: '025-88884444', desc: '节日慰问品供应商' },
      { id: 'sup-5', name: 'YY健康管理公司', category: '健康医疗', status: 'suspended', score: 3.1, contact: '025-88885555', desc: '服务质量不稳定已暂停' },
      { id: 'sup-6', name: 'XX文化用品公司', category: '文化教育', status: 'approved', score: 4.0, contact: '025-88886666', desc: '图书文具供应商' },
    ]
    for (const s of suppliers) {
      insertSupplier.run(s.id, s.name, s.category, s.status, s.score, s.contact, s.desc)
    }

    const assessments = [
      { id: 'sa-1', supplierId: 'sup-1', score: 4.5, comment: '服务质量稳定，报告准确及时', assessor: 'admin-org-1', date: '2025-03-15' },
      { id: 'sa-2', supplierId: 'sup-2', score: 4.0, comment: '行程安排合理，偶有延误', assessor: 'admin-org-2', date: '2025-03-20' },
      { id: 'sa-3', supplierId: 'sup-2', score: 4.4, comment: '近期服务水平提升', assessor: 'admin-org-1', date: '2025-05-10' },
      { id: 'sa-4', supplierId: 'sup-3', score: 4.8, comment: '专业水平高，服务态度好', assessor: 'admin-org-1', date: '2025-04-01' },
      { id: 'sa-5', supplierId: 'sup-5', score: 2.8, comment: '多次出现预约无法确认问题', assessor: 'admin-org-3', date: '2025-02-28' },
      { id: 'sa-6', supplierId: 'sup-6', score: 4.0, comment: '产品齐全，配送及时', assessor: 'admin-org-2', date: '2025-04-15' },
      { id: 'sa-7', supplierId: 'sup-1', score: 4.6, comment: '新增CT项目好评', assessor: 'admin-org-2', date: '2025-06-01' },
    ]
    for (const a of assessments) {
      insertSupplierAssessment.run(a.id, a.supplierId, a.score, a.comment, a.assessor, a.date)
    }

    insertRecommendationRule.run('rr-1', '青年教师专项推荐', JSON.stringify({ tags: ['青年教师'], ageRange: [22, 35] }), JSON.stringify(['vt-1', 'pp-3', 'pp-5']), 10, 1)
    insertRecommendationRule.run('rr-2', '资深职工健康关怀', JSON.stringify({ tags: ['资深职工', '中年'], ageRange: [45, 65] }), JSON.stringify(['vt-3', 'pp-4', 'pp-8']), 8, 1)
    insertRecommendationRule.run('rr-3', '管理岗出行特权', JSON.stringify({ tags: ['管理岗'], jobTitle: '管理岗' }), JSON.stringify(['vt-2', 'pp-2', 'pp-1']), 5, 1)

    const activeMembers = members.filter(m => m.status === 'active')
    const orgActiveCounts: Record<string, number> = {}
    for (const m of activeMembers) {
      orgActiveCounts[m.orgId] = (orgActiveCounts[m.orgId] || 0) + 1
    }
    const updateOrgCount = db.prepare('UPDATE organization SET member_count = ? WHERE id = ?')
    for (const [orgId, count] of Object.entries(orgActiveCounts)) {
      updateOrgCount.run(count, orgId)
    }

    insertAudit.run('audit-1', 'mem-1', 'approve', 'national_db', 'admin-org-4', 'XX市教育工会管理员', null, '2023-01-16 09:30:00')
    insertAudit.run('audit-2', 'mem-6', 'verify', 'national_db', null, null, null, '2024-01-08 14:20:00')
    insertAudit.run('audit-3', 'mem-14', 'reject', 'manual', 'admin-org-4', 'XX市教育工会管理员', '工号与单位档案不符，无法匹配', '2024-03-01 10:15:00')
    insertAudit.run('audit-4', 'mem-17', 'reject', 'manual', 'admin-org-6', 'YY市交通工会管理员', '身份证校验位异常', '2024-03-20 16:40:00')
    insertAudit.run('audit-5', 'mem-16', 'verify', 'national_db', null, null, null, '2024-03-05 11:00:00')
    insertAudit.run('audit-6', 'mem-1', 'sync_add', 'auto_sync', null, null, null, '2023-01-10 02:00:00')
    insertAudit.run('audit-7', 'mem-2', 'sync_add', 'auto_sync', null, null, null, '2023-02-15 02:00:00')
    insertAudit.run('audit-8', 'mem-3', 'sync_add', 'auto_sync', null, null, null, '2023-03-05 02:00:00')
    insertAudit.run('audit-9', 'mem-4', 'sync_add', 'auto_sync', null, null, null, '2023-04-01 02:00:00')
    insertAudit.run('audit-10', 'mem-5', 'sync_add', 'auto_sync', null, null, null, '2023-05-08 02:00:00')
    insertAudit.run('audit-11', 'mem-7', 'sync_add', 'auto_sync', null, null, null, '2023-06-15 02:00:00')
    insertAudit.run('audit-12', 'mem-8', 'sync_add', 'auto_sync', null, null, null, '2023-07-18 02:00:00')
    insertAudit.run('audit-13', 'mem-9', 'sync_add', 'auto_sync', null, null, null, '2023-08-28 02:00:00')
    insertAudit.run('audit-14', 'mem-10', 'sync_add', 'auto_sync', null, null, null, '2023-01-20 02:00:00')
    insertAudit.run('audit-15', 'mem-11', 'sync_add', 'auto_sync', null, null, null, '2023-09-10 02:00:00')
    insertAudit.run('audit-16', 'mem-12', 'sync_add', 'auto_sync', null, null, null, '2023-09-28 02:00:00')
    insertAudit.run('audit-17', 'mem-15', 'sync_add', 'auto_sync', null, null, null, '2023-11-05 02:00:00')
    insertAudit.run('audit-18', 'mem-18', 'sync_add', 'auto_sync', null, null, null, '2023-12-15 02:00:00')
    insertAudit.run('audit-19', 'mem-22', 'sync_add', 'auto_sync', null, null, null, '2023-06-01 02:00:00')
    insertAudit.run('audit-20', 'mem-23', 'sync_add', 'auto_sync', null, null, null, '2023-02-25 02:00:00')
    insertAudit.run('audit-21', 'mem-2', 'sync_conflict', 'auto_sync', null, null, '工号不一致(本地EDU002 vs 全国库EDU002B)', '2025-05-15 03:10:00')
    insertAudit.run('audit-22', 'mem-5', 'sync_conflict', 'auto_sync', null, null, '所属工会不匹配(教育工会 vs 卫生工会)', '2025-06-01 03:15:00')
  })

  seedAll()
}

const auditExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='member_audit'").get();
if (!auditExists) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS member_audit (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      action TEXT NOT NULL,
      source TEXT NOT NULL,
      operator_id TEXT,
      operator_name TEXT,
      reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES member(id)
    );
    CREATE INDEX IF NOT EXISTS idx_audit_member ON member_audit(member_id);
  `);
}

const auditInsert = db.prepare("INSERT OR IGNORE INTO member_audit (id, member_id, action, source, operator_id, operator_name, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
const auditCountFor = (mid: string) => (db.prepare("SELECT COUNT(*) as c FROM member_audit WHERE member_id = ?").get(mid) as any).c;

const tx = db.transaction(() => {
  if (auditCountFor('mem-1') === 0) {
    auditInsert.run('aud-m1-syncadd','mem-1','sync_add','auto_sync',null,null,null,'2023-01-10 09:12:00');
    auditInsert.run('aud-m1-verify','mem-1','verify','national_db',null,null,null,'2023-01-15 10:30:00');
    auditInsert.run('aud-m1-approve','mem-1','approve','manual','admin-base-edu','基层工会管理员',null,'2023-01-16 14:00:00');
    auditInsert.run('aud-m1-syncupd','mem-1','sync_update','auto_sync',null,null,null,'2024-01-15 23:00:00');
  }
  if (auditCountFor('mem-14') === 0) {
    auditInsert.run('aud-m14-v','mem-14','verify','national_db',null,null,null,'2024-06-18 09:00:00');
    auditInsert.run('aud-m14-r','mem-14','reject','manual','admin-base-edu','基层工会管理员','工号与单位档案不符，无法匹配','2024-06-20 11:30:00');
  }
  if (auditCountFor('mem-17') === 0) {
    auditInsert.run('aud-m17-v','mem-17','verify','national_db',null,null,null,'2024-08-01 14:20:00');
    auditInsert.run('aud-m17-r','mem-17','reject','manual','admin-base-transport','交通工会管理员','身份证校验位异常','2024-08-02 16:00:00');
  }
  if (auditCountFor('mem-16') === 0) {
    auditInsert.run('aud-m16-v','mem-16','verify','national_db',null,null,null,'2026-06-02 09:00:00');
    auditInsert.run('aud-m16-sc','mem-16','sync_conflict','auto_sync',null,null,'所属工会不匹配(教育工会vs卫生工会)','2026-06-03 23:05:00');
  }
  for (let i = 2; i <= 13; i++) {
    const mid = 'mem-' + i;
    if (auditCountFor(mid) === 0) {
      auditInsert.run('aud-' + mid + '-sa', mid, 'sync_add', 'auto_sync', null, null, null, '2024-03-15 10:00:00');
    }
  }
  const m6sc = (db.prepare("SELECT COUNT(*) as c FROM member_audit WHERE member_id = 'mem-6' AND action = 'sync_conflict'").get() as any).c;
  if (m6sc === 0) {
    auditInsert.run('aud-m6-sc','mem-6','sync_conflict','auto_sync',null,null,'工号不一致(本地EDU002 vs全国库EDU002B)','2026-06-04 23:10:00');
  }
});
tx();

const vtCols = db.prepare("PRAGMA table_info(voucher_template)").all() as any[];
const hasBudgetCol = vtCols.some((c: any) => c.name === 'budget_id');
if (!hasBudgetCol) {
  db.prepare("ALTER TABLE voucher_template ADD COLUMN budget_id TEXT").run();
  db.prepare("UPDATE voucher_template SET budget_id = ? WHERE id = ?").run('bp-1', 'vt-1');
  db.prepare("UPDATE voucher_template SET budget_id = ? WHERE id = ?").run('bp-3', 'vt-2');
  db.prepare("UPDATE voucher_template SET budget_id = ? WHERE id = ?").run('bp-3', 'vt-3');
}

export default db
