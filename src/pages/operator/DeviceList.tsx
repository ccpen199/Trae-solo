import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Search, Droplets, Wifi, WifiOff, AlertTriangle } from "lucide-react"
import { devices } from "@/data/devices"
import { StatusBadge } from "@/components/StatusBadge"
import type { DeviceStatus } from "@/types"

const statusFilters: { key: DeviceStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "online", label: "在线" },
  { key: "offline", label: "离线" },
  { key: "fault", label: "故障" },
]

const statCards = [
  { label: "设备总数", key: "total" as const, icon: Droplets, color: "bg-[#0A2E3C] text-white" },
  { label: "在线", key: "online" as const, icon: Wifi, color: "bg-emerald-500 text-white" },
  { label: "离线", key: "offline" as const, icon: WifiOff, color: "bg-gray-400 text-white" },
  { label: "故障", key: "fault" as const, icon: AlertTriangle, color: "bg-red-500 text-white" },
]

export default function DeviceList() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<DeviceStatus | "all">("all")
  const [search, setSearch] = useState("")

  const counts = useMemo(() => {
    const c = { total: devices.length, online: 0, offline: 0, fault: 0 }
    devices.forEach((d) => { c[d.status]++ })
    return c
  }, [])

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      const matchStatus = filter === "all" || d.status === filter
      const q = search.toLowerCase()
      const matchSearch = !q || d.name.toLowerCase().includes(q) || d.location.toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [filter, search])

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.key} className={`flex items-center gap-3 rounded-xl px-5 py-4 ${s.color}`}>
            <s.icon className="h-6 w-6 opacity-80" />
            <div>
              <p className="text-xs opacity-80">{s.label}</p>
              <p className="text-2xl font-bold">{counts[s.key]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filter === f.key
                  ? "bg-[#0A2E3C] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索设备名称/位置"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-[#FF6B35] sm:w-64"
          />
        </div>
      </div>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {filtered.map((d) => (
          <motion.div
            key={d.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(10,46,60,0.12)" }}
            onClick={() => navigate(`/operator/device/${d.id}`)}
            className="cursor-pointer rounded-xl bg-white p-5 shadow-sm transition"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-[#0A2E3C]">{d.name}</h3>
                <p className="text-xs text-gray-500">{d.location}</p>
              </div>
              <StatusBadge status={d.status} size="sm" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">温度</span>
                <p className="font-medium text-[#0A2E3C]">{d.temperature}°C</p>
              </div>
              <div>
                <span className="text-gray-400">固件</span>
                <p className="font-medium text-[#0A2E3C]">{d.firmwareVersion}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div className="py-20 text-center text-gray-400">暂无匹配设备</div>
      )}
    </div>
  )
}
