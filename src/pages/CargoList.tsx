import { useAppStore } from '@/store'
import {
  Plus,
  Search,
  Filter,
  Download,
  Settings2,
  MoreHorizontal,
  Eye,
  Link2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Truck,
  ChevronRight,
  Package,
  Thermometer,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CargoOrder } from '@/types'
import { useState } from 'react'

const statusConfig: Record<CargoOrder['status'], { label: string; className: string; icon: any }> = {
  draft: { label: '草稿', className: 'bg-slate2-100 text-slate2-500', icon: FileText },
  published: { label: '已发布', className: 'bg-primary-50 text-primary-600', icon: FileText },
  bidding: { label: '投标中', className: 'bg-amber-50 text-amber-600', icon: RefreshCw },
  assigned: { label: '已指派', className: 'bg-blue-50 text-blue-600', icon: Truck },
  in_transit: { label: '运输中', className: 'bg-success-50 text-success-600', icon: Truck },
  delivered: { label: '已签收', className: 'bg-violet-50 text-violet-600', icon: CheckCircle2 },
  completed: { label: '已完成', className: 'bg-success-50 text-success-700 font-bold', icon: CheckCircle2 },
  cancelled: { label: '已取消', className: 'bg-slate2-100 text-slate2-400', icon: AlertCircle },
  exception: { label: '异常', className: 'bg-accent-50 text-accent-600', icon: AlertTriangle },
}

export default function CargoList() {
  const { cargoOrders, updateCargoOrderStatus } = useAppStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'weight' | 'deliveryTime'>('createdAt')

  const filteredOrders = cargoOrders
    .filter((o) => {
      if (search && !o.orderNo.includes(search) && !o.cargoName.includes(search) && !o.enterpriseName.includes(search)) return false
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'weight') return b.weight - a.weight
      return new Date(a.deliveryTime).getTime() - new Date(b.deliveryTime).getTime()
    })

  return (
    <div className="space-y-6">
      {/* 统计条 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries({
          all: { label: '全部订单', count: cargoOrders.length, color: 'primary' },
          draft: { label: '草稿', count: cargoOrders.filter((o) => o.status === 'draft').length, color: 'slate2' },
          published: { label: '已发布', count: cargoOrders.filter((o) => o.status === 'published').length, color: 'primary' },
          bidding: { label: '投标中', count: cargoOrders.filter((o) => o.status === 'bidding').length, color: 'amber' },
          assigned: { label: '已指派', count: cargoOrders.filter((o) => o.status === 'assigned').length, color: 'blue' },
          in_transit: { label: '运输中', count: cargoOrders.filter((o) => o.status === 'in_transit').length, color: 'success' },
          delivered: { label: '已签收', count: cargoOrders.filter((o) => o.status === 'delivered' || o.status === 'completed').length, color: 'violet' },
          cancelled: { label: '已取消', count: cargoOrders.filter((o) => o.status === 'cancelled').length, color: 'slate2' },
        }).map(([key, info]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`p-3 rounded-xl border text-left transition-all-smooth ${
              statusFilter === key
                ? `bg-${info.color}-50 border-${info.color}-200 shadow-sm`
                : 'bg-white border-slate2-100 hover:border-slate2-200 hover:shadow-sm'
            }`}
          >
            <div className="text-[11px] text-slate2-500 mb-1">{info.label}</div>
            <div className={`text-2xl font-extrabold font-mono ${statusFilter === key ? `text-${info.color}-600` : 'text-slate2-700'}`}>
              {info.count}
            </div>
          </button>
        ))}
      </div>

      {/* 筛选工具栏 */}
      <div className="card-base p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate2-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索订单号 / 货物名称 / 企业名称"
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate2-50 border border-transparent text-sm focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-50 transition-all-smooth"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate2-50 border border-slate2-100 text-xs text-slate2-600">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="createdAt">按创建时间</option>
              <option value="weight">按货物重量</option>
              <option value="deliveryTime">按交付时间</option>
            </select>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate2-100 text-xs text-slate2-600 hover:bg-slate2-50 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            高级筛选
          </button>

          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate2-100 text-xs text-slate2-600 hover:bg-slate2-50 transition-colors">
            <Download className="w-3.5 h-3.5" />
            导出
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/cargo/erp-config"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary-200 bg-primary-50 text-primary-600 text-sm font-medium hover:bg-primary-100 transition-colors"
          >
            <Link2 className="w-4 h-4" />
            ERP对接
          </Link>
          <Link
            to="/cargo/publish"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all-smooth"
          >
            <Plus className="w-4 h-4" />
            发布货源
          </Link>
        </div>
      </div>

      {/* 订单表格 */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate2-50 border-b border-slate2-100">
              <tr>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">订单信息</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">货物信息</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">运输路线</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">时间</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">承运方</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">状态</th>
                <th className="text-right px-5 py-3.5 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate2-50">
              {filteredOrders.map((order) => {
                const status = statusConfig[order.status]
                const StatusIcon = status.icon
                return (
                  <tr key={order.id} className="hover:bg-slate2-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-primary-500" />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-sm text-slate2-800">{order.orderNo}</div>
                          <div className="text-[11px] text-slate2-400 mt-0.5 flex items-center gap-1.5">
                            <span>{order.enterpriseName}</span>
                            {order.erpOrderNo && (
                              <>
                                <span className="text-slate2-200">|</span>
                                <span className="text-success-600 font-mono flex items-center gap-0.5">
                                  <Link2 className="w-3 h-3" />
                                  {order.erpOrderNo}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-sm text-slate2-800">{order.cargoName}</div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate2-500">
                        <span>{order.weight.toFixed(0)} 吨</span>
                        <span>{order.volume.toFixed(1)} m³</span>
                        <span>{order.quantity} 件</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {order.temperatureRequired && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                            <Thermometer className="w-3 h-3" />
                            {order.temperatureRequired.min}~{order.temperatureRequired.max}{order.temperatureRequired.unit}
                          </span>
                        )}
                        {order.declaredValue > 1000000 && (
                          <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-accent-50 text-accent-600">
                            高价值 ¥{(order.declaredValue / 10000).toFixed(0)}万
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col text-[11px] leading-relaxed">
                          <div>
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-success-500 mr-1.5 align-middle" />
                            <span className="text-slate2-600 font-medium">{order.origin.city}</span>
                          </div>
                          <div>
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-500 mr-1.5 align-middle" />
                            <span className="text-slate2-600 font-medium">{order.destination.city}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate2-300" />
                      </div>
                    </td>

                    <td className="px-4 py-4 text-[11px]">
                      <div className="flex items-center gap-1 text-slate2-500 mb-0.5">
                        <Clock className="w-3 h-3" />
                        装货: {order.pickupTime.slice(5, 16)}
                      </div>
                      <div className="flex items-center gap-1 text-slate2-500">
                        <Clock className="w-3 h-3" />
                        送达: {order.deliveryTime.slice(5, 16)}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {order.assignedCapacity ? (
                        <div>
                          <div className="text-sm font-medium text-slate2-700 flex items-center gap-1.5">
                            {order.assignedCapacity.name}
                            <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${
                              order.assignedCapacity.level === 'gold' ? 'bg-amber-400 text-white' :
                              order.assignedCapacity.level === 'silver' ? 'bg-slate2-400 text-white' :
                              'bg-slate2-200 text-slate2-600'
                            }`}>
                              {order.assignedCapacity.level === 'gold' ? '金牌' : order.assignedCapacity.level === 'silver' ? '银牌' : '普通'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate2-400 mt-0.5">
                            {order.assignedCapacity.type === 'fleet' ? '车队承运' : '司机承运'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate2-400 italic">待匹配运力</div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${status.className}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/cargo/${order.id}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate2-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {order.status === 'published' && (
                          <button
                            onClick={() => updateCargoOrderStatus(order.id, 'assigned')}
                            className="text-[11px] px-2.5 py-1 rounded-md bg-success-50 text-success-600 font-medium hover:bg-success-100 transition-colors"
                          >
                            指派运力
                          </button>
                        )}
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate2-400 hover:bg-slate2-100 hover:text-slate2-600 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="py-20 text-center text-slate2-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">暂无匹配的订单数据</p>
          </div>
        )}
      </div>
    </div>
  )
}
