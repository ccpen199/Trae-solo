import { useState, useEffect } from 'react'
import { Search, Shield, ShieldOff, Trash2, Loader2 } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import api from '../../utils/api'

dayjs.locale('zh-cn')

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ q: '', role: '', status: '' })
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchUsers = async (p = 1) => {
    setLoading(true)
    try {
      const params: any = { page: p, pageSize: 20 }
      if (filters.q) params.q = filters.q
      if (filters.role) params.role = filters.role
      if (filters.status) params.status = filters.status
      const res = await api.get('/api/admin/users', { params })
      if (res.data.code === 0) {
        setUsers(res.data.data.list || res.data.data || [])
        setTotal(res.data.data.total || 0)
      }
      setPage(p)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleToggleRole = async (id: number, role: string) => {
    const newRole = role === 'admin' ? 'user' : 'admin'
    try {
      await api.put(`/api/admin/users/${id}`, { role: newRole })
      showToast(`已设为${newRole === 'admin' ? '管理员' : '普通用户'}`, 'success')
      fetchUsers(page)
    } catch { showToast('操作失败', 'error') }
  }

  const handleToggleStatus = async (id: number, status: string) => {
    const newStatus = status === 'active' ? 'banned' : 'active'
    try {
      await api.put(`/api/admin/users/${id}`, { status: newStatus })
      showToast(newStatus === 'banned' ? '已封禁' : '已解封', 'success')
      fetchUsers(page)
    } catch { showToast('操作失败', 'error') }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const roleLabels: Record<string, string> = {
    user: '用户', admin: '管理员', creator: '创作者',
  }

  return (
    <div>
      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>
          {toast.message}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">用户管理</h1>

      <div className="card mb-4">
        <div className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="搜索用户名或昵称..."
              className="input-field pl-9"
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            />
          </div>
          <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className="input-field w-auto">
            <option value="">全部角色</option>
            <option value="user">用户</option>
            <option value="creator">创作者</option>
            <option value="admin">管理员</option>
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input-field w-auto">
            <option value="">全部状态</option>
            <option value="active">正常</option>
            <option value="banned">封禁</option>
          </select>
          <button onClick={() => fetchUsers()} className="btn-primary">搜索</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">用户</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">角色</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">内容数</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">粉丝数</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">注册时间</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={user.avatar || '/default-avatar.png'} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="font-medium text-gray-900">{user.nickname || user.username}</p>
                          <p className="text-xs text-gray-400">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        user.role === 'admin' ? 'bg-red-50 text-red-600' :
                        user.role === 'creator' ? 'bg-purple-50 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${user.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {user.status === 'active' ? '正常' : '封禁'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{user.content_count || 0}</td>
                    <td className="px-4 py-3 text-gray-500">{user.follower_count || 0}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{dayjs(user.created_at).format('YYYY-MM-DD')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleRole(user.id, user.role)}
                          className="p-1 text-gray-400 hover:text-primary-600"
                          title={user.role === 'admin' ? '设为普通用户' : '设为管理员'}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className={`p-1 ${user.status === 'banned' ? 'text-green-500' : 'text-gray-400 hover:text-red-600'}`}
                          title={user.status === 'banned' ? '解封' : '封禁'}
                        >
                          <ShieldOff className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">暂无用户</div>
          )}
        </div>
      )}
    </div>
  )
}
