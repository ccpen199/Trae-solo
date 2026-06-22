require('dotenv').config();
const fs = require('fs');
const path = require('path');
const config = require('../config');

const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

function loadData() {
  if (!fs.existsSync(config.dbPath)) return { tables: {}, sequences: {} };
  try {
    return JSON.parse(fs.readFileSync(config.dbPath, 'utf-8'));
  } catch (e) {
    return { tables: {}, sequences: {} };
  }
}

function saveData(data) {
  fs.writeFileSync(config.dbPath, JSON.stringify(data, null, 2));
}

let data = loadData();

function ensureTable(name) {
  if (!data.tables[name]) data.tables[name] = [];
}

function parseWhere(where, params) {
  return function (row) {
    if (!where) return true;
    const clauses = where.split(/\s+AND\s+/i);
    let paramIdx = 0;
    for (const clause of clauses) {
      const m = clause.trim().match(/^(\w+)\s*(=|<>|!=|>|<|>=|<=|IS|IS NOT|LIKE|IN)\s*(.+)$/i);
      if (!m) continue;
      const [, col, op, rawVal] = m;
      let val;
      if (rawVal === '?') { val = params[paramIdx++]; }
      else if (rawVal.toUpperCase() === 'NULL') { val = null; }
      else if (/^'[^']*'$/.test(rawVal)) { val = rawVal.slice(1, -1); }
      else { val = rawVal; }
      const rowVal = row[col];
      switch (op.toUpperCase()) {
        case '=': if (rowVal !== val) return false; break;
        case '<>': case '!=': if (rowVal === val) return false; break;
        case '>': if (!(rowVal > val)) return false; break;
        case '<': if (!(rowVal < val)) return false; break;
        case '>=': if (!(rowVal >= val)) return false; break;
        case '<=': if (!(rowVal <= val)) return false; break;
        case 'IS': if (rowVal !== null) return false; break;
        case 'IS NOT': if (rowVal === null) return false; break;
        case 'LIKE': {
          const pattern = val.replace(/%/g, '.*').replace(/_/g, '.');
          if (!new RegExp('^' + pattern + '$', 'i').test(String(rowVal || ''))) return false;
          break;
        }
      }
    }
    return true;
  };
}

function parseSql(sql) {
  const insertMatch = sql.match(/^INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)$/i);
  if (insertMatch) {
    const [, table, colsStr, valsStr] = insertMatch;
    const columns = colsStr.split(',').map(c => c.trim());
    return { type: 'INSERT', table, columns };
  }
  const selectMatch = sql.match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?(?:\s+OFFSET\s+(\d+))?$/i);
  if (selectMatch) {
    const [, fields, table, where, orderBy, limit, offset] = selectMatch;
    return { type: 'SELECT', fields, table, where, orderBy, limit: limit ? parseInt(limit) : null, offset: offset ? parseInt(offset) : null };
  }
  const updateMatch = sql.match(/^UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
  if (updateMatch) {
    const [, table, setStr, where] = updateMatch;
    const assignments = setStr.split(',').map(s => {
      const m = s.trim().match(/^(\w+)\s*=\s*(.+)$/i);
      return m ? { col: m[1], expr: m[2].trim() } : null;
    }).filter(Boolean);
    return { type: 'UPDATE', table, assignments, where };
  }
  const deleteMatch = sql.match(/^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?$/i);
  if (deleteMatch) {
    return { type: 'DELETE', table: deleteMatch[1], where: deleteMatch[2] };
  }
  const createMatch = sql.match(/^CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)/i);
  if (createMatch) return { type: 'CREATE', table: createMatch[1] };
  return { type: 'UNKNOWN' };
}

function evaluate(expr, row, params, paramStartIdx) {
  if (expr === '?') return params[paramStartIdx.idx++];
  if (expr.toUpperCase() === 'CURRENT_TIMESTAMP') return new Date().toISOString();
  if (expr.toUpperCase() === 'NULL') return null;
  if (/^'[^']*'$/.test(expr)) return expr.slice(1, -1);
  if (/^-?\d+(\.\d+)?$/.test(expr)) return parseFloat(expr);
  const m = expr.match(/^COALESCE\((.+?)\)$/i);
  if (m) {
    const parts = m[1].split(',');
    for (const p of parts) {
      const v = evaluate(p.trim(), row, params, paramStartIdx);
      if (v !== null && v !== undefined) return v;
    }
    return null;
  }
  if (row && expr in row) return row[expr];
  return expr;
}

async function run(sql, ...params) {
  sql = sql.trim().replace(/;$/, '');
  const parsed = parseSql(sql);
  const pi = { idx: 0 };
  if (parsed.type === 'CREATE') {
    ensureTable(parsed.table);
    if (!data.sequences[parsed.table]) data.sequences[parsed.table] = 0;
    saveData(data);
    return { changes: 0, lastID: 0 };
  }
  if (parsed.type === 'INSERT') {
    ensureTable(parsed.table);
    if (!data.sequences[parsed.table]) data.sequences[parsed.table] = 0;
    const row = {};
    parsed.columns.forEach((col, i) => {
      row[col] = params[i];
    });
    data.sequences[parsed.table]++;
    row.id = data.sequences[parsed.table];
    if (!row.created_at) row.created_at = new Date().toISOString();
    data.tables[parsed.table].push(row);
    saveData(data);
    return { changes: 1, lastID: row.id };
  }
  if (parsed.type === 'UPDATE') {
    ensureTable(parsed.table);
    const filter = parseWhere(parsed.where, params);
    let changes = 0;
    data.tables[parsed.table] = data.tables[parsed.table].map(row => {
      if (!filter(row)) return row;
      changes++;
      const newRow = { ...row };
      for (const a of parsed.assignments) {
        newRow[a.col] = evaluate(a.expr, row, params, pi);
      }
      newRow.updated_at = new Date().toISOString();
      return newRow;
    });
    saveData(data);
    return { changes, lastID: 0 };
  }
  if (parsed.type === 'DELETE') {
    ensureTable(parsed.table);
    const filter = parseWhere(parsed.where, params);
    const before = data.tables[parsed.table].length;
    data.tables[parsed.table] = data.tables[parsed.table].filter(r => !filter(r));
    saveData(data);
    return { changes: before - data.tables[parsed.table].length, lastID: 0 };
  }
  return { changes: 0, lastID: 0 };
}

async function get(sql, ...params) {
  const rows = await all(sql, ...params);
  return rows[0] || undefined;
}

async function all(sql, ...params) {
  sql = sql.trim().replace(/;$/, '');
  const parsed = parseSql(sql);
  if (parsed.type !== 'SELECT') return [];
  ensureTable(parsed.table);
  let rows = data.tables[parsed.table] || [];

  const joinMatch = sql.match(/JOIN\s+(\w+)\s+\w+\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
  if (joinMatch) {
    const [, joinTable, aTbl, aCol, bTbl, bCol] = joinMatch;
    ensureTable(joinTable);
    const joined = [];
    const joinRows = data.tables[joinTable] || [];
    for (const row of rows) {
      const mainVal = (parsed.table === aTbl ? row[aCol] : row[bCol]);
      const matches = joinRows.filter(jr => {
        const jrVal = (joinTable === aTbl ? jr[aCol] : jr[bCol]);
        return jrVal === mainVal;
      });
      if (matches.length === 0) joined.push(row);
      else for (const m of matches) joined.push({ ...row, ...m });
    }
    rows = joined;
  }

  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
  const where = whereMatch ? whereMatch[1] : null;
  const paramsUsed = [];
  if (where) {
    const qCount = (where.match(/\?/g) || []).length;
    for (let i = 0; i < qCount; i++) paramsUsed.push(params[i]);
    rows = rows.filter(parseWhere(where, paramsUsed));
  }

  const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
  if (orderMatch) {
    const [, col, dir] = orderMatch;
    rows.sort((a, b) => {
      if (a[col] < b[col]) return dir === 'DESC' ? 1 : -1;
      if (a[col] > b[col]) return dir === 'DESC' ? -1 : 1;
      return 0;
    });
  }

  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  const offsetMatch = sql.match(/OFFSET\s+(\d+)/i);
  if (limitMatch) {
    const limit = parseInt(limitMatch[1]);
    const offset = offsetMatch ? parseInt(offsetMatch[1]) : 0;
    rows = rows.slice(offset, offset + limit);
  }

  const fields = parsed.fields.trim();
  if (fields === '*') return rows;

  const aggMatch = fields.match(/COUNT\s*\(\s*\*\s*\)\s*(?:AS\s+(\w+))?/i);
  if (aggMatch) {
    const alias = aggMatch[1] || 'count';
    return [{ [alias]: rows.length }];
  }

  return rows.map(row => {
    const out = {};
    fields.split(',').forEach(f => {
      const fm = f.trim().match(/^(\w+)(?:\s+AS\s+(\w+))?$/i);
      if (fm) {
        const [, col, alias] = fm;
        out[alias || col] = row[col];
      }
    });
    return out;
  });
}

async function exec(sql) {
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await run(stmt);
  }
}

async function initDatabase() {
  const tables = [
    'users', 'login_logs', 'device_groups', 'devices', 'device_shares',
    'storage_policies', 'recordings', 'ai_events', 'alerts',
    'alert_audit_logs', 'user_devices'
  ];
  for (const t of tables) {
    ensureTable(t);
    if (!data.sequences[t]) data.sequences[t] = 0;
  }

  const userCount = data.tables.users.length;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const defaultPwd = bcrypt.hashSync('admin123456', 10);
    data.sequences.users++;
    data.tables.users.push({
      id: data.sequences.users,
      username: 'admin',
      password: defaultPwd,
      nickname: '超级管理员',
      role: 'owner',
      phone: '13800138000',
      email: 'admin@example.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    saveData(data);
    console.log('默认管理员账号: admin / admin123456');
  }
  saveData(data);
  console.log('✅ Database initialized (JSON-backed)');
}

initDatabase().catch(err => console.error('❌ Database init failed:', err));

module.exports = { run, get, all, exec };
