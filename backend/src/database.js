const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      department TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      meeting_date DATE NOT NULL,
      organizer_id TEXT REFERENCES users(id),
      content TEXT,
      status TEXT DEFAULT 'active',
      created_by TEXT REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS action_items (
      id TEXT PRIMARY KEY,
      meeting_id TEXT REFERENCES meetings(id),
      title TEXT NOT NULL,
      description TEXT,
      assignee_id TEXT REFERENCES users(id),
      due_date DATE,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      reminder_sent INTEGER DEFAULT 0,
      reminder_failed INTEGER DEFAULT 0,
      created_by TEXT REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operator_id TEXT REFERENCES users(id),
      operator_name TEXT NOT NULL,
      reason TEXT,
      old_value TEXT,
      new_value TEXT,
      affected_objects TEXT,
      recovery_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      action_item_id TEXT REFERENCES action_items(id),
      reminder_type TEXT NOT NULL,
      scheduled_at DATETIME NOT NULL,
      sent_at DATETIME,
      status TEXT DEFAULT 'pending',
      recipient_id TEXT REFERENCES users(id),
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS action_item_comments (
      id TEXT PRIMARY KEY,
      action_item_id TEXT REFERENCES action_items(id),
      user_id TEXT REFERENCES users(id),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      permissions TEXT NOT NULL
    );
  `);

  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');
  
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (id, username, password, name, role, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'admin', hashedPassword, '系统管理员', 'admin', 'admin@example.com');
  }

  const userExists = db.prepare('SELECT id FROM users WHERE username = ?').get('user1');
  if (!userExists) {
    const hashedPassword = bcrypt.hashSync('user123', 10);
    db.prepare(`
      INSERT INTO users (id, username, password, name, role, department, email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'user1', hashedPassword, '张三', 'user', '产品部', 'zhangsan@example.com');
  }

  const user2Exists = db.prepare('SELECT id FROM users WHERE username = ?').get('user2');
  if (!user2Exists) {
    const hashedPassword = bcrypt.hashSync('user123', 10);
    db.prepare(`
      INSERT INTO users (id, username, password, name, role, department, email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'user2', hashedPassword, '李四', 'user', '技术部', 'lisi@example.com');
  }

  const auditorExists = db.prepare('SELECT id FROM users WHERE username = ?').get('auditor');
  if (!auditorExists) {
    const hashedPassword = bcrypt.hashSync('audit123', 10);
    db.prepare(`
      INSERT INTO users (id, username, password, name, role, department, email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'auditor', hashedPassword, '王五', 'auditor', '审核部', 'wangwu@example.com');
  }

  const sampleMeetingExists = db.prepare('SELECT id FROM meetings LIMIT 1').get();
  if (!sampleMeetingExists) {
    const user1 = db.prepare('SELECT id FROM users WHERE username = ?').get('user1');
    const user2 = db.prepare('SELECT id FROM users WHERE username = ?').get('user2');
    const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');

    const meeting1Id = uuidv4();
    db.prepare(`
      INSERT INTO meetings (id, title, description, meeting_date, organizer_id, content, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      meeting1Id,
      'Q2产品规划会议',
      '讨论第二季度产品路线图和优先级',
      '2026-05-20',
      user1.id,
      '会议内容：\n1. 产品路线图回顾\n2. Q2目标确认\n3. 资源分配讨论\n4. 风险评估',
      'active',
      user1.id
    );

    const meeting2Id = uuidv4();
    db.prepare(`
      INSERT INTO meetings (id, title, description, meeting_date, organizer_id, content, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      meeting2Id,
      '技术架构升级评审会',
      '评审新一代技术架构设计方案',
      '2026-05-22',
      user2.id,
      '会议内容：\n1. 现有架构问题分析\n2. 新架构方案介绍\n3. 迁移计划讨论',
      'active',
      user2.id
    );

    const meeting3Id = uuidv4();
    db.prepare(`
      INSERT INTO meetings (id, title, description, meeting_date, organizer_id, content, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      meeting3Id,
      '团队周例会',
      '每周例行同步会议',
      '2026-05-15',
      admin.id,
      '会议内容：\n1. 上周工作总结\n2. 本周计划安排\n3. 问题和风险同步',
      'completed',
      admin.id
    );

    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - 10);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 7);
    const farFutureDate = new Date(today);
    farFutureDate.setDate(farFutureDate.getDate() + 30);

    const action1Id = uuidv4();
    db.prepare(`
      INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by, reminder_failed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      action1Id,
      meeting1Id,
      '完成Q2产品需求文档',
      '整理Q2所有功能需求并输出正式文档',
      user1.id,
      futureDate.toISOString().split('T')[0],
      'high',
      'pending',
      user1.id,
      0
    );

    const action2Id = uuidv4();
    db.prepare(`
      INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      action2Id,
      meeting1Id,
      '设计Q2运营活动方案',
      '设计配合产品上线的运营推广活动',
      null,
      futureDate.toISOString().split('T')[0],
      'medium',
      'pending',
      user1.id
    );

    const action3Id = uuidv4();
    db.prepare(`
      INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      action3Id,
      meeting2Id,
      '技术选型调研报告',
      '调研主流微服务框架并输出对比报告',
      user2.id,
      null,
      'high',
      'pending',
      user2.id
    );

    const action4Id = uuidv4();
    db.prepare(`
      INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by, reminder_failed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      action4Id,
      meeting2Id,
      '架构图设计',
      '绘制系统架构图和数据流图',
      user2.id,
      pastDate.toISOString().split('T')[0],
      'high',
      'pending',
      user2.id,
      1
    );

    const action5Id = uuidv4();
    db.prepare(`
      INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      action5Id,
      meeting2Id,
      '架构图设计',
      '绘制系统架构图和数据流图',
      user1.id,
      futureDate.toISOString().split('T')[0],
      'high',
      'pending',
      user1.id
    );

    const action6Id = uuidv4();
    db.prepare(`
      INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      action6Id,
      meeting3Id,
      '整理会议纪要模板',
      '优化团队会议纪要记录模板',
      admin.id,
      pastDate.toISOString().split('T')[0],
      'low',
      'completed',
      admin.id
    );

    const action7Id = uuidv4();
    db.prepare(`
      INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      action7Id,
      meeting3Id,
      '同步团队进度',
      '在团队群里同步本周工作进度',
      admin.id,
      pastDate.toISOString().split('T')[0],
      'low',
      'completed',
      admin.id
    );

    const action8Id = uuidv4();
    db.prepare(`
      INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      action8Id,
      meeting1Id,
      '竞品分析报告',
      '收集并分析主要竞品的最新动态',
      user1.id,
      farFutureDate.toISOString().split('T')[0],
      'medium',
      'in_progress',
      user1.id
    );
  }
}

function resetSampleData() {
  const { v4: uuidv4 } = require('uuid');
  
  db.prepare('DELETE FROM action_item_comments').run();
  db.prepare('DELETE FROM reminders').run();
  db.prepare('DELETE FROM audit_logs').run();
  db.prepare('DELETE FROM action_items').run();
  db.prepare('DELETE FROM meetings').run();

  const user1 = db.prepare('SELECT id FROM users WHERE username = ?').get('user1');
  const user2 = db.prepare('SELECT id FROM users WHERE username = ?').get('user2');
  const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');

  const meeting1Id = uuidv4();
  db.prepare(`
    INSERT INTO meetings (id, title, description, meeting_date, organizer_id, content, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    meeting1Id,
    'Q2产品规划会议',
    '讨论第二季度产品路线图和优先级',
    '2026-05-20',
    user1.id,
    `【Q2产品规划会议纪要】
时间：2026年5月20日
参会：张三、李四、王五

会议内容：
1. 回顾Q1产品完成情况，整体达成率85%
2. 讨论Q2产品路线图和功能优先级
3. 明确各功能模块的负责人和时间节点

行动项：
- 张三负责完成Q2产品需求文档，5月30日前提交
- 李四牵头进行竞品分析报告，下周三之前完成
- 王五对接市场部收集用户反馈，本周内整理完毕

需要注意的事项：
- 用户增长模块优先级最高，需要尽快启动
- 支付模块需要法务审核，后续跟进`,
    'active',
    user1.id
  );

  const meeting2Id = uuidv4();
  db.prepare(`
    INSERT INTO meetings (id, title, description, meeting_date, organizer_id, content, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    meeting2Id,
    '技术架构升级评审会',
    '评审新一代技术架构设计方案',
    '2026-05-22',
    user2.id,
    `【技术架构升级评审会纪要】
时间：2026年5月22日
参会：李四、技术团队

一、现有架构问题分析
1. 数据库性能瓶颈，高峰期响应慢
2. 微服务拆分不合理，耦合度高

二、新架构方案讨论
- 李四：建议采用K8s容器化部署
- 团队一致同意引入消息队列解耦

三、后续工作安排
1. 李四负责完成架构图设计，紧急！
2. 技术选型调研，输出对比报告
3. 制定详细的迁移计划和回滚方案

四、风险评估
- 迁移周期预计2个月，需要协调资源`,
    'active',
    user2.id
  );

  const meeting3Id = uuidv4();
  db.prepare(`
    INSERT INTO meetings (id, title, description, meeting_date, organizer_id, content, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    meeting3Id,
    '团队周例会',
    '每周例行同步会议',
    '2026-05-15',
    admin.id,
    `【团队周例会纪要】
时间：2026年5月15日
主持人：系统管理员

上周工作总结：
- 完成v1.2版本发布
- 修复了10个线上bug

本周计划：
- 系统管理员负责整理会议纪要模板
- 同步团队进度，更新项目看板

其他事项：
- 下周一进行团建活动，请大家安排好手头上的工作`,
    'completed',
    admin.id
  );

  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(pastDate.getDate() - 10);
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + 7);
  const farFutureDate = new Date(today);
  farFutureDate.setDate(farFutureDate.getDate() + 30);

  const action1Id = uuidv4();
  db.prepare(`
    INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by, reminder_failed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    action1Id,
    meeting1Id,
    '完成Q2产品需求文档',
    '整理Q2所有功能需求并输出正式文档',
    user1.id,
    futureDate.toISOString().split('T')[0],
    'high',
    'pending',
    user1.id,
    0
  );

  const action2Id = uuidv4();
  db.prepare(`
    INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    action2Id,
    meeting1Id,
    '设计Q2运营活动方案',
    '设计配合产品上线的运营推广活动',
    null,
    futureDate.toISOString().split('T')[0],
    'medium',
    'pending',
    user1.id
  );

  const action3Id = uuidv4();
  db.prepare(`
    INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    action3Id,
    meeting2Id,
    '技术选型调研报告',
    '调研主流微服务框架并输出对比报告',
    user2.id,
    null,
    'high',
    'pending',
    user2.id
  );

  const action4Id = uuidv4();
  db.prepare(`
    INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by, reminder_failed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    action4Id,
    meeting2Id,
    '架构图设计',
    '绘制系统架构图和数据流图',
    user2.id,
    pastDate.toISOString().split('T')[0],
    'high',
    'pending',
    user2.id,
    1
  );

  const action5Id = uuidv4();
  db.prepare(`
    INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    action5Id,
    meeting2Id,
    '架构图设计',
    '绘制系统架构图和数据流图',
    user1.id,
    futureDate.toISOString().split('T')[0],
    'high',
    'pending',
    user1.id
  );

  const action6Id = uuidv4();
  db.prepare(`
    INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    action6Id,
    meeting3Id,
    '整理会议纪要模板',
    '优化团队会议纪要记录模板',
    admin.id,
    pastDate.toISOString().split('T')[0],
    'low',
    'completed',
    admin.id
  );

  const action7Id = uuidv4();
  db.prepare(`
    INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    action7Id,
    meeting3Id,
    '同步团队进度',
    '在团队群里同步本周工作进度',
    admin.id,
    pastDate.toISOString().split('T')[0],
    'low',
    'completed',
    admin.id
  );

  const action8Id = uuidv4();
  db.prepare(`
    INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    action8Id,
    meeting1Id,
    '竞品分析报告',
    '收集并分析主要竞品的最新动态',
    user1.id,
    farFutureDate.toISOString().split('T')[0],
    'medium',
    'in_progress',
    user1.id
  );

  return { message: '示例数据已重置' };
}

module.exports = { db, initDatabase, resetSampleData };
