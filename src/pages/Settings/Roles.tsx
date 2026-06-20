import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Check,
  FilePlus,
  Search,
  Phone,
  User,
  CreditCard,
  Save,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';
import { Input, message } from 'antd';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, string[]>;
  dataMasking: Record<string, boolean>;
  userCount: number;
}

interface PermissionModule {
  key: string;
  name: string;
  icon: typeof Shield;
  permissions: string[];
}

const permissionModules: PermissionModule[] = [
  { key: 'workOrder', name: '工单管理', icon: FilePlus, permissions: ['view', 'create', 'edit', 'delete', 'review', 'export'] },
  { key: 'community', name: '小区管理', icon: Shield, permissions: ['view', 'create', 'edit', 'delete', 'export'] },
  { key: 'user', name: '用户管理', icon: User, permissions: ['view', 'create', 'edit', 'delete', 'export'] },
  { key: 'finance', name: '财务管理', icon: CreditCard, permissions: ['view', 'create', 'edit', 'delete', 'review', 'export'] },
  { key: 'activity', name: '活动管理', icon: FilePlus, permissions: ['view', 'create', 'edit', 'delete', 'review', 'export'] },
  { key: 'mall', name: '商城管理', icon: FilePlus, permissions: ['view', 'create', 'edit', 'delete', 'export'] },
  { key: 'system', name: '系统设置', icon: Shield, permissions: ['view', 'edit', 'export'] },
];

const permissionLabels: Record<string, string> = {
  view: '查看',
  create: '新增',
  edit: '编辑',
  delete: '删除',
  review: '审核',
  export: '导出',
};

const initialRoles: Role[] = [
  {
    id: 'role_001',
    name: '超级管理员',
    description: '拥有系统所有权限',
    permissions: {
      workOrder: ['view', 'create', 'edit', 'delete', 'review', 'export'],
      community: ['view', 'create', 'edit', 'delete', 'export'],
      user: ['view', 'create', 'edit', 'delete', 'export'],
      finance: ['view', 'create', 'edit', 'delete', 'review', 'export'],
      activity: ['view', 'create', 'edit', 'delete', 'review', 'export'],
      mall: ['view', 'create', 'edit', 'delete', 'export'],
      system: ['view', 'edit', 'export'],
    },
    dataMasking: {
      phone: true,
      name: true,
      idCard: true,
    },
    userCount: 2,
  },
  {
    id: 'role_002',
    name: '物业管家',
    description: '负责日常物业工作',
    permissions: {
      workOrder: ['view', 'create', 'edit', 'delete', 'review', 'export'],
      community: ['view'],
      user: ['view'],
      finance: ['view'],
      activity: ['view', 'create', 'edit'],
      mall: ['view'],
      system: [],
    },
    dataMasking: {
      phone: false,
      name: true,
      idCard: false,
    },
    userCount: 15,
  },
  {
    id: 'role_003',
    name: '财务人员',
    description: '负责财务相关工作',
    permissions: {
      workOrder: ['view', 'export'],
      community: ['view'],
      user: ['view'],
      finance: ['view', 'create', 'edit', 'delete', 'review', 'export'],
      activity: ['view', 'export'],
      mall: ['view', 'export'],
      system: [],
    },
    dataMasking: {
      phone: true,
      name: true,
      idCard: true,
    },
    userCount: 5,
  },
  {
    id: 'role_004',
    name: '普通居民',
    description: '普通业主/住户',
    permissions: {
      workOrder: ['view', 'create'],
      community: ['view'],
      user: [],
      finance: ['view'],
      activity: ['view'],
      mall: ['view'],
      system: [],
    },
    dataMasking: {
      phone: false,
      name: false,
      idCard: false,
    },
    userCount: 1280,
  },
];

const dataMaskingOptions = [
  { key: 'phone', label: '手机号脱敏', icon: Phone },
  { key: 'name', label: '姓名脱敏', icon: User },
  { key: 'idCard', label: '身份证号脱敏', icon: CreditCard },
];

export default function SettingsRoles() {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('role_002');
  const [searchText, setSearchText] = useState('');
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId);
  }, [roles, selectedRoleId]);

  const filteredRoles = useMemo(() => {
    if (!searchText) return roles;
    return roles.filter((r) =>
      r.name.toLowerCase().includes(searchText.toLowerCase()) ||
      r.description.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [roles, searchText]);

  const handleSelectRole = (role: Role) => {
    setSelectedRoleId(role.id);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setIsEditing(false);
  };

  const handleTogglePermission = (moduleKey: string, permission: string) => {
    if (!selectedRole) return;

    const currentPermissions = selectedRole.permissions[moduleKey] || [];
    const hasPermission = currentPermissions.includes(permission);

    const newPermissions = hasPermission
      ? currentPermissions.filter((p) => p !== permission)
      : [...currentPermissions, permission];

    setRoles((prev) =>
      prev.map((r) =>
        r.id === selectedRoleId
          ? {
              ...r,
              permissions: {
                ...r.permissions,
                [moduleKey]: newPermissions,
              },
            }
          : r
      )
    );
  };

  const handleToggleDataMasking = (key: string) => {
    if (!selectedRole) return;

    setRoles((prev) =>
      prev.map((r) =>
        r.id === selectedRoleId
          ? {
              ...r,
              dataMasking: {
                ...r.dataMasking,
                [key]: !r.dataMasking[key],
              },
            }
          : r
      )
    );
  };

  const handleAddRole = () => {
    const newRole: Role = {
      id: `role_${Date.now()}`,
      name: '新角色',
      description: '角色描述',
      permissions: {},
      dataMasking: {
        phone: false,
        name: false,
        idCard: false,
      },
      userCount: 0,
    };
    setRoles((prev) => [...prev, newRole]);
    setSelectedRoleId(newRole.id);
    setRoleName(newRole.name);
    setRoleDescription(newRole.description);
    setIsEditing(true);
    message.success('已创建新角色');
  };

  const handleDeleteRole = (roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (roles.length <= 1) {
      message.warning('至少保留一个角色');
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    if (selectedRoleId === roleId) {
      const remaining = roles.filter((r) => r.id !== roleId);
      if (remaining.length > 0) {
        setSelectedRoleId(remaining[0].id);
        setRoleName(remaining[0].name);
        setRoleDescription(remaining[0].description);
      }
    }
    message.success('已删除角色');
  };

  const handleSave = () => {
    if (!roleName.trim()) {
      message.warning('请输入角色名称');
      return;
    }
    setRoles((prev) =>
      prev.map((r) =>
        r.id === selectedRoleId
          ? { ...r, name: roleName, description: roleDescription }
          : r
      )
    );
    setIsEditing(false);
    message.success('保存成功');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const hasPermission = (moduleKey: string, permission: string): boolean => {
    if (!selectedRole) return false;
    return (selectedRole.permissions[moduleKey] || []).includes(permission);
  };

  const hasAllPermissions = (moduleKey: string): boolean => {
    const module = permissionModules.find((m) => m.key === moduleKey);
    if (!module) return false;
    return module.permissions.every((p) => hasPermission(moduleKey, p));
  };

  const handleToggleAllPermissions = (moduleKey: string) => {
    if (!selectedRole) return;

    const module = permissionModules.find((m) => m.key === moduleKey);
    if (!module) return;

    const allHas = hasAllPermissions(moduleKey);

    setRoles((prev) =>
      prev.map((r) =>
        r.id === selectedRoleId
          ? {
              ...r,
              permissions: {
                ...r.permissions,
                [moduleKey]: allHas ? [] : [...module.permissions],
              },
            }
          : r
      )
    );
  };

  return (
    <div className="p-6">
      <PageHeader
        title="角色权限管理"
        subtitle="管理系统角色及其权限配置"
        breadcrumb={[{ title: '首页' }, { title: '系统设置' }, { title: '角色权限' }]}
        extra={
          <button
            onClick={handleAddRole}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新增角色
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-4"
          >
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  placeholder="搜索角色..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="!pl-10 !bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredRoles.length === 0 ? (
                <EmptyState type="search" size="sm" title="未找到角色" />
              ) : (
                filteredRoles.map((role, index) => (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    onClick={() => handleSelectRole(role)}
                    className={cn(
                      'p-4 rounded-xl cursor-pointer transition-all border',
                      selectedRoleId === role.id
                        ? 'bg-primary-500/10 border-primary-500/30'
                        : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/[0.08]'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          selectedRoleId === role.id
                            ? 'bg-primary-500/20'
                            : 'bg-white/5'
                        )}>
                          <Shield className={cn(
                            'w-5 h-5',
                            selectedRoleId === role.id ? 'text-primary-400' : 'text-neutral-400'
                          )} />
                        </div>
                        <div>
                          <h4 className={cn(
                            'text-sm font-medium',
                            selectedRoleId === role.id ? 'text-white' : 'text-neutral-300'
                          )}>
                            {role.name}
                          </h4>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {role.userCount} 个用户
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteRole(role.id, e)}
                        className="p-1 rounded text-neutral-500 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-lg font-medium text-white">角色信息</h3>
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSave}
                      className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3"
                    >
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5">角色名称</label>
                    {isEditing ? (
                      <Input
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        className="!bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0"
                        placeholder="请输入角色名称"
                      />
                    ) : (
                      <p className="text-base font-medium text-white">{roleName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5">角色描述</label>
                    {isEditing ? (
                      <Input
                        value={roleDescription}
                        onChange={(e) => setRoleDescription(e.target.value)}
                        className="!bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0"
                        placeholder="请输入角色描述"
                      />
                    ) : (
                      <p className="text-sm text-neutral-400">{roleDescription}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-medium text-white mb-4">权限矩阵</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs font-medium text-neutral-400 pb-3 uppercase tracking-wider w-48">
                      功能模块
                    </th>
                    {permissionModules[0]?.permissions.map((perm) => (
                      <th
                        key={perm}
                        className="text-center text-xs font-medium text-neutral-400 pb-3 uppercase tracking-wider"
                      >
                        {permissionLabels[perm]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissionModules.map((module, modIndex) => {
                    const ModuleIcon = module.icon;
                    const allChecked = hasAllPermissions(module.key);

                    return (
                      <motion.tr
                        key={module.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: modIndex * 0.05 }}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="py-4">
                          <button
                            onClick={() => handleToggleAllPermissions(module.key)}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                          >
                            <div className={cn(
                              'w-9 h-9 rounded-lg flex items-center justify-center border',
                              allChecked
                                ? 'bg-primary-500/20 border-primary-500/30'
                                : 'bg-white/5 border-white/10'
                            )}>
                              <ModuleIcon className={cn(
                                'w-4 h-5',
                                allChecked ? 'text-primary-400' : 'text-neutral-400'
                              )} />
                            </div>
                            <span className="text-sm text-white font-medium">{module.name}</span>
                          </button>
                        </td>
                        {module.permissions.map((perm) => {
                          const checked = hasPermission(module.key, perm);

                          return (
                            <td key={perm} className="py-4 text-center">
                              <button
                                onClick={() => handleTogglePermission(module.key, perm)}
                                className={cn(
                                  'w-6 h-6 rounded-md border-2 transition-all inline-flex items-center justify-center',
                                  checked
                                    ? 'bg-primary-500 border-primary-500'
                                    : 'bg-transparent border-white/20 hover:border-white/40'
                                )}
                              >
                                {checked && <Check className="w-4 h-4 text-white" />}
                              </button>
                            </td>
                          );
                        })}
                        {permissionModules[0]?.permissions.length > module.permissions.length &&
                          Array.from({ length: permissionModules[0].permissions.length - module.permissions.length }).map((_, i) => (
                            <td key={`empty-${i}`} className="py-4 text-center">
                              <span className="text-neutral-600">-</span>
                            </td>
                          ))
                        }
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-medium text-white mb-4">数据脱敏设置</h3>
            <p className="text-sm text-neutral-500 mb-4">
              配置该角色是否能查看完整的敏感数据。关闭脱敏表示该角色能看到完整信息。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dataMaskingOptions.map((option, index) => {
                const Icon = option.icon;
                const isMasked = selectedRole?.dataMasking[option.key] ?? false;

                return (
                  <motion.div
                    key={option.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={cn(
                      'p-4 rounded-xl border cursor-pointer transition-all',
                      isMasked
                        ? 'bg-warning-500/10 border-warning-500/30'
                        : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.08]'
                    )}
                    onClick={() => handleToggleDataMasking(option.key)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        isMasked ? 'bg-warning-500/20' : 'bg-white/5'
                      )}>
                        <Icon className={cn(
                          'w-5 h-5',
                          isMasked ? 'text-warning-400' : 'text-neutral-400'
                        )} />
                      </div>
                      <div className={cn(
                        'w-11 h-6 rounded-full transition-all relative cursor-pointer',
                        isMasked ? 'bg-warning-500' : 'bg-white/20'
                      )}>
                        <div
                          className={cn(
                            'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all',
                            isMasked ? 'left-5' : 'left-0.5'
                          )}
                        />
                      </div>
                    </div>
                    <h4 className="text-sm font-medium text-white mb-1">{option.label}</h4>
                    <p className="text-xs text-neutral-500">
                      {isMasked ? '已开启脱敏，数据将被隐藏' : '已关闭脱敏，可查看完整数据'}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
