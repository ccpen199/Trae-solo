import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const dbDir = path.join(projectRoot, 'data')
const dbPath = path.join(dbDir, 'app.sqlite')

import fs from 'fs'
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('brand', 'entrepreneur', 'admin')),
      name TEXT,
      avatar TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS brand_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      company_name TEXT,
      business_license TEXT,
      legal_person TEXT,
      established_year INTEGER,
      total_stores INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS entrepreneur_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      age INTEGER,
      city TEXT,
      budget_range TEXT,
      industry_preference TEXT,
      experience TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      industry TEXT NOT NULL,
      category TEXT,
      investment_min INTEGER NOT NULL,
      investment_max INTEGER NOT NULL,
      free_joining INTEGER DEFAULT 0,
      area_required TEXT,
      profit_model TEXT,
      description TEXT,
      cover_image TEXT,
      video_url TEXT,
      province TEXT,
      city TEXT,
      address TEXT,
      status TEXT DEFAULT 'pending',
      mengxintong_certified INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      reviewer_id INTEGER REFERENCES users(id),
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
      due_diligence_report TEXT,
      profit_verification TEXT,
      mengxintong_binding TEXT,
      comments TEXT,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS franchisee_lifecycle (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      entrepreneur_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      stage TEXT NOT NULL CHECK(stage IN ('lead', 'signed', 'opened', 'repurchase')),
      contact_name TEXT,
      contact_phone TEXT,
      intended_amount INTEGER,
      signed_amount INTEGER,
      signed_date DATE,
      store_name TEXT,
      store_address TEXT,
      opened_date DATE,
      repurchase_amount INTEGER,
      repurchase_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS risk_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entrepreneur_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      score INTEGER,
      risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high')),
      market_analysis TEXT,
      financial_analysis TEXT,
      competitor_analysis TEXT,
      recommendations TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contract_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      industry TEXT,
      content TEXT NOT NULL,
      version TEXT,
      status TEXT DEFAULT 'active',
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS performance_monitoring (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      franchisee_id INTEGER REFERENCES franchisee_lifecycle(id) ON DELETE CASCADE,
      month TEXT,
      revenue REAL,
      profit REAL,
      customer_count INTEGER,
      compliance_score INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dispute_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      franchisee_id INTEGER REFERENCES franchisee_lifecycle(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'processing', 'mediating', 'resolved', 'closed')),
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
      complainant_id INTEGER REFERENCES users(id),
      respondent_id INTEGER REFERENCES users(id),
      mediator_id INTEGER REFERENCES users(id),
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER REFERENCES dispute_tickets(id) ON DELETE CASCADE,
      sender_id INTEGER REFERENCES users(id),
      content TEXT NOT NULL,
      attachments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (phone, password, role, name) VALUES (?, ?, ?, ?)')
    
    const adminId = insertUser.run('13800000000', 'admin123', 'admin', '平台管理员').lastInsertRowid
    const brandId = insertUser.run('13800000001', 'brand123', 'brand', '喜茶加盟部').lastInsertRowid
    const brandId2 = insertUser.run('13800000002', 'brand123', 'brand', '蜜雪冰城招商').lastInsertRowid
    const entId = insertUser.run('13900000001', 'ent123', 'entrepreneur', '张先生').lastInsertRowid
    const entId2 = insertUser.run('13900000002', 'ent123', 'entrepreneur', '李女士').lastInsertRowid

    db.prepare('INSERT INTO brand_profiles (user_id, company_name, business_license, legal_person, established_year, total_stores, description) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      brandId, '深圳喜茶投资有限公司', '91440300MA5DXXXXXX', '聂云宸', 2012, 3000, '喜茶是一家专注于呈现来自世界各地优质茶香的茶饮品牌'
    )
    db.prepare('INSERT INTO brand_profiles (user_id, company_name, business_license, legal_person, established_year, total_stores, description) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      brandId2, '蜜雪冰城股份有限公司', '91410100MA40XXXXXX', '张红超', 1997, 36000, '蜜雪冰城是一家以新鲜冰淇淋-茶饮为主的连锁机构'
    )

    db.prepare('INSERT INTO entrepreneur_profiles (user_id, age, city, budget_range, industry_preference, experience) VALUES (?, ?, ?, ?, ?, ?)').run(
      entId, 32, '北京市朝阳区', '20-50万', '餐饮,茶饮', '5年零售业经验'
    )
    db.prepare('INSERT INTO entrepreneur_profiles (user_id, age, city, budget_range, industry_preference, experience) VALUES (?, ?, ?, ?, ?, ?)').run(
      entId2, 28, '上海市浦东新区', '10-30万', '餐饮,零售', '3年自主创业经验'
    )

    const insertProject = db.prepare(`
      INSERT INTO projects (brand_id, name, industry, category, investment_min, investment_max, free_joining, area_required, profit_model, description, cover_image, video_url, province, city, address, status, mengxintong_certified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertProject.run(
      brandId, '喜茶标准店', '餐饮', '茶饮', 30, 80, 0, '50-80㎡', 
      '毛利率65%，月均流水25万，回收期8-12个月',
      '喜茶标准店加盟项目，提供完整的品牌授权、选址支持、装修设计、技术培训、运营管理等一站式服务',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20milk%20tea%20shop%20interior%20bright%20clean&image_size=square',
      '', '广东省', '深圳市', '南山区科技园', 'approved', 1
    )

    insertProject.run(
      brandId, '喜茶GO店', '餐饮', '茶饮', 20, 40, 0, '20-40㎡',
      '毛利率65%，月均流水15万，回收期6-10个月',
      '喜茶GO店加盟项目，小面积高坪效，适合外卖+堂食结合模式',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=small%20modern%20takeout%20beverage%20shop&image_size=square',
      '', '广东省', '深圳市', '南山区科技园', 'approved', 1
    )

    insertProject.run(
      brandId2, '蜜雪冰城标准店', '餐饮', '茶饮', 15, 30, 0, '20-40㎡',
      '毛利率55%，月均流水12万，回收期6-9个月',
      '蜜雪冰城加盟项目，性价比高，受众广泛，下沉市场优势明显',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20ice%20cream%20and%20tea%20shop%20exterior&image_size=square',
      '', '河南省', '郑州市', '金水区', 'approved', 1
    )

    insertProject.run(
      brandId2, '蜜雪冰城冰淇淋站', '餐饮', '冷饮', 8, 15, 1, '10-20㎡',
      '毛利率60%，月均流水8万，回收期5-8个月',
      '蜜雪冰城冰淇淋站，免加盟费，低门槛创业，夏季爆款',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ice%20cream%20kiosk%20colorful%20summer&image_size=square',
      '', '河南省', '郑州市', '金水区', 'approved', 1
    )

    const insertFranchisee = db.prepare(`
      INSERT INTO franchisee_lifecycle (project_id, entrepreneur_id, stage, contact_name, contact_phone, intended_amount, signed_amount, signed_date, store_name, store_address, opened_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertFranchisee.run(1, entId, 'opened', '张先生', '13900000001', 500000, 480000, '2025-01-15', '喜茶北京朝阳大悦城店', '北京市朝阳区朝阳北路101号', '2025-03-20', '经营良好，月均流水30万')
    insertFranchisee.run(3, entId2, 'signed', '李女士', '13900000002', 250000, 230000, '2025-02-20', '', '', '', '正在选址中')
    insertFranchisee.run(2, entId, 'lead', '张先生', '13900000001', 300000, null, null, '', '', '', '意向咨询中')

    const insertTemplate = db.prepare('INSERT INTO contract_templates (name, industry, content, version, created_by) VALUES (?, ?, ?, ?, ?)')
    
    insertTemplate.run(
      '茶饮品牌加盟合同通用模板',
      '餐饮',
      `
      加盟合同模板
      
      甲方（品牌方）：____________________
      乙方（加盟商）：____________________
      
      第一条 合作内容
      1.1 甲方授权乙方在指定区域内经营"______"品牌加盟店。
      1.2 授权期限自____年__月__日至____年__月__日，共计__年。
      
      第二条 费用支付
      2.1 加盟费：人民币______元整，乙方需在签约后3个工作日内支付。
      2.2 保证金：人民币______元整，合同期满无违约无息退还。
      2.3 管理费：每月营业额的__%，于次月5日前支付。
      
      第三条 双方权利与义务
      3.1 甲方权利与义务
      3.2 乙方权利与义务
      
      第四条 经营管理
      
      第五条 违约责任
      
      第六条 争议解决
      
      第七条 其他条款
      
      甲方（盖章）：          乙方（签字）：
      日期：                  日期：
      `,
      'v1.0',
      adminId
    )

    insertTemplate.run(
      '餐饮品牌加盟服务合同',
      '餐饮',
      `
      餐饮加盟服务合同
      
      合同编号：____________
      签订日期：____________
      
      甲方（特许人）：
      统一社会信用代码：____________
      地址：____________
      
      乙方（被特许人）：
      身份证号/统一社会信用代码：____________
      地址：____________
      
      第一章 总则
      第二章 特许经营权
      第三章 加盟费用
      第四章 门店选址与装修
      第五章 培训与支持
      第六章 原材料供应
      第七章 运营管理
      第八章 知识产权
      第九章 合同终止与续约
      第十章 违约责任
      第十一章 争议解决
      第十二章 附则
      
      甲方（签章）：          乙方（签章）：
      法定代表人：            法定代表人：
      年 月 日                年 月 日
      `,
      'v2.0',
      adminId
    )

    insertTemplate.run(
      '品牌区域代理合同',
      '通用',
      `
      区域代理合同
      
      甲方（品牌方）：____________________
      乙方（代理商）：____________________
      
      第一条 代理区域
      1.1 甲方授权乙方为______省______市______区域的独家代理商。
      1.2 代理期限自____年__月__日至____年__月__日。
      
      第二条 代理费用
      2.1 区域代理费：人民币______万元整。
      2.2 保证金：人民币______万元整。
      
      第三条 业绩指标
      3.1 乙方承诺在代理期限内完成______家加盟店的开设目标。
      
      第四条 双方权利与义务
      
      第五条 收益分配
      
      第六条 合同终止
      
      第七条 违约责任
      
      甲方（盖章）：          乙方（签字）：
      日期：                  日期：
      `,
      'v1.0',
      adminId
    )

    const insertDispute = db.prepare(`
      INSERT INTO dispute_tickets (franchisee_id, title, description, category, status, priority, complainant_id, respondent_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertDispute.run(
      1,
      '原材料供应延迟问题',
      '近一个月以来，总部原材料供应经常延迟3-5天，导致门店经常断货，严重影响门店正常经营和客户体验。希望总部能够尽快解决物流配送问题。',
      'supply',
      'processing',
      'high',
      entId,
      brandId
    )

    insertDispute.run(
      2,
      '选址服务不满意',
      '签约后总部提供的3个选址方案都不符合预期，人流量和商圈都不理想，申请更换选址顾问或延长选址服务期限。',
      'service',
      'open',
      'normal',
      entId2,
      brandId2
    )
  }

  db.prepare(`
    UPDATE projects
    SET
      investment_min = ROUND(investment_min / 10000.0),
      investment_max = ROUND(investment_max / 10000.0)
    WHERE investment_min > 10000 OR investment_max > 10000
  `).run()

  const pendingCount = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'pending'").get() as { count: number }
  if (pendingCount.count === 0) {
    const brand = db.prepare("SELECT id FROM users WHERE role = 'brand' ORDER BY id LIMIT 1").get() as { id: number } | undefined
    if (brand) {
      const result = db.prepare(`
        INSERT INTO projects (
          brand_id, name, industry, category, investment_min, investment_max, free_joining,
          area_required, profit_model, description, cover_image, video_url, province, city, address, status, mengxintong_certified
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        brand.id,
        '蛙小侠标准加盟店',
        '餐饮',
        '特色餐饮',
        25,
        55,
        0,
        '60-100㎡',
        '毛利率58%，月均流水18万，预计9-12个月回本',
        '用于后台审核演示的待审核加盟项目，包含实地尽调、盈利模型验证和盟信通认证绑定流程。',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20restaurant%20franchise%20storefront%20bright&image_size=square',
        '',
        '江苏省',
        '南京市',
        '秦淮区核心商圈',
        'pending',
        0
      )
      db.prepare('INSERT INTO project_reviews (project_id, status) VALUES (?, ?)').run(result.lastInsertRowid, 'pending')
    }
  }
}

initDb()

export default db
