import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, ChevronDown, ChevronUp } from "lucide-react"
import { firmwareTasks as rawTasks } from "@/data/mock"
import { devices } from "@/data/devices"
import type { FirmwareTask } from "@/types"

const taskStatusStyle: Record<FirmwareTask["status"], { label: string; color: string; barColor: string }> = {
  pending: { label: "待执行", color: "text-yellow-600 bg-yellow-50", barColor: "bg-yellow-400" },
  in_progress: { label: "进行中", color: "text-blue-600 bg-blue-50", barColor: "bg-blue-500" },
  completed: { label: "已完成", color: "text-emerald-600 bg-emerald-50", barColor: "bg-emerald-500" },
  failed: { label: "失败", color: "text-red-600 bg-red-50", barColor: "bg-red-500" },
}

export default function Firmware() {
  const [tasks, setTasks] = useState<FirmwareTask[]>(rawTasks)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newVersion, setNewVersion] = useState("")
  const [newTargets, setNewTargets] = useState("")

  const handleCreate = () => {
    if (!newVersion.trim()) return
    const ids = newTargets.split(",").map((s) => s.trim()).filter(Boolean)
    const task: FirmwareTask = {
      id: `FW${Date.now()}`,
      version: newVersion.trim(),
      targetDevices: ids,
      progress: 0,
      status: "pending",
      createdAt: new Date().toISOString(),
    }
    setTasks((prev) => [task, ...prev])
    setNewVersion("")
    setNewTargets("")
    setShowCreate(false)
  }

  const formatDate = (ts: string) => {
    const d = new Date(ts)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  const getDeviceName = (id: string) => devices.find((d) => d.id === id)?.name ?? id

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0A2E3C]">固件升级</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> 创建升级任务
        </button>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => {
          const ss = taskStatusStyle[task.status]
          const isExpanded = expanded === task.id
          return (
            <motion.div key={task.id} layout className="rounded-xl bg-white shadow-sm">
              <div
                className="flex cursor-pointer items-center justify-between p-5"
                onClick={() => setExpanded(isExpanded ? null : task.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-[#0A2E3C]">{task.version}</span>
                  <span className="text-xs text-gray-400">{task.targetDevices.length} 台设备</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ss.color}`}>
                    {task.status === "in_progress" && (
                      <motion.span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
                    )}
                    {ss.label}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">{formatDate(task.createdAt)}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </div>

              {(task.status === "in_progress" || task.status === "completed") && (
                <div className="px-5 pb-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                      className={`h-full rounded-full ${ss.barColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${task.progress}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <p className="mt-1 text-right text-xs text-gray-400">{task.progress}%</p>
                </div>
              )}

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="border-t border-gray-100 px-5 py-4">
                      <p className="mb-2 text-xs font-medium text-gray-500">目标设备</p>
                      <div className="flex flex-wrap gap-2">
                        {task.targetDevices.map((did) => (
                          <span key={did} className="rounded-md bg-[#F5F7FA] px-2.5 py-1 text-xs text-[#0A2E3C]">
                            {did} · {getDeviceName(did)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {tasks.length === 0 && (
        <div className="py-20 text-center text-gray-400">暂无升级任务</div>
      )}

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="w-96 rounded-xl bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-bold text-[#0A2E3C]">创建升级任务</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">固件版本</label>
                  <input value={newVersion} onChange={(e) => setNewVersion(e.target.value)} placeholder="例如 v2.4.1" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF6B35]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">目标设备ID（逗号分隔）</label>
                  <input value={newTargets} onChange={(e) => setNewTargets(e.target.value)} placeholder="DEV001, DEV002" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF6B35]" />
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50">取消</button>
                <button onClick={handleCreate} className="flex-1 rounded-lg bg-[#0A2E3C] py-2 text-sm font-medium text-white hover:opacity-90">创建</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
