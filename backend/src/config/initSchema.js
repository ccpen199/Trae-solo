import { query, getDbType, getDbClient } from './database.js';
import bcrypt from 'bcryptjs';

const sqliteTables = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    real_name TEXT,
    email TEXT,
    phone TEXT,
    status INTEGER DEFAULT 1,
    role_id INTEGER,
    last_login_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    permissions TEXT,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER DEFAULT 0,
    module TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    seo_title TEXT,
    seo_keywords TEXT,
    seo_description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS product_series (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS product_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER DEFAULT 0,
    series_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    series_id INTEGER,
    category_id INTEGER,
    subtitle TEXT,
    thumbnail TEXT,
    images TEXT,
    description TEXT,
    content TEXT,
    price REAL,
    specs TEXT,
    keywords TEXT,
    is_recommended INTEGER DEFAULT 0,
    is_top INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS news_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category_id INTEGER,
    source TEXT,
    author TEXT,
    thumbnail TEXT,
    summary TEXT,
    content TEXT,
    keywords TEXT,
    is_recommended INTEGER DEFAULT 0,
    is_top INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    publish_date TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    real_name TEXT,
    company_name TEXT,
    address TEXT,
    member_type_id INTEGER,
    status INTEGER DEFAULT 0,
    last_login_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS member_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    permissions TEXT,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS message_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    product_id INTEGER,
    member_id INTEGER,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    company TEXT,
    content TEXT NOT NULL,
    reply TEXT,
    is_public INTEGER DEFAULT 0,
    status INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    department TEXT,
    location TEXT,
    salary_range TEXT,
    requirements TEXT,
    responsibilities TEXT,
    benefits TEXT,
    job_type TEXT,
    experience_requirement TEXT,
    education_requirement TEXT,
    is_recommended INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    publish_date TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    gender TEXT,
    age INTEGER,
    education TEXT,
    work_experience INTEGER,
    self_introduction TEXT,
    work_history TEXT,
    education_history TEXT,
    skills TEXT,
    resume_file TEXT,
    status INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS download_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    file_size TEXT,
    download_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    logo TEXT,
    description TEXT,
    link_type TEXT DEFAULT 'cooperation',
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS company_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo TEXT,
    introduction TEXT,
    history TEXT,
    culture TEXT,
    vision TEXT,
    address TEXT,
    phone TEXT,
    fax TEXT,
    email TEXT,
    qq TEXT,
    wechat TEXT,
    wechat_qrcode TEXT,
    work_time TEXT,
    map_location TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS org_structure (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER DEFAULT 0,
    manager TEXT,
    phone TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    image TEXT,
    description TEXT,
    cert_number TEXT,
    issue_date TEXT,
    expiry_date TEXT,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS marketing_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS marketing_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    title TEXT NOT NULL,
    thumbnail TEXT,
    content TEXT,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`
];

const createIndexes = async () => {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)',
    'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_products_series ON products(series_id)',
    'CREATE INDEX IF NOT EXISTS idx_news_status ON news(status)',
    'CREATE INDEX IF NOT EXISTS idx_news_category ON news(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status)',
    'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)',
    'CREATE INDEX IF NOT EXISTS idx_resumes_job ON resumes(job_id)'
  ];

  for (const indexSql of indexes) {
    try {
      await query(indexSql);
    } catch (err) {
      console.error('创建索引失败:', err.message);
    }
  }
};

const insertInitialData = async () => {
  try {
    
    const roleResult = await query(
      'SELECT id FROM roles WHERE name = ?',
      ['超级管理员']
    );

    let adminRoleId;
    if (roleResult.rows.length === 0) {
      const newRole = await query(
        `INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)`,
        ['超级管理员', '拥有所有权限', '["all"]']
      );
      adminRoleId = newRole.rows[0]?.id;
      console.log('默认角色创建成功');
    } else {
      adminRoleId = roleResult.rows[0].id;
    }

    const adminResult = await query(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );

    if (adminResult.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await query(
        `INSERT INTO users (username, password, real_name, email, phone, role_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['admin', hashedPassword, '管理员', 'admin@example.com', '13800138000', adminRoleId, 1]
      );
      console.log('默认管理员账号创建成功: admin / admin123');
    }

    const categories = [
      { name: '企业介绍', module: 'company', sort_order: 1 },
      { name: '信誉认证', module: 'certification', sort_order: 2 },
      { name: '组织结构', module: 'organization', sort_order: 3 },
      { name: '下载中心', module: 'download', sort_order: 4 },
      { name: '产品展示', module: 'product', sort_order: 5 },
      { name: '新闻中心', module: 'news', sort_order: 6 },
      { name: '客户服务', module: 'service', sort_order: 7 },
      { name: '人力资源', module: 'hr', sort_order: 8 },
      { name: '合作链接', module: 'link', sort_order: 9 },
      { name: '营销中心', module: 'marketing', sort_order: 10 },
      { name: '联系方式', module: 'contact', sort_order: 11 }
    ];

    for (const cat of categories) {
      const catResult = await query(
        'SELECT id FROM categories WHERE name = ?',
        [cat.name]
      );
      if (catResult.rows.length === 0) {
        await query(
          `INSERT INTO categories (name, parent_id, module, sort_order, status)
           VALUES (?, ?, ?, ?, ?)`,
          [cat.name, 0, cat.module, cat.sort_order, 1]
        );
        console.log(`栏目创建成功: ${cat.name}`);
      }
    }

    const newsCats = [
      { name: '企业新闻', sort_order: 1 },
      { name: '行业动态', sort_order: 2 },
      { name: '媒体报道', sort_order: 3 },
      { name: '合作交流', sort_order: 4 }
    ];

    for (const cat of newsCats) {
      const catResult = await query(
        'SELECT id FROM news_categories WHERE name = ?',
        [cat.name]
      );
      if (catResult.rows.length === 0) {
        await query(
          `INSERT INTO news_categories (name, sort_order, status) VALUES (?, ?, ?)`,
          [cat.name, cat.sort_order, 1]
        );
        console.log(`新闻分类创建成功: ${cat.name}`);
      }
    }

    const messageCats = [
      { name: '产品咨询', sort_order: 1 },
      { name: '售后服务', sort_order: 2 },
      { name: '合作洽谈', sort_order: 3 },
      { name: '意见反馈', sort_order: 4 }
    ];

    for (const cat of messageCats) {
      const catResult = await query(
        'SELECT id FROM message_categories WHERE name = ?',
        [cat.name]
      );
      if (catResult.rows.length === 0) {
        await query(
          `INSERT INTO message_categories (name, sort_order, status) VALUES (?, ?, ?)`,
          [cat.name, cat.sort_order, 1]
        );
        console.log(`留言分类创建成功: ${cat.name}`);
      }
    }

    const memberTypes = [
      { name: '普通会员', description: '基础会员，可浏览产品和留言', permissions: '["view_products", "post_messages"]' },
      { name: 'VIP会员', description: '高级会员，享有更多权限', permissions: '["view_products", "post_messages", "download_resources", "view_prices"]' },
      { name: '经销商', description: '经销商会员', permissions: '["view_products", "post_messages", "download_resources", "view_prices", "place_orders"]' }
    ];

    for (const type of memberTypes) {
      const typeResult = await query(
        'SELECT id FROM member_types WHERE name = ?',
        [type.name]
      );
      if (typeResult.rows.length === 0) {
        await query(
          `INSERT INTO member_types (name, description, permissions, status) VALUES (?, ?, ?, ?)`,
          [type.name, type.description, type.permissions, 1]
        );
        console.log(`会员类型创建成功: ${type.name}`);
      }
    }

    const companyResult = await query('SELECT id FROM company_info LIMIT 1');
    if (companyResult.rows.length === 0) {
      await query(
        `INSERT INTO company_info (name, introduction, address, phone, email, work_time)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          '某某科技有限公司',
          '某某科技有限公司是一家专注于高新技术研发的现代化企业，致力于为客户提供优质的产品和服务。公司成立于2010年，拥有专业的研发团队和完善的售后服务体系。',
          '北京市海淀区中关村科技园',
          '400-888-8888',
          'contact@example.com',
          '周一至周五 9:00-18:00'
        ]
      );
      console.log('默认企业信息创建成功');
    }

    const productSeries = [
      { name: '智能系列', description: '智能化产品系列', sort_order: 1 },
      { name: '办公系列', description: '办公自动化产品系列', sort_order: 2 },
      { name: '家居系列', description: '智能家居产品系列', sort_order: 3 }
    ];

    for (const series of productSeries) {
      const seriesResult = await query(
        'SELECT id FROM product_series WHERE name = ?',
        [series.name]
      );
      if (seriesResult.rows.length === 0) {
        await query(
          `INSERT INTO product_series (name, description, sort_order, status) VALUES (?, ?, ?, ?)`,
          [series.name, series.description, series.sort_order, 1]
        );
        console.log(`产品系列创建成功: ${series.name}`);
      }
    }

    const productCats = [
      { name: '智能设备', sort_order: 1 },
      { name: '办公设备', sort_order: 2 },
      { name: '家居设备', sort_order: 3 }
    ];

    for (const cat of productCats) {
      const catResult = await query(
        'SELECT id FROM product_categories WHERE name = ?',
        [cat.name]
      );
      if (catResult.rows.length === 0) {
        await query(
          `INSERT INTO product_categories (name, parent_id, sort_order, status) VALUES (?, ?, ?, ?)`,
          [cat.name, 0, cat.sort_order, 1]
        );
        console.log(`产品分类创建成功: ${cat.name}`);
      }
    }

    const sampleProducts = [
      { title: '智能产品A1', subtitle: '高端智能产品，品质之选', is_recommended: 1, is_top: 1, sort_order: 1, view_count: 128, price: 2999.00 },
      { title: '智能产品B2', subtitle: '中端智能产品，性价比高', is_recommended: 1, is_top: 0, sort_order: 2, view_count: 95, price: 1999.00 },
      { title: '智能产品C3', subtitle: '入门级智能产品，易用之选', is_recommended: 0, is_top: 0, sort_order: 3, view_count: 256, price: 999.00 },
      { title: '智能产品D4', subtitle: '专业级智能产品，性能卓越', is_recommended: 1, is_top: 0, sort_order: 4, view_count: 67, price: 4999.00 }
    ];

    for (const product of sampleProducts) {
      const prodResult = await query(
        'SELECT id FROM products WHERE title = ?',
        [product.title]
      );
      if (prodResult.rows.length === 0) {
        await query(
          `INSERT INTO products (title, subtitle, is_recommended, is_top, sort_order, status, view_count, price, description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.title, 
            product.subtitle, 
            product.is_recommended, 
            product.is_top, 
            product.sort_order, 
            1, 
            product.view_count,
            product.price,
            `这是${product.title}的详细描述，产品品质优良，性能稳定。`
          ]
        );
        console.log(`示例产品创建成功: ${product.title}`);
      }
    }

    const sampleNews = [
      { 
        title: '公司新产品发布会成功举办', 
        summary: '最新智能产品系列正式亮相，引起业界广泛关注。',
        content: '<p>2024年1月15日，公司在北京成功举办了新产品发布会，正式推出了最新研发的智能产品系列。</p>',
        category_id: 1,
        is_recommended: 1,
        is_top: 1,
        view_count: 128
      },
      { 
        title: '2024年度年会精彩回顾', 
        summary: '全体员工齐聚一堂，共贺新年，展望未来。',
        content: '<p>年会上举行了优秀员工表彰仪式，并对新一年的发展做出了规划。</p>',
        category_id: 1,
        is_recommended: 0,
        is_top: 0,
        view_count: 95
      },
      { 
        title: '行业动态：新技术发展趋势', 
        summary: '行业专家解读最新技术发展方向。',
        content: '<p>人工智能、物联网等技术将成为未来发展的核心驱动力。</p>',
        category_id: 2,
        is_recommended: 1,
        is_top: 0,
        view_count: 256
      }
    ];

    for (const news of sampleNews) {
      const newsResult = await query(
        'SELECT id FROM news WHERE title = ?',
        [news.title]
      );
      if (newsResult.rows.length === 0) {
        await query(
          `INSERT INTO news (title, summary, content, category_id, is_recommended, is_top, status, view_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            news.title,
            news.summary,
            news.content,
            news.category_id,
            news.is_recommended,
            news.is_top,
            1,
            news.view_count
          ]
        );
        console.log(`示例新闻创建成功: ${news.title}`);
      }
    }

    const sampleJobs = [
      {
        title: '高级前端开发工程师',
        department: '技术部',
        location: '北京',
        salary_range: '20K-35K',
        job_type: '全职',
        experience_requirement: '3-5年',
        education_requirement: '本科及以上',
        is_recommended: 1,
        view_count: 128,
        requirements: '1. 3年以上前端开发经验；\n2. 熟悉React、Vue等主流框架；\n3. 熟悉HTML、CSS、JavaScript等前端技术。',
        responsibilities: '1. 负责公司产品的前端开发工作；\n2. 与产品、UI、后端团队紧密配合。'
      },
      {
        title: '产品经理',
        department: '产品部',
        location: '北京',
        salary_range: '15K-25K',
        job_type: '全职',
        experience_requirement: '2-3年',
        education_requirement: '本科及以上',
        is_recommended: 1,
        view_count: 95,
        requirements: '1. 2年以上产品经理经验；\n2. 熟悉产品设计流程。',
        responsibilities: '1. 负责产品规划与管理；\n2. 协调各团队推动项目进展。'
      }
    ];

    for (const job of sampleJobs) {
      const jobResult = await query(
        'SELECT id FROM jobs WHERE title = ?',
        [job.title]
      );
      if (jobResult.rows.length === 0) {
        await query(
          `INSERT INTO jobs (title, department, location, salary_range, job_type, experience_requirement, education_requirement, is_recommended, status, view_count, requirements, responsibilities)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            job.title,
            job.department,
            job.location,
            job.salary_range,
            job.job_type,
            job.experience_requirement,
            job.education_requirement,
            job.is_recommended,
            1,
            job.view_count,
            job.requirements,
            job.responsibilities
          ]
        );
        console.log(`示例职位创建成功: ${job.title}`);
      }
    }

    console.log('初始化数据插入完成');
  } catch (err) {
    console.error('插入初始数据失败:', err);
  }
};

export const initializeSchema = async () => {
  console.log('开始初始化数据库表结构...');
  
  const dbClient = getDbClient();
  
  for (const tableSql of sqliteTables) {
    try {
      if (dbClient && dbClient.prepare) {
        dbClient.exec(tableSql);
      } else {
        await query(tableSql);
      }
    } catch (err) {
      console.error('创建表失败:', err.message);
    }
  }
  
  await createIndexes();
  console.log('数据库表结构初始化完成');
  
  await insertInitialData();
  console.log('数据库初始化完成！');
};

export default {
  initializeSchema
};
