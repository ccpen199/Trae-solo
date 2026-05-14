require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const sequelize = require('./config/database');
const { Category, User, Article, Question, Answer, Comment, Follow, Like, Favorite, Notification, Draft } = require('./models');

const authRoutes = require('./routes/auth');
const articlesRoutes = require('./routes/articles');
const questionsRoutes = require('./routes/questions');
const usersRoutes = require('./routes/users');
const commentsRoutes = require('./routes/comments');
const notificationsRoutes = require('./routes/notifications');
const categoriesRoutes = require('./routes/categories');
const draftsRoutes = require('./routes/drafts');
const searchRoutes = require('./routes/search');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 12730;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:12731';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:12731'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/drafts', draftsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'PMCAFF API is running' });
});

app.get('/', (req, res) => {
  res.json({ success: true, message: 'PMCAFF Product Manager Knowledge Community API' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

async function seedDatabase() {
  try {
    const existingCategories = await Category.count();
    if (existingCategories === 0) {
      await Category.bulkCreate([
        { name: '产品分析', slug: 'product-analysis', description: '产品功能、体验、商业模式分析', sort: 1 },
        { name: '需求分析', slug: 'requirements', description: '需求挖掘、用户研究、场景分析', sort: 2 },
        { name: '产品设计', slug: 'product-design', description: '交互设计、信息架构、原型设计', sort: 3 },
        { name: '产品运营', slug: 'product-operations', description: '用户运营、活动运营、数据运营', sort: 4 },
        { name: '行业资讯', slug: 'industry-news', description: '互联网、科技、产品行业动态', sort: 5 },
        { name: '职业发展', slug: 'career', description: '产品经理求职、面试、成长', sort: 6 },
        { name: '工具方法', slug: 'tools', description: '产品工具、方法论、工作流程', sort: 7 },
        { name: '问答讨论', slug: 'qa', description: '产品相关问题讨论和解答', sort: 8 }
      ]);
      console.log('Categories seeded successfully');
    }

    const existingUsers = await User.count();
    if (existingUsers === 0) {
      const admin = await User.create({
        username: 'admin',
        email: 'admin@pmcaff.com',
        password: 'admin123',
        nickname: '系统管理员',
        role: 'admin',
        bio: 'PMCAFF 产品经理知识社区管理员'
      });

      const testUser = await User.create({
        username: 'testuser',
        email: 'test@pmcaff.com',
        password: 'test1234',
        nickname: '测试用户',
        role: 'user',
        bio: '热爱产品的产品经理'
      });

      const categories = await Category.findAll();
      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.slug] = cat.id;
      });

      const art1 = await Article.create({
        title: '如何从零开始设计一款产品',
        content: `<h2>产品设计的基本流程</h2><p>产品设计是一个系统化的过程，需要从用户需求出发，经过多个阶段的迭代优化。</p><h3>1. 需求分析阶段</h3><p>在开始设计之前，我们需要深入了解用户的真实需求。这包括：</p><ul><li>用户调研和访谈</li><li>竞品分析</li><li>市场趋势研究</li></ul><h3>2. 功能规划阶段</h3><p>根据需求分析结果，规划产品的核心功能模块。</p>`,
        summary: '本文详细介绍了产品设计的完整流程，从需求分析到原型设计再到最终上线。',
        tags: '产品设计,需求分析,产品经理',
        categoryId: categoryMap['product-design'],
        status: 'published',
        isFeatured: true,
        authorId: admin.id,
        viewsCount: 1250,
        likesCount: 86,
        commentsCount: 12
      });

      const art2 = await Article.create({
        title: '产品经理必备的数据分析能力',
        content: `<h2>数据分析的重要性</h2><p>在数据驱动决策的今天，产品经理必须掌握数据分析能力。</p><h3>核心指标体系</h3><p>建立清晰的指标体系是数据分析的基础。</p>`,
        summary: '探讨产品经理如何建立数据分析思维，掌握核心指标体系。',
        tags: '数据分析,产品运营,指标体系',
        categoryId: categoryMap['product-operations'],
        status: 'published',
        isFeatured: false,
        authorId: admin.id,
        viewsCount: 890,
        likesCount: 45,
        commentsCount: 8
      });

      const art3 = await Article.create({
        title: '用户增长：从0到100万的产品实践',
        content: `<h2>用户增长的核心逻辑</h2><p>用户增长是产品成功的关键指标之一。</p>`,
        summary: '分享用户增长的实战经验，包括AARRR模型的应用。',
        tags: '用户增长,AARRR,产品运营',
        categoryId: categoryMap['product-operations'],
        status: 'published',
        authorId: testUser.id,
        viewsCount: 560,
        likesCount: 32,
        commentsCount: 5
      });

      const q1 = await Question.create({
        title: '如何判断一个需求是否真正有价值？',
        content: '在工作中经常会遇到各种需求，有些来自老板，有些来自运营，有些来自用户反馈。想请教大家，如何系统地判断一个需求是否真正有价值？应该从哪些维度来评估？',
        tags: '需求分析,产品思维',
        categoryId: categoryMap['requirements'],
        authorId: testUser.id,
        status: 'open',
        viewsCount: 320,
        likesCount: 15,
        answersCount: 3
      });

      const q2 = await Question.create({
        title: '产品新人如何快速上手B端产品？',
        content: '刚转岗做B端产品，感觉和C端差异很大。想请教各位前辈，B端产品经理需要掌握哪些核心能力？有什么推荐的学习路径？',
        tags: 'B端产品,产品新人,职业发展',
        categoryId: categoryMap['career'],
        authorId: testUser.id,
        status: 'open',
        viewsCount: 450,
        likesCount: 28,
        answersCount: 6
      });

      const q3 = await Question.create({
        title: '竞品分析报告应该包含哪些内容？',
        content: '领导让写一份竞品分析报告，之前没写过。想知道一份标准的竞品分析报告应该包含哪些模块？重点关注哪些方面？',
        tags: '竞品分析,工具方法',
        categoryId: categoryMap['tools'],
        authorId: admin.id,
        status: 'open',
        viewsCount: 280,
        likesCount: 12,
        answersCount: 2
      });

      console.log('Seed data created successfully');
      console.log('Admin account: admin / admin123');
      console.log('Test account: testuser / test1234');
    }
  } catch (error) {
    console.error('Seeding error:', error);
  }
}

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');
    
    await seedDatabase();
    
    app.listen(PORT, () => {
      console.log(`PMCAFF Backend Server running on port ${PORT}`);
      console.log(`API endpoint: http://localhost:${PORT}/api`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
