import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { api } from '@/lib/api'
import AdminLayout from './AdminLayout'

interface UserItem {
  id: number
  username: string
  real_name: string
  phone: string
  role: string
  region_code: string
  status: string
  created_at: string
}

interface UserList {
  list: UserItem[]
  total: number
  page: number
  pageSize: number
}

const ROLE_MAP: Record<string, { label: string; cls: string }> = {
  admin: { label: '管理员', cls: 'bg-red-100 text-red-700' },
  merchant: { label: '商户', cls: 'bg-blue-100 text-blue-700' },
  user: { label: '普通用户', cls: 'bg-gray-100 text-gray-600' },
}

export default function Users() {
  const [users, setUsers] = useState<UserList>({ list: [], total: 0, page: 1, pageSize: 10 })
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchUsers = async (p = 1, kw = keyword, role = roleFilter, status = statusFilter) => {
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: '10' })
      if (kw) params.set('keyword', kw)
      if (role) params.set('role', role)
      if (status) params.set('status', status)
      const data = await api.get<UserList>(`/admin/users?${params}`)
      setUsers(data)
      setPage(p)
    } catch {}
  }

  useEffect(() => { fetchUsers() }, [])

  const handleSearch = () => fetchUsers(1)

  const handleRoleChange = async (id: number, role: string) => {
    try {
      await api.put(`/admin/users/${id}`, { role })
      fetchUsers(page)
    } catch {}
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.put(`/admin/users/${id}`, { status })
      fetchUsers(page)
    } catch {}
  }

  const totalPages = Math.ceil(users.total / users.pageSize)

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">用户管理</h1>

      <div className="flex items-center gap-3 mb-4">
        <input
          placeholder="搜索用户名/姓名/手机"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="border rounded-lg px-3 py-2 text-sm w-56"
        />
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); fetchUsers(1, keyword, e.target.value, statusFilter) }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="merchant">商户</option>
          <option value="user">普通用户</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); fetchUsers(1, keyword, roleFilter, e.target.value) }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="disabled">禁用</option>
        </select>
        <button onClick={handleSearch} className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
          <Search className="w-4 h-4" /> 搜索
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">用户名</th>
              <th className="text-left px-4 py-3">真实姓名</th>
              <th className="text-left px-4 py-3">手机号</th>
              <th className="text-left px-4 py-3">角色</th>
              <th className="text-left px-4 py-3">地区</th>
              <th className="text-left px-4 py-3">状态</th>
              <th className="text-left px-4 py-3">注册时间</th>
              <th className="text-left px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.list.map(u => {
              const roleInfo = ROLE_MAP[u.role] ?? { label: u.role, cls: 'bg-gray-100 text-gray-600' }
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.username}</td>
                  <td className="px-4 py-3 text-gray-600">{u.real_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{u.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className={`px-2 py-0.5 rounded text-xs font-medium border-0 cursor-pointer ${roleInfo.cls}`}
                    >
                      <option value="admin">管理员</option>
                      <option value="merchant">商户</option>
                      <option value="user">普通用户</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.region_code || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {u.status === 'active' ? '正常' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleStatusChange(u.id, u.status === 'active' ? 'disabled' : 'active')}
                      className={`text-xs px-2.5 py-1 rounded ${
                        u.status === 'active'
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                    >
                      {u.status === 'active' ? '禁用' : '启用'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {users.list.length === 0 && <p className="text-center text-gray-400 py-8">暂无数据</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button onClick={() => fetchUsers(page - 1)} disabled={page <= 1} className="px-3 py-1.5 border rounded text-sm disabled:opacity-40">上一页</button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => fetchUsers(page + 1)} disabled={page >= totalPages} className="px-3 py-1.5 border rounded text-sm disabled:opacity-40">下一页</button>
        </div>
      )}
    </AdminLayout>
  )
}
