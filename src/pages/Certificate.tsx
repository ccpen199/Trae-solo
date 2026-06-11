import { useState } from "react"
import { Shield, Car, Plane, Building2, Wifi, X, ScanLine, CreditCard, Clock, ChevronRight, CheckCircle, Eye, AlertTriangle, FileCheck, Search, MessageSquare, Check, AlertCircle, ScrollText } from "lucide-react"
import { useAppStore } from "@/stores/useAppStore"
import { mockVerificationRecords, mockCertAuditRecords } from "@/lib/mockData"
import type { ECertificate, CertVerificationRecord, CertAuditRecord } from "@/lib/mockData"

const gradientMap: Record<ECertificate["type"], string> = {
  id_card: "bg-gradient-to-br from-primary-800 via-primary-700 to-gov-blue",
  driver_license: "bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500",
  passport: "bg-gradient-to-br from-gov-red via-red-800 to-red-900",
}

const iconMap: Record<ECertificate["type"], React.ReactNode> = {
  id_card: <CreditCard className="w-8 h-8" />,
  driver_license: <Car className="w-8 h-8" />,
  passport: <Plane className="w-8 h-8" />,
}

const statusMap: Record<ECertificate["status"], { label: string; className: string }> = {
  valid: { label: "有效", className: "badge-success" },
  expired: { label: "已过期", className: "badge-error" },
  revoked: { label: "已注销", className: "badge-warning" },
}

const verificationScenarios = [
  {
    icon: <Building2 className="w-8 h-8 text-gov-blue" />,
    title: "酒店入住",
    desc: "使用电子身份证办理酒店入住登记，无需携带实体证件",
    flow: ["出示电子身份证二维码", "酒店前台扫码核验", "系统自动比对公安数据", "核验通过完成入住"],
  },
  {
    icon: <Wifi className="w-8 h-8 text-gov-blue" />,
    title: "网吧上网",
    desc: "在互联网服务场所使用电子身份证进行实名认证上网",
    flow: ["打开电子证照页面", "网吧终端扫描二维码", "实名认证信息自动回传", "认证通过开始上网"],
  },
  {
    icon: <Plane className="w-8 h-8 text-gov-blue" />,
    title: "机场值机",
    desc: "使用电子身份证或电子护照在机场自助值机终端办理登机",
    flow: ["选择电子身份证/护照", "自助终端扫描二维码", "与航信系统联动核验", "核验通过打印登机牌"],
  },
]

function ShieldPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl opacity-10 pointer-events-none">
      <Shield className="absolute -right-6 -top-6 w-32 h-32 rotate-12" />
      <Shield className="absolute -left-4 -bottom-4 w-24 h-24 -rotate-12" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-white/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/10" />
    </div>
  )
}

function QRCodeArea({ data }: { data: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative p-4">
        <div className="absolute inset-0 rounded-2xl border-2 border-gov-blue animate-pulse-slow" />
        <div className="w-40 h-40 rounded-xl bg-white border-2 border-neutral-border flex flex-col items-center justify-center gap-2 p-3">
          <ScanLine className="w-10 h-10 text-gov-blue" />
          <span className="text-xs text-neutral-slate text-center break-all leading-tight">{data}</span>
        </div>
      </div>
      <span className="text-sm text-gov-blue font-medium">扫码核验</span>
    </div>
  )
}

function CertificateCard({ cert, onClick }: { cert: ECertificate; onClick: () => void }) {
  const status = statusMap[cert.status]
  return (
    <div onClick={onClick} className={`relative ${gradientMap[cert.type]} rounded-xl p-6 text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 shadow-lg hover:shadow-xl overflow-hidden`}>
      <ShieldPattern />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/15 backdrop-blur-sm">{iconMap[cert.type]}</div>
            <div>
              <h3 className="text-lg font-serif font-semibold">{cert.typeName}</h3>
              <span className={`badge mt-1 ${status.className} !text-[10px]`}>{status.label}</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 opacity-60 mt-1" />
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="opacity-70">持证人</span><span className="font-medium">{cert.holderName}</span></div>
          <div className="flex justify-between"><span className="opacity-70">证件号码</span><span className="font-medium tracking-wider">{cert.holderIdNumber}</span></div>
          <div className="flex justify-between"><span className="opacity-70">签发日期</span><span>{cert.issueDate}</span></div>
          <div className="flex justify-between"><span className="opacity-70">有效期至</span><span>{cert.expiryDate}</span></div>
        </div>
      </div>
    </div>
  )
}

function CertificateModal({ cert, onClose }: { cert: ECertificate; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"front" | "back">("front")
  const status = statusMap[cert.status]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className={`${gradientMap[cert.type]} px-6 py-5 text-white relative`}>
          <ShieldPattern />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/15 backdrop-blur-sm">{iconMap[cert.type]}</div>
              <div>
                <h3 className="text-lg font-serif font-semibold">{cert.typeName}</h3>
                <span className={`badge mt-1 ${status.className} !text-[10px]`}>{status.label}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="px-6 pt-4">
          <div className="flex border-b border-neutral-border mb-5">
            <button onClick={() => setActiveTab("front")} className={`pb-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "front" ? "border-gov-blue text-gov-blue" : "border-transparent text-neutral-slate hover:text-primary"}`}>证照正面</button>
            <button onClick={() => setActiveTab("back")} className={`pb-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "back" ? "border-gov-blue text-gov-blue" : "border-transparent text-neutral-slate hover:text-primary"}`}>证照背面</button>
          </div>
        </div>
        <div className="px-6 pb-6">
          {activeTab === "front" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-neutral-slate mb-1">持证人</p><p className="text-sm font-medium text-primary">{cert.holderName}</p></div>
                <div><p className="text-xs text-neutral-slate mb-1">证件号码</p><p className="text-sm font-medium text-primary tracking-wider">{cert.holderIdNumber}</p></div>
                <div><p className="text-xs text-neutral-slate mb-1">签发日期</p><p className="text-sm text-primary">{cert.issueDate}</p></div>
                <div><p className="text-xs text-neutral-slate mb-1">有效期至</p><p className="text-sm text-primary">{cert.expiryDate}</p></div>
              </div>
              <div className="flex justify-center pt-2"><QRCodeArea data={cert.qrCodeData} /></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-neutral-bg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-neutral-slate" /><span className="text-neutral-slate">签发机关</span></div>
                <p className="text-sm font-medium text-primary pl-6">贵阳市公安局</p>
                <div className="flex items-center gap-2 text-sm"><Shield className="w-4 h-4 text-neutral-slate" /><span className="text-neutral-slate">证件状态</span></div>
                <p className="pl-6"><span className={`badge ${status.className}`}>{status.label}</span></p>
              </div>
              <div className="flex justify-center pt-2"><QRCodeArea data={cert.qrCodeData} /></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function VerificationFlowModal({ scenario, onClose }: { scenario: typeof verificationScenarios[0]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-border">
          <h3 className="text-lg font-serif font-semibold text-primary">{scenario.title}核验流程</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="px-6 py-5">
          <div className="space-y-4">
            {scenario.flow.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gov-blue/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-gov-blue">{i + 1}</span>
                </div>
                <div className="flex-1 pt-1"><p className="text-sm font-medium text-primary">{step}</p></div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-status-success/5 rounded-lg border border-status-success/20">
            <div className="flex items-center gap-2 text-sm text-status-success font-medium">
              <CheckCircle className="w-4 h-4" /><span>核验完成，全程不超过30秒</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const auditStatusMap: Record<CertAuditRecord["status"], { label: string; className: string }> = {
  pending: { label: "待审核", className: "badge-warning" },
  approved: { label: "已通过", className: "badge-success" },
  rejected: { label: "已驳回", className: "badge-error" },
}

const verifierTypeMap: Record<string, { label: string; icon: React.ReactNode }> = {
  hotel: { label: "酒店", icon: <Building2 className="w-4 h-4" /> },
  internet_cafe: { label: "网吧", icon: <Wifi className="w-4 h-4" /> },
  airport: { label: "机场", icon: <Plane className="w-4 h-4" /> },
  bank: { label: "银行", icon: <CreditCard className="w-4 h-4" /> },
  other: { label: "其他", icon: <Search className="w-4 h-4" /> },
}

function RejectReasonModal({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("")
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-border">
          <h3 className="text-lg font-serif font-semibold text-primary">驳回原因</h3>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-status-error/5 rounded-lg text-sm text-status-error">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>驳回后申请人需重新提交申请，请填写具体原因</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">驳回原因 <span className="text-gov-red">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="请输入驳回原因，如：照片不符合规范、材料不完整等" className="input-field min-h-[80px] resize-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={onCancel} className="btn-secondary">取消</button>
            <button onClick={() => reason.trim() && onConfirm(reason)} disabled={!reason.trim()} className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed">确认驳回</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuditDetailModal({ record, onClose }: { record: CertAuditRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-border">
          <h3 className="text-lg font-serif font-semibold text-primary">签发审核详情</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs text-neutral-slate mb-1">申请人</p><p className="text-sm font-medium text-primary">{record.applicantName}</p></div>
            <div><p className="text-xs text-neutral-slate mb-1">证件号码</p><p className="text-sm font-medium text-primary tracking-wider">{record.applicantIdNumber}</p></div>
            <div><p className="text-xs text-neutral-slate mb-1">证照类型</p><p className="text-sm text-primary">{record.certType}</p></div>
            <div><p className="text-xs text-neutral-slate mb-1">申请日期</p><p className="text-sm text-primary">{record.applyDate}</p></div>
            <div><p className="text-xs text-neutral-slate mb-1">审核状态</p><span className={auditStatusMap[record.status].className}>{auditStatusMap[record.status].label}</span></div>
            <div><p className="text-xs text-neutral-slate mb-1">审核人</p><p className="text-sm text-primary">{record.auditor || "待分配"}</p></div>
          </div>
          {record.auditDate && (
            <div><p className="text-xs text-neutral-slate mb-1">审核日期</p><p className="text-sm text-primary">{record.auditDate}</p></div>
          )}
          {record.rejectReason && (
            <div className="p-3 bg-status-error/5 rounded-lg border border-status-error/20">
              <p className="text-xs text-status-error font-medium mb-1">驳回原因</p>
              <p className="text-sm text-primary">{record.rejectReason}</p>
            </div>
          )}
          {record.status === "approved" && (
            <div className="p-3 bg-status-success/5 rounded-lg border border-status-success/20">
              <div className="flex items-center gap-2 text-sm text-status-success font-medium">
                <CheckCircle className="w-4 h-4" /><span>证照已签发，电子证照已推送至申请人</span>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-neutral-border">
          <button onClick={onClose} className="btn-primary w-full">关闭</button>
        </div>
      </div>
    </div>
  )
}

function ConfirmActionModal({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 text-center space-y-3">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-status-warning" />
          </div>
          <h4 className="text-base font-serif font-semibold text-primary">{title}</h4>
          <p className="text-sm text-neutral-slate">{message}</p>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-border">
          <button onClick={onCancel} className="btn-secondary flex-1">取消</button>
          <button onClick={onConfirm} className="btn-primary flex-1">确认</button>
        </div>
      </div>
    </div>
  )
}

function ReviewRequestModal({ record, onConfirm, onCancel }: { record: CertVerificationRecord; onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("")
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-border">
          <h3 className="text-lg font-serif font-semibold text-primary">发起复查</h3>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg text-sm space-y-1">
            <p><span className="text-neutral-slate">持证人：</span><span className="text-primary font-medium">{record.holderName}</span></p>
            <p><span className="text-neutral-slate">核验方：</span><span className="text-primary">{record.verifierName}</span></p>
            <p><span className="text-neutral-slate">核验时间：</span><span className="text-primary">{record.verifiedAt}</span></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">复查原因 <span className="text-gov-red">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="请输入发起复查的原因" className="input-field min-h-[60px] resize-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={onCancel} className="btn-secondary">取消</button>
            <button onClick={() => reason.trim() && onConfirm(reason)} disabled={!reason.trim()} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">确认发起</button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface InvestigationRecord {
  id: string
  certHolder: string
  certType: string
  reason: string
  status: "investigating" | "completed" | "closed"
  assignee: string
  createdAt: string
  result?: string
}

const mockInvestigations: InvestigationRecord[] = [
  { id: "inv001", certHolder: "赵注销", certType: "居民身份证", reason: "证照已注销但仍出现核验尝试", status: "investigating", assignee: "李明警官", createdAt: "2026-06-07" },
  { id: "inv002", certHolder: "赵六", certType: "机动车驾驶证", reason: "核验未通过，驾驶证信息与系统记录不符", status: "completed", assignee: "张警官", createdAt: "2026-06-05", result: "经核查，驾驶证已过期未换证，已通知持证人尽快办理换证手续" },
  { id: "inv003", certHolder: "刘过期", certType: "机动车驾驶证", reason: "过期证照仍有使用记录", status: "closed", assignee: "王警官", createdAt: "2026-06-03", result: "核实为系统延迟更新，已手动更新状态" },
]

function PoliceCertificateView() {
  const { certificates, updateCertificateStatus, addAuditLog, addNotification } = useAppStore()
  const [activeTab, setActiveTab] = useState<"audit" | "verify" | "abnormal">("audit")
  const [auditRecords, setAuditRecords] = useState(mockCertAuditRecords)
  const [selectedScenario, setSelectedScenario] = useState<typeof verificationScenarios[0] | null>(null)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [detailRecord, setDetailRecord] = useState<CertAuditRecord | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: "restore" | "revoke"; certId: string } | null>(null)
  const [reviewRecord, setReviewRecord] = useState<CertVerificationRecord | null>(null)
  const [investigations, setInvestigations] = useState(mockInvestigations)

  const handleApprove = (id: string) => {
    setAuditRecords((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: "approved" as const, auditor: "李明警官", auditDate: new Date().toLocaleDateString("zh-CN") } : r)
    )
    addAuditLog("审核通过", `证照签发审核 ${id}`)
    addNotification({ id: `n_${Date.now()}`, title: "证照签发审核通过", content: `证照签发申请 ${id} 已审核通过，电子证照已推送至申请人。`, time: new Date().toLocaleString("zh-CN"), read: false })
  }

  const handleReject = (id: string, reason: string) => {
    setAuditRecords((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: "rejected" as const, auditor: "李明警官", auditDate: new Date().toLocaleDateString("zh-CN"), rejectReason: reason } : r)
    )
    addAuditLog("审核驳回", `证照签发审核 ${id}，原因：${reason}`)
    addNotification({ id: `n_${Date.now()}`, title: "证照签发审核驳回", content: `证照签发申请 ${id} 已驳回，原因：${reason}`, time: new Date().toLocaleString("zh-CN"), read: false })
    setRejectTarget(null)
  }

  const handleRestore = (certId: string) => {
    updateCertificateStatus(certId, "valid")
    addAuditLog("恢复证照", `证照 ${certId} 状态恢复为有效`)
    setConfirmAction(null)
  }

  const handleRevoke = (certId: string) => {
    updateCertificateStatus(certId, "revoked")
    addAuditLog("注销证照", `证照 ${certId} 已注销`)
    addNotification({ id: `n_${Date.now()}`, title: "证照已注销", content: `证照 ${certId} 已被注销，持证人将收到通知。`, time: new Date().toLocaleString("zh-CN"), read: false })
    setConfirmAction(null)
  }

  const handleReviewConfirm = (reason: string) => {
    if (reviewRecord) {
      const newInv: InvestigationRecord = {
        id: `inv${Date.now()}`,
        certHolder: reviewRecord.holderName,
        certType: reviewRecord.certType,
        reason,
        status: "investigating",
        assignee: "李明警官",
        createdAt: new Date().toLocaleDateString("zh-CN"),
      }
      setInvestigations((prev) => [newInv, ...prev])
      addAuditLog("发起复查", `${reviewRecord.holderName}的${reviewRecord.certType}核验异常复查，原因：${reason}`)
    }
    setReviewRecord(null)
  }

  const handleCompleteInvestigation = (id: string) => {
    setInvestigations((prev) =>
      prev.map((inv) => inv.id === id ? { ...inv, status: "completed" as const, result: "经核查，已确认情况并处理完毕" } : inv)
    )
    addAuditLog("完成调查", `异常复查工单 ${id}`)
  }

  const abnormalCerts = certificates.filter((c) => c.status === "expired" || c.status === "revoked")
  const failedVerifications = mockVerificationRecords.filter((v) => v.result === "fail")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gov-gold/10 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-gov-gold" />
        </div>
        <div>
          <h2 className="section-title">证照审核管理</h2>
          <p className="text-xs text-neutral-slate ml-4">电子证照签发审核、核验记录查询、异常证照复查</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-neutral-border">
        {[
          { key: "audit" as const, label: "签发审核", icon: FileCheck },
          { key: "verify" as const, label: "核验记录", icon: Eye },
          { key: "abnormal" as const, label: "异常复查", icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium transition-colors relative ${activeTab === tab.key ? "text-gov-blue" : "text-neutral-slate hover:text-primary"}`}>
              <Icon className="w-4 h-4" />{tab.label}
              {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gov-blue rounded-full" />}
            </button>
          )
        })}
      </div>

      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-neutral-slate">待审核证照签发申请</span>
            <span className="badge-warning">{auditRecords.filter((r) => r.status === "pending").length} 条待处理</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">申请人</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">证件号码</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">证照类型</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">申请日期</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">状态</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">审核人</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {auditRecords.map((record) => {
                  const s = auditStatusMap[record.status]
                  return (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-800">{record.applicantName}</td>
                      <td className="py-3 px-4 text-gray-600 tracking-wider">{record.applicantIdNumber}</td>
                      <td className="py-3 px-4 text-gray-700">{record.certType}</td>
                      <td className="py-3 px-4 text-gray-500">{record.applyDate}</td>
                      <td className="py-3 px-4 text-center"><span className={s.className}>{s.label}</span></td>
                      <td className="py-3 px-4 text-center text-gray-500">{record.auditor || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {record.status === "pending" ? (
                            <>
                              <button onClick={() => handleApprove(record.id)} className="px-3 py-1 rounded text-xs font-medium bg-status-success/10 text-status-success hover:bg-status-success/20 transition-colors">通过</button>
                              <button onClick={() => setRejectTarget(record.id)} className="px-3 py-1 rounded text-xs font-medium bg-status-error/10 text-status-error hover:bg-status-error/20 transition-colors">驳回</button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">{record.auditDate || "-"}</span>
                          )}
                          <button onClick={() => setDetailRecord(record)} className="px-2 py-1 text-xs text-gov-blue hover:underline flex items-center gap-0.5"><Eye className="w-3 h-3" />详情</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {auditRecords.some((r) => r.status === "rejected" && r.rejectReason) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-primary">驳回记录</h4>
              {auditRecords.filter((r) => r.status === "rejected" && r.rejectReason).map((r) => (
                <div key={r.id} className="card p-3 border-l-4 border-l-status-error">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-primary">{r.applicantName}</span>
                    <span className="badge-error">已驳回</span>
                    <span className="text-neutral-slate">|</span>
                    <span className="text-neutral-slate">原因：{r.rejectReason}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "verify" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-neutral-slate">各场景扫码核验记录</span>
            <span className="badge-info">{mockVerificationRecords.length} 条记录</span>
          </div>
          <div className="space-y-3">
            {mockVerificationRecords.map((record: CertVerificationRecord) => {
              const vType = verifierTypeMap[record.verifierType] || verifierTypeMap.other
              return (
                <div key={record.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-primary">{record.holderName}</span>
                        <span className="badge-info">{record.certType}</span>
                        <span className={`badge ${record.result === "pass" ? "badge-success" : "badge-error"}`}>
                          {record.result === "pass" ? "核验通过" : "核验异常"}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-neutral-slate mb-3">
                        <div className="flex items-center gap-2">{vType.icon}<span>核验方：{record.verifierName} ({vType.label})</span></div>
                        <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /><span>核验时间：{record.verifiedAt}</span></div>
                        <div className="flex items-center gap-2"><Search className="w-3.5 h-3.5" /><span>核验地点：{record.verifierLocation}</span></div>
                      </div>
                      <div className="bg-neutral-bg rounded-lg p-3">
                        <p className="text-xs font-medium text-neutral-slate mb-2">核验流程</p>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="px-2 py-0.5 bg-gov-blue/10 text-gov-blue rounded">扫码</span>
                          <ChevronRight className="w-3 h-3 text-neutral-slate" />
                          <span className="px-2 py-0.5 bg-gov-blue/10 text-gov-blue rounded">数据比对</span>
                          <ChevronRight className="w-3 h-3 text-neutral-slate" />
                          <span className={`px-2 py-0.5 rounded ${record.result === "pass" ? "bg-status-success/10 text-status-success" : "bg-status-error/10 text-status-error"}`}>
                            {record.result === "pass" ? "通过" : "异常"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {record.result === "fail" && (
                      <button onClick={() => setReviewRecord(record)} className="btn-danger text-xs py-1 px-3 ml-3 shrink-0">发起复查</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div>
            <h3 className="section-title text-base mb-4">扫码核验流程说明</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {verificationScenarios.map((scenario) => (
                <div key={scenario.title} className="card p-5 cursor-pointer hover:border-gov-blue/30" onClick={() => setSelectedScenario(scenario)}>
                  <div className="p-2 rounded-lg bg-primary-50 w-fit mb-3">{scenario.icon}</div>
                  <h4 className="text-sm font-semibold text-primary mb-1">{scenario.title}</h4>
                  <p className="text-xs text-neutral-slate mb-2">{scenario.desc}</p>
                  <span className="text-xs text-gov-blue flex items-center gap-1">查看核验流程 <ChevronRight className="w-3 h-3" /></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "abnormal" && (
        <div className="space-y-6">
          <div>
            <h3 className="section-title text-base mb-3">异常证照</h3>
            <p className="text-xs text-neutral-slate ml-4 mb-4">过期、注销等异常状态证照需重点关注</p>
            {abnormalCerts.length === 0 ? (
              <div className="card p-8 text-center">
                <CheckCircle className="w-10 h-10 text-status-success mx-auto mb-2" />
                <p className="text-sm text-neutral-slate">当前无异常证照</p>
              </div>
            ) : (
              <div className="space-y-3">
                {abnormalCerts.map((cert) => (
                  <div key={cert.id} className="card p-4 border-l-4 border-l-status-warning">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-primary">{cert.holderName}</span>
                          <span className="badge-info">{cert.typeName}</span>
                          <span className={statusMap[cert.status].className}>{statusMap[cert.status].label}</span>
                        </div>
                        <p className="text-xs text-neutral-slate">证件号码：{cert.holderIdNumber} | 有效期至：{cert.expiryDate}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmAction({ type: "restore", certId: cert.id })} className="btn-secondary text-xs py-1 px-3">恢复有效</button>
                        <button onClick={() => setConfirmAction({ type: "revoke", certId: cert.id })} className="btn-danger text-xs py-1 px-3">注销证照</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="section-title text-base mb-3">核验异常记录</h3>
            <p className="text-xs text-neutral-slate ml-4 mb-4">核验未通过的记录需跟进复查</p>
            {failedVerifications.length === 0 ? (
              <div className="card p-8 text-center">
                <CheckCircle className="w-10 h-10 text-status-success mx-auto mb-2" />
                <p className="text-sm text-neutral-slate">当前无核验异常记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {failedVerifications.map((record) => (
                  <div key={record.id} className="card p-4 border-l-4 border-l-gov-red">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-primary">{record.holderName}</span>
                          <span className="badge-info">{record.certType}</span>
                          <span className="badge-error">核验异常</span>
                        </div>
                        <p className="text-xs text-neutral-slate">核验方：{record.verifierName} | 时间：{record.verifiedAt}</p>
                      </div>
                      <button onClick={() => setReviewRecord(record)} className="btn-danger text-xs py-1 px-3">发起复查</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="section-title text-base mb-3">异常复查工单</h3>
            <p className="text-xs text-neutral-slate ml-4 mb-4">已发起的异常调查跟进记录</p>
            <div className="space-y-3">
              {investigations.map((inv) => (
                <div key={inv.id} className={`card p-4 border-l-4 ${inv.status === "investigating" ? "border-l-status-warning" : inv.status === "completed" ? "border-l-status-success" : "border-l-gray-400"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-primary">{inv.certHolder}</span>
                        <span className="badge-info">{inv.certType}</span>
                        <span className={`badge ${inv.status === "investigating" ? "badge-warning" : inv.status === "completed" ? "badge-success" : "badge-info"}`}>
                          {inv.status === "investigating" ? "调查中" : inv.status === "completed" ? "已完成" : "已关闭"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-slate mt-1">原因：{inv.reason}</p>
                      <p className="text-xs text-neutral-slate">负责人：{inv.assignee} | 创建时间：{inv.createdAt}</p>
                      {inv.result && (
                        <div className="mt-2 p-2 bg-status-success/5 rounded text-xs text-primary">
                          <span className="font-medium">调查结果：</span>{inv.result}
                        </div>
                      )}
                    </div>
                    {inv.status === "investigating" && (
                      <button onClick={() => handleCompleteInvestigation(inv.id)} className="btn-primary text-xs py-1 px-3 ml-3 shrink-0">完成调查</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedScenario && <VerificationFlowModal scenario={selectedScenario} onClose={() => setSelectedScenario(null)} />}
      {rejectTarget && <RejectReasonModal onConfirm={(reason) => handleReject(rejectTarget, reason)} onCancel={() => setRejectTarget(null)} />}
      {detailRecord && <AuditDetailModal record={detailRecord} onClose={() => setDetailRecord(null)} />}
      {confirmAction && (
        <ConfirmActionModal
          title={confirmAction.type === "restore" ? "确认恢复证照" : "确认注销证照"}
          message={confirmAction.type === "restore" ? "恢复后该证照将变为有效状态，持证人可正常使用，确认恢复？" : "注销后该证照将永久失效，持证人需重新申请，确认注销？"}
          onConfirm={() => confirmAction.type === "restore" ? handleRestore(confirmAction.certId) : handleRevoke(confirmAction.certId)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {reviewRecord && <ReviewRequestModal record={reviewRecord} onConfirm={handleReviewConfirm} onCancel={() => setReviewRecord(null)} />}
    </div>
  )
}

function CitizenCertificateView() {
  const [selectedCert, setSelectedCert] = useState<ECertificate | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<typeof verificationScenarios[0] | null>(null)
  const [activeTab, setActiveTab] = useState<"certs" | "records" | "abnormal">("certs")
  const certificates = useAppStore((s) => s.certificates)
  const myVerifications = mockVerificationRecords.filter((v) => v.holderName === "张三")
  const myAbnormals = mockVerificationRecords.filter((v) => v.holderName === "张三" && v.result === "fail")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h2 className="section-title">我的电子证照</h2>
        <p className="text-sm text-neutral-slate mt-2 pl-4">点击证照卡片查看详情及二维码</p>
      </div>

      <div className="flex gap-1 border-b border-neutral-border">
        {[
          { key: "certs" as const, label: "我的证照", icon: CreditCard },
          { key: "records" as const, label: "核验记录", icon: ScanLine },
          { key: "abnormal" as const, label: "异常反馈", icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium transition-colors relative ${activeTab === tab.key ? "text-gov-blue" : "text-neutral-slate hover:text-primary"}`}>
              <Icon className="w-4 h-4" />{tab.label}
              {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gov-blue rounded-full" />}
              {tab.key === "abnormal" && myAbnormals.length > 0 && (
                <span className="w-2 h-2 bg-gov-red rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {activeTab === "certs" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {certificates.filter((c) => c.status === "valid").map((cert) => (
              <CertificateCard key={cert.id} cert={cert} onClick={() => setSelectedCert(cert)} />
            ))}
          </div>
          <div>
            <h2 className="section-title">使用场景</h2>
            <p className="text-sm text-neutral-slate mt-2 pl-4">电子证照可在以下场景中使用</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {verificationScenarios.map((scenario) => (
              <div key={scenario.title} className="card p-6 cursor-pointer hover:border-gov-blue/30" onClick={() => setSelectedScenario(scenario)}>
                <div className="p-3 rounded-xl bg-primary-50 w-fit mb-4">{scenario.icon}</div>
                <h3 className="text-base font-serif font-semibold text-primary mb-2">{scenario.title}</h3>
                <p className="text-sm text-neutral-slate leading-relaxed mb-3">{scenario.desc}</p>
                <span className="text-xs text-gov-blue flex items-center gap-1">查看核验流程 <ChevronRight className="w-3 h-3" /></span>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "records" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-neutral-slate">您的电子证照扫码核验记录</span>
            <span className="badge-info">{myVerifications.length} 条记录</span>
          </div>
          {myVerifications.length === 0 ? (
            <div className="card p-8 text-center">
              <ScanLine className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-slate">暂无核验记录</p>
              <p className="text-xs text-neutral-slate mt-1">您在酒店、网吧、机场等场景使用电子证照时，核验记录将显示在此</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myVerifications.map((record: CertVerificationRecord) => {
                const vType = verifierTypeMap[record.verifierType] || verifierTypeMap.other
                return (
                  <div key={record.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="badge-info">{record.certType}</span>
                          <span className={`badge ${record.result === "pass" ? "badge-success" : "badge-error"}`}>
                            {record.result === "pass" ? "核验通过" : "核验异常"}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-neutral-slate">
                          <div className="flex items-center gap-2">{vType.icon}<span>核验方：{record.verifierName} ({vType.label})</span></div>
                          <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /><span>核验时间：{record.verifiedAt}</span></div>
                          <div className="flex items-center gap-2"><Search className="w-3.5 h-3.5" /><span>核验地点：{record.verifierLocation}</span></div>
                        </div>
                        <div className="mt-2 bg-neutral-bg rounded-lg p-2.5">
                          <div className="flex items-center gap-1 text-xs">
                            <span className="px-2 py-0.5 bg-gov-blue/10 text-gov-blue rounded">① 出示二维码</span>
                            <ChevronRight className="w-3 h-3 text-neutral-slate" />
                            <span className="px-2 py-0.5 bg-gov-blue/10 text-gov-blue rounded">② 扫码核验</span>
                            <ChevronRight className="w-3 h-3 text-neutral-slate" />
                            <span className="px-2 py-0.5 bg-gov-blue/10 text-gov-blue rounded">③ 数据比对</span>
                            <ChevronRight className="w-3 h-3 text-neutral-slate" />
                            <span className={`px-2 py-0.5 rounded ${record.result === "pass" ? "bg-status-success/10 text-status-success" : "bg-status-error/10 text-status-error"}`}>
                              ④ {record.result === "pass" ? "通过" : "异常"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "abnormal" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-neutral-slate">核验异常与反馈跟踪</span>
          </div>
          {myAbnormals.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle className="w-10 h-10 text-status-success mx-auto mb-2" />
              <p className="text-sm text-neutral-slate">所有核验记录均正常，无异常</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {myAbnormals.map((record: CertVerificationRecord) => {
                  const vType = verifierTypeMap[record.verifierType] || verifierTypeMap.other
                  return (
                    <div key={record.id} className="card p-4 border-l-4 border-l-gov-red">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge-info">{record.certType}</span>
                        <span className="badge-error">核验异常</span>
                      </div>
                      <div className="space-y-1 text-sm text-neutral-slate mb-3">
                        <div className="flex items-center gap-2">{vType.icon}<span>核验方：{record.verifierName} ({vType.label})</span></div>
                        <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /><span>时间：{record.verifiedAt}</span></div>
                        <div className="flex items-center gap-2"><Search className="w-3.5 h-3.5" /><span>地点：{record.verifierLocation}</span></div>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-medium text-status-warning">异常复查进度</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-5 h-5 rounded-full bg-status-success text-white flex items-center justify-center shrink-0"><Check className="w-3 h-3" /></div>
                            <span className="text-primary">异常已记录</span>
                            <span className="text-neutral-slate ml-auto">{record.verifiedAt}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-5 h-5 rounded-full bg-status-success text-white flex items-center justify-center shrink-0"><Check className="w-3 h-3" /></div>
                            <span className="text-primary">已提交公安核查</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-5 h-5 rounded-full bg-gov-blue text-white flex items-center justify-center shrink-0 animate-pulse"><span className="text-[8px]">3</span></div>
                            <span className="text-gov-blue font-medium">核查进行中</span>
                            <span className="text-neutral-slate ml-auto">预计1-3个工作日</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center shrink-0"><span className="text-[8px]">4</span></div>
                            <span className="text-neutral-slate">结果通知</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 p-2 bg-primary-50/50 rounded text-xs text-neutral-slate">
                        <span className="font-medium text-primary">温馨提示：</span>核验异常不影响您正常使用电子证照，公安机关将核实异常原因并通知您处理结果。
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
          <div className="card p-4">
            <h4 className="text-sm font-medium text-primary mb-2">异常申诉</h4>
            <p className="text-xs text-neutral-slate mb-3">如您发现核验记录异常，可提交申诉，公安机关将尽快核实处理</p>
            <div className="space-y-2">
              <textarea placeholder="请描述异常情况，如：我并未在该地点进行过核验..." className="input-field min-h-[60px] resize-none text-sm" />
              <button className="btn-primary text-sm py-1.5">提交申诉</button>
            </div>
          </div>
        </div>
      )}

      {selectedCert && <CertificateModal cert={selectedCert} onClose={() => setSelectedCert(null)} />}
      {selectedScenario && <VerificationFlowModal scenario={selectedScenario} onClose={() => setSelectedScenario(null)} />}
    </div>
  )
}

export default function Certificate() {
  const currentRole = useAppStore((s) => s.currentRole)
  return currentRole === "police" ? <PoliceCertificateView /> : <CitizenCertificateView />
}
