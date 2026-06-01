import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Save, X, DollarSign, Zap, TrendingUp } from 'lucide-react'
import { useStore } from '@/store/useStore'
import StatusBadge from '@/components/StatusBadge'
import DataTable, { type Column } from '@/components/DataTable'
import type { Device, Partner, FinanceBySite } from '@/api/client'
import * as api from '@/api/client'

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentSite, fetchSite, updateSite, devices, fetchDevices } = useStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<typeof currentSite>>({})
  const [partners, setPartners] = useState<Partner[]>([])
  const [siteFinance, setSiteFinance] = useState<FinanceBySite | null>(null)

  const siteId = Number(id)

  useEffect(() => {
    if (siteId) {
      fetchSite(siteId)
      fetchDevices({ site_id: String(siteId) })
    }
  }, [siteId, fetchSite, fetchDevices])

  useEffect(() => {
    if (currentSite) {
      setForm({ ...currentSite })
    }
  }, [currentSite])

  useEffect(() => {
    fetch(`/api/sites/${siteId}`)
      .then((r) => r.json())
      .then((data) => {
        const d = data.data ?? data
        if (Array.isArray(d.partners)) setPartners(d.partners)
      })
      .catch(() => {})
  }, [siteId])

  useEffect(() => {
    api.getFinanceBySite().then((list) => {
      const found = list.find((s) => s.site_id === siteId)
      if (found) setSiteFinance(found)
    }).catch(() => {})
  }, [siteId])

  if (!currentSite) {
    return <div className="text-center text-slate-400 py-12">加载中...</div>
  }

  const handleSave = async () => {
    await updateSite(siteId, form)
    setEditing(false)
  }

  const siteDevices = devices.filter((d) => d.site_id === siteId)

  const deviceColumns: Column<Device>[] = [
    { key: 'name', label: '设备名称' },
    { key: 'model', label: '型号' },
    { key: 'power', label: '功率', render: (r) => `${r.power}kW` },
    { key: 'online', label: '状态', render: (r) => <StatusBadge status={r.online ? 'online' : 'offline'} /> },
    { key: 'fault_code', label: '故障码', render: (r) => r.fault_code || '-' },
    { key: 'actions', label: '操作', render: (r) => (
      <button onClick={(e) => { e.stopPropagation(); navigate(`/devices/${r.id}`) }} className="text-blue-600 hover:underline text-xs">详情</button>
    )},
  ]

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/sites')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> 返回站点列表
      </button>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">{currentSite.name}</h2>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                <Save className="w-3 h-3" /> 保存
              </button>
              <button onClick={() => { setEditing(false); setForm({ ...currentSite }) }} className="flex items-center gap-1 text-slate-600 border border-slate-200 px-3 py-1 rounded text-sm">
                <X className="w-3 h-3" /> 取消
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-blue-600 border border-blue-200 px-3 py-1 rounded text-sm hover:bg-blue-50">
              <Edit2 className="w-3 h-3" /> 编辑
            </button>
          )}
        </div>

        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-slate-500">站点名称</label><input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm mt-1" /></div>
            <div><label className="text-xs text-slate-500">地址</label><input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm mt-1" /></div>
            <div><label className="text-xs text-slate-500">运营商</label><input value={form.operator || ''} onChange={(e) => setForm({ ...form, operator: e.target.value })} className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm mt-1" /></div>
            <div><label className="text-xs text-slate-500">电价(元/kWh)</label><input value={form.electricity_price ?? ''} onChange={(e) => setForm({ ...form, electricity_price: Number(e.target.value) })} type="number" step="0.01" className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm mt-1" /></div>
            <div><label className="text-xs text-slate-500">服务费(元/kWh)</label><input value={form.service_fee ?? ''} onChange={(e) => setForm({ ...form, service_fee: Number(e.target.value) })} type="number" step="0.01" className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm mt-1" /></div>
            <div><label className="text-xs text-slate-500">状态</label><select value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm mt-1"><option value="active">营业中</option><option value="inactive">已停业</option></select></div>
            <div><label className="text-xs text-slate-500">开始时间</label><input value={form.business_hours_start || '00:00'} onChange={(e) => setForm({ ...form, business_hours_start: e.target.value })} type="time" className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm mt-1" /></div>
            <div><label className="text-xs text-slate-500">结束时间</label><input value={form.business_hours_end || '23:59'} onChange={(e) => setForm({ ...form, business_hours_end: e.target.value })} type="time" className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm mt-1" /></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><span className="text-slate-500">地址：</span>{currentSite.address}</div>
            <div><span className="text-slate-500">运营商：</span>{currentSite.operator}</div>
            <div><span className="text-slate-500">电价：</span>¥{currentSite.electricity_price}/kWh</div>
            <div><span className="text-slate-500">服务费：</span>¥{currentSite.service_fee}/kWh</div>
            <div><span className="text-slate-500">营业时间：</span>{currentSite.business_hours_start} - {currentSite.business_hours_end}</div>
            <div><span className="text-slate-500">状态：</span><StatusBadge status={currentSite.status} /></div>
          </div>
        )}
      </div>

      {siteFinance && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-3">
            <div className="bg-violet-500 rounded-lg p-2 text-white"><DollarSign className="w-4 h-4" /></div>
            <div>
              <p className="text-xs text-slate-500">总收入</p>
              <p className="text-xl font-bold text-slate-800">¥{siteFinance.total_revenue?.toFixed(2) ?? '0.00'}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-3">
            <div className="bg-orange-500 rounded-lg p-2 text-white"><Zap className="w-4 h-4" /></div>
            <div>
              <p className="text-xs text-slate-500">电费成本</p>
              <p className="text-xl font-bold text-slate-800">¥{siteFinance.electricity_cost?.toFixed(2) ?? '0.00'}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-3">
            <div className="bg-teal-500 rounded-lg p-2 text-white"><TrendingUp className="w-4 h-4" /></div>
            <div>
              <p className="text-xs text-slate-500">净收入</p>
              <p className="text-xl font-bold text-slate-800">¥{siteFinance.net_income?.toFixed(2) ?? '0.00'}</p>
            </div>
          </div>
        </div>
      )}

      {partners.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-3">合作方与分成规则</h3>
          <div className="space-y-2">
            {partners.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <div><span className="font-medium text-sm">{p.name}</span>{p.contact && <span className="text-xs text-slate-500 ml-2">{p.contact}</span>}</div>
                <span className="text-sm font-medium text-blue-600">{(p.share_ratio * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">站点设备 ({siteDevices.length})</h3>
        </div>
        <DataTable
          columns={deviceColumns}
          data={siteDevices}
          onRowClick={(row) => navigate(`/devices/${row.id}`)}
          emptyText="暂无设备"
        />
      </div>
    </div>
  )
}
