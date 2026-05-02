import { Sequelize } from 'sequelize';
import { env } from '../config';
import fs from 'fs';
import path from 'path';

let sequelize: Sequelize;

if (env.DB_DIALECT === 'sqlite') {
  const dbDir = path.dirname(env.DB_STORAGE);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: env.DB_STORAGE,
    logging: env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
  });
} else {
  sequelize = new Sequelize({
    dialect: 'postgres',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    logging: env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  });
}

export { sequelize };

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log(`数据库连接成功 (${env.DB_DIALECT})`);
    if (env.NODE_ENV !== 'test') {
      await sequelize.sync({ alter: true });
      console.log('数据库同步完成');
    }
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
};

export default sequelize;
