import { useMemo, useState } from 'react'
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Shield,
  ShieldCheck,
  History,
  Building2,
  ArrowRightLeft,
  Receipt,
  FileText,
  Home,
  Banknote,
  Eye,
  ClipboardList,
} from 'lucide-react'
import { PageHeader } from '../components/ui/Breadcrumb'
import { StatCard } from '../components/ui/StatCard'
import { Section } from '../components/ui/Section'
import { DataTable } from '../components/ui/DataTable'
import { Tag } from '../components/ui/Tag'
import { mockSettlementFlows, mockReconciliations } from '../data/mock'
import { formatCurrency, formatDateTime, cn } from '../utils'
import type { SettlementFlow, MonthlyReconciliation, SettlementItemType } from '../types'

type TabKey = 'flows' | 'reconciliations'

const settlementItemColorMap: Record<SettlementItemType, string> = {
  freight: 'bg-indigo-500/15 text-indigo-400',
  insurance: 'bg-blue-500/15 text-blue-400',
  toll: 'bg-amber-500/15 text-amber-400',
  fuel: 'bg-orange-500/15 text-orange-400',
  loading: 'bg-purple-500/15 text-purple-400',
  other: 'bg-gray-500/15 text-gray-400',
}

const settlementStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' => {
  switch (status) {
    case 'paid':
      return 'success'
    case 'confirmed':
      return 'info'
    case 'invoiced':
      return 'primary'
    case 'pending':
      return 'warning'
    case 'disputed':
      return 'danger'
    default:
      return 'default'
  }
}

const reconciliationStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' => {
  switch (status) {
    case 'reconciled':
      return 'success'
    case 'confirmed':
      return 'info'
    case 'pending_confirmation':
      return 'warning'
    case 'disputed':
      return 'danger'
    case 'draft':
      return 'default'
    default:
      return 'default'
  }
}

export default function Settlement() {
  const [activeTab, setActiveTab] = useState<TabKey>('flows')
  const [showAuditTrail, setShowAuditTrail] = useState<string | null>(null)

  const stats = useMemo(() => {
    const totalAmount = mockSettlementFlows.reduce((sum, f) => sum + f.totalAmount, 0)
    const pendingAmount = mockSettlementFlows
      .filter((f) => f.status === 'pending' || f.status === 'confirmed')
      .reduce((sum, f) => sum + f.totalAmount, 0)
    const paidAmount = mockSettlementFlows
      .filter((f) => f.status === 'paid')
      .reduce((sum, f) => sum + f.totalAmount, 0)
    const disputedAmount = mockSettlementFlows
      .filter((f) => f.status === 'disputed')
      .reduce((sum, f) => sum + f.totalAmount, 0)
    return { totalAmount, pendingAmount, paidAmount, disputedAmount }
  }, [])

  const tabs: { key: TabKey; label: string; icon: typeof Wallet; count: number }[] = [
    { key: 'flows', label: '结算流水', icon: ArrowRightLeft, count: mockSettlementFlows.length },
    { key: 'reconciliations', label: '月度对账', icon: ClipboardList, count: mockReconciliations.length },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="对账中心"
        subtitle="资金流隔离管理，零负债模型保障交易安全"
        breadcrumbs={[
          { label: '工作台', icon: Home },
          { label: '对账中心', icon: Wallet },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-medium text-emerald-400">零负债模型运行中</span>
            </div>
            <button className="btn-ghost">导出报表</button>
            <button className="btn-primary flex items-center gap-1.5">
              <Banknote className="h-4 w-4" />
              发起结算
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="本月交易额"
          value={formatCurrency(stats.totalAmount)}
          trend={
            <span className="flex items-center gap-1 text-emerald-400">
              <Shield className="h-3 w-3" /> 资金全额隔离监管
            </span>
          }
          icon={<Wallet className="h-5 w-5" />}
          iconColor="bg-primary-500/15 text-primary-400"
        />
        <StatCard
          label="待确认金额"
          value={formatCurrency(stats.pendingAmount)}
          trend={
            <span className="flex items-center gap-1 text-amber-400">
              <Clock className="h-3 w-3" /> 等待双方确认
            </span>
          }
          icon={<Clock className="h-5 w-5" />}
          iconColor="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          label="已支付金额"
          value={formatCurrency(stats.paidAmount)}
          trend={
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> 已完成资金划转
            </span>
          }
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          label="争议金额"
          value={formatCurrency(stats.disputedAmount)}
          trend={
            <span className="flex items-center gap-1 text-red-400">
              <AlertTriangle className="h-3 w-3" /> 进入仲裁流程
            </span>
          }
          icon={<AlertTriangle className="h-5 w-5" />}
          iconColor="bg-red-500/15 text-red-400"
        />
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-logistics-border bg-logistics-bg/50 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-logistics-border/60 text-logistics-text shadow-inner'
                  : 'text-logistics-muted hover:text-logistics-text hover:bg-logistics-border/30'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-xs',
                  isActive ? 'bg-primary-500/20 text-primary-400' : 'bg-logistics-border/50 text-logistics-muted'
                )}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {activeTab === 'flows' && (
        <Section
          title="结算流水明细"
          subtitle="单笔订单级别的资金结算记录，支持审计追溯"
          actions={
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-logistics-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>所有流水均通过资金隔离账户结算</span>
              </div>
              <button className="btn-ghost">筛选</button>
            </div>
          }
        >
          <DataTable
            columns={[
              {
                key: 'flowNo',
                title: '流水号',
                width: '150px',
                render: (r) => {
                  const row = r as SettlementFlow
                  return (
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-primary-400">{row.flowNo}</span>
                      <span className="mt-0.5 text-[11px] text-logistics-muted">{formatDateTime(row.createdAt)}</span>
                    </div>
                  )
                },
              },
              {
                key: 'orderNo',
                title: '关联订单',
                width: '160px',
                render: (r) => {
                  const row = r as SettlementFlow
                  return row.orderNo ? (
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-logistics-text">{row.orderNo}</span>
                      <span className="text-[11px] text-logistics-muted">运输订单</span>
                    </div>
                  ) : (
                    <span className="text-xs text-logistics-muted">—</span>
                  )
                },
              },
              {
                key: 'parties',
                title: '付款方 / 收款方',
                width: '240px',
                render: (r) => {
                  const row = r as SettlementFlow
                  return (
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-logistics-muted" />
                          <span className="text-sm text-logistics-text truncate">{row.payerName}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <ArrowRightLeft className="h-3.5 w-3.5 text-primary-400" />
                          <span className="text-sm text-logistics-text truncate">{row.payeeName}</span>
                        </div>
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'items',
                title: '分项明细',
                width: '220px',
                render: (r) => {
                  const row = r as SettlementFlow
                  return (
                    <div className="flex flex-wrap gap-1.5">
                      {row.items.map((item) => (
                        <Tag
                          key={item.id}
                          className={cn(settlementItemColorMap[item.type], 'gap-1')}
                        >
                          <Receipt className="h-3 w-3" />
                          {item.typeLabel}
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                        </Tag>
                      ))}
                    </div>
                  )
                },
              },
              {
                key: 'amount',
                title: '总金额 / 税额 / 净额',
                width: '200px',
                align: 'right',
                render: (r) => {
                  const row = r as SettlementFlow
                  return (
                    <div className="text-right">
                      <div className="text-sm font-semibold text-logistics-text">{formatCurrency(row.totalAmount)}</div>
                      <div className="mt-0.5 text-[11px] text-logistics-muted">
                        税额 {formatCurrency(row.totalTax ?? 0)} · 净额 {formatCurrency(row.netAmount)}
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'status',
                title: '状态',
                width: '110px',
                align: 'center',
                render: (r) => {
                  const row = r as SettlementFlow
                  return (
                    <Tag variant={settlementStatusVariant(row.status)} dot>
                      {row.statusLabel}
                    </Tag>
                  )
                },
              },
              {
                key: 'fundIsolated',
                title: '资金隔离',
                width: '100px',
                align: 'center',
                render: (r) => {
                  const row = r as SettlementFlow
                  return row.fundIsolated ? (
                    <div className="flex items-center justify-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs text-emerald-400">已隔离</span>
                    </div>
                  ) : (
                    <span className="text-xs text-logistics-muted">—</span>
                  )
                },
              },
              {
                key: 'actions',
                title: '操作',
                width: '140px',
                align: 'right',
                render: (r) => {
                  const row = r as SettlementFlow
                  const isOpen = showAuditTrail === row.id
                  return (
                    <div className="flex items-center justify-end gap-1.5">
                      <button className="btn-ghost !px-2 !py-1 !text-xs">
                        <Eye className="h-3.5 w-3.5" />
                        详情
                      </button>
                      <button
                        onClick={() => setShowAuditTrail(isOpen ? null : row.id)}
                        className={cn(
                          'btn-ghost !px-2 !py-1 !text-xs',
                          isOpen && '!bg-primary-500/15 !text-primary-400'
                        )}
                      >
                        <History className="h-3.5 w-3.5" />
                        审计留痕
                      </button>
                    </div>
                  )
                },
              },
            ]}
            data={mockSettlementFlows}
            rowKey={(r) => (r as SettlementFlow).id}
            emptyText="暂无结算流水"
          />

          {mockSettlementFlows.map((flow) => (
            showAuditTrail === flow.id && (
              <div
                key={`audit-${flow.id}`}
                className="mt-4 rounded-lg border border-logistics-border bg-logistics-bg/60 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-primary-400" />
                    <span className="text-sm font-semibold text-logistics-text">
                      审计留痕 · {flow.flowNo}
                    </span>
                    <Tag variant="info" size="sm">
                      共 {flow.auditTrail.length} 条操作记录
                    </Tag>
                  </div>
                  <button
                    onClick={() => setShowAuditTrail(null)}
                    className="btn-ghost !px-2 !py-1 !text-xs"
                  >
                    收起
                  </button>
                </div>
                <div className="relative space-y-3 pl-6">
                  <div className="absolute left-2 top-1 h-full w-px bg-logistics-border" />
                  {flow.auditTrail.map((trail, idx) => (
                    <div key={trail.id} className="relative">
                      <div className={cn(
                        'absolute -left-4 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2',
                        idx === flow.auditTrail.length - 1
                          ? 'border-emerald-400 bg-emerald-400'
                          : 'border-logistics-border bg-logistics-bg'
                      )}>
                        {idx === flow.auditTrail.length - 1 && (
                          <div className="h-1.5 w-1.5 rounded-full bg-logistics-bg" />
                        )}
                      </div>
                      <div className="rounded-lg border border-logistics-border/60 bg-logistics-bg p-3">
                        <div className="flex items-center gap-2">
                          <Tag variant={idx === 0 ? 'primary' : 'info'} size="sm">
                            {trail.actionLabel}
                          </Tag>
                          <span className="text-xs text-logistics-muted">
                            {trail.operatorRole === 'system' ? (
                              <span className="flex items-center gap-1">
                                <Shield className="h-3 w-3 text-primary-400" />
                                系统自动
                              </span>
                            ) : (
                              <span>{trail.operatorName} ({trail.operatorRole === 'shipper' ? '货主' : '承运方'})</span>
                            )}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-logistics-text">{trail.detail}</p>
                        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-logistics-muted">
                          <span>IP: {trail.ipAddress}</span>
                          <span>·</span>
                          <span>{formatDateTime(trail.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </Section>
      )}

      {activeTab === 'reconciliations' && (
        <Section
          title="月度对账报表"
          subtitle="按月度汇总企业交易数据，支持一键导出与确认"
          actions={
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-logistics-muted">
                <FileText className="h-3.5 w-3.5 text-primary-400" />
                <span>每月 1 日自动生成上月份对账报表</span>
              </div>
              <button className="btn-ghost">重新生成</button>
            </div>
          }
        >
          <DataTable
            columns={[
              {
                key: 'period',
                title: '账期',
                width: '140px',
                render: (r) => {
                  const row = r as MonthlyReconciliation
                  return (
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/15 text-primary-400">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-logistics-text">{row.period}</div>
                        <div className="text-[11px] text-logistics-muted">月度结算周期</div>
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'partyName',
                title: '企业',
                width: '240px',
                render: (r) => {
                  const row = r as MonthlyReconciliation
                  return (
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-logistics-text">{row.partyName}</div>
                        <div className="text-xs text-logistics-muted">
                          {row.partyRole === 'shipper' ? '货主企业' : '承运方企业'}
                        </div>
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'totalOrders',
                title: '订单数',
                width: '120px',
                align: 'center',
                render: (r) => {
                  const row = r as MonthlyReconciliation
                  return (
                    <div className="text-center">
                      <div className="text-lg font-semibold text-logistics-text">{row.totalOrders}</div>
                      <div className="text-[11px] text-logistics-muted">笔交易</div>
                    </div>
                  )
                },
              },
              {
                key: 'amounts',
                title: '总额 / 已付 / 待付',
                width: '260px',
                align: 'right',
                render: (r) => {
                  const row = r as MonthlyReconciliation
                  const paidPercent = row.totalAmount > 0 ? (row.paidAmount / row.totalAmount) * 100 : 0
                  return (
                    <div className="text-right">
                      <div className="text-sm font-semibold text-logistics-text">{formatCurrency(row.totalAmount)}</div>
                      <div className="mt-1 flex items-center justify-end gap-2 text-[11px]">
                        <span className="text-emerald-400">已付 {formatCurrency(row.paidAmount)}</span>
                        <span className="text-logistics-muted">/</span>
                        <span className={row.outstandingAmount > 0 ? 'text-amber-400' : 'text-logistics-muted'}>
                          待付 {formatCurrency(row.outstandingAmount)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-logistics-border">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                          style={{ width: `${paidPercent}%` }}
                        />
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'status',
                title: '状态',
                width: '120px',
                align: 'center',
                render: (r) => {
                  const row = r as MonthlyReconciliation
                  return (
                    <Tag variant={reconciliationStatusVariant(row.status)} dot>
                      {row.statusLabel}
                    </Tag>
                  )
                },
              },
              {
                key: 'generatedAt',
                title: '生成时间',
                width: '160px',
                render: (r) => {
                  const row = r as MonthlyReconciliation
                  return (
                    <div>
                      <div className="text-sm text-logistics-text">{formatDateTime(row.generatedAt)}</div>
                      {row.confirmedAt && (
                        <div className="mt-0.5 text-[11px] text-emerald-400">
                          确认于 {formatDateTime(row.confirmedAt)}
                        </div>
                      )}
                    </div>
                  )
                },
              },
              {
                key: 'actions',
                title: '操作',
                width: '160px',
                align: 'right',
                render: (r) => {
                  const row = r as MonthlyReconciliation
                  return (
                    <div className="flex items-center justify-end gap-1.5">
                      <button className="btn-ghost !px-2 !py-1 !text-xs">
                        <Eye className="h-3.5 w-3.5" />
                        查看明细
                      </button>
                      {row.status === 'pending_confirmation' && (
                        <button className="btn-primary !px-2 !py-1 !text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          确认对账
                        </button>
                      )}
                    </div>
                  )
                },
              },
            ]}
            data={mockReconciliations}
            rowKey={(r) => (r as MonthlyReconciliation).id}
            emptyText="暂无月度对账报表"
          />
        </Section>
      )}

      <div className="rounded-lg border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-primary-500/5 to-cyan-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-logistics-text">零负债资金安全模型</span>
              <Tag variant="success" size="sm">
                银行级监管
              </Tag>
            </div>
            <p className="mt-1 text-xs text-logistics-muted leading-relaxed">
              平台采用第三方支付机构资金隔离监管，所有交易资金均存放于专用监管账户，与平台自有资金完全物理隔离。
              结算须经货主与承运双方确认后自动触发分账，全程审计留痕可追溯，杜绝任何资金挪用与垫付风险。
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-logistics-muted">资金物理隔离</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-logistics-muted">双方确认后分账</span>
              </div>
              <div className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-primary-400" />
                <span className="text-logistics-muted">全链路审计追溯</span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-logistics-muted">争议仲裁保障</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
