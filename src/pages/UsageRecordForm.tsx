import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, type Battery } from '@/store'
import { AlertTriangle } from 'lucide-react'

export default function UsageRecordForm() {
  const navigate = useNavigate()
  const { batteries, fetchBatteries, createUsageRecord, createUsageRecordError } = useStore()
  const [form, setForm] = useState({
    battery_id: '',
    vehicle_id: '',
    station_id: '',
    order_id: '',
    charge_cycles: '',
    temperature: '',
    soc: '',
    soh: '',
    has_anomaly: false,
    anomaly_desc: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchBatteries({ page: '1', page_size: '1000' })
  }, [fetchBatteries])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.battery_id) errs.battery_id = '请选择电池'
    if (form.has_anomaly && !form.anomaly_desc.trim()) errs.anomaly_desc = '请填写异常描述'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const data = {
      ...form,
      charge_cycles: Number(form.charge_cycles) || 0,
      temperature: Number(form.temperature) || 0,
      soc: Number(form.soc) || 0,
      soh: Number(form.soh) || 0,
      has_anomaly: form.has_anomaly ? 1 : 0,
    }

    const ok = await createUsageRecord(data)
    if (ok) {
      navigate('/usage')
    }
  }

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
  }

  const normalBatteries = batteries.filter((b) => !b.hasHighRiskAlerts)
  const highRiskBatteries = batteries.filter((b) => b.hasHighRiskAlerts)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">新增使用记录</h2>

      {highRiskBatteries.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-amber-300 font-semibold text-sm mb-2">
                业务入口收敛提示
              </div>
              <div className="text-sm text-amber-200">
                有 {highRiskBatteries.length} 块电池因存在未处理的高风险告警，已从可选范围中排除：
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {highRiskBatteries.map((b) => (
                  <span key={b.id} className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                    {b.code}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#1E293B] rounded-lg p-6 border border-slate-700/50 max-w-2xl">
        {createUsageRecordError && (
          <div className="mb-4 px-4 py-3 bg-red-950/50 border border-red-500/40 rounded-lg text-red-300 text-sm">
            {createUsageRecordError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">电池 <span className="text-red-400">*</span></label>
            <select
              value={form.battery_id}
              onChange={(e) => updateField('battery_id', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="">请选择电池</option>
              {normalBatteries.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} - {b.model}
                </option>
              ))}
            </select>
            {errors.battery_id && <p className="text-red-400 text-xs mt-1">{errors.battery_id}</p>}
            {normalBatteries.length === 0 && batteries.length > 0 && (
              <p className="text-amber-400 text-xs mt-1">当前所有电池均因高风险告警被限制使用</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">车辆编号</label>
            <input value={form.vehicle_id} onChange={(e) => updateField('vehicle_id', e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">站点编号</label>
            <input value={form.station_id} onChange={(e) => updateField('station_id', e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">订单编号</label>
            <input value={form.order_id} onChange={(e) => updateField('order_id', e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">充放电次数</label>
            <input type="number" value={form.charge_cycles} onChange={(e) => updateField('charge_cycles', e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">温度(°C)</label>
            <input type="number" step="0.1" value={form.temperature} onChange={(e) => updateField('temperature', e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">SOC(%)</label>
            <input type="number" step="0.1" value={form.soc} onChange={(e) => updateField('soc', e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">SOH(%)</label>
            <input type="number" step="0.1" value={form.soh} onChange={(e) => updateField('soh', e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.has_anomaly} onChange={(e) => updateField('has_anomaly', e.target.checked)} className="rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500" />
              是否异常
            </label>
          </div>
          {form.has_anomaly && (
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1">异常描述 <span className="text-red-400">*</span></label>
              <textarea value={form.anomaly_desc} onChange={(e) => updateField('anomaly_desc', e.target.value)} rows={3} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
              {errors.anomaly_desc && <p className="text-red-400 text-xs mt-1">{errors.anomaly_desc}</p>}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg transition-colors"
          >
            创建
          </button>
          <button type="button" onClick={() => navigate('/usage')} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors">取消</button>
        </div>
      </form>
    </div>
  )
}
