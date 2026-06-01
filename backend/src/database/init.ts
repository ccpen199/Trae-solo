import { initDatabase, seedDatabase } from './index';

async function main() {
  console.log('Initializing database...');
  initDatabase();
  console.log('Database initialized successfully!');

  console.log('\nSeeding database with initial data...');
  seedDatabase();
  console.log('Database seeded successfully!');

  console.log('\nDatabase setup completed!');
  process.exit(0);
}

main().catch((error) => {
  console.error('Database setup failed:', error);
  process.exit(1);
});
