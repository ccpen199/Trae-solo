require('ts-node/register');
const { initSeedData } = require('./src/seed/initData.ts');
const { initDatabase } = require('./src/models/schema.ts');

console.log('Initializing database...');
initDatabase();

console.log('Seeding data...');
initSeedData();

console.log('✓ Seed completed!');
