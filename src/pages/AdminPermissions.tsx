import { useState } from 'react';
import { Shield, Check, X } from 'lucide-react';

interface RolePermissions {
  role: string;
  label: string;
  color: string;
  permissions: Record<string, boolean>;
}

const allPermissions = [
  { key: 'jobs:manage', label: '岗位管理' },
  { key: 'jobs:view', label: '岗位查看' },
  { key: 'talents:view', label: '人才查看' },
  { key: 'interviews:manage', label: '面试管理' },
  { key: 'interviews:view', label: '面试查看' },
  { key: 'attendance:manage', label: '考勤管理' },
  { key: 'attendance:view', label: '考勤查看' },
  { key: 'settlement:manage', label: '结算管理' },
  { key: 'settlement:view', label: '结算查看' },
  { key: 'micro_tasks:manage', label: '喵任务管理' },
  { key: 'micro_tasks:view', label: '喵任务查看' },
  { key: 'micro_tasks:submit', label: '提交任务' },
  { key: 'credit:view', label: '信用查看' },
  { key: 'credit:evaluate', label: '信用评价' },
  { key: 'risk:manage', label: '风控管理' },
  { key: 'risk:view', label: '风控查看' },
  { key: 'admin:full', label: '系统管理' },
  { key: 'attendance:checkin', label: '扫码签到' },
];

const initialRoles: RolePermissions[] = [
  {
    role: 'admin', label: '集团管理员', color: 'bg-primary/10 text-primary',
    permissions: { 'jobs:manage': true, 'talents:view': true, 'interviews:manage': true, 'attendance:manage': true, 'settlement:manage': true, 'micro_tasks:manage': true, 'credit:view': true, 'risk:manage': true, 'admin:full': true, 'risk:view': true, 'settlement:view': true, 'attendance:view': true, 'interviews:view': true, 'jobs:view': true, 'micro_tasks:view': true },
  },
  {
    role: 'hr', label: '企业HR', color: 'bg-blue-50 text-blue-600',
    permissions: { 'jobs:manage': true, 'jobs:view': true, 'talents:view': true, 'interviews:manage': true, 'attendance:view': true, 'settlement:view': true, 'micro_tasks:manage': true, 'micro_tasks:view': true, 'credit:view': true, 'risk:view': true, 'credit:evaluate': true },
  },
  {
    role: 'branch_admin', label: '分公司管理员', color: 'bg-purple-50 text-purple-600',
    permissions: { 'jobs:view': true, 'talents:view': true, 'interviews:view': true, 'attendance:manage': true, 'attendance:view': true, 'settlement:view': true, 'micro_tasks:view': true, 'credit:view': true, 'risk:view': true },
  },
  {
    role: 'mentor', label: '企业导师', color: 'bg-amber-50 text-amber-600',
    permissions: { 'talents:view': true, 'interviews:manage': true, 'attendance:view': true, 'credit:evaluate': true },
  },
  {
    role: 'student', label: '高校学生', color: 'bg-emerald-50 text-emerald-600',
    permissions: { 'jobs:view': true, 'micro_tasks:submit': true, 'attendance:checkin': true, 'credit:view': true },
  },
];

export default function AdminPermissions() {
  const [roles, setRoles] = useState(initialRoles);
  const [activeRole, setActiveRole] = useState('admin');

  const currentRole = roles.find((r) => r.role === activeRole)!;

  const togglePermission = (permKey: string) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.role === activeRole
          ? { ...r, permissions: { ...r.permissions, [permKey]: !r.permissions[permKey] } }
          : r
      )
    );
  };

  const activePermCount = Object.values(currentRole.permissions).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold text-gray-800">权限配置</h2>
        <p className="text-sm text-gray-500 mt-0.5">角色权限矩阵配置，细粒度功能权限控制</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card-base p-5">
          <h3 className="font-heading font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Shield size={16} />角色列表
          </h3>
          <div className="space-y-2">
            {roles.map((role) => {
              const permCount = Object.values(role.permissions).filter(Boolean).length;
              return (
                <button
                  key={role.role}
                  onClick={() => setActiveRole(role.role)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    activeRole === role.role ? 'bg-primary text-white shadow-md' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{role.label}</span>
                    <span className={`text-xs ${activeRole === role.role ? 'text-white/70' : 'text-gray-400'}`}>
                      {permCount}项
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 card-base p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-heading font-semibold text-gray-800">{currentRole.label} 权限配置</h3>
              <p className="text-xs text-gray-400 mt-0.5">已启用 {activePermCount} 项权限</p>
            </div>
            <button className="btn-primary text-sm">保存配置</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allPermissions.map((perm) => {
              const enabled = currentRole.permissions[perm.key] || false;
              return (
                <button
                  key={perm.key}
                  onClick={() => togglePermission(perm.key)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    enabled ? 'border-primary/30 bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    enabled ? 'bg-primary text-white' : 'bg-gray-100'
                  }`}>
                    {enabled ? <Check size={12} /> : <X size={12} className="text-gray-400" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${enabled ? 'text-gray-800' : 'text-gray-500'}`}>{perm.label}</p>
                    <p className="text-xs text-gray-400">{perm.key}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
