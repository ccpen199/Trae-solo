const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/app.db');
const db = new Database(dbPath);

try {
  // 创建容器表
  db.exec(`
    CREATE TABLE IF NOT EXISTS containers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_number TEXT UNIQUE NOT NULL,
      booking_number TEXT,
      bill_of_lading TEXT,
      container_type TEXT,
      seal_number TEXT,
      shipper TEXT,
      origin_port TEXT,
      destination_port TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ containers 表创建成功');

  // 创建节点表
  db.exec(`
    CREATE TABLE IF NOT EXISTS container_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_id INTEGER NOT NULL,
      node_type TEXT NOT NULL,
      node_time DATETIME NOT NULL,
      source TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ container_nodes 表创建成功');

  // 创建异常表
  db.exec(`
    CREATE TABLE IF NOT EXISTS exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_id INTEGER NOT NULL,
      exception_type TEXT NOT NULL,
      description TEXT,
      responsible_party TEXT,
      action_taken TEXT,
      status TEXT DEFAULT 'open',
      reported_at DATETIME,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ exceptions 表创建成功');

  console.log('\n数据库表结构初始化完成！');

} catch (error) {
  console.error('数据库初始化失败:', error);
} finally {
  db.close();
}
