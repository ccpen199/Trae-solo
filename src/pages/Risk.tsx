import { useState } from 'react'
import {
  Shield,
  Gavel,
  AlertTriangle,
  FileWarning,
  Users,
  FileText,
  Eye,
  ShieldAlert,
  Scale,
  ShieldCheck,
  Clock,
} from 'lucide-react'
import { PageHeader } from '../components/ui/Breadcrumb'
import { StatCard } from '../components/ui/StatCard'
import { Section } from '../components/ui/Section'
import { DataTable } from '../components/ui/DataTable'
import { Tag } from '../components/ui/Tag'
import { Progress } from '../components/ui/Progress'
import { mockDisputes, mockCreditRecords, mockAlerts } from '../data/mock'
import { formatCurrency, formatDateTime, statusColor, creditRatingColor, cn } from '../utils'

type TabKey = 'disputes' | 'credit' | 'blacklist'

export default function Risk() {
  const [activeTab, setActiveTab] = useState<TabKey>('disputes')

  const inProgressDisputes = mockDisputes.filter(
    (d) => d.status === 'under_review' || d.status === 'evidence_required' || d.status === 'submitted'
  ).length
  const blacklistedCount = mockCreditRecords.filter((c) => c.isBlacklisted).length
  const avgCreditScore =
    mockCreditRecords.length > 0
      ? (mockCreditRecords.reduce((sum, c) => sum + c.score, 0) / mockCreditRecords.length).toFixed(1)
      : '0'
  const monthlyComplaints = mockAlerts.filter((a) => a.severity === 'high').length + 3

  const blacklistedRecords = mockCreditRecords.filter((c) => c.isBlacklisted)

  const tabs: { key: TabKey; label: string; icon: typeof Gavel }[] = [
    { key: 'disputes', label: '纠纷仲裁', icon: Gavel },
    { key: 'credit', label: '信用评级', icon: ShieldCheck },
    { key: 'blacklist', label: '黑名单', icon: ShieldAlert },
  ]

  const getScoreColor = (score: number): 'green' | 'primary' | 'yellow' | 'red' => {
    if (score >= 90) return 'green'
    if (score >= 75) return 'primary'
    if (score >= 60) return 'yellow'
    return 'red'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="风控中心"
        subtitle="纠纷仲裁、信用评级与黑名单管理"
        breadcrumbs={[
          { label: '风控中心', icon: Shield },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="进行中纠纷"
          value={inProgressDisputes}
          trend={
            <span className="flex items-center gap-1 text-amber-400">
              <Clock className="h-3 w-3" /> {mockDisputes.filter((d) => d.status === 'under_review').length} 项平台审核中
            </span>
          }
          icon={<Scale className="h-5 w-5" />}
          iconColor="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          label="黑名单企业"
          value={blacklistedCount}
          trend={
            <span className="flex items-center gap-1 text-red-400">
              <ShieldAlert className="h-3 w-3" /> 已禁止参与平台交易
            </span>
          }
          icon={<Users className="h-5 w-5" />}
          iconColor="bg-red-500/15 text-red-400"
        />
        <StatCard
          label="平均信用分"
          value={avgCreditScore}
          trend={
            <span className="flex items-center gap-1 text-green-400">
              <ShieldCheck className="h-3 w-3" /> 基于 {mockCreditRecords.length} 家企业评估
            </span>
          }
          icon={<Shield className="h-5 w-5" />}
          iconColor="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          label="本月投诉"
          value={monthlyComplaints}
          trend={
            <span className="flex items-center gap-1 text-yellow-400">
              <AlertTriangle className="h-3 w-3" /> 高风险 {mockAlerts.filter((a) => a.severity === 'high').length} 项
            </span>
          }
          icon={<FileWarning className="h-5 w-5" />}
          iconColor="bg-yellow-500/15 text-yellow-400"
        />
      </div>

      <div className="panel overflow-hidden">
        <div className="flex border-b border-logistics-border">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-b-2 border-primary-500 text-primary-400'
                    : 'text-logistics-muted hover:text-logistics-text hover:bg-logistics-border/20'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
        <div className="p-5">
          {activeTab === 'disputes' && (
            <DataTable
              columns={[
                {
                  key: 'caseNo',
                  title: '案件号',
                  render: (r) => <span className="font-mono text-xs text-primary-400">{r.caseNo as string}</span>,
                },
                {
                  key: 'orderNo',
                  title: '关联订单',
                  render: (r) => (
                    <span className={r.orderNo ? 'font-mono text-xs text-logistics-text' : 'text-logistics-muted'}>
                      {(r.orderNo as string) || '-'}
                    </span>
                  ),
                },
                {
                  key: 'parties',
                  title: '申请人 / 被申请人',
                  render: (r) => (
                    <div className="space-y-0.5 text-xs">
                      <div>
                        <span className="text-blue-400">申请:</span>{' '}
                        <span className="text-logistics-text">{r.applicantName as string}</span>
                      </div>
                      <div>
                        <span className="text-amber-400">被申:</span>{' '}
                        <span className="text-logistics-text">{r.respondentName as string}</span>
                      </div>
                    </div>
                  ),
                },
                { key: 'typeLabel', title: '类型', render: (r) => <Tag variant="info">{r.typeLabel as string}</Tag> },
                {
                  key: 'amountInvolved',
                  title: '涉诉金额',
                  align: 'right',
                  render: (r) => <span className="font-medium">{formatCurrency(r.amountInvolved as number)}</span>,
                },
                {
                  key: 'status',
                  title: '状态',
                  align: 'center',
                  render: (r) => <Tag className={statusColor(r.status as string)}>{r.statusLabel as string}</Tag>,
                },
                {
                  key: 'evidence',
                  title: '证据',
                  align: 'center',
                  render: (r) => {
                    const count = (r.evidence as unknown[]).length
                    return count > 0 ? (
                      <Tag variant="primary">{count} 份</Tag>
                    ) : (
                      <span className="text-logistics-muted text-xs">无</span>
                    )
                  },
                },
                {
                  key: 'arbitratorName',
                  title: '仲裁人',
                  render: (r) => (
                    <span className={r.arbitratorName ? 'text-logistics-text' : 'text-logistics-muted'}>
                      {(r.arbitratorName as string) || '待指派'}
                    </span>
                  ),
                },
                {
                  key: 'arbitrationResult',
                  title: '仲裁结果',
                  width: '200px',
                  render: (r) =>
                    r.arbitrationResult ? (
                      <span className="text-xs text-logistics-muted line-clamp-2">{r.arbitrationResult as string}</span>
                    ) : (
                      <span className="text-logistics-muted text-xs">待仲裁</span>
                    ),
                },
                {
                  key: 'actions',
                  title: '操作',
                  align: 'center',
                  render: () => (
                    <div className="flex items-center justify-center gap-1">
                      <button className="btn-ghost !px-2 !py-1 !text-xs flex items-center gap-1">
                        <Eye className="h-3 w-3" /> 查看
                      </button>
                      <button className="btn-primary !px-2 !py-1 !text-xs flex items-center gap-1">
                        <Gavel className="h-3 w-3" /> 处理
                      </button>
                    </div>
                  ),
                },
              ]}
              data={mockDisputes}
              rowKey={(r) => r.id as string}
            />
          )}

          {activeTab === 'credit' && (
            <DataTable
              columns={[
                {
                  key: 'partyName',
                  title: '企业',
                  render: (r) => (
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-logistics-border">
                        <FileText className="h-4 w-4 text-logistics-muted" />
                      </div>
                      <div>
                        <div className="font-medium text-logistics-text">{r.partyName as string}</div>
                        <div className="text-[11px] text-logistics-muted">
                          {(r.partyRole as string) === 'carrier' ? '承运方' : '货主方'}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'rating',
                  title: '评级',
                  align: 'center',
                  render: (r) => (
                    <span className={cn('text-lg font-bold', creditRatingColor(r.rating as string))}>
                      {r.rating as string}
                    </span>
                  ),
                },
                {
                  key: 'score',
                  title: '评分',
                  width: '180px',
                  render: (r) => (
                    <div className="space-y-1">
                      <Progress
                        value={r.score as number}
                        color={getScoreColor(r.score as number)}
                        size="sm"
                      />
                      <div className="text-right text-xs text-logistics-muted">{r.score as number} 分</div>
                    </div>
                  ),
                },
                {
                  key: 'onTimeDeliveryRate',
                  title: '准点率',
                  align: 'center',
                  render: (r) =>
                    (r.onTimeDeliveryRate as number) > 0 ? (
                      <span className="font-medium text-logistics-text">
                        {(r.onTimeDeliveryRate as number).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-logistics-muted text-xs">-</span>
                    ),
                },
                {
                  key: 'disputeCount',
                  title: '纠纷数',
                  align: 'center',
                  render: (r) => (
                    <span className={cn(
                      'font-medium',
                      (r.disputeCount as number) > 5 ? 'text-red-400' : (r.disputeCount as number) > 0 ? 'text-amber-400' : 'text-green-400'
                    )}>
                      {r.disputeCount as number}
                    </span>
                  ),
                },
                {
                  key: 'complaintCount',
                  title: '投诉数',
                  align: 'center',
                  render: (r) => (
                    <span className={cn(
                      'font-medium',
                      (r.complaintCount as number) > 3 ? 'text-red-400' : (r.complaintCount as number) > 0 ? 'text-amber-400' : 'text-green-400'
                    )}>
                      {r.complaintCount as number}
                    </span>
                  ),
                },
                {
                  key: 'totalOrders',
                  title: '订单总数',
                  align: 'right',
                  render: (r) => <span className="font-medium">{r.totalOrders as number}</span>,
                },
                {
                  key: 'lastEvaluatedAt',
                  title: '最后评估',
                  align: 'right',
                  render: (r) => (
                    <span className="text-xs text-logistics-muted">{formatDateTime(r.lastEvaluatedAt as string)}</span>
                  ),
                },
              ]}
              data={mockCreditRecords}
              rowKey={(r) => r.id as string}
            />
          )}

          {activeTab === 'blacklist' && (
            <DataTable
              columns={[
                {
                  key: 'partyName',
                  title: '企业',
                  render: (r) => (
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
                        <ShieldAlert className="h-4 w-4 text-red-400" />
                      </div>
                      <div>
                        <div className="font-medium text-logistics-text">{r.partyName as string}</div>
                        <div className="text-[11px] text-logistics-muted">
                          {(r.partyRole as string) === 'carrier' ? '承运方' : '货主方'}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'blacklistReason',
                  title: '加入原因',
                  width: '400px',
                  render: (r) => (
                    <div className="space-y-1">
                      <Tag variant="danger" dot>
                        严重违规
                      </Tag>
                      <p className="text-xs text-logistics-muted line-clamp-2">{r.blacklistReason as string}</p>
                    </div>
                  ),
                },
                {
                  key: 'blacklistedAt',
                  title: '加入时间',
                  align: 'right',
                  render: (r) => (
                    <span className="text-xs text-logistics-muted">{formatDateTime(r.blacklistedAt as string)}</span>
                  ),
                },
                {
                  key: 'actions',
                  title: '操作',
                  align: 'center',
                  render: () => (
                    <div className="flex items-center justify-center gap-1">
                      <button className="btn-ghost !px-2 !py-1 !text-xs flex items-center gap-1">
                        <Eye className="h-3 w-3" /> 详情
                      </button>
                      <button className="btn-primary !px-2 !py-1 !text-xs flex items-center gap-1">
                        <Shield className="h-3 w-3" /> 申诉
                      </button>
                    </div>
                  ),
                },
              ]}
              data={blacklistedRecords}
              rowKey={(r) => r.id as string}
              emptyText="暂无黑名单企业"
            />
          )}
        </div>
      </div>
    </div>
  )
}
