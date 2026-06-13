import { maskUtils } from '@gx-rs/shared';

export interface MockUser {
  id: string;
  name: string;
  idCard: string;
  socialCardNo: string;
  phone: string;
  insureStatus: 'NORMAL' | 'SUSPENDED' | 'RETIRED';
  region: string;
  birthDate: string;
  role: 'user' | 'admin';
}

export const mockUsers: MockUser[] = [
  {
    id: 'USR001',
    name: '韦建国',
    idCard: '450103196508152316',
    socialCardNo: 'S450103196508152316',
    phone: '13878881234',
    insureStatus: 'RETIRED',
    region: '南宁市',
    birthDate: '1965-08-15',
    role: 'user',
  },
  {
    id: 'USR002',
    name: '黄丽娟',
    idCard: '450205197203184527',
    socialCardNo: 'S450205197203184527',
    phone: '13977765432',
    insureStatus: 'NORMAL',
    region: '柳州市',
    birthDate: '1972-03-18',
    role: 'user',
  },
  {
    id: 'USR003',
    name: '李明辉',
    idCard: '450302198507063148',
    socialCardNo: 'S450302198507063148',
    phone: '13768998877',
    insureStatus: 'NORMAL',
    region: '桂林市',
    birthDate: '1985-07-06',
    role: 'user',
  },
  {
    id: 'USR004',
    name: '陈秀芳',
    idCard: '450405199101226739',
    socialCardNo: 'S450405199101226739',
    phone: '15878345678',
    insureStatus: 'NORMAL',
    region: '梧州市',
    birthDate: '1991-01-22',
    role: 'user',
  },
  {
    id: 'USR005',
    name: '张伟强',
    idCard: '450502198809154826',
    socialCardNo: 'S450502198809154826',
    phone: '13507791234',
    insureStatus: 'SUSPENDED',
    region: '北海市',
    birthDate: '1988-09-15',
    role: 'admin',
  },
];

export function getUserById(id: string): MockUser | undefined {
  return mockUsers.find((u) => u.id === id);
}

export function getMaskedUser(user: MockUser) {
  return {
    id: user.id,
    nameMasked: maskUtils.maskName(user.name),
    idCardMasked: maskUtils.maskIdCard(user.idCard),
    socialCardMasked: maskUtils.maskSocialCard(user.socialCardNo),
    insureStatus: user.insureStatus,
    region: user.region,
    birthDate: user.birthDate,
  };
}
