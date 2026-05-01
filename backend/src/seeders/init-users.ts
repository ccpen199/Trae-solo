import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums';

const DEFAULT_USERS = [
  {
    username: 'admin',
    email: 'admin@cms.local',
    password: 'Admin@123',
    role: UserRole.ADMIN,
    displayName: '系统管理员',
    department: '技术部',
  },
  {
    username: 'chief_editor',
    email: 'chief@cms.local',
    password: 'Chief@123',
    role: UserRole.CHIEF_EDITOR,
    displayName: '张主编',
    department: '内容部',
  },
  {
    username: 'editor_zhang',
    email: 'zhang@cms.local',
    password: 'Editor@123',
    role: UserRole.EDITOR,
    displayName: '李编辑',
    department: '内容部',
  },
  {
    username: 'operator_wang',
    email: 'wang@cms.local',
    password: 'Operator@123',
    role: UserRole.CHANNEL_OPERATOR,
    displayName: '王运营',
    department: '运营部',
  },
  {
    username: 'analyst_liu',
    email: 'liu@cms.local',
    password: 'Analyst@123',
    role: UserRole.DATA_ANALYST,
    displayName: '刘分析师',
    department: '数据分析部',
  },
];

async function bootstrap() {
  console.log('🚀 Initializing database with default users...');

  const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '15432'),
    username: process.env.DB_USER || 'cms_admin',
    password: process.env.DB_PASSWORD || 'CMS_Admin_2024_Secure',
    database: process.env.DB_NAME || 'cms_platform',
    entities: [User],
    synchronize: true,
    logging: false,
  });

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    const userRepository = AppDataSource.getRepository(User);

    for (const userData of DEFAULT_USERS) {
      const existingUser = await userRepository.findOne({
        where: [{ username: userData.username }, { email: userData.email }],
      });

      if (existingUser) {
        console.log(`⏭️  User "${userData.username}" already exists, skipping`);
        continue;
      }

      const passwordHash = await bcrypt.hash(userData.password, 10);

      const user = userRepository.create({
        id: uuidv4(),
        username: userData.username,
        email: userData.email,
        passwordHash,
        role: userData.role,
        displayName: userData.displayName,
        department: userData.department,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await userRepository.save(user);
      console.log(`✅ Created user: ${userData.username} (${userData.role})`);
    }

    console.log('');
    console.log('========================================');
    console.log('   DEFAULT ACCOUNTS CREATED');
    console.log('========================================');
    console.log('');
    console.log('📋 Available Accounts:');
    console.log('');
    for (const userData of DEFAULT_USERS) {
      console.log(`  👤 ${userData.displayName} (${userData.role})`);
      console.log(`     Username: ${userData.username}`);
      console.log(`     Email: ${userData.email}`);
      console.log(`     Password: ${userData.password}`);
      console.log('');
    }
    console.log('========================================');
    console.log('⚠️  Please change passwords after first login!');
    console.log('========================================');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

bootstrap();
