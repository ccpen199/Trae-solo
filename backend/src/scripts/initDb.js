import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

const createTables = async () => {
  const tables = [
    // 用户表（后台管理员）
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      real_name VARCHAR(100),
      email VARCHAR(100),
      phone VARCHAR(20),
      status SMALLINT DEFAULT 1,
      role_id INTEGER,
      last_login_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 角色表
    `CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      description VARCHAR(255),
      permissions TEXT,
      status SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 栏目表
    `CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      parent_id INTEGER DEFAULT 0,
      module VARCHAR(50) NOT NULL,
      sort_order INTEGER DEFAULT 0,
      status SMALLINT DEFAULT 1,
      seo_title VARCHAR(255),
      seo_keywords VARCHAR(500),
      seo_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 产品系列表
    `CREATE TABLE IF NOT EXISTS product_series (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      image VARCHAR(500),
      sort_order INTEGER DEFAULT 0,
      status SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 产品分类表（多级）
    `CREATE TABLE IF NOT EXISTS product_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      parent_id INTEGER DEFAULT 0,
      series_id INTEGER,
      sort_order INTEGER DEFAULT 0,
      status SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 产品表
    `CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      series_id INTEGER,
      category_id INTEGER,
      subtitle VARCHAR(500),
      thumbnail VARCHAR(500),
      images TEXT,
      description TEXT,
      content TEXT,
      price DECIMAL(10, 2),
      specs TEXT,
      keywords VARCHAR(500),
      is_recommended BOOLEAN DEFAULT FALSE,
      is_top BOOLEAN DEFAULT FALSE,
      sort_order INTEGER DEFAULT 0,
      status SMALLINT DEFAULT 1,
      view_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 新闻分类表
    `CREATE TABLE IF NOT EXISTS news_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      sort_order INTEGER DEFAULT 0,
      status SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 新闻表
    `CREATE TABLE IF NOT EXISTS news (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category_id INTEGER,
      source VARCHAR(100),
      author VARCHAR(100),
      thumbnail VARCHAR(500),
      summary TEXT,
      content TEXT,
      keywords VARCHAR(500),
      is_recommended BOOLEAN DEFAULT FALSE,
      is_top BOOLEAN DEFAULT FALSE,
      sort_order INTEGER DEFAULT 0,
      status SMALLINT DEFAULT 1,
      view_count INTEGER DEFAULT 0,
      publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 会员表
    `CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(100) UNIQUE,
      phone VARCHAR(20),
      real_name VARCHAR(100),
      company_name VARCHAR(255),
      address VARCHAR(500),
      member_type_id INTEGER,
      status SMALLINT DEFAULT 0,
      last_login_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 会员类型表
    `CREATE TABLE IF NOT EXISTS member_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      description TEXT,
      permissions TEXT,
      status SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 留言分类表
    `CREATE TABLE IF NOT EXISTS message_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      sort_order INTEGER DEFAULT 0,
      status SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 留言表
    `CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      category_id INTEGER,
      product_id INTEGER,
      member_id INTEGER,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(100),
      company VARCHAR(255),
      content TEXT NOT NULL,
      reply TEXT,
      is_public BOOLEAN DEFAULT FALSE,
      status SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 职位表
    `CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      department VARCHAR(100),
      location VARCHAR(100),
      salary_range VARCHAR(50),
      requirements TEXT,
      responsibilities TEXT,
      benefits TEXT,
      job_type VARCHAR(50),
      experience_requirement VARCHAR(50),
      education_requirement VARCHAR(50),
      is_recommended BOOLEAN DEFAULT FALSE,
      sort_order INTEGER DEFAULT 0,
      status SMALLINT DEFAULT 1,
      view_count INTEGER DEFAULT 0,
      publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 简历表
    `CREATE TABLE IF NOT EXISTS resumes (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(100),
      gender VARCHAR(10),
      age INTEGER,
      education VARCHAR(50),
      work_experience INTEGER,
      self_introduction TEXT,
      work_history TEXT,
      education_history TEXT,
      skills TEXT,
      resume_file VARCHAR(500),
      status SMALLINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 下载中心分类表
    `CREATE TABLE IF NOT EXISTS download_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      sort_order INTEGER DEFAULT 0,
      status SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 下载资源表
    `CREATE TABLE IF NOT EXISTS downloads (
      id SERIAL PRIMARY KEY,
      category_id INTEGER,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      file_path VARCHAR(500),
      file_size VARCHAR(50),
      download_count INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      status SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 友情链接表
    `CREATE TABLE IF NOT EXISTS links (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      url VARCHAR(500) NOT NULL,
      logo VARCHAR(500),
      description TEXT,
      link_type VARCHAR(20) DEFAULT 'cooperation',
      sort_order INTEGER DEFAULT 0,
      status SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 站点配置表
    `CREATE TABLE IF NOT EXISTS site_settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(100) UNIQUE NOT NULL,
      value TEXT,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 企业信息表
    `CREATE TABLE IF NOT EXISTS company_info (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      logo VARCHAR(500),
      introduction TEXT,
      history TEXT,
      culture TEXT,
      vision TEXT,
      address VARCHAR(500),
      phone VARCHAR(100),
      fax VARCHAR(50),
      email VARCHAR(100),
      qq VARCHAR(50),
      wechat VARCHAR(100),
      wechat_qrcode VARCHAR(500),
      work_time VARCHAR(255),
      map_location VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 组织结构表
    `CREATE TABLE IF NOT EXISTS org_structure (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      parent_id INTEGER DEFAULT 0,
      manager VARCHAR(100),
      phone VARCHAR(20),
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      status SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 信誉认证表
    `CREATE TABLE IF NOT EXISTS certifications (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      image VARCHAR(500),
      description TEXT,
      cert_number VARCHAR(100),
      issue_date DATE,
      expiry_date DATE,
      sort_order INTEGER DEFAULT 0,
      status SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 营销中心分类表
    `CREATE TABLE IF NOT EXISTS marketing_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      sort_order INTEGER DEFAULT 0,
      status SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // 营销中心内容表
    `CREATE TABLE IF NOT EXISTS marketing_content (
      id SERIAL PRIMARY KEY,
      category_id INTEGER,
      title VARCHAR(255) NOT NULL,
      thumbnail VARCHAR(500),
      content TEXT,
      sort_order INTEGER DEFAULT 0,
      status SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const tableSql of tables) {
    try {
      await query(tableSql);
      console.log('表创建成功或已存在');
    } catch (err) {
      console.error('创建表失败:', err.message);
    }
  }
};

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
      console.log('索引创建成功或已存在');
    } catch (err) {
      console.error('创建索引失败:', err.message);
    }
  }
};

const insertInitialData = async () => {
  // 插入默认角色
  const roleResult = await query(
    'SELECT id FROM roles WHERE name = $1',
    ['超级管理员']
  );

  if (roleResult.rows.length === 0) {
    const adminRole = await query(
      `INSERT INTO roles (name, description, permissions) 
       VALUES ($1, $2, $3) RETURNING id`,
      ['超级管理员', '拥有所有权限', '["all"]']
    );
    console.log('默认角色创建成功');

    // 插入默认管理员账号: admin / admin123
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await query(
      `INSERT INTO users (username, password, real_name, email, phone, role_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['admin', hashedPassword, '管理员', 'admin@example.com', '13800138000', adminRole.rows[0].id, 1]
    );
    console.log('默认管理员账号创建成功: admin / admin123');
  }

  // 插入默认栏目
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
      'SELECT id FROM categories WHERE name = $1',
      [cat.name]
    );
    if (catResult.rows.length === 0) {
      await query(
        `INSERT INTO categories (name, parent_id, module, sort_order, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [cat.name, 0, cat.module, cat.sort_order, 1]
      );
      console.log(`栏目创建成功: ${cat.name}`);
    }
  }

  // 插入默认新闻分类
  const newsCats = [
    { name: '企业新闻', sort_order: 1 },
    { name: '行业动态', sort_order: 2 },
    { name: '媒体报道', sort_order: 3 },
    { name: '合作交流', sort_order: 4 }
  ];

  for (const cat of newsCats) {
    const catResult = await query(
      'SELECT id FROM news_categories WHERE name = $1',
      [cat.name]
    );
    if (catResult.rows.length === 0) {
      await query(
        `INSERT INTO news_categories (name, sort_order, status)
         VALUES ($1, $2, $3)`,
        [cat.name, cat.sort_order, 1]
      );
      console.log(`新闻分类创建成功: ${cat.name}`);
    }
  }

  // 插入默认留言分类
  const messageCats = [
    { name: '产品咨询', sort_order: 1 },
    { name: '售后服务', sort_order: 2 },
    { name: '合作洽谈', sort_order: 3 },
    { name: '意见反馈', sort_order: 4 }
  ];

  for (const cat of messageCats) {
    const catResult = await query(
      'SELECT id FROM message_categories WHERE name = $1',
      [cat.name]
    );
    if (catResult.rows.length === 0) {
      await query(
        `INSERT INTO message_categories (name, sort_order, status)
         VALUES ($1, $2, $3)`,
        [cat.name, cat.sort_order, 1]
      );
      console.log(`留言分类创建成功: ${cat.name}`);
    }
  }

  // 插入默认会员类型
  const memberTypes = [
    { name: '普通会员', description: '基础会员，可浏览产品和留言', permissions: '["view_products", "post_messages"]' },
    { name: 'VIP会员', description: '高级会员，享有更多权限', permissions: '["view_products", "post_messages", "download_resources", "view_prices"]' },
    { name: '经销商', description: '经销商会员', permissions: '["view_products", "post_messages", "download_resources", "view_prices", "place_orders"]' }
  ];

  for (const type of memberTypes) {
    const typeResult = await query(
      'SELECT id FROM member_types WHERE name = $1',
      [type.name]
    );
    if (typeResult.rows.length === 0) {
      await query(
        `INSERT INTO member_types (name, description, permissions, status)
         VALUES ($1, $2, $3, $4)`,
        [type.name, type.description, type.permissions, 1]
      );
      console.log(`会员类型创建成功: ${type.name}`);
    }
  }

  // 插入默认企业信息
  const companyResult = await query('SELECT id FROM company_info LIMIT 1');
  if (companyResult.rows.length === 0) {
    await query(
      `INSERT INTO company_info (name, introduction, address, phone, email, work_time)
       VALUES ($1, $2, $3, $4, $5, $6)`,
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
};

const main = async () => {
  console.log('开始初始化数据库...');
  
  await createTables();
  await createIndexes();
  await insertInitialData();
  
  console.log('数据库初始化完成！');
  console.log('默认管理员账号: admin / admin123');
  
  process.exit(0);
};

main().catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
