import { useState, useEffect, useCallback } from 'react'
import { api } from '@/utils/api'
import { Search, FileText, Eye, PenTool, X } from 'lucide-react'

interface Contract {
  id: number
  contract_no: string
  shipper: string
  carrier: string
  cargo: string
  vehicle: string
  status: 'draft' | 'signing' | 'signed' | 'archived' | 'cancelled'
  created_at: string
  content?: string
  signatures?: { party: string; signed_at: string }[]
  ca_serial?: string
}

const statusMap: Record<Contract['status'], { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
  signing: { label: '签署中', className: 'bg-orange-100 text-[#E8722A]' },
  signed: { label: '已签署', className: 'bg-green-100 text-green-600' },
  archived: { label: '已归档', className: 'bg-blue-100 text-blue-600' },
  cancelled: { label: '已取消', className: 'bg-red-100 text-red-600' },
}

export default function ContractList() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [keyword, setKeyword] = useState('')
  const [detail, setDetail] = useState<Contract | null>(null)
  const [signing, setSigning] = useState<number | null>(null)

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (keyword) params.set('keyword', keyword)
      const query = params.toString() ? `?${params.toString()}` : ''
      const res = await api.get<Record<string, unknown>>(`/api/contract${query}`)
      const data = (res as Record<string, unknown>).data
      setContracts(Array.isArray(res) ? (res as Contract[]) : Array.isArray(data) ? (data as Contract[]) : [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '获取合同列表失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, keyword])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  const handleSign = async (id: number) => {
    try {
      setSigning(id)
      await api.post(`/api/contract/${id}/sign`)
      fetchContracts()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '签署失败'
      setError(msg)
    } finally {
      setSigning(null)
    }
  }

  const openDetail = (c: Contract) => {
    setDetail(c)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#1B2A4A]">合同管理</h2>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#E8722A] focus:outline-none focus:ring-1 focus:ring-[#E8722A]"
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="signing">签署中</option>
          <option value="signed">已签署</option>
          <option value="archived">已归档</option>
          <option value="cancelled">已取消</option>
        </select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索合同编号/货主/承运方"
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-[#E8722A] focus:outline-none focus:ring-1 focus:ring-[#E8722A]"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <FileText className="mr-2 h-5 w-5 animate-pulse" />
            加载中...
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-20 text-center text-gray-400">暂无合同数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F5F6FA]">
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">合同编号</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">货主</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">承运方</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">货物</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">车辆</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">签署状态</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">创建时间</th>
                  <th className="px-4 py-3 text-left font-medium text-[#1B2A4A]">操作</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-[#1B2A4A]">{c.contract_no}</td>
                    <td className="px-4 py-3 text-gray-600">{c.shipper}</td>
                    <td className="px-4 py-3 text-gray-600">{c.carrier}</td>
                    <td className="px-4 py-3 text-gray-600">{c.cargo}</td>
                    <td className="px-4 py-3 text-gray-600">{c.vehicle}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMap[c.status].className}`}>
                        {statusMap[c.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.created_at}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetail(c)}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#1B2A4A] transition-colors hover:bg-[#1B2A4A]/10"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          查看
                        </button>
                        {c.status === 'signing' && (
                          <button
                            onClick={() => handleSign(c.id)}
                            disabled={signing === c.id}
                            className="flex items-center gap-1 rounded-md bg-[#E8722A] px-2 py-1 text-xs text-white transition-colors hover:bg-[#d0651f] disabled:opacity-50"
                          >
                            <PenTool className="h-3.5 w-3.5" />
                            {signing === c.id ? '签署中...' : '签署'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetail(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1B2A4A]">合同详情</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">合同编号</span>
                <span className="font-medium text-[#1B2A4A]">{detail.contract_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">货主</span>
                <span className="text-[#1B2A4A]">{detail.shipper}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">承运方</span>
                <span className="text-[#1B2A4A]">{detail.carrier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">签署状态</span>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMap[detail.status].className}`}>
                  {statusMap[detail.status].label}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <span className="text-gray-500">合同内容</span>
                <p className="mt-1 text-[#1B2A4A]">{detail.content || '暂无内容'}</p>
              </div>
              {detail.signatures && detail.signatures.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <span className="text-gray-500">签署记录</span>
                  {detail.signatures.map((s, i) => (
                    <div key={i} className="mt-1 flex justify-between text-[#1B2A4A]">
                      <span>{s.party}</span>
                      <span>{s.signed_at}</span>
                    </div>
                  ))}
                </div>
              )}
              {detail.ca_serial && (
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">CA序列号</span>
                    <span className="font-mono text-xs text-[#1B2A4A]">{detail.ca_serial}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
