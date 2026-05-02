import Knex from 'knex';
import knexConfig from './knexfile';
import { config } from '../config';
import { initializeDatabase } from './sqlite-init';

const environment = config.server.nodeEnv || 'development';
const isSqlite = config.database.type === 'sqlite';

let knexInstance: Knex.Knex | null = null;
let initializationPromise: Promise<Knex.Knex> | null = null;

export async function initKnex(): Promise<Knex.Knex> {
  if (knexInstance) {
    return knexInstance;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    if (isSqlite) {
      console.log('📦 Using SQLite database');
      knexInstance = await initializeDatabase();
    } else {
      console.log('📦 Using PostgreSQL database');
      const dbConfig = knexConfig[environment] || knexConfig.development;
      knexInstance = Knex(dbConfig);
    }
    return knexInstance;
  })();

  return initializationPromise;
}

export const getKnex = (): Knex.Knex => {
  if (!knexInstance) {
    throw new Error('Knex not initialized. Call initKnex first.');
  }
  return knexInstance;
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    if (!knexInstance) {
      await initKnex();
    }
    
    if (isSqlite) {
      const result = await knexInstance!.raw('SELECT 1 as test');
      console.log('✅ SQLite Database connection successful');
    } else {
      await knexInstance!.raw('SELECT 1');
      console.log('✅ PostgreSQL Database connection successful');
    }
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

export const closeDatabaseConnection = async (): Promise<void> => {
  if (knexInstance) {
    await knexInstance.destroy();
    console.log('🔌 Database connection closed');
    knexInstance = null;
  }
};

const knexProxy: Knex.Knex = new Proxy(function() {} as any, {
  get(_target, prop) {
    if (!knexInstance) {
      throw new Error(`Knex not initialized when accessing ${String(prop)}. Call initKnex first.`);
    }
    return (knexInstance as any)[prop];
  },
  apply(_target, _thisArg, args) {
    if (!knexInstance) {
      throw new Error('Knex not initialized when called as function. Call initKnex first.');
    }
    return (knexInstance as any)(...args);
  },
});

export const knex = knexProxy;

export default knex;
