import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../../data/enterprise.db');
const db = new Database(dbPath);

console.log('数据库路径:', dbPath);

const existingUsers = db.prepare('SELECT * FROM users').all();
console.log('现有用户:', existingUsers);

if (existingUsers.length === 0) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(
    'INSERT INTO users (username, password, real_name, email, phone, role_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('admin', hashedPassword, '管理员', 'admin@example.com', '13800138000', 1, 1);
  console.log('管理员创建成功: admin / admin123');
}

const existingCategories = db.prepare('SELECT * FROM categories').all();
console.log('现有分类:', existingCategories);

if (existingCategories.length === 0) {
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
  
  const insertCategory = db.prepare('INSERT INTO categories (name, module, sort_order, status) VALUES (?, ?, ?, 1)');
  categories.forEach(cat => insertCategory.run(cat.name, cat.module, cat.sort_order));
  console.log('分类创建成功');
}

const existingProductCategories = db.prepare('SELECT * FROM product_categories').all();
console.log('现有产品分类:', existingProductCategories);

if (existingProductCategories.length === 0) {
  db.prepare('INSERT INTO product_categories (name, parent_id, sort_order, status) VALUES (?, 0, 1, 1)').run('电子产品');
  db.prepare('INSERT INTO product_categories (name, parent_id, sort_order, status) VALUES (?, 0, 2, 1)').run('机械设备');
  db.prepare('INSERT INTO product_categories (name, parent_id, sort_order, status) VALUES (?, 0, 3, 1)').run('解决方案');
  console.log('产品分类创建成功');
}

const existingNewsCategories = db.prepare('SELECT * FROM news_categories').all();
console.log('现有新闻分类:', existingNewsCategories);

if (existingNewsCategories.length === 0) {
  db.prepare('INSERT INTO news_categories (name, sort_order, status) VALUES (?, 1, 1)').run('企业新闻');
  db.prepare('INSERT INTO news_categories (name, sort_order, status) VALUES (?, 2, 1)').run('行业动态');
  db.prepare('INSERT INTO news_categories (name, sort_order, status) VALUES (?, 3, 1)').run('媒体报道');
  db.prepare('INSERT INTO news_categories (name, sort_order, status) VALUES (?, 4, 1)').run('合作交流');
  console.log('新闻分类创建成功');
}

const existingMemberTypes = db.prepare('SELECT * FROM member_types').all();
console.log('现有会员类型:', existingMemberTypes);

if (existingMemberTypes.length === 0) {
  db.prepare("INSERT INTO member_types (name, description, permissions, status) VALUES ('普通会员', '基础会员', '[\"read\"]', 1)").run();
  db.prepare("INSERT INTO member_types (name, description, permissions, status) VALUES ('VIP会员', '高级会员', '[\"read\", \"download\"]', 1)").run();
  db.prepare("INSERT INTO member_types (name, description, permissions, status) VALUES ('钻石会员', '顶级会员', '[\"read\", \"download\", \"priority\"]', 1)").run();
  console.log('会员类型创建成功');
}

const existingMessageCategories = db.prepare('SELECT * FROM message_categories').all();
console.log('现有留言分类:', existingMessageCategories);

if (existingMessageCategories.length === 0) {
  db.prepare('INSERT INTO message_categories (name, sort_order, status) VALUES (?, 1, 1)').run('产品咨询');
  db.prepare('INSERT INTO message_categories (name, sort_order, status) VALUES (?, 2, 1)').run('售后服务');
  db.prepare('INSERT INTO message_categories (name, sort_order, status) VALUES (?, 3, 1)').run('合作洽谈');
  db.prepare('INSERT INTO message_categories (name, sort_order, status) VALUES (?, 4, 1)').run('投诉建议');
  console.log('留言分类创建成功');
}

const existingCompanyInfo = db.prepare('SELECT * FROM company_info').all();
console.log('现有企业信息:', existingCompanyInfo);

if (existingCompanyInfo.length === 0) {
  db.prepare(
    'INSERT INTO company_info (name, introduction, history, culture, vision, address, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    '某某科技有限公司',
    '某某科技有限公司是一家专注于创新科技的高新技术企业，致力于为客户提供优质的产品和服务。公司成立以来，始终坚持以客户为中心，以技术创新为驱动，不断推出满足市场需求的产品。',
    '2010年：公司成立，开始创业之旅\n2012年：获得第一轮融资，产品研发加速\n2015年：产品上市，市场反响热烈\n2018年：公司规模扩大，员工超过100人\n2020年：成为行业领先企业\n2023年：全球化战略启动',
    '企业使命：科技创新，服务社会\n核心价值观：诚信、创新、协作、共赢\n企业精神：追求卓越，永不言弃\n经营理念：以客户为中心，以质量为生命',
    '成为全球领先的科技创新企业，为人类社会的进步贡献力量',
    '北京市海淀区中关村科技园区',
    '400-888-8888',
    'contact@example.com'
  );
  console.log('企业信息创建成功');
}

console.log('\n=== 数据库初始化完成 ===');
console.log('管理员账号: admin / admin123');

db.close();
