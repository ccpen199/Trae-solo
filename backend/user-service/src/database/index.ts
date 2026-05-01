import { Sequelize } from 'sequelize';
import { config } from '../config';
import { logger } from '../utils/logger';

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: config.database.pool,
    define: {
      timestamps: true,
      paranoid: true,
      underscored: true,
      freezeTableName: true,
    },
  }
);

export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
};

export const syncDatabase = async (): Promise<void> => {
  try {
    await sequelize.sync({ alter: config.nodeEnv === 'development' });
    logger.info('Database synchronized successfully');
  } catch (error) {
    logger.error('Failed to synchronize database', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

export { sequelize };
