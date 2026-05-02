const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const schema = require('./schema');
const seeds = require('./seeds');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || 'data/app.sqlite';

let db = null;
let dbPath = null;
let inTransaction = false;

function ensureDataDir() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

async function initDatabase() {
  ensureDataDir();
  
  const SQL = await initSqlJs();
  dbPath = path.resolve(DB_PATH);
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('Database loaded from:', dbPath);
  } else {
    db = new SQL.Database();
    console.log('New database created');
  }
  
  db.run(schema);
  console.log('Database schema initialized');
  
  await seedDatabase();
  saveDatabase();
  
  return db;
}

function checkExists(table, id) {
  try {
    const stmt = db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`);
    stmt.bind([id]);
    const exists = stmt.step();
    stmt.free();
    return exists;
  } catch (e) {
    return false;
  }
}

async function seedDatabase() {
  const now = seeds.getNow();
  const validFrom = seeds.getValidFrom();
  const validTo = seeds.getValidTo();
  
  for (const role of seeds.ROLES) {
    try {
      if (!checkExists('roles', role.id)) {
        const stmt = db.prepare(
          `INSERT INTO roles (id, code, name, description, status, created_at, updated_at) 
           VALUES (?, ?, ?, ?, 1, ?, ?)`
        );
        stmt.run([role.id, role.code, role.name, role.description, now, now]);
        stmt.free();
        console.log('Role inserted:', role.code);
      }
    } catch (e) {
      console.log('Role seed skipped:', role.code, String(e));
    }
  }
  
  for (const perm of seeds.PERMISSIONS) {
    try {
      if (!checkExists('permissions', perm.id)) {
        const stmt = db.prepare(
          `INSERT INTO permissions (id, code, name, module, description, created_at) 
           VALUES (?, ?, ?, ?, ?, ?)`
        );
        stmt.run([perm.id, perm.code, perm.name, perm.module, perm.description, now]);
        stmt.free();
        console.log('Permission inserted:', perm.code);
      }
    } catch (e) {
      console.log('Permission seed skipped:', perm.code, String(e));
    }
  }
  
  const roleIdMap = {};
  for (const role of seeds.ROLES) {
    roleIdMap[role.code] = role.id;
  }
  
  const permIdMap = {};
  for (const perm of seeds.PERMISSIONS) {
    permIdMap[perm.code] = perm.id;
  }
  
  for (const [roleCode, permCodes] of Object.entries(seeds.ROLE_PERMISSIONS)) {
    const roleId = roleIdMap[roleCode];
    if (!roleId) continue;
    
    for (const permCode of permCodes) {
      const permId = permIdMap[permCode];
      if (!permId) continue;
      
      try {
        const checkStmt = db.prepare(
          'SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?'
        );
        checkStmt.bind([roleId, permId]);
        const exists = checkStmt.step();
        checkStmt.free();
        
        if (!exists) {
          const rpId = uuidv4();
          const stmt = db.prepare(
            `INSERT INTO role_permissions (id, role_id, permission_id, created_at) 
             VALUES (?, ?, ?, ?)`
          );
          stmt.run([rpId, roleId, permId, now]);
          stmt.free();
        }
      } catch (e) {}
    }
  }
  
  for (const node of seeds.WORKFLOW_NODES) {
    try {
      if (!checkExists('workflow_nodes', node.id)) {
        const stmt = db.prepare(
          `INSERT INTO workflow_nodes 
           (id, code, name, module, description, allowed_roles, allowed_actions, next_nodes, is_terminal, sort_order, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        stmt.run([
          node.id, node.code, node.name, node.module, node.description,
          node.allowed_roles, node.allowed_actions, node.next_nodes,
          node.is_terminal || 0, node.sort_order, now
        ]);
        stmt.free();
        console.log('Workflow node inserted:', node.code);
      }
    } catch (e) {
      console.log('Workflow node seed skipped:', node.code, String(e));
    }
  }
  
  const merchant = seeds.DEFAULT_MERCHANT;
  try {
    if (!checkExists('merchants', merchant.id)) {
      const stmt = db.prepare(
        `INSERT INTO merchants 
         (id, code, name, legal_name, business_license, tax_id, country, currency, 
          contact_person, contact_email, contact_phone, kyc_status, credit_limit, risk_score, 
          status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
      );
      stmt.run([
        merchant.id, merchant.code, merchant.name, merchant.legal_name,
        merchant.business_license, merchant.tax_id, merchant.country, merchant.currency,
        merchant.contact_person, merchant.contact_email, merchant.contact_phone,
        merchant.kyc_status, merchant.credit_limit, merchant.risk_score, now, now
      ]);
      stmt.free();
      console.log('Merchant inserted:', merchant.code);
    }
  } catch (e) {
    console.log('Merchant seed skipped:', String(e));
  }
  
  for (const pi of seeds.DEFAULT_PAYMENT_INSTITUTIONS) {
    try {
      if (!checkExists('payment_institutions', pi.id)) {
        const stmt = db.prepare(
          `INSERT INTO payment_institutions 
           (id, code, name, type, country, supported_currencies, fee_config, status, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
        );
        stmt.run([pi.id, pi.code, pi.name, pi.type, pi.country, pi.supported_currencies, pi.fee_config, now, now]);
        stmt.free();
        console.log('Payment institution inserted:', pi.code);
      }
    } catch (e) {
      console.log('Payment institution seed skipped:', pi.code, String(e));
    }
  }
  
  for (const rate of seeds.DEFAULT_EXCHANGE_RATES) {
    try {
      const checkStmt = db.prepare(
        'SELECT 1 FROM exchange_rates WHERE base_currency = ? AND target_currency = ? AND is_locked = 0'
      );
      checkStmt.bind([rate.base_currency, rate.target_currency]);
      const exists = checkStmt.step();
      checkStmt.free();
      
      if (!exists) {
        const rateId = uuidv4();
        const stmt = db.prepare(
          `INSERT INTO exchange_rates 
           (id, base_currency, target_currency, rate, source, valid_from, valid_to, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        );
        stmt.run([rateId, rate.base_currency, rate.target_currency, rate.rate, rate.source, validFrom, validTo, now]);
        stmt.free();
        console.log('Exchange rate inserted:', rate.base_currency, '->', rate.target_currency);
      }
    } catch (e) {
      console.log('Exchange rate seed skipped:', rate.base_currency, '->', rate.target_currency, String(e));
    }
  }
  
  for (const user of seeds.DEFAULT_USERS) {
    try {
      if (!checkExists('users', user.id)) {
        const stmt = db.prepare(
          `INSERT INTO users 
           (id, username, password, name, email, phone, role_id, merchant_id, status, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
        );
        stmt.run([
          user.id, user.username, user.password, user.name, user.email, user.phone,
          user.role_id, user.merchant_id, now, now
        ]);
        stmt.free();
        console.log('User inserted:', user.username);
      }
    } catch (e) {
      console.log('User seed skipped:', user.username, String(e));
    }
  }
  
  console.log('Database seeds completed');
}

function saveDatabase() {
  if (!db) return;
  ensureDataDir();
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function getDb() {
  return db;
}

function run(query, params = []) {
  if (!db) throw new Error('Database not initialized');
  db.run(query, params);
  if (!inTransaction) {
    saveDatabase();
  }
}

function exec(query, params = []) {
  if (!db) throw new Error('Database not initialized');
  
  if (params.length === 0) {
    const result = db.exec(query);
    if (result.length === 0) return [];
    
    const columns = result[0].columns;
    const values = result[0].values;
    
    return values.map(row => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  }
  
  const stmt = db.prepare(query);
  try {
    stmt.bind(params);
    const results = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row);
    }
    
    return results;
  } finally {
    stmt.free();
  }
}

function get(query, params = []) {
  const results = exec(query, params);
  return results.length > 0 ? results[0] : null;
}

function insert(table, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');
  const columns = keys.join(', ');
  
  const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
  run(query, values);
  
  return data;
}

function update(table, data, where, whereParams = []) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClauses = keys.map(key => `${key} = ?`).join(', ');
  
  const query = `UPDATE ${table} SET ${setClauses} WHERE ${where}`;
  run(query, [...values, ...whereParams]);
}

function beginTransaction() {
  if (!db) throw new Error('Database not initialized');
  db.run('BEGIN TRANSACTION');
  inTransaction = true;
}

function commit() {
  if (!db) throw new Error('Database not initialized');
  db.run('COMMIT');
  inTransaction = false;
  saveDatabase();
}

function rollback() {
  if (!db) throw new Error('Database not initialized');
  db.run('ROLLBACK');
  inTransaction = false;
}

module.exports = {
  initDatabase,
  getDb,
  saveDatabase,
  run,
  exec,
  get,
  insert,
  update,
  beginTransaction,
  commit,
  rollback,
};
