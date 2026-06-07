import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ShieldCheck, Users, MonitorPlay } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import { RoleBadge } from '@/components/Badges';
import type { User, Organization, Device, Permission, AccessLevel } from '@/types';
import { ROLE_MAP, ACCESS_LEVEL_MAP } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function Permissions() {
  const [users, setUsers] = useState<User[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [permissionUserId, setPermissionUserId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<Omit<Permission, 'id' | 'created_at'>[]>([]);

  const [userForm, setUserForm] = useState({
    username: '', password: '', confirmPassword: '', name: '', role: 'viewer' as User['role'],
  });

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users', { params: { page, pageSize } })
      .then(res => {
        if (res.data.success) {
          setUsers(res.data.list);
          setTotal(res.data.total);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = '权限管理 - 云瞳视频监控';
    fetchUsers();
    api.get('/organizations').then(res => {
      if (res.data.success) {
        setOrgs(res.data.list || []);
      }
    });
    api.get('/devices?pageSize=200').then(res => {
      if (res.data.success) setDevices(res.data.list);
    });
  }, [page, pageSize]);

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser && userForm.password !== userForm.confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          password: userForm.password || undefined,
          role: userForm.role,
          name: userForm.name,
        });
      } else {
        await api.post('/users', {
          username: userForm.username,
          password: userForm.password,
          role: userForm.role,
          name: userForm.name,
        });
      }
      setShowUserModal(false);
      fetchUsers();
      resetUserForm();
    } catch (e: any) {
      alert(e.response?.data?.error || '操作失败');
    }
  };

  const resetUserForm = () => {
    setUserForm({ username: '', password: '', confirmPassword: '', name: '', role: 'viewer' });
    setEditingUser(null);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({
      username: u.username,
      password: '',
      confirmPassword: '',
      name: u.name,
      role: u.role,
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/users/${deleteId}`);
      setDeleteId(null);
      fetchUsers();
    } catch (e: any) {
      alert(e.response?.data?.error || '删除失败');
    }
  };

  const openPermModal = async (userId: number) => {
    setPermissionUserId(userId);
    try {
      const res = await api.get(`/users/${userId}/permissions`);
      if (res.data.success) {
        setPermissions(res.data.permissions.map((p: Permission) => ({
          user_id: p.user_id,
          org_id: p.org_id,
          device_id: p.device_id,
          access_level: p.access_level,
        })));
      }
    } catch (e) {
      setPermissions([]);
    }
    setShowPermModal(true);
  };

  const savePermissions = async () => {
    if (permissionUserId == null) return;
    try {
      await api.put(`/users/${permissionUserId}/permissions`, { permissions });
      setShowPermModal(false);
    } catch (e: any) {
      alert(e.response?.data?.error || '保存失败');
    }
  };

  const addPermission = (type: 'org' | 'device') => {
    if (type === 'org' && orgs.length > 0) {
      setPermissions([...permissions, {
        user_id: permissionUserId || 0,
        org_id: orgs[0].id,
        access_level: 'view_live' as AccessLevel,
      }]);
    } else if (type === 'device' && devices.length > 0) {
      setPermissions([...permissions, {
        user_id: permissionUserId || 0,
        device_id: devices[0].id,
        access_level: 'view_live' as AccessLevel,
      }]);
    }
  };

  const updatePermission = (idx: number, key: keyof Omit<Permission, 'id' | 'created_at'>, value: any) => {
    const next = [...permissions];
    (next[idx] as any)[key] = value;
    if (key === 'org_id') next[idx].device_id = undefined;
    if (key === 'device_id') next[idx].org_id = undefined;
    setPermissions(next);
  };

  const removePermission = (idx: number) => {
    setPermissions(permissions.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-6 min-h-full">
      <PageHeader
        title="权限管理"
        subtitle="管理用户、角色分配和细粒度权限矩阵控制"
        breadcrumbs={[{ label: '权限管理' }]}
        actions={
          <button onClick={() => { resetUserForm(); setShowUserModal(true); }} className="vms-btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> 新增用户
          </button>
        }
      />

      <div className="vms-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-vms-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="vms-table">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>姓名</th>
                  <th>角色</th>
                  <th>创建时间</th>
                  <th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="font-medium text-white font-mono">{u.username}</td>
                    <td>{u.name}</td>
                    <td><RoleBadge status={u.role} /></td>
                    <td className="text-xs text-vms-text-muted">{formatDateTime(u.created_at)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openPermModal(u.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-vms-primary/10 text-vms-primary hover:bg-vms-primary/20 text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> 权限
                        </button>
                        <button onClick={() => openEditUser(u)} className="p-1.5 rounded-lg hover:bg-vms-surface-2 text-vms-text-muted hover:text-amber-400 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        {u.id !== 1 && (
                          <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg hover:bg-vms-surface-2 text-vms-text-muted hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 0 && (
          <div className="px-4 py-4 border-t border-vms-border/50">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            />
          </div>
        )}
      </div>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={showUserModal}
        onClose={() => setShowUserModal(false)}
        footer={
          <>
            <button onClick={() => setShowUserModal(false)} className="vms-btn-secondary">取消</button>
            <button onClick={handleUserSubmit} className="vms-btn-primary">{editingUser ? '保存' : '创建'}</button>
          </>
        }
      >
        <form onSubmit={handleUserSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-vms-text-muted">用户名</label>
              <input
                required
                disabled={!!editingUser}
                value={userForm.username}
                onChange={e => setUserForm(p => ({ ...p, username: e.target.value }))}
                className="vms-input"
                placeholder="登录账号"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-vms-text-muted">姓名</label>
              <input
                required
                value={userForm.name}
                onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))}
                className="vms-input"
                placeholder="真实姓名"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-vms-text-muted">密码 {editingUser && <span className="text-vms-text-muted">(不修改留空)</span>}</label>
              <input
                type="password"
                required={!editingUser}
                value={userForm.password}
                onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))}
                className="vms-input"
                placeholder="登录密码"
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <label className="text-sm text-vms-text-muted">确认密码</label>
                <input
                  type="password"
                  required
                  value={userForm.confirmPassword}
                  onChange={e => setUserForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  className="vms-input"
                  placeholder="再次输入"
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm text-vms-text-muted">角色</label>
            <select
              value={userForm.role}
              onChange={e => setUserForm(p => ({ ...p, role: e.target.value as any }))}
              className="vms-input"
            >
              {Object.entries(ROLE_MAP).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        title={`配置权限 - ${users.find(u => u.id === permissionUserId)?.name || ''}`}
        open={showPermModal}
        onClose={() => setShowPermModal(false)}
        size="xl"
        footer={
          <>
            <button onClick={() => setShowPermModal(false)} className="vms-btn-secondary">取消</button>
            <button onClick={savePermissions} className="vms-btn-primary">保存权限</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => addPermission('org')} className="vms-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> 添加组织权限
            </button>
            <button onClick={() => addPermission('device')} className="vms-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
              <MonitorPlay className="w-3.5 h-3.5" /> 添加设备权限
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="vms-table">
              <thead>
                <tr>
                  <th>类型</th>
                  <th>对象</th>
                  <th>权限级别</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="vms-badge border border-vms-border bg-vms-surface-2">
                        {p.org_id ? '组织' : '设备'}
                      </span>
                    </td>
                    <td>
                      {p.org_id ? (
                        <select
                          value={p.org_id}
                          onChange={e => updatePermission(idx, 'org_id', parseInt(e.target.value))}
                          className="vms-input text-sm py-1.5"
                        >
                          {orgs.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={p.device_id}
                          onChange={e => updatePermission(idx, 'device_id', parseInt(e.target.value))}
                          className="vms-input text-sm py-1.5"
                        >
                          {devices.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      <select
                        value={p.access_level}
                        onChange={e => updatePermission(idx, 'access_level', e.target.value as AccessLevel)}
                        className="vms-input text-sm py-1.5"
                      >
                        {Object.entries(ACCESS_LEVEL_MAP).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-right">
                      <button onClick={() => removePermission(idx)} className="text-red-400 hover:text-red-300 text-xs">移除</button>
                    </td>
                  </tr>
                ))}
                {permissions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-vms-text-muted">暂无权限配置，点击上方按钮添加</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-vms-surface-2 rounded-lg text-xs text-vms-text-muted">
            <strong className="text-white">权限说明：</strong>
            实时预览 = 查看画面；录像回放 = 可回看历史录像；云台控制 = 可操控方向/变焦；完全控制 = 所有操作权限。
            组织权限会继承到其下所有设备；多个权限取最高级别。
          </div>
        </div>
      </Modal>

      <Modal
        title="确认删除"
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteId(null)} className="vms-btn-secondary">取消</button>
            <button onClick={handleDeleteUser} className="vms-btn-danger">确认删除</button>
          </>
        }
      >
        <p className="text-vms-text">确认删除该用户？该操作不可撤销。</p>
      </Modal>
    </div>
  );
}
