import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Lock, Droplets, ChevronDown } from "lucide-react"
import { useStore } from "@/store"
import { devices } from "@/data/devices"

const months = ["6月", "5月", "4月", "3月"]

export default function Bills() {
  const navigate = useNavigate()
  const { transactions } = useStore()
  const [selectedMonth, setSelectedMonth] = useState("6月")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const deviceMap = useMemo(
    () => Object.fromEntries(devices.map((d) => [d.id, d.name])),
    []
  )

  const filtered = useMemo(() => {
    const monthIdx = months.indexOf(selectedMonth)
    const monthNum = 6 - monthIdx
    return transactions.filter((t) => {
      const d = new Date(t.startTime)
      return d.getMonth() + 1 === monthNum
    })
  }, [transactions, selectedMonth])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  }

  const formatFullDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0A2E3C] px-4 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-medium">账单记录</span>
        </div>
      </div>

      <div className="px-5 mt-4">
        <div className="flex gap-2 mb-4">
          {months.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedMonth === m
                  ? "bg-[#0A2E3C] text-white"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((txn, i) => {
            const isExpanded = expandedId === txn.id
            return (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : txn.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#0A2E3C]/10 rounded-lg flex items-center justify-center">
                        <Droplets className="w-4 h-4 text-[#0A2E3C]" />
                      </div>
                      <div>
                        <div className="font-medium text-[#0A2E3C] text-sm">
                          {deviceMap[txn.deviceId] || txn.deviceId}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{formatDate(txn.startTime)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {txn.encrypted && (
                        <span className="flex items-center gap-0.5 bg-green-50 text-green-600 text-[10px] px-1.5 py-0.5 rounded-full">
                          <Lock className="w-2.5 h-2.5" />
                          AES
                        </span>
                      )}
                      <span className="bg-[#0A2E3C]/10 text-[#0A2E3C] text-[10px] px-1.5 py-0.5 rounded-full">
                        {txn.waterTemperature}°C
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-3">
                    <div>
                      <span className="text-xs text-gray-400">水量</span>
                      <span className="text-sm font-medium text-[#0A2E3C] ml-1">{txn.volume}L</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">金额</span>
                      <span className="text-sm font-medium text-[#FF6B35] ml-1">¥{txn.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-gray-100 mt-0">
                        <div className="pt-3 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Nonce</span>
                            <span className="text-[#0A2E3C] font-mono">{txn.nonce}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">开始时间</span>
                            <span className="text-[#0A2E3C]">{formatFullDate(txn.startTime)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">结束时间</span>
                            <span className="text-[#0A2E3C]">{formatFullDate(txn.endTime)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">暂无账单记录</div>
          )}
        </div>
      </div>
    </div>
  )
}
