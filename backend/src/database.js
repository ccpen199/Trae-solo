const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      grade TEXT NOT NULL,
      class TEXT NOT NULL,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS fee_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      amount DECIMAL(10,2) NOT NULL,
      grade TEXT NOT NULL,
      class TEXT,
      due_date DATE NOT NULL,
      status TEXT DEFAULT 'draft',
      created_by INTEGER NOT NULL,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      fee_item_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      parent_id INTEGER NOT NULL,
      original_amount DECIMAL(10,2) NOT NULL,
      discount_amount DECIMAL(10,2) DEFAULT 0,
      final_amount DECIMAL(10,2) NOT NULL,
      paid_amount DECIMAL(10,2) DEFAULT 0,
      status TEXT DEFAULT 'unpaid',
      payment_channel TEXT,
      transaction_id TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fee_item_id) REFERENCES fee_items(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (parent_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payment_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      transaction_id TEXT UNIQUE NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      channel TEXT NOT NULL,
      status TEXT NOT NULL,
      callback_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS discounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fee_item_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      proof_material TEXT,
      amount DECIMAL(10,2) NOT NULL,
      applicant_id INTEGER NOT NULL,
      approver_id INTEGER,
      status TEXT DEFAULT 'pending',
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fee_item_id) REFERENCES fee_items(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (applicant_id) REFERENCES users(id),
      FOREIGN KEY (approver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      reason TEXT NOT NULL,
      applicant_id INTEGER NOT NULL,
      approver_id INTEGER,
      status TEXT DEFAULT 'pending',
      transaction_id TEXT,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (applicant_id) REFERENCES users(id),
      FOREIGN KEY (approver_id) REFERENCES users(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const insertUser = db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)');
    
    insertUser.run('finance', bcrypt.hashSync('finance123', 10), 'finance', '财务管理员');
    insertUser.run('teacher1', bcrypt.hashSync('teacher123', 10), 'teacher', '张老师');
    insertUser.run('parent1', bcrypt.hashSync('parent123', 10), 'parent', '王家长');
    insertUser.run('parent2', bcrypt.hashSync('parent123', 10), 'parent', '李家长');

    const insertStudent = db.prepare('INSERT INTO students (student_no, name, grade, class, parent_id) VALUES (?, ?, ?, ?, ?)');
    insertStudent.run('S001', '王小明', '一年级', '1班', 3);
    insertStudent.run('S002', '李小华', '一年级', '1班', 4);
    insertStudent.run('S003', '张小强', '一年级', '2班', null);

    const insertFeeItem = db.prepare(`
      INSERT INTO fee_items (name, description, amount, grade, class, due_date, status, created_by, reviewed_by, reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, 'published', 1, 1, CURRENT_TIMESTAMP)
    `);
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    
    insertFeeItem.run('2024年春季学费', '一年级春季学期学费', 5000.00, '一年级', '', dueDateStr);
    insertFeeItem.run('校服费', '春秋季校服一套', 380.00, '一年级', '1班', dueDateStr);
    insertFeeItem.run('午餐费', '5月份午餐费', 400.00, '一年级', '', dueDateStr);

    const { v4: uuidv4 } = require('uuid');
    const feeItems = db.prepare('SELECT * FROM fee_items').all();
    const students = db.prepare('SELECT * FROM students WHERE parent_id IS NOT NULL').all();
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_no, fee_item_id, student_id, parent_id, original_amount, final_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 'unpaid')
    `);
    
    for (const feeItem of feeItems) {
      for (const student of students) {
        if (student.grade === feeItem.grade && (!feeItem.class || student.class === feeItem.class)) {
          insertOrder.run(
            uuidv4().substring(0, 8).toUpperCase(),
            feeItem.id,
            student.id,
            student.parent_id,
            feeItem.amount,
            feeItem.amount
          );
        }
      }
    }
  }
}

module.exports = { db, initDatabase };
