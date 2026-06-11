import type { UserInfo, InsuranceInfo, UserProfile } from '@/types/user';

export const mockUserInfo: UserInfo = {
  id: 'user_001',
  name: '张三',
  idCard: '320101199001011234',
  phone: '13800138000',
  avatar: 'https://picsum.photos/id/64/200/200',
  gender: 'male',
  birthDate: '1990-01-01',
  address: '江苏省南京市鼓楼区XX街道XX号',
  realNameVerified: true,
  faceVerified: true,
  ecardActivated: true
};

export const mockInsuranceInfo: InsuranceInfo[] = [
  {
    type: '养老保险',
    status: 'normal',
    insuredDate: '2015-07-01',
    paymentMonths: 120,
    personalAccount: 45680.50,
    overallAccount: 120500.00,
    lastPaymentDate: '2026-05-25'
  },
  {
    type: '医疗保险',
    status: 'normal',
    insuredDate: '2015-07-01',
    paymentMonths: 120,
    personalAccount: 12350.80,
    overallAccount: 85600.00,
    lastPaymentDate: '2026-05-25'
  },
  {
    type: '失业保险',
    status: 'normal',
    insuredDate: '2015-07-01',
    paymentMonths: 120,
    personalAccount: 8560.25,
    overallAccount: 32400.00,
    lastPaymentDate: '2026-05-25'
  },
  {
    type: '工伤保险',
    status: 'normal',
    insuredDate: '2015-07-01',
    paymentMonths: 120,
    personalAccount: 0,
    overallAccount: 45800.00,
    lastPaymentDate: '2026-05-25'
  },
  {
    type: '生育保险',
    status: 'normal',
    insuredDate: '2015-07-01',
    paymentMonths: 120,
    personalAccount: 0,
    overallAccount: 18600.00,
    lastPaymentDate: '2026-05-25'
  }
];

export const mockUserProfile: UserProfile = {
  age: 36,
  occupation: '软件工程师',
  insuredArea: '江苏省南京市',
  annualIncome: 280000,
  familyMembers: 3,
  healthStatus: '良好',
  tags: ['中青年', '技术人员', '高收入', '已婚', '有子女']
};

export const mockFamilyMembers = [
  {
    id: 'member_001',
    name: '李女士',
    relation: '配偶',
    idCard: '320101199203086789',
    phone: '13900139000',
    verified: true
  },
  {
    id: 'member_002',
    name: '张小明',
    relation: '子女',
    idCard: '320101201608081234',
    phone: '',
    verified: true
  }
];
