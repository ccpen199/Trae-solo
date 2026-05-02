require('dotenv').config({ path: '../../.env' });
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { createTables } = require('../database/schema');

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const fullDbPath = path.resolve(__dirname, '..', '..', dbPath);

const dataDir = path.dirname(fullDbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(fullDbPath);

const initDatabase = () => {
  console.log('开始初始化数据库...');
  
  try {
    db.exec('BEGIN TRANSACTION');
    
    createTables(db);
    
    seedData();
    
    db.exec('COMMIT');
    console.log('数据库初始化完成！');
    console.log(`数据库路径: ${fullDbPath}`);
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('数据库初始化失败:', error);
    throw error;
  } finally {
    db.close();
  }
};

const seedData = () => {
  console.log('开始插入种子数据...');
  
  const saltRounds = 10;
  const defaultPassword = '123456';
  const passwordHash = bcrypt.hashSync(defaultPassword, saltRounds);
  
  const roles = [
    { id: 'role_admin', name: 'admin', display_name: '系统管理员', description: '系统超级管理员' },
    { id: 'role_operator', name: 'operator', display_name: '运营经理', description: '负责套餐配置和运营管理' },
    { id: 'role_subscriber', name: 'subscriber', display_name: '订阅用户', description: '订阅服务的普通用户' },
    { id: 'role_finance', name: 'finance', display_name: '财务专员', description: '负责财务报表和账单审计' },
    { id: 'role_tech', name: 'tech_lead', display_name: '技术负责人', description: '负责系统配置和技术监控' },
  ];
  
  const insertRole = db.prepare(`
    INSERT INTO roles (id, name, display_name, description)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `);
  
  roles.forEach(role => {
    insertRole.run(role.id, role.name, role.display_name, role.description);
  });
  
  const permissions = [
    { id: 'perm_plan_create', name: 'plan:create', display_name: '创建套餐', category: 'plan' },
    { id: 'perm_plan_read', name: 'plan:read', display_name: '查看套餐', category: 'plan' },
    { id: 'perm_plan_update', name: 'plan:update', display_name: '更新套餐', category: 'plan' },
    { id: 'perm_plan_delete', name: 'plan:delete', display_name: '删除套餐', category: 'plan' },
    { id: 'perm_subscription_read', name: 'subscription:read', display_name: '查看订阅', category: 'subscription' },
    { id: 'perm_subscription_manage', name: 'subscription:manage', display_name: '管理订阅', category: 'subscription' },
    { id: 'perm_invoice_read', name: 'invoice:read', display_name: '查看账单', category: 'invoice' },
    { id: 'perm_finance_report', name: 'finance:report', display_name: '财务报表', category: 'finance' },
    { id: 'perm_finance_audit', name: 'finance:audit', display_name: '审计查询', category: 'finance' },
    { id: 'perm_entitlement_manage', name: 'entitlement:manage', display_name: '权益管理', category: 'entitlement' },
    { id: 'perm_notification_manage', name: 'notification:manage', display_name: '通知管理', category: 'notification' },
    { id: 'perm_system_config', name: 'system:config', display_name: '系统配置', category: 'system' },
    { id: 'perm_audit_log', name: 'audit:log', display_name: '审计日志', category: 'audit' },
  ];
  
  const insertPermission = db.prepare(`
    INSERT INTO permissions (id, name, display_name, category)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `);
  
  permissions.forEach(perm => {
    insertPermission.run(perm.id, perm.name, perm.display_name, perm.category);
  });
  
  const rolePermissions = {
    'role_admin': permissions.map(p => p.id),
    'role_operator': [
      'perm_plan_create', 'perm_plan_read', 'perm_plan_update',
      'perm_subscription_read', 'perm_subscription_manage'
    ],
    'role_finance': [
      'perm_invoice_read', 'perm_finance_report', 'perm_finance_audit',
      'perm_audit_log'
    ],
    'role_tech': [
      'perm_system_config', 'perm_entitlement_manage', 'perm_notification_manage',
      'perm_audit_log'
    ],
    'role_subscriber': [
      'perm_plan_read', 'perm_subscription_read', 'perm_invoice_read'
    ]
  };
  
  const insertRolePermission = db.prepare(`
    INSERT INTO role_permissions (id, role_id, permission_id)
    VALUES (?, ?, ?)
    ON CONFLICT(role_id, permission_id) DO NOTHING
  `);
  
  Object.entries(rolePermissions).forEach(([roleId, permIds]) => {
    permIds.forEach(permId => {
      insertRolePermission.run(uuidv4(), roleId, permId);
    });
  });
  
  const users = [
    {
      id: 'user_admin',
      username: 'admin',
      email: 'admin@example.com',
      display_name: '系统管理员',
      roles: ['role_admin']
    },
    {
      id: 'user_operator_1',
      username: 'operator1',
      email: 'operator1@example.com',
      display_name: '运营经理-张三',
      roles: ['role_operator']
    },
    {
      id: 'user_finance_1',
      username: 'finance1',
      email: 'finance1@example.com',
      display_name: '财务专员-李四',
      roles: ['role_finance']
    },
    {
      id: 'user_tech_1',
      username: 'tech1',
      email: 'tech1@example.com',
      display_name: '技术负责人-王五',
      roles: ['role_tech']
    },
    {
      id: 'user_sub_1',
      username: 'user1',
      email: 'user1@example.com',
      display_name: '订阅用户-赵六',
      roles: ['role_subscriber']
    },
  ];
  
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, email, password_hash, display_name, status)
    VALUES (?, ?, ?, ?, ?, 'active')
    ON CONFLICT(id) DO NOTHING
  `);
  
  const insertUserRole = db.prepare(`
    INSERT INTO user_roles (id, user_id, role_id)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, role_id) DO NOTHING
  `);
  
  users.forEach(user => {
    insertUser.run(user.id, user.username, user.email, passwordHash, user.display_name);
    user.roles.forEach(roleId => {
      insertUserRole.run(uuidv4(), user.id, roleId);
    });
  });
  
  const plans = [
    {
      id: 'plan_basic_monthly',
      name: 'basic_monthly',
      display_name: '基础版-月付',
      description: '适合个人用户的基础订阅服务',
      billing_cycle: 'monthly',
      price: 29.00,
      status: 'active',
      trial_days: 7,
      features: [
        { key: 'api_calls', name: 'API调用次数', value: '1000', type: 'numeric', isPrimary: true },
        { key: 'storage', name: '存储空间', value: '5GB', type: 'string' },
        { key: 'support', name: '技术支持', value: '邮件支持', type: 'string' },
        { key: 'concurrent_users', name: '并发用户数', value: '1', type: 'numeric' },
      ]
    },
    {
      id: 'plan_pro_monthly',
      name: 'pro_monthly',
      display_name: '专业版-月付',
      description: '适合小型团队的专业订阅服务',
      billing_cycle: 'monthly',
      price: 99.00,
      status: 'active',
      trial_days: 14,
      features: [
        { key: 'api_calls', name: 'API调用次数', value: '10000', type: 'numeric', isPrimary: true },
        { key: 'storage', name: '存储空间', value: '50GB', type: 'string' },
        { key: 'support', name: '技术支持', value: '优先邮件+电话', type: 'string' },
        { key: 'concurrent_users', name: '并发用户数', value: '5', type: 'numeric' },
        { key: 'analytics', name: '数据分析', value: '高级分析', type: 'string' },
      ]
    },
    {
      id: 'plan_enterprise_monthly',
      name: 'enterprise_monthly',
      display_name: '企业版-月付',
      description: '适合大型企业的企业级订阅服务',
      billing_cycle: 'monthly',
      price: 499.00,
      status: 'active',
      trial_days: 30,
      features: [
        { key: 'api_calls', name: 'API调用次数', value: '无限制', type: 'string', isPrimary: true },
        { key: 'storage', name: '存储空间', value: '1TB', type: 'string' },
        { key: 'support', name: '技术支持', value: '7x24专属客服', type: 'string' },
        { key: 'concurrent_users', name: '并发用户数', value: '无限制', type: 'string' },
        { key: 'analytics', name: '数据分析', value: '企业级分析', type: 'string' },
        { key: 'custom_integration', name: '定制集成', value: '支持', type: 'boolean' },
        { key: 'sso', name: '单点登录', value: '支持', type: 'boolean' },
      ]
    },
    {
      id: 'plan_basic_yearly',
      name: 'basic_yearly',
      display_name: '基础版-年付',
      description: '适合个人用户的年付套餐，享8折优惠',
      billing_cycle: 'yearly',
      price: 278.40,
      status: 'active',
      trial_days: 7,
      features: [
        { key: 'api_calls', name: 'API调用次数', value: '1000/月', type: 'string', isPrimary: true },
        { key: 'storage', name: '存储空间', value: '5GB', type: 'string' },
        { key: 'support', name: '技术支持', value: '邮件支持', type: 'string' },
        { key: 'saving', name: '年付优惠', value: '省69.6元', type: 'string' },
      ]
    },
  ];
  
  const insertPlan = db.prepare(`
    INSERT INTO plans (id, name, display_name, description, billing_cycle, price, status, trial_days)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `);
  
  const insertFeature = db.prepare(`
    INSERT INTO plan_features (id, plan_id, feature_key, feature_name, feature_value, feature_type, is_primary, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let featureSortOrder = 0;
  plans.forEach(plan => {
    insertPlan.run(plan.id, plan.name, plan.display_name, plan.description, 
                   plan.billing_cycle, plan.price, plan.status, plan.trial_days);
    
    plan.features.forEach(feature => {
      insertFeature.run(
        uuidv4(), 
        plan.id, 
        feature.key, 
        feature.name, 
        feature.value, 
        feature.type, 
        feature.isPrimary ? 1 : 0,
        featureSortOrder++
      );
    });
  });
  
  const notificationTemplates = [
    {
      id: 'tmpl_subscription_created',
      template_key: 'subscription_created',
      type: 'email',
      title_template: '欢迎订阅 {planName}！',
      content_template: '尊敬的 {userName}：\n\n感谢您订阅我们的 {planName} 服务。\n\n订阅详情：\n- 套餐：{planName}\n- 价格：¥{price}\n- 生效时间：{startDate}\n- 到期时间：{endDate}\n\n如有任何问题，请随时联系我们。',
      variables: JSON.stringify(['userName', 'planName', 'price', 'startDate', 'endDate'])
    },
    {
      id: 'tmpl_payment_success',
      template_key: 'payment_success',
      type: 'email',
      title_template: '支付成功通知',
      content_template: '尊敬的 {userName}：\n\n您的账单 #{invoiceNumber} 已支付成功。\n\n支付详情：\n- 金额：¥{amount}\n- 支付时间：{paymentTime}\n- 账单周期：{billingPeriod}\n\n感谢您的支持！',
      variables: JSON.stringify(['userName', 'invoiceNumber', 'amount', 'paymentTime', 'billingPeriod'])
    },
    {
      id: 'tmpl_payment_failed',
      template_key: 'payment_failed',
      type: 'email',
      title_template: '扣款失败提醒',
      content_template: '尊敬的 {userName}：\n\n很抱歉，您的自动扣款失败了。\n\n账单详情：\n- 账单号：#{invoiceNumber}\n- 金额：¥{amount}\n- 失败原因：{failureReason}\n\n请尽快前往账户中心完成支付，以免影响您的服务使用。',
      variables: JSON.stringify(['userName', 'invoiceNumber', 'amount', 'failureReason'])
    },
    {
      id: 'tmpl_renewal_reminder',
      template_key: 'renewal_reminder',
      type: 'email',
      title_template: '订阅即将到期提醒',
      content_template: '尊敬的 {userName}：\n\n您的订阅服务将于 {expiryDate} 到期。\n\n订阅详情：\n- 套餐：{planName}\n- 下次扣款金额：¥{amount}\n- 扣款日期：{nextBillingDate}\n\n为确保服务不中断，请确保支付方式有效。',
      variables: JSON.stringify(['userName', 'planName', 'expiryDate', 'amount', 'nextBillingDate'])
    },
    {
      id: 'tmpl_subscription_cancelled',
      template_key: 'subscription_cancelled',
      type: 'email',
      title_template: '订阅已取消',
      content_template: '尊敬的 {userName}：\n\n您的订阅已成功取消。\n\n取消详情：\n- 套餐：{planName}\n- 取消时间：{cancelledAt}\n- 服务终止时间：{endDate}\n\n您可以在 {endDate} 前继续使用服务。期待您的再次订阅！',
      variables: JSON.stringify(['userName', 'planName', 'cancelledAt', 'endDate'])
    },
    {
      id: 'tmpl_entitlement_suspended',
      template_key: 'entitlement_suspended',
      type: 'in_app',
      title_template: '权益已暂停',
      content_template: '由于账单逾期，您的部分权益已暂时暂停。请尽快完成支付以恢复服务。',
      variables: JSON.stringify([])
    },
  ];
  
  const insertTemplate = db.prepare(`
    INSERT INTO notification_templates (id, template_key, type, title_template, content_template, variables)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(template_key) DO NOTHING
  `);
  
  notificationTemplates.forEach(tmpl => {
    insertTemplate.run(tmpl.id, tmpl.template_key, tmpl.type, tmpl.title_template, tmpl.content_template, tmpl.variables);
  });
  
  const systemConfigs = [
    { id: 'cfg_billing_time', config_key: 'billing.daily_time', config_value: '03:00', description: '每日账单处理时间' },
    { id: 'cfg_reminder_days', config_key: 'renewal.reminder_days', config_value: '3', description: '到期前提醒天数' },
    { id: 'cfg_grace_period', config_key: 'payment.grace_period_days', config_value: '7', description: '支付宽限期天数' },
    { id: 'cfg_max_retries', config_key: 'payment.max_retries', config_value: '3', description: '支付失败最大重试次数' },
    { id: 'cfg_tax_rate', config_key: 'tax.rate', config_value: '0.06', description: '税率（增值税）' },
  ];
  
  const insertConfig = db.prepare(`
    INSERT INTO system_configs (id, config_key, config_value, description)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(config_key) DO NOTHING
  `);
  
  systemConfigs.forEach(cfg => {
    insertConfig.run(cfg.id, cfg.config_key, cfg.config_value, cfg.description);
  });
  
  console.log('种子数据插入完成');
  console.log('默认账号（密码均为 123456）：');
  users.forEach(u => {
    console.log(`  - ${u.username} (${u.display_name})`);
  });
};

initDatabase();
