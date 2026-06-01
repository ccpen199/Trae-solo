import { useEffect, useState } from 'react'
import { Plus, Edit2, AlertTriangle } from 'lucide-react'
import { api } from '@/utils/api'

interface Supplier {
  id: number
  name: string
  contact: string | null
  phone: string | null
  license_no: string | null
  qualification_expiry: string | null
  status: string
  created_at: string
  updated_at: string | null
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: '正常', className: 'bg-green-50 text-green-700' },
  suspended: { label: '暂停', className: 'bg-yellow-50 text-yellow-700' },
  expired: { label: '资质过期', className: 'bg-red-50 text-red-700' },
}

const emptyForm = {
  name: '',
  contact: '',
  phone: '',
  license_no: '',
  qualification_expiry: '',
  status: 'active',
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const loadSuppliers = () => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    api.get<Supplier[]>(`/api/suppliers?${params.toString()}`).then(setSuppliers).catch(() => {})
  }

  useEffect(() => {
    loadSuppliers()
  }, [filterStatus])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (s: Supplier) => {
    setEditingId(s.id)
    setForm({
      name: s.name,
      contact: s.contact || '',
      phone: s.phone || '',
      license_no: s.license_no || '',
      qualification_expiry: s.qualification_expiry || '',
      status: s.status,
    })
    setShowModal(true)
  }

  const handleSubmit = () => {
    setSubmitting(true)
    const payload = {
      ...form,
      contact: form.contact || null,
      phone: form.phone || null,
      license_no: form.license_no || null,
      qualification_expiry: form.qualification_expiry || null,
    }

    const promise = editingId
      ? api.put(`/api/suppliers/${editingId}`, payload)
      : api.post('/api/suppliers', payload)

    promise
      .then(() => {
        setShowModal(false)
        setForm(emptyForm)
        setEditingId(null)
        loadSuppliers()
      })
      .catch(() => {})
      .finally(() => setSubmitting(false))
  }

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false
    const diff = new Date(date).getTime() - Date.now()
    return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">供应商管理</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          新增供应商
        </button>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        >
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="suspended">暂停</option>
          <option value="expired">资质过期</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-4 py-3 text-left font-medium text-gray-500">供应商名称</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">联系人</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">电话</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">许可证号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">资质到期日</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">暂无数据</td>
              </tr>
            ) : (
              suppliers.map((s) => {
                const sc = statusConfig[s.status] || statusConfig.active
                const expiring = isExpiringSoon(s.qualification_expiry)
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-700">{s.name}</td>
                    <td className="px-4 py-3 text-gray-700">{s.contact || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{s.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{s.license_no || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-700">{s.qualification_expiry || '-'}</span>
                        {expiring && (
                          <span title="资质即将到期" aria-label="资质即将到期">
                            <AlertTriangle size={14} className="text-amber-500" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.className}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(s)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        <Edit2 size={14} />
                        编辑
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              {editingId ? '编辑供应商' : '新增供应商'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-gray-600">供应商名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">联系人</label>
                <input
                  type="text"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">电话</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">许可证号</label>
                <input
                  type="text"
                  value={form.license_no}
                  onChange={(e) => setForm({ ...form, license_no: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">资质到期日</label>
                <input
                  type="date"
                  value={form.qualification_expiry}
                  onChange={(e) => setForm({ ...form, qualification_expiry: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">状态</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                >
                  <option value="active">正常</option>
                  <option value="suspended">暂停</option>
                  <option value="expired">资质过期</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null) }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.name}
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
