import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import DataTable, { type Column } from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import type { Order, Site, Device } from '@/api/client'
import * as api from '@/api/client'

export default function Orders() {
  const { orders, fetchOrders, createOrder, sites, fetchSites, devices, fetchDevices } = useStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [siteFilter, setSiteFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [refundFilter, setRefundFilter] = useState(searchParams.get('refund_status') || '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ device_id: '', port_id: '' })
  const [allSites, setAllSites] = useState<Site[]>([])
  const [deviceList, setDeviceList] = useState<Device[]>([])

  useEffect(() => {
    fetchOrders({ refund_status: refundFilter, status: statusFilter })
    api.getSites().then(setAllSites).catch(() => {})
    api.getDevices().then(setDeviceList).catch(() => {})
  }, [fetchOrders, refundFilter, statusFilter])

  const filtered = orders.filter((o) => {
    const matchSite = !siteFilter || String(o.site_id) === siteFilter
    const matchStatus = !statusFilter || o.status === statusFilter
    const matchRefund = !refundFilter || o.refund_status === refundFilter
    const matchFrom = !dateFrom || o.start_time >= dateFrom
    const matchTo = !dateTo || o.start_time <= dateTo + 'T23:59:59'
    return matchSite && matchStatus && matchRefund && matchFrom && matchTo
  })

  const handleCreate = async () => {
    await createOrder({ device_id: Number(form.device_id), port_id: Number(form.port_id) })
    setShowModal(false)
    setForm({ device_id: '', port_id: '' })
    fetchOrders()
  }

  const columns: Column<Order>[] = [
    { key: 'id', label: '订单号', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
    { key: 'site_name', label: '站点', render: (r) => {
      const site = allSites.find((s) => s.id === r.site_id)
      return site?.name || `站点#${r.site_id}`
    }},
    { key: 'device_name', label: '设备', render: (r) => {
      const dev = deviceList.find((d) => d.id === r.device_id)
      return dev?.name || `设备#${r.device_id}`
    }},
    { key: 'start_time', label: '开始时间', render: (r) => new Date(r.start_time).toLocaleString() },
    { key: 'duration', label: '时长(分)', render: (r) => r.duration?.toFixed(0) ?? '-' },
    { key: 'energy', label: '电量(kWh)', render: (r) => r.energy?.toFixed(2) ?? '-' },
    { key: 'cost', label: '费用', render: (r) => `¥${r.cost?.toFixed(2) ?? '0.00'}` },
    { key: 'stop_reason', label: '停止原因', render: (r) => r.stop_reason || '-' },
    { key: 'refund_status', label: '退款状态', render: (r) => <StatusBadge status={r.refund_status} /> },
    { key: 'actions', label: '操作', render: (r) => (
      <button onClick={(e) => { e.stopPropagation(); navigate(`/orders/${r.id}`) }} className="text-blue-600 hover:underline text-xs">详情</button>
    )},
  ]

  const filteredDevices = form.device_id ? deviceList : deviceList

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">订单管理</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
          <Plus className="w-4 h-4" /> 创建订单
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm">
          <option value="">全部站点</option>
          {allSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm">
          <option value="">全部状态</option>
          <option value="charging">充电中</option>
          <option value="completed">已完成</option>
          <option value="stopped">已停止</option>
        </select>
        <select value={refundFilter} onChange={(e) => setRefundFilter(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm">
          <option value="">全部退款状态</option>
          <option value="none">未退款</option>
          <option value="partial">部分退款</option>
          <option value="full">全额退款</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/orders/${row.id}`)}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-base font-semibold mb-4">创建订单（扫码模拟）</h3>
            <div className="space-y-3">
              <select value={form.device_id} onChange={(e) => setForm({ ...form, device_id: e.target.value, port_id: '' })} className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm">
                <option value="">选择设备</option>
                {deviceList.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.model})</option>)}
              </select>
              <select value={form.port_id} onChange={(e) => setForm({ ...form, port_id: e.target.value })} className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm">
                <option value="">选择端口</option>
                {filteredDevices.filter((d) => !form.device_id || d.id === Number(form.device_id)).map((d) =>
                  d.ports?.map((p) => <option key={p.id} value={p.id}>端口 {p.port_number} ({p.status})</option>)
                )}
              </select>
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
