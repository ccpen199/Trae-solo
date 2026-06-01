import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useStore } from '@/store/useStore'
import DataTable, { type Column } from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import type { Site } from '@/api/client'

export default function Sites() {
  const { sites, fetchSites, createSite } = useStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', operator: '', electricity_price: '', service_fee: '', business_hours_start: '00:00', business_hours_end: '23:59' })

  useEffect(() => {
    fetchSites()
  }, [fetchSites])

  const filtered = sites.filter((s) => {
    const matchSearch = !search || s.name.includes(search) || s.address.includes(search)
    const matchStatus = !statusFilter || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleCreate = async () => {
    await createSite({
      name: form.name,
      address: form.address,
      operator: form.operator,
      electricity_price: Number(form.electricity_price),
      service_fee: Number(form.service_fee),
      business_hours_start: form.business_hours_start,
      business_hours_end: form.business_hours_end,
    })
    setShowModal(false)
    setForm({ name: '', address: '', operator: '', electricity_price: '', service_fee: '', business_hours_start: '00:00', business_hours_end: '23:59' })
  }

  const columns: Column<Site>[] = [
    { key: 'name', label: '站点名称' },
    { key: 'address', label: '地址' },
    { key: 'operator', label: '运营商' },
    { key: 'device_count', label: '设备数' },
    { key: 'electricity_price', label: '电价', render: (r) => `¥${r.electricity_price}/kWh` },
    { key: 'service_fee', label: '服务费', render: (r) => `¥${r.service_fee}/kWh` },
    { key: 'business_hours', label: '营业时间', render: (r) => `${r.business_hours_start}-${r.business_hours_end}` },
    { key: 'status', label: '状态', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', label: '操作', render: (r) => (
      <button onClick={(e) => { e.stopPropagation(); navigate(`/sites/${r.id}`) }} className="text-blue-600 hover:underline text-xs">
        详情
      </button>
    )},
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">站点管理</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
          <Plus className="w-4 h-4" /> 新增站点
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索站点名称/地址"
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          <option value="active">营业中</option>
          <option value="inactive">已停业</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/sites/${row.id}`)}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-base font-semibold mb-4">新增站点</h3>
            <div className="space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="站点名称" className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm" />
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="地址" className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm" />
              <input value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} placeholder="运营商" className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.electricity_price} onChange={(e) => setForm({ ...form, electricity_price: e.target.value })} placeholder="电价(元/kWh)" type="number" step="0.01" className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
                <input value={form.service_fee} onChange={(e) => setForm({ ...form, service_fee: e.target.value })} placeholder="服务费(元/kWh)" type="number" step="0.01" className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.business_hours_start} onChange={(e) => setForm({ ...form, business_hours_start: e.target.value })} placeholder="开始时间" type="time" className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
                <input value={form.business_hours_end} onChange={(e) => setForm({ ...form, business_hours_end: e.target.value })} placeholder="结束时间" type="time" className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-1.5 text-sm text-slate-600 border border-slate-200 rounded hover:bg-slate-50">取消</button>
              <button onClick={handleCreate} className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
