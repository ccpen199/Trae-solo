import type { User, Role } from '../../shared/types';
import { generateId, getRandomDate } from './utils';

export const mockRoles: Role[] = [
  {
    id: 'role_admin',
    name: '系统管理员',
    code: 'admin',
    description: '拥有系统全部权限，负责系统配置和用户管理',
    permissions: ['*'],
    createTime: '2024-01-01 00:00:00',
  },
  {
    id: 'role_city_operator',
    name: '市级运营员',
    code: 'city_operator',
    description: '市级内容运营管理人员，可管理全市内容',
    permissions: [
      'content:view', 'content:create', 'content:edit', 'content:delete',
      'audit:view', 'audit:review',
      'emergency:view', 'emergency:create', 'emergency:publish',
      'appeal:view', 'appeal:transfer',
      'public-opinion:view',
      'tiered:city',
    ],
    createTime: '2024-01-01 00:00:00',
  },
  {
    id: 'role_district_operator',
    name: '区县级运营员',
    code: 'district_operator',
    description: '区县级内容运营人员，仅可管理本区县内容',
    permissions: [
      'content:view', 'content:create', 'content:edit',
      'audit:view',
      'appeal:view',
      'tiered:district',
    ],
    createTime: '2024-01-01 00:00:00',
  },
  {
    id: 'role_auditor',
    name: '审核员',
    code: 'auditor',
    description: '内容审核人员，负责敏感词和AI审核的人工复核',
    permissions: [
      'content:view',
      'audit:view', 'audit:review',
      'sensitive-word:manage',
    ],
    createTime: '2024-01-01 00:00:00',
  },
  {
    id: 'role_street_operator',
    name: '街道级运营员',
    code: 'street_operator',
    description: '街道级信息录入人员，负责基层信息上报',
    permissions: [
      'content:view', 'content:create',
      'tiered:street',
    ],
    createTime: '2024-01-01 00:00:00',
  },
];

const districts = ['鼓楼区', '云龙区', '泉山区', '铜山区', '贾汪区'];
const streets = ['彭城街道', '子房街道', '黄山街道', '骆驼山街道', '大郭庄街道'];

const userNames = [
  { username: 'admin', name: '系统管理员', role: 'role_admin', tier: 'city' as const },
  { username: 'zhang_wei', name: '张伟', role: 'role_city_operator', tier: 'city' as const },
  { username: 'li_na', name: '李娜', role: 'role_city_operator', tier: 'city' as const },
  { username: 'wang_qiang', name: '王强', role: 'role_auditor', tier: 'city' as const },
  { username: 'liu_yang', name: '刘洋', role: 'role_district_operator', tier: 'district' as const },
  { username: 'chen_jing', name: '陈静', role: 'role_district_operator', tier: 'district' as const },
  { username: 'zhao_ming', name: '赵明', role: 'role_street_operator', tier: 'street' as const },
  { username: 'sun_li', name: '孙丽', role: 'role_street_operator', tier: 'street' as const },
  { username: 'zhou_bo', name: '周波', role: 'role_district_operator', tier: 'district' as const },
  { username: 'wu_xia', name: '吴霞', role: 'role_auditor', tier: 'city' as const },
];

export const mockUsers: User[] = userNames.map((u, index) => ({
  id: `user_${index + 1}`,
  username: u.username,
  name: u.name,
  role: mockRoles.find((r) => r.id === u.role)?.name || '',
  roleId: u.role,
  tier: u.tier,
  district: u.tier !== 'city' ? districts[index % districts.length] : undefined,
  street: u.tier === 'street' ? streets[index % streets.length] : undefined,
  status: index < 8 ? 'active' : 'disabled',
  createTime: getRandomDate(180),
}));
