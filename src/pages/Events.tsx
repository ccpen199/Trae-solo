import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Search, Plus } from "lucide-react"
import { format } from "date-fns"
import Badge from "@/components/Badge"
import DataTable, { type Column } from "@/components/DataTable"
import { getEvents } from "@/api"
import type { Event } from "@/types"

const eventTypes = ["全部", "越界", "失联", "恶劣天气", "证书过期", "违规作业"]
const eventStatuses = ["全部", "待处置", "处置中", "已处置"]

function statusBadge(status: string) {
  const map: Record<string, { variant: "warning" | "info" | "success"; label: string }> = {
    待处置: { variant: "warning", label: "待处置" },
    处置中: { variant: "info", label: "处置中" },
    已处置: { variant: "success", label: "已处置" },
  }
  const s = map[status] || { variant: "info" as const, label: status }
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

export default function Events() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialStatus = searchParams.get("status") || "全部"
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("全部")
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, pageSize }
      if (typeFilter !== "全部") params.event_type = typeFilter
      if (statusFilter !== "全部") params.status = statusFilter
      if (search) params.search = search
      const res = await getEvents(params)
      if (res.success && res.data) {
        setEvents(res.data.list)
        setTotal(res.data.total)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [page, typeFilter, statusFilter])

  const columns: Column[] = [
    {
      key: "vessel", title: "渔船", render: (_, r) => (
        <span className="text-sky-600 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/vessels/${r.vessel_id}`) }}>
          {r.vessel?.name || r.vessel_name || `船${r.vessel_id}`}
        </span>
      )
    },
    { key: "event_type", title: "事件类型", dataIndex: "event_type" },
    { key: "title", title: "标题", dataIndex: "title" },
    { key: "severity", title: "严重程度", render: (v) => severityBadge(String(v)) },
    { key: "status", title: "状态", render: (v) => statusBadge(String(v)) },
    { key: "occurred_at", title: "发生时间", render: (v) => v ? format(new Date(String(v)), "MM-dd HH:mm") : "-" },
    { key: "notification_count", title: "通知数", render: (v) => v ?? 0 },
    { key: "receipt_count", title: "回执数", render: (v) => v ?? 0 },
    {
      key: "actions", title: "操作", render: (_, r) => (
        <div className="flex items-center gap-2">
          {(r.status === "待处置" || r.status === "处置中") && (
            <button onClick={(e) => { e.stopPropagation(); navigate(`/events/${r.id}`) }} className="text-amber-600 hover:text-amber-700 text-xs font-medium">处置</button>
          )}
          <button onClick={(e) => { e.stopPropagation(); navigate(`/events/${r.id}`) }} className="text-sky-600 hover:text-sky-700 text-xs font-medium">查看</button>
        </div>
      )
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">事件类型:</span>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">状态:</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {eventStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="relative flex-1 max-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            placeholder="搜索事件"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <button
          onClick={() => navigate("/events/new")}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors ml-auto"
        >
          <Plus className="w-4 h-4" />
          上报事件
        </button>
      </div>

      <DataTable
        columns={columns}
        data={events}
        loading={loading}
        onRowClick={(r) => navigate(`/events/${r.id}`)}
        pagination={total > pageSize ? { current: page, pageSize, total, onChange: setPage } : undefined}
      />
    </div>
  )
}
