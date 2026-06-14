import { initDatabase, db, query } from './db.js';

console.log('=== Starting Database Initialization ===\n');

try {
  initDatabase();

  console.log('\n=== Verifying Database ===\n');

  const tables = query<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  console.log('Tables created:');
  tables.forEach((t) => console.log(`  - ${t.name}`));

  console.log('\n--- Users ---');
  const users = query('SELECT id, name, id_card, user_type, status FROM users');
  console.table(users);

  console.log('\n--- Insurance Info ---');
  const insurance = query('SELECT * FROM insurance_info');
  console.table(insurance);

  console.log('\n--- Pension Payments (User 1) ---');
  const pensions = query(
    'SELECT pay_month, amount, bank_name, status FROM pension_payments WHERE user_id = 1 ORDER BY pay_month',
  );
  console.table(pensions);

  console.log('\n--- Payment Orders (User 1) ---');
  const orders = query(
    'SELECT order_no, insurance_type, pay_year, amount, channel, status FROM payment_orders WHERE user_id = 1 ORDER BY created_at',
  );
  console.table(orders);

  console.log('\n--- Payment Warnings ---');
  const warnings = query(
    'SELECT id, user_id, warning_type, severity, status FROM payment_warnings',
  );
  console.table(warnings);

  console.log('\n--- Family Mutual Aid ---');
  const family = query('SELECT * FROM family_mutual_aid');
  console.table(family);

  console.log('\n--- Audit Rules ---');
  const rules = query('SELECT rule_code, rule_name, risk_level, enabled FROM audit_rules');
  console.table(rules);

  console.log('\n--- Schema Migrations ---');
  const migrations = query('SELECT * FROM schema_migrations');
  console.table(migrations);

  console.log('\n=== Database Initialization Successful! ===');
} catch (error) {
  console.error('\n=== Database Initialization Failed! ===');
  console.error(error);
  process.exit(1);
} finally {
  db.close();
}
