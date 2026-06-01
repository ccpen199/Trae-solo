const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '../../../data/app.sqlite')
const db = new Database(dbPath, { verbose: console.log })

function query(sql, params = []) {
  const stmt = db.prepare(sql)
  return stmt.all(...params)
}

function queryOne(sql, params = []) {
  const stmt = db.prepare(sql)
  return stmt.get(...params)
}

function execute(sql, params = []) {
  const stmt = db.prepare(sql)
  const result = stmt.run(...params)
  return {
    lastID: result.lastInsertRowid,
    changes: result.changes
  }
}

module.exports = {
  db,
  query,
  queryOne,
  execute,
}
