import { initDatabase, db } from './api/db.js';

console.log('Initializing database...');
initDatabase();
console.log('DB initialized successfully');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));

const users = db.prepare('SELECT id, name, id_card, user_type FROM users').all();
console.log('Users count:', users.length);
console.log('Users:', JSON.stringify(users, null, 2));

const orders = db.prepare('SELECT COUNT(*) as cnt FROM payment_orders').get();
console.log('Orders count:', orders.cnt);

const warnings = db.prepare('SELECT COUNT(*) as cnt FROM payment_warnings').get();
console.log('Warnings count:', warnings.cnt);

const family = db.prepare('SELECT COUNT(*) as cnt FROM family_mutual_aid').get();
console.log('Family records:', family.cnt);

const pension = db.prepare('SELECT COUNT(*) as cnt FROM pension_payments').get();
console.log('Pension payments:', pension.cnt);

const audit = db.prepare('SELECT COUNT(*) as cnt FROM audit_rules').get();
console.log('Audit rules:', audit.cnt);

console.log('\nDatabase initialization complete!');
