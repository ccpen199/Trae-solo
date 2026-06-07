import { useState, useEffect } from 'react'
import { api } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { Users, ShieldCheck, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'

interface UserItem {
  id: number
  username: string
  real_name: string
  role: string
  credit_score: number
  status: string
}

interface ComplianceItem {
  id: number
  check_type: string
  target: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  checked_at: string
}

const complianceStatusMap: Record<string, { label: string; className: string }> = {
  pass: { label: '通过', className: 'bg-green-100 text-green-600' },
  fail: { label: '未通过', className: 'bg-red-100 text-red-600' },
  warning: { label: '警告', className: 'bg-orange-100 text-[#E8722A]' },
}

export default function AdminPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'users' | 'compliance'>('users')
  const [users, setUsers] = useState<UserItem[]>([])
  const [compliance, setCompliance] = useState<ComplianceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toggling, setToggling] = useState<number | null>(null)

  useEffect(() => {
    if (user?.role !== 'admin') return
    if (tab === 'users') {
      fetchUsers()
    } else {
      fetchCompliance()
    }
  }, [tab, user?.role])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await api.get<Record<string, unknown>>('/api/admin/users')
      const data = (res as Record<string, unknown>).data
      setUsers(Array.isArray(res) ? (res as UserItem[]) : Array.isArray(data) ? (data as UserItem[]) : [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '获取用户列表失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompliance = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await api.get<Record<string, unknown>>('/api/admin/compliance')
      const data = (res as Record<string, unknown>).data
      setCompliance(Array.isArray(res) ? (res as ComplianceItem[]) : Array.isArray(data) ? (data as ComplianceItem[]) : [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '获取合规数据失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (u: UserItem) => {
    const newStatus = u.status === 'active' ? 'disabled' : 'active'
    try {
      setToggling(u.id)
      await api.patch(`/api/admin/users/${u.id}`, { status: newStatus })
      setUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, status: newStatus } : item)))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '操作失败'
      setError(msg)
    } finally {
      setToggling(null)
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <ShieldCheck className="mb-3 h-12 w-12" />
        <p className="text-lg font-medium">无权限访问</p>
        <p className="text-sm">仅管理员可访问此页面</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1B2A4A]">系统管理</h2>

      <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
        <button
          onClick={() => setTab('users')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'users' ? 'bg-[#1B2A4A] text-white' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Users className="h-4 w-4" />
          用户管理
        </button>
        <button
          onClick={() => setTab('compliance')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'compliance' ? 'bg-[#1B2A4A] text-white' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          合规校验
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          加载中...
        </div>
      ) : tab === 'users' ? (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F5F6FA]">
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">用户名</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">真实姓名</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">角色</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">信用分</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">状态</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-500">{u.id}</td>
                    <td className="px-4 py-3 font-medium text-[#1B2A4A]">{u.username}</td>
                    <td className="px-4 py-3 text-gray-600">{u.real_name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-[#1B2A4A]/10 px-2.5 py-0.5 text-xs font-medium text-[#1B2A4A]">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#E8722A] font-medium">{u.credit_score}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          u.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {u.status === 'active' ? '正常' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={toggling === u.id}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#1B2A4A] transition-colors hover:bg-[#1B2A4A]/10 disabled:opacity-50"
                      >
                        {u.status === 'active' ? (
                          <ToggleRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-red-500" />
                        )}
                        {u.status === 'active' ? '禁用' : '启用'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && <div className="py-12 text-center text-gray-400">暂无用户数据</div>}
        </div>
      ) : (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          {compliance.length === 0 ? (
            <div className="py-12 text-center text-gray-400">暂无合规校验记录</div>
          ) : (
            <div className="space-y-3">
              {compliance.map((c) => (
                <div key={c.id} className="flex items-center gap-4 rounded-lg border border-gray-100 p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1B2A4A]">{c.check_type}</span>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${complianceStatusMap[c.status]?.className ?? 'bg-gray-100 text-gray-500'}`}
                      >
                        {complianceStatusMap[c.status]?.label ?? c.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      对象: {c.target} · {c.checked_at}
                    </p>
                    {c.message && <p className="mt-1 text-sm text-gray-600">{c.message}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
