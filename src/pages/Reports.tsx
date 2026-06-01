import { useEffect, useState } from "react"
import { useLocation, Link } from "react-router-dom"
import { format } from "date-fns"
import { Download, CheckCircle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import Card from "@/components/Card"
import Badge from "@/components/Badge"
import DataTable, { type Column } from "@/components/DataTable"
import { getFleetStats, getSeaAreaStats, getVoyageStats, getViolationStats, getSafetyRiskStats } from "@/api"
import type { FleetStat, SeaAreaStat, VoyageStat, ViolationStat, SafetyRiskStat } from "@/types"

const tabs = ["船队统计", "海域统计", "航次统计", "违规类型", "安全风险"]

const tabMap: Record<string, number> = {
  fleet: 0,
  seaArea: 1,
  voyages: 2,
  violations: 3,
  risk: 4,
}

const PIE_COLORS = ["#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#f97316"]

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}_${format(new Date(), "yyyyMMdd")}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const location = useLocation()
  const state = location.state as { successMsg?: string; activeTab?: string } | null
  const [activeTab, setActiveTab] = useState(state?.activeTab ? tabMap[state.activeTab] ?? 0 : 0)
  const [successMsg, setSuccessMsg] = useState(state?.successMsg || "")
  const [fleetData, setFleetData] = useState<FleetStat[]>([])
  const [seaAreaData, setSeaAreaData] = useState<SeaAreaStat[]>([])
  const [voyageData, setVoyageData] = useState<VoyageStat | null>(null)
  const [violationData, setViolationData] = useState<ViolationStat[]>([])
  const [safetyData, setSafetyData] = useState<SafetyRiskStat[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    if (state?.successMsg) {
      setSuccessMsg(state.successMsg)
      setTimeout(() => setSuccessMsg(""), 5000)
    }
  }, [state?.successMsg])

  useEffect(() => {
    if (state?.activeTab) {
      setActiveTab(tabMap[state.activeTab] ?? 0)
    }
  }, [state?.activeTab])

  useEffect(() => {
    setLoading(true)
    const promises: Promise<void>[] = []
    if (activeTab === 0) promises.push(getFleetStats().then(r => { if (r.success && r.data) setFleetData(Array.isArray(r.data) ? r.data : r.data) }))
    if (activeTab === 1) promises.push(getSeaAreaStats().then(r => { if (r.success && r.data) setSeaAreaData(r.data) }))
    if (activeTab === 2) promises.push(getVoyageStats().then(r => { if (r.success && r.data) setVoyageData(r.data) }))
    if (activeTab === 3) promises.push(getViolationStats().then(r => { if (r.success && r.data) setViolationData(r.data) }))
    if (activeTab === 4) promises.push(getSafetyRiskStats().then(r => { if (r.success && r.data) setSafetyData(r.data) }))
    Promise.all(promises).finally(() => setLoading(false))
  }, [activeTab])

  const exportFleet = () => {
    downloadCSV("船队统计", ["船东", "渔船数", "申报数", "事件数"], fleetData.map(d => [d.owner_name, String(d.vessel_count), String(d.declaration_count), String(d.event_count)]))
  }
  const exportSeaArea = () => {
    downloadCSV("海域统计", ["海域", "申报数", "事件数"], seaAreaData.map(d => [d.sea_area, String(d.declaration_count), String(d.event_count)]))
  }
  const exportVoyage = () => {
    if (!voyageData) return
    downloadCSV("航次统计", ["月份", "航次数"], voyageData.by_month.map(d => [d.month, String(d.count)]))
  }
  const exportViolation = () => {
    downloadCSV("违规类型", ["事件类型", "数量"], violationData.map(d => [d.event_type, String(d.count)]))
  }
  const exportSafety = () => {
    downloadCSV("安全风险", ["渔船", "事件数", "告警数", "风险分"], safetyData.map(d => [d.vessel_name, String(d.event_count), String(d.alert_count), String(d.risk_score)]))
  }

  const fleetColumns: Column[] = [
    { key: "owner_name", title: "船东", dataIndex: "owner_name" },
    { key: "vessel_count", title: "渔船数", dataIndex: "vessel_count" },
    { key: "declaration_count", title: "申报数", dataIndex: "declaration_count" },
    { key: "event_count", title: "事件数", dataIndex: "event_count" },
  ]

  const seaAreaColumns: Column[] = [
    { key: "sea_area", title: "海域", dataIndex: "sea_area" },
    { key: "declaration_count", title: "申报数", dataIndex: "declaration_count" },
    { key: "event_count", title: "事件数", dataIndex: "event_count" },
  ]

  const safetyColumns: Column[] = [
    { key: "vessel_name", title: "渔船", render: (_, r) => (
      <Link to={`/vessels/${r.vessel_id}`} className="text-sky-600 hover:underline font-medium">
        {r.vessel_name}
      </Link>
    )},
    { key: "vessel_code", title: "船号", dataIndex: "vessel_code" },
    { key: "owner_name", title: "船队(船东)", dataIndex: "owner_name" },
    { key: "fishing_type", title: "作业类型", dataIndex: "fishing_type" },
    {
      key: "sea_areas", title: "作业海域", render: (_, r) => {
        const areas = r.sea_areas || []
        return areas.length > 0 ? <span className="text-xs">{areas.join("、")}</span> : <span className="text-slate-400">-</span>
      }
    },
    { key: "declaration_count", title: "申报数", dataIndex: "declaration_count" },
    { key: "active_voyage_count", title: "在航次数", dataIndex: "active_voyage_count" },
    {
      key: "violation_types", title: "违规类型", render: (_, r) => {
        const types = r.violation_types || []
        return types.length > 0
          ? <div className="flex flex-wrap gap-1">{types.map(t => <Badge key={t} variant="danger">{t}</Badge>)}</div>
          : <span className="text-slate-400">无</span>
      }
    },
    { key: "event_count", title: "事件数", dataIndex: "event_count" },
    { key: "alert_count", title: "告警数", dataIndex: "alert_count" },
    {
      key: "pending_event_count", title: "待处置", dataIndex: "pending_event_count",
      render: (v) => Number(v) > 0 ? <Badge variant="warning">{String(v)}</Badge> : <span className="text-slate-400">0</span>
    },
    {
      key: "resolved_event_count", title: "已处置", dataIndex: "resolved_event_count",
      render: (v) => Number(v) > 0 ? <Badge variant="success">{String(v)}</Badge> : <span className="text-slate-400">0</span>
    },
    {
      key: "risk_score", title: "风险分", render: (v) => {
        const score = Number(v)
        const variant = score >= 80 ? "danger" : score >= 50 ? "warning" : "success"
        return <Badge variant={variant}>{score}</Badge>
      }
    },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-5">
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-sm text-green-700 font-medium">{successMsg}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-0">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === i ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <span className="text-slate-400">至</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <button
            onClick={[exportFleet, exportSeaArea, exportVoyage, exportViolation, exportSafety][activeTab]}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4 text-sky-500" />
            导出台账
          </button>
        </div>
      </div>

      {activeTab === 0 && (
        <Card title="船队统计">
          <DataTable columns={fleetColumns} data={fleetData} />
        </Card>
      )}

      {activeTab === 1 && (
        <Card title="海域统计">
          <DataTable columns={seaAreaColumns} data={seaAreaData} />
        </Card>
      )}

      {activeTab === 2 && voyageData && (
        <div className="space-y-5">
          <Card title="航次概览">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-sky-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-sky-700">{voyageData.total}</p>
                <p className="text-sm text-slate-600">总航次</p>
              </div>
              {Object.entries(voyageData.by_status || {}).map(([status, count]) => (
                <div key={status} className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-slate-700">{count}</p>
                  <p className="text-sm text-slate-600">{status}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card title="月度航次统计">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={voyageData.by_month}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="航次数" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 3 && (
        <Card title="违规类型分布">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={violationData}
                  dataKey="count"
                  nameKey="event_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(props: any) => `${props.event_type}: ${props.count}`}
                >
                  {violationData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {activeTab === 4 && (
        <div className="space-y-5">
          <Card title="安全风险评估概览">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-rose-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-rose-600">{safetyData.filter(r => r.risk_score >= 80).length}</p>
                <p className="text-sm text-slate-600">高风险（≥80分）</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-amber-600">{safetyData.filter(r => r.risk_score >= 50 && r.risk_score < 80).length}</p>
                <p className="text-sm text-slate-600">中风险（50-79分）</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{safetyData.filter(r => r.risk_score < 50 && r.risk_score > 0).length}</p>
                <p className="text-sm text-slate-600">低风险（1-49分）</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-slate-600">{safetyData.filter(r => r.risk_score === 0).length}</p>
                <p className="text-sm text-slate-600">无风险（0分）</p>
              </div>
            </div>
          </Card>

          <Card title="渔船安全风险评分排名">
            <DataTable
              columns={[
                { key: "rank", title: "排名", render: (_, __, idx) => <span className="font-bold text-slate-700">#{idx + 1}</span> },
                ...safetyColumns
              ]}
              data={[...safetyData].sort((a, b) => b.risk_score - a.risk_score)}
            />
          </Card>
        </div>
      )}
    </div>
  )
}
