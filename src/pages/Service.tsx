import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { FileText, Clock, DollarSign, Upload, ChevronRight, Check, X, CheckCircle, Bell, AlertCircle, Search, Info, Printer, Eye, Download, User, Shield, Stamp, MessageSquare } from "lucide-react"
import { mockServiceGuides } from "@/lib/mockData"
import type { ServiceGuide, ServiceApplication } from "@/lib/mockData"
import { useAppStore } from "@/stores/useAppStore"

const categories = ["全部", "户政", "治安", "出入境", "禁毒"]

const statusLabels: Record<ServiceApplication["status"], string> = {
  pending: "待受理",
  processing: "办理中",
  approved: "已通过",
  rejected: "已驳回",
  completed: "已办结",
}

const statusBadge: Record<ServiceApplication["status"], string> = {
  pending: "badge-warning",
  processing: "badge-info",
  approved: "badge-success",
  rejected: "badge-error",
  completed: "badge-success",
}

const stepLabels = ["提交申请", "受理审核", "审批办理", "办结送达"]

const statusProgression: ServiceApplication["status"][] = [
  "pending", "processing", "approved", "completed",
]

const applyStepLabels = ["填写信息", "上传材料", "确认提交", "提交成功"]

interface TimelineEntry {
  label: string
  time: string
}

function guideMatchesKeyword(guide: ServiceGuide, keyword: string) {
  if (!keyword) return true
  const haystack = [guide.name, guide.category, guide.description, guide.processingTime, guide.fees, ...guide.requiredMaterials].join(" ")
  return haystack.includes(keyword)
}

function StepProgressBar({ currentStep, totalSteps, status }: { currentStep: number; totalSteps: number; status: ServiceApplication["status"] }) {
  const isRejected = status === "rejected"
  return (
    <div className="flex flex-col gap-0">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1
        const isCompleted = stepNum < currentStep
        const isCurrent = stepNum === currentStep
        const isLast = stepNum === totalSteps
        return (
          <div key={stepNum} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  isRejected && isCurrent
                    ? "bg-status-error text-white"
                    : isCompleted
                    ? "bg-status-success text-white"
                    : isCurrent
                    ? "bg-gov-blue text-white animate-pulse"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {isRejected && isCurrent ? <X className="w-3.5 h-3.5" /> : isCompleted ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px]">{stepNum}</span>}
              </div>
              {!isLast && (
                <div className={`w-0.5 h-6 ${isCompleted ? "bg-status-success" : "bg-gray-200"}`} />
              )}
            </div>
            <span className={`text-sm pt-0.5 ${isCompleted ? "text-status-success font-medium" : isCurrent ? "text-gov-blue font-medium" : "text-gray-400"}`}>
              {stepLabels[i] || `步骤${stepNum}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function NotificationTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return null
  return (
    <div className="mt-3 pt-3 border-t border-neutral-border">
      <div className="flex items-center gap-1.5 mb-2">
        <Bell className="w-3.5 h-3.5 text-gov-blue" />
        <span className="text-xs font-medium text-gov-blue">推送记录</span>
      </div>
      <div className="space-y-1.5">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === entries.length - 1 ? "bg-gov-blue" : "bg-gray-300"}`} />
            <span className="text-primary font-medium">{entry.label}</span>
            <span className="text-neutral-slate">{entry.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReceiptView({ app, onPrint }: { app: ServiceApplication; onPrint: () => void }) {
  const receiptNo = `HZ${app.id.replace(/\D/g, "").padStart(8, "0")}`
  return (
    <div className="bg-white border-2 border-gov-blue/20 rounded-lg p-5 space-y-3">
      <div className="text-center border-b border-dashed border-neutral-border pb-3">
        <h5 className="text-base font-serif font-bold text-gov-blue">政务服务中心受理回执</h5>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><span className="text-neutral-slate">回执编号：</span><span className="font-mono font-medium text-primary">{receiptNo}</span></div>
        <div><span className="text-neutral-slate">受理号：</span><span className="font-mono font-medium text-primary">{app.id}</span></div>
        <div><span className="text-neutral-slate">事项名称：</span><span className="font-medium text-primary">{app.typeName}</span></div>
        <div><span className="text-neutral-slate">当前状态：</span><span className={statusBadge[app.status]}>{statusLabels[app.status]}</span></div>
        <div><span className="text-neutral-slate">申请人：</span><span className="text-primary">{app.applicantName}</span></div>
        <div><span className="text-neutral-slate">证件号：</span><span className="font-mono text-primary">{app.applicantIdCard}</span></div>
        <div className="col-span-2"><span className="text-neutral-slate">提交时间：</span><span className="text-primary">{app.submitTime}</span></div>
        {app.status !== "pending" && (
          <>
            <div><span className="text-neutral-slate">受理时间：</span><span className="text-primary">{app.updateTime}</span></div>
            <div><span className="text-neutral-slate">经办民警：</span><span className="text-primary">王建国</span></div>
          </>
        )}
      </div>
      <div className="border-t border-dashed border-neutral-border pt-2">
        <p className="text-xs text-neutral-slate">提交材料：{app.materials.join("、")}</p>
      </div>
      <div className="border-t border-dashed border-neutral-border pt-2 space-y-1">
        <p className="text-xs font-medium text-gov-blue">受理节点</p>
        <div className="flex items-center gap-2 text-xs text-neutral-slate">
          <div className="w-1.5 h-1.5 bg-status-success rounded-full" />
          <span>提交申请 — {app.submitTime}</span>
        </div>
        {app.status !== "pending" && (
          <div className="flex items-center gap-2 text-xs text-neutral-slate">
            <div className="w-1.5 h-1.5 bg-status-success rounded-full" />
            <span>已受理 — {app.updateTime}</span>
          </div>
        )}
        {(app.status === "approved" || app.status === "completed") && (
          <div className="flex items-center gap-2 text-xs text-neutral-slate">
            <div className="w-1.5 h-1.5 bg-status-success rounded-full" />
            <span>审批通过 — {app.updateTime}</span>
          </div>
        )}
        {app.status === "completed" && (
          <div className="flex items-center gap-2 text-xs text-neutral-slate">
            <div className="w-1.5 h-1.5 bg-status-success rounded-full" />
            <span>已办结 — {app.updateTime}</span>
          </div>
        )}
      </div>
      <div className="border-t border-dashed border-neutral-border pt-2">
        <p className="text-[10px] text-neutral-slate text-center">本回执可通过受理号在线查询办理进度，如有疑问请拨打0851-12345</p>
      </div>
      <div className="flex justify-center pt-1">
        <button onClick={onPrint} className="btn-secondary flex items-center gap-1.5 text-sm">
          <Printer className="w-4 h-4" /> 打印回执
        </button>
      </div>
    </div>
  )
}

function ApplyStepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {applyStepLabels.map((label, i) => {
        const isDone = i < currentStep
        const isCurrent = i === currentStep
        return (
          <div key={label} className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              isDone ? "bg-status-success text-white" : isCurrent ? "bg-gov-blue text-white" : "bg-gray-200 text-gray-400"
            }`}>
              {isDone ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span className={`ml-1 text-xs whitespace-nowrap ${isCurrent ? "text-gov-blue font-medium" : "text-neutral-slate"}`}>{label}</span>
            {i < 3 && <ChevronRight className="w-3.5 h-3.5 mx-1 text-gray-300" />}
          </div>
        )
      })}
    </div>
  )
}

function ApplyModal({ guide, onClose }: { guide: ServiceGuide; onClose: () => void }) {
  const { addApplication, addNotification } = useAppStore()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: "", idCard: "", phone: "", address: "", purpose: "" })
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({})
  const [submittedApp, setSubmittedApp] = useState<ServiceApplication | null>(null)

  const handleSubmitForm = () => {
    if (!form.name || !form.idCard || !form.phone) return
    setStep(1)
  }

  const handleSimulateUpload = (material: string) => {
    setUploadedFiles((prev) => ({ ...prev, [material]: `${material}_${Date.now()}.jpg` }))
  }

  const handleConfirmSubmit = () => {
    const newApp: ServiceApplication = {
      id: `app${Date.now()}`,
      type: guide.category === "户政" ? "household" : guide.category === "治安" ? "no_criminal_record" : guide.category === "出入境" ? "entry_exit" : "other",
      typeName: guide.name,
      applicantName: form.name,
      applicantIdCard: form.idCard.slice(0, 4) + "********" + form.idCard.slice(-4),
      status: "pending",
      submitTime: new Date().toLocaleString("zh-CN"),
      updateTime: new Date().toLocaleString("zh-CN"),
      currentStep: 1,
      totalSteps: 4,
      materials: guide.requiredMaterials,
    }
    addApplication(newApp)
    addNotification({
      id: `notif_${Date.now()}`,
      title: "申办提交成功",
      content: `您提交的「${guide.name}」已受理，受理号：${newApp.id}，请留意办理进度推送。`,
      time: new Date().toLocaleString("zh-CN"),
      read: false,
    })
    setSubmittedApp(newApp)
    setStep(3)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-border sticky top-0 bg-white z-10">
          <h3 className="text-lg font-serif font-semibold text-primary">{guide.name}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-3 border-b border-neutral-border bg-primary-50/30">
          <ApplyStepIndicator currentStep={step} />
        </div>

        {step === 0 && (
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-primary-50 rounded-lg text-sm text-gov-blue">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>请如实填写申请信息，所有信息将严格保密</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">申请人姓名 <span className="text-gov-red">*</span></label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="请输入真实姓名" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">身份证号 <span className="text-gov-red">*</span></label>
              <input type="text" value={form.idCard} onChange={(e) => setForm((f) => ({ ...f, idCard: e.target.value }))} placeholder="请输入18位身份证号码" maxLength={18} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">联系电话 <span className="text-gov-red">*</span></label>
              <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="请输入手机号码" maxLength={11} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">联系地址</label>
              <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="请输入联系地址" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">申请用途</label>
              <textarea value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} placeholder="请简述申请用途" className="input-field min-h-[60px] resize-none" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={onClose} className="btn-secondary">取消</button>
              <button onClick={handleSubmitForm} disabled={!form.name || !form.idCard || !form.phone} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
                下一步：上传材料
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-amber-50 rounded-lg text-sm text-status-warning">
              <Upload className="w-4 h-4 shrink-0" />
              <span>请依次上传所需材料，支持 JPG/PDF 格式</span>
            </div>
            <div className="space-y-3">
              {guide.requiredMaterials.map((mat) => {
                const isUploaded = !!uploadedFiles[mat]
                return (
                  <div key={mat} className={`flex items-center justify-between p-3 rounded-lg border ${isUploaded ? "bg-green-50 border-status-success/30" : "bg-gray-50 border-neutral-border"}`}>
                    <div className="flex items-center gap-2">
                      {isUploaded ? <CheckCircle className="w-4 h-4 text-status-success" /> : <FileText className="w-4 h-4 text-neutral-slate" />}
                      <span className={`text-sm ${isUploaded ? "text-status-success font-medium" : "text-primary"}`}>{mat}</span>
                    </div>
                    {isUploaded ? (
                      <span className="text-xs text-status-success">已上传</span>
                    ) : (
                      <button onClick={() => handleSimulateUpload(mat)} className="flex items-center gap-1 text-xs text-gov-blue hover:text-primary-600 transition-colors px-2 py-1 rounded bg-gov-blue/5 hover:bg-gov-blue/10">
                        <Upload className="w-3.5 h-3.5" />
                        上传
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(0)} className="btn-secondary">上一步</button>
              <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-1.5">
                下一步：确认提交
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-primary-50 rounded-lg text-sm text-gov-blue">
              <Eye className="w-4 h-4 shrink-0" />
              <span>请确认以下申请信息无误后提交</span>
            </div>
            <div className="rounded-lg border border-neutral-border divide-y divide-neutral-border">
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-neutral-slate">申请人姓名</span>
                <span className="text-primary font-medium">{form.name}</span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-neutral-slate">身份证号</span>
                <span className="font-mono text-primary">{form.idCard.slice(0, 4) + "********" + form.idCard.slice(-4)}</span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-neutral-slate">联系电话</span>
                <span className="text-primary">{form.phone}</span>
              </div>
              {form.address && (
                <div className="px-4 py-3 flex justify-between text-sm">
                  <span className="text-neutral-slate">联系地址</span>
                  <span className="text-primary">{form.address}</span>
                </div>
              )}
              {form.purpose && (
                <div className="px-4 py-3 flex justify-between text-sm">
                  <span className="text-neutral-slate">申请用途</span>
                  <span className="text-primary">{form.purpose}</span>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-primary mb-2">上传材料</h4>
              <div className="space-y-1.5">
                {guide.requiredMaterials.map((mat) => (
                  <div key={mat} className="flex items-center gap-2 text-sm">
                    {uploadedFiles[mat] ? <CheckCircle className="w-4 h-4 text-status-success" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
                    <span className={uploadedFiles[mat] ? "text-status-success" : "text-amber-600"}>
                      {mat} {uploadedFiles[mat] ? "（已上传）" : "（未上传）"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(1)} className="btn-secondary">上一步</button>
              <button onClick={handleConfirmSubmit} className="btn-primary flex items-center gap-1.5">
                确认提交
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && submittedApp && (
          <div className="px-6 py-5">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-status-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-status-success" />
              </div>
              <h4 className="text-lg font-serif font-semibold text-primary mb-1">申请提交成功</h4>
              <p className="text-sm text-neutral-slate">您的「{guide.name}」申请已成功提交，请妥善保存回执</p>
            </div>
            <ReceiptView app={submittedApp} onPrint={() => window.print()} />
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={onClose} className="btn-secondary">返回大厅</button>
              <button onClick={onClose} className="btn-primary">查看我的申办</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailModal({ guide, onApply, onClose }: { guide: ServiceGuide; onApply: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl animate-slide-up overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-neutral-border px-6 py-5">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="badge-info">{guide.category}</span>
              <span className="text-xs text-neutral-slate">事项编码：{guide.id.toUpperCase()}</span>
            </div>
            <h3 className="text-xl font-serif font-semibold text-primary">{guide.name}</h3>
            <p className="mt-2 text-sm text-neutral-slate">{guide.description}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="w-5 h-5 text-neutral-slate" />
          </button>
        </div>
        <div className="grid gap-5 px-6 py-5 md:grid-cols-3">
          <div className="rounded-lg border border-neutral-border bg-primary-50/60 p-4">
            <Clock className="mb-2 h-5 w-5 text-gov-blue" />
            <p className="text-xs text-neutral-slate">办理时限</p>
            <p className="font-medium text-primary">{guide.processingTime}</p>
          </div>
          <div className="rounded-lg border border-neutral-border bg-primary-50/60 p-4">
            <DollarSign className="mb-2 h-5 w-5 text-gov-blue" />
            <p className="text-xs text-neutral-slate">收费标准</p>
            <p className="font-medium text-primary">{guide.fees}</p>
          </div>
          <div className="rounded-lg border border-neutral-border bg-primary-50/60 p-4">
            <Info className="mb-2 h-5 w-5 text-gov-blue" />
            <p className="text-xs text-neutral-slate">办理方式</p>
            <p className="font-medium text-primary">网上申请 · 进度推送</p>
          </div>
        </div>
        <div className="px-6 pb-5">
          <h4 className="mb-3 font-medium text-primary">申请材料</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {guide.requiredMaterials.map((material) => (
              <div key={material} className="flex items-center gap-2 rounded-lg border border-neutral-border px-3 py-2 text-sm text-primary">
                <CheckCircle className="h-4 w-4 text-status-success" />
                <span>{material}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-border px-6 py-4">
          <button onClick={onClose} className="btn-secondary">返回列表</button>
          <button onClick={onApply} className="btn-primary inline-flex items-center gap-1.5">
            立即申办
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Service() {
  const navigate = useNavigate()
  const { serviceId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeCategory, setActiveCategory] = useState("全部")
  const [selectedGuide, setSelectedGuide] = useState<ServiceGuide | null>(null)
  const [detailGuide, setDetailGuide] = useState<ServiceGuide | null>(null)
  const [keyword, setKeyword] = useState(searchParams.get("q") || "")
  const [receiptApp, setReceiptApp] = useState<ServiceApplication | null>(null)
  const [timelines, setTimelines] = useState<Record<string, TimelineEntry[]>>({})
  const { applications, updateApplicationStatus, addNotification } = useAppStore()
  const trimmedKeyword = keyword.trim()

  useEffect(() => {
    setKeyword(searchParams.get("q") || "")
  }, [searchParams])

  useEffect(() => {
    if (!serviceId) return
    const guide = mockServiceGuides.find((item) => item.id === serviceId)
    if (guide) {
      setDetailGuide(guide)
      setActiveCategory("全部")
    }
  }, [serviceId])

  useEffect(() => {
    setTimelines((prev) => {
      const next = { ...prev }
      let changed = false
      applications.forEach((app) => {
        if (!next[app.id]) {
          changed = true
          const entries: TimelineEntry[] = [{ label: "已提交", time: app.submitTime }]
          const idx = statusProgression.indexOf(app.status)
          if (idx >= 1) entries.push({ label: "已受理", time: app.updateTime })
          if (idx >= 2) entries.push({ label: "审核通过", time: app.updateTime })
          if (idx >= 3) entries.push({ label: "已办结", time: app.updateTime })
          if (app.status === "rejected") entries.push({ label: "已驳回", time: app.updateTime })
          next[app.id] = entries
        }
      })
      return changed ? next : prev
    })
  }, [applications])

  const filteredGuides = useMemo(() => {
    return mockServiceGuides.filter((guide) => {
      const categoryMatched = activeCategory === "全部" || guide.category === activeCategory
      return categoryMatched && guideMatchesKeyword(guide, trimmedKeyword)
    })
  }, [activeCategory, trimmedKeyword])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (trimmedKeyword) {
      next.set("q", trimmedKeyword)
    } else {
      next.delete("q")
    }
    setSearchParams(next)
  }

  const handleOpenDetail = (guide: ServiceGuide) => {
    const suffix = trimmedKeyword ? `?q=${encodeURIComponent(trimmedKeyword)}` : ""
    navigate(`/service/${guide.id}${suffix}`)
    setDetailGuide(guide)
  }

  const handleCloseDetail = () => {
    setDetailGuide(null)
    const suffix = trimmedKeyword ? `?q=${encodeURIComponent(trimmedKeyword)}` : ""
    navigate(`/service${suffix}`)
  }

  const handleAdvanceStatus = (app: ServiceApplication) => {
    const currentIdx = statusProgression.indexOf(app.status)
    if (currentIdx >= statusProgression.length - 1) return
    const nextStatus = statusProgression[currentIdx + 1]
    const now = new Date().toLocaleString("zh-CN")
    updateApplicationStatus(app.id, nextStatus)
    addNotification({
      id: `notif_${Date.now()}`,
      title: `${app.typeName}进度更新`,
      content: `您申请的「${app.typeName}」状态已更新为：${statusLabels[nextStatus]}，请留意后续推送。`,
      time: now,
      read: false,
    })
    setTimelines((prev) => ({
      ...prev,
      [app.id]: [...(prev[app.id] || []), { label: statusLabels[nextStatus], time: now }],
    }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h2 className="section-title">办事大厅</h2>
        <p className="text-neutral-slate mt-2 ml-3">在线办理各类公安政务服务事项，全程留痕、进度推送</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-xl border border-neutral-border bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-neutral-border bg-neutral-bg px-3">
          <Search className="h-4 w-4 text-gov-blue" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-primary outline-none"
            placeholder="搜索事项名称、分类、材料或办理时限"
          />
        </div>
        <button type="submit" className="btn-primary px-5 py-2.5">搜索</button>
        {trimmedKeyword && (
          <button
            type="button"
            onClick={() => {
              setKeyword("")
              setSearchParams({})
            }}
            className="btn-secondary px-5 py-2.5"
          >
            清空
          </button>
        )}
      </form>

      <div className="flex gap-1 border-b border-neutral-border">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
              activeCategory === cat
                ? "text-gov-blue"
                : "text-neutral-slate hover:text-primary"
            }`}
          >
            {cat}
            {activeCategory === cat && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gov-blue rounded-full" />
            )}
          </button>
        ))}
      </div>

      {(trimmedKeyword || activeCategory !== "全部") && (
        <div className="rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary">
          当前筛选：{activeCategory}
          {trimmedKeyword && <span> · 关键词"{trimmedKeyword}"</span>}
          <span className="ml-2 text-neutral-slate">共 {filteredGuides.length} 个事项</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGuides.map((guide) => (
          <div key={guide.id} className="card p-5 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-semibold text-primary">{guide.name}</h3>
              <span className="badge-info shrink-0">{guide.category}</span>
            </div>
            <p className="text-sm text-neutral-slate mb-4 flex-1">{guide.description}</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-neutral-slate">
                <Clock className="w-4 h-4 text-gov-blue shrink-0" />
                <span>办理时限：{guide.processingTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-slate">
                <DollarSign className="w-4 h-4 text-gov-blue shrink-0" />
                <span>收费标准：{guide.fees}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-neutral-slate">
                <FileText className="w-4 h-4 text-gov-blue shrink-0 mt-0.5" />
                <span>所需材料：{guide.requiredMaterials.join("、")}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOpenDetail(guide)}
                className="btn-secondary flex items-center justify-center gap-1.5 px-3"
              >
                查看详情
                <Info className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedGuide(guide)}
                className="btn-primary flex items-center justify-center gap-1.5 px-3"
              >
                立即申办
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredGuides.length === 0 && (
        <div className="text-center py-12 text-neutral-slate">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>暂无该分类下的服务事项</p>
        </div>
      )}

      <div>
        <h2 className="section-title mb-5">我的申办进度</h2>
        <div className="flex items-center gap-2 text-sm text-neutral-slate mb-4 ml-4">
          <Bell className="w-4 h-4 text-gov-blue" />
          <span>审核结果和办理进度将通过通知主动推送</span>
        </div>
        {applications.length === 0 ? (
          <div className="card p-8 text-center text-neutral-slate">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无申办记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const canAdvance = app.status !== "completed" && app.status !== "rejected"
              const nextIdx = statusProgression.indexOf(app.status) + 1
              const nextStatus = statusProgression[nextIdx]
              const tl = timelines[app.id] || []
              return (
                <div key={app.id} className="card p-5">
                  <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-semibold text-primary">{app.typeName}</h4>
                        <span className={statusBadge[app.status]}>{statusLabels[app.status]}</span>
                      </div>
                      <p className="text-sm text-neutral-slate mt-1">申请人：{app.applicantName}</p>
                      <p className="text-sm text-neutral-slate">受理号：{app.id}</p>
                      <p className="text-sm text-neutral-slate">提交时间：{app.submitTime}</p>
                      {app.status !== "pending" && (
                        <p className="text-sm text-neutral-slate">更新时间：{app.updateTime}</p>
                      )}

                      <div className="mt-3 p-3 bg-primary-50/50 rounded-lg border border-gov-blue/10 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-3.5 h-3.5 text-gov-blue" />
                          <span className="text-neutral-slate">经办民警：</span>
                          <span className="font-medium text-primary">{app.status === "pending" ? "待分配" : "王建国 警号 GZ202301056"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-3.5 h-3.5 text-gov-blue" />
                          <span className="text-neutral-slate">审批民警：</span>
                          <span className="font-medium text-primary">{app.status === "pending" || app.status === "processing" ? "待审批" : "刘志远 警号 GZ202201012"}</span>
                        </div>
                        {(app.status === "approved" || app.status === "completed") && (
                          <div className="flex items-start gap-2 text-sm pt-1 border-t border-gov-blue/10">
                            <Stamp className="w-3.5 h-3.5 text-status-success mt-0.5" />
                            <div>
                              <span className="text-neutral-slate">审批意见：</span>
                              <span className="text-status-success font-medium">材料齐全，符合办理条件，予以批准。</span>
                            </div>
                          </div>
                        )}
                        {app.status === "rejected" && (
                          <div className="flex items-start gap-2 text-sm pt-1 border-t border-status-error/10">
                            <AlertCircle className="w-3.5 h-3.5 text-status-error mt-0.5" />
                            <div>
                              <span className="text-neutral-slate">驳回原因：</span>
                              <span className="text-status-error font-medium">申请材料不完整，请补充户籍所在地派出所开具的证明后重新提交。</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {app.status === "completed" && (
                        <div className="mt-3 p-3 bg-status-success/5 rounded-lg border border-status-success/20 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-status-success">
                            <CheckCircle className="w-4 h-4" />
                            <span>办结凭证</span>
                          </div>
                          <div className="text-xs text-neutral-slate space-y-1 pl-6">
                            <p>凭证编号：BZ{app.id.replace(/\D/g, "").padStart(10, "0")}</p>
                            <p>办结时间：{app.updateTime}</p>
                            <p>办理结果：已办结送达</p>
                          </div>
                          <div className="flex items-start gap-2 text-sm pt-1 border-t border-status-success/10">
                            <MessageSquare className="w-3.5 h-3.5 text-status-success mt-0.5" />
                            <div>
                              <span className="text-neutral-slate">结果领取：</span>
                              <span className="text-primary font-medium">电子证照已推送至您的电子证照中心，纸质证明可选择邮寄或到贵阳市公安局户政大厅自取。</span>
                            </div>
                          </div>
                          <button className="btn-secondary text-xs py-1 px-3 mt-1 flex items-center gap-1.5">
                            <Download className="w-3.5 h-3.5" />
                            下载电子凭证
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {canAdvance && (
                          <button
                            onClick={() => handleAdvanceStatus(app)}
                            className="text-xs px-3 py-1.5 rounded-md bg-gov-blue/10 text-gov-blue hover:bg-gov-blue/20 transition-colors font-medium"
                          >
                            模拟推进至{nextStatus ? statusLabels[nextStatus] : ""}
                          </button>
                        )}
                        <button
                          onClick={() => setReceiptApp(app)}
                          className="text-xs px-3 py-1.5 rounded-md bg-gray-100 text-neutral-slate hover:bg-gray-200 transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          查看回执
                        </button>
                      </div>
                      <NotificationTimeline entries={tl} />
                    </div>
                    <div className="md:border-l md:border-neutral-border md:pl-6">
                      <StepProgressBar currentStep={app.currentStep} totalSteps={app.totalSteps} status={app.status} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedGuide && (
        <ApplyModal guide={selectedGuide} onClose={() => setSelectedGuide(null)} />
      )}

      {detailGuide && (
        <DetailModal
          guide={detailGuide}
          onClose={handleCloseDetail}
          onApply={() => {
            setSelectedGuide(detailGuide)
            setDetailGuide(null)
          }}
        />
      )}

      {receiptApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReceiptApp(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-border">
              <h3 className="text-lg font-serif font-semibold text-primary">受理回执</h3>
              <button onClick={() => setReceiptApp(null)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <ReceiptView app={receiptApp} onPrint={() => window.print()} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
