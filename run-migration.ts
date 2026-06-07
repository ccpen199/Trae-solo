import db from './api/db.ts';

console.log('Running database migration...');

const tables = [
  'departments', 'users', 'enterprises', 'service_items', 'service_applications',
  'policies', 'policy_matches', 'appeals', 'credit_records', 'credit_reports',
  'bidding_projects', 'bidding_applications', 'supply_chain', 'materials',
  'material_reuse_log', 'finance_products', 'finance_applications'
];

for (const tableName of tables) {
  const existing = db.pragma(`table_info(${tableName})`) as any[];
  const existingNames = existing.map(c => c.name);
  
  if (!existingNames.includes('created_at')) {
    try {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN created_at TEXT DEFAULT (datetime('now', 'localtime'))`);
      console.log(`Added created_at to ${tableName}`);
    } catch (e: any) {
      console.log(`${tableName}.created_at: ${e.message}`);
    }
  } else {
    console.log(`${tableName} already has created_at`);
  }

  if (!existingNames.includes('updated_at')) {
    try {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN updated_at TEXT DEFAULT (datetime('now', 'localtime'))`);
      console.log(`Added updated_at to ${tableName}`);
    } catch (e: any) {
      console.log(`${tableName}.updated_at: ${e.message}`);
    }
  }
}

console.log('\nMigration completed!');
