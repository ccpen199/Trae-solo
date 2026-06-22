import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield,
  AlertTriangle,
  XCircle,
  CheckCircle,
  FileText,
  Search,
  ChevronRight,
  Building2,
  Scale,
  Eye,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { storefronts, contractCheckItems } from "@/data/mockData"

const riskLabel = (level: "low" | "medium" | "high") => {
  if (level === "low") return "低风险"
  if (level === "medium") return "中风险"
  return "高风险"
}

const riskBadgeClass = (level: "low" | "medium" | "high") => {
  if (level === "low") return "badge-risk-low"
  if (level === "medium") return "badge-risk-medium"
  return "badge-risk-high"
}

const riskTypeIcon = (type: "property" | "contract" | "business") => {
  if (type === "property") return <Building2 className="w-4 h-4 text-coral-500" />
  if (type === "contract") return <FileText className="w-4 h-4 text-amber-500" />
  return <AlertTriangle className="w-4 h-4 text-navy-500" />
}

const statusIcon = (status: "pass" | "warning" | "danger") => {
  if (status === "pass") return <CheckCircle className="w-5 h-5 text-jade-500" />
  if (status === "warning") return <AlertTriangle className="w-5 h-5 text-amber-500" />
  return <XCircle className="w-5 h-5 text-coral-500" />
}

const PIE_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

export default function RiskEngine() {
  const [riskFilter, setRiskFilter] = useState<"all" | "risk">("all")
  const [expandedStore, setExpandedStore] = useState<string | null>(null)
  const [expandedContract, setExpandedContract] = useState<string | null>(null)

  const totalStores = storefronts.length
  const riskStores = storefronts.filter((s) => s.riskLevel !== "low").length
  const verifiedStores = storefronts.filter((s) => s.verified).length
  const totalCheckItems = contractCheckItems.length

  const filteredStorefronts =
    riskFilter === "all"
      ? storefronts
      : storefronts.filter((s) => s.riskLevel !== "low")

  const propertyRiskCount = storefronts.reduce(
    (acc, s) => acc + s.riskItems.filter((r) => r.type === "property").length,
    0
  )
  const contractRiskCount = storefronts.reduce(
    (acc, s) => acc + s.riskItems.filter((r) => r.type === "contract").length,
    0
  )
  const businessRiskCount = storefronts.reduce(
    (acc, s) => acc + s.riskItems.filter((r) => r.type === "business").length,
    0
  )

  const pieData = [
    { name: "产权风险", value: propertyRiskCount, level: "high" },
    { name: "合同风险", value: contractRiskCount, level: "medium" },
    { name: "经营风险", value: businessRiskCount, level: "low" },
  ].filter((d) => d.value > 0)

  const passCount = contractCheckItems.filter((c) => c.status === "pass").length
  const warningCount = contractCheckItems.filter((c) => c.status === "warning").length
  const dangerCount = contractCheckItems.filter((c) => c.status === "danger").length

  const dashboardCards = [
    {
      label: "门店总量",
      value: totalStores,
      icon: Building2,
      iconBg: "bg-navy-100",
      iconColor: "text-navy-600",
    },
    {
      label: "风险门店",
      value: riskStores,
      icon: AlertTriangle,
      iconBg: "bg-coral-100",
      iconColor: "text-coral-600",
    },
    {
      label: "已验证门店",
      value: verifiedStores,
      icon: CheckCircle,
      iconBg: "bg-jade-100",
      iconColor: "text-jade-600",
    },
    {
      label: "合同检查项",
      value: totalCheckItems,
      icon: FileText,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            风险引擎
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            产权瑕疵预警 · 合同条款合规检查 · 风险分布分析
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {dashboardCards.map((card) => (
            <motion.div key={card.label} variants={fadeInUp} className="card p-5">
              <div className="flex items-center gap-3">
                <div className={`${card.iconBg} p-2.5 rounded-lg`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy-900">{card.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.div variants={fadeInUp} className="flex items-center justify-between mb-4">
                <h2 className="section-title flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  产权瑕疵预警
                </h2>
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setRiskFilter("all")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      riskFilter === "all"
                        ? "bg-white shadow-sm text-navy-900"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    全部门店
                  </button>
                  <button
                    onClick={() => setRiskFilter("risk")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      riskFilter === "risk"
                        ? "bg-white shadow-sm text-navy-900"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    仅风险门店
                  </button>
                </div>
              </motion.div>

              <motion.div variants={stagger} className="space-y-3">
                {filteredStorefronts.map((store) => {
                  const isExpanded = expandedStore === store.id
                  return (
                    <motion.div
                      key={store.id}
                      variants={fadeInUp}
                      className="card overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedStore(isExpanded ? null : store.id)
                        }
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-lg ${
                              store.riskLevel === "high"
                                ? "bg-coral-100"
                                : store.riskLevel === "medium"
                                ? "bg-amber-100"
                                : "bg-jade-100"
                            }`}
                          >
                            <Building2
                              className={`w-4 h-4 ${
                                store.riskLevel === "high"
                                  ? "text-coral-600"
                                  : store.riskLevel === "medium"
                                  ? "text-amber-600"
                                  : "text-jade-600"
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-navy-900 truncate">
                              {store.title}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {store.district}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={riskBadgeClass(store.riskLevel)}>
                            {riskLabel(store.riskLevel)}
                          </span>
                          {store.riskItems.length > 0 && (
                            <span className="text-xs text-slate-400">
                              {store.riskItems.length}项风险
                            </span>
                          )}
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </motion.div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                              {store.riskItems.length > 0 ? (
                                store.riskItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex gap-3 p-3 bg-slate-50 rounded-lg"
                                  >
                                    <div className="shrink-0 mt-0.5">
                                      {riskTypeIcon(item.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm text-navy-900">
                                          {item.title}
                                        </span>
                                        <span
                                          className={riskBadgeClass(item.level)}
                                        >
                                          {riskLabel(item.level)}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-500 leading-relaxed">
                                        {item.description}
                                      </p>
                                      <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                                        <Search className="w-3 h-3" />
                                        {item.suggestion}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center gap-2 py-2 text-jade-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm">暂无风险项</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </motion.div>
            </motion.section>

            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.div variants={fadeInUp} className="mb-4">
                <h2 className="section-title flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-500" />
                  合同条款合规检查
                </h2>
              </motion.div>

              <motion.div variants={stagger} className="space-y-3">
                {contractCheckItems.map((item) => {
                  const isExpanded = expandedContract === item.id
                  return (
                    <motion.div
                      key={item.id}
                      variants={fadeInUp}
                      className="card overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedContract(isExpanded ? null : item.id)
                        }
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {statusIcon(item.status)}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-navy-900 text-sm">
                              {item.clause}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                              {item.content}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={riskBadgeClass(item.riskLevel)}>
                            {riskLabel(item.riskLevel)}
                          </span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </motion.div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm text-navy-800 leading-relaxed">
                                  {item.detail}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="mt-4 card p-4 flex items-center justify-center gap-8"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-jade-500" />
                  <span className="text-sm text-slate-600">
                    <span className="font-bold text-jade-600">{passCount}</span>项通过
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-slate-600">
                    <span className="font-bold text-amber-600">{warningCount}</span>项警告
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-coral-500" />
                  <span className="text-sm text-slate-600">
                    <span className="font-bold text-coral-600">{dangerCount}</span>项风险
                  </span>
                </div>
              </motion.div>
            </motion.section>
          </div>

          <aside className="space-y-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="card p-5 sticky top-6"
            >
              <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                风险分布
              </h3>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[entry.level]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        fontSize: "13px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-xs text-slate-600">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-coral-500" />
                    产权风险
                  </span>
                  <span className="font-semibold text-coral-600">
                    {propertyRiskCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    合同风险
                  </span>
                  <span className="font-semibold text-amber-600">
                    {contractRiskCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-jade-500" />
                    经营风险
                  </span>
                  <span className="font-semibold text-jade-600">
                    {businessRiskCount}
                  </span>
                </div>
              </div>
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  )
}
