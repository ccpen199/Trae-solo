import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { RotateCcw, Settings, Upload, ArrowLeft, CloudOff, Thermometer } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { devices } from "@/data/devices"
import { StatusBadge } from "@/components/StatusBadge"
import { apiFetch } from "@/lib/api"

const genTempData = (base: number) =>
  Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, "0")}:00`,
    temp: base > 0 ? +(base - 5 + Math.random() * 10).toFixed(1) : 0,
  }))

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const device = devices.find((d) => d.id === id)

  const [showRebootModal, setShowRebootModal] = useState(false)
  const [rebootMsg, setRebootMsg] = useState("")
  const [paramTemp, setParamTemp] = useState("")
  const [paramRate, setParamRate] = useState("")
  const [paramMsg, setParamMsg] = useState("")
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeMsg, setUpgradeMsg] = useState("")

  const tempData = useMemo(() => genTempData(device?.temperature ?? 0), [device?.temperature])

  if (!device) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
        <div className="text-center">
          <p className="mb-4 text-lg text-gray-500">设备未找到</p>
          <button onClick={() => navigate("/operator/devices")} className="text-[#FF6B35] underline">
            返回列表
          </button>
        </div>
      </div>
    )
  }

  const handleReboot = async () => {
    setShowRebootModal(false)
    setRebootMsg("重启指令提交中...")
    try {
      const response = await apiFetch(`/api/operator/devices/${device.id}/reboot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || "重启指令提交失败")
      }
      setRebootMsg(payload?.message || "重启指令已发送，设备正在重启...")
    } catch (err) {
      setRebootMsg(err instanceof Error ? err.message : "重启指令提交失败")
    }
    setTimeout(() => setRebootMsg(""), 3000)
  }

  const handleParamSubmit = async () => {
    setParamMsg("参数下发中...")
    try {
      const response = await apiFetch(`/api/operator/devices/${device.id}/params`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temperature: paramTemp, flowRate: paramRate }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || "参数下发失败")
      }
      setParamMsg(payload?.message || "参数已下发成功")
      setParamTemp("")
      setParamRate("")
    } catch (err) {
      setParamMsg(err instanceof Error ? err.message : "参数下发失败")
    }
    setTimeout(() => setParamMsg(""), 3000)
  }

  const handleUpgrade = async () => {
    setUpgradeMsg("固件升级任务创建中...")
    try {
      const response = await apiFetch(`/api/operator/devices/${device.id}/firmware`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: "v2.4.0" }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || "固件升级任务创建失败")
      }
      setUpgradeMsg(payload?.message || "固件升级任务已创建")
      setShowUpgrade(false)
    } catch (err) {
      setUpgradeMsg(err instanceof Error ? err.message : "固件升级任务创建失败")
    }
    setTimeout(() => setUpgradeMsg(""), 3000)
  }

  const infoItems = [
    { label: "设备名称", value: device.name },
    { label: "安装位置", value: device.location },
    { label: "设备状态", value: <StatusBadge status={device.status} /> },
    { label: "当前温度", value: `${device.temperature}°C` },
    { label: "固件版本", value: device.firmwareVersion },
    { label: "累计运行", value: `${device.totalRunHours}h` },
    { label: "日用水量", value: `${device.dailyWaterUsage}L` },
    { label: "能耗", value: `${device.energyConsumption}kWh` },
    { label: "故障码", value: device.faultCode ?? "—" },
  ]

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-[#0A2E3C]">
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      {device.status === "offline" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-600">
          <CloudOff className="h-4 w-4" /> 设备离线，部分操作可能无法执行（数据为缓存）
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-[#0A2E3C]">设备信息</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {infoItems.map((item) => (
              <div key={item.label} className="flex justify-between rounded-lg bg-[#F5F7FA] px-4 py-2.5">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-[#0A2E3C]">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => setShowRebootModal(true)} className="flex items-center gap-1.5 rounded-lg bg-[#0A2E3C] px-4 py-2 text-sm text-white hover:opacity-90">
              <RotateCcw className="h-4 w-4" /> 远程重启
            </button>
            <button onClick={() => setParamMsg("")} className="flex items-center gap-1.5 rounded-lg bg-[#FF6B35] px-4 py-2 text-sm text-white hover:opacity-90">
              <Settings className="h-4 w-4" /> 参数下发
            </button>
            <button onClick={() => setShowUpgrade(true)} className="flex items-center gap-1.5 rounded-lg border border-[#0A2E3C] px-4 py-2 text-sm text-[#0A2E3C] hover:bg-[#0A2E3C] hover:text-white">
              <Upload className="h-4 w-4" /> 固件升级
            </button>
          </div>

          {(rebootMsg || paramMsg || upgradeMsg) && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              {rebootMsg || paramMsg || upgradeMsg}
            </motion.div>
          )}

          <div className="mt-6 rounded-lg bg-[#F5F7FA] p-4">
            <h3 className="mb-1 text-sm font-semibold text-[#0A2E3C]">
              <Thermometer className="mr-1 inline h-4 w-4" />温度趋势（24h）
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={tempData}>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={5} />
                <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                <Tooltip />
                <Line type="monotone" dataKey="temp" stroke="#FF6B35" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-[#0A2E3C]">参数下发</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">目标温度 (°C)</label>
                <input value={paramTemp} onChange={(e) => setParamTemp(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF6B35]" />
              </div>
              <div>
                <label className="text-xs text-gray-500">出水速率 (L/min)</label>
                <input value={paramRate} onChange={(e) => setParamRate(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF6B35]" />
              </div>
              <button onClick={handleParamSubmit} className="w-full rounded-lg bg-[#FF6B35] py-2 text-sm font-medium text-white hover:opacity-90">下发参数</button>
            </div>
          </div>

          {showUpgrade && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-[#0A2E3C]">固件升级</h3>
              <p className="text-sm text-gray-500">当前版本：<span className="font-medium text-[#0A2E3C]">{device.firmwareVersion}</span></p>
              <p className="text-sm text-gray-500">可用版本：<span className="font-medium text-[#FF6B35]">v2.4.0</span></p>
              <button onClick={handleUpgrade} className="mt-4 w-full rounded-lg bg-[#0A2E3C] py-2 text-sm font-medium text-white hover:opacity-90">确认升级</button>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showRebootModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowRebootModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="w-80 rounded-xl bg-white p-6 shadow-xl">
              <h3 className="mb-2 text-lg font-bold text-[#0A2E3C]">确认重启</h3>
              <p className="mb-5 text-sm text-gray-500">确定要远程重启设备 {device.name} 吗？</p>
              <div className="flex gap-3">
                <button onClick={() => setShowRebootModal(false)} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50">取消</button>
                <button onClick={handleReboot} className="flex-1 rounded-lg bg-[#0A2E3C] py-2 text-sm font-medium text-white hover:opacity-90">确认</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
