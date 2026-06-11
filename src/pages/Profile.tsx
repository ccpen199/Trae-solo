import { useState, useMemo } from "react"
import { useProfileStore } from "@/stores/useProfileStore"
import { useBusinessStore } from "@/stores/useBusinessStore"
import { useAccessibilityStore } from "@/stores/useAccessibilityStore"
import { offlinePackages } from "@/mocks/deptServices"
import { useECharts } from "@/hooks/useECharts"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"
import { motion } from "framer-motion"
import {
  User, Shield, Download, Eye, Volume2, Clock,
  CheckCircle2, XCircle, Loader2, Settings, Crown,
  UserCog, RotateCcw, FileText, Trash2,
} from "lucide-react"

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }
const stagger = { show: { transition: { staggerChildren: 0.07 } } }
const ST = { completed: { icon: CheckCircle2, color: "text-emerald-500", bar: "bg-emerald-500", label: "已完成" }, processing: { icon: Loader2, color: "text-blue-500", bar: "bg-blue-500", label: "办理中" }, failed: { icon: XCircle, color: "text-red-500", bar: "bg-red-400", label: "已失败" } } as const

const roleMap: Record<UserRole, { icon: typeof User; label: string; cls: string }> = {
  citizen: { icon: User, label: "市民", cls: "bg-blue-50 text-[#1A56DB] border-blue-200" },
  staff: { icon: UserCog, label: "工作人员", cls: "bg-purple-50 text-purple-600 border-purple-200" },
  admin: { icon: Crown, label: "管理员", cls: "bg-amber-50 text-amber-600 border-amber-200" },
}

const permMap: Record<string, { label: string; icon: typeof Shield }> = {
  canApply: { label: "申请办理", icon: FileText },
  canViewAllRecords: { label: "全量记录", icon: Eye },
  canHandleWorkOrders: { label: "工单处理", icon: Settings },
  canManageKnowledge: { label: "知识管理", icon: Shield },
  canConfigOrchestration: { label: "编排配置", icon: Settings },
  canViewClusterAnalysis: { label: "聚类分析", icon: Eye },
  canSupervise: { label: "督办监管", icon: Shield },
}

const sid2cat: Record<string, string> = { ss1: "社保", hf1: "公积金", ps1: "户籍", mi1: "医疗", tr1: "交通", nr1: "住建", tx1: "税务", ca1: "民政", mk1: "商务", ed1: "教育" }

export default function Profile() {
  const { profile } = useProfileStore()
  const { records, applications, currentRole, permissions, switchRole, retryApplication, preferenceClicks } = useBusinessStore()
  const { highContrast, fontSize, voiceNavigation, toggleHighContrast, setFontSize, toggleVoiceNavigation } = useAccessibilityStore()

  const [dlProg, setDlProg] = useState<Record<string, number>>({})
  const [cached, setCached] = useState<Record<string, { cachedAt: string; expiresAt: string }>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  const radar = profile.profileRadar
  const doneCount = records.filter((r) => r.status === "completed").length
  const prefCount = Object.values(preferenceClicks).reduce((a, b) => a + b, 0)
  const dims = [
    { name: "办事活跃度", value: Math.min(100, radar.serviceActivity + doneCount * 2) },
    { name: "缴费频次", value: radar.paymentFrequency },
    { name: "服务偏好", value: Math.min(100, radar.servicePreference + Math.floor(prefCount / 3)) },
    { name: "政策匹配度", value: radar.policyMatch },
    { name: "数字化程度", value: Math.min(100, radar.digitalLevel + doneCount) },
  ]

  const radarRef = useECharts({
    radar: { indicator: dims.map((d) => ({ name: d.name, max: 100 })), shape: "polygon", splitArea: { areaStyle: { color: ["rgba(26,86,219,0.02)", "rgba(26,86,219,0.06)"] } }, axisLine: { lineStyle: { color: "rgba(26,86,219,0.15)" } }, splitLine: { lineStyle: { color: "rgba(26,86,219,0.12)" } } },
    series: [{ type: "radar", data: [{ value: dims.map((d) => d.value), areaStyle: { color: "rgba(26,86,219,0.18)" }, lineStyle: { color: "#1A56DB", width: 2 }, itemStyle: { color: "#1A56DB" } }] }],
  }, [radar, doneCount, prefCount])

  const prefBar = useMemo(() => {
    const m: Record<string, number> = {}
    for (const [sid, cnt] of Object.entries(preferenceClicks)) m[sid2cat[sid] || sid] = (m[sid2cat[sid] || sid] || 0) + cnt
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [preferenceClicks])

  const barRef = useECharts({
    tooltip: { trigger: "axis" as const },
    grid: { left: 56, right: 24, top: 8, bottom: 16 },
    xAxis: { type: "value" as const },
    yAxis: { type: "category" as const, data: prefBar.map((d) => d[0]), inverse: true },
    series: [{ type: "bar", data: prefBar.map((d) => d[1]), itemStyle: { color: "#1A56DB", borderRadius: [0, 4, 4, 0] }, barWidth: 14, label: { show: true, position: "right" as const, fontSize: 11, color: "#64748b" } }],
  }, [prefBar])

  const handleDownload = (pkgId: string) => {
    setDlProg((p) => ({ ...p, [pkgId]: 0 }))
    const t0 = Date.now()
    const tick = () => {
      const pct = Math.min(100, Math.round(((Date.now() - t0) / 2000) * 100))
      setDlProg((p) => ({ ...p, [pkgId]: pct }))
      if (pct < 100) requestAnimationFrame(tick)
      else setCached((c) => ({ ...c, [pkgId]: { cachedAt: new Date().toLocaleString("zh-CN"), expiresAt: "2026-09-01" } }))
    }
    requestAnimationFrame(tick)
  }

  const findApp = (rid: string) => {
    const r = records.find((x) => x.id === rid)
    if (!r) return null
    return applications.find((a) => a.serviceName === r.serviceName && ["failed", "processing", "material_checking"].includes(a.status))
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 space-y-5" style={{ fontSize }}>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        <motion.section variants={fadeUp} className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><User className="w-7 h-7 text-[#1A56DB]" /></div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-800 truncate">{profile.name}</h2>
              <div className="flex flex-wrap gap-1.5 mt-1">{profile.tags.map((t) => <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-[#1A56DB] font-medium">{t}</span>)}</div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {(Object.keys(roleMap) as UserRole[]).map((role) => {
              const c = roleMap[role], Icon = c.icon, active = currentRole === role
              return <button key={role} onClick={() => switchRole(role)} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-all", active ? c.cls : "bg-slate-50 text-slate-400 border-slate-100")}><Icon className="w-3.5 h-3.5" />{c.label}</button>
            })}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {Object.entries(permMap).map(([k, { label, icon: PI }]) => {
              const on = permissions[k as keyof typeof permissions] as boolean
              return <div key={k} className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] border", on ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-300")}><PI className="w-3 h-3 shrink-0" /><span className="truncate">{label}</span>{on ? <CheckCircle2 className="w-3 h-3 ml-auto shrink-0 text-emerald-500" /> : <XCircle className="w-3 h-3 ml-auto shrink-0" />}</div>
            })}
          </div>
        </motion.section>

        <motion.section variants={fadeUp} className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2"><Eye className="w-4 h-4 text-[#1A56DB]" />数字画像<span className="text-[10px] font-normal text-slate-400 ml-auto">随办件动态更新</span></h3>
          <div ref={radarRef} className="w-full h-52" />
          <div className="grid grid-cols-5 gap-2 mt-2">{dims.map((d) => <div key={d.name} className="text-center"><div className="text-lg font-bold text-[#1A56DB]">{d.value}</div><div className="text-[10px] text-slate-400 leading-tight">{d.name}</div></div>)}</div>
        </motion.section>

        <motion.section variants={fadeUp} className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-[#1A56DB]" />办件记录</h3>
          <div className="space-y-3">
            {records.map((r, i) => {
              const s = ST[r.status], SIcon = s.icon, app = findApp(r.id), isOpen = expanded === r.id
              const pct = r.totalSteps ? Math.round(((r.currentStep ?? 0) / r.totalSteps) * 100) : 0
              return (
                <motion.div key={r.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="border border-slate-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-700 truncate">{r.serviceName}</p><p className="text-[11px] text-slate-400">{r.dept} · {r.date} · {r.category}</p></div>
                    <div className={cn("flex items-center gap-1 text-xs shrink-0 ml-2", s.color)}><SIcon className={cn("w-3.5 h-3.5", r.status === "processing" && "animate-spin")} />{s.label}</div>
                  </div>
                  {r.totalSteps ? <div className="space-y-1"><div className="flex justify-between text-[10px] text-slate-400"><span>进度 {r.currentStep}/{r.totalSteps}</span><span>{pct}%</span></div><div className="w-full h-1.5 rounded-full bg-slate-100"><div className={cn("h-full rounded-full transition-all", s.bar)} style={{ width: `${pct}%` }} /></div></div> : null}
                  {r.materialsChecked && <div className="flex gap-1 flex-wrap">{r.materialsChecked.map((ok, idx) => <span key={idx} className={cn("inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded", ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>{ok ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}材料{idx + 1}</span>)}</div>}
                  {r.status === "completed" && r.resultDoc && <button className="flex items-center gap-1 text-xs text-[#1A56DB] hover:underline"><FileText className="w-3 h-3" />查看凭证：{r.resultDoc}</button>}
                  {r.status === "failed" && <div className="space-y-1.5">{app?.failReason && <p className="text-[11px] text-red-500">{app.failReason}</p>}{app && <button onClick={() => retryApplication(app.id)} className="flex items-center gap-1 text-xs text-white bg-[#1A56DB] px-3 py-1 rounded-lg hover:bg-blue-700"><RotateCcw className="w-3 h-3" />重新办理</button>}</div>}
                  {r.status === "processing" && app && <><button onClick={() => setExpanded(isOpen ? null : r.id)} className="text-xs text-[#1A56DB] hover:underline">{isOpen ? "收起进度" : "查看进度 ▾"}</button>{isOpen && <div className="pl-2 border-l-2 border-blue-200 space-y-1">{app.steps.map((step, idx) => <div key={idx} className={cn("text-[11px] flex items-center gap-1.5", idx < app.currentStep ? "text-emerald-600" : idx === app.currentStep ? "text-blue-600 font-medium" : "text-slate-300")}>{idx < app.currentStep ? <CheckCircle2 className="w-3 h-3" /> : idx === app.currentStep ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}{step}</div>)}</div>}</>}
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        <motion.section variants={fadeUp} className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-[#1A56DB]" />偏好沉淀</h3>
          {prefBar.length ? <div ref={barRef} className="w-full h-48" /> : <p className="text-sm text-slate-400 text-center py-8">暂无偏好数据</p>}
        </motion.section>

        <motion.section variants={fadeUp} className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><Download className="w-4 h-4 text-[#1A56DB]" />离线服务包</h3>
          <div className="grid grid-cols-2 gap-3">
            {offlinePackages.map((pkg) => {
              const isCached = !!cached[pkg.id], prog = dlProg[pkg.id], isDownloading = prog !== undefined && prog < 100
              return (
                <div key={pkg.id} className="border border-slate-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-700 leading-tight">{pkg.name}</p><span className="text-[10px] text-slate-400 shrink-0 ml-1">{pkg.version}</span></div>
                  <p className="text-[11px] text-slate-400 leading-tight">{pkg.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400"><span>{pkg.size}</span>{isCached && <span>到期 {cached[pkg.id].expiresAt}</span>}</div>
                  {isDownloading && <div className="space-y-1"><div className="w-full h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#1A56DB] transition-all" style={{ width: `${prog}%` }} /></div><p className="text-[10px] text-slate-400 text-center">{prog}%</p></div>}
                  {isCached ? <div className="space-y-1"><div className="flex items-center gap-1 text-[11px] text-emerald-600"><CheckCircle2 className="w-3 h-3" />已缓存 · {cached[pkg.id].cachedAt}</div><button onClick={() => setCached((c) => { const n = { ...c }; delete n[pkg.id]; return n })} className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" />清除缓存</button></div> : !isDownloading && <button onClick={() => handleDownload(pkg.id)} className="w-full py-1.5 text-xs font-medium text-white bg-[#1A56DB] rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"><Download className="w-3 h-3" />下载</button>}
                </div>
              )
            })}
          </div>
        </motion.section>

        <motion.section variants={fadeUp} className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-[#1A56DB]" />无障碍设置</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Eye className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-600">高对比度模式</span></div><button onClick={toggleHighContrast} className={cn("w-11 h-6 rounded-full transition-colors relative", highContrast ? "bg-[#1A56DB]" : "bg-slate-200")}><span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", highContrast ? "left-[22px]" : "left-0.5")} /></button></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Volume2 className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-600">语音导航</span></div><button onClick={toggleVoiceNavigation} className={cn("w-11 h-6 rounded-full transition-colors relative", voiceNavigation ? "bg-[#1A56DB]" : "bg-slate-200")}><span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", voiceNavigation ? "left-[22px]" : "left-0.5")} /></button></div>
            <div><div className="flex items-center justify-between mb-1"><span className="text-sm text-slate-600">字体大小</span><span className="text-xs text-slate-400">{fontSize}px</span></div><input type="range" min={12} max={24} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-slate-200 accent-[#1A56DB] cursor-pointer" /></div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  )
}
