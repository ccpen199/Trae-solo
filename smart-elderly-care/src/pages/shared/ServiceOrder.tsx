import { useState } from 'react'
import { ClipboardList, Clock, CheckCircle, AlertCircle, Shield, X, Filter } from 'lucide-react'
import type { ServiceOrder as ServiceOrderType } from '../../types'
import { serviceOrders } from '../../data/mockData'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'

const typeMap: Record<string, string> = {
  bathing: '助浴',
  meal_delivery: '送餐',
  medical_escort: '陪医',
  cleaning: '保洁',
  companionship: '陪伴',
  rehabilitation: '康复',
}

const urgencyMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'bg-green-100 text-green-700' },
  medium: { label: '中', color: 'bg-blue-100 text-blue-700' },
  high: { label: '高', color: 'bg-orange-100 text-orange-700' },
  critical: { label: '紧急', color: 'bg-red-100 text-red-700' },
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const config = urgencyMap[urgency]
  if (!config) return null
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

function OrderDetailPanel({ order, onClose }: { order: ServiceOrderType; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">工单详情</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-slate-400">工单号</span>
              <p className="text-sm text-slate-800 mt-0.5 font-mono">{order.id}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">状态</span>
              <div className="mt-0.5"><StatusBadge status={order.status} type="order" /></div>
            </div>
            <div>
              <span className="text-xs text-slate-400">老人姓名</span>
              <p className="text-sm text-slate-800 mt-0.5">{order.elderName}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">服务类型</span>
              <p className="text-sm text-slate-800 mt-0.5">{typeMap[order.type]}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">预约时间</span>
              <p className="text-sm text-slate-800 mt-0.5">{new Date(order.scheduledTime).toLocaleString('zh-CN')}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">紧急度</span>
              <div className="mt-0.5"><UrgencyBadge urgency={order.urgency} /></div>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-slate-400">服务地址</span>
              <p className="text-sm text-slate-800 mt-0.5">{order.address}</p>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-slate-400">备注</span>
              <p className="text-sm text-slate-800 mt-0.5">{order.notes}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">创建时间</span>
              <p className="text-sm text-slate-800 mt-0.5">{new Date(order.createdAt).toLocaleString('zh-CN')}</p>
            </div>
            {order.completedAt && (
              <div>
                <span className="text-xs text-slate-400">完成时间</span>
                <p className="text-sm text-slate-800 mt-0.5">{new Date(order.completedAt).toLocaleString('zh-CN')}</p>
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              服务供应商资质核验
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400">服务人员</span>
                <p className="text-sm text-slate-800 mt-0.5">{order.serviceProviderName}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">资质编号</span>
                <p className="text-sm text-slate-800 mt-0.5 font-mono">{order.serviceProviderCert}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">核验状态</span>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <Shield className="w-3.5 h-3.5" />
                    已核验
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ServiceOrder() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrderType | null>(null)

  const filtered = serviceOrders.filter(order => {
    const matchStatus = statusFilter === 'all' || order.status === statusFilter
    const matchType = typeFilter === 'all' || order.type === typeFilter
    const matchUrgency = urgencyFilter === 'all' || order.urgency === urgencyFilter
    return matchStatus && matchType && matchUrgency
  })

  const totalOrders = serviceOrders.length
  const pendingCount = serviceOrders.filter(o => o.status === 'pending').length
  const inProgressCount = serviceOrders.filter(o => o.status === 'in_progress').length
  const completedThisMonth = serviceOrders.filter(o => {
    if (o.status !== 'completed' || !o.completedAt) return false
    const d = new Date(o.completedAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">居家服务工单管理</h1>
        <p className="text-slate-500 mt-1">管理居家养老服务工单的分配、执行与跟踪</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总工单数"
          value={totalOrders}
          icon={<ClipboardList className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="待分配"
          value={pendingCount}
          icon={<Clock className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          title="进行中"
          value={inProgressCount}
          icon={<AlertCircle className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="本月完成"
          value={completedThisMonth}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="assigned">已分配</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部类型</option>
            <option value="bathing">助浴</option>
            <option value="meal_delivery">送餐</option>
            <option value="medical_escort">陪医</option>
            <option value="cleaning">保洁</option>
            <option value="companionship">陪伴</option>
            <option value="rehabilitation">康复</option>
          </select>
          <select
            value={urgencyFilter}
            onChange={e => setUrgencyFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部紧急度</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="critical">紧急</option>
          </select>
          <span className="ml-auto text-sm text-slate-500">
            共 <strong className="text-slate-800">{filtered.length}</strong> 条工单
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-slate-500 font-medium">工单号</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">老人</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">服务类型</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">服务人员</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">资质编号</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">预约时间</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">紧急度</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">状态</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-800">{order.id}</td>
                  <td className="py-3 px-4 text-slate-800">{order.elderName}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                      {typeMap[order.type]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-800">{order.serviceProviderName}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">{order.serviceProviderCert}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {new Date(order.scheduledTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4"><UrgencyBadge urgency={order.urgency} /></td>
                  <td className="py-3 px-4"><StatusBadge status={order.status} type="order" /></td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium hover:underline"
                    >
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400">暂无匹配的工单</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  )
}
