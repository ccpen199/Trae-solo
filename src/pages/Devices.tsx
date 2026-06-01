import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useStore } from '@/store/useStore'
import DataTable, { type Column } from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import type { Device, Site } from '@/api/client'
import * as api from '@/api/client'

export default function Devices() {
  const { devices, fetchDevices, sites, fetchSites, createDevice } = useStore()
  const navigate = useNavigate()
  const [siteFilter, setSiteFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', site_id: '', model: '', power: '' })
  const [allSites, setAllSites] = useState<Site[]>([])

  useEffect(() => {
    fetchDevices()
    api.getSites().then(setAllSites).catch(() => {})
  }, [fetchDevices])

  const filtered = devices.filter((d) => {
    const matchSite = !siteFilter || String(d.site_id) === siteFilter
    const matchStatus = !statusFilter || (statusFilter === 'online' ? d.online : !d.online)
    return matchSite && matchStatus
  })

  const handleCreate = async () => {
    await createDevice({
      name: form.name,
      site_id: Number(form.site_id),
      model: form.model,
      power: Number(form.power),
    })
    setShowModal(false)
    setForm({ name: '', site_id: '', model: '', power: '' })
    fetchDevices()
  }

  const columns: Column<Device>[] = [
    { key: 'name', label: '设备名称' },
    { key: 'site_name', label: '所属站点', render: (r) => {
      const site = allSites.find((s) => s.id === r.site_id)
      return site?.name || `站点#${r.site_id}`
    }},
    { key: 'model', label: '型号' },
    { key: 'power', label: '功率', render: (r) => `${r.power}kW` },
    { key: 'online', label: '在线状态', render: (r) => <StatusBadge status={r.online ? 'online' : 'offline'} /> },
    { key: 'fault_code', label: '故障码', render: (r) => r.fault_code ? <span className="text-red-600 text-xs font-mono">{r.fault_code}</span> : '-' },
    { key: 'last_heartbeat', label: '最近心跳', render: (r) => r.last_heartbeat ? new Date(r.last_heartbeat).toLocaleString() : '-' },
    { key: 'actions', label: '操作', render: (r) => (
      <button onClick={(e) => { e.stopPropagation(); navigate(`/devices/${r.id}`) }} className="text-blue-600 hover:underline text-xs">详情</button>
    )},
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">设备管理</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
          <Plus className="w-4 h-4" /> 新增设备
        </button>
      </div>

      <div className="flex items-center gap-3">
        <select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">全部站点</option>
          {allSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">全部状态</option>
          <option value="online">在线</option>
          <option value="offline">离线</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/devices/${row.id}`)}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-base font-semibold mb-4">新增设备</h3>
            <div className="space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="设备名称" className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm" />
              <select value={form.site_id} onChange={(e) => setForm({ ...form, site_id: e.target.value })} className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm">
                <option value="">选择站点</option>
                {allSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="型号" className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm" />
              <input value={form.power} onChange={(e) => setForm({ ...form, power: e.target.value })} placeholder="功率(kW)" type="number" step="0.1" className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm" />
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
