import React, { useState, useEffect } from 'react'
import { UsersIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { adminAPI } from '../../api/client'

const roleConfig = {
  admin: { label: '管理员', color: 'bg-red-100 text-red-700' },
  enterprise: { label: '企业用户', color: 'bg-blue-100 text-blue-700' },
  user: { label: '普通用户', color: 'bg-green-100 text-green-700' },
}

const roleOptions = [
  { value: '', label: '全部角色' },
  { value: 'admin', label: '管理员' },
  { value: 'enterprise', label: '企业用户' },
  { value: 'user', label: '普通用户' },
]

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit }
      if (roleFilter) params.role = roleFilter
      const res = await adminAPI.getUsers(params)
      setUsers(res.data?.users || res.data?.items || res.data || [])
      if (res.data?.total !== undefined) {
        setPagination((prev) => ({ ...prev, total: res.data.total }))
      }
    } catch (err) {
      setError('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">用户管理</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <FunnelIcon className="w-5 h-5 text-gray-400" />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setPagination((prev) => ({ ...prev, page: 1 }))
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        >
          {roleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">姓名</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">邮箱</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">角色</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">企业</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">注册时间</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const role = roleConfig[user.role] || roleConfig.user
              return (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-700 font-medium text-xs">
                          {user.name?.charAt(0)}
                        </span>
                      </div>
                      <span className="text-gray-800 font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${role.color}`}>
                      {role.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{user.enterprise?.name || user.enterpriseName || '-'}</td>
                  <td className="px-5 py-3 text-gray-500">{user.createdAt}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page <= 1}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-gray-600">
            {pagination.page} / {totalPages}
          </span>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= totalPages}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
