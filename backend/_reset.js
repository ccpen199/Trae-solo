const db = require('./src/utils/db');
const tables = [
  'identity_codes', 'certificates', 'agent_operations', 'agent_authorizations',
  'appointments', 'service_items', 'window_resources', 'heat_predictions',
  'operation_logs', 'service_outlets', 'users'
];
for (const t of tables) {
  db.exec(`DROP TABLE IF EXISTS ${t}`);
}
console.log('已清空所有表:', tables.join(', '));
