import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield, Building2, FileText, HeartPulse, Car, Home as HomeIcon,
  ChevronRight, Clock, AlertTriangle, Sparkles, ArrowRight,
  ChevronDown, Zap, MessageCircle, MousePointerClick, Eye,
  RotateCcw, CheckCircle2, XCircle, Loader2, Search, UserCog,
} from "lucide-react"
import { useProfileStore } from "@/stores/useProfileStore"
import { useBusinessStore } from "@/stores/useBusinessStore"
import { orchestrationFlows } from "@/mocks/orchestrationFlows"
import { deptServices } from "@/mocks/deptServices"
import { knowledgeNodes, knowledgeEdges } from "@/mocks/knowledgeGraph"
import { useECharts } from "@/hooks/useECharts"
import { cn } from "@/lib/utils"
import { ApplicationWizard } from "@/components/ApplicationWizard"
import type { ExpiringItem, OrchestrationStep, OrchestrationFlow } from "@/types"

const iconMap: Record<string, React.ElementType> = {
  Shield, Building2, FileText, HeartPulse, Car, Home: HomeIcon,
}

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return "夜深了"
  if (h < 9) return "早上好"
  if (h < 12) return "上午好"
  if (h < 14) return "中午好"
  if (h < 18) return "下午好"
  return "晚上好"
}

const urgencyColor: Record<ExpiringItem["urgency"], string> = {
  high: "border-red-500 bg-red-50 text-red-700",
  medium: "border-orange-400 bg-orange-50 text-orange-700",
  low: "border-emerald-400 bg-emerald-50 text-emerald-700",
}

const stepBadge: Record<OrchestrationStep["status"], { bg: string; text: string }> = {
  completed: { bg: "bg-emerald-100", text: "text-emerald-700" },
  processing: { bg: "bg-blue-100", text: "text-blue-700" },
  pending: { bg: "bg-gray-100", text: "text-gray-500" },
  failed: { bg: "bg-red-100", text: "text-red-700" },
}

const stepLabel: Record<OrchestrationStep["status"], string> = {
  completed: "已完成", processing: "办理中", pending: "待办理", failed: "已失败",
}

const stepIcon: Record<OrchestrationStep["status"], React.ElementType> = {
  completed: CheckCircle2, processing: Loader2, pending: Clock, failed: XCircle,
}

const deptColors: Record<string, string> = {}
for (const d of deptServices) deptColors[d.deptName] = d.deptColor

function FlowStepDetail({ step, prevStep }: { step: OrchestrationStep; prevStep?: OrchestrationStep }) {
  const SIcon = stepIcon[step.status]
  return (
    <div className={cn("rounded-lg border p-3 space-y-2", step.status === "failed" ? "border-red-200 bg-red-50/30" : "border-gray-100 bg-white")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", stepBadge[step.status].bg, stepBadge[step.status].text)}>
            {stepLabel[step.status]}
          </span>
          <span className="text-sm font-medium text-gray-800">{step.name}</span>
        </div>
        <span className="rounded px-2 py-0.5 text-[10px] font-medium text-white" style={{ background: deptColors[step.dept] ?? "#6B7280" }}>
          {step.dept}
        </span>
      </div>
      {step.autoTriggered && prevStep && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1">
          <Zap className="h-3 w-3" />
          <span>自动触发：由「{prevStep.name}」完成后系统自动触发</span>
        </div>
      )}
      {step.operator && <p className="text-[11px] text-gray-500">操作人：{step.operator}</p>}
      <div className="text-[11px] text-gray-400 space-y-0.5">
        {step.startTime && <p>开始：{step.startTime}</p>}
        {step.endTime && <p>完成：{step.endTime}</p>}
        {step.status === "processing" && <p className="text-blue-500">处理中…</p>}
      </div>
      {step.status === "failed" && step.failureReason && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-[11px] text-red-700">
          <p className="font-medium">失败原因：{step.failureReason}</p>
          {step.retryCount != null && step.retryCount > 0 && <p className="mt-0.5">已重试 {step.retryCount} 次</p>}
          <p className="mt-0.5 text-red-500">最近复查：{new Date().toLocaleDateString("zh-CN")} 系统自动复查，仍未通过</p>
        </div>
      )}
      <p className="text-[10px] text-gray-300 font-mono">API: {step.apiEndpoint}</p>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { profile } = useProfileStore()
  const { preferenceClicks, recordPreference } = useBusinessStore()
  const [wizardId, setWizardId] = useState<string | null>(null)
  const [expandedFlow, setExpandedFlow] = useState<string | null>(null)
  const [policyPopover, setPolicyPopover] = useState<string | null>(null)
  const [heatmapTip, setHeatmapTip] = useState<{ x: number; y: number; label: string; clicks: number } | null>(null)
  const [flowSteps, setFlowSteps] = useState<Record<string, OrchestrationStep[]>>(() => {
    const m: Record<string, OrchestrationStep[]> = {}
    for (const f of orchestrationFlows) m[f.id] = [...f.steps]
    return m
  })

  const dateStr = useMemo(
    () => new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" }), [],
  )

  const categories = useMemo(() => [...new Set(deptServices.flatMap((d) => d.services.map((s) => s.category)))], [])
  const catServiceMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const d of deptServices) for (const s of d.services) m[s.category] = s.id
    return m
  }, [])

  const chartRef = useECharts(
    {
      grid: { top: 10, bottom: 30, left: 50, right: 20 },
      xAxis: { type: "category", data: categories, axisLabel: { color: "#6B7280", fontSize: 11 } },
      yAxis: { type: "category", data: ["高频", "中频", "低频"], axisLabel: { color: "#6B7280" } },
      visualMap: { min: 0, max: 100, show: false, inRange: { color: ["#E0F2FE", "#1A56DB"] } },
      series: [{
        type: "heatmap", data: profile.preferenceHeatmap.map((d) => [d.x, d.y, d.value]),
        label: { show: true, color: "#fff", fontSize: 11, formatter: (p: { data: number[] }) => `${p.data[2]}` },
        itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
      }],
    } as any,
    [profile.preferenceHeatmap],
  )

  const chartElRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => { chartElRef.current = chartRef.current }, [chartRef])

  const handleHeatmapClick = useCallback((params: any) => {
    const cat = categories[params.data[0]]
    if (!cat) return
    const sid = catServiceMap[cat]
    recordPreference(sid)
    setHeatmapTip({ x: params.event?.offsetX ?? 0, y: params.event?.offsetY ?? 0, label: cat, clicks: preferenceClicks[sid] ?? 0 })
    setTimeout(() => setHeatmapTip(null), 2000)
  }, [categories, catServiceMap, preferenceClicks, recordPreference])

  useEffect(() => {
    const el = chartElRef.current
    if (!el) return
    let inst: any
    import("echarts").then((echarts) => {
      inst = echarts.getInstanceByDom(el)
      inst?.on("click", handleHeatmapClick)
    })
    return () => { inst?.off("click", handleHeatmapClick) }
  }, [handleHeatmapClick])

  const handleAdvanceFlow = (flowId: string) => {
    setFlowSteps((prev) => {
      const steps = [...prev[flowId]]
      const idx = steps.findIndex((s) => s.status === "pending" || s.status === "failed")
      if (idx === -1) return prev
      const now = new Date().toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" })
      const step = { ...steps[idx] }
      if (step.status === "failed") {
        step.status = "processing"
        step.retryCount = (step.retryCount ?? 0) + 1
        step.startTime = now
        step.failureReason = undefined
      } else {
        step.status = "processing"
        step.startTime = now
        step.operator = step.autoTriggered ? "系统-自动" : "窗口-自动"
      }
      steps[idx] = step
      const prevDone = steps.slice(0, idx)
      for (let i = 0; i < idx; i++) {
        if (steps[i].status === "processing") {
          steps[i] = { ...steps[i], status: "completed" as const, endTime: now }
        }
      }
      setTimeout(() => {
        setFlowSteps((p2) => {
          const s2 = [...p2[flowId]]
          s2[idx] = { ...s2[idx], status: "completed" as const, endTime: new Date().toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" }) }
          if (s2[idx + 1] && s2[idx + 1].autoTriggered) {
            s2[idx + 1] = { ...s2[idx + 1], status: "processing" as const, startTime: new Date().toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" }), operator: "系统-自动触发" }
          }
          return { ...p2, [flowId]: s2 }
        })
      }, 1500)
      return { ...prev, [flowId]: steps }
    })
  }

  const getRelatedClauses = (policyTitle: string) => {
    const tags = policyTitle.split(/[·\s]/)
    return knowledgeNodes.filter((n) => tags.some((t) => n.label.includes(t) || n.content.includes(t))).slice(0, 3)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50/40 px-4 pb-10 pt-2 space-y-6">
      <motion.section {...stagger.container}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A56DB] via-blue-600 to-indigo-700 p-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute right-16 bottom-2 h-24 w-24 rounded-full bg-white/5" />
        <motion.div {...stagger.item} className="flex items-center gap-2 text-blue-200 text-sm">
          <Sparkles className="h-4 w-4" /> {dateStr}
        </motion.div>
        <motion.h1 {...stagger.item} className="mt-2 text-2xl font-bold">{getGreeting()}，{profile.name}</motion.h1>
        <motion.div {...stagger.item} className="mt-3 flex flex-wrap gap-2">
          {profile.tags.map((t) => <span key={t} className="rounded-full bg-white/20 px-3 py-0.5 text-xs backdrop-blur-sm">{t}</span>)}
        </motion.div>
      </motion.section>

      <motion.section {...stagger.container} className="grid grid-cols-2 gap-3">
        {[
          { label: "服务大厅搜索筛选", desc: "按部门、分类和关键词进入事项详情", to: "/services", icon: Search },
          { label: "智能问答联动办理", desc: "政策条款解读后可直接提交申请", to: "/assistant", icon: MessageCircle },
          { label: "个人中心进度回查", desc: "查看受理编号、办理进度和凭证", to: "/profile", icon: UserCog },
          { label: "反馈督办复查", desc: "差评自动转工单并沉淀原因聚类", to: "/feedback", icon: AlertTriangle },
        ].map((entry) => (
          <motion.button
            key={entry.label}
            {...stagger.item}
            onClick={() => navigate(entry.to)}
            className="flex items-center gap-3 rounded-xl bg-white p-4 text-left shadow-md transition-shadow hover:shadow-lg"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1A56DB]">
              <entry.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{entry.label}</p>
              <p className="mt-0.5 text-xs text-gray-400">{entry.desc}</p>
            </div>
          </motion.button>
        ))}
      </motion.section>

      <motion.section {...stagger.container} className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
          <AlertTriangle className="h-5 w-5 text-orange-500" /> 到期提醒
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {profile.expiringReminders.map((r) => (
            <motion.div key={r.id} {...stagger.item}
              className={cn("flex-shrink-0 min-w-[260px] rounded-xl border-l-4 p-4 shadow-md transition-shadow hover:shadow-lg",
                urgencyColor[r.urgency], r.urgency === "high" && "animate-[pulse-border_2s_ease-in-out_infinite]")}>
              <p className="text-sm font-medium">{r.title}</p>
              <div className="mt-1 flex items-center gap-1 text-xs opacity-80">
                <Clock className="h-3 w-3" /> 剩余 <span className="font-bold">{r.daysLeft}</span> 天
              </div>
              <button onClick={() => setWizardId(r.serviceId)}
                className="mt-2 flex items-center gap-1 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-white transition-colors">
                立即办理 <ArrowRight className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section {...stagger.container}>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
          <Sparkles className="h-5 w-5 text-blue-500" /> 高频事项
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {profile.highFreqServices.map((s) => {
            const Icon = iconMap[s.icon] ?? FileText
            return (
              <motion.div key={s.id} {...stagger.item} whileHover={{ y: -4 }} onClick={() => {
                const realId = deptServices.flatMap((d) => d.services).find((svc) => svc.name.includes(s.name.slice(0, 3)))?.id ?? s.id
                setWizardId(realId)
              }}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#1A56DB]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">{s.name}</span>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      <motion.section {...stagger.container}>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
          <Sparkles className="h-5 w-5 text-emerald-500" /> 政策匹配
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {profile.matchedPolicies.map((p) => {
            const clauses = getRelatedClauses(p.title)
            return (
              <motion.div key={p.id} {...stagger.item} whileHover={{ y: -3 }}
                className="relative min-w-[220px] flex-shrink-0 rounded-xl bg-white p-4 shadow-md hover:shadow-lg transition-shadow">
                <button onClick={() => setPolicyPopover(policyPopover === p.id ? null : p.id)} className="w-full text-left">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {p.tags.map((t) => <span key={t} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">{t}</span>)}
                  </div>
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">{p.title}</p>
                  <p className="mt-1 text-lg font-bold text-[#F97316]">{p.subsidy}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400"><Clock className="h-3 w-3" /> 截止 {p.deadline}</p>
                </button>
                <AnimatePresence>
                  {policyPopover === p.id && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border bg-white p-3 shadow-xl">
                      <p className="text-xs font-semibold text-gray-600">匹配度：{p.matchScore}%</p>
                      <p className="mt-1 text-xs text-gray-500">标签 {p.tags.join("、")} 与您的画像高度吻合</p>
                      {clauses.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[10px] font-medium text-gray-400">政策条款解读：</p>
                          {clauses.map((c) => (
                            <div key={c.id} className="flex items-start gap-1 text-[11px] text-gray-600">
                              <Eye className="h-3 w-3 shrink-0 mt-0.5 text-blue-500" />
                              <span>[{c.type === "policy" ? "政策" : c.type === "clause" ? "条款" : c.type === "condition" ? "条件" : "服务"}] {c.content}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => navigate("/assistant")}
                          className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                          <MessageCircle className="h-3 w-3" /> 咨询助手
                        </button>
                        <button onClick={() => setWizardId("ss3")}
                          className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-[#1A56DB] hover:bg-blue-100">
                          <ArrowRight className="h-3 w-3" /> 立即申报
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      <motion.section {...stagger.item} className="relative rounded-xl bg-white p-4 shadow-md">
        <h2 className="mb-2 text-base font-semibold text-gray-800">服务偏好热区 <span className="text-[10px] font-normal text-gray-400 ml-1">点击沉淀画像</span></h2>
        <div ref={chartRef} className="h-52 w-full cursor-pointer" />
        <AnimatePresence>
          {heatmapTip && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="absolute z-10 rounded-lg border bg-white px-3 py-2 shadow-lg text-xs"
              style={{ left: heatmapTip.x, top: heatmapTip.y - 60 }}>
              <div className="flex items-center gap-1 font-semibold text-gray-700">
                <MousePointerClick className="h-3 w-3 text-blue-500" /> {heatmapTip.label}
              </div>
              <p className="text-gray-500">点击次数：{heatmapTip.clicks}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      <motion.section {...stagger.container}>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
          <Sparkles className="h-5 w-5 text-purple-500" /> 一件事联办
        </h2>
        <div className="space-y-3">
          {orchestrationFlows.map((f) => {
            const expanded = expandedFlow === f.id
            const steps = flowSteps[f.id] ?? f.steps
            const completedCount = steps.filter((s) => s.status === "completed").length
            const hasFailed = steps.some((s) => s.status === "failed")
            const allDone = steps.every((s) => s.status === "completed")
            return (
              <motion.div key={f.id} {...stagger.item} className="rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <button onClick={() => setExpandedFlow(expanded ? null : f.id)}
                  className="flex w-full items-center justify-between p-4 text-left">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-800">{f.name}</h3>
                      {f.supervisionStatus === "submitted" && (
                        <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">已提交督办</span>
                      )}
                      {hasFailed && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">存在失败环节</span>}
                      {allDone && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">全部完成</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{f.description}</p>
                    {f.applicantName && <p className="mt-0.5 text-[11px] text-gray-500">申请人：{f.applicantName} · {f.applyDate}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">{completedCount}/{steps.length}</span>
                    <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", expanded && "rotate-180")} />
                  </div>
                </button>

                <div className="px-4 pb-2">
                  <div className="flex items-center gap-1">
                    {steps.map((step, i) => (
                      <div key={step.id} className="flex items-center">
                        <div className={cn("h-3 w-3 rounded-full",
                          step.status === "completed" ? "bg-emerald-500" : step.status === "processing" ? "bg-blue-500 animate-pulse" : step.status === "failed" ? "bg-red-500" : "bg-gray-300")} />
                        {i < steps.length - 1 && <div className={cn("h-0.5 w-5", step.autoTriggered ? "bg-amber-300" : "bg-gray-200")} />}
                      </div>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="border-t px-4 py-3 space-y-3">
                        <p className="text-xs text-gray-500 font-medium">跨部门联办节点：</p>
                        {steps.map((s, i) => (
                          <FlowStepDetail key={s.id} step={s} prevStep={i > 0 ? steps[i - 1] : undefined} />
                        ))}

                        {f.failureReason && (
                          <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
                            <p className="text-xs font-semibold text-red-700">联办失败原因</p>
                            <p className="text-[11px] text-red-600">{f.failureReason}</p>
                            {f.retryCount != null && <p className="text-[11px] text-red-500">系统已自动重试 {f.retryCount} 次</p>}
                            <p className="text-[11px] text-red-500">最近复查：{new Date().toLocaleDateString("zh-CN")} 系统自动复查，仍未通过</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          {steps.some((s) => s.status === "pending" || s.status === "failed") && (
                            <button onClick={() => handleAdvanceFlow(f.id)}
                              className="flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors">
                              <ArrowRight className="h-3 w-3" /> 触发下一步
                            </button>
                          )}
                          {f.supervisionStatus !== "submitted" && hasFailed && (
                            <button className="flex items-center gap-1 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors">
                              <AlertTriangle className="h-3 w-3" /> 提交督办
                            </button>
                          )}
                          {f.supervisionStatus === "submitted" && (
                            <span className="flex items-center gap-1 text-[11px] text-orange-600">
                              <Eye className="h-3 w-3" /> 督办已提交，等待处理
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      <AnimatePresence>
        {wizardId && <ApplicationWizard serviceId={wizardId} onClose={() => setWizardId(null)} />}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
