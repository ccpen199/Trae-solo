import { useMemo, useState } from 'react'
import {
  FileText,
  FileSignature,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
  Home,
  FileCheck,
  Eye,
} from 'lucide-react'
import { PageHeader } from '../components/ui/Breadcrumb'
import { StatCard } from '../components/ui/StatCard'
import { Section } from '../components/ui/Section'
import { DataTable } from '../components/ui/DataTable'
import { Tag } from '../components/ui/Tag'
import { mockContracts, mockWaybills, mockContractTemplates } from '../data/mock'
import { formatCurrency, formatDate, statusColor, cn } from '../utils'
import type { ContractTemplate, ElectronicContract, PaperlessWaybill } from '../types'

type TabKey = 'templates' | 'contracts' | 'waybills'

export default function Contracts() {
  const [activeTab, setActiveTab] = useState<TabKey>('templates')

  const stats = useMemo(() => {
    const templates = mockContractTemplates.length
    const signed = mockContracts.filter((c) => c.status === 'signed').length
    const pending = mockContracts.filter((c) => c.status === 'pending_sign').length
    const waybills = mockWaybills.length
    return { templates, signed, pending, waybills }
  }, [])

  const tabs: { key: TabKey; label: string; icon: typeof FileText }[] = [
    { key: 'templates', label: '合同模板', icon: FileText },
    { key: 'contracts', label: '电子合同', icon: FileSignature },
    { key: 'waybills', label: '无纸化运单', icon: Truck },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="合同与无纸化运单管理"
        subtitle="管理合同模板、电子合同签署及国标无纸化运单"
        breadcrumbs={[
          { label: '工作台', icon: Home },
          { label: '合同与运单', icon: FileCheck },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="合同模板数"
          value={stats.templates}
          trend={<span className="text-logistics-muted">标准合同模板库</span>}
          icon={<FileText className="h-5 w-5" />}
          iconColor="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          label="已签署合同"
          value={stats.signed}
          trend={<span className="text-logistics-muted">三方电子签章完成</span>}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          label="待签署合同"
          value={stats.pending}
          trend={<span className="text-logistics-muted">等待各方签章确认</span>}
          icon={<Clock className="h-5 w-5" />}
          iconColor="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          label="无纸化运单"
          value={stats.waybills}
          trend={<span className="text-logistics-muted">GB/T 38658-2020 标准</span>}
          icon={<Truck className="h-5 w-5" />}
          iconColor="bg-indigo-500/15 text-indigo-400"
        />
      </div>

      <Section
        title={tabs.find((t) => t.key === activeTab)?.label || ''}
        subtitle={
          activeTab === 'templates'
            ? `共 ${mockContractTemplates.length} 套标准合同模板`
            : activeTab === 'contracts'
            ? `共 ${mockContracts.length} 份电子合同`
            : `共 ${mockWaybills.length} 份无纸化运单`
        }
      >
        <div className="mb-4 flex flex-wrap gap-2 border-b border-logistics-border pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-logistics-muted hover:bg-logistics-border/50 hover:text-logistics-text'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'templates' && (
          <DataTable
            columns={[
              {
                key: 'templateName',
                title: '模板名称',
                width: '200px',
                render: (r) => {
                  const tpl = r as ContractTemplate
                  return (
                    <div className="flex flex-col">
                      <span className="font-medium text-logistics-text">{tpl.templateName}</span>
                      <span className="mt-0.5 text-[11px] text-logistics-muted">{tpl.createdBy}</span>
                    </div>
                  )
                },
              },
              {
                key: 'templateCode',
                title: '模板编号',
                width: '160px',
                render: (r) => (
                  <span className="font-mono text-xs text-primary-400">
                    {(r as ContractTemplate).templateCode}
                  </span>
                ),
              },
              {
                key: 'version',
                title: '版本',
                width: '80px',
                align: 'center',
                render: (r) => (
                  <Tag variant="info" size="sm">
                    v{(r as ContractTemplate).version}
                  </Tag>
                ),
              },
              {
                key: 'applicableScenario',
                title: '适用场景',
                render: (r) => (
                  <span className="text-sm text-logistics-text">
                    {(r as ContractTemplate).applicableScenario}
                  </span>
                ),
              },
              {
                key: 'clauses',
                title: '条款数',
                width: '100px',
                align: 'center',
                render: (r) => {
                  const count = (r as ContractTemplate).clauses.length
                  return (
                    <span className="font-medium text-logistics-text">
                      {count} 条
                    </span>
                  )
                },
              },
              {
                key: 'updatedAt',
                title: '更新时间',
                width: '140px',
                render: (r) => (
                  <span className="text-sm text-logistics-muted">
                    {formatDate((r as ContractTemplate).updatedAt)}
                  </span>
                ),
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
                    <button className="btn-primary !px-2.5 !py-1 text-xs">使用</button>
                  </div>
                ),
              },
            ]}
            data={mockContractTemplates}
            rowKey={(r) => (r as ContractTemplate).id}
            emptyText="暂无合同模板"
          />
        )}

        {activeTab === 'contracts' && (
          <DataTable
            columns={[
              {
                key: 'contractNo',
                title: '合同号',
                width: '160px',
                render: (r) => {
                  const c = r as ElectronicContract
                  return (
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-primary-400">{c.contractNo}</span>
                      <span className="mt-0.5 text-[11px] text-logistics-muted">
                        {c.templateName}
                      </span>
                    </div>
                  )
                },
              },
              {
                key: 'orderId',
                title: '关联订单',
                width: '160px',
                render: (r) => {
                  const orderNo = (r as ElectronicContract).orderId
                  return orderNo ? (
                    <span className="font-mono text-xs text-logistics-text">{orderNo}</span>
                  ) : (
                    <span className="text-xs text-logistics-muted">-</span>
                  )
                },
              },
              {
                key: 'parties',
                title: '甲乙双方',
                width: '240px',
                render: (r) => {
                  const c = r as ElectronicContract
                  return (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Tag variant="primary" size="sm">甲</Tag>
                        <span className="text-logistics-text">{c.shipperName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Tag variant="info" size="sm">乙</Tag>
                        <span className="text-logistics-text">{c.carrierName}</span>
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'totalAmount',
                title: '金额',
                width: '130px',
                align: 'right',
                render: (r) => (
                  <span className="font-medium text-logistics-text">
                    {formatCurrency((r as ElectronicContract).totalAmount)}
                  </span>
                ),
              },
              {
                key: 'status',
                title: '签署状态',
                width: '130px',
                align: 'center',
                render: (r) => {
                  const c = r as ElectronicContract
                  return (
                    <Tag className={statusColor(c.status)} dot>
                      {c.statusLabel}
                    </Tag>
                  )
                },
              },
              {
                key: 'sealHash',
                title: '印章哈希',
                width: '180px',
                render: (r) => {
                  const hash = (r as ElectronicContract).sealHash
                  return (
                    <span className="font-mono text-[11px] text-logistics-muted" title={hash}>
                      {hash.slice(0, 10)}...{hash.slice(-6)}
                    </span>
                  )
                },
              },
              {
                key: 'validity',
                title: '有效期',
                width: '160px',
                render: (r) => {
                  const c = r as ElectronicContract
                  if (!c.effectiveAt || !c.expireAt) {
                    return (
                      <div className="flex items-center gap-1 text-xs text-logistics-muted">
                        <AlertCircle className="h-3 w-3" />
                        等待生效
                      </div>
                    )
                  }
                  return (
                    <div className="flex flex-col text-[11px] text-logistics-muted">
                      <span>生效: {formatDate(c.effectiveAt)}</span>
                      <span>到期: {formatDate(c.expireAt)}</span>
                    </div>
                  )
                },
              },
              {
                key: 'actions',
                title: '操作',
                width: '120px',
                align: 'right',
                render: () => (
                  <div className="flex items-center justify-end gap-1">
                    <button className="btn-ghost !px-2 !py-1 text-xs">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button className="btn-primary !px-2.5 !py-1 text-xs">详情</button>
                  </div>
                ),
              },
            ]}
            data={mockContracts}
            rowKey={(r) => (r as ElectronicContract).id}
            emptyText="暂无电子合同"
          />
        )}

        {activeTab === 'waybills' && (
          <DataTable
            columns={[
              {
                key: 'waybillNo',
                title: '运单号',
                width: '160px',
                render: (r) => {
                  const wb = r as PaperlessWaybill
                  return (
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-primary-400">{wb.waybillNo}</span>
                      <span className="mt-0.5 text-[11px] text-logistics-muted">
                        创建: {formatDate(wb.createdAt)}
                      </span>
                    </div>
                  )
                },
              },
              {
                key: 'orderNo',
                title: '订单号',
                width: '160px',
                render: (r) => (
                  <span className="font-mono text-xs text-logistics-text">
                    {(r as PaperlessWaybill).orderNo}
                  </span>
                ),
              },
              {
                key: 'standard',
                title: 'GB标准',
                width: '130px',
                align: 'center',
                render: (r) => (
                  <Tag variant="primary" size="sm">
                    {(r as PaperlessWaybill).standard}
                  </Tag>
                ),
              },
              {
                key: 'route',
                title: '收发地',
                width: '260px',
                render: (r) => {
                  const wb = r as PaperlessWaybill
                  return (
                    <div className="flex flex-col gap-0.5 text-xs">
                      <div className="flex items-start gap-1.5">
                        <Tag variant="success" size="sm">发</Tag>
                        <span className="text-logistics-text line-clamp-1">{wb.origin}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Tag variant="danger" size="sm">收</Tag>
                        <span className="text-logistics-text line-clamp-1">{wb.destination}</span>
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'cargoInfo',
                title: '货物信息',
                width: '200px',
                render: (r) => {
                  const wb = r as PaperlessWaybill
                  return (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-logistics-text">{wb.cargoInfo}</span>
                      <span className="text-[11px] text-logistics-muted">
                        {wb.vehiclePlate} · {wb.driverName}
                      </span>
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
                  const wb = r as PaperlessWaybill
                  const variant =
                    wb.status === 'completed' ? 'success' : wb.status === 'signed' ? 'info' : 'default'
                  return (
                    <Tag variant={variant} dot>
                      {wb.statusLabel}
                    </Tag>
                  )
                },
              },
              {
                key: 'signatures',
                title: '签字信息',
                width: '160px',
                render: (r) => {
                  const wb = r as PaperlessWaybill
                  const sigs = [wb.shipperSignature, wb.driverSignature, wb.receiverSignature].filter(
                    Boolean
                  ) as string[]
                  return (
                    <div className="flex flex-col gap-0.5 text-[11px] text-logistics-muted">
                      {sigs.length === 0 ? (
                        <span>待签字</span>
                      ) : (
                        sigs.map((s, i) => <span key={i}>✓ {s}</span>)
                      )}
                      {wb.signedAt && (
                        <span className="text-logistics-muted/70">{formatDate(wb.signedAt)}</span>
                      )}
                    </div>
                  )
                },
              },
              {
                key: 'qrCode',
                title: '二维码',
                width: '80px',
                align: 'center',
                render: () => (
                  <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-logistics-border/40 text-logistics-muted transition-colors hover:bg-primary-500/15 hover:text-primary-400">
                    <QrCode className="h-5 w-5" />
                  </button>
                ),
              },
              {
                key: 'actions',
                title: '操作',
                width: '100px',
                align: 'right',
                render: () => (
                  <div className="flex items-center justify-end gap-1">
                    <button className="btn-ghost !px-2 !py-1 text-xs">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button className="btn-primary !px-2.5 !py-1 text-xs">详情</button>
                  </div>
                ),
              },
            ]}
            data={mockWaybills}
            rowKey={(r) => (r as PaperlessWaybill).id}
            emptyText="暂无无纸化运单"
          />
        )}
      </Section>
    </div>
  )
}
