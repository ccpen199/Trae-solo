import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

const statusMap: Record<string, string> = {
  in_stock: '在库', in_use: '使用中', maintenance: '维护中', retired: '已退役', cascaded: '梯次利用',
}

const statusColor: Record<string, string> = {
  in_stock: 'bg-sky-500/20 text-sky-400',
  in_use: 'bg-emerald-500/20 text-emerald-400',
  maintenance: 'bg-amber-500/20 text-amber-400',
  retired: 'bg-slate-500/20 text-slate-400',
  cascaded: 'bg-purple-500/20 text-purple-400',
}

const alertTypeMap: Record<string, string> = {
  bulging: '鼓包', high_temp: '高温', insulation: '绝缘异常', capacity_decay: '容量衰减', recall: '召回',
}

const triggerTypeMap: Record<string, string> = {
  cycle_count: '循环次数', health_level: '健康度', fault_code: '故障码', time_based: '时间触发',
}

const taskTypeMap: Record<string, string> = {
  inspect: '检测', repair: '维修', retire: '报废', cascade: '梯次利用',
}

const planStatusMap: Record<string, string> = {
  pending: '待执行', executing: '执行中', completed: '已完成', cancelled: '已取消',
}

const alertStatusMap: Record<string, string> = {
  open: '待处理', reviewing: '处理中', resolved: '已处理',
}

const severityMap: Record<string, string> = {
  low: '低', medium: '中', high: '高', critical: '严重',
}

const severityColor: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-400',
  medium: 'bg-amber-500/20 text-amber-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
}

const tabs = ['基础信息', '使用历史', '维护记录', '安全告警'] as const

export default function BatteryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentBattery, fetchBattery, usageRecords, fetchUsageRecords, maintenancePlans, fetchMaintenancePlans, safetyAlerts, fetchSafetyAlerts } = useStore()
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('基础信息')

  useEffect(() => {
    if (id) fetchBattery(id)
  }, [id, fetchBattery])

  useEffect(() => {
    if (id && activeTab === '使用历史') fetchUsageRecords({ battery_id: id })
    if (id && activeTab === '维护记录') fetchMaintenancePlans({ battery_id: id })
    if (id && activeTab === '安全告警') fetchSafetyAlerts({ battery_id: id })
  }, [id, activeTab, fetchUsageRecords, fetchMaintenancePlans, fetchSafetyAlerts])

  if (!currentBattery) {
    return <div className="text-slate-400 text-center py-20">加载中...</div>
  }

  const b = currentBattery
  const riskAlerts = (b as any).riskAlerts || []
  const isHighRisk = Array.isArray(riskAlerts) && riskAlerts.length > 0

  const fields = [
    { label: '编码', value: b.code || '-' },
    { label: '型号', value: b.model || '-' },
    { label: '供应商', value: b.supplier || '-' },
    { label: '采购批次', value: b.purchase_batch || '-' },
    { label: '容量(Ah)', value: String(b.capacity ?? '-') },
    { label: '质保期', value: b.warranty_date || '-' },
    { label: '初始检测结果', value: b.initial_test_result || '-' },
    { label: '状态', value: b.status || '-' },
    { label: '创建时间', value: b.created_at ? String(b.created_at).slice(0, 19) : '-' },
    { label: '更新时间', value: b.updated_at ? String(b.updated_at).slice(0, 19) : '-' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/batteries')} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" />返回列表
        </button>
        <h2 className="text-xl font-semibold text-white">电池详情 - {b.code}</h2>
        <span className={`text-xs px-2 py-0.5 rounded ${statusColor[b.status] || ''}`}>
          {statusMap[b.status] || b.status}
        </span>
        {isHighRisk && (
          <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />高风险
          </span>
        )}
      </div>

      {isHighRisk && (
        <div className="bg-red-950/50 border border-red-500/40 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-red-300 font-semibold text-sm mb-2">
                安全警告：该电池存在 {riskAlerts.length} 条未处理的高风险告警，已暂停流转
              </div>
              <div className="space-y-1.5">
                {riskAlerts.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${severityColor[a.severity] || ''}`}>
                      {severityMap[a.severity] || a.severity}
                    </span>
                    <span className="text-red-200">{alertTypeMap[a.alert_type] || a.alert_type}</span>
                    <span className="text-red-400/70">- {a.description}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-red-400/80">
                该电池已被限制：禁止编辑档案、禁止新增使用记录、禁止删除。请前往安全告警页面处理相关告警后再恢复操作。
              </div>
              <button
                onClick={() => navigate('/alerts')}
                className="mt-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs rounded-lg transition-colors"
              >
                前往处理告警
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm transition-colors ${
              activeTab === tab ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white'
            }`}
          >{tab}</button>
        ))}
      </div>

      {activeTab === '基础信息' && (
        <div className="grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.label} className="bg-[#1E293B] rounded-lg p-4 border border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">{f.label}</div>
              <div className="text-white text-sm">
                {f.label === '状态' ? (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColor[b.status] || ''}`}>
                      {statusMap[b.status] || b.status}
                    </span>
                    {isHighRisk && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                        流转受限
                      </span>
                    )}
                  </div>
                ) : f.value || '-'}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === '使用历史' && (
        <div className="bg-[#1E293B] rounded-lg border border-slate-700/50 overflow-hidden">
          {isHighRisk && (
            <div className="px-4 py-3 bg-amber-950/40 border-b border-amber-500/30 text-amber-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              该电池存在高风险告警，禁止新增使用记录
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400">
                <th className="text-left px-4 py-3 font-medium">车辆</th>
                <th className="text-left px-4 py-3 font-medium">站点</th>
                <th className="text-left px-4 py-3 font-medium">充放电次数</th>
                <th className="text-left px-4 py-3 font-medium">温度(°C)</th>
                <th className="text-left px-4 py-3 font-medium">SOC(%)</th>
                <th className="text-left px-4 py-3 font-medium">SOH(%)</th>
                <th className="text-left px-4 py-3 font-medium">异常</th>
                <th className="text-left px-4 py-3 font-medium">记录时间</th>
              </tr>
            </thead>
            <tbody>
              {usageRecords.map((r, i) => (
                <tr key={r.id} className={`border-t border-slate-700/50 ${i % 2 === 1 ? 'bg-slate-800/30' : ''}`}>
                  <td className="px-4 py-3 text-slate-300">{r.vehicle_id || '-'}</td>
                  <td className="px-4 py-3 text-slate-300">{r.station_id || '-'}</td>
                  <td className="px-4 py-3 text-slate-300">{r.charge_cycles}</td>
                  <td className="px-4 py-3 text-slate-300">{r.temperature}</td>
                  <td className="px-4 py-3 text-slate-300">{r.soc}</td>
                  <td className="px-4 py-3 text-slate-300">{r.soh}</td>
                  <td className="px-4 py-3">
                    {r.has_anomaly ? <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">异常</span> : <span className="text-xs text-slate-500">正常</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{r.recorded_at?.slice(0, 16)}</td>
                </tr>
              ))}
              {usageRecords.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-500">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === '维护记录' && (
        <div className="bg-[#1E293B] rounded-lg border border-slate-700/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400">
                <th className="text-left px-4 py-3 font-medium">触发类型</th>
                <th className="text-left px-4 py-3 font-medium">任务类型</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-left px-4 py-3 font-medium">计划时间</th>
                <th className="text-left px-4 py-3 font-medium">描述</th>
              </tr>
            </thead>
            <tbody>
              {maintenancePlans.map((p, i) => (
                <tr key={p.id} className={`border-t border-slate-700/50 ${i % 2 === 1 ? 'bg-slate-800/30' : ''}`}>
                  <td className="px-4 py-3 text-slate-300">{triggerTypeMap[p.trigger_type] || p.trigger_type}</td>
                  <td className="px-4 py-3 text-slate-300">{taskTypeMap[p.task_type] || p.task_type}</td>
                  <td className="px-4 py-3 text-slate-300">{planStatusMap[p.status] || p.status}</td>
                  <td className="px-4 py-3 text-slate-400">{p.scheduled_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-slate-400">{p.description || '-'}</td>
                </tr>
              ))}
              {maintenancePlans.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-slate-500">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === '安全告警' && (
        <div className="bg-[#1E293B] rounded-lg border border-slate-700/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400">
                <th className="text-left px-4 py-3 font-medium">告警类型</th>
                <th className="text-left px-4 py-3 font-medium">严重程度</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-left px-4 py-3 font-medium">描述</th>
                <th className="text-left px-4 py-3 font-medium">处置结论</th>
                <th className="text-left px-4 py-3 font-medium">复查人</th>
                <th className="text-left px-4 py-3 font-medium">告警时间</th>
                <th className="text-left px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {safetyAlerts.length > 0 ? safetyAlerts.map((a, i) => (
                <tr key={a.id} className={`border-t border-slate-700/50 ${i % 2 === 1 ? 'bg-slate-800/30' : ''} ${a.status !== 'resolved' && (a.severity === 'high' || a.severity === 'critical') ? 'bg-red-950/20' : ''}`}>
                  <td className="px-4 py-3 text-slate-300">{alertTypeMap[a.alert_type] || a.alert_type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${severityColor[a.severity] || ''}`}>
                      {severityMap[a.severity] || a.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{alertStatusMap[a.status] || a.status}</td>
                  <td className="px-4 py-3 text-slate-400">{a.description || '-'}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs max-w-48 truncate" title={a.disposition || ''}>
                    {a.disposition || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{a.reviewer || '-'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    <div>{a.alert_at ? String(a.alert_at).slice(0, 16) : '-'}</div>
                    {a.reviewed_at && <div className="text-amber-400">复查: {String(a.reviewed_at).slice(0, 16)}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {a.status !== 'resolved' && (
                      <button onClick={() => navigate(`/alerts/${a.id}`)} className="text-sky-400 hover:text-sky-300 text-xs">
                        去处理
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="text-center py-10 text-slate-500">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
