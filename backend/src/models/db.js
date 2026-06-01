const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const projectRoot = path.resolve(__dirname, "../../..");
dotenv.config({ path: path.join(projectRoot, ".env") });

function resolveDatabasePath() {
  const configured = process.env.DATABASE_URL || "./data/app.sqlite";
  const sqlitePath = configured.replace(/^sqlite:(\/\/)?/, "");
  return path.isAbsolute(sqlitePath)
    ? sqlitePath
    : path.resolve(projectRoot, sqlitePath);
}

const dbPath = resolveDatabasePath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

function tableCount(tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function formatDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS research_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      principal_investigator TEXT NOT NULL,
      disease_area TEXT NOT NULL,
      ethics_no TEXT,
      inclusion_criteria TEXT,
      exclusion_criteria TEXT,
      followup_plan TEXT,
      target_enrollment INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      start_date TEXT NOT NULL,
      target_size INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      age TEXT,
      birth_date TEXT,
      diagnosis TEXT NOT NULL,
      screening_status TEXT DEFAULT 'candidate',
      enrollment_status TEXT DEFAULT 'candidate',
      enrolled_at TEXT NOT NULL,
      project_id INTEGER,
      contact_phone TEXT,
      baseline_summary TEXT DEFAULT '',
      lab_summary TEXT DEFAULT '',
      treatment_summary TEXT DEFAULT '',
      surgery_summary TEXT DEFAULT '',
      outcome_summary TEXT DEFAULT '',
      attachment_summary TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES research_projects(id)
    );

    CREATE TABLE IF NOT EXISTS followup_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      visit_name TEXT NOT NULL,
      planned_date TEXT NOT NULL,
      window_start TEXT NOT NULL,
      window_end TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      completed_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (project_id) REFERENCES research_projects(id)
    );

    CREATE TABLE IF NOT EXISTS quality_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_type TEXT,
      description TEXT,
      patient_id INTEGER,
      field_name TEXT,
      severity TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS export_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      project_id INTEGER,
      record_count INTEGER DEFAULT 0,
      masked INTEGER DEFAULT 1,
      operator TEXT,
      content TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES research_projects(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT,
      module TEXT,
      action TEXT,
      detail TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  if (tableCount("users") === 0) {
    const insertUser = db.prepare("INSERT INTO users (username) VALUES (?)");
    insertUser.run("admin");
    insertUser.run("doctor");
    insertUser.run("datamanager");
  }

  if (tableCount("research_projects") === 0) {
    const insertProject = db.prepare(`
      INSERT INTO research_projects
        (name, code, principal_investigator, disease_area, ethics_no, inclusion_criteria, exclusion_criteria, followup_plan, target_enrollment, status, start_date, target_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertProject.run(
      "心衰长期随访队列",
      "HF-LTFU-2026",
      "张主任",
      "心血管",
      "IRB-2026-0142",
      "1.确诊慢性心力衰竭（NYHA II-IV级）；2.LVEF≤40%；3.年龄18-80岁；4.签署知情同意书",
      "1.急性心肌梗死30天内；2.严重肝肾功能不全；3.妊娠或哺乳期；4.预期寿命<6个月",
      "入组后30天、90天、180天、365天分别进行电话随访或门诊复查，此后每半年随访一次，持续3年",
      180,
      "active",
      formatDate(-120),
      180
    );
    insertProject.run(
      "糖尿病并发症观察研究",
      "DM-COMP-2026",
      "李医生",
      "内分泌",
      "IRB-2026-0089",
      "1.确诊2型糖尿病≥1年；2.HbA1c≥7.0%；3.年龄30-75岁；4.至少存在一种微血管或大血管并发症危险因素",
      "1.1型糖尿病或继发性糖尿病；2.已行胰腺切除手术；3.活动性恶性肿瘤；4.无法配合随访",
      "入组后每3个月门诊复查，评估血糖控制及并发症进展，年度进行综合评估，持续2年",
      120,
      "active",
      formatDate(-75),
      120
    );
  }

  if (tableCount("patients") === 0) {
    const insertPatient = db.prepare(`
      INSERT INTO patients
        (code, name, gender, age, birth_date, diagnosis, screening_status, enrollment_status, enrolled_at, project_id, contact_phone, baseline_summary, lab_summary, treatment_summary, surgery_summary, outcome_summary, attachment_summary, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPatient.run("P-2026-001", "王明", "男", "54", "1972-04-12", "慢性心力衰竭", "eligible", "enrolled", formatDate(-42), 1, "13800010001", "NYHA III级，LVEF 32%，BNP 890pg/ml", "Hb 125g/L，Cr 98μmol/L，K+ 4.2mmol/L", "沙库巴曲缬沙坦100mg bid，比索洛尔5mg qd，螺内酯25mg qd", "", "心功能较入组时改善", "身份证、知情同意书已上传", "active");
    insertPatient.run("P-2026-002", "陈莉", "女", "60", "1966-10-03", "2型糖尿病", "eligible", "enrolled", formatDate(-36), 2, "13800010002", "糖尿病史8年，HbA1c 8.2%，合并视网膜病变", "FPG 9.1mmol/L，HbA1c 8.2%，UACR 85mg/g", "二甲双胍500mg tid，恩格列净10mg qd", "", "血糖控制逐步改善", "眼底照相报告已上传", "active");
    insertPatient.run("P-2026-003", "赵强", "男", "67", "1959-01-28", "慢性心力衰竭", "screening", "screening", formatDate(-18), 1, "13800010003", "NYHA II级，LVEF 38%", "待完善", "暂用呋塞米20mg qd", "", "", "", "paused");
    insertPatient.run("P-2026-004", "刘芳", "女", "45", "1981-07-19", "2型糖尿病", "candidate", "candidate", formatDate(-5), 2, "13800010004", "", "", "", "", "", "", "active");
    insertPatient.run("P-2026-005", "孙伟", "男", "72", "1954-03-08", "慢性心力衰竭", "eligible", "enrolled", formatDate(-50), 1, "13800010005", "NYHA IV级，LVEF 28%，合并房颤", "Hb 108g/L，Cr 135μmol/L，BNP 1520pg/ml", "沙库巴曲缬沙坦50mg bid，达格列净10mg qd，华法林2.5mg qd", "", "近期活动耐量略有改善", "心电图、心脏彩超已上传", "active");
    insertPatient.run("P-2026-006", "周敏", "女", "58", "1968-12-22", "2型糖尿病", "excluded", "excluded", formatDate(-12), null, "13800010006", "合并活动性肝癌，不符合纳入标准", "", "", "", "", "", "active");
    insertPatient.run("P-2026-007", "吴刚", "男", "63", "1963-06-15", "慢性心力衰竭", "eligible", "withdrawn", formatDate(-60), 1, "13800010007", "NYHA III级，LVEF 35%", "Cr 112μmol/L，K+ 5.1mmol/L", "沙库巴曲缬沙坦100mg bid", "", "患者主动要求退出", "知情同意书、退出说明已上传", "active");
    insertPatient.run("P-2026-008", "郑华", "女", "70", "1956-09-30", "2型糖尿病", "eligible", "lost", formatDate(-90), 2, "13800010008", "糖尿病史12年，HbA1c 9.0%，合并肾病III期", "FPG 10.8mmol/L，Cr 156μmol/L，UACR 320mg/g", "胰岛素甘精胰岛素18U qn，阿卡波糖50mg tid", "", "连续3次失访", "病历摘要已上传", "active");
  }

  if (tableCount("followup_tasks") === 0) {
    const insertTask = db.prepare(`
      INSERT INTO followup_tasks
        (patient_id, project_id, visit_name, planned_date, window_start, window_end, status, completed_at, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertTask.run(1, 1, "入组后30天电话随访", formatDate(-2), formatDate(-5), formatDate(2), "pending", null, "需确认近期用药调整");
    insertTask.run(2, 2, "第1次门诊复查", formatDate(4), formatDate(1), formatDate(8), "pending", null, "复查糖化血红蛋白及肾功能");
    insertTask.run(3, 1, "入组后14天安全性随访", formatDate(-8), formatDate(-11), formatDate(-4), "overdue", null, "上次电话未接通，需再次联系");
    insertTask.run(1, 1, "基线资料核查", formatDate(-30), formatDate(-32), formatDate(-28), "completed", formatDate(-29), "资料完整，无遗漏");
    insertTask.run(5, 1, "入组后30天门诊复查", formatDate(-10), formatDate(-13), formatDate(-6), "completed", formatDate(-8), "心功能较前改善，BNP降至620pg/ml");
    insertTask.run(5, 1, "入组后90天综合评估", formatDate(20), formatDate(17), formatDate(24), "pending", null, "需复查心脏彩超及实验室指标");
    insertTask.run(7, 1, "入组后30天电话随访", formatDate(-25), formatDate(-28), formatDate(-22), "cancelled", formatDate(-23), "患者已退出研究，随访取消");
    insertTask.run(8, 2, "第2次门诊复查", formatDate(-30), formatDate(-33), formatDate(-26), "lost", null, "患者连续3次未到诊，标记失访");
    insertTask.run(2, 2, "基线资料核查", formatDate(-28), formatDate(-30), formatDate(-25), "completed", formatDate(-27), "基线资料及眼底检查结果已录入");
    insertTask.run(5, 1, "基线资料核查", formatDate(-42), formatDate(-44), formatDate(-40), "completed", formatDate(-41), "资料齐全");
    insertTask.run(1, 1, "入组后90天门诊复查", formatDate(28), formatDate(25), formatDate(32), "pending", null, "计划复查心脏彩超");
    insertTask.run(2, 2, "第3次门诊复查", formatDate(30), formatDate(27), formatDate(34), "pending", null, "评估并发症进展情况");
  }

  if (tableCount("quality_issues") === 0) {
    const insertIssue = db.prepare(`
      INSERT INTO quality_issues
        (issue_type, description, patient_id, field_name, severity, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertIssue.run("缺失值", "患者P-2026-003基线实验室检查结果未录入", 3, "lab_summary", "high", "open", formatDate(-5));
    insertIssue.run("逻辑冲突", "患者P-2026-001入组日期早于项目启动日期", 1, "enrolled_at", "medium", "reviewed", formatDate(-10));
    insertIssue.run("异常值", "患者P-2026-005肌酐值135μmol/L偏高，需核实", 5, "lab_summary", "high", "open", formatDate(-3));
    insertIssue.run("重复数据", "患者P-2026-002存在两条基线资料核查随访记录", 2, "visit_name", "low", "reviewed", formatDate(-7));
  }

  if (tableCount("export_jobs") === 0) {
    const insertExport = db.prepare(`
      INSERT INTO export_jobs
        (filename, project_id, record_count, masked, operator, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertExport.run("心衰队列基线数据_202601.xlsx", 1, 45, 1, "admin", "心衰长期随访队列基线数据导出，含45条记录，已脱敏", formatDate(-15));
    insertExport.run("糖尿病并发症随访数据_202602.csv", 2, 28, 1, "datamanager", "糖尿病并发症观察研究随访数据导出，含28条记录，已脱敏", formatDate(-8));
  }

  if (tableCount("audit_logs") === 0) {
    const insertLog = db.prepare(`
      INSERT INTO audit_logs
        (actor, module, action, detail, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertLog.run("admin", "research_projects", "create", "创建研究项目：心衰长期随访队列（HF-LTFU-2026）", "192.168.1.100", formatDate(-120));
    insertLog.run("doctor", "patients", "update", "更新患者P-2026-001基线资料摘要", "192.168.1.105", formatDate(-30));
    insertLog.run("datamanager", "export_jobs", "create", "导出心衰队列基线数据，共45条记录", "192.168.1.110", formatDate(-15));
  }
}

initializeSchema();

module.exports = db;
