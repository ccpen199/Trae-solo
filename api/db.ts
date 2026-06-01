import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '..', 'database', 'rural_assets.db')

let _db: Database.Database | null = null
let _initialized = false

export function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  if (!_initialized) {
    _initialized = true
    initDb()
  }
  return _db
}

export function initDb(): void {
  const db = _db || new Database(DB_PATH)
  if (!_db) {
    _db = db
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('house', 'land', 'equipment', 'forest', 'water')),
      location TEXT DEFAULT '',
      area REAL DEFAULT 0,
      area_unit TEXT DEFAULT '平方米',
      ownership TEXT DEFAULT '',
      valuation REAL DEFAULT 0,
      photo_url TEXT DEFAULT '',
      certificate_no TEXT DEFAULT '',
      status TEXT DEFAULT 'normal' CHECK(status IN ('normal', 'transferred', 'demolished', 'idle')),
      remark TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES assets(id),
      contract_no TEXT DEFAULT '',
      type TEXT NOT NULL CHECK(type IN ('rental', 'contract', 'cooperative', 'idle')),
      lessee_name TEXT DEFAULT '',
      lessee_contact TEXT DEFAULT '',
      start_date TEXT DEFAULT '',
      end_date TEXT DEFAULT '',
      rent_amount REAL DEFAULT 0,
      rent_unit TEXT DEFAULT '年',
      payment_cycle TEXT DEFAULT '年付',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'expired', 'terminated')),
      remark TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS revenues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER REFERENCES contracts(id),
      asset_id INTEGER REFERENCES assets(id),
      type TEXT NOT NULL CHECK(type IN ('receivable', 'received', 'arrears', 'reduction', 'allocation')),
      amount REAL NOT NULL DEFAULT 0,
      year INTEGER NOT NULL DEFAULT 0,
      period TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      content TEXT DEFAULT '',
      decision_type TEXT DEFAULT 'vote' CHECK(decision_type IN ('vote', 'discussion', 'public_notice')),
      vote_result TEXT DEFAULT '',
      vote_count INTEGER DEFAULT 0,
      total_voters INTEGER DEFAULT 0,
      publish_start TEXT DEFAULT '',
      publish_end TEXT DEFAULT '',
      objection TEXT DEFAULT '',
      handling_opinion TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'voting', 'published', 'closed')),
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS query_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_type TEXT DEFAULT '',
      query_params TEXT DEFAULT '',
      queried_by TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `)

  const count = db.prepare('SELECT COUNT(*) as cnt FROM assets').get() as { cnt: number }
  if (count.cnt === 0) {
    seedData(db)
  }
}

function seedData(db: Database.Database): void {
  const insertAsset = db.prepare(`
    INSERT INTO assets (name, type, location, area, area_unit, ownership, valuation, certificate_no, status)
    VALUES (@name, @type, @location, @area, @area_unit, @ownership, @valuation, @certificate_no, @status)
  `)

  const assets = [
    { name: '村委会办公楼', type: 'house', location: '中心村一组', area: 320, area_unit: '平方米', ownership: '村集体', valuation: 850000, certificate_no: 'JTCQ-2024-001', status: 'normal' },
    { name: '东山水田120亩', type: 'land', location: '东山片区', area: 120, area_unit: '亩', ownership: '村集体', valuation: 2400000, certificate_no: 'JTCQ-2024-002', status: 'normal' },
    { name: '农机具4台套', type: 'equipment', location: '村仓库', area: 0, area_unit: '台', ownership: '村集体', valuation: 180000, certificate_no: 'JTCQ-2024-003', status: 'normal' },
    { name: '后山公益林80亩', type: 'forest', location: '后山片区', area: 80, area_unit: '亩', ownership: '村集体', valuation: 640000, certificate_no: 'JTCQ-2024-004', status: 'normal' },
    { name: '南湖水面50亩', type: 'water', location: '南湖片区', area: 50, area_unit: '亩', ownership: '村集体', valuation: 500000, certificate_no: 'JTCQ-2024-005', status: 'normal' },
    { name: '闲置仓库', type: 'house', location: '中心村三组', area: 200, area_unit: '平方米', ownership: '村集体', valuation: 300000, certificate_no: 'JTCQ-2024-006', status: 'idle' },
    { name: '河西旱地60亩', type: 'land', location: '河西片区', area: 60, area_unit: '亩', ownership: '村集体', valuation: 900000, certificate_no: 'JTCQ-2024-007', status: 'normal' },
  ]

  const t = db.transaction(() => {
    for (const a of assets) {
      insertAsset.run(a)
    }
  })
  t()

  const insertContract = db.prepare(`
    INSERT INTO contracts (asset_id, contract_no, type, lessee_name, lessee_contact, start_date, end_date, rent_amount, rent_unit, payment_cycle, status)
    VALUES (@asset_id, @contract_no, @type, @lessee_name, @lessee_contact, @start_date, @end_date, @rent_amount, @rent_unit, @payment_cycle, @status)
  `)

  const contracts = [
    { asset_id: 2, contract_no: 'HT-2024-001', type: 'contract', lessee_name: '张大勇', lessee_contact: '13800001111', start_date: '2024-01-01', end_date: '2026-12-31', rent_amount: 60000, rent_unit: '年', payment_cycle: '年付', status: 'active' },
    { asset_id: 5, contract_no: 'HT-2024-002', type: 'rental', lessee_name: '李明辉', lessee_contact: '13900002222', start_date: '2024-03-01', end_date: '2025-02-28', rent_amount: 25000, rent_unit: '年', payment_cycle: '年付', status: 'expired' },
    { asset_id: 7, contract_no: 'HT-2024-003', type: 'cooperative', lessee_name: '绿源合作社', lessee_contact: '13700003333', start_date: '2024-06-01', end_date: '2027-05-31', rent_amount: 45000, rent_unit: '年', payment_cycle: '年付', status: 'active' },
    { asset_id: 6, contract_no: 'HT-2024-004', type: 'idle', lessee_name: '', lessee_contact: '', start_date: '', end_date: '', rent_amount: 0, rent_unit: '年', payment_cycle: '', status: 'pending' },
    { asset_id: 1, contract_no: 'HT-2025-005', type: 'rental', lessee_name: '赵有财', lessee_contact: '13600004444', start_date: '2025-01-01', end_date: '2026-06-30', rent_amount: 36000, rent_unit: '年', payment_cycle: '年付', status: 'active' },
  ]

  const t2 = db.transaction(() => {
    for (const c of contracts) {
      insertContract.run(c)
    }
  })
  t2()

  const insertRevenue = db.prepare(`
    INSERT INTO revenues (contract_id, asset_id, type, amount, year, period, description)
    VALUES (@contract_id, @asset_id, @type, @amount, @year, @period, @description)
  `)

  const revenues = [
    { contract_id: 1, asset_id: 2, type: 'receivable', amount: 60000, year: 2024, period: '2024年度', description: '东山水田承包费应收' },
    { contract_id: 1, asset_id: 2, type: 'received', amount: 60000, year: 2024, period: '2024年度', description: '东山水田承包费实收' },
    { contract_id: 2, asset_id: 5, type: 'receivable', amount: 25000, year: 2024, period: '2024年度', description: '南湖水面租赁费应收' },
    { contract_id: 2, asset_id: 5, type: 'received', amount: 15000, year: 2024, period: '2024年度', description: '南湖水面租赁费实收（部分）' },
    { contract_id: 2, asset_id: 5, type: 'arrears', amount: 10000, year: 2024, period: '2024年度', description: '南湖水面租赁费欠缴' },
    { contract_id: 3, asset_id: 7, type: 'receivable', amount: 45000, year: 2024, period: '2024年度', description: '河西旱地合作经营费应收' },
    { contract_id: 3, asset_id: 7, type: 'received', amount: 45000, year: 2024, period: '2024年度', description: '河西旱地合作经营费实收' },
    { contract_id: 3, asset_id: 7, type: 'allocation', amount: 45000, year: 2024, period: '2024年度', description: '河西旱地收益分配方案' },
    { contract_id: 1, asset_id: 2, type: 'reduction', amount: 5000, year: 2024, period: '2024年度', description: '东山水田因灾减免' },
  ]

  const t3 = db.transaction(() => {
    for (const r of revenues) {
      insertRevenue.run(r)
    }
  })
  t3()

  const insertDecision = db.prepare(`
    INSERT INTO decisions (topic, content, decision_type, vote_result, vote_count, total_voters, publish_start, publish_end, objection, handling_opinion, status)
    VALUES (@topic, @content, @decision_type, @vote_result, @vote_count, @total_voters, @publish_start, @publish_end, @objection, @handling_opinion, @status)
  `)

  const decisions = [
    { topic: '东山水田承包方案', content: '拟将东山水田120亩继续承包给张大勇，期限3年，年租金6万元', decision_type: 'vote', vote_result: '通过', vote_count: 45, total_voters: 52, publish_start: '2024-01-15', publish_end: '2024-01-30', objection: '', handling_opinion: '', status: 'closed' },
    { topic: '南湖水面租赁公示', content: '拟将南湖水面50亩租赁给李明辉从事水产养殖，年租金2.5万元', decision_type: 'public_notice', vote_result: '', vote_count: 0, total_voters: 52, publish_start: '2024-02-20', publish_end: '2024-03-05', objection: '村民王五反映租金偏低', handling_opinion: '经核实租金合理，维持原方案', status: 'closed' },
    { topic: '河西旱地合作经营方案', content: '拟与绿源合作社合作经营河西旱地60亩，发展特色种植', decision_type: 'vote', vote_result: '通过', vote_count: 48, total_voters: 52, publish_start: '2024-05-10', publish_end: '2024-05-25', objection: '', handling_opinion: '', status: 'closed' },
    { topic: '闲置仓库处置方案', content: '拟对中心村三组闲置仓库进行修缮后出租或处置', decision_type: 'discussion', vote_result: '待讨论', vote_count: 0, total_voters: 52, publish_start: '', publish_end: '', objection: '', handling_opinion: '', status: 'pending' },
  ]

  const t4 = db.transaction(() => {
    for (const d of decisions) {
      insertDecision.run(d)
    }
  })
  t4()
}
