const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

class Database {
  constructor(db) {
    this.db = db;
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  prepare(sql) {
    const stmt = this.db.prepare(sql);
    return {
      run: (...params) => {
        return new Promise((resolve, reject) => {
          stmt.run(...params, function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes, lastID: this.lastID });
          });
        });
      },
      get: (...params) => {
        return new Promise((resolve, reject) => {
          stmt.get(...params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      },
      all: (...params) => {
        return new Promise((resolve, reject) => {
          stmt.all(...params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      }
    };
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

const dbWrapper = new Database(db);

const initDb = async () => {
  const tables = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      bio TEXT,
      role TEXT DEFAULT 'user',
      status INTEGER DEFAULT 1,
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      category_id INTEGER,
      tags TEXT,
      views INTEGER DEFAULT 0,
      answers_count INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      is_recommended INTEGER DEFAULT 0,
      sort_weight INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      summary TEXT,
      cover TEXT,
      tags TEXT,
      category_id INTEGER,
      views INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      is_recommended INTEGER DEFAULT 0,
      sort_weight INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      is_accepted INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      parent_id INTEGER DEFAULT 0,
      reply_to_user_id INTEGER,
      likes_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at INTEGER,
      UNIQUE(follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at INTEGER,
      UNIQUE(user_id, target_type, target_id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at INTEGER,
      UNIQUE(user_id, target_type, target_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      from_user_id INTEGER,
      target_type TEXT,
      target_id INTEGER,
      title TEXT,
      content TEXT,
      is_read INTEGER DEFAULT 0,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      reason TEXT,
      status INTEGER DEFAULT 0,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      position TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      title TEXT,
      cover TEXT,
      sort_weight INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      start_time INTEGER,
      end_time INTEGER,
      created_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
    CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id);
    CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
    CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
    CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
    CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
    CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
    CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
  `;

  await dbWrapper.exec(tables);

  const now = Date.now();
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@pmcaff.com';
  const adminPassword = require('bcryptjs').hashSync(process.env.ADMIN_PASSWORD || 'admin123456', 10);
  
  const adminExists = await dbWrapper.get('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!adminExists) {
    await dbWrapper.run(`
      INSERT INTO users (username, email, password, nickname, avatar, bio, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'admin', adminEmail, adminPassword, '平台管理员',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20admin%20avatar&image_size=square',
      'PMcaff 平台管理员，负责内容审核和社区运营。', 'admin', 1, now, now
    ]);
  }

  const categories = [
    { name: '产品设计', description: '产品原型、交互设计、用户体验等', sort: 1 },
    { name: '需求分析', description: '需求挖掘、用户调研、竞品分析等', sort: 2 },
    { name: '产品运营', description: '用户增长、活动策划、数据分析等', sort: 3 },
    { name: '职业发展', description: '求职、面试、职业规划等', sort: 4 },
    { name: '行业资讯', description: '互联网动态、产品热点、趋势分析等', sort: 5 }
  ];

  const categoryCount = await dbWrapper.get('SELECT COUNT(*) as count FROM categories');
  const catIds = {};
  if (categoryCount.count === 0) {
    for (const cat of categories) {
      const result = await dbWrapper.run('INSERT INTO categories (name, description, sort, status, created_at) VALUES (?, ?, ?, ?, ?)', 
        [cat.name, cat.description, cat.sort, 1, now]);
      catIds[cat.name] = result.lastID;
    }
  } else {
    const cats = await dbWrapper.all('SELECT id, name FROM categories');
    cats.forEach(c => catIds[c.name] = c.id);
  }

  const questionCount = await dbWrapper.get('SELECT COUNT(*) as count FROM questions');
  if (questionCount.count === 0) {
    const sampleQuestions = [
      {
        title: '产品经理如何做好需求优先级排序？',
        content: '在日常工作中，我们经常会遇到各种各样的需求，如何做好需求的优先级排序是每个产品经理都需要掌握的核心技能。大家有什么好的方法和经验可以分享吗？',
        categoryId: catIds['需求分析'],
        tags: '需求,优先级,产品技能'
      },
      {
        title: 'B端产品与C端产品的设计差异有哪些？',
        content: '刚从C端产品转到B端产品，发现两者的设计思路有很大不同。想请教一下大家，B端产品设计需要特别注意哪些方面？如何平衡业务需求和用户体验？',
        categoryId: catIds['产品设计'],
        tags: 'B端,设计差异,用户体验'
      },
      {
        title: '产品新人如何快速提升数据分析能力？',
        content: '作为一名产品新人，感觉数据分析能力很重要但又不知道从何入手。大家有什么好的学习路径和方法推荐吗？有哪些必学的工具和指标？',
        categoryId: catIds['职业发展'],
        tags: '新人,数据分析,学习路径'
      },
      {
        title: '用户增长的核心策略有哪些？',
        content: '产品进入成长期，用户增长成为核心目标。除了常规的拉新、促活、留存，还有哪些创新的增长策略可以尝试？大家有什么成功的案例可以分享吗？',
        categoryId: catIds['产品运营'],
        tags: '用户增长,运营策略,案例分享'
      },
      {
        title: '2024年AI产品发展趋势如何？',
        content: 'AI技术发展迅猛，大家对2024年AI产品的发展趋势有什么看法？哪些领域会有突破性机会？产品经理如何在AI浪潮中找到自己的定位？',
        categoryId: catIds['行业资讯'],
        tags: 'AI,趋势,产品机会'
      }
    ];

    for (const q of sampleQuestions) {
      await dbWrapper.run(
        'INSERT INTO questions (user_id, title, content, category_id, tags, views, answers_count, likes_count, status, is_recommended, sort_weight, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [1, q.title, q.content, q.categoryId, q.tags, Math.floor(Math.random() * 500) + 100, 0, Math.floor(Math.random() * 50) + 5, 1, Math.random() > 0.5 ? 1 : 0, 0, now, now]
      );
    }
  }

  const articleCount = await dbWrapper.get('SELECT COUNT(*) as count FROM articles');
  if (articleCount.count === 0) {
    const sampleArticles = [
      {
        title: '产品经理必备的10个思维模型',
        summary: '本文总结了产品经理日常工作中最常用的10个思维模型，包括用户旅程地图、AARRR模型、RICE评分法等，帮助你建立系统化的产品思维。',
        content: '产品经理的核心竞争力在于思维方式。本文将详细介绍10个必备的思维模型：\n\n1. 用户旅程地图 - 理解用户完整体验\n2. AARRR模型 - 增长黑客的核心框架\n3. RICE评分法 - 科学的需求优先级排序\n4. 用户分群 - 精准定位目标用户\n5. 竞品分析矩阵 - 知己知彼百战不殆\n\n（更多内容...）',
        categoryId: catIds['职业发展'],
        tags: '思维模型,产品技能,方法论'
      },
      {
        title: '从0到1搭建用户反馈体系',
        summary: '用户反馈是产品迭代的重要输入，但如何搭建一套高效的用户反馈收集、处理和闭环体系？本文分享我的实践经验。',
        content: '用户反馈体系是产品经理的"千里眼"和"顺风耳"。本文将从以下几个方面展开：\n\n1. 反馈渠道的选择和搭建\n2. 反馈的分类和标签体系\n3. 反馈处理的工作流程\n4. 如何建立反馈闭环机制\n5. 数据分析和洞察挖掘\n\n（更多内容...）',
        categoryId: catIds['产品运营'],
        tags: '用户反馈,运营体系,闭环'
      },
      {
        title: '移动端产品设计的10条黄金法则',
        summary: '移动端产品设计有其特殊性，本文总结了10条经过验证的设计法则，帮助你打造更好的移动产品体验。',
        content: '移动端屏幕有限，但用户的期待无限。如何在小屏幕上创造出色的用户体验？\n\n1. 拇指热区原则\n2. 一次只做一件事\n3. 减少输入，利用选择\n4. 利用手势操作\n5. 提供即时反馈\n\n（更多内容...）',
        categoryId: catIds['产品设计'],
        tags: '移动端,设计法则,用户体验'
      },
      {
        title: '如何写一份高质量的PRD？',
        summary: 'PRD是产品经理的基本功，但很多人不知道如何写出真正对开发有指导意义的PRD。本文分享PRD的结构和写作技巧。',
        content: '一份好的PRD应该是"开发看得懂，测试测得出，运营用得上"。本文将详细介绍：\n\n1. PRD的核心要素\n2. 需求背景和目标怎么写\n3. 用户故事和场景描述\n4. 功能流程图绘制\n5. 原型和交互说明\n\n（更多内容...）',
        categoryId: catIds['需求分析'],
        tags: 'PRD,文档写作,需求文档'
      },
      {
        title: 'SaaS产品的核心指标体系搭建',
        summary: 'SaaS产品有其独特的商业逻辑，本文介绍如何搭建适合SaaS产品的核心指标体系，从获客到留存全链路覆盖。',
        content: 'SaaS产品的核心是留存和LTV。本文将系统介绍：\n\n1. SaaS产品的商业逻辑\n2. 获客阶段的核心指标\n3. 激活和留存指标\n4. 付费和转化指标\n5. 如何用数据驱动产品迭代\n\n（更多内容...）',
        categoryId: catIds['产品运营'],
        tags: 'SaaS,指标体系,数据驱动'
      }
    ];

    for (const a of sampleArticles) {
      await dbWrapper.run(
        'INSERT INTO articles (user_id, title, summary, content, category_id, tags, views, comments_count, likes_count, status, is_recommended, sort_weight, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [1, a.title, a.summary, a.content, a.categoryId, a.tags, Math.floor(Math.random() * 1000) + 200, 0, Math.floor(Math.random() * 80) + 10, 1, Math.random() > 0.3 ? 1 : 0, 0, now, now]
      );
    }
  }

  console.log('数据库初始化完成');
};

module.exports = { db: dbWrapper, initDb };
