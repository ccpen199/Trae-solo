export const createTablesSQL = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`,
  
  `CREATE TABLE IF NOT EXISTS asset_masters (
    id TEXT PRIMARY KEY,
    masterNo TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    currentHandlerId TEXT NOT NULL,
    currentHandlerRole TEXT NOT NULL,
    expectedCompleteTime TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    createdBy TEXT NOT NULL,
    version INTEGER DEFAULT 1
  )`,
  
  `CREATE TABLE IF NOT EXISTS asset_details (
    id TEXT PRIMARY KEY,
    masterId TEXT NOT NULL,
    assetCode TEXT UNIQUE NOT NULL,
    assetName TEXT NOT NULL,
    assetType TEXT NOT NULL,
    spec TEXT,
    unit TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unitPrice REAL NOT NULL DEFAULT 0,
    totalPrice REAL NOT NULL DEFAULT 0,
    purchaseDate TEXT,
    supplier TEXT,
    location TEXT,
    department TEXT,
    managerId TEXT,
    useLife INTEGER NOT NULL DEFAULT 36,
    residualValueRate REAL NOT NULL DEFAULT 0.05,
    depreciationMethod TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
    qrCodeId TEXT,
    status TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (masterId) REFERENCES asset_masters(id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS qr_codes (
    id TEXT PRIMARY KEY,
    assetDetailId TEXT NOT NULL,
    qrCode TEXT UNIQUE NOT NULL,
    qrContent TEXT NOT NULL,
    generatedAt TEXT NOT NULL,
    scannedCount INTEGER DEFAULT 0,
    lastScannedAt TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (assetDetailId) REFERENCES asset_details(id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS depreciation_records (
    id TEXT PRIMARY KEY,
    assetDetailId TEXT NOT NULL,
    period TEXT NOT NULL,
    originalValue REAL NOT NULL,
    accumulatedDepreciation REAL NOT NULL DEFAULT 0,
    netValue REAL NOT NULL,
    depreciationAmount REAL NOT NULL,
    depreciationMethod TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    approvedBy TEXT,
    approvedAt TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (assetDetailId) REFERENCES asset_details(id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS inventory_records (
    id TEXT PRIMARY KEY,
    masterId TEXT NOT NULL,
    assetDetailId TEXT NOT NULL,
    inventoryDate TEXT NOT NULL,
    inventoryResult TEXT NOT NULL DEFAULT 'NORMAL',
    inventoryBy TEXT NOT NULL,
    qrScanned INTEGER DEFAULT 0,
    actualQuantity INTEGER NOT NULL,
    systemQuantity INTEGER NOT NULL,
    difference INTEGER NOT NULL DEFAULT 0,
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    createdAt TEXT NOT NULL,
    FOREIGN KEY (masterId) REFERENCES asset_masters(id),
    FOREIGN KEY (assetDetailId) REFERENCES asset_details(id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS transfer_records (
    id TEXT PRIMARY KEY,
    masterId TEXT NOT NULL,
    assetDetailId TEXT NOT NULL,
    fromDepartment TEXT NOT NULL,
    fromManagerId TEXT NOT NULL,
    toDepartment TEXT NOT NULL,
    toManagerId TEXT NOT NULL,
    transferReason TEXT,
    transferDate TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    approvedBy TEXT,
    approvedAt TEXT,
    createdAt TEXT NOT NULL,
    lockVersion INTEGER DEFAULT 0,
    FOREIGN KEY (masterId) REFERENCES asset_masters(id),
    FOREIGN KEY (assetDetailId) REFERENCES asset_details(id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS scrap_records (
    id TEXT PRIMARY KEY,
    masterId TEXT NOT NULL,
    assetDetailId TEXT NOT NULL,
    scrapReason TEXT NOT NULL,
    scrapDate TEXT,
    scrapValue REAL DEFAULT 0,
    approvalStatus TEXT NOT NULL DEFAULT 'PENDING',
    approvedBy TEXT,
    approvedAt TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (masterId) REFERENCES asset_masters(id),
    FOREIGN KEY (assetDetailId) REFERENCES asset_details(id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    masterId TEXT NOT NULL,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'TODO',
    status TEXT NOT NULL DEFAULT 'UNREAD',
    relatedType TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (masterId) REFERENCES asset_masters(id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS operation_logs (
    id TEXT PRIMARY KEY,
    masterId TEXT,
    assetDetailId TEXT,
    userId TEXT NOT NULL,
    action TEXT NOT NULL,
    previousStatus TEXT,
    newStatus TEXT,
    remarks TEXT,
    ip TEXT,
    userAgent TEXT,
    createdAt TEXT NOT NULL
  )`,
  
  `CREATE TABLE IF NOT EXISTS timeline_records (
    id TEXT PRIMARY KEY,
    masterId TEXT NOT NULL,
    assetDetailId TEXT,
    userId TEXT NOT NULL,
    userName TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT,
    approvalAction TEXT,
    remarks TEXT,
    attachments TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (masterId) REFERENCES asset_masters(id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    masterId TEXT,
    assetDetailId TEXT,
    fileName TEXT NOT NULL,
    fileType TEXT NOT NULL,
    fileSize INTEGER NOT NULL,
    fileUrl TEXT NOT NULL,
    uploadedBy TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`,
  
  `CREATE INDEX IF NOT EXISTS idx_asset_masters_status ON asset_masters(status)`,
  `CREATE INDEX IF NOT EXISTS idx_asset_masters_currentHandler ON asset_masters(currentHandlerId)`,
  `CREATE INDEX IF NOT EXISTS idx_asset_details_master ON asset_details(masterId)`,
  `CREATE INDEX IF NOT EXISTS idx_asset_details_qr ON asset_details(qrCodeId)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(userId)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status)`,
  `CREATE INDEX IF NOT EXISTS idx_timeline_master ON timeline_records(masterId)`,
  `CREATE INDEX IF NOT EXISTS idx_operation_logs_master ON operation_logs(masterId)`,
  `CREATE INDEX IF NOT EXISTS idx_transfer_lock ON transfer_records(lockVersion)`
];

export const initDataSQL = [
  `INSERT OR IGNORE INTO users (id, username, password, name, role, department, createdAt, updatedAt) VALUES
  ('user-001', 'admin', '$2a$10$NA8wyfWJUHDw2cPM4ikabO7bzcR30iPR2gNsat8kmt4RPtX.rfxv2', '张管理员', 'ASSET_ADMIN', '资产管理部', datetime('now'), datetime('now')),
  ('user-002', 'dept_user', '$2a$10$NA8wyfWJUHDw2cPM4ikabO7bzcR30iPR2gNsat8kmt4RPtX.rfxv2', '李部门', 'DEPARTMENT_USER', '技术部', datetime('now'), datetime('now')),
  ('user-003', 'finance', '$2a$10$NA8wyfWJUHDw2cPM4ikabO7bzcR30iPR2gNsat8kmt4RPtX.rfxv2', '王财务', 'FINANCE', '财务部', datetime('now'), datetime('now')),
  ('user-004', 'audit', '$2a$10$NA8wyfWJUHDw2cPM4ikabO7bzcR30iPR2gNsat8kmt4RPtX.rfxv2', '赵审计', 'AUDIT', '审计部', datetime('now'), datetime('now')),
  ('user-005', 'maintenance', '$2a$10$NA8wyfWJUHDw2cPM4ikabO7bzcR30iPR2gNsat8kmt4RPtX.rfxv2', '钱维修', 'MAINTENANCE', '维修部', datetime('now'), datetime('now'))`
];
