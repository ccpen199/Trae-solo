import { useEffect, useState, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Search, Plus } from "lucide-react"
import { format } from "date-fns"
import Badge from "@/components/Badge"
import DataTable, { type Column } from "@/components/DataTable"
import { getDeclarations, verifyDeclaration, approveDeclaration, rejectDeclaration, returnDeclaration } from "@/api"
import type { Declaration } from "@/types"
import { useAppStore } from "@/store/app"

const tabs = ["全部", "待核验", "已核验", "已通过", "已驳回", "已返港"]

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

export default function Declarations() {
  const navigate = useNavigate()
  const { currentOwnerName, getRoleConfig } = useAppStore()
  const roleConfig = getRoleConfig()
  const [searchParams] = useSearchParams()
  const initialStatus = searchParams.get("status") || "全部"
  const [allDeclarations, setAllDeclarations] = useState<Declaration[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState(initialStatus)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  const filteredDeclarations = useMemo(() => {
    let list = allDeclarations
    if (!roleConfig.canViewAllDeclarations) {
      list = list.filter(d => (d.vessel?.owner_name || d.owner_name) === currentOwnerName)
    }
    return list
  }, [allDeclarations, currentOwnerName, roleConfig.canViewAllDeclarations])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, pageSize }
      if (activeTab !== "全部") params.status = activeTab
      if (search) params.search = search
      const res = await getDeclarations(params)
      if (res.success && res.data) {
        setAllDeclarations(res.data.list)
        setTotal(roleConfig.canViewAllDeclarations ? res.data.total : 0)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [page, activeTab])

  const onVerify = async (id: number) => { await verifyDeclaration(id); fetchData() }
  const onApprove = async (id: number) => { await approveDeclaration(id); fetchData() }
  const onReject = async (id: number) => {
    const reason = prompt("请输入驳回原因")
    if (!reason) return
    await rejectDeclaration(id, reason)
    fetchData()
  }
  const onReturn = async (id: number) => { await returnDeclaration(id); fetchData() }

  const canManage = roleConfig.canVerifyDeclaration || roleConfig.canApproveDeclaration

  const columns: Column[] = [
    {
      key: "vessel", title: "渔船", render: (_, r) => (
        <span className="text-sky-600 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/vessels/${r.vessel_id}`) }}>
          {r.vessel?.name || r.vessel_name || `船${r.vessel_id}`}
        </span>
      )
    },
    { key: "sea_area", title: "海域", dataIndex: "sea_area" },
    { key: "crew_count", title: "船员数", render: (_, r) => r.crews?.length || r.crew_count || 0 },
    { key: "work_permit_status", title: "作业许可", dataIndex: "work_permit_status" },
    {
      key: "insurance_status", title: "保险状态", render: (v) => (
        <Badge variant={v === "已投保" ? "success" : "danger"}>{String(v || "-")}</Badge>
      )
    },
    { key: "status", title: "状态", render: (v) => statusBadge(String(v)) },
    { key: "verified_by", title: "核验人", dataIndex: "verified_by" },
    { key: "approved_by", title: "审批人", dataIndex: "approved_by" },
    { key: "reject_reason", title: "未通过原因", dataIndex: "reject_reason" },
    {
      key: "departure_time", title: "出海时间", render: (v) => v ? format(new Date(String(v)), "MM-dd HH:mm") : "-"
    },
    {
      key: "expected_return", title: "返港计划", render: (v) => v ? format(new Date(String(v)), "MM-dd HH:mm") : "-"
    },
    {
      key: "actions", title: "操作", render: (_, r) => (
        <div className="flex items-center gap-2">
          {canManage && r.status === "待核验" && roleConfig.canVerifyDeclaration && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onVerify(r.id) }} className="text-amber-600 hover:text-amber-700 text-xs font-medium">核验</button>
              <button onClick={(e) => { e.stopPropagation(); onReject(r.id) }} className="text-red-500 hover:text-red-600 text-xs font-medium">驳回</button>
            </>
          )}
          {canManage && r.status === "已核验" && roleConfig.canApproveDeclaration && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onApprove(r.id) }} className="text-sky-600 hover:text-sky-700 text-xs font-medium">放行</button>
              <button onClick={(e) => { e.stopPropagation(); onReject(r.id) }} className="text-red-500 hover:text-red-600 text-xs font-medium">驳回</button>
            </>
          )}
          {canManage && r.status === "已通过" && roleConfig.canReturnDeclaration && (
            <button onClick={(e) => { e.stopPropagation(); onReturn(r.id) }} className="text-green-600 hover:text-green-700 text-xs font-medium">返港确认</button>
          )}
          <button onClick={(e) => { e.stopPropagation(); navigate(`/declarations/${r.id}`) }} className="text-slate-500 hover:text-slate-700 text-xs font-medium">查看</button>
        </div>
      )
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-0">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1) }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-sky-500 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData()}
              placeholder="搜索渔船"
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 w-64"
            />
          </div>
          {!roleConfig.canViewAllDeclarations && (
            <span className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm">
              仅显示自有申报: {currentOwnerName}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate("/declarations/new")}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建申报
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredDeclarations}
        loading={loading}
        onRowClick={(r) => navigate(`/declarations/${r.id}`)}
        pagination={filteredDeclarations.length > pageSize ? { current: page, pageSize, total: roleConfig.canViewAllDeclarations ? total : filteredDeclarations.length, onChange: setPage } : undefined}
      />
    </div>
  )
}
