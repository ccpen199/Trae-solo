import { useMemo, useState } from 'react'
import {
  Package,
  Search,
  Truck,
  Clock,
  CheckCircle2,
  Eye,
  Route,
  Home,
  ListOrdered,
} from 'lucide-react'
import { PageHeader } from '../components/ui/Breadcrumb'
import { StatCard } from '../components/ui/StatCard'
import { Section } from '../components/ui/Section'
import { DataTable } from '../components/ui/DataTable'
import { Tag } from '../components/ui/Tag'
import { mockOrders } from '../data/mock'
import { formatCurrency, formatWeight, statusColor, cn } from '../utils'
import type { TransportOrder } from '../types'

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cargoTypeFilter, setCargoTypeFilter] = useState<string>('all')
  const [keyword, setKeyword] = useState<string>('')

  const stats = useMemo(() => {
    const total = mockOrders.length
    const pending = mockOrders.filter((o) => o.status === 'published' || o.status === 'pending').length
    const inTransit = mockOrders.filter((o) => o.status === 'in_transit').length
    const completed = mockOrders.filter((o) => o.status === 'completed').length
    return { total, pending, inTransit, completed }
  }, [])

  const filteredOrders = useMemo(() => {
    return mockOrders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false
      if (cargoTypeFilter !== 'all' && order.cargoType !== cargoTypeFilter) return false
      if (keyword) {
        const kw = keyword.toLowerCase()
        const matchNo = order.orderNo.toLowerCase().includes(kw)
        const matchOrigin = order.originCity.toLowerCase().includes(kw)
        const matchDest = order.destCity.toLowerCase().includes(kw)
        const matchCargo = order.cargo.name.toLowerCase().includes(kw)
        if (!matchNo && !matchOrigin && !matchDest && !matchCargo) return false
      }
      return true
    })
  }, [statusFilter, cargoTypeFilter, keyword])

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: '待发布' },
    { value: 'published', label: '待匹配' },
    { value: 'matched', label: '已匹配' },
    { value: 'in_transit', label: '运输中' },
    { value: 'delivered', label: '已送达' },
    { value: 'completed', label: '已完成' },
    { value: 'exception', label: '异常' },
    { value: 'cancelled', label: '已取消' },
  ]

  const cargoTypeOptions = [
    { value: 'all', label: '全部货类' },
    { value: 'general', label: '普通货物' },
    { value: 'refrigerated', label: '冷藏货物' },
    { value: 'hazardous', label: '危险品' },
    { value: 'container', label: '集装箱' },
    { value: 'bulk', label: '散货' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="运输订单管理"
        subtitle="查看和管理所有运输订单的全生命周期"
        breadcrumbs={[
          { label: '工作台', icon: Home },
          { label: '订单管理', icon: ListOrdered },
        ]}
        actions={
          <button className="btn-primary flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            新建订单
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="总订单数"
          value={stats.total}
          trend={<span className="text-logistics-muted">全部运输订单</span>}
          icon={<Package className="h-5 w-5" />}
          iconColor="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          label="待匹配"
          value={stats.pending}
          trend={<span className="text-logistics-muted">等待运力匹配</span>}
          icon={<Clock className="h-5 w-5" />}
          iconColor="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          label="运输中"
          value={stats.inTransit}
          trend={<span className="text-logistics-muted">车辆在途运输</span>}
          icon={<Truck className="h-5 w-5" />}
          iconColor="bg-indigo-500/15 text-indigo-400"
        />
        <StatCard
          label="已完成"
          value={stats.completed}
          trend={<span className="text-logistics-muted">成功交付订单</span>}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="bg-emerald-500/15 text-emerald-400"
        />
      </div>

      <Section
        title="订单列表"
        subtitle={`共 ${filteredOrders.length} 条订单记录`}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-ghost">导出</button>
            <button className="btn-ghost">批量操作</button>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-logistics-muted" />
            <input
              type="text"
              placeholder="搜索订单号、城市、货物..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input pl-9 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-36"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={cargoTypeFilter}
            onChange={(e) => setCargoTypeFilter(e.target.value)}
            className="input w-36"
          >
            {cargoTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {(statusFilter !== 'all' || cargoTypeFilter !== 'all' || keyword) && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setCargoTypeFilter('all')
                setKeyword('')
              }}
              className="btn-ghost text-xs"
            >
              重置筛选
            </button>
          )}
        </div>

        <DataTable
          columns={[
            {
              key: 'orderNo',
              title: '订单号',
              width: '180px',
              render: (r) => {
                const order = r as TransportOrder
                return (
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-primary-400">{order.orderNo}</span>
                    <span className="mt-0.5 text-[11px] text-logistics-muted">
                      {order.createdAt}
                    </span>
                  </div>
                )
              },
            },
            {
              key: 'route',
              title: '路线',
              width: '200px',
              render: (r) => {
                const order = r as TransportOrder
                return (
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 shrink-0 text-logistics-muted" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-logistics-text">{order.originCity}</span>
                        <span className="text-logistics-muted">→</span>
                        <span className="text-logistics-text">{order.destCity}</span>
                      </div>
                      <span className="text-[11px] text-logistics-muted">
                        {order.distanceKm} km
                      </span>
                    </div>
                  </div>
                )
              },
            },
            {
              key: 'cargo',
              title: '货物属性',
              render: (r) => {
                const order = r as TransportOrder
                return (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-logistics-text">{order.cargo.name}</span>
                      {order.isUrgent && (
                        <Tag variant="danger" size="sm">
                          加急
                        </Tag>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-logistics-muted">
                      <Tag className={cn(statusColor(order.cargoType === 'general' ? 'approved' : order.cargoType))}>
                        {order.cargoTypeLabel}
                      </Tag>
                      <span>{formatWeight(order.cargo.weight)}</span>
                      <span>·</span>
                      <span>{order.cargo.volume} m³</span>
                      <span>·</span>
                      <span>
                        {order.cargo.quantity} {order.cargo.unit}
                      </span>
                    </div>
                  </div>
                )
              },
            },
            {
              key: 'time',
              title: '时效',
              width: '160px',
              render: (r) => {
                const order = r as TransportOrder
                return (
                  <div className="flex flex-col text-xs">
                    <div className="flex items-center gap-1 text-logistics-muted">
                      <Clock className="h-3 w-3" />
                      <span>提货: {order.timeRequirement.pickupStart}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-logistics-muted">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>截止: {order.timeRequirement.deliveryDeadline}</span>
                    </div>
                  </div>
                )
              },
            },
            {
              key: 'budget',
              title: '预算',
              width: '120px',
              align: 'right',
              render: (r) => {
                const order = r as TransportOrder
                return (
                  <span className="font-medium text-logistics-text">
                    {formatCurrency(order.budget)}
                  </span>
                )
              },
            },
            {
              key: 'status',
              title: '状态',
              width: '100px',
              align: 'center',
              render: (r) => {
                const order = r as TransportOrder
                return (
                  <Tag className={statusColor(order.status)} dot>
                    {order.statusLabel}
                  </Tag>
                )
              },
            },
            {
              key: 'actions',
              title: '操作',
              width: '140px',
              align: 'right',
              render: () => (
                <div className="flex items-center justify-end gap-1">
                  <button className="btn-ghost !px-2 !py-1 text-xs">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button className="btn-ghost !px-2 !py-1 text-xs">编辑</button>
                  <button className="btn-primary !px-2.5 !py-1 text-xs">详情</button>
                </div>
              ),
            },
          ]}
          data={filteredOrders}
          rowKey={(r) => (r as TransportOrder).id}
          emptyText="暂无符合条件的订单"
        />
      </Section>
    </div>
  )
}
