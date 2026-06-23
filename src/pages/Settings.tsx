import { useState, useMemo } from 'react';
import {
  Users,
  Shield,
  FileText,
  Search,
  Edit,
  UserPlus,
  Check,
  X,
  ChevronDown,
  KeyRound,
  Eye,
  Lock,
  Unlock,
  Crown,
  Building2,
  MapPin,
  User as UserIcon,
  Clock,
  Monitor,
  RefreshCw,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import type { User, Role, UserTier, UserStatus } from '@shared/types';
import { districts } from '@shared/types';
import { cn } from '@/lib/utils';

type SettingsTab = 'users' | 'roles' | 'audit';
type PermissionLevel = 'none' | 'view' | 'edit' | 'manage';

interface AuditLog {
  id: string;
  operateTime: string;
  operatorName: string;
  operatorTier: UserTier;
  operateType: string;
  operateContent: string;
  ipAddress: string;
  result: 'success' | 'failed';
}

const tierOptions: { value: UserTier | 'all'; label: string }[] = [
  { value: 'all', label: '全部层级' },
  { value: 'city', label: '市级' },
  { value: 'district', label: '区县级' },
  { value: 'street', label: '街道级' },
];

const statusOptions: { value: UserStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '启用' },
  { value: 'disabled', label: '禁用' },
];

const roleOptions = [
  { value: 'all', label: '全部角色' },
  { value: 'role_admin', label: '系统管理员' },
  { value: 'role_city_operator', label: '市级运营员' },
  { value: 'role_district_operator', label: '区县级运营员' },
  { value: 'role_street_operator', label: '街道级运营员' },
  { value: 'role_auditor', label: '审核员' },
];

const permissionModules = [
  { key: 'content', label: '内容管理' },
  { key: 'emergency', label: '应急发布' },
  { key: 'appeal', label: '诉求处理' },
  { key: 'opinion', label: '舆情分析' },
  { key: 'user', label: '用户管理' },
  { key: 'system', label: '系统设置' },
  { key: 'audit', label: '审核管理' },
  { key: 'publishing', label: '分级发布' },
];

const permissionLevelLabels: Record<PermissionLevel, string> = {
  none: '无权限',
  view: '只读',
  edit: '编辑',
  manage: '管理',
};

const permissionLevelColors: Record<PermissionLevel, string> = {
  none: 'bg-slate-100 text-slate-400',
  view: 'bg-blue-50 text-blue-600',
  edit: 'bg-amber-50 text-amber-600',
  manage: 'bg-green-50 text-green-600',
};

const rolePermissionsMatrix: Record<string, Record<string, PermissionLevel>> = {
  role_admin: {
    content: 'manage', emergency: 'manage', appeal: 'manage', opinion: 'manage',
    user: 'manage', system: 'manage', audit: 'manage', publishing: 'manage',
  },
  role_city_operator: {
    content: 'manage', emergency: 'manage', appeal: 'edit', opinion: 'view',
    user: 'view', system: 'none', audit: 'edit', publishing: 'manage',
  },
  role_district_operator: {
    content: 'edit', emergency: 'view', appeal: 'edit', opinion: 'none',
    user: 'none', system: 'none', audit: 'view', publishing: 'edit',
  },
  role_street_operator: {
    content: 'view', emergency: 'none', appeal: 'view', opinion: 'none',
    user: 'none', system: 'none', audit: 'none', publishing: 'view',
  },
  role_auditor: {
    content: 'view', emergency: 'none', appeal: 'view', opinion: 'view',
    user: 'none', system: 'none', audit: 'manage', publishing: 'view',
  },
};

const mockUsers: User[] = [
  { id: 'user_1', username: 'admin', name: '系统管理员', role: '系统管理员', roleId: 'role_admin', tier: 'city', status: 'active', createTime: '2024-01-01 00:00:00', avatar: '' },
  { id: 'user_2', username: 'zhang_wei', name: '张伟', role: '市级运营员', roleId: 'role_city_operator', tier: 'city', status: 'active', createTime: '2024-01-15 10:30:00', avatar: '' },
  { id: 'user_3', username: 'li_na', name: '李娜', role: '市级运营员', roleId: 'role_city_operator', tier: 'city', status: 'active', createTime: '2024-02-01 14:20:00', avatar: '' },
  { id: 'user_4', username: 'wang_qiang', name: '王强', role: '审核员', roleId: 'role_auditor', tier: 'city', status: 'active', createTime: '2024-02-15 09:00:00', avatar: '' },
  { id: 'user_5', username: 'liu_yang', name: '刘洋', role: '区县级运营员', roleId: 'role_district_operator', tier: 'district', district: '云龙区', status: 'active', createTime: '2024-03-01 11:30:00', avatar: '' },
  { id: 'user_6', username: 'chen_jing', name: '陈静', role: '区县级运营员', roleId: 'role_district_operator', tier: 'district', district: '泉山区', status: 'active', createTime: '2024-03-10 16:45:00', avatar: '' },
  { id: 'user_7', username: 'zhao_ming', name: '赵明', role: '街道级运营员', roleId: 'role_street_operator', tier: 'street', district: '鼓楼区', street: '彭城街道', status: 'active', createTime: '2024-04-01 08:00:00', avatar: '' },
  { id: 'user_8', username: 'sun_li', name: '孙丽', role: '街道级运营员', roleId: 'role_street_operator', tier: 'street', district: '云龙区', street: '子房街道', status: 'active', createTime: '2024-04-15 13:20:00', avatar: '' },
  { id: 'user_9', username: 'zhou_bo', name: '周波', role: '区县级运营员', roleId: 'role_district_operator', tier: 'district', district: '铜山区', status: 'disabled', createTime: '2024-05-01 10:00:00', avatar: '' },
  { id: 'user_10', username: 'wu_xia', name: '吴霞', role: '审核员', roleId: 'role_auditor', tier: 'city', status: 'disabled', createTime: '2024-05-15 15:30:00', avatar: '' },
  { id: 'user_11', username: 'xu_feng', name: '徐峰', role: '街道级运营员', roleId: 'role_street_operator', tier: 'street', district: '贾汪区', street: '老矿街道', status: 'active', createTime: '2024-05-20 09:10:00', avatar: '' },
  { id: 'user_12', username: 'han_mei', name: '韩梅', role: '区县级运营员', roleId: 'role_district_operator', tier: 'district', district: '沛县', status: 'active', createTime: '2024-06-01 14:00:00', avatar: '' },
];

const mockRoles: Role[] = [
  { id: 'role_admin', name: '系统管理员', code: 'admin', description: '拥有系统全部权限，负责系统整体运维与配置管理', permissions: ['*'], createTime: '2024-01-01 00:00:00' },
  { id: 'role_city_operator', name: '市级运营员', code: 'city_operator', description: '市级内容运营管理人员，负责全市范围的内容审核与发布', permissions: ['content:*', 'audit:*', 'emergency:*', 'appeal:*', 'public-opinion:*'], createTime: '2024-01-01 00:00:00' },
  { id: 'role_district_operator', name: '区县级运营员', code: 'district_operator', description: '区县级内容运营人员，负责本辖区范围内的信息采集与编辑', permissions: ['content:view', 'content:create', 'content:edit', 'appeal:view'], createTime: '2024-01-01 00:00:00' },
  { id: 'role_street_operator', name: '街道级运营员', code: 'street_operator', description: '街道级信息录入人员，负责本街道基础信息的采集上报', permissions: ['content:view', 'content:create'], createTime: '2024-01-01 00:00:00' },
  { id: 'role_auditor', name: '审核员', code: 'auditor', description: '内容审核人员，负责对各级提交的内容进行合规性审核', permissions: ['content:view', 'audit:view', 'audit:review', 'sensitive-word:*'], createTime: '2024-01-01 00:00:00' },
];

const lastLoginTimes: Record<string, string> = {
  user_1: '2024-06-20 09:30:00',
  user_2: '2024-06-20 08:45:00',
  user_3: '2024-06-19 17:20:00',
  user_4: '2024-06-20 10:15:00',
  user_5: '2024-06-19 16:30:00',
  user_6: '2024-06-20 09:00:00',
  user_7: '2024-06-18 14:50:00',
  user_8: '2024-06-19 11:20:00',
  user_9: '2024-04-10 08:00:00',
  user_10: '2024-05-01 15:30:00',
  user_11: '2024-06-20 07:45:00',
  user_12: '2024-06-19 10:30:00',
};

const mockAuditLogs: AuditLog[] = [
  { id: 'log_1', operateTime: '2024-06-20 10:32:15', operatorName: '系统管理员', operatorTier: 'city', operateType: '用户管理', operateContent: '新建用户 zhang_san', ipAddress: '192.168.1.101', result: 'success' },
  { id: 'log_2', operateTime: '2024-06-20 10:15:42', operatorName: '张伟', operatorTier: 'city', operateType: '内容发布', operateContent: '发布内容《徐州市2024年经济工作报告》', ipAddress: '192.168.1.102', result: 'success' },
  { id: 'log_3', operateTime: '2024-06-20 09:48:30', operatorName: '王强', operatorTier: 'city', operateType: '内容审核', operateContent: '审核通过内容《地铁4号线开通通知》', ipAddress: '192.168.1.105', result: 'success' },
  { id: 'log_4', operateTime: '2024-06-20 09:30:12', operatorName: '刘洋', operatorTier: 'district', operateType: '内容编辑', operateContent: '编辑云龙区民生服务信息', ipAddress: '192.168.2.101', result: 'success' },
  { id: 'log_5', operateTime: '2024-06-20 09:12:45', operatorName: '陈静', operatorTier: 'district', operateType: '登录系统', operateContent: '用户登录', ipAddress: '192.168.2.102', result: 'success' },
  { id: 'log_6', operateTime: '2024-06-20 08:55:20', operatorName: '赵明', operatorTier: 'street', operateType: '诉求处理', operateContent: '转办诉求件 SQ20240620001', ipAddress: '192.168.3.101', result: 'success' },
  { id: 'log_7', operateTime: '2024-06-19 18:30:00', operatorName: '未知用户', operatorTier: 'city', operateType: '登录系统', operateContent: '尝试登录账号 admin', ipAddress: '203.0.113.50', result: 'failed' },
  { id: 'log_8', operateTime: '2024-06-19 17:45:30', operatorName: '李娜', operatorTier: 'city', operateType: '应急发布', operateContent: '发布橙色暴雨预警通知', ipAddress: '192.168.1.103', result: 'success' },
  { id: 'log_9', operateTime: '2024-06-19 16:20:18', operatorName: '系统管理员', operatorTier: 'city', operateType: '角色权限', operateContent: '修改市级运营员权限配置', ipAddress: '192.168.1.101', result: 'success' },
  { id: 'log_10', operateTime: '2024-06-19 15:10:05', operatorName: '孙丽', operatorTier: 'street', operateType: '内容创建', operateContent: '创建子房街道文化活动信息', ipAddress: '192.168.3.102', result: 'success' },
  { id: 'log_11', operateTime: '2024-06-19 14:05:42', operatorName: '韩梅', operatorTier: 'district', operateType: '系统设置', operateContent: '修改本辖区默认发布频道', ipAddress: '192.168.2.105', result: 'success' },
  { id: 'log_12', operateTime: '2024-06-19 11:30:28', operatorName: '吴霞', operatorTier: 'city', operateType: '内容审核', operateContent: '审核驳回内容《违规信息发布》', ipAddress: '192.168.1.110', result: 'success' },
];

const roleUserCounts: Record<string, number> = {
  role_admin: 1,
  role_city_operator: 2,
  role_district_operator: 3,
  role_street_operator: 3,
  role_auditor: 2,
};

const streetOptions: Record<string, string[]> = {
  鼓楼区: ['彭城街道', '黄楼街道', '丰财街道', '琵琶街道', '牌楼街道', '铜沛街道', '环城街道', '金山桥街道', '东环街道'],
  云龙区: ['彭城街道', '子房街道', '黄山街道', '骆驼山街道', '大郭庄街道', '翠屏山街道', '大龙湖街道', '潘塘街道'],
  贾汪区: ['老矿街道', '夏桥街道', '贾汪镇', '青山泉镇', '大吴镇', '紫庄镇', '塔山镇', '汴塘镇', '江庄镇'],
  泉山区: ['王陵街道', '永安街道', '湖滨街道', '段庄街道', '和平街道', '奎山街道', '泰山街道', '金山街道', '七里沟街道'],
  铜山区: ['铜山镇', '何桥镇', '黄集镇', '马坡镇', '郑集镇', '柳新镇', '刘集镇', '大彭镇', '汉王镇', '三堡镇'],
  丰县: ['凤城镇', '首羡镇', '顺河镇', '常店镇', '欢口镇', '师寨镇', '华山镇', '梁寨镇', '范楼镇', '孙楼镇'],
  沛县: ['龙固镇', '杨屯镇', '大屯镇', '沛城镇', '胡寨镇', '魏庙镇', '五段镇', '张庄镇', '张寨镇', '敬安镇'],
  睢宁县: ['睢城镇', '王集镇', '双沟镇', '岚山镇', '李集镇', '桃园镇', '官山镇', '高作镇', '沙集镇', '凌城镇'],
  邳州市: ['运河镇', '邳城镇', '官湖镇', '四户镇', '宿羊山镇', '八义集镇', '土山镇', '碾庄镇', '港上镇', '邹庄镇'],
  新沂市: ['新安镇', '瓦窑镇', '港头镇', '唐店镇', '合沟镇', '草桥镇', '窑湾镇', '棋盘镇', '马陵山镇', '邵店镇'],
};

interface NewUserForm {
  name: string;
  username: string;
  password: string;
  phone: string;
  tier: UserTier;
  district: string;
  street: string;
  roleId: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = (): SettingsTab => {
    if (location.pathname.includes('/settings/roles')) return 'roles';
    if (location.pathname.includes('/settings/audit')) return 'audit';
    return 'users';
  };

  const [activeTab, setActiveTab] = useState<SettingsTab>(getActiveTab());

  const [keyword, setKeyword] = useState('');
  const [filterTier, setFilterTier] = useState<UserTier | 'all'>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all');

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showViewPermissionsModal, setShowViewPermissionsModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [newUser, setNewUser] = useState<NewUserForm>({
    name: '',
    username: '',
    password: '',
    phone: '',
    tier: 'district',
    district: districts[0],
    street: '',
    roleId: 'role_district_operator',
  });

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    disabled: 'bg-slate-100 text-slate-500',
  };

  const statusLabels: Record<string, string> = {
    active: '启用',
    disabled: '禁用',
  };

  const tierLabels: Record<UserTier, string> = {
    city: '市级',
    district: '区县级',
    street: '街道级',
  };

  const tabs = [
    { key: 'users' as SettingsTab, label: '用户管理', icon: Users, path: '/settings/users' },
    { key: 'roles' as SettingsTab, label: '角色权限', icon: Shield, path: '/settings/roles' },
    { key: 'audit' as SettingsTab, label: '操作审计', icon: FileText, path: '/settings/audit' },
  ];

  const filteredUsers = useMemo(() => {
    return mockUsers.filter((u) => {
      if (keyword && !u.name.includes(keyword) && !u.username.includes(keyword)) return false;
      if (filterTier !== 'all' && u.tier !== filterTier) return false;
      if (filterDistrict !== 'all' && u.district !== filterDistrict) return false;
      if (filterRole !== 'all' && u.roleId !== filterRole) return false;
      if (filterStatus !== 'all' && u.status !== filterStatus) return false;
      return true;
    });
  }, [keyword, filterTier, filterDistrict, filterRole, filterStatus]);

  const handleResetFilters = () => {
    setKeyword('');
    setFilterTier('all');
    setFilterDistrict('all');
    setFilterRole('all');
    setFilterStatus('all');
  };

  const handleOpenAddUser = () => {
    setNewUser({
      name: '',
      username: '',
      password: '',
      phone: '',
      tier: 'district',
      district: districts[0],
      street: streetOptions[districts[0]]?.[0] || '',
      roleId: 'role_district_operator',
    });
    setShowAddUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setShowEditUserModal(true);
  };

  const handleResetPassword = (user: User) => {
    setCurrentUser(user);
    setNewPassword('');
    setShowResetPasswordModal(true);
  };

  const handleViewPermissions = (user: User) => {
    setCurrentUser(user);
    setShowViewPermissionsModal(true);
  };

  const handleToggleUserStatus = (user: User) => {
    console.log('Toggle status for user:', user.id);
  };

  const handleCreateUser = () => {
    console.log('Create user:', newUser);
    setShowAddUserModal(false);
  };

  const countPermissions = (roleId: string): number => {
    const perms = rolePermissionsMatrix[roleId];
    if (!perms) return 0;
    return Object.values(perms).filter((p) => p !== 'none').length;
  };

  const renderAvatar = (user: User) => {
    if (user.avatar) {
      return <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />;
    }
    return (
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
        {user.name.charAt(0)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="系统设置"
        description="用户管理、角色权限与操作审计日志"
      />

      <div className="bg-white rounded-xl shadow-card">
        <div className="border-b border-slate-200 px-5">
          <div className="flex items-center gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    navigate(tab.path);
                  }}
                  className={cn(
                    'flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors',
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'users' && (
            <div className="space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="搜索用户名/姓名..."
                      className="w-64 pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                    />
                  </div>
                  <select
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value as UserTier | 'all')}
                    className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  >
                    {tierOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select
                    value={filterDistrict}
                    onChange={(e) => setFilterDistrict(e.target.value)}
                    className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  >
                    <option value="all">全部区域</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as UserStatus | 'all')}
                    className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    重置
                  </button>
                </div>
                <button
                  onClick={handleOpenAddUser}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  新建用户
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">用户</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">用户名</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">所属层级</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">所属区域</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">角色</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">最后登录</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {renderAvatar(user)}
                              <span className="text-sm font-medium text-slate-900">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{user.username}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 text-xs bg-primary-50 text-primary-700 rounded">
                              {tierLabels[user.tier]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {user.tier === 'city' ? '徐州市' : user.tier === 'district' ? user.district : `${user.district} ${user.street}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{user.role}</td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', statusColors[user.status])}>
                              {statusLabels[user.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {lastLoginTimes[user.id]?.slice(0, 16) || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                title="编辑用户"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleResetPassword(user)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                title="重置密码"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(user)}
                                className={cn(
                                  'p-1.5 rounded transition-colors',
                                  user.status === 'active'
                                    ? 'text-slate-400 hover:text-orange-600 hover:bg-orange-50'
                                    : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                                )}
                                title={user.status === 'active' ? '禁用' : '启用'}
                              >
                                {user.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleViewPermissions(user)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="查看权限"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="py-16 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p>暂无符合条件的用户</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>共 {filteredUsers.length} 条记录</span>
                <div className="flex items-center gap-1">
                  <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">上一页</button>
                  <button className="px-3 py-1.5 bg-primary-600 text-white rounded-lg">1</button>
                  <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">2</button>
                  <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">下一页</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary-600" />
                  角色列表
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {mockRoles.map((role) => {
                    const isExpanded = expandedRole === role.id;
                    return (
                      <div key={role.id} className="space-y-0">
                        <div
                          onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                          className={cn(
                            'p-5 rounded-xl border-2 cursor-pointer transition-all bg-white',
                            isExpanded
                              ? 'border-primary-300 shadow-md'
                              : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
                          )}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center',
                              role.code === 'admin' ? 'bg-gradient-to-br from-amber-400 to-amber-500' :
                              role.code === 'city_operator' ? 'bg-gradient-to-br from-primary-500 to-primary-600' :
                              role.code === 'district_operator' ? 'bg-gradient-to-br from-blue-400 to-blue-500' :
                              role.code === 'street_operator' ? 'bg-gradient-to-br from-teal-400 to-teal-500' :
                              'bg-gradient-to-br from-violet-400 to-violet-500'
                            )}>
                              <Shield className="w-5 h-5 text-white" />
                            </div>
                            <ChevronDown className={cn('w-5 h-5 text-slate-400 transition-transform', isExpanded && 'rotate-180')} />
                          </div>
                          <h4 className="font-semibold text-slate-900">{role.name}</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{role.description}</p>
                          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs text-slate-600">
                                <span className="font-semibold text-slate-900">{roleUserCounts[role.id] || 0}</span> 用户
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs text-slate-600">
                                <span className="font-semibold text-slate-900">{countPermissions(role.id)}</span> 权限
                              </span>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 p-5 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-sm font-semibold text-slate-900">权限矩阵</h5>
                              <button
                                onClick={() => setSelectedRole(role)}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                编辑权限
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {permissionModules.map((module) => {
                                const level = rolePermissionsMatrix[role.id]?.[module.key] || 'none';
                                return (
                                  <div key={module.key} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-100">
                                    <span className="text-xs text-slate-700">{module.label}</span>
                                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded', permissionLevelColors[level])}>
                                      {permissionLevelLabels[level]}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-primary-600" />
                  <h3 className="text-base font-semibold text-slate-900">权限边界对比</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">功能模块</th>
                        {mockRoles.map((role) => (
                          <th key={role.id} className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                            {role.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {permissionModules.map((module) => (
                        <tr key={module.key} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">{module.label}</td>
                          {mockRoles.map((role) => {
                            const level = rolePermissionsMatrix[role.id]?.[module.key] || 'none';
                            return (
                              <td key={role.id} className="px-4 py-3 text-center">
                                <span className={cn('inline-block px-2.5 py-1 text-xs font-medium rounded', permissionLevelColors[level])}>
                                  {permissionLevelLabels[level]}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-100 p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary-600" />
                  三级运营体系职责边界说明
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-5 border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">市级运营</h4>
                        <p className="text-xs text-slate-500">City Level</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>负责全市范围内容的审核与发布</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>管理应急预警信息的发布</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>跨区域诉求的协调与转办</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>舆情监测与分析报告查看</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>分级发布策略的制定与执行</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">区县级运营</h4>
                        <p className="text-xs text-slate-500">District Level</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>负责本辖区内容的编辑与提交</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>查看本辖区应急预警信息</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>本辖区群众诉求的受理处理</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        <span className="text-slate-400">舆情分析（仅市级可见）</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>本辖区内容的分级发布上报</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">街道级运营</h4>
                        <p className="text-xs text-slate-500">Street Level</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>负责本街道基础信息的采集</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        <span className="text-slate-400">应急发布（仅市级权限）</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>查看本街道群众诉求信息</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        <span className="text-slate-400">舆情分析（仅市级可见）</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>街道级信息的上报与查看</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="搜索操作人/操作内容..."
                      className="w-64 pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                    />
                  </div>
                  <select className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all">
                    <option value="all">全部操作类型</option>
                    <option value="login">登录系统</option>
                    <option value="content">内容管理</option>
                    <option value="user">用户管理</option>
                    <option value="audit">内容审核</option>
                    <option value="role">角色权限</option>
                    <option value="emergency">应急发布</option>
                    <option value="system">系统设置</option>
                  </select>
                  <select className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all">
                    <option value="all">全部操作结果</option>
                    <option value="success">成功</option>
                    <option value="failed">失败</option>
                  </select>
                  <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />
                    重置
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                    <FileText className="w-4 h-4" />
                    导出日志
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">操作时间</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">操作人</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">所属层级</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">操作类型</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">操作内容</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">IP地址</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">操作结果</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mockAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-sm text-slate-600 whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {log.operateTime}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white text-xs font-medium">
                                {log.operatorName.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-slate-900">{log.operatorName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 text-xs bg-primary-50 text-primary-700 rounded">
                              {tierLabels[log.operatorTier]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                              {log.operateType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 max-w-md truncate">
                            {log.operateContent}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500 font-mono whitespace-nowrap">
                            {log.ipAddress}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full',
                              log.result === 'success'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            )}>
                              {log.result === 'success' ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                              {log.result === 'success' ? '成功' : '失败'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>共 {mockAuditLogs.length} 条记录</span>
                <div className="flex items-center gap-1">
                  <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">上一页</button>
                  <button className="px-3 py-1.5 bg-primary-600 text-white rounded-lg">1</button>
                  <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">下一页</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-600" />
                新建用户
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">姓名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="请输入姓名"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">用户名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="请输入用户名"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">密码 <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="请输入密码"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">手机号</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="请输入手机号"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">所属层级 <span className="text-red-500">*</span></label>
                  <select
                    value={newUser.tier}
                    onChange={(e) => {
                      const tier = e.target.value as UserTier;
                      setNewUser({
                        ...newUser,
                        tier,
                        district: tier === 'city' ? '' : districts[0],
                        street: tier === 'street' ? (streetOptions[districts[0]]?.[0] || '') : '',
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  >
                    <option value="city">市级</option>
                    <option value="district">区县级</option>
                    <option value="street">街道级</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">角色 <span className="text-red-500">*</span></label>
                  <select
                    value={newUser.roleId}
                    onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  >
                    {mockRoles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {newUser.tier !== 'city' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">所属区县 <span className="text-red-500">*</span></label>
                  <select
                    value={newUser.district}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      district: e.target.value,
                      street: newUser.tier === 'street' ? (streetOptions[e.target.value]?.[0] || '') : '',
                    })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  >
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
              {newUser.tier === 'street' && newUser.district && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">所属街道 <span className="text-red-500">*</span></label>
                  <select
                    value={newUser.street}
                    onChange={(e) => setNewUser({ ...newUser, street: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  >
                    {(streetOptions[newUser.district] || []).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">权限范围说明</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      该用户将拥有「{mockRoles.find(r => r.id === newUser.roleId)?.name}」角色的全部权限，
                      数据访问范围限定为{newUser.tier === 'city' ? '全市' : newUser.tier === 'district' ? newUser.district : `${newUser.district}${newUser.street}`}。
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-medium"
              >
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetPasswordModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary-600" />
                重置密码
              </h3>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                {renderAvatar(currentUser)}
                <div>
                  <p className="text-sm font-medium text-slate-900">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">@{currentUser.username}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">新密码 <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                />
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-700">
                  密码重置后，用户下次登录时将需要使用新密码。建议通知用户及时修改。
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="px-4 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-medium"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewPermissionsModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-600" />
                用户权限查看
              </h3>
              <button
                onClick={() => setShowViewPermissionsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                {renderAvatar(currentUser)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">角色：{currentUser.role} · {tierLabels[currentUser.tier]}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">权限矩阵</h4>
                <div className="grid grid-cols-2 gap-2">
                  {permissionModules.map((module) => {
                    const level = rolePermissionsMatrix[currentUser.roleId]?.[module.key] || 'none';
                    return (
                      <div key={module.key} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                        <span className="text-xs text-slate-700">{module.label}</span>
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded', permissionLevelColors[level])}>
                          {permissionLevelLabels[level]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-700">
                  数据范围：{currentUser.tier === 'city' ? '全市范围' : currentUser.tier === 'district' ? currentUser.district : `${currentUser.district} ${currentUser.street}`}
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50">
              <button
                onClick={() => setShowViewPermissionsModal(false)}
                className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditUserModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary-600" />
                编辑用户
              </h3>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-2">
                {renderAvatar(currentUser)}
                <div>
                  <p className="text-sm font-medium text-slate-900">{currentUser.username}</p>
                  <p className="text-xs text-slate-500">创建时间：{currentUser.createTime.slice(0, 10)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">姓名</label>
                  <input
                    type="text"
                    defaultValue={currentUser.name}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">角色</label>
                  <select
                    defaultValue={currentUser.roleId}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  >
                    {mockRoles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">所属层级</label>
                  <select
                    defaultValue={currentUser.tier}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  >
                    <option value="city">市级</option>
                    <option value="district">区县级</option>
                    <option value="street">街道级</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">状态</label>
                  <select
                    defaultValue={currentUser.status}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  >
                    <option value="active">启用</option>
                    <option value="disabled">禁用</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setShowEditUserModal(false)}
                className="px-4 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-medium"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}