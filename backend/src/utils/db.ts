import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

const PROJECT_DIR = path.resolve(__dirname, '../../..')
dotenv.config({ path: path.join(PROJECT_DIR, '.env') })

const DB_PATH = path.resolve(PROJECT_DIR, process.env.DB_PATH || './data/app.sqlite')

const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db: DatabaseType = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export default db

export function runQuery<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql)
  return stmt.all(...params) as T[]
}

export function runQueryOne<T = any>(sql: string, params: any[] = []): T | undefined {
  const stmt = db.prepare(sql)
  return stmt.get(...params) as T | undefined
}

export function runInsert(sql: string, params: any[] = []): number {
  const stmt = db.prepare(sql)
  const result = stmt.run(...params)
  return Number(result.lastInsertRowid)
}

export function runUpdate(sql: string, params: any[] = []): number {
  const stmt = db.prepare(sql)
  const result = stmt.run(...params)
  return result.changes
}

export function runDelete(sql: string, params: any[] = []): number {
  const stmt = db.prepare(sql)
  const result = stmt.run(...params)
  return result.changes
}

export function runTransaction(fn: () => void): void {
  const exec = db.transaction(fn)
  exec()
}
