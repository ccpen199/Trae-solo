import Knex from 'knex';
import knexConfig from './knexfile';
import { config } from '../config';

const environment = config.server.nodeEnv || 'development';
const dbConfig = knexConfig[environment] || knexConfig.development;

const knex = Knex(dbConfig);

async function runSeeds() {
  try {
    console.log('🌱 Running database seeds...');
    console.log(`   Environment: ${environment}`);
    console.log(`   Database: ${typeof dbConfig.connection === 'object' ? (dbConfig.connection as any).database : 'N/A'}`);
    
    await knex.seed.run({
      directory: './src/database/seeds',
    });
    
    console.log('✅ Seeds completed successfully');
    console.log('');
    console.log('📋 Default Accounts:');
    console.log('');
    console.log('   👤 Admin:');
    console.log('      Username: admin');
    console.log('      Password: Emr@2024Secure');
    console.log('      Role: 系统管理员');
    console.log('');
    console.log('   👨‍⚕️ Doctor:');
    console.log('      Username: doctor1');
    console.log('      Password: Emr@2024Secure');
    console.log('      Role: 医生');
    console.log('      Department: 内科');
    console.log('');
    console.log('   👩‍⚕️ Nurse:');
    console.log('      Username: nurse1');
    console.log('      Password: Emr@2024Secure');
    console.log('      Role: 护士');
    console.log('      Department: 内科');
    console.log('');
    console.log('   💊 Pharmacist:');
    console.log('      Username: pharmacist1');
    console.log('      Password: Emr@2024Secure');
    console.log('      Role: 药师');
    console.log('      Department: 药房');
    console.log('');
    
    await knex.destroy();
    console.log('🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await knex.destroy();
    process.exit(1);
  }
}

runSeeds();
