import { useEffect, useState } from 'react'
import { Plus, Search, Eye, CheckCircle } from 'lucide-react'
import { api } from '@/utils/api'

interface Supplier {
  id: number
  name: string
}

interface Procurement {
  id: number
  supplier_id: number
  supplier_name: string
  batch_no: string
  material_name: string
  inspection_report: string
  quantity: number
  unit: string
  price: number
  arrival_time: string
  inspector_id: number | string
  inspector_name: string
  status: 'pending' | 'verified' | 'rejected'
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: '待验收', className: 'bg-yellow-50 text-yellow-700' },
  verified: { label: '已验收', className: 'bg-green-50 text-green-700' },
  rejected: { label: '已驳回', className: 'bg-red-50 text-red-700' },
}

const emptyForm = {
  supplier_id: '',
  batch_no: '',
  material_name: '',
  inspection_report: '',
  quantity: '',
  unit: '',
  price: '',
  arrival_time: '',
  inspector_id: '',
}

export default function Procurements() {
  const [procurements, setProcurements] = useState<Procurement[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMaterial, setFilterMaterial] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const pageSize = 10

  const loadProcurements = () => {
    const params = new URLSearchParams()
    if (filterSupplier) params.set('supplier_id', filterSupplier)
    if (filterStatus) params.set('status', filterStatus)
    if (filterMaterial) params.set('material_name', filterMaterial)
    api.get<Procurement[]>(`/api/procurements?${params.toString()}`)
      .then((res) => {
        const start = (page - 1) * pageSize
        setProcurements(res.slice(start, start + pageSize))
        setTotal(res.length)
      })
      .catch(() => {})
  }

  const loadSuppliers = () => {
    api.get<Supplier[]>('/api/suppliers').then(setSuppliers).catch(() => {})
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  useEffect(() => {
    loadProcurements()
  }, [page, filterSupplier, filterStatus, filterMaterial])

  const handleVerify = (id: number) => {
    api.put(`/api/procurements/${id}`, { status: 'verified' }).then(() => {
      loadProcurements()
    }).catch(() => {})
  }

  const handleSubmit = () => {
    setSubmitting(true)
    api.post('/api/procurements', {
      ...form,
      supplier_id: Number(form.supplier_id),
      quantity: Number(form.quantity),
      price: Number(form.price),
      inspector_id: form.inspector_id ? Number(form.inspector_id) : null,
    })
      .then(() => {
        setShowModal(false)
        setForm(emptyForm)
        loadProcurements()
      })
      .catch(() => {})
      .finally(() => setSubmitting(false))
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">食材采购管理</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          新增采购
        </button>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterSupplier}
            onChange={(e) => { setFilterSupplier(e.target.value); setPage(1) }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="">全部供应商</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="">全部状态</option>
            <option value="pending">待验收</option>
            <option value="verified">已验收</option>
            <option value="rejected">已驳回</option>
          </select>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索食材名称"
              value={filterMaterial}
              onChange={(e) => { setFilterMaterial(e.target.value); setPage(1) }}
              className="rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-4 py-3 text-left font-medium text-gray-500">供应商</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">批次号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">食材名称</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">检验报告</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">数量/单位</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">单价(元)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">到货时间</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">验收人</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {procurements.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-gray-400">暂无数据</td>
              </tr>
            ) : (
              procurements.map((p) => {
                const sc = statusConfig[p.status] || statusConfig.pending
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-700">{p.supplier_name}</td>
                    <td className="px-4 py-3 text-gray-700">{p.batch_no}</td>
                    <td className="px-4 py-3 text-gray-700">{p.material_name}</td>
                    <td className="px-4 py-3 text-gray-700">{p.inspection_report || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{p.quantity}{p.unit}</td>
                    <td className="px-4 py-3 text-gray-700">{p.price}</td>
                    <td className="px-4 py-3 text-gray-700">{p.arrival_time}</td>
                    <td className="px-4 py-3 text-gray-700">{p.inspector_name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.className}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.status === 'pending' && (
                          <button
                            onClick={() => handleVerify(p.id)}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle size={14} />
                            验收
                          </button>
                        )}
                        <button className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50">
                          <Eye size={14} />
                          查看
                        </button>
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
          <p className="text-sm text-gray-500">
            共 {total} 条记录，第 {page}/{totalPages} 页
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
            >
              上一页
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">新增采购</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-gray-600">供应商</label>
                <select
                  value={form.supplier_id}
                  onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                >
                  <option value="">请选择</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">批次号</label>
                <input
                  type="text"
                  value={form.batch_no}
                  onChange={(e) => setForm({ ...form, batch_no: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">食材名称</label>
                <input
                  type="text"
                  value={form.material_name}
                  onChange={(e) => setForm({ ...form, material_name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">检验报告</label>
                <input
                  type="text"
                  value={form.inspection_report}
                  onChange={(e) => setForm({ ...form, inspection_report: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">数量</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">单位</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">单价(元)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">到货时间</label>
                <input
                  type="datetime-local"
                  value={form.arrival_time}
                  onChange={(e) => setForm({ ...form, arrival_time: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm text-gray-600">验收人ID</label>
                <input
                  type="number"
                  value={form.inspector_id}
                  onChange={(e) => setForm({ ...form, inspector_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); setForm(emptyForm) }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '提交中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
