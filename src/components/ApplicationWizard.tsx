import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, Loader2, Download, RefreshCw, Upload, Shield, FileText, AlertTriangle, Clock, Hash } from "lucide-react"
import { useBusinessStore } from "@/stores/useBusinessStore"
import { deptServices } from "@/mocks/deptServices"
import { cn } from "@/lib/utils"
import type { ServiceDetail } from "@/types"

const identityConditions: Record<string, string[]> = {
  "社保": ["需持有郑州市社保账户", "连续缴纳社保满6个月"],
  "公积金": ["需持有郑州市公积金账户", "连续缴存满3个月"],
  "户籍": ["需持有郑州市户籍或居住证满6个月", "居住地址需在郑州市范围内"],
  "医疗": ["需参加郑州市基本医疗保险", "医保账户状态正常"],
  "教育": ["适龄儿童需持有郑州市户籍或居住证", "房产或租房在对应学区内"],
  "交通": ["需持有有效驾驶证/行驶证", "车辆登记地在郑州市"],
  "住建": ["需持有不动产权属证明", "登记地址在郑州市范围内"],
  "税务": ["需完成实名认证", "有纳税记录或收入来源"],
  "民政": ["双方需持有效身份证件", "至少一方为郑州市户籍"],
  "商务": ["经营场所需在郑州市", "法定代表人/负责人需持有效身份证件"],
}

const paymentInfo: Record<string, { items: { name: string; amount: string }[]; total: string; period: string }> = {
  "社保": { items: [{ name: "养老保险", amount: "¥658.40" }, { name: "医疗保险", amount: "¥329.20" }, { name: "失业保险", amount: "¥41.16" }, { name: "工伤保险", amount: "¥22.80" }], total: "¥1,051.56", period: "2026年6月" },
  "公积金": { items: [{ name: "住房公积金", amount: "¥960.00" }], total: "¥960.00", period: "2026年6月" },
  "交通": { items: [{ name: "交强险", amount: "¥950.00" }, { name: "车船税", amount: "¥360.00" }], total: "¥1,310.00", period: "2026年度" },
  "商务": { items: [{ name: "年审费", amount: "¥0.00" }], total: "免费", period: "2026年度" },
  "户籍": { items: [{ name: "居住证工本费", amount: "¥0.00" }], total: "免费", period: "" },
}

function findService(serviceId: string): ServiceDetail | undefined {
  for (const d of deptServices) for (const s of d.services) if (s.id === serviceId) return s
  return undefined
}
function findDept(serviceId: string) {
  return deptServices.find((d) => d.services.some((s) => s.id === serviceId))
}

export function ApplicationWizard({ serviceId, onClose }: { serviceId: string; onClose: () => void }) {
  const service = findService(serviceId)
  const dept = findDept(serviceId)
  const { submitApplication, advanceStep, failStep, completeApplication, retryApplication, applications, records } = useBusinessStore()
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [checked, setChecked] = useState<boolean[]>(service?.materials.map(() => false) ?? [])
  const [uploaded, setUploaded] = useState<boolean[]>(service?.materials.map(() => false) ?? [])
  const [appId, setAppId] = useState<string | null>(null)
  const [受理编号, set受理编号] = useState<string | null>(null)
  const [progressStep, setProgressStep] = useState(0)
  const [succeeded, setSucceeded] = useState(true)
  const [stepTimes, setStepTimes] = useState<string[]>([])

  const app = appId ? applications.find((a) => a.id === appId) : null
  const conditions = identityConditions[service?.category ?? ""] ?? ["需完成实名认证"]
  const payment = paymentInfo[service?.category ?? ""]

  const handleCheck = (i: number) => {
    if (appId) { useBusinessStore.getState().checkMaterial(appId, i) } else {
      setChecked((p) => p.map((c, j) => (j === i ? !c : c)))
    }
  }
  const handleUpload = (i: number) => {
    setUploaded((p) => p.map((c, j) => (j === i ? true : c)))
    if (!checked[i]) handleCheck(i)
  }

  const allChecked = (appId ? app?.materialsChecked : checked)?.every(Boolean) ?? false
  const checkedCount = (appId ? app?.materialsChecked : checked)?.filter(Boolean).length ?? 0
  const totalMats = service?.materials.length ?? 0

  const handleSubmit = () => {
    if (!service) return
    const slbh = `SL${Date.now().toString().slice(-10)}`
    set受理编号(slbh)
    const id = submitApplication({
      serviceId, serviceName: service.name, dept: dept?.deptName ?? "",
      deptColor: dept?.deptColor ?? "#1A56DB", materialsChecked: checked, materials: service.materials,
      currentStep: 0, totalSteps: service.steps.length, steps: service.steps, category: service.category,
    })
    setAppId(id)
    setStep(1)
  }

  const handleConfirm = () => {
    if (!appId) return
    setStep(2)
    setProgressStep(0)
    setStepTimes([new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })])
    const interval = setInterval(() => {
      setProgressStep((prev) => {
        setStepTimes((t) => [...t, new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })])
        if (prev >= (service?.steps.length ?? 0) - 1) {
          clearInterval(interval)
          const ok = Math.random() > 0.15
          if (ok) { completeApplication(appId, `${service?.name ?? "服务"}_办结凭证.pdf`); setSucceeded(true) }
          else { failStep(appId, "材料信息核验不通过，请重新确认后提交"); setSucceeded(false) }
          setStep(3)
          return prev
        }
        advanceStep(appId)
        return prev + 1
      })
    }, 1500)
  }

  const handleRetry = () => {
    if (!appId) return
    retryApplication(appId)
    setChecked(service?.materials.map(() => false) ?? [])
    setUploaded(service?.materials.map(() => false) ?? [])
    setStep(0)
    set受理编号(null)
  }

  const mats = appId ? (app?.materials ?? service?.materials ?? []) : (service?.materials ?? [])
  const matsChecked = appId ? (app?.materialsChecked ?? checked) : checked
  const stepLabels = ["材料准备与身份核验", "确认提交", "办理进度追踪", "办结结果"]
  const record = appId ? records.find((r) => r.serviceName === service?.name && r.status !== "completed") : null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-7 rounded-full" style={{ background: dept?.deptColor ?? "#1A56DB" }} />
            <h3 className="text-lg font-bold text-gray-800">{service?.name ?? "申报向导"}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
        </div>

        {受理编号 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
            <Hash className="h-4 w-4 text-[#1A56DB] shrink-0" />
            <span className="text-xs text-gray-500">受理编号：</span>
            <span className="text-sm font-mono font-bold text-[#1A56DB]">{受理编号}</span>
          </div>
        )}

        <div className="mb-5 space-y-1">
          <div className="flex gap-1">
            {stepLabels.map((l, i) => (
              <div key={l} className={cn("flex-1 h-1.5 rounded-full transition-colors", i <= step ? "bg-[#1A56DB]" : "bg-gray-200")} />
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center">{stepLabels[step]}</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} className="space-y-4">
              {payment && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />本次应缴信息
                  </h4>
                  <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-3 space-y-2">
                    {payment.period && <p className="text-xs text-gray-500">缴费周期：{payment.period}</p>}
                    <div className="space-y-1">
                      {payment.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{item.name}</span>
                          <span className="font-medium text-gray-800">{item.amount}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-orange-200">
                      <span className="text-xs font-semibold text-gray-700">合计</span>
                      <span className="text-base font-bold text-[#F97316]">{payment.total}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                  <FileText className="h-4 w-4 text-[#1A56DB]" />材料清单（共{totalMats}项）
                </h4>
                <div className="space-y-2">
                  {mats.map((m, i) => (
                    <div key={i} className={cn("flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      matsChecked[i] ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white")}>
                      <input type="checkbox" checked={!!matsChecked[i]} onChange={() => handleCheck(i)}
                        className="h-4 w-4 rounded border-gray-300 text-[#1A56DB] focus:ring-[#1A56DB]" />
                      <span className={cn("text-sm flex-1", matsChecked[i] ? "text-emerald-700" : "text-gray-700")}>{m}</span>
                      <button onClick={() => handleUpload(i)}
                        className={cn("flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors",
                          uploaded[i] ? "bg-emerald-100 text-emerald-600" : "bg-blue-500 text-white hover:bg-blue-600")}>
                        <Upload className="h-3 w-3" />{uploaded[i] ? "已上传" : "上传"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                  <Shield className="h-4 w-4 text-orange-500" />身份条件
                </h4>
                <div className="space-y-1.5 rounded-lg border border-orange-100 bg-orange-50/50 p-3">
                  {conditions.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /><span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-4 w-4 text-blue-500" />校验结果
                </h4>
                <div className="space-y-1.5 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                  <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span className="text-gray-700">✓ 身份验证通过</span></div>
                  <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span className="text-gray-700">✓ 户籍状态正常</span></div>
                  <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span className="text-gray-700">✓ 社保缴纳状态：正常（连续36个月）</span></div>
                  <div className={cn("flex items-center gap-2 text-xs", allChecked ? "text-emerald-600" : "text-amber-600")}>
                    {allChecked ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                    <span>{allChecked ? `✓ 材料完整性：${checkedCount}/${totalMats} 已上传` : `⚠ 材料完整性：${checkedCount}/${totalMats} 已上传`}</span>
                  </div>
                </div>
              </div>

              <button disabled={!allChecked} onClick={handleSubmit}
                className={cn("w-full rounded-xl py-2.5 text-sm font-medium text-white transition-colors",
                  allChecked ? "bg-[#1A56DB] hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed")}>
                下一步：确认提交
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} className="space-y-4">
              {payment && (
                <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-3">
                  <p className="text-xs font-medium text-gray-600 mb-1">应缴金额确认</p>
                  <p className="text-lg font-bold text-[#F97316]">{payment.total}<span className="text-xs text-gray-400 ml-1">{payment.period}</span></p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">材料清单确认</h4>
                <div className="space-y-1.5">
                  {mats.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> <span className="text-gray-700">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">身份条件核验</h4>
                <div className="space-y-1">
                  {conditions.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {c}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                提交后系统将自动进行跨部门材料核验，预计办理时长：{service?.duration ?? "3-5个工作日"}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(0)} className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">返回修改</button>
                <button onClick={handleConfirm} className="flex-1 rounded-xl bg-[#1A56DB] py-2.5 text-sm font-medium text-white hover:bg-blue-700">确认提交</button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} className="space-y-4">
              {受理编号 && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                  <Hash className="h-4 w-4 text-[#1A56DB] shrink-0" />
                  <span className="text-xs text-gray-500">受理编号：</span>
                  <span className="text-sm font-mono font-bold text-[#1A56DB]">{受理编号}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>办理进度</span>
                <span>{Math.round(((progressStep + 1) / (service?.steps.length ?? 1)) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100">
                <motion.div className="h-full rounded-full bg-[#1A56DB]" animate={{ width: `${((progressStep + 1) / (service?.steps.length ?? 1)) * 100}%` }} transition={{ duration: 0.5 }} />
              </div>
              <div className="space-y-3">
                {service?.steps.map((s, i) => {
                  const done = i < progressStep
                  const active = i === progressStep
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        done ? "bg-emerald-500 text-white" : active ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-400")}>
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : i + 1}
                      </div>
                      <div>
                        <p className={cn("text-sm font-medium", done ? "text-emerald-700" : active ? "text-blue-700" : "text-gray-400")}>{s}</p>
                        {stepTimes[i] && <p className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{stepTimes[i]} {done ? "已完成" : active ? "处理中…" : ""}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 text-center">正在办理中，请稍候…</p>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} className="space-y-4">
              {受理编号 && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                  <Hash className="h-4 w-4 text-[#1A56DB] shrink-0" />
                  <span className="text-xs text-gray-500">受理编号：</span>
                  <span className="text-sm font-mono font-bold text-[#1A56DB]">{受理编号}</span>
                </div>
              )}
              {succeeded ? (
                <div className="text-center space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">办理成功</h4>
                  <p className="text-sm text-gray-500">您的「{service?.name}」已办结</p>
                  {app?.resultDoc && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                      <p className="text-xs text-gray-500 mb-2">办结凭证</p>
                      <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600">
                        <Download className="h-4 w-4" />下载 {app.resultDoc}
                      </button>
                    </div>
                  )}
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-left space-y-1">
                    <p className="text-xs font-medium text-blue-700">可回查记录</p>
                    <p className="text-[11px] text-gray-600">服务：{service?.name}</p>
                    <p className="text-[11px] text-gray-600">部门：{dept?.deptName}</p>
                    <p className="text-[11px] text-gray-600">办结时间：{new Date().toLocaleString("zh-CN")}</p>
                    <p className="text-[11px] text-gray-600">受理编号：{受理编号}</p>
                    <p className="text-[11px] text-blue-500">可在「个人中心」查看完整办件记录</p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">办理失败</h4>
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-left">
                    <p className="text-xs font-medium text-red-700 mb-1">失败原因：</p>
                    <p className="text-sm text-red-600">{app?.failReason ?? "未知原因"}</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button onClick={handleRetry}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#1A56DB] px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
                      <RefreshCw className="h-4 w-4" />重新办理
                    </button>
                    <button onClick={onClose}
                      className="inline-flex items-center gap-1 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                      关闭
                    </button>
                  </div>
                </div>
              )}
              <button onClick={onClose} className="block mx-auto text-sm text-gray-400 hover:text-gray-600">返回首页</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
