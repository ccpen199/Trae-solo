import { useState } from "react"
import {
  Search,
  CreditCard,
  AlertTriangle,
  Upload,
  Car,
  MapPin,
  Calendar,
  FileText,
  X,
  CheckCircle,
  Clock,
  Video,
  Bell,
  Receipt,
  Wallet,
  Smartphone,
  ChevronRight,
  Eye,
  ArrowRight,
  Check,
  Download,
  QrCode,
  ShieldCheck,
  AlertCircle,
  PlayCircle,
  ArrowUpRight,
} from "lucide-react"
import { useAppStore } from "@/stores/useAppStore"
import { mockAccidents } from "@/lib/mockData"
import type { AccidentReport, TrafficViolation } from "@/lib/mockData"

type TabKey = "query" | "pay" | "accident"

const tabs: { key: TabKey; label: string; icon: typeof Search }[] = [
  { key: "query", label: "违法查询", icon: Search },
  { key: "pay", label: "罚款缴纳", icon: CreditCard },
  { key: "accident", label: "事故快处", icon: AlertTriangle },
]

const statusMap: Record<string, { label: string; badge: string }> = {
  unpaid: { label: "未缴", badge: "badge-error" },
  paid: { label: "已缴", badge: "badge-success" },
  appealing: { label: "申诉中", badge: "badge-warning" },
}

const accidentStatusMap: Record<string, { label: string; badge: string }> = {
  submitted: { label: "已提交", badge: "badge-info" },
  processing: { label: "处理中", badge: "badge-warning" },
  resolved: { label: "已解决", badge: "badge-success" },
}

function generateReceiptNumber() {
  const prefix = "GZ"
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`
  const seq = String(Math.floor(Math.random() * 900000 + 100000))
  return `${prefix}${dateStr}${seq}`
}

type PayStep = "confirm" | "method" | "paying" | "success" | "receipt"

function PaymentModal({
  violation,
  onClose,
  onPay,
}: {
  violation: TrafficViolation
  onClose: () => void
  onPay: (receiptNumber: string) => void
}) {
  const [step, setStep] = useState<PayStep>("confirm")
  const [payMethod, setPayMethod] = useState<"wechat" | "alipay" | "bank">("wechat")
  const [receiptNumber, setReceiptNumber] = useState("")
  const [payTime, setPayTime] = useState("")

  const handleMethodConfirm = () => {
    setStep("paying")
    setTimeout(() => {
      const rn = generateReceiptNumber()
      setReceiptNumber(rn)
      setPayTime(new Date().toLocaleString("zh-CN"))
      onPay(rn)
      setStep("success")
    }, 1500)
  }

  const payMethodLabel = payMethod === "wechat" ? "微信支付" : payMethod === "alipay" ? "支付宝" : "银行卡"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slide-up overflow-hidden max-h-[90vh] overflow-y-auto">
        {step === "confirm" && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-border">
              <h3 className="text-lg font-serif font-semibold text-primary">确认缴费信息</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-neutral-slate">车牌号</span><span className="text-primary font-medium">{violation.plateNumber}</span></div>
              <div className="flex justify-between text-sm"><span className="text-neutral-slate">违法类型</span><span className="text-primary">{violation.violationType}</span></div>
              <div className="flex justify-between text-sm"><span className="text-neutral-slate">违法日期</span><span className="text-primary">{violation.violationDate.split(" ")[0]}</span></div>
              <div className="flex justify-between text-sm"><span className="text-neutral-slate">违法地点</span><span className="text-primary">{violation.location}</span></div>
              {violation.points > 0 && (
                <div className="flex justify-between text-sm"><span className="text-neutral-slate">扣分</span><span className="text-gov-red font-semibold">-{violation.points}分</span></div>
              )}
              <div className="border-t border-neutral-border pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-primary font-medium">缴费金额</span>
                  <span className="text-2xl font-bold text-gov-red">¥{violation.fine}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-neutral-border">
              <button onClick={onClose} className="btn-secondary flex-1">取消</button>
              <button onClick={() => setStep("method")} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                选择支付方式 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {step === "method" && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-border">
              <h3 className="text-lg font-serif font-semibold text-primary">选择支付方式</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="p-3 bg-neutral-bg rounded-lg mb-4 text-center">
                <span className="text-sm text-neutral-slate">应缴金额</span>
                <p className="text-2xl font-bold text-gov-red">¥{violation.fine}</p>
              </div>
              {[
                { key: "wechat" as const, label: "微信支付", icon: <Smartphone className="w-5 h-5 text-green-500" /> },
                { key: "alipay" as const, label: "支付宝", icon: <Wallet className="w-5 h-5 text-blue-500" /> },
                { key: "bank" as const, label: "银行卡支付", icon: <CreditCard className="w-5 h-5 text-gov-blue" /> },
              ].map((method) => (
                <button
                  key={method.key}
                  onClick={() => setPayMethod(method.key)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    payMethod === method.key ? "border-gov-blue bg-primary-50/50" : "border-neutral-border hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {method.icon}
                    <span className="text-sm font-medium text-primary">{method.label}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    payMethod === method.key ? "border-gov-blue" : "border-gray-300"
                  }`}>
                    {payMethod === method.key && <div className="w-3 h-3 rounded-full bg-gov-blue" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-neutral-border">
              <button onClick={() => setStep("confirm")} className="btn-secondary flex-1">上一步</button>
              <button onClick={handleMethodConfirm} className="btn-primary flex-1">确认支付</button>
            </div>
          </>
        )}

        {step === "paying" && (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-primary font-medium">支付处理中...</p>
            <p className="text-sm text-neutral-slate mt-1">请稍候，切勿关闭页面</p>
          </div>
        )}

        {step === "success" && (
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 bg-status-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-status-success" />
            </div>
            <h4 className="text-lg font-serif font-semibold text-primary mb-2">缴费成功</h4>
            <div className="bg-neutral-bg rounded-lg p-4 text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm"><span className="text-neutral-slate">车牌号</span><span className="text-primary">{violation.plateNumber}</span></div>
              <div className="flex justify-between text-sm"><span className="text-neutral-slate">违法类型</span><span className="text-primary">{violation.violationType}</span></div>
              <div className="flex justify-between text-sm"><span className="text-neutral-slate">缴费金额</span><span className="text-gov-red font-semibold">¥{violation.fine}</span></div>
              <div className="flex justify-between text-sm"><span className="text-neutral-slate">支付方式</span><span className="text-primary">{payMethodLabel}</span></div>
              <div className="flex justify-between text-sm"><span className="text-neutral-slate">缴费时间</span><span className="text-primary">{payTime}</span></div>
              <div className="flex justify-between text-sm"><span className="text-neutral-slate">凭证编号</span><span className="text-gov-blue font-medium">{receiptNumber}</span></div>
            </div>
            <button onClick={() => setStep("receipt")} className="btn-primary flex items-center justify-center gap-2 mx-auto">
              查看电子缴费凭证 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === "receipt" && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-border">
              <h3 className="text-lg font-serif font-semibold text-primary">电子缴费凭证</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5">
              <div className="border-2 border-dashed border-gov-blue/30 rounded-xl p-5 bg-primary-50/20">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-gov-blue" />
                    <span className="text-base font-serif font-bold text-gov-blue">贵州省公安厅交通管理缴费凭证</span>
                  </div>
                  <div className="text-xs text-neutral-slate">Guizhou Provincial Public Security Traffic Payment Receipt</div>
                </div>

                <div className="bg-white rounded-lg p-4 space-y-2 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-neutral-slate">凭证编号</span><span className="text-gov-blue font-semibold">{receiptNumber}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-neutral-slate">车牌号</span><span className="text-primary font-medium">{violation.plateNumber}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-neutral-slate">违法类型</span><span className="text-primary">{violation.violationType}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-neutral-slate">违法地点</span><span className="text-primary">{violation.location}</span></div>
                  {violation.points > 0 && (
                    <div className="flex justify-between text-sm"><span className="text-neutral-slate">扣分</span><span className="text-gov-red font-semibold">-{violation.points}分</span></div>
                  )}
                  <div className="border-t border-neutral-border pt-2 flex justify-between text-sm"><span className="text-neutral-slate font-medium">缴费金额</span><span className="text-gov-red font-bold text-lg">¥{violation.fine}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-neutral-slate">支付方式</span><span className="text-primary">{payMethodLabel}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-neutral-slate">缴费时间</span><span className="text-primary">{payTime}</span></div>
                </div>

                <div className="flex flex-col items-center mb-4">
                  <div className="w-32 h-32 bg-white border border-neutral-border rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="w-16 h-16 text-gray-300 mx-auto" />
                      <p className="text-[10px] text-neutral-slate mt-1">扫码验证凭证真伪</p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-neutral-slate space-y-0.5">
                  <p>本凭证由贵州省公安厅交通管理局系统自动生成</p>
                  <p>凭证编号可登录贵州公安政务服务网验证真伪</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-neutral-border">
              <button onClick={onClose} className="btn-secondary flex-1">关闭</button>
              <button className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />下载凭证
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function VideoUploadConfirmDialog({
  videoIndex,
  onConfirm,
  onCancel,
}: {
  videoIndex: number
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full animate-slide-up overflow-hidden">
        <div className="px-6 py-5 text-center">
          <div className="w-14 h-14 bg-status-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-status-warning" />
          </div>
          <h4 className="text-base font-semibold text-primary mb-2">视频取证确认</h4>
          <p className="text-sm text-neutral-slate">
            确认视频取证材料已上传？
          </p>
          <p className="text-xs text-neutral-slate mt-1">
            视频 {videoIndex} - 请确认视频内容清晰完整，上传后不可修改
          </p>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-border">
          <button onClick={onCancel} className="btn-secondary flex-1">取消</button>
          <button onClick={onConfirm} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" />确认上传
          </button>
        </div>
      </div>
    </div>
  )
}

function AccidentDetailModal({
  accident,
  onClose,
}: {
  accident: AccidentReport
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full animate-slide-up overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-border">
          <h3 className="text-lg font-serif font-semibold text-primary">事故处理详情</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-neutral-slate" /><span className="text-neutral-slate">事故时间</span></div>
            <p className="text-primary font-medium pl-6">{accident.accidentDate}</p>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-neutral-slate" /><span className="text-neutral-slate">事故地点</span></div>
            <p className="text-primary font-medium pl-6">{accident.location}</p>
            <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-neutral-slate" /><span className="text-neutral-slate">事故描述</span></div>
            <p className="text-primary pl-6">{accident.description}</p>
          </div>

          <div className="border-t border-neutral-border pt-4">
            <h4 className="text-sm font-semibold text-primary mb-3">处理进度</h4>
            <div className="space-y-3">
              {[
                { label: "事故上报", done: true, time: accident.accidentDate },
                { label: "视频取证审核", done: accident.status !== "submitted", time: accident.status !== "submitted" ? "2026-06-03 10:00" : undefined },
                { label: "责任认定", done: accident.status === "resolved", time: accident.status === "resolved" ? "2026-06-05 14:30" : undefined },
                { label: "处理完成", done: accident.status === "resolved", time: accident.status === "resolved" ? "2026-06-06 09:00" : undefined },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    s.done ? "bg-status-success text-white" : "bg-gray-200 text-gray-400"
                  }`}>
                    {s.done ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px]">{i + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm ${s.done ? "text-status-success font-medium" : "text-gray-400"}`}>{s.label}</span>
                  </div>
                  {s.time && <span className="text-xs text-neutral-slate">{s.time}</span>}
                </div>
              ))}
            </div>
          </div>

          {accident.videoCount > 0 && (
            <div className="border-t border-neutral-border pt-4">
              <h4 className="text-sm font-semibold text-primary mb-3">视频取证材料</h4>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: accident.videoCount }).map((_, i) => (
                  <div key={i} className="bg-neutral-bg rounded-lg p-4 flex flex-col items-center justify-center">
                    <PlayCircle className="w-8 h-8 text-gov-blue mb-2" />
                    <span className="text-xs text-neutral-slate">取证视频 {i + 1}</span>
                    <span className="text-[10px] text-status-success mt-1 flex items-center gap-0.5">
                      <Check className="w-3 h-3" />已确认
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-neutral-border pt-4">
            <h4 className="text-sm font-semibold text-primary mb-3">处理结果回传</h4>
            {accident.status === "resolved" && (
              <div className="space-y-3">
                <div className="p-4 bg-status-success/5 rounded-lg border border-status-success/20">
                  <div className="flex items-center gap-2 text-sm text-status-success font-medium mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>处理结果已回传</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-neutral-slate mt-0.5 shrink-0" />
                      <div>
                        <span className="text-neutral-slate">结果文书：</span>
                        <span className="text-primary">交通事故认定书第{accident.id.replace("acc", "2026")}号</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-neutral-slate mt-0.5 shrink-0" />
                      <div>
                        <span className="text-neutral-slate">责任认定：</span>
                        <span className="text-primary">对方全责</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Receipt className="w-4 h-4 text-neutral-slate mt-0.5 shrink-0" />
                      <div>
                        <span className="text-neutral-slate">赔偿详情：</span>
                        <span className="text-gov-red font-semibold">¥3,800</span>
                        <span className="text-neutral-slate ml-1">（车辆维修费），已由对方保险公司确认赔付</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-slate">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>相关文书已推送至您的个人中心，可在"我的文书"中查看下载</span>
                </div>
              </div>
            )}

            {accident.status === "processing" && (
              <div className="p-4 bg-status-warning/5 rounded-lg border border-status-warning/20">
                <div className="flex items-center gap-2 text-sm text-status-warning font-medium mb-2">
                  <Clock className="w-4 h-4" />
                  <span>正在处理中</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-neutral-slate mt-0.5 shrink-0" />
                    <div>
                      <span className="text-neutral-slate">当前步骤：</span>
                      <span className="text-primary">视频取证审核 & 责任认定</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-neutral-slate mt-0.5 shrink-0" />
                    <div>
                      <span className="text-neutral-slate">预计完成：</span>
                      <span className="text-primary">3-5个工作日</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-neutral-slate mt-3">交警部门正在审核视频取证材料并联系双方当事人进行责任认定，结果将主动推送至您的通知中心。</p>
              </div>
            )}

            {accident.status === "submitted" && (
              <div className="p-4 bg-status-info/5 rounded-lg border border-status-info/20">
                <div className="flex items-center gap-2 text-sm text-status-info font-medium mb-2">
                  <Clock className="w-4 h-4" />
                  <span>等待交警受理</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-neutral-slate mt-0.5 shrink-0" />
                    <div>
                      <span className="text-neutral-slate">预计响应时间：</span>
                      <span className="text-primary">24小时内</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-neutral-slate mt-3">您的事故上报已提交，交警部门将在24小时内受理并安排视频取证审核，请保持电话畅通。</p>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-neutral-border">
          <button onClick={onClose} className="btn-primary w-full">关闭</button>
        </div>
      </div>
    </div>
  )
}

export default function Traffic() {
  const [activeTab, setActiveTab] = useState<TabKey>("query")
  const [plateNumber, setPlateNumber] = useState("贵A·12345")
  const [payModalId, setPayModalId] = useState<string | null>(null)
  const [selectedAccident, setSelectedAccident] = useState<AccidentReport | null>(null)
  const [accidentForm, setAccidentForm] = useState({ date: "", location: "", description: "" })
  const [uploadedVideos, setUploadedVideos] = useState(0)
  const [confirmedVideos, setConfirmedVideos] = useState<number[]>([])
  const [videoConfirmIndex, setVideoConfirmIndex] = useState<number | null>(null)
  const [accidentSubmitStep, setAccidentSubmitStep] = useState<"form" | "video-confirm" | "success">("form")
  const [localAccidents, setLocalAccidents] = useState<AccidentReport[]>(mockAccidents)
  const [receiptNumbers, setReceiptNumbers] = useState<Record<string, string>>({})
  const [receiptTimes, setReceiptTimes] = useState<Record<string, string>>({})

  const { violations, payViolation, addNotification } = useAppStore()

  const unpaidViolations = violations.filter((v) => v.status === "unpaid")
  const paidViolations = violations.filter((v) => v.status === "paid")
  const payingViolation = violations.find((v) => v.id === payModalId)

  const handlePayComplete = (receiptNumber: string) => {
    if (payModalId) {
      payViolation(payModalId)
      setReceiptNumbers((prev) => ({ ...prev, [payModalId]: receiptNumber }))
      setReceiptTimes((prev) => ({ ...prev, [payModalId]: new Date().toLocaleString("zh-CN") }))
      addNotification({
        id: `notif_${Date.now()}`,
        title: "罚款缴纳成功",
        content: `车牌${payingViolation?.plateNumber}的${payingViolation?.violationType}罚款¥${payingViolation?.fine}已缴纳完成。凭证编号：${receiptNumber}`,
        time: new Date().toLocaleString("zh-CN"),
        read: false,
      })
    }
  }

  const handlePayModalClose = () => {
    setPayModalId(null)
  }

  const handleVideoUpload = () => {
    if (uploadedVideos < 3) {
      setVideoConfirmIndex(uploadedVideos + 1)
    }
  }

  const handleVideoConfirm = () => {
    if (videoConfirmIndex !== null) {
      setUploadedVideos((prev) => Math.min(prev + 1, 3))
      setConfirmedVideos((prev) => [...prev, videoConfirmIndex])
      setVideoConfirmIndex(null)
    }
  }

  const handleVideoConfirmCancel = () => {
    setVideoConfirmIndex(null)
  }

  const handleAccidentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (confirmedVideos.length === 0 && uploadedVideos === 0) {
      setAccidentSubmitStep("video-confirm")
      return
    }
    const newReport: AccidentReport = {
      id: `acc${Date.now()}`,
      reporterName: "张三",
      accidentDate: accidentForm.date,
      location: accidentForm.location,
      description: accidentForm.description,
      videoCount: uploadedVideos,
      status: "submitted",
    }
    setLocalAccidents((prev) => [newReport, ...prev])
    addNotification({
      id: `notif_${Date.now()}`,
      title: "事故快处上报成功",
      content: `您的事故上报已受理，编号${newReport.id}，交警将尽快联系您进行视频取证。`,
      time: new Date().toLocaleString("zh-CN"),
      read: false,
    })
    setAccidentForm({ date: "", location: "", description: "" })
    setUploadedVideos(0)
    setConfirmedVideos([])
    setAccidentSubmitStep("success")
  }

  const handleAdvanceStatus = (accidentId: string, currentStatus: AccidentReport["status"]) => {
    const nextStatus: AccidentReport["status"] = currentStatus === "submitted" ? "processing" : "resolved"
    const statusLabel = accidentStatusMap[nextStatus].label
    setLocalAccidents((prev) =>
      prev.map((a) => (a.id === accidentId ? { ...a, status: nextStatus } : a))
    )
    addNotification({
      id: `notif_${Date.now()}`,
      title: "事故处理状态更新",
      content: `事故编号${accidentId}状态已变更为「${statusLabel}」${
        nextStatus === "processing"
          ? "，交警部门已开始审核视频取证材料。"
          : nextStatus === "resolved"
          ? "，责任认定已完成，处理结果已回传。"
          : ""
      }`,
      time: new Date().toLocaleString("zh-CN"),
      read: false,
    })
    if (selectedAccident?.id === accidentId) {
      setSelectedAccident((prev) => (prev ? { ...prev, status: nextStatus } : prev))
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gov-blue/10 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-gov-blue" />
          </div>
          <h1 className="section-title">交管服务</h1>
        </div>
        <p className="text-gray-500 text-sm ml-13">交通违法查询、罚款缴纳、事故快速处理</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.key ? "bg-white text-primary-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === "query" && (
        <div>
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-5 h-5 text-gov-blue" />
              <h2 className="text-lg font-semibold text-gray-800">违法记录查询</h2>
            </div>
            <div className="flex gap-3">
              <input type="text" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="请输入车牌号" className="input-field flex-1" />
              <button className="btn-primary flex items-center gap-2"><Search className="w-4 h-4" />查询</button>
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">车牌号</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">违法类型</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">日期</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">地点</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">罚款(元)</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">扣分</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v) => {
                    const s = statusMap[v.status]
                    return (
                      <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-800">{v.plateNumber}</td>
                        <td className="py-3 px-4 text-gray-700">{v.violationType}</td>
                        <td className="py-3 px-4 text-gray-500">{v.violationDate.split(" ")[0]}</td>
                        <td className="py-3 px-4 text-gray-500">{v.location}</td>
                        <td className="py-3 px-4 text-right text-gov-red font-semibold">¥{v.fine}</td>
                        <td className="py-3 px-4 text-center">
                          {v.points > 0 ? <span className="text-gov-red font-semibold">-{v.points}</span> : <span className="text-gray-400">0</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={s.badge}>{s.label}</span>
                          {v.status === "unpaid" && (
                            <button onClick={() => setPayModalId(v.id)} className="ml-2 text-xs text-gov-blue hover:underline">去缴费</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "pay" && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-gov-blue" />
            <h2 className="text-lg font-semibold text-gray-800">待缴罚款</h2>
            <span className="badge-error">{unpaidViolations.length} 条未缴</span>
          </div>
          {unpaidViolations.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500">暂无待缴罚款</p>
            </div>
          ) : (
            <div className="space-y-4">
              {unpaidViolations.map((v) => (
                <div key={v.id} className="card p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="w-4 h-4 text-gov-blue" />
                        <span className="font-medium text-gray-800">{v.plateNumber}</span>
                        <span className="badge-error">未缴</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-500">
                        <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /><span>{v.violationType}</span></div>
                        <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /><span>{v.violationDate.split(" ")[0]}</span></div>
                        <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /><span>{v.location}</span></div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-gov-red">¥{v.fine}</div>
                      {v.points > 0 && <div className="text-sm text-gray-500 mt-1">扣{v.points}分</div>}
                      <button onClick={() => setPayModalId(v.id)} className="btn-danger mt-3 text-sm">立即缴费</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gov-blue" />
              缴费凭证
            </h3>
            {paidViolations.length === 0 ? (
              <div className="text-center py-6 text-sm text-neutral-slate">暂无缴费凭证</div>
            ) : (
              <div className="space-y-3">
                {paidViolations.map((v) => {
                  const rn = receiptNumbers[v.id] || `GZ20260609${v.id.replace("v", "0").padEnd(6, "0").slice(-6)}`
                  const pt = receiptTimes[v.id] || v.violationDate
                  return (
                    <div key={v.id} className="card p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-primary text-sm">{v.violationType}</span>
                            <span className="badge-success">已缴</span>
                          </div>
                          <p className="text-xs text-neutral-slate">{v.plateNumber} | {v.violationDate.split(" ")[0]}</p>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-gov-blue">
                            <Receipt className="w-3 h-3" />
                            <span>凭证编号：{rn}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-slate mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>缴费时间：{pt}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-primary">¥{v.fine}</span>
                          <div className="mt-2">
                            <button className="text-xs text-gov-blue flex items-center gap-1 hover:underline">
                              <Eye className="w-3 h-3" />查看凭证
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "accident" && (
        <div>
          {accidentSubmitStep === "form" && (
            <div className="card p-6 mb-6">
              <div className="flex items-center gap-3 mb-5">
                <AlertTriangle className="w-5 h-5 text-gov-blue" />
                <h2 className="text-lg font-semibold text-gray-800">事故快速上报</h2>
              </div>
              <form onSubmit={handleAccidentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">事故日期 <span className="text-gov-red">*</span></label>
                    <input type="date" value={accidentForm.date} onChange={(e) => setAccidentForm((f) => ({ ...f, date: e.target.value }))} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">事故地点 <span className="text-gov-red">*</span></label>
                    <input type="text" value={accidentForm.location} onChange={(e) => setAccidentForm((f) => ({ ...f, location: e.target.value }))} placeholder="请输入事故发生地点" className="input-field" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">事故描述 <span className="text-gov-red">*</span></label>
                  <textarea value={accidentForm.description} onChange={(e) => setAccidentForm((f) => ({ ...f, description: e.target.value }))} placeholder="请详细描述事故经过，包括车辆碰撞部位、人员伤亡等" className="input-field min-h-[80px] resize-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    视频取证 <span className="text-gov-red">*</span>
                    {uploadedVideos > 0 && (
                      <span className="text-neutral-slate font-normal ml-2">（已上传 {uploadedVideos}/3，已确认 {confirmedVideos.length}/{uploadedVideos}）</span>
                    )}
                  </label>
                  <div
                    onClick={handleVideoUpload}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                      uploadedVideos >= 3 ? "border-green-300 bg-green-50/30" : "border-gray-300 hover:border-gov-blue/50"
                    }`}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">点击上传事故现场视频</p>
                    <p className="text-xs text-gray-400 mt-1">支持 MP4、AVI 格式，单文件不超过 200MB，最多3个</p>
                    {uploadedVideos > 0 && (
                      <div className="mt-3 flex items-center justify-center gap-2">
                        {Array.from({ length: uploadedVideos }).map((_, i) => {
                          const isConfirmed = confirmedVideos.includes(i + 1)
                          return (
                            <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              isConfirmed ? "bg-status-success/10 text-status-success" : "bg-status-warning/10 text-status-warning"
                            }`}>
                              <Video className="w-3 h-3" />
                              <span>视频{i + 1}</span>
                              {isConfirmed ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  {uploadedVideos > 0 && confirmedVideos.length < uploadedVideos && (
                    <div className="mt-2 p-3 bg-status-warning/5 rounded-lg border border-status-warning/20">
                      <div className="flex items-center gap-2 text-xs text-status-warning">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>请确认所有视频取证材料：{uploadedVideos - confirmedVideos.length} 个视频待确认</span>
                      </div>
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={uploadedVideos === 0 || confirmedVideos.length < uploadedVideos}>
                  提交上报 <ArrowRight className="w-4 h-4" />
                </button>
                {(uploadedVideos === 0 || confirmedVideos.length < uploadedVideos) && (
                  <p className="text-xs text-center text-neutral-slate">请上传并确认所有视频取证材料后方可提交</p>
                )}
              </form>
            </div>
          )}

          {accidentSubmitStep === "video-confirm" && (
            <div className="card p-8 text-center mb-6">
              <div className="w-14 h-14 bg-status-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-7 h-7 text-status-warning" />
              </div>
              <h4 className="text-lg font-serif font-semibold text-primary mb-2">视频取证确认</h4>
              <p className="text-sm text-neutral-slate mb-4">请确认所有视频取证材料已上传并审核通过后再提交事故上报。</p>
              <div className="bg-neutral-bg rounded-lg p-4 text-left space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Upload className="w-4 h-4 text-gov-blue" />
                  <span className="text-primary font-medium">上传视频取证材料</span>
                  {uploadedVideos === 0 ? <span className="badge-error">未上传</span> : <span className="badge-success">已上传{uploadedVideos}个</span>}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-gov-blue" />
                  <span className="text-primary font-medium">确认视频取证</span>
                  {confirmedVideos.length === uploadedVideos && uploadedVideos > 0 ? <span className="badge-success">已确认</span> : <span className="badge-warning">待确认</span>}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAccidentSubmitStep("form")} className="btn-secondary flex-1">返回填写</button>
              </div>
            </div>
          )}

          {accidentSubmitStep === "success" && (
            <div className="card p-8 text-center mb-6">
              <div className="w-16 h-16 bg-status-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-9 h-9 text-status-success" />
              </div>
              <h4 className="text-lg font-serif font-semibold text-primary mb-2">事故上报成功</h4>
              <p className="text-sm text-neutral-slate mb-4">交警部门将尽快联系您进行视频取证和责任认定。</p>
              <div className="bg-primary-50 rounded-lg p-4 text-left space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm"><Bell className="w-4 h-4 text-gov-blue" /><span className="text-primary font-medium">后续进度推送</span></div>
                <p className="text-xs text-neutral-slate pl-6">视频取证审核结果、责任认定书、处理结果等将主动推送至您的通知中心。</p>
              </div>
              <button onClick={() => { setAccidentSubmitStep("form"); setUploadedVideos(0); setConfirmedVideos([]); }} className="btn-primary">继续上报</button>
            </div>
          )}

          <div>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-gov-blue" />
              <h2 className="text-lg font-semibold text-gray-800">上报记录</h2>
            </div>
            <div className="space-y-3">
              {localAccidents.map((acc) => {
                const s = accidentStatusMap[acc.status]
                const canAdvance = acc.status !== "resolved"
                return (
                  <div key={acc.id} className="card p-5 cursor-pointer hover:border-gov-blue/30 transition-colors">
                    <div className="flex items-start justify-between" onClick={() => setSelectedAccident(acc)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-800">事故编号：{acc.id}</span>
                          <span className={s.badge}>{s.label}</span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-500">
                          <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /><span>{acc.accidentDate}</span></div>
                          <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /><span>{acc.location}</span></div>
                          <p className="mt-1 text-gray-700 line-clamp-1">{acc.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        {acc.videoCount > 0 && (
                          <div className="flex items-center gap-1 text-sm text-gov-blue">
                            <Video className="w-4 h-4" /><span>{acc.videoCount}个视频</span>
                          </div>
                        )}
                        <span className="text-xs text-gov-blue flex items-center gap-1"><Eye className="w-3.5 h-3.5" />查看详情</span>
                      </div>
                    </div>
                    {canAdvance && (
                      <div className="mt-3 pt-3 border-t border-neutral-border flex justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAdvanceStatus(acc.id, acc.status) }}
                          className="text-xs text-gov-blue flex items-center gap-1 hover:underline px-3 py-1.5 bg-gov-blue/5 rounded-lg hover:bg-gov-blue/10 transition-colors"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          推进状态
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {payModalId && payingViolation && (
        <PaymentModal violation={payingViolation} onClose={handlePayModalClose} onPay={handlePayComplete} />
      )}

      {selectedAccident && (
        <AccidentDetailModal accident={selectedAccident} onClose={() => setSelectedAccident(null)} />
      )}

      {videoConfirmIndex !== null && (
        <VideoUploadConfirmDialog
          videoIndex={videoConfirmIndex}
          onConfirm={handleVideoConfirm}
          onCancel={handleVideoConfirmCancel}
        />
      )}
    </div>
  )
}
