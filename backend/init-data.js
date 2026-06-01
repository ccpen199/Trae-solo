const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

const dueDate = new Date();
dueDate.setMonth(dueDate.getMonth() + 1);
const dueDateStr = dueDate.toISOString().split('T')[0];

const feeItemCount = db.prepare('SELECT COUNT(*) as c FROM fee_items').get().c;

if (feeItemCount === 0) {
  console.log('正在插入示例收费项目和订单数据...');

  const insertFeeItem = db.prepare(`
    INSERT INTO fee_items (name, description, amount, grade, class, due_date, status, created_by, reviewed_by, reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?, 'published', 1, 1, CURRENT_TIMESTAMP)
  `);

  insertFeeItem.run('2024年春季学费', '一年级春季学期学费', 5000.00, '一年级', '', dueDateStr);
  insertFeeItem.run('校服费', '春秋季校服一套', 380.00, '一年级', '1班', dueDateStr);
  insertFeeItem.run('午餐费', '5月份午餐费', 400.00, '一年级', '', dueDateStr);

  const feeItems = db.prepare('SELECT * FROM fee_items').all();
  const students = db.prepare('SELECT * FROM students WHERE parent_id IS NOT NULL').all();
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_no, fee_item_id, student_id, parent_id, original_amount, final_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, 'unpaid')
  `);

  let orderCount = 0;
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
        orderCount++;
      }
    }
  }
  console.log(`已添加 ${feeItems.length} 个收费项目，${orderCount} 个订单`);
} else {
  console.log('收费项目已存在，跳过初始化');
}

console.log('\n当前收费项目:');
console.log(db.prepare('SELECT * FROM fee_items').all());
console.log('\n当前订单数:', db.prepare('SELECT COUNT(*) as c FROM orders').get().c);

db.close();
