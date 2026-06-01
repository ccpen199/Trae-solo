import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus, Eye, Pencil, Trash2 } from "lucide-react"
import Card from "@/components/Card"
import Badge from "@/components/Badge"
import DataTable, { type Column } from "@/components/DataTable"
import { getVessels, deleteVessel } from "@/api"
import type { Vessel } from "@/types"
import { useAppStore } from "@/store/app"

const statusMap: Record<string, { variant: "success" | "info" | "warning"; label: string }> = {
  在港: { variant: "info", label: "在港" },
  在航: { variant: "success", label: "在航" },
  维修: { variant: "warning", label: "维修" },
}

export default function Vessels() {
  const navigate = useNavigate()
  const { currentOwnerName, getRoleConfig } = useAppStore()
  const roleConfig = getRoleConfig()
  const [allVessels, setAllVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  const filteredVessels = useMemo(() => {
    let list = allVessels
    if (!roleConfig.canViewAllVessels) {
      list = list.filter(v => v.owner_name === currentOwnerName)
    }
    return list
  }, [allVessels, currentOwnerName, roleConfig.canViewAllVessels])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, pageSize }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await getVessels(params)
      if (res.success && res.data) {
        setAllVessels(res.data.list)
        setTotal(roleConfig.canViewAllVessels ? res.data.total : 0)
      }
    } catch { } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [page, statusFilter])

  const onDelete = async (id: number) => {
    if (!confirm("确认删除该渔船？")) return
    await deleteVessel(id)
    fetchData()
  }

  const deviceStatusBadge = (status: string) => (
    <Badge variant={status === "在线" ? "success" : status === "离线" ? "danger" : "warning"}>{status || "-"}</Badge>
  )

  const columns: Column[] = [
    { key: "name", title: "船名", dataIndex: "name" },
    { key: "code", title: "船号", dataIndex: "code" },
    { key: "owner_name", title: "船东", dataIndex: "owner_name" },
    { key: "fishing_type", title: "作业类型", dataIndex: "fishing_type" },
    { key: "gps_status", title: "定位设备", render: (_, r) => deviceStatusBadge(r.gps_status) },
    { key: "safety_status", title: "安全设备", render: (_, r) => deviceStatusBadge(r.safety_status) },
    {
      key: "status", title: "状态", render: (v) => {
        const s = statusMap[String(v)] || { variant: "default" as const, label: String(v) }
        return <Badge variant={s.variant}>{s.label}</Badge>
      }
    },
    {
      key: "actions", title: "操作", render: (_, r) => (
        <div className="flex items-center gap-3">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/vessels/${r.id}`) }} className="text-sky-600 hover:text-sky-700"><Eye className="w-4 h-4" /></button>
          {roleConfig.canManageVessels && (
            <>
              <button onClick={(e) => { e.stopPropagation(); navigate(`/vessels/${r.id}?edit=1`) }} className="text-amber-600 hover:text-amber-700"><Pencil className="w-4 h-4" /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(r.id) }} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </>
          )}
        </div>
      )
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData()}
              placeholder="搜索船名/船号"
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">全部状态</option>
            <option value="在港">在港</option>
            <option value="在航">在航</option>
            <option value="维修">维修</option>
          </select>
          {!roleConfig.canViewAllVessels && (
            <span className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm">
              仅显示自有船只: {currentOwnerName}
            </span>
          )}
        </div>
        {roleConfig.canManageVessels && (
          <button
            onClick={() => navigate("/vessels/new")}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增渔船
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredVessels}
        loading={loading}
        onRowClick={(r) => navigate(`/vessels/${r.id}`)}
        pagination={filteredVessels.length > pageSize ? { current: page, pageSize, total: roleConfig.canViewAllVessels ? total : filteredVessels.length, onChange: setPage } : undefined}
      />
    </div>
  )
}
