import React, { useState } from 'react'
import { FileText, Search, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '@/store'

const statusBadge: Record<string, string> = {
  '充电中': 'badge-electric',
  '已完成': 'badge-success',
  '异常终止': 'badge-danger',
}

const settlementBadge: Record<string, string> = {
  '已结算': 'badge-success',
  '待结算': 'badge-warning',
  '退款中': 'badge-danger',
}

const methodBadge: Record<string, string> = {
  '扫码': 'bg-electric/15 text-electric border border-electric/20',
  '蓝牙': 'bg-alert-orange/15 text-alert-orange border border-alert-orange/20',
  'NFC': 'bg-alert-orange/15 text-alert-orange border border-alert-orange/20',
}

const riskLabel: Record<string, string> = {
  '扫码': 'text-alert-green',
  '蓝牙': 'text-alert-orange',
  'NFC': 'text-alert-orange',
}

const riskText: Record<string, string> = {
  '扫码': '低风险',
  '蓝牙': '中风险',
  'NFC': '中风险',
}

export default function Orders() {
  const { chargingOrders, billingDetails, alertRecords, settlementDetails } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [settleFilter, setSettleFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const total = chargingOrders.length
  const charging = chargingOrders.filter(o => o.status === '充电中').length
  const completed = chargingOrders.filter(o => o.status === '已完成').length
  const abnormal = chargingOrders.filter(o => o.status === '异常终止').length
  const refunding = chargingOrders.filter(o => o.settlement_status === '退款中').length

  const filtered = chargingOrders
    .filter(o => {
      if (statusFilter && o.status !== statusFilter) return false
      if (settleFilter && o.settlement_status !== settleFilter) return false
      if (search && !o.order_id.toLowerCase().includes(search.toLowerCase()) && !(o.user_nickname || '').includes(search)) return false
      if (startDate && o.start_time.slice(0, 10) < startDate) return false
      if (endDate && o.start_time.slice(0, 10) > endDate) return false
      return true
    })
    .sort((a, b) => b.start_time.localeCompare(a.start_time))

  const stats = [
    { label: '总订单', value: total, color: 'text-electric' },
    { label: '充电中', value: charging, color: 'text-alert-green' },
    { label: '已完成', value: completed, color: 'text-alert-blue' },
    { label: '异常终止', value: abnormal, color: 'text-alert-red' },
    { label: '退款中', value: refunding, color: 'text-alert-orange' },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white flex items-center gap-2">
        <FileText className="w-5 h-5 text-electric" />
        订单与计费
      </h1>

      <div className="grid grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className="card text-center py-3 px-2">
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索订单号/用户" className="input-field pl-9" />
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field w-36" />
            <span className="text-xs">至</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field w-36" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-28">
            <option value="">全部状态</option>
            <option value="充电中">充电中</option>
            <option value="已完成">已完成</option>
            <option value="异常终止">异常终止</option>
          </select>
          <select value={settleFilter} onChange={e => setSettleFilter(e.target.value)} className="input-field w-28">
            <option value="">全部结算</option>
            <option value="已结算">已结算</option>
            <option value="待结算">待结算</option>
            <option value="退款中">退款中</option>
          </select>
        </div>

        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700">
                {['订单号', '用户', '桩号', '启动方式', '开始时间', '电量(kWh)', '金额(¥)', '状态', '结算状态', '详情'].map(h => (
                  <th key={h} className="text-xs text-slate-400 uppercase tracking-wider py-3 px-4 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const detail = billingDetails.find(d => d.order_id === o.order_id)
                const settlement = settlementDetails.find(d => d.order_id === o.order_id)
                const alerts = alertRecords.filter(a => a.order_id === o.order_id)
                const expanded = expandedId === o.order_id
                return (
                  <React.Fragment key={o.order_id}>
                    <tr className="table-row">
                      <td className="text-sm py-3 px-4 font-mono text-electric">{o.order_id}</td>
                      <td className="text-sm py-3 px-4 text-slate-300">{o.user_nickname || o.user_id}</td>
                      <td className="text-sm py-3 px-4 text-slate-300 font-mono">{o.pile_id_display || o.pile_id}</td>
                      <td className="text-sm py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${methodBadge[o.start_method] || 'badge-info'}`}>
                          {o.start_method}
                        </span>
                      </td>
                      <td className="text-sm py-3 px-4 text-slate-300">{o.start_time.slice(0, 16).replace('T', ' ')}</td>
                      <td className="text-sm py-3 px-4 text-slate-300 font-mono">{o.energy_kwh}</td>
                      <td className="text-sm py-3 px-4 text-electric font-mono">{o.total_amount.toFixed(2)}</td>
                      <td className="text-sm py-3 px-4">
                        <span className={statusBadge[o.status] || 'badge-info'}>{o.status}</span>
                        {o.status === '异常终止' && o.abort_reason && (
                          <div className="text-xs text-alert-red mt-0.5">{o.abort_reason}</div>
                        )}
                      </td>
                      <td className="text-sm py-3 px-4">
                        <span className={settlementBadge[o.settlement_status] || 'badge-info'}>{o.settlement_status}</span>
                        {o.settlement_status === '退款中' && o.refund_amount != null && (
                          <div className="text-xs text-slate-400 mt-0.5">¥{o.refund_amount.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="text-sm py-3 px-4">
                        <button onClick={() => setExpandedId(expanded ? null : o.order_id)} className="text-electric hover:text-electric-light transition-colors">
                          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-dark-700/50">
                        <td colSpan={10} className="py-4 px-6">
                          <div className="space-y-4">
                            <div>
                              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">启动信息</div>
                              <div className="grid grid-cols-4 gap-2">
                                <div className="bg-dark-800 rounded-lg px-3 py-2">
                                  <div className="text-xs text-slate-400">启动方式</div>
                                  <div className="text-sm text-slate-200 flex items-center gap-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${methodBadge[o.start_method]}`}>
                                      {o.start_method}
                                    </span>
                                    <span className={`text-xs ${riskLabel[o.start_method]}`}>{riskText[o.start_method]}</span>
                                  </div>
                                </div>
                                <div className="bg-dark-800 rounded-lg px-3 py-2">
                                  <div className="text-xs text-slate-400">用户信息</div>
                                  <div className="text-sm text-slate-200">{o.user_nickname || '-'} <span className="text-xs text-slate-500">{o.user_id}</span></div>
                                </div>
                                <div className="bg-dark-800 rounded-lg px-3 py-2">
                                  <div className="text-xs text-slate-400">充电桩/端口</div>
                                  <div className="text-sm text-slate-200 font-mono">{o.pile_id} / {o.port_id}</div>
                                </div>
                                <div className="bg-dark-800 rounded-lg px-3 py-2">
                                  <div className="text-xs text-slate-400">启动时间</div>
                                  <div className="text-sm text-slate-200">{o.start_time.slice(0, 19).replace('T', ' ')}</div>
                                </div>
                              </div>
                            </div>

                            {detail && (
                              <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">分时计费拆分</div>
                                <div className="space-y-1">
                                  <div className="flex justify-between bg-dark-800 rounded-lg px-3 py-1.5 text-sm">
                                    <span className="text-alert-orange">峰时</span>
                                    <span className="text-slate-200 font-mono">{detail.peak_energy} kWh × ¥{detail.peak_price} = ¥{(detail.peak_energy * detail.peak_price).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between bg-dark-800 rounded-lg px-3 py-1.5 text-sm">
                                    <span className="text-alert-blue">平时</span>
                                    <span className="text-slate-200 font-mono">{detail.flat_energy} kWh × ¥{detail.flat_price} = ¥{(detail.flat_energy * detail.flat_price).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between bg-dark-800 rounded-lg px-3 py-1.5 text-sm">
                                    <span className="text-electric">谷时</span>
                                    <span className="text-slate-200 font-mono">{detail.valley_energy} kWh × ¥{detail.valley_price} = ¥{(detail.valley_energy * detail.valley_price).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between bg-dark-800 rounded-lg px-3 py-1.5 text-sm">
                                    <span className="text-slate-400">服务费</span>
                                    <span className="text-alert-orange font-mono">¥{detail.service_fee.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between bg-dark-800/80 rounded-lg px-3 py-1.5 text-sm border-t border-surface-border">
                                    <span className="text-slate-300">总电费 ¥{detail.total_electric_fee.toFixed(2)} + 服务费 ¥{detail.service_fee.toFixed(2)}</span>
                                    <span className="text-electric font-mono font-bold">= ¥{detail.total_amount.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {settlement && (
                              <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">清分结算</div>
                                <div className="grid grid-cols-4 gap-2">
                                  <div className="bg-dark-800 rounded-lg px-3 py-2">
                                    <div className="text-xs text-slate-400">电网</div>
                                    <div className="text-sm text-alert-blue font-mono">¥{settlement.grid_share.toFixed(2)} <span className="text-xs text-slate-500">({(settlement.grid_share / settlement.total_amount * 100).toFixed(1)}%)</span></div>
                                  </div>
                                  <div className="bg-dark-800 rounded-lg px-3 py-2">
                                    <div className="text-xs text-slate-400">物业</div>
                                    <div className="text-sm text-alert-orange font-mono">¥{settlement.property_share.toFixed(2)} <span className="text-xs text-slate-500">({(settlement.property_share / settlement.total_amount * 100).toFixed(1)}%)</span></div>
                                  </div>
                                  <div className="bg-dark-800 rounded-lg px-3 py-2">
                                    <div className="text-xs text-slate-400">运营方</div>
                                    <div className="text-sm text-electric font-mono">¥{settlement.operator_share.toFixed(2)} <span className="text-xs text-slate-500">({(settlement.operator_share / settlement.total_amount * 100).toFixed(1)}%)</span></div>
                                  </div>
                                  <div className="bg-dark-800 rounded-lg px-3 py-2">
                                    <div className="text-xs text-slate-400">结算时间</div>
                                    <div className="text-sm text-slate-200">{settlement.settled_at.slice(0, 16).replace('T', ' ')}</div>
                                  </div>
                                </div>
                                {o.settlement_status === '退款中' && o.refund_amount != null && (
                                  <div className="mt-2 bg-alert-red/10 rounded-lg px-3 py-2 text-sm text-alert-red">
                                    退款金额: ¥{o.refund_amount.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            )}

                            {o.status === '异常终止' && (
                              <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">异常记录</div>
                                <div className="bg-alert-red/10 rounded-lg px-3 py-2 mb-2 text-sm text-alert-red">
                                  终止原因: {o.abort_reason || '未知'}
                                </div>
                                {alerts.length > 0 && (
                                  <div className="space-y-1">
                                    {alerts.slice(0, 3).map(a => (
                                      <div key={a.alert_id} className="bg-dark-800 rounded-lg px-3 py-2 text-sm flex items-center gap-3">
                                        <span className="badge-danger text-xs">{a.alert_type}</span>
                                        <span className={`text-xs ${a.severity === '紧急' ? 'text-alert-red' : a.severity === '重要' ? 'text-alert-orange' : 'text-alert-blue'}`}>{a.severity}</span>
                                        <span className="text-slate-300 flex-1">{a.description}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {o.settlement_status === '退款中' && o.refund_amount != null && (
                              <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">退款进度</div>
                                <div className="bg-alert-orange/10 rounded-lg px-3 py-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="badge-warning">退款中</span>
                                    <span className="text-alert-orange font-mono">¥{o.refund_amount.toFixed(2)}</span>
                                    <span className="text-slate-400 ml-2">等待审核处理</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
