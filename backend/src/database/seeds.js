const dayjs = require('dayjs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const ROLES = [
  { id: 'role_merchant', code: 'MERCHANT', name: '商户操作员', description: '商户端操作人员，可创建收款、查看交易' },
  { id: 'role_merchant_admin', code: 'MERCHANT_ADMIN', name: '商户管理员', description: '商户管理员，可管理商户信息、查看报表' },
  { id: 'role_buyer', code: 'BUYER', name: '买家', description: '买家角色，查看和支付订单' },
  { id: 'role_payment', code: 'PAYMENT_INSTITUTION', name: '支付机构', description: '支付机构操作员，处理支付' },
  { id: 'role_bank', code: 'BANK', name: '银行', description: '银行操作员，处理结算' },
  { id: 'role_compliance', code: 'COMPLIANCE', name: '合规审核员', description: '合规审核人员，KYC审核、交易监控' },
  { id: 'role_finance', code: 'FINANCE', name: '财务人员', description: '财务人员，对账、结算处理' },
  { id: 'role_admin', code: 'ADMIN', name: '系统管理员', description: '系统管理员，全权限' },
];

const PERMISSIONS = [
  { id: 'perm_merchant_view', code: 'MERCHANT_VIEW', name: '查看商户', module: 'merchant', description: '查看商户信息' },
  { id: 'perm_merchant_edit', code: 'MERCHANT_EDIT', name: '编辑商户', module: 'merchant', description: '编辑商户信息' },
  { id: 'perm_collection_create', code: 'COLLECTION_CREATE', name: '创建收款', module: 'collection', description: '创建收款单' },
  { id: 'perm_collection_view', code: 'COLLECTION_VIEW', name: '查看收款', module: 'collection', description: '查看收款单' },
  { id: 'perm_collection_edit', code: 'COLLECTION_EDIT', name: '编辑收款', module: 'collection', description: '编辑收款单' },
  { id: 'perm_payment_process', code: 'PAYMENT_PROCESS', name: '处理支付', module: 'payment', description: '处理支付操作' },
  { id: 'perm_payment_view', code: 'PAYMENT_VIEW', name: '查看支付', module: 'payment', description: '查看支付记录' },
  { id: 'perm_kyc_review', code: 'KYC_REVIEW', name: 'KYC审核', module: 'compliance', description: 'KYC资格审核' },
  { id: 'perm_compliance_audit', code: 'COMPLIANCE_AUDIT', name: '合规审核', module: 'compliance', description: '合规检查审核' },
  { id: 'perm_settlement_process', code: 'SETTLEMENT_PROCESS', name: '处理结算', module: 'settlement', description: '处理结算操作' },
  { id: 'perm_settlement_view', code: 'SETTLEMENT_VIEW', name: '查看结算', module: 'settlement', description: '查看结算记录' },
  { id: 'perm_reconciliation_process', code: 'RECONCILIATION_PROCESS', name: '处理对账', module: 'reconciliation', description: '处理对账操作' },
  { id: 'perm_report_view', code: 'REPORT_VIEW', name: '查看报表', module: 'report', description: '查看统计报表' },
  { id: 'perm_report_export', code: 'REPORT_EXPORT', name: '导出报表', module: 'report', description: '导出统计报表' },
  { id: 'perm_audit_view', code: 'AUDIT_VIEW', name: '查看审计', module: 'audit', description: '查看审计日志' },
  { id: 'perm_user_manage', code: 'USER_MANAGE', name: '用户管理', module: 'system', description: '管理系统用户' },
  { id: 'perm_role_manage', code: 'ROLE_MANAGE', name: '角色管理', module: 'system', description: '管理角色权限' },
  { id: 'perm_rate_manage', code: 'RATE_MANAGE', name: '汇率管理', module: 'system', description: '管理汇率配置' },
];

const ROLE_PERMISSIONS = {
  MERCHANT: ['COLLECTION_CREATE', 'COLLECTION_VIEW', 'COLLECTION_EDIT', 'SETTLEMENT_VIEW', 'REPORT_VIEW'],
  MERCHANT_ADMIN: ['MERCHANT_VIEW', 'MERCHANT_EDIT', 'COLLECTION_CREATE', 'COLLECTION_VIEW', 'COLLECTION_EDIT', 
                   'SETTLEMENT_VIEW', 'REPORT_VIEW', 'REPORT_EXPORT'],
  BUYER: ['PAYMENT_VIEW'],
  PAYMENT_INSTITUTION: ['PAYMENT_PROCESS', 'PAYMENT_VIEW'],
  BANK: ['SETTLEMENT_PROCESS', 'SETTLEMENT_VIEW', 'RECONCILIATION_PROCESS'],
  COMPLIANCE: ['KYC_REVIEW', 'COMPLIANCE_AUDIT', 'COLLECTION_VIEW', 'PAYMENT_VIEW', 'AUDIT_VIEW'],
  FINANCE: ['SETTLEMENT_PROCESS', 'SETTLEMENT_VIEW', 'RECONCILIATION_PROCESS', 'REPORT_VIEW', 'REPORT_EXPORT'],
  ADMIN: ['MERCHANT_VIEW', 'MERCHANT_EDIT', 'COLLECTION_CREATE', 'COLLECTION_VIEW', 'COLLECTION_EDIT',
          'PAYMENT_PROCESS', 'PAYMENT_VIEW', 'KYC_REVIEW', 'COMPLIANCE_AUDIT',
          'SETTLEMENT_PROCESS', 'SETTLEMENT_VIEW', 'RECONCILIATION_PROCESS',
          'REPORT_VIEW', 'REPORT_EXPORT', 'AUDIT_VIEW', 'USER_MANAGE', 'ROLE_MANAGE', 'RATE_MANAGE'],
};

const WORKFLOW_NODES = [
  {
    id: 'node_create',
    code: 'CREATE_COLLECTION',
    name: '创建收款',
    module: 'collection',
    description: '商户创建收款单，填写多币种账户相关字段',
    allowed_roles: JSON.stringify(['MERCHANT', 'MERCHANT_ADMIN', 'ADMIN']),
    allowed_actions: JSON.stringify(['save', 'submit', 'cancel']),
    next_nodes: JSON.stringify(['WAITING_PAYMENT']),
    sort_order: 1,
  },
  {
    id: 'node_wait_payment',
    code: 'WAITING_PAYMENT',
    name: '待支付',
    module: 'payment',
    description: '等待买家或支付机构处理支付',
    allowed_roles: JSON.stringify(['BUYER', 'PAYMENT_INSTITUTION', 'ADMIN']),
    allowed_actions: JSON.stringify(['lock_rate', 'process_payment', 'cancel']),
    next_nodes: JSON.stringify(['EXCHANGE_RATE', 'EXCEPTION_HANDLE']),
    sort_order: 2,
  },
  {
    id: 'node_exchange',
    code: 'EXCHANGE_RATE',
    name: '汇率换算',
    module: 'exchange',
    description: '根据锁定的汇率进行币种换算',
    allowed_roles: JSON.stringify(['SYSTEM', 'ADMIN']),
    allowed_actions: JSON.stringify(['convert', 'manual_adjust']),
    next_nodes: JSON.stringify(['COMPLIANCE_AUDIT', 'EXCEPTION_HANDLE']),
    sort_order: 3,
  },
  {
    id: 'node_compliance',
    code: 'COMPLIANCE_AUDIT',
    name: '合规审核',
    module: 'compliance',
    description: 'KYC校验和合规审核',
    allowed_roles: JSON.stringify(['COMPLIANCE', 'ADMIN']),
    allowed_actions: JSON.stringify(['approve', 'reject', 'request_more', 'reassign']),
    next_nodes: JSON.stringify(['WAITING_SETTLEMENT', 'EXCEPTION_HANDLE']),
    sort_order: 4,
  },
  {
    id: 'node_wait_settlement',
    code: 'WAITING_SETTLEMENT',
    name: '待结算',
    module: 'settlement',
    description: '等待结算到账处理',
    allowed_roles: JSON.stringify(['FINANCE', 'BANK', 'ADMIN']),
    allowed_actions: JSON.stringify(['process_settlement', 'cancel']),
    next_nodes: JSON.stringify(['SETTLEMENT_COMPLETED', 'EXCEPTION_HANDLE']),
    sort_order: 5,
  },
  {
    id: 'node_completed',
    code: 'SETTLEMENT_COMPLETED',
    name: '结算完成',
    module: 'settlement',
    description: '结算到账完成',
    allowed_roles: JSON.stringify([]),
    allowed_actions: JSON.stringify([]),
    next_nodes: JSON.stringify([]),
    is_terminal: 1,
    sort_order: 6,
  },
  {
    id: 'node_exception',
    code: 'EXCEPTION_HANDLE',
    name: '异常处理',
    module: 'exception',
    description: '差异核查和异常处理',
    allowed_roles: JSON.stringify(['FINANCE', 'COMPLIANCE', 'ADMIN']),
    allowed_actions: JSON.stringify(['investigate', 'resolve', 'retry', 'escalate']),
    next_nodes: JSON.stringify(['CREATE_COLLECTION', 'WAITING_PAYMENT', 'EXCHANGE_RATE', 'COMPLIANCE_AUDIT', 'WAITING_SETTLEMENT']),
    sort_order: 99,
  },
];

const DEFAULT_MERCHANT = {
  id: 'merchant_demo',
  code: 'M001',
  name: '演示跨境电商有限公司',
  legal_name: 'Demo Cross-border E-commerce Co., Ltd.',
  business_license: 'BL123456789',
  tax_id: 'TAX987654321',
  country: 'CN',
  currency: 'CNY',
  contact_person: '张三',
  contact_email: 'contact@demo.com',
  contact_phone: '+86-13800138000',
  kyc_status: 'APPROVED',
  credit_limit: 1000000,
  risk_score: 85,
};

const DEFAULT_PAYMENT_INSTITUTIONS = [
  {
    id: 'pi_alipay',
    code: 'ALIPAY',
    name: '支付宝国际',
    type: 'THIRD_PARTY',
    country: 'CN',
    supported_currencies: JSON.stringify(['CNY', 'USD', 'EUR', 'GBP', 'JPY']),
    fee_config: JSON.stringify({ percentage: 0.015, minimum: 1 }),
  },
  {
    id: 'pi_stripe',
    code: 'STRIPE',
    name: 'Stripe',
    type: 'THIRD_PARTY',
    country: 'US',
    supported_currencies: JSON.stringify(['USD', 'EUR', 'GBP', 'JPY', 'CNY']),
    fee_config: JSON.stringify({ percentage: 0.029, fixed: 0.3 }),
  },
  {
    id: 'pi_paypal',
    code: 'PAYPAL',
    name: 'PayPal',
    type: 'THIRD_PARTY',
    country: 'US',
    supported_currencies: JSON.stringify(['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD']),
    fee_config: JSON.stringify({ percentage: 0.044, fixed: 0.3 }),
  },
];

const DEFAULT_EXCHANGE_RATES = [
  { base_currency: 'USD', target_currency: 'CNY', rate: 7.25, source: 'SYSTEM' },
  { base_currency: 'EUR', target_currency: 'CNY', rate: 7.85, source: 'SYSTEM' },
  { base_currency: 'GBP', target_currency: 'CNY', rate: 9.15, source: 'SYSTEM' },
  { base_currency: 'JPY', target_currency: 'CNY', rate: 0.048, source: 'SYSTEM' },
  { base_currency: 'CNY', target_currency: 'USD', rate: 0.138, source: 'SYSTEM' },
  { base_currency: 'CNY', target_currency: 'EUR', rate: 0.127, source: 'SYSTEM' },
];

function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
}

const DEFAULT_USERS = [
  {
    id: 'user_admin',
    username: 'admin',
    password: hashPassword('admin123'),
    name: '系统管理员',
    email: 'admin@system.com',
    phone: '+86-13800000001',
    role_id: 'role_admin',
    merchant_id: null,
  },
  {
    id: 'user_merchant1',
    username: 'merchant',
    password: hashPassword('merchant123'),
    name: '商户操作员-李四',
    email: 'operator@demo.com',
    phone: '+86-13800000002',
    role_id: 'role_merchant',
    merchant_id: 'merchant_demo',
  },
  {
    id: 'user_merchant_admin1',
    username: 'merchant_admin',
    password: hashPassword('admin123'),
    name: '商户管理员-王五',
    email: 'admin@demo.com',
    phone: '+86-13800000003',
    role_id: 'role_merchant_admin',
    merchant_id: 'merchant_demo',
  },
  {
    id: 'user_payment1',
    username: 'payment',
    password: hashPassword('payment123'),
    name: '支付机构-赵六',
    email: 'payment@alipay.com',
    phone: '+86-13800000004',
    role_id: 'role_payment',
    merchant_id: null,
  },
  {
    id: 'user_compliance1',
    username: 'compliance',
    password: hashPassword('compliance123'),
    name: '合规审核员-孙七',
    email: 'compliance@system.com',
    phone: '+86-13800000005',
    role_id: 'role_compliance',
    merchant_id: null,
  },
  {
    id: 'user_finance1',
    username: 'finance',
    password: hashPassword('finance123'),
    name: '财务人员-周八',
    email: 'finance@system.com',
    phone: '+86-13800000006',
    role_id: 'role_finance',
    merchant_id: null,
  },
  {
    id: 'user_bank1',
    username: 'bank',
    password: hashPassword('bank123'),
    name: '银行操作员-吴九',
    email: 'bank@icbc.com',
    phone: '+86-13800000007',
    role_id: 'role_bank',
    merchant_id: null,
  },
];

function getNow() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function getValidFrom() {
  return dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss');
}

function getValidTo() {
  return dayjs().add(1, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss');
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  WORKFLOW_NODES,
  DEFAULT_MERCHANT,
  DEFAULT_PAYMENT_INSTITUTIONS,
  DEFAULT_EXCHANGE_RATES,
  DEFAULT_USERS,
  getNow,
  getValidFrom,
  getValidTo,
};
