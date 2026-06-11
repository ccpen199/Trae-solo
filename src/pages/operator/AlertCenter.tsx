import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, AlertTriangle, XCircle, Clock, CheckCircle } from "lucide-react"
import { alerts as rawAlerts } from "@/data/mock"
import type { AlertItem } from "@/types"

type Level = AlertItem["level"] | "all"

const levelFilters: { key: Level; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "critical", label: "严重" },
  { key: "error", label: "错误" },
  { key: "warning", label: "警告" },
]

const levelStyle: Record<AlertItem["level"], { icon: typeof XCircle; color: string; bg: string; border: string }> = {
  critical: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-l-red-500" },
  error: { icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-50", border: "border-l-orange-500" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50", border: "border-l-yellow-400" },
}

const statusStyle: Record<AlertItem["status"], { icon: typeof Clock; label: string; color: string }> = {
  pending: { icon: Clock, label: "待处理", color: "text-orange-500 bg-orange-50" },
  resolved: { icon: CheckCircle, label: "已处理", color: "text-emerald-600 bg-emerald-50" },
}

export default function AlertCenter() {
  const [alertList, setAlertList] = useState<AlertItem[]>(rawAlerts)
  const [levelFilter, setLevelFilter] = useState<Level>("all")

  const filtered = useMemo(() => {
    if (levelFilter === "all") return alertList
    return alertList.filter((a) => a.level === levelFilter)
  }, [alertList, levelFilter])

  const handleResolve = (id: string) => {
    setAlertList((prev) => prev.map((a) => (a.id === id ? { ...a, status: "resolved" as const } : a)))
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      <h1 className="mb-5 text-xl font-bold text-[#0A2E3C]">告警中心</h1>

      <div className="mb-6 flex gap-2">
        {levelFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setLevelFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              levelFilter === f.key ? "bg-[#0A2E3C] text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

        <AnimatePresence>
          {filtered.map((alert, i) => {
            const ls = levelStyle[alert.level]
            const ss = statusStyle[alert.status]
            const Icon = ls.icon
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.04 }}
                className={`relative mb-4 ml-8 rounded-lg border-l-4 bg-white p-4 shadow-sm ${ls.border}`}
              >
                <div className="absolute -left-8 top-5 flex h-4 w-4 items-center justify-center">
                  <div className={`h-3 w-3 rounded-full ${ls.bg} ring-4 ring-[#F5F7FA]`} />
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ls.color}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${ls.bg} ${ls.color}`}>
                          {alert.level === "critical" ? "严重" : alert.level === "error" ? "错误" : "警告"}
                        </span>
                        <span className="text-xs text-gray-400">{alert.deviceId}</span>
                      </div>
                      <p className="mt-1 text-sm text-[#0A2E3C]">{alert.message}</p>
                      <p className="mt-1 text-xs text-gray-400">{formatTime(alert.timestamp)}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ss.color}`}>
                      <ss.icon className="h-3 w-3" /> {ss.label}
                    </span>
                    {alert.status === "pending" && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="rounded-md bg-[#FF6B35] px-3 py-1 text-xs font-medium text-white hover:opacity-90"
                      >
                        处理
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center text-gray-400">暂无告警记录</div>
      )}
    </div>
  )
}
