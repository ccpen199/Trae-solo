import type { User } from '@neighborhood/shared';

export interface AccessCard {
  cardNumber: string;
  cardType: 'physical' | 'virtual' | 'nfc' | 'ble';
  buildingName: string;
  status: 'active' | 'inactive';
  lastUsedAt?: Date;
}

export interface HouseholdInfo {
  buildingId: string;
  buildingName: string;
  roomNo: string;
  householdType: 'owner' | 'tenant' | 'family';
  moveInDate: Date;
}

export interface AdminPermission {
  key: string;
  label: string;
  path: string;
}

export interface MockUser extends User {
  password: string;
  communityName: string;
  subdomain: string;
  household?: HouseholdInfo;
  accessCards?: AccessCard[];
  permissions?: AdminPermission[];
}

export const mockUsers: MockUser[] = [
  {
    id: 'admin-001',
    tenantId: 'platform',
    phone: '13800000000',
    nickname: '平台管理员',
    avatar: '',
    realName: '系统管理员',
    role: 'platform_admin',
    status: 'active',
    verificationStatus: 'verified',
    samlIdentityId: '',
    password: 'admin123',
    communityName: '邻里数字基座',
    subdomain: 'platform',
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [
      { key: 'dashboard', label: '全局数据概览', path: '/admin' },
      { key: 'community-health', label: '社区健康度仪表盘', path: '/admin/community-health' },
      { key: 'trace-logs', label: '虚假信息溯源日志', path: '/admin/trace-logs' },
      { key: 'risk-control', label: '红包资金池风控模型', path: '/admin/risk-control' },
      { key: 'transactions', label: '担保交易管理', path: '/admin/transactions' },
      { key: 'partners', label: '合伙人分润结算', path: '/admin/partners' },
      { key: 'property-integration', label: '物业SAML API网关对接', path: '/admin/property-integration' },
    ],
  },
  {
    id: 'ops-001',
    tenantId: 'tenant-chaoyang',
    phone: '13800000001',
    nickname: '朝阳社区运营',
    avatar: '',
    realName: '李运营',
    role: 'tenant_admin',
    status: 'active',
    verificationStatus: 'verified',
    password: 'ops123',
    communityName: '朝阳家园',
    subdomain: 'chaoyang',
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [
      { key: 'dashboard', label: '本社区数据概览', path: '/admin' },
      { key: 'community-health', label: '朝阳家园健康度', path: '/admin/community-health' },
      { key: 'trace-logs', label: '话题溯源日志', path: '/admin/trace-logs' },
      { key: 'risk-control', label: '红包池风控查看', path: '/admin/risk-control' },
    ],
  },
  {
    id: 'property-001',
    tenantId: 'tenant-chaoyang',
    phone: '13800000002',
    nickname: '物业王主管',
    avatar: '',
    realName: '王主管',
    role: 'property_admin',
    status: 'active',
    verificationStatus: 'verified',
    password: 'property123',
    communityName: '朝阳家园物业',
    subdomain: 'chaoyang',
    samlIdentityId: 'saml-chaoyang-property-admin-001',
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'property-staff-001',
    tenantId: 'tenant-chaoyang',
    phone: '13800000003',
    nickname: '维修工张师傅',
    avatar: '',
    realName: '张师傅',
    role: 'property_staff',
    status: 'active',
    verificationStatus: 'verified',
    password: 'staff123',
    communityName: '朝阳家园物业',
    subdomain: 'chaoyang',
    samlIdentityId: 'saml-chaoyang-property-staff-001',
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'resident-001',
    tenantId: 'tenant-chaoyang',
    phone: '13900001001',
    nickname: '朝阳业主陈明',
    avatar: '',
    realName: '陈明',
    idCardType: 'id_card',
    idCardNumber: '110101199001011234',
    role: 'resident',
    status: 'active',
    verificationStatus: 'verified',
    password: 'resident123',
    communityName: '朝阳家园',
    subdomain: 'chaoyang',
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    household: {
      buildingId: 'bld-cy-003',
      buildingName: '朝阳家园3号楼',
      roomNo: '1单元2202室',
      householdType: 'owner',
      moveInDate: new Date('2022-06-18'),
    },
    accessCards: [
      {
        cardNumber: 'CY-ACC-0030101220201',
        cardType: 'virtual',
        buildingName: '3号楼单元门',
        status: 'active',
        lastUsedAt: new Date('2026-06-17T08:12:34'),
      },
      {
        cardNumber: 'CY-ACC-GATE-0088',
        cardType: 'nfc',
        buildingName: '园区主入口',
        status: 'active',
        lastUsedAt: new Date('2026-06-17T19:45:21'),
      },
    ],
  },
  {
    id: 'resident-002',
    tenantId: 'tenant-haidian',
    phone: '13900002002',
    nickname: '海淀住户李华',
    avatar: '',
    realName: '李华',
    idCardType: 'id_card',
    idCardNumber: '110108198805055678',
    role: 'resident',
    status: 'active',
    verificationStatus: 'verified',
    password: 'resident123',
    communityName: '海淀花园',
    subdomain: 'haidian',
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    household: {
      buildingId: 'bld-hd-007',
      buildingName: '海淀花园7号楼',
      roomNo: '2单元1503室',
      householdType: 'tenant',
      moveInDate: new Date('2024-03-01'),
    },
    accessCards: [
      {
        cardNumber: 'HD-ACC-00702150301',
        cardType: 'virtual',
        buildingName: '7号楼单元门',
        status: 'active',
        lastUsedAt: new Date('2026-06-16T07:30:10'),
      },
    ],
  },
];

export interface TestAccount {
  label: string;
  description: string;
  phone: string;
  password: string;
  role: string;
  roleLabel: string;
  icon: string;
  color: string;
  identityTags: string[];
  permissionHints: string[];
  subdomain: string;
  communityName: string;
}

export const testAccounts: TestAccount[] = [
  {
    label: '系统管理员',
    description: '平台级管理权限，全社区数据监控',
    phone: '13800000000',
    password: 'admin123',
    role: 'platform_admin',
    roleLabel: '平台管理员',
    icon: 'shield',
    color: 'purple',
    identityTags: ['平台级', '全局权限', 'SAML运维'],
    permissionHints: [
      '社区健康度仪表盘',
      '虚假信息溯源日志',
      '红包资金池风控模型',
      '担保交易 & 分润结算',
      '物业API网关对接',
    ],
    subdomain: 'platform',
    communityName: '邻里数字基座',
  },
  {
    label: '社区运营',
    description: '朝阳家园社区运营管理',
    phone: '13800000001',
    password: 'ops123',
    role: 'tenant_admin',
    roleLabel: '社区管理员',
    icon: 'settings',
    color: 'blue',
    identityTags: ['朝阳家园', '子域 chaoyang', '社区运营'],
    permissionHints: [
      '本社区健康度',
      '话题溯源日志',
      '半径优选运营配置',
      '小金库任务活动',
    ],
    subdomain: 'chaoyang',
    communityName: '朝阳家园',
  },
  {
    label: '物业主管',
    description: '朝阳家园物业管理员，SAML单点登录',
    phone: '13800000002',
    password: 'property123',
    role: 'property_admin',
    roleLabel: '物业管理员',
    icon: 'building',
    color: 'green',
    identityTags: ['朝阳家园物业', 'SAML IdP', '王主管'],
    permissionHints: [
      '门禁权限管理',
      '物业费账单',
      '报修工单派单',
      '投诉处理响应',
    ],
    subdomain: 'chaoyang',
    communityName: '朝阳家园物业',
  },
  {
    label: '物业员工',
    description: '物业工作人员，处理报修工单',
    phone: '13800000003',
    password: 'staff123',
    role: 'property_staff',
    roleLabel: '物业员工',
    icon: 'wrench',
    color: 'orange',
    identityTags: ['张师傅', '工程维修', 'SAML账号'],
    permissionHints: ['报修工单处理', '巡检记录', '门禁开闸记录'],
    subdomain: 'chaoyang',
    communityName: '朝阳家园物业',
  },
  {
    label: '朝阳业主',
    description: '实名住户+门禁绑定+产权业主',
    phone: '13900001001',
    password: 'resident123',
    role: 'resident',
    roleLabel: '实名住户(房主)',
    icon: 'user',
    color: 'indigo',
    identityTags: ['陈明', '3号楼1单元2202', '房主', '身份证110101****1234'],
    permissionHints: [
      '邻里话题发帖',
      '半径优选下单',
      '二手担保交易',
      '小金库任务 & 红包',
      '合伙人分润',
      '物业服务报修',
    ],
    subdomain: 'chaoyang',
    communityName: '朝阳家园',
  },
  {
    label: '海淀住户',
    description: '跨社区住户，体验多社区切换',
    phone: '13900002002',
    password: 'resident123',
    role: 'resident',
    roleLabel: '实名住户(租户)',
    icon: 'user',
    color: 'teal',
    identityTags: ['李华', '7号楼2单元1503', '租户', '身份证110108****5678'],
    permissionHints: [
      '海淀花园话题',
      '跨社区半径优选推荐',
      '小金库签到',
      '二手交易担保',
    ],
    subdomain: 'haidian',
    communityName: '海淀花园',
  },
];

export function mockLogin(phone: string, password: string): { token: string; user: MockUser } {
  const userExists = mockUsers.find((u) => u.phone === phone);
  if (!userExists) {
    const suggestions = mockUsers
      .slice(0, 3)
      .map((u) => `${u.nickname}(${u.phone})`)
      .join('、');
    throw new Error(
      `账号不存在：该手机号 ${phone} 未注册。请点击下方测试账号快捷登录，或使用 ${suggestions} 等`
    );
  }
  const user = mockUsers.find(
    (u) => u.phone === phone && u.password === password
  );
  if (!user) {
    const testAccount = testAccounts.find((t) => t.phone === phone);
    const pwdHint = testAccount ? `，该账号正确密码为「${testAccount.password}」` : '';
    throw new Error(`密码错误${pwdHint}。如果是测试账号，请点击下方对应卡片一键登录`);
  }
  const token = `mock-token-${user.id}-${Date.now()}`;
  return { token, user };
}

export function getRoleRedirectPath(role: string): string {
  switch (role) {
    case 'platform_admin':
    case 'tenant_admin':
      return '/admin';
    case 'property_admin':
    case 'property_staff':
      return '/property/dashboard';
    case 'resident':
    default:
      return '/';
  }
}

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    platform_admin: '平台管理员',
    tenant_admin: '社区管理员',
    property_admin: '物业管理员',
    property_staff: '物业员工',
    resident: '住户',
  };
  return map[role] || '未知';
}
