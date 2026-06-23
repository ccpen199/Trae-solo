import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import type { UserProfile, PaymentAccount, PaymentRecord, Favorite, PolicyDocument } from '../../shared/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.resolve(__dirname, '..', '..', 'data.sqlite')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema(db)
    seedInitialData(db)
  }
  return db
}

function initSchema(d: Database.Database): void {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      id_card TEXT,
      verified INTEGER NOT NULL DEFAULT 0,
      district TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_accounts (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      category_name TEXT NOT NULL,
      district TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_name TEXT NOT NULL,
      amount_due REAL NOT NULL DEFAULT 0,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unpaid'
    );

    CREATE TABLE IF NOT EXISTS payment_records (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      order_no TEXT UNIQUE NOT NULL,
      paid_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES payment_accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      target_data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(target_type, target_id)
    );

    CREATE TABLE IF NOT EXISTS cached_policies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      published_at TEXT NOT NULL,
      effective_from TEXT NOT NULL,
      cached INTEGER NOT NULL DEFAULT 1,
      cached_at TEXT NOT NULL
    );
  `)
}

function seedInitialData(d: Database.Database): void {
  const userCount = d.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }
  if (userCount.cnt === 0) {
    const insertUser = d.prepare(`
      INSERT INTO users (id, phone, name, id_card, verified, district, created_at)
      VALUES (@id, @phone, @name, @idCard, @verified, @district, @createdAt)
    `)
    const now = new Date().toISOString()
    insertUser.run({
      id: 'user-001',
      phone: '13800138000',
      name: '张三',
      idCard: '370202199001011234',
      verified: 1,
      district: '市南区',
      createdAt: now,
    })
  }
}

export function getUserByPhone(phone: string): UserProfile | null {
  const d = getDb()
  const row = d.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any
  if (!row) return null
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    idCard: row.idCard,
    verified: !!row.verified,
    district: row.district,
    createdAt: row.createdAt,
  }
}

export function getUserById(id: string): UserProfile | null {
  const d = getDb()
  const row = d.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
  if (!row) return null
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    idCard: row.idCard,
    verified: !!row.verified,
    district: row.district,
    createdAt: row.createdAt,
  }
}

export function listPaymentAccounts(): PaymentAccount[] {
  const d = getDb()
  const rows = d.prepare('SELECT * FROM payment_accounts ORDER BY due_date ASC').all() as any[]
  return rows.map((row) => ({
    id: row.id,
    category: row.category as any,
    categoryName: row.category_name,
    district: row.district,
    accountNumber: row.account_number,
    accountName: row.account_name,
    amountDue: row.amount_due,
    dueDate: row.due_date,
    status: row.status as any,
    systemStatus: (row.system_status || 'online') as any,
    systemSource: row.system_source || `${row.district || '青岛市'}缴费系统`,
    householdNo: row.household_no || row.account_number,
    address: row.address || `${row.district || ''}`,
    ownerPhone: row.owner_phone || '',
  }))
}

export function insertPaymentAccount(acc: PaymentAccount): void {
  const d = getDb()
  d.prepare(`
    INSERT INTO payment_accounts (id, category, category_name, district, account_number, account_name, amount_due, due_date, status)
    VALUES (@id, @category, @categoryName, @district, @accountNumber, @accountName, @amountDue, @dueDate, @status)
  `).run(acc as any)
}

export function listPaymentRecords(accountId?: string): PaymentRecord[] {
  const d = getDb()
  const rows = accountId
    ? d.prepare('SELECT * FROM payment_records WHERE account_id = ? ORDER BY created_at DESC').all(accountId) as any[]
    : d.prepare('SELECT * FROM payment_records ORDER BY created_at DESC').all() as any[]
  return rows.map((row) => ({
    id: row.id,
    accountId: row.account_id,
    amount: row.amount,
    status: row.status as any,
    orderNo: row.order_no,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  }))
}

export function insertPaymentRecord(record: PaymentRecord): void {
  const d = getDb()
  d.prepare(`
    INSERT INTO payment_records (id, account_id, amount, status, order_no, paid_at, created_at)
    VALUES (@id, @accountId, @amount, @status, @orderNo, @paidAt, @createdAt)
  `).run(record as any)
}

export function updatePaymentRecordStatus(id: string, status: 'pending' | 'success' | 'failed', paidAt?: string): void {
  const d = getDb()
  d.prepare('UPDATE payment_records SET status = ?, paid_at = COALESCE(?, paid_at) WHERE id = ?').run(status, paidAt ?? null, id)
}

export function listFavorites(): Favorite[] {
  const d = getDb()
  const rows = d.prepare('SELECT * FROM favorites ORDER BY created_at DESC').all() as any[]
  return rows.map((row) => ({
    id: row.id,
    targetType: row.target_type as any,
    targetId: row.target_id,
    targetData: row.target_data,
    createdAt: row.created_at,
  }))
}

export function insertFavorite(fav: Favorite): void {
  const d = getDb()
  d.prepare(`
    INSERT OR IGNORE INTO favorites (id, target_type, target_id, target_data, created_at)
    VALUES (@id, @targetType, @targetId, @targetData, @createdAt)
  `).run(fav as any)
}

export function deleteFavorite(id: string): void {
  const d = getDb()
  d.prepare('DELETE FROM favorites WHERE id = ?').run(id)
}

export function listCachedPolicies(): PolicyDocument[] {
  const d = getDb()
  const rows = d.prepare('SELECT * FROM cached_policies ORDER BY published_at DESC').all() as any[]
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    department: row.department,
    category: row.category,
    summary: row.summary,
    content: row.content,
    publishedAt: row.published_at,
    effectiveFrom: row.effective_from,
    cached: !!row.cached,
  }))
}

export function cachePolicy(policy: PolicyDocument): void {
  const d = getDb()
  const now = new Date().toISOString()
  d.prepare(`
    INSERT OR REPLACE INTO cached_policies (id, title, department, category, summary, content, published_at, effective_from, cached, cached_at)
    VALUES (@id, @title, @department, @category, @summary, @content, @publishedAt, @effectiveFrom, 1, @cachedAt)
  `).run({ ...policy, cachedAt: now } as any)
}

export default getDb()
