import Knex from 'knex';
import knexConfig from './knexfile';
import { config } from '../config';

const environment = config.server.nodeEnv || 'development';
const dbConfig = knexConfig[environment] || knexConfig.development;

const knex = Knex(dbConfig);

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    console.log(`   Environment: ${environment}`);
    console.log(`   Database: ${typeof dbConfig.connection === 'object' ? (dbConfig.connection as any).database : 'N/A'}`);
    
    const [batchNo, log] = await knex.migrate.latest({
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
    });
    
    if (log.length === 0) {
      console.log('✅ Database is already up to date');
    } else {
      console.log(`✅ Migrations completed successfully`);
      console.log(`   Batch: ${batchNo}`);
      console.log(`   Ran ${log.length} migrations:`);
      log.forEach((migration: string, index: number) => {
        console.log(`   ${index + 1}. ${migration}`);
      });
    }
    
    await knex.destroy();
    console.log('🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await knex.destroy();
    process.exit(1);
  }
}

runMigrations();
