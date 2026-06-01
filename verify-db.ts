import { db, initDatabase } from './api/db/index.js';

console.log('Initializing database...');
initDatabase();
console.log('Database initialized successfully!');

console.log('\nChecking tables...');
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`).all() as { name: string }[];

console.log('Tables created:');
tables.forEach(t => console.log(`  - ${t.name}`));

const expectedTables = [
  'appointments',
  'audit_logs',
  'departments',
  'doctors',
  'institutions',
  'schedules',
  'settlements'
];

const missingTables = expectedTables.filter(t => !tables.some(et => et.name === t));
if (missingTables.length > 0) {
  console.log('\nMissing tables:', missingTables);
  process.exit(1);
}

console.log('\nChecking indexes...');
const indexes = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='index' AND name LIKE 'idx_%'
  ORDER BY name
`).all() as { name: string }[];

console.log('Indexes created:');
indexes.forEach(i => console.log(`  - ${i.name}`));

const expectedIndexes = [
  'idx_appointments_schedule',
  'idx_schedules_doctor_date',
  'idx_schedules_institution_date'
];

const missingIndexes = expectedIndexes.filter(i => !indexes.some(ei => ei.name === i));
if (missingIndexes.length > 0) {
  console.log('\nMissing indexes:', missingIndexes);
  process.exit(1);
}

console.log('\n✅ Database verification passed!');
db.close();
