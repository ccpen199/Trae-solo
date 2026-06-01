import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Cpu, Receipt, DollarSign, AlertTriangle, ClipboardList, Wallet, Zap, TrendingUp, Wrench, Headphones } from 'lucide-react'
import { useStore } from '@/store/useStore'
import StatCard from '@/components/StatCard'
import StatusBadge from '@/components/StatusBadge'
import FeeBreakdownModal, { FeeBreakdownTooltip } from '@/components/FeeBreakdown'
import PendingWorkOrdersTable from '@/components/PendingWorkOrdersTable'
import type { Order } from '@/api/client'

const stopReasonLabels: Record<string, string> = {
  user_stop: '手动停止',
  full: '充满自动停',
  timeout: '超时自动停',
  fault: '故障停止',
}

export default function Dashboard() {
  const { stats, fetchStats, summary, fetchSummary } = useStore()
  const navigate = useNavigate()
  const [feeBreakdownOrder, setFeeBreakdownOrder] = useState<Order | null>(null)
  const [hoveredFeeOrder, setHoveredFeeOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchStats()
    fetchSummary()
  }, [fetchStats, fetchSummary])

  const recentOrders = stats?.recent_orders?.slice(0, 10) ?? []
  const alertDevices = stats?.alert_devices ?? []
  const pendingWorkOrders = stats?.pending_work_orders_list ?? []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => navigate('/sites')}
          className="bg-white rounded-lg border border-slate-200 p-5 text-left hover:border-blue-500 hover:shadow-md transition-all group pointer-events-auto"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">运营管理</h3>
          </div>
          <p className="text-xs text-slate-500">站点档案、设备监控、运营数据</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/work-orders?status=pending')}
          className="bg-white rounded-lg border border-slate-200 p-5 text-left hover:border-blue-500 hover:shadow-md transition-all group pointer-events-auto"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">设备运维</h3>
          </div>
          <p className="text-xs text-slate-500">工单处理、设备维护、故障排查</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/orders?refund_status=partial')}
          className="bg-white rounded-lg border border-slate-200 p-5 text-left hover:border-blue-500 hover:shadow-md transition-all group pointer-events-auto"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">用户客服</h3>
          </div>
          <p className="text-xs text-slate-500">订单查询、退款处理、用户投诉</p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/finance')}
          className="bg-white rounded-lg border border-slate-200 p-5 text-left hover:border-blue-500 hover:shadow-md transition-all group pointer-events-auto"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">财务管理</h3>
          </div>
          <p className="text-xs text-slate-500">收入统计、分成结算、退款明细</p>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MapPin} label="总站点" value={stats?.total_sites ?? '-'} color="bg-blue-600" />
        <StatCard icon={Cpu} label="在线设备" value={stats?.online_devices ?? '-'} color="bg-cyan-500" />
        <StatCard icon={Receipt} label="今日订单" value={stats?.today_orders ?? '-'} color="bg-amber-500" />
        <StatCard icon={DollarSign} label="今日收入" value={stats?.today_revenue != null ? `¥${stats.today_revenue.toFixed(2)}` : '-'} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Wallet} label="总收入" value={summary?.total_revenue != null ? `¥${summary.total_revenue.toFixed(2)}` : '-'} color="bg-violet-500" />
        <StatCard icon={Zap} label="电费成本" value={summary?.total_electricity_cost != null ? `¥${summary.total_electricity_cost.toFixed(2)}` : '-'} color="bg-orange-500" />
        <StatCard icon={TrendingUp} label="净收入" value={summary?.net_income != null ? `¥${summary.net_income.toFixed(2)}` : '-'} color="bg-teal-500" />
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">最近订单</h3>
          <button type="button" onClick={() => navigate('/orders')} className="text-xs text-blue-600 hover:underline pointer-events-auto">
            查看全部
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>站点</th>
                <th>设备</th>
                <th>开始时间</th>
                <th>充电时长(分)</th>
                <th>电量(kWh)</th>
                <th>费用(¥)</th>
                <th>停止原因</th>
                <th>退款状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-slate-400 py-6">暂无订单</td></tr>
              ) : recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono text-xs">#{o.id}</td>
                  <td>{o.site_name || o.site_id}</td>
                  <td>{o.device_name || o.device_id}</td>
                  <td className="text-xs">{new Date(o.start_time).toLocaleString()}</td>
                  <td>{o.duration?.toFixed(0) ?? '-'}</td>
                  <td>{o.energy?.toFixed(2) ?? '-'}</td>
                  <td
                    className="relative cursor-help"
                    onMouseEnter={() => setHoveredFeeOrder(o)}
                    onMouseLeave={() => setHoveredFeeOrder(null)}
                  >
                    ¥{o.cost?.toFixed(2) ?? '0.00'}
                    {hoveredFeeOrder?.id === o.id && <FeeBreakdownTooltip order={o} />}
                  </td>
                  <td>{stopReasonLabels[o.stop_reason ?? ''] || o.stop_reason || '-'}</td>
                  <td>
                    {o.refund_status === 'none' ? (
                      <button
                        type="button"
                        className="status-badge status-badge-gray cursor-pointer pointer-events-auto"
                        onClick={() => setFeeBreakdownOrder(o)}
                      >
                        未退款
                      </button>
                    ) : (
                      <StatusBadge status={o.refund_status} />
                    )}
                  </td>
                  <td>
                    <button type="button" onClick={() => navigate(`/orders/${o.id}`)} className="text-blue-600 hover:underline text-xs pointer-events-auto">
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              告警设备
            </h3>
            <button type="button" onClick={() => navigate('/devices')} className="text-xs text-blue-600 hover:underline pointer-events-auto">
              查看全部
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>设备名称</th>
                  <th>所属站点</th>
                  <th>功率(kW)</th>
                  <th>端口状态</th>
                  <th>故障码</th>
                  <th>最近心跳</th>
                  <th>关联工单</th>
                  <th>工单状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {alertDevices.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-slate-400 py-6">所有设备正常</td></tr>
                ) : alertDevices.map((d) => {
                  const ports = d.ports ?? []
                  const idleCount = ports.filter((p) => p.status === 'idle').length
                  const portSummary = ports.length > 0 ? `${idleCount}/${ports.length}空闲` : '-'
                  return (
                    <tr key={d.id}>
                      <td className="font-medium">{d.name}</td>
                      <td>{d.site_name || d.site_id}</td>
                      <td>{d.power}</td>
                      <td>{portSummary}</td>
                      <td>{d.fault_code ? <span className="text-red-600 font-mono text-xs">{d.fault_code}</span> : '-'}</td>
                      <td className="text-xs">{d.last_heartbeat ? new Date(d.last_heartbeat).toLocaleString() : '-'}</td>
                      <td>
                        {d.related_work_order_id ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/work-orders/${d.related_work_order_id}`)}
                            className="text-blue-600 hover:underline text-xs font-mono pointer-events-auto"
                          >
                            #{d.related_work_order_id}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">待创建</span>
                        )}
                      </td>
                      <td>
                        {d.work_order_status ? (
                          <StatusBadge status={d.work_order_status} />
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td>
                        <button type="button" onClick={() => navigate(`/devices/${d.id}`)} className="text-blue-600 hover:underline text-xs pointer-events-auto">
                          详情
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <PendingWorkOrdersTable workOrders={pendingWorkOrders} />
      </div>

      {feeBreakdownOrder && (
        <FeeBreakdownModal order={feeBreakdownOrder} onClose={() => setFeeBreakdownOrder(null)} />
      )}
    </div>
  )
}
