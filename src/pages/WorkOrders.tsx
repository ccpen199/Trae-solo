import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import DataTable, { type Column } from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import type { WorkOrder, Site } from '@/api/client'
import * as api from '@/api/client'

export default function WorkOrders() {
  const { workOrders, fetchWorkOrders, createWorkOrder } = useStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [deviceIdFilter, setDeviceIdFilter] = useState(searchParams.get('device_id') || '')
  const [typeFilter, setTypeFilter] = useState('')
  const [siteFilter, setSiteFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: '', priority: 'medium', device_id: '', site_id: '', description: '' })
  const [allSites, setAllSites] = useState<Site[]>([])

  useEffect(() => {
    fetchWorkOrders({ status: statusFilter, device_id: deviceIdFilter })
    api.getSites().then(setAllSites).catch(() => {})
  }, [fetchWorkOrders, statusFilter, deviceIdFilter])

  const filtered = workOrders.filter((w) => {
    const matchStatus = !statusFilter || w.status === statusFilter
    const matchDevice = !deviceIdFilter || String(w.device_id) === deviceIdFilter
    const matchType = !typeFilter || w.type === typeFilter
    const matchSite = !siteFilter || String(w.site_id) === siteFilter
    return matchStatus && matchDevice && matchType && matchSite
  })

  const handleCreate = async () => {
    await createWorkOrder({
      type: form.type,
      priority: form.priority,
      device_id: form.device_id ? Number(form.device_id) : undefined,
      site_id: form.site_id ? Number(form.site_id) : undefined,
      description: form.description,
    })
    setShowModal(false)
    setForm({ type: '', priority: 'medium', device_id: '', site_id: '', description: '' })
    fetchWorkOrders()
  }

  const columns: Column<WorkOrder>[] = [
    { key: 'id', label: '工单号', render: (r) => <span className="font-mono text-xs">WO-{r.id}</span> },
    { key: 'type', label: '类型' },
    { key: 'priority', label: '优先级', render: (r) => <StatusBadge status={r.priority} type="priority" /> },
    { key: 'device_name', label: '设备', render: (r) => r.device_name || (r.device_id ? `#${r.device_id}` : '-') },
    { key: 'site_name', label: '站点', render: (r) => {
      const site = allSites.find((s) => s.id === r.site_id)
      return site?.name || (r.site_id ? `#${r.site_id}` : '-')
    }},
    { key: 'status', label: '状态', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', label: '创建时间', render: (r) => new Date(r.created_at).toLocaleString() },
    { key: 'assignee', label: '处理人', render: (r) => r.assignee || '-' },
    { key: 'actions', label: '操作', render: (r) => (
      <button onClick={(e) => { e.stopPropagation(); navigate(`/work-orders/${r.id}`) }} className="text-blue-600 hover:underline text-xs">详情</button>
    )},
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">运维工单</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
          <Plus className="w-4 h-4" /> 创建工单
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm">
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="assigned">已分配</option>
          <option value="resolved">已解决</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm">
          <option value="">全部类型</option>
          <option value="offline">离线</option>
          <option value="port_damage">端口损坏</option>
          <option value="charge_interrupt">充电中断</option>
          <option value="complaint">用户投诉</option>
        </select>
        <select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm">
          <option value="">全部站点</option>
          {allSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/work-orders/${row.id}`)}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-base font-semibold mb-4">创建工单</h3>
            <div className="space-y-3">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm">
                <option value="">选择类型</option>
                <option value="offline">离线</option>
                <option value="port_damage">端口损坏</option>
                <option value="charge_interrupt">充电中断</option>
                <option value="complaint">用户投诉</option>
              </select>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm">
                <option value="low">低优先级</option>
                <option value="medium">中优先级</option>
                <option value="high">高优先级</option>
              </select>
              <select value={form.site_id} onChange={(e) => setForm({ ...form, site_id: e.target.value })} className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm">
                <option value="">选择站点</option>
                {allSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input value={form.device_id} onChange={(e) => setForm({ ...form, device_id: e.target.value })} placeholder="设备ID（可选）" type="number" className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="问题描述" rows={3} className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm resize-none" />
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
