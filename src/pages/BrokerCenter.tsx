import { useState } from "react"
import { motion } from "framer-motion"
import {
  User, Award, Star, Calendar, CheckCircle, XCircle, Clock,
  DollarSign, TrendingUp, FileText, ChevronRight, Phone, Building2,
} from "lucide-react"
import { broker } from "@/data/mockData"

const tabs = ["认证信息", "带看管理", "返佣结算"] as const
type TabKey = (typeof tabs)[number]

const statusConfig: Record<string, { label: string; dotClass: string; badgeClass: string }> = {
  scheduled: { label: "待带看", dotClass: "bg-amber-400 animate-pulse", badgeClass: "bg-amber-50 text-amber-700 border border-amber-200" },
  completed: { label: "已完成", dotClass: "bg-jade-500", badgeClass: "bg-jade-50 text-jade-700 border border-jade-200" },
  cancelled: { label: "已取消", dotClass: "bg-coral-500", badgeClass: "bg-coral-50 text-coral-700 border border-coral-200" },
}

const commissionStatusConfig: Record<string, { label: string; cls: string }> = {
  pending: { label: "待结算", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  settled: { label: "已结算", cls: "bg-jade-50 text-jade-700 border border-jade-200" },
  withdrawn: { label: "已提现", cls: "bg-slate-100 text-slate-600 border border-slate-200" },
}

const tabVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -60 : 60, opacity: 0 }),
}

export default function BrokerCenter() {
  const [activeTab, setActiveTab] = useState<TabKey>("认证信息")
  const [direction, setDirection] = useState(0)
  const [expandedViewing, setExpandedViewing] = useState<string | null>(null)

  const handleTabChange = (tab: TabKey) => {
    const idx = tabs.indexOf(tab)
    const curr = tabs.indexOf(activeTab)
    setDirection(idx > curr ? 1 : -1)
    setActiveTab(tab)
  }

  const completedViewings = broker.viewings.filter((v) => v.status === "completed").length
  const pendingTotal = broker.commissions.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0)
  const settledTotal = broker.commissions.filter((c) => c.status === "settled").reduce((s, c) => s + c.amount, 0)
  const withdrawnTotal = broker.commissions.filter((c) => c.status === "withdrawn").reduce((s, c) => s + c.amount, 0)
  const withdrawable = settledTotal - withdrawnTotal

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-navy-gradient text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="card flex flex-col sm:flex-row items-center gap-6 bg-white/10 backdrop-blur-sm border-white/20">
            <img
              src={broker.avatar}
              alt={broker.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-amber-400 shadow-amber-glow"
            />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-2xl font-bold text-white">{broker.name}</h2>
                {broker.certified && (
                  <span className="flex items-center gap-1 text-xs bg-jade-500/20 text-jade-300 px-2 py-0.5 rounded-full border border-jade-500/30">
                    <Award className="w-3 h-3" />
                    已认证
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(broker.rating) ? "text-amber-400 fill-amber-400" : "text-slate-400"}`}
                  />
                ))}
                <span className="text-sm text-amber-300 ml-1">{broker.rating}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-slate-300">
                <span>完成带看 <strong className="text-white">{completedViewings}次</strong></span>
                <span className="text-slate-500">|</span>
                <span>成交 <strong className="text-white">{broker.dealCount}单</strong></span>
                <span className="text-slate-500">|</span>
                <span>好评率 <strong className="text-white">98%</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-4">
        <div className="card">
          <div className="flex border-b border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex-1 py-3 text-sm font-medium text-center relative transition-colors ${
                  activeTab === tab ? "text-navy-700" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy-700"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="relative overflow-hidden">
            <motion.div
              key={activeTab}
              custom={direction}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {activeTab === "认证信息" && (
                <div className="p-6 space-y-6">
                  <div className={`flex items-center gap-3 p-4 rounded-xl ${
                    broker.certified
                      ? "bg-jade-50 border border-jade-200"
                      : "bg-amber-50 border border-amber-200"
                  }`}>
                    {broker.certified ? (
                      <CheckCircle className="w-8 h-8 text-jade-500" />
                    ) : (
                      <Clock className="w-8 h-8 text-amber-500" />
                    )}
                    <div>
                      <p className={`font-semibold ${broker.certified ? "text-jade-700" : "text-amber-700"}`}>
                        {broker.certified ? "已通过认证" : "认证申请中"}
                      </p>
                      <p className={`text-sm ${broker.certified ? "text-jade-600" : "text-amber-600"}`}>
                        {broker.certified ? "您的经纪人资质已通过平台审核" : "您的认证申请正在审核中，请耐心等待"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                      <User className="w-5 h-5 text-navy-500" />
                      <div>
                        <p className="text-xs text-slate-400">姓名</p>
                        <p className="font-medium text-navy-800">{broker.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                      <Phone className="w-5 h-5 text-navy-500" />
                      <div>
                        <p className="text-xs text-slate-400">手机号</p>
                        <p className="font-medium text-navy-800">138****6789</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                      {broker.certified ? (
                        <CheckCircle className="w-5 h-5 text-jade-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-coral-500" />
                      )}
                      <div>
                        <p className="text-xs text-slate-400">认证状态</p>
                        <p className={`font-medium ${broker.certified ? "text-jade-600" : "text-coral-600"}`}>
                          {broker.certified ? "已认证" : "未认证"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-navy-500" />
                      <div>
                        <p className="text-xs text-slate-400">认证日期</p>
                        <p className="font-medium text-navy-800">
                          {broker.certified ? "2025-03-15" : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!broker.certified && (
                    <button className="btn-primary w-full flex items-center justify-center gap-2">
                      <Award className="w-4 h-4" />
                      提交认证
                    </button>
                  )}
                </div>
              )}

              {activeTab === "带看管理" && (
                <div className="p-6">
                  <div className="relative">
                    {broker.viewings.map((viewing, index) => {
                      const config = statusConfig[viewing.status]
                      const isExpanded = expandedViewing === viewing.id
                      const isLast = index === broker.viewings.length - 1

                      return (
                        <motion.div
                          key={viewing.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.4 }}
                          className="flex gap-4"
                        >
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full mt-2 shrink-0 ${config.dotClass}`} />
                            {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                          </div>

                          <div className={`flex-1 pb-6 ${isLast ? "" : ""}`}>
                            <motion.div
                              className={`card cursor-pointer hover:shadow-md transition-shadow ${
                                isExpanded ? "ring-1 ring-navy-300" : ""
                              }`}
                              onClick={() => setExpandedViewing(isExpanded ? null : viewing.id)}
                              layout
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Building2 className="w-4 h-4 text-navy-400 shrink-0" />
                                    <p className="font-semibold text-navy-800 truncate">{viewing.storeTitle}</p>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <User className="w-3.5 h-3.5" />
                                      {viewing.clientName}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {viewing.scheduledAt}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.badgeClass}`}>
                                    {config.label}
                                  </span>
                                  <ChevronRight
                                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                  />
                                </div>
                              </div>

                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="mt-3 pt-3 border-t border-slate-100"
                                >
                                  <p className="text-sm text-slate-600">
                                    <FileText className="w-3.5 h-3.5 inline mr-1.5 text-slate-400" />
                                    {viewing.notes}
                                  </p>
                                </motion.div>
                              )}
                            </motion.div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}

              {activeTab === "返佣结算" && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-amber-600">待结算总额</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-700">
                        ¥{pendingTotal.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-jade-50 border border-jade-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-jade-500" />
                        <span className="text-sm text-jade-600">已结算总额</span>
                      </div>
                      <p className="text-2xl font-bold text-jade-700">
                        ¥{settledTotal.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-navy-50 border border-navy-200">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-navy-500" />
                        <span className="text-sm text-navy-600">可提现金额</span>
                      </div>
                      <p className="text-2xl font-bold text-navy-700">
                        ¥{withdrawable.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-3 text-slate-500 font-medium">门店名称</th>
                          <th className="text-left py-3 px-3 text-slate-500 font-medium">成交编号</th>
                          <th className="text-right py-3 px-3 text-slate-500 font-medium">返佣金额</th>
                          <th className="text-center py-3 px-3 text-slate-500 font-medium">状态</th>
                          <th className="text-right py-3 px-3 text-slate-500 font-medium">结算日期</th>
                        </tr>
                      </thead>
                      <tbody>
                        {broker.commissions.map((c) => {
                          const cs = commissionStatusConfig[c.status]
                          return (
                            <motion.tr
                              key={c.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                              <td className="py-3 px-3 font-medium text-navy-800">{c.storeTitle}</td>
                              <td className="py-3 px-3 text-slate-500">{c.dealId}</td>
                              <td className="py-3 px-3 text-right font-semibold text-amber-700">
                                ¥{c.amount.toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${cs.cls}`}>
                                  {cs.label}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right text-slate-500">
                                {c.settledAt || "-"}
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <button className="btn-primary w-full flex items-center justify-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    申请提现
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
