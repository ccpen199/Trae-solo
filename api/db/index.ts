import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite'
const absoluteDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(__dirname, '..', '..', dbPath)

const dataDir = path.dirname(absoluteDbPath)
fs.mkdirSync(dataDir, { recursive: true })

const db = new Database(absoluteDbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS drugs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      generic_name TEXT,
      batch_number TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      holder TEXT,
      indications TEXT,
      risks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_drugs_name ON drugs(name);
    CREATE INDEX IF NOT EXISTS idx_drugs_batch ON drugs(batch_number);

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_no TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      patient_name TEXT NOT NULL,
      patient_gender TEXT,
      patient_age INTEGER,
      patient_id TEXT,
      drug_id INTEGER,
      drug_name TEXT,
      dosage TEXT,
      route TEXT,
      start_date TEXT,
      reaction TEXT,
      reaction_start TEXT,
      severity TEXT,
      treatment TEXT,
      outcome TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (drug_id) REFERENCES drugs(id)
    );

    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_reports_drug ON reports(drug_id);
    CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      temporal_relation INTEGER NOT NULL,
      withdrawal_improvement INTEGER NOT NULL,
      rechallenge_reaction INTEGER NOT NULL,
      concomitant_medication INTEGER NOT NULL,
      severity_level INTEGER NOT NULL,
      final_level TEXT NOT NULL,
      assessed_by TEXT NOT NULL,
      assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      remark TEXT,
      FOREIGN KEY (report_id) REFERENCES reports(id)
    );

    CREATE INDEX IF NOT EXISTS idx_assessments_report ON assessments(report_id);

    CREATE TABLE IF NOT EXISTS process_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      operator TEXT NOT NULL,
      operate_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      remark TEXT,
      FOREIGN KEY (report_id) REFERENCES reports(id)
    );

    CREATE INDEX IF NOT EXISTS idx_logs_report ON process_logs(report_id);
  `)

  const drugCount = db.prepare('SELECT COUNT(*) as count FROM drugs').get() as { count: number }
  if (drugCount.count === 0) {
    const insertDrug = db.prepare(`
      INSERT INTO drugs (name, generic_name, batch_number, manufacturer, holder, indications, risks)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const drugs = [
      ['阿莫西林胶囊', '阿莫西林', '20240101', '华北制药股份有限公司', '华北制药', '敏感菌所致感染', '过敏反应、胃肠道反应'],
      ['布洛芬缓释胶囊', '布洛芬', '20240201', '中美天津史克制药有限公司', '葛兰素史克', '解热镇痛', '胃肠道刺激、肝肾功能影响'],
      ['头孢呋辛酯片', '头孢呋辛酯', '20240301', '广州白云山医药集团', '白云山制药', '敏感菌感染', '过敏、血象异常'],
      ['奥美拉唑肠溶胶囊', '奥美拉唑', '20240401', '阿斯利康制药有限公司', '阿斯利康', '胃溃疡、反流性食管炎', '头痛、腹泻、肝酶升高']
    ]

    const transaction = db.transaction((drugList) => {
      for (const drug of drugList) {
        insertDrug.run(drug)
      }
    })

    transaction(drugs)
  }

  const reportCount = db.prepare('SELECT COUNT(*) as count FROM reports').get() as { count: number }
  if (reportCount.count === 0) {
    const insertReport = db.prepare(`
      INSERT INTO reports (
        report_no, status, patient_name, patient_gender, patient_age, patient_id,
        drug_id, drug_name, dosage, route, start_date, reaction, reaction_start,
        severity, treatment, outcome, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const reports = [
      ['ADR20240001', 'draft', '张三', 'male', 35, 'P20240001', 1, '阿莫西林胶囊', '0.5g tid', '口服', '2024-01-15', '皮疹、瘙痒', '2024-01-16 10:00:00', 'mild', '口服氯雷他定', '好转', '李医生'],
      ['ADR20240002', 'submitted', '李四', 'female', 28, 'P20240002', 2, '布洛芬缓释胶囊', '0.3g bid', '口服', '2024-02-10', '恶心、胃痛', '2024-02-11 08:30:00', 'moderate', '停药、口服奥美拉唑', '症状缓解', '王医生'],
      ['ADR20240003', 'reviewing', '王五', 'male', 45, 'P20240003', 3, '头孢呋辛酯片', '0.25g bid', '口服', '2024-03-05', '呼吸困难、喉头水肿', '2024-03-05 14:20:00', 'severe', '肾上腺素、地塞米松静推', '抢救成功，住院观察', '赵医生'],
      ['ADR20240004', 'reported', '赵六', 'female', 62, 'P20240004', 4, '奥美拉唑肠溶胶囊', '20mg qd', '口服', '2024-04-01', '头痛、头晕', '2024-04-02 09:00:00', 'mild', '减少剂量', '症状消失', '刘医生']
    ]

    const transaction = db.transaction((reportList) => {
      for (const report of reportList) {
        insertReport.run(report)
      }
    })

    transaction(reports)
  }
}

initDb()

const toCamelCase = <T>(obj: Record<string, unknown>): T => {
  const result: Record<string, unknown> = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
      result[camelKey] = obj[key]
    }
  }
  return result as T
}

export default db
export { initDb, toCamelCase }
