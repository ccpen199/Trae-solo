import { useState, useCallback, useEffect, useRef } from "react"
import { Star, MessageSquare, Clock, AlertCircle, CheckCircle2, TrendingUp, Filter, ChevronDown, ChevronRight, Plus, Link2, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useECharts } from "@/hooks/useECharts"
import { workOrders as baseWorkOrders, clusterAnalysis } from "@/mocks/feedbackData"
import type { WorkOrder } from "@/types"

type ExtWorkOrder = WorkOrder & { keywords?: string[]; _isNew?: boolean; assignedAt?: string }

const QUICK_TAGS = ["材料复杂", "等待时间长", "流程繁琐", "指引不清", "系统卡顿", "态度差"]
const KEYWORD_CLUSTER_MAP: Record<string, string> = { "材料复杂": "材料问题", "审核严格": "材料问题", "等待时间长": "效率问题", "效率低": "效率问题", "办理慢": "效率问题", "流程繁琐": "流程问题", "指引不清": "流程问题", "操作复杂": "流程问题", "系统卡顿": "系统问题", "预约难": "系统问题", "系统报错": "系统问题", "态度差": "服务态度", "不耐烦": "服务态度" }

const STATUS_MAP: Record<WorkOrder["status"], { label: string; color: string; icon: typeof AlertCircle }> = {
  pending: { label: "待处理", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  processing: { label: "处理中", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  resolved: { label: "已解决", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  closed: { label: "已关闭", color: "bg-gray-100 text-gray-500", icon: CheckCircle2 },
}

function getRandomColor() {
  const c = ["#1A56DB", "#3B82F6", "#F59E0B", "#EF4444", "#10B981", "#8B5CF6", "#EC4899", "#F97316"]
  return c[Math.floor(Math.random() * c.length)]
}

function extractKeywords(comment: string): string[] {
  return Object.keys(KEYWORD_CLUSTER_MAP).filter((k) => comment.includes(k))
}

function classifyCategory(keywords: string[]): string {
  for (const kw of keywords) { if (KEYWORD_CLUSTER_MAP[kw]) return KEYWORD_CLUSTER_MAP[kw] }
  return "流程问题"
}

function CountdownTimer({ deadline }: { deadline: string }) {
  const diff = new Date(deadline).getTime() - Date.now()
  const days = Math.max(0, Math.ceil(diff / 86400000))
  return <span className={cn("text-sm font-medium", days <= 2 ? "text-red-500" : days <= 5 ? "text-orange-500" : "text-gray-500")}>{days > 0 ? `剩余${days}天` : "已逾期"}</span>
}

function ServiceRating({ onSubmit }: { onSubmit: (r: number, c: string, tags: string[], woId: string | null, cat: string | null) => void }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ woId: string | null; cat: string } | null>(null)

  const toggleTag = (tag: string) => setSelectedTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag])

  const handleSubmit = () => {
    if (!rating) return
    const keywords = [...selectedTags, ...extractKeywords(comment)]
    const cat = classifyCategory(keywords)
    const woId = rating <= 2 ? `WO-${Date.now().toString().slice(-6)}` : null
    setResult({ woId, cat })
    onSubmit(rating, comment, selectedTags, woId, cat)
    setSubmitted(true)
  }

  const handleAddFollowUp = () => { setSubmitted(false); setRating(0); setComment(""); setSelectedTags([]); setResult(null) }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4"><Star className="w-5 h-5 text-[#1A56DB]" /> 服务评价入口</h2>
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 font-medium"><CheckCircle2 className="w-5 h-5" /> 反馈提交成功！</div>
            {result?.woId && <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2"><Zap className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" /><div><p className="text-sm font-medium text-amber-800">您的差评已自动生成督办工单</p><p className="text-xs text-amber-600 mt-1">工单号：{result.woId}</p></div></div>}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2"><Link2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /><div><p className="text-xs text-blue-700">NLP自动分类：<span className="font-medium">{result?.cat}</span></p><p className="text-xs text-blue-500 mt-0.5">关键词提取 → 类别判定 → 工单生成</p></div></div>
            <button onClick={handleAddFollowUp} className="flex items-center gap-1 text-sm text-[#1A56DB] hover:underline"><Plus className="w-4 h-4" /> 追加反馈</button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setRating(s)} className="p-0.5">
                  <Star className={cn("w-7 h-7 transition-colors", (hover || rating) >= s ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-500">{rating > 0 ? `${rating}星` : "请评分"}</span>
              {rating > 0 && rating <= 2 && <span className="ml-2 text-xs text-amber-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />差评将自动生成督办工单</span>}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_TAGS.map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)} className={cn("px-3 py-1 rounded-full text-sm border transition-colors", selectedTags.includes(tag) ? "bg-[#1A56DB] text-white border-[#1A56DB]" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#1A56DB]")}>{tag}</button>
              ))}
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="请输入您的反馈意见..." className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:border-[#1A56DB]" />
            <button onClick={handleSubmit} className="mt-3 bg-[#1A56DB] text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">提交反馈</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function WorkOrderCard({ order, expanded, onToggle, onUrge }: { order: ExtWorkOrder; expanded: boolean; onToggle: () => void; onUrge: () => void }) {
  const si = STATUS_MAP[order.status]
  const SI = si.icon
  return (
    <div className={cn("border rounded-lg overflow-hidden transition-all", order._isNew ? "border-amber-300 bg-amber-50/30" : "border-gray-100")}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-700">{order.id}</span>
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1", si.color)}><SI className="w-3 h-3" />{si.label}</span>
          {order.clusterCategory && <span className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-600 font-medium">{order.clusterCategory}</span>}
          <span className="text-sm text-gray-600">{order.dept}</span>
        </div>
        <div className="flex items-center gap-3">
          <CountdownTimer deadline={order.deadline} />
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-4 border-t border-gray-50">
            {order.sourceRating != null && (
              <div className="mt-3 flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-0.5 shrink-0 mt-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("w-3.5 h-3.5", i < (order.sourceRating ?? 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />)}</div>
                <div className="min-w-0"><p className="text-sm text-gray-700">"{order.sourceComment}"</p>{order.keywords && <p className="text-xs text-blue-500 mt-1">提取关键词：{order.keywords.join("、")}</p>}</div>
              </div>
            )}
            <p className="text-sm text-gray-600 mt-2">{order.description}</p>
            {order.handler && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" />处理人：{order.handler}</p>}
            {order.handleNote && <p className="text-xs text-gray-500 mt-1">处理备注：{order.handleNote}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
              <span>创建: {order.createdAt}</span>
              {order.assignedAt && <span>分配: {order.assignedAt}</span>}
              <span>截止: {order.deadline}</span>
              {order.resolvedAt && <span className="text-green-500">解决: {order.resolvedAt}</span>}
            </div>
            {(order.status === "pending" || order.status === "processing") && (
              <button onClick={onUrge} className="mt-2 text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium"><Zap className="w-3 h-3" />催办</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function WorkOrderList({ orders, onUrge, highlightCategory }: { orders: ExtWorkOrder[]; onUrge: (id: string) => void; highlightCategory: string | null }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const filtered = highlightCategory ? orders.filter((o) => o.clusterCategory === highlightCategory) : orders
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-1"><Filter className="w-5 h-5 text-[#1A56DB]" /> 督办工单列表</h2>
      {highlightCategory && <p className="text-xs text-blue-500 mb-3 flex items-center gap-1"><Link2 className="w-3 h-3" />筛选：{highlightCategory}</p>}
      <div className="space-y-3">
        {filtered.map((order) => (
          <WorkOrderCard key={order.id} order={order} expanded={expanded === order.id} onToggle={() => setExpanded(expanded === order.id ? null : order.id)} onUrge={() => onUrge(order.id)} />
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">暂无匹配工单</p>}
      </div>
    </div>
  )
}

function ClusterToOrderTable({ orders }: { orders: ExtWorkOrder[] }) {
  const categoryMap = new Map<string, ExtWorkOrder[]>()
  orders.forEach((o) => { if (o.clusterCategory) { const list = categoryMap.get(o.clusterCategory) || []; list.push(o); categoryMap.set(o.clusterCategory, list) } })
  const total = orders.length
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-2"><Link2 className="w-4 h-4 text-[#1A56DB]" /> 聚类→工单关联</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100"><th className="text-left py-2 px-2 text-gray-500 font-medium">类别</th><th className="text-center py-2 px-2 text-gray-500 font-medium">工单数</th><th className="text-center py-2 px-2 text-gray-500 font-medium">占比</th><th className="text-left py-2 px-2 text-gray-500 font-medium">触发关键词</th><th className="text-left py-2 px-2 text-gray-500 font-medium">关联工单</th></tr></thead>
          <tbody>
            {Array.from(categoryMap.entries()).map(([cat, woList]) => {
              const catKw = Object.entries(KEYWORD_CLUSTER_MAP).filter(([, v]) => v === cat).map(([k]) => k)
              return (
                <tr key={cat} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-2"><span className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-600 font-medium">{cat}</span></td>
                  <td className="py-2 px-2 text-center font-medium">{woList.length}</td>
                  <td className="py-2 px-2 text-center text-gray-500">{total ? ((woList.length / total) * 100).toFixed(1) : 0}%</td>
                  <td className="py-2 px-2 text-xs text-gray-500">{catKw.join("、")}</td>
                  <td className="py-2 px-2 text-xs text-gray-400">{woList.map((w) => w.id).join(", ")}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ClusterCharts({ orders, onCategoryClick }: { orders: ExtWorkOrder[]; onCategoryClick: (cat: string | null) => void }) {
  const pieRef = useECharts({
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    color: ["#1A56DB", "#3B82F6", "#F59E0B", "#EF4444", "#10B981"],
    series: [{
      type: "pie", radius: ["40%", "70%"], center: ["50%", "50%"],
      label: { fontSize: 11, formatter: "{b}\n{d}%" },
      data: clusterAnalysis.categories.map((c) => ({ name: c.name, value: c.count })),
    }],
  }, [])

  useEffect(() => {
    const el = pieRef.current
    if (!el) return
    let inst: any
    import("echarts").then((echarts) => {
      inst = echarts.getInstanceByDom(el)
      inst?.on("click", (params: any) => {
        if (params.name) onCategoryClick(params.name)
      })
    })
    return () => { inst?.off("click") }
  }, [onCategoryClick])

  const wordCloudRef = useECharts({
    series: [{
      type: 'wordCloud' as const, shape: 'circle', left: 'center', top: 'center',
      width: '90%', height: '90%', sizeRange: [12, 48], rotationRange: [-45, 45],
      rotationStep: 15, gridSize: 8, drawOutOfBound: false,
      textStyle: { fontFamily: 'sans-serif', fontWeight: 'bold' },
      emphasis: { textStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.15)' } } as Record<string, unknown>,
      data: clusterAnalysis.wordCloud.map((w) => ({ name: w.text, value: w.value, textStyle: { color: getRandomColor() } })),
    }],
  }, [])

  const lineRef = useECharts({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: clusterAnalysis.trend.map((t) => t.date), axisLabel: { fontSize: 10 } },
    yAxis: { type: "value", axisLabel: { fontSize: 10 } },
    series: [{
      type: "line", data: clusterAnalysis.trend.map((t) => t.count), smooth: true,
      areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(26,86,219,0.3)" }, { offset: 1, color: "rgba(26,86,219,0.02)" }] } },
      lineStyle: { color: "#1A56DB", width: 2 }, itemStyle: { color: "#1A56DB" },
    }],
    grid: { left: 40, right: 16, top: 16, bottom: 32 },
  }, [])

  const charts = [
    { ref: wordCloudRef, title: "关键词云", icon: MessageSquare },
    { ref: pieRef, title: "类别分布（点击筛选工单）", icon: TrendingUp },
    { ref: lineRef, title: "趋势分析", icon: TrendingUp },
  ]

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-[#1A56DB]" /> 原因聚类分析</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {charts.map((item, i) => (
          <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}>
            <p className="text-sm font-medium text-gray-600 flex items-center gap-1 mb-2"><item.icon className="w-4 h-4" />{item.title}</p>
            <div ref={item.ref} className="w-full h-64 cursor-pointer" />
          </motion.div>
        ))}
      </div>
      <ClusterToOrderTable orders={orders} />
    </div>
  )
}

export default function Feedback() {
  const [orders, setOrders] = useState<ExtWorkOrder[]>([...baseWorkOrders])
  const [highlightCat, setHighlightCat] = useState<string | null>(null)

  const handleSubmit = useCallback((rating: number, comment: string, tags: string[], woId: string | null, cat: string | null) => {
    if (woId && cat) {
      const keywords = [...tags, ...extractKeywords(comment)]
      const now = new Date().toISOString().slice(0, 10)
      const newOrder: ExtWorkOrder = {
        id: woId, feedbackId: `f-new-${Date.now()}`, dept: cat === "效率问题" ? "政务服务中心" : cat === "材料问题" ? "审批服务局" : cat === "系统问题" ? "大数据局" : cat === "服务态度" ? "效能办" : "政务服务中心",
        status: "pending", deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        description: `用户差评自动生成工单 - ${cat}`, createdAt: now,
        sourceRating: rating, sourceComment: comment, clusterCategory: cat,
        keywords, _isNew: true, assignedAt: now,
      }
      setOrders((prev) => [newOrder, ...prev])
    }
  }, [])

  const handleUrge = useCallback((id: string) => {
    setOrders((prev) => prev.map((o) => o.id === id && o.status === "pending" ? { ...o, status: "processing" as const, handler: o.handler || "待分配-催办加急", handleNote: o.handleNote || "已催办，正在加急处理", assignedAt: new Date().toISOString().slice(0, 10) } : o))
  }, [])

  const handleCategoryClick = useCallback((cat: string | null) => setHighlightCat((prev) => prev === cat ? null : cat), [])

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-gray-800">服务反馈</motion.h1>
      <ServiceRating onSubmit={handleSubmit} />
      <WorkOrderList orders={orders} onUrge={handleUrge} highlightCategory={highlightCat} />
      <ClusterCharts orders={orders} onCategoryClick={handleCategoryClick} />
    </div>
  )
}
