import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, ChevronRight, Star, TrendingUp, TrendingDown,
  X, FileText, Clock, DollarSign, CheckCircle2, Upload,
  Shield, UserCog, Crown, ArrowRight, RotateCcw, Loader2, Download, AlertCircle,
} from "lucide-react"
import { deptServices } from "@/mocks/deptServices"
import { useBusinessStore } from "@/stores/useBusinessStore"
import type { ServiceDetail, UserRole } from "@/types"
import { cn } from "@/lib/utils"

const allServices = deptServices.flatMap(d =>
  d.services.map(s => ({ ...s, deptName: d.deptName, deptColor: d.deptColor }))
)
const categories = ["全部", ...deptServices.map(d => d.deptName)]
const topServices = allServices.slice(0, 20)
const mockTrends = topServices.map((_, i) =>
  i % 3 === 0 ? "down" : i % 5 === 0 ? "same" : "up" as const
)
const rankBadge = (i: number) => {
  if (i === 0) return "bg-amber-400 text-white"
  if (i === 1) return "bg-gray-300 text-gray-700"
  if (i === 2) return "bg-amber-700 text-white"
  return "bg-blue-50 text-blue-600"
}
const roleConfig: Record<UserRole, { label: string; icon: typeof Shield; color: string }> = {
  citizen: { label: "市民", icon: Shield, color: "bg-blue-500" },
  staff: { label: "政务人员", icon: UserCog, color: "bg-emerald-500" },
  admin: { label: "管理员", icon: Crown, color: "bg-amber-500" },
}

type DetailItem = ServiceDetail & { deptName: string; deptColor: string }

export default function Services() {
  const [category, setCategory] = useState("全部")
  const [query, setQuery] = useState("")
  const [detail, setDetail] = useState<DetailItem | null>(null)
  const [wizardStep, setWizardStep] = useState(0)
  const [appId, setAppId] = useState<string | null>(null)
  const [matChecked, setMatChecked] = useState<boolean[]>([])
  const [roleOpen, setRoleOpen] = useState(false)

  const { currentRole, permissions, switchRole, preferenceClicks, recordPreference,
    submitApplication, checkMaterial, advanceStep, failStep, completeApplication,
    retryApplication, applications } = useBusinessStore()

  const recentIds = useMemo(() =>
    Object.entries(preferenceClicks).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0]),
    [preferenceClicks])
  const recentServices = useMemo(() =>
    recentIds.map(id => allServices.find(s => s.id === id)).filter(Boolean) as DetailItem[],
    [recentIds])

  const filtered = useMemo(() => {
    const list = category === "全部" ? allServices : allServices.filter(s => s.deptName === category)
    if (!query) return list
    const q = query.toLowerCase()
    return list.filter(s => s.name.includes(q) || s.description.includes(q) || s.category.includes(q))
  }, [category, query])

  const suggestions = useMemo(() => {
    if (!query) return []
    const q = query.toLowerCase()
    return allServices.filter(s => s.name.includes(q) || s.category.includes(q)).slice(0, 5)
  }, [query])

  const openDetail = (s: DetailItem) => { recordPreference(s.id); setDetail(s); setWizardStep(0) }
  const startWizard = () => {
    if (!detail || !permissions.canApply) return
    const mc = detail.materials.map(() => true)
    setMatChecked(mc)
    const id = submitApplication({
      serviceId: detail.id, serviceName: detail.name, dept: detail.deptName,
      deptColor: detail.deptColor, materialsChecked: mc, materials: detail.materials,
      currentStep: 0, totalSteps: detail.steps.length, steps: detail.steps, category: detail.category,
    })
    setAppId(id)
    setWizardStep(1)
  }
  const toggleMat = (i: number) => {
    const next = [...matChecked]; next[i] = !next[i]; setMatChecked(next)
    if (appId) checkMaterial(appId, i)
  }
  const simulateUpload = (i: number) => { if (!matChecked[i]) toggleMat(i) }
  const allMatsOk = matChecked.length > 0 && matChecked.every(Boolean)
  const submitAndTrack = () => { setWizardStep(2); simulateProgress() }
  const simulateProgress = () => {
    if (!appId) return
    const app = applications.find(a => a.id === appId)
    if (!app) return
    let step = app.currentStep
    const tick = () => {
      step++
      if (step >= app.totalSteps) { completeApplication(appId!, `${app.serviceName}_办结凭证.pdf`); setWizardStep(4); return }
      advanceStep(appId!)
      setTimeout(tick, 1200)
    }
    setTimeout(tick, 1200)
  }
  const handleRetry = () => { if (appId) { retryApplication(appId); setWizardStep(1); setMatChecked(matChecked.map(() => false)) } }
  const currentApp = appId ? applications.find(a => a.id === appId) : null
  const RoleIcon = roleConfig[currentRole].icon

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="relative bg-gradient-to-r from-[#1A56DB] to-blue-700 pt-10 pb-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-white text-2xl font-bold mb-1">服务大厅</h1>
          <p className="text-blue-200 text-sm mb-6">郑州市掌上办事中枢 · 一站式政务服务平台</p>
          {currentRole === "staff" && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-4 py-2 text-emerald-100 text-sm">📋 政务工作台 · 可查看全部申请与工单</motion.div>
          )}
          {currentRole === "admin" && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-amber-500/20 border border-amber-400/30 rounded-xl px-4 py-2 text-amber-100 text-sm">👑 管理后台 · 全权限 + 编排配置</motion.div>
          )}
          <div className="relative flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="flex items-center bg-white/15 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg overflow-hidden">
                <Search className="ml-4 h-5 w-5 text-white/60 shrink-0" />
                <input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="搜索政务服务、办事指南…" className="flex-1 bg-transparent px-3 py-3.5 text-white placeholder-white/50 outline-none text-sm" />
                {query && <button onClick={() => setQuery("")} className="mr-3"><X className="h-4 w-4 text-white/60" /></button>}
              </div>
              <AnimatePresence>{suggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute inset-x-0 top-full mt-2 bg-white rounded-xl shadow-xl z-20 overflow-hidden">
                  {suggestions.map(s => (
                    <button key={s.id} onClick={() => { setQuery(""); openDetail(s) }}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-blue-50 text-left">
                      <Search className="h-4 w-4 text-blue-400 shrink-0" /><span className="text-sm text-gray-800">{s.name}</span>
                      <span className="ml-auto text-xs text-gray-400">{s.deptName}</span>
                    </button>))}
                </motion.div>)}</AnimatePresence>
            </div>
            <div className="relative">
              <button onClick={() => setRoleOpen(!roleOpen)}
                className={cn("flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-white text-xs font-medium", roleConfig[currentRole].color)}>
                <RoleIcon className="h-4 w-4" />{roleConfig[currentRole].label}
              </button>
              <AnimatePresence>{roleOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl z-30 overflow-hidden w-28">
                  {(["citizen", "staff", "admin"] as UserRole[]).map(r => {
                    const rc = roleConfig[r]; const Ri = rc.icon
                    return (
                      <button key={r} onClick={() => { switchRole(r); setRoleOpen(false) }}
                        className={cn("flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50", currentRole === r ? "text-blue-600 font-semibold" : "text-gray-700")}>
                        <Ri className="h-3.5 w-3.5" />{rc.label}
                      </button>)
                  })}
                </motion.div>)}</AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {recentServices.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="flex items-center gap-2 mb-3"><Clock className="h-4 w-4 text-blue-500" /><span className="text-sm font-semibold text-gray-700">最近使用</span></div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentServices.map(s => (
              <button key={s.id} onClick={() => openDetail(s)}
                className="shrink-0 flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.deptColor }} />{s.name}
              </button>))}
          </div>
        </div>)}

      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex">
            <div className="w-28 shrink-0 border-r border-gray-100 bg-gray-50/60">
              {categories.map(c => {
                const dept = deptServices.find(d => d.deptName === c); const active = category === c
                return (
                  <button key={c} onClick={() => setCategory(c)}
                    className={cn("w-full px-2 py-3 text-xs text-center transition-colors relative", active ? "bg-white text-[#1A56DB] font-semibold" : "text-gray-600 hover:bg-gray-100")}>
                    {active && <motion.div layoutId="catIndicator" className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ backgroundColor: dept?.deptColor ?? "#1A56DB" }} />}
                    {c}
                  </button>)} )}
            </div>
            <div className="flex-1 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">查询结果</span>
                <span className="text-xs text-gray-400">共 {filtered.length} 项服务</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <AnimatePresence mode="popLayout">{filtered.map((s, i) => (
                  <motion.button key={s.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }} onClick={() => openDetail(s)}
                    className="text-left bg-white rounded-xl border border-gray-100 p-3 hover:shadow-md transition-shadow group"
                    style={{ borderLeftWidth: 3, borderLeftColor: s.deptColor }}>
                    <h3 className="text-sm font-medium text-gray-800 group-hover:text-[#1A56DB] transition-colors">{s.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{s.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: s.deptColor + "18", color: s.deptColor }}>{s.deptName}</span>
                      {s.onlineAvailable && <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">可网办</span>}
                    </div>
                  </motion.button>))}</AnimatePresence>
                {filtered.length === 0 && <p className="col-span-full text-center text-gray-400 py-8 text-sm">暂无相关服务</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><Star className="h-5 w-5 text-amber-500" /><h2 className="text-base font-semibold text-gray-800">热门服务排行</h2></div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
            {topServices.map((s, i) => (
              <button key={s.id} onClick={() => openDetail(s)}
                className="flex items-center gap-2 py-2 px-1 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <span className={cn("w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0", rankBadge(i))}>{i + 1}</span>
                <span className="text-sm text-gray-700 truncate flex-1">{s.name}</span>
                {mockTrends[i] === "up" && <TrendingUp className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                {mockTrends[i] === "down" && <TrendingDown className="h-3.5 w-3.5 text-green-400 shrink-0" />}
              </button>))}
          </div>
        </div>
      </div>

      <AnimatePresence>{detail && (
        <><motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => { setDetail(null); setWizardStep(0) }}
            className="fixed inset-0 bg-black z-40" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-8 rounded-full" style={{ backgroundColor: detail.deptColor }} />
                <div><h3 className="font-semibold text-gray-800">{detail.name}</h3><p className="text-xs text-gray-400">{detail.deptName} · {detail.category}</p></div>
              </div>
              <button onClick={() => { setDetail(null); setWizardStep(0) }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-5">
              {wizardStep === 0 && (<>
                <p className="text-sm text-gray-600">{detail.description}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center"><Clock className="h-5 w-5 text-blue-500 mx-auto mb-1" /><p className="text-xs text-gray-500">办理时长</p><p className="text-sm font-semibold text-gray-800 mt-0.5">{detail.duration}</p></div>
                  <div className="bg-green-50 rounded-xl p-3 text-center"><DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" /><p className="text-xs text-gray-500">费用</p><p className="text-sm font-semibold text-gray-800 mt-0.5">{detail.fee}</p></div>
                  <div className="bg-purple-50 rounded-xl p-3 text-center"><CheckCircle2 className="h-5 w-5 text-purple-500 mx-auto mb-1" /><p className="text-xs text-gray-500">网办</p><p className="text-sm font-semibold text-gray-800 mt-0.5">{detail.onlineAvailable ? "支持" : "不支持"}</p></div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><ChevronRight className="h-4 w-4 text-[#1A56DB]" />办理步骤</h4>
                  <div className="space-y-2">{detail.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-[#1A56DB] text-white text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span><span className="text-sm text-gray-700">{step}</span></div>))}</div>
                </div>
                <button onClick={startWizard} disabled={!permissions.canApply}
                  className={cn("w-full py-3 rounded-xl text-white font-semibold text-sm transition-colors", permissions.canApply ? "bg-[#1A56DB] hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed")}>
                  {permissions.canApply ? "立即办理" : "当前角色不可办理"}
                </button>
              </>)}

              {wizardStep === 1 && (<>
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Upload className="h-4 w-4 text-[#1A56DB]" />Step 1 · 材料上传与身份核验</h4>
                <div className="space-y-3">{detail.materials.map((m, i) => (
                  <div key={i} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-colors", matChecked[i] ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200")}>
                    <button onClick={() => toggleMat(i)} className={cn("w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors", matChecked[i] ? "bg-green-500 border-green-500" : "border-gray-300")}>
                      {matChecked[i] && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                    </button>
                    <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 flex-1">{m}</span>
                    <button onClick={() => simulateUpload(i)} className={cn("text-xs px-2.5 py-1 rounded-lg font-medium transition-colors", matChecked[i] ? "bg-green-100 text-green-600" : "bg-blue-500 text-white hover:bg-blue-600")}>
                      {matChecked[i] ? "已上传" : "上传"}
                    </button>
                  </div>))}</div>
                <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-3">
                  <h5 className="text-xs font-semibold text-gray-700 mb-1">身份条件</h5>
                  <div className="space-y-1">{({ "社保": ["需持有郑州市社保账户", "连续缴纳社保满6个月"], "公积金": ["需持有郑州市公积金账户", "连续缴存满3个月"], "户籍": ["需持有郑州市户籍或居住证满6个月"], "医疗": ["需参加郑州市基本医疗保险"], "交通": ["需持有有效驾驶证/行驶证"], "住建": ["需持有不动产权属证明"], "税务": ["需完成实名认证"], "民政": ["双方需持有效身份证件"], "商务": ["经营场所需在郑州市"], "教育": ["适龄儿童需持有郑州市户籍或居住证"] } as Record<string, string[]>)[detail.category]?.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-gray-600"><CheckCircle2 className="h-3 w-3 text-emerald-500" />{c}</div>
                  )) ?? <div className="flex items-center gap-1.5 text-[11px] text-gray-600"><CheckCircle2 className="h-3 w-3 text-emerald-500" />需完成实名认证</div>}</div>
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 space-y-1">
                  <h5 className="text-xs font-semibold text-gray-700 mb-1">校验结果</h5>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-600"><CheckCircle2 className="h-3 w-3 text-emerald-500" />✓ 身份验证通过</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-600"><CheckCircle2 className="h-3 w-3 text-emerald-500" />✓ 资格条件预审通过</div>
                  <div className={cn("flex items-center gap-1.5 text-[11px]", allMatsOk ? "text-emerald-600" : "text-amber-600")}>
                    {allMatsOk ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <AlertCircle className="h-3 w-3 text-amber-500" />}
                    {allMatsOk ? `✓ 材料完整性：${matChecked.filter(Boolean).length}/${detail.materials.length} 已上传` : `⚠ 材料完整性：${matChecked.filter(Boolean).length}/${detail.materials.length} 已上传`}
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 space-y-2">
                  <h5 className="text-xs font-semibold text-gray-700">本次应缴与回查信息</h5>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                    <div className="rounded bg-white/80 p-2">
                      <span className="text-gray-400">应缴费用</span>
                      <p className="font-semibold text-emerald-700">{detail.fee === "免费" ? "0元，线上免缴" : detail.fee}</p>
                    </div>
                    <div className="rounded bg-white/80 p-2">
                      <span className="text-gray-400">预受理编号</span>
                      <p className="font-mono font-semibold text-[#1A56DB]">{appId ?? "提交后生成"}</p>
                    </div>
                    <div className="rounded bg-white/80 p-2">
                      <span className="text-gray-400">进度回查</span>
                      <p className="font-semibold text-slate-700">材料预审 → 窗口受理 → 部门审核 → 办结凭证</p>
                    </div>
                    <div className="rounded bg-white/80 p-2">
                      <span className="text-gray-400">复查记录</span>
                      <p className="font-semibold text-slate-700">身份、资格、材料三项已留痕</p>
                    </div>
                  </div>
                </div>
                <button onClick={submitAndTrack} disabled={!allMatsOk}
                  className={cn("w-full py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2", allMatsOk ? "bg-[#1A56DB] text-white hover:bg-blue-700" : "bg-gray-200 text-gray-400 cursor-not-allowed")}>
                  确认并提交 <ArrowRight className="h-4 w-4" />
                </button>
              </>)}

              {wizardStep === 2 && currentApp && (<>
                <h4 className="text-sm font-semibold text-gray-700">Step 2 · 办理进度追踪</h4>
                <div className="space-y-3">{currentApp.steps.map((step, i) => {
                  const done = i < currentApp.currentStep; const active = i === currentApp.currentStep && currentApp.status !== "failed"
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold", done ? "bg-green-500 text-white" : active ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-400")}>
                        {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : i + 1}
                      </div>
                      <span className={cn("text-sm", done ? "text-green-700 font-medium" : active ? "text-blue-700 font-medium" : "text-gray-400")}>{step}</span>
                    </div>)
                })}</div>
                <p className="text-xs text-gray-400 text-center">正在处理中，请稍候…</p>
              </>)}

              {wizardStep === 4 && currentApp && (<>
                {currentApp.status === "completed" ? (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto"><CheckCircle2 className="h-8 w-8 text-green-500" /></div>
                    <h4 className="text-lg font-semibold text-gray-800">办理成功</h4>
                    <p className="text-sm text-gray-500">您的「{currentApp.serviceName}」已办结</p>
                    {currentApp.resultDoc && (
                      <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
                        <Download className="h-4 w-4" />下载 {currentApp.resultDoc}
                      </button>)}
                  </div>
                ) : (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto"><X className="h-8 w-8 text-red-500" /></div>
                    <h4 className="text-lg font-semibold text-gray-800">办理失败</h4>
                    <p className="text-sm text-red-500">{currentApp.failReason || "未知原因"}</p>
                    <button onClick={handleRetry}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A56DB] text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                      <RotateCcw className="h-4 w-4" />重新办理
                    </button>
                  </div>
                )}
              </>)}
            </div>
          </motion.div>
        </>)}</AnimatePresence>
    </div>
  )
}
