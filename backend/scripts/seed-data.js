import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../src/config/database.js';

const seedProducts = [
  {
    id: uuidv4(),
    code: '000001',
    name: '华夏成长混合基金',
    type: '混合型',
    risk_level: 3,
    description: '主要投资于具有良好成长性的上市公司股票，追求资产长期增值。',
    issuer: '华夏基金管理有限公司',
    manager: '张三',
    nav: 1.2568,
    status: 'active'
  },
  {
    id: uuidv4(),
    code: '000002',
    name: '易方达价值精选',
    type: '股票型',
    risk_level: 4,
    description: '精选具有投资价值的上市公司股票，追求超越业绩比较基准的投资回报。',
    issuer: '易方达基金管理有限公司',
    manager: '李四',
    nav: 2.1875,
    status: 'active'
  },
  {
    id: uuidv4(),
    code: '000003',
    name: '南方稳健成长',
    type: '混合型',
    risk_level: 2,
    description: '以稳健成长为投资目标，在控制风险的前提下追求资产增值。',
    issuer: '南方基金管理有限公司',
    manager: '王五',
    nav: 1.8942,
    status: 'active'
  },
  {
    id: uuidv4(),
    code: '000004',
    name: '嘉实货币市场基金',
    type: '货币型',
    risk_level: 1,
    description: '投资于货币市场工具，追求稳健收益，流动性好。',
    issuer: '嘉实基金管理有限公司',
    manager: '赵六',
    nav: 1.0000,
    status: 'active'
  },
  {
    id: uuidv4(),
    code: '000005',
    name: '博时主题行业基金',
    type: '股票型',
    risk_level: 5,
    description: '主题投资策略，聚焦行业龙头，追求高风险高收益。',
    issuer: '博时基金管理有限公司',
    manager: '钱七',
    nav: 3.4521,
    status: 'active'
  },
  {
    id: uuidv4(),
    code: '000006',
    name: '广发稳健增长',
    type: '混合型',
    risk_level: 2,
    description: '稳健增长型投资策略，平衡配置股票和债券资产。',
    issuer: '广发基金管理有限公司',
    manager: '孙八',
    nav: 1.5632,
    status: 'active'
  }
];

const seedUsers = [
  {
    id: uuidv4(),
    username: 'admin',
    password: 'admin123',
    full_name: '系统管理员',
    role: 'admin',
    risk_level: 5
  },
  {
    id: uuidv4(),
    username: 'compliance',
    password: 'compliance123',
    full_name: '合规审计员',
    role: 'compliance',
    risk_level: 3
  },
  {
    id: uuidv4(),
    username: 'analyst',
    password: 'analyst123',
    full_name: '数据分析师',
    role: 'analyst',
    risk_level: 4
  },
  {
    id: uuidv4(),
    username: 'investor1',
    password: 'investor123',
    full_name: '张投资者',
    role: 'investor',
    risk_level: 3
  },
  {
    id: uuidv4(),
    username: 'investor2',
    password: 'investor123',
    full_name: '李投资者',
    role: 'investor',
    risk_level: 2
  }
];

function seedData() {
  console.log('开始初始化种子数据...');

  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO fund_products (id, code, name, type, risk_level, description, issuer, manager, nav, status, created_at, nav_updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const product of seedProducts) {
    const now = new Date().toISOString();
    const result = insertProduct.run(
      product.id, product.code, product.name, product.type, product.risk_level, 
      product.description, product.issuer, product.manager, product.nav, product.status, now, now
    );
    if (result.changes > 0) {
      console.log(`已创建产品: ${product.code} - ${product.name}`);
    } else {
      console.log(`产品 ${product.code} 已存在，跳过`);
    }
  }

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, password_hash, full_name, role, risk_level, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const user of seedUsers) {
    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(user.password, 10);
    
    const result = insertUser.run(
      user.id, user.username, passwordHash, user.full_name, user.role, user.risk_level, now, now
    );
    if (result.changes > 0) {
      console.log(`已创建用户: ${user.username} (${user.role})`);
    } else {
      console.log(`用户 ${user.username} 已存在，跳过`);
    }
  }

  console.log('\n========================================');
  console.log('种子数据初始化完成！');
  console.log('========================================');
  console.log('可用测试账号：');
  console.log('  管理员: admin / admin123');
  console.log('  合规员: compliance / compliance123');
  console.log('  分析师: analyst / analyst123');
  console.log('  投资者1: investor1 / investor123');
  console.log('  投资者2: investor2 / investor123');
  console.log('========================================\n');

  db.close();
}

seedData();
