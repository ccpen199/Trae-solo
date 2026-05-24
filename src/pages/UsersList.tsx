import { useState, useEffect } from 'react';
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Edit,
  CheckCircle,
  XCircle,
  PlusCircle,
  User as UserIcon,
  Phone,
  Mail,
  Shield,
  Calendar,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getUsers, createUser, updateUser, updateUserStatus } from '@/api/modules/users';
import type { User, UserRole } from '@/types';
import { formatDate, getRoleLabel } from '@/utils';
import Empty from '@/components/Empty';
import ConfirmModal from '@/components/ConfirmModal';

const roleOptions: Array<{ value: UserRole | ''; label: string }> = [
  { value: '', label: '全部角色' },
  { value: 'admin', label: '系统管理员' },
  { value: 'dealer', label: '车商' },
  { value: 'buyer', label: '买家' },
  { value: 'inspector', label: '检测师' },
  { value: 'sales', label: '销售顾问' },
  { value: 'customer_service', label: '客服' },
  { value: 'finance', label: '财务' },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '启用' },
  { value: 'disabled', label: '禁用' },
];

const generateMockUsers = (): User[] => {
  const roles: UserRole[] = ['admin', 'dealer', 'buyer', 'inspector', 'sales', 'customer_service', 'finance'];
  const names: Record<UserRole, string[]> = {
    admin: ['系统管理员'],
    dealer: ['诚信二手车行', '优选汽车', '精品名车汇', '安心二手车', '豪车汇'],
    buyer: ['张先生', '李女士', '王先生', '刘小姐', '陈先生', '杨女士', '黄先生', '周小姐'],
    inspector: ['李检测师', '王检测师', '张检测师', '刘检测师', '陈检测师'],
    sales: ['王销售', '李销售', '张销售', '刘销售', '陈销售', '赵销售', '孙销售'],
    customer_service: ['赵客服', '钱客服', '孙客服', '李客服', '周客服'],
    finance: ['孙财务', '钱财务', '赵财务', '李财务'],
  };

  const users: User[] = [];
  let id = 1;

  roles.forEach(role => {
    const roleNames = names[role];
    roleNames.forEach((name, index) => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 180));
      const status = Math.random() > 0.1 ? 'active' : 'disabled';

      users.push({
        id: id++,
        username: `${role}${index + 1}`,
        name,
        role,
        phone: `138001380${String(id).padStart(2, '0')}`,
        email: `${role}${index + 1}@example.com`,
        status,
        createdAt: date.toISOString(),
      });
    });
  });

  return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const mockUsers = generateMockUsers();

export default function UsersList() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'enable' | 'disable' | null; userId: number | null }>({ open: false, type: null, userId: null });
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    role: '' as UserRole | '',
    phone: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;

      try {
        const data = await getUsers(params);
        setUsers(data);
      } catch {
        setUsers(mockUsers);
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      status: '',
    });
    setCurrentPage(1);
  };

  const filteredUsers = users.filter(u => {
    if (filters.role && u.role !== filters.role) return false;
    if (filters.status && u.status !== filters.status) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      role: '',
      phone: '',
      email: '',
      password: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setFormData({
      username: u.username,
      name: u.name,
      role: u.role,
      phone: u.phone,
      email: u.email || '',
      password: '',
    });
    setShowEditModal(true);
  };

  const handleCreate = async () => {
    if (!formData.username || !formData.name || !formData.role || !formData.password) return;
    try {
      await createUser({
        username: formData.username,
        name: formData.name,
        role: formData.role as UserRole,
        phone: formData.phone,
        email: formData.email || undefined,
        password: formData.password,
      });
      loadUsers();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('创建用户失败:', error);
      loadUsers();
      setShowCreateModal(false);
      resetForm();
    }
  };

  const handleEdit = async () => {
    if (!selectedUser || !formData.username || !formData.name || !formData.role) return;
    try {
      await updateUser(selectedUser.id, {
        username: formData.username,
        name: formData.name,
        role: formData.role as UserRole,
        phone: formData.phone,
        email: formData.email || undefined,
        ...(formData.password ? { password: formData.password } : {}),
      });
      loadUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    } catch (error) {
      console.error('更新用户失败:', error);
      loadUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    }
  };

  const handleToggleStatus = async (id: number, enable: boolean) => {
    try {
      await updateUserStatus(id, enable ? 'active' : 'disabled');
      loadUsers();
      setConfirmModal({ open: false, type: null, userId: null });
    } catch (error) {
      console.error('更新用户状态失败:', error);
      loadUsers();
      setConfirmModal({ open: false, type: null, userId: null });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-700">启用</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">禁用</span>;
  };

  const isFormValid = () => {
    if (!formData.username || !formData.name || !formData.role) return false;
    if (showCreateModal && !formData.password) return false;
    return true;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-noto-serif-sc text-2xl font-bold text-neutral-800 mb-1">
              用户管理
            </h1>
            <p className="text-sm text-neutral-500">管理系统用户账户和权限</p>
          </div>
          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            新增用户
          </button>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-neutral-500" />
            <span className="font-medium text-neutral-700">筛选条件</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">角色</label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="input-field"
              >
                {roleOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">状态</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field"
              >
                {statusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              清除筛选
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    用户名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    电话
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    邮箱
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-700 rounded-full mx-auto" />
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12">
                      <Empty message="暂无用户数据" icon={UserIcon} />
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {u.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-neutral-800 font-mono">{u.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-neutral-800">{u.name}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-primary-500" />
                          <span className="text-sm text-neutral-700">{getRoleLabel(u.role)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="text-sm text-neutral-700">{u.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="text-sm text-neutral-700">{u.email || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(u.status)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="text-sm text-neutral-500">{formatDate(u.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {u.status === 'active' ? (
                            <button
                              onClick={() => setConfirmModal({ open: true, type: 'disable', userId: u.id })}
                              className="p-2 text-neutral-500 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                              title="禁用"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmModal({ open: true, type: 'enable', userId: u.id })}
                              className="p-2 text-neutral-500 hover:text-success-700 hover:bg-success-50 rounded-lg transition-colors"
                              title="启用"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredUsers.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-neutral-100">
              <div className="text-sm text-neutral-500">
                共 {filteredUsers.length} 条记录，第 {currentPage} / {totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-primary-700 text-white'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowCreateModal(false); setShowEditModal(false); setSelectedUser(null); resetForm(); }} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {showCreateModal ? '新增用户' : '编辑用户'}
              </h3>
              <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); setSelectedUser(null); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">用户名 *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="请输入用户名"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">姓名 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="请输入姓名"
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">角色 *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="input-field"
                >
                  <option value="">请选择角色</option>
                  {roleOptions.filter(r => r.value !== '').map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">电话</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="请输入手机号码"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">邮箱</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="请输入邮箱地址"
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">
                  {showCreateModal ? '密码 *' : '密码 (留空则不修改)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={showCreateModal ? '请输入登录密码' : '请输入新密码'}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); setSelectedUser(null); resetForm(); }} className="btn-secondary">
                取消
              </button>
              <button
                onClick={showCreateModal ? handleCreate : handleEdit}
                disabled={!isFormValid()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showCreateModal ? '创建用户' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.type === 'enable' ? '启用用户' : '禁用用户'}
        message={confirmModal.type === 'enable' ? '确定要启用该用户吗？启用后用户可以正常登录系统。' : '确定要禁用该用户吗？禁用后用户将无法登录系统。'}
        confirmText={confirmModal.type === 'enable' ? '确认启用' : '确认禁用'}
        confirmButtonClass={confirmModal.type === 'enable' ? 'bg-success-600 hover:bg-success-700' : 'bg-danger-600 hover:bg-danger-700'}
        onConfirm={() => {
          if (confirmModal.userId) {
            handleToggleStatus(confirmModal.userId, confirmModal.type === 'enable');
          }
        }}
        onCancel={() => setConfirmModal({ open: false, type: null, userId: null })}
      />
    </div>
  );
}
