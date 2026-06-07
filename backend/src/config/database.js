const path = require('path')

const dbPath = path.join(__dirname, '../../data/app.sqlite')

function normalizeParams(params) {
  return params.map(param => param === undefined ? null : param)
}

function wrapNodeStatement(statement) {
  return {
    all(...params) {
      return statement.all(...normalizeParams(params))
    },
    get(...params) {
      return statement.get(...normalizeParams(params))
    },
    run(...params) {
      const result = statement.run(...normalizeParams(params))
      return {
        changes: Number(result.changes || 0),
        lastInsertRowid: Number(result.lastInsertRowid || 0)
      }
    }
  }
}

function createNodeSqliteDb() {
  const { DatabaseSync } = require('node:sqlite')
  const database = new DatabaseSync(dbPath)

  return {
    exec(sql) {
      return database.exec(sql)
    },
    pragma(statement) {
      return database.exec(`PRAGMA ${statement}`)
    },
    prepare(sql) {
      return wrapNodeStatement(database.prepare(sql))
    },
    close() {
      return database.close()
    }
  }
}

function createBetterSqliteDb() {
  const Database = require('better-sqlite3')
  return new Database(dbPath)
}

let db

try {
  db = createNodeSqliteDb()
} catch (nodeSqliteError) {
  db = createBetterSqliteDb()
}

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

module.exports = db
