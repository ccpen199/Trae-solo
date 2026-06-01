import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite'
const fullDbPath = path.resolve(__dirname, '../../', dbPath)

const db = new Database(fullDbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS molds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mold_number TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      cavity_count INTEGER NOT NULL DEFAULT 1,
      total_life INTEGER NOT NULL DEFAULT 100000,
      current_usage INTEGER NOT NULL DEFAULT 0,
      storage_location TEXT NOT NULL,
      maintenance_cycle INTEGER NOT NULL DEFAULT 10000,
      last_maintenance INTEGER DEFAULT 0,
      responsible_person TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle',
      current_work_order TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mold_borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mold_id INTEGER NOT NULL,
      borrower TEXT NOT NULL,
      borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      return_date DATETIME,
      purpose TEXT,
      FOREIGN KEY (mold_id) REFERENCES molds(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS production_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mold_id INTEGER NOT NULL,
      work_order TEXT NOT NULL,
      operator TEXT NOT NULL,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      produced_quantity INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      quality_issues TEXT,
      FOREIGN KEY (mold_id) REFERENCES molds(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS maintenance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mold_id INTEGER NOT NULL,
      fault_symptom TEXT NOT NULL,
      repair_content TEXT,
      spare_parts TEXT,
      downtime_minutes INTEGER DEFAULT 0,
      repair_person TEXT NOT NULL,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      acceptance_result TEXT,
      acceptance_person TEXT,
      is_repeated_fault INTEGER DEFAULT 0,
      FOREIGN KEY (mold_id) REFERENCES molds(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quality_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mold_id INTEGER NOT NULL,
      work_order TEXT NOT NULL,
      defect_type TEXT NOT NULL,
      defect_count INTEGER NOT NULL,
      inspector TEXT NOT NULL,
      record_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (mold_id) REFERENCES molds(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_molds_status ON molds(status);
    CREATE INDEX IF NOT EXISTS idx_molds_mold_number ON molds(mold_number);
    CREATE INDEX IF NOT EXISTS idx_production_usage_mold ON production_usage(mold_id);
    CREATE INDEX IF NOT EXISTS idx_maintenance_mold ON maintenance_records(mold_id);
    CREATE INDEX IF NOT EXISTS idx_quality_mold ON quality_records(mold_id);
  `)

  const moldCount = db.prepare('SELECT COUNT(*) as count FROM molds').get() as { count: number }
  if (moldCount.count === 0) {
    const insertMold = db.prepare(`
      INSERT INTO molds (
        mold_number, product_name, cavity_count, total_life, 
        storage_location, maintenance_cycle, responsible_person, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const sampleMolds = [
      ['M001', '汽车保险杠', 1, 500000, 'A区-01-01', 50000, '张三', 'idle'],
      ['M002', '手机外壳', 8, 1000000, 'B区-02-03', 100000, '李四', 'idle'],
      ['M003', '连接器壳体', 16, 2000000, 'C区-03-05', 200000, '王五', 'maintenance'],
      ['M004', '按键面板', 4, 800000, 'A区-01-02', 80000, '赵六', 'idle'],
      ['M005', '电池后盖', 2, 600000, 'B区-02-01', 60000, '钱七', 'in_use'],
    ]

    sampleMolds.forEach(mold => insertMold.run(...mold))
  }
}

export default db
