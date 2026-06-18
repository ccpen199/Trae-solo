import type { User } from '@neighborhood/shared';

export interface MockUser extends User {
  password: string;
  communityName: string;
  subdomain: string;
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
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'resident-001',
    tenantId: 'tenant-chaoyang',
    phone: '13900001001',
    nickname: '朝阳业主',
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
  },
  {
    id: 'resident-002',
    tenantId: 'tenant-haidian',
    phone: '13900002002',
    nickname: '海淀住户',
    avatar: '',
    realName: '李华',
    idCardType: 'id_card',
    idCardNumber: '110108198805055678',
    role: 'resident',
    status: 'active',
    verificationStatus: 'verified',
    password: 'resident123',
    communityName: '海定花园',
    subdomain: 'haidian',
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
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
  },
  {
    label: '社区运营',
    description: '社区运营管理，话题/活动/数据看板',
    phone: '13800000001',
    password: 'ops123',
    role: 'tenant_admin',
    roleLabel: '社区管理员',
    icon: 'settings',
    color: 'blue',
  },
  {
    label: '物业主管',
    description: '物业管理员，门禁/缴费/报修/投诉',
    phone: '13800000002',
    password: 'property123',
    role: 'property_admin',
    roleLabel: '物业管理员',
    icon: 'building',
    color: 'green',
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
  },
  {
    label: '朝阳业主',
    description: '实名住户，门禁绑定，完整使用权限',
    phone: '13900001001',
    password: 'resident123',
    role: 'resident',
    roleLabel: '实名住户',
    icon: 'user',
    color: 'indigo',
  },
  {
    label: '海淀住户',
    description: '跨社区住户，体验多社区切换',
    phone: '13900002002',
    password: 'resident123',
    role: 'resident',
    roleLabel: '实名住户',
    icon: 'user',
    color: 'teal',
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
