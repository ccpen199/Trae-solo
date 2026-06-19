import { create } from 'zustand';

export interface UserInfo {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  realName?: string;
  role: string;
  communityIds?: string[];
  buildingIds?: string[];
  unitIds?: string[];
  houseIds?: string[];
  providerId?: string;
  scope?: string;
}

export interface RoleConfig {
  name: string;
  phone: string;
  color: string;
  desc: string;
  permissions: string[];
}

export const USER_ROLES: Record<string, RoleConfig> = {
  SUPER_ADMIN: {
    name: '超级管理员',
    phone: '13800000001',
    color: '#7C3AED',
    desc: '系统最高权限，可跨小区管理所有数据与配置',
    permissions: ['全小区数据', '角色权限管理', '系统配置', '财务结算'],
  },
  PROPERTY_ADMIN: {
    name: '物业管理员',
    phone: '13800000002',
    color: '#10B981',
    desc: '物业方总负责人，可看当前小区全量业务数据',
    permissions: ['小区全量数据', '工单派单', '服务商审核', '门禁设备管理'],
  },
  PROPERTY_STAFF: {
    name: '物业员工',
    phone: '13800000003',
    color: '#2563EB',
    desc: '一线处理人员，负责工单承接和现场处理',
    permissions: ['分配我的工单', '门禁操作', '设备报修', '处理记录'],
  },
  COMMITTEE: {
    name: '业委会主任',
    phone: '13800000004',
    color: '#F59E0B',
    desc: '业委会监督角色，可查看小区运营KPI和投诉工单',
    permissions: ['KPI监督', '投诉工单查看', '服务商评价', '业委会议题'],
  },
  RESIDENT: {
    name: '小区居民',
    phone: '13800000005',
    color: '#0EA5E9',
    desc: '业主或住户，只看到自己的房产、工单和订单',
    permissions: ['我的工单', '我的门禁', '我的房产', '下单服务'],
  },
  SERVICE_PROVIDER: {
    name: 'O2O服务商',
    phone: '13800000006',
    color: '#EC4899',
    desc: '服务商家角色，只看到自家商品、订单和佣金',
    permissions: ['我的商品', '我的订单', '佣金结算', '服务评分'],
  },
};

const USERS_BY_ROLE: Record<string, UserInfo> = {
  SUPER_ADMIN: {
    id: 'admin-1',
    phone: '13800000001',
    nickname: '超级管理员',
    realName: '系统管理员',
    role: 'SUPER_ADMIN',
    scope: 'ALL',
    communityIds: ['c1', 'c2', 'c3'],
    buildingIds: [],
  },
  PROPERTY_ADMIN: {
    id: 'pa-2',
    phone: '13800000002',
    nickname: '物业-李经理',
    realName: '李明',
    role: 'PROPERTY_ADMIN',
    scope: 'COMMUNITY',
    communityIds: ['c1'],
    buildingIds: ['b1', 'b2', 'b3'],
  },
  PROPERTY_STAFF: {
    id: 'ps-3',
    phone: '13800000003',
    nickname: '维修-王师傅',
    realName: '王强',
    role: 'PROPERTY_STAFF',
    scope: 'BUILDING',
    communityIds: ['c1'],
    buildingIds: ['b1', 'b2'],
  },
  COMMITTEE: {
    id: 'cm-4',
    phone: '13800000004',
    nickname: '业委会-张主任',
    realName: '张桂芳',
    role: 'COMMITTEE',
    scope: 'COMMUNITY',
    communityIds: ['c1'],
  },
  RESIDENT: {
    id: 'rs-5',
    phone: '13800000005',
    nickname: '1栋-陈先生',
    realName: '陈先生',
    role: 'RESIDENT',
    scope: 'HOUSE',
    communityIds: ['c1'],
    buildingIds: ['b1'],
    unitIds: ['u101'],
    houseIds: ['h10101', 'h10102'],
  },
  SERVICE_PROVIDER: {
    id: 'sp-6',
    phone: '13800000006',
    nickname: '优家家政-刘总',
    realName: '刘经理',
    role: 'SERVICE_PROVIDER',
    scope: 'PROVIDER',
    providerId: 'sp001',
  },
};

interface UserState {
  token: string | null;
  user: UserInfo | null;
  setToken: (token: string) => void;
  setUser: (user: UserInfo) => void;
  switchRole: (role: string, user: UserInfo) => void;
  getUserByRole: (role: string) => UserInfo | undefined;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  token: 'admin-token',
  user: USERS_BY_ROLE.SUPER_ADMIN,
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  switchRole: (role, user) => set({ user, token: `${role}-token` }),
  getUserByRole: (role) => USERS_BY_ROLE[role],
  logout: () => set({ token: null, user: null }),
}));
