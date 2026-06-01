const db = require('../db');

const migrateDatabase = () => {
  db.exec(`
    ALTER TABLE agents ADD COLUMN IF NOT EXISTS employee_id TEXT;
    ALTER TABLE agents ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE agents ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE agents ADD COLUMN IF NOT EXISTS updated_at TEXT DEFAULT CURRENT_TIMESTAMP;
    
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low';
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TEXT DEFAULT CURRENT_TIMESTAMP;
    
    ALTER TABLE policies ADD COLUMN IF NOT EXISTS payment_cycle TEXT DEFAULT '年交';
    ALTER TABLE policies ADD COLUMN IF NOT EXISTS effective_date TEXT;
    ALTER TABLE policies ADD COLUMN IF NOT EXISTS next_renewal_date TEXT;
    ALTER TABLE policies RENAME COLUMN premium_amount TO premium;
  `);
  console.log('数据库迁移完成');
};

if (require.main === module) {
  try {
    migrateDatabase();
  } catch (e) {
    console.log('迁移跳过或完成:', e.message);
  }
  db.close();
}

module.exports = { migrateDatabase };
