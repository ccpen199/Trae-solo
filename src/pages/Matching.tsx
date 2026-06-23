import {
  Zap,
  Search,
  CheckCircle2,
  Clock,
  Star,
  Truck,
  MapPin,
  DollarSign,
  Award,
  Box,
  ArrowRight,
  Home,
} from 'lucide-react'
import { PageHeader } from '../components/ui/Breadcrumb'
import { StatCard } from '../components/ui/StatCard'
import { Section } from '../components/ui/Section'
import { DataTable } from '../components/ui/DataTable'
import { Tag } from '../components/ui/Tag'
import { Progress } from '../components/ui/Progress'
import { mockMatchResults, mockOrders } from '../data/mock'
import { formatCurrency, formatDateTime, statusColor, cn } from '../utils'
import type { MatchResult, TransportOrder } from '../types'

function RingProgress({
  value,
  size = 80,
  strokeWidth = 8,
  color = '#6366f1',
}: {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e2d4a"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-logistics-text">{value.toFixed(1)}</span>
      </div>
    </div>
  )
}

export default function Matching() {
  const pendingOrders = mockOrders.filter((o) => o.status === 'published')
  const selectedOrder = pendingOrders[0]
  const selectedMatchResults = mockMatchResults.filter(
    (m) => m.orderId === selectedOrder?.id
  )

  const matchedToday = mockOrders.filter((o) => o.matchedAt?.startsWith('2026-06-21')).length
  const avgScore =
    mockMatchResults.reduce((sum, m) => sum + m.matchScore, 0) / (mockMatchResults.length || 1)
  const recommendRate =
    (mockMatchResults.filter((m) => m.isRecommended).length / (mockMatchResults.length || 1)) * 100

  return (
    <div className="space-y-6">
      <PageHeader
        title="智能匹配引擎"
        subtitle="基于 AI 算法的订单与运力智能匹配，自动推荐最优运输方案"
        breadcrumbs={[
          { label: '工作台', icon: Home },
          { label: '智能匹配' },
        ]}
        actions={
          <button className="btn-primary flex items-center gap-2">
            <Zap className="h-4 w-4" />
            启动批量匹配
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="待匹配订单"
          value={pendingOrders.length}
          trend={
            <span className="flex items-center gap-1 text-amber-400">
              <Clock className="h-3 w-3" /> 等待运力匹配
            </span>
          }
          icon={<Search className="h-5 w-5" />}
          iconColor="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          label="今日匹配成功"
          value={matchedToday}
          trend={
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="h-3 w-3" /> 自动匹配完成
            </span>
          }
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          label="平均匹配得分"
          value={avgScore.toFixed(1)}
          trend={
            <span className="flex items-center gap-1 text-primary-400">
              <Award className="h-3 w-3" /> 综合评分
            </span>
          }
          icon={<Award className="h-5 w-5" />}
          iconColor="bg-purple-500/15 text-purple-400"
        />
        <StatCard
          label="方案推荐率"
          value={`${recommendRate.toFixed(0)}%`}
          trend={
            <span className="flex items-center gap-1 text-cyan-400">
              <Star className="h-3 w-3" /> 优质方案占比
            </span>
          }
          icon={<Star className="h-5 w-5" />}
          iconColor="bg-amber-500/15 text-amber-400"
        />
      </div>

      <Section
        title="待匹配订单列表"
        subtitle={`共 ${pendingOrders.length} 条订单等待智能匹配运力资源`}
        actions={
          <button className="btn-ghost flex items-center gap-1">
            <ArrowRight className="h-4 w-4" /> 查看全部
          </button>
        }
      >
        <DataTable
          compact
          columns={[
            {
              key: 'orderNo',
              title: '订单编号',
              render: (r) => (
                <span className="font-mono text-xs text-primary-400">
                  {r.orderNo as string}
                </span>
              ),
            },
            {
              key: 'route',
              title: '运输路线',
              render: (r) => (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-logistics-muted" />
                  <span>
                    {r.originCity as string} → {r.destCity as string}
                  </span>
                  <span className="text-xs text-logistics-muted">
                    ({(r as TransportOrder).distanceKm}km)
                  </span>
                </div>
              ),
            },
            {
              key: 'cargo',
              title: '货物信息',
              render: (r) => {
                const cargo = (r as TransportOrder).cargo
                return (
                  <div className="flex flex-col">
                    <span className="text-sm">{cargo.name}</span>
                    <span className="text-xs text-logistics-muted">
                      <Box className="mr-1 inline h-3 w-3" />
                      {cargo.weight / 1000}吨 · {cargo.volume}m³ · {cargo.quantity}
                      {cargo.unit}
                    </span>
                  </div>
                )
              },
            },
            {
              key: 'cargoType',
              title: '货物类型',
              align: 'center',
              render: (r) => (
                <Tag variant={r.cargoType === 'refrigerated' ? 'primary' : r.cargoType === 'hazardous' ? 'danger' : 'default'}>
                  {r.cargoTypeLabel as string}
                </Tag>
              ),
            },
            {
              key: 'budget',
              title: '预算金额',
              align: 'right',
              render: (r) => (
                <span className="font-medium">{formatCurrency(r.budget as number)}</span>
              ),
            },
            {
              key: 'deadline',
              title: '时效要求',
              render: (r) => {
                const req = (r as TransportOrder).timeRequirement
                return (
                  <div className="flex flex-col">
                    <span className="text-xs">
                      提货: {req.pickupStart.slice(5)} ~ {req.pickupEnd.slice(11)}
                    </span>
                    <span className="text-xs text-logistics-muted">
                      送达: {req.deliveryDeadline.slice(5)}
                    </span>
                  </div>
                )
              },
            },
            {
              key: 'status',
              title: '状态',
              align: 'center',
              render: (r) => (
                <Tag className={statusColor(r.status as string)}>
                  {(r as TransportOrder).isUrgent ? '🔥 ' : ''}
                  {r.statusLabel as string}
                </Tag>
              ),
            },
            {
              key: 'action',
              title: '操作',
              align: 'center',
              render: () => (
                <button className="btn-primary !px-3 !py-1 !text-xs">
                  智能匹配
                </button>
              ),
            },
          ]}
          data={pendingOrders}
        />
      </Section>

      <Section
        title={`匹配结果排名 - ${selectedOrder?.orderNo || ''}`}
        subtitle={
          selectedOrder
            ? `${selectedOrder.originCity} → ${selectedOrder.destCity} · ${selectedOrder.cargo.name} · 预算 ${formatCurrency(selectedOrder.budget)}`
            : ''
        }
        actions={
          <div className="flex items-center gap-2 text-xs text-logistics-muted">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> 推荐方案
            </span>
          </div>
        }
      >
        <div className="space-y-4">
          {selectedMatchResults
            .sort((a, b) => b.matchScore - a.matchScore)
            .map((result: MatchResult, idx) => {
              const scoreColor =
                result.matchScore >= 90
                  ? '#10b981'
                  : result.matchScore >= 80
                  ? '#6366f1'
                  : result.matchScore >= 70
                  ? '#f59e0b'
                  : '#ef4444'
              const budget = selectedOrder?.budget || 0
              const costDiff = budget - result.estimatedCost
              const costSaving = costDiff > 0

              return (
                <div
                  key={result.resourceId}
                  className={cn(
                    'rounded-xl border p-5 transition-all',
                    result.isRecommended
                      ? 'border-primary-500/40 bg-primary-500/5'
                      : 'border-logistics-border bg-logistics-bg/30 hover:border-logistics-border/80'
                  )}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                            idx === 0
                              ? 'bg-amber-500 text-white'
                              : idx === 1
                              ? 'bg-slate-400 text-white'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-logistics-border text-logistics-muted'
                          )}
                        >
                          {idx + 1}
                        </div>
                        {result.isRecommended && (
                          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-logistics-dark">
                            <Star className="h-3 w-3 fill-logistics-dark" />
                          </div>
                        )}
                      </div>
                      <RingProgress
                        value={result.matchScore}
                        size={80}
                        strokeWidth={7}
                        color={scoreColor}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-logistics-muted" />
                          <span className="font-semibold text-logistics-text">
                            {result.plateNo}
                          </span>
                        </div>
                        <span className="text-logistics-muted">·</span>
                        <span className="text-sm text-logistics-muted">
                          {result.carrierName}
                        </span>
                        {result.isRecommended && (
                          <Tag variant="primary" size="sm">
                            <Star className="h-3 w-3 fill-primary-400" /> 推荐
                          </Tag>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {result.reasonLabels.map((label, i) => (
                          <Tag key={i} variant="info" size="sm">
                            {label}
                          </Tag>
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="text-logistics-muted flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> 路线重合度
                            </span>
                            <span className="font-medium text-logistics-text">
                              {result.routeOverlap}%
                            </span>
                          </div>
                          <Progress
                            value={result.routeOverlap}
                            color={result.routeOverlap >= 85 ? 'green' : result.routeOverlap >= 70 ? 'primary' : 'yellow'}
                            size="sm"
                          />
                        </div>

                        <div>
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="text-logistics-muted flex items-center gap-1">
                              <Award className="h-3 w-3" /> 履约评分
                            </span>
                            <span className="font-medium text-logistics-text">
                              {result.performanceScore}
                            </span>
                          </div>
                          <Progress
                            value={result.performanceScore}
                            color={result.performanceScore >= 95 ? 'green' : result.performanceScore >= 90 ? 'primary' : 'yellow'}
                            size="sm"
                          />
                        </div>

                        <div>
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="text-logistics-muted flex items-center gap-1">
                              <Box className="h-3 w-3" /> 装载率预测
                            </span>
                            <span className="font-medium text-logistics-text">
                              {result.loadPrediction}%
                            </span>
                          </div>
                          <Progress
                            value={result.loadPrediction}
                            color={result.loadPrediction >= 90 ? 'green' : result.loadPrediction >= 70 ? 'primary' : 'yellow'}
                            size="sm"
                          />
                        </div>

                        <div>
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="text-logistics-muted flex items-center gap-1">
                              <DollarSign className="h-3 w-3" /> 预估费用
                            </span>
                            <span
                              className={cn(
                                'font-medium',
                                costSaving ? 'text-green-400' : 'text-red-400'
                              )}
                            >
                              {formatCurrency(result.estimatedCost)}
                            </span>
                          </div>
                          <div className="text-[11px] text-logistics-muted">
                            {costSaving
                              ? `较预算节省 ${formatCurrency(costDiff)}`
                              : `超预算 ${formatCurrency(Math.abs(costDiff))}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 lg:items-end">
                      <button className="btn-primary">确认匹配</button>
                      <button className="btn-ghost">查看详情</button>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </Section>
    </div>
  )
}
