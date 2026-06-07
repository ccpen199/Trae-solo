import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { api } from '@/lib/api'
import AdminLayout from './AdminLayout'

interface Merchant {
  id: number
  name: string
  owner_name: string
  contact_phone: string
  license_no: string
  status: string
  created_at: string
}

interface MerchantList {
  list: Merchant[]
  total: number
  page: number
  pageSize: number
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: '待审核', cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已通过', cls: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', cls: 'bg-red-100 text-red-700' },
}

export default function Merchants() {
  const [merchants, setMerchants] = useState<MerchantList>({ list: [], total: 0, page: 1, pageSize: 10 })
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchMerchants = async (p = 1, status = statusFilter) => {
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: '10' })
      if (status) params.set('status', status)
      const data = await api.get<MerchantList>(`/merchants?${params}`)
      setMerchants(data)
      setPage(p)
    } catch {}
  }

  useEffect(() => { fetchMerchants() }, [])

  const handleAudit = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/merchants/${id}/audit`, { status })
      fetchMerchants(page)
    } catch {}
  }

  const totalPages = Math.ceil(merchants.total / merchants.pageSize)

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">商户审核</h1>

      <div className="flex gap-2 mb-4">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); fetchMerchants(1, s) }}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              statusFilter === s ? 'bg-red-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === '' ? '全部' : STATUS_MAP[s]?.label ?? s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">商户名称</th>
              <th className="text-left px-4 py-3">负责人</th>
              <th className="text-left px-4 py-3">联系电话</th>
              <th className="text-left px-4 py-3">营业执照号</th>
              <th className="text-left px-4 py-3">状态</th>
              <th className="text-left px-4 py-3">申请时间</th>
              <th className="text-left px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {merchants.list.map(m => {
              const st = STATUS_MAP[m.status] ?? { label: m.status, cls: 'bg-gray-100 text-gray-600' }
              return (
                <tr key={m.id} className={`hover:bg-gray-50 ${m.status === 'pending' ? 'bg-yellow-50/30' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.owner_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{m.contact_phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{m.license_no || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{new Date(m.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {m.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAudit(m.id, 'approved')}
                          className="flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          <Check className="w-3 h-3" /> 通过
                        </button>
                        <button
                          onClick={() => handleAudit(m.id, 'rejected')}
                          className="flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          <X className="w-3 h-3" /> 拒绝
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">已处理</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {merchants.list.length === 0 && <p className="text-center text-gray-400 py-8">暂无数据</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button onClick={() => fetchMerchants(page - 1)} disabled={page <= 1} className="px-3 py-1.5 border rounded text-sm disabled:opacity-40">上一页</button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => fetchMerchants(page + 1)} disabled={page >= totalPages} className="px-3 py-1.5 border rounded text-sm disabled:opacity-40">下一页</button>
        </div>
      )}
    </AdminLayout>
  )
}
