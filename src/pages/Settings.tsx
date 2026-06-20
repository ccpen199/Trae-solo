import { useState } from 'react';
import {
  Users,
  Shield,
  Settings as SettingsIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  UserPlus,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import type { User, Role } from '@shared/types';
import { cn } from '@/lib/utils';

type SettingsTab = 'users' | 'roles';

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getActiveTab = (): SettingsTab => {
    if (location.pathname.includes('/settings/roles')) return 'roles';
    return 'users';
  };

  const [activeTab, setActiveTab] = useState<SettingsTab>(getActiveTab());

  const mockUsers: User[] = [
    { id: 'user_1', username: 'admin', name: '系统管理员', role: '系统管理员', roleId: 'role_admin', tier: 'city', status: 'active', createTime: '2024-01-01 00:00:00' },
    { id: 'user_2', username: 'zhang_wei', name: '张伟', role: '市级运营员', roleId: 'role_city_operator', tier: 'city', status: 'active', createTime: '2024-01-15 10:30:00' },
    { id: 'user_3', username: 'li_na', name: '李娜', role: '市级运营员', roleId: 'role_city_operator', tier: 'city', status: 'active', createTime: '2024-02-01 14:20:00' },
    { id: 'user_4', username: 'wang_qiang', name: '王强', role: '审核员', roleId: 'role_auditor', tier: 'city', status: 'active', createTime: '2024-02-15 09:00:00' },
    { id: 'user_5', username: 'liu_yang', name: '刘洋', role: '区县级运营员', roleId: 'role_district_operator', tier: 'district', district: '云龙区', status: 'active', createTime: '2024-03-01 11:30:00' },
    { id: 'user_6', username: 'chen_jing', name: '陈静', role: '区县级运营员', roleId: 'role_district_operator', tier: 'district', district: '泉山区', status: 'active', createTime: '2024-03-10 16:45:00' },
    { id: 'user_7', username: 'zhao_ming', name: '赵明', role: '街道级运营员', roleId: 'role_street_operator', tier: 'street', district: '鼓楼区', street: '彭城街道', status: 'active', createTime: '2024-04-01 08:00:00' },
    { id: 'user_8', username: 'sun_li', name: '孙丽', role: '街道级运营员', roleId: 'role_street_operator', tier: 'street', district: '云龙区', street: '子房街道', status: 'active', createTime: '2024-04-15 13:20:00' },
    { id: 'user_9', username: 'zhou_bo', name: '周波', role: '区县级运营员', roleId: 'role_district_operator', tier: 'district', district: '铜山区', status: 'disabled', createTime: '2024-05-01 10:00:00' },
    { id: 'user_10', username: 'wu_xia', name: '吴霞', role: '审核员', roleId: 'role_auditor', tier: 'city', status: 'disabled', createTime: '2024-05-15 15:30:00' },
  ];

  const mockRoles: Role[] = [
    { id: 'role_admin', name: '系统管理员', code: 'admin', description: '拥有系统全部权限', permissions: ['*'], createTime: '2024-01-01 00:00:00' },
    { id: 'role_city_operator', name: '市级运营员', code: 'city_operator', description: '市级内容运营管理人员', permissions: ['content:*', 'audit:*', 'emergency:*', 'appeal:*', 'public-opinion:*'], createTime: '2024-01-01 00:00:00' },
    { id: 'role_district_operator', name: '区县级运营员', code: 'district_operator', description: '区县级内容运营人员', permissions: ['content:view', 'content:create', 'content:edit', 'appeal:view'], createTime: '2024-01-01 00:00:00' },
    { id: 'role_auditor', name: '审核员', code: 'auditor', description: '内容审核人员', permissions: ['content:view', 'audit:view', 'audit:review', 'sensitive-word:*'], createTime: '2024-01-01 00:00:00' },
    { id: 'role_street_operator', name: '街道级运营员', code: 'street_operator', description: '街道级信息录入人员', permissions: ['content:view', 'content:create'], createTime: '2024-01-01 00:00:00' },
  ];

  const [keyword, setKeyword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);

  const filteredUsers = mockUsers.filter(u => {
    if (keyword && !u.name.includes(keyword) && !u.username.includes(keyword)) return false;
    return true;
  });

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    disabled: 'bg-slate-100 text-slate-500',
  };

  const statusLabels: Record<string, string> = {
    active: '启用',
    disabled: '禁用',
  };

  const tabs = [
    { key: 'users' as SettingsTab, label: '用户管理', icon: Users, path: '/settings/users' },
    { key: 'roles' as SettingsTab, label: '角色权限', icon: Shield, path: '/settings/roles' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="系统设置"
        description="用户管理、角色权限与系统配置"
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="搜索用户..."
                      className="w-64 pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  添加用户
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">用户名</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">姓名</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">角色</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">级别</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">创建时间</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-700 font-medium">{user.username}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{user.role}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-xs bg-primary-50 text-primary-700 rounded">
                            {user.tier === 'city' ? '市级' : user.tier === 'district' ? '区县' : '街道'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', statusColors[user.status])}>
                            {statusLabels[user.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{user.createTime.slice(0, 10)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" title="编辑">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="删除">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">角色列表</h3>
                  <button
                    onClick={() => setShowAddRoleModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    新增
                  </button>
                </div>
                <div className="space-y-2">
                  {mockRoles.map((role) => (
                    <div
                      key={role.id}
                      onClick={() => setSelectedRole(role)}
                      className={cn(
                        'p-4 rounded-xl border-2 cursor-pointer transition-all',
                        selectedRole?.id === role.id
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-slate-900">{role.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{role.code}</p>
                        </div>
                        <ChevronRight className={cn('w-4 h-4 transition-colors', selectedRole?.id === role.id ? 'text-primary-500' : 'text-slate-300')} />
                      </div>
                      <p className="text-xs text-slate-400 mt-2">{role.description}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Shield className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-400">{role.permissions.length} 个权限点</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 bg-slate-50 rounded-xl p-5">
                {selectedRole ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{selectedRole.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">{selectedRole.description}</p>
                      </div>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 text-slate-700 hover:bg-white rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                        编辑角色
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                          <SettingsIcon className="w-4 h-4 text-primary-600" />
                          内容管理权限
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {['内容查看', '内容创建', '内容编辑', '内容删除', '内容发布'].map((perm) => (
                            <span key={perm} className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                              <Check className="w-3 h-3" />
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary-600" />
                          审核管理权限
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {['审核查看', '审核通过', '审核驳回', '敏感词管理'].map((perm) => (
                            <span key={perm} className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                              <Check className="w-3 h-3" />
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary-600" />
                          系统管理权限
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {['用户管理', '角色管理', '系统配置'].map((perm) => (
                            <span key={perm} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 text-xs rounded-full">
                              <X className="w-3 h-3" />
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 py-20">
                    <Shield className="w-8 h-8 mr-2" />
                    请选择一个角色查看详情
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
