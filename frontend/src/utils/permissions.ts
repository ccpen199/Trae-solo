export type UserRole =
  | 'cargo_owner'
  | 'ship_owner'
  | 'forwarder'
  | 'container_operator'
  | 'special_transport'
  | 'admin';

export const ROLE_LABELS: Record<UserRole, string> = {
  cargo_owner: '货主',
  ship_owner: '船东',
  forwarder: '货代',
  container_operator: '集装箱运营商',
  special_transport: '特种运输服务商',
  admin: '管理员'
};

export const ROLE_USERS: Record<UserRole, { id: string; name: string; company: string; email: string; phone: string; qualifications: string }> = {
  cargo_owner: {
    id: 'user-cargo-001',
    name: '张明',
    company: '华贸物流集团',
    email: 'zhangming@huamao.com',
    phone: '13800138001',
    qualifications: 'ISO9001,AEO认证'
  },
  ship_owner: {
    id: 'user-ship-001',
    name: '李华',
    company: '远洋航运股份',
    email: 'lihua@yuanyang.com',
    phone: '13800138002',
    qualifications: 'ISM认证,MLC2006'
  },
  forwarder: {
    id: 'user-forwarder-001',
    name: '王芳',
    company: '全球货代联盟',
    email: 'wangfang@global-forwarder.com',
    phone: '13800138003',
    qualifications: 'FIATA,WCA会员'
  },
  container_operator: {
    id: 'user-container-001',
    name: '陈强',
    company: '中集集装箱运营',
    email: 'chenqiang@cimc.com',
    phone: '13800138004',
    qualifications: 'CSC认证,ISO14001'
  },
  special_transport: {
    id: 'user-special-001',
    name: '刘伟',
    company: '特种运输服务公司',
    email: 'liuw@special-trans.com',
    phone: '13800138005',
    qualifications: '大件运输资质,危险品运输许可'
  },
  admin: {
    id: 'user-admin-001',
    name: '系统管理员',
    company: '平台运营中心',
    email: 'admin@platform.com',
    phone: '13800000000',
    qualifications: '超级管理员'
  }
};

export function canPublishVoyage(role?: UserRole): boolean {
  return role === 'ship_owner' || role === 'forwarder' || role === 'admin';
}

export function canPublishCargo(role?: UserRole): boolean {
  return role === 'cargo_owner' || role === 'forwarder' || role === 'admin';
}

export function canPublishVesselListing(role?: UserRole): boolean {
  return role === 'ship_owner' || role === 'admin';
}

export function canPublishSpotContainer(role?: UserRole): boolean {
  return role === 'container_operator' || role === 'ship_owner' || role === 'admin';
}

export function canPublishEquipment(role?: UserRole): boolean {
  return role === 'special_transport' || role === 'admin';
}

export function canEditCargo(role?: UserRole, ownerId?: string, currentUserId?: string): boolean {
  if (role === 'admin') return true;
  return ownerId === currentUserId;
}

export function canSeeAllCargos(role?: UserRole): boolean {
  return role === 'ship_owner' || role === 'forwarder' || role === 'container_operator' || role === 'admin';
}

export function canSeeAllVoyages(role?: UserRole): boolean {
  return true;
}
