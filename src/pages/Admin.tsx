import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import {
  FileText,
  CreditCard,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserPlus,
  Play,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { useAppStore } from "@/stores/useAppStore"
import { adminDashboardStats } from "@/lib/mockData"

const tabs = ["事项审核", "证照审核", "建言办理", "舆情监控"] as const
type TabKey = (typeof tabs)[number]

const tabToHash: Record<TabKey, string> = {
  事项审核: "service-review",
  证照审核: "cert-review",
  建言办理: "suggestion-review",
  舆情监控: "opinion",
}

const hashToTab: Record<string, TabKey> = {
  "#service-review": "事项审核",
  "#cert-review": "证照审核",
  "#suggestion-review": "建言办理",
  "#opinion": "舆情监控",
}

const levelBadgeMap: Record<string, { label: string; className: string }> = {
  low: { label: "低", className: "badge-info" },
  medium: { label: "中", className: "badge-warning" },
  high: { label: "高", className: "badge-error bg-red-100" },
  critical: { label: "紧急", className: "badge-error bg-red-100 animate-pulse border-2 border-red-500" },
}

const opinionStatusBadge: Record<string, { label: string; className: string }> = {
  new: { label: "新发现", className: "badge-info" },
  monitoring: { label: "监控中", className: "badge-warning" },
  responding: { label: "处置中", className: "badge-error" },
  resolved: { label: "已解决", className: "badge-success" },
}

const suggestionStatusBadge: Record<string, { label: string; className: string }> = {
  submitted: { label: "待分派", className: "badge-info" },
  assigned: { label: "已分派", className: "badge-warning" },
  processing: { label: "办理中", className: "badge-error" },
  completed: { label: "已完成", className: "badge-success" },
}

const statCards = [
  { label: "待审核事项", count: adminDashboardStats.pendingReviews, icon: FileText, bg: "bg-gov-blue" },
  { label: "待签发证照", count: adminDashboardStats.certificatesToAudit, icon: CreditCard, bg: "bg-status-success" },
  { label: "待分派建议", count: adminDashboardStats.suggestionsToAssign, icon: Lightbulb, bg: "bg-gov-gold" },
  { label: "舆情预警", count: adminDashboardStats.publicOpinionAlerts, icon: AlertTriangle, bg: "bg-gov-red" },
]

export default function Admin() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<TabKey>("事项审核")
  const [appStatusOverrides, setAppStatusOverrides] = useState<Record<string, "approved" | "rejected">>({})
  const [certStatusOverrides, setCertStatusOverrides] = useState<Record<string, "valid">>({})
  const [suggestionResponses, setSuggestionResponses] = useState<Record<string, string>>({})
  const [opinionResponses, setOpinionResponses] = useState<Record<string, string>>({})

  const {
    applications,
    certificates,
    suggestions,
    publicOpinions,
    updateSuggestionStatus,
    updatePublicOpinionStatus,
  } = useAppStore()

  useEffect(() => {
    const nextTab = hashToTab[location.hash]
    if (nextTab) setActiveTab(nextTab)
  }, [location.hash])

  const pendingApps = applications.filter((a) => {
    const override = appStatusOverrides[a.id]
    if (override) return false
    return a.status === "pending"
  })

  const handleApproveApp = (id: string) => {
    setAppStatusOverrides((prev) => ({ ...prev, [id]: "approved" }))
  }

  const handleRejectApp = (id: string) => {
    setAppStatusOverrides((prev) => ({ ...prev, [id]: "rejected" }))
  }

  const handleRenewCert = (id: string) => {
    setCertStatusOverrides((prev) => ({ ...prev, [id]: "valid" }))
  }

  const handleAssignSuggestion = (id: string) => {
    updateSuggestionStatus(id, "assigned", undefined)
  }

  const handleProcessSuggestion = (id: string) => {
    const response = suggestionResponses[id]
    if (!response?.trim()) return
    updateSuggestionStatus(id, "completed", response)
    setSuggestionResponses((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleStartMonitoring = (id: string) => {
    updatePublicOpinionStatus(id, "monitoring", undefined)
  }

  const handleTabClick = (tab: TabKey) => {
    setActiveTab(tab)
    window.history.replaceState(null, "", `#${tabToHash[tab]}`)
  }

  const handleOpinionResponse = (id: string) => {
    const response = opinionResponses[id]
    if (!response?.trim()) return
    updatePublicOpinionStatus(id, "responding", response)
    setOpinionResponses((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="section-title text-2xl mb-6">后台管理 · 民警工作台</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="card p-5 flex items-center gap-4">
                <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{card.count}</p>
                  <p className="text-sm text-neutral-slate">{card.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="card p-6 mb-6">
          <h2 className="section-title mb-4">本周业务趋势</h2>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={adminDashboardStats.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#475569" fontSize={13} />
                <YAxis stroke="#475569" fontSize={13} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: 13,
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="applications"
                  name="申请量"
                  stroke="#1A5FB4"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="完成量"
                  stroke="#16A34A"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex border-b border-neutral-border">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`flex-1 px-6 py-3.5 text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab
                    ? "text-gov-blue border-b-2 border-gov-blue bg-primary-50/50"
                    : "text-neutral-slate hover:text-primary hover:bg-neutral-bg"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div id={tabToHash[activeTab]} className="p-6">
            {activeTab === "事项审核" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-border">
                      <th className="text-left py-3 px-4 font-semibold text-primary">申请人</th>
                      <th className="text-left py-3 px-4 font-semibold text-primary">事项类型</th>
                      <th className="text-left py-3 px-4 font-semibold text-primary">提交时间</th>
                      <th className="text-left py-3 px-4 font-semibold text-primary">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApps.map((app) => (
                      <tr key={app.id} className="border-b border-neutral-divider hover:bg-primary-50/30 transition-colors">
                        <td className="py-3 px-4">{app.applicantName}</td>
                        <td className="py-3 px-4">{app.typeName}</td>
                        <td className="py-3 px-4 text-neutral-slate">{app.submitTime}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveApp(app.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-green-50 text-status-success hover:bg-green-100 transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              通过
                            </button>
                            <button
                              onClick={() => handleRejectApp(app.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-red-50 text-status-error hover:bg-red-100 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              驳回
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingApps.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-neutral-slate">暂无待审核事项</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "证照审核" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-border">
                      <th className="text-left py-3 px-4 font-semibold text-primary">持证人</th>
                      <th className="text-left py-3 px-4 font-semibold text-primary">证照类型</th>
                      <th className="text-left py-3 px-4 font-semibold text-primary">有效期</th>
                      <th className="text-left py-3 px-4 font-semibold text-primary">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map((cert) => {
                      const overridden = certStatusOverrides[cert.id]
                      const displayStatus = overridden || cert.status
                      const isExpired = cert.status === "expired" && !overridden
                      return (
                        <tr key={cert.id} className="border-b border-neutral-divider hover:bg-primary-50/30 transition-colors">
                          <td className="py-3 px-4">{cert.holderName}</td>
                          <td className="py-3 px-4">{cert.typeName}</td>
                          <td className="py-3 px-4 text-neutral-slate">{cert.expiryDate}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={displayStatus === "valid" ? "badge-success" : displayStatus === "expired" ? "badge-error" : "badge-warning"}>
                                {displayStatus === "valid" ? "有效" : displayStatus === "expired" ? "已过期" : "已注销"}
                              </span>
                              {isExpired && (
                                <button
                                  onClick={() => handleRenewCert(cert.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-green-50 text-status-success hover:bg-green-100 transition-colors"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  续签
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "建言办理" && (
              <div className="space-y-4">
                {suggestions.map((sug) => {
                  const badge = suggestionStatusBadge[sug.status] || suggestionStatusBadge.submitted
                  return (
                    <div key={sug.id} className="card p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-primary font-medium leading-relaxed line-clamp-2">{sug.content}</p>
                        </div>
                        <span className={badge.className + " shrink-0"}>{badge.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-slate mb-3">
                        <span>分类：{sug.category}</span>
                        <span>提交人：{sug.userName}</span>
                        {sug.assignee && <span>办理人：{sug.assignee}</span>}
                        <span>截止：{sug.deadline}</span>
                      </div>
                      {sug.response && (
                        <div className="bg-primary-50/50 rounded-lg p-3 text-sm text-primary mb-3">
                          <span className="font-medium">回复：</span>{sug.response}
                        </div>
                      )}
                      {sug.status === "submitted" && (
                        <button
                          onClick={() => handleAssignSuggestion(sug.id)}
                          className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm"
                        >
                          <UserPlus className="w-4 h-4" />
                          分派
                        </button>
                      )}
                      {(sug.status === "assigned" || sug.status === "processing") && (
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={suggestionResponses[sug.id] || ""}
                            onChange={(e) =>
                              setSuggestionResponses((prev) => ({ ...prev, [sug.id]: e.target.value }))
                            }
                            placeholder="输入办理回复..."
                            className="input-field flex-1 text-sm py-2"
                          />
                          <button
                            onClick={() => handleProcessSuggestion(sug.id)}
                            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            办理
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
                {suggestions.length === 0 && (
                  <p className="text-center text-neutral-slate py-8">暂无建言</p>
                )}
              </div>
            )}

            {activeTab === "舆情监控" && (
              <div className="space-y-4">
                {publicOpinions.map((op) => {
                  const level = levelBadgeMap[op.level] || levelBadgeMap.low
                  const statusBadge = opinionStatusBadge[op.status] || opinionStatusBadge.new
                  return (
                    <div
                      key={op.id}
                      className={`card p-5 ${op.level === "critical" ? "border-red-300" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-bold bg-primary-800 text-gov-gold">
                            {op.keyword}
                          </span>
                          <span className="text-xs text-neutral-slate">来源：{op.source}</span>
                          <span className={level.className}>{level.label}</span>
                        </div>
                        <span className={statusBadge.className + " shrink-0"}>{statusBadge.label}</span>
                      </div>
                      <p className="text-sm text-primary leading-relaxed mb-2">{op.content}</p>
                      <p className="text-xs text-neutral-slate mb-3">发现时间：{op.detectedAt}</p>
                      {op.response && (
                        <div className="bg-primary-50/50 rounded-lg p-3 text-sm text-primary mb-3">
                          <span className="font-medium">处置：</span>{op.response}
                        </div>
                      )}
                      {op.status === "new" && (
                        <button
                          onClick={() => handleStartMonitoring(op.id)}
                          className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-sm"
                        >
                          <Play className="w-4 h-4" />
                          开始监控
                        </button>
                      )}
                      {(op.status === "monitoring" || op.status === "responding") && (
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={opinionResponses[op.id] || ""}
                            onChange={(e) =>
                              setOpinionResponses((prev) => ({ ...prev, [op.id]: e.target.value }))
                            }
                            placeholder="输入处置回复..."
                            className="input-field flex-1 text-sm py-2"
                          />
                          <button
                            onClick={() => handleOpinionResponse(op.id)}
                            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm"
                          >
                            提交
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
                {publicOpinions.length === 0 && (
                  <p className="text-center text-neutral-slate py-8">暂无舆情</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
