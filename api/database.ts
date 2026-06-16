import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { seedDatabase } from './services/seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(PROJECT_ROOT, 'data')
const DB_PATH = path.join(DATA_DIR, 'petlife.db')
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'migrations')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

function getAppliedMigrations(database: Database.Database): Set<string> {
  const row = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
    )
    .get()

  if (!row) {
    return new Set()
  }

  const rows = database.prepare('SELECT name FROM migrations').all() as {
    name: string
  }[]
  return new Set(rows.map((r) => r.name))
}

function applyMigration(
  database: Database.Database,
  name: string,
  sql: string
): void {
  const transaction = database.transaction(() => {
    database.exec(sql)
    database
      .prepare('INSERT INTO migrations (id, name) VALUES (?, ?)')
      .run(uuidv4(), name)
  })
  transaction()
  console.log(`Applied migration: ${name}`)
}

export function runMigrations(): void {
  const database = getDatabase()
  const appliedMigrations = getAppliedMigrations(database)

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('Migrations directory not found, skipping migrations')
    return
  }

  const migrationFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of migrationFiles) {
    if (!appliedMigrations.has(file)) {
      const filePath = path.join(MIGRATIONS_DIR, file)
      const sql = fs.readFileSync(filePath, 'utf-8')
      applyMigration(database, file, sql)
    }
  }
}

export function isDatabaseEmpty(): boolean {
  const database = getDatabase()
  const row = database
    .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'")
    .get() as { count: number }
  if (row.count === 0) return true

  const userCount = database
    .prepare('SELECT COUNT(*) as count FROM users')
    .get() as { count: number }
  return userCount.count === 0
}

export function initDatabase(seed: boolean = true): void {
  const database = getDatabase()
  database.pragma('foreign_keys = OFF')
  runMigrations()
  database.pragma('foreign_keys = ON')

  if (seed && isDatabaseEmpty()) {
    console.log('Seeding database with mock data...')
    seedDatabase(getDatabase())
    console.log('Database seeded successfully')
  }
}

export default getDatabase
