import {
  FileCheck,
  ScanLine,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Shield,
  AlertTriangle,
  Clock,
  Building2,
  Eye,
  UserCheck,
  UserX,
} from 'lucide-react'
import { PageHeader } from '../components/ui/Breadcrumb'
import { StatCard } from '../components/ui/StatCard'
import { Section } from '../components/ui/Section'
import { DataTable } from '../components/ui/DataTable'
import { Tag } from '../components/ui/Tag'
import { Progress } from '../components/ui/Progress'
import { mockAudits } from '../data/mock'
import { formatDateTime, cn } from '../utils'
import type { QualificationAudit } from '../types'

export default function Qualification() {
  const pendingCount = mockAudits.filter((a) => a.auditStatus === 'manual_review').length
  const ocrVerifyingCount = mockAudits.filter((a) => a.auditStatus === 'ocr_verifying').length
  const approvedCount = mockAudits.filter((a) => a.auditStatus === 'approved').length
  const rejectedCount = mockAudits.filter((a) => a.auditStatus === 'rejected').length
  const whitelisted = mockAudits.filter((a) => a.isWhitelisted)

  const auditTagVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' => {
    switch (status) {
      case 'approved':
        return 'success'
      case 'rejected':
        return 'danger'
      case 'manual_review':
        return 'warning'
      case 'ocr_verifying':
        return 'info'
      default:
        return 'default'
    }
  }

  const confidenceColor = (confidence: number): 'primary' | 'green' | 'yellow' | 'red' => {
    if (confidence >= 0.9) return 'green'
    if (confidence >= 0.7) return 'primary'
    if (confidence >= 0.5) return 'yellow'
    return 'red'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="资质审核与白名单"
        subtitle="管理承运方与货主企业资质证件审核，维护平台白名单企业"
        breadcrumbs={[
          { label: '工作台', icon: Shield },
          { label: '资质审核' },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="待审核"
          value={pendingCount}
          trend={
            <span className="flex items-center gap-1 text-amber-400">
              <Clock className="h-3 w-3" /> 需要人工复核
            </span>
          }
          icon={<FileCheck className="h-5 w-5" />}
          iconColor="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          label="OCR识别中"
          value={ocrVerifyingCount}
          trend={
            <span className="flex items-center gap-1 text-blue-400">
              <ScanLine className="h-3 w-3" /> 智能识别处理中
            </span>
          }
          icon={<ScanLine className="h-5 w-5" />}
          iconColor="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          label="已通过"
          value={approvedCount}
          trend={
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="h-3 w-3" /> 审核通过率 {(approvedCount / mockAudits.length * 100).toFixed(0)}%
            </span>
          }
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="bg-green-500/15 text-green-400"
        />
        <StatCard
          label="已拒绝"
          value={rejectedCount}
          trend={
            <span className="flex items-center gap-1 text-red-400">
              <XCircle className="h-3 w-3" /> 需补充材料
            </span>
          }
          icon={<XCircle className="h-5 w-5" />}
          iconColor="bg-red-500/15 text-red-400"
        />
      </div>

      <Section
        title="审核队列"
        subtitle={`共 ${mockAudits.length} 条资质审核申请，按上传时间排序`}
        actions={<button className="btn-ghost">批量处理 →</button>}
      >
        <DataTable
          columns={[
            {
              key: 'applicantName',
              title: '申请企业',
              render: (r) => {
                const row = r as QualificationAudit
                return (
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/15 text-primary-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-logistics-text">{row.applicantName}</div>
                      <div className="text-xs text-logistics-muted">
                        {row.applicantType === 'carrier' ? '承运方' : '货主企业'}
                      </div>
                    </div>
                  </div>
                )
              },
            },
            {
              key: 'documentType',
              title: '证件类型',
              render: (r) => {
                const row = r as QualificationAudit
                return (
                  <div>
                    <div className="text-logistics-text">{row.documentTypeLabel}</div>
                    <div className="font-mono text-xs text-logistics-muted">{row.documentNumber}</div>
                  </div>
                )
              },
            },
            {
              key: 'documentNumber',
              title: '证件号',
              render: (r) => (
                <span className="font-mono text-xs text-logistics-muted">
                  {(r as QualificationAudit).documentNumber}
                </span>
              ),
            },
            {
              key: 'ocrConfidence',
              title: 'OCR置信度',
              width: '180px',
              render: (r) => {
                const row = r as QualificationAudit
                const confidence = row.ocrResult?.confidence ?? 0
                const percent = (confidence * 100).toFixed(1)
                return (
                  <div className="space-y-1">
                    <Progress
                      value={confidence * 100}
                      color={confidenceColor(confidence)}
                      size="sm"
                      showLabel
                    />
                    <div className="flex items-center gap-1 text-[11px] text-logistics-muted">
                      {row.auditStatus === 'ocr_verifying' ? (
                        <>
                          <ScanLine className="h-3 w-3 animate-pulse text-blue-400" />
                          <span className="text-blue-400">识别中...</span>
                        </>
                      ) : (
                        <>
                          <span>置信度 {percent}%</span>
                        </>
                      )}
                    </div>
                  </div>
                )
              },
            },
            {
              key: 'auditStatus',
              title: '审核状态',
              align: 'center',
              render: (r) => {
                const row = r as QualificationAudit
                return (
                  <Tag variant={auditTagVariant(row.auditStatus)} dot>
                    {row.auditStatusLabel}
                  </Tag>
                )
              },
            },
            {
              key: 'warnings',
              title: '警告信息',
              width: '220px',
              render: (r) => {
                const row = r as QualificationAudit
                const warnings = row.ocrResult?.warnings ?? []
                if (warnings.length === 0) {
                  return <span className="text-xs text-logistics-muted">—</span>
                }
                return (
                  <div className="flex flex-col gap-1">
                    {warnings.slice(0, 2).map((w, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-1 rounded bg-amber-500/10 px-2 py-1 text-[11px] text-amber-400"
                      >
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                        <span className="line-clamp-2">{w}</span>
                      </div>
                    ))}
                    {warnings.length > 2 && (
                      <span className="text-[10px] text-logistics-muted">+{warnings.length - 2} 更多警告</span>
                    )}
                  </div>
                )
              },
            },
            {
              key: 'actions',
              title: '操作',
              align: 'right',
              width: '160px',
              render: (r) => {
                const row = r as QualificationAudit
                return (
                  <div className="flex items-center justify-end gap-2">
                    <button className="btn-ghost !px-2 !py-1 !text-xs">
                      <Eye className="h-3.5 w-3.5" />
                      查看
                    </button>
                    {row.auditStatus === 'manual_review' && (
                      <>
                        <button className="btn-primary !px-2 !py-1 !text-xs">
                          <UserCheck className="h-3.5 w-3.5" />
                          通过
                        </button>
                        <button className={cn('btn-ghost', '!px-2 !py-1 !text-xs', 'text-red-400 hover:!text-red-300 hover:!bg-red-500/10')}>
                          <UserX className="h-3.5 w-3.5" />
                          拒绝
                        </button>
                      </>
                    )}
                  </div>
                )
              },
            },
          ]}
          data={mockAudits}
          rowKey={(r) => (r as QualificationAudit).id}
        />
      </Section>

      <Section
        title="白名单企业"
        subtitle={`${whitelisted.length} 家优质合作企业，享受快速审核通道`}
        actions={<button className="btn-ghost">管理白名单 →</button>}
      >
        <DataTable
          columns={[
            {
              key: 'applicantName',
              title: '企业名称',
              render: (r) => {
                const row = r as QualificationAudit
                return (
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-logistics-text">{row.applicantName}</div>
                      <div className="text-xs text-logistics-muted">
                        {row.applicantType === 'carrier' ? '承运方' : '货主企业'}
                      </div>
                    </div>
                  </div>
                )
              },
            },
            {
              key: 'documentType',
              title: '已认证资质',
              render: (r) => (
                <Tag variant="success" dot>
                  {(r as QualificationAudit).documentTypeLabel}
                </Tag>
              ),
            },
            {
              key: 'documentNumber',
              title: '证件编号',
              render: (r) => (
                <span className="font-mono text-xs text-logistics-muted">
                  {(r as QualificationAudit).documentNumber}
                </span>
              ),
            },
            {
              key: 'auditorName',
              title: '审核人',
              render: (r) => {
                const row = r as QualificationAudit
                return (
                  <div>
                    <div className="text-logistics-text">{row.auditorName ?? '—'}</div>
                  </div>
                )
              },
            },
            {
              key: 'auditedAt',
              title: '通过时间',
              render: (r) => (
                <span className="text-sm text-logistics-muted">
                  {(r as QualificationAudit).auditedAt
                    ? formatDateTime((r as QualificationAudit).auditedAt!)
                    : '—'}
                </span>
              ),
            },
            {
              key: 'auditComment',
              title: '审核备注',
              render: (r) => (
                <span className="text-xs text-logistics-muted line-clamp-1">
                  {(r as QualificationAudit).auditComment ?? '—'}
                </span>
              ),
            },
            {
              key: 'confidence',
              title: 'OCR置信度',
              align: 'right',
              render: (r) => {
                const row = r as QualificationAudit
                const confidence = row.ocrResult?.confidence ?? 0
                return (
                  <Tag variant="success">
                    {(confidence * 100).toFixed(1)}%
                  </Tag>
                )
              },
            },
          ]}
          data={whitelisted}
          rowKey={(r) => (r as QualificationAudit).id}
          emptyText="暂无白名单企业"
        />
      </Section>
    </div>
  )
}
