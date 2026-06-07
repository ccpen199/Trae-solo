import { useState, useEffect } from 'react'
import { ShieldCheck, ShieldX, Search } from 'lucide-react'
import { riders as ridersApi } from '../../api'

export default function RidersPage() {
  const [riderList, setRiderList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadRiders()
  }, [statusFilter])

  const loadRiders = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      const res: any = await ridersApi.listRiders(params)
      setRiderList(Array.isArray(res) ? res : res?.list || [])
    } catch {
      setRiderList([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await ridersApi.updateRiderStatus(id, { status })
      loadRiders()
    } catch {
    }
  }

  const filteredRiders = riderList.filter((r) =>
    !search || r.name?.includes(search) || r.phone?.includes(search)
  )

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { active: '正常', suspended: '停用', disabled: '禁用', online: '在线', offline: '离线' }
    return map[s] || s
  }

  const statusBadgeClass = (s: string) => {
    if (s === 'active' || s === 'online') return 'status-completed'
    if (s === 'suspended') return 'status-delivering'
    if (s === 'disabled') return 'status-cancelled'
    return 'status-pending'
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-secondary">骑手管理</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索姓名或手机号"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white"
        >
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="suspended">停用</option>
          <option value="disabled">禁用</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left p-3 font-medium text-gray-500">姓名</th>
                  <th className="text-left p-3 font-medium text-gray-500">手机号</th>
                  <th className="text-center p-3 font-medium text-gray-500">信用分</th>
                  <th className="text-center p-3 font-medium text-gray-500">状态</th>
                  <th className="text-center p-3 font-medium text-gray-500">实名</th>
                  <th className="text-right p-3 font-medium text-gray-500">余额</th>
                  <th className="text-left p-3 font-medium text-gray-500">注册时间</th>
                  <th className="text-center p-3 font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRiders.map((rider) => (
                  <tr key={rider.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-3 font-medium text-secondary">{rider.name}</td>
                    <td className="p-3 text-gray-600">{rider.phone}</td>
                    <td className="p-3 text-center">
                      <span className={`font-medium ${rider.credit_score >= 100 ? 'text-success' : rider.credit_score >= 80 ? 'text-warning' : 'text-danger'}`}>
                        {rider.credit_score}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`status-badge ${statusBadgeClass(rider.status)}`}>{statusLabel(rider.status)}</span>
                    </td>
                    <td className="p-3 text-center">
                      {rider.real_name_verified ? (
                        <ShieldCheck size={16} className="text-success mx-auto" />
                      ) : (
                        <ShieldX size={16} className="text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-right font-medium text-primary">¥{rider.balance?.toFixed(2) || '0.00'}</td>
                    <td className="p-3 text-gray-500">{rider.created_at?.slice(0, 10)}</td>
                    <td className="p-3 text-center">
                      <select
                        value={rider.status}
                        onChange={(e) => handleStatusChange(rider.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                      >
                        <option value="active">正常</option>
                        <option value="suspended">停用</option>
                        <option value="disabled">禁用</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredRiders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
