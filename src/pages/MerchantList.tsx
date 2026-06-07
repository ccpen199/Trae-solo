import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, ShieldCheck } from 'lucide-react'
import { api, buildQuery } from '@/utils/api'
import { useAppStore } from '@/stores/appStore'

interface Merchant {
  id: number
  name: string
  contact_name: string
  phone: string
  address: string
  verify_status: string
  fulfillment_score: number
  zone_name: string
}

const verifyMap: Record<string, { label: string; cls: string }> = {
  approved: { label: '已认证', cls: 'bg-emerald-100 text-emerald-700' },
  pending: { label: '待审核', cls: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: '已拒绝', cls: 'bg-red-100 text-red-700' },
}

export default function MerchantList() {
  const navigate = useNavigate()
  const addToast = useAppStore((s) => s.addToast)
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ verify_status: '', search: '' })
  const pageSize = 15

  useEffect(() => {
    setLoading(true)
    const q = buildQuery({ ...filters, page, page_size: pageSize })
    api<{ list: Merchant[]; total: number }>(`/api/merchants${q}`).then((r) => {
      if (r.success) {
        setMerchants(r.data!.list)
        setTotal(r.data!.total)
      }
      setLoading(false)
    })
  }, [filters, page])

  async function handleVerify(id: number, verify_status: string) {
    const res = await api(`/api/merchants/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ verify_status }),
    })
    if (res.success) {
      addToast('审核操作成功', 'success')
      setMerchants((prev) =>
        prev.map((m) => (m.id === id ? { ...m, verify_status } : m))
      )
    } else {
      addToast(res.error || '审核失败', 'error')
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <select
            className="select-base"
            value={filters.verify_status}
            onChange={(e) => { setFilters((f) => ({ ...f, verify_status: e.target.value })); setPage(1) }}
          >
            <option value="">全部认证状态</option>
            <option value="approved">已认证</option>
            <option value="pending">待审核</option>
            <option value="rejected">已拒绝</option>
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-base w-full pl-9"
              placeholder="搜索商户名称"
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
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">商户名</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">联系人</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">手机号</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">地址</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">认证状态</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">履约评分</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">加载中...</td></tr>
            ) : merchants.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">暂无数据</td></tr>
            ) : (
              merchants.map((m) => {
                const v = verifyMap[m.verify_status] || { label: m.verify_status, cls: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{m.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{m.contact_name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{m.phone}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 max-w-[200px] truncate">{m.address}</td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.cls}`}>{v.label}</span></td>
                    <td className="px-5 py-3 text-sm text-gray-600">{m.fulfillment_score || '-'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/merchants/${m.id}`)} className="text-primary hover:text-primary-light text-sm flex items-center gap-1">
                          <Eye size={14} /> 查看
                        </button>
                        {m.verify_status === 'pending' && (
                          <button onClick={() => handleVerify(m.id, 'approved')} className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1">
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
            <button className="btn-outline px-3 py-1.5 text-xs" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button className="btn-outline px-3 py-1.5 text-xs" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>下一页</button>
          </div>
        </div>
      )}
    </div>
  )
}
