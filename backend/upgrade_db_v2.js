const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/app.db');
const db = new Database(dbPath);

try {
  // 检查表是否已存在
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('exception_steps', 'customer_feedback', 'attachments')").all();
  const existingTables = tableCheck.map(t => t.name);
  
  if (!existingTables.includes('exception_steps')) {
    // 1. 创建事件处理步骤表 - 记录每一步操作
    db.exec(`
      CREATE TABLE exception_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exception_id INTEGER NOT NULL,
        step_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        operator TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exception_id) REFERENCES exceptions(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ exception_steps 表创建成功');
  } else {
    console.log('○ exception_steps 表已存在');
  }

  if (!existingTables.includes('customer_feedback')) {
    // 2. 创建客户反馈表
    db.exec(`
      CREATE TABLE customer_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exception_id INTEGER NOT NULL,
        feedback_type TEXT NOT NULL,
        content TEXT NOT NULL,
        contact_person TEXT,
        contact_phone TEXT,
        feedback_time DATETIME,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exception_id) REFERENCES exceptions(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ customer_feedback 表创建成功');
  } else {
    console.log('○ customer_feedback 表已存在');
  }

  if (!existingTables.includes('attachments')) {
    // 3. 创建文件附件表
    db.exec(`
      CREATE TABLE attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exception_id INTEGER,
        step_id INTEGER,
        feedback_id INTEGER,
        container_id INTEGER,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        file_type TEXT,
        uploaded_by TEXT NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exception_id) REFERENCES exceptions(id) ON DELETE CASCADE,
        FOREIGN KEY (step_id) REFERENCES exception_steps(id) ON DELETE CASCADE,
        FOREIGN KEY (feedback_id) REFERENCES customer_feedback(id) ON DELETE CASCADE,
        FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ attachments 表创建成功');
  } else {
    console.log('○ attachments 表已存在');
  }

  // 清空现有测试数据，避免重复
  db.exec('DELETE FROM attachments');
  db.exec('DELETE FROM customer_feedback');
  db.exec('DELETE FROM exception_steps');

  // 4. 插入测试数据 - 处理步骤
  const insertStep = db.prepare(`
    INSERT INTO exception_steps (exception_id, step_type, title, description, operator)
    VALUES (?, ?, ?, ?, ?)
  `);

  // 给id=4的异常（破损）添加处理步骤
  insertStep.run(4, 'discovery', '发现问题', '还箱时堆场反馈箱体有轻微划痕，已现场拍照', '操作员A');
  insertStep.run(4, 'contact', '联系车队', '电话联系车队张师傅，约定第二天看现场确认', '操作员A');
  insertStep.run(4, 'verify', '现场确认', '车队派人现场确认，划痕属于正常磨损，无需赔偿', '操作员B');
  insertStep.run(4, 'notify', '通知客户', '已电话告知客户确认结果，客户无异议', '操作员A');
  insertStep.run(4, 'close', '结案', '所有事项处理完毕，异常结案', '主管');
  console.log('✓ 测试处理步骤数据已插入');

  // 5. 插入测试数据 - 客户反馈
  const insertFeedback = db.prepare(`
    INSERT INTO customer_feedback (exception_id, feedback_type, content, contact_person, contact_phone, feedback_time, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertFeedback.run(
    4, 
    'customer_confirm', 
    '客户反馈：确认箱体划痕为正常磨损，无需我们承担费用，感谢跟进。', 
    '李经理', 
    '138****1234', 
    '2026-05-19 14:30:00', 
    '操作员A'
  );
  console.log('✓ 测试客户反馈数据已插入');

  // 6. 插入测试数据 - 文件附件
  const insertAttachment = db.prepare(`
    INSERT INTO attachments (exception_id, step_id, file_name, file_path, file_size, file_type, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertAttachment.run(4, 1, '划痕照片1.jpg', '/uploads/202605/scratch_1.jpg', 1024000, 'image/jpeg', '操作员A');
  insertAttachment.run(4, 1, '划痕照片2.jpg', '/uploads/202605/scratch_2.jpg', 986000, 'image/jpeg', '操作员A');
  insertAttachment.run(4, 3, '现场确认单.pdf', '/uploads/202605/confirm.pdf', 2048000, 'application/pdf', '操作员B');
  console.log('✓ 测试附件数据已插入');

  console.log('\n数据库升级完成！');

} catch (error) {
  console.error('数据库升级失败:', error);
} finally {
  db.close();
}
