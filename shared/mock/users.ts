import { User, Member, MemberTier, UserRole, Currency } from '../types';

export const mockUsers: User[] = [
  {
    id: 'user-001',
    email: 'zhang.wei@example.com',
    firstName: '伟',
    lastName: '张',
    phone: '+86 138 0000 0001',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20businessman%20portrait&image_size=square',
    locale: 'zh-CN',
    preferredCurrency: Currency.CNY,
    role: UserRole.CUSTOMER,
    isEmailVerified: true,
    isPhoneVerified: true,
    status: 'active',
    lastLoginAt: '2025-03-22T10:30:00Z',
    createdAt: '2023-06-15T08:00:00Z',
    updatedAt: '2025-03-22T10:30:00Z',
  },
  {
    id: 'user-002',
    email: 'sarah.johnson@example.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    phone: '+1 212 555 0101',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20caucasian%20businesswoman%20portrait&image_size=square',
    locale: 'en-US',
    preferredCurrency: Currency.USD,
    role: UserRole.CUSTOMER,
    isEmailVerified: true,
    isPhoneVerified: true,
    status: 'active',
    lastLoginAt: '2025-03-21T15:45:00Z',
    createdAt: '2023-08-20T12:00:00Z',
    updatedAt: '2025-03-21T15:45:00Z',
  },
  {
    id: 'user-003',
    email: 'tanaka.yuki@example.com',
    firstName: '雪',
    lastName: '田中',
    phone: '+81 90 1234 5678',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20woman%20traveler%20portrait&image_size=square',
    locale: 'ja-JP',
    preferredCurrency: Currency.JPY,
    role: UserRole.CUSTOMER,
    isEmailVerified: true,
    isPhoneVerified: false,
    status: 'active',
    lastLoginAt: '2025-03-20T09:20:00Z',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2025-03-20T09:20:00Z',
  },
  {
    id: 'user-hotel-001',
    email: 'manager@lechateauelysee.com',
    firstName: 'Pierre',
    lastName: 'Dubois',
    phone: '+33 1 42 56 78 90',
    locale: 'fr-FR',
    preferredCurrency: Currency.EUR,
    role: UserRole.HOTEL_ADMIN,
    isEmailVerified: true,
    isPhoneVerified: true,
    status: 'active',
    lastLoginAt: '2025-03-22T08:00:00Z',
    createdAt: '2023-05-01T10:00:00Z',
    updatedAt: '2025-03-22T08:00:00Z',
  },
  {
    id: 'user-admin-001',
    email: 'admin@stayglobal.com',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+86 138 0000 0000',
    locale: 'zh-CN',
    preferredCurrency: Currency.CNY,
    role: UserRole.PLATFORM_OPERATOR,
    isEmailVerified: true,
    isPhoneVerified: true,
    status: 'active',
    lastLoginAt: '2025-03-22T09:00:00Z',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2025-03-22T09:00:00Z',
  },
  {
    id: 'user-superadmin',
    email: 'superadmin@stayglobal.com',
    firstName: 'Super',
    lastName: 'Admin',
    locale: 'en-US',
    preferredCurrency: Currency.USD,
    role: UserRole.SUPER_ADMIN,
    isEmailVerified: true,
    isPhoneVerified: true,
    status: 'active',
    lastLoginAt: '2025-03-22T07:00:00Z',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2025-03-22T07:00:00Z',
  },
];

export const mockMembers: Member[] = [
  {
    id: 'member-001',
    userId: 'user-001',
    tier: MemberTier.GOLD,
    points: 125680,
    tierPoints: 68420,
    tierPointsToNextLevel: 31580,
    memberSince: '2023-06-15T08:00:00Z',
    vipAccessEnabled: true,
    lateCheckoutHours: 4,
    benefits: [
      { code: 'vip_access', name: 'VIP Access', description: '优先锁定热门房型', isActive: true },
      { code: 'late_checkout', name: 'Late Checkout', description: '最晚可延迟至18:00退房', isActive: true },
      { code: 'free_breakfast', name: 'Free Breakfast', description: '每日免费双人早餐', isActive: true },
      { code: 'room_upgrade', name: 'Room Upgrade', description: '视房态免费升级房型', isActive: true },
      { code: 'welcome_gift', name: 'Welcome Gift', description: '入住欢迎礼品', isActive: true },
      { code: 'bonus_points', name: 'Bonus Points', description: '基础积分额外30%奖励', isActive: true },
      { code: 'exclusive_offers', name: 'Exclusive Offers', description: '会员专属优惠活动', isActive: true },
    ],
  },
  {
    id: 'member-002',
    userId: 'user-002',
    tier: MemberTier.SILVER,
    points: 45230,
    tierPoints: 28450,
    tierPointsToNextLevel: 21550,
    memberSince: '2023-08-20T12:00:00Z',
    vipAccessEnabled: false,
    lateCheckoutHours: 2,
    benefits: [
      { code: 'late_checkout', name: 'Late Checkout', description: '最晚可延迟至16:00退房', isActive: true },
      { code: 'welcome_gift', name: 'Welcome Gift', description: '入住欢迎礼品', isActive: true },
      { code: 'bonus_points', name: 'Bonus Points', description: '基础积分额外15%奖励', isActive: true },
      { code: 'exclusive_offers', name: 'Exclusive Offers', description: '会员专属优惠活动', isActive: true },
    ],
  },
  {
    id: 'member-003',
    userId: 'user-003',
    tier: MemberTier.BRONZE,
    points: 8560,
    tierPoints: 3200,
    tierPointsToNextLevel: 6800,
    memberSince: '2024-01-10T10:00:00Z',
    vipAccessEnabled: false,
    lateCheckoutHours: 0,
    benefits: [
      { code: 'basic_points', name: 'Basic Points', description: '每消费1欧元累积1积分', isActive: true },
      { code: 'exclusive_offers', name: 'Exclusive Offers', description: '会员专属优惠活动', isActive: true },
    ],
  },
];

export function getUserById(userId: string): User | undefined {
  return mockUsers.find(u => u.id === userId);
}

export function getUserByEmail(email: string): User | undefined {
  return mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function getMemberByUserId(userId: string): Member | undefined {
  return mockMembers.find(m => m.userId === userId);
}

export function getDefaultUser(): User {
  return mockUsers[0];
}

export function getDefaultMember(): Member {
  return mockMembers[0];
}
