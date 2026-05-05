require('dotenv').config();
const { sequelize, Category, User } = require('../models');

const defaultCategories = [
  { name: '生活', slug: 'life', description: '生活相关资源分享', sortOrder: 1 },
  { name: '新闻', slug: 'news', description: '新闻资讯', sortOrder: 2 },
  { name: '教育', slug: 'education', description: '教育学习资源', sortOrder: 3 },
  { name: '数码', slug: 'digital', description: '数码产品评测分享', sortOrder: 4 },
  { name: '娱乐', slug: 'entertainment', description: '娱乐相关内容', sortOrder: 5 },
  { name: '科技', slug: 'tech', description: '科技前沿资讯', sortOrder: 6 },
];

const migrate = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    console.log('Syncing database models...');
    await sequelize.sync({ force: false, alter: true });
    console.log('Database models synced.');

    console.log('Creating default categories...');
    for (const cat of defaultCategories) {
      const [category, created] = await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: cat,
      });
      if (created) {
        console.log(`Created category: ${cat.name}`);
      } else {
        console.log(`Category already exists: ${cat.name}`);
      }
    }

    console.log('Creating default admin user...');
    const [admin, adminCreated] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        email: 'admin@example.com',
        password: 'Admin123!',
        nickname: '管理员',
        role: 'admin',
        status: 'active',
      },
    });
    if (adminCreated) {
      console.log('Admin user created: admin / Admin123!');
    } else {
      console.log('Admin user already exists.');
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

migrate();
