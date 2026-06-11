import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Bot, User, BookOpen, ChevronDown, ChevronUp, Download, ArrowRight, CheckCircle2, Link2, Trash2, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useChatStore } from "@/stores/useChatStore"
import { useBusinessStore } from "@/stores/useBusinessStore"
import { knowledgeNodes, knowledgeEdges } from "@/mocks/knowledgeGraph"
import { offlinePackages, deptServices } from "@/mocks/deptServices"
import { useECharts } from "@/hooks/useECharts"
import { cn } from "@/lib/utils"
import type { KnowledgeNode } from "@/types"

const nodeColors: Record<KnowledgeNode["type"], string> = {
  policy: "#3B82F6", condition: "#F97316", clause: "#22C55E", service: "#A855F7",
}
const nodeLabels: Record<KnowledgeNode["type"], string> = {
  policy: "政策", condition: "条件", clause: "条款", service: "服务",
}
const relationLabels: Record<string, string> = {
  references: "引用", requires: "前置条件", excludes: "互斥", triggers: "触发",
}

function getRelatedNodes(nodeId: string) {
  return knowledgeEdges
    .filter((e) => e.source === nodeId || e.target === nodeId)
    .map((e) => {
      const relatedId = e.source === nodeId ? e.target : e.source
      const relatedNode = knowledgeNodes.find((n) => n.id === relatedId)
      return relatedNode ? { ...relatedNode, relation: e.relation } : null
    })
    .filter(Boolean) as (KnowledgeNode & { relation: string })[]
}

function PolicyRef({ node, onConsult }: { node: KnowledgeNode; onConsult: (label: string) => void }) {
  const [open, setOpen] = useState(false)
  const related = getRelatedNodes(node.id)
  return (
    <div className="mt-1.5 border-l-2 pl-2 text-xs" style={{ borderColor: nodeColors[node.type] }}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
        <BookOpen className="h-3 w-3" />
        <span className="font-medium" style={{ color: nodeColors[node.type] }}>[{nodeLabels[node.type]}]</span>
        <span>{node.label}</span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="text-gray-500 py-1">{node.content}</p>
            {related.length > 0 && (
              <div className="mt-1 space-y-0.5">
                <p className="text-gray-400 font-medium">关联条款：</p>
                {related.map((r) => (
                  <div key={r.id} className="flex items-center gap-1 pl-2">
                    <Link2 className="h-2.5 w-2.5 text-gray-400" />
                    <span className="inline-block rounded px-1 py-px text-[10px] text-white" style={{ background: nodeColors[r.type] }}>{nodeLabels[r.type]}</span>
                    <span className="text-gray-600">{r.label}</span>
                    <span className="text-gray-300">({relationLabels[r.relation] ?? r.relation})</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => onConsult(node.label)}
              className="mt-1.5 inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-[#1A56DB] hover:bg-blue-100 transition-colors">
              <ArrowRight className="h-2.5 w-2.5" />去咨询
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white"><Bot className="h-4 w-4" /></div>
      <div className="rounded-2xl rounded-bl bg-white px-4 py-3 shadow-sm">
        <div className="flex gap-1">{[0, 1, 2].map((i) => <motion.span key={i} className="h-2 w-2 rounded-full bg-gray-400" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />)}</div>
      </div>
    </div>
  )
}

export default function Assistant() {
  const { messages, suggestedQuestions, sendMessage } = useChatStore()
  const { submitApplication, recordPreference } = useBusinessStore()
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [dlProgress, setDlProgress] = useState<Record<string, number>>({})
  const [cachedPkgs, setCachedPkgs] = useState<Record<string, { cachedAt: string }>>({})
  const chatEndRef = useRef<HTMLDivElement>(null)
  const prevMsgCountRef = useRef(messages.length)

  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      const last = messages[messages.length - 1]
      if (last.role === "user") setTyping(true)
      if (last.role === "assistant") setTyping(false)
    }
    prevMsgCountRef.current = messages.length
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleActionLink = useCallback((serviceId: string, label: string) => {
    const svc = deptServices.flatMap((d) => d.services).find((s) => s.id === serviceId)
    if (!svc) return
    const dept = deptServices.find((d) => d.services.some((s) => s.id === serviceId))
    submitApplication({
      serviceId, serviceName: svc.name, dept: dept?.deptName ?? "", deptColor: dept?.deptColor ?? "#1A56DB",
      materialsChecked: svc.materials.map(() => true), materials: svc.materials,
      currentStep: 0, totalSteps: svc.steps.length, steps: svc.steps, category: svc.category,
    })
    recordPreference(serviceId)
    setToast(`已提交申请：${label}`)
    setTimeout(() => setToast(null), 3000)
  }, [submitApplication, recordPreference])

  const handleConsult = useCallback((label: string) => {
    sendMessage(`请详细解读：${label}`)
  }, [sendMessage])

  const chartRef = useECharts({
    tooltip: {
      formatter: (p: unknown) => {
        const params = p as { data?: { name?: string } }
        const node = knowledgeNodes.find((n) => n.label === params.data?.name)
        return node ? `<b>${node.label}</b><br/>类型：${nodeLabels[node.type]}<br/>${node.content}` : params.data?.name || ""
      },
    },
    series: [{
      type: "graph", layout: "force", roam: true, draggable: true,
      label: { show: true, fontSize: 11, color: "#374151" },
      force: { repulsion: 180, edgeLength: [80, 160] },
      edgeSymbol: ["none", "arrow"],
      edgeLabel: { fontSize: 9, formatter: (p: unknown) => relationLabels[(p as { data?: { relation?: string } }).data?.relation ?? ""] ?? "" },
      emphasis: { focus: "adjacency", lineStyle: { width: 3 } },
      data: knowledgeNodes.map((n) => ({ name: n.label, category: n.type, symbolSize: n.type === "policy" ? 36 : 28, itemStyle: { color: nodeColors[n.type] } })),
      edges: knowledgeEdges.map((e) => ({ source: knowledgeNodes.find((n) => n.id === e.source)!.label, target: knowledgeNodes.find((n) => n.id === e.target)!.label, relation: e.relation })),
    }],
  }, [])

  const chartElRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => { chartElRef.current = chartRef.current }, [chartRef])

  useEffect(() => {
    const el = chartElRef.current
    if (!el) return
    let inst: import("echarts").ECharts | undefined
    import("echarts").then((echarts) => {
      inst = echarts.getInstanceByDom(el)
      inst?.on("click", (params: any) => {
        const node = knowledgeNodes.find((n) => n.label === params.name)
        if (node) setSelectedNode(node)
      })
    })
    return () => { inst?.off("click") }
  }, [])

  const handleDownloadPkg = (pkgId: string) => {
    setDlProgress((p) => ({ ...p, [pkgId]: 0 }))
    const start = Date.now()
    const tick = () => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / 2000) * 100))
      setDlProgress((p) => ({ ...p, [pkgId]: pct }))
      if (pct < 100) requestAnimationFrame(tick)
      else setCachedPkgs((c) => ({ ...c, [pkgId]: { cachedAt: new Date().toLocaleString("zh-CN") } }))
    }
    requestAnimationFrame(tick)
  }

  const handleClearCache = (pkgId: string) => {
    setCachedPkgs((c) => { const next = { ...c }; delete next[pkgId]; return next })
    setDlProgress((p) => { const next = { ...p }; delete next[pkgId]; return next })
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    sendMessage(text)
    setInput("")
  }

  const relatedToSelected = selectedNode ? getRelatedNodes(selectedNode.id) : []
  const svcFromSelected = selectedNode?.type === "service"
    ? deptServices.flatMap((d) => d.services).find((s) => selectedNode.label.includes(s.name.slice(0, 3)))
    : null

  return (
    <div className="flex h-[calc(100vh-0px)] gap-4 p-4">
      <div className="flex w-[60%] flex-col rounded-xl bg-white shadow-sm">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={cn("flex items-end gap-2", msg.role === "user" && "flex-row-reverse")}>
              <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white", msg.role === "user" ? "bg-blue-500" : "bg-blue-600")}>
                {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm", msg.role === "user" ? "rounded-br bg-blue-500 text-white" : "rounded-bl bg-gray-50 text-gray-800")}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.references?.map((ref) => <PolicyRef key={ref.id} node={ref} onConsult={handleConsult} />)}
                {msg.actionLink && msg.role === "assistant" && (
                  <button onClick={() => handleActionLink(msg.actionLink!.serviceId, msg.actionLink!.label)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#1A56DB] px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
                    <ArrowRight className="h-3 w-3" />{msg.actionLink.label}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {typing && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        <div className="border-t px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {suggestedQuestions.map((q) => (
              <button key={q} onClick={() => sendMessage(q)}
                className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-600 transition hover:bg-blue-100">{q}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="请输入您的问题…" className="flex-1 rounded-lg border bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
            <button onClick={handleSend} className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white transition hover:bg-blue-600"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="flex w-[40%] flex-col gap-3">
        <div className="flex-1 flex flex-col rounded-xl bg-white shadow-sm overflow-hidden">
          <h3 className="border-b px-4 py-3 text-sm font-semibold text-gray-700">政策条款关联图</h3>
          <div className="flex flex-wrap gap-3 border-b px-4 py-2">
            {(Object.entries(nodeLabels) as [KnowledgeNode["type"], string][]).map(([type, label]) => (
              <span key={type} className="flex items-center gap-1 text-xs text-gray-500">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: nodeColors[type] }} />{label}
              </span>
            ))}
          </div>
          <div ref={chartRef} className="flex-1 min-h-0" />
        </div>

        {selectedNode && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-white shadow-sm p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ background: nodeColors[selectedNode.type] }}>{nodeLabels[selectedNode.type]}</span>
                {selectedNode.label}
              </h4>
              <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600"><XCircle className="h-4 w-4" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-2">{selectedNode.content}</p>
            {relatedToSelected.length > 0 && (
              <div className="space-y-1 mb-2">
                <p className="text-[10px] font-medium text-gray-400">关联节点：</p>
                {relatedToSelected.map((r) => (
                  <div key={r.id} className="flex items-center gap-1 text-xs text-gray-500">
                    <Link2 className="h-3 w-3" />
                    <span className="inline-block rounded px-1 py-px text-[10px] text-white" style={{ background: nodeColors[r.type] }}>{nodeLabels[r.type]}</span>
                    {r.label} <span className="text-gray-300">({relationLabels[r.relation] ?? r.relation})</span>
                  </div>
                ))}
              </div>
            )}
            {svcFromSelected ? (
              <button onClick={() => handleActionLink(svcFromSelected.id, `办理${svcFromSelected.name}`)}
                className="w-full rounded-lg bg-[#1A56DB] px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-1">
                <ArrowRight className="h-3 w-3" />办理此服务
              </button>
            ) : selectedNode.type === "policy" ? (
              <button onClick={() => handleConsult(selectedNode.label)}
                className="w-full rounded-lg bg-[#1A56DB] px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-1">
                <BookOpen className="h-3 w-3" />查看条款解读
              </button>
            ) : null}
          </motion.div>
        )}

        <div className="rounded-xl bg-white shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Download className="h-4 w-4 text-[#1A56DB]" />离线服务包
          </h3>
          <div className="space-y-2.5">
            {offlinePackages.map((pkg) => {
              const cached = cachedPkgs[pkg.id]
              const prog = dlProgress[pkg.id]
              const downloading = prog !== undefined && prog < 100
              const downloaded = !!cached
              return (
                <div key={pkg.id} className="rounded-lg border border-gray-100 p-2.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex-1 text-gray-700 font-medium truncate">{pkg.name}</span>
                    <span className="text-gray-400 shrink-0">{pkg.size}</span>
                    <span className="text-gray-300 shrink-0">{pkg.version}</span>
                  </div>
                  {downloading && (
                    <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <motion.div className="h-full rounded-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${prog}%` }} transition={{ duration: 0.3 }} />
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center justify-end gap-2">
                    {downloaded ? (
                      <>
                        <span className="flex items-center gap-0.5 text-[11px] text-emerald-600"><CheckCircle2 className="h-3 w-3" />已缓存 {cached.cachedAt}</span>
                        <button onClick={() => handleClearCache(pkg.id)} className="flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="h-3 w-3" />清除缓存</button>
                      </>
                    ) : !downloading ? (
                      <button onClick={() => handleDownloadPkg(pkg.id)} className="flex items-center gap-0.5 rounded px-2 py-0.5 text-[11px] font-medium text-[#1A56DB] bg-blue-50 hover:bg-blue-100 transition-colors"><Download className="h-3 w-3" />下载缓存</button>
                    ) : (
                      <span className="text-[11px] text-blue-500">{prog}%</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-medium text-white shadow-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />{toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
