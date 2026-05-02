const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../database');
const config = require('../config');

const seedData = {
  users: [
    {
      id: uuidv4(),
      username: 'admin',
      password: 'admin123',
      name: '系统管理员',
      email: 'admin@insurance.com',
      phone: '13800138000',
      role: config.roles.ADMIN,
      status: 'active'
    },
    {
      id: uuidv4(),
      username: 'agent1',
      password: 'agent123',
      name: '张代理人',
      email: 'zhang@insurance.com',
      phone: '13800138001',
      role: config.roles.AGENT,
      status: 'active'
    },
    {
      id: uuidv4(),
      username: 'underwriter1',
      password: 'under123',
      name: '李核保员',
      email: 'li@insurance.com',
      phone: '13800138002',
      role: config.roles.UNDERWRITER,
      status: 'active'
    },
    {
      id: uuidv4(),
      username: 'claim1',
      password: 'claim123',
      name: '王理赔员',
      email: 'wang@insurance.com',
      phone: '13800138003',
      role: config.roles.CLAIM_ADJUSTER,
      status: 'active'
    },
    {
      id: uuidv4(),
      username: 'user1',
      password: 'user123',
      name: '陈投保人',
      email: 'chen@example.com',
      phone: '13900139001',
      role: config.roles.POLICYHOLDER,
      status: 'active'
    }
  ],
  products: [
    {
      id: uuidv4(),
      name: '安心寿险保障计划A',
      code: 'LIFE-001-A',
      description: '定期寿险，提供身故或全残保障，保障期限灵活可选',
      category: 'life',
      base_premium: 1000,
      risk_factors: JSON.stringify({
        ageRange: [18, 65],
        healthOptions: ['excellent', 'good', 'fair'],
        coverageOptions: [100000, 200000, 500000, 1000000],
        termOptions: [12, 60, 120, 240, 360]
      }),
      status: 'approved',
      coverage_details: JSON.stringify({
        coverageType: '定期寿险',
        benefits: ['身故保障', '全残保障'],
        optionalBenefits: ['重疾提前给付', '豁免保费']
      }),
      exclusions: JSON.stringify({
        standard: ['自杀(2年内)', '故意犯罪', '战争军事行动']
      }),
      created_by: null,
      approved_by: null
    },
    {
      id: uuidv4(),
      name: '健康无忧重疾险',
      code: 'HEALTH-001-A',
      description: '覆盖100种重疾+50种轻症，多次赔付不分组',
      category: 'health',
      base_premium: 500,
      risk_factors: JSON.stringify({
        ageRange: [18, 60],
        healthOptions: ['excellent', 'good'],
        coverageOptions: [200000, 300000, 500000, 800000],
        termOptions: [240, 360]
      }),
      status: 'approved',
      coverage_details: JSON.stringify({
        coverageType: '重大疾病保险',
        majorIllnesses: 100,
        minorIllnesses: 50,
        payoutTimes: 3
      }),
      exclusions: JSON.stringify({
        standard: ['既往症', '遗传性疾病', '先天性畸形']
      }),
      created_by: null,
      approved_by: null
    },
    {
      id: uuidv4(),
      name: '出行无忧意外险',
      code: 'ACCIDENT-001-A',
      description: '综合意外伤害保障，覆盖出行、工作、生活全场景',
      category: 'accident',
      base_premium: 200,
      risk_factors: JSON.stringify({
        ageRange: [18, 70],
        healthOptions: ['excellent', 'good', 'fair', 'poor'],
        coverageOptions: [100000, 200000, 500000],
        termOptions: [12, 24]
      }),
      status: 'approved',
      coverage_details: JSON.stringify({
        coverageType: '意外伤害保险',
        benefits: ['意外身故', '意外伤残', '意外医疗', '住院津贴']
      }),
      exclusions: JSON.stringify({
        standard: ['故意自伤', '酗酒滋事', '高危极限运动']
      }),
      created_by: null,
      approved_by: null
    }
  ]
};

async function runSeed() {
  console.log('开始初始化数据...');
  
  const insertUserStmt = db.prepare(`
    INSERT OR IGNORE INTO users 
    (id, username, password, name, email, phone, role, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  
  for (const user of seedData.users) {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    insertUserStmt.run(
      user.id,
      user.username,
      hashedPassword,
      user.name,
      user.email,
      user.phone,
      user.role,
      user.status
    );
    console.log(`已创建用户: ${user.username} (${user.role})`);
  }
  
  const insertProductStmt = db.prepare(`
    INSERT OR IGNORE INTO products 
    (id, name, code, description, category, base_premium, risk_factors, status, 
     coverage_details, exclusions, created_by, approved_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  
  const adminUser = db.prepare('SELECT id FROM users WHERE role = ?').get(config.roles.ADMIN);
  const adminId = adminUser ? adminUser.id : null;
  
  for (const product of seedData.products) {
    insertProductStmt.run(
      product.id,
      product.name,
      product.code,
      product.description,
      product.category,
      product.base_premium,
      product.risk_factors,
      product.status,
      product.coverage_details,
      product.exclusions,
      adminId,
      adminId
    );
    console.log(`已创建产品: ${product.name} (${product.code})`);
  }
  
  console.log('数据初始化完成！');
  console.log('\n默认登录账号：');
  console.log('  管理员: admin / admin123');
  console.log('  代理人: agent1 / agent123');
  console.log('  核保员: underwriter1 / under123');
  console.log('  理赔员: claim1 / claim123');
  console.log('  投保人: user1 / user123');
}

runSeed().catch(console.error);
