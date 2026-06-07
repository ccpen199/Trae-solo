import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ role: '', status: '' });

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users', { params: filter });
      setUsers(res.data.users || []);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'frozen' : 'active';
    try {
      await api.put(`/admin/users/${user.id}/status`, { status: newStatus });
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const roleLabels = {
    family: '家庭用户',
    maintenance: '维修人员',
    channel: '渠道商',
    admin: '后台运营',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">用户管理</h2>
        <div className="flex space-x-3">
          <select
            value={filter.role}
            onChange={(e) => setFilter({ ...filter, role: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">全部角色</option>
            <option value="family">家庭用户</option>
            <option value="maintenance">维修人员</option>
            <option value="channel">渠道商</option>
          </select>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">全部状态</option>
            <option value="active">正常</option>
            <option value="frozen">已冻结</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">手机号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">注册时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name || user.username}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'family' ? 'bg-blue-100 text-blue-700' :
                      user.role === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                      user.role === 'channel' ? 'bg-purple-100 text-purple-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {roleLabels[user.role]}
                    </span>
                    {user.tier_name && (
                      <div className="text-xs text-gray-500 mt-1">{user.tier_name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.phone || '-'}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{user.created_at?.slice(0, 10)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status === 'active' ? '正常' : '已冻结'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => toggleStatus(user)}
                        className={`text-sm ${
                          user.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                        }`}
                      >
                        {user.status === 'active' ? '冻结' : '解冻'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
