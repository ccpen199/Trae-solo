import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, ShieldCheck, Users } from 'lucide-react'
import { api, buildQuery } from '@/utils/api'
import { useAppStore } from '@/stores/appStore'

interface Rider {
  id: number
  name: string
  phone: string
  zone_name: string
  status: string
  verify_status: string
  service_score: number
  credit_score: number
}

interface Zone {
  id: number
  name: string
}

const statusMap: Record<string, { label: string; cls: string }> = {
  online: { label: '在线', cls: 'bg-emerald-100 text-emerald-700' },
  offline: { label: '离线', cls: 'bg-gray-100 text-gray-600' },
  delivering: { label: '配送中', cls: 'bg-purple-100 text-purple-700' },
}

const verifyMap: Record<string, { label: string; cls: string }> = {
  approved: { label: '已认证', cls: 'bg-emerald-100 text-emerald-700' },
  pending: { label: '待审核', cls: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: '已拒绝', cls: 'bg-red-100 text-red-700' },
}

export default function RiderList() {
  const navigate = useNavigate()
  const addToast = useAppStore((s) => s.addToast)
  const [riders, setRiders] = useState<Rider[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', verify_status: '', zone_id: '', search: '' })
  const pageSize = 15

  useEffect(() => {
    api<Zone[]>('/api/zones').then((r) => {
      if (r.success) setZones(r.data!)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    const q = buildQuery({ ...filters, page, page_size: pageSize })
    api<{ list: Rider[]; total: number }>(`/api/riders${q}`).then((r) => {
      if (r.success) {
        setRiders(r.data!.list)
        setTotal(r.data!.total)
      }
      setLoading(false)
    })
  }, [filters, page])

  async function handleVerify(id: number, verify_status: string) {
    const res = await api(`/api/riders/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ verify_status }),
    })
    if (res.success) {
      addToast('审核操作成功', 'success')
      setRiders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, verify_status } : r))
      )
    } else {
      addToast(res.error || '审核失败', 'error')
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            className="select-base"
            value={filters.status}
            onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1) }}
          >
            <option value="">全部状态</option>
            <option value="online">在线</option>
            <option value="offline">离线</option>
            <option value="delivering">配送中</option>
          </select>
          <select
            className="select-base"
            value={filters.verify_status}
            onChange={(e) => { setFilters((f) => ({ ...f, verify_status: e.target.value })); setPage(1) }}
          >
            <option value="">全部认证</option>
            <option value="approved">已认证</option>
            <option value="pending">待审核</option>
            <option value="rejected">已拒绝</option>
          </select>
          <select
            className="select-base"
            value={filters.zone_id}
            onChange={(e) => { setFilters((f) => ({ ...f, zone_id: e.target.value })); setPage(1) }}
          >
            <option value="">全部区域</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-base w-full pl-9"
              placeholder="搜索姓名或手机号"
              value={filters.search}
              onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1) }}
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">姓名</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">手机号</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">区域</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">状态</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">认证状态</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">服务分</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">信用分</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">加载中...</td></tr>
            ) : riders.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">暂无数据</td></tr>
            ) : (
              riders.map((rider) => {
                const s = statusMap[rider.status] || { label: rider.status, cls: 'bg-gray-100 text-gray-600' }
                const v = verifyMap[rider.verify_status] || { label: rider.verify_status, cls: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={rider.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{rider.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{rider.phone}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{rider.zone_name || '-'}</td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span></td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.cls}`}>{v.label}</span></td>
                    <td className="px-5 py-3 text-sm text-gray-600">{rider.service_score}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{rider.credit_score}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/riders/${rider.id}`)} className="text-primary hover:text-primary-light text-sm flex items-center gap-1">
                          <Eye size={14} /> 查看
                        </button>
                        {rider.verify_status === 'pending' && (
                          <button onClick={() => navigate(`/riders/${rider.id}/verify`)} className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1">
                            <ShieldCheck size={14} /> 审核
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">共 {total} 条</span>
          <div className="flex items-center gap-2">
            <button
              className="btn-outline px-3 py-1.5 text-xs"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >上一页</button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button
              className="btn-outline px-3 py-1.5 text-xs"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >下一页</button>
          </div>
        </div>
      )}
    </div>
  )
}
