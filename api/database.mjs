import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'gamevault.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDatabase() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      game_uid TEXT NOT NULL,
      game_name TEXT NOT NULL,
      server TEXT NOT NULL,
      region TEXT NOT NULL,
      level INTEGER NOT NULL,
      snapshot_hash TEXT NOT NULL,
      chain_tx_hash TEXT NOT NULL,
      status TEXT NOT NULL,
      price INTEGER NOT NULL,
      rent_daily INTEGER NOT NULL,
      valuation INTEGER NOT NULL,
      risk_score INTEGER NOT NULL,
      insurance_status TEXT NOT NULL,
      escrow_status TEXT NOT NULL,
      contract_status TEXT NOT NULL,
      equipment_snapshot TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT REFERENCES accounts(id),
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL,
      contract_hash TEXT,
      escrow_status TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rental_risk (
      id TEXT PRIMARY KEY,
      account_id TEXT REFERENCES accounts(id),
      device_fingerprint TEXT NOT NULL,
      behavior_score INTEGER NOT NULL,
      location_alerts TEXT NOT NULL,
      circuit_breaker TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recycle_bids (
      id TEXT PRIMARY KEY,
      account_id TEXT REFERENCES accounts(id),
      recycler_name TEXT NOT NULL,
      bid_amount INTEGER NOT NULL,
      heat_score INTEGER NOT NULL,
      valuation_score INTEGER NOT NULL,
      timeliness_score INTEGER NOT NULL,
      weight_score INTEGER NOT NULL,
      estimated_time TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS insurance_claims (
      id TEXT PRIMARY KEY,
      account_id TEXT REFERENCES accounts(id),
      policy_id TEXT NOT NULL,
      contract_id TEXT NOT NULL,
      claim_status TEXT NOT NULL,
      claim_amount INTEGER NOT NULL,
      auto_triggered INTEGER NOT NULL,
      triggered_at TEXT
    );

    CREATE TABLE IF NOT EXISTS risk_alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      account_id TEXT REFERENCES accounts(id),
      description TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_flow (
      id TEXT PRIMARY KEY,
      ref_id TEXT NOT NULL,
      flow_type TEXT NOT NULL,
      description TEXT NOT NULL,
      amount INTEGER,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      display_name TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const count = database.prepare('SELECT COUNT(*) as count FROM accounts').get().count;
  if (count === 0) seedDatabase(database);
  ensureDefaultUsers(database);
}

function ensureDefaultUsers(database) {
  const count = database.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (count > 0) return;

  const insertUser = database.prepare(`
    INSERT INTO users (id, username, password, role, display_name, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  [
    ['user-admin', 'admin', 'admin123', 'admin', '运营管理员', 'active', '2026-06-09T09:00:00Z'],
    ['user-buyer', 'buyer01', 'buyer123', 'buyer', '买家体验官', 'active', '2026-06-09T09:05:00Z'],
    ['user-seller', 'seller01', 'seller123', 'seller', '卖家商户', 'active', '2026-06-09T09:10:00Z'],
  ].forEach((row) => insertUser.run(...row));
}

function seedDatabase(database) {
  const accountRows = [
    {
      id: 'acc-001',
      game_uid: 'UID-829301',
      game_name: '原神',
      server: '天空岛',
      region: '国服',
      level: 58,
      snapshot_hash: '0x7a3f5c9d88b2e8b2',
      chain_tx_hash: '0xabc12390def45677',
      status: 'available',
      price: 2580,
      rent_daily: 68,
      valuation: 2350,
      risk_score: 12,
      insurance_status: 'active',
      escrow_status: 'ready',
      contract_status: 'template_ready',
      equipment_snapshot: JSON.stringify(['天空之翼', '护摩之杖', '磐岩结绿']),
      created_at: '2026-06-08T10:30:00Z',
    },
    {
      id: 'acc-002',
      game_uid: 'UID-445672',
      game_name: '王者荣耀',
      server: '微信区',
      region: '国服',
      level: 30,
      snapshot_hash: '0x9c2d7e31f1a4aa02',
      chain_tx_hash: '0x789abc77fed01233',
      status: 'selling',
      price: 1680,
      rent_daily: 45,
      valuation: 1520,
      risk_score: 8,
      insurance_status: 'active',
      escrow_status: 'frozen',
      contract_status: 'signed',
      equipment_snapshot: JSON.stringify(['天鹅之梦', '全息碎影', '无限飓风号']),
      created_at: '2026-06-08T11:20:00Z',
    },
    {
      id: 'acc-003',
      game_uid: 'UID-119883',
      game_name: '英雄联盟',
      server: '艾欧尼亚',
      region: '国服',
      level: 45,
      snapshot_hash: '0x5e8b9122c3d7bb19',
      chain_tx_hash: '0x345def99abc67888',
      status: 'available',
      price: 3200,
      rent_daily: 88,
      valuation: 2950,
      risk_score: 5,
      insurance_status: 'inactive',
      escrow_status: 'ready',
      contract_status: 'template_ready',
      equipment_snapshot: JSON.stringify(['K/DA阿卡丽', '源计划：风', '海克斯科技']),
      created_at: '2026-06-08T12:00:00Z',
    },
    {
      id: 'acc-004',
      game_uid: 'UID-556677',
      game_name: 'DNF手游',
      server: '跨一区',
      region: '国服',
      level: 60,
      snapshot_hash: '0x2f4aa098b9e1cc45',
      chain_tx_hash: '0xcde78944abc01234',
      status: 'rented',
      price: 4200,
      rent_daily: 128,
      valuation: 3900,
      risk_score: 22,
      insurance_status: 'claim_ready',
      escrow_status: 'deposit_frozen',
      contract_status: 'active',
      equipment_snapshot: JSON.stringify(['荒古遗尘光剑', '幽魂魅影套', '冰雪公主']),
      created_at: '2026-06-08T13:45:00Z',
    },
  ];

  const insertAccount = database.prepare(`
    INSERT INTO accounts (
      id, game_uid, game_name, server, region, level, snapshot_hash, chain_tx_hash,
      status, price, rent_daily, valuation, risk_score, insurance_status,
      escrow_status, contract_status, equipment_snapshot, created_at
    ) VALUES (
      @id, @game_uid, @game_name, @server, @region, @level, @snapshot_hash, @chain_tx_hash,
      @status, @price, @rent_daily, @valuation, @risk_score, @insurance_status,
      @escrow_status, @contract_status, @equipment_snapshot, @created_at
    )
  `);
  accountRows.forEach((row) => insertAccount.run(row));

  const insertTransaction = database.prepare(`
    INSERT INTO transactions (id, account_id, type, amount, status, contract_hash, escrow_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  [
    ['tx-001', 'acc-001', 'buy', 2580, 'completed', '0xcontract001abc', 'released', '2026-06-09T09:30:00Z'],
    ['tx-002', 'acc-004', 'rent', 120, 'processing', '0xcontract002def', 'deposit_frozen', '2026-06-09T10:05:00Z'],
    ['tx-003', 'acc-002', 'sell', 1680, 'completed', '0xcontract003ghi', 'released', '2026-06-09T11:15:00Z'],
    ['tx-004', 'acc-003', 'recycle', 2900, 'pending', '0xcontract004jkl', 'awaiting_transfer', '2026-06-09T12:20:00Z'],
  ].forEach((row) => insertTransaction.run(...row));

  const insertRisk = database.prepare(`
    INSERT INTO rental_risk (id, account_id, device_fingerprint, behavior_score, location_alerts, circuit_breaker, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertRisk.run('risk-rent-001', 'acc-004', 'FP-A3B7C9D2', 72, JSON.stringify(['上海市 114.88.xxx.xxx', '北京市 61.149.xxx.xxx']), '异地登录熔断待复核', '2026-06-09T12:30:00Z');
  insertRisk.run('risk-rent-002', 'acc-001', 'FP-E5F1G8H3', 95, JSON.stringify([]), '正常', '2026-06-09T12:35:00Z');

  const insertBid = database.prepare(`
    INSERT INTO recycle_bids (id, account_id, recycler_name, bid_amount, heat_score, valuation_score, timeliness_score, weight_score, estimated_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  [
    ['bid-001', 'acc-001', '极速回收', 2100, 88, 85, 95, 92, '1小时', '2026-06-09T10:00:00Z'],
    ['bid-002', 'acc-001', '游戏宝回收', 2050, 82, 90, 85, 88, '2小时', '2026-06-09T10:05:00Z'],
    ['bid-003', 'acc-001', '闪电回收王', 2150, 78, 88, 82, 90, '3小时', '2026-06-09T10:08:00Z'],
  ].forEach((row) => insertBid.run(...row));

  const insertClaim = database.prepare(`
    INSERT INTO insurance_claims (id, account_id, policy_id, contract_id, claim_status, claim_amount, auto_triggered, triggered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertClaim.run('ins-001', 'acc-004', 'pol-002', 'rent-001', 'approved', 500, 1, '2026-06-09T12:10:00Z');
  insertClaim.run('ins-002', 'acc-002', 'pol-003', 'trade-001', 'pending', 1680, 0, null);

  const insertAlert = database.prepare(`
    INSERT INTO risk_alerts (id, type, severity, account_id, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  [
    ['alert-001', 'remote_login', 'high', 'acc-004', '异地登录检测：上海到北京，设备指纹未匹配', '2026-06-09T12:12:00Z'],
    ['alert-002', 'brush_order', 'critical', 'acc-002', '同一卖家三天内与七个买家完成交易，刷单图谱命中', '2026-06-09T12:18:00Z'],
    ['alert-003', 'cluster_anomaly', 'high', 'acc-003', '五个关联账号在同一 IP 段集中登录', '2026-06-09T12:25:00Z'],
  ].forEach((row) => insertAlert.run(...row));

  const insertAudit = database.prepare(`
    INSERT INTO audit_flow (id, ref_id, flow_type, description, amount, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  [
    ['aud-001', 'trade-001', 'money', '买家支付并冻结到托管合约', 1680, 'frozen', '2026-06-09T09:31:00Z'],
    ['aud-002', 'trade-001', 'account', '账号权限转入平台托管', null, 'locked', '2026-06-09T09:32:00Z'],
    ['aud-003', 'trade-001', 'contract', '买卖合同双方电子签署', null, 'signed', '2026-06-09T09:33:00Z'],
    ['aud-004', 'rent-001', 'money', '租号押金冻结并等待归还核验', 500, 'deposit_frozen', '2026-06-09T10:08:00Z'],
    ['aud-005', 'rent-001', 'account', '租用设备指纹绑定并启用熔断规则', null, 'risk_guarding', '2026-06-09T10:09:00Z'],
    ['aud-006', 'rent-001', 'contract', '保险履约状态同步到理赔模块', null, 'claim_ready', '2026-06-09T12:10:00Z'],
  ].forEach((row) => insertAudit.run(...row));
}
