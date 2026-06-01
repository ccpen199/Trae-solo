import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Sailboat,
  FileText,
  AlertTriangle,
  ShieldAlert,
  Plus,
  Upload,
  BarChart3,
  Download,
  CheckCircle,
  XCircle,
  LogIn,
  Clock,
} from "lucide-react"
import { format } from "date-fns"
import Card from "@/components/Card"
import Badge from "@/components/Badge"
import Modal from "@/components/Modal"
import DataTable, { type Column } from "@/components/DataTable"
import { getDashboardData, verifyDeclaration, approveDeclaration, returnDeclaration, handleAlert, getFleetStats, getVoyageStats, getViolationStats, getSafetyRiskStats, getSeaAreaStats } from "@/api"
import type { DashboardData, Declaration, Alert as AlertType, FleetStat, SeaAreaStat, ViolationStat, SafetyRiskStat, VoyageStat } from "@/types"
import { useAppStore } from "@/store/app"

function statusBadge(status: string) {
  const map: Record<string, { variant: "default" | "success" | "warning" | "danger" | "info"; label: string }> = {
    待核验: { variant: "warning", label: "待核验" },
    已核验: { variant: "info", label: "已核验" },
    已通过: { variant: "success", label: "已通过" },
    已驳回: { variant: "danger", label: "已驳回" },
    已返港: { variant: "default", label: "已返港" },
  }
  const s = map[status] || { variant: "default" as const, label: status }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

function severityBadge(severity: string) {
  const map: Record<string, { variant: "danger" | "warning" | "info"; label: string }> = {
    严重: { variant: "danger", label: "严重" },
    警告: { variant: "warning", label: "警告" },
    提示: { variant: "info", label: "提示" },
  }
  const s = map[severity] || { variant: "info" as const, label: severity }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

export default function Home() {
  const navigate = useNavigate()
  const { currentRole, getRoleConfig } = useAppStore()
  const roleConfig = getRoleConfig()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportStats, setExportStats] = useState<{
    fleet: FleetStat[]
    seaArea: SeaAreaStat[]
    voyages: VoyageStat
    violations: ViolationStat[]
    risks: SafetyRiskStat[]
  } | null>(null)
  const [exportLoading, setExportLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await getDashboardData()
      if (res.success && res.data) setData(res.data)
      else setError(res.error || "加载失败")
    } catch {
      setError("网络错误")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const onVerify = async (id: number) => {
    await verifyDeclaration(id)
    fetchData()
  }
  const onApprove = async (id: number) => {
    await approveDeclaration(id)
    fetchData()
  }
  const onReturn = async (id: number) => {
    await returnDeclaration(id)
    fetchData()
  }
  const onHandleAlert = async (id: number) => {
    const res = await handleAlert(id)
    if (res.success && res.data) {
      await fetchData()
      navigate(`/events/${res.data.event_id}`)
    } else {
      fetchData()
    }
  }

  const declColumns: Column[] = [
    { key: "vessel", title: "渔船", render: (_, r) => (
      <Link to={`/vessels/${r.vessel_id}`} className="text-sky-600 hover:underline">{r.vessel_name}</Link>
    )},
    { key: "sea_area", title: "海域", dataIndex: "sea_area" },
    { key: "crew_count", title: "船员数", dataIndex: "crew_count" },
    { key: "work_permit_status", title: "作业许可", dataIndex: "work_permit_status" },
    { key: "insurance_status", title: "保险状态", render: (v) => (
      <Badge variant={v === "已投保" ? "success" : "danger"}>{String(v)}</Badge>
    )},
    { key: "status", title: "状态", render: (v) => statusBadge(String(v)) },
    { key: "verified_by", title: "核验人", dataIndex: "verified_by" },
    { key: "approved_by", title: "审批人", dataIndex: "approved_by" },
    { key: "reject_reason", title: "未通过原因", dataIndex: "reject_reason" },
    { key: "expected_return", title: "返港计划", render: (v) => v ? format(new Date(String(v)), "MM-dd HH:mm") : "-" },
    { key: "actions", title: "操作", render: (_, r) => (
      <div className="flex gap-2">
        {roleConfig.canVerifyDeclaration && r.status === "待核验" && (
          <button onClick={(e) => { e.stopPropagation(); onVerify(r.id) }} className="text-amber-600 hover:text-amber-700 text-xs font-medium">审核</button>
        )}
        {roleConfig.canApproveDeclaration && r.status === "已核验" && (
          <button onClick={(e) => { e.stopPropagation(); onApprove(r.id) }} className="text-sky-600 hover:text-sky-700 text-xs font-medium">放行</button>
        )}
        {roleConfig.canReturnDeclaration && r.status === "已通过" && (
          <button onClick={(e) => { e.stopPropagation(); onReturn(r.id) }} className="text-green-600 hover:text-green-700 text-xs font-medium">返港确认</button>
        )}
      </div>
    )},
  ]

  const allQuickActions = [
    { label: "新增渔船", icon: Plus, path: "/vessels/new", permission: "canManageVessels" as const },
    { label: "提交申报", icon: FileText, path: "/declarations/new", permission: null },
    { label: "上报事件", icon: ShieldAlert, path: "/events/new", permission: "canManageEvents" as const },
    { label: "查看报表", icon: BarChart3, path: "/reports", permission: "canViewReports" as const },
  ]

  const quickActions = allQuickActions.filter(a => a.permission == null || roleConfig[a.permission])

  const loadExportStats = async () => {
    setExportLoading(true)
    try {
      const [fleet, seaArea, voyages, violations, risks] = await Promise.all([
        getFleetStats(),
        getSeaAreaStats(),
        getVoyageStats(),
        getViolationStats(),
        getSafetyRiskStats(),
      ])
      setExportStats({
        fleet: (fleet.success && fleet.data) || [],
        seaArea: (seaArea.success && seaArea.data) || [],
        voyages: (voyages.success && voyages.data) || { total: 0, by_status: {}, by_month: [] },
        violations: (violations.success && violations.data) || [],
        risks: (risks.success && risks.data) || [],
      })
    } finally {
      setExportLoading(false)
    }
  }

  const handleExport = (type: string) => {
    if (!exportStats) return
    let csv = ""
    let filename = ""
    let successMsg = ""

    switch (type) {
      case "fleet": {
        const headers = ["船东", "渔船数", "申报次数", "事件数"]
        const rows = exportStats.fleet.map(f => [f.owner_name, f.vessel_count, f.declaration_count, f.event_count].join(","))
        csv = [headers.join(","), ...rows].join("\n")
        filename = `船队台账_${format(new Date(), "yyyyMMdd")}.csv`
        successMsg = `船队台账已生成，共 ${exportStats.fleet.length} 条记录`
        break
      }
      case "seaArea": {
        const headers = ["海域", "申报次数", "事件数"]
        const rows = exportStats.seaArea.map(s => [s.sea_area, s.declaration_count, s.event_count].join(","))
        csv = [headers.join(","), ...rows].join("\n")
        filename = `海域台账_${format(new Date(), "yyyyMMdd")}.csv`
        successMsg = `海域台账已生成，共 ${exportStats.seaArea.length} 条记录`
        break
      }
      case "voyages": {
        const headers = ["月份", "出海次数"]
        const rows = exportStats.voyages.by_month.map(m => [m.month, m.count].join(","))
        csv = [headers.join(","), ...rows].join("\n")
        filename = `航次台账_${format(new Date(), "yyyyMMdd")}.csv`
        successMsg = `航次台账已生成，共 ${exportStats.voyages.total} 次出海`
        break
      }
      case "violations": {
        const headers = ["违规类型", "数量"]
        const rows = exportStats.violations.map(v => [v.event_type, v.count].join(","))
        csv = [headers.join(","), ...rows].join("\n")
        filename = `违规台账_${format(new Date(), "yyyyMMdd")}.csv`
        successMsg = `违规台账已生成，共 ${exportStats.violations.length} 种违规类型`
        break
      }
      case "risk": {
        const headers = ["渔船", "船号", "船队(船东)", "作业类型", "作业海域", "申报数", "在航次数", "违规类型", "事件数", "告警数", "待处置", "已处置", "风险评分"]
        const sortedRisks = [...exportStats.risks].sort((a, b) => b.risk_score - a.risk_score)
        const rows = sortedRisks.map(r => [
          r.vessel_name, r.vessel_code, r.owner_name, r.fishing_type,
          (r.sea_areas || []).join(";"), r.declaration_count, r.active_voyage_count,
          (r.violation_types || []).join(";"), r.event_count, r.alert_count,
          r.pending_event_count, r.resolved_event_count, r.risk_score
        ].join(","))
        csv = [headers.join(","), ...rows].join("\n")
        filename = `风险台账_${format(new Date(), "yyyyMMdd")}.csv`
        const highRiskCount = sortedRisks.filter(r => r.risk_score >= 80).length
        successMsg = `安全风险台账已生成，共 ${sortedRisks.length} 艘渔船，其中高风险 ${highRiskCount} 艘`
        break
      }
      default: return
    }

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    setExportModalOpen(false)
    navigate("/reports", { state: { successMsg, activeTab: type } })
  }

  const openExportModal = () => {
    setExportModalOpen(true)
    loadExportStats()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" /></div>
  }
  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>
  }
  if (!data) return null

  const { summary } = data

  const statCards = [
    { label: "在册渔船", value: summary.vesselCount, icon: Sailboat, color: "text-sky-500 bg-sky-50", link: "/vessels" },
    { label: "待审核申报", value: summary.pendingDeclarations, icon: FileText, color: "text-amber-500 bg-amber-50", link: "/declarations?status=待核验" },
    { label: "未处理告警", value: summary.pendingAlerts, icon: AlertTriangle, color: "text-rose-500 bg-rose-50", link: "/monitor" },
    { label: "待处置事件", value: summary.pendingEvents, icon: ShieldAlert, color: "text-orange-500 bg-orange-50", link: "/events?status=待处置" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-5">
        {statCards.map((s) => (
          <Link key={s.label} to={s.link} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{s.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex gap-3">
        {quickActions.map((a) => (
          <Link key={a.label} to={a.path} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-sky-300 transition-colors">
            <a.icon className="w-4 h-4 text-sky-500" />
            {a.label}
          </Link>
        ))}
        {roleConfig.canExportLedger && (
          <button onClick={openExportModal} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-sky-300 transition-colors">
            <Download className="w-4 h-4 text-sky-500" />
            导出台账
          </button>
        )}
      </div>

      <Card
        title="最近申报"
        action={<Link to="/declarations" className="text-sm text-sky-600 hover:underline">查看全部</Link>}
      >
        <DataTable columns={declColumns} data={data.recentDeclarations} />
      </Card>

      <Card
        title="风险告警"
        action={<Link to="/monitor" className="text-sm text-sky-600 hover:underline">查看全部</Link>}
      >
        {data.pendingAlerts.length === 0 ? (
          <p className="text-center text-slate-500 py-8">暂无告警</p>
        ) : (
          <div className="space-y-3">
            {data.pendingAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-900">{alert.vessel_name || `船${alert.vessel_id}`}</span>
                    {severityBadge(alert.severity)}
                    <Badge variant="info">{alert.alert_type}</Badge>
                  </div>
                  <p className="text-sm text-slate-600">{alert.message}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {alert.triggered_at ? format(new Date(alert.triggered_at), "MM-dd HH:mm") : "-"}
                    <span>状态: {alert.status}</span>
                  </div>
                </div>
                {alert.status === "未处理" && (
                  <button onClick={() => onHandleAlert(alert.id)} className="px-3 py-1.5 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors">
                    处置
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="证书即将到期"
        action={<Link to="/vessels" className="text-sm text-sky-600 hover:underline">查看全部</Link>}
      >
        {data.certExpiring.length === 0 ? (
          <p className="text-center text-slate-500 py-8">暂无即将到期证书</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">证书类型</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">证书编号</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">到期日期</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.certExpiring.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-sm text-slate-700">{cert.cert_type}</td>
                    <td className="px-4 py-2 text-sm text-slate-700">{cert.cert_number}</td>
                    <td className="px-4 py-2 text-sm text-slate-700">{format(new Date(cert.expiry_date), "yyyy-MM-dd")}</td>
                    <td className="px-4 py-2"><Badge variant="warning">{cert.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal title="监管台账导出" open={exportModalOpen} onClose={() => setExportModalOpen(false)} size="lg">
        {exportLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" />
          </div>
        ) : !exportStats ? (
          <div className="text-center py-12 text-slate-500">加载失败</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-4">
              <div className="p-4 bg-sky-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-sky-600">{exportStats.fleet.length}</p>
                <p className="text-sm text-slate-600">船队</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-emerald-600">{exportStats.seaArea.length}</p>
                <p className="text-sm text-slate-600">海域</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-amber-600">{exportStats.voyages.total}</p>
                <p className="text-sm text-slate-600">出海次数</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-rose-600">{exportStats.violations.length}</p>
                <p className="text-sm text-slate-600">违规类型</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-orange-600">{exportStats.risks.filter(r => r.risk_score > 0).length}</p>
                <p className="text-sm text-slate-600">风险渔船</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">选择台账类型导出</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleExport("fleet")} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-sky-400 hover:bg-sky-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900">船队台账</p>
                    <p className="text-sm text-slate-500">按船东统计渔船、申报、事件</p>
                  </div>
                  <Download className="w-5 h-5 text-slate-400" />
                </button>
                <button onClick={() => handleExport("seaArea")} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-sky-400 hover:bg-sky-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900">海域台账</p>
                    <p className="text-sm text-slate-500">按海域统计作业密度</p>
                  </div>
                  <Download className="w-5 h-5 text-slate-400" />
                </button>
                <button onClick={() => handleExport("voyages")} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-sky-400 hover:bg-sky-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900">航次台账</p>
                    <p className="text-sm text-slate-500">月度出海次数统计</p>
                  </div>
                  <Download className="w-5 h-5 text-slate-400" />
                </button>
                <button onClick={() => handleExport("violations")} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-sky-400 hover:bg-sky-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900">违规台账</p>
                    <p className="text-sm text-slate-500">违规类型统计</p>
                  </div>
                  <Download className="w-5 h-5 text-slate-400" />
                </button>
                <button onClick={() => handleExport("risk")} className="col-span-2 flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-sky-400 hover:bg-sky-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900">安全风险台账</p>
                    <p className="text-sm text-slate-500">渔船安全风险评分排名</p>
                  </div>
                  <Download className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 inline mr-2 text-green-500" />
                台账数据已按监管要求格式生成，可直接存档或上报。
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
