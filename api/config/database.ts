import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '../../')

let dbInstance: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance
  }

  const databasePath = process.env.DATABASE_PATH || './data/app.sqlite'
  const resolvedPath = path.isAbsolute(databasePath)
    ? databasePath
    : path.resolve(projectRoot, databasePath)

  const dataDir = path.dirname(resolvedPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  dbInstance = new Database(resolvedPath)
  dbInstance.pragma('journal_mode = WAL')
  dbInstance.pragma('foreign_keys = ON')
  dbInstance.pragma('busy_timeout = 30000')
  ensureUserCompatibilityColumns(dbInstance)

  return dbInstance
}

function ensureUserCompatibilityColumns(db: Database.Database): void {
  const usersTable = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'")
    .get()

  if (!usersTable) {
    return
  }

  const columns = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>
  const columnNames = new Set(columns.map(column => column.name))

  if (!columnNames.has('province')) {
    db.prepare('ALTER TABLE users ADD COLUMN province VARCHAR(50)').run()
  }

  if (!columnNames.has('relationship')) {
    db.prepare('ALTER TABLE users ADD COLUMN relationship VARCHAR(50)').run()
  }
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

export function getDatabasePath(): string {
  const databasePath = process.env.DATABASE_PATH || './data/app.sqlite'
  const resolvedPath = path.isAbsolute(databasePath)
    ? databasePath
    : path.resolve(projectRoot, databasePath)
  return resolvedPath
}

export default getDatabase
