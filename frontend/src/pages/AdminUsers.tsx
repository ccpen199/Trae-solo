import { useEffect, useState } from 'react';
import { getUsers, updateUser } from '@/api/admin';
import type { User } from '@/types';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ status: '', credit_score: '' });

  const pageSize = 10;

  const fetchUsers = () => {
    setLoading(true);
    getUsers({ search: search || undefined, role: roleFilter || undefined, page, pageSize })
      .then((res) => {
        setUsers(res.list);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  const handleSearch = () => { setPage(1); fetchUsers(); };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setEditForm({ status: user.status, credit_score: String(user.credit_score) });
  };

  const handleSave = async () => {
    if (!editUser) return;
    try {
      await updateUser(editUser.id, {
        status: editForm.status as any,
        credit_score: Number(editForm.credit_score),
      });
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || '更新失败');
    }
  };

  const roleLabel: Record<string, string> = { worker: '求职者', employer: '雇主', admin: '管理员' };
  const statusLabel: Record<string, string> = { active: '正常', banned: '封禁', suspended: '停用' };
  const statusColor: Record<string, string> = { active: 'badge-green', banned: 'badge-red', suspended: 'badge-yellow' };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-6">用户管理</h1>

      <div className="card p-4 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="input-field flex-1"
            placeholder="搜索手机号/昵称/企业名..."
          />
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="select-field w-36">
            <option value="">全部角色</option>
            <option value="worker">求职者</option>
            <option value="employer">雇主</option>
            <option value="admin">管理员</option>
          </select>
          <button onClick={handleSearch} className="btn-primary text-sm">搜索</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">加载中...</div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">ID</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">昵称</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">手机号</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">角色</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">状态</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">信用分</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">注册时间</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-slate-400">#{u.id}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{u.nickname || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{u.phone}</td>
                      <td className="py-3 px-4"><span className="badge-blue">{roleLabel[u.role]}</span></td>
                      <td className="py-3 px-4"><span className={statusColor[u.status]}>{statusLabel[u.status]}</span></td>
                      <td className="py-3 px-4"><span className="font-semibold text-slate-700">{u.credit_score}</span></td>
                      <td className="py-3 px-4 text-slate-400">{u.created_at?.slice(0, 10)}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => handleEdit(u)} className="text-brand-500 hover:text-brand-600 text-sm font-medium">编辑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-30">上一页</button>
              <span className="text-sm text-slate-500">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm disabled:opacity-30">下一页</button>
            </div>
          )}
        </>
      )}

      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-slate-800 mb-4">编辑用户 #{editUser.id}</h3>
            <div className="space-y-4">
              <div>
                <label className="label-text">账号状态</label>
                <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className="select-field">
                  <option value="active">正常</option>
                  <option value="banned">封禁</option>
                  <option value="suspended">停用</option>
                </select>
              </div>
              <div>
                <label className="label-text">信用评分</label>
                <input type="number" value={editForm.credit_score} onChange={(e) => setEditForm((f) => ({ ...f, credit_score: e.target.value }))} className="input-field" min="0" max="100" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} className="btn-primary">保存</button>
                <button onClick={() => setEditUser(null)} className="btn-secondary">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
